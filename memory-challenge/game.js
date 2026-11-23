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
    const themeField = byId('theme');
    const styleField = byId('style');
    const playerCount = byId('player-count');
    const playerNames = byId('player-names');
    const soundToggle = byId('sound-toggle');
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
    let audio = null;
    let applause = null;
    let soundOn = true;

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

    function shuffle(items) {
        const shuffled = items.slice();
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function unlockSound() {
        if (!soundOn) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audio ||= new AudioContext();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
    }

    function tone(frequency, delay, duration = .12, volume = .12) {
        if (!soundOn || audio?.state !== 'running') return;
        const start = audio.currentTime + delay;
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(.001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + .019);
        envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
        oscillator.connect(envelope).connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
    }

    function chime(notes) {
        notes.forEach((frequency, index) => tone(frequency, index * .09, .16));
    }

    function cheer() {
        if (!soundOn || audio?.state !== 'running') return;
        chime([523, 659, 784, 1047]);
        const sampleRate = audio.sampleRate;
        const buffer = audio.createBuffer(1, sampleRate * 2.25, sampleRate);
        const samples = buffer.getChannelData(0);
        for (let clap = 0; clap < 125; clap += 1) {
            const time = Math.random() * 2.08;
            const first = Math.floor(time * sampleRate);
            const length = Math.floor(sampleRate * (.026 + Math.random() * .03));
            const volume = .1 * (1 - time / 2.25);
            for (let i = 0; i < length; i += 1) {
                samples[first + i] += (Math.random() * 2 - 1) * volume * (1 - i / length) ** 3;
            }
        }
        for (let voice = 0; voice < 9; voice += 1) {
            const first = Math.floor(sampleRate * (.08 + Math.random() * .55));
            const length = Math.floor(sampleRate * (.35 + Math.random() * .45));
            const pitch = 220 + Math.random() * 220;
            let angle = 0;
            for (let i = 0; i < length; i += 1) {
                const curve = Math.sin(Math.PI * i / length);
                angle += (pitch + 100 * curve) * 2 * Math.PI / sampleRate;
                const timbre = Math.sin(angle) + .4 * Math.sin(angle * 2) + .24 * Math.sin(angle * 3);
                samples[first + i] += .018 * curve ** 2 * timbre;
            }
        }
        const crowd = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        crowd.buffer = buffer;
        crowd.connect(filter).connect(audio.destination);
        crowd.start();
        applause = crowd;
        crowd.addEventListener('ended', () => {
            if (applause === crowd) applause = null;
        });
    }

    function stopApplause() {
        if (!applause) return;
        applause.stop();
        applause = null;
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
            pill.append(element('span', '', player.name), element('strong', '', `${player.score} 分`));
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

        stopApplause();
        unlockSound();
        const questionCount = questionsField.valueAsNumber;
        session = {
            players: playerDrafts.slice(0, playerCount.valueAsNumber).map((name, index) => ({
                name: name.trim() || `玩家 ${index + 1}`,
                score: 0
            })),
            rounds: shuffle(pool).slice(0, total).map((scene) => ({
                ...scene,
                questions: shuffle(scene.questions).slice(0, questionCount)
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
        loading.append(element('h2', '', '準備圖片…'));
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
        back.append(element('span', '', '✦'), element('div', '', '時間到！'));
        card.append(picture, back);
        frame.append(card);

        const timer = element('div', 'timer-row');
        timer.setAttribute('role', 'timer');
        const track = element('div', 'track');
        track.setAttribute('aria-hidden', 'true');
        const fill = element('div', 'timer-fill');
        const value = element('span', 'timer-value', '10 秒');
        track.append(fill);
        timer.append(track, value);
        observation.append(frame, timer);
        showCard(observation, null);

        let previous = 10;
        showTime = (remaining) => {
            const seconds = Math.ceil(remaining / 1000);
            fill.style.transform = `scaleX(${remaining / observationMs})`;
            if (seconds === previous) return;
            previous = seconds;
            value.textContent = `${seconds} 秒`;
            timer.classList.toggle('urgent', seconds <= 3);
            if (seconds <= 3 && seconds > 0) tone(645, 0, .1, .07);
        };
        showCovered = () => {
            picture.alt = '';
            picture.setAttribute('aria-hidden', 'true');
            card.classList.add('flipping');
            if (reducedMotion.matches) picture.hidden = true;
        };

        announce('觀察圖片，計時 10 秒');
        chime([540, 700]);
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
        chime([451, 337]);
        timeout = window.setTimeout(renderQuestion, reducedMotion.matches ? 0 : 545);
    }

    function currentQuestion() {
        return session.rounds[session.round].questions[session.question];
    }

    function questionLabel() {
        return `第 ${session.question + 1}／${session.rounds[session.round].questions.length} 題`;
    }

    function renderQuestion() {
        setPhase('question', questionLabel());
        const card = element('div', 'stage-card question-card enter');
        const heading = element('h2', '', currentQuestion()[0]);
        const reveal = button('公布答案', renderScoring);
        card.append(heading, actions(reveal));
        showCard(card, heading);
    }

    function nextLabel() {
        const lastQuestion = session.question === session.rounds[session.round].questions.length - 1;
        if (!lastQuestion) return '下一題';
        return session.round === session.rounds.length - 1 ? '公布排行榜' : '下一張圖片';
    }

    function renderScoring() {
        unlockSound();
        chime([590, 790]);
        setPhase('scoring', `${questionLabel()}・計分`);
        session.selections.clear();

        const [question, answer] = currentQuestion();
        const card = element('div', 'stage-card');
        const answerCard = element('div', 'answer-flip');
        const answerHeading = element('h2', '', answer);
        answerCard.append(element('p', '', '標準答案'), answerHeading);

        const choices = element('div', 'score-choices');
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-labelledby', 'score-prompt');
        const prompt = element('p', 'score-prompt', '選擇答對者，每人加 1 分');
        prompt.id = 'score-prompt';
        const skip = button('本題無人答對', commitScores);
        const next = button(`確認加分，${nextLabel()}`, commitScores);
        next.hidden = true;

        session.players.forEach((player, index) => {
            const choice = button('', () => {
                const selected = !session.selections.has(index);
                if (selected) session.selections.add(index);
                else session.selections.delete(index);
                choice.setAttribute('aria-pressed', String(selected));
                indicator.textContent = selected ? '✓ +1' : '+1';
                skip.hidden = session.selections.size > 0;
                next.hidden = !skip.hidden;
            }, 'score-choice');
            choice.setAttribute('aria-pressed', 'false');
            const indicator = element('span', '', '+1');
            indicator.setAttribute('aria-hidden', 'true');
            choice.append(element('span', '', player.name), indicator);
            choices.append(choice);
        });

        card.append(element('p', 'question-scoring', question), answerCard, prompt, choices, actions(skip, next));
        showCard(card, answerHeading);
    }

    function commitScores() {
        if (phase !== 'scoring') return;
        setPhase('awarding', `${questionLabel()}・計分完成`);
        stage.querySelectorAll('button').forEach((control) => { control.disabled = true; });

        const { selections, players, rounds, round, question } = session;
        selections.forEach((index) => { players[index].score += pointsPerAnswer; });
        const finish = () => {
            renderScores();
            if (question + 1 < rounds[round].questions.length) {
                session.question += 1;
                renderQuestion();
            } else if (round + 1 < rounds.length) {
                session.round += 1;
                beginRound();
            } else {
                renderRankings();
            }
        };

        if (selections.size > 0) {
            renderScores(selections);
            announce(`${Array.from(selections, (index) => players[index].name).join('、')}各加 1 分`);
            chime([660, 880]);
            timeout = window.setTimeout(finish, reducedMotion.matches ? 100 : 465);
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
        ranked.forEach((player) => {
            const top = player.rank === 1;
            const visible = !top || reveal;
            const row = element('li', top ? 'top-rank' : '');
            row.append(
                element('span', 'rank', `第 ${player.rank} 名`),
                element('strong', 'result-name', visible ? player.name : '待揭曉'),
                element('span', 'result-score', visible ? `${player.score} 分` : '—')
            );
            list.append(row);
        });
        return list;
    }

    function renderRankings() {
        setPhase('rankings', '成績結算');
        const total = session.rounds.reduce((sum, round) => sum + round.questions.length, 0);
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
        if (reducedMotion.matches) return confetti;
        const colors = ['#e5f775', '#fc986f', '#91eecb', '#fff1a4', '#eeb1f7'];
        for (let i = 0; i < 70; i += 1) {
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
        const card = element('div', 'stage-card results-card champion enter');
        const home = element('a', 'outline', '回遊戲大集合');
        home.href = '../index.html';
        card.append(
            makeConfetti(),
            element('p', 'winner-callout', `✦ ${title} ✦`),
            element('h2', '', names),
            element('p', 'champion-lead', `${winners[0].score} 分`),
            resultList(ranked, true),
            actions(button('再玩一局', returnToSetup), home)
        );
        showCard(card);
        announce(`${title}是${names}，${winners[0].score} 分`);
        cheer();
    }

    function returnToSetup() {
        stopTimers();
        stopApplause();
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
        if (!soundOn) stopApplause();
        if (audio && !soundOn) audio.suspend().catch(() => {});
        if (soundOn) unlockSound();
    });

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
    connectNumberMenu(playerCount, playerCountMenu, renderPlayerFields);
    themeField.addEventListener('change', updatePool);
    styleField.addEventListener('change', updatePool);
    updatePool();
})();
