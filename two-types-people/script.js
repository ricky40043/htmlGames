// 遊戲狀態管理
let gameState = {
    mode: 'single', // 'single' 或 'compare'
    currentQuestion: 0,
    answers: [],
    questions: [],
    totalQuestions: 20
};

// 頁面控制
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// 開始遊戲
function startGame(mode) {
    gameState.mode = mode;
    gameState.currentQuestion = 0;
    gameState.answers = [];
    
    // 從題庫中隨機選擇題目
    gameState.questions = getRandomQuestions(gameState.totalQuestions);
    
    showPage('game-page');
    displayQuestion();
}

// 獲取隨機題目
function getRandomQuestions(count) {
    const allQuestions = [...questionBank];
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 顯示題目
function displayQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    const questionNum = gameState.currentQuestion + 1;
    
    // 更新進度條
    const progress = (questionNum / gameState.totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${questionNum} / ${gameState.totalQuestions}`;
    
    // 更新題目內容
    document.getElementById('question-title').textContent = question.question;
    document.getElementById('option-a-text').textContent = question.optionA;
    document.getElementById('option-b-text').textContent = question.optionB;
    
    // 重置選項狀態
    document.getElementById('option-a').classList.remove('selected');
    document.getElementById('option-b').classList.remove('selected');
    
    // 如果已經回答過，顯示之前的選擇
    if (gameState.answers[gameState.currentQuestion]) {
        const selectedOption = gameState.answers[gameState.currentQuestion];
        if (selectedOption === 'A') {
            document.getElementById('option-a').classList.add('selected');
        } else {
            document.getElementById('option-b').classList.add('selected');
        }
    }
    
    // 更新導航按鈕
    updateNavigation();
}

// 選擇選項
function selectOption(option) {
    // 移除之前的選擇
    document.getElementById('option-a').classList.remove('selected');
    document.getElementById('option-b').classList.remove('selected');
    
    // 添加新選擇
    if (option === 'A') {
        document.getElementById('option-a').classList.add('selected');
    } else {
        document.getElementById('option-b').classList.add('selected');
    }
    
    // 保存答案
    gameState.answers[gameState.currentQuestion] = option;
    
    // 更新導航按鈕
    updateNavigation();
}

// 更新導航按鈕狀態
function updateNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // 上一題按鈕
    prevBtn.disabled = gameState.currentQuestion === 0;
    
    // 下一題按鈕
    const hasAnswer = gameState.answers[gameState.currentQuestion] !== undefined;
    const isLastQuestion = gameState.currentQuestion === gameState.totalQuestions - 1;
    
    if (isLastQuestion) {
        nextBtn.textContent = hasAnswer ? '查看結果 🎉' : '查看結果';
        nextBtn.disabled = !hasAnswer;
    } else {
        nextBtn.textContent = hasAnswer ? '下一題 →' : '下一題';
        nextBtn.disabled = !hasAnswer;
    }
}

// 上一題
function previousQuestion() {
    if (gameState.currentQuestion > 0) {
        gameState.currentQuestion--;
        displayQuestion();
    }
}

// 下一題
function nextQuestion() {
    if (gameState.currentQuestion < gameState.totalQuestions - 1) {
        gameState.currentQuestion++;
        displayQuestion();
    } else {
        // 最後一題，顯示結果
        showResults();
    }
}

// 顯示結果
function showResults() {
    showPage('result-page');
    calculateAndDisplayResults();
}

// 計算並顯示結果
function calculateAndDisplayResults() {
    const results = {};
    
    // 統計各類別的結果
    gameState.questions.forEach((question, index) => {
        const category = question.category;
        const answer = gameState.answers[index];
        
        if (!results[category]) {
            results[category] = { A: 0, B: 0, total: 0 };
        }
        
        results[category][answer]++;
        results[category].total++;
    });
    
    // 生成結果顯示
    generateResultDisplay(results);
}

// 生成結果顯示
function generateResultDisplay(results) {
    const resultDetailsDiv = document.getElementById('result-details');
    let html = '';
    
    Object.keys(results).forEach(category => {
        const categoryData = results[category];
        const aPercentage = Math.round((categoryData.A / categoryData.total) * 100);
        const bPercentage = Math.round((categoryData.B / categoryData.total) * 100);
        
        // 找到這個類別的題目來取得選項描述
        const categoryQuestion = gameState.questions.find(q => q.category === category);
        const dominantChoice = categoryData.A >= categoryData.B ? 'A' : 'B';
        const dominantOption = dominantChoice === 'A' ? categoryQuestion.optionA : categoryQuestion.optionB;
        
        html += `
            <div class="category-result">
                <div class="category-info">
                    <div class="category-name">${getCategoryDisplayName(category)}</div>
                    <div class="category-stats">A: ${aPercentage}% | B: ${bPercentage}%</div>
                </div>
                <div class="category-choice">${dominantOption}</div>
            </div>
        `;
    });
    
    resultDetailsDiv.innerHTML = html;
    
    // 簡單的圓餅圖顯示（可以用更複雜的圖表庫替換）
    generateSimpleChart(results);
}

// 生成簡單圖表
function generateSimpleChart(results) {
    const chartDiv = document.getElementById('result-chart');
    const totalA = Object.values(results).reduce((sum, cat) => sum + cat.A, 0);
    const totalB = Object.values(results).reduce((sum, cat) => sum + cat.B, 0);
    const total = totalA + totalB;
    
    const aPercentage = Math.round((totalA / total) * 100);
    const bPercentage = Math.round((totalB / total) * 100);
    
    chartDiv.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 2rem; margin: 2rem 0;">
            <div style="text-align: center;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(90deg, #007bff ${aPercentage}%, #28a745 ${aPercentage}%); margin: 0 auto;"></div>
                <div style="margin-top: 1rem; font-size: 1.2rem; font-weight: bold;">
                    類型A: ${aPercentage}%<br>
                    類型B: ${bPercentage}%
                </div>
            </div>
        </div>
        <p style="text-align: center; color: #666; margin-top: 1rem;">
            你傾向於 <strong>${aPercentage > bPercentage ? 'A類型' : 'B類型'}</strong> 的選擇
        </p>
    `;
}

// 取得類別顯示名稱
function getCategoryDisplayName(category) {
    const categoryNames = {
        'food': '🍚 飲食爭議',
        'life': '🏠 生活習慣',
        'daily': '📅 日常選擇',
        'usage': '📱 使用習慣',
        'shopping': '🛒 購物習慣',
        'transport': '🚗 交通習慣',
        'entertainment': '🎮 娛樂偏好'
    };
    return categoryNames[category] || category;
}

// 重新開始遊戲
function restartGame() {
    showPage('welcome-page');
}

// 分享結果
function shareResult() {
    const totalA = gameState.answers.filter(answer => answer === 'A').length;
    const totalB = gameState.answers.filter(answer => answer === 'B').length;
    const total = totalA + totalB;
    const aPercentage = Math.round((totalA / total) * 100);
    
    const shareText = `我完成了「2種人」測試！結果顯示我有 ${aPercentage}% 傾向A類型選擇。你也來測試看看你是哪一種人吧！`;
    
    if (navigator.share) {
        navigator.share({
            title: '2種人測試結果',
            text: shareText,
            url: window.location.href
        });
    } else {
        // 回退方案：複製到剪貼板
        navigator.clipboard.writeText(shareText + ' ' + window.location.href).then(() => {
            alert('結果已複製到剪貼板！');
        });
    }
}

// 返回首頁
function goHome() {
    window.location.href = '../index.html';
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    showPage('welcome-page');
});