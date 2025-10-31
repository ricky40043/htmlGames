// 誰是臥底遊戲邏輯
let gameState = {
    roomName: '',
    playerCount: 6,
    spyCount: 1,
    discussionTime: 120, // 秒
    wordCategory: 'all',
    difficulty: 'medium',
    currentRound: 1,
    gameStartTime: null,
    players: [], // {id, name, role, word, alive, votes}
    currentPhase: 'waiting', // waiting, discussion, voting, result
    timer: null,
    timeLeft: 0,
    votingResults: {},
    wordPair: null,
    eliminatedPlayers: []
};

// 頁面控制函數
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showWelcome() {
    showPage('welcome-page');
    resetGameState();
}

function showSetup() {
    showPage('setup-page');
    // 設定預設房間名稱
    if (!document.getElementById('room-name').value) {
        document.getElementById('room-name').value = `房間${Math.floor(Math.random() * 1000)}`;
    }
}

function showRules() {
    showPage('rules-page');
}

// 更新臥底人數選項
function updateSpyCount() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const spyCountSelect = document.getElementById('spy-count');
    
    // 清空選項
    spyCountSelect.innerHTML = '';
    
    // 根據玩家人數設定臥底選項
    const maxSpies = Math.floor(playerCount / 3); // 最多不超過1/3
    for (let i = 1; i <= Math.min(maxSpies, 2); i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}人`;
        if (i === 1) option.selected = true;
        spyCountSelect.appendChild(option);
    }
}

// 重置遊戲狀態
function resetGameState() {
    clearInterval(gameState.timer);
    gameState = {
        roomName: '',
        playerCount: 6,
        spyCount: 1,
        discussionTime: 120,
        wordCategory: 'all',
        difficulty: 'medium',
        currentRound: 1,
        gameStartTime: null,
        players: [],
        currentPhase: 'waiting',
        timer: null,
        timeLeft: 0,
        votingResults: {},
        wordPair: null,
        eliminatedPlayers: [],
        currentRevealPlayer: 0,
        playersRevealed: 0
    };
}

// 創建房間
function createRoom() {
    // 獲取設定
    gameState.roomName = document.getElementById('room-name').value || `房間${Math.floor(Math.random() * 1000)}`;
    gameState.playerCount = parseInt(document.getElementById('player-count').value);
    gameState.spyCount = parseInt(document.getElementById('spy-count').value);
    gameState.discussionTime = parseInt(document.getElementById('discussion-time').value);
    gameState.wordCategory = document.getElementById('word-category').value;
    gameState.difficulty = document.getElementById('difficulty').value;
    
    // 初始化玩家
    initializePlayers();
    
    // 顯示等待頁面
    showWaitingRoom();
}

// 初始化玩家
function initializePlayers() {
    gameState.players = [];
    for (let i = 1; i <= gameState.playerCount; i++) {
        gameState.players.push({
            id: i,
            name: `玩家${i}`,
            role: null, // 'civilian' or 'spy'
            word: null,
            alive: true,
            votes: 0,
            hasVoted: false
        });
    }
}

// 顯示等待房間
function showWaitingRoom() {
    showPage('waiting-page');
    updateWaitingRoomDisplay();
}

// 更新等待房間顯示
function updateWaitingRoomDisplay() {
    document.getElementById('display-room-name').textContent = gameState.roomName;
    document.getElementById('player-status').textContent = `${gameState.players.length}/${gameState.playerCount}`;
    document.getElementById('display-player-count').textContent = gameState.playerCount;
    document.getElementById('display-spy-count').textContent = gameState.spyCount;
    
    const discussionTimeText = gameState.discussionTime === 0 ? '無限制' : `${gameState.discussionTime / 60}分鐘`;
    document.getElementById('display-discussion-time').textContent = discussionTimeText;
    document.getElementById('display-category').textContent = getCategoryDisplayName(gameState.wordCategory);
    
    // 更新玩家列表
    updatePlayersList();
    
    // 檢查是否可以開始遊戲
    const startBtn = document.getElementById('start-game-btn');
    startBtn.disabled = gameState.players.length < 4;
}

// 更新玩家列表
function updatePlayersList() {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card ready';
        playerCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-status">✅ 準備</div>
        `;
        playersList.appendChild(playerCard);
    });
}

