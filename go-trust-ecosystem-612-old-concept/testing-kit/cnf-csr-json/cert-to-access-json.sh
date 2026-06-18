#!/usr/bin/env bash
#
# cert-to-access-json.sh — wrap an access certificate into an
# access_cert_{trade_name}_{date}_{seq}.json trust entry.
#
# Takes any X.509 certificate (PEM or DER, file or stdin), encodes it as
# single-line base64 DER (x5c), and emits the subject/resource/action/context
# trust-entry JSON used by the registry.
#
# Usage:
#   ./cert-to-access-json.sh <cert.pem|cert.der|-> [options]
#
# Options:
#   -i, --id ID          Value for subject.id / resource.id (default: the
#                        trust-registry host from the cert CA endpoint URLs,
#                        as https://<host>; falls back to SAN URI, then CN)
#   -t, --trade-name N   Trade name used in the filename
#                        (default: the certificate subject CN)
#   -o, --out-dir DIR    Output directory (default: current directory)
#   -a, --action NAME    action.name value (default: trust)
#   -d, --date YYYYMMDD  Date in the filename (default: today)
#   -f, --force          Overwrite if the target file already exists
#   -h, --help           Show this help and exit
#
# Examples:
#   ./cert-to-access-json.sh access.pem --id https://trust-dev-1.iam.sunet.se
#   openssl x509 -in c.der -inform DER | ./cert-to-access-json.sh - -o ./out

set -euo pipefail

die()  { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*" >&2; }

usage() {
  sed -n '2,/^$/{/^#/s/^# \{0,1\}//p;}' "$0"
  exit "${1:-0}"
}

# ---- parse args ------------------------------------------------------------
CERT=""
ID=""
TRADE_NAME=""
OUT_DIR="."
ACTION="trust"
DATE=""
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--id)         ID="${2:-}";         shift 2 ;;
    -t|--trade-name) TRADE_NAME="${2:-}"; shift 2 ;;
    -o|--out-dir) OUT_DIR="${2:-}"; shift 2 ;;
    -a|--action)  ACTION="${2:-}";  shift 2 ;;
    -d|--date)    DATE="${2:-}";    shift 2 ;;
    -f|--force)   FORCE=1;          shift ;;
    -h|--help)    usage 0 ;;
    -)            [[ -z "$CERT" ]] || die "unexpected argument: $1"; CERT="-"; shift ;;
    -*)           die "unknown option: $1 (try --help)" ;;
    *)            [[ -z "$CERT" ]] || die "unexpected argument: $1"; CERT="$1"; shift ;;
  esac
done

command -v openssl >/dev/null 2>&1 || die "openssl not found on PATH"
command -v jq      >/dev/null 2>&1 || die "jq not found on PATH"
[[ -n "$CERT" ]] || usage 1

# ---- load the certificate (PEM or DER, file or stdin) ----------------------
raw="$(mktemp)"; pem="$(mktemp)"
trap 'rm -f "$raw" "$pem"' EXIT

if [[ "$CERT" == "-" ]]; then
  cat > "$raw"
else
  [[ -f "$CERT" ]] || die "certificate not found: $CERT"
  cat "$CERT" > "$raw"
fi

if openssl x509 -in "$raw" -inform PEM -out "$pem" -outform PEM 2>/dev/null; then
  :
elif openssl x509 -in "$raw" -inform DER -out "$pem" -outform PEM 2>/dev/null; then
  :
else
  die "input is not a valid PEM or DER X.509 certificate"
fi

# ---- single-line base64 DER (x5c) ------------------------------------------
x5c="$(openssl x509 -in "$pem" -outform DER | openssl base64 -A)"

# ---- resolve the id --------------------------------------------------------
# Default: the trust-registry host that issued the cert, taken from the CA
# endpoint URLs (CRL / OCSP / CA Issuers) as scheme+host -> https://<host>.
if [[ -z "$ID" ]]; then
  ca_host="$(openssl x509 -in "$pem" -noout \
              -ext crlDistributionPoints,authorityInfoAccess 2>/dev/null \
            | grep -oE 'https?://[^/[:space:]]+' | head -n1 \
            | sed -E 's#^https?://##')" || true
  [[ -n "$ca_host" ]] && ID="https://$ca_host"
fi
if [[ -z "$ID" ]]; then
  # Fall back to the first SAN URI.
  ID="$(openssl x509 -in "$pem" -noout -ext subjectAltName 2>/dev/null \
        | grep -oE 'URI:[^,]+' | head -n1 | sed 's/^URI://')" || true
fi
if [[ -z "$ID" ]]; then
  # Last resort: the subject CN.
  ID="$(openssl x509 -in "$pem" -noout -subject -nameopt sep_comma_plus,utf8 2>/dev/null \
        | grep -oE 'CN=[^,]+' | head -n1 | sed 's/^CN=//')" || true
fi
[[ -n "$ID" ]] || die "could not determine id; pass --id"

# ---- trade name (filename) -------------------------------------------------
if [[ -z "$TRADE_NAME" ]]; then
  TRADE_NAME="$(openssl x509 -in "$pem" -noout -subject -nameopt sep_comma_plus,utf8 2>/dev/null \
        | grep -oE 'CN=[^,]+' | head -n1 | sed 's/^CN=//')" || true
fi
[[ -n "$TRADE_NAME" ]] || die "could not determine trade name (no CN); pass --trade-name"
# Slugify: lowercase, non-alphanumerics -> underscore, trim repeats/edges.
slug="$(printf '%s' "$TRADE_NAME" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//')"
[[ -n "$slug" ]] || die "trade name slug is empty after sanitising: '$TRADE_NAME'"

# ---- output filename: access_cert_{trade_name}_{date}_{seq}.json -----------
: "${DATE:=$(date +%Y%m%d)}"
mkdir -p "$OUT_DIR"

seq=1
while :; do
  printf -v seqp '%03d' "$seq"
  OUT="$OUT_DIR/access_cert_${slug}_${DATE}_${seqp}.json"
  if [[ -e "$OUT" && $FORCE -eq 0 ]]; then
    seq=$((seq + 1)); continue
  fi
  break
done

# ---- build the trust entry -------------------------------------------------
jq -n \
  --arg id "$ID" \
  --arg x5c "$x5c" \
  --arg action "$ACTION" \
  '{
    subject: {
      type: "key",
      id: $id,
      properties: { x5c: [ $x5c ] }
    },
    resource: {
      key: [ $x5c ],
      type: "x5c",
      id: $id,
      properties: {}
    },
    action: { name: $action, properties: {} },
    context: {}
  }' > "$OUT"

info "id:     $ID"
info "wrote:  $OUT"
printf '%s\n' "$OUT"
