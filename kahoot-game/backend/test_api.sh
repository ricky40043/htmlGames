#!/bin/bash

echo "🧪 API 端點測試腳本"
echo "=================="

BASE_URL="http://localhost:8080"

# 測試健康檢查
echo "1. 測試健康檢查..."
curl -s "$BASE_URL/api/health" | jq '.' || echo "❌ 健康檢查失敗"
echo ""

# 測試獲取隨機題目
echo "2. 測試獲取隨機題目..."
curl -s "$BASE_URL/api/questions/random/3" | jq '.' || echo "❌ 獲取題目失敗"
echo ""

# 測試創建房間
echo "3. 測試創建房間..."
ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms" \
  -H "Content-Type: application/json" \
  -d '{
    "hostName": "測試主持人",
    "totalQuestions": 5,
    "questionTimeLimit": 30
  }')

echo "$ROOM_RESPONSE" | jq '.'
ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.data.roomId')
echo ""

# 測試獲取房間資訊
if [ "$ROOM_ID" != "null" ] && [ "$ROOM_ID" != "" ]; then
    echo "4. 測試獲取房間資訊 (房間ID: $ROOM_ID)..."
    curl -s "$BASE_URL/api/rooms/$ROOM_ID" | jq '.' || echo "❌ 獲取房間失敗"
    echo ""
    
    echo "5. 測試刪除房間..."
    curl -s -X DELETE "$BASE_URL/api/rooms/$ROOM_ID" | jq '.' || echo "❌ 刪除房間失敗"
    echo ""
else
    echo "❌ 無法獲取房間ID，跳過房間相關測試"
fi

# 測試獲取活躍遊戲
echo "6. 測試獲取活躍遊戲..."
curl -s "$BASE_URL/api/games" | jq '.' || echo "❌ 獲取活躍遊戲失敗"
echo ""

echo "✅ API 測試完成！"