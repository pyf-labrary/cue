#!/usr/bin/env bash
# Generate 5 lesson key art covers + 1 Home hero panorama.
set -euo pipefail
cd "$(dirname "$0")/.."

FORCE=""
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p public/lessons public/home

gen() {
  local out="$1"; shift
  local ratio="$1"; shift
  local prompt="$1"
  if [ -z "$FORCE" ] && [ -f "$out" ]; then
    echo "[skip] $out"; return
  fi
  echo "[gen ] $out"
  img-dreamina --prompt "$prompt" --out "$out" --ratio "$ratio" --model 5.0 --resolution 2k --max-width 1600 --quality 86 2>&1 | tail -2 | sed "s/^/  /"
}

gen public/lessons/l1.jpg 16:9 \
  "电影 key art，专业混音棚控制台特写，5 条推子排成一排各打不同颜色光，黑色背景，35mm 胶片颗粒，电影感，无文字" &

gen public/lessons/l2.jpg 16:9 \
  "电影 key art，5 件乐器在黑色背景前排成一排，单束顶光逐件打亮，各乐器色调互不相同，35mm 胶片颗粒，无文字" &

gen public/lessons/l3.jpg 16:9 \
  "电影 key art，老式留声机和黑胶唱片在烟雾环境中，单束琥珀色侧光，柔和景深，电影感，无文字" &

gen public/lessons/l4.jpg 16:9 \
  "电影 key art，胶片剪辑工作台特写，胶片胶卷盘和切刀，单束白色顶光，黑色背景，机械感，35mm 颗粒，无文字" &

gen public/lessons/l5.jpg 16:9 \
  "电影 key art，作曲家书桌特写，乐谱手稿、铅笔、键盘琴，单束温暖侧光，深夜创作感，35mm 颗粒，无文字" &

gen public/home/hero.jpg 21:9 \
  "电影 key art，俯瞰录音棚控制台广角全景，乐手剪影在玻璃后，单束暖光打在前景调音台，深黑环境，电影宽幅，35mm 颗粒，无文字" &

wait
echo "[done] lesson + home covers"
