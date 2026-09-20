/* Navigation between the complete architecture lesson and the live operation simulator. */
(() => {
    'use strict';
    const params = new URLSearchParams(location.search);
    if ((params.get('chapter') || 'sd-book-14') !== 'sd-book-14') return;
    const isLesson = params.get('mode') !== 'world';
    const mode = isLesson ? 'architecture' : 'operations';
    const key = `youtube-mode-session-v1:${mode}`;
    // Both live views share one snapshot. The monthly strategy course stays separate.
    const designKey = 'youtube-architecture-v1';
    const nav = document.createElement('nav');
    nav.className = 'youtube-mode-nav';
    nav.setAttribute('aria-label', 'YouTube 模擬頁面切換');
    nav.innerHTML = `<div class="youtube-mode-links"><a href="system-design-simulator.html?chapter=sd-book-14" ${isLesson ? 'aria-current="page"' : ''}>月份課程與完整架構</a><a href="system-design-simulator.html?chapter=sd-book-14&mode=world" ${!isLesson ? 'aria-current="page"' : ''}>觀眾與機器</a><button type="button" class="youtube-restart" aria-describedby="youtube-restart-hint">↻ 重新模擬</button></div><p id="youtube-restart-hint">月份課程保留完整架構；觀眾與機器保留即時模擬。兩個模式各自保存進度，共用架構策略設定。重新模擬會清除兩邊進度。</p><span class="youtube-mode-notice" role="status"></span>`;
    document.querySelector('.sim-shell').prepend(nav);
    const notice = message => { nav.querySelector('.youtube-mode-notice').textContent = message; };
    let capture = null;
    let switchView = null, openCourse = null;
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
    window.YouTubeModes = { resetSession, bindCourse: fn => { openCourse = fn; }, bindView: fn => { switchView = fn; }, markView, register: fn => { capture = fn; }, load, notice, saveDesign, loadDesign, clearDesign };
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.hasAttribute('data-world-course') && openCourse) {event.preventDefault();openCourse();return;}
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
