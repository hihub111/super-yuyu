#!/bin/bash
# 一键启动语语服务 + cloudflared 内网隧道（试用版）
# 用法: ./start-tunnel.sh
# 注意: 快速隧道地址每次重启都会变化，启动后请重新把地址发给队友
cd "$(dirname "$0")/server"

# 1. 启动后端（若未运行）
if curl -s -o /dev/null --max-time 2 http://localhost:3000/api/auth/me; then
  echo "ℹ 后端已在运行 (:3000)"
else
  echo "▶ 启动后端服务…"
  nohup node src/index.js > /tmp/yuyu-server.log 2>&1 &
  sleep 2
fi

# 2. 启动隧道（若未运行）
if pgrep -f "cloudflared tunnel" > /dev/null; then
  echo "⚠ 隧道已在运行"
  grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/yuyu-tunnel.log | head -1
  exit 0
fi

echo "▶ 启动 cloudflared 隧道（http2）…"
nohup cloudflared tunnel --protocol http2 --url http://localhost:3000 > /tmp/yuyu-tunnel.log 2>&1 &
sleep 8
URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/yuyu-tunnel.log | head -1)
if [ -n "$URL" ]; then
  echo ""
  echo "✅ 服务已就绪，把下面地址发给队友："
  echo ""
  echo "   $URL"
  echo ""
  echo "（注册邀请码见 server/.env 的 TEAM_INVITE_CODE）"
  echo "（每次重启电脑后重新运行本脚本即可，地址会变，需重新发链接）"
else
  echo "❌ 隧道启动失败，日志: /tmp/yuyu-tunnel.log"
  exit 1
fi
