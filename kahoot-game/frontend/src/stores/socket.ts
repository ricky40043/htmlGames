import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGameStore } from './game'
import { useUIStore } from './ui'
import type { WebSocketMessage } from '@/types'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const gameStore = useGameStore()
  const uiStore = useUIStore()

  // WebSocket 連線
  const connect = () => {
    const wsUrl = import.meta.env.DEV 
      ? 'ws://localhost:8080/ws' 
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

    console.log('🔗 嘗試連接到:', wsUrl)

    try {
      socket.value = new WebSocket(wsUrl)
    } catch (error) {
      console.error('❌ WebSocket 創建失敗:', error)
      uiStore.showError('無法創建 WebSocket 連線')
      return
    }

    // WebSocket 事件處理
    socket.value.onopen = () => {
      console.log('✅ WebSocket 連線成功')
      isConnected.value = true
      reconnectAttempts.value = 0
      uiStore.showSuccess('連線成功')
    }

    socket.value.onclose = (event) => {
      console.log('❌ WebSocket 連線斷開:', event.code, event.reason)
      isConnected.value = false
      uiStore.showError('連線已斷開')
      
      // 自動重連
      if (reconnectAttempts.value < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.value++
          console.log(`🔄 重連嘗試 ${reconnectAttempts.value}/${maxReconnectAttempts}`)
          connect()
        }, 2000 * reconnectAttempts.value)
      }
    }

    socket.value.onerror = (error) => {
      console.error('🚨 WebSocket 錯誤:', error)
      isConnected.value = false
      uiStore.showError('WebSocket 連線錯誤')
    }

    socket.value.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('❌ 訊息解析錯誤:', error)
      }
    }
  }

  // 處理收到的訊息
  const handleMessage = (message: any) => {
    console.log('📨 收到訊息:', message)
    
    // 詳細日誌記錄
    if (window.debugLogger) {
      window.debugLogger.info('WEBSOCKET', `收到訊息: ${message.type}`, message)
    }
    
    switch (message.type) {
      case 'ROOM_CREATED':
        handleRoomCreated(message.data)
        break
      case 'PLAYER_JOINED':
        handlePlayerJoined(message.data)
        break
      case 'PLAYER_LEFT':
        handlePlayerLeft(message.data)
        break
      case 'GAME_STARTED':
        handleGameStarted(message.data)
        break
      case 'NEW_QUESTION':
        handleNewQuestion(message.data)
        break
      case 'TIMER_UPDATE':
        handleTimerUpdate(message.data)
        break
      case 'QUESTION_TIMEOUT':
        handleQuestionTimeout(message.data)
        break
      case 'ANSWER_SUBMITTED':
        handleAnswerSubmitted(message.data)
        break
      case 'QUESTION_FINISHED':
        handleQuestionFinished(message.data)
        break
      case 'SCORES_UPDATE':
        handleScoresUpdate(message.data)
        break
      case 'GAME_FINISHED':
        handleGameFinished(message.data)
        break
      case 'ERROR':
        handleError(message.data)
        break
      case 'PONG':
        console.log('🏓 收到 Pong:', message.data)
        break
      default:
        console.log('❓ 未知訊息類型:', message.type)
    }
  }

  // 事件處理函數
  const handleRoomCreated = (data: any) => {
      console.log('🏠 房間創建成功:', data)
      gameStore.setRoom({
        id: data.roomId,
        hostId: gameStore.currentPlayer?.id || '',
        hostName: data.hostName,
        status: 'waiting',
        players: {},
        currentQuestion: 0,
        totalQuestions: data.totalQuestions || 10,
        questionTimeLimit: data.questionTimeLimit || 30,
        currentHost: '',
        timeLeft: 0,
        questions: [],
        createdAt: new Date(),
        roomUrl: data.roomUrl || `${window.location.origin}/join/${data.roomId}`,
        joinCode: data.joinCode || data.roomId
      })
      uiStore.showSuccess('房間創建成功！')
  }

  const handlePlayerJoined = (data: any) => {
      console.log('👤 玩家加入:', data)
      
      // 詳細日誌記錄
      if (window.debugLogger) {
        window.debugLogger.info('PLAYER_JOINED', '收到玩家加入事件', {
          playerId: data.playerId,
          playerName: data.playerName,
          roomId: data.roomId,
          totalPlayers: data.totalPlayers,
          playersCount: data.players ? data.players.length : 0,
          players: data.players,
          hasCurrentRoom: !!gameStore.currentRoom,
          allData: data
        })
      }
      
      // 如果是當前玩家自己加入房間且尚未設置房間
      if (data.playerId && !gameStore.currentRoom) {
        // 設置房間信息
        gameStore.setRoom({
          id: data.roomId,
          hostId: '', // 將在獲取完整房間信息時更新
          hostName: '',
          status: 'waiting',
          players: {},
          currentQuestion: 0,
          totalQuestions: 10, // 預設值，將在獲取完整信息時更新
          questionTimeLimit: 30,
          currentHost: '',
          timeLeft: 0,
          questions: [],
          createdAt: new Date()
        })
        
        // 設置當前玩家信息
        gameStore.setPlayer({
          id: data.playerId,
          name: data.playerName,
          roomId: data.roomId,
          score: 0,
          isHost: false,
          isConnected: true,
          lastActivity: new Date()
        })
        
        if (window.debugLogger) {
          window.debugLogger.info('PLAYER_JOINED', '設置當前玩家和房間完成', {
            currentPlayerId: data.playerId,
            currentPlayerName: data.playerName,
            roomId: data.roomId
          })
        }
      }
      
      // 處理完整玩家列表更新
      if (data.players && Array.isArray(data.players)) {
        if (window.debugLogger) {
          window.debugLogger.info('PLAYER_JOINED', '更新玩家列表', {
            receivedPlayersCount: data.players.length,
            currentPlayersCount: Object.keys(gameStore.currentRoom?.players || {}).length
          })
        }
        
        // 清空現有玩家列表（避免重複）
        if (gameStore.currentRoom) {
          gameStore.currentRoom.players = {}
        }
        
        // 添加所有玩家到房間
        data.players.forEach((player: any) => {
          gameStore.addPlayer({
            id: player.id,
            name: player.name,
            roomId: data.roomId,
            score: player.score || 0,
            isHost: player.isHost || false,
            isConnected: true,
            lastActivity: new Date()
          })
          
          if (window.debugLogger) {
            window.debugLogger.debug('PLAYER_JOINED', `添加玩家: ${player.name}`, {
              playerId: player.id,
              playerName: player.name,
              isHost: player.isHost
            })
          }
        })
        
        if (window.debugLogger) {
          window.debugLogger.info('PLAYER_JOINED', '玩家列表更新完成', {
            finalPlayersCount: Object.keys(gameStore.currentRoom?.players || {}).length,
            playersInStore: Object.values(gameStore.currentRoom?.players || {}).map(p => p.name)
          })
        }
      } else {
        // 如果沒有完整列表，只添加單個玩家
        if (data.playerId && data.playerName) {
          gameStore.addPlayer({
            id: data.playerId,
            name: data.playerName,
            roomId: data.roomId,
            score: 0,
            isHost: false,
            isConnected: true,
            lastActivity: new Date()
          })
          
          if (window.debugLogger) {
            window.debugLogger.info('PLAYER_JOINED', '添加單個玩家', {
              playerId: data.playerId,
              playerName: data.playerName
            })
          }
        }
      }
      
      uiStore.showSuccess(`${data.playerName} 加入了遊戲`)
  }

  const handlePlayerLeft = (data: any) => {
      console.log('👋 玩家離開:', data)
      gameStore.removePlayer(data.playerId)
      uiStore.showInfo(`${data.playerName} 離開了遊戲`)
  }

  const handleGameStarted = (data: any) => {
      console.log('🎮 遊戲開始:', data)
      gameStore.setGameState('playing')
      gameStore.setCurrentHost(data.firstHost)
      uiStore.showSuccess('遊戲開始！')
  }

  const handleNewQuestion = (data: any) => {
      console.log('❓ 新題目:', data)
      
      // 詳細日誌記錄
      if (window.debugLogger) {
        window.debugLogger.info('NEW_QUESTION', '收到新題目數據', {
          questionId: data.questionId,
          questionText: data.questionText,
          question: data.question, // 可能的字段
          optionA: data.optionA,
          optionB: data.optionB,
          currentQuestion: data.currentQuestion,
          questionIndex: data.questionIndex,
          hostPlayer: data.hostPlayer,
          timeLimit: data.timeLimit,
          allData: data
        })
      }
      
      // 檢查題目文字是否存在
      const questionText = data.questionText || data.question
      if (!questionText) {
        console.error('❌ 題目文字為空！', data)
        if (window.debugLogger) {
          window.debugLogger.error('NEW_QUESTION', '題目文字為空', data)
        }
        uiStore.showError('收到的題目內容為空')
        return
      }
      
      // 設置遊戲狀態 - 先設置索引再設置題目
      const questionIndex = data.questionIndex !== undefined ? data.questionIndex : (data.currentQuestion - 1)
      
      if (window.debugLogger) {
        window.debugLogger.info('NEW_QUESTION', `設置題目索引為: ${questionIndex}`, {
          beforeIndex: gameStore.currentQuestionIndex,
          afterIndex: questionIndex,
          questionsLength: gameStore.questions.length
        })
      }
      
      // 先設置索引，再設置題目內容
      gameStore.setCurrentQuestionIndex(questionIndex)
      
      // 設置當前題目
      gameStore.setCurrentQuestion({
        id: data.questionId,
        questionText: questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        category: data.category || '',
        timesUsed: 0,
        isActive: true,
        createdAt: new Date()
      })
      
      // 設置其他遊戲狀態
      gameStore.setCurrentHost(data.hostPlayer)
      gameStore.updateTimeLeft(data.timeLimit)
      gameStore.setGameState('playing')
      
      // 驗證題目是否正確設置
      const currentQuestion = gameStore.currentQuestion
      if (window.debugLogger) {
        window.debugLogger.info('NEW_QUESTION', '驗證題目設置', {
          hasCurrentQuestion: !!currentQuestion,
          currentQuestionText: currentQuestion?.questionText,
          currentQuestionIndex: gameStore.currentQuestionIndex,
          questionsArrayLength: gameStore.questions.length
        })
      }
      
      // 顯示題目和主角信息
      const hostPlayerName = gameStore.getPlayerById(data.hostPlayer)?.name || '未知'
      const questionNumber = data.currentQuestion || (questionIndex + 1)
      
      if (window.debugLogger) {
        window.debugLogger.info('NEW_QUESTION', `設置第 ${questionNumber} 題完成`, {
          questionText,
          questionIndex,
          hostPlayerName,
          gameState: gameStore.gameState,
          finalCheck: !!gameStore.currentQuestion
        })
      }
      
      uiStore.showInfo(`第 ${questionNumber} 題 - 主角：${hostPlayerName}`)
  }

  const handleTimerUpdate = (data: any) => {
    console.log('⏰ 計時器更新:', data)
    
    // 詳細日誌記錄計時器更新
    if (window.debugLogger) {
      const timestamp = Date.now()
      
      // 檢查是否有重複計時器
      if (!window.timerEvents) {
        window.timerEvents = []
      }
      
      // 添加當前計時器事件
      window.timerEvents.push({
        timestamp,
        timeLeft: data.timeLeft,
        questionIndex: data.questionIndex || gameStore.currentQuestionIndex
      })
      
      // 只保留最近5秒的事件
      window.timerEvents = window.timerEvents.filter(event => 
        timestamp - event.timestamp < 5000
      )
      
      // 檢查是否有重複的計時器事件
      const recentEvents = window.timerEvents.filter(event => 
        timestamp - event.timestamp < 2000 && 
        event.questionIndex === (data.questionIndex || gameStore.currentQuestionIndex)
      )
      
      const sameTimes = recentEvents.filter(event => event.timeLeft === data.timeLeft)
      
      if (sameTimes.length > 1) {
        window.debugLogger.warn('TIMER_UPDATE', `檢測到重複計時器！時間 ${data.timeLeft}`, {
          duplicateCount: sameTimes.length,
          questionIndex: data.questionIndex || gameStore.currentQuestionIndex,
          recentEvents: recentEvents,
          data: data
        })
      }
      
      window.debugLogger.debug('TIMER_UPDATE', `計時器: ${data.timeLeft}秒`, {
        timeLeft: data.timeLeft,
        questionIndex: data.questionIndex,
        timestamp: timestamp,
        recentEventCount: recentEvents.length
      })
    }
    
    gameStore.updateTimeLeft(data.timeLeft)
  }

  const handleQuestionTimeout = (data: any) => {
    console.log('⏰ 答題時間結束:', data)
    gameStore.updateTimeLeft(0)
    uiStore.showWarning('時間到！')
  }

  const handleAnswerSubmitted = (data: any) => {
    console.log('✅ 答案已提交:', data)
    uiStore.showSuccess('答案已提交！')
  }

  const handleQuestionFinished = (data: any) => {
    console.log('✅ 題目結束:', data)
    gameStore.setGameState('show_result')
  }

  const handleScoresUpdate = (data: any) => {
    console.log('📊 分數更新:', data)
    
    // 詳細日誌記錄分數更新
    if (window.debugLogger) {
      const totalPlayers = Object.keys(gameStore.currentRoom?.players || {}).length
      const recordedScores = data.scores ? data.scores.length : 0
      
      window.debugLogger.info('SCORES_UPDATE', '分數更新', {
        totalPlayersInRoom: totalPlayers,
        recordedScores: recordedScores,
        scores: data.scores,
        hostAnswer: data.hostAnswer,
        allData: data
      })
      
      // 檢查是否所有玩家的答案都被記錄
      if (recordedScores < totalPlayers) {
        window.debugLogger.warn('SCORES_UPDATE', `答案記錄不完整：只記錄了 ${recordedScores}/${totalPlayers} 個玩家`, {
          expectedPlayers: totalPlayers,
          actualRecords: recordedScores,
          missingCount: totalPlayers - recordedScores
        })
      } else {
        window.debugLogger.info('SCORES_UPDATE', '所有玩家答案都已記錄', {
          totalRecorded: recordedScores
        })
      }
    }
    
    gameStore.updateScores(data.scores)
    
    // 切換到分數顯示狀態
    gameStore.setGameState('show_result')
    
    // 顯示本題結果
    const currentPlayerScore = data.scores.find((s: any) => s.playerId === gameStore.currentPlayer?.id)
    if (currentPlayerScore) {
      const scoreGained = currentPlayerScore.scoreGained || 0
      if (scoreGained > 0) {
        uiStore.showSuccess(`獲得 ${scoreGained} 分！`)
      } else {
        uiStore.showInfo('這次沒有得分，下次加油！')
      }
    }
    
    // 顯示主角答案
    if (data.hostAnswer) {
      setTimeout(() => {
        uiStore.showInfo(`主角選擇了：${data.hostAnswer}`)
      }, 1000)
    }
  }

  const handleGameFinished = (data: any) => {
    console.log('🏆 遊戲結束:', data)
    
    // 詳細日誌記錄
    if (window.debugLogger) {
      window.debugLogger.info('GAME_FINISHED', '遊戲結束，等待用戶操作清理', {
        finalRanking: data.finalRanking,
        winner: data.winner,
        allData: data
      })
    }
    
    gameStore.setGameState('finished')
    gameStore.updateScores(data.finalRanking)
    
    // 顯示遊戲結束信息
    const winnerName = data.winner?.playerName || data.finalRanking?.[0]?.playerName || '未知'
    uiStore.showSuccess(`遊戲結束！恭喜 ${winnerName} 獲勝！`)
    
    // 不自動清理，等待用戶操作
    if (window.debugLogger) {
      window.debugLogger.info('GAME_FINISHED', '遊戲結束，等待用戶手動返回首頁或重新開始')
    }
  }

  const handleError = (data: any) => {
    console.error('🚨 遊戲錯誤:', data)
    uiStore.showError(data.message)
  }

  // 發送消息
  const sendMessage = (message: WebSocketMessage) => {
    if (socket.value && isConnected.value) {
      console.log('📤 發送消息:', message)
      socket.value.send(JSON.stringify(message))
    } else {
      console.error('❌ WebSocket 未連線，無法發送消息')
      uiStore.showError('網路連線已斷開，請重新連線')
    }
  }

  // 創建房間
  const createRoom = (hostName: string, totalQuestions: number, questionTimeLimit: number) => {
    sendMessage({
      type: 'CREATE_ROOM',
      data: {
        hostName,
        totalQuestions,
        questionTimeLimit
      }
    })
  }

  // 加入房間
  const joinRoom = (roomId: string, playerName: string) => {
    sendMessage({
      type: 'JOIN_ROOM',
      data: {
        roomId,
        playerName
      }
    })
  }

  // 開始遊戲
  const startGame = (roomId: string) => {
    sendMessage({
      type: 'START_GAME',
      data: {
        roomId
      }
    })
  }

  // 提交答案
  const submitAnswer = (roomId: string, questionId: number, answer: string, timeUsed: number) => {
    sendMessage({
      type: 'SUBMIT_ANSWER',
      data: {
        roomId,
        questionId,
        answer,
        timeUsed
      }
    })
  }

  // 離開房間
  const leaveRoom = () => {
    sendMessage({
      type: 'LEAVE_ROOM',
      data: {}
    })
  }

  // 發送 Ping
  const sendPing = () => {
    sendMessage({
      type: 'PING',
      data: {}
    })
  }

  // 遊戲結束後清理資源
  const cleanupAfterGame = () => {
    if (window.debugLogger) {
      window.debugLogger.info('CLEANUP', '開始清理遊戲資源', {
        hasSocket: !!socket.value,
        isConnected: isConnected.value,
        currentRoom: gameStore.currentRoom?.id,
        currentPlayer: gameStore.currentPlayer?.name
      })
    }
    
    try {
      // 1. 斷開 WebSocket 連接
      if (socket.value) {
        socket.value.close()
        socket.value = null
        isConnected.value = false
        console.log('🔌 WebSocket 連接已斷開')
      }
      
      // 2. 清理遊戲狀態
      gameStore.resetGame()
      
      // 3. 清理 UI 狀態
      uiStore.clearAllMessages()
      
      // 4. 清理計時器事件記錄
      if (window.timerEvents) {
        window.timerEvents = []
      }
      
      // 5. 重置重連計數
      reconnectAttempts.value = 0
      
      if (window.debugLogger) {
        window.debugLogger.info('CLEANUP', '遊戲資源清理完成', {
          socketClosed: !socket.value,
          gameReset: !gameStore.currentRoom,
          reconnectAttemptsReset: reconnectAttempts.value === 0
        })
      }
      
      console.log('✨ 遊戲資源清理完成，可以開始新遊戲')
      uiStore.showInfo('遊戲已重置，可以創建新房間')
      
    } catch (error) {
      console.error('❌ 清理遊戲資源時發生錯誤:', error)
      if (window.debugLogger) {
        window.debugLogger.error('CLEANUP', '清理資源失敗', { error: error.message })
      }
    }
  }

  // 斷開連線
  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
      isConnected.value = false
    }
  }

  return {
    // 狀態
    isConnected,
    reconnectAttempts,

    // 動作
    connect,
    disconnect,
    sendMessage,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    leaveRoom,
    sendPing,
    cleanupAfterGame
  }
})