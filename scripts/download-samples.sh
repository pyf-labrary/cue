#!/usr/bin/env bash
# Download the exact sample set referenced by src/lib/synth.ts into
# public/samples/. Vite serves /public verbatim so URLs become /samples/...
#
# Curl with -C - for resume; -fS to fail loud on HTTP errors.

set -euo pipefail

BASE="https://nbrosowsky.github.io/tonejs-instruments/samples"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/public/samples"

declare -A SETS=(
  [cello]="C2 C3 C4 A2 A3 E3"
  [violin]="A3 A4 A5 C5 E5 G4"
  [contrabass]="C2 D2 E2 A2 E3"
  [flute]="A4 C5 E5 A5 C6"
  [clarinet]="As3 D4 F4 D5 F5"
  [french-horn]="C2 D3 F3 A3 C4"
  [trumpet]="C4 Ds4 F4 G4 D5 F5 A5"
  [piano]="C2 C3 C4 F4 A4 C5"
  [xylophone]="G4 C5 G5 C6 G6 C7"
  [organ]="C2 A2 C3 A3 C4 A4 C5"
  [harp]="C3 E3 B3 D4 F4 A4 C5"
  [guitar-nylon]="A3 E4 A4"
  [bassoon]="C3 G3 A3 C4 E4 G4 C5"
  [harmonium]="C3 G3 C4 G4 C5"
)

mkdir -p "${OUT}"

total=0; ok=0; skipped=0; failed=0
for folder in "${!SETS[@]}"; do
  mkdir -p "${OUT}/${folder}"
  for note in ${SETS[$folder]}; do
    total=$((total + 1))
    dest="${OUT}/${folder}/${note}.mp3"
    if [ -s "${dest}" ]; then
      skipped=$((skipped + 1))
      continue
    fi
    url="${BASE}/${folder}/${note}.mp3"
    if curl -fsS -o "${dest}" "${url}"; then
      ok=$((ok + 1))
      printf "  %-14s %-4s -> %s\n" "${folder}" "${note}" "$(du -h "${dest}" | cut -f1)"
    else
      failed=$((failed + 1))
      rm -f "${dest}"
      echo "  FAILED ${folder}/${note}.mp3" >&2
    fi
  done
done

echo
echo "downloaded ${ok}, skipped ${skipped}, failed ${failed} of ${total}"
echo "size: $(du -sh "${OUT}" | cut -f1) in ${OUT}"
