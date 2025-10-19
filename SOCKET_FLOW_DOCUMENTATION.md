# 「2種人」遊戲 WebSocket 流程文檔

## 🔗 完整 Socket 連線邏輯流程

### 1. 創建房間流程
```
主持人操作: CreateRoomView
    ↓
確保 WebSocket 連接 (connect())
    ↓
發送: CREATE_ROOM
    {
        type: 'CREATE_ROOM',
        data: {
            hostName: string,
            totalQuestions: number,
            questionTimeLimit: number
        }
    }
    ↓
後端處理: handleCreateRoom()
    ↓
回傳: ROOM_CREATED
    {
        type: 'ROOM_CREATED',
        data: {
            roomId: string,
            hostName: string,
            totalQuestions: number,
            questionTimeLimit: number
        }
    }
    ↓
前端處理: handleRoomCreated()
    ↓
設置 gameStore.currentRoom
    ↓
自動跳轉: /lobby/{roomId}
```

### 2. 加入房間流程
```
玩家操作: JoinRoomView
    ↓
確保 WebSocket 連接 (connect())
    ↓
發送: JOIN_ROOM
    {
        type: 'JOIN_ROOM',
        data: {
            roomId: string,
            playerName: string
        }
    }
    ↓
後端處理: handleJoinRoom()
    ↓
回傳: PLAYER_JOINED (廣播給房間所有人)
    {
        type: 'PLAYER_JOINED',
        data: {
            playerId: string,
            playerName: string,
            roomId: string,
            players: Player[],
            totalPlayers: number
        }
    }
    ↓
前端處理: handlePlayerJoined()
    ↓
設置 gameStore.currentRoom & gameStore.currentPlayer
    ↓
自動跳轉: /game/player/{roomId}
```

### 3. 開始遊戲流程
```
主持人操作: LobbyView (點擊開始遊戲)
    ↓
發送: START_GAME
    {
        type: 'START_GAME',
        data: {
            roomId: string
        }
    }
    ↓
後端處理: handleStartGame()
    ↓
調用: gameService.StartTwoTypesGame()
    ↓
廣播: GAME_STARTED
    {
        type: 'GAME_STARTED',
        data: {
            roomId: string,
            firstHost: string,
            totalQuestions: number
        }
    }
    ↓
廣播: NEW_QUESTION
    {
        type: 'NEW_QUESTION',
        data: {
            questionId: number,
            questionText: string,
            optionA: string,
            optionB: string,
            currentQuestion: number,
            totalQuestions: number,
            hostPlayer: string,
            timeLimit: number
        }
    }
    ↓
開始倒數計時: startQuestionTimer()
    ↓
前端處理: handleGameStarted() & handleNewQuestion()
    ↓
所有玩家切換到答題畫面
```

### 4. 答題流程
```
玩家操作: GamePlayerView (選擇答案)
    ↓
發送: SUBMIT_ANSWER
    {
        type: 'SUBMIT_ANSWER',
        data: {
            roomId: string,
            questionId: number,
            answer: 'A' | 'B',
            timeUsed: number
        }
    }
    ↓
後端處理: handleSubmitAnswer()
    ↓
調用: gameService.SubmitTwoTypesAnswer()
    ↓
回傳: ANSWER_SUBMITTED (給提交者)
    {
        type: 'ANSWER_SUBMITTED',
        data: {
            success: true,
            answer: string,
            timeUsed: number
        }
    }
    ↓
檢查: checkAllPlayersAnswered()
    ↓
如果全部答完: calculateAndShowResults()
```

### 5. 倒數計時流程
```
後端自動: startQuestionTimer()
    ↓
每秒廣播: TIMER_UPDATE
    {
        type: 'TIMER_UPDATE',
        data: {
            timeLeft: number
        }
    }
    ↓
前端處理: handleTimerUpdate()
    ↓
更新: gameStore.timeLeft
    ↓
UI 自動更新倒數顯示
    ↓
時間到: 廣播 QUESTION_TIMEOUT
    {
        type: 'QUESTION_TIMEOUT',
        data: {
            message: '答題時間結束'
        }
    }
```

