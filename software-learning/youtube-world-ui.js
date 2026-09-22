(() => {
    'use strict';
    const { World, FrameStepper, NETWORKS, TYPES } = window.YouTubeWorld;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const clock = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    const kindName = k => ({ segment: '觀看片段', search: '搜尋', 'create-upload': '建立上傳', chunk: '上傳分塊', transcode: '轉碼任務', publish: '發布影片' })[k] || k;
    const stateName = s => ({ queued: '排隊', running: '進行中', retry: '等待重試', completed: '完成', failed: '失敗', cancelled: '已取消', ready: '可播放', creating: '建立中', uploading: '上傳中', processing: '轉碼中', acked: '已確認', pending: '待處理', sending: '傳送中' })[s] || s;
    window.mountYouTubeWorld = root => {
        document.body.classList.add('youtube-world-page');
        document.title = 'YouTube 系統設計遊樂園';
        // 架構設計模式選了什麼，這裡就照著開機器。沒玩過課程模式時 design 為 null，
        // 世界模型會退回自己的預設值，行為與以前相同。
        let design = window.YouTubeModes?.loadDesign() || null;
        let world = new World(14, 1, design), selectedUser = 1, selectedMachine = null, paused = false, speed = 1, requestPage = 0, requestFilter = 'all', selectedRequest = null;
        let last = performance.now(), painted = 0, regionSignature = '', userSignature = '', machineSignature = '', videoSignature = '', inspectorSignature = '', requestPaint = 0;
        let pacing = new FrameStepper(), rateElapsed = 0, rateTicks = 0, actualSpeed = 0;
        let pressure = [];
        let inspectorTab = 'user', operationFilter = 'all', lastBatch = null;

        let dragging = null;
        const savedMode = window.YouTubeModes?.load();
        const peerMode = window.YouTubeModes?.loadPeer();
        const incomingWorld = peerMode?.sharedWorld || peerMode?.world || savedMode?.world;
        if (incomingWorld?.users?.length) {
            world = World.hydrate(incomingWorld, design);
            selectedUser = world.user(savedMode?.selectedUser)?.id || world.users[0]?.id || 1;
            selectedMachine = savedMode?.selectedMachine || null;
            selectedRequest = savedMode?.selectedRequest || null;
            speed = savedMode?.speed || 1;
            pacing = new FrameStepper(peerMode?.sharedPending ?? savedMode?.pending ?? 0);
            paused = true;
            window.YouTubeModes.notice(peerMode ? '已接手月份課程的同一個世界，暫停中；人數、機器與 Request 都已同步。' : '已恢復實際運作進度，暫停中；按「繼續世界」接著觀察。');
        }
        window.YouTubeModes?.register(() => ({ world, selectedUser, selectedMachine, selectedRequest, speed, pending: pacing.pending }));
        const option = (id, label) => `<option value="${esc(id)}">${esc(label)}</option>`;
        root.innerHTML = `<section class="yw-app">
            <div class="yw-heading"><div><span class="yw-eyebrow">CHAPTER 14 / LIVE WORLD</span><h1>YouTube 系統設計遊樂園</h1><p>全場預設只有我的角色 1 人，每次可新增 1～10 人。點一個人追蹤體驗，點一台機器查看與處理故障。</p><strong id="yw-shared-month"></strong></div><a href="system-design-simulator.html?chapter=sd-book-14">12 月課程與完整架構 ↗</a></div>
            <section class="yw-design" id="yw-design" aria-label="套用中的架構設計"></section>
            <div class="yw-toolbar" aria-label="世界控制"><button data-action="pause">暫停世界</button><button data-action="step">單步 0.1 秒</button><label>速度 <select id="yw-speed">${[1,5,20].map(n=>option(n,n+'x')).join('')}</select></label><strong id="yw-clock">00:00</strong><span id="yw-pacing">1x = 真實時間</span><label>種子 <input id="yw-seed" type="number" value="14" min="1" max="4294967295"></label><button data-action="reset">同種子重新開始</button><span id="yw-notice" role="status"></span></div>
            <div class="yw-metrics" id="yw-metrics"></div>
            <section class="yw-capacity" aria-label="容量觀察"><strong id="yw-bottleneck"></strong><p id="yw-capacity-detail"></p><button data-action="inspect-bottleneck">查看瓶頸機器</button><p>500 人是操作上限，不是預設容量保證。只加前端可能讓更多請求擠向共用後端；加機後請觀察等待數與再緩衝是否改善。</p></section>
            <div class="yw-workspace"><div class="yw-main">
                <div class="yw-build"><label>人群所在地 <select id="yw-group-region"></select></label><label>新增人數 <select id="yw-add-count">${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1} 人</option>`).join('')}</select></label><button data-action="add-users">新增使用者</button><label>新據點名稱 <input id="yw-region-name" maxlength="24" placeholder="例如：新加坡"></label><button data-action="add-region">建立服務據點</button></div>
                <div class="yw-options">${[['cdn','啟用 CDN 快取'],['arrivals','持續進出與使用'],['wander','觀眾隨機走動'],['autoFaults','定期隨機故障'],['autoRepair','25 秒後自動修復'],['resumable','保留已確認上傳塊'],['directUpload','预簽 URL 直接上傳']].map(([id,label])=>`<label><input type="checkbox" data-option="${id}" ${world.options[id]?'checked':''}>${label.replace('预','預')}</label>`).join('')}</div>
                <div class="yw-legend"><span>● 播放</span><span>◌ 緩衝／等待</span><span>↑ 上傳／轉碼</span><span>斜線區：最後一哩嚴重弱網</span><span id="yw-sampling"></span></div>
                <div class="yw-topology"><svg id="yw-links" class="yw-links" aria-hidden="true"></svg><div id="yw-regions" class="yw-regions"></div>
                <section class="yw-backend"><h2>共用後端 · 美國</h2><p>上傳 → 原檔 → 檢查 → 各畫質／縮圖 → Metadata 發布。機器狀態作用於同一世界。物件儲存、Metadata DB、轉碼 Worker 與快取也能加機：點選下方機器，再按「同區加一台」。</p><div id="yw-backend-machines" class="yw-machine-list"></div></section></div>
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
        // Keep the map, selection details and ledger together; settings remain available below.
        const app = root.querySelector('.yw-app');
        const toolbar = root.querySelector('.yw-toolbar');
        const workspace = root.querySelector('.yw-workspace');
        const inspector = root.querySelector('.yw-inspector');
        const ledger = el('requests').closest('.yw-panel');
        ledger.classList.add('yw-ledger');
        const advanced = document.createElement('details');
        advanced.className = 'yw-advanced';
        advanced.innerHTML = '<summary>架構設定、環境與進階控制</summary>';
        const designSection = el('design');
        advanced.append(designSection, root.querySelector('.yw-options'), root.querySelector('.yw-build'));
        advanced.append(el('seed').closest('label'), root.querySelector('[data-action="reset"]'));
        const videos = el('videos').closest('.yw-panel');
        const videoDetails = document.createElement('details');
        videoDetails.className = 'yw-advanced'; videoDetails.innerHTML = '<summary>影片、分塊與轉碼紀錄</summary>'; videoDetails.append(videos);
        const incidents = el('events').closest('.yw-panel');
        const incidentDetails = document.createElement('details');
        incidentDetails.className = 'yw-advanced'; incidentDetails.innerHTML = '<summary>事故與恢復時間軸</summary>'; incidentDetails.append(incidents);
        app.append(advanced, videoDetails, incidentDetails);
        const quick = document.createElement('div'); quick.className = 'yw-quick-actions';
        quick.append(el('group-region').closest('label'), el('add-count').closest('label'), root.querySelector('[data-action="add-users"]'));
        for (const action of ['watch','upload','search']) quick.append(root.querySelector(`[data-action="${action}"]`));
        toolbar.after(quick);
        root.querySelector('.yw-heading p').textContent = '選機器看容量，選請求看路徑；拖曳分隔線調整圖面與紀錄。';
        root.querySelector('.yw-capacity > p:last-child').remove();
        const userPanel = inspector.querySelector('.yw-panel'); userPanel.dataset.inspectorPane = 'user';
        el('machine-panel').dataset.inspectorPane = 'machine';
        const requestPanel = document.createElement('section'); requestPanel.className = 'yw-panel'; requestPanel.dataset.inspectorPane = 'request';
        requestPanel.innerHTML = '<h2>選中請求</h2><p>點下方 Request ID，這裡會列出每次失敗與重試路徑。</p>';
        requestPanel.append(el('request-detail')); inspector.append(requestPanel);
        const tabs = document.createElement('div'); tabs.className = 'yw-inspector-tabs'; tabs.setAttribute('role','tablist');
        tabs.innerHTML = [['user','觀眾'],['machine','機器'],['request','請求']].map(([id,label])=>`<button role="tab" data-inspector-tab="${id}">${label}</button>`).join('');
        inspector.prepend(tabs);
        const selectInspector = tab => {
            inspectorTab = tab;
            inspector.querySelectorAll('[data-inspector-pane]').forEach(panel=>{panel.hidden=panel.dataset.inspectorPane!==tab;});
            tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-selected',button.dataset.inspectorTab===tab));
        };
        tabs.onclick = event => { const tab=event.target.closest('[data-inspector-tab]');if(tab)selectInspector(tab.dataset.inspectorTab); };
        selectInspector('user');
        const apiControls = document.createElement('section'); apiControls.id='yw-api-controls'; apiControls.hidden=true;
        apiControls.innerHTML = `<h3>API 容量實驗</h3><label>並行上限 <input id="yw-api-slots" type="number" min="1" max="64" value="2"></label><label>總吞吐 Mbps <input id="yw-api-rate" type="number" min="0.1" max="1000" step="0.1" value="2"></label><label>等待逾時 秒 <input id="yw-api-timeout" type="number" min="0.1" max="60" step="0.1" value="2"></label><button data-action="configure-api">套用到這台 API</button><label>查詢數量 <input id="yw-api-count" type="number" min="1" max="100" value="10"></label><button data-action="burst-api">同時送出查詢</button><p class="yw-muted">每筆模擬 0.5 MB 回應，同區健康 API 分流；等待超過設定時間會失敗並退避重試。調高容量或加機器，再比較同一批請求。</p><div id="yw-api-results" role="status"></div>`;
        el('machine-detail').after(apiControls);
        const machineHelp=el('machine-panel').querySelector(':scope > .yw-muted');
        const help=document.createElement('details');help.innerHTML='<summary>故障與重試規則</summary>';if(machineHelp){machineHelp.before(help);help.append(machineHelp);}
        const operationSelect=document.createElement('label'); operationSelect.innerHTML='<span>操作</span><select id="yw-operation-filter"><option value="all">全部</option><option value="watch">觀看</option><option value="upload">上傳</option><option value="search">查詢</option></select>';
        ledger.querySelector('.yw-section-title').append(operationSelect);
        el('request-filter').insertAdjacentHTML('beforeend','<option value="batch">最近 API 壓測</option>');
        const labButton=document.createElement('button');labButton.dataset.action='api-lab';labButton.textContent='API 壓力測試';quick.append(labButton);
        function resizeHandle(axis, container, before, property, initial, min, max) {
            const handle=document.createElement('div');handle.className=`yw-resize yw-resize-${axis}`;handle.tabIndex=0;handle.setAttribute('role','separator');
            handle.setAttribute('aria-label',axis==='x'?'調整圖面與檢視器寬度':'調整 LOG 高度');handle.setAttribute('aria-orientation',axis==='x'?'vertical':'horizontal');
            handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);
            let value=initial,start=null;
            const key=`youtube-world-layout:${property}`;
            try { const saved=Number(localStorage.getItem(key));if(saved>=min&&saved<=max)value=saved; }catch{}
            const apply=next=>{value=Math.max(min,Math.min(max,next));app.style.setProperty(property,axis==='x'?`${value}%`:`${value}px`);handle.setAttribute('aria-valuenow',Math.round(value));};
            const save=()=>{try{localStorage.setItem(key,value);}catch{}};
            handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();start={x:event.clientX,y:event.clientY,value};handle.setPointerCapture(event.pointerId);};
            handle.onpointermove=event=>{if(!start)return;apply(start.value+(axis==='x'?-(event.clientX-start.x)/workspace.clientWidth*100:event.clientY-start.y));};
            handle.onpointerup=()=>{start=null;save();};handle.onpointercancel=()=>{start=null;save();};handle.onlostpointercapture=()=>{start=null;};
            handle.onkeydown=event=>{const delta=axis==='x'?{ArrowLeft:2,ArrowRight:-2}[event.key]:{ArrowUp:-24,ArrowDown:24}[event.key];if(delta!=null){event.preventDefault();apply(value+delta);save();}};
            handle.ondblclick=()=>{apply(initial);save();};container.insertBefore(handle,before);apply(value);
        }
        resizeHandle('x',workspace,inspector,'--inspector-width',34,28,58);
        resizeHandle('y',app,ledger,'--ledger-height',260,140,700);
        const fold = (nodes, title, before) => {
            const details=document.createElement('details');details.className='yw-simple-details';
            details.innerHTML=`<summary>${title}</summary>`;before.before(details);
            nodes.filter(Boolean).forEach(node=>details.append(node));return details;
        };
        fold([root.querySelector('.yw-resize-y'),ledger], '查看 LOG：觀看、上傳、查詢', ledger);
        fold([el('metrics')], '查看整體數值', el('metrics'));
        const extraActions=document.createElement('details');extraActions.className='yw-simple-details';extraActions.innerHTML='<summary>更多操作與時間控制</summary>';quick.after(extraActions);
        for(const action of ['watch','search','api-lab','step'])extraActions.append(root.querySelector(`[data-action="${action}"]`));
        extraActions.append(el('pacing'));
        el('speed').closest('label').firstChild.textContent='播放速度 ';
        quick.append(el('speed').closest('label'));
        fold([el('user-stats'),el('route'),...userPanel.querySelectorAll(':scope > label'),...userPanel.querySelectorAll(':scope > .yw-button-row'),userPanel.querySelector(':scope > .yw-muted')], '查看網路數值與觀眾設定', el('user-stats'));
        root.querySelector('.yw-heading p').textContent='先新增觀眾，再點選圖上的人或機器。新增的人會在此圖出現，並共用這些機器的容量。';
        new ResizeObserver(()=>app.style.setProperty('--toolbar-height',`${toolbar.offsetHeight}px`)).observe(toolbar);
        const originalMachineClick = id => {
            selectedMachine=id;selectInspector('machine');
            const m=world.machines.find(machine=>machine.id===id);
            if(m?.kind==='api'){el('api-slots').value=m.slots;el('api-rate').value=m.capacity;el('api-timeout').value=m.queueTimeout??12;}
        };
        window.__worldWorkbench = { get world(){return world;}, get paused(){return paused;}, paint:()=>paint(true) };
        const topology = root.querySelector('.yw-topology');
        // 把世界正在套用的那份架構攤開來講清楚：哪一項、選了什麼、在這個世界裡代表什麼。
        // 沒有來自課程模式的設定時，也要明說現在跑的是預設架構，而不是留白讓人猜。
        function renderDesign() {
            const { DESIGN_EFFECTS, DESIGN_DEFAULTS } = window.YouTubeWorld;
            const applied = world.design;
            const fromLesson = !!design;
            const rows = Object.keys(DESIGN_DEFAULTS).map(key => {
                const effect = DESIGN_EFFECTS[key][applied[key]];
                const isDefault = applied[key] === DESIGN_DEFAULTS[key];
                return `<li${isDefault ? '' : ' class="yw-design-changed"'}><strong>${esc(effect.label)}</strong><span>${esc(effect.note)}</span></li>`;
            }).join('');
            el('design').innerHTML = `<div class="yw-design-head">
                <div><h2>套用中的架構</h2><p>${fromLesson
                    ? '這些是你在「12 月策略課程」那 12 個月裡做的決策，已套用下列初始配置；世界中的故障與實驗設定另外保留。改了決策再回來，按「同種子重新開始」就會套用新的架構。'
                    : '你還沒在「12 月策略課程」做過決策，所以這個世界跑的是預設架構。去那邊選完再回來，這裡就會換成你的版本。'}</p></div>
                <div class="yw-design-actions">
                    <a class="yw-design-link" href="system-design-simulator.html?chapter=sd-book-14&mode=lesson">${fromLesson ? '回去調整架構 ↗' : '去做架構決策 ↗'}</a>
                    ${fromLesson ? '<button type="button" data-action="use-default-design">改用預設架構</button>' : ''}
                </div>
            </div><ul class="yw-design-list">${rows}</ul>`;
        }
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
                button.classList.toggle('is-route',!!selectedRequest && world.requests.find(r=>r.id===selectedRequest)?.machines.includes(m.id));
                button.classList.toggle('is-bottleneck',pressure[0]?.machineIds.includes(m.id) || false);
                button.classList.toggle('is-down',!m.up); button.classList.toggle('is-selected',selectedMachine===m.id);
                button.setAttribute('aria-pressed',selectedMachine===m.id);
                button.querySelector('small').textContent = (pressure[0]?.machineIds.includes(m.id) ? '瓶頸 · ' : '') + (!m.up ? '故障' : m.kind==='cdn' && !world.options.cdn ? '未啟用' : `處理 ${m.active}／${m.slots} · 排隊 ${m.queued} 筆`);
            });
            const m = world.machines.find(m=>m.id===selectedMachine);
            root.querySelector('.yw-inspector').classList.toggle('has-machine',!!m);
            root.querySelector('[data-action="toggle-machine"]').disabled = !m;
            root.querySelector('[data-action="add-machine"]').disabled = !m;
            el('api-controls').hidden = m?.kind !== 'api';
            if (lastBatch) {
                const batch=world.requests.filter(request=>request.batch===lastBatch);
                el('api-results').textContent=`${lastBatch} · ${batch.filter(r=>r.status==='running').length} 處理 · ${batch.filter(r=>r.status==='queued').length} 排隊 · ${batch.filter(r=>r.status==='retry').length} 等待重試 · ${batch.filter(r=>r.status==='completed').length} 完成 · ${batch.filter(r=>r.status==='failed').length} 最終失敗 · ${batch.reduce((n,r)=>n+(r.retries||0),0)} 次失敗嘗試`;
            }
            if (m) {
                const waiting = world.activeRequests().filter(r=>r.status!=='running' && r.retryAt<=world.time && r.reason.startsWith(TYPES[m.kind]+' 容量滿') && (m.region==='us' && !['api','stream','cdn'].includes(m.kind) || r.region===m.region));
                const oldest = Math.max(0,...waiting.map(r=>world.time-(r.waitSince??r.createdAt)));
                el('machine-detail').innerHTML = `<strong>${esc(TYPES[m.kind])} ${esc(m.id)}</strong><p>${esc(world.regions.find(r=>r.id===m.region).name)} · ${m.up?'運作中':world.time<m.detectedAt?'故障，健康檢查尚未移除':'故障，已移出分流'}</p><p>處理中 ${m.active}/${m.slots} · 排隊 ${m.queued} · 最久等待 ${oldest.toFixed(1)} 秒<br>吞吐 ${m.throughput.toFixed(1)} / ${m.capacity} ${m.kind==='worker'?'工作量/秒':'Mbps'}</p>`;
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
            const u = selected(), r = world.requests.find(r => r.id === selectedRequest) || world.requests.find(r => r.id === u.pending) || world.activeRequests().find(r => r.userId === u.id && r.kind !== 'transcode');
            const svg = el('links'), box = svg.parentElement.getBoundingClientRect();
            svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
            const source = r?.loadTest ? root.querySelector(`[data-region="${r.region}"] .yw-region-title`) : root.querySelector(`[data-user="${r?.userId || u.id}"]`);
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
            el('route').textContent = `${r.id} · ${r.kind === 'segment' ? (r.cacheHit ? 'CDN 命中' : '回源') : kindName(r.kind)}：${(r.kind === 'segment' ? world.resources(r).slice().reverse().map(m => TYPES[m.kind] + ' #' + m.id.split('-')[1]).concat(u.name) : [r.loadTest?'壓測客戶端':world.user(r.userId)?.name||u.name, ...world.resources(r).map(m => TYPES[m.kind] + ' #' + m.id.split('-')[1])]).join(' → ')}。線上的圓點依此請求進度前進。`;
        }
        function drawVideos() {
            const recent=world.videos.slice(-12).reverse();
            const vids=[...world.videos.filter(v=>v.owner===selectedUser&&!recent.includes(v)),...recent];
            const html=vids.map(v=>`<article class="yw-video"><div><strong>${esc(v.title)}</strong><span>${esc(v.id)} · ${stateName(v.status)}</span></div>${v.chunks.length?`<p>${esc(v.sessionId)} · ${v.chunks.filter(c=>c.status==='acked').length}/6 塊已確認 · 原檔 ${v.sizeMB} MB</p><div class="yw-chunks">${v.chunks.map(c=>`<span class="chunk-${c.status}">${c.part+1} ${stateName(c.status)}</span>`).join('')}</div><div class="yw-jobs">${v.jobs.map(j=>`<span>${esc(j.id)}：${stateName(j.status)}</span>`).join('')}</div>`:''}<p>已就緒畫質：${v.renditions.join(' / ')||'尚未完成'}</p>${v.status==='ready'?`<button data-watch="${v.id}">讓選中的人觀看</button>`:`<button data-retry-upload="${v.id}">重試失敗的塊／任務</button>`}</article>`).join('');
            if (el('videos').dataset.html!==html) { const focused = el('videos').contains(document.activeElement) ? document.activeElement.dataset : null; const watchId=focused?.watch,retryId=focused?.retryUpload; el('videos').innerHTML=html; el('videos').dataset.html=html; if(watchId)root.querySelector(`[data-watch="${watchId}"]`)?.focus({preventScroll:true}); if(retryId)root.querySelector(`[data-retry-upload="${retryId}"]`)?.focus({preventScroll:true}); }
        }
        function filteredRequests() {
            const operation = r=>r.kind==='segment'?'watch':r.kind==='search'?'search':'upload';
            return world.requests.filter(r=>operationFilter==='all'||operation(r)===operationFilter).filter(r=>requestFilter==='all'||requestFilter==='user'&&r.userId===selectedUser||requestFilter==='machine'&&(r.machines.includes(selectedMachine)||r.history.some(h=>h.text.includes(selectedMachine||'__none__')))||requestFilter==='batch'&&r.batch===lastBatch||requestFilter==='failed'&&(r.status==='failed'||r.status==='retry'));
        }
        function drawRequests() {
            const rows=filteredRequests(); requestPage=Math.min(requestPage,Math.max(0,Math.ceil(rows.length/20)-1));
            el('request-page').textContent=`${requestPage+1}/${Math.max(1,Math.ceil(rows.length/20))} 頁 · ${rows.length} 筆`;
            if (!el('requests').contains(document.activeElement)) el('requests').innerHTML=rows.slice(requestPage*20,requestPage*20+20).map(r=>`<tr class="yw-request-${r.status}"><td><button data-request="${r.id}">${r.id}</button></td><td>${clock(r.createdAt)}</td><td>${r.loadTest?'壓測客戶端':r.userId?`#${r.userId}`:'後端'}<br>${esc(r.videoId)}</td><td>${kindName(r.kind)}</td><td>${stateName(r.status)}</td><td>${Math.round((r.size-r.remaining)/r.size*100)}%</td><td>${esc(r.reason)}<br><small>${esc(r.machines.join(' → '))}</small></td></tr>`).join('')||'<tr><td colspan="7">沒有符合條件的請求</td></tr>';
            const r=world.requests.find(r=>r.id===selectedRequest);
            el('request-detail').innerHTML=r?`<h3>${r.id} · ${kindName(r.kind)}</h3><p>${r.loadTest?'獨立壓測客戶端':r.userId!=null?'使用者 #'+r.userId:'後端'} · ${esc(r.videoId)} · ${esc(r.quality||r.jobId||'')} ${r.part!=null?'分塊 '+(r.part+1):''}</p><ol>${r.history.map(h=>`<li>${clock(h.at)} ${esc(h.text)}</li>`).join('')}</ol>`:selectedRequest?'<p>此請求已超過保留範圍。</p>':'';
        }
        function drawCapacity() {
            const top = pressure[0];
            root.querySelector('.yw-capacity').classList.toggle('is-clear',!top);
            el('bottleneck').textContent = top ? `目前瓶頸：${TYPES[top.kind]} · ${world.regions.find(r => r.id === top.region).name}` : '目前沒有機器容量排隊';
            el('capacity-detail').textContent = top
                ? `依最近一個 tick 的同類同區佇列排序：等待 ${top.waiting} 筆，工作槽 ${top.active}/${top.slots}，健康機器 ${top.healthy} 台。${top.kind === 'storage' ? '未命中 CDN 的觀看回源與上傳分塊共用物件儲存；只加前端不會增加這裡的工作槽。' : ''}${top.healthy ? '可選取機器加一台，再比較變化。' : '先恢復故障機器，或加一台分流。'}${pressure[1] ? `其他排隊：${TYPES[pressure[1].kind]}（${world.regions.find(r => r.id === pressure[1].region).name}）${pressure[1].waiting} 筆。` : ''}`
                : '這不代表所有觀眾都順暢：也可能在等重試、傳輸或最後一哩網路。點觀眾與 Request 查看原因。';
            root.querySelector('[data-action="inspect-bottleneck"]').disabled = !top;
            el('pacing').textContent = `${paused ? '暫停' : document.hidden ? '分頁隱藏' : `目標 ${speed}x · 近 1 秒實際 ${actualSpeed.toFixed(1)}x`} · 待跑 ${pacing.pending.toFixed(1)} 模擬秒（逐步補跑，不跳過）`;
        }
        function collectTime(now) {
            if (!paused && !document.hidden) pacing.addTime((now - last) / 1000, speed);
            last = now;
        }
        function paint(force = false) {
            pressure = world.capacityPressure();
            drawCapacity();
            syncSelectors(); syncInspector(force); drawMachines(); drawUsers();
            drawRoute();
            const s=world.summary(),u=selected();
            el('clock').textContent=clock(world.time)+'.'+Math.round((world.time%1)*10);
            el('shared-month').textContent=`共用課程進度：第 ${world.courseMonth || 0} / 12 月`;
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
            if (id==='yw-speed') { collectTime(performance.now()); speed=Number(e.target.value); rateElapsed=rateTicks=actualSpeed=0; }
            if (id==='yw-user-select') {selectedUser=Number(e.target.value);selectedRequest=null;selectInspector('user');}
            if (id==='yw-user-region') world.moveUser(u.id,e.target.value,u.x,u.y);
            if (id==='yw-user-route') u.route=e.target.value;
            if (id==='yw-network') { u.network=e.target.value; if (u.zone) notice('目前身在弱網區；移出後才使用手選網路（離線優先）。'); }
            if (id==='yw-operation-filter') {operationFilter=e.target.value;requestPage=0;}
            if (id==='yw-request-filter') { requestFilter=e.target.value;requestPage=0; }
            paint(true);
        });
        root.addEventListener('click',e=>{
            const b=e.target.closest('button'); if(!b)return;
            if (b.dataset.user) { if (b.dataset.dragged) { delete b.dataset.dragged;return; } selectedUser=Number(b.dataset.user);selectedRequest=null;selectInspector('user'); }
            if (b.dataset.machine) originalMachineClick(b.dataset.machine);
            if (b.dataset.request) { selectedRequest=b.dataset.request;selectInspector('request'); }
            if (b.dataset.watch) world.watch(selectedUser,b.dataset.watch);
            if (b.dataset.retryUpload) world.retryUpload(b.dataset.retryUpload);
            const u=selected(),m=world.machines.find(m=>m.id===selectedMachine);
            switch(b.dataset.action) {
                case 'pause': collectTime(performance.now());paused=!paused;rateElapsed=rateTicks=actualSpeed=0;break;
                case 'step': collectTime(performance.now());paused=true;pacing.singleStep(dt=>world.step(dt));rateElapsed=rateTicks=actualSpeed=0;break;
                case 'use-default-design': window.YouTubeModes?.clearDesign();design=null;world=new World(Number(el('seed').value),1,null);renderDesign();selectedUser=1;selectedMachine=null;selectedRequest=null;requestPage=0;paused=true;pacing=new FrameStepper();last=performance.now();rateElapsed=rateTicks=actualSpeed=0;regionSignature='';videoSignature='';inspectorSignature='';root.querySelectorAll('[data-option]').forEach(c=>{c.checked=world.options[c.dataset.option];});notice('已改用預設架構並重置世界，暫停中。');break;
                case 'reset': design=window.YouTubeModes?.loadDesign()||null;world=new World(Number(el('seed').value),1,design);renderDesign();selectedUser=1;selectedMachine=null;selectedRequest=null;requestPage=0;paused=true;pacing=new FrameStepper();last=performance.now();rateElapsed=rateTicks=actualSpeed=0;regionSignature='';videoSignature='';inspectorSignature='';root.querySelectorAll('[data-option]').forEach(c=>{c.checked=world.options[c.dataset.option];});el('machine-detail').textContent='點選機器查看';notice('已用同種子重置世界，暫停中。');break;
                case 'my-user': selectedUser=1;selectedMachine=null;selectedRequest=null;selectInspector('user');break;
                case 'clear-machine': selectedMachine=null;selectInspector('user');break;
                case 'weak': world.moveUser(u.id,u.region,.78,.75);break;
                case 'good': world.moveUser(u.id,u.region,.25,.3);break;
                case 'search': world.search(u.id);break;
                case 'watch': world.watch(u.id,el('watch-video').value);break;
                case 'upload': notice(world.upload(u.id)?'已建立上傳；在影片生命週期查看每一塊與轉碼任務。':'此人正在上傳，或進行中影片已達上限。');break;
                case 'add-users': {const count=Math.max(1,Math.min(10,Number(el('add-count').value)||1));world.addAudienceGroup(count,el('group-region').value,`新增觀眾 #${world.seq.user + 1}`);notice(`世界共 ${world.users.length} 人（上限 500），包含我的角色。這一批會在月份課程顯示為同一群組。`);break;}
                case 'inspect-bottleneck': if(pressure[0]){originalMachineClick(pressure[0].machineIds[0]);root.querySelector('.yw-inspector').classList.add('has-machine');el('machine-panel').scrollIntoView({block:'center'});}break;
                case 'add-region': notice(world.addRegion(el('region-name').value)?'服務據點已建立；人口位置不變，可調整服務路由。':'請輸入不重複名稱，最多 6 個據點。');break;
                case 'toggle-machine': if(m)world.setMachine(m.id,!m.up);break;
                case 'add-machine': if(m)notice(world.addMachine(m.kind,m.region)?'已新增同區機器，共用佇列開始分流。':'同類機器每區最多 8 台。');break;
                case 'api-lab': {const api=world.machines.find(machine=>machine.kind==='api'&&machine.region===el('group-region').value);if(api){originalMachineClick(api.id);el('api-slots').value=2;el('api-rate').value=2;el('api-timeout').value=2;}break;}
                case 'configure-api': notice(m&&world.configureApi(m.id,{slots:Number(el('api-slots').value),capacity:Number(el('api-rate').value),queueTimeout:Number(el('api-timeout').value)})?'容量已套用；現有與新請求共用這台 API。':'請填入有效容量：並行 1–64、吞吐 0.1–1000 Mbps、逾時 0.1–60 秒。');break;
                case 'burst-api': {if(!m||m.kind!=='api')break;const requests=world.burstApi(m.region,Number(el('api-count').value));if(requests.length){lastBatch=requests[0].batch;requestFilter='batch';el('request-filter').value='batch';operationFilter='search';el('operation-filter').value='search';requestPage=0;notice(`已送出 ${requests.length} 筆獨立查詢；${paused?'目前暫停，按繼續或單步觀察。':'觀察下方 LOG 與這台機器的排隊。'}`);}else notice('查詢數量請填 1–100。');break;}
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
        let wasHidden = document.hidden;
        document.addEventListener('visibilitychange',()=>{
            const now = performance.now();
            if (!paused && !wasHidden) pacing.addTime((now-last)/1000,speed);
            last=now;wasHidden=document.hidden;rateElapsed=rateTicks=actualSpeed=0;
        });
        function frame(now) {
            if (!root.isConnected) return;
            const dt=Math.max(0,(now-last)/1000);last=now;
            if(!paused&&!document.hidden){
                rateTicks+=pacing.advance(dt,speed,dt=>world.step(dt));
                rateElapsed+=dt;
                if(rateElapsed>=1){actualSpeed=rateTicks*.1/rateElapsed;rateElapsed=rateTicks=0;}
            }
            if(now-painted>250){paint();painted=now;}requestAnimationFrame(frame);
        }
        el('speed').value = speed;
        root.querySelectorAll('[data-option]').forEach(c => { c.checked = world.options[c.dataset.option]; });
        renderDesign();selectInspector(selectedRequest ? 'request' : selectedMachine ? 'machine' : 'user');paint(true);
        if(new URLSearchParams(location.search).get('lab')==='api')root.querySelector('[data-action="api-lab"]').click();
        requestAnimationFrame(frame);
    };
})();
