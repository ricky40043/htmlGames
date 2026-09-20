/* Monthly curriculum commands act on the existing World, never on a second simulation. */
(function (host) {
    'use strict';
    class WorldCourse {
        constructor(world, scenario) {
            this.world = world;
            this.scenario = scenario;
            world.course ||= { month: 0, uptime: 100, qoe: 100, cost: 100, records: [], pending: null, sampleTarget: 1 };
        }
        setDesign(id, value) {
            const component = this.scenario.components.find(c => c.id === id);
            if (!component?.options.some(o => o.id === value) || this.world.course.pending) return false;
            const world = this.world;
            world.design[id] = value;
            world.applyDesignOptions();
            const kind = { streamRedundancy: 'stream', apiRedundancy: 'api', cacheReplica: 'cache' }[id];
            const target = id === 'cacheReplica' ? ({ off: 1, replica2: 2, replica3Quorum: 3 })[value] : value === 'warmStandby' ? 3 : 1;
            if (kind) (kind === 'cache' ? [{ id: 'us' }] : world.regions).forEach(r => {
                while (world.machines.filter(m => m.kind === kind && m.region === r.id).length < target) world.addMachine(kind, r.id);
            });
            world.incident(`課程架構調整：${component.label || component.id} → ${component.options.find(o => o.id === value).label}；既有機器與請求保留`);
            return true;
        }
        advance() {
            const world = this.world, course = world.course;
            if (course.pending || course.month >= 12) return false;
            course.month++;
            const target = Math.min(500, Math.ceil(this.scenario.viewersAtMonth(course.month) / 5000));
            const count = Math.max(0, target - course.sampleTarget);
            course.sampleTarget = target;
            const added = count ? world.addAudienceGroup(count, 'tw', `第 ${course.month} 月新增觀眾`) : [];
            const cost = this.scenario.components.reduce((n, c) => n + (c.options.find(o => o.id === world.design[c.id])?.cost || 0), 0);
            course.cost = Math.max(0, course.cost - cost * .6);
            const event = this.scenario.events.find(e => e.month === course.month);
            const record = { month: course.month, added: added.length, demand: this.scenario.viewersAtMonth(course.month), at: world.time, choices: { ...world.design }, event: event?.id || null, machines: [] };
            if (event) {
                record.title = event.title;
                record.outcome = event.resolve({ get: id => record.choices[id], has: id => record.choices[id] !== 'off' });
                const kinds = ({ dbMasterDown: ['db'], apiServerDown: ['api'], streamServerDown: ['stream'], workerStuck: ['worker'], cacheNodeDown: ['cache'], finale: ['api', 'cache', 'worker'] })[event.id] || [];
                kinds.forEach(kind => {
                    const machine = world.machines.find(m => m.kind === kind && m.up && m.active > 0) || world.machines.find(m => m.kind === kind && m.up);
                    if (machine) { world.setMachine(machine.id, false); record.machines.push(machine.id); }
                });
                course.pending = record;
            }
            course.records.push(record);
            world.incident(`第 ${course.month} 月：新增 ${added.length} 位模擬觀眾${record.title ? '；' + record.title : ''}`);
            return record;
        }
        resolve() {
            const course = this.world.course, record = course.pending;
            if (!record) return false;
            course.uptime = Math.max(0, Math.min(100, course.uptime + (record.outcome.uptime || 0)));
            course.qoe = Math.max(0, Math.min(100, course.qoe + (record.outcome.qoe || 0)));
            record.reviewed = true;
            course.pending = null;
            return record;
        }
    }
    if (typeof module !== 'undefined') module.exports = WorldCourse;
    else host.YouTubeWorldCourse = WorldCourse;
})(typeof window === 'undefined' ? globalThis : window);
