let socket = null;
let currentRoomId = null;
let currentPlayer = null;
let isHost = false;
let myTargetName = '';
let isSubmittedAnswer = false;
let myGuesses = [];

function initSocket() {
  if (typeof io !== 'undefined') {
    socket = io();

    socket.on('connect', () => {
      console.log('Connected with ID:', socket.id);
    });

    socket.on('error_message', (msg) => {
      showToast(msg);
    });

    socket.on('room_created', ({ roomId, player, roomState }) => {
      currentRoomId = roomId;
      currentPlayer = player;
      isHost = player.isHost;
      document.getElementById('displayRoomId').textContent = `# ${roomId}`;
      showScreen('roomScreen');
      updateRoomUI(roomState);
      showToast('成功建立房間！');
    });

    socket.on('room_joined', ({ roomId, player, roomState }) => {
      currentRoomId = roomId;
      currentPlayer = player;
      isHost = player.isHost;
      document.getElementById('displayRoomId').textContent = `# ${roomId}`;
      showScreen('roomScreen');
      updateRoomUI(roomState);
      showToast('成功加入房間！');
    });

    socket.on('room_updated', (roomState) => {
      updateRoomUI(roomState);
    });

    socket.on('start_setting_answers', ({ durationSec, roomState }) => {
      isSubmittedAnswer = false;
      document.getElementById('secretAnswerInput').value = '';
      document.getElementById('secretAnswerInput').disabled = false;
      document.getElementById('submitAnswerBtn').disabled = false;
      document.getElementById('submitAnswerBtn').textContent = '🔒 鎖定並提交題目';
      showScreen('settingScreen');
      updateSettingStatusList(roomState);
      updateTimerBar('settingTimerBar', durationSec, durationSec);
    });

    socket.on('setting_timer_tick', ({ timeLeft }) => {
      document.getElementById('settingTimerText').textContent = `${timeLeft} 秒`;
      updateTimerBar('settingTimerBar', timeLeft, 60);
    });

    socket.on('answer_accepted', ({ answer }) => {
      isSubmittedAnswer = true;
      document.getElementById('secretAnswerInput').disabled = true;
      document.getElementById('submitAnswerBtn').disabled = true;
      document.getElementById('submitAnswerBtn').textContent = '✅ 已提交題目';
      showToast('題目已鎖定！等待其他人出題...');
    });

    socket.on('start_round', ({ round, durationSec, roomState }) => {
      const me = roomState.players.find(p => p.id === socket.id);
      if (me) {
        myTargetName = me.targetName;
        document.getElementById('targetPlayerName').textContent = me.targetName || '對手';
      }

      document.getElementById('roundBadge').textContent = `第 ${round} 回合`;
      document.getElementById('roundTimeLimitText').textContent = durationSec;

      if (me && me.completed) {
        document.getElementById('guessArea').style.display = 'none';
        document.getElementById('completedNotice').style.display = 'block';
      } else {
        document.getElementById('guessArea').style.display = 'block';
        document.getElementById('completedNotice').style.display = 'none';
        document.getElementById('guessInput').value = '';
        document.getElementById('guessInput').focus();
      }

      showScreen('playingScreen');
      updateTimerBar('turnTimerBar', durationSec, durationSec);
    });

    socket.on('turn_timer_tick', ({ timeLeft }) => {
      document.getElementById('turnTimerText').textContent = `${timeLeft} 秒`;
      const limit = parseInt(document.getElementById('roundTimeLimitText').textContent) || 60;
      updateTimerBar('turnTimerBar', timeLeft, limit);
    });

    socket.on('guess_result', ({ record, completed, targetName }) => {
      myGuesses.push(record);
      renderGuessesList();

      if (completed) {
        document.getElementById('guessArea').style.display = 'none';
        document.getElementById('completedNotice').style.display = 'block';
        showToast('🎉 恭喜猜中 4A！完成對局！');
      } else if (record.isAuto) {
        showToast(`⏰ 超時！系統自動代為猜測 ${record.guess} (${record.a}A${record.b}B)`);
      }
    });

    socket.on('player_guessed_notify', ({ playerId, playerName, round, a, b, completed }) => {
      const feedList = document.getElementById('feedList');
      const item = document.createElement('div');
      item.className = 'feed-item';
      
      if (completed) {
        item.innerHTML = `<strong style="color: #34d399;">🎉 ${playerName}</strong> 成功猜出 4A0B！完賽！`;
        item.style.borderLeftColor = '#34d399';
      } else {
        item.innerHTML = `<strong>${playerName}</strong> 在第 ${round} 回合猜出了 <span style="color: #c4b5fd; font-weight:700;">${a}A${b}B</span>`;
      }

      feedList.insertBefore(item, feedList.firstChild);
    });

    socket.on('game_over', ({ leaderboard, championName, roomState }) => {
      const champion = leaderboard[0];
      const runnerUp = leaderboard.length > 1 ? leaderboard[1] : null;

      document.getElementById('championNameDisplay').textContent = champion ? champion.name : '無';
      document.getElementById('championDetailDisplay').textContent = champion
        ? `${champion.guessesCount} 次猜中 (${champion.totalTimeSec}秒)`
        : '';

      const runnerUpBox = document.getElementById('runnerUpBox');
      if (runnerUp) {
        runnerUpBox.style.display = 'block';
        document.getElementById('runnerUpNameDisplay').textContent = runnerUp.name;
        document.getElementById('runnerUpDetailDisplay').textContent = runnerUp.completed
          ? `${runnerUp.guessesCount} 次猜中 (${runnerUp.totalTimeSec}秒)`
          : '未完成';
      } else {
        runnerUpBox.style.display = 'none';
      }

      const meInBoard = leaderboard.find(p => p.id === socket.id);
      if (meInBoard && meInBoard.targetName) {
        document.getElementById('myTargetRevealText').textContent = `${meInBoard.targetName} 的題目是：【 ${meInBoard.targetAnswer} 】`;
      } else {
        document.getElementById('myTargetRevealText').textContent = '未指派對手題目';
      }

      renderLeaderboard(leaderboard);

      if (isHost) {
        document.getElementById('restartBtn').style.display = 'inline-flex';
      } else {
        document.getElementById('restartBtn').style.display = 'none';
      }

      showScreen('endedScreen');
      launchConfetti();
    });

    socket.on('game_restarted', (roomState) => {
      myGuesses = [];
      document.getElementById('recordsList').innerHTML = '';
      document.getElementById('feedList').innerHTML = '';
      showScreen('roomScreen');
      updateRoomUI(roomState);
      showToast('遊戲已由房主重置！');
    });

    socket.on('disconnect', () => {
      showToast('連線中斷，正在嘗試重新連線...');
    });
  }
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function createRoom() {
  const name = document.getElementById('playerNameInput').value.trim();
  if (!name) {
    showToast('請先輸入暱稱！');
    return;
  }
  socket.emit('create_room', { playerName: name });
}

function joinRoom() {
  const name = document.getElementById('playerNameInput').value.trim();
  const roomId = document.getElementById('roomIdInput').value.trim();
  if (!name) {
    showToast('請先輸入暱稱！');
    return;
  }
  if (!roomId || roomId.length !== 4) {
    showToast('請輸入 4 位數房間代碼！');
    return;
  }
  socket.emit('join_room', { roomId, playerName: name });
}

function startGame() {
  if (!currentRoomId) return;
  socket.emit('start_game', { roomId: currentRoomId });
}

function submitAnswer() {
  const ans = document.getElementById('secretAnswerInput').value.trim();
  if (!isValid4Digits(ans)) {
    showToast('題目必須為 4 位不重複數字！');
    return;
  }
  socket.emit('submit_answer', { roomId: currentRoomId, answer: ans });
}

function submitGuess() {
  const guess = document.getElementById('guessInput').value.trim();
  if (!isValid4Digits(guess)) {
    showToast('猜測必須為 4 位不重複數字！');
    return;
  }
  socket.emit('submit_guess', { roomId: currentRoomId, guess });
  document.getElementById('guessInput').value = '';
}

function leaveRoom() {
  location.reload();
}

function restartGame() {
  if (!currentRoomId) return;
  socket.emit('restart_game', { roomId: currentRoomId });
}

function backToLobby() {
  location.reload();
}

function updateRoomUI(roomState) {
  const grid = document.getElementById('playerGrid');
  grid.innerHTML = '';

  const hostControl = document.getElementById('hostControl');
  const clientNotice = document.getElementById('clientWaitNotice');

  const me = roomState.players.find(p => p.id === socket.id);
  if (me) isHost = me.isHost;

  if (isHost) {
    hostControl.style.display = 'block';
    clientNotice.style.display = 'none';
  } else {
    hostControl.style.display = 'none';
    clientNotice.style.display = 'block';
  }

  roomState.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div class="player-info">
        <div class="player-name">${p.name} ${p.isHost ? '👑' : ''}</div>
        <div class="player-status ready">${p.isHost ? '房主' : '已準備'}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateSettingStatusList(roomState) {
  const list = document.getElementById('settingStatusList');
  list.innerHTML = '';

  roomState.players.forEach(p => {
    const badge = document.createElement('div');
    badge.style.cssText = `
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: ${p.hasSetAnswer ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'};
      color: ${p.hasSetAnswer ? '#34d399' : '#94a3b8'};
      border: 1px solid ${p.hasSetAnswer ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'};
    `;
    badge.textContent = `${p.name}: ${p.hasSetAnswer ? '已出題 ✓' : '出題中...'}`;
    list.appendChild(badge);
  });
}

function renderGuessesList() {
  const container = document.getElementById('recordsList');
  container.innerHTML = '';

  myGuesses.forEach(g => {
    const item = document.createElement('div');
    item.className = 'record-item';
    const isWin = g.a === 4;
    item.innerHTML = `
      <div class="record-guess">${g.guess}</div>
      <div class="record-result ${isWin ? 'win' : ''}">${g.a}A${g.b}B ${g.isAuto ? '⏱️' : ''}</div>
    `;
    container.insertBefore(item, container.firstChild);
  });
}

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  const colors = ['#f59e0b', '#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 6 - 3,
      shape: Math.random() > 0.5 ? 'circle' : 'rect'
    });
  }

  let animationFrame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y < canvas.height) active = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    });

    if (active) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  animate();
  setTimeout(() => {
    cancelAnimationFrame(animationFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 4500);
}

function renderLeaderboard(leaderboard) {
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';

  leaderboard.forEach((p, idx) => {
    const tr = document.createElement('tr');
    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
    const isMe = p.id === socket.id;

    tr.style.background = isMe ? 'rgba(139, 92, 246, 0.15)' : 'transparent';
    
    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
      <td><strong>${p.name}</strong> ${isMe ? '(您)' : ''}</td>
      <td>猜 <strong>${p.targetName}</strong> <span style="color: #f43f5e; font-weight: 700; margin-left: 6px;">【 答案: ${p.targetAnswer} 】</span></td>
      <td><span style="color: #a78bfa; font-weight:700;">${p.guessesCount} 次</span></td>
      <td>${p.completed ? `${p.totalTimeSec} 秒` : '<span style="color:#ef4444;">未完成</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateTimerBar(barId, current, total) {
  const bar = document.getElementById(barId);
  if (!bar) return;

  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  bar.style.width = `${pct}%`;

  if (pct < 25) {
    bar.className = 'timer-bar-fill danger';
  } else if (pct < 50) {
    bar.className = 'timer-bar-fill warning';
  } else {
    bar.className = 'timer-bar-fill';
  }
}

function showToast(msg) {
  const toast = document.getElementById('toastMessage');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function isValid4Digits(str) {
  if (!str || str.length !== 4) return false;
  if (!/^\d{4}$/.test(str)) return false;
  return new Set(str.split('')).size === 4;
}

function applyUniqueDigitInputRestriction(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('input', function(e) {
    let val = e.target.value.replace(/\D/g, '');
    let unique = '';
    for (let char of val) {
      if (!unique.includes(char)) {
        unique += char;
      }
    }
    e.target.value = unique.slice(0, 4);
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      if (inputId === 'guessInput') submitGuess();
      if (inputId === 'secretAnswerInput') submitAnswer();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  applyUniqueDigitInputRestriction('secretAnswerInput');
  applyUniqueDigitInputRestriction('guessInput');
});
