import type { EmotionId } from './emotions';

/**
 * 5-track convention used by the player:
 *   dx — dialogue (人声)
 *   mx — music
 *   fx — discrete effects (foley / impacts / stinger)
 *   nx — ambient / room / drone bed
 *   vo — narration / voice-over
 *
 * For the first batch of scenes we don't have real recordings, so each
 * scene's tracks are programmatically composed (Tone.js).
 */
export type TrackId = 'dx' | 'mx' | 'fx' | 'nx' | 'vo';

export const TRACK_META: Record<TrackId, { label: string; en: string; color: string; hint: string }> = {
  dx: { label: '对白',  en: 'DX', color: '#E89968', hint: '人声、对话' },
  mx: { label: '音乐',  en: 'MX', color: '#7FB6D0', hint: '配乐主旋律 + 和声' },
  fx: { label: '音效',  en: 'FX', color: '#D86B6B', hint: '门、刀、撞击、stinger 这类瞬时' },
  nx: { label: '环境',  en: 'NX', color: '#6BC9A6', hint: '风、室内、街道这类持续底纹' },
  vo: { label: '旁白',  en: 'VO', color: '#9B6BD8', hint: '画外音 / 旁白' },
};

export type SceneConcept =
  | 'ostinato'   // 反复短句
  | 'leitmotif'  // 主题动机
  | 'stinger'    // 一击式
  | 'drone'      // 持续低频
  | 'crescendo'  // 渐强爬升
  | 'pedal'      // 持续延音
  | 'march'      // 慢板进行曲
  | 'hit-point'  // 卡点击中
  | 'source';    // 戏内音源

export const CONCEPT_META: Record<SceneConcept, { label: string; def: string }> = {
  ostinato:  { label: 'Ostinato（反复短句）',         def: '同样的两三个音不停地重复，靠"持续"建立紧张感。' },
  leitmotif: { label: 'Leitmotif（主题动机）',         def: '专属于一个角色 / 一个想法的旋律片段，每次它出现，意味着"它"在场。' },
  stinger:   { label: 'Stinger（一击式）',             def: '一秒之内突然炸开的音响，多是弦乐齐奏 + 打击。剪辑硬切的伴生物。' },
  drone:     { label: 'Drone（持续低频）',             def: '不变的低音底板，把整个场景"压"在地板上。' },
  crescendo: { label: 'Crescendo（渐强爬升）',         def: '从 ppp 慢慢推到 fff，时间换张力。' },
  pedal:     { label: 'Pedal Tone（持续延音）',         def: '某一个音持续不放，上面叠和声移动。教堂感、宿命感的根源。' },
  march:     { label: 'Slow March（慢板进行曲）',       def: '稳定脉冲 + 低音 + 铜管。给场景加"重量"。' },
  'hit-point': { label: 'Hit Point（卡点击中）',        def: '配乐精确落在剪辑切点、画面动作上的那一拍。' },
  source:    { label: 'Source Music（戏内音源）',       def: '场景里收音机 / 留声机 / 街头乐手发出的音乐——观众和角色同时听见。' },
};

export type ComposedNote = {
  inst: string;        // instrument id (must exist in synth.ts SAMPLERS)
  note: string;        // "C4" / "G3" / "F#3"
  dur: string;         // "8n" / "4n" / "2n" / "1n"
  at: number;          // seconds from scene start
  vel?: number;        // 0..1
};

export type DroneLayer = {
  inst: string;
  note: string | string[];      // single note or chord (held throughout)
  startAt: number;
  endAt: number;
  vel?: number;
};

export type SfxHit = {
  /** Either a Tone synth recipe ('membrane-low' / 'noise-burst' / ...) or instrument id. */
  inst: string;
  note?: string;       // for membranes, the pitch
  dur: string;
  at: number;
  vel?: number;
};

export type Annotation = {
  at: number;          // seconds
  text: string;
  track?: TrackId;     // optional — highlight which lane this belongs to
};

export interface Scene {
  slug: string;
  title: string;
  film: string;
  year: number;
  composer: string;
  concept: SceneConcept;
  emotions: EmotionId[];
  description: string;
  instruments: string[];
  annotations: Annotation[];
  /** Total scene length in seconds. If mxAudio is present this matches the audio file. */
  durationSec: number;
  /**
   * URL to a pre-recorded MX (music) track (generated via MiniMax music-1.5
   * in scripts/gen-scene-music.py). When present, scenePlayer plays this real
   * recording for the MX lane instead of synthesising tracks.mx in-browser.
   * fx/nx synths still play on top as overlay layers.
   */
  mxAudio?: string;
  /** Gain (0..1) applied to mxAudio playback. */
  mxAudioGain?: number;
  tracks: {
    mx?: ComposedNote[];
    fx?: SfxHit[];
    nx?: DroneLayer[];
  };
}

