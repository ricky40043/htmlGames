(() => {
    'use strict';
    const { World, NETWORKS, TYPES } = window.YouTubeWorld;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const clock = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    const kindName = k => ({ segment: '觀看片段', search: '搜尋', 'create-upload': '建立上傳', chunk: '上傳分塊', transcode: '轉碼任務', publish: '發布影片' })[k] || k;
    const stateName = s => ({ queued: '排隊', running: '進行中', retry: '等待重試', completed: '完成', failed: '失敗', cancelled: '已取消', ready: '可播放', creating: '建立中', uploading: '上傳中', processing: '轉碼中', acked: '已確認', pending: '待處理', sending: '傳送中' })[s] || s;
    window.mountYouTubeWorld = root => {
        document.body.classList.add('youtube-world-page');
        document.title = 'YouTube 系統設計遊樂園';
        let world = new World(14), selectedUser = 1, selectedMachine = null, paused = false, speed = 1, requestPage = 0, requestFilter = 'all', selectedRequest = null;
        let last = performance.now(), accumulator = 0, painted = 0, regionSignature = '', userSignature = '', machineSignature = '', videoSignature = '', inspectorSignature = '', requestPaint = 0;
        let dragging = null;
        const option = (id, label) => `<option value="${esc(id)}">${esc(label)}</option>`;
        root.innerHTML = `<section class="yw-app">
            <div class="yw-heading"><div><span class="yw-eyebrow">CHAPTER 14 / LIVE WORLD</span><h1>YouTube 系統設計遊樂園</h1><p>預設每個區域 1 位使用者持續活動。點一個人追蹤體驗，點一台機器查看與處理故障。</p></div><a href="system-design-simulator.html?chapter=sd-book-14&mode=lesson">12 月課程關卡 ↗</a></div>
            <div class="yw-toolbar" aria-label="世界控制"><button data-action="pause">暫停世界</button><button data-action="step">單步 0.1 秒</button><label>速度 <select id="yw-speed">${[1,5,20].map(n=>option(n,n+'x')).join('')}</select></label><strong id="yw-clock">00:00</strong><span>1x = 真實時間</span><label>種子 <input id="yw-seed" type="number" value="14" min="1" max="4294967295"></label><button data-action="reset">同種子重新開始</button><span id="yw-notice" role="status"></span></div>
            <div class="yw-metrics" id="yw-metrics"></div>
            <div class="yw-workspace"><div class="yw-main">
                <div class="yw-build"><label>人群所在地 <select id="yw-group-region"></select></label><button data-action="add-users">＋100 位使用者</button><label>新據點名稱 <input id="yw-region-name" maxlength="24" placeholder="例如：新加坡"></label><button data-action="add-region">建立服務據點</button></div>
                <div class="yw-options">${[['cdn','啟用 CDN 快取'],['arrivals','持續進出與使用'],['wander','觀眾隨機走動'],['autoFaults','定期隨機故障'],['autoRepair','25 秒後自動修復'],['resumable','保留已確認上傳塊'],['directUpload','预簽 URL 直接上傳']].map(([id,label])=>`<label><input type="checkbox" data-option="${id}" ${world.options[id]?'checked':''}>${label.replace('预','預')}</label>`).join('')}</div>
                <div class="yw-legend"><span>● 播放</span><span>◌ 緩衝／等待</span><span>↑ 上傳／轉碼</span><span>斜線區：最後一哩嚴重弱網</span><span id="yw-sampling"></span></div>
                <div class="yw-topology"><svg id="yw-links" class="yw-links" aria-hidden="true"></svg><div id="yw-regions" class="yw-regions"></div>
                <section class="yw-backend"><h2>共用後端 · 美國</h2><p>上傳 → 原檔 → 檢查 → 各畫質／縮圖 → Metadata 發布。機器狀態作用於同一世界。</p><div id="yw-backend-machines" class="yw-machine-list"></div></section></div>
                <section class="yw-panel"><div class="yw-section-title"><h2>影片與上傳生命週期</h2><button data-action="upload">讓選中的人上傳 96 MB</button></div><p class="yw-muted">教材用 multipart 模型：裝置分成 6 塊、同時傳 2 塊；確認後才保留。傳輸分塊與播放片段是不同單位。</p><div id="yw-videos"></div></section>
            </div><aside class="yw-inspector" aria-label="選中物件檢視器">
                <section class="yw-panel"><div class="yw-section-title"><h2>觀眾體驗</h2><button data-action="my-user">找我的角色</button></div>
                    <label>追蹤使用者 <select id="yw-user-select"></select></label>
                    <div class="yw-player" id="yw-player"><div class="yw-scene"><span class="yw-sun"></span><span class="yw-mountain"></span><span class="yw-road"></span><span id="yw-spinner">◌</span></div><div class="yw-player-caption"><strong id="yw-player-state"></strong><span id="yw-position"></span></div></div>
                    <div id="yw-user-stats" class="yw-detail"></div><div class="yw-buffer"><div id="yw-buffer-fill"></div></div>
                    <p id="yw-reason" class="yw-reason"></p><p id="yw-route" class="yw-route"></p>
                    <label>所在位置 <select id="yw-user-region"></select></label><label>服務路由 <select id="yw-user-route"></select></label><label>最後一哩網路 <select id="yw-network">${Object.entries(NETWORKS).map(([id,n])=>option(id,`${n.name} · ${n.mbps} Mbps`)).join('')}</select></label>
                    <div class="yw-button-row"><button data-action="weak">移入弱網區</button><button data-action="good">移出弱網區</button><button data-action="search">搜尋影片</button></div>
                    <label>可播放影片 <select id="yw-watch-video"></select></label><button data-action="watch">觀看選擇的影片</button>
                    <p class="yw-muted">示意播放器使用模擬片段與緩衝；不下載真實影片。切換追蹤對象不會重啟他們的 session。</p>
                </section>
                <section class="yw-panel" id="yw-machine-panel"><div class="yw-section-title"><h2>機器操作</h2><button data-action="clear-machine">返回觀眾</button></div><div id="yw-machine-detail">點選畫布上的機器查看。一般點擊只選取，不會關機。</div><div class="yw-button-row"><button data-action="toggle-machine" disabled>關閉／恢復機器</button><button data-action="add-machine" disabled>同區加一台</button></div><p class="yw-muted">故障偵測 2 秒；請求逾時後退避重試。轉碼失敗重新執行該任務，已完成的其他任務保留。</p></section>
            </aside></div>
            <section class="yw-panel"><div class="yw-section-title"><h2>Request 紀錄</h2><label>篩選 <select id="yw-request-filter">${[['all','全部'],['user','選中的使用者'],['machine','選中的機器'],['failed','失敗／重試']].map(x=>option(...x)).join('')}</select></label><button data-action="prev">上一頁</button><span id="yw-request-page"></span><button data-action="next">下一頁</button></div><p class="yw-muted">最新在前；保留最近 500 筆結束紀錄與所有進行中請求。點 Request ID 展開完整嘗試路徑。</p><div class="yw-table-wrap"><table><thead><tr><th>Request</th><th>模擬時間</th><th>使用者／影片</th><th>操作</th><th>狀態</th><th>進度</th><th>原因／路徑</th></tr></thead><tbody id="yw-requests"></tbody></table></div><div id="yw-request-detail"></div></section>
            <section class="yw-panel"><h2>事故與恢復時間軸</h2><p class="yw-muted">故障與發布事件持續保留，不會被每一段播放日誌洗掉。指標是模擬開始以來的量測，不是課程評分。</p><div id="yw-events" aria-live="off"></div></section>
        </section>`;
        const el = id => root.querySelector(`#yw-${id}`);
        const notice = text => { el('notice').textContent = text; };
        function selected() { return world.user(selectedUser) || world.user(1); }
        function syncSelectors() {
            const rs = world.regions.map(r=>option(r.id,r.name)).join('');
            const signature = world.regions.map(r=>r.id).join(',');
            if (signature !== regionSignature) {
                const currentGroup = el('group-region').value;
                el('group-region').innerHTML = rs; el('group-region').value = currentGroup || 'tw';
                el('user-region').innerHTML = rs; el('user-route').innerHTML = option('auto','依所在地區') + rs;
                el('regions').innerHTML = world.regions.map(r=>`<section class="yw-region" data-region="${esc(r.id)}"><div class="yw-region-title"><h2>${esc(r.name)}</h2><span data-region-count="${esc(r.id)}"></span></div><div class="yw-machine-list" data-region-machines="${esc(r.id)}"></div><div class="yw-crowd" data-crowd="${esc(r.id)}"><div class="yw-weak-zone">嚴重弱網 · 0.3 Mbps</div></div></section>`).join('');
                regionSignature = signature; machineSignature = ''; userSignature = '';
            }
            const us = world.users.map(u=>u.id).join(',');
            if (us !== userSignature) {
                el('user-select').innerHTML = world.users.map(u=>option(u.id,`${u.name} #${u.id}`)).join('');
                userSignature = us;
            }
            const vs = world.videos.filter(v=>v.status==='ready').map(v=>v.id).join(',');
            if (vs !== videoSignature) {
                const old = el('watch-video').value;
                el('watch-video').innerHTML = world.videos.filter(v=>v.status==='ready').map(v=>option(v.id,v.title)).join('');
                if (world.video(old)?.status === 'ready') el('watch-video').value = old;
                videoSignature = vs;
            }
        }
        function syncInspector(force = false) {
            const u = selected(); selectedUser = u.id;
            const signature = [u.id,u.region,u.route,u.network].join(':');
            if (force || signature !== inspectorSignature) {
                el('user-select').value = u.id; el('user-region').value = u.region; el('user-route').value = u.route; el('network').value = u.network;
                inspectorSignature = signature;
            }
        }
        function drawMachines() {
            const signature = world.machines.map(m=>m.id).join(',');
            if (signature !== machineSignature) {
                root.querySelectorAll('[data-region-machines]').forEach(container => {
                    container.innerHTML = world.machines.filter(m=>m.region===container.dataset.regionMachines && ['cdn','stream','api'].includes(m.kind)).map(machineButton).join('');
                });
                el('backend-machines').innerHTML = world.machines.filter(m=>!['cdn','stream','api'].includes(m.kind)).map(machineButton).join('');
                machineSignature = signature;
            }
            world.machines.forEach(m=>{
                const button = root.querySelector(`[data-machine="${m.id}"]`);
                button.classList.toggle('is-down',!m.up); button.classList.toggle('is-selected',selectedMachine===m.id);
                button.setAttribute('aria-pressed',selectedMachine===m.id);
                button.querySelector('small').textContent = !m.up ? '故障' : m.kind==='cdn' && !world.options.cdn ? '未啟用' : `${m.active}/${m.slots} 工作中 · 等待 ${m.queued}`;
            });
            const m = world.machines.find(m=>m.id===selectedMachine);
            root.querySelector('.yw-inspector').classList.toggle('has-machine',!!m);
            root.querySelector('[data-action="toggle-machine"]').disabled = !m;
            root.querySelector('[data-action="add-machine"]').disabled = !m;
            if (m) {
                el('machine-detail').innerHTML = `<strong>${esc(TYPES[m.kind])} ${esc(m.id)}</strong><p>${esc(world.regions.find(r=>r.id===m.region).name)} · ${m.up?'運作中':world.time<m.detectedAt?'故障，健康檢查尚未移除':'故障，已移出分流'}</p><p>工作 ${m.active}/${m.slots} · 排隊 ${m.queued}<br>吞吐 ${m.throughput.toFixed(1)} / ${m.capacity} ${m.kind==='worker'?'工作量/秒':'Mbps'}</p>`;
                root.querySelector('[data-action="toggle-machine"]').textContent = m.up ? '關閉這台機器' : '恢復這台機器';
            }
        }
        function machineButton(m) { return `<button class="yw-machine" data-machine="${m.id}" aria-pressed="false"><strong>${esc(TYPES[m.kind])} #${m.id.split('-')[1]}</strong><small></small></button>`; }
        function drawUsers() {
            const visible = world.users.slice(0,100);
            if (!visible.some(u=>u.id===selectedUser)) visible.push(selected());
            const ids = new Set(visible.map(u=>String(u.id)));
            root.querySelectorAll('[data-user]').forEach(b=>{ if (!ids.has(b.dataset.user)) b.remove(); });
            world.regions.forEach(r=>{
                root.querySelector(`[data-region-count="${r.id}"]`).textContent = `${world.users.filter(u=>u.region===r.id).length} 人 · 已服務 ${r.served.size} 位`;
            });
            visible.forEach(u=>{
                let b = root.querySelector(`[data-user="${u.id}"]`);
                const crowd = root.querySelector(`[data-crowd="${u.region}"]`);
                if (!b) { b = document.createElement('button'); b.className='yw-person'; b.dataset.user=u.id; crowd.appendChild(b); }
                if (b.parentElement!==crowd && dragging?.id!==u.id) crowd.appendChild(b);
                if (dragging?.id!==u.id) { b.style.left=`${u.x*100}%`; b.style.top=`${u.y*100}%`; }
                b.textContent = u.id===1?'我':u.mode==='upload'?'↑':u.mode==='search'?'?':u.buffer<=0?'◌':'●';
                b.classList.toggle('is-waiting',u.mode==='watch'&&u.buffer<=0); b.classList.toggle('is-selected',u.id===selectedUser);
                b.setAttribute('aria-label',`${u.name}，${u.status}，${u.quality}`); b.title=`${u.name} · ${u.status}`;
            });
            el('sampling').textContent = world.users.length>100 ? `畫面抽樣 100 人；指標計算全部 ${world.users.length} 人` : '所有使用者均在世界中';
        }
        function drawRoute() {
            const u = selected(), r = world.requests.find(r => r.id === u.pending) || world.activeRequests().find(r => r.userId === u.id && r.kind !== 'transcode');
            const svg = el('links'), box = svg.parentElement.getBoundingClientRect();
            svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
            const source = root.querySelector(`[data-user="${u.id}"]`);
            const machines = (r?.machines || []).map(id => root.querySelector(`[data-machine="${id}"]`)).filter(Boolean);
            const nodes = r?.kind === 'segment' ? [...machines].reverse().concat(source) : [source, ...machines];
            if (!r || !machines.length || !source) { svg.innerHTML = ''; el('route').textContent = r ? '路徑等待分配：' + r.reason : '目前沒有進行中的觀眾請求'; return; }
            const points = nodes.map(n => { const rect = n.getBoundingClientRect(); return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top }; });
            const color = r.kind === 'segment' ? '#74e5c5' : '#f4a4d8';
            const pointsText = points.map(p => `${p.x},${p.y}`).join(' ');
            const progress = Math.min(.999, Math.max(0, r.sent / r.size));
            const lengths = points.slice(1).map((p,i) => Math.hypot(p.x-points[i].x,p.y-points[i].y));
            let distance = lengths.reduce((a,b)=>a+b,0)*progress, point=points[0];
            for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=lengths[i]?distance/lengths[i]:0;point={x:points[i].x+(points[i+1].x-points[i].x)*f,y:points[i].y+(points[i+1].y-points[i].y)*f};break;}distance-=lengths[i];}
            svg.innerHTML = `<polyline points="${pointsText}" fill="none" stroke="${color}" stroke-width="2" opacity=".55" stroke-dasharray="5 5"/><circle cx="${point.x}" cy="${point.y}" r="5" fill="${color}" stroke="#142234" stroke-width="2"/>`;
            el('route').textContent = `${r.id} · ${r.kind === 'segment' ? (r.cacheHit ? 'CDN 命中' : '回源') : kindName(r.kind)}：${(r.kind === 'segment' ? world.resources(r).slice().reverse().map(m => TYPES[m.kind] + ' #' + m.id.split('-')[1]).concat(u.name) : [u.name, ...world.resources(r).map(m => TYPES[m.kind] + ' #' + m.id.split('-')[1])]).join(' → ')}。線上的圓點依此請求進度前進。`;
        }
        function drawVideos() {
            const recent=world.videos.slice(-12).reverse();
            const vids=[...world.videos.filter(v=>v.owner===selectedUser&&!recent.includes(v)),...recent];
            const html=vids.map(v=>`<article class="yw-video"><div><strong>${esc(v.title)}</strong><span>${esc(v.id)} · ${stateName(v.status)}</span></div>${v.chunks.length?`<p>${esc(v.sessionId)} · ${v.chunks.filter(c=>c.status==='acked').length}/6 塊已確認 · 原檔 ${v.sizeMB} MB</p><div class="yw-chunks">${v.chunks.map(c=>`<span class="chunk-${c.status}">${c.part+1} ${stateName(c.status)}</span>`).join('')}</div><div class="yw-jobs">${v.jobs.map(j=>`<span>${esc(j.id)}：${stateName(j.status)}</span>`).join('')}</div>`:''}<p>已就緒畫質：${v.renditions.join(' / ')||'尚未完成'}</p>${v.status==='ready'?`<button data-watch="${v.id}">讓選中的人觀看</button>`:`<button data-retry-upload="${v.id}">重試失敗的塊／任務</button>`}</article>`).join('');
            if (el('videos').dataset.html!==html) { const focused = el('videos').contains(document.activeElement) ? document.activeElement.dataset : null; const watchId=focused?.watch,retryId=focused?.retryUpload; el('videos').innerHTML=html; el('videos').dataset.html=html; if(watchId)root.querySelector(`[data-watch="${watchId}"]`)?.focus({preventScroll:true}); if(retryId)root.querySelector(`[data-retry-upload="${retryId}"]`)?.focus({preventScroll:true}); }
        }
        function filteredRequests() {
            return world.requests.filter(r=>requestFilter==='all'||requestFilter==='user'&&r.userId===selectedUser||requestFilter==='machine'&&(r.machines.includes(selectedMachine)||r.history.some(h=>h.text.includes(selectedMachine||'__none__')))||requestFilter==='failed'&&(r.status==='failed'||r.status==='retry'));
        }
        function drawRequests() {
            const rows=filteredRequests(); requestPage=Math.min(requestPage,Math.max(0,Math.ceil(rows.length/20)-1));
            el('request-page').textContent=`${requestPage+1}/${Math.max(1,Math.ceil(rows.length/20))} 頁 · ${rows.length} 筆`;
            if (!el('requests').contains(document.activeElement)) el('requests').innerHTML=rows.slice(requestPage*20,requestPage*20+20).map(r=>`<tr><td><button data-request="${r.id}">${r.id}</button></td><td>${clock(r.createdAt)}</td><td>${r.userId?`#${r.userId}`:'後端'}<br>${esc(r.videoId)}</td><td>${kindName(r.kind)}</td><td>${stateName(r.status)}</td><td>${Math.round((r.size-r.remaining)/r.size*100)}%</td><td>${esc(r.reason)}<br><small>${esc(r.machines.join(' → '))}</small></td></tr>`).join('')||'<tr><td colspan="7">沒有符合條件的請求</td></tr>';
            const r=world.requests.find(r=>r.id===selectedRequest);
            el('request-detail').innerHTML=r?`<h3>${r.id} · ${kindName(r.kind)}</h3><p>使用者 #${r.userId??'後端'} · ${esc(r.videoId)} · ${esc(r.quality||r.jobId||'')} ${r.part!=null?'分塊 '+(r.part+1):''}</p><ol>${r.history.map(h=>`<li>${clock(h.at)} ${esc(h.text)}</li>`).join('')}</ol>`:selectedRequest?'<p>此請求已超過保留範圍。</p>':'';
        }
        function paint(force = false) {
            syncSelectors(); syncInspector(force); drawMachines(); drawUsers(); drawRoute();
            const s=world.summary(),u=selected();
            el('clock').textContent=clock(world.time)+'.'+Math.round((world.time%1)*10);
            el('metrics').innerHTML=[['活躍使用者',s.users+' 人'],['緩衝／等待',s.buffering+' 人'],['請求佇列',s.queue+' 筆'],['再緩衝比例',s.rebuffer.toFixed(1)+'%'],['完成／失敗嘗試',`${s.completed} / ${s.failed}`],['跨區傳輸',s.crossRegionMB.toFixed(1)+' MB']].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
            el('player-state').textContent=`${u.name} · ${u.status} · ${u.quality}`;
            el('position').textContent=clock(u.position);
            el('player').classList.toggle('is-buffering',u.mode==='watch'&&u.buffer<=0);
            el('player').classList.toggle('is-stopped',paused||u.mode!=='watch'||u.buffer<=0);
            el('player').style.setProperty('--road-offset',`${(u.position*15)%80}px`);
            el('user-stats').innerHTML=`<span>緩衝 <strong>${u.buffer.toFixed(1)} 秒</strong></span><span>下段 <strong>${u.nextQuality}</strong></span><span>實測 <strong>${u.measured.toFixed(2)} Mbps</strong></span><span>最後一哩 <strong>${world.network(u).mbps} Mbps</strong></span>`;
            el('buffer-fill').style.width=`${Math.min(100,u.buffer/15*100)}%`;
            el('reason').textContent=`${u.zone?'身在弱網區。':''}${u.reason||'準備開始播放'}。${u.pending?'目前 '+u.pending:''}`;
            root.querySelector('[data-action="pause"]').textContent=paused?'繼續世界':'暫停世界';
            if (force||performance.now()-requestPaint>750) {
                drawVideos();drawRequests();
                el('events').innerHTML=world.incidents.slice(0,30).map(e=>`<article class="yw-event"><time>${clock(e.at)}</time><div><strong>${esc(e.title)}</strong>${e.machineId?`<p>已確認受影響 ${e.affected.size} 人 · ${e.failedRequests} 次失敗${e.recoveredAt!=null?` · ${clock(e.recoveredAt)} 恢復，歷時 ${(e.recoveredAt-e.at).toFixed(1)} 秒`:' · 處理中'}</p>`:''}</div></article>`).join('')||'<p>世界運作中。可手動關機；自動故障首次在第 45 秒發生。</p>';
                requestPaint=performance.now();
            }
        }
        root.addEventListener('change',e=>{
            const u=selected(),id=e.target.id;
            if (e.target.dataset.option) world.options[e.target.dataset.option]=e.target.checked;
            if (id==='yw-speed') speed=Number(e.target.value);
            if (id==='yw-user-select') selectedUser=Number(e.target.value);
            if (id==='yw-user-region') world.moveUser(u.id,e.target.value,u.x,u.y);
            if (id==='yw-user-route') u.route=e.target.value;
            if (id==='yw-network') { u.network=e.target.value; if (u.zone) notice('目前身在弱網區；移出後才使用手選網路（離線優先）。'); }
            if (id==='yw-request-filter') { requestFilter=e.target.value;requestPage=0; }
            paint(true);
        });
        root.addEventListener('click',e=>{
            const b=e.target.closest('button'); if(!b)return;
            if (b.dataset.user) { if (b.dataset.dragged) { delete b.dataset.dragged;return; } selectedUser=Number(b.dataset.user); }
            if (b.dataset.machine) selectedMachine=b.dataset.machine;
            if (b.dataset.request) selectedRequest=b.dataset.request;
            if (b.dataset.watch) world.watch(selectedUser,b.dataset.watch);
            if (b.dataset.retryUpload) world.retryUpload(b.dataset.retryUpload);
            const u=selected(),m=world.machines.find(m=>m.id===selectedMachine);
            switch(b.dataset.action) {
                case 'pause': paused=!paused;accumulator=0;break;
                case 'step': paused=true;world.step(0.1);accumulator=0;break;
                case 'reset': world=new World(Number(el('seed').value));selectedUser=1;selectedMachine=null;selectedRequest=null;requestPage=0;paused=true;accumulator=0;regionSignature='';videoSignature='';inspectorSignature='';root.querySelectorAll('[data-option]').forEach(c=>{c.checked=world.options[c.dataset.option];});el('machine-detail').textContent='點選機器查看';notice('已用同種子重置世界，暫停中。');break;
                case 'my-user': selectedUser=1;selectedMachine=null;break;
                case 'clear-machine': selectedMachine=null;break;
                case 'weak': world.moveUser(u.id,u.region,.78,.75);break;
                case 'good': world.moveUser(u.id,u.region,.25,.3);break;
                case 'search': world.search(u.id);break;
                case 'watch': world.watch(u.id,el('watch-video').value);break;
                case 'upload': notice(world.upload(u.id)?'已建立上傳；在影片生命週期查看每一塊與轉碼任務。':'此人正在上傳，或進行中影片已達上限。');break;
                case 'add-users': world.addUsers(100,el('group-region').value);notice(`世界共 ${world.users.length} 人（上限 500），包含我的角色。`);break;
                case 'add-region': notice(world.addRegion(el('region-name').value)?'服務據點已建立；人口位置不變，可調整服務路由。':'請輸入不重複名稱，最多 6 個據點。');break;
                case 'toggle-machine': if(m)world.setMachine(m.id,!m.up);break;
                case 'add-machine': if(m)notice(world.addMachine(m.kind,m.region)?'已新增同區機器，共用佇列開始分流。':'同類機器每區最多 8 台。');break;
                case 'prev': requestPage=Math.max(0,requestPage-1);break;
                case 'next': requestPage++;break;
            }
            paint(true);
        });
        root.addEventListener('pointerdown',e=>{
            const b=e.target.closest('[data-user]');if(!b||e.button!==0)return;
            dragging={id:Number(b.dataset.user),startX:e.clientX,startY:e.clientY,button:b};b.setPointerCapture(e.pointerId);
        });
        root.addEventListener('pointermove',e=>{
            if(!dragging)return;
            if(Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)<5)return;
            dragging.button.dataset.dragged='true';
            const crowd=[...root.querySelectorAll('[data-crowd]')].find(c=>{const r=c.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});
            if(crowd){const r=crowd.getBoundingClientRect();world.moveUser(dragging.id,crowd.dataset.crowd,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);}
        });
        const endDrag=()=>{if(!dragging)return;selectedUser=dragging.id;dragging=null;paint(true);};
        root.addEventListener('pointerup',endDrag);root.addEventListener('pointercancel',endDrag);
        document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;});
        function frame(now) {
            if (!root.isConnected) return;
            const dt=Math.min(.25,(now-last)/1000);last=now;
            if(!paused&&!document.hidden){accumulator+=dt*speed;while(accumulator>=.1){world.step(.1);accumulator-=.1;}}
            if(now-painted>250){paint();painted=now;}requestAnimationFrame(frame);
        }
        paint(true);requestAnimationFrame(frame);
    };
})();
