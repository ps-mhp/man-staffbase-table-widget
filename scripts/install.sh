#!/usr/bin/env bash
#
# Installs a released bundle into a Staffbase environment: looks up the
# currently registered widget, removes it and registers the jsDelivr URL of the
# given version in its place.
#
# Usage:
#   scripts/install.sh                       # latest release, widgets from .env
#   scripts/install.sh 1.4.0-rc.12           # a specific version
#   scripts/install.sh -w search-bar-widget  # override the .env selection
#   scripts/install.sh --dry-run             # print every request, change nothing
#   scripts/install.sh --yes                 # skip the confirmation prompt
#
# Configuration (.env next to this repo, gitignored):
#   STAFFBASE_API_URL=https://app.staffbase.com
#   STAFFBASE_API_TOKEN=<the API token, sent as `Authorization: Basic ...`>
#   STAFFBASE_WIDGETS=table-widget           # space/comma separated defaults
#
# Replacing a widget is disruptive for every page using it, so the script shows
# the exact plan and asks before touching anything unless --yes is given.

set -euo pipefail

cd "$(dirname "$0")/.."

step()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
info()  { printf '    %s\n' "$1"; }
warn()  { printf '\033[1;33m    %s\033[0m\n' "$1"; }
fail()  { printf '\n\033[1;31mabort:\033[0m %s\n' "$1" >&2; exit 1; }

# --- Widget catalog --------------------------------------------------------
#
# The custom element and the attributes Staffbase has to whitelist for it.
# These mirror the `externalBlockDefinition`s in src/index.tsx and
# src/search-bar-index.tsx — keep them in sync when a widget gains an
# attribute, otherwise the new attribute is stripped before it reaches the
# element.

widget_bundle() {
  case "$1" in
    table-widget)      echo "dist/man.table-widget.js" ;;
    search-bar-widget) echo "dist/man.search-bar-widget.js" ;;
    *) return 1 ;;
  esac
}

widget_attributes() {
  case "$1" in
    table-widget)      echo "tabledata" ;;
    search-bar-widget) echo "placeholder" ;;
    *) return 1 ;;
  esac
}

KNOWN_WIDGETS="table-widget search-bar-widget"

# --- Arguments -------------------------------------------------------------

VERSION=""
DRY_RUN=0
ASSUME_YES=0
WIDGETS_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) DRY_RUN=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    -w|--widget|--widgets) WIDGETS_ARG="${WIDGETS_ARG} ${2:-}"; shift 2 ;;
    -h|--help) sed -n '3,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) fail "unknown argument: $1" ;;
    *) [[ -z "$VERSION" ]] || fail "version given twice: $VERSION and $1"; VERSION="$1"; shift ;;
  esac
done

command -v curl >/dev/null || fail "curl not installed"
command -v jq   >/dev/null || fail "jq not installed — brew install jq"

# --- Configuration ---------------------------------------------------------

step "Configuration"

if [[ -f .env ]]; then
  # Values already present in the environment win, so a one-off
  # `STAFFBASE_API_URL=… scripts/install.sh` can point at another instance
  # without editing the file.
  ENV_URL="${STAFFBASE_API_URL:-}"
  ENV_TOKEN="${STAFFBASE_API_TOKEN:-}"
  ENV_WIDGETS="${STAFFBASE_WIDGETS:-}"
  # `set -a` exports everything the file defines; the subshell-free `source`
  # keeps it simple, so .env must contain plain KEY=value assignments.
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  [[ -n "$ENV_URL"     ]] && STAFFBASE_API_URL="$ENV_URL"
  [[ -n "$ENV_TOKEN"   ]] && STAFFBASE_API_TOKEN="$ENV_TOKEN"
  [[ -n "$ENV_WIDGETS" ]] && STAFFBASE_WIDGETS="$ENV_WIDGETS"
  info "loaded .env"
else
  warn "no .env found — copy .env.example to .env"
fi

API_URL="${STAFFBASE_API_URL:-}"
API_TOKEN="${STAFFBASE_API_TOKEN:-}"
[[ -n "$API_URL"   ]] || fail "STAFFBASE_API_URL is not set (e.g. https://app.staffbase.com)"
[[ -n "$API_TOKEN" ]] || fail "STAFFBASE_API_TOKEN is not set"
API_URL="${API_URL%/}"

# Commas are allowed in .env for readability; word splitting does the rest.
SELECTED="${WIDGETS_ARG:-${STAFFBASE_WIDGETS:-table-widget}}"
SELECTED="${SELECTED//,/ }"
[[ -n "${SELECTED// /}" ]] || fail "no widget selected — set STAFFBASE_WIDGETS or pass -w"
read -r -a WIDGETS <<<"$SELECTED"

for widget in "${WIDGETS[@]}"; do
  widget_bundle "$widget" >/dev/null \
    || fail "unknown widget '$widget' — known: $KNOWN_WIDGETS"
done

REPO="$(git config --get remote.origin.url \
  | sed -E 's#^.*github\.com[:/]##; s#\.git$##')"
[[ -n "$REPO" ]] || fail "could not determine the GitHub repository from remote.origin.url"

