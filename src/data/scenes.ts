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
    instruments: ['contrabass', 'cello', 'french-horn', 'timpani'],
    annotations: [
      { at: 0,  text: '低音提琴只有两个音——E 与 F，相邻半音。极轻、极稀，还不是"鲨鱼"，是远方的预感。', track: 'mx' },
      { at: 8,  text: '音程收紧、力度抬起；定音鼓的心跳从水面下浮上来——它在靠近。', track: 'fx' },
      { at: 16, text: '圆号鸣起，铜管半音浪一波波往上推，大提琴在底下垫住——乐队开始翻搅。', track: 'mx' },
      { at: 24, text: '全奏炸开、定音鼓连击，两个音逼到最密——"它"已经在画面里。', track: 'mx' },
    ],
    durationSec: 30,
    tracks: {
      mx: [
        // The two-note shark cell (E–F semitone), accelerating + crescendoing
        // across four phases — Williams' actual structural device.
        // Floor raised from .28 — sub-bass at pp is inaudible on laptop
        // speakers and the opening read as dead air. Crescendo slope kept.
        ...jawsPulse(0,  8,  1.4,  0.42, 0.12),
        ...jawsPulse(8,  16, 0.7,  0.54, 0.14),
        ...jawsPulse(16, 24, 0.42, 0.68, 0.16),
        ...jawsPulse(24, 30, 0.28, 0.84, 0.16),
        // Cellos add low weight under the build — slow swells on the same E–F.
        { inst: 'cello', note: 'E2', dur: '1n', at: 16, vel: 0.4 },
        { inst: 'cello', note: 'F2', dur: '1n', at: 20, vel: 0.5 },
        { inst: 'cello', note: 'E2', dur: '1n', at: 24, vel: 0.62 },
        { inst: 'cello', note: 'F2', dur: '2n', at: 28, vel: 0.72 },
        // French-horn chromatic surges — the churning brass waves cresting
        // toward the attack; each wave climbs a half-step, louder than the last.
        ...brassSurge(16, ['F3', 'F#3', 'G3'],  1.3, 0.4,  0.2),
        ...brassSurge(21, ['G3', 'G#3', 'A3'],  1.1, 0.5,  0.26),
        ...brassSurge(26, ['A3', 'A#3', 'C4'],  1.0, 0.62, 0.36),
        { inst: 'french-horn', note: 'C4', dur: '2n', at: 28.8, vel: 0.88 },
      ],
      fx: [
        // Timpani heartbeat — on the motif's E, intensifying, then heavy
        // doubled hits at the climax.
        { inst: 'timpani', note: 'E2', dur: '4n', at: 8,    vel: 0.4 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 10,   vel: 0.46 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 12,   vel: 0.52 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 14,   vel: 0.58 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 16,   vel: 0.66 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 18,   vel: 0.72 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 20,   vel: 0.8 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 22,   vel: 0.86 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 24,   vel: 0.92 },
        { inst: 'timpani', note: 'E2', dur: '4n', at: 25.5, vel: 0.95 },
        { inst: 'timpani', note: 'F2', dur: '4n', at: 27,   vel: 0.98 },
        { inst: 'timpani', note: 'E2', dur: '2n', at: 28.5, vel: 1.0 },
      ],
      nx: [
        // Deep-water bed: a low open fifth with a mid-register shimmer an
        // octave up so small speakers hear *something* from bar one; cello
        // sub joins at the climax to thicken the bottom.
        { inst: 'synth-pad', note: ['E2', 'B2'], startAt: 0, endAt: 30, vel: 0.18 },
        { inst: 'synth-pad', note: ['E3', 'B3'], startAt: 0, endAt: 30, vel: 0.08 },
        { inst: 'cello', note: 'E2', startAt: 22, endAt: 30, vel: 0.16 },
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
    annotations: [
      { at: 0,  text: '大提琴单音起句，五声音阶——李慕白的"沉"。', track: 'mx' },
      { at: 6,  text: '二胡在四度之上接进来——玉娇龙。两条旋律一问一答、靠近又不重合。', track: 'mx' },
      { at: 13, text: '古筝拨弦像竹叶落下，点在旋律的缝里。', track: 'fx' },
      { at: 20, text: '两个动机收到同一个音上，长笛把它们抬进风里。', track: 'mx' },
    ],
    durationSec: 28,
    tracks: {
      mx: [
        // 李慕白 — solo cello, D-minor pentatonic (D F G A C), a long lyrical arc.
        { inst: 'cello', note: 'D3', dur: '2n',  at: 0,  vel: 0.62 },
        { inst: 'cello', note: 'F3', dur: '4n.', at: 3,  vel: 0.6 },
        { inst: 'cello', note: 'G3', dur: '4n',  at: 5,  vel: 0.58 },
        { inst: 'cello', note: 'A3', dur: '2n',  at: 7,  vel: 0.62 },
        { inst: 'cello', note: 'G3', dur: '4n',  at: 10, vel: 0.55 },
        { inst: 'cello', note: 'F3', dur: '4n.', at: 12, vel: 0.52 },
        { inst: 'cello', note: 'D3', dur: '1n',  at: 15, vel: 0.5 },
        // 玉娇龙 — erhu a 4th/5th above, answering then chasing.
        { inst: 'erhu', note: 'A4', dur: '2n',  at: 6,  vel: 0.5 },
        { inst: 'erhu', note: 'C5', dur: '4n.', at: 9,  vel: 0.55 },
        { inst: 'erhu', note: 'A4', dur: '4n',  at: 11, vel: 0.5 },
        { inst: 'erhu', note: 'G4', dur: '2n',  at: 13, vel: 0.48 },
        { inst: 'erhu', note: 'F4', dur: '4n.', at: 16, vel: 0.45 },
        // Convergence — both land on D an octave apart; flute lifts them off.
        { inst: 'cello', note: 'D4', dur: '2n.', at: 20, vel: 0.6 },
        { inst: 'erhu',  note: 'D5', dur: '2n.', at: 20, vel: 0.55 },
        { inst: 'flute', note: 'A5', dur: '1n',  at: 22, vel: 0.4 },
        { inst: 'flute', note: 'G5', dur: '2n',  at: 26, vel: 0.36 },
      ],
      fx: [
        // 古筝 — bamboo-leaf plucks scattered in the gaps (8n so each pluck
        // rings out instead of being choked to a click).
        { inst: 'guzheng', note: 'A4', dur: '8n', at: 8.5,  vel: 0.45 },
        { inst: 'guzheng', note: 'C5', dur: '8n', at: 9.2,  vel: 0.5 },
        { inst: 'guzheng', note: 'D5', dur: '8n', at: 13,   vel: 0.5 },
        { inst: 'guzheng', note: 'A4', dur: '8n', at: 13.6, vel: 0.42 },
        { inst: 'guzheng', note: 'G5', dur: '8n', at: 17.5, vel: 0.48 },
        { inst: 'guzheng', note: 'C5', dur: '8n', at: 18.2, vel: 0.4 },
        { inst: 'guzheng', note: 'A4', dur: '8n', at: 23,   vel: 0.4 },
        { inst: 'guzheng', note: 'D5', dur: '8n', at: 23.7, vel: 0.45 },
      ],
      nx: [
        // Bamboo wind — open-fifth pad bed, a second layer opening up midway.
        { inst: 'synth-pad', note: ['D2', 'A2'], startAt: 0,  endAt: 28, vel: 0.14 },
        { inst: 'synth-pad', note: ['A2', 'D3'], startAt: 10, endAt: 28, vel: 0.1 },
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
    annotations: [
      { at: 0,  text: '只有淋浴水声、完全无配乐。希区柯克本来觉得这就够了。', track: 'nx' },
      { at: 8,  text: 'STINGER 1：高音区小提琴小二度尖叫——观众先于画面被"刺"中。', track: 'fx' },
      { at: 9,  text: '剪辑硬切与配乐落点同步，是观众"觉得"看见了血的原因。' },
      { at: 11, text: 'STINGER 群：连续打击模拟刀子的节奏，低音弦在底下顶。', track: 'fx' },
      { at: 18, text: '小提琴下行线条，一切归于水声。', track: 'mx' },
    ],
    durationSec: 22,
    tracks: {
      mx: [
        // 下行收束 — high strings descend and fade back to the "water".
        { inst: 'violin', note: 'A5', dur: '4n', at: 18,   vel: 0.42 },
        { inst: 'violin', note: 'F5', dur: '4n', at: 18.8, vel: 0.4 },
        { inst: 'violin', note: 'D5', dur: '4n', at: 19.6, vel: 0.36 },
        { inst: 'violin', note: 'A4', dur: '2n', at: 20.4, vel: 0.3 },
        { inst: 'cello',  note: 'A2', dur: '1n', at: 18,   vel: 0.3 },
      ],
      fx: [
        // The shriek group — minor-2nd violin stabs over a low string stab,
        // accelerating + crescendoing like the knife.
        ...buildPsychoStinger(8,    0.85),
        ...buildPsychoStinger(9.1,  0.7),
        ...buildPsychoStinger(10,   0.9),
        ...buildPsychoStinger(10.8, 0.82),
        ...buildPsychoStinger(11.5, 0.92),
        ...buildPsychoStinger(12.3, 0.85),
        ...buildPsychoStinger(13.2, 0.95),
        ...buildPsychoStinger(14.2, 0.88),
        ...buildPsychoStinger(15.4, 1.0),
      ],
      nx: [
        // Shower "water" — no noise source yet; a low room tone + a barely-there
        // high airy pad stand in for the running water until the stabs hit.
        { inst: 'cello', note: 'C2', startAt: 0, endAt: 22, vel: 0.1 },
        { inst: 'synth-pad', note: ['A4', 'E5'], startAt: 0, endAt: 16, vel: 0.05 },
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
    annotations: [
      { at: 0,  text: '管风琴踏下一个 C，pedal tone——它从此 36 秒一动不动。', track: 'mx' },
      { at: 10, text: '管风琴在 pedal 上方奏出上行琶音动机，大提琴移动和声——那个 C 始终在响。', track: 'mx' },
      { at: 20, text: '小提琴爬升进入，情绪外显；pedal 仍然不动。', track: 'mx' },
      { at: 28, text: '圆号与人声叠上来，全乐团围着那个 C 共振——引力。', track: 'mx' },
    ],
    durationSec: 36,
    tracks: {
      mx: [
        // Pedal tone — organ holds C3 the entire scene (the gravity).
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 0,  vel: 0.42 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 6,  vel: 0.44 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 12, vel: 0.48 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 18, vel: 0.52 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 24, vel: 0.56 },
        { inst: 'pipe-organ', note: 'C3', dur: '1n', at: 30, vel: 0.5 },
        // The rising arpeggio motif over the pedal — enters at 10, recurring
        // and growing. The recognisable Interstellar figure.
        ...interstellarArp(10, 0.4),
        ...interstellarArp(20, 0.48),
        ...interstellarArp(28, 0.56),
        // Cello harmony moving above the pedal.
        { inst: 'cello', note: 'E3', dur: '1n', at: 6,  vel: 0.5 },
        { inst: 'cello', note: 'G3', dur: '1n', at: 12, vel: 0.55 },
        { inst: 'cello', note: 'F3', dur: '1n', at: 18, vel: 0.55 },
        { inst: 'cello', note: 'A3', dur: '1n', at: 24, vel: 0.6 },
        { inst: 'cello', note: 'G3', dur: '1n', at: 30, vel: 0.55 },
        // Violin ascending line — emotional externalisation.
        { inst: 'violin', note: 'C5', dur: '2n.', at: 20, vel: 0.38 },
        { inst: 'violin', note: 'E5', dur: '2n.', at: 23, vel: 0.42 },
        { inst: 'violin', note: 'G5', dur: '1n',  at: 26, vel: 0.46 },
        { inst: 'violin', note: 'E5', dur: '1n',  at: 30, vel: 0.42 },
        // French horn joins for the climax.
        { inst: 'french-horn', note: 'C4', dur: '1n', at: 28, vel: 0.55 },
        { inst: 'french-horn', note: 'E4', dur: '1n', at: 32, vel: 0.6 },
      ],
      fx: [],
      nx: [
        // Sub-bass gravity bed + a faint choir "cosmos" entering at the climax.
        { inst: 'synth-pad', note: ['C2', 'G2'], startAt: 0,  endAt: 36, vel: 0.16 },
        { inst: 'choir',     note: ['C4', 'G4'], startAt: 26, endAt: 36, vel: 0.12 },
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
    instruments: ['trumpet', 'french-horn', 'cello', 'contrabass'],
    annotations: [
      { at: 0,  text: '低音提琴 + 大提琴的稳定步伐——葬礼队伍，速度被它定死。', track: 'mx' },
      { at: 5,  text: '小号独白进入——西西里的哀歌，d 小调。', track: 'mx' },
      { at: 17, text: '圆号接住小号、低八度应答——家族与个人的对位。', track: 'mx' },
      { at: 25, text: '全部沉到主音上，步伐继续——队伍走出画面。', track: 'mx' },
    ],
    durationSec: 30,
    tracks: {
      mx: [
        // 步伐 — slow march bass walk (cello) + contrabass on the downbeats.
        ...buildSlowMarchBass(0, 28, 1.5),
        { inst: 'contrabass', note: 'D2', dur: '2n', at: 0,  vel: 0.5 },
        { inst: 'contrabass', note: 'D2', dur: '2n', at: 6,  vel: 0.5 },
        { inst: 'contrabass', note: 'A2', dur: '2n', at: 12, vel: 0.5 },
        { inst: 'contrabass', note: 'D2', dur: '2n', at: 18, vel: 0.52 },
        { inst: 'contrabass', note: 'D2', dur: '1n', at: 24, vel: 0.5 },
        // 小号哀歌 — Sicilian lament in D minor (evocative, not a transcription).
        { inst: 'trumpet', note: 'D4', dur: '4n.', at: 5,    vel: 0.58 },
        { inst: 'trumpet', note: 'A4', dur: '4n',  at: 7,    vel: 0.64 },
        { inst: 'trumpet', note: 'F4', dur: '2n',  at: 8.5,  vel: 0.62 },
        { inst: 'trumpet', note: 'E4', dur: '4n',  at: 10.5, vel: 0.56 },
        { inst: 'trumpet', note: 'D4', dur: '4n.', at: 11.5, vel: 0.54 },
        { inst: 'trumpet', note: 'F4', dur: '4n',  at: 13.5, vel: 0.6 },
        { inst: 'trumpet', note: 'A4', dur: '2n',  at: 14.5, vel: 0.66 },
        { inst: 'trumpet', note: 'G4', dur: '4n',  at: 16.5, vel: 0.58 },
        { inst: 'trumpet', note: 'F4', dur: '2n.', at: 17.5, vel: 0.52 },
        // 圆号应答 — French horn answers a register below.
        { inst: 'french-horn', note: 'D3', dur: '4n.', at: 17,   vel: 0.5 },
        { inst: 'french-horn', note: 'F3', dur: '4n',  at: 19,   vel: 0.52 },
        { inst: 'french-horn', note: 'A3', dur: '2n',  at: 20.5, vel: 0.56 },
        { inst: 'french-horn', note: 'F3', dur: '2n',  at: 23,   vel: 0.5 },
        { inst: 'french-horn', note: 'D3', dur: '1n',  at: 25.5, vel: 0.48 },
        // 主音收束 — trumpet settles on the tonic.
        { inst: 'trumpet', note: 'D4', dur: '1n', at: 25, vel: 0.5 },
      ],
      fx: [],
      nx: [
        // String bed — sustained D-minor underneath the procession.
        { inst: 'synth-pad', note: ['D2', 'A2'], startAt: 0, endAt: 30, vel: 0.13 },
        { inst: 'cello', note: 'D3', startAt: 4, endAt: 30, vel: 0.12 },
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

/** The Jaws cell: E2/F2 alternating every `interval`s across [start,end),
 *  velocity ramping base→base+rise. Semitone + accelerando is the whole motif. */
function jawsPulse(start: number, end: number, interval: number, base: number, rise: number): ComposedNote[] {
  const out: ComposedNote[] = [];
  const span = Math.max(1, end - start);
  let t = start;
  let flip = false;
  while (t < end - 1e-6) {
    out.push({
      inst: 'contrabass',
      note: flip ? 'F2' : 'E2',
      dur: '8n',
      at: +t.toFixed(2),
      vel: +Math.min(1, base + rise * ((t - start) / span)).toFixed(2),
    });
    flip = !flip;
    t += interval;
  }
  return out;
}

/** A rising chromatic brass swell: each note a half-step up, the last held longer. */
function brassSurge(start: number, notes: string[], step: number, base: number, rise: number): ComposedNote[] {
  return notes.map((note, i) => ({
    inst: 'french-horn',
    note,
    dur: i === notes.length - 1 ? '2n' : '4n',
    at: +(start + i * step).toFixed(2),
    vel: +Math.min(1, base + rise * (i / Math.max(1, notes.length - 1))).toFixed(2),
  }));
}

/** A Psycho stab: a high minor-2nd violin shriek (the dissonance) stacked over
 *  a low string stab, all near-simultaneous — the "neural jolt", not a knife. */
function buildPsychoStinger(at: number, vel: number): SfxHit[] {
  return [
    { inst: 'violin', note: 'E6', dur: '16n', at,            vel },
    { inst: 'violin', note: 'F6', dur: '16n', at: at + 0.02, vel: vel * 0.96 }, // minor 2nd above
    { inst: 'violin', note: 'A6', dur: '32n', at: at + 0.04, vel: vel * 0.8 },
    { inst: 'cello',  note: 'A2', dur: '8n',  at: at + 0.05, vel: vel * 0.85 },
    { inst: 'contrabass', note: 'E2', dur: '8n', at: at + 0.05, vel: vel * 0.7 },
  ];
}

/** Interstellar rising arpeggio over the pedal: C4–E4–G4–C5 on the organ. */
function interstellarArp(start: number, vel: number): ComposedNote[] {
  const fig: Array<[string, string, number]> = [
    ['C4', '4n', 0], ['E4', '4n', 1.2], ['G4', '4n', 2.4], ['C5', '2n', 3.6],
  ];
  return fig.map(([note, dur, off]) => ({
    inst: 'pipe-organ',
    note,
    dur,
    at: +(start + off).toFixed(2),
    vel: +Math.min(1, vel * (0.85 + off / 8)).toFixed(2),
  }));
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