### 6. 計分與下一題流程
```
後端處理: calculateAndShowResults()
    ↓
計算分數: gameService.CalculateTwoTypesScores()
    ↓
廣播: SCORES_UPDATE
    {
        type: 'SCORES_UPDATE',
        data: {
            scores: ScoreInfo[],
            currentQuestion: number,
            hostAnswer: string
        }
    }
    ↓
延遲 3 秒: handleNextQuestion()
    ↓
調用: gameService.NextTwoTypesQuestion()
    ↓
檢查遊戲是否結束:
    如果結束 → 廣播 GAME_FINISHED
    如果繼續 → 廣播 NEW_QUESTION (下一題)
```

### 7. 遊戲結束流程
```
後端判斷: 當 currentQuestion > totalQuestions
    ↓
調用: gameService.GetFinalRanking()
    ↓
廣播: GAME_FINISHED
    {
        type: 'GAME_FINISHED',
        data: {
            finalRanking: ScoreInfo[],
            message: '遊戲結束！'
        }
    }
    ↓
前端處理: handleGameFinished()
    ↓
設置: gameStore.gameState = 'finished'
    ↓
自動跳轉: /results/{roomId}
```

## 📡 所有 WebSocket 事件類型

### 客戶端發送事件：
- `CREATE_ROOM` - 創建房間
- `JOIN_ROOM` - 加入房間  
- `START_GAME` - 開始遊戲
- `SUBMIT_ANSWER` - 提交答案
- `LEAVE_ROOM` - 離開房間
- `PING` - 心跳檢測

### 服務端發送事件：
- `ROOM_CREATED` - 房間創建成功
- `PLAYER_JOINED` - 玩家加入房間
- `PLAYER_LEFT` - 玩家離開房間
- `GAME_STARTED` - 遊戲開始
- `NEW_QUESTION` - 新題目
- `TIMER_UPDATE` - 倒數更新  
- `QUESTION_TIMEOUT` - 答題時間結束
- `ANSWER_SUBMITTED` - 答案提交確認
- `SCORES_UPDATE` - 分數更新
- `GAME_FINISHED` - 遊戲結束
- `ERROR` - 錯誤訊息
- `PONG` - 心跳回應

## 🎮「2種人」遊戲特殊邏輯

### 主角輪替機制：
1. 第一題隨機選擇主角
2. 後續每題按玩家順序輪流
3. 主角需要真實選擇，其他人猜測主角選擇

### 計分規則：
- **主角**: 答題得 50 分（基礎分）
- **猜測者**: 猜對主角答案得 100 分 + 速度獎勵（剩餘時間 × 2）
- **猜測者**: 猜錯得 0 分

### 自動流程：
- 倒數計時 30 秒（可配置）
- 時間到或全員答完自動進入下一題
- 延遲 3 秒顯示結果後進入下一題
- 所有題目完成後自動結束遊戲

## 🚨 錯誤處理機制

### 連接相關：
- WebSocket 連接失敗自動重連（最多 5 次）
- 連接超時提示用戶重試
- 網路斷線自動嘗試重連

### 遊戲狀態：
- 房間不存在返回錯誤
- 遊戲狀態不正確拒絕操作
- 權限檢查（只有主持人能開始遊戲）

### 數據驗證：
- 答案格式驗證（只接受 A 或 B）
- 房間代碼格式檢查
- 玩家名稱長度限制

## 📱 前端狀態管理

### GameStore 狀態：
- `currentRoom` - 當前房間信息
- `currentPlayer` - 當前玩家信息
- `currentQuestion` - 當前題目
- `currentHost` - 當前主角
- `gameState` - 遊戲狀態 ('waiting' | 'playing' | 'show_result' | 'finished')
- `timeLeft` - 剩餘時間

### 頁面跳轉邏輯：
- 創建房間成功 → `/lobby/{roomId}`
- 加入房間成功 → `/game/player/{roomId}`
- 遊戲結束 → `/results/{roomId}`

此文檔涵蓋了完整的 WebSocket 通信流程和「2種人」遊戲的所有核心邏輯。