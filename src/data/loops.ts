/**
 * Loop library for the M5 sandbox and M4 lesson widgets.
 *
 * Each loop is a short, self-contained phrase that drops cleanly onto a lane.
 * Durations are tuned so the audible content lives entirely inside `durSec`
 * (clips hard-stop on durSec). Note `at` values are seconds from clip start.
 *
 * Lanes are suggestions — the user can drop any loop on any lane.
 */
import type { ClipNote } from '@/lib/composition';
import type { TrackId } from './scenes';

export interface Loop {
  id: string;
  /** Instrument id passed to resolveInstrument(). */
  inst: string;
  label: string;
  suggestedLane: TrackId;
  /** Total clip length. */
  durSec: number;
  /** Either a "notes" phrase or "drone" sustained chord. */
  kind: 'notes' | 'drone';
  /** For kind=notes. */
  notes?: ClipNote[];
  /** For kind=drone. */
  hold?: string | string[];
  vel?: number;
  /** One-line description shown on hover. */
  hint?: string;
}

const N = (note: string, dur: string, at: number, vel = 0.75): ClipNote => ({ note, dur, at, vel });

export const LOOPS: Loop[] = [
  /* ---- Strings — melodic --------------------------------------------------- */
  {
    id: 'cello-mournful',
    inst: 'cello',
    label: '大提琴 · 哀句',
    suggestedLane: 'mx',
    durSec: 6,
    kind: 'notes',
    notes: [N('E3', '2n', 0), N('G3', '2n', 1.2), N('F3', '2n.', 2.4), N('D3', '1n', 4.0)],
    hint: '6 秒下行长句——给画面"重量"。',
  },
  {
    id: 'cello-pedal-c',
    inst: 'cello',
    label: '大提琴 · 持续 C',
    suggestedLane: 'nx',
    durSec: 8,
    kind: 'drone',
    hold: 'C2',
    vel: 0.55,
    hint: '低 C 持续——基底铺垫。',
  },
  {
    id: 'violin-stinger',
    inst: 'violin',
    label: '小提琴 · 尖刺',
    suggestedLane: 'fx',
    durSec: 0.6,
    kind: 'notes',
    notes: [N('A6', '16n', 0, 1.0), N('C7', '16n', 0.04, 0.95)],
    hint: 'Psycho 式 stinger——一瞬间。',
  },
  {
    id: 'violin-rising',
    inst: 'violin',
    label: '小提琴 · 上行',
    suggestedLane: 'mx',
    durSec: 4,
    kind: 'notes',
    notes: [N('A4', '4n', 0), N('C5', '4n', 0.7), N('E5', '4n', 1.4), N('G5', '2n', 2.1)],
    hint: '4 秒上行——情绪推到顶。',
  },
  {
    id: 'contrabass-ostinato',
    inst: 'contrabass',
    label: '低音提琴 · Ostinato',
    suggestedLane: 'mx',
    durSec: 4,
    kind: 'notes',
    notes: [
      N('E2', '8n', 0, 0.6), N('F2', '8n', 0.5, 0.65),
      N('E2', '8n', 1.0, 0.7), N('F2', '8n', 1.5, 0.75),
      N('E2', '8n', 2.0, 0.8), N('F2', '8n', 2.5, 0.85),
      N('E2', '8n', 3.0, 0.9), N('F2', '8n', 3.5, 0.95),
    ],
    hint: 'Jaws 式半音反复——逼近感。',
  },

  /* ---- Woodwind ----------------------------------------------------------- */
  {
    id: 'flute-airline',
    inst: 'flute',
    label: '长笛 · 飘',
    suggestedLane: 'mx',
    durSec: 5,
    kind: 'notes',
    notes: [N('A5', '4n', 0, 0.6), N('C6', '4n', 0.8, 0.55), N('E5', '2n', 1.6, 0.65), N('A5', '2n', 3.0, 0.5)],
    hint: '气流感——开阔、风。',
  },
  {
    id: 'clarinet-noir',
    inst: 'clarinet',
    label: '单簧管 · 低吟',
    suggestedLane: 'mx',
    durSec: 5,
    kind: 'notes',
    notes: [N('D4', '4n', 0), N('F4', '4n.', 0.7), N('D4', '2n', 1.8), N('A#3', '2n', 3.2)],
    hint: '深夜 / 怀旧 / 烟雾。',
  },

  /* ---- Brass -------------------------------------------------------------- */
  {
    id: 'french-horn-pillar',
    inst: 'french-horn',
    label: '圆号 · 长柱',
    suggestedLane: 'mx',
    durSec: 6,
    kind: 'notes',
    notes: [N('C3', '1n', 0, 0.55), N('E3', '1n', 2.5, 0.65), N('G3', '1n', 4.5, 0.6)],
    hint: '英雄主题铺底，巨大、宽广。',
  },
  {
    id: 'trumpet-march',
    inst: 'trumpet',
    label: '小号 · 主题',
    suggestedLane: 'mx',
    durSec: 5,
    kind: 'notes',
    notes: [N('D4', '4n.', 0, 0.6), N('F4', '4n', 1.0), N('A4', '2n', 1.6, 0.7), N('G4', '4n.', 2.8), N('D4', '2n.', 3.6, 0.55)],
    hint: '葬礼进行曲式主旋律。',
  },

  /* ---- Percussion --------------------------------------------------------- */
  {
    id: 'timpani-heartbeat',
    inst: 'timpani',
    label: '定音鼓 · 心跳',
    suggestedLane: 'fx',
    durSec: 4,
    kind: 'notes',
    notes: [
      N('C2', '4n', 0, 0.65), N('C2', '4n', 0.8, 0.7),
      N('C2', '4n', 1.6, 0.75), N('F2', '4n', 2.4, 0.85), N('C2', '2n', 3.2, 0.9),
    ],
    hint: '加速心跳——紧迫感。',
  },
  {
    id: 'taiko-charge',
    inst: 'taiko',
    label: '太鼓 · 冲锋',
    suggestedLane: 'fx',
    durSec: 3,
    kind: 'notes',
    notes: [N('A1', '8n', 0, 0.8), N('A1', '8n', 0.3, 0.85), N('D2', '4n', 0.6, 0.95), N('A1', '8n', 1.2, 0.8), N('A1', '8n', 1.5, 0.85), N('D2', '2n', 1.8, 1.0)],
    hint: '动作戏鼓点。',
  },

  /* ---- Keyboard ----------------------------------------------------------- */
  {
    id: 'piano-arpeggio',
    inst: 'piano',
    label: '钢琴 · 琶音',
    suggestedLane: 'mx',
    durSec: 6,
    kind: 'notes',
    notes: [N('C3', '8n', 0), N('E3', '8n', 0.4), N('G3', '8n', 0.8), N('C4', '8n', 1.2), N('E4', '8n', 1.6), N('G4', '4n', 2.0), N('C4', '2n', 3.2, 0.65), N('A3', '2n.', 4.4, 0.55)],
    hint: '亲密、内省。',
  },
  {
    id: 'pipe-organ-pedal',
    inst: 'pipe-organ',
    label: '管风琴 · pedal C',
    suggestedLane: 'mx',
    durSec: 12,
    kind: 'drone',
    hold: ['C3', 'G3'],
    vel: 0.55,
    hint: 'Interstellar 式持续延音。',
  },
  {
    id: 'celesta-twinkle',
    inst: 'celesta',
    label: '钢片琴 · 闪烁',
    suggestedLane: 'fx',
    durSec: 3,
    kind: 'notes',
    notes: [N('C6', '8n', 0, 0.65), N('E6', '8n', 0.4), N('G6', '8n', 0.8), N('E6', '8n', 1.2), N('B5', '4n', 1.6), N('C6', '2n', 2.0)],
    hint: '魔法 / 记忆碎片。',
  },

  /* ---- Chinese folk + choir ------------------------------------------------ */
  {
    id: 'erhu-lament',
    inst: 'erhu',
    label: '二胡 · 哀诉',
    suggestedLane: 'mx',
    durSec: 6,
    kind: 'notes',
    notes: [N('D4', '4n', 0), N('F4', '4n.', 0.8), N('G4', '4n', 1.6), N('F4', '4n.', 2.2), N('D4', '2n', 3.2), N('A3', '2n', 4.4)],
    hint: '中式哀歌——含蓄、抑制。',
  },
  {
    id: 'guzheng-leaves',
    inst: 'guzheng',
    label: '古筝 · 落叶',
    suggestedLane: 'fx',
    durSec: 3,
    kind: 'notes',
    notes: [N('A4', '16n', 0, 0.5), N('C5', '16n', 0.3, 0.55), N('D5', '16n', 0.7, 0.6), N('G5', '16n', 1.1, 0.55), N('A4', '16n', 1.6, 0.5), N('C5', '16n', 1.9, 0.55)],
    hint: '点缀——古典飞白。',
  },
  {
    id: 'pipa-roll',
    inst: 'pipa',
    label: '琵琶 · 扫弦',
    suggestedLane: 'mx',
    durSec: 4,
    kind: 'notes',
    notes: [N('A3', '8n', 0), N('A3', '8n', 0.3), N('E4', '8n', 0.6), N('A4', '4n', 0.9), N('E4', '8n', 1.5), N('C#4', '8n', 1.8), N('A3', '4n.', 2.1)],
    hint: '激越——快板武戏。',
  },
  {
    id: 'guqin-recluse',
    inst: 'guqin',
    label: '古琴 · 隐士',
    suggestedLane: 'mx',
    durSec: 8,
    kind: 'notes',
    notes: [N('D3', '4n.', 0), N('F3', '4n', 1.6), N('G3', '4n.', 2.8), N('F3', '2n', 4.0), N('D3', '1n', 5.6)],
    hint: '极慢板——山水、孤寂。',
  },
  {
    id: 'choir-aahs',
    inst: 'choir',
    label: '合唱 · Aah',
    suggestedLane: 'nx',
    durSec: 8,
    kind: 'drone',
    hold: ['C4', 'E4', 'G4'],
    vel: 0.45,
    hint: '人声合唱铺底——神圣 / 葬礼。',
  },

  /* ---- Electronic / pad --------------------------------------------------- */
  {
    id: 'synth-pad-warm',
    inst: 'synth-pad',
    label: '合成 Pad · 暖',
    suggestedLane: 'nx',
    durSec: 8,
    kind: 'drone',
    hold: ['C3', 'G3', 'C4'],
    vel: 0.4,
    hint: '现代铺底——温暖、空气。',
  },
];

export function getLoop(id: string): Loop | undefined {
  return LOOPS.find((l) => l.id === id);
}

export function loopsByFamily(): Array<{ family: string; loops: Loop[] }> {
  const FAMILY_OF: Record<string, string> = {
    cello: '弦乐', violin: '弦乐', contrabass: '弦乐',
    flute: '木管', clarinet: '木管',
    'french-horn': '铜管', trumpet: '铜管',
    timpani: '打击', taiko: '打击',
    piano: '键盘', 'pipe-organ': '键盘', celesta: '键盘',
    erhu: '中乐', guzheng: '中乐', pipa: '中乐', guqin: '中乐',
    choir: '人声',
    'synth-pad': '电子',
  };
  const groups = new Map<string, Loop[]>();
  for (const l of LOOPS) {
    const fam = FAMILY_OF[l.inst] ?? '其它';
    const arr = groups.get(fam) ?? [];
    arr.push(l);
    groups.set(fam, arr);
  }
  const order = ['弦乐', '木管', '铜管', '打击', '键盘', '中乐', '人声', '电子', '其它'];
  return order
    .filter((f) => groups.has(f))
    .map((family) => ({ family, loops: groups.get(family)! }));
}
