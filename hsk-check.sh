#!/bin/bash
# 花生壳健康检查：经花生壳下载大资源，与本地对比完整性（免费版会截断大响应）
# 用法:
#   ./hsk-check.sh              # 单次检查，打印当前状态
#   ./hsk-check.sh --watch 60   # 每 60 秒检查，状态变化时弹 macOS 通知
HSK_DOMAIN="${HSK_DOMAIN:-http://si131og190681.vicp.fun}"
LOCAL="${LOCAL:-http://localhost:3000}"

check() {
  # 动态取当前构建中体积最大的 JS 资源（大文件才暴露截断问题，小文件永远能过）
  local asset="" a max=0 sz
  for a in $(curl -s --max-time 10 "$LOCAL/" | grep -oE '/assets/[a-zA-Z0-9_-]+\.js' | sort -u); do
    sz=$(curl -s --max-time 10 -o /dev/null -w "%{size_download}" "$LOCAL$a")
    if [ "$sz" -gt "$max" ]; then max=$sz; asset=$a; fi
  done
  if [ -z "$asset" ]; then
    echo "[$(date '+%H:%M:%S')] ⚠ 本地服务不可用，无法检测"
    return 2
  fi
  local expected got
  expected=$max
  got=$(curl -s --max-time 60 -o /dev/null -w "%{size_download}" "$HSK_DOMAIN$asset")
  if [ "$got" = "$expected" ]; then
    echo "[$(date '+%H:%M:%S')] ✅ 花生壳正常（$got/$expected B）"
    return 0
  else
    echo "[$(date '+%H:%M:%S')] ❌ 花生壳截断：收到 $got B / 应为 $expected B"
    return 1
  fi
}

if [ "$1" = "--watch" ]; then
  INTERVAL="${2:-60}"
  PREV=""
  echo "开始监控花生壳（每 ${INTERVAL}s 检查一次，Ctrl+C 停止）"
  while true; do
    OUT=$(check)
    STATE=$(echo "$OUT" | grep -oE "✅|❌")
    echo "$OUT"
    if [ "$STATE" != "$PREV" ] && [ -n "$PREV" ]; then
      osascript -e "display notification \"$(echo "$OUT" | sed 's/\[[^]]*\] //')\" with title \"花生壳状态变化\"" 2>/dev/null
    fi
    PREV="$STATE"
    sleep "$INTERVAL"
  done
else
  check
fi
