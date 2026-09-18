const test = require('node:test');
const assert = require('node:assert/strict');
const { World } = require('../youtube-world.js');
function quiet(n=1) { const w=new World(14,n); Object.assign(w.options,{autoFaults:false,autoRepair:false,arrivals:false});return w; }
function until(w,p,limit=200){for(let i=0;i<limit*10;i++){if(p())return;w.step(.1);}assert.ok(p(),'condition not reached');}
test('100 persistent sessions include the selected role and share request ledger',()=>{const w=quiet(100);w.step(90);assert.equal(w.users.length,100);assert.ok(w.seq.request>100);assert.ok(w.requests.some(r=>r.userId===1&&r.kind==='segment'));assert.ok(w.user(1).position>0);});
test('offline drains existing buffer, waits, then resumes same session',()=>{const w=quiet();w.step(10);const u=w.user(1),before=u.position,buffer=u.buffer;u.network='offline';w.step(20);assert.equal(u.buffer,0);assert.equal(u.status,'離線等待');assert.ok(Math.abs(u.position-before-buffer)<.2);u.network='good';w.step(30);assert.ok(u.position>before+buffer);assert.equal(u.id,1);});
test('CDN cannot bypass last-mile weak zone; adaptation and recovery share player',()=>{const w=quiet();w.step(30);w.moveUser(1,'tw',.8,.8);w.step(40);assert.equal(w.network(w.user(1)).mbps,.3);assert.ok(w.metrics.bufferSeconds>0);assert.equal(w.user(1).nextQuality,'360p');w.moveUser(1,'tw',.2,.2);w.step(40);assert.ok(w.user(1).buffer>0);});
test('machine failure interrupts in-flight requests and retries surviving peer',()=>{const w=quiet();w.options.cdn=false;const m=w.machines.find(m=>m.kind==='stream'&&m.region==='tw');w.addMachine('stream','tw');until(w,()=>w.requests.some(r=>r.status==='running'&&r.machines.includes(m.id)));w.setMachine(m.id,false);w.step(20);assert.ok(w.metrics.failed>0);assert.ok(w.incidents.find(e=>e.machineId===m.id).affected.has(1));assert.ok(w.user(1).position>5);assert.equal(m.up,false);});
test('resumable upload retains acknowledged parts and publishes same video',()=>{const w=quiet();const v=w.upload(1,12);until(w,()=>v.chunks.filter(c=>c.status==='acked').length>=2);const count=v.chunks.filter(c=>c.status==='acked').length;const storage=w.machines.find(m=>m.kind==='storage');w.setMachine(storage.id,false);w.step(5);assert.equal(v.chunks.filter(c=>c.status==='acked').length,count);w.setMachine(storage.id,true);until(w,()=>v.status==='ready');assert.equal(v.chunks.filter(c=>c.status==='acked').length,6);assert.deepEqual(v.renditions.slice().sort(),['360p','480p','720p']);assert.equal(w.user(1).videoId,v.id);assert.ok(w.requests.filter(r=>r.kind==='chunk').every(r=>r.videoId===v.id));});
test('non-resumable mode loses prior acknowledgements on interruption',()=>{const w=quiet();w.options.resumable=false;const v=w.upload(1,12);until(w,()=>v.chunks.filter(c=>c.status==='acked').length>=2);const m=w.machines.find(m=>m.kind==='storage');w.setMachine(m.id,false);w.step(5);assert.equal(v.chunks.filter(c=>c.status==='acked').length,0);});
test('worker retry preserves dependency graph and other completed renditions',()=>{const w=quiet();const v=w.upload(1,6);until(w,()=>v.renditions.includes('360p'));until(w,()=>w.requests.some(r=>r.videoId===v.id&&r.jobId==='720p'&&r.status==='running'));const job=w.requests.find(r=>r.videoId===v.id&&r.kind==='transcode'&&r.jobId==='720p'&&r.status==='running');assert.ok(job);const done=v.jobs.find(j=>j.id==='360p');w.setMachine(job.machines[0],false);w.step(5);assert.equal(done.status,'completed');until(w,()=>v.status==='ready');assert.equal(new Set(v.renditions).size,3);});
test('new service region changes no population location or historical service count',()=>{const w=quiet(100);w.step(5);const locations=w.users.map(u=>u.region);const r=w.addRegion('新加坡');assert.deepEqual(w.users.map(u=>u.region),locations);assert.equal(r.served.size,0);w.addUsers(100,r.id);assert.equal(w.users.length,200);assert.equal(w.users.filter(u=>u.region===r.id).length,100);});
test('wander runs during playback and movement changes weak-zone state',()=>{const w=quiet();w.options.wander=true;const before=[w.user(1).x,w.user(1).y];w.step(30);assert.notDeepEqual([w.user(1).x,w.user(1).y],before);assert.ok(w.user(1).position>0);});
test('continuous arrivals replace departed sessions without stopping at 100 requests',()=>{const w=quiet(20);w.options.arrivals=true;w.step(500);assert.equal(w.users.length,20);assert.ok(w.metrics.departed>0);assert.ok(w.seq.user>20);assert.ok(w.user(1));});
test('seeded clock produces identical outcomes regardless of frame batching',()=>{const a=quiet(12),b=quiet(12);a.options.autoFaults=b.options.autoFaults=true;a.step(90);for(let i=0;i<900;i++)b.step(.1);assert.deepEqual(a.summary(),b.summary());assert.deepEqual(a.users,b.users);assert.deepEqual(a.incidents,b.incidents);});
test('latest ledger remains newest first and never drops in-flight requests',()=>{const w=quiet(100);w.step(120);assert.ok(w.seq.request>500);assert.equal(w.requests[0].id,`REQ-${String(w.seq.request).padStart(5,'0')}`);w.users.filter(u=>u.pending).forEach(u=>assert.ok(w.requests.some(r=>r.id===u.pending)));assert.ok(w.requests.filter(r=>['completed','failed','cancelled'].includes(r.status)).length<=500);});
test('CDN outage falls back to origin after health detection',()=>{const w=quiet();w.step(20);const cdn=w.machines.find(m=>m.kind==='cdn'&&m.region==='tw');w.setMachine(cdn.id,false);w.step(25);assert.ok(w.requests.some(r=>r.kind==='segment'&&!r.cacheHit&&r.createdAt>22&&r.status==='completed'));assert.ok(w.user(1).position>20);});

