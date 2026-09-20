/* A read-only projection of World; actions are delegated to the existing world inspector. */
(() => {
    'use strict';
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    class WorldDiagram {
        constructor(parent, actions) {
            this.element = document.createElement('section');
            this.element.className = 'yw-diagram';
            this.element.innerHTML = `<div class="yw-diagram-head"><strong>架構與傳輸 · 同一個世界</strong><label>縮放 <select aria-label="架構圖縮放"><option value="100">符合寬度</option>${[125,150,200,250,300].map(n=>`<option value="${n}">${n}%</option>`).join('')}</select></label></div><p>點觀眾群組選人數，再拖進斜線弱網區；群組會依實際網路自動拆分。點機器查看或關機。</p><div class="yw-diagram-scroll" tabindex="0" aria-label="架構圖，可拖曳平移"><svg role="group" aria-label="即時世界架構"><g data-layer="regions"></g><g data-layer="route"></g><g data-layer="machines"></g><g data-layer="users"></g></svg></div><p class="yw-diagram-status" role="status"></p><small>空白處按住拖曳 · 機器編號與另一視圖相同</small>`;
            parent.append(this.element);
            this.scroll = this.element.querySelector('.yw-diagram-scroll');
            this.svg = this.scroll.querySelector('svg');
            this.zoom = this.element.querySelector('select');
            this.scale = 100;
            this.signature = '';
            this.positions = new Map();
            this.zoom.onchange = () => this.setZoom(Number(this.zoom.value));
            let pan = null;
            this.scroll.addEventListener('pointerdown', e => {
                if(e.button!==0||!e.isPrimary||e.target.closest('[data-graph-machine],[data-graph-user],[data-graph-audience]'))return;
                pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:this.scroll.scrollLeft,top:this.scroll.scrollTop};
                this.scroll.setPointerCapture(e.pointerId);this.scroll.classList.add('is-panning');e.preventDefault();
            });
            this.scroll.addEventListener('pointermove',e=>{if(pan?.id===e.pointerId){this.scroll.scrollLeft=pan.left-e.clientX+pan.x;this.scroll.scrollTop=pan.top-e.clientY+pan.y;}});
            const stop=e=>{if(pan?.id!==e.pointerId)return;pan=null;this.scroll.classList.remove('is-panning');if(this.scroll.hasPointerCapture(e.pointerId))this.scroll.releasePointerCapture(e.pointerId);};
            ['pointerup','pointercancel','lostpointercapture'].forEach(type=>this.scroll.addEventListener(type,stop));
            this.actions = actions;
            this.svg.addEventListener('pointerdown', e => this.startGroupDrag(e));
            this.svg.addEventListener('pointermove', e => this.moveGroupDrag(e));
            this.svg.addEventListener('pointerup', e => this.endGroupDrag(e));
            this.svg.addEventListener('pointercancel', () => { this.groupDrag=null;this.svg.querySelector('[data-drag-ghost]')?.remove(); });
            const activate = e => {
                if(this.suppressClick){this.suppressClick=false;return;}
                const audience=e.target.closest('[data-graph-audience]');
                if(audience){actions.group(audience.dataset.graphAudience);return;}
                const m=e.target.closest('[data-graph-machine]'),u=e.target.closest('[data-graph-user]');
                if(m)actions.machine(m.dataset.graphMachine);
                if(u)actions.user(Number(u.dataset.graphUser));
            };
            this.svg.addEventListener('click',activate);
            this.svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(e);}});
        }
        setZoom(value, anchor) {
            const box=this.scroll.getBoundingClientRect(),before=this.svg.getBoundingClientRect();
            const x=anchor?anchor.clientX-box.left:this.scroll.clientWidth/2,y=anchor?anchor.clientY-box.top:this.scroll.clientHeight/2;
            const u=(this.scroll.scrollLeft+x)/before.width,v=(this.scroll.scrollTop+y)/before.height;
            this.scale=value;this.svg.style.width=`${value}%`;
            if(![...this.zoom.options].some(o=>Number(o.value)===value))this.zoom.add(new Option(`${value}%`,value));
            this.zoom.value=String(value);
            const after=this.svg.getBoundingClientRect();this.scroll.scrollLeft=u*after.width-x;this.scroll.scrollTop=v*after.height-y;
        }
        coords(event) {
            const p=this.svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
            return p.matrixTransform(this.svg.getScreenCTM().inverse());
        }
        startGroupDrag(event) {
            const node=event.target.closest('[data-graph-audience]');
            if(!node||event.button!==0)return;
            event.preventDefault();event.stopPropagation();
            this.actions.group(node.dataset.graphAudience);
            this.groupDrag={id:event.pointerId,key:node.dataset.graphAudience,x:event.clientX,y:event.clientY,moved:false};
            this.svg.setPointerCapture(event.pointerId);
        }
        moveGroupDrag(event) {
            const drag=this.groupDrag;if(!drag||drag.id!==event.pointerId)return;
            if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5)return;
            drag.moved=true;
            let ghost=this.svg.querySelector('[data-drag-ghost]');
            if(!ghost){ghost=document.createElementNS('http://www.w3.org/2000/svg','circle');ghost.dataset.dragGhost='';ghost.setAttribute('r','25');ghost.setAttribute('class','yw-group-ghost');this.svg.append(ghost);}
            const p=this.coords(event);ghost.setAttribute('cx',p.x);ghost.setAttribute('cy',p.y);
        }
        endGroupDrag(event) {
            const drag=this.groupDrag;if(!drag||drag.id!==event.pointerId)return;
            const p=this.coords(event);this.groupDrag=null;this.svg.querySelector('[data-drag-ghost]')?.remove();
            if(this.svg.hasPointerCapture(event.pointerId))this.svg.releasePointerCapture(event.pointerId);
            if(!drag.moved)return;
            this.suppressClick=true;
            const target=this.dropAreas.find(a=>a.key===drag.key.split(':').slice(0,-1).join(':')&&p.x>=a.x&&p.x<=a.x+a.w&&p.y>=a.y&&p.y<=a.y+a.h);
            if(target)this.actions.moveGroup(drag.key,target.weak);
        }
        paint(world, selection) {
            if(this.groupDrag)return this.element.querySelector('.yw-diagram-status').textContent;
            const front=['cdn','stream','api'],groups=world.audienceGroups(),layouts=new Map();
            let height=0;
            world.regions.forEach(r=>{
                const cohorts=[...new Set(groups.filter(g=>g.region===r.id).map(g=>g.cohort))];
                const maxMachines=Math.max(1,...front.map(kind=>world.machines.filter(m=>m.region===r.id&&m.kind===kind).length));
                const h=Math.max(300,cohorts.length*120+110,maxMachines*70+110);
                layouts.set(r.id,{y:height,h,cohorts});height+=h;
            });
            height=Math.max(900,height);
            const signature=JSON.stringify([world.regions.map(r=>[r.id,r.name,layouts.get(r.id)]),world.machines.map(m=>[m.id,m.region,m.kind])]);
            if(signature!==this.signature){
                this.signature=signature;this.positions.clear();this.svg.setAttribute('viewBox',`0 0 1400 ${height}`);
                this.svg.querySelector('[data-layer=regions]').innerHTML=world.regions.map(r=>{const l=layouts.get(r.id);return `<rect x="15" y="${l.y+15}" width="845" height="${l.h-25}" rx="18" class="yw-graph-region"/><text x="40" y="${l.y+48}" class="yw-graph-title">${esc(r.name)}</text><text x="40" y="${l.y+80}" data-graph-count="${esc(r.id)}"></text>`;}).join('')+`<rect x="890" y="15" width="490" height="${height-30}" rx="18" class="yw-graph-region"/><text x="915" y="48" class="yw-graph-title">共用後端 · 美國</text>`;
                world.regions.forEach(r=>front.forEach((kind,k)=>world.machines.filter(m=>m.region===r.id&&m.kind===kind).forEach((m,j)=>this.positions.set(m.id,{x:410+k*170,y:layouts.get(r.id).y+140+j*70}))));
                ['storage','cache','db','worker'].forEach((kind,k)=>world.machines.filter(m=>m.kind===kind).forEach((m,j)=>this.positions.set(m.id,{x:975+(j%3)*145,y:125+k*190+Math.floor(j/3)*48})));
                this.svg.querySelector('[data-layer=machines]').innerHTML=world.machines.map(m=>{const p=this.positions.get(m.id);return `<g data-graph-machine="${m.id}" role="button" tabindex="0" transform="translate(${p.x} ${p.y})"><title></title><circle r="21"/><text class="yw-graph-mark" text-anchor="middle" y="6"></text><text class="yw-graph-machine-label" text-anchor="middle" y="35">${esc(window.YouTubeWorld.TYPES[m.kind])} #${m.id.split('-')[1]}</text></g>`;}).join('');
            }
            const request=world.requests.find(r=>r.id===selection.requestId)||world.requests.find(r=>r.id===world.user(selection.userId)?.pending)||world.activeRequests().find(r=>r.userId===selection.userId);
            world.regions.forEach(r=>{this.svg.querySelector(`[data-graph-count="${r.id}"]`).textContent=`目前 ${world.users.filter(u=>u.region===r.id).length} 人 · 已服務 ${r.served.size} 位`;});
            const userPositions=new Map(),users=[];this.dropAreas=[];
            world.regions.forEach(r=>{
                const layout=layouts.get(r.id);
                layout.cohorts.forEach((cohort,index)=>{
                    const row=groups.filter(g=>g.region===r.id&&g.cohort===cohort),y=layout.y+140+index*120,key=`${cohort}:${r.id}`;
                    const weakCount=row.filter(g=>g.network!=='normal').reduce((n,g)=>n+g.ids.length,0);
                    users.push(`<g class="yw-audience-zones"><rect x="35" y="${y-35}" width="125" height="95" rx="10" class="yw-normal-drop"/><rect x="180" y="${y-35}" width="150" height="95" rx="10" class="yw-weak-drop ${weakCount?'occupied':''}"/><text x="185" y="${y-16}">訊號不良區${weakCount?' · '+weakCount+' 人':''}</text><text x="40" y="${y+83}">${esc(row[0].label)}</text></g>`);
                    this.dropAreas.push({key,x:35,y:y-35,w:125,h:95,weak:false},{key,x:180,y:y-35,w:150,h:95,weak:true});
                    row.forEach(group=>{
                        const p={x:group.network==='normal'?95:group.network==='offline'?285:235,y:y+12};
                        group.ids.forEach(id=>userPositions.set(id,p));
                        const name={normal:'正常',weak:'弱網',offline:'離線'}[group.network];
                        users.push(`<g data-graph-audience="${esc(group.key)}" role="button" tabindex="0" aria-label="${esc(group.label)} ${name} ${group.ids.length} 人" transform="translate(${p.x} ${p.y})" class="yw-audience ${group.ids.includes(selection.userId)?'selected':''} ${group.network}"><circle r="26"/><text text-anchor="middle" y="5">${group.ids.length} 人</text><text text-anchor="middle" y="43">${name}</text></g>`);
                    });
                });
            });
            const userMarkup=users.join('');
            if(userMarkup!==this.userMarkup){this.svg.querySelector('[data-layer=users]').innerHTML=userMarkup;this.userMarkup=userMarkup;}
            world.machines.forEach(m=>{
                const g=this.svg.querySelector(`[data-graph-machine="${m.id}"]`),disabled=m.kind==='cdn'&&!world.options.cdn;
                g.classList.toggle('down',!m.up);g.classList.toggle('disabled',disabled);g.classList.toggle('selected',m.id===selection.machineId);g.classList.toggle('busy',m.queued>0);g.classList.toggle('in-route',!!request?.machines.includes(m.id));
                g.setAttribute('aria-label',`${window.YouTubeWorld.TYPES[m.kind]} ${m.id}，${!m.up?'故障':disabled?'未啟用':'運作中'}，處理 ${m.active}/${m.slots}，排隊 ${m.queued}`);
                g.querySelector('title').textContent=g.getAttribute('aria-label');g.querySelector('.yw-graph-mark').textContent=!m.up?'×':disabled?'—':m.queued?'!':'✓';
            });
            const source=userPositions.get(request?.userId),resources=(request?.machines||[]).map(id=>this.positions.get(id)).filter(Boolean);
            const points=request?.kind==='segment'?[...resources].reverse().concat(source?[source]:[]):[...(source?[source]:[]),...resources];
            const route=this.svg.querySelector('[data-layer=route]');
            route.innerHTML='';
            if(request&&points.length>1){
                const progress=Math.max(0,Math.min(1,request.sent/request.size));
                const d=points.slice(1).reduce((path,p,i)=>`${path} Q ${(points[i].x+p.x)/2} ${Math.min(points[i].y,p.y)-80} ${p.x} ${p.y}`,`M ${points[0].x} ${points[0].y}`);
                route.innerHTML=`<path d="${d}"/><circle r="7"/><text x="${points[0].x+12}" y="${points[0].y-32}">${esc(request.id)}</text>`;
                const path=route.querySelector('path'),point=path.getPointAtLength(path.getTotalLength()*progress);
                route.querySelector('circle').setAttribute('cx',point.x);route.querySelector('circle').setAttribute('cy',point.y);
            }
            const status=request?`${request.id} · ${request.reason||request.status} · 傳輸 ${Math.round(Math.min(1,request.sent/request.size)*100)}%${resources.length?'；亮線是此請求的資源示意，並非另一套模擬。':'；尚未取得機器資源，請看等待／失敗原因。'}`:'目前沒有選中的請求；點觀眾追蹤，或展開 LOG 選一筆 Request。';
            this.element.querySelector('.yw-diagram-status').textContent=status;
            return status;
        }
    }
    window.YouTubeWorldDiagram=WorldDiagram;
})();
