// 遊戲狀態管理
let gameState = {
    player1: { name: '', score: 0, correct: 0, wrong: 0, skips: 3 },
    player2: { name: '', score: 0, correct: 0, wrong: 0, skips: 3 },
    currentPlayer: 1,
    currentQuestion: 0,
    questions: [],
    difficulty: 'medium',
    questionCount: 20,
    category: 'all',
    timeLimit: 15,
    timer: null,
    timeLeft: 15,
    gameStarted: false,
    gameEnded: false
};

// 難度設定
const difficultySettings = {
    easy: { time: 20, correctScore: 10, wrongScore: -3, timeoutScore: -1 },
    medium: { time: 15, correctScore: 10, wrongScore: -5, timeoutScore: -3 },
    hard: { time: 10, correctScore: 15, wrongScore: -5, timeoutScore: -3 }
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
}

function showSetup() {
    showPage('setup-page');
    // 設定預設玩家名稱
    if (!document.getElementById('player1-name').value) {
        document.getElementById('player1-name').value = '玩家一';
    }
    if (!document.getElementById('player2-name').value) {
        document.getElementById('player2-name').value = '玩家二';
    }
}

function showRules() {
    showPage('rules-page');
}

// 開始遊戲
function startGame() {
    // 獲取設定
    gameState.player1.name = document.getElementById('player1-name').value || '玩家一';
    gameState.player2.name = document.getElementById('player2-name').value || '玩家二';
    gameState.difficulty = document.getElementById('difficulty').value;
    gameState.questionCount = parseInt(document.getElementById('question-count').value);
    gameState.category = document.getElementById('category').value;
    
    // 設定時間和計分
    const settings = difficultySettings[gameState.difficulty];
    gameState.timeLimit = settings.time;
    gameState.timeLeft = settings.time;
    
    // 重置遊戲狀態
    resetGameState();
    
    // 準備題目
    prepareQuestions();
    
    // 初始化遊戲界面
    initializeGameUI();
    
    // 顯示遊戲頁面
    showPage('game-page');
    
    // 開始第一題
    nextQuestion();
}

// 重置遊戲狀態
function resetGameState() {
    gameState.player1.score = 0;
    gameState.player1.correct = 0;
    gameState.player1.wrong = 0;
    gameState.player1.skips = 3;
    
    gameState.player2.score = 0;
    gameState.player2.correct = 0;
    gameState.player2.wrong = 0;
    gameState.player2.skips = 3;
    
    gameState.currentPlayer = 1;
    gameState.currentQuestion = 0;
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    
    clearInterval(gameState.timer);
}

// 準備題目
function prepareQuestions() {
    // 確保重置已使用的題目列表（每次新遊戲開始時）
    if (typeof resetUsedQuestions === 'function') {
        resetUsedQuestions();
    }
    
    // 使用新的防重複題庫函數
    if (typeof getQuestionsByFilter === 'function' && typeof questionBank !== 'undefined') {
        console.log('使用防重複題庫，總題目數:', questionBank.length);
        gameState.questions = getQuestionsByFilter(gameState.difficulty, gameState.category, gameState.questionCount);
        console.log('選出題目數:', gameState.questions.length);
        console.log('選出的題目ID:', gameState.questions.map(q => q.id));
    } else {
        console.log('使用備援方案');
        // 備援方案：使用原始方法
        let availableQuestions = [...(window.questionBank || questionBank)];
        
        // 根據難度篩選
        if (gameState.difficulty !== 'all') {
            availableQuestions = availableQuestions.filter(q => q.difficulty === gameState.difficulty);
        }
        
        // 根據類別篩選
        if (gameState.category !== 'all') {
            availableQuestions = availableQuestions.filter(q => q.category === gameState.category);
        }
        
        // 隨機選擇題目
        const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
        gameState.questions = shuffled.slice(0, gameState.questionCount);
    }
}

// 初始化遊戲UI
function initializeGameUI() {
    // 更新玩家名稱
    document.getElementById('player1-display').textContent = gameState.player1.name;
    document.getElementById('player2-display').textContent = gameState.player2.name;
    
    // 重置分數顯示
    updateScoreDisplay();
    updateCurrentPlayer();
}

