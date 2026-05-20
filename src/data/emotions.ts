export type EmotionId =
  | 'tension'
  | 'suspense'
  | 'dread'
  | 'sorrow'
  | 'solemn'
  | 'sacred'
  | 'longing'
  | 'joy'
  | 'playful'
  | 'romance'
  | 'epic'
  | 'void';

export interface Emotion {
  id: EmotionId;
  label: string;       // 中文显示名
  en: string;          // English label, smaller
  /** Hue accent (used for halo + recommendation cards). */
  hue: string;
  /** One-line tagline shown when this slice is active. */
  blurb: string;
  /** A 4-second loop preview (CDN path). */
  loop?: string;
  /** Instrument ids whose color most often anchors this mood. */
  signatureInstruments: string[];
  /** Two-line director note. */
  directorNote: string;
}

export const EMOTIONS: Emotion[] = [
  {
    id: 'tension',
    label: '紧张',
    en: 'Tension',
    hue: '#D86B6B',
    blurb: '低频持续 + 不解决的和声 = 心率上扬。',
    signatureInstruments: ['cello', 'taiko', 'synth-pad'],
    directorNote: '别用旋律，用质感。让观众发现自己在屏息。',
  },
  {
    id: 'suspense',
    label: '悬疑',
    en: 'Suspense',
    hue: '#B89B5B',
    blurb: '小提琴极弱奏 + 钢琴单音点击，留白比声音重要。',
    signatureInstruments: ['violin', 'piano', 'celesta'],
    directorNote: '希区柯克：让炸弹在桌下，让观众听见秒针。',
  },
  {
    id: 'dread',
    label: '恐惧',
    en: 'Dread',
    hue: '#7B5BA3',
    blurb: '低音 drone + 反向钹 + 极低吟唱，无明确节拍。',
    signatureInstruments: ['contrabass', 'choir', 'synth-pad'],
    directorNote: '《狩猎》《遗传厄运》：节奏越模糊，恐惧越深。',
  },
  {
    id: 'sorrow',
    label: '悲悯',
    en: 'Sorrow',
    hue: '#5B7FB0',
    blurb: '大提琴长线条 + 钢琴疏落和弦，呼吸感是关键。',
    signatureInstruments: ['cello', 'piano', 'erhu'],
    directorNote: '不要让乐曲哭，让画面哭。',
  },
  {
    id: 'solemn',
    label: '庄严',
    en: 'Solemn',
    hue: '#6B8C8A',
    blurb: '铜管低声部 + 定音鼓极慢心跳。',
    signatureInstruments: ['french-horn', 'timpani', 'pipe-organ'],
    directorNote: '《教父》《沙丘》：低音域给重量，留白给敬畏。',
  },
  {
    id: 'sacred',
    label: '神圣',
    en: 'Sacred',
    hue: '#C9B27F',
    blurb: '人声合唱 + 管风琴 + 高频闪光，自下而上的光。',
    signatureInstruments: ['choir', 'pipe-organ', 'celesta'],
    directorNote: '声场从地板向上扩，观众抬头那一瞬间它已经响。',
  },
  {
    id: 'longing',
    label: '思念',
    en: 'Longing',
    hue: '#A88FBF',
    blurb: '单簧管 + 弦乐铺底，旋律要会"够不着"。',
    signatureInstruments: ['clarinet', 'cello', 'guzheng'],
    directorNote: '《卧虎藏龙》：东方的思念是悬而未落。',
  },
  {
    id: 'joy',
    label: '喜悦',
    en: 'Joy',
    hue: '#E8B86A',
    blurb: '大调 + 木管跳跃 + 拨弦律动，重音落在弱拍。',
    signatureInstruments: ['flute', 'piano', 'pizzicato-strings'],
    directorNote: '不要堆配器，让节奏自己笑。',
  },
  {
    id: 'playful',
    label: '嬉戏',
    en: 'Playful',
    hue: '#E8966B',
    blurb: '短笛 + 木琴 + 拨弦低音，结尾不收，留一个翻白眼。',
    signatureInstruments: ['flute', 'xylophone', 'pizzicato-strings'],
    directorNote: '皮克斯/久石让：节奏感重于旋律。',
  },
  {
    id: 'romance',
    label: '浪漫',
    en: 'Romance',
    hue: '#D88FA8',
    blurb: '弦乐合奏 + 双簧管独白，要听见呼吸而不是技巧。',
    signatureInstruments: ['violin', 'oboe', 'piano'],
    directorNote: '《色戒》《在云端》：浪漫的反面是孤独，不是大旋律。',
  },
  {
    id: 'epic',
    label: '史诗',
    en: 'Epic',
    hue: '#7FB6D0',
    blurb: '铜管堆叠 + 大鼓 + 合唱，但 hit point 比响度重要。',
    signatureInstruments: ['french-horn', 'timpani', 'choir'],
    directorNote: '汉斯·季默：先压低，再炸。没有压低就没有史诗。',
  },
  {
    id: 'void',
    label: '虚无',
    en: 'Void',
    hue: '#6B6B7A',
    blurb: '极简合成 pad + 偶发钢琴单音，节拍消失。',
    signatureInstruments: ['synth-pad', 'piano', 'guqin'],
    directorNote: '《2001 太空漫游》《一一》：让声音变成空气厚度。',
  },
];

