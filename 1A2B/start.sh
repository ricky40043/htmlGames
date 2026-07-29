#!/usr/bin/env bash

echo "========================================="
echo "🚀 正在啟動連線版 1A2B 遊戲後端與前端託管..."
echo "========================================="

cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
  echo "📦 正在安裝後端依賴..."
  npm install
fi

echo "🎮 啟動 Socket.IO 伺服器中..."
npm start
