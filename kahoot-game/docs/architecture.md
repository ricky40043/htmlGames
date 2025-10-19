# 🏗️ 系統架構設計

## 資料庫 Schema 設計

### Redis 快取結構

#### 房間狀態
```
room:{roomId} = {
  "id": "ABC123",
  "status": "waiting|playing|finished",
  "hostId": "host_socket_id",
  "currentQuestion": 0,
  "totalQuestions": 10,
  "currentHost": "player_socket_id",
  "timeLeft": 30,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 玩家狀態
```
player:{socketId} = {
  "id": "socket_id",
  "name": "玩家暱稱",
  "roomId": "ABC123",
  "score": 850,
  "isHost": false,
  "isConnected": true,
  "lastActivity": "2024-01-01T00:00:00Z"
}
```

#### 房間玩家列表
```
room:{roomId}:players = ["socket_id1", "socket_id2", "socket_id3"]
```

#### 答題記錄
```
question:{roomId}:{questionId} = {
  "answers": {
    "socket_id1": {"answer": "A", "time": 5.2, "correct": true},
    "socket_id2": {"answer": "B", "time": 8.1, "correct": false}
  },
  "hostPlayer": "socket_id1"
}
```

### PostgreSQL 持久化

#### 遊戲記錄表
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(10) UNIQUE NOT NULL,
    total_players INTEGER,
    total_questions INTEGER,
    winner_name VARCHAR(50),
    winner_score INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);
```

#### 玩家統計表
```sql
CREATE TABLE player_stats (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    game_id INTEGER REFERENCES games(id),
    final_score INTEGER,
    correct_answers INTEGER,
    total_answers INTEGER,
    avg_response_time DECIMAL(4,2),
    times_as_host INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 題目資料庫
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a VARCHAR(100) NOT NULL,
    option_b VARCHAR(100) NOT NULL,
    option_c VARCHAR(100) NOT NULL,
    option_d VARCHAR(100) NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    category VARCHAR(50),
    difficulty INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## WebSocket 訊息格式定義

### 客戶端 → 服務器

#### 加入房間
```json
{
  "type": "JOIN_ROOM",
  "data": {
    "roomId": "ABC123",
    "playerName": "玩家暱稱"
  }
}
```

#### 創建房間
```json
{
  "type": "CREATE_ROOM",
  "data": {
    "hostName": "主持人暱稱",
    "totalQuestions": 10,
    "questionTime": 30
  }
}
```

#### 開始遊戲
```json
{
  "type": "START_GAME",
  "data": {
    "roomId": "ABC123"
  }
}
```

#### 提交答案
```json
{
  "type": "SUBMIT_ANSWER",
  "data": {
    "roomId": "ABC123",
    "questionId": 1,
    "answer": "A",
    "timeUsed": 5.2
  }
}
```

### 服務器 → 客戶端

#### 房間狀態更新
```json
{
  "type": "ROOM_UPDATE",
  "data": {
    "roomId": "ABC123",
    "players": [
      {"id": "socket1", "name": "玩家1", "score": 500},
      {"id": "socket2", "name": "玩家2", "score": 350}
    ],
    "status": "waiting"
  }
}
```

#### 新題目
```json
{
  "type": "NEW_QUESTION",
  "data": {
    "questionId": 1,
    "question": "台灣最高的山是？",
    "options": ["玉山", "雪山", "大霸尖山", "合歡山"],
    "hostPlayer": "socket1",
    "timeLimit": 30
  }
}
```

#### 答題結果
```json
{
  "type": "QUESTION_RESULT",
  "data": {
    "correctAnswer": "A",
    "scores": [
      {"id": "socket1", "name": "玩家1", "score": 650, "gained": 150},
      {"id": "socket2", "name": "玩家2", "score": 350, "gained": 0}
    ],
    "nextHost": "socket2"
  }
}
```

#### 遊戲結束
```json
{
  "type": "GAME_FINISHED",
  "data": {
    "finalScores": [
      {"rank": 1, "name": "玩家1", "score": 1500},
      {"rank": 2, "name": "玩家2", "score": 1200},
      {"rank": 3, "name": "玩家3", "score": 800}
    ],
    "gameStats": {
      "totalQuestions": 10,
      "duration": "5:30",
      "totalPlayers": 8
    }
  }
}
```

## 🔄 遊戲狀態機

```
WAITING (等待玩家)
    ↓ START_GAME
PLAYING (遊戲進行中)
    ├─ QUESTION_DISPLAY (顯示題目)
    ├─ ANSWERING (答題時間)
    ├─ SHOW_RESULT (顯示結果)
    └─ NEXT_QUESTION (下一題) → QUESTION_DISPLAY
    ↓ GAME_FINISHED
FINISHED (遊戲結束)
```

## 📱 API 端點設計

### REST API
```
GET    /api/rooms                    # 獲取活躍房間列表
POST   /api/rooms                    # 創建新房間
GET    /api/rooms/{roomId}           # 獲取房間資訊
DELETE /api/rooms/{roomId}           # 刪除房間

GET    /api/questions                # 獲取題目列表
GET    /api/questions/random/{count} # 隨機獲取題目

GET    /api/games/{gameId}/stats     # 獲取遊戲統計
```

### WebSocket 端點
```
ws://localhost:8080/ws/{roomId}      # WebSocket 連線端點
```