const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('burst retains every in-flight request while limiting completed history', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../system-design-runtime.js'), 'utf8'), context);
    const api = context.window.SystemDesignRuntime;
    const runtime = api.createRuntime();
    const pending = Array.from({ length: 150 }, () => api.beginRequest(runtime, { kind: 'watch' }));
    assert.equal(runtime.requests.length, 150);
    for (let i = 0; i < 130; i++) {
        const request = api.beginRequest(runtime, { kind: 'search' });
        api.finishRequest(runtime, request, 'completed');
    }
    api.beginRequest(runtime, { kind: 'upload' });
    assert.ok(pending.every(request => runtime.requests.includes(request)));
    assert.equal(runtime.requests.filter(request => request.status === 'completed').length, 100);
    assert.equal(runtime.requests.filter(request => request.status === 'running').length, 151);
    const restored = api.hydrateRuntime(runtime);
    assert.equal(restored.requests.filter(request => request.status === 'running').length, 151);
});

test('retry countdowns survive request history pruning and hydration', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../system-design-runtime.js'), 'utf8'), context);
    const api = context.window.SystemDesignRuntime;
    const runtime = api.createRuntime();
    const waiting = api.beginRequest(runtime, { kind: 'upload' });
    api.finishRequest(runtime, waiting, 'failed');
    waiting.autoRetryAt = Date.now() + 8000;
    for (let i = 0; i < 150; i++) {
        const request = api.beginRequest(runtime, { kind: 'search' });
        api.finishRequest(runtime, request, 'completed');
    }
    assert.ok(runtime.requests.includes(waiting));
    assert.ok(api.hydrateRuntime(runtime).requests.some(request => request.id === waiting.id));
    waiting.autoRetryAt = 0;
    api.beginRequest(runtime, { kind: 'search' });
    assert.ok(!runtime.requests.includes(waiting));
});
