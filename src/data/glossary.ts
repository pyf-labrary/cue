/**
 * Glossary entries. Each entry has a term, a one-sentence definition,
 * an optional 3s demo (instrument id + short phrase) and an optional
 * film example to anchor the term in something the reader has heard.
 */
import type { ClipNote } from '@/lib/composition';

const N = (note: string, dur: string, at: number, vel = 0.75): ClipNote => ({ note, dur, at, vel });

export interface GlossaryEntry {
  term: string;
  en?: string;
  def: string;
  /** Optional 3s demo on a specific instrument. */
  demo?: {
    inst: string;
    notes?: ClipNote[];
    /** If kind=drone style. */
    hold?: string | string[];
    durSec: number;
    vel?: number;
  };
  /** Optional film anchor. */
  example?: string;
  /** Category for grouping. */
  cat: 'concept' | 'texture' | 'rhythm' | 'production' | 'instrument' | 'workflow';
}

export const GLOSSARY: GlossaryEntry[] = [
  /* ---- 概念 / concept ----------------------------------------------------- */
  {
    cat: 'concept',
    term: 'Underscore',
    en: 'under-score',
    def: '观众听得见、戏里角色听不见的配乐——最常见的配乐形式。',
    example: '《辛德勒的名单》几乎全片都是 underscore。',
  },
  {
    cat: 'concept',
    term: 'Source music',
    en: 'source / diegetic',
    def: '戏内来源的音乐——角色和观众一起听见。电台、留声机、街头乐手都是 source。',
    example: '《教父》开场西西里风笛是 source；后面的弦乐主题是 underscore。',
  },
  {
    cat: 'concept',
    term: 'Leitmotif',
    en: 'leitmotif',
    def: '专属于一个角色 / 一个想法的旋律动机。每次它响起，意味着"它"在场。',
    example: '《星球大战》达斯·维德的 Imperial March 是范本。',
  },
  {
    cat: 'concept',
    term: 'Theme',
    en: 'theme',
    def: '一段戏 / 一部片的主旋律——leitmotif 的"叙事尺度"放大版。一部片可以有 3-5 个 theme。',
  },
  {
    cat: 'concept',
    term: 'Motif',
    en: 'motif',
    def: '比 theme 更小的单元——2-3 个音的"种子"。Theme 是由 motif 长出来的。',
    example: 'Jaws 只有两个音 E-F，那就是它的 motif。',
  },
  {
    cat: 'concept',
    term: 'Diegetic / Non-diegetic',
    def: '术语对：diegetic = 戏内（source）；non-diegetic = 戏外（underscore）。Hybrid 是故意把两者切换。',
  },
  {
    cat: 'concept',
    term: 'Mickey-mousing',
    def: '配乐和动作 1:1 对应——画面里小球弹起来，音乐"哒"；画面下落，"哒"。卡通片常用，正剧用会出戏。',
  },
  {
    cat: 'concept',
    term: 'Spotting',
    def: '导演和作曲家一起看锁版剪辑，逐场决定"哪里要音乐、从哪一帧进、到哪一帧出"。配乐工作的起点。',
  },
  {
    cat: 'concept',
    term: 'Temp music',
    def: '剪辑期间用的"临时配乐"——拿现成的电影音乐先垫着。作曲家看到这个就知道导演想要什么气质，但 temp 经常喧宾夺主，是配乐界的灾难。',
  },

  /* ---- 织体 / texture ----------------------------------------------------- */
  {
    cat: 'texture',
    term: 'Drone',
    def: '不变的低音底板——把整个场景"压"在地板上。',
    example: '《沙丘》（2021）几乎一半的时间在 drone。',
    demo: { inst: 'pipe-organ', hold: 'C3', durSec: 3, vel: 0.5 },
  },
  {
    cat: 'texture',
    term: 'Pedal tone',
    def: '某一个音持续不放，上面叠和声移动——教堂感、宿命感的根源。',
    example: '《星际穿越》Cooper 离别那段，管风琴的 C 一直没动。',
    demo: { inst: 'pipe-organ', hold: 'C3', durSec: 3, vel: 0.55 },
  },
  {
    cat: 'texture',
    term: 'Pad',
    def: '柔软、长音、合成的"垫子"。和 drone 类似但更"暖"——drone 是岩石，pad 是棉花。',
    demo: { inst: 'synth-pad', hold: ['C3', 'G3', 'C4'], durSec: 3, vel: 0.5 },
  },
  {
    cat: 'texture',
    term: 'Bed',
    def: '"底铺"的统称——一个场景的最下层声音。可以是 drone、pad、ambient noise 或它们的混合。',
  },
  {
    cat: 'texture',
    term: 'Cluster',
    def: '相邻音的同时按下——制造刺耳、不和谐感。希区柯克 + 赫尔曼最早把这个搬进电影。',
  },
  {
    cat: 'texture',
    term: 'Ostinato',
    def: '同样的两三个音不停地重复——靠"持续"建立紧张。',
    example: '《大白鲨》E-F 半音反复。',
    demo: {
      inst: 'contrabass',
      notes: [N('E2', '8n', 0), N('F2', '8n', 0.4), N('E2', '8n', 0.8), N('F2', '8n', 1.2), N('E2', '8n', 1.6), N('F2', '8n', 2.0), N('E2', '8n', 2.4)],
      durSec: 3,
    },
  },

  /* ---- 节奏 / rhythm ------------------------------------------------------ */
  {
    cat: 'rhythm',
    term: 'Hit point',
    def: '配乐精确落在剪辑切点、画面动作上的那一拍。剪辑师和作曲家共谋的技术。',
    example: 'Marvel 片头标志亮起的那一刻，永远有一击。',
  },
  {
    cat: 'rhythm',
    term: 'Stinger',
    def: '一秒之内突然炸开的音响——多是弦乐齐奏 + 打击。配乐版的"跳吓"。',
    example: '《惊魂记》浴室戏那一串"嘎—嘎—嘎"。',
    demo: { inst: 'violin', notes: [N('A6', '16n', 0, 1.0), N('C7', '16n', 0.04, 0.95)], durSec: 0.8 },
  },
  {
    cat: 'rhythm',
    term: 'Sting',
    def: '段落收尾的 1-2 秒小尾巴——告诉观众"这场戏结束了"。新闻报道转场也常用。',
  },
  {
    cat: 'rhythm',
    term: 'Crescendo',
    def: '从 ppp 慢慢推到 fff——时间换张力。最普世的"推进感"配方。',
    demo: {
      inst: 'cello',
      notes: [N('C3', '4n', 0, 0.3), N('C3', '4n', 0.5, 0.5), N('C3', '4n', 1.0, 0.7), N('C3', '4n', 1.5, 0.85), N('C3', '2n', 2.0, 1.0)],
      durSec: 3,
    },
  },
  {
    cat: 'rhythm',
    term: 'Decrescendo',
    def: 'Crescendo 的反义——从大到小。常用于"事件已经过去"的回落感。',
  },
  {
    cat: 'rhythm',
    term: 'Tempo',
    def: '速度，bpm。慢板（60-72 bpm）= 沉重；行板（76-108）= 行走；快板（120+）= 兴奋。',
  },
  {
    cat: 'rhythm',
    term: 'Rubato',
    def: '"自由速度"——演奏者可以偷一些时间、再还回来。古典浪漫派和爵士独奏常用，给"人声化"的感觉。',
  },
  {
    cat: 'rhythm',
    term: 'Tutti',
    def: '"全体合奏"——所有乐器一起。最大动态，最大重量。',
    example: '电影 climax 99% 是 tutti。',
  },

  /* ---- 制作 / production -------------------------------------------------- */
  {
    cat: 'production',
    term: 'DX / MX / FX / NX / VO',
    def: '声音分轨五件套：对白 / 音乐 / 音效 / 环境 / 旁白。所有混音工作建立在这五条上。',
  },
  {
    cat: 'production',
    term: 'Mix',
    def: '把多条轨道按比例调到一起的过程。"混音师"的核心活。',
  },
  {
    cat: 'production',
    term: 'Stem',
    def: '导出的"子混"——比如把所有弦乐拍扁成一条 stereo 文件给国际版本重混。一个电影通常导 5-8 个 stem。',
  },
  {
    cat: 'production',
    term: 'Mute / Solo',
    def: '混音师的两个最基本动作：mute = 关掉这条；solo = 只听这条。所有"这条在干嘛"的判断都从 solo 开始。',
  },
  {
    cat: 'production',
    term: 'Pan',
    def: '把声音放到左 / 右声道里。L100% = 全在左声道。立体声 = pan 设计的总和。',
  },
  {
    cat: 'production',
    term: 'Reverb',
    def: '混响——模拟"这个声音在什么样的空间里发生"。教堂 reverb 长，电话亭 reverb 短。',
  },
  {
    cat: 'production',
    term: 'EQ',
    def: '频率均衡——挑出特定频段提升或衰减。对白 EQ 砍 200Hz 让它"清"，音乐 EQ 留 200Hz 让它"暖"。',
  },
  {
    cat: 'production',
    term: 'Compressor',
    def: '压缩器——把最响的部分压扁，让整体音量看起来更大。电影音效"扎实"的物理来源。',
  },
  {
    cat: 'production',
    term: 'Limiter',
    def: '限幅器——硬墙，超过这个值就削。最后一道防失真。',
  },
  {
    cat: 'production',
    term: 'LUFS',
    def: '响度单位，电影院通常 -27 LUFS，流媒体平台 -16 LUFS。混完一条音乐要测 LUFS。',
  },

  /* ---- 工艺 / workflow ---------------------------------------------------- */
  {
    cat: 'workflow',
    term: 'Lock cut',
    def: '锁版剪辑——剪辑不再变了，作曲家可以开始动笔。一部片通常会经历 3-5 次"伪 lock"。',
  },
  {
    cat: 'workflow',
    term: 'Cue',
    def: '一段独立的配乐。一部电影通常有 30-60 个 cue。"M1.3"就是"卷 1 的第 3 个 cue"。',
  },
  {
    cat: 'workflow',
    term: 'Click track',
    def: '"节拍器音轨"。乐手戴耳机演奏时听 click，确保 hit point 精确落在那一帧。',
  },
  {
    cat: 'workflow',
    term: 'Scoring stage',
    def: '专门给电影录配乐的录音棚。屏墙上跑剪辑画面，乐队"看着演"。Abbey Road、福克斯录音棚是行业标准。',
  },
  {
    cat: 'workflow',
    term: 'MIDI mockup',
    def: '作曲家先用合成音色做个"假版本"给导演审。导演点头后，再去录真乐队——或者预算不够直接用合成版上线。',
  },

  /* ---- 乐器 / instrument 简注（详细在图鉴） ------------------------------- */
  {
    cat: 'instrument',
    term: 'Strings',
    def: '弦乐组——小提琴、中提琴、大提琴、低音提琴。电影配乐的"中产阶级"，最常用、最万能。',
  },
  {
    cat: 'instrument',
    term: 'Brass',
    def: '铜管组——圆号、小号、长号、大号。"重量"和"英雄感"的来源。',
  },
  {
    cat: 'instrument',
    term: 'Woodwinds',
    def: '木管组——长笛、单簧管、双簧管、巴松管。给"色彩"和"线条"，常用作 solo 主角。',
  },
  {
    cat: 'instrument',
    term: 'Synthesizer',
    def: '电子合成器——从 Vangelis（《银翼杀手》）到 Hans Zimmer（《盗梦空间》）的核心武器。能造出现实里不存在的声音。',
  },
];

export const GLOSSARY_CATS: Array<{ key: GlossaryEntry['cat']; label: string }> = [
  { key: 'concept',    label: '概念' },
  { key: 'texture',    label: '织体' },
  { key: 'rhythm',     label: '节奏' },
  { key: 'production', label: '制作' },
  { key: 'workflow',   label: '工艺' },
  { key: 'instrument', label: '乐器组' },
];
