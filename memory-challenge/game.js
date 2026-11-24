(() => {
    'use strict';

    const observationMs = 10000;
    const pointsPerAnswer = 1;
    const byId = (id) => document.getElementById(id);
    const setup = byId('setup');
    const form = byId('setup-form');
    const game = byId('game');
    const stage = byId('stage');
    const scores = byId('scores');
    const progress = byId('round-progress');
    const phaseLabel = byId('phase-label');
    const status = byId('live-status');
    const roundsField = byId('rounds');
    const roundsMenu = byId('rounds-menu');
    const questionsField = byId('questions');
    const multipleChoice = byId('multiple-choice');
    const scoringHelp = byId('scoring-help');
    const themeField = byId('theme');
    const styleField = byId('style');
    const playerCount = byId('player-count');
    const playerNames = byId('player-names');
    const soundToggle = byId('sound-toggle');
    const effectsToggle = byId('effects-toggle');
    const sound = window.memoryChallengeSound;
    const fullscreen = byId('fullscreen');
    const endGame = byId('end-game');
    const endDialog = byId('end-dialog');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bank = window.memoryChallengeBank;
    const playerDrafts = Array(Number(playerCount.max)).fill('');

    let session = null;
    let phase = 'setup';
    let animation = 0;
    let timeout = 0;
    let deadline = 0;
    let showTime = null;
    let showCovered = null;
    let soundOn = true;
    let effectsOverride = null;

    function element(tag, className, content) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined) node.textContent = content;
        return node;
    }

    function button(text, action, style = 'primary') {
        const node = element('button', style, text);
        node.type = 'button';
        node.addEventListener('click', action);
        return node;
    }

    function actions(...buttons) {
        const row = element('div', 'stage-actions');
        row.append(...buttons);
        return row;
    }

    function filteredBank() {
        return bank.scenes.filter((scene) =>
            (!themeField.value || scene.theme === themeField.value)
            && (!styleField.value || scene.style === styleField.value)
        );
    }

    function syncNumberMenu(field, menu) {
        menu.value = field.validity.valid ? String(field.valueAsNumber) : '';
    }

    function connectNumberMenu(field, menu, onUpdate) {
        const update = () => {
            syncNumberMenu(field, menu);
            onUpdate?.();
        };
        field.addEventListener('input', update);
        menu.addEventListener('change', () => {
            field.value = menu.value;
            update();
        });
        update();
    }

    function numberOptions(max, unit) {
        return Array.from({ length: max }, (_, index) => {
            const count = index + 1;
            return new Option(`${count} ${unit}`, String(count));
        });
    }

    function updatePool() {
        const available = filteredBank().length;
        roundsField.max = available;
        if (available && roundsField.valueAsNumber > available) roundsField.value = available;
        roundsMenu.replaceChildren(roundsMenu.options[0], ...numberOptions(available, '張'));
        roundsMenu.disabled = available === 0;
        syncNumberMenu(roundsField, roundsMenu);
        byId('pool-count').textContent = `符合條件的圖片有 ${available} 張`;
        byId('start').disabled = available === 0;
    }

    function renderPlayerFields() {
        const count = playerCount.valueAsNumber;
        if (!playerCount.validity.valid || count === playerNames.childElementCount) return;
        const fields = playerDrafts.slice(0, count).map((name, index) => {
            const label = element('label', 'player-field');
            const number = element('span', 'player-no', index + 1);
            number.setAttribute('aria-hidden', 'true');
            const input = element('input');
            input.type = 'text';
            input.maxLength = 20;
            input.placeholder = `玩家 ${index + 1}`;
            input.setAttribute('aria-label', `第 ${index + 1} 位玩家或隊伍名稱`);
            input.value = name;
            input.addEventListener('input', () => {
                playerDrafts[index] = input.value;
            });
            label.append(number, input);
            return label;
        });
        playerNames.replaceChildren(...fields);
    }

    function updateScoringHelp() {
        scoringHelp.textContent = multipleChoice.checked
            ? (playerCount.valueAsNumber === 1 ? '立即判定，自動計分。' : '立即判定，主持人計分。')
            : '口頭作答，主持人計分。';
    }

    function shuffle(items) {
        const shuffled = items.slice();
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function unlockSound() {
        if (soundOn) sound?.unlock();
    }

    function playSound(effect) {
        if (soundOn) sound?.play(effect);
    }

    function fullEffects() {
        return effectsOverride ?? !reducedMotion.matches;
    }

    function updateEffects() {
        const full = fullEffects();
        document.body.dataset.effects = full ? 'full' : 'reduced';
        effectsToggle.textContent = full ? '特效完整' : '特效精簡';
        effectsToggle.setAttribute('aria-pressed', String(full));
    }

    function announce(message) {
        status.textContent = message;
    }

    function setPhase(next, text = '') {
        phase = next;
        document.body.dataset.phase = next;
        phaseLabel.textContent = text;
        const playing = next !== 'setup';
        setup.hidden = playing;
        game.hidden = !playing;
        endGame.hidden = !playing || next === 'rankings' || next === 'champion';
        scores.hidden = !playing || next === 'rankings' || next === 'champion';
    }

    function showCard(card, focus = card.querySelector('h2')) {
        stage.replaceChildren(card);
        if (stage.getBoundingClientRect().top < 0) window.scrollTo(0, 0);
        if (focus) {
            focus.tabIndex = -1;
            focus.focus({ preventScroll: true });
        }
    }

    function renderScores(awarded = new Set()) {
        const pills = session.players.map((player, index) => {
            const added = awarded.has(index);
            const pill = element('div', added ? 'score-pill awarded' : 'score-pill');
            const name = element('span', '', player.name);
            name.title = player.name;
            pill.append(name, element('strong', '', `${player.score} 分`));
            if (added) pill.append(element('em', '', '+1'));
            return pill;
        });
        scores.replaceChildren(...pills);
    }

    function stopTimers() {
        cancelAnimationFrame(animation);
        clearTimeout(timeout);
        animation = 0;
        timeout = 0;
        deadline = 0;
        showTime = null;
        showCovered = null;
    }

    function startSession(event) {
        event.preventDefault();
        if (!roundsField.validity.valid || !questionsField.validity.valid || !playerCount.validity.valid) return;
        const pool = filteredBank();
        const total = roundsField.valueAsNumber;
        if (total > pool.length) return;

        sound?.stop();
        unlockSound();
        const questionCount = questionsField.valueAsNumber;
        session = {
            multipleChoice: multipleChoice.checked,
            players: playerDrafts.slice(0, playerCount.valueAsNumber).map((name, index) => ({
                name: name.trim() || `玩家 ${index + 1}`,
                score: 0
            })),
            rounds: shuffle(pool).slice(0, total).map((scene) => ({
                ...scene,
                questions: shuffle(scene.questions),
                questionLimit: questionCount
            })),
            round: 0,
            question: 0,
            selections: new Set()
        };
        renderScores();
        window.scrollTo(0, 0);
        beginRound();
    }

    async function beginRound() {
        stopTimers();
        const current = session;
        const round = current.rounds[current.round];
        current.question = 0;
        const theme = bank.themes[round.theme];
        const style = round.style === 'photo' ? '寫實真人風' : '卡通風';
        progress.textContent = `第 ${current.round + 1}／${current.rounds.length} 張`;
        setPhase('loading', `${theme}・${style}`);

        const loading = element('div', 'stage-card loading');
        const loader = element('div', 'loading-ring');
        loader.setAttribute('aria-hidden', 'true');
        loading.append(loader, element('h2', '', '準備圖片…'));
        showCard(loading, null);

        const picture = new Image();
        picture.alt = '本回合的觀察圖片';
        picture.className = 'scene-picture';
        picture.draggable = false;
        picture.src = round.image;
        try {
            await picture.decode();
        } catch {
            if (session !== current) return;
            const errorCard = element('div', 'stage-card loading enter');
            errorCard.append(
                element('h2', '', '圖片載入失敗'),
                element('p', '', '可以重新載入這張圖片。'),
                actions(button('重試', beginRound))
            );
            showCard(errorCard);
            return;
        }

        if (session !== current) return;
        animation = requestAnimationFrame(() => {
            if (session !== current) return;
            observe(picture, theme, style);
            const upcoming = current.rounds[current.round + 1];
            if (upcoming) new Image().src = upcoming.image;
        });
    }

    function observe(picture, theme, style) {
        setPhase('observe', `觀察圖片・${theme}・${style}`);

        const observation = element('div', 'observation');
        const frame = element('div', 'scene-frame');
        const card = element('div', 'scene-card');
        const back = element('div', 'scene-back');
        back.setAttribute('aria-hidden', 'true');
        back.append(element('div', 'seal-icon'), element('div', '', '圖片已封存'));
        card.append(picture, back);
        const scan = element('div', 'scene-scan');
        scan.setAttribute('aria-hidden', 'true');
        frame.append(card, scan);

        const timer = element('div', 'timer-row');
        timer.setAttribute('role', 'timer');
        const track = element('div', 'track');
        track.setAttribute('aria-hidden', 'true');
        const fill = element('div', 'timer-fill');
        const value = element('span', 'timer-value', '10 秒');
        track.append(fill);
        timer.append(element('span', 'timer-label', '觀察時間'), track, value);
        const space = element('div', 'scene-space');
        space.append(frame);
        observation.append(space, timer);
        showCard(observation, null);

        let previous = 10;
        showTime = (remaining) => {
            const seconds = Math.ceil(remaining / 1000);
            fill.style.transform = `scaleX(${remaining / observationMs})`;
            if (seconds === previous) return;
            previous = seconds;
            value.textContent = `${seconds} 秒`;
            const urgent = seconds > 0 && seconds <= 3;
            timer.classList.toggle('urgent', urgent);
            frame.classList.toggle('urgent', urgent);
            if (urgent) {
                playSound('tick');
                if (fullEffects()) {
                    value.animate?.([
                        { transform: 'scale(1.27)', opacity: .73 },
                        { transform: 'scale(1)', opacity: 1 }
                    ], { duration: 460, easing: 'cubic-bezier(.18,.78,.28,1)' });
                }
            }
        };
        showCovered = () => {
            picture.alt = '';
            picture.setAttribute('aria-hidden', 'true');
            card.classList.add('flipping');
            frame.classList.add('sealed');
        };

        announce('觀察圖片，計時 10 秒');
        playSound('observe');
        deadline = performance.now() + observationMs;
        timeout = window.setTimeout(advanceTimer, observationMs);
        advanceTimer();
    }

    function advanceTimer() {
        if (phase !== 'observe') return;
        cancelAnimationFrame(animation);
        const remaining = Math.max(0, deadline - performance.now());
        showTime(remaining);
        if (remaining > 0) {
            animation = requestAnimationFrame(advanceTimer);
            return;
        }

        clearTimeout(timeout);
        setPhase('cover', '時間到');
        showCovered();
        announce('時間到，圖片已蓋上');
        playSound('cover');
        timeout = window.setTimeout(renderQuestion, fullEffects() ? 920 : 100);
    }

    function currentRound() {
        return session.rounds[session.round];
    }

    function currentQuestion() {
        return currentRound().questions[session.question];
    }

    function questionPrompt([question, , choice]) {
        return session.multipleChoice && choice.prompt ? choice.prompt : question;
    }

    function questionLabel() {
        return `第 ${session.question + 1}／${currentRound().questionLimit} 題`;
    }

    function renderQuestion(message = '') {
        setPhase('question', questionLabel());
        const card = element('div', message ? 'stage-card question-card question-shift' : 'stage-card question-card enter');
        const question = currentQuestion();
        const heading = element('h2', '', questionPrompt(question));
        const skip = button('跳過這一題', skipQuestion, 'outline skip-action');
        const replace = button('換一題', replaceQuestion, 'outline');
        replace.disabled = session.question + 1 >= currentRound().questions.length;
        card.append(heading);

        if (session.multipleChoice) {
            card.classList.add('multiple-card');
            const choices = element('div', 'quiz-options');
            choices.setAttribute('role', 'group');
            choices.setAttribute('aria-label', '選擇答案');
            shuffle(question[2].options).forEach((option, index) => {
                const control = button('', () => renderScoring(option), 'quiz-option');
                const letter = element('span', 'quiz-letter', 'ABCD'[index]);
                letter.setAttribute('aria-hidden', 'true');
                control.append(letter, element('span', 'quiz-text', option));
                choices.append(control);
            });
            card.append(choices, actions(skip, replace));
        } else {
            const reveal = button('公布答案', () => renderScoring());
            card.append(actions(skip, replace, reveal));
        }

        const hint = message || (replace.disabled ? '這張圖已沒有其他題目可換。' : '');
        if (hint) card.append(element('p', 'question-hint', hint));
        showCard(card, heading);
    }

    function advanceQuestion(message = '') {
        if (session.question + 1 < currentRound().questionLimit) {
            session.question += 1;
            renderQuestion(message);
        } else if (session.round + 1 < session.rounds.length) {
            session.round += 1;
            beginRound();
        } else {
            renderRankings();
        }
    }

    function skipQuestion() {
        if (phase !== 'question' && phase !== 'scoring') return;
        session.selections.clear();
        playSound('move');
        announce('已跳過本題');
        advanceQuestion('已跳過上一題。');
    }

    function replaceQuestion() {
        if (phase !== 'question') return;
        const round = currentRound();
        if (session.question + 1 >= round.questions.length) return;

        const previousLimit = round.questionLimit;
        round.questions.splice(session.question, 1);
        round.questionLimit = Math.min(previousLimit, round.questions.length);
        const message = round.questionLimit < previousLimit
            ? `已換題，這張圖改問 ${round.questionLimit} 題。`
            : '已換成同一張圖的新題目。';
        playSound('move');
        announce(message);
        renderQuestion(message);
    }

    function nextLabel() {
        const lastQuestion = session.question === currentRound().questionLimit - 1;
        if (!lastQuestion) return '下一題';
        return session.round === session.rounds.length - 1 ? '公布排行榜' : '下一張圖片';
    }

    function renderScoring(selected = null) {
        if (phase !== 'question') return;
        unlockSound();
        playSound('reveal');
        setPhase('scoring', `${questionLabel()}・計分`);
        session.selections.clear();

        const question = currentQuestion();
        const answeredChoice = selected !== null;
        const answer = answeredChoice ? question[2].options[0] : question[1];
        const correct = answeredChoice && selected === answer;
        const autoScore = answeredChoice && session.players.length === 1;
        if (autoScore && correct) session.selections.add(0);

        const card = element('div', 'stage-card scoring-card');
        const answerCard = element('div', 'answer-flip');
        const answerHeading = element('h2', '', answer);
        answerCard.append(element('p', '', '標準答案'), answerHeading);
        card.append(element('p', 'question-scoring', questionPrompt(question)));

        if (answeredChoice) {
            const result = element(
                'p',
                correct ? 'choice-verdict correct' : 'choice-verdict incorrect',
                correct ? '✓ 答對了' : '✕ 答錯了'
            );
            if (!correct) result.append(element('span', 'selected-option', `已選 ${selected}`));
            card.append(result);
            announce(correct ? '答對了' : `答錯了，正確答案是${answer}`);
        }
        card.append(answerCard);

        const skip = button('跳過這一題', skipQuestion, 'outline skip-action');
        const next = button(nextLabel(), commitScores);
        if (!autoScore) {
            const prompt = element('p', 'score-prompt', '選擇答對者，每人加 1 分');
            prompt.id = 'score-prompt';
            card.append(prompt, scoringChoices(next));
        }
        card.append(actions(skip, next));
        showCard(card, answerHeading);
    }

    function scoringChoices(next) {
        const choices = element('div', 'score-choices');
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-labelledby', 'score-prompt');

        session.players.forEach((player, index) => {
            const scoreText = `${player.score} 分`;
            const choice = button('', () => {
                const selected = !session.selections.has(index);
                if (selected) session.selections.add(index);
                else session.selections.delete(index);
                choice.setAttribute('aria-pressed', String(selected));
                indicator.textContent = selected ? `${scoreText} +1` : scoreText;
                next.textContent = session.selections.size ? `確認加分，${nextLabel()}` : nextLabel();
            }, 'score-choice');
            choice.setAttribute('aria-pressed', 'false');
            const indicator = element('span', '', scoreText);
            indicator.setAttribute('aria-hidden', 'true');
            choice.append(element('span', '', player.name), indicator);
            choices.append(choice);
        });

        return choices;
    }

    function commitScores() {
        if (phase !== 'scoring') return;
        setPhase('awarding', `${questionLabel()}・計分完成`);
        stage.querySelectorAll('button').forEach((control) => { control.disabled = true; });

        const { selections, players } = session;
        selections.forEach((index) => { players[index].score += pointsPerAnswer; });
        const finish = () => {
            renderScores();
            advanceQuestion();
        };

        if (selections.size > 0) {
            renderScores(selections);
            announce(`${Array.from(selections, (index) => players[index].name).join('、')}各加 1 分`);
            playSound('score');
            timeout = window.setTimeout(finish, fullEffects() ? 680 : 100);
        } else {
            finish();
        }
    }

    function rankPlayers() {
        let previousScore;
        let rank = 0;
        return session.players.slice().sort((a, b) => b.score - a.score).map((player, index) => {
            if (player.score !== previousScore) rank = index + 1;
            previousScore = player.score;
            return { ...player, rank };
        });
    }

    function resultList(ranked, reveal) {
        const list = element('ol', 'result-list');
        ranked.forEach((player, index) => {
            const top = player.rank === 1;
            const visible = !top || reveal;
            const row = element('li', top ? 'top-rank' : '');
            row.style.setProperty('--rank-delay', `${index * 48}ms`);
            const name = element('strong', 'result-name', visible ? player.name : '待揭曉');
            if (visible) name.title = player.name;
            row.append(
                element('span', 'rank', `第 ${player.rank} 名`),
                name,
                element('span', 'result-score', visible ? `${player.score} 分` : '—')
            );
            list.append(row);
        });
        return list;
    }

    function renderRankings() {
        setPhase('rankings', '成績結算');
        const total = session.rounds.reduce((sum, round) => sum + round.questionLimit, 0);
        progress.textContent = `完成 ${session.rounds.length} 張圖片・${total} 題`;
        const card = element('div', 'stage-card results-card enter');
        card.append(
            element('h2', '', '排行榜'),
            resultList(rankPlayers(), false),
            actions(button('揭曉冠軍', renderChampion))
        );
        showCard(card);
    }

    function makeConfetti() {
        const confetti = element('div', 'confetti');
        confetti.setAttribute('aria-hidden', 'true');
        if (!fullEffects()) return confetti;
        const colors = ['#78fbf4', '#5fa5ff', '#94ffbb', '#ffe296', '#c6a4ff'];
        for (let i = 0; i < 90; i += 1) {
            const piece = element('i');
            piece.style.setProperty('--color', colors[i % colors.length]);
            piece.style.setProperty('--left', `${Math.random() * 100}%`);
            piece.style.setProperty('--width', `${5 + Math.random() * 7}px`);
            piece.style.setProperty('--height', `${7 + Math.random() * 11}px`);
            piece.style.setProperty('--duration', `${1.9 + Math.random() * 2.1}s`);
            piece.style.setProperty('--delay', `${Math.random() * .7}s`);
            piece.style.setProperty('--fall', `${350 + Math.random() * 420}px`);
            piece.style.setProperty('--drift', `${Math.random() * 210 - 105}px`);
            piece.style.setProperty('--spin', `${Math.random() * 1100 - 550}deg`);
            confetti.append(piece);
        }
        return confetti;
    }

    function renderChampion() {
        unlockSound();
        setPhase('champion', '挑戰結束');
        const ranked = rankPlayers();
        const winners = ranked.filter((player) => player.rank === 1);
        const title = winners.length > 1 ? '並列冠軍' : '本局冠軍';
        const names = winners.map((player) => player.name).join('、');
        const headline = names.length > 35 ? `${winners.length} 位並列第一` : names;
        const card = element('div', 'stage-card results-card champion enter');
        const home = element('a', 'outline', '回遊戲大集合');
        home.href = '../index.html';
        const trophy = element('div', 'champion-trophy', '🏆');
        trophy.setAttribute('aria-hidden', 'true');
        card.append(
            makeConfetti(),
            trophy,
            element('p', 'winner-callout', title),
            element('h2', '', headline),
            element('p', 'champion-lead', `${winners[0].score} 分`),
            resultList(ranked, true),
            actions(button('再玩一局', returnToSetup), home)
        );
        showCard(card);
        announce(`${title}是${names}，${winners[0].score} 分`);
        playSound('champion');
    }

    function returnToSetup() {
        stopTimers();
        sound?.stop();
        session = null;
        stage.replaceChildren();
        scores.replaceChildren();
        setPhase('setup');
        window.scrollTo(0, 0);
        byId('game-title').tabIndex = -1;
        byId('game-title').focus({ preventScroll: true });
    }

    soundToggle.addEventListener('click', () => {
        soundOn = !soundOn;
        soundToggle.textContent = soundOn ? '音效開啟' : '音效關閉';
        soundToggle.setAttribute('aria-pressed', String(soundOn));
        if (!soundOn) sound?.stop();
        if (soundOn) {
            unlockSound();
            playSound('move');
        }
    });

    effectsToggle.addEventListener('click', () => {
        effectsOverride = !fullEffects();
        updateEffects();
    });
    reducedMotion.addEventListener('change', updateEffects);
    updateEffects();

    if (!document.fullscreenEnabled) fullscreen.hidden = true;
    fullscreen.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch {
            announce('目前無法切換全螢幕。');
        }
    });
    document.addEventListener('fullscreenchange', () => {
        fullscreen.textContent = document.fullscreenElement ? '離開全螢幕' : '全螢幕';
    });

    endGame.addEventListener('click', () => {
        endDialog.returnValue = '';
        endDialog.showModal();
    });
    endDialog.addEventListener('close', () => {
        if (endDialog.returnValue === 'end') returnToSetup();
    });
    document.addEventListener('visibilitychange', advanceTimer);

    if (!bank?.scenes.length) {
        byId('start').disabled = true;
        const error = byId('setup-error');
        error.textContent = '題庫載入失敗，請重新整理頁面。';
        error.hidden = false;
        return;
    }

    Object.entries(bank.themes).forEach(([id, label]) => themeField.add(new Option(label, id)));
    const playerCountMenu = byId('player-count-menu');
    playerCountMenu.append(...numberOptions(playerDrafts.length, '人'));

    form.addEventListener('submit', startSession);
    connectNumberMenu(roundsField, roundsMenu);
    connectNumberMenu(questionsField, byId('questions-menu'));
    connectNumberMenu(playerCount, playerCountMenu, () => {
        renderPlayerFields();
        updateScoringHelp();
    });
    multipleChoice.addEventListener('change', updateScoringHelp);
    themeField.addEventListener('change', updatePool);
    styleField.addEventListener('change', updatePool);
    updatePool();
})();
