'use strict';

const emailBookKey = 'softwareSystemDesignBookProgressV1';
const emailChapterId = 'sd-book-19';

function readEmailProgress() {
    try {
        return JSON.parse(localStorage.getItem(emailBookKey))?.chapters?.[emailChapterId] || {};
    } catch {
        return {};
    }
}

function saveEmailProgress(update) {
    try {
        const progress = JSON.parse(localStorage.getItem(emailBookKey)) || { version: 1, chapters: {} };
        progress.chapters ||= {};
        const current = progress.chapters[emailChapterId] || {};
        progress.chapters[emailChapterId] = { ...current, ...update, updatedAt: new Date().toISOString() };
        localStorage.setItem(emailBookKey, JSON.stringify(progress));
    } catch {
        // Playback and practice also work when storage is unavailable.
    }
}

const emailPlayer = (() => {
    const $ = id => document.getElementById(id);
    const audio = $('narration');
    const position = $('position');
    const canvas = $('connections');
    const context = canvas.getContext('2d');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-TW', { granularity: 'word' }) : null;
    const stored = readEmailProgress();
    const completed = new Set((Array.isArray(stored.completedLessons) ? stored.completedLessons : [])
        .filter(id => emailLessons.some(item => item.id === id)));

    let lessonIndex = 0;
    let lesson;
    let timing;
    let nodeElements = new Map();
    let edges = new Map();
    let cueButtons = [];
    let transcriptButtons = [];
    let cueIndex = -1;
    let wordIndex = -1;
    let words = [];
    let totalWordWeight = 0;
    let pendingSeek = null;
    let frame = 0;
    let lastSave = 0;
    let playRequest = 0;
    let loadController;
    let objectUrl = '';
    let sourceReady = false;
    let queuedPlayback = false;

    function setStatus(message = '') {
        const status = $('player-status');
        status.textContent = message;
        status.hidden = !message;
    }

    function timeLabel(seconds) {
        const whole = Math.floor(seconds);
        return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
    }

    function currentTime() {
        return pendingSeek ?? audio.currentTime;
    }

    function remember() {
        if (!lesson) return;
        saveEmailProgress({
            playback: { lesson: lesson.id, time: currentTime() },
            completedLessons: [...completed],
            completed: completed.size === emailLessons.length
        });
        lastSave = performance.now();
    }

    function buildNodes() {
        nodeElements = new Map();
        const nodes = lesson.nodes.map(([id, title, detail, glyph]) => {
            const node = document.createElement('div');
            const icon = document.createElement('span');
            const name = document.createElement('span');
            const description = document.createElement('span');
            node.className = 'node';
            icon.className = 'node-glyph';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = glyph;
            name.className = 'node-title';
            name.textContent = title;
            description.className = 'node-detail';
            description.textContent = detail;
            node.append(icon, name, description);
            nodeElements.set(id, node);
            return node;
        });
        $('nodes').replaceChildren(...nodes);
    }

    function measureEdges() {
        if (!context || !lesson) return;
        const area = canvas.getBoundingClientRect();
        const scale = devicePixelRatio || 1;
        canvas.width = Math.round(area.width * scale);
        canvas.height = Math.round(area.height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
        const bounds = new Map([...nodeElements].map(([id, node]) => [id, node.getBoundingClientRect()]));
        const columns = [...new Map([...bounds.values()].map(rect => [rect.left, rect])).values()]
            .sort((a, b) => a.left - b.left);
        edges = new Map(lesson.edges.map(edge => {
            const [from, to] = edge.split('>').map(id => bounds.get(id));
            const a = { x: from.left + from.width / 2 - area.left, y: from.top + from.height / 2 - area.top };
            const b = { x: to.left + to.width / 2 - area.left, y: to.top + to.height / 2 - area.top };
            const sameRow = Math.abs(b.y - a.y) < 10;
            // Long links use a gutter so the connector stays visible around intervening cards.
            if (sameRow && Math.abs(b.x - a.x) > from.width * 2) {
                a.y = from.top - area.top - 2;
                b.y = to.top - area.top - 3;
                return [edge, { a, b, p: { x: a.x, y: a.y - 32 }, q: { x: b.x, y: b.y - 32 } }];
            }
            const skipsRow = !sameRow && (from.bottom < to.top || to.bottom < from.top) &&
                [...bounds.values()].some(rect => rect.top > Math.min(from.top, to.top) + 8 &&
                    rect.bottom < Math.max(from.bottom, to.bottom) - 8);
            if (skipsRow && columns.length === 2) {
                const x = (columns[0].right + columns[1].left) / 2 - area.left;
                a.x = (from.left < columns[1].left ? from.right + 2 : from.left - 2) - area.left;
                b.x = (to.left < columns[1].left ? to.right + 3 : to.left - 3) - area.left;
                return [edge, { a, b, p: { x, y: a.y }, q: { x, y: b.y } }];
            }
            const direction = Math.sign(sameRow ? b.x - a.x : b.y - a.y);
            if (sameRow) {
                a.x += direction * (from.width / 2 + 2);
                b.x -= direction * (to.width / 2 + 3);
            } else {
                a.y += direction * (from.height / 2 + 2);
                b.y -= direction * (to.height / 2 + 3);
            }
            const bend = Math.abs(b.y - a.y) * .65;
            const p = sameRow ? { ...a } : { x: a.x, y: a.y + direction * bend };
            const q = sameRow ? { ...b } : { x: b.x, y: b.y - direction * bend };
            return [edge, { a, b, p, q }];
        }));
        paintEdges();
    }

    function pointAt({ a, b, p, q }, t) {
        const u = 1 - t;
        return {
            x: u ** 3 * a.x + 3 * u * u * t * p.x + 3 * u * t * t * q.x + t ** 3 * b.x,
            y: u ** 3 * a.y + 3 * u * u * t * p.y + 3 * u * t * t * q.y + t ** 3 * b.y
        };
    }

    function paintEdges(activeEdge, progress = 0) {
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const draw = (edge, active) => {
            const { a, b, p, q } = edge;
            const nearEnd = pointAt(edge, .90);
            const angle = Math.atan2(b.y - nearEnd.y, b.x - nearEnd.x);
            context.strokeStyle = active ? '#77efd2' : '#587381';
            context.lineWidth = active ? 2.1 : 1.1;
            context.setLineDash(active ? [] : [3, 4]);
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.bezierCurveTo(p.x, p.y, q.x, q.y, b.x, b.y);
            context.stroke();
            context.setLineDash([]);
            context.beginPath();
            context.moveTo(b.x - 6 * Math.cos(angle - .5), b.y - 6 * Math.sin(angle - .5));
            context.lineTo(b.x, b.y);
            context.lineTo(b.x - 6 * Math.cos(angle + .5), b.y - 6 * Math.sin(angle + .5));
            context.stroke();

            if (active && !reducedMotion.matches) {
                const packet = pointAt(edge, .05 + progress * .90);
                context.fillStyle = '#b6ffed';
                context.shadowBlur = 12;
                context.shadowColor = '#77efd2';
                context.beginPath();
                context.arc(packet.x, packet.y, 4, 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;
            }
        };
        edges.forEach((edge, id) => { if (id !== activeEdge) draw(edge, false); });
        if (edges.has(activeEdge)) draw(edges.get(activeEdge), true);
    }

    function updateFocus(index) {
        cueIndex = index;
        wordIndex = -1;
        const [node, line, edge] = lesson.cues[index];
        const linkedNode = edge?.split('>').find(id => id !== node);
        nodeElements.forEach((element, key) => {
            element.classList.toggle('active', key === node);
            element.classList.toggle('linked', key === linkedNode);
        });
        [cueButtons, transcriptButtons].forEach(buttons => {
            buttons.forEach((button, step) => button.setAttribute('aria-current', step === index ? 'step' : 'false'));
        });
        $('caption').setAttribute('aria-label', line);
        $('previous-cue').disabled = index === 0;
        $('next-cue').disabled = index === lesson.cues.length - 1;

        const raw = segmenter ? [...segmenter.segment(line)] : [...line.matchAll(/[^\x00-\x7F]|[A-Za-z0-9]+|./gu)]
            .map(match => ({ segment: match[0], index: match.index, isWordLike: /[\p{L}\p{N}]/u.test(match[0]) }));
        totalWordWeight = 0;
        words = [];
        for (const item of raw) {
            if (item.isWordLike) {
                words.push({ start: item.index, end: item.index + item.segment.length, weight: totalWordWeight });
                totalWordWeight += [...item.segment].length;
            } else if (/[^\s]/u.test(item.segment)) {
                totalWordWeight += .65;
            }
        }
    }

    function render(time) {
        const clock = Math.max(0, Math.min(time, timing.duration));
        const duration = audio.readyState && Number.isFinite(audio.duration) ? audio.duration : timing.duration;
        const index = Math.max(0, timing.cues.findLastIndex(start => start <= clock + .002));
        if (index !== cueIndex) updateFocus(index);

        const start = timing.cues[index];
        const end = timing.cues[index + 1] ?? timing.duration;
        const progress = Math.max(0, Math.min(1, (clock - start) / (end - start)));
        const [node, line, edge] = lesson.cues[index];
        const word = Math.max(0, words.findLastIndex(item => item.weight <= progress * totalWordWeight));
        if (word !== wordIndex) {
            wordIndex = word;
            const token = words[word];
            const spoken = document.createElement('span');
            const highlight = document.createElement('mark');
            spoken.className = 'spoken';
            spoken.textContent = line.slice(0, token.start);
            highlight.textContent = line.slice(token.start, token.end);
            $('caption').replaceChildren(spoken, highlight, line.slice(token.end));
        }
        nodeElements.get(node).style.setProperty('--spoken', (progress * 100).toFixed(1) + '%');
        paintEdges(edge, progress);
        position.max = duration;
        position.value = Math.min(time, duration);
        position.setAttribute('aria-valuetext', timeLabel(clock) + '／' + timeLabel(duration));
        $('time').textContent = timeLabel(audio.ended ? duration : clock) + ' / ' + timeLabel(duration);
    }

    function tick() {
        render(currentTime());
        if (performance.now() - lastSave > 3000) remember();
        frame = audio.paused || audio.ended ? 0 : requestAnimationFrame(tick);
    }

    function updateTransport() {
        $('play').innerHTML = queuedPlayback
            ? '取消載入'
            : audio.paused || audio.ended
                ? '<span aria-hidden="true">▶</span> 播放旁白'
                : '<span aria-hidden="true">❚❚</span> 暫停旁白';
        if (audio.paused || audio.ended) {
            cancelAnimationFrame(frame);
            frame = 0;
        } else if (!frame) {
            frame = requestAnimationFrame(tick);
        }
    }

    function seek(time) {
        const target = Math.max(0, Math.min(time, timing.duration));
        if (audio.readyState) {
            pendingSeek = null;
            audio.currentTime = target;
        } else {
            pendingSeek = target;
        }
        render(target);
        remember();
    }

    function play() {
        if (!sourceReady) {
            queuedPlayback = true;
            setStatus('正在載入旁白…');
            updateTransport();
            return;
        }
        queuedPlayback = false;
        setStatus();
        const request = ++playRequest;
        audio.play().catch(() => {
            if (request === playRequest) {
                setStatus('旁白暫時無法播放。可點選圖解片段，或再按播放重試。');
                updateTransport();
            }
        });
    }

    function loadTrack(autoplay) {
        const path = 'audio/' + lesson.id + '-v1.mp3';
        const setSource = source => {
            sourceReady = true;
            audio.src = source;
            audio.playbackRate = Number($('speed').value);
            if (queuedPlayback) play();
        };
        if (location.protocol === 'file:') {
            queuedPlayback = autoplay;
            setSource(path);
            return;
        }

        const controller = new AbortController();
        loadController = controller;
        if (autoplay) play();
        // A small local blob supports timestamp seeks even on static servers without byte ranges.
        fetch(path, { signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error('Audio request failed');
                return response.blob();
            })
            .then(blob => {
                if (controller.signal.aborted) return;
                objectUrl = URL.createObjectURL(blob);
                setSource(objectUrl);
            })
            .catch(() => { if (!controller.signal.aborted) setSource(path); });
    }

    function refreshProgress() {
        $('completion').textContent = completed.size + ' / ' + emailLessons.length + ' 完成';
        [...$('lessons').querySelectorAll('button')].forEach((button, index) => {
            button.setAttribute('aria-current', index === lessonIndex ? 'step' : 'false');
            const done = completed.has(emailLessons[index].id);
            button.querySelector('.lesson-done').textContent = done ? '✓' : '';
            button.setAttribute('aria-label', emailLessons[index].title + (done ? '，已完成' : ''));
        });
    }

    function selectLesson(index, { time = 0, autoplay = false } = {}) {
        if (!emailLessons[index]) return;
        ++playRequest;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        loadController?.abort();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = '';
        sourceReady = false;
        queuedPlayback = false;
        lessonIndex = index;
        lesson = emailLessons[index];
        timing = emailAudioTiming[lesson.id];
        pendingSeek = Math.min(Math.max(time, 0), timing.duration);
        cueIndex = -1;
        wordIndex = -1;
        $('lesson-count').textContent = '小節 ' + (index + 1) + ' / ' + emailLessons.length;
        $('lesson-title').textContent = lesson.title;
        $('lesson-summary').textContent = lesson.summary;
        $('takeaway').textContent = lesson.takeaway;
        $('previous-lesson').disabled = index === 0;
        const lastLesson = index === emailLessons.length - 1;
        $('next-lesson').hidden = lastLesson;
        $('next-simulation').hidden = !lastLesson;
        setStatus();
        buildNodes();
        measureEdges();
        cueButtons = lesson.cues.map(([, line], step) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-label', line);
            button.title = line;
            button.addEventListener('click', () => seek(timing.cues[step]));
            return button;
        });
        transcriptButtons = lesson.cues.map(([, line], step) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = line;
            button.addEventListener('click', () => seek(timing.cues[step]));
            return button;
        });
        $('cue-steps').replaceChildren(...cueButtons);
        $('transcript-lines').replaceChildren(...transcriptButtons.map(button => {
            const item = document.createElement('li');
            item.append(button);
            return item;
        }));

        refreshProgress();
        render(pendingSeek);
        remember();
        updateTransport();
        loadTrack(autoplay);
    }

    const lessonButtons = emailLessons.map(({ title }, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        const number = document.createElement('code');
        const label = document.createElement('span');
        const done = document.createElement('span');
        button.type = 'button';
        button.className = 'lesson-button';
        number.textContent = String(index + 1).padStart(2, '0');
        label.textContent = title;
        done.className = 'lesson-done';
        done.setAttribute('aria-hidden', 'true');
        button.append(number, label, done);
        button.addEventListener('click', () => {
            if (index !== lessonIndex) selectLesson(index, { autoplay: queuedPlayback || (!audio.paused && !audio.ended) });
        });
        item.append(button);
        return item;
    });
    $('lessons').replaceChildren(...lessonButtons);
    const totalSeconds = Object.values(emailAudioTiming).reduce((total, item) => total + item.duration, 0);
    $('overview').textContent = emailLessons.length + ' 小節 · 旁白約 ' + Math.round(totalSeconds / 60) + ' 分鐘';

    audio.addEventListener('loadedmetadata', () => {
        if (pendingSeek !== null) {
            const target = Math.min(pendingSeek, audio.duration);
            pendingSeek = null;
            if (Math.abs(audio.currentTime - target) > .002) audio.currentTime = target;
        }
        render(currentTime());
    });
    audio.addEventListener('play', updateTransport);
    audio.addEventListener('pause', () => {
        updateTransport();
        render(currentTime());
        remember();
    });
    audio.addEventListener('seeked', () => render(currentTime()));
    audio.addEventListener('timeupdate', () => render(currentTime()));
    audio.addEventListener('error', () => {
        if (sourceReady) setStatus('音檔載入失敗，仍可使用講稿與圖解片段。');
    });
    audio.addEventListener('ended', () => {
        completed.add(lesson.id);
        refreshProgress();
        remember();
        if (lessonIndex + 1 < emailLessons.length) selectLesson(lessonIndex + 1, { autoplay: true });
        else {
            updateTransport();
            setStatus('旁白已播畢。接下來可以做章末模擬與測驗。');
        }
    });
    position.addEventListener('input', () => seek(Number(position.value)));
    $('play').addEventListener('click', () => {
        if (queuedPlayback) {
            queuedPlayback = false;
            setStatus();
            updateTransport();
            return;
        }
        if (!audio.paused && !audio.ended) {
            ++playRequest;
            audio.pause();
            return;
        }
        if (audio.ended) seek(0);
        play();
    });
    $('previous-cue').addEventListener('click', () => seek(timing.cues[cueIndex - 1]));
    $('next-cue').addEventListener('click', () => seek(timing.cues[cueIndex + 1]));
    $('previous-lesson').addEventListener('click', () => selectLesson(lessonIndex - 1, { autoplay: queuedPlayback || !audio.paused }));
    $('next-lesson').addEventListener('click', () => selectLesson(lessonIndex + 1, { autoplay: queuedPlayback || !audio.paused }));
    $('speed').addEventListener('change', event => { audio.playbackRate = Number(event.target.value); });
    $('mute').addEventListener('click', event => {
        audio.muted = !audio.muted;
        event.currentTarget.setAttribute('aria-pressed', String(audio.muted));
        event.currentTarget.textContent = audio.muted ? '取消靜音' : '靜音';
    });
    window.addEventListener('keydown', event => {
        if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.target.closest('button, a, select, input, summary, textarea, [contenteditable]')) return;
        event.preventDefault();
        $('play').click();
    });
    window.addEventListener('pagehide', remember);
    new ResizeObserver(() => {
        measureEdges();
        render(currentTime());
    }).observe($('diagram'));

    const resume = emailLessons.findIndex(item => item.id === stored.playback?.lesson);
    const savedTime = Number(stored.playback?.time);
    const nearEnd = resume >= 0 && savedTime >= emailAudioTiming[emailLessons[resume].id].duration - .2;
    selectLesson(Math.max(0, resume), { time: nearEnd ? 0 : savedTime || 0 });

    return {
        review(id) {
            const index = emailLessons.findIndex(item => item.id === id);
            selectLesson(index);
            $('player').scrollIntoView({ block: 'start' });
            $('play').focus({ preventScroll: true });
        }
    };
})();
