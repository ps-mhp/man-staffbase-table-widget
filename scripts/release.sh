#!/usr/bin/env bash
#
# Builds, commits, pushes and publishes a GitHub release, then prints the
# jsDelivr URL to paste into Staffbase.
#
# Usage:
#   scripts/release.sh                       # next release candidate
#   scripts/release.sh rc                    # same, explicit
#   scripts/release.sh final                 # promote the open candidate line
#   scripts/release.sh minor -m "message"    # open a candidate on the next minor
#   scripts/release.sh rc --dry-run          # print every step, change nothing
#
# Bumps: rc (default), final, patch, minor, major.
#
# Publishing is irreversible from the CDN's point of view — jsDelivr caches a
# tag permanently — so the script refuses to overwrite an existing tag and
# offers --dry-run to inspect the plan first.

set -euo pipefail

cd "$(dirname "$0")/.."

BUMP="rc"
DRY_RUN=0
MESSAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    rc|final|patch|minor|major) BUMP="$1"; shift ;;
    --dry-run|-n) DRY_RUN=1; shift ;;
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '3,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

step()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
info()  { printf '    %s\n' "$1"; }
fail()  { printf '\n\033[1;31mabort:\033[0m %s\n' "$1" >&2; exit 1; }
run()   { if [[ $DRY_RUN == 1 ]]; then info "would run: $*"; else "$@"; fi; }

# --- Preflight -------------------------------------------------------------

step "Preflight"

command -v gh >/dev/null || fail "gh CLI not installed"
gh auth status >/dev/null 2>&1 || fail "gh not authenticated — run: gh auth login"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
info "repo:   $REPO"
info "branch: $BRANCH"

LATEST_TAG="$(gh release list -L 1 --json tagName -q '.[0].tagName' 2>/dev/null || true)"
[[ -n "$LATEST_TAG" ]] || fail "no existing release found to count from"

VERSION="$(scripts/next-version.py "$BUMP" "$LATEST_TAG")"
info "latest: $LATEST_TAG"
info "next:   $VERSION ($BUMP)"

git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null \
  && fail "tag $VERSION already exists locally"
gh release view "$VERSION" >/dev/null 2>&1 \
  && fail "release $VERSION already published"

# --- Verify ----------------------------------------------------------------

step "Type-check, tests, lint"
run npm run type-check
run npm test -- --silent
# Lint carries one known pre-existing error (src/public-path.ts), so a failure
# here is reported but does not block the release.
if [[ $DRY_RUN == 0 ]]; then
  npm run lint || info "lint reported issues (see above) — continuing"
else
  info "would run: npm run lint"
fi

# --- Build -----------------------------------------------------------------

step "Build"
run npm run build
[[ $DRY_RUN == 1 || -s dist/man.table-widget.js ]] || fail "dist/man.table-widget.js missing or empty"

# --- Commit ----------------------------------------------------------------

step "Commit"

# The version in package.json is what the widget reports to Staffbase, so it has
# to match the tag rather than trail behind it.
if [[ $DRY_RUN == 0 ]]; then
  npm version "$VERSION" --no-git-tag-version --allow-same-version >/dev/null
  info "package.json version -> $VERSION"
else
  info "would set package.json version -> $VERSION"
fi

# Everything goes in, including untracked files: a release whose tag is missing a
# new source file ships a bundle nobody can rebuild. `-A` covers additions,
# modifications and deletions; .gitignore keeps the noise out.
CHANGES="$(git status --porcelain)"

if [[ -n "$CHANGES" ]]; then
  info "committing $(printf '%s\n' "$CHANGES" | wc -l | tr -d ' ') change(s):"
  printf '%s\n' "$CHANGES" | sed 's/^/      /'

  COMMIT_MESSAGE="${MESSAGE:-chore(release): $VERSION}"
  run git add -A
  run git commit -m "$COMMIT_MESSAGE"
  info "message: $COMMIT_MESSAGE"

  # Anything still showing up here was never staged, so the tag would not carry
  # it. Better to stop than to publish an incomplete release.
  if [[ $DRY_RUN == 0 ]]; then
    LEFTOVER="$(git status --porcelain)"
    [[ -z "$LEFTOVER" ]] || fail "working tree still dirty after commit:
$LEFTOVER"
  fi
else
  info "nothing to commit — releasing the current HEAD"
fi

# --- Push ------------------------------------------------------------------

step "Push"
if git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
  run git push
else
  run git push -u origin "$BRANCH"
fi

# --- Release ---------------------------------------------------------------

step "Release"
PRERELEASE_FLAG=()
[[ "$VERSION" == *-rc.* ]] && PRERELEASE_FLAG=(--prerelease)

run gh release create "$VERSION" \
  --title "$VERSION" \
  --target "$BRANCH" \
  --generate-notes \
  "${PRERELEASE_FLAG[@]}"

# --- Output ----------------------------------------------------------------

CDN_URL="https://cdn.jsdelivr.net/gh/${REPO}@${VERSION}/dist/man.table-widget.js"

printf '\n\033[1;32mReleased %s\033[0m\n\n' "$VERSION"
printf '%s\n\n' "$CDN_URL"

if [[ $DRY_RUN == 1 ]]; then
  printf '\033[1;33m(dry run — nothing was changed)\033[0m\n\n'
fi
