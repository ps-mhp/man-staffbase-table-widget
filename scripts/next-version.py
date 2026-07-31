#!/usr/bin/env python3
"""Computes the next release tag from the latest one.

Kept separate from `release.sh` because version arithmetic in shell is where
release scripts quietly go wrong, and because this part is the one worth being
able to check on its own:

    scripts/next-version.py rc 1.4.0-rc.8   -> 1.4.0-rc.9

Conventions follow the tags this repository already carries: release candidates
are `X.Y.Z-rc.N`, finals are `X.Y.Z`. Malformed historic tags (`1.2.0-rc1`,
`1.4.0-rc.5.1`) are read as best they can be rather than rejected.
"""

from __future__ import annotations

import re
import sys

BUMPS = ("rc", "final", "patch", "minor", "major")

# Tolerant on purpose — see the historic tags mentioned above.
TAG = re.compile(
    r"^v?(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)"
    r"(?:-rc\.?(?P<rc>\d+(?:\.\d+)*))?$"
)


def parse(tag: str) -> tuple[int, int, int, int | None]:
    match = TAG.match(tag.strip())
    if match is None:
        raise SystemExit(f"cannot parse version tag: {tag!r}")
    rc = match.group("rc")
    # `rc.5.1` counts as the 5th candidate; the suffix was a one-off re-cut.
    return (
        int(match.group("major")),
        int(match.group("minor")),
        int(match.group("patch")),
        int(rc.split(".")[0]) if rc else None,
    )


def next_version(bump: str, latest: str) -> str:
    major, minor, patch, rc = parse(latest)

    if bump == "final":
        # Promote the candidate line that is already open, or re-cut the final.
        return f"{major}.{minor}.{patch}"

    if bump == "rc":
        if rc is not None:
            return f"{major}.{minor}.{patch}-rc.{rc + 1}"
        # Latest was a final release, so a candidate opens the next minor.
        return f"{major}.{minor + 1}.0-rc.1"

    # Only `rc` continues an open candidate line. The explicit bumps always move
    # to a fresh one, so they can never land on a tag that already exists.
    if bump == "patch":
        base = (major, minor, patch + 1)
    elif bump == "minor":
        base = (major, minor + 1, 0)
    else:
        base = (major + 1, 0, 0)

    return f"{base[0]}.{base[1]}.{base[2]}-rc.1"


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in BUMPS:
        raise SystemExit(f"usage: next-version.py [{'|'.join(BUMPS)}] <latest-tag>")
    print(next_version(sys.argv[1], sys.argv[2]))


if __name__ == "__main__":
    main()
