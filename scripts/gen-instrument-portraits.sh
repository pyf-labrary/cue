#!/usr/bin/env bash
# Generate 20 cinematic instrument portraits via Dreamina.
# Consistent style: single-source light on black, 35mm grain, no text.
# Output: public/atlas/<id>.jpg  (1080x1080 jpg).

set -euo pipefail
cd "$(dirname "$0")/.."

FORCE=""
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p public/atlas

# Format: id|chinese name|prompt-detail
SPEC=$(cat <<'EOF'
cello|大提琴|深棕红色木纹，单束温暖侧光，沉稳静谧
violin|小提琴|漆面反光，单束侧光，丝绒衬底，奢华含蓄
contrabass|低音提琴|深棕巨大琴身，单束冷暖侧光，沉重低音感
erhu|二胡|深红木轸，单束琥珀光，丝竹意境
pizzicato-strings|拨弦乐组|多把小提琴琴弓静置，单束侧光，几何留白
flute|长笛|银色金属反光，单束冷白光，气流冷调
clarinet|单簧管|深木黑色管身，单束冷暖侧光，深夜烟雾感
oboe|双簧管|金黄色簧片细节，单束侧光，专注紧致
french-horn|圆号|环绕的铜管弯曲，单束暖光，圆润巨大
trumpet|小号|闪亮黄铜，单束高对比顶光，金属反光
timpani|定音鼓|铜大鼓侧面，单束戏剧侧光，深沉重量
taiko|太鼓|日式木鼓，单束琥珀光，仪式感
xylophone|木琴|木条排列，单束冷白光，几何节奏
piano|三角钢琴|半开琴盖，深黑色漆面，单束顶光，私密
celesta|钢片琴|金属铃片细节，单束银光，闪烁童话感
pipe-organ|管风琴|高耸金属管，单束冷蓝光，教堂神圣
guzheng|古筝|长琴弦排列，单束暖金光，古典优雅
pipa|琵琶|梨形琴身，单束深红光，传统武戏
guqin|古琴|横置漆木古琴，单束月光，山水隐逸
choir|合唱|话筒林立的空荡录音棚，单束冷光，神圣空旷
synth-pad|合成器|模拟合成器旋钮和跳线，单束霓虹光，电子未来
EOF
)

gen_one() {
  local id="$1"; local name="$2"; local detail="$3"
  local out="public/atlas/$id.jpg"
  if [ -z "${FORCE_GLOBAL:-}" ] && [ -f "$out" ]; then
    echo "[skip] $id"
    return
  fi
  local prompt="电影 key art 静物特写，$name 单件乐器，黑色背景，$detail，35mm 胶片颗粒，电影海报质感，1:1 构图，无文字，无人物"
  echo "[gen ] $id"
  img-dreamina --prompt "$prompt" --out "$out" --ratio 1:1 --model 5.0 --resolution 2k --max-width 1080 --quality 86 2>&1 | tail -3 | sed "s/^/  [$id] /"
}

export -f gen_one
export FORCE_GLOBAL="$FORCE"

# Run 4 in parallel
echo "$SPEC" | while IFS='|' read -r id name detail; do
  [ -z "$id" ] && continue
  echo "$id|$name|$detail"
done | xargs -d '\n' -n 1 -P 4 -I{} bash -c '
  IFS="|" read -r id name detail <<< "{}"
  gen_one "$id" "$name" "$detail"
'

echo "[done] instrument portraits"