// 分配身份和詞彙
function assignRolesAndWords() {
    // 獲取詞彙配對
    gameState.wordPair = getRandomWordPair(gameState.wordCategory, gameState.difficulty);
    
    // 隨機分配臥底
    const playerIndices = Array.from({length: gameState.playerCount}, (_, i) => i);
    const shuffledIndices = playerIndices.sort(() => Math.random() - 0.5);
    
    // 前spyCount個是臥底，其餘是平民
    gameState.players.forEach((player, index) => {
        if (shuffledIndices.indexOf(index) < gameState.spyCount) {
            player.role = 'spy';
            player.word = gameState.wordPair.spy;
        } else {
            player.role = 'civilian';
            player.word = gameState.wordPair.civilian;
        }
    });
}

// 顯示QR Code頁面
function showQRCodes() {
    assignRolesAndWords();
    showPage('qr-page');
    
    // 初始化查看狀態
    gameState.currentRevealPlayer = 0;
    gameState.playersRevealed = 0;
    
    generateQRCodes();
    updatePlayerRevealIndicator();
}

// 生成QR Code
function generateQRCodes() {
    const qrGallery = document.getElementById('qr-gallery');
    qrGallery.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const qrCard = document.createElement('div');
        qrCard.className = 'qr-card';
        
        // 創建QR Code數據（簡化的身份信息）
        const qrData = {
            player: player.name,
            role: player.role === 'spy' ? '臥底' : '平民',
            word: player.word,
            emoji: player.role === 'spy' ? '🕵️' : '👥'
        };
        
        qrCard.innerHTML = `
            <h4>${player.name}</h4>
            <div class="qr-code" id="qr-${player.id}"></div>
            <p class="qr-instruction">📱 用手機掃描此QR Code</p>
            <button class="reveal-btn" onclick="revealIdentity(${player.id})" style="margin-top: 10px; padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 6px; font-size: 0.9rem;">備用：點此查看</button>
        `;
        
        qrGallery.appendChild(qrCard);
        
        // 嘗試生成QR Code，如果失敗則使用替代方案
        setTimeout(() => {
            const qrContainer = document.getElementById(`qr-${player.id}`)
            if (!qrContainer) {
                console.warn('QR container not found, using fallback')
                showFallbackQR(player.id, qrData)
                return
            }

            if (typeof window.QRCode !== 'undefined' && window.QRCode) {
                try {
                    const qrDataString = `玩家:${qrData.player};身份:${qrData.role};詞彙:${qrData.word};保密!`

                    qrContainer.innerHTML = ''
                    new window.QRCode(qrContainer, {
                        text: qrDataString,
                        width: 256,
                        height: 256,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: window.QRCode.CorrectLevel.L
                    })

                    console.log(`QR Code generated for ${player.name}`)
                } catch (error) {
                    console.error('QR Code generation error:', error)
                    showFallbackQR(player.id, qrData)
                }
            } else {
                console.warn('QR Code library not available, using fallback')
                showFallbackQR(player.id, qrData)
            }
        }, 100)
    });
}

// 顯示視覺化QR Code替代方案
function showFallbackQR(playerId, qrData) {
    const qrContainer = document.getElementById(`qr-${playerId}`);
    const colorIndex = (playerId - 1) % 8;
    
    // 創建一個看起來像QR Code的視覺效果
    const qrPattern = generateQRPattern();
    
    qrContainer.innerHTML = `
        <div style="
            width: 200px; 
            height: 200px; 
            background: white;
            border-radius: 15px; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            margin: 0 auto;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            border: 3px solid ${getQRColor(colorIndex)};
            position: relative;
            overflow: hidden;
        ">
            <div style="
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                bottom: 40px;
                background-image: ${qrPattern};
                background-size: 20px 20px;
                opacity: 0.8;
            "></div>
            <div style="
                position: relative;
                z-index: 2;
                background: rgba(255,255,255,0.9);
                padding: 10px;
                border-radius: 10px;
                text-align: center;
                margin-top: 120px;
            ">
                <div style="font-size: 1.8rem; margin-bottom: 3px;">${qrData.emoji}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #333;">${qrData.player}</div>
            </div>
        </div>
    `;
    console.log(`Visual QR Code created for ${qrData.player}`);
}

