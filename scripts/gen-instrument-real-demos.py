#!/usr/bin/env python3
"""Generate ~8s solo demo recordings for the 4 instruments whose Tone.Sampler
maps are GM surrogates (erhu / guzheng / guqin / choir) via MiniMax music-1.5.

Output: `public/samples/<inst>-real.mp3`. Idempotent — skip if file present
unless --force. Wired into Instrument.tsx as a "听一段真录音" button so
users can A/B against the sampler.

Cost: ~¥1.5-3 per generation, billed to ~/.minimax.env.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV_FILE = Path.home() / ".minimax.env"
ENDPOINT = "https://api.minimaxi.com/v1/music_generation"
MODEL = "music-1.5"
ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / "public" / "samples"

PROMPTS: dict[str, dict] = {
    "erhu": {
        "prompt": (
            "Solo erhu performance, 8 seconds. A lyrical, slightly mournful "
            "melodic phrase in the upper register. Authentic erhu timbre: "
            "nasal, expressive bowing with characteristic slides and vibrato. "
            "No accompaniment, no other instruments, just the solo erhu. "
            "Reverberant studio recording, intimate, dry close mic blended "
            "with hall reverb. Tempo around 60 BPM."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "guzheng": {
        "prompt": (
            "Solo guzheng performance, 8 seconds. A flowing pentatonic phrase "
            "with characteristic glissando ornamentation, both ascending and "
            "descending plucks. Bright, resonant plucked-string timbre with "
            "deep bass and shimmering treble. No accompaniment, just the solo "
            "guzheng. Hall-reverb close mic, intimate concert recording."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "guqin": {
        "prompt": (
            "Solo guqin performance, 8 seconds. Sparse, meditative, with long "
            "silences between notes. Characteristic deep low-register plucked "
            "strings with the breath-like sliding harmonics that define "
            "guqin music. Very low tempo, around 40 BPM. No accompaniment, "
            "no other instruments. Dry close-miked, traditional Chinese "
            "scholar-music aesthetic."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "choir": {
        "prompt": (
            "Solo a cappella mixed choir, 8 seconds. Slow sustained chord "
            "progression on 'ah' vowel, soprano - alto - tenor - bass in "
            "rich four-part harmony. Solemn, hymn-like. Cathedral reverb, "
            "no instruments, no soloists, no words. Tempo around 50 BPM."
        ),
        "lyrics": "##[Instrumental]##",
    },
}


def load_key() -> str:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith("MINIMAX_API_KEY="):
                return line.split("=", 1)[1].strip()
    key = os.environ.get("MINIMAX_API_KEY", "")
    if not key:
        sys.exit("ERROR: MINIMAX_API_KEY not found")
    return key


def call(prompt: str, lyrics: str, key: str) -> bytes:
    payload = {"model": MODEL, "prompt": prompt, "lyrics": lyrics}
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    base = body.get("base_resp", {})
    if base.get("status_code") not in (0, None):
        raise SystemExit(f"API error: {base.get('status_code')} {base.get('status_msg')}")
    audio_hex = (body.get("data") or {}).get("audio")
    if not audio_hex:
        raise SystemExit(f"no audio in response: {json.dumps(body)[:500]}")
    return bytes.fromhex(audio_hex)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Comma-separated instrument ids")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    targets = set(args.only.split(",")) if args.only else set(PROMPTS.keys())
    key = load_key()
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    generated = 0
    skipped = 0
    total = 0

    for slug, spec in PROMPTS.items():
        if slug not in targets:
            continue
        out_file = OUT_ROOT / f"{slug}-real.mp3"
        if out_file.exists() and not args.force:
            print(f"  {slug}: SKIP (exists, {out_file.stat().st_size // 1024} KB)")
            skipped += 1
            continue
        print(f"  {slug}: generating...", flush=True)
        try:
            audio = call(spec["prompt"], spec["lyrics"], key)
        except urllib.error.HTTPError as e:
            print(f"  {slug}: HTTP {e.code} — {e.read()[:200].decode('utf-8', errors='replace')}")
            continue
        raw_file = out_file.with_suffix(".raw.mp3")
        raw_file.write_bytes(audio)
        # MiniMax ignores duration hints and returns 30-60s pieces; trim to 12s
        # with a 0.6s fade-out so the preview is a focused musical moment.
        try:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", str(raw_file),
                    "-t", "12",
                    "-af", "afade=t=out:st=11.4:d=0.6",
                    "-codec:a", "libmp3lame", "-q:a", "4",
                    str(out_file),
                ],
                check=True,
            )
            raw_file.unlink(missing_ok=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"  {slug}: ffmpeg trim failed, keeping raw {raw_file.stat().st_size // 1024} KB")
            raw_file.rename(out_file)
        size = out_file.stat().st_size
        total += size
        generated += 1
        print(f"  {slug}: {size / 1024:.1f} KB -> {out_file.relative_to(ROOT)}")

    print(f"\nGenerated {generated}, skipped {skipped}. Total {total / 1024 / 1024:.1f} MB.")


if __name__ == "__main__":
    main()