// 更新分數顯示
function updateScoreDisplay() {
    document.querySelector('#player1-score .score').textContent = gameState.player1.score;
    document.querySelector('#player2-score .score').textContent = gameState.player2.score;
}

// 更新當前玩家顯示
function updateCurrentPlayer() {
    const player1Element = document.getElementById('player1-score');
    const player2Element = document.getElementById('player2-score');
    const currentPlayerText = document.getElementById('current-player-text');
    
    if (gameState.currentPlayer === 1) {
        player1Element.classList.add('active');
        player2Element.classList.remove('active');
        currentPlayerText.textContent = `輪到 ${gameState.player1.name} 回答`;
    } else {
        player1Element.classList.remove('active');
        player2Element.classList.add('active');
        currentPlayerText.textContent = `輪到 ${gameState.player2.name} 回答`;
    }
}

// 下一題
function nextQuestion() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestion];
    displayQuestion(question);
    startTimer();
    updateQuestionInfo();
}

// 顯示題目
function displayQuestion(question) {
    document.getElementById('question-category').textContent = getCategoryDisplayName(question.category);
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // 混合選項順序
    const options = [...question.options];
    const shuffledOptions = options.sort(() => 0.5 - Math.random());
    
    shuffledOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectOption(option, question.correct);
        optionsContainer.appendChild(button);
    });
}

// 選擇答案
function selectOption(selectedOption, correctAnswer) {
    clearInterval(gameState.timer);
    
    const isCorrect = selectedOption === correctAnswer;
    const currentPlayerObj = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2;
    const settings = difficultySettings[gameState.difficulty];
    
    // 更新分數
    if (isCorrect) {
        currentPlayerObj.score += settings.correctScore;
        currentPlayerObj.correct++;
    } else {
        currentPlayerObj.score += settings.wrongScore;
        currentPlayerObj.wrong++;
    }
    
    // 視覺回饋
    showAnswerFeedback(selectedOption, correctAnswer);
    
    // 更新顯示
    updateScoreDisplay();
    
    // 2秒後繼續下一題
    setTimeout(() => {
        gameState.currentQuestion++;
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updateCurrentPlayer();
        nextQuestion();
    }, 2000);
}

// 顯示答案回饋
function showAnswerFeedback(selectedOption, correctAnswer) {
    const optionButtons = document.querySelectorAll('.option-btn');
    
    optionButtons.forEach(button => {
        button.disabled = true;
        if (button.textContent === correctAnswer) {
            button.classList.add('correct');
        } else if (button.textContent === selectedOption && selectedOption !== correctAnswer) {
            button.classList.add('wrong');
        }
    });
}

// 開始計時器
function startTimer() {
    gameState.timeLeft = gameState.timeLimit;
    updateTimerDisplay();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            timeOut();
        }
    }, 1000);
}

// 更新計時器顯示
function updateTimerDisplay() {
    document.getElementById('timer-display').textContent = `${gameState.timeLeft}秒`;
    
    const timerBar = document.getElementById('timer-bar');
    const percentage = (gameState.timeLeft / gameState.timeLimit) * 100;
    timerBar.style.setProperty('--timer-width', `${percentage}%`);
}

// 時間到
function timeOut() {
    clearInterval(gameState.timer);
    
    const currentPlayerObj = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2;
    const settings = difficultySettings[gameState.difficulty];
    
    currentPlayerObj.score += settings.timeoutScore;
    currentPlayerObj.wrong++;
    
    // 顯示正確答案
    const question = gameState.questions[gameState.currentQuestion];
    showAnswerFeedback('', question.correct);
    
    updateScoreDisplay();
    
    // 2秒後繼續下一題
    setTimeout(() => {
        gameState.currentQuestion++;
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updateCurrentPlayer();
        nextQuestion();
    }, 2000);
}

// 更新題目資訊
function updateQuestionInfo() {
    document.getElementById('current-round').textContent = `第${gameState.currentQuestion + 1}題`;
}

