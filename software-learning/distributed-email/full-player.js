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
        const book = JSON.parse(localStorage.getItem(emailBookKey)) || { version: 1, chapters: {} };
        book.chapters ||= {};
        book.chapters[emailChapterId] = { ...book.chapters[emailChapterId], ...update, updatedAt: new Date().toISOString() };
        localStorage.setItem(emailBookKey, JSON.stringify(book));
    } catch {}
}

(() => {
    const $ = id => document.getElementById(id);
    const audio = $('narrator');
    const recordings = {
        hsiaochen: '🎙 預錄神經語音（曉臻）',
        meijia: '預錄女聲｜美佳（台灣）',
        reed: '預錄男聲｜Reed（台灣）'
    };
    const engine = window.speechSynthesis;
    const speech = createEmailSpeech(engine);
    const discoverVoices = () => typeof SpeechSynthesisUtterance === 'function' ? listEmailSpeechVoices(engine) : new Map();
    let browserVoices = discoverVoices();
    const exercises = {
        capacity: '容量與保留期', routing: '跨網域投遞', queue: '寄件佇列',
        search: '搜尋索引追趕', failover: '跨區故障切換', quiz: '期末考',
        sandbox: '系統模擬沙盒', world: '值班模擬'
    };
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-TW', { granularity: 'word' }) : null;
    const flat = [];
    const scenes = [];
    const tracks = new Map();
    const progressState = readEmailProgress();
    const saved = progressState.fullPlayback || {};
    const completedChapters = new Set((progressState.fullCompletedChapters || [])
        .filter(id => emailChapters.some(chapter => chapter.id === id)));
    const defaultVoice = 'hsiaochen';
    const hasVoice = key => Object.hasOwn(recordings, key) || browserVoices.has(key);
    let voice = hasVoice(saved.voice) ? saved.voice : defaultVoice;
    let pendingVoice = typeof saved.voice === 'string' && saved.voice.startsWith('browser:') &&
        !hasVoice(saved.voice) ? saved.voice : null;
    let index = 0;
    let fraction = 0;
    let lastSaved = 0;
    let previousScene;
    let currentPath;
    let wordClips = [];
    let oldWord = -1;
    let oldClause = -1;
    let timeline = [];
    let activeTrack = '';
    let loadAbort;
    let pendingSeek = null;
    let wantsPlay = false;
    let labFinished = false;
    let animation = 0;

    emailChapters.forEach((chapter, chapterIndex) => {
        chapter.start = flat.length;
        let offset = 0;
        chapter.scenes.forEach(item => {
            const entry = { ...item, chapter, start: flat.length, number: scenes.length };
            scenes.push(entry);
            item.steps.forEach(([focus, say], withinScene) => {
                flat.push({ chapter, chapterIndex, entry, focus: focus.split('|'), say, offset: offset++,
                    lab: withinScene === item.steps.length - 1 ? item.exercise : null });
            });
        });
        chapter.end = flat.length;
    });

    const timingFor = (chapter, selectedVoice = voice) => {
        const times = emailFullTiming[chapter.id];
        return times[selectedVoice] || times[defaultVoice];
    };
    const browserVoice = () => audio.muted ? null : browserVoices.get(voice)?.voice;
    const current = () => flat[index];
    function stepBounds(step) {
        const t = timingFor(step.chapter);
        return [t.starts[step.offset], t.starts[step.offset + 1] ?? t.duration];
    }
    function positionOf(step, f) {
        const [start, end] = stepBounds(step);
        return start + (end - start) * f;
    }
    function format(s) {
        const seconds = Math.floor(s);
        return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    function save() {
        if (!$('intro').hidden) return;
        lastSaved = performance.now();
        saveEmailProgress({
            fullPlayback: { index, fraction, voice, labFinished },
            fullCompletedChapters: [...completedChapters],
            completed: completedChapters.size === emailChapters.length
        });
    }

    function markTime() {
        const step = current();
        const total = timeline.at(-1)?.end ?? 0;
        const adjusted = (timeline[step.chapterIndex]?.start ?? 0) + positionOf(step, fraction);
        $('time').textContent = format(adjusted) + ' / ' + format(total);
        timeline.forEach(({ element, start, end }) => {
            element.firstElementChild.style.width = (100 * Math.min(1, Math.max(0, (adjusted - start) / (end - start)))) + '%';
        });
    }

    function edgePlacement(left, right, nodes) {
        const from = nodes.get(left);
        const to = nodes.get(right);
        const x = from.x < to.x;
        if (from.y === to.y) {
            if (Math.abs(from.x - to.x) > 1.6 * from.w) {
                return [left + '@t', right + '@t', { elbow: 'vhv', mid: from.y - 24 }];
            }
            return [left + (x ? '@r' : '@l'), right + (x ? '@l' : '@r'), {}];
        }
        const down = from.y < to.y;
        return [left + (down ? '@b' : '@t'), right + (down ? '@t' : '@b'), { elbow: 'vhv' }];
    }
    function nodeTheme(icon) {
        if (['user', 'users', 'phone'].includes(icon)) return 'user';
        if (['db', 'folder', 'card'].includes(icon)) return 'db';
        if (['warn', 'clock'].includes(icon)) return 'warn';
        if (['queue', 'coord'].includes(icon)) return 'vi';
        return 'svc';
    }
    function renderDiagram(entry) {
        const visual = emailVisuals[entry.id];
        S.clear(false);
        S.header(esc(entry.chapter.no + '　' + entry.chapter.title), esc(entry.title));
        S.text('source_pages', 42, 79, (/^\d/.test(entry.pages) ? '教材頁碼 ' : '實戰範圍｜') + esc(entry.pages), { size: 15, color: COL.gy });
        const width = entry.nodes.length < 5 ? 252 : 250;
        const columns = entry.nodes.length <= 6 ? 3 : 4;
        const compact = Boolean(visual);
        const rows = Math.ceil(entry.nodes.length / columns);
        const nodeBoxes = new Map();
        for (let i = 0; i < entry.nodes.length; i++) {
            const [id, title, detail, icon] = entry.nodes[i];
            const row = Math.floor(i / columns);
            const count = Math.min(columns, entry.nodes.length - row * columns);
            const gap = columns === 4 ? 46 : 98;
            const left = (1280 - (count * width + (count - 1) * gap)) / 2;
            const x = left + (i % columns) * (width + gap);
            const y = (compact ? 120 : 153) + row * (compact ? 124 : 177);
            nodeBoxes.set(id, { x, y, w: width });
            const box = S.box(id, x, y, width, compact ? 74 : 106, {
                t: esc(title), s: esc(detail), icon, row: true, k: nodeTheme(icon)
            });
            box.classList.add('diagram-node');
        }
        const visualTop = rows === 1 ? 245 : 351;
        if (visual?.rows) {
            S.table('lesson_table', 180, visualTop, {
                title: visual.title, cols: visual.columns, w: 920, rows: visual.rows.map(row => row.map(esc)), size: 15
            });
        } else if (visual?.code) {
            S.code('lesson_code', 164, visualTop, 952, visual.code.join('\n'), { title: visual.title, size: 16 });
        }

        entry.renderedLinks = new Map();
        entry.links.forEach((edge, position) => {
            const [left, right] = edge.split('>');
            const [a, b, shape] = edgePlacement(left, right, nodeBoxes);
            const path = S.arrow('email_edge_' + position, a, b, { ...shape, color: 'gy', dash: true, flow: false });
            path.classList.add('email-edge');
            entry.renderedLinks.set(edge, path);
        });
        const focusY = visual?.code?.length > 6 ? 575 : 543;
        S.el('focus', 72, focusY, 1136, null, '<div class="focus-heading"></div><div class="caption-clause"></div>', 'email-focus');
        S.el('packet', 0, 0, 14, 14, '', 'pkt email-packet').hidden = true;
        if (entry.exercise) {
            const launch = S.el('ui_exercise', 72, 651, 1136, 50,
                '<button class="email-workshop-button">開啟操作台｜' + esc(exercises[entry.exercise]) +
                '</button><span class="email-workshop-note">🧪 旁白播完會暫停，操作後再繼續</span>');
            launch.querySelector('button').addEventListener('click', () => openWorkshop(entry.exercise));
        }
    }
    function buildClips() {
        const text = current().say;
        const clauses = [...text.matchAll(/[^。！？；，、]+[。！？；，、]*/gu)];
        let weight = 0;
        wordClips = [];
        for (const [clause, match] of clauses.entries()) {
            const segments = segmenter ? [...segmenter.segment(match[0])] : [...match[0].matchAll(/\p{L}|\p{N}|./gu)]
                .map(m => ({ segment: m[0], index: m.index, isWordLike: /[\p{L}\p{N}]/u.test(m[0]) }));
            for (const item of segments) {
                if (item.isWordLike) wordClips.push({
                    weight, clause, words: match[0], start: item.index, end: item.index + item.segment.length,
                    index: match.index + item.index
                });
                const letters = /^[a-z0-9]+$/i.test(item.segment);
                weight += item.isWordLike ? [...item.segment].length * (letters ? .73 : 1) : /\S/u.test(item.segment) ? .82 : 0;
            }
        }
        wordClips.forEach(item => { item.position = item.weight / weight; });
        oldWord = -1;
        oldClause = -1;
    }
    function focusAt(word, allClips) {
        const step = current();
        const entry = step.entry;
        const lastClause = allClips.at(-1).clause;
        const cue = Math.min(step.focus.length - 1, Math.floor(word.clause * step.focus.length / (lastClause + 1)));
        const active = step.focus[cue];
        const before = step.focus[cue - 1];
        const after = step.focus[cue + 1];
        entry.nodes.forEach(([id]) => {
            const box = S.$(id);
            box.classList.toggle('glow', active === id);
            box.classList.toggle('dimmed', active !== id && before !== id && after !== id);
        });
        const links = entry.renderedLinks;
        currentPath = links.get(before + '>' + active) || links.get(active + '>' + after) ||
            [...links.entries()].find(([id]) => id.endsWith('>' + active))?.[1];
        for (const path of links.values()) {
            const highlighted = path === currentPath;
            path.setAttribute('stroke', highlighted ? COL.cy : COL.gy);
            path.setAttribute('stroke-width', highlighted ? '3' : '1.8');
            path.setAttribute('marker-end', 'url(#mk_' + (highlighted ? 'cy' : 'gy') + ')');
            path.classList.toggle('current-flow', highlighted);
        }
        const visual = emailVisuals[entry.id];
        if (visual?.lineKeys) {
            const selected = visual.lineKeys.flatMap((key, i) => key === active ? [i] : []);
            S.lines('lesson_code', selected);
        }
        if (visual?.rowKeys) {
            const selected = visual.rowKeys.flatMap((key, i) => key === active ? [i] : []);
            S.rowcls('lesson_table', selected, 'hl', true);
        }
        const title = entry.nodes.find(([id]) => id === active)[1];
        S.$('focus').querySelector('.focus-heading').textContent = title;
    }
    function renderProgress() {
        if (!wordClips.length) return;
        const position = fraction;
        const wordIndex = Math.max(0, wordClips.findLastIndex(word => word.position <= position));
        const word = wordClips[wordIndex];
        if (oldClause !== word.clause) {
            oldClause = word.clause;
            focusAt(word, wordClips);
        }
        if (oldWord !== wordIndex) {
            oldWord = wordIndex;
            const sentence = esc(word.words.slice(0, word.start)) + '<mark>' + esc(word.words.slice(word.start, word.end)) +
                '</mark>' + esc(word.words.slice(word.end));
            const clip = current();
            $('caption').innerHTML = (clip.lab ? '<span class="lbl">互動實驗</span>' : '') +
                '<span class="sentence">' + sentence + '</span>';
            S.$('focus').querySelector('.caption-clause').innerHTML = sentence;
        }
        const packet = S.$('packet');
        packet.hidden = !currentPath || matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!packet.hidden) {
            const first = wordClips.find(item => item.clause === word.clause).position;
            const end = wordClips.find(item => item.clause > word.clause)?.position ?? 1;
            const unit = Math.min(1, Math.max(0, (position - first) / (end - first || 1)));
            const point = currentPath.getPointAtLength(currentPath.getTotalLength() * unit);
            packet.style.left = point.x + 'px';
            packet.style.top = point.y + 'px';
        }
        $('caption').style.setProperty('--narration-progress', (fraction * 100) + '%');
        markTime();
    }
    function notesMarkup(entry) {
        const visual = emailVisuals[entry.id];
        const examples = visual?.code ? '<pre>' + esc(visual.code.join('\n')) + '</pre>' :
            visual?.rows ? '<ul>' + visual.rows.map(row => '<li>' + row.map(esc).join('　') + '</li>').join('') + '</ul>' : '';
        const sources = entry.id === 'recap' ? '<ol>' + emailReferences.map(([label, url]) =>
            '<li><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a></li>').join('') + '</ol>' : '';
        const location = /^\d/.test(entry.pages) ? '教材第 ' + entry.pages + ' 頁' : entry.pages;
        return '<div class="kp"><h4>📌 重點筆記｜' + esc(location) + '</h4><ul>' +
            entry.nodes.map(([, title, detail]) => '<li><b>' + esc(title) + '</b>　' + esc(detail) + '</li>').join('') +
            (emailSourceDetails[entry.id] || []).map(line => '<li>' + esc(line) + '</li>').join('') +
            '</ul>' + examples + sources + '</div>';
    }
    function updateNotes(entry) {
        if (previousScene !== entry) {
            $('notes').innerHTML = '<h3>' + esc(entry.chapter.no + '　' + entry.chapter.title) + '</h3><h2>' +
                esc(entry.title) + '</h2>' + entry.steps.map(([, say], n) =>
                '<button class="nl' + (flat[entry.start + n].lab ? ' lab' : '') + '" data-step="' +
                (entry.start + n) + '">' + (flat[entry.start + n].lab ? '🧪 ' : '') + esc(say) + '</button>').join('') + notesMarkup(entry);
            $('notes').querySelectorAll('[data-step]').forEach(button =>
                button.addEventListener('click', () => selectStep(Number(button.dataset.step), 0, wantsPlay)));
        }
        $('notes').querySelectorAll('[data-step]').forEach(button => {
            const active = Number(button.dataset.step) === index;
            button.setAttribute('aria-current', active ? 'step' : 'false');
            button.classList.toggle('cur', active);
            if (active && !$('notes').classList.contains('hide')) button.scrollIntoView({ block: 'nearest' });
        });
    }
    function showStep(next, progress) {
        index = next;
        fraction = progress;
        const step = current();
        if (previousScene !== step.entry) renderDiagram(step.entry);
        buildClips();
        renderProgress();
        updateNotes(step.entry);
        previousScene = step.entry;
        $('chapSel').value = step.chapterIndex;
        $('bPrev').disabled = index === 0;
        $('bNext').disabled = index === flat.length - 1;
        $('bPrevS').disabled = index === 0;
        const workbench = S.$('ui_exercise');
        if (workbench) workbench.hidden = !step.lab;
        $('bNextS').disabled = step.entry.number === scenes.length - 1;
    }

    function transport() {
        const showingPlay = wantsPlay || !audio.paused;
        const button = $('bPlay');
        button.textContent = showingPlay ? '❚❚' : '▶';
        button.setAttribute('aria-label', showingPlay ? '暫停' : '播放');
        $('stage').dataset.paused = String(!showingPlay);
    }
    function saveSpeechPosition() {
        const checkpoint = speech.position(true);
        if (checkpoint !== null) {
            fraction = checkpoint;
            renderProgress();
        }
    }
    function pause() {
        saveSpeechPosition();
        wantsPlay = false;
        speech.stop();
        audio.pause();
        transport();
        save();
    }
    function speakStep(systemVoice) {
        const at = index;
        const [from, to] = stepBounds(current());
        speech.speak({
            text: current().say,
            words: wordClips,
            progress: fraction,
            voice: systemVoice,
            rate: Number($('speed').value),
            seconds: to - from,
            finish() {
                if (!wantsPlay || at !== index) return;
                fraction = 1;
                moveAtEnd();
            },
            report(checkpoint) {
                if (!wantsPlay || at !== index) return;
                if (checkpoint !== null) fraction = checkpoint;
                pause();
                $('caption').textContent = '瀏覽器語音暫時無法播放，可以再試一次或改選預錄語音。';
            }
        });
        startAnimation();
    }
    function requestPlayback() {
        if (!wantsPlay) return;
        const systemVoice = browserVoice();
        if (systemVoice) {
            if (speech.position() === null) speakStep(systemVoice);
            return;
        }
        if (pendingSeek !== null || audio.readyState < 1) return;
        const track = activeTrack;
        audio.play().catch(error => {
            if (!wantsPlay || track !== activeTrack || error.name === 'AbortError') return;
            wantsPlay = false;
            transport();
            $('caption').textContent = '請按 ▶ 開始旁白。也可以用說明紀錄逐步查看。';
        });
    }
    function applySeek() {
        if (browserVoice() || pendingSeek === null || audio.readyState < 1) return;
        const target = pendingSeek;
        pendingSeek = null;
        if (Math.abs(audio.currentTime - target) > .005) audio.currentTime = target;
        requestPlayback();
    }
    function selectStep(next, progress = 0, autoplay = false) {
        if (!flat[next]) return;
        speech.stop();
        if (browserVoice() || activeTrack !== timingFor(flat[next].chapter).media) audio.pause();
        labFinished = false;
        wantsPlay = autoplay;
        const destination = timingFor(flat[next].chapter);
        const chapterChanged = next !== index && flat[next].chapter !== current().chapter;
        showStep(next, progress);
        if (autoplay && chapterChanged && next === current().chapter.start)
            S.titleCard(current().chapter.no, current().chapter.title);
        if (browserVoice()) {
            pendingSeek = null;
            requestPlayback();
            transport();
            save();
            return;
        }
        pendingSeek = positionOf(current(), progress);
        if (activeTrack === destination.media) {
            applySeek();
        } else {
            activeTrack = destination.media;
            audio.removeAttribute('src');
            audio.load();
            loadAbort?.abort();
            const control = new AbortController();
            loadAbort = control;
            const path = 'audio/' + activeTrack;
            const assign = source => {
                if (control.signal.aborted) return;
                audio.src = source;
                audio.playbackRate = Number($('speed').value);
            };
            if (tracks.has(path) || location.protocol === 'file:') assign(tracks.get(path) || path);
            else fetch(path, { signal: control.signal })
                .then(response => {
                    if (!response.ok) throw new Error('Audio download failed');
                    return response.blob();
                })
                .then(blob => {
                    if (control.signal.aborted) return;
                    const url = URL.createObjectURL(blob);
                    tracks.set(path, url);
                    if (tracks.size > 2) {
                        const oldest = tracks.keys().next().value;
                        URL.revokeObjectURL(tracks.get(oldest));
                        tracks.delete(oldest);
                    }
                    assign(url);
                })
                .catch(() => assign(path));
        }
        if (!autoplay) audio.pause();
        transport();
        save();
    }
    function moveAtEnd() {
        if (index + 1 === current().chapter.end) completedChapters.add(current().chapter.id);
        if (current().lab || index === flat.length - 1) {
            fraction = 1;
            labFinished = true;
            pause();
            renderProgress();
            if (current().lab) S.$('ui_exercise')?.querySelector('button').focus({ preventScroll: true });
            return;
        }
        if (!browserVoice() && flat[index + 1].chapter === current().chapter && !audio.ended) {
            showStep(index + 1, 0);
            save();
        } else {
            selectStep(index + 1, 0, true);
        }
    }
    function syncClock() {
        if (!wantsPlay) return;
        if (browserVoice()) {
            const spoken = speech.position();
            if (spoken === null) return;
            fraction = Math.max(fraction, spoken);
            renderProgress();
            if (performance.now() - lastSaved > 2500) save();
            return;
        }
        if (pendingSeek !== null || audio.seeking || audio.paused && !audio.ended) return;
        const [start, end] = stepBounds(current());
        fraction = Math.max(0, Math.min(1, (audio.currentTime - start) / Math.max(end - start, .01)));
        renderProgress();
        if (performance.now() - lastSaved > 2500) save();
        if (audio.ended || audio.currentTime >= end - .035) moveAtEnd();
    }
    function tick() {
        animation = 0;
        syncClock();
        if (wantsPlay && (browserVoice() || !audio.paused) && !animation) animation = requestAnimationFrame(tick);
    }
    function startAnimation() {
        if (!animation) animation = requestAnimationFrame(tick);
    }
    function toggle() {
        if (wantsPlay || !audio.paused) {
            if (!audio.seeking && pendingSeek === null && !audio.ended) syncClock();
            pause();
            return;
        }
        if (labFinished) {
            selectStep(index === flat.length - 1 ? index : index + 1, 0, true);
            return;
        }
        if (audio.error && !browserVoice()) {
            activeTrack = '';
            selectStep(index, fraction, true);
            return;
        }
        wantsPlay = true;
        requestPlayback();
        transport();
    }

    function buildTimeline() {
        let cursor = 0;
        timeline = emailChapters.map(chapter => {
            const t = timingFor(chapter);
            const element = document.createElement('button');
            element.type = 'button';
            element.className = 'seg';
            element.setAttribute('aria-label', chapter.no + ' ' + chapter.title);
            element.title = chapter.no + '｜' + chapter.title;
            element.style.flex = t.duration + ' 1 0';
            element.innerHTML = '<span class="fill"></span>';
            const start = cursor;
            cursor += t.duration;
            for (let i = chapter.start; i < chapter.end; i++) {
                if (!flat[i].lab) continue;
                const pin = document.createElement('span');
                pin.className = 'lm';
                pin.style.left = (100 * t.starts[flat[i].offset] / t.duration) + '%';
                element.append(pin);
            }
            const targetAt = event => {
                const bounds = element.getBoundingClientRect();
                const offset = Math.max(0, Math.min(t.duration - .04,
                    (event.clientX - bounds.left) / bounds.width * t.duration));
                return { offset, next: chapter.start + Math.max(0, t.starts.findLastIndex(at => at <= offset)) };
            };
            element.addEventListener('click', event => {
                if (!event.detail) {
                    selectStep(chapter.start, 0, wantsPlay);
                    return;
                }
                const { next, offset } = targetAt(event);
                const [a, b] = stepBounds(flat[next]);
                selectStep(next, (offset - a) / (b - a), wantsPlay);
            });
            element.addEventListener('pointermove', event => {
                if (event.pointerType === 'touch') return;
                const { offset, next } = targetAt(event);
                const tip = $('tip');
                tip.textContent = format(start + offset) + '　' + chapter.no + '｜' + flat[next].entry.title;
                tip.style.display = 'block';
                tip.style.left = Math.max(8, Math.min(event.clientX, innerWidth - tip.offsetWidth - 8)) + 'px';
                tip.style.top = (event.clientY - tip.offsetHeight - 10) + 'px';
            });
            element.addEventListener('pointerleave', () => { $('tip').style.display = 'none'; });
            return { element, start, end: cursor };
        });
        $('timeline').replaceChildren(...timeline.map(item => item.element));
        markTime();
    }

    function fit() {
        const box = $('viewport').getBoundingClientRect();
        const k = Math.max(.05, Math.min((box.width - 12) / 1280, (box.height - 12) / 720));
        $('stageWrap').style.width = 1280 * k + 'px';
        $('stageWrap').style.height = 720 * k + 'px';
        S.st.style.transform = 'scale(' + k + ')';
    }
    function updateVoice(next) {
        if (!hasVoice(next) || next === voice) return;
        pendingVoice = null;
        const playing = wantsPlay;
        if (browserVoice()) saveSpeechPosition();
        else syncClock();
        const restoreLab = labFinished;
        voice = next;
        $('voiceSel').value = voice;
        $('introVoice').value = voice;
        buildTimeline();
        if (!$('intro').hidden) return;
        selectStep(index, fraction, playing && !restoreLab);
        labFinished = restoreLab;
        save();
    }
    function refreshVoiceMenus() {
        const discovered = discoverVoices();
        const active = browserVoices.get(voice);
        if (active && !discovered.has(voice)) discovered.set(voice, active);
        browserVoices = discovered;
        for (const id of ['voiceSel', 'introVoice']) {
            const prerecorded = document.createElement('optgroup');
            prerecorded.label = '預錄旁白';
            for (const [key, label] of Object.entries(recordings)) prerecorded.append(new Option(label, key));
            const system = document.createElement('optgroup');
            system.label = '瀏覽器中文語音';
            for (const [key, item] of browserVoices) system.append(new Option(item.label, key));
            if (!hasVoice(voice)) system.append(new Option('目前語音暫不可用', voice));
            const select = $(id);
            select.replaceChildren(prerecorded);
            if (system.childElementCount) select.append(system);
            select.value = voice;
        }
        if (pendingVoice && browserVoices.has(pendingVoice) && !$('intro').hidden) updateVoice(pendingVoice);
    }
    function setMuted(muted) {
        audio.muted = muted;
        $('bTTS').textContent = muted ? '🔇 靜音' : '🔊 旁白';
        $('bTTS').classList.toggle('on', !muted);
        $('bTTS').setAttribute('aria-pressed', String(!muted));
    }
    function start({ autoplay, muted = false, resume = false, target = 0 }) {
        $('intro').hidden = true;
        setMuted(muted);
        const knownIndex = resume && flat[saved.index] ? saved.index : target;
        selectStep(knownIndex, resume ? Math.min(1, Math.max(0, Number(saved.fraction) || 0)) : 0, autoplay);
        if (resume && saved.labFinished) {
            labFinished = true;
            pause();
        }
        fit();
    }

    function openWorkshop(mode) {
        pause();
        $('workshopTitle').textContent = (mode === 'world' ? '🏁 ' : '🧪 ') + exercises[mode];
        const body = $('workshopBody');
        body.replaceChildren();
        if (!$('workshop').open) $('workshop').showModal();
        const review = sceneId => {
            const entry = scenes.find(item => item.id === sceneId);
            $('workshop').close();
            if (entry) selectStep(entry.start);
        };
        if (mode === 'world') mountEmailWorld(body, review);
        else mountEmailPractice(body, mode, review);
    }
    function showScript() {
        if (!$('scriptBody').children.length) {
            $('scriptBody').innerHTML = emailChapters.map(chapter => '<h2>' +
                esc(chapter.no + '　' + chapter.title) + '</h2>' + scenes.filter(item => item.chapter === chapter).map(item =>
                '<h3>' + esc(item.title) + '</h3>' + item.steps.map(([, line]) => '<p class="say">' + esc(line) + '</p>').join('') +
                notesMarkup(item)).join('')).join('');
        }
        pause();
        $('scriptModal').showModal();
    }

    S.init();
    if (matchMedia('(max-width:860px)').matches) {
        $('notes').classList.add('hide');
        $('bNotes').classList.remove('on');
        $('bNotes').setAttribute('aria-pressed', 'false');
    }
    new ResizeObserver(fit).observe($('viewport'));
    document.addEventListener('fullscreenchange', fit);
    refreshVoiceMenus();
    engine?.addEventListener('voiceschanged', refreshVoiceMenus);
    ['voiceSel', 'introVoice'].forEach(id => {
        $(id).addEventListener('change', event => {
            pendingVoice = null;
            updateVoice(event.target.value);
        });
    });
    const minutes = Object.fromEntries(Object.keys(recordings).map(key =>
        [key, Math.round(emailChapters.reduce((n, chapter) => n + timingFor(chapter, key).duration, 0) / 60)]));
    $('introDur').textContent = '1× 旁白約 ' + Math.min(...Object.values(minutes)) + '–' + Math.max(...Object.values(minutes)) +
        ' 分鐘。另有 5 個小實驗、期末實戰沙盒、20 題期末考與 12 回合值班模擬。';
    for (const [i, chapter] of emailChapters.entries()) {
        $('chapSel').add(new Option(chapter.no + '　' + chapter.title, i));
        const item = document.createElement('li');
        item.innerHTML = '<b>' + esc(chapter.title) + '</b>　<span class="dim">' +
            Math.max(1, Math.round(timingFor(chapter, defaultVoice).duration / 60)) + ' 分</span>';
        $('introList').append(item);
    }

    audio.addEventListener('loadedmetadata', applySeek);
    audio.addEventListener('playing', () => { transport(); startAnimation(); });
    audio.addEventListener('pause', transport);
    audio.addEventListener('ended', syncClock);
    audio.addEventListener('error', () => {
        if (browserVoice() || !audio.getAttribute('src')) return;
        wantsPlay = false;
        transport();
        $('caption').textContent = '音檔無法載入。可以切換另一種旁白，或從說明紀錄逐步查看。';
    });
    $('goTTS').onclick = () => start({ autoplay: true });
    $('goMute').onclick = () => start({ autoplay: true, muted: true });
    $('goBrowse').onclick = () => start({ autoplay: false });
    $('goResume').hidden = !flat[saved.index];
    $('goResume').onclick = () => start({ autoplay: false, resume: true });
    $('chapSel').onchange = event => selectStep(emailChapters[Number(event.target.value)].start, 0, wantsPlay);
    $('bPlay').onclick = toggle;
    $('bPrev').onclick = () => selectStep(index - 1, 0, wantsPlay);
    $('bNext').onclick = () => selectStep(index + 1, 0, wantsPlay);
    $('bPrevS').onclick = () => {
        const entry = current().entry;
        selectStep(index > entry.start ? entry.start : scenes[entry.number - 1]?.start, 0, wantsPlay);
    };
    $('bNextS').onclick = () => selectStep(scenes[current().entry.number + 1]?.start, 0, wantsPlay);
    $('speed').onchange = event => {
        audio.playbackRate = Number(event.target.value);
        if (browserVoice() && wantsPlay) {
            saveSpeechPosition();
            speakStep(browserVoice());
        }
    };
    $('bTTS').onclick = () => {
        const previouslySpeaking = Boolean(browserVoice());
        const playing = wantsPlay;
        const finished = labFinished;
        if (previouslySpeaking) saveSpeechPosition();
        else syncClock();
        setMuted(!audio.muted);
        if (previouslySpeaking !== Boolean(browserVoice())) {
            selectStep(index, fraction, playing && !finished);
            labFinished = finished;
            save();
        }
    };
    $('bNotes').onclick = () => {
        const open = !$('notes').classList.toggle('hide');
        $('bNotes').classList.toggle('on', open);
        $('bNotes').setAttribute('aria-pressed', String(open));
        if (open) updateNotes(current().entry);
        fit();
    };
    $('bFull').onclick = () => {
        const operation = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
        operation?.catch(() => {});
    };
    $('bScript').onclick = showScript;
    $('scriptClose').onclick = () => $('scriptModal').close();
    $('scriptCopy').onclick = async event => {
        const button = event.currentTarget;
        try {
            await navigator.clipboard.writeText($('scriptBody').innerText);
            button.textContent = '✓ 已複製';
        } catch {
            button.textContent = '請選取講稿複製';
        }
    };
    $('workshopClose').onclick = () => $('workshop').close();
    document.addEventListener('keydown', event => {
        if (!$('intro').hidden || $('scriptModal').open || $('workshop').open ||
            event.target.closest('button, a, input, textarea, select, summary, [contenteditable]')) return;
        const handlers = { Space: toggle, ArrowLeft: () => $('bPrev').click(), ArrowRight: () => $('bNext').click() };
        if (handlers[event.code] && !event.repeat) {
            event.preventDefault();
            handlers[event.code]();
        }
    });
    window.addEventListener('pagehide', save);

    showStep(0, 0);
    buildTimeline();
    function showDeepLink() {
        const id = { '#world': 'operations', '#simulation': 'operations', '#lab': 'sandbox', '#quiz': 'exam' }[location.hash];
        if (!id) return;
        const entry = scenes.find(item => item.id === id);
        const exerciseStep = entry.start + entry.steps.length - 1;
        if ($('intro').hidden) selectStep(exerciseStep);
        else start({ autoplay: false, target: exerciseStep });
        openWorkshop(entry.exercise);
    }
    window.addEventListener('hashchange', showDeepLink);
    showDeepLink();
})();