// ---- 架構設計 → 實際運作：兩套引擎之間的契約 ----------------------------------
const { DESIGN_DEFAULTS, DESIGN_EFFECTS, normalizeDesign } = require('../youtube-world.js');
const fs = require('node:fs');
const path = require('node:path');

function lessonComponents() {
  const sandbox = { window: {} };
  require('node:vm').runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'system-design-sim-ch14.js'), 'utf8'),
    sandbox
  );
  return sandbox.window.SYSTEM_DESIGN_SIM['sd-book-14'].components;
}

test('每一個課程模式的決策與選項，世界模型都認得（詞彙一致）', () => {
  lessonComponents().forEach(component => {
    const effects = DESIGN_EFFECTS[component.id];
    assert.ok(effects, `世界模型沒有 ${component.id} 的行為定義`);
    // lessonComponents() 是在另一個 vm realm 建出來的，陣列原型不同，
    // 所以這裡比字串而不是用 deepStrictEqual。
    assert.equal(
      [...component.options.map(o => o.id)].sort().join(','),
      Object.keys(effects).sort().join(','),
      `${component.id} 的選項在兩套引擎不一致`
    );
    assert.ok(DESIGN_DEFAULTS[component.id], `${component.id} 沒有預設值`);
  });
  assert.equal(
    Object.keys(DESIGN_DEFAULTS).sort().join(','),
    [...lessonComponents().map(c => c.id)].sort().join(','),
    '世界模型的決策清單與課程模式不一致'
  );
});

test('壞掉或缺漏的架構設定會退回預設值，不會讓世界建不起來', () => {
  assert.deepEqual({ ...normalizeDesign(null) }, { ...DESIGN_DEFAULTS });
  assert.deepEqual({ ...normalizeDesign({ cdnTier: '不存在的選項' }) }, { ...DESIGN_DEFAULTS });
  const partial = normalizeDesign({ cdnTier: 'off' });
  assert.equal(partial.cdnTier, 'off');
  assert.equal(partial.dbMasterSlave, DESIGN_DEFAULTS.dbMasterSlave);
  assert.equal(new World(14, 1, { cdnTier: 'off' }).options.cdn, false);
});

test('熱備援一開始就多開機器，無備援則每區只有一台', () => {
  const count = (w, kind) => w.machines.filter(m => m.kind === kind && m.region === 'tw').length;
  const warm = new World(14, 1, { streamRedundancy: 'warmStandby', apiRedundancy: 'warmStandby' });
  const bare = new World(14, 1, { streamRedundancy: 'off', apiRedundancy: 'off' });
  assert.equal(count(warm, 'stream'), 3);
  assert.equal(count(warm, 'api'), 3);
  assert.equal(count(bare, 'stream'), 1);
  assert.equal(count(bare, 'api'), 1);
  // 之後自己蓋的據點也要照同一份架構開機器
  warm.addRegion('新加坡', 'sg');
  assert.equal(warm.machines.filter(m => m.kind === 'stream' && m.region === 'sg').length, 3);
});

