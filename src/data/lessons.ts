/**
 * Lesson definitions for M4. Each lesson is a sequence of "beats" that
 * the Lesson page walks through one at a time. Beats are typed so the
 * page can render the right widget without per-lesson code.
 *
 * Widgets reuse the M5 base — TrackEditor / compositionPlayer / Loop library.
 */
import {
  emptyComposition,
  makeNoteClip,
  makeDroneClip,
  makeAudioClip,
  type Composition,
  type ClipNote,
} from '@/lib/composition';

const N = (note: string, dur: string, at: number, vel = 0.8): ClipNote => ({ note, dur, at, vel });

export type LessonBeat =
  | { kind: 'text'; heading?: string; body: string }
  | {
      kind: 'mix';
      body: string;
      composition: Composition;
      /** Suggested objective for the user — UI shows it as a hint. */
      goal?: string;
    }
  | {
      kind: 'inst-swap';
      body: string;
      /** Phrase relative to clip start. */
      phrase: ClipNote[];
      durSec: number;
      /** Instrument ids selectable. First is default. */
      insts: string[];
      /** Optional drone bed to anchor the phrase. */
      drone?: { inst: string; hold: string | string[]; vel?: number };
    }
  | {
      kind: 'ab';
      body: string;
      aLabel: string;
      bLabel: string;
      a: Composition;
      b: Composition;
      /** One-liner shown after the user has heard both. */
      reveal: string;
    }
  | {
      kind: 'hit-point';
      body: string;
      /** Composition contains the on-music version. Toggle MX mute to compare. */
      composition: Composition;
      /** Time codes (sec) of cuts/hits to mark on the timeline. */
      hits: number[];
    }
  | {
      kind: 'sandbox';
      body: string;
      /** Starter composition; user can edit and play freely. */
      starter: Composition;
    };

export interface Lesson {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  estMin: number;
  intro: string;
  beats: LessonBeat[];
}

/* -------------------------------------------------------------------------- */
/*  L1 · 五轨是什么                                                            */
/* -------------------------------------------------------------------------- */

function l1Composition(): Composition {
  const c = emptyComposition(16);
  c.clips.push(
    // DX — placeholder "对白" via low cello note (we don't have voice samples)
    makeNoteClip({
      lane: 'dx',
      inst: 'cello',
      label: '对白（示意）',
      startSec: 1,
      durSec: 14,
      notes: [N('A3', '4n', 0, 0.5), N('G3', '4n', 1.5, 0.45), N('F3', '4n', 3.5, 0.5), N('A3', '4n', 6, 0.55), N('G3', '4n', 9, 0.5)],
    }),
    // MX — soft string melody
    makeNoteClip({
      lane: 'mx',
      inst: 'violin',
      label: 'MX 旋律',
      startSec: 0,
      durSec: 16,
      notes: [N('E5', '2n', 0, 0.45), N('G5', '2n', 2.5, 0.4), N('F5', '2n.', 5, 0.45), N('E5', '1n', 8, 0.4), N('A4', '1n', 12, 0.4)],
    }),
    makeNoteClip({
      lane: 'mx',
      inst: 'cello',
      label: 'MX 和声',
      startSec: 0,
      durSec: 16,
      notes: [N('C3', '1n', 0, 0.5), N('A2', '1n', 4, 0.55), N('F2', '1n', 8, 0.5), N('G2', '1n', 12, 0.5)],
    }),
    // FX — a few impacts
    makeNoteClip({
      lane: 'fx',
      inst: 'timpani',
      label: 'FX · 鼓点',
      startSec: 0,
      durSec: 16,
      notes: [N('C2', '4n', 3.5, 0.7), N('F2', '4n', 7.5, 0.75), N('C2', '4n', 11.5, 0.7)],
    }),
    // NX — pad bed
    makeDroneClip({
      lane: 'nx',
      inst: 'synth-pad',
      hold: ['C3', 'G3'],
      vel: 0.25,
      label: 'NX · 底铺',
      startSec: 0,
      durSec: 16,
    }),
    // VO — pretend narrator low choir hum
    makeNoteClip({
      lane: 'vo',
      inst: 'choir',
      label: 'VO（示意）',
      startSec: 8,
      durSec: 6,
      notes: [N('C4', '1n', 0, 0.35), N('E4', '1n', 3, 0.35)],
    }),
  );
  return c;
}

