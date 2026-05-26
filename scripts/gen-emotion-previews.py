#!/usr/bin/env python3
"""Generate the 15s instrumental preview for each home-page emotion slice via
MiniMax music-2.6 — the clip played by the "听一下" button.

Output: `public/emotions/<id>.mp3` (15s, 0.3s fade in/out, 192k stereo, matching
the PR#6 batch). Idempotent — skip if the file is present unless --force.

Prompts are derived from each emotion's blurb / directorNote / signature
instruments in src/data/emotions.ts. The original 12-clip batch (PR#6) predates
this committed generator; solemn / tension / epic were re-tuned for issue #7 so
the lead instruments are clearly identifiable (the others are kept untouched —
run with --only / --force to regenerate just the ones you mean to).

Cost: ~¥1.5-3 per generation. Prefers the prepaid plan key.
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

# Prefer the prepaid plan key (saves pay-as-you-go quota); fall back to the
# pay-as-you-go key. Each entry: (file, var-name).
KEY_SOURCES = [
    (Path.home() / "bin" / ".minimax-plan.env", "MINIMAX_PLAN_API_KEY"),
    (Path.home() / "bin" / ".minimax.env", "MINIMAX_API_KEY"),
]
ENDPOINT = "https://api.minimaxi.com/v1/music_generation"
MODEL = "music-2.6"
ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / "public" / "emotions"

INSTRUMENTAL = "##[Instrumental]##"

PROMPTS: dict[str, dict] = {
    # ----- re-tuned for issue #7 (lead instruments must be unmistakable) -----
    # 庄严 — french-horn + timpani + pipe-organ. The Godfather / Dune: weight in
    # the low register, silence for awe.
    "solemn": {
        "prompt": (
            "Solemn ceremonial orchestral cue, deep and grave, in the spirit of "
            "The Godfather and Dune — weight in the low register, space for awe. "
            "Three clearly identifiable instruments only: (1) a massive pipe "
            "organ sustaining a slow dark low chord on its pedal stops, filling "
            "a cathedral; (2) French horns in their low-middle register playing "
            "a noble, heavy, slow-moving line in unison, round and warm and "
            "unmistakably brass; (3) a single tuned timpani striking an extremely "
            "slow heartbeat — one deep note every few seconds with long silence "
            "between. Tempo about 40 BPM, processional. No high strings, no top "
            "melody, no choir, no other instruments. Reverberant, vast, reverent."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 紧张 — cello + taiko + synth-pad. Texture, not melody; let the audience
    # notice they are holding their breath.
    "tension": {
        "prompt": (
            "Cinematic tension underscore — pure texture, no melody at all. "
            "Three clearly identifiable layers only: (1) a low cello sustaining "
            "an unresolved dissonant interval, a minor second grinding against "
            "the root, bowed with slowly growing pressure; (2) a deep taiko drum "
            "with slow, irregular, gradually accelerating heartbeat strikes, felt "
            "in the chest rather than counted; (3) a dark analog synth pad "
            "swelling underneath with a slow filter sweep, airless and dissonant. "
            "The harmony never resolves; only the tension tightens. No lead "
            "melody, no piano, no brass, no full string section. Claustrophobic, "
            "heart-rate-raising."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 史诗 — french-horn + timpani + choir. Two Steps From Hell trailer epic:
    # stack brass, big drum, choir; pull down first, then explode; the hit point
    # matters more than loudness.
    "epic": {
        "prompt": (
            "Two Steps From Hell style trailer epic. Start quiet and restrained "
            "for the first few seconds — a low sustained drone and a distant lone "
            "French horn (the pull-down before the hit). Then a massive hit "
            "point: stacked French horns blast a heroic rising fanfare, a huge "
            "timpani and bass drum boom on the downbeat, and an a-cappella mixed "
            "choir surges in on a powerful sustained 'ah'. It is the impact of "
            "the hit that matters, not constant loudness — soft, then explode, "
            "then drive forward with heroic momentum. Three clearly identifiable "
            "forces: stacked brass (French horns), big orchestral drums (timpani "
            "+ bass drum), and an epic choir. Cinematic, triumphant, goosebumps."
        ),
        "lyrics": INSTRUMENTAL,
    },

    # ----------------- original 9 (untouched unless --force) -----------------
    # 悬疑 — violin pp + sparse single piano notes; the space matters more than
    # the sound (Hitchcock: hear the second hand).
    "suspense": {
        "prompt": (
            "Hitchcockian suspense cue, very sparse, the silence more important "
            "than the sound. A high violin plays pianissimo sustained tones with "
            "an uneasy tritone, almost a whisper. Single isolated piano notes "
            "drop into the space with lots of air between them, like a ticking "
            "clock. A faint celesta glint appears once or twice. No groove, no "
            "resolution, no other instruments. Tense, withheld, waiting."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 恐惧 — contrabass drone + reversed cymbal + very low vocal hum, no beat.
    "dread": {
        "prompt": (
            "Formless horror dread, no clear pulse at all. A double-bass drone "
            "sits at the very bottom, swelling and receding. A dark synth pad "
            "smears the harmony with a reverse-cymbal-like rise into the void. A "
            "very low male choir hums almost below pitch, indistinct. No melody, "
            "no rhythm, no other instruments. The vaguer the rhythm, the deeper "
            "the fear — The Hunt, Hereditary."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 悲悯 — long cello line + sparse piano chords + an erhu sigh; breathing.
    "sorrow": {
        "prompt": (
            "Tender sorrowful cue, breathing and unhurried. A solo cello sings a "
            "long legato line in the tenor register. Sparse piano chords answer "
            "from beneath with lots of space. A solo erhu adds a single mournful "
            "sighing phrase, sliding between notes. Tempo about 50 BPM. Intimate, "
            "no percussion, no other instruments. Don't let the music cry — let "
            "the picture cry."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 神圣 — choir + pipe organ + high celesta shimmer, light rising from below.
    "sacred": {
        "prompt": (
            "Sacred, transcendent cue — light rising from the floor upward. A "
            "mixed choir sustains a slowly brightening major 'ah' chord. A pipe "
            "organ supports from below with warm principal stops. High celesta "
            "shimmers glint far above like points of light. Cathedral reverb, "
            "tempo about 50 BPM, no percussion, no other instruments. Awe that "
            "is already sounding when the audience looks up."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 思念 — clarinet over a string bed + a guzheng pluck; a melody that reaches
    # and won't resolve (the Eastern longing that hangs unfallen).
    "longing": {
        "prompt": (
            "Wistful longing cue. A solo clarinet plays a lyrical line that "
            "reaches upward and refuses to resolve, hanging unfallen. A warm "
            "cello-and-string bed sustains underneath. A guzheng adds a few "
            "delicate plucked ornaments, like distant memory. Tempo about 60 "
            "BPM, reverberant, intimate. No drums, no brass. Eastern longing — "
            "Crouching Tiger, Hidden Dragon."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 喜悦 — major key, skipping woodwind + pizzicato groove; accents off-beat.
    "joy": {
        "prompt": (
            "Bright, joyful cue in a major key, light on its feet. A flute "
            "plays a skipping, laughing melodic line. A piano adds buoyant "
            "chords. Pizzicato strings drive a gentle groove with accents on the "
            "off-beats. Tempo about 110 BPM, warm and uplifting, no heavy "
            "orchestration — let the rhythm do the smiling. No drums, no brass."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 嬉戏 — piccolo/flute + xylophone + pizzicato bass; ends uncollected with a
    # cheeky raised eyebrow (Pixar / Joe Hisaishi).
    "playful": {
        "prompt": (
            "Playful, mischievous cue in the spirit of Pixar or Joe Hisaishi — "
            "rhythm over melody. A high flute and a xylophone trade quick "
            "staccato sixteenth-note figures, light and comic. Pizzicato strings "
            "bounce a tip-toe bass line. Tempo about 130 BPM. It ends "
            "uncollected on an unresolved note — a cheeky raised eyebrow. No "
            "drums, no brass, no other instruments."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 浪漫 — string ensemble + oboe soliloquy + piano; breath, not technique.
    "romance": {
        "prompt": (
            "Romantic cue — you should hear breath, not technique. A warm string "
            "ensemble sustains a tender harmony. A solo oboe sings an intimate, "
            "vocal soliloquy over the top, rubato and unhurried. A piano adds "
            "soft supporting chords. Tempo about 60 BPM, reverberant, no "
            "percussion. The opposite of romance is loneliness, not a big "
            "melody — Lust Caution, Up in the Air."
        ),
        "lyrics": INSTRUMENTAL,
    },
    # 虚无 — minimal synth pad + occasional single piano note + guqin; the pulse
    # is gone, sound becomes the thickness of air.
    "void": {
        "prompt": (
            "Void, weightless ambient cue — the pulse is gone, sound becomes the "
            "thickness of air. A minimal, slowly evolving synth pad drifts in a "
            "vast reverberant space, detuned and barely moving. A single piano "
            "note is dropped into the silence now and then, left to decay fully. "
            "A lone guqin harmonic floats by, sparse and breath-like. No rhythm, "
            "no melody, no other instruments. 2001: A Space Odyssey, Yi Yi — let "
            "the sound become air."
        ),
        "lyrics": INSTRUMENTAL,
    },
}


def load_key() -> str:
    for env_file, var in KEY_SOURCES:
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith(f"{var}="):
                    val = line.split("=", 1)[1].strip()
                    if val:
                        print(f"  (using {var} from {env_file.name})")
                        return val
        if os.environ.get(var):
            return os.environ[var]
    sys.exit("ERROR: no MiniMax API key found (.minimax-plan.env / .minimax.env)")


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
    parser.add_argument("--only", help="Comma-separated emotion ids")
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
        out_file = OUT_ROOT / f"{slug}.mp3"
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
        # MiniMax returns a 30-60s piece; trim to a focused 15s preview with a
        # 0.3s fade in/out, re-encoded to 192k stereo to match the PR#6 batch.
        try:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", str(raw_file),
                    "-t", "15",
                    "-af", "afade=t=in:st=0:d=0.3,afade=t=out:st=14.7:d=0.3",
                    "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
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