if [[ -z "$VERSION" ]]; then
  command -v gh >/dev/null || fail "gh CLI not installed — pass a version explicitly"
  VERSION="$(gh release list -L 1 --json tagName -q '.[0].tagName' 2>/dev/null || true)"
  [[ -n "$VERSION" ]] || fail "no release found — pass a version explicitly"
fi

info "api:     $API_URL"
info "repo:    $REPO"
info "version: $VERSION"
info "widgets: ${WIDGETS[*]}"

# --- API helpers -----------------------------------------------------------

# Performs a request and returns `<body>\n<status>`; the caller splits it. The
# token never reaches the process list because it is passed via a header file
# on stdin (`-H @-` is not portable, so an env-expanded header is used and the
# script keeps `set -x` off).
api() {
  local method="$1" path="$2" payload="${3:-}"
  local args=(-sS -X "$method" -o - -w '\n%{http_code}'
              -H "Authorization: Basic ${API_TOKEN}"
              -H "Accept: application/json")
  [[ -n "$payload" ]] && args+=(-H "Content-Type: application/json" -d "$payload")
  curl "${args[@]}" "${API_URL}${path}"
}

# Splits the `api` output into the globals RESPONSE_BODY / RESPONSE_STATUS.
call_api() {
  local raw
  raw="$(api "$@")" || fail "request failed: $1 $2"
  RESPONSE_STATUS="${raw##*$'\n'}"
  RESPONSE_BODY="${raw%$'\n'*}"
}

ok_status() { [[ "$1" =~ ^2[0-9][0-9]$ ]]; }

# Fills the global array MATCHES with the lines the given jq filter produces.
# A plain `mapfile` would be nicer, but macOS still ships bash 3.2.
collect() {
  MATCHES=()
  local line
  while IFS= read -r line; do
    [[ -n "$line" ]] && MATCHES+=("$line")
  done < <(jq -r "$1" --arg el "$2" <<<"$INSTALLED")
}

# --- Fetch the installed widgets -------------------------------------------

step "Fetching installed widgets"

call_api GET "/api/widgets"
ok_status "$RESPONSE_STATUS" \
  || fail "GET /api/widgets returned HTTP $RESPONSE_STATUS
$RESPONSE_BODY"

INSTALLED="$RESPONSE_BODY"
jq -e '.data' >/dev/null 2>&1 <<<"$INSTALLED" \
  || fail "unexpected response from GET /api/widgets:
$INSTALLED"

info "$(jq -r '.data | length' <<<"$INSTALLED") widget(s) registered"

# --- Plan ------------------------------------------------------------------

step "Plan"

for widget in "${WIDGETS[@]}"; do
  bundle="$(widget_bundle "$widget")"
  url="https://cdn.jsdelivr.net/gh/${REPO}@${VERSION}/${bundle}"
  info "$widget"
  # Every registration that claims our element has to go: leaving a second one
  # behind means the page loads two bundles defining the same custom element,
  # and the later `customElements.define` throws.
  collect '.data[] | select(.elements // [] | index($el)) | "\(.id)\t\(.url)"' "$widget"
  if [[ ${#MATCHES[@]} -eq 0 ]]; then
    info "      remove: (nothing registered)"
  else
    for entry in "${MATCHES[@]}"; do
      info "      remove: ${entry%%$'\t'*}  ${entry#*$'\t'}"
    done
  fi
  info "      install: $url"
done

if [[ $DRY_RUN == 1 ]]; then
  printf '\n\033[1;33m(dry run — nothing was changed)\033[0m\n\n'
  exit 0
fi

if [[ $ASSUME_YES == 0 ]]; then
  printf '\n'
  read -r -p "Apply this plan? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || fail "cancelled"
fi

# --- Apply -----------------------------------------------------------------

for widget in "${WIDGETS[@]}"; do
  bundle="$(widget_bundle "$widget")"
  url="https://cdn.jsdelivr.net/gh/${REPO}@${VERSION}/${bundle}"
  attributes="$(widget_attributes "$widget")"

  step "Installing $widget"

  collect '.data[] | select(.elements // [] | index($el)) | .id' "$widget"

  for id in ${MATCHES[@]+"${MATCHES[@]}"}; do
    # The registration lives under the branch collection it was created in;
    # older environments only answer on the unprefixed path, so both are tried
    # before giving up.
    call_api DELETE "/api/branch/widgets/${id}"
    if ! ok_status "$RESPONSE_STATUS"; then
      call_api DELETE "/api/widgets/${id}"
    fi
    ok_status "$RESPONSE_STATUS" \
      || fail "deleting widget $id returned HTTP $RESPONSE_STATUS
$RESPONSE_BODY"
    info "removed $id"
  done

  payload="$(jq -nc --arg url "$url" --arg el "$widget" --arg attrs "$attributes" \
    '{url: $url, elements: [$el], attributes: ($attrs | split(" "))}')"

  call_api POST "/api/branch/widgets" "$payload"
  ok_status "$RESPONSE_STATUS" \
    || fail "POST /api/branch/widgets returned HTTP $RESPONSE_STATUS
$RESPONSE_BODY"

  info "installed $(jq -r '.id // "?"' <<<"$RESPONSE_BODY")"
  info "$url"
done

printf '\n\033[1;32mInstalled %s (%s)\033[0m\n\n' "$VERSION" "${WIDGETS[*]}"
