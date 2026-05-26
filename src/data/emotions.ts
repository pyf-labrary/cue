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
  /** Path (relative to BASE_URL) of the 15s instrumental preview mp3 played by
   *  the home-page "听一下" button. Generated with MiniMax music 2.6. */
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
    loop: 'emotions/tension.mp3',
    blurb: '低频持续 + 不解决的和声 = 心率上扬。',
    signatureInstruments: ['cello', 'taiko', 'synth-pad'],
    directorNote: '别用旋律，用质感。让观众发现自己在屏息。',
  },
  {
    id: 'suspense',
    label: '悬疑',
    en: 'Suspense',
    hue: '#B89B5B',
    loop: 'emotions/suspense.mp3',
    blurb: '小提琴极弱奏 + 钢琴单音点击，留白比声音重要。',
    signatureInstruments: ['violin', 'piano', 'celesta'],
    directorNote: '希区柯克：让炸弹在桌下，让观众听见秒针。',
  },
  {
    id: 'dread',
    label: '恐惧',
    en: 'Dread',
    hue: '#7B5BA3',
    loop: 'emotions/dread.mp3',
    blurb: '低音 drone + 反向钹 + 极低吟唱，无明确节拍。',
    signatureInstruments: ['contrabass', 'choir', 'synth-pad'],
    directorNote: '《狩猎》《遗传厄运》：节奏越模糊，恐惧越深。',
  },
  {
    id: 'sorrow',
    label: '悲悯',
    en: 'Sorrow',
    hue: '#5B7FB0',
    loop: 'emotions/sorrow.mp3',
    blurb: '大提琴长线条 + 钢琴疏落和弦，呼吸感是关键。',
    signatureInstruments: ['cello', 'piano', 'erhu'],
    directorNote: '不要让乐曲哭，让画面哭。',
  },
  {
    id: 'solemn',
    label: '庄严',
    en: 'Solemn',
    hue: '#6B8C8A',
    loop: 'emotions/solemn.mp3',
    blurb: '铜管低声部 + 定音鼓极慢心跳。',
    signatureInstruments: ['french-horn', 'timpani', 'pipe-organ'],
    directorNote: '《教父》《沙丘》：低音域给重量，留白给敬畏。',
  },
  {
    id: 'sacred',
    label: '神圣',
    en: 'Sacred',
    hue: '#C9B27F',
    loop: 'emotions/sacred.mp3',
    blurb: '人声合唱 + 管风琴 + 高频闪光，自下而上的光。',
    signatureInstruments: ['choir', 'pipe-organ', 'celesta'],
    directorNote: '声场从地板向上扩，观众抬头那一瞬间它已经响。',
  },
  {
    id: 'longing',
    label: '思念',
    en: 'Longing',
    hue: '#A88FBF',
    loop: 'emotions/longing.mp3',
    blurb: '单簧管 + 弦乐铺底，旋律要会"够不着"。',
    signatureInstruments: ['clarinet', 'cello', 'guzheng'],
    directorNote: '《卧虎藏龙》：东方的思念是悬而未落。',
  },
  {
    id: 'joy',
    label: '喜悦',
    en: 'Joy',
    hue: '#E8B86A',
    loop: 'emotions/joy.mp3',
    blurb: '大调 + 木管跳跃 + 拨弦律动，重音落在弱拍。',
    signatureInstruments: ['flute', 'piano', 'pizzicato-strings'],
    directorNote: '不要堆配器，让节奏自己笑。',
  },
  {
    id: 'playful',
    label: '嬉戏',
    en: 'Playful',
    hue: '#E8966B',
    loop: 'emotions/playful.mp3',
    blurb: '短笛 + 木琴 + 拨弦低音，结尾不收，留一个翻白眼。',
    signatureInstruments: ['flute', 'xylophone', 'pizzicato-strings'],
    directorNote: '皮克斯/久石让：节奏感重于旋律。',
  },
  {
    id: 'romance',
    label: '浪漫',
    en: 'Romance',
    hue: '#D88FA8',
    loop: 'emotions/romance.mp3',
    blurb: '弦乐合奏 + 双簧管独白，要听见呼吸而不是技巧。',
    signatureInstruments: ['violin', 'oboe', 'piano'],
    directorNote: '《色戒》《在云端》：浪漫的反面是孤独，不是大旋律。',
  },
  {
    id: 'epic',
    label: '史诗',
    en: 'Epic',
    hue: '#7FB6D0',
    loop: 'emotions/epic.mp3',
    blurb: '铜管堆叠 + 大鼓 + 合唱，但 hit point 比响度重要。',
    signatureInstruments: ['french-horn', 'timpani', 'choir'],
    directorNote: '汉斯·季默：先压低，再炸。没有压低就没有史诗。',
  },
  {
    id: 'void',
    label: '虚无',
    en: 'Void',
    hue: '#6B6B7A',
    loop: 'emotions/void.mp3',
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
 * through compositionPlayer (see emotionToComposition). One instrument per
 * emotion (single timbre — cleaner than layering); the mood is carried by the
 * phrase's register / mode / rhythm. The 12 leads are all different instruments
 * so no two emotions collide — fixing the old bug where the preview played the
 * first signature instrument's generic phrase (joy/playful both flute,
 * suspense/romance both violin → identical).
 */
