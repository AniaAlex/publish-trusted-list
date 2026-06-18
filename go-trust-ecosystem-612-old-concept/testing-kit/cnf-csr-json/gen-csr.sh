#!/usr/bin/env bash
#
# gen-csr.sh — generate an EC P-256 key + CSR from an OpenSSL .cnf file.
#
# Access certificates for the EUDI Wallet require an EC P-256 (prime256v1)
# key — the profile mandates ES256 and RSA keys are rejected at issuance.
# This tool consumes a `[ req ]`-style OpenSSL config and emits a matching
# key and CSR, then prints the decoded CSR subject for a quick sanity check.
#
# Usage:
#   ./gen-csr.sh <config.cnf> [options]
#
# Options:
#   -o, --out-dir DIR    Output directory (default: alongside the .cnf)
#   -n, --name NAME      Basename for .key/.csr (default: from the .cnf filename)
#   -k, --key FILE       Reuse an existing private key instead of generating one
#   -f, --force          Overwrite existing .key/.csr files
#   -h, --help           Show this help and exit
#
# Examples:
#   ./gen-csr.sh somelegalname_180625.cnf
#   ./gen-csr.sh entity.cnf --out-dir ./out --name relying_party --force

set -euo pipefail

PROG="$(basename "$0")"

die()  { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*" >&2; }

usage() {
  # Print the leading comment block (lines starting with #), skipping the shebang.
  sed -n '2,/^$/{/^#/s/^# \{0,1\}//p;}' "$0"
  exit "${1:-0}"
}

# ---- parse args ------------------------------------------------------------
CONFIG=""
OUT_DIR=""
NAME=""
KEY_IN=""
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--out-dir) OUT_DIR="${2:-}"; shift 2 ;;
    -n|--name)    NAME="${2:-}";    shift 2 ;;
    -k|--key)     KEY_IN="${2:-}";  shift 2 ;;
    -f|--force)   FORCE=1;          shift ;;
    -h|--help)    usage 0 ;;
    -*)           die "unknown option: $1 (try --help)" ;;
    *)
      [[ -z "$CONFIG" ]] || die "unexpected argument: $1"
      CONFIG="$1"; shift ;;
  esac
done

# ---- validate --------------------------------------------------------------
command -v openssl >/dev/null 2>&1 || die "openssl not found on PATH"
[[ -n "$CONFIG" ]] || usage 1
[[ -f "$CONFIG" ]] || die "config file not found: $CONFIG"

grep -qE '^\s*\[\s*req\s*\]' "$CONFIG" \
  || die "no [ req ] section in $CONFIG — is this an OpenSSL req config?"

# Default name/output dir derive from the config file.
config_dir="$(cd "$(dirname "$CONFIG")" && pwd)"
config_base="$(basename "$CONFIG")"
: "${NAME:=${config_base%.*}}"
: "${OUT_DIR:=$config_dir}"

mkdir -p "$OUT_DIR"
KEY_OUT="$OUT_DIR/$NAME.key"
CSR_OUT="$OUT_DIR/$NAME.csr"

if [[ -n "$KEY_IN" ]]; then
  [[ -f "$KEY_IN" ]] || die "private key not found: $KEY_IN"
fi

if [[ $FORCE -eq 0 ]]; then
  [[ -e "$CSR_OUT" ]] && die "$CSR_OUT exists (use --force to overwrite)"
  [[ -z "$KEY_IN" && -e "$KEY_OUT" ]] && die "$KEY_OUT exists (use --force to overwrite)"
fi

# ---- generate key ----------------------------------------------------------
if [[ -n "$KEY_IN" ]]; then
  KEY_OUT="$KEY_IN"
  info "Using existing key: $KEY_OUT"
else
  info "Generating EC P-256 (prime256v1) private key: $KEY_OUT"
  ( umask 077; openssl ecparam -name prime256v1 -genkey -noout -out "$KEY_OUT" )
fi

# ---- generate CSR ----------------------------------------------------------
info "Generating CSR from $config_base: $CSR_OUT"
openssl req -new -key "$KEY_OUT" -config "$CONFIG" -out "$CSR_OUT"

# ---- report ----------------------------------------------------------------
info ""
info "Done. CSR subject:"
subject="$(openssl req -in "$CSR_OUT" -noout -subject -nameopt sep_multiline,utf8 2>/dev/null)"
printf '%s\n' "$subject" >&2

# Verify the public key is the expected P-256 curve.
if openssl req -in "$CSR_OUT" -noout -text 2>/dev/null | grep -q 'prime256v1'; then
  info ""
  info "Key check: prime256v1 (P-256) ✓"
else
  info ""
  info "warning: CSR public key does not look like prime256v1"
fi

printf '%s\n' "$CSR_OUT"