// 生成QR Code視覺效果
function generateQRPattern() {
    // 創建隨機的黑白方格圖案，模擬QR Code外觀
    const patterns = [
        'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
        'repeating-linear-gradient(45deg, #000 0px, #000 10px, #fff 10px, #fff 20px)',
        'repeating-linear-gradient(0deg, #000 0px, #000 5px, #fff 5px, #fff 15px), repeating-linear-gradient(90deg, #000 0px, #000 5px, #fff 5px, #fff 15px)'
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// 顯示身份信息（替代QR Code掃描）
function revealIdentity(playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        const roleText = player.role === 'spy' ? '臥底' : '平民';
        
        // 確認是否為當前玩家
        const currentPlayerIndex = gameState.currentRevealPlayer || 0;
        const currentPlayer = gameState.players[currentPlayerIndex];
        
        if (player.id !== currentPlayer.id) {
            alert(`⚠️ 請按順序查看！\n現在輪到：${currentPlayer.name}`);
            return;
        }
        
        // 顯示身份信息（與QR Code內容相同）
        const confirmed = confirm(`${player.name} 請確認查看QR Code內容？\n\n⚠️ 確保其他人看不到你的螢幕！\n\n點擊「確定」查看`);
        
        if (confirmed) {
            const qrContent = `${player.name}：${player.word}

身份：${roleText}

請記住你的詞彙，在描述時不要直接說出來！

遊戲開始後，請根據你的詞彙進行描述，找出臥底！`;
            
            alert(qrContent);
            
            // 標記該玩家已查看
            player.hasRevealed = true;
            gameState.playersRevealed++;
            
            // 更新按鈕狀態
            const revealBtn = document.querySelector(`#qr-gallery .qr-card:nth-child(${playerId}) .reveal-btn`);
            if (revealBtn) {
                revealBtn.textContent = '✅ 已查看';
                revealBtn.disabled = true;
                revealBtn.style.background = '#28a745';
            }
            
            // 檢查是否所有人都已查看
            if (gameState.playersRevealed >= gameState.playerCount) {
                document.getElementById('start-discussion-btn').disabled = false;
                alert('🎉 所有玩家都已查看身份！現在可以開始討論了。');
            }
            
            updatePlayerRevealIndicator();
        }
    }
}

// 更新當前查看玩家指示器
function updatePlayerRevealIndicator() {
    const currentPlayerIndex = gameState.currentRevealPlayer || 0;
    const currentPlayer = gameState.players[currentPlayerIndex];
    
    if (currentPlayer) {
        document.getElementById('current-reveal-player').textContent = currentPlayer.name;
    }
    
    // 更新下一位玩家按鈕
    const nextBtn = document.querySelector('.next-player-btn');
    if (gameState.playersRevealed >= gameState.playerCount) {
        nextBtn.textContent = '✅ 全部完成';
        nextBtn.disabled = true;
    }
}

// 下一位玩家查看
function nextPlayerReveal() {
    if (gameState.currentRevealPlayer < gameState.playerCount - 1) {
        gameState.currentRevealPlayer++;
        updatePlayerRevealIndicator();
    }
}

// 跳過查看階段
function skipToDiscussion() {
    const confirmed = confirm('⚠️ 確定要跳過查看階段嗎？\n\n這樣所有玩家都需要記住：\n• 自己的身份和詞彙\n• 遊戲將立即開始討論階段');
    
    if (confirmed) {
        // 標記所有玩家已查看
        gameState.players.forEach(player => {
            player.hasRevealed = true;
        });
        gameState.playersRevealed = gameState.playerCount;
        
        // 更新按鈕狀態
        document.querySelectorAll('.reveal-btn').forEach(btn => {
            btn.textContent = '⏭️ 已跳過';
            btn.disabled = true;
            btn.style.background = '#6c757d';
        });
        
        document.getElementById('start-discussion-btn').disabled = false;
        updatePlayerRevealIndicator();
    }
}

// 獲取不同的QR Code顏色
function getQRColor(index) {
    const colors = ['#667eea', '#764ba2', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14'];
    return colors[index % colors.length];
}

// 重新生成QR Code
function regenerateQR() {
    assignRolesAndWords();
    generateQRCodes();
}

// 開始討論
function startDiscussion() {
    gameState.currentPhase = 'discussion';
    gameState.gameStartTime = Date.now();
    gameState.timeLeft = gameState.discussionTime;
    
    showPage('game-page');
    updateGameDisplay();
    
    if (gameState.discussionTime > 0) {
        startTimer();
    }
}

// 更新遊戲顯示
function updateGameDisplay() {
    document.getElementById('current-round').textContent = gameState.currentRound;
    document.getElementById('alive-count').textContent = gameState.players.filter(p => p.alive).length;
    
    if (gameState.currentPhase === 'discussion') {
        document.getElementById('discussion-phase').style.display = 'block';
        document.getElementById('voting-phase').style.display = 'none';
        document.getElementById('skip-btn').style.display = 'block';
    } else if (gameState.currentPhase === 'voting') {
        document.getElementById('discussion-phase').style.display = 'none';
        document.getElementById('voting-phase').style.display = 'block';
        document.getElementById('skip-btn').style.display = 'none';
        generateVotingOptions();
    }
}

// 開始計時器
function startTimer() {
    updateTimerDisplay();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            if (gameState.currentPhase === 'discussion') {
                startVoting();
            }
        }
    }, 1000);
}

