'use strict';

const _sv=(d)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON={
  folder:_sv('<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  users:_sv('<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M15 5a3 3 0 0 1 0 6m3 3c2 1 3 3 3 6"/>'),
  user:_sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>'),
  admin:_sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/><path d="M7 8a5 5 0 0 1 10 0"/><rect x="15.5" y="15" width="5" height="4" rx="1"/>'),
  db:_sv('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  cache:_sv('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  cloud:_sv('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/>'),
  gate:_sv('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M7 14h.01M11 10h6M11 14h6"/>'),
  server:_sv('<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01"/>'),
  lock:_sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  key:_sv('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>'),
  phone:_sv('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  card:_sv('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  hotel:_sv('<path d="M4 21V4h11v17M15 9h5v12"/><path d="M8 8h3M8 12h3M8 16h3"/>'),
  tag:_sv('<path d="M20 12 12 20 3 11V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  cal:_sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  vpn:_sv('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9.5a2 2 0 0 1 4 0V11"/>'),
  gear:_sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 1.3 14H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6 1.6 1.6 0 0 0 8 1V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" transform="scale(.85) translate(2 2)"/>'),
  msg:_sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock:_sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check:_sv('<path d="M5 12l5 5L20 7"/>'),
  cross:_sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  warn:_sv('<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>'),
  bed:_sv('<path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>'),
  coord:_sv('<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><path d="M6 6l4 4M18 6l-4 4M6 18l4-4M18 18l-4-4"/>'),
  queue:_sv('<rect x="3" y="8" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/>'),
  cdc:_sv('<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>'),
};
const COL={cy:'#22d3ee',gr:'#34d399',rd:'#f87171',am:'#fbbf24',vi:'#a78bfa',bl:'#60a5fa',pk:'#f472b6',gy:'#64748b',wh:'#e6edf3'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}

/* ================= 語法高亮 ================= */
const KW=/^(SELECT|FROM|WHERE|AND|OR|UPDATE|SET|INSERT|INTO|VALUES|COMMIT|ROLLBACK|BEGIN|FOR|if|else|return|CONSTRAINT|CHECK|between|BETWEEN|PRIMARY|KEY|CREATE|TABLE|START|TRANSACTION|Rollback|Commit|const|let|function|await|async|true|false|null|DECR|DECRBY|INCR|GET|POST|PUT|DELETE|EXPIRE|UNIQUE|NOT|NULL|INT|DATE|VARCHAR|IN|AS|ON|WHILE|while|throw|try|catch|new|of|for)$/;
function hiLine(raw){
  const re=/(\/\/.*$|#.*$|--.*$)|("[^"]*"|'[^']*'|`[^`]*`)|([A-Za-z_][A-Za-z_0-9]*)|(\b\d[\d_.]*\b)/g;
  let out='',last=0,m;
  while((m=re.exec(raw))){
    out+=esc(raw.slice(last,m.index));
    if(m[1])out+=`<span class="cm">${esc(m[1])}</span>`;
    else if(m[2])out+=`<span class="st">${esc(m[2])}</span>`;
    else if(m[3])out+=KW.test(m[3])?`<span class="kw">${m[3]}</span>`:esc(m[3]);
    else if(m[4])out+=`<span class="nm">${m[4]}</span>`;
    last=re.lastIndex;
  }
  return out+esc(raw.slice(last));
}

/* ================= 舞台 API ================= */
const S={
  instant:false,pending:[],st:null,svg:null,cam:null,loops:[],
  init(){this.st=document.getElementById('stage');},
  $(id){return this.st.querySelector('#e_'+id);},
  clear(keepOld){
    this.cancelAll();this.stopLoops();
    let old=null;
    if(keepOld&&this.cam&&this.cam.children.length>1){old=document.createElement('div');old.className='leaving';
      [...this.st.childNodes].forEach(n=>{if(!(n.classList&&(n.classList.contains('labflag')||n.classList.contains('tcard'))))old.appendChild(n);});
      old.querySelectorAll('[id^="e_"],[id^="p_"],[id^="mk_"]').forEach(n=>n.removeAttribute('id'));}
    this.st.innerHTML='';
    this.cam=document.createElement('div');this.cam.id='cam';this.st.appendChild(this.cam);
    this.svg=svgEl('svg',{class:'ov',viewBox:'0 0 1280 720'});
    const defs=svgEl('defs',{});
    for(const k in COL){const m=svgEl('marker',{id:'mk_'+k,viewBox:'0 0 10 10',refX:'8.5',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'});
      m.appendChild(svgEl('path',{d:'M0 0L10 5L0 10z',fill:COL[k]}));defs.appendChild(m);}
    this.svg.appendChild(defs);this.cam.appendChild(this.svg);
    if(old){this.st.appendChild(old);setTimeout(()=>old.remove(),800);}
  },
  stopLoops(){this.loops.forEach(clearInterval);this.loops=[];},
  camTo(x,y,k=1.5){if(!this.cam)return;if(x==null||k===1){this.cam.style.transform='';return;}this.cam.style.transform=`translate(${640-x*k}px,${390-y*k}px) scale(${k})`;},
  camOn(id,k=1.6){const e=this.$(id);if(!e)return;this.camTo(e.offsetLeft+e.offsetWidth/2,e.offsetTop+e.offsetHeight/2,k);},
  titleCard(no,title){if(this.instant)return;const c=document.createElement('div');c.className='tcard';c.innerHTML=`<div class="tline"></div><div class="tn">${no}</div><div class="tt">${title}</div>`;this.st.appendChild(c);setTimeout(()=>c.remove(),2600);},
  focus(ids,c='cy'){if(this.instant)return;[].concat(ids).forEach(id=>{const e=this.$(id);if(!e||!e.offsetWidth||e.parentElement!==this.cam)return;const f=document.createElement('div');f.className='focusring';
    f.style.cssText=`left:${e.offsetLeft-9}px;top:${e.offsetTop-9}px;width:${e.offsetWidth+18}px;height:${e.offsetHeight+18}px;--fc:${COL[c]||c}`;this.cam.appendChild(f);setTimeout(()=>f.remove(),2700);});},
  loop(chain,o={}){const run=()=>{let i=0;const next=()=>{if(i>=chain.length)return;const a=chain[i++];this.pkt(null,null,{via:a,color:o.color,label:o.label,dur:o.dur||650,ambient:true,done:next});};next();};
    if(!this.instant)setTimeout(run,o.delay||300);this.loops.push(setInterval(run,o.every||1700));},
  cancelAll(){this.pending.forEach(p=>p.cancel());this.pending=[];},
  flush(){ // 讓上一個步驟尚未播完的動畫立刻到達終點
    const ps=this.pending;this.pending=[];const was=this.instant;this.instant=true;
    ps.forEach(p=>{p.cancel();try{p.fn&&p.fn();}catch(e){console.error(e);}});
    this.instant=was;
    if(this.pending.length)this.flush();
  },
  after(ms,fn){
    if(this.instant){fn();return;}
    const rec={fn};const t=setTimeout(()=>{this.pending=this.pending.filter(x=>x!==rec);try{fn();}catch(e){console.error(e);}},ms);
    rec.cancel=()=>clearTimeout(t);this.pending.push(rec);
  },
  el(id,x,y,w,h,html,cls='',style=''){
    let e=id?this.$(id):null;const fresh=!e;
    if(!e){e=document.createElement('div');if(id)e.id='e_'+id;((id==='hdr'||(id&&id.startsWith('ui_')))?this.st:this.cam).appendChild(e);}
    e.className='el '+cls+(fresh?'':' in');
    if(x!=null)e.style.left=x+'px';if(y!=null)e.style.top=y+'px';
    if(w!=null)e.style.width=w+'px';if(h!=null)e.style.height=h+'px';
    if(style)e.style.cssText+=';'+style;
    if(html!=null)e.innerHTML=html;
    if(fresh){if(this.instant)e.classList.add('in');else{e.classList.add('fx');requestAnimationFrame(()=>requestAnimationFrame(()=>e.classList.add('in')));setTimeout(()=>e.classList.remove('fx'),1400);}}
    return e;
  },
  header(c,t){this.el('hdr',40,22,1200,null,`<div class="c">${c}</div><div class="t">${t}</div>`,'hdr');},
  box(id,x,y,w,h,o={}){
    const ic=o.icon?`<div class="ic">${ICON[o.icon]||o.icon}</div>`:'';
    const html=`${ic}<div>${o.t?`<div class="bt">${o.t}</div>`:''}${o.s?`<div class="bs">${o.s}</div>`:''}</div>`;
    return this.el(id,x,y,w,h,html,'box '+(o.row?'row ':'')+(o.k?o.k.split(' ').map(k=>'k-'+k).join(' '):''),o.style||'');
  },
  text(id,x,y,html,o={}){
    const st=`font-size:${o.size||18}px;${o.color?'color:'+o.color+';':''}${o.align?'text-align:'+o.align+';':''}${o.weight?'font-weight:'+o.weight+';':''}${o.style||''}`;
    return this.el(id,x,y,o.w||null,o.h||null,html,'txt '+(o.cls||''),st);
  },
  set(id,html){const e=this.$(id);if(e)e.innerHTML=html;return e;},
  move(id,x,y,w,h){const e=this.$(id);if(!e)return;if(x!=null)e.style.left=x+'px';if(y!=null)e.style.top=y+'px';if(w!=null)e.style.width=w+'px';if(h!=null)e.style.height=h+'px';},
  add(id,c){const e=this.$(id)||this.st.querySelector('#p_'+id);if(e)c.split(' ').forEach(k=>e.classList.add(k));},
  rm(id,c){const e=this.$(id)||this.st.querySelector('#p_'+id);if(e)c.split(' ').forEach(k=>e.classList.remove(k));},
  glow(ids,c='glow'){[].concat(ids).forEach(i=>this.add(i,c));this.focus(ids,{glow:'cy','glow-r':'rd','glow-g':'gr','glow-a':'am'}[c]||'cy');},
  unglow(ids){[].concat(ids).forEach(i=>this.rm(i,'glow glow-r glow-g glow-a'));},
  hide(ids){[].concat(ids).forEach(i=>{this.add(i,'gone');const p=this.st.querySelector('#p_'+i);if(p)p.style.opacity=0;const l=this.$('lab_'+i);if(l)l.classList.add('gone');});},
  show(ids){[].concat(ids).forEach(i=>{this.rm(i,'gone');const p=this.st.querySelector('#p_'+i);if(p)p.style.opacity=1;const l=this.$('lab_'+i);if(l)l.classList.remove('gone');});},
  del(ids){[].concat(ids).forEach(i=>{const e=this.$(i);if(e)e.remove();const p=this.st.querySelector('#p_'+i);if(p)p.remove();const l=this.$('lab_'+i);if(l)l.remove();});},
  dim(ids,on=true){[].concat(ids).forEach(i=>on?this.add(i,'k-dim'):this.rm(i,'k-dim'));},
  /* ---- 錨點 ---- */
  pt(ref){
    if(Array.isArray(ref))return{x:ref[0],y:ref[1]};
    let [id,side]=ref.split('@');side=side||'c';let f=0.5;
    if(side.includes(':')){const q=side.split(':');side=q[0];f=parseFloat(q[1]);}
    const e=this.$(id);if(!e){console.warn('no el',id);return{x:0,y:0};}
    const x=e.offsetLeft,y=e.offsetTop,w=e.offsetWidth,h=e.offsetHeight;
    switch(side){case'l':return{x,y:y+h*f};case'r':return{x:x+w,y:y+h*f};case't':return{x:x+w*f,y};case'b':return{x:x+w*f,y:y+h};default:return{x:x+w/2,y:y+h/2};}
  },
  pathD(a,b,o){
    const p=this.pt(a),q=this.pt(b);
    if(o.elbow==='hv')return`M${p.x} ${p.y}H${q.x}V${q.y}`;
    if(o.elbow==='vh')return`M${p.x} ${p.y}V${q.y}H${q.x}`;
    if(o.elbow==='vhv'){const m=o.mid??(p.y+q.y)/2;return`M${p.x} ${p.y}V${m}H${q.x}V${q.y}`;}
    if(o.elbow==='hvh'){const m=o.mid??(p.x+q.x)/2;return`M${p.x} ${p.y}H${m}V${q.y}H${q.x}`;}
    if(o.curve){const mx=(p.x+q.x)/2,my=(p.y+q.y)/2,dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1;
      const cx=mx-dy/L*o.curve,cy=my+dx/L*o.curve;return`M${p.x} ${p.y}Q${cx} ${cy} ${q.x} ${q.y}`;}
    return`M${p.x} ${p.y}L${q.x} ${q.y}`;
  },
  arrow(id,a,b,o={}){
    const old=this.st.querySelector('#p_'+id);if(old)old.remove();const ol=this.$('lab_'+id);if(ol)ol.remove();
    const c=o.color||'cy';
    const path=svgEl('path',{id:'p_'+id,d:this.pathD(a,b,o),fill:'none',stroke:COL[c]||c,'stroke-width':o.w||2.2,'marker-end':o.noHead?'':`url(#mk_${c})`});
    if(o.both)path.setAttribute('marker-start',`url(#mk_${c})`);
    this.svg.appendChild(path);
    const len=path.getTotalLength();const flow=o.flow??(!o.dash&&!o.noHead);
    if(o.dash){path.setAttribute('stroke-dasharray','7 6');if(!this.instant){path.style.opacity=0;path.style.transition='opacity .6s';requestAnimationFrame(()=>requestAnimationFrame(()=>path.style.opacity=1));}}
    else if(!this.instant){path.style.strokeDasharray=len;path.style.strokeDashoffset=len;path.style.transition='stroke-dashoffset .8s ease';
      requestAnimationFrame(()=>requestAnimationFrame(()=>path.style.strokeDashoffset=0));
      const fin=()=>{path.style.transition='none';path.style.strokeDasharray='';path.style.strokeDashoffset='';if(flow)path.classList.add('flow');};
      const rec={fn:fin,cancel:()=>{}};
      setTimeout(()=>{if(path.isConnected)fin();},900);this.pending.push(rec);
    }else if(flow)path.classList.add('flow');
    if(o.label){const m=path.getPointAtLength(len*(o.lpos??0.5));
      this.el('lab_'+id,m.x+(o.lx||0),m.y+(o.ly??-12),null,null,`<span style="background:#0b1016e6;padding:1px 7px;border-radius:5px;border:1px solid ${COL[c]||c}55">${o.label}</span>`,'txt',`font-size:${o.ls||13}px;color:${o.lc?COL[o.lc]:'#cbd5e1'};transform:translate(-50%,-50%);white-space:nowrap;z-index:5`);}
    return path;
  },
  /* 封包沿路徑移動；o.via=已存在的箭頭 id */
  pkt(a,b,o={}){
    const done=o.done;
    if(this.instant){done&&done();return;}
    let path;
    if(o.via){path=this.st.querySelector('#p_'+o.via);if(!path&&a==null){done&&done();return;}}
    if(!path){path=svgEl('path',{d:this.pathD(a,b,o),fill:'none',stroke:'none'});this.svg.appendChild(path);path._tmp=true;}
    const len=path.getTotalLength();
    const d=document.createElement('div');d.className='pkt';const c=COL[o.color||'cy']||o.color;d.style.background=c;d.style.color=c;d.style.boxShadow='0 0 14px '+c;
    if(o.label)d.innerHTML=`<span class="pl">${o.label}</span>`;
    this.cam.appendChild(d);
    const dur=o.dur||900;const t0=performance.now()+(o.delay||0);let raf;
    const rec={fn:()=>{done&&done();},cancel:()=>{cancelAnimationFrame(raf);d.remove();if(path._tmp)path.remove();}};
    if(!o.ambient)this.pending.push(rec);
    const tick=(t)=>{if(!d.isConnected||!path.isConnected){cancelAnimationFrame(raf);d.remove();return;}let k=(t-t0)/dur;if(k<0){d.style.opacity=0;raf=requestAnimationFrame(tick);return;}d.style.opacity=1;
      if(k>=1){rec.cancel();this.pending=this.pending.filter(x=>x!==rec);if(!o.keep)d.remove();try{done&&done();}catch(e){console.error(e);}return;}
      const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const L=o.rev?len*(1-e):len*e;const p=path.getPointAtLength(L);
      d.style.transform=`translate(${p.x}px,${p.y}px)`;raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
  },
  code(id,x,y,w,src,o={}){
    const lines=src.replace(/^\n/,'').replace(/\s+$/,'').split('\n');
    const html=(o.title?`<div class="ct">${o.title}</div>`:'')+lines.map((l,i)=>`<div class="ln" data-i="${i}">${hiLine(l)||' '}</div>`).join('');
    return this.el(id,x,y,w,null,html,'code',`font-size:${o.size||14}px`);
  },
  lines(id,idx,cls='hl',only=true){const e=this.$(id);if(!e)return;e.querySelectorAll('.ln').forEach(l=>{const i=+l.dataset.i;if(only)l.classList.remove('hl','bad','ok','dimln');if([].concat(idx).includes(i)){l.classList.add(cls);if(!this.instant){l.classList.remove('lflash');void l.offsetWidth;l.classList.add('lflash');}}});},
  table(id,x,y,o){
    const ws=o.widths||[];
    const th=o.cols.map((c,i)=>`<th style="${ws[i]?'width:'+ws[i]+'px':''}">${c}</th>`).join('');
    const tb=o.rows.map((r,ri)=>`<tr data-r="${ri}">${r.map((v,ci)=>`<td data-c="${ci}">${v}</td>`).join('')}</tr>`).join('');
    const html=`${o.title?`<div class="tt">${o.title}</div>`:''}<table class="tbl" style="width:100%;font-size:${o.size||14}px"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`;
    return this.el(id,x,y,o.w||null,null,html,'tblw');
  },
  cell(id,r,c,v,flash=true){const e=this.$(id);if(!e)return;const td=e.querySelector(`tr[data-r="${r}"] td[data-c="${c}"]`);if(!td)return;td.innerHTML=v;if(flash&&!this.instant){td.classList.remove('flash');void td.offsetWidth;td.classList.add('flash');}},
  addRow(id,r,flash=true){const e=this.$(id);if(!e)return;const tb=e.querySelector('tbody');const ri=tb.children.length;const tr=document.createElement('tr');tr.dataset.r=ri;tr.innerHTML=r.map((v,ci)=>`<td data-c="${ci}">${v}</td>`).join('');tb.appendChild(tr);if(flash&&!this.instant)tr.querySelectorAll('td').forEach(td=>td.classList.add('flash'));},
  rowcls(id,r,cls,only=false){const e=this.$(id);if(!e)return;if(only)e.querySelectorAll('tr').forEach(t=>t.classList.remove('hl','bad','ok'));[].concat(r).forEach(ri=>{const t=e.querySelector(`tr[data-r="${ri}"]`);if(t){t.classList.add(cls);if(!this.instant){t.classList.remove('rflash');void t.offsetWidth;t.classList.add('rflash');}}});},
  list(id,x,y,w,items,o={}){
    const html=items.map((it,i)=>`<div class="li${(o.n??items.length)>i?' on':''}"><span class="dot" style="${o.dot?'background:'+o.dot:''}"></span><div>${it}</div></div>`).join('');
    return this.el(id,x,y,w,null,html,'list',`font-size:${o.size||19}px`);
  },
  listN(id,n){const e=this.$(id);if(!e)return;e.querySelectorAll('.li').forEach((l,i)=>l.classList.toggle('on',i<n));},
  chat(id,x,y,w,h){return this.el(id,x,y,w,h,'','chat');},
  bub(id,who,name,text){const e=this.$(id);if(!e)return;const b=document.createElement('div');b.className='bub '+who;b.innerHTML=`<div class="who">${name}</div>${text}`;if(this.instant)b.style.animation='none';e.appendChild(b);
    while(e.children.length>(+e.dataset.max||6))e.firstChild.remove();},
  count(id,to,o={}){const e=this.$(id);if(!e)return;const fmt=o.fmt||(v=>Math.round(v).toLocaleString());const from=o.from??0;
    if(this.instant){e.innerHTML=(o.pre||'')+fmt(to)+(o.post||'');return;}
    const dur=o.dur||1200,t0=performance.now();let raf;const rec={fn:()=>{e.innerHTML=(o.pre||'')+fmt(to)+(o.post||'');},cancel:()=>cancelAnimationFrame(raf)};this.pending.push(rec);
    const tick=t=>{const k=Math.min(1,(t-t0)/dur);const v=from+(to-from)*(1-Math.pow(1-k,3));e.innerHTML=(o.pre||'')+fmt(v)+(o.post||'');if(k<1)raf=requestAnimationFrame(tick);else this.pending=this.pending.filter(x=>x!==rec);};raf=requestAnimationFrame(tick);},
  stamp(id,x,y,text,c='rd'){return this.el(id,x,y,null,null,text,'stamp',`color:${COL[c]};border-color:${COL[c]};background:#0b1016cc;z-index:20`);},
  lab(id,x,y,w,h,title,build){const e=this.el(id,x,y,w,h,`<div class="lt">🧪 互動實驗｜${title}</div><div class="lb"></div>`,'lab');if(!e._built){e._built=true;try{build(e.querySelector('.lb'),e);}catch(err){console.error(err);}}return e;},
};
