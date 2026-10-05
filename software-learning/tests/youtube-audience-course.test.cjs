const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { World } = require('../youtube-world.js');
const WorldCourse = require('../youtube-world-course.js');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/system-design-sim-ch14.js'), 'utf8'), context);
const scenario = context.window.SYSTEM_DESIGN_SIM['sd-book-14'];
const quiet = w => { Object.assign(w.options, {arrivals:false,autoFaults:false,autoRepair:false,wander:false}); return w; };
test('one cohort splits 5/5, retains sessions and requests, and merges without duplicates', () => {
    const w=quiet(new World(14,1));const ids=w.addAudienceGroup(10,'tw');w.step(.1);
    const users=ids.map(id=>w.user(id)),requests=w.requests.slice(),key=w.audienceGroups().find(g=>g.ids.includes(ids[0])).key;
    assert.equal(w.moveAudienceMembers(key,5,true).length,5);
    const groups=w.audienceGroups().filter(g=>g.cohort===users[0].cohortId);
    assert.deepEqual(groups.map(g=>[g.network,g.ids.length]).sort(),[['normal',5],['weak',5]]);
    assert.ok(users.every(u=>w.user(u.id)===u));assert.ok(requests.every(r=>w.requests.includes(r)));
    assert.equal(w.network(users[0]).mbps,.3);assert.equal(w.network(users[9]).mbps,12);
    w.step(20);assert.ok(w.metrics.bufferSeconds>0);assert.ok(users.slice(0,5).every(u=>u.position<users[9].position&&u.measured<=.3));
    const weak=groups.find(g=>g.network==='weak');w.moveAudienceMembers(weak.key,5,false);
    assert.equal(w.audienceGroups().filter(g=>g.cohort===users[0].cohortId).length,1);
    assert.equal(new Set(w.users.map(u=>u.id)).size,11);
});
test('individual movement automatically changes cohort projection and validates partial selection', () => {
    const w=quiet(new World(14,1));const ids=w.addAudienceGroup(10,'tw');
    ids.slice(0,5).forEach(id=>w.moveUser(id,'tw',.8,.8));
    const groups=w.audienceGroups().filter(g=>g.ids.some(id=>ids.includes(id)));
    assert.deepEqual(groups.map(g=>g.ids.length),[5,5]);
    assert.deepEqual(w.moveAudienceMembers(groups[0].key,6,false),[]);
    assert.deepEqual(w.moveAudienceMembers(groups[0].key,1.5,false),[]);
    w.moveUser(ids[0],'jp',.8,.8);assert.equal(w.audienceGroups().find(g=>g.ids.includes(ids[0])).region,'jp');
});
test('group actions retain deterministic fixed-tick outcomes across batching', () => {
    const make=()=>{const w=quiet(new World(14,1));const ids=w.addAudienceGroup(10,'tw');w.moveAudienceMembers(w.audienceGroups().find(g=>g.ids.includes(ids[0])).key,5,true);return w;};
    const a=make(),b=make();a.step(20);for(let i=0;i<200;i++)b.step(.1);
    assert.deepEqual(a.users,b.users);assert.deepEqual(a.requests,b.requests);
});
test('month event acts on same machines without stepping clock, replacing requests or regrading', () => {
    const w=quiet(new World(14,1)),course=new WorldCourse(w,scenario);w.search(1);w.step(.1);
    const request=w.requests[0],user=w.users[0],time=w.time;
    course.advance();const event=course.advance();assert.equal(w.course.month,2);
    assert.equal(w.time,time);assert.equal(w.users[0],user);assert.ok(w.requests.includes(request));
    assert.ok(event.machines.length);assert.equal(w.machines.find(m=>m.id===event.machines[0]).up,false);
    assert.equal(course.advance(),false);const result=course.resolve();assert.ok(result);
    const score=w.course.uptime;assert.equal(course.resolve(),false);assert.equal(w.course.uptime,score);
});
test('annual course stays in same world; policy changes preserve machine IDs and existing sessions', () => {
    const w=quiet(new World(14,1)),course=new WorldCourse(w,scenario),ids=w.machines.map(m=>m.id);
    assert.equal(course.setDesign('apiRedundancy','warmStandby'),true);
    assert.equal(w.machines.filter(m=>m.kind==='api'&&m.region==='tw').length,3);
    assert.ok(ids.every(id=>w.machines.some(m=>m.id===id)));
    course.setDesign('resumableUpload','off');assert.equal(w.options.resumable,false);
    for(let i=0;i<12;i++){course.advance();if(w.course.pending)course.resolve();}
    assert.equal(w.course.month,12);assert.equal(w.course.records.length,12);assert.equal(course.advance(),false);
    assert.equal(w.time,0);assert.ok(w.users.length<=500);assert.ok(w.course.records.some(r=>r.event==='finale'));
});

test('pending month survives serialization and records one review after reload', () => {
    const w=quiet(new World(14,1)),course=new WorldCourse(w,scenario);
    course.advance();course.advance();w.course=JSON.parse(JSON.stringify(w.course));
    const restored=new WorldCourse(w,scenario),score=w.course.uptime;
    assert.equal(restored.setDesign('cdnTier','off'),false);
    restored.resolve();assert.equal(w.course.records[1].reviewed,true);
    assert.equal(w.course.uptime,Math.max(0,Math.min(100,score+w.course.records[1].outcome.uptime)));
    assert.equal(restored.resolve(),false);
});
