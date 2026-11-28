'use strict';

function listEmailSpeechVoices(engine) {
    const translations = {
        HsiaoChen: '曉臻', YunJhe: '雲哲', HsiaoYu: '曉雨', Xiaoxiao: '曉曉',
        Yunxi: '雲希', Yunjian: '雲健', Xiaoyi: '曉伊', Yunyang: '雲揚',
        Yunxia: '雲夏', Xiaobei: '曉北', Xiaoni: '曉妮', HiuMaan: '曉曼',
        WanLung: '雲龍', HiuGaai: '曉佳'
    };
    const natural = voice => /Natural|Neural|自然|神經|神经/i.test(voice.name);
    const score = voice =>
        (/^(zh|cmn)[-_](TW|Hant)(?:[-_]|$)/i.test(voice.lang) ? 100 :
            /^(zh|cmn)[-_]HK/i.test(voice.lang) ? 40 : 50) +
        (natural(voice) ? 60 : /Google/i.test(voice.name) ? 35 : /Online/i.test(voice.name) ? 30 : 0) -
        (voice.localService && !natural(voice) ? 5 : 0);
    const available = (engine?.getVoices() || [])
        .filter(voice => /^(?:zh|cmn|yue)(?:[-_]|$)/i.test(voice.lang))
        .sort((a, b) => score(b) - score(a));

    return new Map(available.map(voice => {
        const name = voice.name.replace(/^Microsoft\s*/i, '').replace(/\bOnline\b|線上|在线/gi, '')
            .replace(/[（(][^()（）]*(?:Natural|Neural|自然|神經|神经)[^()（）]*[）)]/gi, '')
            .replace(/\s+-\s+.*$/u, '').trim();
        const translated = Object.entries(translations).find(([key]) =>
            new RegExp('(?:^|[^a-z])' + key + '(?:neural)?(?:$|[^a-z])', 'i').test(voice.name))?.[1];
        const id = 'browser:' + (voice.voiceURI || voice.name) + ':' + voice.lang;
        return [id, { voice, label: (natural(voice) ? '★ ' : '') + (translated || name) }];
    }));
}

function createEmailSpeech(engine) {
    let session = null;

    function position(preferBoundary = false) {
        if (!session) return null;
        const { clip, progress } = session;
        if (!clip || clip.at === null) return progress;
        const elapsed = performance.now() - clip.at;
        const boundary = clip.boundary;
        if (preferBoundary && boundary && performance.now() - boundary.at < 850 / session.rate) return boundary.fraction;
        const anchor = boundary?.fraction ?? clip.from;
        const millis = boundary ? performance.now() - boundary.at : elapsed;
        return Math.max(anchor, Math.min(clip.to - .001, anchor + millis / 1000 * session.rate / session.seconds));
    }

    function stop() {
        if (!session) return;
        clearTimeout(session.timer);
        session = null;
        engine.cancel();
    }

    function speak({ text, words, progress, voice, rate, seconds, finish, report }) {
        stop();
        const run = { progress, rate, seconds: Math.max(.5, seconds), clip: null, timer: 0 };
        session = run;
        const positionByIndex = index => {
            if (index >= text.length) return 1;
            const next = words.findIndex(word => word.index > index);
            if (next === 0) return 0;
            return words[next < 0 ? words.length - 1 : next - 1]?.position ?? 0;
        };
        function nextChunk(fromIndex) {
            if (session !== run) return;
            if (fromIndex >= text.length) {
                session = null;
                finish();
                return;
            }

            const remaining = text.slice(fromIndex);
            const part = remaining.match(/^.{4,52}?[。！？；]|^.{10,38}?[，、]|^.{1,52}/su)?.[0] || remaining;
            let endIndex = fromIndex + part.length;
            const edge = words.findLast(word => word.index < endIndex);
            if (edge && edge.index > fromIndex && edge.index + edge.end - edge.start > endIndex) endIndex = edge.index;
            const from = positionByIndex(fromIndex);
            const to = positionByIndex(endIndex);
            const clip = { from, to, at: null, boundary: null };
            run.clip = clip;
            run.progress = from;
            const u = new SpeechSynthesisUtterance(text.slice(fromIndex, endIndex));
            u.voice = voice;
            u.lang = voice.lang;
            u.rate = rate;
            const current = () => session === run && run.clip === clip;
            u.onstart = () => {
                if (current()) clip.at = performance.now();
            };
            u.onboundary = event => {
                if (!current() || !Number.isFinite(event.charIndex) || clip.at === null) return;
                const boundary = positionByIndex(fromIndex + event.charIndex);
                if (boundary >= clip.to || boundary <= (clip.boundary?.fraction ?? from)) return;
                clip.boundary = { at: performance.now(), fraction: boundary };
            };
            u.onend = () => {
                if (!current()) return;
                clearTimeout(run.timer);
                const nextWord = words.find(word => word.index >= endIndex)?.index ?? text.length;
                nextChunk(nextWord);
            };
            u.onerror = () => {
                if (!current()) return;
                const checkpoint = position(true);
                stop();
                report(checkpoint);
            };
            run.timer = setTimeout(() => u.onerror(), Math.max(10000, (to - from) * run.seconds * 2300 / rate + 7000));
            try {
                engine.speak(u);
            } catch {
                u.onerror();
            }
        }
        const start = words.findLast(word => word.position <= progress)?.index ?? 0;
        nextChunk(start);
    }

    return { speak, stop, position };
}
