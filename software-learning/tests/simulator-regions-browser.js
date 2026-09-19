(async () => {
    const results = [];
    const check = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const until = async (fn, label) => { for (let i = 0; i < 600 && !fn(); i++) await wait(50); check(fn(), label); };
    document.querySelector('.sim-start')?.click();
    const state = window.__simTestHooks.stateRef();
    const click = selector => document.querySelector(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const origin = value => { const select = document.querySelector('[data-operation-origin]'); select.value = value; select.dispatchEvent(new Event('change')); };
    click('.sim-abr-stop');
    click('[data-speed="0.5"]');
    const batch = [];
    for (const region of ['tw', 'jp', 'us']) {
        origin(region);
        for (const kind of ['watch', 'upload', 'search']) {
            for (let i = 0; i < 3; i++) {
                click(`[data-kind="${kind}"]`);
                const request = state.operationRequests[kind];
                batch.push(request);
                check(request.payload.region === region, `${request.id} ${kind} starts in selected ${region}`);
            }
        }
    }
    check(new Set(batch.map(r => r.id)).size === 27, '27 rapid clicks create 27 distinct requests');
    check(batch.every(r => r.status === 'running'), 'all 27 operations coexist without replacing one another');
    check(document.querySelector('[data-operation-counts]').textContent.includes('27'), 'concurrent count shows all active operations');
    check(document.querySelectorAll('[data-operation-id]').length === 27, 'all active operations are individually visible');
    await wait(150);
    check(batch.every(r => r.hops[0]?.nodeId === `users_${r.payload.region}`), 'actual packet paths start at each chosen region');
    click(`[data-operation-id="${batch[3].id}"]`);
    check(state.operationRequests.upload === batch[3], 'clicking an older upload opens its own details');
    check(!!document.querySelector('.sim-upload-overview progress') && document.querySelector('.sim-upload-overview').textContent.includes('已完整確認'), 'upload shows confirmed capacity and progress');
    origin('random');
    const savedRandom = Math.random;
    const randomRegions = [];
    try {
        for (const value of [.01, .4, .9]) {
            Math.random = () => value;
            click('[data-kind="search"]');
            randomRegions.push(state.operationRequests.search.payload.region);
        }
    } finally { Math.random = savedRandom; }
    check(new Set(randomRegions).size === 3, 'random option selects a new region for each request');
    await until(() => batch.every(r => r.status !== 'running'), 'every burst request eventually settles');
    check(batch.every(r => r.status === 'completed'), 'healthy burst completes without losing operations');
    origin('jp');
    click('.sim-abr-origin');
    check(state.dragViewer.regionId === 'jp', 'new observed player starts in chosen Japan region');
    const generation = state.abrGeneration;
    click('[data-send-watch]'); click('[data-send-watch]');
    check(state.abrGeneration === generation, 'extra watch requests do not restart observed playback');
    click('[data-instance="streamServer_jp::0"]');
    check(state.instanceDown['streamServer_jp::0'], 'machine can still be disconnected');
    click('[data-restore-machines]');
    check(Object.keys(state.instanceDown).length === 0, 'restore all reconnects installed machines');
    check(document.documentElement.scrollWidth <= innerWidth, 'region controls and queue do not overflow page');
    document.querySelector('.sim-workbench').scrollIntoView();
    return { passed: results.length, results };
})()
