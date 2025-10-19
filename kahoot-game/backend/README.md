# 🎮 Kahoot 風格多人遊戲後端

## 🚀 快速開始

### 環境要求
- Go 1.21+
- Redis 6.0+
- PostgreSQL 12+

### 本地開發
```bash
# 1. 進入後端目錄
cd kahoot-game/backend

# 2. 安裝依賴
go mod tidy

# 3. 複製環境配置文件
cp .env.example .env

# 4. 編輯 .env 文件配置資料庫

# 5. 啟動服務器
go run cmd/main.go
```

### Docker 開發環境
```bash
# 啟動 Redis 和 PostgreSQL
docker run -d --name redis -p 6379:6379 redis:alpine
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15

# 等待資料庫啟動後執行程式
go run cmd/main.go
```

## 📁 專案結構

```
backend/
├── cmd/                    # 主程式入口
│   └── main.go
├── internal/              # 內部套件
│   ├── config/           # 配置管理
│   ├── database/         # 資料庫連線
│   ├── handlers/         # HTTP 處理器
│   ├── models/           # 資料模型
│   ├── services/         # 業務邏輯
│   └── websocket/        # WebSocket 處理
├── docs/                 # 技術文檔
├── .env                  # 環境變數
├── go.mod               # Go 模組
└── README.md
```

## 🌐 API 端點

### REST API
```
GET    /api/health                    # 健康檢查
GET    /api/games                     # 獲取活躍遊戲
GET    /api/games/:gameId/stats       # 獲取遊戲統計
POST   /api/rooms                     # 創建房間
GET    /api/rooms/:roomId             # 獲取房間資訊
DELETE /api/rooms/:roomId             # 刪除房間
GET    /api/questions                 # 獲取題目列表
GET    /api/questions/random/:count   # 獲取隨機題目
POST   /api/questions                 # 創建新題目
```

### WebSocket
```
ws://localhost:8080/ws               # WebSocket 連線
ws://localhost:8080/ws/:roomId       # 房間專用連線
```

## 📡 WebSocket 訊息

### 客戶端 → 服務器
- `CREATE_ROOM` - 創建房間
- `JOIN_ROOM` - 加入房間  
- `START_GAME` - 開始遊戲
- `SUBMIT_ANSWER` - 提交答案
- `LEAVE_ROOM` - 離開房間

### 服務器 → 客戶端
- `ROOM_CREATED` - 房間創建成功
- `PLAYER_JOINED` - 玩家加入
- `GAME_STARTED` - 遊戲開始
- `NEW_QUESTION` - 新題目
- `QUESTION_RESULT` - 題目結果
- `GAME_FINISHED` - 遊戲結束

## 🗄️ 資料庫

### 自動建立表格
程式啟動時會自動建立所需的資料庫表格和示例資料。

### 主要表格
- `games` - 遊戲記錄
- `player_stats` - 玩家統計
- `questions` - 題目資料庫
- `answer_logs` - 答題記錄
- `room_logs` - 房間活動日誌

## 🔧 配置說明

主要環境變數：
```bash
PORT=8080                    # 服務器端口
REDIS_HOST=localhost         # Redis 主機
DB_HOST=localhost           # PostgreSQL 主機
MAX_PLAYERS_PER_ROOM=20     # 每房間最大玩家數
ROOM_ID_LENGTH=6            # 房間ID長度
```

## 🚀 部署

### Heroku
```bash
git push heroku main
```

### Railway
```bash
railway deploy
```

### Docker
```bash
docker build -t kahoot-game .
docker run -p 8080:8080 kahoot-game
```