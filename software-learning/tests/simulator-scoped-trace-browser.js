// Run on a chapter 14 page with no active uploads.
(async () => {
    const results = [];
    const check = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    document.querySelector('.sim-start')?.click();
    document.querySelector('.sim-abr-stop').click();
    const click = selector => document.querySelector(selector).click();
    for (let i = 0; i < 205; i++) click('[data-restore-machines]');
    const panel = document.querySelector('.sim-trace'), body = panel.querySelector('.sim-trace-body');
    for (const kind of ['watch', 'upload', 'search']) {
        check(body.querySelectorAll(`[data-operation="${kind}"]`).length === 200, `${kind} independently retains 200 records`);
    }
    click('[data-activity-tab="watch"]');
    body.scrollTop = 0; body.dispatchEvent(new Event('scroll')); await wait(80);
    click('[data-kind="search"]'); click('[data-activity-tab="watch"]');
    await wait(80);
    const top = body.scrollTop, unread = panel.dataset.unread;
    await wait(700);
    check(body.scrollTop === top, 'background search does not move watch reading position');
    check(panel.dataset.unread === unread, 'background search does not add unread watch messages');
    click('.sim-trace-clear');
    check(body.querySelectorAll('[data-operation="watch"]').length === 0, 'watch clear removes watch records');
    check(body.querySelectorAll('[data-operation="upload"]').length === 200, 'watch clear preserves upload history');
    check(body.querySelectorAll('[data-operation="search"]').length === 200, 'watch clear preserves search history');
    check(document.documentElement.scrollWidth <= innerWidth, 'workbench fits viewport');
    return { passed: results.length, results };
})()
