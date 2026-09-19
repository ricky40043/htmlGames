// Run on a fresh chapter 14 page; reload and run again twice to verify persisted requests.
(async () => {
    const results = [];
    const check = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const until = async (fn, label) => { for (let i = 0; i < 800 && !fn(); i++) await wait(40); check(!!fn(), label); };
    document.querySelector('.sim-start')?.click();
    const state = window.__simTestHooks.stateRef();
    const click = selector => document.querySelector(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    click('.sim-abr-stop'); click('[data-speed="2"]');
    const video = r => r.branches.find(b => b.id === 'bytes');
    const phase = Number(sessionStorage.getItem('recovery-test-phase') || 0);
    if (phase === 0) {
        state.operationOrigin = 'tw'; state.choice.resumableUpload = 'on';
        for (const kind of ['watch', 'search', 'upload']) click(`[data-kind="${kind}"]`);
        for (const kind of ['watch', 'search', 'upload']) {
            click(`[data-activity-tab="${kind}"]`);
            const lines = [...document.querySelectorAll('.sim-trace-line')].filter(e => !e.hidden);
            check(lines.length && lines.every(e => e.dataset.operation === kind), `${kind} shows only its own logs`);
            const ids = Object.entries(state.operationRequests).filter(([key]) => key !== kind).map(([, r]) => r.id);
            check(lines.every(e => ids.every(id => !e.textContent.includes(id))), `${kind} excludes other request IDs`);
        }
        const request = state.operationRequests.upload;
        await until(() => video(request).packets[2].status === 'sending', 'reaches P3');
        click('[data-instance="storage::0"]');
        await until(() => request.status === 'failed', 'upload fails at P3');
        await wait(160);
        const acknowledged = video(request).packets.slice(0, 2).reduce((sum, p) => sum + p.bytes, 0);
        const progress = document.querySelector('.sim-upload-overview progress');
        check(progress.value === acknowledged && progress.max === request.payload.size_bytes, 'progress counts exact acknowledged bytes only');
        check(document.querySelector('.sim-upload-progress-heading strong').textContent === `${Math.floor(100 * acknowledged / request.payload.size_bytes)}%`, 'percentage agrees with confirmed capacity');
        const bar = document.querySelector('[data-upload-retry-bar]');
        check(!bar.hidden && !bar.closest('.sim-activity') && bar.textContent.includes('P3'), 'P3 retry visible outside activity scroll area');
        const uploadCount = document.querySelectorAll('.sim-trace-line[data-operation="upload"]').length;
        click('[data-activity-tab="search"]'); click('.sim-trace-clear');
        check(!document.querySelectorAll('.sim-trace-line[data-operation="search"]').length, 'clear deletes only search log');
        check(document.querySelectorAll('.sim-trace-line[data-operation="upload"]').length === uploadCount, 'clearing search preserves upload log');
        sessionStorage.setItem('recovery-test-id', request.id);
    } else {
        const request = state.operationHistory.find(r => r.id === sessionStorage.getItem('recovery-test-id'));
        click(`[data-operation-id="${request.id}"]`);
        check(request.status === 'failed' && !request.retryUpload, 'failed request survives reload without function closure');
        const retry = document.querySelector(`[data-retry-upload="${request.id}"]`);
        check(retry && retry.textContent.includes(phase === 1 ? 'P3' : 'P1'), 'restored retry identifies correct packet');
        const count = state.runtime.counts.upload, id = request.payload.video_id;
        retry.click();
        check(video(request).packets[phase === 1 ? 2 : 0].status === 'sending', 'restored retry really sends the promised packet');
        check(state.runtime.counts.upload === count && request.payload.video_id === id, 'reload retry retains upload and video identity');
        await until(() => request.status === 'completed', 'restored upload completes');
        check(video(request).packets[0].attempts.length === 1, 'P1 was not duplicated for resumable recovery');
        check(document.querySelector('.sim-upload-progress-heading strong').textContent === '100%', 'completed video shows 100 percent');
        check(state.runtime.stores.youtubeMetadata.tables.video.rows.filter(r => r.video_id === id).length === 1, 'only one video record after recovery');
        if (phase === 1) {
            click('[data-kind="upload"]');
            const legacy = state.operationRequests.upload;
            await until(() => video(legacy).packets[2].status === 'sending', 'legacy fixture reaches P3');
            click('[data-instance="storage::0"]');
            await until(() => legacy.status === 'failed', 'legacy fixture fails');
            for (const branch of legacy.branches) delete branch.packets;
            delete legacy.uploadSpec; delete legacy.uploadFlows; delete legacy.retryUpload;
            sessionStorage.setItem('recovery-test-id', legacy.id);
        }
    }
    sessionStorage.setItem('recovery-test-phase', String(phase + 1));
    document.querySelector('.sim-workbench').scrollIntoView();
    return { phase, passed: results.length, results };
})()
