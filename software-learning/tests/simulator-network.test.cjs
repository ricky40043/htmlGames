const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
    let now = 0;
    const intervals = new Map(), timeouts = [];
    let seq = 0;
    const context = {
        window: {}, document: { querySelector: () => null },
        Date: class extends Date { static now() { return now; } },
        setInterval: fn => { intervals.set(++seq, fn); return seq; },
        clearInterval: id => intervals.delete(id),
        setTimeout: fn => { timeouts.push(fn); },
        clearTimeout: () => {}
    };
    context.document.createElementNS = () => {
        const attrs = {};
        return {
            attrs, removed: false,
            setAttribute: (key, value) => { attrs[key] = value; },
            classList: { add: name => { attrs.class += ` ${name}`; } },
            remove() { this.removed = true; }
        };
    };
    vm.createContext(context);
    for (const file of ['system-design-runtime.js', 'data/system-design-sim-ch14.js', 'system-design-simulator.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    const h = context.window.__simTestHooks;
    const sim = context.window.SYSTEM_DESIGN_SIM['sd-book-14'];
    const state = h.newState(sim);
    return { h, sim, state, tick(ms = 40) { now += ms; [...intervals.values()].forEach(fn => fn()); }, timeouts };
}
const watchPath = region => [`users_${region}`, `loadBalancer_${region}`, `streamServer_${region}`, 'transcodedStorage', `streamServer_${region}`, `loadBalancer_${region}`, `users_${region}`];

test('all non-user hops, including fixed LB/storage, participate in connection guards', () => {
    const { h, sim, state } = setup();
    const route = h.routeFor(sim, state, watchPath('tw'));
    assert.ok(route.chosen.some(c => c.nodeId === 'loadBalancer_tw'));
    assert.ok(route.chosen.some(c => c.nodeId === 'transcodedStorage'));
    h.setInstanceDown(state, 'loadBalancer_tw', 0, true);
    assert.equal(h.routeStillAlive(sim, state, route.chosen), false);
    const retry = h.routeFor(sim, state, watchPath('tw'));
    assert.ok(retry.visited.includes('loadBalancer_us'));
    assert.equal(retry.visited[0], 'users_tw');
    assert.equal(retry.visited.at(-1), 'users_tw');
});
test('Taiwan streaming outage retries in the US without moving the viewer', () => {
    const { h, sim, state } = setup();
    h.setInstanceDown(state, 'streamServer_tw', 0, true);
    const route = h.routeFor(sim, state, watchPath('tw'));
    assert.equal(route.blockedAt, null);
    assert.ok(route.visited.includes('streamServer_us'));
    assert.ok(!route.visited.includes('streamServer_tw'));
    assert.equal(state.dragViewer.regionId, 'tw');
});
test('same-region healthy peer is preferred before crossing the ocean', () => {
    const { h, sim, state } = setup();
    state.extraInstances.streamServer_tw = 1;
    h.setInstanceDown(state, 'streamServer_tw', 0, true);
    const route = h.routeFor(sim, state, watchPath('tw'));
    assert.ok(route.chosen.some(c => c.nodeId === 'streamServer_tw' && c.idx === 1));
    assert.equal(route.rerouted, false);
});
test('US outage falls back to Japan, and all regions down returns a blocked request', () => {
    const { h, sim, state } = setup();
    for (const r of ['tw', 'us']) h.setInstanceDown(state, `streamServer_${r}`, 0, true);
    assert.ok(h.routeFor(sim, state, watchPath('tw')).visited.includes('streamServer_jp'));
    h.setInstanceDown(state, 'streamServer_jp', 0, true);
    assert.equal(h.routeFor(sim, state, watchPath('tw')).blockedAt.id, 'streamServer_tw');
});
test('shared storage outage cannot be bypassed by regional failover', () => {
    const { h, sim, state } = setup();
    h.setInstanceDown(state, 'transcodedStorage', 0, true);
    assert.equal(h.routeFor(sim, state, watchPath('tw')).blockedAt.id, 'transcodedStorage');
});
test('CDN outage or removal kills current connection and retries through origin', () => {
    const { h, sim, state } = setup();
    state.choice.cdnTier = 'all';
    const ids = ['users_tw', 'cdn_tw', 'users_tw'];
    const route = h.routeFor(sim, state, ids);
    h.setInstanceDown(state, 'cdn_tw', 0, true);
    assert.equal(h.routeStillAlive(sim, state, route.chosen), false);
    assert.ok(h.routeFor(sim, state, ids).visited.includes('streamServer_tw'));
    h.setInstanceDown(state, 'cdn_tw', 0, false);
    state.choice.cdnTier = 'off';
    assert.equal(h.routeStillAlive(sim, state, route.chosen), false);
    assert.ok(!h.routeFor(sim, state, ids).visited.includes('cdn_tw'));
});
test('an unrelated API outage does not interrupt a cached or streaming video', () => {
    const { h, sim, state } = setup();
    const route = h.routeFor(sim, state, watchPath('tw'));
    h.setInstanceDown(state, 'apiServer_tw', 0, true);
    assert.equal(h.routeStillAlive(sim, state, route.chosen), true);
    const api = h.routeFor(sim, state, ['users_tw', 'loadBalancer_tw', 'apiServer_tw', 'metadataDB', 'users_tw']);
    assert.ok(api.visited.includes('apiServer_us'));
});
test('unplug/replug between animation frames still invalidates the old connection', () => {
    const { h, sim, state } = setup();
    const route = h.routeFor(sim, state, watchPath('tw'));
    h.setInstanceDown(state, 'loadBalancer_tw', 0, true);
    h.setInstanceDown(state, 'loadBalancer_tw', 0, false);
    assert.equal(h.routeStillAlive(sim, state, route.chosen), false);
    assert.equal(h.routeStillAlive(sim, state, h.routeFor(sim, state, watchPath('tw')).chosen), true);
});
test('removing a selected replica invalidates an in-flight connection', () => {
    const { h, sim, state } = setup();
    state.extraInstances.streamServer_tw = 1;
    h.setInstanceDown(state, 'streamServer_tw', 0, true);
    const route = h.routeFor(sim, state, watchPath('tw'));
    state.extraInstances.streamServer_tw = 0;
    assert.equal(h.routeStillAlive(sim, state, route.chosen), false);
});
test('the last mile caps both CDN and origin; recovery restores their own bandwidth', () => {
    const { h, sim, state } = setup();
    assert.equal(h.playbackProfile(sim, state, 'cdn', 'tw').throughput, 18);
    state.dragViewer.inZone = true;
    assert.equal(h.playbackProfile(sim, state, 'cdn', 'tw').throughput, .4);
    assert.equal(h.playbackProfile(sim, state, 'origin', 'us').throughput, .4);
    state.dragViewer.inZone = false;
    assert.equal(h.playbackProfile(sim, state, 'origin', 'us').throughput, 2.8);
});
test('a lost ball freezes at the same point, remains visible, and never completes', () => {
    const { h, tick, timeouts } = setup();
    let alive = true, lost = 0, done = 0;
    const handle = h.spawnToken({ appendChild() {} }, [{ x: 0, y: 0 }, { x: 100, y: 0 }], {
        durationMs: 1000, guard: () => alive, onLost: () => lost++, onDone: () => done++
    });
    tick(300);
    const x = handle.circle.attrs.cx;
    alive = false; tick(40); tick(2000);
    assert.equal(handle.circle.attrs.cx, x);
    assert.match(handle.circle.attrs.class, /lost/);
    assert.equal(handle.circle.removed, false);
    assert.equal(lost, 1); assert.equal(done, 0);
    timeouts.forEach(fn => fn());
    assert.equal(handle.circle.removed, true);
});
test('live network changes slow the same ball, without resetting its progress', () => {
    const { h, tick } = setup();
    let rate = 1, progress = 0;
    const handle = h.spawnToken({ appendChild() {} }, [{ x: 0, y: 0 }, { x: 100, y: 0 }], {
        advance: ms => { progress += ms / 1000 * rate; return progress; }
    });
    tick(100); const before = handle.circle.attrs.cx;
    rate = .1; tick(100);
    assert.ok(Math.abs(handle.circle.attrs.cx - before - 1) < 1e-9);
    handle.abort('來源被關閉');
    assert.match(handle.circle.attrs.class, /lost/);
});

test('course cohorts split and merge exact members without replacing topology or machines', () => {
    const {h,sim,state}=setup(), topo=h.topoOf(sim,state);
    const machines=topo.nodes.filter(n=>n.kind!=='user');
    const group=h.addUserGroup(sim,state,'tw',10), ids=[...group.members].sort().join();
    const weak=h.moveCourseAudience(sim,state,group.id,5,true);
    assert.equal(group.headcount,5); assert.equal(weak.headcount,5);
    assert.equal(h.audienceWeak(state,weak),true);
    assert.equal([...group.members,...weak.members].sort().join(),ids);
    assert.equal(h.moveCourseAudience(sim,state,weak.id,6,false),null);
    assert.equal(h.moveCourseAudience(sim,state,weak.id,1.5,false),null);
    const merged=h.moveCourseAudience(sim,state,weak.id,5,false);
    assert.equal(merged.headcount,10); assert.equal(merged.members.sort().join(),ids);
    assert.equal(topo.nodes.filter(n=>n.headcount).length,1);
    machines.forEach(n=>assert.equal(topo.nodes.find(m=>m.id===n.id),n));
});

test('course cohort drag geometry respects weak area and can restore normal network',()=>{
    const {h,sim,state}=setup();state.badZone={x:500,y:500,width:200,height:200};
    const group=h.addUserGroup(sim,state,'tw',10);
    const weak=h.moveCourseAudience(sim,state,group.id,5,true,{x:550,y:550});
    assert.equal(h.audienceWeak(state,weak),true);
    const normal=h.moveCourseAudience(sim,state,weak.id,5,false);
    assert.equal(normal.headcount,10);assert.equal(h.audienceWeak(state,normal),false);
});
