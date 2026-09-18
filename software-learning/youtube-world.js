/* A deterministic teaching world: one clock owns sessions, requests, jobs and incidents. */
(function (host) {
    'use strict';
    const NETWORKS = {
        good: { name: '良好', mbps: 12, latency: 0.04 },
        normal: { name: '普通', mbps: 3, latency: 0.12 },
        weak: { name: '衰弱', mbps: 1.2, latency: 0.3 },
        severe: { name: '嚴重', mbps: 0.3, latency: 0.8 },
        offline: { name: '離線', mbps: 0, latency: 1 }
    };
    const LADDER = [{ id: '360p', mbps: 1 }, { id: '480p', mbps: 2.5 }, { id: '720p', mbps: 5 }];
    const TYPES = { stream: '串流', api: 'API', cdn: 'CDN', cache: 'Metadata 快取', storage: '物件儲存', worker: '轉碼 Worker', db: 'Metadata DB' };

    // ---------------------------------------------------------------------------------------
    // 架構設計模式選的東西，在這個世界裡實際代表什麼。
    //
    // 這裡是兩套引擎唯一的契約：課程模式只負責把 componentId → optionId 交出來，世界模式
    // 只認得這張表。任一邊新增選項時，把對應的行為寫在這裡，而不是散在各自的引擎裡。
    // ---------------------------------------------------------------------------------------
    // 沒有任何架構設計可套用時（例如從沒玩過課程模式），世界要跟原本一樣：每區各 1 台、
    // 故障會自己恢復。所以預設不是「熱備援」——那會讓沒做過選擇的人平白拿到更好的架構。
    const DESIGN_DEFAULTS = {
        cdnTier: 'all',
        streamRedundancy: 'autoScale',
        apiRedundancy: 'autoScale',
        dbMasterSlave: 'auto',
        cacheReplica: 'replica2',
        transcodeResilience: 'reassign',
        preSignedUpload: 'on',
        resumableUpload: 'on'
    };
    // 每個選項在世界裡的效果，順便當成 UI 要顯示的說明。
    const DESIGN_EFFECTS = {
        cdnTier: {
            off: { label: '不建 CDN', note: '每一次觀看都回源到串流伺服器與物件儲存。' },
            all: { label: '所有影片都進 CDN', note: '任何影片的任何片段都會被邊緣節點快取。' },
            popularOnly: { label: '只有熱門影片進 CDN', note: '只有觀看數前三名的影片會被快取，長尾影片一律回源。' }
        },
        streamRedundancy: {
            off: { label: '串流無備援', note: '每區只有 1 台串流伺服器，故障後不會自動補。' },
            autoScale: { label: '串流自動擴縮容', note: '同區串流持續滿載 180 秒後自動補 1 台。' },
            warmStandby: { label: '串流熱備援', note: '每區一開始就多開 2 台串流伺服器待命。' }
        },
        apiRedundancy: {
            off: { label: 'API 無備援', note: '每區只有 1 台 API 伺服器，故障後不會自動補。' },
            autoScale: { label: 'API 自動擴縮容', note: '同區 API 持續滿載 180 秒後自動補 1 台。' },
            warmStandby: { label: 'API 熱備援', note: '每區一開始就多開 2 台 API 伺服器待命。' }
        },
        dbMasterSlave: {
            off: { label: 'Metadata DB 沒有複本', note: 'DB 故障後不會自己恢復，要手動按「恢復機器」。' },
            manual: { label: 'DB 人工手動切換', note: 'DB 故障後約 300 秒才切換完成。' },
            auto: { label: 'DB 自動故障轉移', note: 'DB 故障後約 30 秒完成選舉並恢復。' }
        },
        cacheReplica: {
            off: { label: '快取單節點', note: '只有 1 台 Metadata 快取；它一掛，metadata 讀取全部壓到 DB。' },
            replica2: { label: '快取兩節點複寫', note: '2 台 Metadata 快取，掛一台還有一台擋在 DB 前面。' },
            replica3Quorum: { label: '快取三節點＋Quorum', note: '3 台 Metadata 快取，可用性最高。' }
        },
        transcodeResilience: {
            off: { label: '轉碼沒有容錯', note: '轉碼任務失敗就卡住，要手動重試整支影片。' },
            reassign: { label: '轉碼重新指派', note: '失敗換一台 worker，但該任務從頭重轉。' },
            checkpointResume: { label: '轉碼重派＋Checkpoint', note: '失敗換一台 worker，並從已完成的進度接著轉。' }
        },
        preSignedUpload: {
            off: { label: '不啟用預簽名直傳', note: '上傳分塊都經 API 伺服器中轉。' },
            on: { label: '啟用預簽名直傳', note: '上傳分塊直接送物件儲存，不經 API 伺服器。' }
        },
        resumableUpload: {
            off: { label: '不啟用斷點續傳', note: '上傳中斷就整份重傳，已確認的分塊也作廢。' },
            on: { label: '啟用斷點續傳', note: '上傳中斷只重傳未確認的分塊。' }
        }
    };
    const normalizeDesign = design => {
        const out = { ...DESIGN_DEFAULTS };
        Object.keys(DESIGN_DEFAULTS).forEach(key => {
            const value = design?.[key];
            if (value && DESIGN_EFFECTS[key][value]) out[key] = value;
        });
        return out;
    };

    // Real time creates debt; bounded frames repay it without skipping any simulation tick.
    class FrameStepper {
        constructor(pending = 0) { this.pending = pending; }
        addTime(seconds, speed) { this.pending += Math.max(0, seconds) * speed; }
        advance(seconds, speed, step, now = () => performance.now()) {
            this.addTime(seconds, speed);
            const start = now();
            let ticks = 0;
            while (this.pending + 1e-9 >= 0.1 && ticks < 4) {
                if (ticks && now() - start >= 6) break;
                step(0.1);
                this.pending = Math.max(0, this.pending - 0.1);
                ticks++;
            }
            return ticks;
        }
        singleStep(step) {
            step(0.1);
            this.pending = Math.max(0, this.pending - 0.1);
        }
    }

    class World {
        constructor(seed = 14, population = 1, design = null) {
            this.seed = seed >>> 0 || 14;
            this.randomState = this.seed;
            this.time = 0;
            this.remainder = 0;
            this.regions = [];
            this.machines = [];
            this.users = [];
            this.requests = [];
            this.videos = [];
            this.incidents = [];
            this.cache = new Set();
            this.seq = { user: 0, machine: 0, request: 0, video: 0, incident: 0 };
            this.options = { cdn: true, resumable: true, directUpload: true, autoFaults: true, autoRepair: true, arrivals: true, wander: false };
            this.metrics = { completed: 0, failed: 0, bytesMB: 0, originMB: 0, cdnMB: 0, crossRegionMB: 0, bufferSeconds: 0, watchSeconds: 0, arrived: 0, departed: 0 };
            this.nextFault = 45;
            this.saturatedSince = {};
            // 先套用架構設計，addRegion 與 addMachine 才知道要開幾台。
            this.design = normalizeDesign(design);
            this.applyDesignOptions();
            this.addRegion('台灣', 'tw'); this.addRegion('美國', 'us'); this.addRegion('日本', 'jp');
            this.addMachine('storage', 'us'); this.addMachine('db', 'us');
            this.addMachine('worker', 'us'); this.addMachine('worker', 'us');
            for (let i = 0; i < ({ off: 1, replica2: 2, replica3Quorum: 3 })[this.design.cacheReplica]; i++) this.addMachine('cache', 'us');
            for (let i = 0; i < 3; i++) this.videos.push({ id: `video-${++this.seq.video}`, title: ['系統設計入門', '世界旅行', '城市日常'][i], status: 'ready', renditions: LADDER.map(q => q.id), views: 0, jobs: [], chunks: [] });
            this.addUsers(population);
        }
        random() {
            this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
            return this.randomState / 4294967296;
        }
        // 把架構設計裡「不需要開機器」的那幾項，直接翻成世界的開關。
        applyDesignOptions() {
            this.options.cdn = this.design.cdnTier !== 'off';
            this.options.directUpload = this.design.preSignedUpload === 'on';
            this.options.resumable = this.design.resumableUpload === 'on';
        }
        // 某一種機器故障後多久會自己回來；-1 代表永遠不會，要人工介入。
        repairSeconds(kind) {
            if (kind === 'db') return ({ off: -1, manual: 300, auto: 30 })[this.design.dbMasterSlave];
            if (kind === 'stream') return this.design.streamRedundancy === 'off' ? -1 : 25;
            if (kind === 'api') return this.design.apiRedundancy === 'off' ? -1 : 25;
            return 25;
        }
        addRegion(name, id = `region-${this.regions.length + 1}`) {
            name = String(name).trim().slice(0, 24);
            if (!name || this.regions.length >= 6 || this.regions.some(r => r.name === name)) return null;
            const region = { id, name, served: new Set() };
            this.regions.push(region);
            ['stream', 'api', 'cdn'].forEach(kind => this.addMachine(kind, id));
            // 熱備援是「一開始就多開著」，所以新建的據點也要照同一份架構決策開機器。
            if (this.design.streamRedundancy === 'warmStandby') { this.addMachine('stream', id); this.addMachine('stream', id); }
            if (this.design.apiRedundancy === 'warmStandby') { this.addMachine('api', id); this.addMachine('api', id); }
            return region;
        }
        addMachine(kind, region) {
            if (!TYPES[kind] || this.machines.filter(m => m.kind === kind && m.region === region).length >= 8) return null;
            const m = { id: `machine-${++this.seq.machine}`, kind, region, up: true, detectedAt: 0, capacity: ({ stream: 40, api: 32, cdn: 100, cache: 80, storage: 160, worker: 8, db: 20 })[kind], slots: kind === 'worker' ? 1 : kind === 'db' ? 6 : kind === 'cache' ? 24 : 16, active: 0, queued: 0, throughput: 0 };
            this.machines.push(m);
            return m;
        }
        addUsers(n = 1, region = null) {
            n = Math.min(Math.max(0, Math.floor(n)), 500 - this.users.length);
            for (let i = 0; i < n; i++) {
                const id = ++this.seq.user;
                const r = region || this.regions[Math.floor(this.random() * this.regions.length)].id;
                const localIndex = this.users.filter(u => u.region === r).length;
                this.users.push({ id, name: id === 1 ? '我的角色' : `觀眾 ${id}`, region: r, route: 'auto', network: 'good', x: 0.08 + (localIndex % 8) * 0.115, y: 0.12 + (Math.floor(localIndex / 8) % 5) * 0.085, zone: false, mode: 'watch', videoId: this.videos[id % 3].id, buffer: 5, position: 0, quality: '360p', nextQuality: '360p', measured: 1.5, lastDownload: 0, status: '播放中', reason: '', pending: null, actionAt: this.time + 30 + this.random() * 130, leaveAt: this.time + 180 + this.random() * 300, moveAt: this.time + 8 + this.random() * 15, readySegments: [{ quality: '360p', seconds: 5 }], nextSegment: 1 });
            }
            this.metrics.arrived += n;
        }
        user(id) { return this.users.find(u => u.id === Number(id)); }
        video(id) { return this.videos.find(v => v.id === id); }
        network(u) { return NETWORKS[u.zone && u.network !== 'offline' ? 'severe' : u.network]; }
        moveUser(id, region, x = 0.2, y = 0.2) {
            const u = this.user(id);
            if (!u || !this.regions.some(r => r.id === region)) return;
            Object.assign(u, { region, x: Math.max(0.04, Math.min(0.94, x)), y: Math.max(0.08, Math.min(0.92, y)) });
            u.zone = u.x >= 0.60 && u.y >= 0.56;
        }
        incident(title, machine = null) {
            const e = { id: ++this.seq.incident, at: this.time, title, machineId: machine?.id, affected: new Set(), failedRequests: 0, recoveredAt: null };
            this.incidents.unshift(e);
            if (this.incidents.length > 100) this.incidents.pop();
            return e;
        }
        setMachine(id, up) {
            const m = this.machines.find(m => m.id === id);
            if (!m || m.up === up) return;
            m.up = up;
            if (!up) m.throughput = 0;
            if (!up) {
                m.detectedAt = this.time + 2;
                const repair = this.repairSeconds(m.kind);
                m.incidentId = this.incident(`${TYPES[m.kind]} ${m.id} 故障；健康檢查預計 2 秒後移除${repair < 0 ? '；依目前架構不會自動恢復' : `；預計 ${repair} 秒後恢復`}`, m).id;
                m.repairAt = repair < 0 ? Infinity : this.time + repair;
            } else {
                const e = this.incidents.find(e => e.id === m.incidentId);
                if (e) e.recoveredAt = this.time;
                this.incident(`${TYPES[m.kind]} ${m.id} 已恢復，重新接受請求`);
                m.incidentId = null;
            }
        }
        request(kind, u, data = {}) {
            const r = { id: `REQ-${String(++this.seq.request).padStart(5, '0')}`, kind, userId: u?.id ?? null, videoId: data.videoId || u?.videoId || '', region: u ? (u.route === 'auto' ? u.region : u.route) : 'us', createdAt: this.time, startedAt: null, finishedAt: null, status: 'queued', reason: '等待分配機器', remaining: data.size ?? 0.04, size: data.size ?? 0.04, sent: 0, attempt: 0, retryAt: this.time, machines: [], history: [], ...data };
            this.requests.unshift(r);
            // Retain every active request, plus the most recent 500 terminal records.
            let retained = 0;
            this.requests = this.requests.filter(q => !['completed', 'failed', 'cancelled'].includes(q.status) || retained++ < 500);
            return r;
        }
        resourceKinds(r) {
            if (r.kind === 'segment') {
                const key = `${r.region}:${r.videoId}:${r.quality}:${r.segment}`;
                r.cacheHit = this.options.cdn && this.cache.has(key) && this.machines.some(m => m.kind === 'cdn' && m.region === r.region && (m.up || this.time < m.detectedAt));
                return r.cacheHit ? [['cdn', r.region]] : [['stream', r.region], ['storage', 'us']];
            }
            if (r.kind === 'chunk') return this.options.directUpload ? [['storage', 'us']] : [['api', r.region], ['storage', 'us']];
            if (r.kind === 'transcode') return [['worker', 'us']];
            // Metadata 請求先問快取；快取節點全掛時才回頭壓 Metadata DB——這正是複寫節點數
            // 在這個世界裡唯一有意義的地方。
            const cacheUp = this.machines.some(m => m.kind === 'cache' && (m.up || this.time < m.detectedAt));
            r.cacheTier = cacheUp ? 'cache' : 'db';
            return cacheUp ? [['api', r.region], ['cache', 'us']] : [['api', r.region], ['db', 'us']];
        }
        // 「只有熱門影片進 CDN」：長尾影片的片段永遠不寫進邊緣快取，所以它們每一次觀看都回源。
        cacheable(videoId) {
            if (this.design.cdnTier !== 'popularOnly') return true;
            const top = [...this.videos].sort((a, b) => b.views - a.views).slice(0, 3);
            return top.some(v => v.id === videoId);
        }
        resources(r) { return r.machines.map(id => this.machines.find(m => m.id === id)).filter(Boolean); }
        activeRequests() { return this.requests.filter(r => !['completed', 'failed', 'cancelled'].includes(r.status)); }
        startRequest(r) {
            if (r.retryAt > this.time) return;
            const u = this.user(r.userId);
            if (u && this.network(u).mbps === 0 && r.kind !== 'transcode') {
                r.reason = '使用者離線，等待重新連線';
                if (this.time - (r.waitSince ?? r.createdAt) >= 10) this.failAttempt(r, r.reason);
                return;
            }
            if (u && r.kind !== 'transcode') r.region = u.route === 'auto' ? u.region : u.route;
            const picks = [];
            for (const [kind, region] of this.resourceKinds(r)) {
                const pool = this.machines.filter(m => m.kind === kind && m.region === region && (m.up || this.time < m.detectedAt));
                pool.sort((a, b) => a.active - b.active || a.id.localeCompare(b.id));
                const m = pool.find(m => m.active < m.slots);
                if (!m) {
                    pool.forEach(m => m.queued++);
                    r.reason = pool.length ? `${TYPES[kind]} 容量滿，等待佇列` : `${TYPES[kind]} 無健康機器`;
                    if (this.time - (r.waitSince ?? r.createdAt) >= 12) this.failAttempt(r, r.reason);
                    return;
                }
                picks.push(m);
            }
            r.machines = picks.map(m => m.id);
            picks.forEach(m => m.active++);
            r.status = 'running'; r.startedAt ??= this.time; r.attempt++;
            r.attemptAt = this.time;
            r.latency = r.kind === 'transcode' ? 0 : (u ? this.network(u).latency : 0) + (u && u.region !== r.region ? 0.8 : 0.04) + (r.kind === 'segment' && !r.cacheHit && r.region !== 'us' ? 0.3 : 0);
            r.history.push({ at: this.time, text: `第 ${r.attempt} 次：${picks.map(m => `${TYPES[m.kind]} ${m.id}`).join(' → ')}` });
            r.reason = '傳輸／處理中';
        }
        failAttempt(r, reason) {
            r.history.push({ at: this.time, text: reason });
            this.metrics.failed++;
            this.resources(r).forEach(m => {
                if (r.status === 'running') m.active = Math.max(0, m.active - 1);
                const e = this.incidents.find(e => e.id === m.incidentId);
                if (e) { if (r.userId) e.affected.add(r.userId); e.failedRequests++; }
            });
            r.retries = (r.retries || 0) + 1;
            r.reason = reason;
            // Checkpoint 的意思就是這一行：換一台 worker，但已經轉好的部分不丟掉。
            const keepProgress = r.kind === 'transcode' && this.design.transcodeResilience === 'checkpointResume';
            r.machines = [];
            if (!keepProgress) { r.remaining = r.size; r.sent = 0; }
            else r.history.push({ at: this.time, text: `從 checkpoint 接續，保留已完成的 ${Math.round(r.sent / r.size * 100)}%` });
            r.waitSince = this.time;
            if (r.kind === 'chunk' && !this.options.resumable) {
                const v = this.video(r.videoId);
                v.chunks.forEach(c => { if (c.status === 'acked') c.status = 'pending'; });
            }
            // 沒有容錯：轉碼任務一失敗就卡住，不再自動換機器重試。
            if (r.kind === 'transcode' && this.design.transcodeResilience === 'off') {
                r.status = 'failed'; r.finishedAt = this.time;
                r.reason = '轉碼沒有容錯，任務卡住，需要手動重試整支影片';
                this.settle(r, false);
                return;
            }
            if (r.retries >= 5) {
                r.status = 'failed'; r.finishedAt = this.time;
                this.settle(r, false);
            } else {
                r.status = 'retry'; r.retryAt = this.time + Math.min(8, 2 ** (r.retries - 1));
            }
        }
        finish(r) {
            r.status = 'completed'; r.finishedAt = this.time; r.reason = '完成';
            this.resources(r).forEach(m => m.active = Math.max(0, m.active - 1));
            this.metrics.completed++;
            const region = this.regions.find(g => g.id === r.region);
            if (region && r.userId) region.served.add(r.userId);
            r.history.push({ at: this.time, text: '完成並確認' });
            this.settle(r, true);
        }
        settle(r, success) {
            const u = this.user(r.userId), v = this.video(r.videoId);
            if (r.kind === 'segment' && u) {
                u.pending = null;
                if (success) {
                    u.buffer += 5;
                    u.nextSegment = r.segment + 1;
                    u.readySegments.push({ quality: r.quality, seconds: 5 });
                    u.measured = r.size * 8 / Math.max(0.1, this.time - r.attemptAt);
                    u.lastDownload = this.time - r.attemptAt;
                    if (this.options.cdn && !r.cacheHit && this.cacheable(r.videoId)) this.cache.add(`${r.region}:${r.videoId}:${r.quality}:${r.segment}`);
                    if (v) v.views++;
                } else { u.reason = '片段多次失敗，稍後重新請求'; u.fetchAfter = this.time + 3; }
            }
            if (r.kind === 'search' && u) { u.mode = 'watch'; u.pending = null; u.reason = success ? '搜尋完成' : '搜尋逾時'; u.actionAt = this.time + 40; }
            if (r.kind === 'create-upload' && v) {
                v.status = success ? 'uploading' : 'failed';
                if (!success && u) { u.mode = 'watch'; u.pending = null; }
            }
            if (r.kind === 'chunk' && v) v.chunks[r.part].status = success ? 'acked' : 'failed';
            if (r.kind === 'transcode' && v) {
                const job = v.jobs.find(j => j.id === r.jobId);
                job.status = success ? 'completed' : 'failed';
                if (success && LADDER.some(q => q.id === job.id)) v.renditions.push(job.id);
            }
            if (r.kind === 'publish' && v) {
                v.publishPending = false;
                if (success) {
                    v.status = 'ready';
                    this.incident(`${v.title} 已發布；可搜尋、觀看 ${v.renditions.join(' / ')}`);
                    if (u && u.mode === 'upload' && u.uploadId === v.id) this.watch(u.id, v.id);
                } else v.publishAfter = this.time + 5;
            }
        }
        cancelUserRequest(u) {
            if (!u.pending) return;
            const r = this.requests.find(r => r.id === u.pending);
            if (r && !['completed', 'failed'].includes(r.status)) {
                if (r.status === 'running') this.resources(r).forEach(m => m.active = Math.max(0, m.active - 1));
                r.status = 'cancelled'; r.finishedAt = this.time; r.reason = '使用者切換操作';
            }
            u.pending = null;
        }
        watch(id, videoId) {
            const u = this.user(id), v = this.video(videoId);
            if (!u || v?.status !== 'ready') return false;
            this.cancelUserRequest(u);
            Object.assign(u, { mode: 'watch', videoId, position: 0, buffer: 0, readySegments: [], actionAt: this.time + 60 + this.random() * 90, fetchAfter: 0, nextSegment: 1 });
            return true;
        }
        search(id) {
            const u = this.user(id); if (!u || u.mode === 'upload') return;
            this.cancelUserRequest(u); u.mode = 'search'; u.pending = this.request('search', u).id;
        }
        upload(id, sizeMB = 96) {
            const u = this.user(id); if (!u || u.mode === 'upload') return null;
            if (this.videos.filter(v => v.status !== 'ready').length >= 30) return null;
            this.cancelUserRequest(u);
            sizeMB = Math.max(6, Math.min(1024, Number(sizeMB) || 96));
            const v = { id: `video-${++this.seq.video}`, title: `觀眾 ${id} 的影片 ${this.seq.video}`, owner: id, status: 'creating', sizeMB, renditions: [], views: 0, createdAt: this.time, sessionId: `upload-${this.seq.video}`, chunks: Array.from({ length: 6 }, (_, i) => ({ part: i, size: sizeMB / 6, status: 'pending' })), jobs: [] };
            this.videos.push(v); u.mode = 'upload'; u.uploadId = v.id;
            this.request('create-upload', u, { videoId: v.id });
            return v;
        }
        retryUpload(id) {
            const v = this.video(id); if (!v) return;
            v.chunks.filter(c => c.status === 'failed').forEach(c => { c.status = 'pending'; });
            v.jobs.filter(j => j.status === 'failed').forEach(j => { j.status = 'pending'; });
            if (v.status === 'failed') {
                v.status = 'creating'; this.request('create-upload', this.user(v.owner), { videoId: v.id });
            }
        }
        tickVideos() {
            this.videos.forEach(v => {
                const u = this.user(v.owner);
                if (v.status === 'uploading' && u) {
                    const inFlight = v.chunks.filter(c => c.status === 'sending').length;
                    v.chunks.filter(c => c.status === 'pending').slice(0, Math.max(0, 2 - inFlight)).forEach(c => {
                        c.status = 'sending'; this.request('chunk', u, { videoId: v.id, part: c.part, size: c.size });
                    });
                    if (v.chunks.every(c => c.status === 'acked')) {
                        v.status = 'processing';
                        v.jobs = [{ id: 'check', size: 16, status: 'pending', deps: [] }, ...LADDER.map((q, i) => ({ id: q.id, size: 40 + i * 40, status: 'pending', deps: ['check'] })), { id: 'thumbnail', size: 8, status: 'pending', deps: ['check'] }];
                    }
                }
                if (v.status === 'processing') {
                    v.jobs.filter(j => j.status === 'pending' && j.deps.every(id => v.jobs.find(d => d.id === id).status === 'completed')).forEach(j => {
                        j.status = 'running'; this.request('transcode', null, { userId: v.owner, videoId: v.id, jobId: j.id, size: j.size });
                    });
                    if (v.jobs.every(j => j.status === 'completed') && !v.publishPending && (v.publishAfter || 0) <= this.time) {
                        v.publishPending = true; this.request('publish', u, { videoId: v.id });
                    }
                }
            });
        }
        tickUsers(dt) {
            this.users.slice().forEach(u => {
                if (this.options.arrivals && u.id !== 1 && u.mode !== 'upload' && !this.videos.some(v => v.owner === u.id && !['ready', 'failed'].includes(v.status)) && this.time >= u.leaveAt) {
                    this.cancelUserRequest(u); this.users = this.users.filter(x => x !== u); this.metrics.departed++; this.addUsers(1, u.region); return;
                }
                if (this.options.wander && this.time >= u.moveAt) {
                    this.moveUser(u.id, u.region, 0.08 + this.random() * 0.84, 0.1 + this.random() * 0.8);
                    u.moveAt = this.time + 8 + this.random() * 15;
                }
                if (u.mode !== 'watch') { u.status = u.mode === 'upload' ? '上傳／轉碼中' : '搜尋中'; u.reason = this.activeRequests().find(r => r.userId === u.id)?.reason || '等待下一階段'; return; }
                this.metrics.watchSeconds += dt;
                if (u.buffer > 0.00001) {
                    const played = Math.min(u.buffer, dt); u.buffer = Math.max(0, u.buffer - played); if (u.buffer < 0.00001) u.buffer = 0; u.position += played;
                    let remaining = played;
                    while (remaining > 0.00001 && u.readySegments.length) {
                        const segment = u.readySegments[0]; u.quality = segment.quality;
                        const take = Math.min(remaining, segment.seconds); segment.seconds -= take; remaining -= take;
                        if (segment.seconds < 0.00001) u.readySegments.shift();
                    }
                    u.status = '播放中';
                } else { u.status = this.network(u).mbps === 0 ? '離線等待' : '緩衝中'; this.metrics.bufferSeconds += dt; }
                const v = this.video(u.videoId);
                if (!u.pending && u.buffer <= 10 && this.time >= (u.fetchAfter || 0)) {
                    const available = LADDER.filter(q => v?.renditions.includes(q.id));
                    const sustainable = available.filter(q => q.mbps <= u.measured * 0.8);
                    const q = sustainable.at(-1) || available[0];
                    if (q) {
                        const current = Math.max(0, available.findIndex(q => q.id === u.quality));
                        const next = available[Math.min(available.indexOf(q), current + 1)];
                        u.nextQuality = next.id;
                        u.pending = this.request('segment', u, { size: next.mbps * 5 / 8, quality: next.id, segment: u.nextSegment }).id;
                    }
                }
                const pending = this.requests.find(r => r.id === u.pending);
                if (pending?.status === 'running' && pending.kind === 'segment' && pending.quality !== '360p' && u.buffer < 2 && this.time - pending.attemptAt > 3) {
                    const measured = pending.sent * 8 / (this.time - pending.attemptAt);
                    const lowest = LADDER.find(q => v?.renditions.includes(q.id));
                    if (lowest && measured < LADDER.find(q => q.id === pending.quality).mbps * 0.8) {
                        this.resources(pending).forEach(m => m.active = Math.max(0, m.active - 1));
                        pending.history.push({ at: this.time, text: 'ABR 偵測緩衝不足，取消較大版本並重新取得低畫質片段' });
                        Object.assign(pending, { quality: lowest.id, size: lowest.mbps * 5 / 8, remaining: lowest.mbps * 5 / 8, sent: 0, machines: [], status: 'retry', retryAt: this.time + 0.1, waitSince: this.time });
                        u.nextQuality = lowest.id; u.measured = measured;
                    }
                }
                u.reason = pending?.reason || '緩衝充足';
                if (this.time >= u.actionAt && u.id !== 1) {
                    const roll = this.random();
                    if (roll < 0.08) this.upload(u.id);
                    else if (roll < 0.3) this.search(u.id);
                    else { const ready = this.videos.filter(v => v.status === 'ready'); this.watch(u.id, ready[Math.floor(this.random() * ready.length)].id); }
                    u.actionAt = this.time + 45 + this.random() * 100;
                }
            });
        }
        // 自動擴縮容不是「瞬間長出機器」：書上寫觸發後約 3–5 分鐘才生效，這裡用同區持續滿載
        // 180 秒當觸發條件，讓它跟熱備援的差別看得出來——熱備援一開始就在，自動擴縮要等。
        tickAutoscale(dt) {
            const scaling = [
                ['stream', this.design.streamRedundancy],
                ['api', this.design.apiRedundancy]
            ].filter(([, choice]) => choice === 'autoScale');
            if (!scaling.length) return;
            scaling.forEach(([kind]) => this.regions.forEach(region => {
                const pool = this.machines.filter(m => m.kind === kind && m.region === region.id && m.up);
                const key = `${kind}:${region.id}`;
                const saturated = pool.length > 0 && pool.every(m => m.active >= m.slots);
                if (!saturated) { this.saturatedSince[key] = 0; return; }
                this.saturatedSince[key] = (this.saturatedSince[key] || 0) + dt;
                if (this.saturatedSince[key] < 180) return;
                this.saturatedSince[key] = 0;
                if (this.addMachine(kind, region.id)) {
                    this.incident(`${region.name} 的 ${TYPES[kind]} 持續滿載，自動擴縮容補上 1 台`);
                }
            }));
        }
        step(seconds = 0.1) {
            this.remainder += Math.max(0, seconds);
            while (this.remainder + 1e-9 >= 0.1) { this.tick(0.1); this.remainder -= 0.1; }
        }
        tick(dt) {
            this.time = Math.round((this.time + dt) * 10) / 10;
            if (this.options.autoFaults && this.time >= this.nextFault) {
                const up = this.machines.filter(m => m.up);
                if (up.length) this.setMachine(up[Math.floor(this.random() * up.length)].id, false);
                this.nextFault = this.time + 45 + this.random() * 45;
            }
            this.machines.forEach(m => {
                if (!m.up && this.options.autoRepair && this.time >= m.repairAt) this.setMachine(m.id, true);
                m.active = 0; m.queued = 0; m.throughput = 0;
            });
            let active = this.activeRequests();
            active.filter(r => r.status === 'running').forEach(r => this.resources(r).forEach(m => m.active++));
            this.tickAutoscale(dt);
            // Oldest first prevents later arrivals from starving the queue.
            active.slice().reverse().filter(r => r.status !== 'running').forEach(r => this.startRequest(r));
            active = this.activeRequests().filter(r => r.status === 'running');
            const perUser = {};
            active.filter(r => r.kind !== 'transcode').forEach(r => { perUser[r.userId] = (perUser[r.userId] || 0) + 1; });
            const rates = new Map(active.map(r => {
                const u = this.user(r.userId), resources = this.resources(r);
                const client = u && r.kind !== 'transcode' ? this.network(u).mbps / perUser[u.id] : Infinity;
                return [r.id, Math.min(client, ...resources.map(m => m.capacity / Math.max(1, m.active)))];
            }));
            active.forEach(r => {
                if (r.status !== 'running') return;
                const resources = this.resources(r), u = this.user(r.userId);
                if (resources.some(m => !m.up) || (u && this.network(u).mbps === 0 && r.kind !== 'transcode')) {
                    r.reason = '連線中斷，等待逾時'; r.brokenAt ??= this.time;
                    if (this.time - r.brokenAt >= 2) { r.brokenAt = null; this.failAttempt(r, '連線逾時，將重試其他健康機器'); }
                    return;
                }
                r.brokenAt = null;
                if (r.latency > 0) { r.latency -= dt; return; }
                const rate = rates.get(r.id);
                const amount = Math.min(r.remaining, rate * dt / (r.kind === 'transcode' ? 1 : 8));
                r.remaining = Math.max(0, r.remaining - amount); r.sent += amount;
                resources.forEach(m => { m.throughput += amount / dt * (r.kind === 'transcode' ? 1 : 8); });
                if (r.kind !== 'transcode') {
                    this.metrics.bytesMB += amount;
                    if (r.kind === 'segment') this.metrics[r.cacheHit ? 'cdnMB' : 'originMB'] += amount;
                    if (u && (u.region !== r.region || (r.kind === 'segment' && !r.cacheHit && r.region !== 'us') || r.kind === 'chunk' && u.region !== 'us')) this.metrics.crossRegionMB += amount;
                }
                if (r.remaining < 1e-8) this.finish(r);
            });
            this.tickVideos(); this.tickUsers(dt);
        }
        capacityPressure() {
            const groups = new Map();
            this.machines.forEach(m => {
                const key = `${m.kind}:${m.region}`;
                if (!groups.has(key)) groups.set(key, { kind: m.kind, region: m.region, machineIds: [], waiting: 0, active: 0, slots: 0, healthy: 0 });
                const group = groups.get(key);
                group.machineIds.push(m.id);
                // Each machine in a pool records the SAME waiting requests, not its own queue.
                group.waiting = Math.max(group.waiting, m.queued);
                if (m.up) { group.healthy++; group.active += m.active; group.slots += m.slots; }
            });
            this.activeRequests().forEach(r => {
                if (r.status === 'running') return;
                for (const group of groups.values()) {
                    if (!group.healthy && r.reason === `${TYPES[group.kind]} 無健康機器` &&
                        (['storage', 'db', 'worker', 'cache'].includes(group.kind) || r.region === group.region)) group.waiting++;
                }
            });
            return [...groups.values()].filter(g => g.waiting > 0).sort((a, b) =>
                b.waiting - a.waiting || (b.active / (b.slots || 1)) - (a.active / (a.slots || 1))
            );
        }
        summary() {
            return { time: this.time, users: this.users.length, buffering: this.users.filter(u => u.mode === 'watch' && u.buffer <= 0).length, queue: this.activeRequests().filter(r => r.status !== 'running').length, active: this.activeRequests().length, rebuffer: this.metrics.watchSeconds ? this.metrics.bufferSeconds / this.metrics.watchSeconds * 100 : 0, ...this.metrics };
        }
    }
    const api = { FrameStepper, World, NETWORKS, LADDER, TYPES, DESIGN_DEFAULTS, DESIGN_EFFECTS, normalizeDesign };
    if (typeof module !== 'undefined') module.exports = api;
    else host.YouTubeWorld = api;
})(typeof window === 'undefined' ? globalThis : window);