test('DB 複寫策略決定故障後多久恢復，沒有複本就不會自己回來', () => {
  assert.equal(new World(14, 1, { dbMasterSlave: 'auto' }).repairSeconds('db'), 30);
  assert.equal(new World(14, 1, { dbMasterSlave: 'manual' }).repairSeconds('db'), 300);
  assert.equal(new World(14, 1, { dbMasterSlave: 'off' }).repairSeconds('db'), -1);

  // 實際跑一次：故障後要等多久才會自己回來（autoRepair 維持開啟）。
  const recoverSeconds = choice => {
    const w = new World(14, 3, { dbMasterSlave: choice });
    Object.assign(w.options, { autoFaults: false, arrivals: false });
    w.step(5);
    const db = w.machines.find(m => m.kind === 'db');
    w.setMachine(db.id, false);
    const start = w.time;
    for (let i = 0; i < 4000 && !db.up; i++) w.step(0.1);
    return db.up ? Math.round(w.time - start) : Infinity;
  };
  assert.equal(recoverSeconds('auto'), 30);
  assert.equal(recoverSeconds('manual'), 300);
  assert.equal(recoverSeconds('off'), Infinity, '沒有複本時 DB 不該自己恢復');
});

test('快取複本數決定 metadata 讀取什麼時候會壓回 DB', () => {
  const tierAfterKilling = (choice, kills) => {
    const w = new World(14, 5, { cacheReplica: choice });
    w.options.autoFaults = false;
    w.step(3);
    w.machines.filter(m => m.kind === 'cache').slice(0, kills).forEach(m => w.setMachine(m.id, false));
    w.step(3);
    w.search(2);
    w.step(0.3);
    return w.requests.find(r => r.kind === 'search' && r.cacheTier)?.cacheTier;
  };
  assert.equal(new World(14, 1, { cacheReplica: 'off' }).machines.filter(m => m.kind === 'cache').length, 1);
  assert.equal(new World(14, 1, { cacheReplica: 'replica3Quorum' }).machines.filter(m => m.kind === 'cache').length, 3);
  assert.equal(tierAfterKilling('off', 0), 'cache');
  assert.equal(tierAfterKilling('off', 1), 'db', '單節點掛掉就該直接壓 DB');
  assert.equal(tierAfterKilling('replica2', 1), 'cache', '兩節點掛一台還要有人擋在 DB 前面');
  assert.equal(tierAfterKilling('replica2', 2), 'db');
});

test('轉碼容錯：沒有容錯會卡住，checkpoint 保留已完成的進度', () => {
  const interrupt = choice => {
    const w = new World(14, 3, { transcodeResilience: choice });
    w.options.autoFaults = false;
    const v = w.upload(1, 12);
    for (let i = 0; i < 3000 && v.status !== 'processing'; i++) w.step(0.1);
    for (let i = 0; i < 3000 && !w.requests.some(r => r.kind === 'transcode' && r.status === 'running' && r.sent > 6); i++) w.step(0.1);
    const job = w.requests.find(r => r.kind === 'transcode' && r.status === 'running' && r.sent > 6);
    assert.ok(job, '應該要有一個轉碼中的任務');
    const progress = job.sent;
    w.setMachine(job.machines[0], false);
    // 機器掛掉後要等健康檢查判定逾時（2 秒）才會結算這一次嘗試。
    for (let i = 0; i < 100 && job.status === 'running'; i++) w.step(0.1);
    return { job, progress, world: w };
  };
  const off = interrupt('off');
  assert.equal(off.job.status, 'failed', '沒有容錯時任務應該直接卡住');

  const reassign = interrupt('reassign');
  assert.equal(reassign.job.sent, 0, '重新指派是從頭重轉');

  const checkpoint = interrupt('checkpointResume');
  assert.ok(checkpoint.job.sent > 0, 'checkpoint 應該保留已完成的進度');
  assert.ok(checkpoint.job.history.some(h => /checkpoint/.test(h.text)));
});

test('只有熱門影片進 CDN 時，長尾影片不會被快取', () => {
  const cachedVideos = choice => {
    const w = new World(14, 40, { cdnTier: choice });
    w.options.autoFaults = false;
    w.step(400);
    return new Set([...w.cache].map(key => key.split(':')[1])).size;
  };
  const all = cachedVideos('all');
  const popular = cachedVideos('popularOnly');
  assert.ok(all > 3, '全部進 CDN 時應該快取超過三支影片');
  assert.ok(popular <= 3, `只有熱門進 CDN 時最多三支，實際 ${popular}`);
  assert.ok(popular < all);
});

