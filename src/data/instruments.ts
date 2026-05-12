import type { EmotionId } from './emotions';

export type InstrumentFamily =
  | 'strings'
  | 'woodwind'
  | 'brass'
  | 'percussion'
  | 'keyboard'
  | 'plucked'
  | 'voice'
  | 'electronic';

export type Culture = 'western' | 'chinese' | 'world' | 'electronic';

export interface FilmExample {
  film: string;
  year: number;
  composer: string;
  why: string;
}

export interface Instrument {
  id: string;
  name: string;
  en: string;
  family: InstrumentFamily;
  culture: Culture;
  emotionRadar: Partial<Record<EmotionId, number>>;
  timbre: string;
  strength: string;
  caveat: string;
  rangeMidi: [number, number];
  /** Filename under /cue/samples/<id>/ on CDN. */
  phrase: string;
  films: FilmExample[];
}

export const INSTRUMENTS: Instrument[] = [
  /* ---------- Strings ----------------------------------------------------- */
  {
    id: 'cello',
    name: '大提琴',
    en: 'Cello',
    family: 'strings',
    culture: 'western',
    emotionRadar: { sorrow: 9, longing: 8, solemn: 7, tension: 6, romance: 7, epic: 6, sacred: 5, void: 4 },
    timbre: '体型大、共鸣腔深。在所有管弦乐器里最接近人声中低声区——你听见的是一具会呼吸的木箱在唱。',
    strength: '一根长弓拉出一条不会断的线，给画面一个"有人在那里"的体温。',
    caveat: '别和中提琴叠太厚——两件都在 C3–G4 之间，叠多了像糊在一起的奶油。',
    rangeMidi: [36, 76],
    phrase: 'cello/phrase-01.mp3',
    films: [
      { film: '辛德勒的名单', year: 1993, composer: '约翰·威廉姆斯', why: '帕尔曼独奏 + 弦乐铺底，旋律每一次回落都比上一次更轻——大提琴在这里就是"幸存者的呼吸"。' },
      { film: '星际穿越', year: 2014, composer: '汉斯·季默', why: '管风琴 + 大提琴齐奏 cooper 离别的主题，让"父亲"这个词具备引力。' },
      { film: '卧虎藏龙', year: 2000, composer: '谭盾，马友友独奏', why: '把大提琴当成一把没有品的二胡用，证明这件西洋乐器可以讲东方"含"的故事。' },
    ],
  },
  {
    id: 'violin',
    name: '小提琴',
    en: 'Violin',
    family: 'strings',
    culture: 'western',
    emotionRadar: { tension: 8, suspense: 8, romance: 9, joy: 6, sorrow: 7, longing: 7, dread: 6, epic: 5 },
    timbre: '亮、贴耳。极弱奏时像耳语，极强奏时能划破空气——是管弦乐里情绪幅度最大的一件。',
    strength: '高音区一条颤音长线可以把任何画面"拉紧"，是悬疑/浪漫两端的通用钥匙。',
    caveat: '太容易"煽"。一旦旋律性过强就会把画面盖死；导演大多数时候要的是"克制的小提琴"。',
    rangeMidi: [55, 103],
    phrase: 'violin/phrase-01.mp3',
    films: [
      { film: '惊魂记', year: 1960, composer: '伯纳德·赫尔曼', why: '浴室戏的尖锐 stab——小提琴最暴力的瞬间，重塑了恐怖片配乐语言。' },
      { film: '辛德勒的名单', year: 1993, composer: '约翰·威廉姆斯', why: '主题旋律由小提琴独奏走完，是"克制"和"煽情"之间最完美的平衡范例。' },
      { film: '红色小提琴', year: 1998, composer: 'John Corigliano', why: '小提琴本身就是主角——三百年里它如何被人爱、被人毁。' },
    ],
  },
  {
    id: 'contrabass',
    name: '低音提琴',
    en: 'Contrabass',
    family: 'strings',
    culture: 'western',
    emotionRadar: { dread: 9, tension: 8, solemn: 7, void: 6, suspense: 7, epic: 5 },
    timbre: '整个交响乐团的地板。不靠旋律靠存在感——你感受到它，往往不是听见。',
    strength: '极低音 drone 是"还没看见但已经在那里"的几乎所有恐怖/悬疑场面的底色。',
    caveat: '单独使用会让画面"塌"。永远是别人的搭档。',
    rangeMidi: [28, 60],
    phrase: 'contrabass/phrase-01.mp3',
    films: [
      { film: '大白鲨', year: 1975, composer: '约翰·威廉姆斯', why: 'E–F 半音 ostinato，证明两个音也能成传奇主题。' },
      { film: '教父', year: 1972, composer: '尼诺·罗塔', why: '在西西里葬礼那一场，低音提琴就是棺材落地的声音。' },
    ],
  },
  {
    id: 'erhu',
    name: '二胡',
    en: 'Erhu',
    family: 'strings',
    culture: 'chinese',
    emotionRadar: { sorrow: 9, longing: 9, void: 6, solemn: 5, romance: 5, sacred: 4 },
    timbre: '两根弦，没有指板——音和音之间永远是"滑过去"的。它的悲是中国式的"含"，不是西方式的"诉"。',
    strength: '能在 4 秒之内把江南/江北的地理感建立起来。',
    caveat: '一上配乐就是"中国元素"，反而失去它本身的语言。导演要小心使用。',
    rangeMidi: [55, 91],
    phrase: 'erhu/phrase-01.mp3',
    films: [
      { film: '霸王别姬', year: 1993, composer: '赵季平', why: '京胡 + 二胡的双层叙事，把"戏中戏"做到声音里。' },
      { film: '一秒钟', year: 2020, composer: '老锣', why: '极简的二胡 phrase 处理沙漠中的人物——孤独是地理性的。' },
    ],
  },
  {
    id: 'pizzicato-strings',
    name: '弦乐拨奏',
    en: 'Pizzicato Strings',
    family: 'strings',
    culture: 'western',
    emotionRadar: { playful: 9, joy: 8, suspense: 6, tension: 5, longing: 3 },
    timbre: '弓不再碰弦，用手指弹出来——同样的乐器突然有了"脚尖"。',
    strength: '俏皮、节奏推进、轻量喜剧的万金油。',
    caveat: '叙事戏中段慎用，容易把分量降下去。',
    rangeMidi: [36, 84],
    phrase: 'pizzicato-strings/phrase-01.mp3',
    films: [
      { film: '天使爱美丽', year: 2001, composer: 'Yann Tiersen', why: '拨弦律动是这部片子的"心跳"。' },
      { film: '布达佩斯大饭店', year: 2014, composer: 'Alexandre Desplat', why: '俄罗斯民乐 + 弦乐拨奏构造 Anderson 式的玩具盒节奏。' },
    ],
  },

  /* ---------- Woodwind ---------------------------------------------------- */
  {
    id: 'flute',
    name: '长笛',
    en: 'Flute',
    family: 'woodwind',
    culture: 'western',
    emotionRadar: { joy: 8, playful: 7, sacred: 6, longing: 5, romance: 5, void: 4 },
    timbre: '气息直接吹过开孔——没有簧片的过滤。是管弦乐里最像"鸟"也最像"风"的声音。',
    strength: '空灵、明亮、不施压。给画面留出空气感。',
    caveat: '在低音区接近无能为力——它的力气全在中高。',
    rangeMidi: [60, 96],
    phrase: 'flute/phrase-01.mp3',
    films: [
      { film: '指环王', year: 2001, composer: '霍华德·肖', why: '夏尔主题中的爱尔兰笛子，把"故乡"具象化。' },
      { film: '哈利波特', year: 2001, composer: '约翰·威廉姆斯', why: '"Hedwig\'s Theme" 由低音笛起句，是儿童奇幻通往黑暗的门。' },
    ],
  },
  {
    id: 'clarinet',
    name: '单簧管',
    en: 'Clarinet',
    family: 'woodwind',
    culture: 'western',
    emotionRadar: { longing: 8, romance: 6, sorrow: 6, playful: 5, joy: 4, void: 4 },
    timbre: '木质 + 单簧，中低音区暗、温、不刺。像深夜厨房里的台灯。',
    strength: '人物独白时长的旋律最佳载体——它不抢戏。',
    caveat: '低音区像 saxophone 但又没那么"夜店"，使用时要确认你要的是"私语"还是"酒馆"。',
    rangeMidi: [50, 91],
    phrase: 'clarinet/phrase-01.mp3',
    films: [
      { film: '辛德勒的名单', year: 1993, composer: '约翰·威廉姆斯', why: 'Klezmer 风的单簧管把犹太民族的悲喜同时托住。' },
      { film: '彼得与狼', year: 1936, composer: '普罗科菲耶夫', why: '猫的角色——单簧管的低音中段就是"潜行"的形状。' },
    ],
  },
  {
    id: 'oboe',
    name: '双簧管',
    en: 'Oboe',
    family: 'woodwind',
    culture: 'western',
    emotionRadar: { sorrow: 8, longing: 8, romance: 7, sacred: 6, solemn: 5 },
    timbre: '双簧片的窄缝挤出来的声音——本身就带"哀"。乐团调音用 A，因为它最不妥协。',
    strength: '一句独白能把场景的体温降低 2 度。',
    caveat: '一旦旋律展开太多会变得做作。给一句话，不要给一段话。',
    rangeMidi: [58, 91],
    phrase: 'oboe/phrase-01.mp3',
    films: [
      { film: '使命', year: 1986, composer: 'Ennio Morricone', why: '"Gabriel\'s Oboe" 是 oboe 在电影史上的代表作——一根管子讲完了殖民、信仰、悔过。' },
    ],
  },

  /* ---------- Brass ------------------------------------------------------- */
  {
    id: 'french-horn',
    name: '圆号',
    en: 'French Horn',
    family: 'brass',
    culture: 'western',
    emotionRadar: { epic: 9, solemn: 8, sacred: 6, romance: 6, longing: 5, dread: 4 },
    timbre: '铜管里最暖、最圆。"史诗感"的真正源头几乎都是它，不是小号。',
    strength: '高音区铺一条线，整支管弦乐立刻有"远方"。',
    caveat: '声压惊人，比想象的还要强。混音时给它单独留空间。',
    rangeMidi: [34, 77],
    phrase: 'french-horn/phrase-01.mp3',
    films: [
      { film: '星球大战', year: 1977, composer: '约翰·威廉姆斯', why: '主题动机由圆号宣告——它就是 Luke 的英雄性。' },
      { film: '魔戒：双塔奇兵', year: 2002, composer: '霍华德·肖', why: '洛汗主题的圆号 + 哈丹格小提琴，是"苍凉骑士"的标准答案。' },
    ],
  },
  {
    id: 'trumpet',
    name: '小号',
    en: 'Trumpet',
    family: 'brass',
    culture: 'western',
    emotionRadar: { epic: 7, joy: 7, solemn: 5, tension: 6, romance: 4 },
    timbre: '直、亮、近距离。在所有乐器里最像"宣告"。',
    strength: '军号号召、爵士独白、葬礼挽歌——它的语言谱系最广。',
    caveat: '比圆号更容易"刺人"。情绪戏要么静音，要么换弱音器。',
    rangeMidi: [54, 84],
    phrase: 'trumpet/phrase-01.mp3',
    films: [
      { film: '红磨坊', year: 2001, composer: 'Craig Armstrong 等', why: '小号引出 "El Tango de Roxanne"——直白的欲望和嫉妒。' },
    ],
  },

  /* ---------- Percussion -------------------------------------------------- */
  {
    id: 'timpani',
    name: '定音鼓',
    en: 'Timpani',
    family: 'percussion',
    culture: 'western',
    emotionRadar: { epic: 8, solemn: 8, tension: 7, dread: 6 },
    timbre: '可以精确调音的低音膜——不是噪声，是"低音音符"。',
    strength: '心跳、宣告、降临。配乐结构里的"句号"。',
    caveat: '过用会显廉价。一部 90 分钟片子，timpani 高潮点不超过 5 处。',
    rangeMidi: [36, 60],
    phrase: 'timpani/phrase-01.mp3',
    films: [
      { film: '2001 太空漫游', year: 1968, composer: '理查·施特劳斯', why: '《查拉图斯特拉如是说》开场——铜管之后那一下定音鼓就是"觉醒"。' },
    ],
  },
  {
    id: 'taiko',
    name: '太鼓',
    en: 'Taiko',
    family: 'percussion',
    culture: 'world',
    emotionRadar: { epic: 9, tension: 8, solemn: 7, dread: 6 },
    timbre: '巨大的木桶膜，低频不"咚"而是"砸"——能让胸腔共振。',
    strength: '战斗、仪式、攻势之前的蓄势。',
    caveat: '太大型乐器，小场面用 sub-kick 替代更克制。',
    rangeMidi: [30, 50],
    phrase: 'taiko/phrase-01.mp3',
    films: [
      { film: '最后的武士', year: 2003, composer: '汉斯·季默', why: '战前的太鼓阵列建立东方"集体意志"。' },
      { film: '阿凡达', year: 2009, composer: '詹姆斯·霍纳', why: '部落集会场景，把节奏当作"语言"。' },
    ],
  },
  {
    id: 'xylophone',
    name: '木琴',
    en: 'Xylophone',
    family: 'percussion',
    culture: 'western',
    emotionRadar: { playful: 9, joy: 7, suspense: 6, tension: 4 },
    timbre: '木条 + 共鸣管。短促、清脆、可笑——是配乐里少数自带"卡通"标签的乐器。',
    strength: '把节奏可视化。常被用来给小动物/小物件做"脚步"。',
    caveat: '过度使用立刻把片子降级成动画短片。',
    rangeMidi: [65, 96],
    phrase: 'xylophone/phrase-01.mp3',
    films: [
      { film: '骷髅之舞 (Saint-Saëns)', year: 1874, composer: 'Saint-Saëns', why: '木琴模拟骷髅敲骨头——古典语境也能讲清这件乐器的本质。' },
    ],
  },

  /* ---------- Keyboard ---------------------------------------------------- */
  {
    id: 'piano',
    name: '钢琴',
    en: 'Piano',
    family: 'keyboard',
    culture: 'western',
    emotionRadar: { sorrow: 8, romance: 8, longing: 7, void: 6, joy: 6, sacred: 5, playful: 4 },
    timbre: '88 个被毛毡锤敲响的琴弦。它最大的特点是"敲完以后就开始衰减"——和声学的句号机器。',
    strength: '钢琴是配乐里的"中性嗓音"——什么情绪都能讲，又什么都不主张。',
    caveat: '太通用 = 太常见。要让钢琴出彩，靠的是"少而准"。',
    rangeMidi: [21, 108],
    phrase: 'piano/phrase-01.mp3',
    films: [
      { film: '钢琴课', year: 1993, composer: 'Michael Nyman', why: '钢琴在这里不只是配乐，是女主的"喉咙"。' },
      { film: '美丽心灵', year: 2001, composer: 'James Horner', why: '"All Love Can Be" 主题——钢琴 + 童声的最简方程。' },
      { film: '海上钢琴师', year: 1998, composer: 'Ennio Morricone', why: '"Playing Love" 是流派模糊年代里钢琴最干净的一段抒情。' },
    ],
  },
  {
    id: 'celesta',
    name: '钢片琴',
    en: 'Celesta',
    family: 'keyboard',
    culture: 'western',
    emotionRadar: { sacred: 8, playful: 7, joy: 6, romance: 4, void: 3 },
    timbre: '键盘外形 + 锤击金属片 + 木箱共鸣 = "天上的小铃铛"。',
    strength: '把"魔法/天真"瞬间具象化。',
    caveat: '出现一次足够。多用就成了主题乐园。',
    rangeMidi: [60, 108],
    phrase: 'celesta/phrase-01.mp3',
    films: [
      { film: '哈利波特：魔法石', year: 2001, composer: '约翰·威廉姆斯', why: '"Hedwig\'s Theme" 的开篇就是 celesta——这件乐器从此被绑定到"魔法"。' },
    ],
  },
  {
    id: 'pipe-organ',
    name: '管风琴',
    en: 'Pipe Organ',
    family: 'keyboard',
    culture: 'western',
    emotionRadar: { sacred: 10, solemn: 9, epic: 7, dread: 6, void: 5 },
    timbre: '一座建筑物里的乐器——空气从几百根管子里同时喷出来。声音不是"播放"，是"充满"。',
    strength: '宗教感、宇宙感、绝对的体量。',
    caveat: '它是空间型乐器，需要混音里给它"教堂"的混响，否则像电子琴。',
    rangeMidi: [24, 96],
    phrase: 'pipe-organ/phrase-01.mp3',
    films: [
      { film: '星际穿越', year: 2014, composer: '汉斯·季默', why: '管风琴扮演了"上帝视角"——巨型时空和孤独的父亲。' },
      { film: '幻想曲', year: 1940, composer: 'Bach 经 Stokowski 改编', why: '"D 小调托卡塔与赋格" 把管风琴的视觉化推到极致。' },
    ],
  },

  /* ---------- Plucked / Chinese ------------------------------------------- */
  {
    id: 'guzheng',
    name: '古筝',
    en: 'Guzheng',
    family: 'plucked',
    culture: 'chinese',
    emotionRadar: { longing: 8, joy: 6, void: 5, romance: 5, playful: 4, sacred: 4 },
    timbre: '21 根弦 + 雁柱定音 + 滑音技法，是"江湖"和"宫廷"两端的通用语。',
    strength: '快速分解和弦能瞬间建立"东方"的时空。',
    caveat: '滥用会"风景明信片"。导演要的是叙事的中国，不是 stock photo 的中国。',
    rangeMidi: [48, 84],
    phrase: 'guzheng/phrase-01.mp3',
    films: [
      { film: '英雄', year: 2002, composer: '谭盾', why: '飞雪与如月对决一场，古筝的快速轮指就是雪片。' },
    ],
  },
  {
    id: 'pipa',
    name: '琵琶',
    en: 'Pipa',
    family: 'plucked',
    culture: 'chinese',
    emotionRadar: { tension: 7, epic: 6, longing: 6, playful: 5, dread: 4 },
    timbre: '四根弦，钢音脆。"大珠小珠落玉盘" 一句话定义。',
    strength: '战场、刺杀、骤雨——节奏极快时它是"刀"。',
    caveat: '不是慢板乐器；要它抒情就放掉了它的优势。',
    rangeMidi: [45, 81],
    phrase: 'pipa/phrase-01.mp3',
    films: [
      { film: '十面埋伏 (传统)', year: 0, composer: '传统', why: '琵琶最古老的战场叙事——配乐史最早的"扫弦"用法。' },
      { film: '夜宴', year: 2006, composer: 'Tan Dun', why: '把琵琶的杀气放到宫廷阴谋戏里。' },
    ],
  },
  {
    id: 'guqin',
    name: '古琴',
    en: 'Guqin',
    family: 'plucked',
    culture: 'chinese',
    emotionRadar: { void: 9, longing: 7, sacred: 7, solemn: 6, sorrow: 5 },
    timbre: '七根弦。最古老的"独奏乐器"，泛音多到声音的轮廓是模糊的。',
    strength: '空、远、士人感。一个泛音就能把画面"清空"。',
    caveat: '不能堆——它本身就是"独"。',
    rangeMidi: [40, 76],
    phrase: 'guqin/phrase-01.mp3',
    films: [
      { film: '一一', year: 2000, composer: '彭恺立', why: '空镜配古琴泛音——杨德昌式的"日常之外"。' },
    ],
  },

  /* ---------- Voice / Electronic ----------------------------------------- */
  {
    id: 'choir',
    name: '合唱',
    en: 'Choir',
    family: 'voice',
    culture: 'western',
    emotionRadar: { sacred: 10, epic: 8, solemn: 8, dread: 6, sorrow: 6 },
    timbre: '人声叠加。"宗教"、"末日"、"超越"的最短路径。',
    strength: '建立"集体的、不属于任何个体"的视角。',
    caveat: '只要一加合唱，画面就会瞬间"严肃化"——慎用。',
    rangeMidi: [48, 84],
    phrase: 'choir/phrase-01.mp3',
    films: [
      { film: '角斗士', year: 2000, composer: 'Hans Zimmer & Lisa Gerrard', why: 'Lisa Gerrard 的人声 vocalise + 合唱铺底，定义了 2000 年代史诗片配乐。' },
      { film: '魔戒：王者归来', year: 2003, composer: '霍华德·肖', why: '末日山脉一场合唱压倒乐团——它就是 Sauron 的视野。' },
    ],
  },
  {
    id: 'synth-pad',
    name: '合成 Pad',
    en: 'Synth Pad',
    family: 'electronic',
    culture: 'electronic',
    emotionRadar: { void: 9, dread: 7, tension: 6, sacred: 5, longing: 5 },
    timbre: '没有物理来源的声音——纯波形 + 慢起音 + 长尾。它的存在感是"环境本身在响"。',
    strength: '科幻、未来、抽象——任何"非自然世界"。',
    caveat: '过用会"音乐沙拉酱"——什么都涂得抹平。每场戏只该有一层 pad。',
    rangeMidi: [24, 96],
    phrase: 'synth-pad/phrase-01.mp3',
    films: [
      { film: '银翼杀手 2049', year: 2017, composer: 'Hans Zimmer & Benjamin Wallfisch', why: '巨型 pad + 极少旋律——这就是"未来不浪漫"的声音。' },
      { film: '降临', year: 2016, composer: 'Jóhann Jóhannsson', why: '人声拉伸成 pad，外星语言的物理对应物。' },
    ],
  },
];

export function getInstrument(id: string): Instrument | undefined {
  return INSTRUMENTS.find((x) => x.id === id);
}

export function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}
