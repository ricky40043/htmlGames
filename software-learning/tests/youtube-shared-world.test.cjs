const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
    const context = {
        window: {},
        document: { querySelector: () => null },
        localStorage: { getItem: () => null, setItem: () => {} },
        sessionStorage: { getItem: () => null, setItem: () => {} },
        location: { search: '?chapter=none' },
        setTimeout, clearTimeout, setInterval, clearInterval,
        Date, performance
    };
    context.window = context;
    vm.createContext(context);
    for (const file of ['system-design-runtime.js', 'data/system-design-sim-ch14.js', 'youtube-world.js', 'system-design-simulator.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    const sim = context.SYSTEM_DESIGN_SIM['sd-book-14'];
    const state = context.__simTestHooks.newState(sim);
    const world = new context.YouTubeWorld.World(14, 1);
    state.sharedWorld = world;
    return { context, sim, state, world, hooks: context.__simTestHooks };
}

test('world population, weak split, month, machine failure and requests project into the full course graph', () => {
    const { sim, state, world, hooks } = setup();
    const ids = world.addAudienceGroup(10, 'tw', '同步測試');
    const group = world.audienceGroups().find(item => item.ids.includes(ids[0]));
    world.moveAudienceMembers(group.key, 5, true);
    world.courseMonth = 4;
    const api = world.machines.find(machine => machine.kind === 'api' && machine.region === 'tw');
    world.setMachine(api.id, false);
    world.search(1);
    world.step(.1);

    hooks.syncLessonFromWorld(sim, state, world);
    const groups = state.topo.nodes.filter(node => node.headcount);
    assert.equal(state.month, 4);
    assert.equal(groups.reduce((sum, node) => sum + node.headcount, 0), 11);
    assert.equal(JSON.stringify(groups.filter(node => node.label === '同步測試').map(node => [node.headcount, node.weak]).sort()), JSON.stringify([[5, false], [5, true]]));
    assert.equal(state.instanceDown['apiServer_tw::0'], true);
    assert.ok(world.requests.length > 0);
});

test('course group edits and machine recovery mutate the same World without replacing requests or identities', () => {
    const { sim, state, world, hooks } = setup();
    world.addAudienceGroup(10, 'tw', '同一批觀眾');
    world.search(1);
    hooks.syncLessonFromWorld(sim, state, world);
    const request = world.requests[0];
    const keys = world.users.map(user => user.sharedKey).sort().join();
    const cohort = state.topo.nodes.find(node => node.label === '同一批觀眾');
    const weak = hooks.moveCourseAudience(sim, state, cohort.id, 5, true);
    state.month = 7;
    state.instanceDown['streamServer_tw::0'] = true;

    hooks.syncWorldFromLesson(sim, state);
    assert.equal(world.courseMonth, 7);
    assert.equal(JSON.stringify(world.audienceGroups().filter(group => group.label === '同一批觀眾').map(group => [group.ids.length, group.network]).sort()), JSON.stringify([[5, 'normal'], [5, 'weak']]));
    const weakUsers = world.users.filter(user => world.network(user).mbps <= 1.2);
    assert.equal(weakUsers.length, 5);
    assert.equal(new Set(weakUsers.map(user => `${user.x}:${user.y}`)).size, 5);
    assert.equal(world.users.map(user => user.sharedKey).sort().join(), keys);
    assert.equal(world.requests[0], request);
    assert.equal(world.machines.find(machine => machine.kind === 'stream' && machine.region === 'tw').up, false);
    assert.equal(weak.members.length, 5);
});

test('World hydration preserves shared month, Sets and deterministic continuation', () => {
    const { context, world } = setup();
    world.courseMonth = 3;
    world.addAudienceGroup(3, 'jp', '日本觀眾');
    for (let index = 0; index < 20; index++) world.step(.1);
    const saved = JSON.parse(JSON.stringify(world, (_, value) => value instanceof Set ? [...value] : value));
    const restored = context.YouTubeWorld.World.hydrate(saved);
    assert.equal(restored.courseMonth, 3);
    assert.equal(restored.users.length, world.users.length);
    assert.equal(Object.prototype.toString.call(restored.cache), '[object Set]');
    for (let index = 0; index < 20; index++) { world.step(.1); restored.step(.1); }
    assert.equal(JSON.stringify(restored.requests), JSON.stringify(world.requests));
    assert.equal(restored.randomState, world.randomState);
});
