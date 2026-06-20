// 靜態小遊戲開啟事件上報：載入頁面時送一筆 beacon 到共用 game-stats 收集服務。
// 由網址路徑自動判斷是哪個遊戲。fire-and-forget，失敗一律忽略。
(function () {
  try {
    var parts = location.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    var name = parts[0] || 'menu';
    if (/^index\.html?$/i.test(name) || parts.length === 0) name = 'menu';
    else if (name === 'CascadeProjects' && parts[1]) name = parts[1];
    if (name === 'menu') return; // 首頁選單不算遊戲，不上報
    var body = JSON.stringify({ game: 'html-' + name, event: 'open' });
    var url = 'https://admin-games.ricky-nova.com/api/event';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
    }
  } catch (e) { /* ignore */ }
})();