const { FrameStepper } = require('../youtube-world.js');
test('slow frames retain all debt and advance at most four fixed ticks', () => {
    const pacing = new FrameStepper();
    const steps = [];
    assert.equal(pacing.advance(.25, 20, dt => steps.push(dt), () => 0), 4);
    assert.ok(Math.abs(pacing.pending - 4.6) < 1e-9);
    assert.deepEqual(steps, [.1, .1, .1, .1]);
    assert.equal(pacing.advance(10, 20, () => {}, () => 0), 4);
    assert.ok(Math.abs(pacing.pending - 204.2) < 1e-9, 'long frames must not clamp or erase elapsed time');
});
test('expensive ticks yield after budget, even with a large backlog', () => {
    const pacing = new FrameStepper();
    let now = 0;
    assert.equal(pacing.advance(1, 20, () => { now += 4; }, () => now), 2);
    assert.ok(Math.abs(pacing.pending - 19.8) < 1e-9);
    now = 0;
    assert.equal(pacing.advance(0, 20, () => { now += 20; }, () => now), 1);
});
test('bounded frame batching and speed changes replay exactly the same world', () => {
    const a = quiet(30), b = quiet(30), pacing = new FrameStepper();
    a.options.autoFaults = b.options.autoFaults = true;
    for (let i = 0; i < 60; i++) {
        let cost = 0;
        pacing.advance(i % 2 ? .25 : .75, i % 2 ? 20 : 1, dt => { b.step(dt); cost += 4; }, () => cost);
    }
    const saved = new FrameStepper(pacing.pending);
    while (saved.pending + 1e-9 >= .1) saved.advance(0, 1, dt => b.step(dt), () => 0);
    a.step(172.5);
    assert.ok(Math.abs(a.remainder - b.remainder) < 1e-9);
    assert.deepEqual({ ...a, remainder: 0 }, { ...b, remainder: 0 });
});
test('manual steps consume retained debt without discarding the remainder', () => {
    const pacing = new FrameStepper(3.25), w = quiet();
    pacing.singleStep(dt => w.step(dt));
    assert.equal(w.time, .1);
    assert.equal(pacing.pending, 3.15);
});
test('300 viewers identify shared storage; diagnostics do not mutate the simulation', () => {
    const w = new World(14, 300);
    w.options.autoFaults = false;
    w.step(120);
    const before = JSON.stringify(w);
    const pressure = w.capacityPressure();
    assert.equal(pressure[0].kind, 'storage');
    assert.equal(pressure[0].region, 'us');
    assert.equal(pressure[0].waiting, 118);
    assert.equal(pressure[0].slots, 16);
    assert.equal(JSON.stringify(w), before);
});
test('shared queues are not multiplied by replica count; idle pools are not bottlenecks', () => {
    const w = quiet();
    assert.deepEqual(w.capacityPressure(), []);
    w.machines.filter(m => m.kind === 'worker').forEach(m => { m.queued = 5; m.active = 1; });
    const storage = w.machines.find(m => m.kind === 'storage');
    storage.queued = 8;
    assert.equal(w.capacityPressure()[0].kind, 'storage');
    assert.equal(w.capacityPressure()[1].waiting, 5);
    assert.equal(w.capacityPressure()[1].slots, 2);
});
test('capacity pressure follows the bottleneck after adding frontend and storage machines', () => {
    const w = new World(14, 300);
    w.options.autoFaults = false;
    w.regions.forEach(r => {
        for (let i = 0; i < 7; i++) ['stream', 'api', 'cdn'].forEach(k => w.addMachine(k, r.id));
    });
    for (let i = 0; i < 3; i++) w.addMachine('storage', 'us');
    w.step(120);
    assert.equal(w.capacityPressure()[0].kind, 'worker');
    assert.equal(w.capacityPressure()[0].waiting, 5);
    assert.ok(w.summary().rebuffer < 2);
});
test('unavailable backend is diagnosed with zero healthy slots', () => {
    const w = quiet(10);
    w.setMachine(w.machines.find(m => m.kind === 'storage').id, false);
    w.step(10);
    const storage = w.capacityPressure().find(p => p.kind === 'storage');
    assert.ok(storage.waiting > 0);
    assert.equal(storage.healthy, 0);
    assert.equal(storage.slots, 0);
});