export const EMOTION_PREVIEWS: Record<EmotionId, PreviewNote[]> = {
  // Single timbre each — 12 distinct instruments, mood carried by the phrase
  // (register / mode / rhythm), so even the old collision pairs differ:
  // 喜悦=长笛 vs 嬉戏=木琴；浪漫=小提琴 vs 悬疑=钢琴。

  // 紧张 — cello: low minor-2nd pulse, accelerating + crescendoing, unresolved.
  tension: [
    { inst: 'cello', note: 'C2',  dur: '8n', at: 0,   vel: 0.42 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 0.7, vel: 0.48 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 1.3, vel: 0.54 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 1.8, vel: 0.6 },
    { inst: 'cello', note: 'C#2', dur: '8n', at: 2.3, vel: 0.66 },
    { inst: 'cello', note: 'C2',  dur: '8n', at: 2.7, vel: 0.72 },
    { inst: 'cello', note: 'C#2', dur: '4n', at: 3.1, vel: 0.82 },
  ],
  // 悬疑 — piano: single sparse notes with lots of air, a tritone unease (秒针).
  suspense: [
    { inst: 'piano', note: 'C3',  dur: '4n', at: 0,   vel: 0.42 },
    { inst: 'piano', note: 'C3',  dur: '4n', at: 1.4, vel: 0.34 },
    { inst: 'piano', note: 'F#3', dur: '8n', at: 2.8, vel: 0.4 },
    { inst: 'piano', note: 'C3',  dur: '4n', at: 3.8, vel: 0.3 },
  ],
  // 恐惧 — contrabass: formless very-low semitone clash, no beat.
  dread: [
    { inst: 'contrabass', note: 'C2',  dur: '1n',  at: 0,   vel: 0.42 },
    { inst: 'contrabass', note: 'C#2', dur: '2n.', at: 2.0, vel: 0.4 },
    { inst: 'contrabass', note: 'C2',  dur: '1n',  at: 3.0, vel: 0.44 },
  ],
  // 悲悯 — erhu: a descending sighing line, breathing.
  sorrow: [
    { inst: 'erhu', note: 'A4', dur: '2n',  at: 0,   vel: 0.5 },
    { inst: 'erhu', note: 'F4', dur: '4n.', at: 1.6, vel: 0.46 },
    { inst: 'erhu', note: 'D4', dur: '2n.', at: 2.8, vel: 0.4 },
  ],
  // 庄严 — pipe-organ: two slow, heavy low chords (weight + awe).
  solemn: [
    { inst: 'pipe-organ', note: ['C3', 'G3'], dur: '1n', at: 0,   vel: 0.42 },
    { inst: 'pipe-organ', note: ['A2', 'E3'], dur: '1n', at: 2.2, vel: 0.42 },
  ],
  // 神圣 — choir: a rising, brightening major "aah" chord (light from below).
  sacred: [
    { inst: 'choir', note: 'C3', dur: '1n', at: 0,   vel: 0.3 },
    { inst: 'choir', note: ['C4', 'E4', 'G4'], dur: '1n', at: 0.6, vel: 0.32 },
    { inst: 'choir', note: ['C4', 'E4', 'G4', 'C5'], dur: '1n', at: 2.4, vel: 0.36 },
  ],
  // 思念 — clarinet: a line that reaches up and won't resolve (东方的悬而未落).
  longing: [
    { inst: 'clarinet', note: 'D4', dur: '4n',  at: 0,   vel: 0.45 },
    { inst: 'clarinet', note: 'F4', dur: '4n',  at: 0.8, vel: 0.48 },
    { inst: 'clarinet', note: 'G4', dur: '2n',  at: 1.6, vel: 0.5 },
    { inst: 'clarinet', note: 'A4', dur: '4n',  at: 2.8, vel: 0.46 },
    { inst: 'clarinet', note: 'G4', dur: '2n.', at: 3.6, vel: 0.4 },
  ],
  // 喜悦 — flute: lyrical major skip, resolves home (laughs).
  joy: [
    { inst: 'flute', note: 'C5', dur: '8n', at: 0,   vel: 0.5 },
    { inst: 'flute', note: 'E5', dur: '8n', at: 0.4, vel: 0.5 },
    { inst: 'flute', note: 'G5', dur: '8n', at: 0.8, vel: 0.5 },
    { inst: 'flute', note: 'C6', dur: '8n', at: 1.2, vel: 0.55 },
    { inst: 'flute', note: 'A5', dur: '8n', at: 1.6, vel: 0.5 },
    { inst: 'flute', note: 'G5', dur: '4n', at: 2.0, vel: 0.5 },
    { inst: 'flute', note: 'E5', dur: '8n', at: 2.6, vel: 0.46 },
    { inst: 'flute', note: 'C5', dur: '4n', at: 3.0, vel: 0.5 },
  ],
  // 嬉戏 — xylophone: staccato 16ths, mischievous; ends UNcollected on F#.
  playful: [
    { inst: 'xylophone', note: 'C5',  dur: '16n', at: 0,    vel: 0.5 },
    { inst: 'xylophone', note: 'D5',  dur: '16n', at: 0.25, vel: 0.5 },
    { inst: 'xylophone', note: 'E5',  dur: '16n', at: 0.5,  vel: 0.5 },
    { inst: 'xylophone', note: 'G5',  dur: '8n',  at: 0.8,  vel: 0.55 },
    { inst: 'xylophone', note: 'E5',  dur: '16n', at: 1.3,  vel: 0.45 },
    { inst: 'xylophone', note: 'C5',  dur: '16n', at: 1.55, vel: 0.45 },
    { inst: 'xylophone', note: 'G5',  dur: '8n',  at: 2.0,  vel: 0.5 },
    { inst: 'xylophone', note: 'A5',  dur: '16n', at: 2.5,  vel: 0.45 },
    { inst: 'xylophone', note: 'F#5', dur: '8n',  at: 3.0,  vel: 0.5 },
  ],
  // 浪漫 — violin: a warm, singing, rubato line.
  romance: [
    { inst: 'violin', note: 'A4', dur: '4n.', at: 0,   vel: 0.45 },
    { inst: 'violin', note: 'C5', dur: '4n',  at: 0.9, vel: 0.5 },
    { inst: 'violin', note: 'D5', dur: '2n',  at: 1.6, vel: 0.52 },
    { inst: 'violin', note: 'C5', dur: '4n',  at: 2.8, vel: 0.48 },
    { inst: 'violin', note: 'A4', dur: '2n.', at: 3.5, vel: 0.42 },
  ],
  // 史诗 — french-horn: a rising fanfare, "压低再炸" — soft low to a loud held top.
  epic: [
    { inst: 'french-horn', note: 'C3', dur: '4n', at: 0,   vel: 0.4 },
    { inst: 'french-horn', note: 'E3', dur: '4n', at: 0.8, vel: 0.45 },
    { inst: 'french-horn', note: 'G3', dur: '4n', at: 1.6, vel: 0.52 },
    { inst: 'french-horn', note: 'C4', dur: '2n', at: 2.4, vel: 0.7 },
    { inst: 'french-horn', note: 'E4', dur: '1n', at: 3.4, vel: 0.85 },
  ],
  // 虚无 — void-pad: a drifting, detuned sine pad swelling in a vast reverb,
  // with sparse high shimmers floating far above and a lone piano note dropped
  // into the silence (偶发钢琴单音). Long decay, big space, low dynamics, lots of
  // air — 空灵空寂，节拍消失. Replaces the old two thin guqin plucks.
  void: [
    { inst: 'void-pad', note: ['C3', 'G3'], dur: '1n',  at: 0,   vel: 0.34 },
    { inst: 'void-pad', note: 'G5',         dur: '2n.', at: 1.8, vel: 0.18 },
    { inst: 'piano',    note: 'C4',         dur: '2n',  at: 2.6, vel: 0.22 },
    { inst: 'void-pad', note: ['A2', 'E3'], dur: '1n',  at: 3.8, vel: 0.3  },
    { inst: 'void-pad', note: 'D5',         dur: '2n',  at: 5.6, vel: 0.16 },
    { inst: 'piano',    note: 'G4',         dur: '2n',  at: 6.6, vel: 0.18 },
  ],
};
