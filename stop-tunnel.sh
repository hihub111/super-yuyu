#!/bin/bash
# 一键停止 yuyu 后端 + cloudflared 隧道
# 用法: ./stop-tunnel.sh
# 注意: 隧道停止后 trycloudflare 地址作废，重启后地址会变

# 1. 停隧道
if pgrep -f "cloudflared tunnel" > /dev/null; then
  pkill -f "cloudflared tunnel"
  echo "✅ 隧道已停止"
else
  echo "ℹ 隧道未在运行"
fi

# 2. 停后端（按 3000 端口找）
PIDS=$(lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill $PIDS
  echo "✅ 后端已停止 (:3000)"
else
  echo "ℹ 后端未在运行"
fi
