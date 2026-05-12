#!/usr/bin/env bash
# Generate 5 cinematic key art covers for the scene cards via Dreamina 5.0.
# 16:9, 2k, downscaled to 1920px wide for site use.
# Run once. Re-run with --force to overwrite.

set -euo pipefail
cd "$(dirname "$0")/.."

FORCE=""
[ "${1:-}" = "--force" ] && FORCE=1

gen() {
  local slug="$1"
  local prompt="$2"
  local out="public/scenes/$slug/cover.jpg"
  if [ -z "$FORCE" ] && [ -f "$out" ]; then
    echo "[skip] $slug — already exists"
    return
  fi
  echo "[gen ] $slug"
  img-dreamina \
    --prompt "$prompt" \
    --out "$out" \
    --ratio 16:9 \
    --model 5.0 \
    --resolution 2k \
    --max-width 1920 \
    --quality 86
}

# Run all 5 in parallel — each ~30-60s; total ~1 min.
gen jaws \
  "电影 key art，水下广角视角，海面波光从上方斜射穿透水体，画面中央一条巨大流线型鲨鱼侧影，露出明显背鳍尾鳍，朝镜头方向游动，蓝绿色冷调，35mm 胶片颗粒，悬疑氛围，宽幅构图，无文字，无人物" &

gen crouching-tiger-bamboo \
  "电影 key art，竹林俯瞰，斜光穿透竹叶，地面光斑，远处两个人影站立，青绿水墨气质，宽幅构图，无文字" &

gen psycho-shower \
  "电影 key art，黑白胶片，老式浴室白色浴帘，灯泡昏光，浴帘后剪影，高对比，希区柯克 1960 年代质感，无文字" &

gen interstellar-cooper-leaves \
  "电影 key art，黄昏玉米田，老旧皮卡车独自驶向远方土路，地平线橙红，前景麦穗虚化，电影宽幅，无文字" &

gen godfather-funeral \
  "电影 key art，西西里小镇老街，黑西装葬礼队伍缓行，1970 年代色调，深色调，雨后湿润石板路，电影宽幅，无文字" &

wait
echo "[done] 5 covers generated."
