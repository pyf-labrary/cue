#!/usr/bin/env python3
"""Generate ~12s solo demo recordings for ALL 21 atlas instruments via MiniMax
music-2.6. Used as the primary preview on /atlas + /atlas/<id> instead of
the stiff Tone.Sampler synth phrases.

Output: `public/samples/<inst>-real.mp3`. Idempotent — skip if file present
unless --force. Cost: ~¥1.5-3 per generation, billed to ~/bin/.minimax.env.
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

    # ----------------- Western strings (add 3) -----------------
    "cello": {
        "prompt": (
            "Solo cello unaccompanied, 10 seconds. Warm singing legato in the "
            "tenor register, expressive bowing with rich vibrato, like the "
            "opening of a Bach cello suite or Yo-Yo Ma. Studio close-mic with "
            "natural wood resonance, intimate hall reverb. Tempo about 60 BPM. "
            "Absolutely no other instruments, no piano, no orchestra, no drums."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "violin": {
        "prompt": (
            "Solo violin unaccompanied, 10 seconds. Singing lyrical phrase in "
            "the upper register, expressive vibrato and bow articulation in "
            "the manner of Itzhak Perlman or Hilary Hahn. Bright, soaring, "
            "with subtle portamento between high notes. Close-miked studio "
            "with concert-hall ambience. Strictly no accompaniment, no piano, "
            "no orchestra, no other instruments."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "contrabass": {
        "prompt": (
            "Solo double bass unaccompanied, 10 seconds. Deep arco bowed "
            "melody in the low register, slow and resonant, with woody body. "
            "Tempo about 50 BPM. Recorded close in a studio room, no drums, "
            "no piano, no other instruments — just the solo double bass alone."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "pizzicato-strings": {
        "prompt": (
            "Solo string section pizzicato, 10 seconds. Plucked violins and "
            "cellos playing a light, playful staccato motif, dry and short, "
            "in the style of a film-score chase or Britten Simple Symphony "
            "pizzicato. Crisp transients, mid-tempo around 120 BPM. No bowed "
            "sustain, no drums, no brass, no winds, no piano."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Woodwind (add 4) -----------------
    "flute": {
        "prompt": (
            "Solo concert flute unaccompanied, 10 seconds. Airy, light, "
            "fluttering melodic line in the upper register, with breath "
            "tone audible, in the manner of Debussy Syrinx or James Galway. "
            "Tempo about 90 BPM. Studio close-mic. No accompaniment, "
            "absolutely no other instruments."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "clarinet": {
        "prompt": (
            "Solo Bb clarinet unaccompanied, 10 seconds. Woody, soulful, "
            "lyrical melody in the chalumeau register sliding up to clarino, "
            "expressive Brahms-like phrasing. Tempo about 70 BPM. Studio "
            "close-mic with hall reverb. No piano, no orchestra, no drums, "
            "no other instruments."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "oboe": {
        "prompt": (
            "Solo oboe unaccompanied, 10 seconds. Plaintive, double-reed "
            "nasal timbre, lyrical singing line in the manner of Ennio "
            "Morricone Gabriel's Oboe. Tempo about 65 BPM. Studio close-mic "
            "with cathedral ambience. No strings, no accompaniment, "
            "no other instruments at all."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Brass (add 2) -----------------
    "french-horn": {
        "prompt": (
            "Solo French horn unaccompanied, 10 seconds. Noble, heroic "
            "sustained melodic line in the middle register, warm round "
            "timbre with hand-stopping nuance, in the manner of John Williams "
            "or Strauss horn solo. Tempo about 60 BPM. Studio with concert-hall "
            "ambience. No orchestra, no other brass, no drums."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "trumpet": {
        "prompt": (
            "Solo trumpet unaccompanied, 10 seconds. Lyrical singing line "
            "in the upper register with cup-mute warmth, bright but vocal, "
            "in the manner of Chet Baker or a film-score lament. Tempo about "
            "80 BPM. Studio close-mic. No band, no drums, no piano, "
            "no other instruments."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Keyboard (add 3) -----------------
    "piano": {
        "prompt": (
            "Solo classical piano unaccompanied, 12 seconds. Expressive "
            "Chopin-like lyrical phrase with pedaling and rubato, singing "
            "right hand over a flowing left-hand accompaniment, in the manner "
            "of a Nocturne. Tempo about 60 BPM. Studio recording on a concert "
            "grand. Only piano, no other instruments at all."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "celesta": {
        "prompt": (
            "Solo celesta unaccompanied, 10 seconds. Bell-like crystalline "
            "high-register melody, glittering, magical, in the manner of "
            "Tchaikovsky's Sugar Plum Fairy or John Williams Hedwig's Theme. "
            "Tempo about 100 BPM. Close-mic studio recording. Absolutely no "
            "orchestra, no strings, no other instruments — just the solo celesta."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "pipe-organ": {
        "prompt": (
            "Solo pipe organ unaccompanied, 12 seconds. Massive cathedral "
            "organ playing a slow sustained Bach-like chorale, deep pedal "
            "bass and rich principal stops, vast reverberant cathedral space. "
            "Tempo about 50 BPM. No other instruments, no choir, "
            "just the solo pipe organ."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Percussion (add 3) -----------------
    "timpani": {
        "prompt": (
            "Solo orchestral timpani unaccompanied, 10 seconds. Dramatic "
            "rolls building to a climactic accent then a low rumbling roll, "
            "tuned kettle drums in the manner of the opening of Mahler 2 or "
            "Strauss Also Sprach Zarathustra. No orchestra, no other percussion, "
            "no brass, no strings — only the solo timpani."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "taiko": {
        "prompt": (
            "Solo Japanese taiko drum unaccompanied, 10 seconds. Powerful "
            "deep accented strikes with occasional rolls, in the manner of "
            "Kodo or a kabuki performance. Dry, focused, with body resonance. "
            "Tempo about 100 BPM. Only taiko, absolutely no other instruments, "
            "no melody, no other percussion."
        ),
        "lyrics": "##[Instrumental]##",
    },
    "xylophone": {
        "prompt": (
            "Solo orchestral xylophone unaccompanied, 10 seconds. Bright "
            "wooden mallet melody, fast articulate sixteenth-note figure in "
            "the upper register with rolls, in the manner of Saint-Saens "
            "Danse Macabre. Tempo about 130 BPM. Close-mic studio recording. "
            "No orchestra, no piano, no other percussion — only the solo xylophone."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Plucked Chinese (add 1) -----------------
    "pipa": {
        "prompt": (
            "Solo pipa performance, 10 seconds. Chinese 4-string plucked lute "
            "with characteristic fast tremolo (lunzhi) and rapid descending "
            "runs, both percussive strums and lyrical single notes. Bright "
            "metallic strings, expressive. Tempo varies, around 90 BPM. "
            "Close-mic studio recording. No accompaniment, no other instruments, "
            "no drums — only the solo pipa."
        ),
        "lyrics": "##[Instrumental]##",
    },

    # ----------------- Electronic (add 1) -----------------
    "synth-pad": {
        "prompt": (
            "Solo analog synthesizer pad, 12 seconds. Slow evolving warm "
            "string-pad chord progression with soft attack and long release, "
            "subtle filter sweep, in the manner of Vangelis Blade Runner or "
            "a Hans Zimmer ambient texture. Tempo about 60 BPM. Stereo wide. "
            "Only the pad — no drums, no bass, no leads, no other instruments."
        ),
        "lyrics": "##[Instrumental]##",
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