export function getEmotion(id: EmotionId): Emotion {
  const e = EMOTIONS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown emotion: ${id}`);
  return e;
}

/* -------------------------------------------------------------------------- */
/*  Preview phrases                                                           */
/* -------------------------------------------------------------------------- */

export type PreviewNote = {
  inst: string;             // instrument id (SAMPLERS or RECIPES in synth.ts)
  note: string | string[];  // single note or a chord
  dur: string;              // Tone beat string ('8n', '4n', '1n', ...)
  at: number;               // seconds from preview start
  vel?: number;             // 0..1
};

/**
 * A short, emotion-specific phrase for the home-page "听一下" preview, played
 * through compositionPlayer (see emotionToComposition). Each is a distinct
 * mode / register / rhythm on the emotion's own signature instruments — so
 * joy ≠ playful and romance ≠ suspense even when they share a lead instrument.
 * Previously the preview just played the first signature instrument's generic
 * phrase, which made those pairs sound identical.
 */
export const EMOTION_PREVIEWS: Record<EmotionId, PreviewNote[]> = {
  // 紧张 — low pulsing cell + tritone drone, accelerating into a drum hit.
  tension: [
    { inst: 'synth-pad', note: ['C2', 'F#2'], dur: '1n', at: 0, vel: 0.28 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 0,   vel: 0.4 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 0.7, vel: 0.46 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 1.3, vel: 0.52 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 1.8, vel: 0.58 },
    { inst: 'cello', note: 'C#2', dur: '8n', at: 2.3, vel: 0.64 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 2.7, vel: 0.7 },
    { inst: 'cello', note: 'C#2', dur: '4n', at: 3.1, vel: 0.78 },
    { inst: 'taiko', note: 'C1',  dur: '4n', at: 3.4, vel: 0.7 },
  ],
  // 悬疑 — sparse: a piano tick, two celesta points, a thin high violin creep.
  suspense: [
    { inst: 'piano',   note: 'C3', dur: '4n', at: 0,   vel: 0.4 },
    { inst: 'celesta', note: 'G5', dur: '8n', at: 1.2, vel: 0.4 },
    { inst: 'celesta', note: 'G5', dur: '8n', at: 2.6, vel: 0.34 },
    { inst: 'violin',  note: 'E6', dur: '2n', at: 3.0, vel: 0.24 },
    { inst: 'piano',   note: 'C3', dur: '4n', at: 3.7, vel: 0.3 },
  ],
  // 恐惧 — formless low drone + low minor choir, no beat.
  dread: [
    { inst: 'synth-pad',  note: ['C2', 'G2'], dur: '1n', at: 0, vel: 0.3 },
    { inst: 'contrabass', note: 'C2', dur: '1n', at: 0,   vel: 0.34 },
    { inst: 'choir',      note: 'C3', dur: '1n', at: 1.0, vel: 0.24 },
    { inst: 'choir',      note: 'D#3', dur: '1n', at: 2.6, vel: 0.22 },
  ],
  // 悲悯 — descending cello line over sparse piano, breathing.
  sorrow: [
    { inst: 'cello', note: 'A3', dur: '2n',  at: 0,   vel: 0.55 },
    { inst: 'cello', note: 'F3', dur: '2n',  at: 1.8, vel: 0.5 },
    { inst: 'cello', note: 'E3', dur: '2n.', at: 3.4, vel: 0.42 },
    { inst: 'piano', note: ['A2', 'E3'], dur: '4n', at: 0,   vel: 0.3 },
    { inst: 'piano', note: ['F2', 'C3'], dur: '4n', at: 2.4, vel: 0.28 },
  ],
  // 庄严 — organ + low brass + slow timpani heartbeat (weight).
  solemn: [
    { inst: 'pipe-organ',  note: ['G2', 'C3'], dur: '1n', at: 0, vel: 0.32 },
    { inst: 'timpani',     note: 'C2', dur: '4n', at: 0,   vel: 0.5 },
    { inst: 'timpani',     note: 'C2', dur: '4n', at: 2.0, vel: 0.55 },
    { inst: 'french-horn', note: 'C3', dur: '2n', at: 0.5, vel: 0.5 },
    { inst: 'french-horn', note: 'D#3', dur: '2n.', at: 2.5, vel: 0.5 },
  ],
  // 神圣 — bright major organ+choir chord, rising celesta sparkle (light).
  sacred: [
    { inst: 'pipe-organ', note: ['C3', 'E3', 'G3'], dur: '1n', at: 0,   vel: 0.32 },
    { inst: 'choir',      note: ['C4', 'E4', 'G4'], dur: '1n', at: 0.4, vel: 0.28 },
    { inst: 'celesta',    note: 'C6', dur: '8n', at: 1.5, vel: 0.4 },
    { inst: 'celesta',    note: 'E6', dur: '8n', at: 1.9, vel: 0.4 },
    { inst: 'celesta',    note: 'G6', dur: '8n', at: 2.3, vel: 0.4 },
    { inst: 'celesta',    note: 'C7', dur: '4n', at: 2.8, vel: 0.45 },
  ],
  // 思念 — clarinet line that reaches but won't resolve, over cello + guzheng.
  longing: [
    { inst: 'cello',    note: 'C3', dur: '1n', at: 0, vel: 0.4 },
    { inst: 'clarinet', note: 'D4', dur: '4n',  at: 0.5, vel: 0.45 },
    { inst: 'clarinet', note: 'F4', dur: '4n',  at: 1.3, vel: 0.48 },
    { inst: 'clarinet', note: 'G4', dur: '2n',  at: 2.1, vel: 0.5 },
    { inst: 'clarinet', note: 'F4', dur: '2n.', at: 3.3, vel: 0.42 },
    { inst: 'guzheng',  note: 'A4', dur: '8n', at: 2.0, vel: 0.32 },
    { inst: 'guzheng',  note: 'C5', dur: '8n', at: 2.5, vel: 0.3 },
  ],
  // 喜悦 — major flute melody, lyrical 8th-notes, bouncy pizz + warm piano.
  joy: [
    { inst: 'flute', note: 'C5', dur: '8n', at: 0,   vel: 0.5 },
    { inst: 'flute', note: 'E5', dur: '8n', at: 0.4, vel: 0.5 },
    { inst: 'flute', note: 'G5', dur: '8n', at: 0.8, vel: 0.5 },
    { inst: 'flute', note: 'C6', dur: '8n', at: 1.2, vel: 0.55 },
    { inst: 'flute', note: 'A5', dur: '8n', at: 1.6, vel: 0.5 },
    { inst: 'flute', note: 'G5', dur: '4n', at: 2.0, vel: 0.5 },
    { inst: 'flute', note: 'E5', dur: '8n', at: 2.6, vel: 0.46 },
    { inst: 'flute', note: 'G5', dur: '4n', at: 3.0, vel: 0.52 },
    { inst: 'pizzicato-strings', note: 'C3', dur: '8n', at: 0,   vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'G3', dur: '8n', at: 0.8, vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'C3', dur: '8n', at: 1.6, vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'G3', dur: '8n', at: 2.4, vel: 0.45 },
    { inst: 'piano', note: ['C4', 'E4', 'G4'], dur: '4n', at: 0,   vel: 0.3 },
    { inst: 'piano', note: ['C4', 'F4', 'A4'], dur: '4n', at: 1.6, vel: 0.3 },
  ],
  // 嬉戏 — xylophone-led, staccato 16ths, mischievous; ends UNcollected on F#.
  playful: [
    { inst: 'xylophone', note: 'C5',  dur: '16n', at: 0,    vel: 0.5 },
    { inst: 'xylophone', note: 'D5',  dur: '16n', at: 0.25, vel: 0.5 },
    { inst: 'xylophone', note: 'E5',  dur: '16n', at: 0.5,  vel: 0.5 },
    { inst: 'xylophone', note: 'G5',  dur: '8n',  at: 0.8,  vel: 0.55 },
    { inst: 'xylophone', note: 'E5',  dur: '16n', at: 1.3,  vel: 0.45 },
    { inst: 'xylophone', note: 'C5',  dur: '16n', at: 1.55, vel: 0.45 },
    { inst: 'xylophone', note: 'G5',  dur: '8n',  at: 2.0,  vel: 0.5 },
    { inst: 'pizzicato-strings', note: 'G2', dur: '8n', at: 0,   vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'G2', dur: '8n', at: 0.5, vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'D3', dur: '8n', at: 1.0, vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'G2', dur: '8n', at: 1.5, vel: 0.45 },
    { inst: 'pizzicato-strings', note: 'D3', dur: '8n', at: 2.0, vel: 0.45 },
    { inst: 'flute',     note: 'A5',  dur: '16n', at: 2.4, vel: 0.4 },
    { inst: 'flute',     note: 'F5',  dur: '16n', at: 2.6, vel: 0.4 },
    { inst: 'xylophone', note: 'F#5', dur: '8n',  at: 3.0, vel: 0.5 },
  ],
  // 浪漫 — warm violin melody over piano chords + an oboe counter-voice.
  romance: [
    { inst: 'piano',  note: ['F3', 'A3', 'C4'], dur: '2n', at: 0,   vel: 0.3 },
    { inst: 'piano',  note: ['E3', 'G3', 'C4'], dur: '2n', at: 2.0, vel: 0.3 },
    { inst: 'violin', note: 'A4', dur: '4n.', at: 0.3, vel: 0.45 },
    { inst: 'violin', note: 'C5', dur: '4n',  at: 1.1, vel: 0.5 },
    { inst: 'violin', note: 'D5', dur: '2n',  at: 1.8, vel: 0.52 },
    { inst: 'violin', note: 'C5', dur: '4n.', at: 3.0, vel: 0.45 },
    { inst: 'oboe',   note: 'F4', dur: '2n',  at: 2.3, vel: 0.34 },
  ],
  // 史诗 — "压低再炸": quiet timpani build, then brass + drum + choir hit.
  epic: [
    { inst: 'timpani',     note: 'C2', dur: '4n', at: 0,   vel: 0.32 },
    { inst: 'timpani',     note: 'C2', dur: '4n', at: 1.0, vel: 0.4 },
    { inst: 'french-horn', note: ['C3', 'G3'], dur: '2n', at: 2.0, vel: 0.5 },
    { inst: 'timpani',     note: 'C2', dur: '4n', at: 3.0, vel: 0.85 },
    { inst: 'choir',       note: ['C4', 'G4'], dur: '1n', at: 3.0, vel: 0.4 },
    { inst: 'french-horn', note: 'C4', dur: '2n', at: 3.2, vel: 0.7 },
  ],
  // 虚无 — minimal pad + one lone guqin pluck + a distant piano note, no beat.
  void: [
    { inst: 'synth-pad', note: ['C3', 'G3'], dur: '1n', at: 0, vel: 0.24 },
    { inst: 'guqin',     note: 'C3', dur: '2n.', at: 1.0, vel: 0.32 },
    { inst: 'piano',     note: 'G3', dur: '2n',  at: 3.2, vel: 0.2 },
  ],
};
