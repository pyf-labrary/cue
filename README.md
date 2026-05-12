# Cue · 影视配乐入门

> 给小白做导演的配乐速通课。可听 > 可读——每一个名词都必须能在 200ms 内播出来。

互动型教学站。12 情绪光谱 + 60 件常用乐器 + 20 个经典场景五轨拆解 + 入门五课。

## 开发

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 产物在 dist/
```

## 项目结构

```
src/
  pages/             # 路由页面
  components/
    audio/           # PlayButton（之后会加 MultiTrackPlayer / Sandbox）
    visual/          # EmotionWheel / EmotionRadar
    ui/              # Layout 等基础壳
  lib/
    audioEngine.ts   # Howler 包一层 + 全局互斥锁；后续接 Tone.js
    cdn.ts           # ftp.ssbx.site 路径拼接
  data/              # 静态元数据（情绪、乐器）
  styles/index.css   # Tailwind base + design token
```

## 资产托管

- **代码 / UI**：本仓库
- **大文件（采样、视频、场景旁轨）**：`https://ftp.ssbx.site/cue/...`
  - 路径约定：`samples/<inst>/*.mp3`、`scenes/<slug>/{video.mp4, dx.mp3, mx.mp3, fx.mp3, nx.mp3}`
  - 本地 dev 想换成本地 mock：在 `.env.local` 里设 `VITE_CDN_BASE=http://localhost:8000/cue`

## 里程碑

- **M1 骨架**（当前）：路由 + 设计 token + 情绪轮盘首页 + 大提琴示范页 + audioEngine
- **M2 图鉴**：20 件乐器 + 雷达图 + 过滤
- **M3 场景**：五轨同步拆解播放器 + 首批 5 个场景
- **M4 课程**：五节入门课 + 术语手册
- **M5 Sandbox**：拖乐器拼配乐 + webm 导出
- **M6 上线**：CDN 部署 + GitHub Pages

## 设计与文案约定

- 深色底 #0F0F12 + 单色高亮，向 Sonos / Are.na / teenage.engineering 看齐
- 思源宋体做标题（影院感），Inter / 思源黑做正文
- **全站零 emoji**（Linux Chromium 没色 emoji 字体，会渲染成豆腐块）
- 文案语气：像一个有经验的混录师在你身边讲话——短句、举例、不掉书袋
