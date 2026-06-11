/**
 * Re-scores — the "换一种配法" data for scene pages.
 *
 * Each scene gets exactly one alternate scoring that flips its emotional
 * read while keeping the picture (duration, cuts, annotations grid) fixed.
 * This is the atomic demonstration of the whole site: same footage,
 * different music, different story.
 *
 * `fx`/`nx` are optional replacements — omit to keep the original lane,
 * pass [] to silence it (e.g. the warm Psycho re-score has no stingers).
 */
import type { EmotionId } from './emotions';
import type { ComposedNote, SfxHit, DroneLayer } from './scenes';

export interface Rescore {
  /** Pill label, e.g. "阳光假日". */
  label: string;
  emotion: EmotionId;
  /** Shown while this re-score is active — what changed and why it works. */
  note: string;
  mx: ComposedNote[];
  fx?: SfxHit[];
  nx?: DroneLayer[];
}

const N = (inst: string, note: string, dur: string, at: number, vel = 0.6): ComposedNote =>
  ({ inst, note, dur, at, vel });

/* ----------------------------- helpers ----------------------------------- */

/** Light pizzicato bass alternation, the "nothing is wrong" walking floor. */
function pizzFloor(start: number, end: number, step: number, notes: string[], vel = 0.45): ComposedNote[] {
  const out: ComposedNote[] = [];
  let t = start;
  let i = 0;
  while (t < end) {
    out.push(N('pizzicato-strings', notes[i % notes.length], '8n', +t.toFixed(2), vel));
    i++;
    t += step;
  }
  return out;
}

/** Driving low ostinato — the thriller engine. */
function tenseOstinato(start: number, end: number, interval: number, notes: string[], base: number, rise: number): ComposedNote[] {
  const out: ComposedNote[] = [];
  const span = Math.max(1, end - start);
  let t = start;
  let i = 0;
  while (t < end - 1e-6) {
    out.push(N('contrabass', notes[i % notes.length], '8n', +t.toFixed(2), +Math.min(1, base + rise * ((t - start) / span)).toFixed(2)));
    i++;
    t += interval;
  }
  return out;
}

/* ----------------------------- re-scores --------------------------------- */

