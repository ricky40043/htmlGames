#!/bin/bash

echo "🚀 部署小遊戲集合到 Vercel"
echo "================================"

# 檢查是否安裝了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安裝"
    echo "請先執行: npm install -g vercel"
    exit 1
fi

echo "✅ 檢查項目檔案..."
if [ ! -f "index.html" ]; then
    echo "❌ 找不到 index.html"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ 找不到 vercel.json"
    exit 1
fi

echo "✅ 所有檔案就緒"
echo ""

# 檢查是否已登入
echo "🔐 檢查 Vercel 登入狀態..."
if ! vercel whoami &> /dev/null; then
    echo "請先登入 Vercel:"
    vercel login
fi

echo ""
echo "🚀 開始部署..."
vercel --prod

echo ""
echo "✅ 部署完成！"
echo "🌟 你的網站已經上線了！"