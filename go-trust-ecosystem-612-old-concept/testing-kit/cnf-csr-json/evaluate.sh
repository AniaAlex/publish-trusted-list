#!/usr/bin/env bash
#
# evaluate.sh — POST any JSON file to the trust evaluation endpoint.
#
# Equivalent to:
#   curl -sS -X POST -H "Content-Type: application/json" \
#     --data-binary @<file.json> \
#     https://trust-dev-1.iam.sunet.se/siros-trust/evaluation
#
# Usage:
#   ./evaluate.sh <file.json> [options]
#
# Options:
#   -u, --url URL    Evaluation endpoint (default: the siros-trust URL above)
#   -r, --raw        Print the raw response (do not pretty-print with jq)
#   -h, --help       Show this help and exit
#
# Examples:
#   ./evaluate.sh access_cert_sometradename_20260618_001.json
#   ./evaluate.sh entry.json --url https://other.host/trust/evaluation

set -euo pipefail

URL="https://trust-dev-1.iam.sunet.se/siros-trust/evaluation"
RAW=0
FILE=""

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,/^$/{/^#/s/^# \{0,1\}//p;}' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--url) URL="${2:-}"; shift 2 ;;
    -r|--raw) RAW=1; shift ;;
    -h|--help) usage 0 ;;
    -*) die "unknown option: $1 (try --help)" ;;
    *) [[ -z "$FILE" ]] || die "unexpected argument: $1"; FILE="$1"; shift ;;
  esac
done

command -v curl >/dev/null 2>&1 || die "curl not found on PATH"
[[ -n "$FILE" ]] || usage 1
[[ -f "$FILE" ]] || die "file not found: $FILE"

# Validate it is JSON before sending, when jq is available.
if command -v jq >/dev/null 2>&1; then
  jq empty "$FILE" 2>/dev/null || die "$FILE is not valid JSON"
fi

printf 'POST %s\n  <- %s\n\n' "$URL" "$FILE" >&2

# Capture body + HTTP status; -w appends the status on its own line.
resp="$(curl -sS -w $'\n%{http_code}' -X POST \
  -H "Content-Type: application/json" \
  --data-binary @"$FILE" \
  "$URL")"

status="${resp##*$'\n'}"
body="${resp%$'\n'*}"

printf 'HTTP %s\n' "$status" >&2

if [[ $RAW -eq 0 ]] && command -v jq >/dev/null 2>&1 && printf '%s' "$body" | jq empty 2>/dev/null; then
  printf '%s' "$body" | jq .
else
  printf '%s\n' "$body"
fi

# Exit non-zero on non-2xx so the script is scriptable in pipelines.
[[ "$status" =~ ^2[0-9][0-9]$ ]] || exit 22