export const RESCORES: Record<string, Rescore> = {
  /* Jaws: dread ostinato → C-major holiday. The shark disappears. */
  jaws: {
    label: '阳光假日',
    emotion: 'joy',
    note:
      '同一片海、同一个泳客。把 E–F 半音 ostinato 换成 C 大调长笛 + 拨弦，水下就什么都没有了——'
      + '观众的恐惧从来不在画面里，在那两个音里。音乐才是那条鲨鱼。',
    mx: [
      // Lilting flute tune — a postcard, not a predator.
      N('flute', 'E5', '4n', 0, 0.45), N('flute', 'G5', '4n', 0.8, 0.45), N('flute', 'A5', '4n.', 1.6, 0.5),
      N('flute', 'G5', '4n', 2.8, 0.45), N('flute', 'E5', '2n', 3.6, 0.45),
      N('flute', 'C5', '4n', 6, 0.42), N('flute', 'D5', '4n', 6.8, 0.45), N('flute', 'E5', '4n.', 7.6, 0.48),
      N('flute', 'G5', '2n', 8.8, 0.5), N('flute', 'E5', '2n', 10.4, 0.45),
      // Second verse a third up — the afternoon gets better.
      N('flute', 'G5', '4n', 14, 0.48), N('flute', 'B5', '4n', 14.8, 0.5), N('flute', 'C6', '4n.', 15.6, 0.52),
      N('flute', 'B5', '4n', 16.8, 0.48), N('flute', 'G5', '2n', 17.6, 0.46),
      N('flute', 'A5', '4n', 20, 0.46), N('flute', 'G5', '4n', 20.8, 0.45), N('flute', 'E5', '2n.', 21.6, 0.45),
      N('flute', 'D5', '2n', 24.5, 0.42), N('flute', 'C5', '1n', 26.5, 0.42),
      // Xylophone sparkle — sunlight on water.
      N('xylophone', 'C6', '8n', 4.8, 0.4), N('xylophone', 'E6', '8n', 5.1, 0.38),
      N('xylophone', 'G6', '8n', 12.5, 0.4), N('xylophone', 'E6', '8n', 12.8, 0.36),
      N('xylophone', 'C6', '8n', 18.8, 0.4), N('xylophone', 'G6', '8n', 19.1, 0.38),
      N('xylophone', 'E6', '8n', 27.5, 0.4), N('xylophone', 'C6', '8n', 27.9, 0.4),
      // Pizzicato floor — easy two-feel, nothing lurking.
      ...pizzFloor(0, 28, 1.0, ['C3', 'G2', 'E3', 'G2'], 0.42),
    ],
    fx: [], // no timpani heartbeat — there is no heartbeat to race
    nx: [
      { inst: 'synth-pad', note: ['C3', 'G3'], startAt: 0, endAt: 30, vel: 0.12 },
    ],
  },

  /* Crouching Tiger: longing duet → blades-out thriller. */
  'crouching-tiger-bamboo': {
    label: '杀机四伏',
    emotion: 'tension',
    note:
      '同样的竹海对峙，抽掉大提琴与二胡的"问答"，换成低音 ostinato + 古筝戳刺——'
      + '镜头里的风不再是诗，是埋伏。原配让你看人物关系，这一版只让你等第一剑。',
    mx: [
      // Low semitone engine, accelerating like held breath.
      ...tenseOstinato(0, 12, 0.9, ['D2', 'Eb2'], 0.3, 0.12),
      ...tenseOstinato(12, 22, 0.6, ['D2', 'Eb2'], 0.42, 0.16),
      ...tenseOstinato(22, 28, 0.42, ['D2', 'Eb2', 'E2', 'Eb2'], 0.58, 0.2),
      // Erhu — one long high wire, no longer a person, just pressure.
      N('erhu', 'A5', '1n', 6, 0.32), N('erhu', 'Bb5', '1n', 10, 0.36),
      N('erhu', 'A5', '1n', 16, 0.4), N('erhu', 'B5', '2n', 21, 0.46),
      N('erhu', 'C6', '2n', 24.5, 0.5),
    ],
    fx: [
      // Guzheng stabs — bamboo leaves turned shuriken.
      { inst: 'guzheng', note: 'D5', dur: '16n', at: 4.5, vel: 0.7 },
      { inst: 'guzheng', note: 'Eb5', dur: '16n', at: 4.62, vel: 0.65 },
      { inst: 'guzheng', note: 'A4', dur: '16n', at: 9, vel: 0.7 },
      { inst: 'guzheng', note: 'D5', dur: '16n', at: 13.5, vel: 0.75 },
      { inst: 'guzheng', note: 'Eb5', dur: '16n', at: 13.62, vel: 0.7 },
      { inst: 'taiko', note: 'D2', dur: '4n', at: 18, vel: 0.8 },
      { inst: 'guzheng', note: 'G5', dur: '16n', at: 20.5, vel: 0.8 },
      { inst: 'taiko', note: 'D2', dur: '4n', at: 23, vel: 0.9 },
      { inst: 'taiko', note: 'D2', dur: '2n', at: 26.5, vel: 1.0 },
    ],
    nx: [
      { inst: 'synth-pad', note: ['D2', 'A2'], startAt: 0, endAt: 28, vel: 0.16 },
      { inst: 'cello', note: 'D2', startAt: 14, endAt: 28, vel: 0.14 },
    ],
  },

  /* Psycho: shrieking stingers → a quiet nocturne. The murder turns absurd. */
  'psycho-shower': {
    label: '宁静夜曲',
    emotion: 'romance',
    note:
      '刀还在落下，但弦乐尖叫没了——配上钢琴夜曲，这场谋杀变成了荒诞剧。'
      + '你刚才的恐惧原来全是赫尔曼给的：stinger 模拟的不是刀声，是你的神经。',
    mx: [
      // Gentle piano arpeggios — someone humming in the steam.
      N('piano', 'C4', '8n', 0, 0.4), N('piano', 'E4', '8n', 0.4, 0.4), N('piano', 'G4', '8n', 0.8, 0.42),
      N('piano', 'C5', '4n', 1.2, 0.45), N('piano', 'B4', '4n', 2.2, 0.4), N('piano', 'G4', '2n', 3.2, 0.4),
      N('piano', 'A3', '8n', 5, 0.38), N('piano', 'C4', '8n', 5.4, 0.4), N('piano', 'E4', '8n', 5.8, 0.4),
      N('piano', 'A4', '4n', 6.2, 0.44), N('piano', 'G4', '4n', 7.2, 0.4), N('piano', 'E4', '2n', 8.2, 0.38),
      N('piano', 'F3', '8n', 10, 0.38), N('piano', 'A3', '8n', 10.4, 0.4), N('piano', 'C4', '8n', 10.8, 0.4),
      N('piano', 'F4', '4n', 11.2, 0.42), N('piano', 'E4', '4n', 12.2, 0.4), N('piano', 'C4', '2n', 13.2, 0.38),
      N('piano', 'G3', '8n', 15, 0.36), N('piano', 'B3', '8n', 15.4, 0.38), N('piano', 'D4', '8n', 15.8, 0.38),
      N('piano', 'G4', '4n', 16.2, 0.4), N('piano', 'C5', '2n', 17.2, 0.42), N('piano', 'C4', '1n', 19, 0.36),
      // A warm cello line underneath — domestic, safe.
      N('cello', 'C3', '1n', 0, 0.3), N('cello', 'A2', '1n', 5, 0.3),
      N('cello', 'F2', '1n', 10, 0.3), N('cello', 'G2', '1n', 15, 0.3), N('cello', 'C3', '1n', 19, 0.28),
    ],
    fx: [], // the knife falls in silence — and stops mattering
    nx: [
      { inst: 'synth-pad', note: ['C4', 'G4'], startAt: 0, endAt: 22, vel: 0.07 },
      { inst: 'cello', note: 'C2', startAt: 0, endAt: 22, vel: 0.08 },
    ],
  },

  /* Interstellar: the SAME pedal tone, but the harmony above turns hostile. */
  'interstellar-cooper-leaves': {
    label: '不祥引力',
    emotion: 'dread',
    note:
      'pedal tone 一个音都没换——还是那个 C，还是 36 秒不动。只把上方和声从大三和弦换成小二度摩擦，'
      + '"引力"就从思念变成了威胁：女儿不是在等他回来，是有什么东西不让他走。同一个手法，两种命运。',
    mx: [
      // The pedal — identical to the original. The device survives the flip.
      N('pipe-organ', 'C3', '1n', 0, 0.42), N('pipe-organ', 'C3', '1n', 6, 0.44),
      N('pipe-organ', 'C3', '1n', 12, 0.48), N('pipe-organ', 'C3', '1n', 18, 0.52),
      N('pipe-organ', 'C3', '1n', 24, 0.56), N('pipe-organ', 'C3', '1n', 30, 0.5),
      // Semitone rubs against the pedal — Db and B leaning on C.
      N('cello', 'Db3', '1n', 6, 0.42), N('cello', 'C3', '1n', 10, 0.4),
      N('cello', 'B2', '1n', 14, 0.46), N('cello', 'Db3', '1n', 18, 0.5),
      N('cello', 'C3', '1n', 22, 0.46), N('cello', 'B2', '1n', 26, 0.52),
      N('cello', 'Db3', '1n', 30, 0.55),
      // High violin — thin, wrong, far away.
      N('violin', 'F#5', '1n', 12, 0.22), N('violin', 'G5', '1n', 17, 0.26),
      N('violin', 'F#5', '1n', 24, 0.3), N('violin', 'Ab5', '2n', 30, 0.34),
      // Low choir cluster at the end — the void answers.
      N('choir', 'C3', '1n', 26, 0.3), N('choir', 'Db3', '1n', 30, 0.34),
    ],
    fx: [],
    nx: [
      { inst: 'synth-pad', note: ['C2', 'Db2'], startAt: 0, endAt: 36, vel: 0.18 },
      { inst: 'contrabass', note: 'C1', startAt: 16, endAt: 36, vel: 0.14 },
    ],
  },

  /* Godfather: same march skeleton, comic instrumentation. Solemnity dies. */
  'godfather-funeral': {
    label: '滑稽送葬',
    emotion: 'playful',
    note:
      '步伐没变、低音走向没变、旋律骨架没变——只把小号换成木琴 + 钢片琴 + 拨弦，'
      + '葬礼队伍就成了卡通片。决定庄重还是滑稽的不是音符，是音色和奏法（staccato vs legato）。',
    mx: [
      // Same D-minor walk, plucked instead of bowed — tiptoeing, not marching.
      ...pizzFloor(0, 28, 1.5, ['D2', 'A2', 'D2', 'F2'], 0.5),
      // The lament melody, but staccato on xylophone — Looney Tunes funeral.
      N('xylophone', 'D5', '8n', 5, 0.6), N('xylophone', 'A5', '8n', 7, 0.62),
      N('xylophone', 'F5', '8n', 8.5, 0.6), N('xylophone', 'E5', '8n', 10.5, 0.55),
      N('xylophone', 'D5', '8n', 11.5, 0.55), N('xylophone', 'F5', '8n', 13.5, 0.6),
      N('xylophone', 'A5', '8n', 14.5, 0.65), N('xylophone', 'G5', '8n', 16.5, 0.58),
      N('xylophone', 'F5', '4n', 17.5, 0.55),
      // Celesta answers where the horn used to — a music box, not a family.
      N('celesta', 'D4', '8n', 17, 0.5), N('celesta', 'F4', '8n', 19, 0.5),
      N('celesta', 'A4', '4n', 20.5, 0.55), N('celesta', 'F4', '4n', 23, 0.5),
      N('celesta', 'D4', '2n', 25.5, 0.48),
      // Flute grace turns — someone in the procession is skipping.
      N('flute', 'D6', '16n', 9.5, 0.4), N('flute', 'E6', '16n', 9.65, 0.38), N('flute', 'D6', '8n', 9.8, 0.4),
      N('flute', 'A5', '16n', 21.5, 0.4), N('flute', 'B5', '16n', 21.65, 0.38), N('flute', 'A5', '8n', 21.8, 0.4),
      N('xylophone', 'D5', '4n', 25, 0.5), N('xylophone', 'D6', '8n', 27, 0.6),
    ],
    fx: [],
    nx: [
      { inst: 'synth-pad', note: ['D3', 'A3'], startAt: 0, endAt: 30, vel: 0.1 },
    ],
  },
};

/** Shown when MX is pulled out entirely. */
export const NO_SCORE_NOTES: Record<string, string> = {
  jaws:
    '没有音乐，水面只是水面。斯皮尔伯格看过无配乐版剪辑——平静得像旅游片。'
    + '那两个音进来之前，这部片子根本不存在"鲨鱼"。',
  'crouching-tiger-bamboo':
    '抽掉谭盾，竹林只剩风声。武侠的"气"一半在镜头里，一半在弦上——现在你只看见两个人站在树梢。',
  'psycho-shower':
    '希区柯克最初坚持浴室戏零配乐、只用水声。赫尔曼违令写了弦乐——希区柯克听完当场认输，给他加了片酬。'
    + '你现在听到的，就是希区柯克想要的版本。',
  'interstellar-cooper-leaves':
    '没有那个 pedal tone，离别只是一个男人开车。引力消失了——父女之间那根看不见的弦，原来是管风琴拉着的。',
  'godfather-funeral':
    '没有罗塔，送葬队伍只是在走路。注意时间感立刻松散——原来整场戏的步速、呼吸、镜头节奏都被那条低音定死。',
};

export type ScoreMode = 'original' | 'alt' | 'none';
