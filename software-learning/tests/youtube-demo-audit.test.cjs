const test = require('node:test');
const assert = require('node:assert/strict');
const { World } = require('../youtube-world.js');
function quiet() {
    const w = new World(14, 1);
    Object.assign(w.options, { autoFaults: false, autoRepair: false, arrivals: false });
    return w;
}
function until(w, predicate, seconds = 160) {
    for (let i = 0; i < seconds * 10 && !predicate(); i++) w.step(.1);
    assert.ok(predicate(), 'expected state reached');
}
test('healthy cache cannot accept upload metadata when DB is down', () => {
    const w = quiet();
    w.setMachine(w.machines.find(m => m.kind === 'db').id, false);
    const video = w.upload(1, 6);
    w.step(5);
    assert.equal(video.status, 'creating');
    assert.ok(video.chunks.every(c => c.status === 'pending'));
    assert.ok(w.requests.filter(r => r.kind === 'create-upload').every(r => r.status !== 'completed'));
});
test('publication waits for durable DB and retries after recovery', () => {
    const w = quiet(), video = w.upload(1, 6);
    until(w, () => video.status === 'processing');
    const db = w.machines.find(m => m.kind === 'db');
    w.setMachine(db.id, false);
    until(w, () => video.jobs.every(j => j.status === 'completed'));
    w.step(20);
    assert.equal(video.status, 'processing');
    assert.ok(w.requests.some(r => r.kind === 'publish' && r.reason.includes('DB')));
    w.setMachine(db.id, true);
    until(w, () => video.status === 'ready');
    const publish = w.requests.find(r => r.kind === 'publish' && r.status === 'completed');
    assert.ok(publish.machines.includes(db.id));
});
test('uploaded video transcodes and publishes while its owner is offline', () => {
    const w = quiet(), video = w.upload(1, 6);
    until(w, () => video.status === 'processing');
    w.user(1).network = 'offline';
    until(w, () => video.status === 'ready');
    assert.equal(w.user(1).network, 'offline');
    assert.equal(video.renditions.length, 3);
});
test('origin delivery while CDN is down does not warm the failed edge', () => {
    const w = quiet();
    w.setMachine(w.machines.find(m => m.kind === 'cdn' && m.region === 'tw').id, false);
    w.step(18);
    assert.ok(w.requests.some(r => r.kind === 'segment' && r.status === 'completed'));
    assert.equal(w.cache.size, 0);
});
test('popular-only policy rejects an old cached segment of a now long-tail video', () => {
    const w = quiet();
    const v = w.upload(1, 6);
    until(w, () => v.status === 'ready');
    w.design.cdnTier = 'popularOnly';
    w.videos.filter(video => video !== v).forEach(video => { video.views = 100; });
    v.views = 0;
    w.cache.add(`tw:${v.id}:360p:1`);
    const r = w.request('segment', w.user(1), { videoId: v.id, quality: '360p', segment: 1 });
    assert.deepEqual(w.resourceKinds(r), [['stream', 'tw'], ['storage', 'us']]);
    assert.equal(r.cacheHit, false);
});
