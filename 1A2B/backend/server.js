const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const {
  generateRandomAnswer,
  calculate1A2B,
  isValid4Digits,
  assignTargets,
  sortLeaderboard
} = require('./game_utils.js');

const app = express();
app.use(cors());

// 提供前端靜態檔案託管
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

function generateRoomId() {
  let id = '';
  do {
    id = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[id]);
  return id;
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ playerName }) => {
    const roomId = generateRoomId();
    const name = playerName?.trim() || '玩家 1';
    
    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
      state: 'LOBBY',
      players: [
        {
          id: socket.id,
          name,
          isHost: true,
          answer: null,
          guesses: [],
          targetPlayerId: null,
          targetName: '',
          completed: false,
          finishTimeSec: null,
          currentRoundGuessed: false
        }
      ],
      settingTimeLeft: 60,
      round: 1,
      turnTimeLeft: 60,
      settingTimer: null,
      turnTimer: null
    };

    socket.join(roomId);
    socket.emit('room_created', {
      roomId,
      player: rooms[roomId].players[0],
      roomState: getRoomPublicState(rooms[roomId])
    });
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) {
      return socket.emit('error_message', '房間不存在！');
    }
    if (room.state !== 'LOBBY') {
      return socket.emit('error_message', '遊戲已開始或結束，無法加入！');
    }

    const name = playerName?.trim() || `玩家 ${room.players.length + 1}`;
    const newPlayer = {
      id: socket.id,
      name,
      isHost: false,
      answer: null,
      guesses: [],
      targetPlayerId: null,
      targetName: '',
      completed: false,
      finishTimeSec: null,
      currentRoundGuessed: false
    };

    room.players.push(newPlayer);
    socket.join(roomId);

    socket.emit('room_joined', {
      roomId,
      player: newPlayer,
      roomState: getRoomPublicState(room)
    });

    io.to(roomId).emit('room_updated', getRoomPublicState(room));
  });

  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId) {
      return socket.emit('error_message', '只有房主可以開始遊戲！');
    }

    room.state = 'SETTING_ANSWERS';
    room.settingTimeLeft = 60;

    room.players.forEach(p => {
      p.answer = null;
      p.guesses = [];
      p.targetPlayerId = null;
      p.targetName = '';
      p.completed = false;
      p.finishTimeSec = null;
      p.currentRoundGuessed = false;
    });

    io.to(roomId).emit('start_setting_answers', {
      durationSec: 60,
      roomState: getRoomPublicState(room)
    });

    clearInterval(room.settingTimer);
    room.settingTimer = setInterval(() => {
      room.settingTimeLeft--;
      io.to(roomId).emit('setting_timer_tick', { timeLeft: room.settingTimeLeft });

      if (room.settingTimeLeft <= 0) {
        clearInterval(room.settingTimer);
        finalizeAnswerSetting(roomId);
      }
    }, 1000);
  });

  socket.on('submit_answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'SETTING_ANSWERS') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (!isValid4Digits(answer)) {
      return socket.emit('error_message', '請輸入 4 位不重複的數字作為題目！');
    }

    player.answer = answer;
    socket.emit('answer_accepted', { answer });
    io.to(roomId).emit('room_updated', getRoomPublicState(room));

    const allSubmitted = room.players.every(p => p.answer !== null);
    if (allSubmitted) {
      clearInterval(room.settingTimer);
      finalizeAnswerSetting(roomId);
    }
  });

  socket.on('submit_guess', ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'PLAYING') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (player.completed) {
      return socket.emit('error_message', '您已完成本局猜題！');
    }

    if (player.currentRoundGuessed) {
      return socket.emit('error_message', '您本回合已猜過，請等待下回合！');
    }

    if (!isValid4Digits(guess)) {
      return socket.emit('error_message', '請輸入 4 位不重複數字！');
    }

    let targetAnswer = '';
    let targetName = '';

    if (player.targetPlayerId === 'SYSTEM_AI') {
      targetAnswer = player.targetAnswer;
      targetName = '🤖 系統 AI';
    } else {
      const targetPlayer = room.players.find(p => p.id === player.targetPlayerId);
      if (!targetPlayer) return;
      targetAnswer = targetPlayer.answer;
      targetName = targetPlayer.name;
    }

    const result = calculate1A2B(guess, targetAnswer);
    const turnLimit = room.round <= 2 ? 60 : 90;
    const timeUsedInTurn = turnLimit - room.turnTimeLeft;

    const guessRecord = {
      round: room.round,
      guess,
      a: result.a,
      b: result.b,
      timeSec: Math.max(1, timeUsedInTurn)
    };

    player.guesses.push(guessRecord);
    player.currentRoundGuessed = true;

    if (result.a === 4) {
      player.completed = true;
      player.finishTimeSec = player.guesses.reduce((sum, g) => sum + g.timeSec, 0);
    }

    socket.emit('guess_result', {
      record: guessRecord,
      completed: player.completed,
      targetName
    });

    io.to(roomId).emit('player_guessed_notify', {
      playerId: player.id,
      playerName: player.name,
      round: room.round,
      a: result.a,
      b: result.b,
      completed: player.completed
    });

    io.to(roomId).emit('room_updated', getRoomPublicState(room));
    checkRoundCompletion(roomId);
  });

  socket.on('restart_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId) {
      return socket.emit('error_message', '只有房主可以發起重開！');
    }

    clearInterval(room.settingTimer);
    clearInterval(room.turnTimer);

    room.state = 'LOBBY';
    room.round = 1;
    room.players.forEach(p => {
      p.answer = null;
      p.guesses = [];
      p.targetPlayerId = null;
      p.targetName = '';
      p.completed = false;
      p.finishTimeSec = null;
      p.currentRoundGuessed = false;
    });

    io.to(roomId).emit('game_restarted', getRoomPublicState(room));
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          clearInterval(room.settingTimer);
          clearInterval(room.turnTimer);
          delete rooms[roomId];
        } else {
          if (disconnectedPlayer.isHost) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit('room_updated', getRoomPublicState(room));

          if (room.state === 'PLAYING') {
            checkRoundCompletion(roomId);
          }
        }
        break;
      }
    }
  });
});

