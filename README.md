# Cue · 影视配乐入门

> 一个给小白做导演的配乐速通课。**可听 > 可读**——每一个名词都必须能在 200ms 内播出来。

🎬 **在线**：<https://pyf-labrary.github.io/cue/>

## 这是什么

一个互动型教学站，帮没学过配乐的导演 / 编剧 / 内容创作者建立"听 → 辨 → 用"的配乐直觉。

- **情绪光谱**：12 种最常用的情绪 → 各自对应几件最擅长讲它的乐器
- **乐器图鉴**：20 件常用乐器，每件都能在 200ms 内播出来 + 三个影视范例
- **场景拆解**：5 部经典片段（Jaws / 卧虎藏龙 / Psycho / Interstellar / 教父）拆成 5 条轨道独立 solo/mute
- **入门五课**：互动 widget 串起来的 10-15 分钟一节，从「五轨是什么」到「你的第一段配乐」
- **试听台 Sandbox**：拖乐器到 5 条轨道上自己拼一段配乐
- **术语手册**：41 条配乐术语，可演示的当场播一段 3s 真录音

## 技术栈

- **Vite 5 + React 18 + TypeScript + Tailwind 3**
- **Tone.js** — Sampler + 合成 fallback
- **Howler.js** — 流式 mp3 + Web Audio
- **采样**：Philharmonia Orchestra Samples (CC-BY-NC)、FluidR3_GM (CC-BY)
- **AI 生图**：场景封面 / 乐器肖像 / 课程封面 / Home hero 由 Dreamina 5.0 生成
- **音乐**：场景 MX 真录音由 MiniMax music-1.5 生成

## 本地开发

```bash
npm install
npm run dev            # http://localhost:3333/

# 资产重生（按需）
./scripts/download-samples.sh         # 西洋乐器采样
node scripts/unpack-soundfonts.mjs    # 中乐 + 合唱 GM 采样
python3 scripts/gen-scene-music.py    # 5 段场景 MX 真录音（MiniMax）
bash scripts/gen-scene-covers.sh      # 5 张场景封面（Dreamina）
bash scripts/gen-instrument-portraits.sh   # 20 张乐器肖像
bash scripts/gen-lesson-covers.sh     # 5 张课封 + Home hero

# 生产构建
VITE_BASE=/cue/ npm run build
npm run preview
```

## 键盘快捷键

| 键 | 作用 |
|---|---|
| `Space` | 播放 / 暂停 |
| `← →` | 后退 / 前进 2s（Shift +/- 5s）|
| `Home` / `0` / `Esc` | 回到起点 |
| `1` `2` `3` `4` `5` | mute DX / MX / FX / NX / VO |
| `Shift+1..5` | solo lane |

## 部署

push 到 main → GitHub Actions 自动 `npm ci && npm run build` → 部署到 GitHub Pages 子路径 `/cue/`。

## 里程碑

- ✅ **M1 骨架** — 路由 + 设计 token + 情绪轮盘 + audioEngine
- ✅ **M2 图鉴** — 20 件乐器 + 雷达图 + 过滤
- ✅ **M2.5 真采样** — 西洋 + 中乐 GM 全 88 音
- ✅ **M3 场景** — 5 个场景 + 五轨同步拆解播放器
- ✅ **M3.5 AI 真录音 MX** — MiniMax 生成 5 段
- ✅ **M4 课程** — 5 课 + 41 条术语手册
- ✅ **M5 Sandbox 底座** — Composition 引擎 + 19 个 loop + 可编辑轨道
- ✅ **M6 上线** — GH Pages + Marginalia 入口
- 🚧 **M5 完整版** — 上传无声视频 + 导出 webm（待办）

## 致谢

- nbrosowsky/tonejs-instruments — 西洋乐器 CC 采样镜像
- gleitz/midi-js-soundfonts — FluidR3_GM 中乐采样
- 即梦 Dreamina、火山 ARK、MiniMax — AI 生成资产
- 所有原片导演 + 作曲家——每一段被拆解的配乐都来自他们的作品

## License

源码 MIT；采样按各原始许可证（CC-BY-NC / CC-BY）；影视片段以教学引用目的使用，版权归原方。

---

🤖 由 Claude（gittee-coder bot）和 panyifeng@zuler.io 共同制作。
