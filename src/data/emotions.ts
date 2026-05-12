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