/* -------------------------------------------------------------------------- */
/*  Scenes                                                                    */
/* -------------------------------------------------------------------------- */

export const SCENES: Scene[] = [
  /* --------------------------------- JAWS ---------------------------------- */
  {
    slug: 'jaws',
    title: '海里有东西',
    film: '大白鲨',
    year: 1975,
    composer: '约翰·威廉姆斯',
    concept: 'ostinato',
    emotions: ['dread', 'tension'],
    description:
      '威廉姆斯写"鲨鱼"主题时只用了两个音——E 和 F，半音关系。一开始稀疏，越来越密、越来越响——把"还没看见但正在接近"做成了听觉物理学。\n\n这条 ostinato 不是配乐，是心跳。它的设计目标只有一个：当画面切到水下视角，观众的脉搏自动跟着它加速。',
    instruments: ['contrabass', 'timpani', 'french-horn'],
    // TIMING NOTE: durationSec / annotation.at / fx.at / nx.{startAt,endAt}
    // were rescaled (×2.14) when MX was switched from the synth fallback
    // (24 s) to the AI mp3 (55.7 s). Linear scaling is approximate — listen
    // once and hand-tune around the timpani entry + horn climax.
    annotations: [
      { at: 0,   text: '低音提琴极轻、稀疏。还不是"鲨鱼"，是远方的预感。', track: 'mx' },
      { at: 13,  text: '间距收紧——鲨鱼在靠近。', track: 'mx' },
      { at: 26,  text: '定音鼓加入。心跳第一次浮出水面。', track: 'fx' },
      { at: 39,  text: '圆号长音叠在上面，"它"现在已经在画面里。', track: 'mx' },
    ],
    durationSec: 56,
    mxAudio: '/scenes/jaws/mx.mp3',
    mxAudioGain: 0.85,
    tracks: {
      mx: [
        // 4 phases: sparse → tighter → tight + horn → climax — only used
        // as visualisation source; real MX is the mp3.
        ...buildJawsOstinato(0,  13, 1.6, 'contrabass'),
        ...buildJawsOstinato(13, 26, 0.8, 'contrabass'),
        ...buildJawsOstinato(26, 39, 0.45, 'contrabass'),
        ...buildJawsOstinato(39, 52, 0.3, 'contrabass'),
        { inst: 'french-horn', note: 'C3',  dur: '1n', at: 39, vel: 0.5 },
        { inst: 'french-horn', note: 'D#3', dur: '1n', at: 47, vel: 0.6 },
      ],
      fx: [
        // Timpani heartbeat overlay — rescaled but quiet enough to leave to mxAudio.
        { inst: 'timpani', note: 'C2', dur: '4n', at: 26,   vel: 0.6 },
        { inst: 'timpani', note: 'C2', dur: '4n', at: 29,   vel: 0.65 },
        { inst: 'timpani', note: 'C2', dur: '4n', at: 32,   vel: 0.7 },
        { inst: 'timpani', note: 'C2', dur: '4n', at: 35,   vel: 0.75 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 39,   vel: 0.85 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 41.5, vel: 0.9 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 44,   vel: 0.95 },
        { inst: 'timpani', note: 'C2', dur: '2n', at: 47,   vel: 1.0 },
      ],
      nx: [
        { inst: 'cello', note: 'C2', startAt: 0, endAt: 54, vel: 0.18 },
      ],
    },
  },

  /* --------------------------- 卧虎藏龙 竹林 ------------------------------- */
  {
    slug: 'crouching-tiger-bamboo',
    title: '竹林独白',
    film: '卧虎藏龙',
    year: 2000,
    composer: '谭盾 / 马友友独奏',
    concept: 'leitmotif',
    emotions: ['longing', 'romance', 'void'],
    description:
      '李慕白与玉娇龙在竹海里对峙，但镜头拍的不是打——是风。谭盾用大提琴 + 二胡的对位写"李慕白"和"玉娇龙"两个主题动机，让两件乐器在 4 度音程上互相追逐又不重合。\n\n这是"用乐器写人物关系"的范本：不是配乐"配"动作，是动机"代替"对白。',
    instruments: ['cello', 'erhu', 'guzheng', 'flute'],
    // TIMING NOTE: rescaled ×1.85 (22 s → 40.7 s MX). Erhu entry + guzheng
    // shimmer + flute lift should be hand-tuned after a listen pass.
    annotations: [
      { at: 0,  text: '大提琴单音起句——李慕白的"沉"。', track: 'mx' },
      { at: 7,  text: '二胡接进来——玉娇龙。两件乐器是 4 度间距，听起来近又不重合。', track: 'mx' },
      { at: 19, text: '古筝拨弦点缀，像竹叶。', track: 'fx' },
      { at: 28, text: '两个主题靠到一起——长笛把他们抬上风里。', track: 'mx' },
    ],
    durationSec: 41,
    mxAudio: '/scenes/crouching-tiger-bamboo/mx.mp3',
    mxAudioGain: 0.85,
    tracks: {
      mx: [
        { inst: 'cello', note: 'D3', dur: '2n',  at: 0,   vel: 0.7 },
        { inst: 'cello', note: 'F3', dur: '2n',  at: 4,   vel: 0.7 },
        { inst: 'cello', note: 'G3', dur: '4n.', at: 7,   vel: 0.65 },
        { inst: 'cello', note: 'F3', dur: '2n',  at: 11,  vel: 0.6 },
        { inst: 'erhu',  note: 'G4', dur: '2n',  at: 7,   vel: 0.6 },
        { inst: 'erhu',  note: 'A4', dur: '4n.', at: 13,  vel: 0.65 },
        { inst: 'erhu',  note: 'G4', dur: '4n',  at: 17,  vel: 0.6 },
        { inst: 'erhu',  note: 'F4', dur: '2n',  at: 20,  vel: 0.55 },
        { inst: 'cello', note: 'D4', dur: '2n.', at: 28,  vel: 0.7 },
        { inst: 'erhu',  note: 'D5', dur: '2n.', at: 28,  vel: 0.6 },
        { inst: 'flute', note: 'A5', dur: '1n',  at: 31,  vel: 0.45 },
      ],
      fx: [
        { inst: 'guzheng', note: 'A4', dur: '16n', at: 19,   vel: 0.5 },
        { inst: 'guzheng', note: 'C5', dur: '16n', at: 19.6, vel: 0.55 },
        { inst: 'guzheng', note: 'D5', dur: '16n', at: 20,   vel: 0.6 },
        { inst: 'guzheng', note: 'G5', dur: '16n', at: 21.3, vel: 0.5 },
        { inst: 'guzheng', note: 'A4', dur: '16n', at: 24,   vel: 0.45 },
        { inst: 'guzheng', note: 'C5', dur: '16n', at: 24.8, vel: 0.5 },
      ],
      nx: [
        { inst: 'synth-pad', note: ['D3', 'A3'], startAt: 0, endAt: 39, vel: 0.15 },
      ],
    },
  },

  /* --------------------------- 惊魂记 浴室 -------------------------------- */
  {
    slug: 'psycho-shower',
    title: '浴室戏',
    film: '惊魂记',
    year: 1960,
    composer: '伯纳德·赫尔曼',
    concept: 'stinger',
    emotions: ['dread', 'tension'],
    description:
      '希区柯克原本想这场戏不要配乐——只用淋浴水声。赫尔曼坚持加上他写的弦乐尖刀，然后这场戏就变成了影史最常被引用的剪辑 + 配乐互锁案例。\n\n音乐设计是反直觉的："撞击"用的不是低频，是高音区小提琴齐奏 + 极快的下滑。它模仿的不是刀子的物理声，是"被刺中那一瞬间的神经反应"。',
    instruments: ['violin', 'cello', 'contrabass'],
    // TIMING NOTE: rescaled ×1.72 (18 s → 31 s MX). Stinger group anchors
    // should be hand-tuned to where the AI stabs actually land.
    annotations: [
      { at: 0,    text: '淋浴水声 + 完全无配乐。希区柯克最初想到这就够了。', track: 'nx' },
      { at: 10,   text: 'STINGER 1：小提琴尖刺——观众已被攻击。', track: 'fx' },
      { at: 11,   text: '剪辑硬切 + 配乐落点同步，是为什么观众"觉得"看见了血。' },
      { at: 14,   text: 'STINGER 群：六七次连续打击，模拟刀子的节奏。', track: 'fx' },
      { at: 24,   text: '下降弦乐线条——一切归于水声。', track: 'mx' },
    ],
    durationSec: 31,
    mxAudio: '/scenes/psycho-shower/mx.mp3',
    mxAudioGain: 0.85,
    tracks: {
      mx: [
        { inst: 'violin', note: 'A5', dur: '4n', at: 24,   vel: 0.4 },
        { inst: 'violin', note: 'F5', dur: '4n', at: 25,   vel: 0.4 },
        { inst: 'violin', note: 'D5', dur: '4n', at: 26,   vel: 0.4 },
        { inst: 'violin', note: 'A4', dur: '2n', at: 27,   vel: 0.35 },
      ],
      fx: [
        ...buildPsychoStinger(10,   0.9,  1.0),
        ...buildPsychoStinger(12,   0.7,  1.0),
        ...buildPsychoStinger(14,   0.95, 1.0),
        ...buildPsychoStinger(15,   0.85, 1.0),
        ...buildPsychoStinger(17,   0.9,  1.0),
        ...buildPsychoStinger(18,   0.95, 1.0),
        ...buildPsychoStinger(20,   0.8,  1.0),
        ...buildPsychoStinger(22,   1.0,  1.0),
      ],
      nx: [
        { inst: 'cello', note: 'C2', startAt: 0, endAt: 31, vel: 0.1 },
      ],
    },
  },

  /* --------------------------- 星际穿越 离别 ------------------------------ */
  {
    slug: 'interstellar-cooper-leaves',
    title: '父亲离开',
    film: '星际穿越',
    year: 2014,
    composer: '汉斯·季默',
    concept: 'pedal',
    emotions: ['sorrow', 'longing', 'epic'],
    description:
      'Cooper 把女儿留在地球，开车开向发射台。季默给这段戏的配置是：管风琴持续一个音（pedal tone）不动，上面叠弦乐和声慢慢移动。\n\n持续音 = 引力。无论 Cooper 走多远，那个音都还在响——这就是"父女之间的引力"的物理对应物。',
    instruments: ['pipe-organ', 'cello', 'violin', 'french-horn'],
    // TIMING NOTE: rescaled ×2.82 (26 s → 73 s MX). Pedal-on-C is steady
    // so most slippage is on the cello-harmony / violin-rise / horn entry
    // — listen + hand-tune.
    annotations: [
      { at: 0,  text: '管风琴 C pedal 进入——它从此 70 秒不动。', track: 'mx' },
      { at: 11, text: '大提琴在 pedal 上方移动和声——但 pedal 一直在。', track: 'mx' },
      { at: 34, text: '小提琴爬升进入——情绪外显，pedal 仍然不动。', track: 'mx' },
      { at: 51, text: '圆号长音叠加，全乐团围着那个 C 共振。', track: 'mx' },
    ],
    durationSec: 73,
    mxAudio: '/scenes/interstellar-cooper-leaves/mx.mp3',
    mxAudioGain: 0.8,
    tracks: {
      mx: [
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 0,  vel: 0.5 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 11, vel: 0.5 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 23, vel: 0.55 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 34, vel: 0.6 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 45, vel: 0.65 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 57, vel: 0.6 },
        { inst: 'cello', note: 'E3', dur: '1n', at: 11, vel: 0.55 },
        { inst: 'cello', note: 'G3', dur: '1n', at: 23, vel: 0.6 },
        { inst: 'cello', note: 'F3', dur: '1n', at: 34, vel: 0.6 },
        { inst: 'cello', note: 'A3', dur: '1n', at: 45, vel: 0.65 },
        { inst: 'cello', note: 'G3', dur: '1n', at: 57, vel: 0.6 },
        { inst: 'violin', note: 'C5', dur: '2n.', at: 34, vel: 0.4 },
        { inst: 'violin', note: 'E5', dur: '2n.', at: 40, vel: 0.45 },
        { inst: 'violin', note: 'G5', dur: '1n',  at: 48, vel: 0.5 },
        { inst: 'french-horn', note: 'C4', dur: '1n', at: 51, vel: 0.55 },
        { inst: 'french-horn', note: 'E4', dur: '1n', at: 62, vel: 0.6 },
      ],
      fx: [],
      nx: [
        { inst: 'synth-pad', note: ['C3', 'G3'], startAt: 0, endAt: 71, vel: 0.18 },
      ],
    },
  },

  /* --------------------------- 教父 葬礼 ---------------------------------- */
  {
    slug: 'godfather-funeral',
    title: '西西里葬礼',
    film: '教父',
    year: 1972,
    composer: '尼诺·罗塔',
    concept: 'march',
    emotions: ['solemn', 'sorrow'],
    description:
      '罗塔写的西西里主题是慢板进行曲——稳定的低音步伐 + 小号独白 + 弦乐铺底。配置极简，但每一个音都不可替代。\n\n葬礼场景的速度被音乐"定死"——演员的步伐、镜头的横摇、群众的呼吸都跟着这个节拍走。这是配乐控制场景物理时间的范本。',
    instruments: ['trumpet', 'cello', 'contrabass', 'french-horn'],
    // TIMING NOTE: rescaled ×1.47 (24 s → 35 s MX). Trumpet entry + horn
    // response are the two anchors to fine-tune by ear.
    annotations: [
      { at: 0,  text: '低音提琴 + 大提琴的稳定步伐——葬礼队伍。', track: 'mx' },
      { at: 6,  text: '小号独白进入——西西里主题。', track: 'mx' },
      { at: 21, text: '圆号合奏接住小号——家族 vs 个人的对位。', track: 'mx' },
    ],
    durationSec: 35,
    mxAudio: '/scenes/godfather-funeral/mx.mp3',
    mxAudioGain: 0.85,
    tracks: {
      mx: [
        ...buildSlowMarchBass(0, 33, 1.5),
        { inst: 'trumpet', note: 'D4', dur: '4n.', at: 6,    vel: 0.6 },
        { inst: 'trumpet', note: 'F4', dur: '4n',  at: 8,    vel: 0.65 },
        { inst: 'trumpet', note: 'A4', dur: '2n',  at: 10,   vel: 0.7 },
        { inst: 'trumpet', note: 'G4', dur: '4n.', at: 13,   vel: 0.65 },
        { inst: 'trumpet', note: 'F4', dur: '2n',  at: 15,   vel: 0.6 },
        { inst: 'trumpet', note: 'D4', dur: '2n.', at: 17,   vel: 0.55 },
        { inst: 'french-horn', note: 'A3', dur: '4n.', at: 21, vel: 0.55 },
        { inst: 'french-horn', note: 'D4', dur: '4n',  at: 23, vel: 0.55 },
        { inst: 'french-horn', note: 'F4', dur: '2n',  at: 24, vel: 0.6 },
        { inst: 'french-horn', note: 'D4', dur: '1n',  at: 27, vel: 0.55 },
      ],
      fx: [],
      nx: [
        { inst: 'cello', note: 'D2', startAt: 0, endAt: 33, vel: 0.18 },
      ],
    },
  },
];

