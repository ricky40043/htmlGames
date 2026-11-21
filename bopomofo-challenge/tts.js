// 語音由後台 /api/tts（Azure 台灣中文聲音）產生；後台沒設定或失敗時，退回瀏覽器內建語音。
(function () {
    let current = null;
    let seq = 0;

    function browserSpeak(text, rate) {
        if (!('speechSynthesis' in window)) return;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-TW';
        u.rate = rate;
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
    }

    function speakText(text, rate = 1) {
        stopSpeech();
        const id = seq;
        const audio = new Audio(`/api/tts?rate=${rate}&text=${encodeURIComponent(text)}`);
        current = audio;
        // onerror 和 play() 的 reject 可能同時發生，用 seq 確保只退回一次、且不會蓋掉下一句。
        const fallback = () => {
            if (id !== seq) return;
            seq++;
            current = null;
            browserSpeak(text, rate);
        };
        audio.onerror = fallback;
        audio.play().catch(fallback);
    }

    window.speakText = speakText;
    window.stopSpeech = stopSpeech;
})();
