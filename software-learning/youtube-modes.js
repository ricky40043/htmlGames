/* Navigation between the complete architecture lesson and the live operation simulator. */
(() => {
    'use strict';
    const params = new URLSearchParams(location.search);
    if ((params.get('chapter') || 'sd-book-14') !== 'sd-book-14') return;
    const mode = params.get('mode') === 'world' ? 'operations' : 'architecture';
    const key = `youtube-mode-session-v1:${mode}`;
    const nav = document.createElement('nav');
    nav.className = 'youtube-mode-nav';
    nav.setAttribute('aria-label', 'YouTube 模擬頁面切換');
    nav.innerHTML = `<div class="youtube-mode-links"><a href="system-design-simulator.html?chapter=sd-book-14" ${mode === 'architecture' ? 'aria-current="page"' : ''}>架構設計</a><a href="system-design-simulator.html?chapter=sd-book-14&mode=world" ${mode === 'operations' ? 'aria-current="page"' : ''}>實際運作</a></div><p>架構策略與課程、人群播放與日誌，兩套完整功能均保留。<span>目前各自保存進度，尚未共用模擬狀態。</span></p><span class="youtube-mode-notice" role="status"></span>`;
    document.querySelector('.sim-shell').prepend(nav);
    const notice = message => { nav.querySelector('.youtube-mode-notice').textContent = message; };
    let capture = null;
    const replacer = (_, value) => value instanceof Set ? { __youtubeSet: [...value] } : value;
    const reviver = (_, value) => value && Array.isArray(value.__youtubeSet) ? new Set(value.__youtubeSet) : value;
    function save() {
        if (!capture) return;
        try { sessionStorage.setItem(key, JSON.stringify({ version: 1, saved: capture() }, replacer)); }
        catch { notice('瀏覽器無法保存這次進度，切換後可能需要重新開始。'); }
    }
    function load() {
        try {
            const data = JSON.parse(sessionStorage.getItem(key), reviver);
            return data?.version === 1 ? data.saved : null;
        } catch { return null; }
    }
    window.YouTubeModes = { register: fn => { capture = fn; }, load, notice };
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.hasAttribute('aria-current')) { event.preventDefault(); return; }
        save();
    });
    addEventListener('pagehide', save);
})();
