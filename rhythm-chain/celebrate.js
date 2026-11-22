// 過關特效：彩帶從兩側噴出＋歡呼音效。三個聖誕遊戲各放一份相同的檔案
// （子網域只能讀到自己資料夾的檔案），修改時三份要一起改：
// bopomofo-challenge/、christmas-gift-bomb/、rhythm-chain/ 的 celebrate.js
//   celebrate.level()  每過一關：一陣彩帶＋叮咚琶音＋短掌聲
//   celebrate.final()  全部通關：三波彩帶＋通關號角＋長掌聲
//   celebrate.unlock() 在使用者點擊時呼叫，先解鎖手機的音效
(function () {
    const COLORS = ['#e23b4a', '#1f9d55', '#ffd86b', '#ffffff', '#ff8fab', '#5ad7ff'];
    let canvas = null;
    let ctx2d = null;
    let pieces = [];
    let running = false;
    let audio = null;

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
        document.body.appendChild(canvas);
        ctx2d = canvas.getContext('2d');
        const resize = () => {
            canvas.width = innerWidth * devicePixelRatio;
            canvas.height = innerHeight * devicePixelRatio;
            ctx2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        };
        addEventListener('resize', resize);
        resize();
    }

    // 從左下、右下兩個「禮炮」往畫面中間斜上方噴
    function burst(count) {
        ensureCanvas();
        const h = innerHeight;
        for (const side of [0, 1]) {
            for (let i = 0; i < count; i++) {
                const angle = (side ? Math.PI - 1.05 : 1.05) + (Math.random() - 0.5) * 0.55;
                const speed = h * (0.022 + Math.random() * 0.016);
                pieces.push({
                    x: side ? innerWidth + 10 : -10,
                    y: h + 10,
                    vx: Math.cos(angle) * speed,
                    vy: -Math.sin(angle) * speed,
                    w: 6 + Math.random() * 6,
                    h: 10 + Math.random() * 10,
                    rot: Math.random() * Math.PI,
                    vr: (Math.random() - 0.5) * 0.35,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    life: 220 + Math.random() * 80,
                    ribbon: Math.random() < 0.25,
                });
            }
        }
        if (!running) {
            running = true;
            requestAnimationFrame(draw);
        }
    }

    function draw() {
        ctx2d.clearRect(0, 0, innerWidth, innerHeight);
        pieces = pieces.filter(p => p.life-- > 0 && p.y < innerHeight + 60);
        for (const p of pieces) {
            p.vx *= 0.985;
            p.vy = p.vy * 0.985 + 0.32;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            ctx2d.save();
            ctx2d.translate(p.x, p.y);
            ctx2d.rotate(p.rot);
            ctx2d.globalAlpha = Math.min(1, p.life / 40);
            ctx2d.fillStyle = p.color;
            if (p.ribbon) {
                ctx2d.fillRect(-p.w / 4, -p.h, p.w / 2, p.h * 2.2);
            } else {
                ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
            }
            ctx2d.restore();
        }
        if (pieces.length) {
            requestAnimationFrame(draw);
        } else {
            running = false;
            ctx2d.clearRect(0, 0, innerWidth, innerHeight);
        }
    }

    function ac() {
        if (!audio) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audio = new AC();
        }
        if (audio.state === 'suspended') audio.resume().catch(() => {});
        return audio;
    }

    function note(a, freq, at, dur, vol = 0.16, type = 'triangle') {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(g).connect(a.destination);
        o.start(at);
        o.stop(at + dur + 0.05);
    }

    // 掌聲：很多段極短的帶通雜訊（一下一下的拍手聲），密度先升後降
    function applause(a, at, seconds, vol) {
        const noise = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.18));
        const claps = Math.floor(seconds * 38);
        for (let i = 0; i < claps; i++) {
            const t = at + Math.random() * seconds;
            const env = Math.sin(Math.PI * Math.min(1, (t - at) / seconds));
            const src = a.createBufferSource();
            const bp = a.createBiquadFilter();
            const g = a.createGain();
            src.buffer = noise;
            bp.type = 'bandpass';
            bp.frequency.value = 900 + Math.random() * 1800;
            bp.Q.value = 0.8;
            g.gain.value = vol * (0.35 + 0.65 * env) * (0.5 + Math.random() * 0.5);
            src.connect(bp).connect(g).connect(a.destination);
            src.start(t);
        }
    }

    function level() {
        burst(70);
        const a = ac();
        if (!a) return;
        const t = a.currentTime + 0.02;
        [523, 659, 784, 1046].forEach((f, i) => note(a, f, t + i * 0.09, 0.3));
        note(a, 1568, t + 0.38, 0.35, 0.09, 'sine');
        applause(a, t + 0.15, 1.1, 0.5);
    }

    function final() {
        burst(110);
        setTimeout(() => burst(90), 450);
        setTimeout(() => burst(90), 950);
        const a = ac();
        if (!a) return;
        const t = a.currentTime + 0.02;
        // 通關號角：Sol-Sol-Sol-Do（長）-Mi-Do（長）
        [[784, 0, 0.14], [784, 0.15, 0.14], [784, 0.3, 0.14], [1046, 0.45, 0.5], [1318, 0.98, 0.2], [1046, 1.2, 0.8]]
            .forEach(([f, d, dur]) => { note(a, f, t + d, dur, 0.11, 'square'); note(a, f / 2, t + d, dur, 0.1); });
        applause(a, t + 0.3, 3.2, 0.7);
    }

    window.celebrate = { level, final, unlock: ac };
})();
