/* Navigation between the complete architecture lesson and the live operation simulator. */
(() => {
    'use strict';
    const params = new URLSearchParams(location.search);
    if ((params.get('chapter') || 'sd-book-14') !== 'sd-book-14') return;
    const isLesson = params.get('mode') === 'lesson';
    const mode = isLesson ? 'architecture' : 'operations';
    const key = `youtube-mode-session-v1:${mode}`;
    // Both live views share one snapshot. The monthly strategy course stays separate.
    const designKey = 'youtube-architecture-v1';
    const nav = document.createElement('nav');
    nav.className = 'youtube-mode-nav';
    nav.setAttribute('aria-label', 'YouTube 模擬頁面切換');
    nav.innerHTML = `<div class="youtube-mode-links"><a data-world-view="architecture" href="system-design-simulator.html?chapter=sd-book-14">架構與傳輸</a><a data-world-view="people" href="system-design-simulator.html?chapter=sd-book-14&mode=world">觀眾與機器</a><a href="system-design-simulator.html?chapter=sd-book-14&mode=lesson" ${isLesson ? 'aria-current="page"' : ''}>12 月策略課程</a><button type="button" class="youtube-restart" aria-describedby="youtube-restart-hint">↻ 重新模擬</button></div><p id="youtube-restart-hint">重新模擬會清除即時世界與課程進度，回到初始狀態。</p><p>${isLesson ? '這是獨立的月份策略練習；課程情境與評分不代表即時世界的人數或請求。即時觀察請使用上方兩種視圖。' : '兩張圖是同一個世界：人數、機器、CDN、請求與時間完全共用。切換視圖不會重新開始。'}</p><span class="youtube-mode-notice" role="status"></span>`;
    document.querySelector('.sim-shell').prepend(nav);
    const notice = message => { nav.querySelector('.youtube-mode-notice').textContent = message; };
    let capture = null;
    let switchView = null;
    const markView = view => nav.querySelectorAll('[data-world-view]').forEach(link => {
        if (!isLesson && link.dataset.worldView === view) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    markView(params.get('mode') === 'world' ? 'people' : 'architecture');
    const replacer = (_, value) => value instanceof Set ? { __youtubeSet: [...value] } : value === Infinity ? { __youtubeInfinity: true } : value;
    const reviver = (_, value) => value && Array.isArray(value.__youtubeSet) ? new Set(value.__youtubeSet) : value?.__youtubeInfinity === true ? Infinity : value;
    function save() {
        if (!capture) return;
        let snapshot;
        try { snapshot = capture(); }
        catch { return; }
        try { sessionStorage.setItem(key, JSON.stringify({ version: 1, saved: snapshot }, replacer)); }
        catch { notice('瀏覽器無法保存這次進度，切換後可能需要重新開始。'); }
        if (snapshot && snapshot.design) saveDesign(snapshot.design);
    }
    function load() {
        try {
            const data = JSON.parse(sessionStorage.getItem(key), reviver);
            return data?.version === 1 ? data.saved : null;
        } catch { return null; }
    }
    function saveDesign(design) {
        if (!design || typeof design !== 'object') return;
        try { sessionStorage.setItem(designKey, JSON.stringify({ version: 1, design, savedAt: Date.now() })); }
        catch { /* 存不進去就當作沒有架構設計，世界會用預設值跑。 */ }
    }
    function loadDesign() {
        try {
            const data = JSON.parse(sessionStorage.getItem(designKey));
            return data?.version === 1 && data.design ? data.design : null;
        } catch { return null; }
    }
    function clearDesign() {
        try { sessionStorage.removeItem(designKey); } catch { /* 清不掉就算了，改用預設不受影響。 */ }
    }
    function resetSession() {
        capture = null;
        sessionStorage.removeItem(key);
        if (mode === 'architecture') clearDesign();
        location.reload();
    }
    nav.querySelector('.youtube-restart').onclick = () => {
        // Disable pagehide capture before clearing, or reload would save the old world again.
        const previousCapture = capture;
        capture = null;
        try {
            sessionStorage.removeItem('youtube-mode-session-v1:architecture');
            sessionStorage.removeItem('youtube-mode-session-v1:operations');
            sessionStorage.removeItem(designKey);
        } catch {
            capture = previousCapture;
            notice('瀏覽器無法清除進度，請允許此網站使用儲存空間後再試。');
            return;
        }
        location.reload();
    };
    window.YouTubeModes = { resetSession, bindView: fn => { switchView = fn; }, markView, register: fn => { capture = fn; }, load, notice, saveDesign, loadDesign, clearDesign };
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.dataset.worldView && switchView) {
            event.preventDefault();
            switchView(link.dataset.worldView);
            return;
        }
        if (link.hasAttribute('aria-current')) { event.preventDefault(); return; }
        save();
    });
    addEventListener('pagehide', save);
})();