function finalizeAnswerSetting(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.players.forEach(p => {
    if (!p.answer) {
      p.answer = generateRandomAnswer();
    }
  });

  const assignedPlayers = assignTargets(room.players);
  room.players = assignedPlayers;

  room.state = 'PLAYING';
  room.round = 1;
  
  startNewRound(roomId);
}

function startNewRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const durationSec = room.round <= 2 ? 60 : 90;
  room.turnTimeLeft = durationSec;

  room.players.forEach(p => {
    p.currentRoundGuessed = false;
  });

  io.to(roomId).emit('start_round', {
    round: room.round,
    durationSec,
    roomState: getRoomPublicState(room)
  });

  clearInterval(room.turnTimer);
  room.turnTimer = setInterval(() => {
    room.turnTimeLeft--;
    io.to(roomId).emit('turn_timer_tick', { timeLeft: room.turnTimeLeft });

    if (room.turnTimeLeft <= 0) {
      clearInterval(room.turnTimer);
      handleRoundTimeout(roomId);
    }
  }, 1000);
}

function handleRoundTimeout(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const turnLimit = room.round <= 2 ? 60 : 90;

  room.players.forEach(p => {
    if (!p.completed && !p.currentRoundGuessed) {
      const autoGuess = generateRandomAnswer();
      let targetAnswer = '';
      let targetName = p.targetName;

      if (p.targetPlayerId === 'SYSTEM_AI') {
        targetAnswer = p.targetAnswer;
      } else {
        const targetPlayer = room.players.find(tp => tp.id === p.targetPlayerId);
        if (targetPlayer) targetAnswer = targetPlayer.answer;
      }

      if (targetAnswer) {
        const result = calculate1A2B(autoGuess, targetAnswer);
        const record = {
          round: room.round,
          guess: autoGuess,
          a: result.a,
          b: result.b,
          timeSec: turnLimit,
          isAuto: true
        };
        p.guesses.push(record);
        p.currentRoundGuessed = true;

        if (result.a === 4) {
          p.completed = true;
          p.finishTimeSec = p.guesses.reduce((sum, g) => sum + g.timeSec, 0);
        }

        io.to(p.id).emit('guess_result', {
          record,
          completed: p.completed,
          targetName
        });

        io.to(roomId).emit('player_guessed_notify', {
          playerId: p.id,
          playerName: p.name,
          round: room.round,
          a: result.a,
          b: result.b,
          completed: p.completed
        });
      }
    }
  });

  checkRoundCompletion(roomId);
}

function checkRoundCompletion(roomId) {
  const room = rooms[roomId];
  if (!room || room.state !== 'PLAYING') return;

  const completedPlayers = room.players.filter(p => p.completed);
  const targetCompletedCount = Math.min(3, room.players.length);

  if (completedPlayers.length >= targetCompletedCount) {
    clearInterval(room.turnTimer);
    endGame(roomId);
    return;
  }

  const activePlayers = room.players.filter(p => !p.completed);
  const allActiveGuessed = activePlayers.every(p => p.currentRoundGuessed);
  if (allActiveGuessed) {
    clearInterval(room.turnTimer);
    room.round++;
    startNewRound(roomId);
  }
}

function endGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.state = 'ENDED';

  const leaderboard = sortLeaderboard(room.players);
  const champion = leaderboard[0];

  io.to(roomId).emit('game_over', {
    leaderboard: leaderboard.map(p => ({
      id: p.id,
      name: p.name,
      answer: p.answer,
      targetName: p.targetName,
      targetAnswer: p.targetAnswer,
      guessesCount: p.guesses.length,
      totalTimeSec: p.finishTimeSec || p.guesses.reduce((sum, g) => sum + g.timeSec, 0),
      completed: p.completed,
      guesses: p.guesses
    })),
    championName: champion.name,
    roomState: getRoomPublicState(room)
  });
}

function getRoomPublicState(room) {
  return {
    roomId: room.id,
    state: room.state,
    round: room.round,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      hasSetAnswer: p.answer !== null,
      targetPlayerId: p.targetPlayerId,
      targetName: p.targetName,
      completed: p.completed,
      currentRoundGuessed: p.currentRoundGuessed,
      guessesCount: p.guesses.length
    }))
  };
}

const DEFAULT_PORT = process.env.PORT || 3000;

function listenOnPort(port) {
  server.listen(port, () => {
    console.log(`=================================`);
    console.log(`🎮 連線版 1A2B 後端已於 http://localhost:${port} 啟動`);
    console.log(`=================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} 已被占用，自動嘗試使用 Port ${port + 1}...`);
      listenOnPort(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  listenOnPort(Number(DEFAULT_PORT));
}

module.exports = { app, server, rooms };
