#!/usr/bin/env python3
"""Generate the MX (music) track for each cue scene via MiniMax music-1.5.

Per scene we send a hand-tuned `prompt` describing genre, instruments, tempo,
mood, and structure. Output goes to `public/scenes/<slug>/mx.mp3`. The script
is idempotent — files already on disk are skipped unless `--force`.

Cost: ~¥1.5-3 per generation, billed to the key in ~/.minimax.env.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV_FILE = Path.home() / ".minimax.env"
ENDPOINT = "https://api.minimaxi.com/v1/music_generation"
MODEL = "music-1.5"
ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / "public" / "scenes"

# Prompt format from MiniMax docs: free-form English/Chinese describing the music
# Lyrics: "##[Instrumental]##" tells the model no vocals, pure score
PROMPTS: dict[str, dict] = {
    "jaws": {
        "prompt": (
            "Slow building orchestral suspense cue. Solo double bass plays a "
            "two-note ostinato alternating between E and F at the lowest "
            "register, very sparse at the start then accelerating. After about "
            "12 seconds a deep timpani heartbeat enters and slowly intensifies. "
            "French horn long sustained tone joins in the last third. No "
            "melody, only texture and dread. Deep stereo orchestral, "
            "cinematic, minimalist. 24 seconds."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "crouching-tiger-bamboo": {
        "prompt": (
            "Pan-Asian cinematic score for a bamboo forest standoff. Solo cello "
            "plays a slow lyrical phrase in low register, joined after a few "
            "seconds by an erhu in the higher register playing a complementary "
            "melodic line a fourth above. Sparse guzheng pluck ornaments like "
            "falling bamboo leaves. A high flute lifts the texture in the "
            "final third. Tempo 60 BPM. Romantic, longing, contemplative. "
            "Use traditional Chinese instruments with western strings. "
            "Reverberant, intimate. 22 seconds."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "psycho-shower": {
        "prompt": (
            "Bernard Herrmann style string-orchestra shocker. Opens with 4 "
            "seconds of near silence and faint shower-noise white noise. Then "
            "a series of 6 to 8 sudden violent high-violin stinger stabs, "
            "very short staccato glissando attacks in the top register, "
            "doubled an octave lower by cellos and bass. Tempo unstable, "
            "stabs accelerate. The last 4 seconds release into a slow "
            "descending high-violin line that fades to silence. Strings only, "
            "no brass, no percussion. Dry, close-miked, terrifying. 18 seconds."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "interstellar-cooper-leaves": {
        "prompt": (
            "Hans Zimmer style epic orchestral score with pipe organ as the "
            "spine. A low pipe organ pedal tone on C plays continuously through "
            "the entire cue, never moving. Above it a cello section plays a "
            "slow harmony that shifts through E, G, F, A while the pedal tone "
            "stays. After 12 seconds, high violins enter on a slowly ascending "
            "line. In the final third, french horns add long held notes. The "
            "pedal tone is the foundation, everything else moves around it. "
            "Tempo 50 BPM. Solemn, sorrowful, vast. 26 seconds."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "godfather-funeral": {
        "prompt": (
            "Nino Rota style Sicilian slow march. Steady walking bass on low "
            "strings, every 1.5 seconds, alternating D-A-D-F pattern. After 4 "
            "seconds a solo trumpet enters with the mournful Sicilian theme, "
            "long melodic phrases, ornamented with grace notes. After 14 "
            "seconds french horns respond in counterpoint. Tempo around 40 "
            "BPM, processional. Acoustic chamber orchestra, no percussion. "
            "Solemn, processional, Italian folk inflection. 24 seconds."
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
    parser.add_argument("--only", help="Comma-separated slug list to generate (default: all)")
    parser.add_argument("--force", action="store_true", help="Re-generate even if file exists")
    args = parser.parse_args()

    targets = set(args.only.split(",")) if args.only else set(PROMPTS.keys())
    key = load_key()
    total_bytes = 0
    generated = 0
    skipped = 0

    for slug, spec in PROMPTS.items():
        if slug not in targets:
            continue
        out_dir = OUT_ROOT / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / "mx.mp3"
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
        out_file.write_bytes(audio)
        size = len(audio)
        total_bytes += size
        generated += 1
        print(f"  {slug}: {size / 1024:.1f} KB -> {out_file.relative_to(ROOT)}")

    print(f"\nGenerated {generated}, skipped {skipped}. Total {total_bytes / 1024 / 1024:.1f} MB.")


if __name__ == "__main__":
    main()