// 更新計時器顯示
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer-text').textContent = timeString;
    document.getElementById('timer-display').textContent = `討論時間：${timeString}`;
    
    // 更新計時器條
    const percentage = gameState.discussionTime > 0 ? (gameState.timeLeft / gameState.discussionTime) * 100 : 100;
    document.getElementById('timer-bar').style.setProperty('--timer-width', `${percentage}%`);
    
    // 更新計時器顏色
    const timerCircle = document.querySelector('.timer-circle');
    if (gameState.timeLeft <= 30) {
        timerCircle.className = 'timer-circle danger';
    } else if (gameState.timeLeft <= 60) {
        timerCircle.className = 'timer-circle warning';
    } else {
        timerCircle.className = 'timer-circle';
    }
}

// 跳過討論
function skipDiscussion() {
    if (gameState.currentPhase === 'discussion') {
        clearInterval(gameState.timer);
        startVoting();
    }
}

// 開始投票
function startVoting() {
    gameState.currentPhase = 'voting';
    gameState.votingResults = {};
    
    // 重置玩家投票狀態
    gameState.players.forEach(player => {
        if (player.alive) {
            player.hasVoted = false;
            player.votes = 0;
        }
    });
    
    updateGameDisplay();
}

// 生成投票選項
function generateVotingOptions() {
    const votingGrid = document.getElementById('voting-grid');
    votingGrid.innerHTML = '';
    
    gameState.players.forEach(player => {
        if (!player.alive) return;
        
        const voteOption = document.createElement('div');
        voteOption.className = 'vote-option';
        voteOption.innerHTML = `
            <div class="voter-name">${player.name}</div>
            <div class="vote-count">0票</div>
        `;
        voteOption.onclick = () => voteForPlayer(player.id);
        voteOption.id = `vote-option-${player.id}`;
        
        votingGrid.appendChild(voteOption);
    });
    
    updateVotingProgress();
}

// 投票給玩家
function voteForPlayer(playerId) {
    // 簡化投票邏輯：每次點擊增加一票
    const player = gameState.players.find(p => p.id === playerId);
    if (player && player.alive) {
        player.votes++;
        
        // 更新顯示
        const voteOption = document.getElementById(`vote-option-${playerId}`);
        voteOption.querySelector('.vote-count').textContent = `${player.votes}票`;
        
        // 檢查是否所有人都投票完成（簡化為有足夠票數）
        const totalVotes = gameState.players.reduce((sum, p) => sum + p.votes, 0);
        const alivePlayers = gameState.players.filter(p => p.alive).length;
        
        if (totalVotes >= alivePlayers) {
            setTimeout(() => {
                processVotingResults();
            }, 1000);
        }
        
        updateVotingProgress();
    }
}

// 更新投票進度
function updateVotingProgress() {
    const totalVotes = gameState.players.reduce((sum, p) => sum + p.votes, 0);
    const alivePlayers = gameState.players.filter(p => p.alive).length;
    document.getElementById('vote-progress').textContent = `${totalVotes}/${alivePlayers}`;
}

// 處理投票結果
function processVotingResults() {
    // 找出得票最多的玩家
    const alivePlayers = gameState.players.filter(p => p.alive);
    const maxVotes = Math.max(...alivePlayers.map(p => p.votes));
    const eliminatedPlayer = alivePlayers.find(p => p.votes === maxVotes);
    
    if (eliminatedPlayer) {
        eliminatedPlayer.alive = false;
        gameState.eliminatedPlayers.push(eliminatedPlayer);
        
        alert(`${eliminatedPlayer.name} 被淘汰了！身份是：${eliminatedPlayer.role === 'spy' ? '🕵️ 臥底' : '👥 平民'}`);
    }
    
    // 檢查遊戲是否結束
    if (checkGameEnd()) {
        endGame();
    } else {
        // 開始下一回合
        gameState.currentRound++;
        gameState.timeLeft = gameState.discussionTime;
        gameState.currentPhase = 'discussion';
        updateGameDisplay();
        
        if (gameState.discussionTime > 0) {
            startTimer();
        }
    }
}

