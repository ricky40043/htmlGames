// Run four times on the same fresh page (each phase stays below the browser command timeout).
(async () => {
    const results = [];
    const check = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const until = async (fn, label) => { for (let i = 0; i < 1000 && !fn(); i++) await wait(40); check(!!fn(), label); };
    document.querySelector('.sim-start')?.click();
    const state = window.__simTestHooks.stateRef();
    const click = selector => document.querySelector(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    click('.sim-abr-stop'); click('[data-speed="2"]');
    state.operationOrigin = 'tw'; state.choice.resumableUpload = 'on';
    const video = r => r.branches.find(b => b.id === 'bytes');
    const phase = window.__autoUploadPhase || 0;
    if (phase === 0) {
    click('[data-kind="upload"]');
    const first = state.operationRequests.upload;
    await until(() => video(first).packets[2].status === 'sending', 'P3 starts after two acknowledged packets');
    click('[data-instance="apiServer_tw::0"]');
    await until(() => first.autoRetryAt > 0, 'failure schedules automatic retry');
    check(video(first).done === 2 && video(first).packets[2].status === 'failed', 'P3 failure remains visible during countdown');
    check(document.querySelector('[data-upload-retry-bar]').textContent.includes('秒後'), 'retry countdown appears');
    await until(() => first.attempt === 2, 'retry starts without a manual click');
    check(first.autoRetries === 1, 'one automatic attempt counted');
    await until(() => first.status === 'completed', 'upload automatically completes through healthy region');
    check(video(first).packets[0].attempts.length === 1 && video(first).packets[2].attempts.length === 2, 'resumable retry preserves P1/P2 and resends P3');
    check(first.hops.some(h => h.nodeId === 'apiServer_us'), 'retry actually routes through US API server');
    check(document.querySelector('.sim-trace-body').textContent.includes(`切換路徑 ${first.id} P3`), 'log records new route and failing packet identity');
    check(state.runtime.stores.youtubeMetadata.tables.video.rows.filter(r => r.video_id === first.payload.video_id).length === 1, 'automatic retry does not duplicate video');
    } else if (phase === 1) {
    click('[data-restore-machines]');
    state.choice.resumableUpload = 'off';
    click('[data-kind="upload"]');
    const second = state.operationRequests.upload;
    await until(() => video(second).packets[2].status === 'sending', 'non-resumable upload reaches P3');
    click('[data-instance="storage::0"]');
    await until(() => second.autoRetryAt > 0, 'shared storage failure waits for retry');
    click('[data-instance="storage::0"]');
    await until(() => second.attempt === 2, 'connection recovery triggers scheduled retry');
    check(video(second).packets[0].attempts.length === 2, 'without resume automatic retry really restarts at P1');
    await until(() => second.status === 'completed', 'non-resumable automatic restart completes');
    } else if (phase === 2) {
    click('[data-instance="storage::0"]');
    click('[data-kind="upload"]');
    const blocked = state.operationRequests.upload;
    await until(() => blocked.autoRetries === 3 && blocked.status === 'failed' && !blocked.autoRetryAt, 'three failed retries stop instead of looping forever');
    check(document.querySelector('[data-upload-retry-bar]').textContent.includes('3 次仍失敗'), 'exhausted retry state explains manual recovery');
    check(video(blocked).packets.slice(1).every(p => p.attempts.length === 0), 'unreachable storage never skips to later packets');
    } else if (phase === 3) {
    click('[data-kind="upload"]');
    const stopped = state.operationRequests.upload;
    await until(() => stopped.autoRetryAt > 0, 'another request independently waits');
    click(`[data-stop-upload-retry="${stopped.id}"]`);
    await wait(2300);
    check(stopped.attempt === 1 && !stopped.autoRetryAt, 'stop button cancels pending automatic retry');
    click('[data-restore-machines]');
    click(`[data-retry-upload="${stopped.id}"]`);
    await until(() => stopped.status === 'completed', 'manual retry still works after cancellation');
    }
    window.__autoUploadPhase = phase + 1;
    check(document.documentElement.scrollWidth <= innerWidth, 'automatic retry panel fits viewport');
    return { phase, passed: results.length, results };
})()