export function getScene(slug: string): Scene | undefined {
  return SCENES.find((s) => s.slug === slug);
}

/* -------------------------------------------------------------------------- */
/*  Composition helpers                                                       */
/* -------------------------------------------------------------------------- */

/** Build a stretch of E-F-E-F ostinato on contrabass for the given window. */
function buildJawsOstinato(start: number, end: number, interval: number, inst: string): ComposedNote[] {
  const notes: ComposedNote[] = [];
  let t = start;
  let flip = false;
  while (t < end) {
    notes.push({
      inst,
      note: flip ? 'F2' : 'E2',
      dur: '8n',
      at: t,
      vel: 0.55 + Math.min(0.3, (t - start) / (end - start) * 0.3),
    });
    flip = !flip;
    t += interval;
  }
  return notes;
}

/** A Psycho-style stinger: high violin staccato + cello underneath, near-simultaneous. */
function buildPsychoStinger(at: number, vel: number, _gain: number): SfxHit[] {
  return [
    { inst: 'violin', note: 'A6', dur: '16n', at,        vel },
    { inst: 'violin', note: 'C7', dur: '16n', at: at + 0.04, vel: vel * 0.95 },
    { inst: 'cello',  note: 'A2', dur: '8n',  at: at + 0.05, vel: vel * 0.8 },
  ];
}

/** Slow march bass walk: low cello D + A alternation. */
function buildSlowMarchBass(start: number, end: number, step: number): ComposedNote[] {
  const notes: ComposedNote[] = [];
  let t = start;
  let i = 0;
  const pattern = ['D2', 'A2', 'D2', 'F2'];
  while (t < end) {
    notes.push({ inst: 'cello', note: pattern[i % pattern.length], dur: '4n.', at: t, vel: 0.55 });
    i++;
    t += step;
  }
  return notes;
}