// 跳過題目
function skipQuestion() {
    const currentPlayerObj = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2;
    
    if (currentPlayerObj.skips > 0) {
        currentPlayerObj.skips--;
        clearInterval(gameState.timer);
        
        gameState.currentQuestion++;
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updateCurrentPlayer();
        nextQuestion();
        
        alert(`跳過成功！剩餘跳過次數：${currentPlayerObj.skips}`);
    } else {
        alert('跳過次數已用完！');
    }
}

// 暫停遊戲
function pauseGame() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        const resume = confirm('遊戲已暫停，點擊確定繼續遊戲');
        if (resume) {
            startTimer();
        }
    }
}

// 結束遊戲
function endGame() {
    clearInterval(gameState.timer);
    gameState.gameEnded = true;
    showResults();
}

// 顯示結果
function showResults() {
    showPage('result-page');
    
    // 判斷勝負
    const player1Score = gameState.player1.score;
    const player2Score = gameState.player2.score;
    const winnerElement = document.getElementById('winner-announcement');
    
    if (player1Score > player2Score) {
        winnerElement.textContent = `🏆 ${gameState.player1.name} 獲勝！`;
        winnerElement.className = 'winner-announcement player1';
    } else if (player2Score > player1Score) {
        winnerElement.textContent = `🏆 ${gameState.player2.name} 獲勝！`;
        winnerElement.className = 'winner-announcement player2';
    } else {
        winnerElement.textContent = '🤝 平手！';
        winnerElement.className = 'winner-announcement tie';
    }
    
    // 更新最終分數
    document.getElementById('final-player1-name').textContent = gameState.player1.name;
    document.getElementById('final-player1-score').textContent = player1Score;
    document.getElementById('final-player1-correct').textContent = gameState.player1.correct;
    document.getElementById('final-player1-wrong').textContent = gameState.player1.wrong;
    
    document.getElementById('final-player2-name').textContent = gameState.player2.name;
    document.getElementById('final-player2-score').textContent = player2Score;
    document.getElementById('final-player2-correct').textContent = gameState.player2.correct;
    document.getElementById('final-player2-wrong').textContent = gameState.player2.wrong;
}

// 再玩一次
function playAgain() {
    showSetup();
}

// 更改設定
function changeSettings() {
    showSetup();
}

// 分享結果
function shareResult() {
    const winner = gameState.player1.score > gameState.player2.score ? gameState.player1.name : 
                   gameState.player2.score > gameState.player1.score ? gameState.player2.name : '平手';
    
    const shareText = `🎯 你問我答對戰結果\n${gameState.player1.name}: ${gameState.player1.score}分\n${gameState.player2.name}: ${gameState.player2.score}分\n${winner === '平手' ? '平手！' : `${winner} 獲勝！`}\n來挑戰看看吧！`;
    
    if (navigator.share) {
        navigator.share({
            title: '你問我答對戰結果',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + ' ' + window.location.href).then(() => {
            alert('結果已複製到剪貼板！');
        });
    }
}

// 返回首頁
function goHome() {
    window.location.href = '../index.html';
}

// 取得類別顯示名稱
function getCategoryDisplayName(category) {
    const categoryNames = {
        'geography': '🌍 地理',
        'history': '🏛️ 歷史',
        'science': '🔬 科學技術',
        'sports': '⚽ 體育',
        'culture': '🎬 文化娛樂',
        'current-affairs': '📰 時事新聞'
    };
    return categoryNames[category] || '📚 綜合題目';
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    showWelcome();
    
    // 鍵盤事件支援
    document.addEventListener('keydown', function(event) {
        if (document.getElementById('game-page').classList.contains('active')) {
            const optionButtons = document.querySelectorAll('.option-btn:not([disabled])');
            
            if (event.key >= '1' && event.key <= '4') {
                const index = parseInt(event.key) - 1;
                if (optionButtons[index]) {
                    optionButtons[index].click();
                }
            } else if (event.key === ' ') {
                event.preventDefault();
                skipQuestion();
            }
        }
    });
});
