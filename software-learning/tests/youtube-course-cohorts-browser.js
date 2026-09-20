(async()=>{const h=window.__simTestHooks,s=h.stateRef(),sim=window.SYSTEM_DESIGN_SIM['sd-book-14'];const checks=[];const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
const groups=()=>h.topoOf(sim,s).nodes.filter(n=>n.headcount);
ok(!document.querySelector('.yw-diagram'),'duplicate view removed');
ok(document.querySelector('[data-node="uploadSplitter_tw"]')||document.querySelector('[data-node="transcodedStorage"]'),'original full topology');
document.querySelector('[data-audience-add-count]').value='10';const svg=document.querySelector('svg.sim-topo');document.querySelector('.sim-add-users').click();
ok(document.querySelector('svg.sim-topo')===svg,'adding users preserves live SVG');ok(groups().reduce((a,g)=>a+g.headcount,0)===10,'ten real cohort members');const ids=groups().flatMap(g=>g.members).sort().join();
document.querySelector('[data-cohort-count]').value=5;document.querySelector('[data-cohort-weak]').click();
ok(groups().length===2&&groups().every(g=>g.headcount===5),'five plus five split');ok(document.querySelectorAll('.sim-cohort-weak').length===1,'weak overlay only affected group');ok(groups().flatMap(g=>g.members).sort().join()===ids,'member identities preserved');
document.querySelector('[data-cohort-good]').click();ok(groups().length===1&&groups()[0].headcount===10,'merge restored');
document.querySelector('[data-cohort-count]').value=5;document.querySelector('[data-cohort-weak]').click();
const before=s.month;document.querySelector('.sim-advance').click();ok(s.month===before+1,'month advanced');ok(groups().flatMap(g=>g.members).sort().join()===ids,'month retains cohort identities');ok(svg===document.querySelector('svg.sim-topo'),'month retains live topology');
ok(![...document.querySelectorAll('.sim-add-users,[data-kind="upload"],.sim-speed-btn')].some(e=>e.closest('details:not([open])')&&e.matches('.sim-add-users,[data-kind="upload"]')),'upload and add remain visible');
return checks;})()
