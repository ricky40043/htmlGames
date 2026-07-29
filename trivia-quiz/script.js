/* ──────────────────────────────────────────────────────────
   冷知識大挑戰 (Trivia Challenge)
   Core Game Logic, Web Audio Sound Synthesizer,
   Icebreaker Team VS Mode, Lifelines & Confetti
   ────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    // ── GAME CONSTANTS & TITLES ──
    const USER_TITLES = [
        { min: 0, title: '冷知識新手 🐣' },
        { min: 20, title: '知識探險家 🧭' },
        { min: 50, title: '常識大師 📚' },
        { min: 100, title: '冷知識達人 💡' },
        { min: 200, title: '博學博士 🎓' },
        { min: 400, title: '知識王者 👑' },
        { min: 700, title: '全知大天尊 ⚡' },
        { min: 1000, title: '宇宙知識極致神 ✨' }
    ];

    // ── STATE MANAGEMENT ──
    const state = {
        soundEnabled: true,
        mode: 'stage', // 'stage', 'endless', 'time', 'icebreaker'
        currentStage: 1,
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        hearts: 3,
        timeLeft: 60,
        timerId: null,

        // Icebreaker Team Mode Settings & State
        icebreakerCount: 20,
        icebreakerType: 'vs', // 'vs' (Team Red vs Blue), 'solo' (Group Free)
        redTeamScore: 0,
        blueTeamScore: 0,
        
        // Powerups count
        powerup5050: 3,
        powerupHint: 3,
        powerupTime: 3,

        // Saved Progress Data
        savedData: {
            stages: {},
            maxStageUnlocked: 1,
            endlessHighScore: 0,
            timeAttackBest: 0,
            maxHistoricalStreak: 0,
            totalAnswered: 0,
            totalCorrect: 0
        }
    };

    // ── DOM ELEMENTS ──
    const DOM = {
        // Screens
        screenHome: document.getElementById('screen-home'),
        screenStages: document.getElementById('screen-stages'),
        screenQuiz: document.getElementById('screen-quiz'),
        screenResult: document.getElementById('screen-result'),

        // Header & Modals
        soundBtn: document.getElementById('sound-btn'),
        soundIcon: document.getElementById('sound-icon'),
        statsModalBtn: document.getElementById('stats-modal-btn'),
        statsModal: document.getElementById('stats-modal'),
        statsModalClose: document.getElementById('stats-modal-close'),
        resetDataBtn: document.getElementById('reset-data-btn'),

        // Icebreaker Modal
        startIcebreakerBtn: document.getElementById('start-icebreaker-btn'),
        icebreakerModal: document.getElementById('icebreaker-modal'),
        icebreakerModalClose: document.getElementById('icebreaker-modal-close'),
        countChipOptions: document.getElementById('count-chip-options'),
        confirmIcebreakerBtn: document.getElementById('confirm-icebreaker-btn'),

        // Home Menu
        startStageBtn: document.getElementById('start-stage-btn'),
        startEndlessBtn: document.getElementById('start-endless-btn'),
        startTimeBtn: document.getElementById('start-time-btn'),
        stageProgressTag: document.getElementById('stage-progress-tag'),
        endlessBestTag: document.getElementById('endless-best-tag'),
        timeBestTag: document.getElementById('time-best-tag'),

        // Daily Fact
        refreshFactBtn: document.getElementById('refresh-fact-btn'),
        dailyCat: document.getElementById('daily-cat'),
        dailyQuestion: document.getElementById('daily-question'),
        dailyExplanation: document.getElementById('daily-explanation'),

        // Stage Selector
        backToHomeBtn: document.getElementById('back-to-home-btn'),
        stageGrid: document.getElementById('stage-grid'),
        userTotalStars: document.getElementById('user-total-stars'),

        // Quiz Screen
        quizCatBadge: document.getElementById('quiz-cat-badge'),
        quizStageIndicator: document.getElementById('quiz-stage-indicator'),
        heartsPill: document.getElementById('hearts-pill'),
        heartsVal: document.getElementById('hearts-val'),
        timerPill: document.getElementById('timer-pill'),
        timerVal: document.getElementById('timer-val'),
        scorePill: document.getElementById('score-pill'),
        scoreVal: document.getElementById('score-val'),
        streakPill: document.getElementById('streak-pill'),
        streakVal: document.getElementById('streak-val'),
        quizProgressFill: document.getElementById('quiz-progress-fill'),

        // Team Scoreboard
        teamScoreboard: document.getElementById('team-scoreboard'),
        redTeamScore: document.getElementById('red-team-score'),
        blueTeamScore: document.getElementById('blue-team-score'),
        btnAddRed: document.getElementById('btn-add-red'),
        btnAddBlue: document.getElementById('btn-add-blue'),

        questionCard: document.getElementById('question-card'),
        qIdChip: document.getElementById('q-id-chip'),
        questionText: document.getElementById('question-text'),
        optionsGrid: document.getElementById('options-grid'),

        // Powerups
        powerupsBar: document.getElementById('powerups-bar'),
        powerup5050: document.getElementById('powerup-5050'),
        count5050: document.getElementById('count-5050'),
        powerupHint: document.getElementById('powerup-hint'),
        countHint: document.getElementById('count-hint'),
        powerupTime: document.getElementById('powerup-time'),
        countTime: document.getElementById('count-time'),

        // Explanation Drawer
        explanationDrawer: document.getElementById('explanation-drawer'),
        drawerResultTag: document.getElementById('drawer-result-tag'),
        drawerComboBadge: document.getElementById('drawer-combo-badge'),
        drawerExplanationText: document.getElementById('drawer-explanation-text'),
        nextQBtn: document.getElementById('next-q-btn'),

        // Result Screen
        resultIconEmoji: document.getElementById('result-icon-emoji'),
        resultTitle: document.getElementById('result-title'),
        resultSubtitle: document.getElementById('result-subtitle'),
        resultStarsRow: document.getElementById('result-stars-row'),
        teamWinnerBanner: document.getElementById('team-winner-banner'),
        winnerTitleText: document.getElementById('winner-title-text'),
        winnerScoresText: document.getElementById('winner-scores-text'),

        resScore: document.getElementById('res-score'),
        resAcc: document.getElementById('res-acc'),
        resStreak: document.getElementById('res-streak'),
        resTitleUnlocked: document.getElementById('res-title-unlocked'),
        resHomeBtn: document.getElementById('res-home-btn'),
        resRetryBtn: document.getElementById('res-retry-btn'),
        resNextStageBtn: document.getElementById('res-next-stage-btn'),

        // Modal Stats
        userTitleText: document.getElementById('user-title-text'),
        userTotalQText: document.getElementById('user-total-q-text'),
        mStatStage: document.getElementById('m-stat-stage'),
        mStatStars: document.getElementById('m-stat-stars'),
        mStatEndless: document.getElementById('m-stat-endless'),
        mStatTime: document.getElementById('m-stat-time'),
        mStatStreak: document.getElementById('m-stat-streak'),

        confettiCanvas: document.getElementById('confetti-canvas')
    };

    // ── WEB AUDIO SYNTHESIZER ──
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!state.soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;

            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'correct') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(180, now + 0.12);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'powerup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'victory') {
                const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                notes.forEach((freq, idx) => {
                    const subOsc = audioCtx.createOscillator();
                    const subGain = audioCtx.createGain();
                    subOsc.type = 'triangle';
                    subOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    subGain.gain.setValueAtTime(0.18, now + idx * 0.08);
                    subGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
                    subOsc.connect(subGain);
                    subGain.connect(audioCtx.destination);
                    subOsc.start(now + idx * 0.08);
                    subOsc.stop(now + idx * 0.08 + 0.3);
                });
            }
        } catch (e) {
            console.error('Audio error:', e);
        }
    }

    // ── LOCAL STORAGE SYSTEM ──
    function loadSavedProgress() {
        try {
            const raw = localStorage.getItem('TRIVIA_QUIZ_SAVE_V1');
            if (raw) {
                const parsed = JSON.parse(raw);
                state.savedData = Object.assign(state.savedData, parsed);
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
        }
        updateHomeTags();
    }

    function saveProgress() {
        try {
            localStorage.setItem('TRIVIA_QUIZ_SAVE_V1', JSON.stringify(state.savedData));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
        updateHomeTags();
    }

    function calculateTotalStars() {
        let stars = 0;
        Object.values(state.savedData.stages).forEach(s => stars += s);
        return stars;
    }

    function getTitleForCorrect(count) {
        let title = USER_TITLES[0].title;
        for (let t of USER_TITLES) {
            if (count >= t.min) title = t.title;
        }
        return title;
    }

    function updateHomeTags() {
        const unlockedCount = state.savedData.maxStageUnlocked;
        DOM.stageProgressTag.textContent = `進度: ${unlockedCount} / 100 關`;
        DOM.endlessBestTag.textContent = `最高分: ${state.savedData.endlessHighScore} 分`;
        DOM.timeBestTag.textContent = `最高速答: ${state.savedData.timeAttackBest} 題`;
        DOM.userTotalStars.textContent = calculateTotalStars();
    }

    // ── NAVIGATION & SCREEN SWITCHING ──
    function showScreen(targetScreen) {
        [DOM.screenHome, DOM.screenStages, DOM.screenQuiz, DOM.screenResult].forEach(scr => {
            scr.classList.remove('active');
        });
        targetScreen.classList.add('active');
        window.scrollTo(0, 0);
    }

    // ── DAILY FACT ──
    function renderDailyFact() {
        if (!window.TRIVIA_QUESTIONS || !window.TRIVIA_QUESTIONS.length) return;
        const randomQ = window.TRIVIA_QUESTIONS[Math.floor(Math.random() * window.TRIVIA_QUESTIONS.length)];
        DOM.dailyCat.textContent = randomQ.category;
        DOM.dailyQuestion.textContent = randomQ.question;
        DOM.dailyExplanation.textContent = `${randomQ.options[randomQ.correct]} —— ${randomQ.explanation}`;
    }

    // ── STAGE MAP RENDERER ──
    function renderStageGrid() {
        DOM.stageGrid.innerHTML = '';
        const maxUnlocked = state.savedData.maxStageUnlocked;

        for (let i = 1; i <= 100; i++) {
            const card = document.createElement('div');
            card.className = 'stage-card-item';
            const stars = state.savedData.stages[i] || 0;
            const isLocked = i > maxUnlocked;

            if (isLocked) {
                card.classList.add('locked');
                card.innerHTML = `<span class="stage-num">🔒</span><span class="stage-stars">${i} 關</span>`;
            } else {
                let starStr = '☆☆☆';
                if (stars === 1) starStr = '★☆☆';
                else if (stars === 2) starStr = '★★☆';
                else if (stars === 3) starStr = '★★★';

                card.innerHTML = `
                    <span class="stage-num">${i}</span>
                    <span class="stage-stars">${starStr}</span>
                `;
                card.addEventListener('click', () => {
                    playSound('click');
                    startStageQuiz(i);
                });
            }
            DOM.stageGrid.appendChild(card);
        }
    }

    // ── QUIZ LOGIC & MODES ──

    // 1. ICEBREAKER MODE (小組破冰模式)
    function startIcebreakerQuiz() {
        state.mode = 'icebreaker';
        state.currentIndex = 0;
        state.score = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.correctCount = 0;
        state.redTeamScore = 0;
        state.blueTeamScore = 0;

        state.powerup5050 = 3;
        state.powerupHint = 3;
        state.powerupTime = 3;

        // Randomly pick N questions (10, 20, or 30) from total 1000 pool
        const count = state.icebreakerCount || 20;
        state.questions = [...(window.TRIVIA_QUESTIONS || [])]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

        DOM.heartsPill.style.display = 'none';
        DOM.timerPill.style.display = 'none';
        DOM.streakPill.style.display = 'none';
        DOM.scorePill.style.display = (state.icebreakerType === 'solo') ? 'flex' : 'none';

        if (state.icebreakerType === 'vs') {
            DOM.teamScoreboard.style.display = 'flex';
            DOM.redTeamScore.textContent = '0';
            DOM.blueTeamScore.textContent = '0';
        } else {
            DOM.teamScoreboard.style.display = 'none';
        }

        showScreen(DOM.screenQuiz);
        updateQuizStatus();
        renderQuestion();
    }

    // 2. STAGE MODE
    function startStageQuiz(stageNum) {
        state.mode = 'stage';
        state.currentStage = stageNum;
        state.currentIndex = 0;
        state.score = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.correctCount = 0;
        
        state.powerup5050 = 3;
        state.powerupHint = 3;
        state.powerupTime = 3;

        const allQuestions = window.TRIVIA_QUESTIONS || [];
        const startOffset = ((stageNum - 1) * 10) % allQuestions.length;
        state.questions = allQuestions.slice(startOffset, startOffset + 10);
        if (state.questions.length < 10) {
            state.questions = state.questions.concat(allQuestions.slice(0, 10 - state.questions.length));
        }

        DOM.heartsPill.style.display = 'none';
        DOM.timerPill.style.display = 'none';
        DOM.scorePill.style.display = 'flex';
        DOM.streakPill.style.display = 'flex';
        DOM.teamScoreboard.style.display = 'none';

        showScreen(DOM.screenQuiz);
        updateQuizStatus();
        renderQuestion();
    }

    // 3. ENDLESS MODE
    function startEndlessQuiz() {
        state.mode = 'endless';
        state.currentIndex = 0;
        state.score = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.correctCount = 0;
        state.hearts = 3;

        state.powerup5050 = 3;
        state.powerupHint = 3;
        state.powerupTime = 3;

        state.questions = [...(window.TRIVIA_QUESTIONS || [])].sort(() => Math.random() - 0.5);

        DOM.heartsPill.style.display = 'flex';
        DOM.timerPill.style.display = 'none';
        DOM.scorePill.style.display = 'flex';
        DOM.streakPill.style.display = 'flex';
        DOM.teamScoreboard.style.display = 'none';
        DOM.heartsVal.textContent = state.hearts;

        showScreen(DOM.screenQuiz);
        updateQuizStatus();
        renderQuestion();
    }

    // 4. TIME ATTACK MODE
    function startTimeAttackQuiz() {
        state.mode = 'time';
        state.currentIndex = 0;
        state.score = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.correctCount = 0;
        state.timeLeft = 60;

        state.powerup5050 = 3;
        state.powerupHint = 3;
        state.powerupTime = 3;

        state.questions = [...(window.TRIVIA_QUESTIONS || [])].sort(() => Math.random() - 0.5);

        DOM.heartsPill.style.display = 'none';
        DOM.timerPill.style.display = 'flex';
        DOM.scorePill.style.display = 'flex';
        DOM.streakPill.style.display = 'flex';
        DOM.teamScoreboard.style.display = 'none';
        DOM.timerVal.textContent = `${state.timeLeft}s`;

        showScreen(DOM.screenQuiz);
        updateQuizStatus();
        renderQuestion();

        if (state.timerId) clearInterval(state.timerId);
        state.timerId = setInterval(() => {
            state.timeLeft--;
            DOM.timerVal.textContent = `${state.timeLeft}s`;
            if (state.timeLeft <= 0) {
                clearInterval(state.timerId);
                finishQuiz();
            }
        }, 1000);
    }

    function updateQuizStatus() {
        DOM.scoreVal.textContent = state.score;
        DOM.streakVal.textContent = state.streak;
        DOM.count5050.textContent = state.powerup5050;
        DOM.countHint.textContent = state.powerupHint;
        DOM.countTime.textContent = state.powerupTime;

        if (state.mode === 'icebreaker') {
            const total = state.questions.length;
            DOM.quizStageIndicator.textContent = `小組破冰 - 第 ${state.currentIndex + 1} / ${total} 題`;
            const progress = ((state.currentIndex) / total) * 100;
            DOM.quizProgressFill.style.width = `${progress}%`;
        } else if (state.mode === 'stage') {
            DOM.quizStageIndicator.textContent = `第 ${state.currentStage} 關 - ${state.currentIndex + 1}/10`;
            const progress = (state.currentIndex / 10) * 100;
            DOM.quizProgressFill.style.width = `${progress}%`;
        } else if (state.mode === 'endless') {
            DOM.quizStageIndicator.textContent = `無限挑戰 - 第 ${state.currentIndex + 1} 題`;
            DOM.quizProgressFill.style.width = `100%`;
            DOM.heartsVal.textContent = state.hearts;
        } else if (state.mode === 'time') {
            DOM.quizStageIndicator.textContent = `速答挑戰 - 答對 ${state.correctCount} 題`;
            DOM.quizProgressFill.style.width = `${(state.timeLeft / 60) * 100}%`;
        }
    }

    function renderQuestion() {
        DOM.explanationDrawer.classList.add('hidden');
        
        const q = state.questions[state.currentIndex];
        if (!q) {
            finishQuiz();
            return;
        }

        DOM.quizCatBadge.textContent = q.category;
        DOM.qIdChip.textContent = `#${String(q.id).padStart(3, '0')}`;
        DOM.questionText.textContent = q.question;

        DOM.optionsGrid.innerHTML = '';
        const optionLabels = ['A', 'B', 'C', 'D'];

        q.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.index = idx;
            btn.innerHTML = `
                <span class="option-index">${optionLabels[idx]}</span>
                <span class="option-text">${optText}</span>
            `;
            btn.addEventListener('click', () => handleOptionSelect(idx));
            DOM.optionsGrid.appendChild(btn);
        });

        // Reset powerup button states
        DOM.powerup5050.disabled = state.powerup5050 <= 0;
        DOM.powerupHint.disabled = state.powerupHint <= 0;
        DOM.powerupTime.disabled = state.powerupTime <= 0;
    }

    function handleOptionSelect(selectedIndex) {
        initAudio();
        const q = state.questions[state.currentIndex];
        const buttons = DOM.optionsGrid.querySelectorAll('.option-btn');
        buttons.forEach(b => b.disabled = true);

        const isCorrect = (selectedIndex === q.correct);
        state.savedData.totalAnswered++;

        if (isCorrect) {
            playSound('correct');
            state.correctCount++;
            state.savedData.totalCorrect++;
            state.streak++;
            if (state.streak > state.maxStreak) state.maxStreak = state.streak;
            if (state.streak > state.savedData.maxHistoricalStreak) state.savedData.maxHistoricalStreak = state.streak;

            const comboBonus = Math.min(state.streak * 50, 300);
            const gainedScore = 100 + comboBonus;
            state.score += gainedScore;

            buttons[selectedIndex].classList.add('correct');
            DOM.drawerResultTag.textContent = '✅ 正確答案！';
            DOM.drawerResultTag.style.color = 'var(--accent-emerald)';
            
            if (state.mode === 'icebreaker') {
                DOM.drawerComboBadge.textContent = `正確選項：${q.options[q.correct]}`;
            } else {
                DOM.drawerComboBadge.textContent = `+${gainedScore} 分 (連擊 x${state.streak})`;
            }

            if (state.mode === 'time') {
                state.timeLeft += 2;
            }
        } else {
            playSound('wrong');
            state.streak = 0;
            buttons[selectedIndex].classList.add('wrong');
            buttons[q.correct].classList.add('correct');

            DOM.drawerResultTag.textContent = '❌ 答錯了！';
            DOM.drawerResultTag.style.color = 'var(--accent-rose)';
            DOM.drawerComboBadge.textContent = `正確答案：${q.options[q.correct]}`;

            if (state.mode === 'endless') {
                state.hearts--;
                DOM.heartsVal.textContent = state.hearts;
            } else if (state.mode === 'time') {
                state.timeLeft = Math.max(0, state.timeLeft - 3);
            }
        }

        updateQuizStatus();

        // Show Explanation Drawer
        DOM.drawerExplanationText.textContent = q.explanation;
        DOM.explanationDrawer.classList.remove('hidden');

        saveProgress();
    }

    function nextQuestion() {
        if (state.mode === 'endless' && state.hearts <= 0) {
            finishQuiz();
            return;
        }

        state.currentIndex++;

        const totalQ = state.questions.length;
        if (state.currentIndex >= totalQ) {
            finishQuiz();
            return;
        }

        updateQuizStatus();
        renderQuestion();
    }

    // ── POWERUPS IMPLEMENTATION ──
    function use5050() {
        if (state.powerup5050 <= 0) return;
        playSound('powerup');
        state.powerup5050--;
        DOM.count5050.textContent = state.powerup5050;
        DOM.powerup5050.disabled = true;

        const q = state.questions[state.currentIndex];
        const buttons = Array.from(DOM.optionsGrid.querySelectorAll('.option-btn'));
        const wrongIndices = [];

        buttons.forEach((btn, idx) => {
            if (idx !== q.correct) wrongIndices.push(idx);
        });

        wrongIndices.sort(() => Math.random() - 0.5);
        buttons[wrongIndices[0]].classList.add('disabled-5050');
        buttons[wrongIndices[1]].classList.add('disabled-5050');
    }

    function useHint() {
        if (state.powerupHint <= 0) return;
        playSound('powerup');
        state.powerupHint--;
        DOM.countHint.textContent = state.powerupHint;
        DOM.powerupHint.disabled = true;

        const q = state.questions[state.currentIndex];
        alert(`📖 冷知識關鍵提示：\n${q.explanation.substring(0, 35)}...`);
    }

    function useTimeOrHeart() {
        if (state.powerupTime <= 0) return;
        playSound('powerup');
        state.powerupTime--;
        DOM.countTime.textContent = state.powerupTime;
        DOM.powerupTime.disabled = true;

        if (state.mode === 'time') {
            state.timeLeft += 10;
            DOM.timerVal.textContent = `${state.timeLeft}s`;
        } else if (state.mode === 'endless') {
            state.hearts++;
            DOM.heartsVal.textContent = state.hearts;
        } else {
            state.score += 200;
            DOM.scoreVal.textContent = state.score;
        }
    }

    // ── FINISH QUIZ & SUMMARY ──
    function finishQuiz() {
        if (state.timerId) clearInterval(state.timerId);
        showScreen(DOM.screenResult);

        const totalQ = state.questions.length;
        const accPct = totalQ > 0 ? Math.round((state.correctCount / totalQ) * 100) : 0;

        DOM.resScore.textContent = (state.mode === 'icebreaker' && state.icebreakerType === 'vs') 
            ? `${state.redTeamScore} : ${state.blueTeamScore}` 
            : `${state.score} 分 (${state.correctCount}/${totalQ} 題)`;

        DOM.resAcc.textContent = `${accPct}%`;
        DOM.resStreak.textContent = `🔥 ${state.maxStreak}`;
        DOM.resTitleUnlocked.textContent = getTitleForCorrect(state.savedData.totalCorrect);

        if (state.mode === 'icebreaker') {
            DOM.resultStarsRow.style.display = 'none';
            DOM.resNextStageBtn.style.display = 'none';

            if (state.icebreakerType === 'vs') {
                DOM.teamWinnerBanner.style.display = 'block';
                DOM.winnerScoresText.textContent = `🔴 紅隊 ${state.redTeamScore} 分 vs 🔵 藍隊 ${state.blueTeamScore} 分`;

                if (state.redTeamScore > state.blueTeamScore) {
                    DOM.winnerTitleText.textContent = '🔴 恭喜 紅隊 榮獲破冰王者！';
                    DOM.winnerTitleText.style.color = 'var(--team-red)';
                } else if (state.blueTeamScore > state.redTeamScore) {
                    DOM.winnerTitleText.textContent = '🔵 恭喜 藍隊 榮獲破冰王者！';
                    DOM.winnerTitleText.style.color = 'var(--team-blue)';
                } else {
                    DOM.winnerTitleText.textContent = '🤝 兩隊旗鼓相當，平手對決！';
                    DOM.winnerTitleText.style.color = '#fbbf24';
                }
            } else {
                DOM.teamWinnerBanner.style.display = 'none';
            }

            playSound('victory');
            launchConfetti();
            DOM.resultTitle.textContent = '🎉 團體破冰圓滿完成！';
            DOM.resultSubtitle.textContent = `本次挑戰共完成了 ${totalQ} 題冷知識科普競猜。`;
            DOM.resRetryBtn.textContent = '再玩一次 (換20題)';

        } else if (state.mode === 'stage') {
            DOM.teamWinnerBanner.style.display = 'none';
            DOM.resultStarsRow.style.display = 'flex';
            DOM.resRetryBtn.textContent = '重新挑戰';

            let stars = 0;
            if (accPct >= 60) stars = 1;
            if (accPct >= 80) stars = 2;
            if (accPct >= 100) stars = 3;

            const currentSavedStars = state.savedData.stages[state.currentStage] || 0;
            if (stars > currentSavedStars) {
                state.savedData.stages[state.currentStage] = stars;
            }

            if (stars >= 1 && state.currentStage === state.savedData.maxStageUnlocked && state.savedData.maxStageUnlocked < 100) {
                state.savedData.maxStageUnlocked++;
            }

            const starElems = DOM.resultStarsRow.querySelectorAll('.star-icon');
            starElems.forEach((st, idx) => {
                st.style.opacity = (idx < stars) ? '1' : '0.2';
            });

            if (stars >= 1) {
                playSound('victory');
                launchConfetti();
                DOM.resultTitle.textContent = '關卡勝利！';
                DOM.resultSubtitle.textContent = `太強了！你順利通過第 ${state.currentStage} 關。`;
                DOM.resNextStageBtn.style.display = (state.currentStage < 100) ? 'inline-flex' : 'none';
            } else {
                DOM.resultTitle.textContent = '闖關失敗';
                DOM.resultSubtitle.textContent = '正確率未達 60%，再接再厲！';
                DOM.resNextStageBtn.style.display = 'none';
            }

        } else if (state.mode === 'endless') {
            DOM.teamWinnerBanner.style.display = 'none';
            DOM.resultStarsRow.style.display = 'none';
            DOM.resNextStageBtn.style.display = 'none';
            DOM.resRetryBtn.textContent = '重新挑戰';

            if (state.score > state.savedData.endlessHighScore) {
                state.savedData.endlessHighScore = state.score;
                playSound('victory');
                launchConfetti();
                DOM.resultTitle.textContent = '🎉 創下最高分新紀錄！';
                DOM.resultSubtitle.textContent = `你在無限模式中榮獲 ${state.score} 高分！`;
            } else {
                DOM.resultTitle.textContent = '挑戰結束';
                DOM.resultSubtitle.textContent = `感謝挑戰！最終得分：${state.score} 分。`;
            }

        } else if (state.mode === 'time') {
            DOM.teamWinnerBanner.style.display = 'none';
            DOM.resultStarsRow.style.display = 'none';
            DOM.resNextStageBtn.style.display = 'none';
            DOM.resRetryBtn.textContent = '重新挑戰';

            if (state.correctCount > state.savedData.timeAttackBest) {
                state.savedData.timeAttackBest = state.correctCount;
                playSound('victory');
                launchConfetti();
                DOM.resultTitle.textContent = '⏱️ 創下極速速答紀錄！';
                DOM.resultSubtitle.textContent = `60秒內狂答對 ${state.correctCount} 題！`;
            } else {
                DOM.resultTitle.textContent = '時間到！';
                DOM.resultSubtitle.textContent = `你在 60 秒內成功答對 ${state.correctCount} 題！`;
            }
        }

        saveProgress();
    }

    // ── CONFETTI CELEBRATION EFFECT ──
    function launchConfetti() {
        const canvas = DOM.confettiCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ffffff'];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.8) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let animFrame;
        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.4;
                p.rotation += p.rSpeed;
                p.opacity -= 0.015;

                if (p.opacity > 0) {
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (alive) {
                animFrame = requestAnimationFrame(update);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animFrame);
            }
        }
        update();
    }

    // ── STATS MODAL RENDER ──
    function openStatsModal() {
        DOM.userTitleText.textContent = getTitleForCorrect(state.savedData.totalCorrect);
        DOM.userTotalQText.textContent = `已累計答對 ${state.savedData.totalCorrect} 題 (總答 ${state.savedData.totalAnswered} 題)`;
        DOM.mStatStage.textContent = `${state.savedData.maxStageUnlocked} / 100 關`;
        DOM.mStatStars.textContent = `${calculateTotalStars()} / 300 ⭐`;
        DOM.mStatEndless.textContent = `${state.savedData.endlessHighScore} 分`;
        DOM.mStatTime.textContent = `${state.savedData.timeAttackBest} 題`;
        DOM.mStatStreak.textContent = `🔥 ${state.savedData.maxHistoricalStreak} 連擊`;
        DOM.statsModal.classList.remove('hidden');
    }

    // ── EVENT LISTENERS INITIALIZATION ──
    function initEvents() {
        // Sound toggle
        DOM.soundBtn.addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            DOM.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
        });

        // Modals
        DOM.statsModalBtn.addEventListener('click', openStatsModal);
        DOM.statsModalClose.addEventListener('click', () => DOM.statsModal.classList.add('hidden'));

        DOM.resetDataBtn.addEventListener('click', () => {
            if (confirm('確定要重置所有遊戲紀錄與關卡進度嗎？此動作無法撤銷。')) {
                localStorage.removeItem('TRIVIA_QUIZ_SAVE_V1');
                state.savedData = {
                    stages: {},
                    maxStageUnlocked: 1,
                    endlessHighScore: 0,
                    timeAttackBest: 0,
                    maxHistoricalStreak: 0,
                    totalAnswered: 0,
                    totalCorrect: 0
                };
                saveProgress();
                DOM.statsModal.classList.add('hidden');
                alert('所有紀錄已重置成功！');
            }
        });

        // Icebreaker Modal Events
        DOM.startIcebreakerBtn.addEventListener('click', () => {
            playSound('click');
            DOM.icebreakerModal.classList.remove('hidden');
        });

        DOM.icebreakerModalClose.addEventListener('click', () => {
            DOM.icebreakerModal.classList.add('hidden');
        });

        // Question count chip selection
        DOM.countChipOptions.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playSound('click');
                DOM.countChipOptions.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.icebreakerCount = parseInt(btn.dataset.count, 10);
            });
        });

        // Confirm Icebreaker launch
        DOM.confirmIcebreakerBtn.addEventListener('click', () => {
            playSound('click');
            const selectedType = document.querySelector('input[name="icebreaker-type"]:checked').value;
            state.icebreakerType = selectedType;
            DOM.icebreakerModal.classList.add('hidden');
            startIcebreakerQuiz();
        });

        // Team score adjustment buttons
        DOM.btnAddRed.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound('powerup');
            state.redTeamScore++;
            DOM.redTeamScore.textContent = state.redTeamScore;
        });

        DOM.btnAddBlue.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound('powerup');
            state.blueTeamScore++;
            DOM.blueTeamScore.textContent = state.blueTeamScore;
        });

        // Home Buttons
        DOM.startStageBtn.addEventListener('click', () => {
            playSound('click');
            renderStageGrid();
            showScreen(DOM.screenStages);
        });

        DOM.startEndlessBtn.addEventListener('click', () => {
            playSound('click');
            startEndlessQuiz();
        });

        DOM.startTimeBtn.addEventListener('click', () => {
            playSound('click');
            startTimeAttackQuiz();
        });

        DOM.refreshFactBtn.addEventListener('click', () => {
            playSound('click');
            renderDailyFact();
        });

        DOM.backToHomeBtn.addEventListener('click', () => {
            playSound('click');
            showScreen(DOM.screenHome);
        });

        // Quiz Buttons
        DOM.nextQBtn.addEventListener('click', () => {
            playSound('click');
            nextQuestion();
        });

        DOM.powerup5050.addEventListener('click', use5050);
        DOM.powerupHint.addEventListener('click', useHint);
        DOM.powerupTime.addEventListener('click', useTimeOrHeart);

        // Result Buttons
        DOM.resHomeBtn.addEventListener('click', () => {
            playSound('click');
            showScreen(DOM.screenHome);
        });

        DOM.resRetryBtn.addEventListener('click', () => {
            playSound('click');
            if (state.mode === 'icebreaker') startIcebreakerQuiz();
            else if (state.mode === 'stage') startStageQuiz(state.currentStage);
            else if (state.mode === 'endless') startEndlessQuiz();
            else if (state.mode === 'time') startTimeAttackQuiz();
        });

        DOM.resNextStageBtn.addEventListener('click', () => {
            playSound('click');
            if (state.currentStage < 100) {
                startStageQuiz(state.currentStage + 1);
            }
        });
    }

    // ── INITIALIZATION ──
    document.addEventListener('DOMContentLoaded', () => {
        loadSavedProgress();
        renderDailyFact();
        initEvents();
    });

})();