const lesson1: Lesson = {
  id: 'l1',
  num: 1,
  title: '五轨是什么',
  subtitle: '把一段戏拆成五条轨道，分别静音听一遍——你就明白每条在干嘛。',
  estMin: 10,
  intro:
    '影视工业里，混音师把"一场戏的所有声音"拆成 5 条独立轨道：DX（对白）、MX（音乐）、FX（音效）、NX（环境）、VO（旁白）。'
    + '它们各自独立录、独立混，再叠到一起。你听见的"一场戏"，本质是 5 条声音的实时加和。',
  beats: [
    {
      kind: 'text',
      heading: '为什么要分轨',
      body:
        '电影厂的混音师不会一边混对白一边写配乐——它们由不同的人做、在不同的时间到位。分轨给每个工种自己的"地盘"：'
        + '导演调对白音量不用动配乐，作曲调配乐不用怕动到环境声。'
        + '\n\n这五条不是技术细节，是创作语言。你做一个 30 秒的短视频，也是在做这五条——只是可能你没意识到。',
    },
    {
      kind: 'mix',
      body:
        '下面是一段 16 秒的虚拟戏的五轨。先点 ▶ 听全混，再用每条轨道右边的 M（mute）和 S（solo）按钮，把它们一个一个隔离开听。'
        + '注意 mute 之后画面"消失"了什么——这就是这条轨道在干什么。',
      goal: '至少 solo 听一遍每一条轨道。',
      composition: l1Composition(),
    },
    {
      kind: 'text',
      heading: '关键观察',
      body:
        '· DX 一旦 mute，戏就"塌"了——没有人的声音，画面立刻像默剧。这就是为什么 DX 是 5 条里最不能被压过的。'
        + '\n· NX 默默承受全场——你把它 mute 才发现底下少了"空间感"，画面像被抽真空。'
        + '\n· FX 是事件，MX 是情绪。FX 给你"发生了什么"，MX 给你"这事让你怎么觉得"。'
        + '\n· VO 是导演插进来的旁观者——大多数戏没有，但一旦有，必然在叙事最关键的转角。',
    },
    {
      kind: 'mix',
      body:
        '再来一遍：试试拖动每条轨道的音量条。把 MX 推到 0.3 听一下，画面立刻像默片纪录片；推回 1.0，戏剧感回来了。'
        + ' 配乐的核心控制不是"开或关"，是它在背景里有多大声。',
      goal: '试试把 MX 推到不同音量，体会"戏剧感"的变化。',
      composition: l1Composition(),
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  L2 · 音色 = 情绪载体                                                       */
/* -------------------------------------------------------------------------- */

const themePhrase: ClipNote[] = [
  N('D4', '4n', 0, 0.7),
  N('F4', '4n', 0.8, 0.7),
  N('A4', '4n.', 1.6, 0.7),
  N('G4', '4n', 2.8, 0.65),
  N('F4', '2n', 3.6, 0.7),
  N('D4', '2n', 5.0, 0.65),
];

const lesson2: Lesson = {
  id: 'l2',
  num: 2,
  title: '音色 = 情绪载体',
  subtitle: '同一段旋律，4 件乐器演——你会听见 4 种戏。',
  estMin: 8,
  intro:
    '旋律不是配乐的核心，音色才是。"哆来咪发"用谁演决定了它讲什么故事——'
    + '小号给你葬礼，长笛给你晨雾，单簧管给你深夜，钢琴给你独白。'
    + '记住这件事：选乐器永远比写旋律先。',
  beats: [
    {
      kind: 'text',
      heading: '同一段、不同人讲',
      body: '下面这段 6 秒的旋律——上行 + 回落——是经典的"陈述句"结构。'
        + '可以是英雄主题、可以是哀歌、可以是俏皮的、可以是不祥的。'
        + '\n\n这只取决于谁来演。',
    },
    {
      kind: 'inst-swap',
      body: '点不同的乐器试试。同一段旋律，听完一圈你应该能挑出"哪个最像葬礼"、"哪个最像清晨"。',
      phrase: themePhrase,
      durSec: 7.5,
      insts: ['trumpet', 'flute', 'clarinet', 'piano', 'cello', 'erhu'],
    },
    {
      kind: 'text',
      heading: '你刚才发现了什么',
      body:
        '· 同样上行的旋律，小号给你壮丽（频率高、铜管刺穿能力强）。'
        + '\n· 长笛给你"轻飘"（气流为主、几乎无低频）。'
        + '\n· 单簧管给你"深夜烟雾感"（中低频偏多，泛音柔软）。'
        + '\n· 钢琴给你"私语"（一击一离开，没有持续）。'
        + '\n· 大提琴给你"重压"（中低频 + 持续，最贴人声）。'
        + '\n· 二胡给你"含哀"（频谱里有人声共振峰，听起来就是在哭）。'
        + '\n\n这就是"音色 = 情绪载体"——你选错乐器，旋律再好也救不回来。',
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  L3 · Under-score / Source / Hybrid                                         */
/* -------------------------------------------------------------------------- */

function l3Underscore(): Composition {
  const c = emptyComposition(12);
  c.clips.push(
    makeNoteClip({
      lane: 'mx',
      inst: 'cello',
      label: 'underscore',
      startSec: 0,
      durSec: 12,
      notes: [N('C3', '1n', 0, 0.5), N('E3', '1n', 4, 0.5), N('G3', '1n', 8, 0.5)],
    }),
    makeDroneClip({
      lane: 'nx',
      inst: 'synth-pad',
      hold: ['C3', 'G3'],
      vel: 0.25,
      startSec: 0,
      durSec: 12,
      label: '环境',
    }),
  );
  return c;
}

function l3Source(): Composition {
  const c = emptyComposition(12);
  c.clips.push(
    makeNoteClip({
      lane: 'mx',
      inst: 'piano',
      label: 'source · 戏里的钢琴',
      startSec: 0,
      durSec: 12,
      notes: [
        N('C4', '8n', 0, 0.55), N('E4', '8n', 0.4, 0.55),
        N('G4', '8n', 0.8, 0.55), N('C5', '8n', 1.2, 0.55),
        N('B4', '4n', 1.6, 0.55), N('A4', '4n', 2.4, 0.5),
        N('G4', '4n', 3.2, 0.5), N('E4', '2n', 4.0, 0.5),
        N('C4', '8n', 6, 0.55), N('E4', '8n', 6.4, 0.55),
        N('G4', '8n', 6.8, 0.55), N('C5', '4n', 7.2, 0.55),
        N('A4', '4n.', 8, 0.5), N('G4', '2n', 9.5, 0.45),
      ],
    }),
    makeDroneClip({
      lane: 'nx',
      inst: 'synth-pad',
      hold: ['C3', 'G3'],
      vel: 0.2,
      startSec: 0,
      durSec: 12,
      label: '酒馆环境',
    }),
  );
  return c;
}

const lesson3: Lesson = {
  id: 'l3',
  num: 3,
  title: '三种配乐手法',
  subtitle: 'under-score / source / hybrid——决定观众"听不听见"音乐。',
  estMin: 8,
  intro:
    '配乐的第一个抉择不是写什么，是用哪种手法："观众应不应该意识到音乐在响"。'
    + '\n\n三种主路径：under-score（铺底，观众不察觉）、source（戏内来源，角色和观众一起听见）、hybrid（前两个的故意混淆，让你不确定刚才那段是音乐还是真实声音）。',
  beats: [
    {
      kind: 'ab',
      body: '听 A 和 B 各一遍，再回答："哪一个，戏里的角色也能听见？"',
      aLabel: 'A · 同一段配乐',
      bLabel: 'B · 戏里的钢琴',
      a: l3Underscore(),
      b: l3Source(),
      reveal:
        'B 是 source——这段钢琴在戏里就有人弹（酒馆里的，街上的，留声机的）。角色听见，观众也听见。'
        + '\nA 是 under-score——观众听见，角色听不见。它是导演给观众的"私房话"。'
        + '\n\nHybrid 是这两者的故意切换：一开始你以为是 source（戏里的留声机），声音越铺越大、最后变成 under-score 把整场戏推到高潮——观众这一刻和角色脱钩。',
    },
    {
      kind: 'text',
      heading: '为什么这件事重要',
      body:
        '· Under-score 是默认。绝大多数配乐都是这个。你做的"BGM"是 under-score。'
        + '\n· Source 给你真实感、低成本、文化标签（一首土耳其马卡姆告诉你这是伊斯坦布尔）。'
        + '\n· Hybrid 是高级手法——观众会觉得"这一刻很怪"，但说不出哪里怪。这正是导演想要的。'
        + '\n\n判断技巧：问自己"如果这场戏的演员可以站起来去 mute 这段音乐，他们能办到吗？"——能，是 source；不能，是 under-score。',
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  L4 · Hit-point / Stinger                                                  */
/* -------------------------------------------------------------------------- */

function l4Composition(): Composition {
  const c = emptyComposition(12);
  // Under-score bed
  c.clips.push(
    makeDroneClip({
      lane: 'mx',
      inst: 'pipe-organ',
      hold: 'C3',
      vel: 0.4,
      startSec: 0,
      durSec: 12,
      label: '管风琴 pedal',
    }),
    makeDroneClip({
      lane: 'nx',
      inst: 'synth-pad',
      hold: ['C3', 'G3'],
      vel: 0.18,
      startSec: 0,
      durSec: 12,
      label: 'pad',
    }),
    // Hit-points: stingers at 3s, 6s, 9s — string + cymbal
    makeNoteClip({
      lane: 'fx',
      inst: 'violin',
      label: 'stinger 3s',
      startSec: 3,
      durSec: 0.4,
      notes: [N('A6', '16n', 0, 1.0), N('C7', '16n', 0.04, 0.95)],
    }),
    makeNoteClip({
      lane: 'fx',
      inst: 'timpani',
      label: 'hit 3s',
      startSec: 3,
      durSec: 0.6,
      notes: [N('C2', '8n', 0, 0.95)],
    }),
    makeNoteClip({
      lane: 'fx',
      inst: 'violin',
      label: 'stinger 6s',
      startSec: 6,
      durSec: 0.4,
      notes: [N('A6', '16n', 0, 1.0), N('C7', '16n', 0.04, 0.95)],
    }),
    makeNoteClip({
      lane: 'fx',
      inst: 'timpani',
      label: 'hit 6s',
      startSec: 6,
      durSec: 0.6,
      notes: [N('F2', '8n', 0, 1.0)],
    }),
    makeNoteClip({
      lane: 'fx',
      inst: 'violin',
      label: 'stinger 9s',
      startSec: 9,
      durSec: 0.4,
      notes: [N('A6', '16n', 0, 1.0), N('C7', '16n', 0.04, 0.95)],
    }),
    makeNoteClip({
      lane: 'fx',
      inst: 'timpani',
      label: 'hit 9s',
      startSec: 9,
      durSec: 0.6,
      notes: [N('C2', '4n', 0, 1.0)],
    }),
  );
  return c;
}

const lesson4: Lesson = {
  id: 'l4',
  num: 4,
  title: '节奏与剪辑卡点',
  subtitle: 'hit-point / stinger / sting——配乐和剪辑的咬合。',
  estMin: 8,
  intro:
    '"卡点"是剪辑师和作曲家共谋的技术。剪辑剪在某一拍上，那一拍配乐恰好有一击——'
    + '观众生理上"被踢了一脚"，但意识不到刚才是音乐踢的还是画面踢的。'
    + '\n\nHit-point（卡点）= 音乐和画面同时落点。Stinger（一击式）= 单独那一拍的瞬时音响。Sting（小段尾巴）= 段落收尾的 1-2 秒收束。',
  beats: [
    {
      kind: 'hit-point',
      body:
        '这段 12 秒里有三个 hit-point，分别在 3s / 6s / 9s——下面时间轴上标了。播放它，注意每个标记到达时配乐里"啪"一下。'
        + '\n\n然后 mute FX 这条轨道，再播放一遍——你会发现"啪"消失了，画面只剩下 ambient bed。这就是配乐的"剪辑卡点"。',
      composition: l4Composition(),
      hits: [3, 6, 9],
    },
    {
      kind: 'text',
      heading: '从设计到下乡',
      body:
        '配乐里的 hit-point 是预先设计好的。作曲家拿到剪辑师做好的 lock cut（锁版剪辑），按帧数算出每个卡点的时间码，然后写音乐让"啪"落在那一帧。'
        + '\n\n现代流水线里，作曲家用 Logic / Cubase / Pro Tools 的"hit point map"功能直接看到画面的剪辑切点。Hans Zimmer 的工作室甚至有屏墙同步播放剪辑给乐手看，让他们能"看着画面演"。'
        + '\n\n你做短视频，也是一样的逻辑：先剪辑、标卡点，再选音效或合成节拍对齐到卡点。倒过来做几乎一定别扭。',
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  L5 · 你的第一段配乐                                                        */
/* -------------------------------------------------------------------------- */

function l5Starter(): Composition {
  const c = emptyComposition(20);
  // Starter: a bare DX-like beat + nothing else; user adds music.
  c.clips.push(
    makeNoteClip({
      lane: 'dx',
      inst: 'cello',
      label: '对白节奏（示意）',
      startSec: 2,
      durSec: 14,
      notes: [
        N('G3', '4n', 0, 0.5), N('A3', '4n', 2, 0.5), N('G3', '4n', 5, 0.5),
        N('F3', '4n', 8, 0.5), N('A3', '4n', 11, 0.5),
      ],
    }),
  );
  return c;
}

const lesson5: Lesson = {
  id: 'l5',
  num: 5,
  title: '你的第一段配乐',
  subtitle: '给一段 20 秒的"对白节奏"。从乐器库挑乐器，拼出一段配乐。',
  estMin: 12,
  intro:
    '前 4 课你建立了直觉。这一课，做一次。下面是一段 20 秒的"对白节奏"（用大提琴模拟说话的节奏点）。'
    + '\n\n挑战：拼一段 under-score 配乐，让它服务对白——不要盖过去，但要让"这段戏"显得不是默片。'
    + '\n\n提示：MX 推到 0.4-0.5，NX 给 0.3 左右；不要在对白点上放 FX。先把"哪段对白点最沉重"标记给自己，然后让 MX 在那个时刻有事发生。',
  beats: [
    {
      kind: 'sandbox',
      body: '下面是一台精简的 sandbox。乐器库点一下，它会落到对应轨道；拖动改起点。完成你的第一段配乐。',
      starter: l5Starter(),
    },
    {
      kind: 'text',
      heading: '继续怎么玩',
      body:
        '完整版的 sandbox 在 /sandbox——更多预设、更多乐器、更长时长。'
        + '\n\n下一步：找一段你拍过的 30 秒视频片段，把这套思维方式带回去。再过 3 个月你会发现自己改配乐的速度比写脚本还快。',
    },
  ],
};

/* -------------------------------------------------------------------------- */

export const LESSONS: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/* Suppress unused warning for makeAudioClip — kept for future lesson beats. */
void makeAudioClip;
