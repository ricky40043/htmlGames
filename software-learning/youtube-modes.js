/* Navigation between the complete architecture lesson and the live operation simulator. */
(() => {
    'use strict';
    const params = new URLSearchParams(location.search);
    if ((params.get('chapter') || 'sd-book-14') !== 'sd-book-14') return;
    const mode = params.get('mode') === 'world' ? 'operations' : 'architecture';
    const key = `youtube-mode-session-v1:${mode}`;
    // 每個模式各自保存自己的進度（上面那把 key），但「架構決策」這一份是共用的：
    // 架構設計模式寫、實際運作模式讀，這是兩套引擎之間唯一互通的東西。
    const designKey = 'youtube-architecture-v1';
    const nav = document.createElement('nav');
    nav.className = 'youtube-mode-nav';
    nav.setAttribute('aria-label', 'YouTube 模擬頁面切換');
    nav.innerHTML = `<div class="youtube-mode-links"><a href="system-design-simulator.html?chapter=sd-book-14" ${mode === 'architecture' ? 'aria-current="page"' : ''}>架構設計</a><a href="system-design-simulator.html?chapter=sd-book-14&mode=world" ${mode === 'operations' ? 'aria-current="page"' : ''}>實際運作</a></div><p>架構策略與課程、人群播放與日誌，兩套完整功能均保留。<span>你在架構設計做的決策會套用到實際運作；兩邊的執行進度仍各自保存。</span></p><span class="youtube-mode-notice" role="status"></span>`;
    document.querySelector('.sim-shell').prepend(nav);
    const notice = message => { nav.querySelector('.youtube-mode-notice').textContent = message; };
    let capture = null;
    const replacer = (_, value) => value instanceof Set ? { __youtubeSet: [...value] } : value;
    const reviver = (_, value) => value && Array.isArray(value.__youtubeSet) ? new Set(value.__youtubeSet) : value;
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
    window.YouTubeModes = { register: fn => { capture = fn; }, load, notice, saveDesign, loadDesign, clearDesign };
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.hasAttribute('aria-current')) { event.preventDefault(); return; }
        save();
    });
    addEventListener('pagehide', save);
})();
