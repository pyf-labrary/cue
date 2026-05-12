#!/usr/bin/env bash
# Sync local assets-cdn/ to ftp.ssbx.site under /cue/.
#
# Usage:
#   FTP_SSH=user@ftp.ssbx.site ./scripts/upload-samples.sh
#
# Layout under assets-cdn/:
#   samples/<inst>/phrase-NN.mp3
#   scenes/<slug>/{video.mp4, dx.mp3, mx.mp3, fx.mp3, nx.mp3}
#   phrases/<emotion>/loop-NN.mp3

set -euo pipefail

: "${FTP_SSH:?set FTP_SSH=user@host first}"
: "${FTP_PATH:=/var/www/ftp/cue/}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/assets-cdn/"

if [ ! -d "${SRC}" ]; then
  echo "no assets-cdn/ yet; create it and drop samples in." >&2
  exit 0
fi

echo "rsync ${SRC} -> ${FTP_SSH}:${FTP_PATH}"
rsync -avz --progress --human-readable \
  --exclude '.DS_Store' --exclude '*.tmp' \
  "${SRC}" "${FTP_SSH}:${FTP_PATH}"
