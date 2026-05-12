#!/usr/bin/env node
/**
 * Pull selected FluidR3_GM instruments from gleitz/midi-js-soundfonts (CC),
 * decode their embedded base64 mp3 notes, and save them under
 * public/samples/<localName>/<note>.mp3 for Tone.Sampler to consume.
 *
 * Local name -> GM patch name mapping is below. Reasoning:
 *   - erhu      -> fiddle (GM 110; the GM "ethnic" bin uses fiddle for
 *                  Chinese/Indian/Celtic bowed-string surrogates).
 *   - pipa      -> sitar  (GM 105; both 4-string Asian plucked, fret-noise
 *                  + drone resonance).
 *   - guzheng   -> koto   (GM 108; Japanese cousin of guzheng, same zither
 *                  family, similar attack + sympathetic resonance).
 *   - guqin     -> shamisen (lower-register plucked, more austere than koto).
 *   - choir     -> choir_aahs (GM 52).
 *
 * Run: node scripts/unpack-soundfonts.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'samples');
const BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';

const SOURCES = {
  erhu: 'fiddle',
  pipa: 'sitar',
  guzheng: 'koto',
  guqin: 'shamisen',
  choir: 'choir_aahs',
};

/** Sanitise a note name for the filesystem: A#3 -> As3, Bb3 -> Bb3. */
function safeFilename(note) {
  return note.replace('#', 's') + '.mp3';
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

let totalNotes = 0;
let totalBytes = 0;

for (const [localName, sfName] of Object.entries(SOURCES)) {
  const url = `${BASE}/${sfName}-mp3.js`;
  process.stdout.write(`${localName.padEnd(10)} <- ${sfName.padEnd(14)} ... `);
  const text = await fetchText(url);

  // Each entry: "<noteName>": "data:audio/mp3;base64,<b64>"
  const re = /"([A-G][#b]?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g;
  const outDir = path.join(OUT, localName);
  fs.mkdirSync(outDir, { recursive: true });
  // wipe stale files so renames don't accumulate
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.mp3')) fs.unlinkSync(path.join(outDir, f));
  }

  let count = 0;
  let bytes = 0;
  // FluidR3 mp3s use non-standard VBR / joint-stereo frame headers that
  // Chrome's decodeAudioData rejects ("EncodingError: Unable to decode
  // audio data"). Pipe everything through ffmpeg to re-encode into a
  // boring CBR mp3 with ID3v2 header that all browsers accept.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-'));
  for (const m of text.matchAll(re)) {
    const note = m[1];
    const buf = Buffer.from(m[2], 'base64');
    const tmpFile = path.join(tmpDir, `${safeFilename(note)}.in`);
    fs.writeFileSync(tmpFile, buf);
    const outFile = path.join(outDir, safeFilename(note));
    execSync(`ffmpeg -y -i "${tmpFile}" -f mp3 -ar 44100 -b:a 96k -ac 2 "${outFile}" -loglevel error`);
    fs.unlinkSync(tmpFile);
    count++;
    bytes += fs.statSync(outFile).size;
  }
  fs.rmdirSync(tmpDir);
  totalNotes += count;
  totalBytes += bytes;
  console.log(`${count} notes, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

console.log(`\nDone: ${totalNotes} notes, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