// 檢查遊戲是否結束
function checkGameEnd() {
    const aliveSpies = gameState.players.filter(p => p.alive && p.role === 'spy').length;
    const aliveCivilians = gameState.players.filter(p => p.alive && p.role === 'civilian').length;
    
    // 臥底全部被淘汰，平民獲勝
    if (aliveSpies === 0) {
        return 'civilian_win';
    }
    
    // 臥底數量大於等於平民數量，臥底獲勝
    if (aliveSpies >= aliveCivilians) {
        return 'spy_win';
    }
    
    return false;
}

// 結束遊戲
function endGame() {
    clearInterval(gameState.timer);
    showResults();
}

// 顯示結果
function showResults() {
    const gameResult = checkGameEnd();
    
    showPage('result-page');
    
    // 更新勝負結果
    const winnerAnnouncement = document.getElementById('winner-announcement');
    if (gameResult === 'civilian_win') {
        winnerAnnouncement.textContent = '👥 平民獲勝！';
        winnerAnnouncement.className = 'civilian-win';
    } else if (gameResult === 'spy_win') {
        winnerAnnouncement.textContent = '🕵️ 臥底獲勝！';
        winnerAnnouncement.className = 'spy-win';
    } else {
        winnerAnnouncement.textContent = '🎮 遊戲結束';
    }
    
    // 顯示詞彙
    document.getElementById('civilian-word').textContent = gameState.wordPair.civilian;
    document.getElementById('spy-word').textContent = gameState.wordPair.spy;
    
    // 顯示玩家身份
    generatePlayersReveal();
    
    // 顯示遊戲統計
    updateGameSummary();
}

// 生成玩家身份揭曉
function generatePlayersReveal() {
    const playersIdentity = document.querySelector('.players-identity');
    playersIdentity.innerHTML = '';
    
    gameState.players.forEach(player => {
        const identityCard = document.createElement('div');
        identityCard.className = `identity-card ${player.role}`;
        if (!player.alive) identityCard.classList.add('eliminated');
        
        identityCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-role">${player.role === 'spy' ? '🕵️ 臥底' : '👥 平民'}</div>
            <div class="player-word">${player.word}</div>
            ${!player.alive ? '<div class="eliminated-mark">❌ 已淘汰</div>' : ''}
        `;
        
        playersIdentity.appendChild(identityCard);
    });
}

// 更新遊戲統計
function updateGameSummary() {
    const gameEndTime = Date.now();
    const gameDuration = Math.floor((gameEndTime - gameState.gameStartTime) / 1000);
    const minutes = Math.floor(gameDuration / 60);
    const seconds = gameDuration % 60;
    
    document.getElementById('game-duration').textContent = `${minutes}分${seconds}秒`;
    document.getElementById('total-rounds').textContent = gameState.currentRound;
    document.getElementById('eliminated-count').textContent = gameState.eliminatedPlayers.length;
}

// 再玩一次
function playAgain() {
    resetGameState();
    showSetup();
}

// 分享結果
function shareResult() {
    const gameResult = checkGameEnd();
    const winner = gameResult === 'civilian_win' ? '平民' : gameResult === 'spy_win' ? '臥底' : '無';
    
    const shareText = `🕵️ 誰是臥底遊戲結果\n勝利者：${winner}\n詞彙：${gameState.wordPair.civilian} vs ${gameState.wordPair.spy}\n回合數：${gameState.currentRound}\n一起來玩吧！`;
    
    if (navigator.share) {
        navigator.share({
            title: '誰是臥底遊戲結果',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + ' ' + window.location.href).then(() => {
            alert('結果已複製到剪貼板！');
        });
    }
}

// 複製房間連結
function copyRoomLink() {
    const roomLink = `${window.location.href}?room=${encodeURIComponent(gameState.roomName)}`;
    navigator.clipboard.writeText(roomLink).then(() => {
        alert('房間連結已複製到剪貼板！');
    });
}

// 返回首頁
function goHome() {
    window.location.href = '../index.html';
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    showWelcome();
    
    // 初始化臥底人數選項
    updateSpyCount();
    
    // 檢查URL參數是否有房間資訊
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('room-name').value = roomParam;
    }
});
