// 語音由後台 /api/tts（Azure 台灣中文聲音）產生；後台沒設定或失敗時，退回瀏覽器內建語音。
// speakText 回傳 Promise，念完（或被 stopSpeech 打斷）時 resolve，讓呼叫端知道何時可以開始收音。
(function () {
    let current = null;
    let seq = 0;
    let finishCurrent = null;

    function browserSpeak(text, rate, done) {
        if (!('speechSynthesis' in window)) return done();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-TW';
        u.rate = rate;
        u.onend = u.onerror = done;
        speechSynthesis.speak(u);
    }

    function stopSpeech() {
        seq++;
        if (current) {
            current.pause();
            current.removeAttribute('src');
            current = null;
        }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (finishCurrent) finishCurrent();
    }

    function speakText(text, rate = 1) {
        stopSpeech();
        const id = seq;
        return new Promise(resolve => {
            let settled = false;
            const done = () => {
                if (settled) return;
                settled = true;
                clearTimeout(guard);
                if (finishCurrent === done) finishCurrent = null;
                resolve();
            };
            // 有些瀏覽器的語音不會觸發 end 事件，最多等 8 秒就當作念完
            const guard = setTimeout(done, 8000);
            finishCurrent = done;
            const audio = new Audio(`/api/tts?rate=${rate}&text=${encodeURIComponent(text)}`);
            current = audio;
            // onerror 和 play() 的 reject 可能同時發生，用 seq 確保只退回一次、且不會蓋掉下一句。
            const fallback = () => {
                if (id !== seq) return;
                seq++;
                current = null;
                browserSpeak(text, rate, done);
            };
            audio.onended = done;
            audio.onerror = fallback;
            audio.play().catch(fallback);
        });
    }

    window.speakText = speakText;
    window.stopSpeech = stopSpeech;
})();
