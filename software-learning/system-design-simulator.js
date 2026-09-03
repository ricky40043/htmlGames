(() => {
  const STORAGE_KEY = 'softwareSystemDesignSimProgressV1';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const esc = v => String(v ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const numFmt = n => n.toLocaleString('zh-Hant-TW');

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveProgress(chapterId, entry) {
    const data = loadProgress();
    const old = data[chapterId] || { attempts: 0, bestScore: 0 };
    data[chapterId] = {
      attempts: old.attempts + 1,
      bestScore: Math.max(old.bestScore, entry.score),
      lastScore: entry.score,
      lastGrade: entry.grade,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data[chapterId];
  }

  function reviewHref(chapterId, sectionId, pageId) {
    const params = new URLSearchParams({ chapter: chapterId, section: sectionId, page: pageId });
    return `system-design-chapter.html?${params.toString()}`;
  }

  function chapterOrder(chapterId) {
    return Number(String(chapterId || '').match(/(\d+)$/)?.[1] || 0);
  }

  function labels(sim) {
    return {
      uptime: sim.uptimeLabel || '可用率 Uptime',
      qoe: sim.qoeLabel || '播放品質 QoE',
      cost: sim.costLabel || '營運效率 Cost'
    };
  }

  function newState(sim) {
    const active = new Set();
    return {
      month: 0, uptime: 100, qoe: 100, costEff: 100, active, usersServed: 0,
      log: [], history: [{ month: 0, uptime: 100, qoe: 100 }], phase: 'briefing'
    };
  }

  function weeklyCostPenalty(sim, active) {
    let total = 0;
    active.forEach(id => { total += sim.components.find(c => c.id === id)?.cost || 0; });
    return total;
  }

  function applyMonthCost(sim, state) {
    const penalty = weeklyCostPenalty(sim, state.active);
    state.costEff = clamp(state.costEff - penalty * 0.6);
  }

  function meterRow(label, value, tone) {
    return `<div class="sim-meter">
      <div class="sim-meter-head"><span>${esc(label)}</span><strong>${Math.round(value)}</strong></div>
      <div class="sim-meter-track"><div class="sim-meter-fill ${tone}" style="width:${clamp(value)}%"></div></div>
    </div>`;
  }

  // Small inline SVG line chart tracing uptime/QoE across the months played so far.
  function historyChart(history, months, lab) {
    const w = 600, h = 110, padL = 8, padR = 8, padT = 10, padB = 20;
    const x = m => padL + (w - padL - padR) * (m / months);
    const y = v => padT + (h - padT - padB) * (1 - clamp(v) / 100);
    const line = key => history.map(p => `${x(p.month).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const gridY = [0, 50, 100].map(v => `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" class="sim-chart-grid"/><text x="${w - padR}" y="${y(v) - 3}" class="sim-chart-axis" text-anchor="end">${v}</text>`).join('');
    const markers = ptKey => history.map(p => `<circle cx="${x(p.month).toFixed(1)}" cy="${y(p[ptKey]).toFixed(1)}" r="3" class="sim-chart-dot ${ptKey}"/>`).join('');
    const monthTicks = history.map(p => `<text x="${x(p.month).toFixed(1)}" y="${h - 5}" class="sim-chart-axis" text-anchor="middle">${p.month}</text>`).join('');
    return `<details class="sim-chart-wrap"><summary>歷史趨勢圖（${esc(lab.uptime.split(' ')[0])} / ${esc(lab.qoe.split(' ')[0])}）</summary>
      <div class="sim-chart-legend"><span class="uptime">— ${esc(lab.uptime.split(' ')[0])}</span><span class="qoe">— ${esc(lab.qoe.split(' ')[0])}</span></div>
      <svg class="sim-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(lab.uptime)}與${esc(lab.qoe)}歷史趨勢">
        ${gridY}
        <polyline points="${line('uptime')}" class="sim-chart-line uptime" fill="none"/>
        <polyline points="${line('qoe')}" class="sim-chart-line qoe" fill="none"/>
        ${markers('uptime')}${markers('qoe')}
        ${monthTicks}
      </svg>
    </details>`;
  }

  function checkChip(sim, id, on) {
    const comp = sim.components.find(c => c.id === id);
    return `<span class="sim-chip ${on ? 'has' : 'missing'}">${on ? '✅' : '❌'} ${esc(comp?.shortName || id)}</span>`;
  }

  function logEntry(sim, entry) {
    const lab = labels(sim);
    const chips = (entry.relevantComponents || []).map(id => checkChip(sim, id, entry.activeSnapshot.includes(id))).join('');
    return `<li class="sim-log-item ${entry.ok ? 'ok' : 'bad'}">
      <div class="sim-log-head"><span class="sim-log-tag">${entry.ok ? 'PASS' : 'FAIL'}</span><span>第 ${entry.month} 個月 · ${esc(entry.title)}</span></div>
      <p class="sim-log-narrative">${esc(entry.narrative)}</p>
      ${chips ? `<div class="sim-log-chips">${chips}</div>` : ''}
      <p class="sim-log-result">${esc(entry.result)}</p>
      <p class="sim-log-delta">${esc(lab.uptime.split(' ')[0])} ${entry.uptime >= 0 ? '+' : ''}${entry.uptime} · ${esc(lab.qoe.split(' ')[0])} ${entry.qoe >= 0 ? '+' : ''}${entry.qoe}</p>
    </li>`;
  }

  // ---------- Topology diagram ----------

  function findNode(topo, id) { return topo.nodes.find(n => n.id === id); }

  function regionBoxesSvg(topo) {
    const groups = {};
    topo.nodes.forEach(n => { if (n.region) { groups[n.region] ??= []; groups[n.region].push(n); } });
    return Object.entries(groups).map(([name, ns]) => {
      const pad = 36;
      const x0 = Math.min(...ns.map(n => n.x)) - pad, y0 = Math.min(...ns.map(n => n.y)) - pad;
      const x1 = Math.max(...ns.map(n => n.x)) + pad, y1 = Math.max(...ns.map(n => n.y)) + pad;
      return `<rect class="sim-topo-region" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="16"/><text class="sim-topo-region-label" x="${x0 + 12}" y="${y0 + 20}">${esc(name)}</text>`;
    }).join('');
  }

  function edgesSvg(topo, active) {
    return topo.edges.map(e => {
      const a = findNode(topo, e.from), b = findNode(topo, e.to);
      if (!a || !b) return '';
      const aOn = a.kind !== 'component' || active.has(a.componentId);
      const bOn = b.kind !== 'component' || active.has(b.componentId);
      const reqOn = !e.requiresComponent || active.has(e.requiresComponent);
      const isActive = aOn && bOn && reqOn;
      const cls = ['sim-topo-edge', e.kind === 'stub' ? 'stub' : '', isActive ? 'active' : 'inactive'].filter(Boolean).join(' ');
      return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-edge="${esc(e.from)}-${esc(e.to)}"/>`;
    }).join('');
  }

  function nodesSvg(topo, state, interactive) {
    return topo.nodes.map(n => {
      const isComponent = n.kind === 'component';
      const on = !isComponent || state.active.has(n.componentId);
      const r = n.size === 'small' ? 15 : n.kind === 'user' ? 25 : 23;
      const cls = ['sim-topo-node', n.kind, on ? 'on' : 'off', isComponent && interactive ? 'clickable' : ''].filter(Boolean).join(' ');
      const comp = isComponent ? state.componentLookup?.get(n.componentId) : null;
      const costText = comp ? (comp.cost > 0 ? `+${comp.cost}` : comp.cost < 0 ? `${comp.cost}` : '±0') : '';
      const badge = n.kind === 'user' ? `<text class="sim-topo-badge" x="${n.x}" y="${n.y + r + 16}">已服務 ${numFmt(state.usersServed || 0)} 人</text>` : '';
      const attrs = isComponent && interactive ? `role="button" tabindex="0" data-toggle="${esc(n.componentId)}"` : '';
      return `<g class="${cls}" data-node="${esc(n.id)}" ${attrs}>
        <circle cx="${n.x}" cy="${n.y}" r="${r}"/>
        <text class="sim-topo-mark" x="${n.x}" y="${n.y + 5}">${isComponent ? (on ? '✓' : '✕') : ''}</text>
        <text class="sim-topo-label" x="${n.x}" y="${n.y + r + 14}">${esc(n.label)}</text>
        ${costText ? `<text class="sim-topo-cost" x="${n.x}" y="${n.y - r - 6}">${esc(costText)}/月</text>` : ''}
        ${badge}
      </g>`;
    }).join('');
  }

  function svgTopology(sim, state, { interactive = false, showControls = false } = {}) {
    const topo = sim.topology;
    if (!topo) return '<p class="sim-topo-missing">這個場景還沒有拓樸圖資料。</p>';
    state.componentLookup = new Map(sim.components.map(c => [c.id, c]));
    const legend = sim.components.map(c => `<a class="sim-topo-legend-item" href="${reviewHref(sim.chapterId, c.sectionId, c.pageId)}" target="_blank" rel="noreferrer">${state.active.has(c.id) ? '✅' : '⬜️'} ${esc(c.shortName)} <small>教材對照 →</small></a>`).join('');
    return `<div class="sim-topo-wrap ${interactive ? '' : 'locked'}">
      <svg class="sim-topo" viewBox="${esc(topo.viewBox)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="架構拓樸圖">
        ${regionBoxesSvg(topo)}
        ${edgesSvg(topo, state.active)}
        ${nodesSvg(topo, state, interactive)}
      </svg>
      ${interactive ? '<p class="sim-topo-hint">點節點可以開關這個能力；圓點連線代表目前流量會不會實際走這條路。</p>' : '<p class="sim-topo-hint">目前是唯讀狀態——結果由你先前的準備決定。</p>'}
      ${showControls ? `<div class="sim-topo-controls">
        <button class="button secondary sim-add-users" type="button" data-add="100">${esc(sim.addUsersLabel || '＋100 使用者')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="watch">${esc(sim.demoLabels?.watch || '▶ 模擬一次讀取請求')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="upload">${esc(sim.demoLabels?.upload || '⬆ 模擬一次寫入請求')}</button>
      </div>` : ''}
      <div class="sim-topo-legend">${legend}</div>
    </div>`;
  }

  // Pure interpolation so this is unit-testable without touching timers/DOM.
  function pointAlongPath(points, t) {
    const segCount = points.length - 1;
    if (segCount <= 0) return points[0];
    const scaled = clamp(t, 0, 1) * segCount;
    const i = Math.min(Math.floor(scaled), segCount - 1);
    const localT = scaled - i;
    const a = points[i], b = points[i + 1];
    return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
  }

  function spawnToken(svgEl, waypoints, { className = '', tokenClass = 'sim-token', durationMs = 1800, onDone } = {}) {
    if (!svgEl || waypoints.length < 2) { onDone?.(null); return null; }
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', '7');
    circle.setAttribute('class', `${tokenClass} ${className}`.trim());
    circle.setAttribute('cx', waypoints[0].x);
    circle.setAttribute('cy', waypoints[0].y);
    svgEl.appendChild(circle);
    const start = Date.now();
    const timer = setInterval(() => {
      const t = (Date.now() - start) / durationMs;
      if (t >= 1) {
        clearInterval(timer);
        const end = waypoints[waypoints.length - 1];
        circle.setAttribute('cx', end.x);
        circle.setAttribute('cy', end.y);
        onDone?.(circle);
        return;
      }
      const p = pointAlongPath(waypoints, t);
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
    }, 40);
    return { circle, stop: () => clearInterval(timer) };
  }

  function waypointsFor(topo, nodeIds) {
    return nodeIds.map(id => findNode(topo, id)).filter(Boolean).map(n => ({ x: n.x, y: n.y }));
  }

  function burstUsers(topo, svgEl) {
    const usersNode = topo.nodes.find(n => n.kind === 'user');
    if (!usersNode || !svgEl) return;
    for (let i = 0; i < 5; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('r', '3');
      c.setAttribute('cx', usersNode.x);
      c.setAttribute('cy', usersNode.y);
      c.setAttribute('class', 'sim-burst-dot');
      const dx = (Math.random() * 44 - 22).toFixed(1);
      const dy = (Math.random() * 44 - 22).toFixed(1);
      c.style.setProperty('--dx', `${dx}px`);
      c.style.setProperty('--dy', `${dy}px`);
      svgEl.appendChild(c);
      setTimeout(() => c.remove(), 900);
    }
  }

  function wireTopologyControls(root, sim, state, onToggle) {
    const svgEl = root.querySelector('svg.sim-topo');
    if (!svgEl) return;
    root.querySelectorAll('[data-toggle]').forEach(g => {
      const activate = () => onToggle(g.dataset.toggle);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(); } });
    });
    root.querySelectorAll('.sim-add-users').forEach(btn => {
      btn.onclick = () => {
        state.usersServed = (state.usersServed || 0) + Number(btn.dataset.add || 100);
        const badge = svgEl.querySelector('.sim-topo-badge');
        if (badge) badge.textContent = `已服務 ${numFmt(state.usersServed)} 人`;
        burstUsers(sim.topology, svgEl);
      };
    });
    root.querySelectorAll('.sim-demo').forEach(btn => {
      btn.onclick = () => {
        const kind = btn.dataset.kind;
        const flowIds = sim.topology.computeFlow(kind, state.active);
        const waypoints = waypointsFor(sim.topology, flowIds);
        svgEl.querySelector('.sim-token-demo')?.remove();
        spawnToken(svgEl, waypoints, { className: kind, tokenClass: 'sim-token-demo', durationMs: 1600 });
      };
    });
  }

  // Animates the "does this month's request survive" moment on the event screen: a token
  // travels the current watch-path and either completes (ok) or stops at the first missing
  // capability (fail) — this is the causal "what happened because of what I did" visual.
  function animateEventOutcome(sim, state, svgEl, event, outcome, done) {
    const topo = sim.topology;
    if (!topo || !svgEl) { setTimeout(done, 200); return; }
    if (event.severity === 'cost') {
      (event.relevantComponents || []).forEach(id => {
        const n = topo.nodes.find(x => x.componentId === id);
        const g = n && svgEl.querySelector(`[data-node="${n.id}"]`);
        g?.classList.add('stressed');
      });
      setTimeout(done, 900);
      return;
    }
    // Events can override which nodes the token visits (`demoFlow`) — the default watch/browse
    // path often doesn't pass through every component (e.g. a retry-budget or session-store
    // node that sits off to the side), so without an override the "break point" visual
    // couldn't land on the node that's actually missing.
    const flowIds = event.demoFlow || topo.computeFlow('watch', state.active);
    // Only look for a break point when the event actually failed — some events succeed via
    // an OR of capabilities (e.g. cache alone is enough even without a read replica), so a
    // "missing" relevant component doesn't always mean the request broke there.
    const missingId = outcome.ok ? null : (event.relevantComponents || []).find(id => !state.active.has(id));
    const missingNode = missingId ? topo.nodes.find(n => n.componentId === missingId) : null;
    let travelIds = flowIds;
    if (missingNode) {
      const idx = flowIds.indexOf(missingNode.id);
      if (idx >= 0) travelIds = flowIds.slice(0, idx + 1);
    }
    const waypoints = waypointsFor(topo, travelIds);
    spawnToken(svgEl, waypoints, {
      className: outcome.ok ? 'ok' : 'bad',
      tokenClass: 'sim-token-event',
      durationMs: 1500,
      onDone: () => {
        if (missingNode) svgEl.querySelector(`[data-node="${missingNode.id}"]`)?.classList.add('failing');
        else if (outcome.ok) waypoints.length && svgEl.querySelectorAll('.sim-topo-node.on').forEach(g => g.classList.add('success'));
        setTimeout(done, 600);
      }
    });
  }

  // ---------- Screens ----------

  function render(root, sim, state) {
    if (state.phase === 'briefing') return renderBriefing(root, sim, state);
    if (state.phase === 'event') return renderEvent(root, sim, state);
    if (state.phase === 'summary') return renderSummary(root, sim, state);
    return renderPlay(root, sim, state);
  }

  function renderBriefing(root, sim, state) {
    root.innerHTML = `<section class="sim-screen sim-briefing">
      <div class="eyebrow">系統設計模擬關卡 · 對應第 ${chapterOrder(sim.chapterId)} 章</div>
      <h1>${esc(sim.title)}</h1>
      <p class="sim-lede">${esc(sim.subtitle)}</p>
      <ul class="sim-briefing-list">${sim.briefing.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <button class="button sim-start" type="button">開始這一年</button>
      <a class="button secondary" href="system-design-chapter.html?chapter=${encodeURIComponent(sim.chapterId)}">先回教材複習</a>
    </section>`;
    root.querySelector('.sim-start').onclick = () => {
      state.phase = 'play';
      render(root, sim, state);
    };
  }

  function renderPlay(root, sim, state) {
    const viewers = sim.viewersAtMonth(state.month);
    const nextEvent = sim.events.find(e => e.month === state.month + 1);
    const lab = labels(sim);
    root.innerHTML = `<section class="sim-screen sim-play">
      <header class="sim-dashboard-head">
        <div class="eyebrow">${esc(sim.title)}</div>
        <h1>第 ${state.month} / ${sim.months} 個月</h1>
        <p class="sim-viewers">${esc(sim.viewersLabel || '目前尖峰同時使用人數估計')}：<strong>${numFmt(viewers)}</strong></p>
      </header>
      <div class="sim-meters">
        ${meterRow(lab.uptime, state.uptime, state.uptime >= 80 ? 'good' : state.uptime >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.qoe, state.qoe, state.qoe >= 80 ? 'good' : state.qoe >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.cost, state.costEff, state.costEff >= 80 ? 'good' : state.costEff >= 50 ? 'warn' : 'bad')}
      </div>
      ${svgTopology(sim, state, { interactive: true, showControls: true })}
      ${nextEvent ? `<div class="sim-hint">下個月可能會發生足以考驗架構的事件——先決定好要不要調整能力配置。</div>` : ''}
      <button class="button sim-advance" type="button">${state.month >= sim.months ? '查看今年總結' : `推進到第 ${state.month + 1} 個月`}</button>
      ${historyChart(state.history, sim.months, lab)}
      ${state.log.length ? `<section class="sim-log"><h2>即時事件紀錄</h2><ul>${state.log.map(e => logEntry(sim, e)).join('')}</ul></section>` : ''}
    </section>`;

    wireTopologyControls(root, sim, state, componentId => {
      if (state.active.has(componentId)) state.active.delete(componentId); else state.active.add(componentId);
      render(root, sim, state);
    });

    root.querySelector('.sim-advance').onclick = () => {
      if (state.month >= sim.months) {
        state.phase = 'summary';
        return render(root, sim, state);
      }
      state.month += 1;
      applyMonthCost(sim, state);
      const event = sim.events.find(e => e.month === state.month);
      if (event) {
        state.pendingEvent = event;
        state.phase = 'event';
      }
      render(root, sim, state);
    };
  }

  function renderEvent(root, sim, state) {
    const event = state.pendingEvent;
    const chips = (event.relevantComponents || []).map(id => {
      const comp = sim.components.find(c => c.id === id);
      const on = state.active.has(id);
      return `<span class="sim-chip pending ${on ? 'has' : 'missing'}">${on ? '已裝' : '未裝'} · ${esc(comp?.shortName || id)}</span>`;
    }).join('');
    root.innerHTML = `<section class="sim-screen sim-event">
      <div class="eyebrow">第 ${state.month} 個月 · 事件發生</div>
      <h1>${esc(event.title)}</h1>
      <p class="sim-lede">${esc(event.narrative)}</p>
      ${chips ? `<div class="sim-event-check"><small>這次事件會考驗：</small><div class="sim-log-chips">${chips}</div></div>` : ''}
      ${svgTopology(sim, state, { interactive: false, showControls: false })}
      <p class="sim-event-hint">結果由你這幾個月裝上的架構能力決定，現在已經來不及調整。</p>
      <button class="button sim-resolve" type="button">查看結果</button>
      <div id="simEventResult"></div>
    </section>`;

    root.querySelector('.sim-resolve').onclick = () => {
      const resolveBtn = root.querySelector('.sim-resolve');
      resolveBtn.disabled = true;
      const outcome = event.resolve(state.active);
      const svgEl = root.querySelector('svg.sim-topo');
      animateEventOutcome(sim, state, svgEl, event, outcome, () => {
        state.uptime = clamp(state.uptime + (outcome.uptime || 0));
        state.qoe = clamp(state.qoe + (outcome.qoe || 0));
        state.log.push({
          month: state.month,
          title: event.title,
          narrative: event.narrative,
          result: outcome.log,
          ok: outcome.ok,
          uptime: outcome.uptime || 0,
          qoe: outcome.qoe || 0,
          relevantComponents: event.relevantComponents || [],
          activeSnapshot: [...state.active]
        });
        state.history.push({ month: state.month, uptime: state.uptime, qoe: state.qoe });
        const lab = labels(sim);
        const resultDiv = root.querySelector('#simEventResult');
        resultDiv.innerHTML = `<div class="sim-event-outcome ${outcome.ok ? 'ok' : 'bad'}">
          <p>${esc(outcome.log)}</p>
          <p class="sim-log-delta">${esc(lab.uptime.split(' ')[0])} ${outcome.uptime >= 0 ? '+' : ''}${outcome.uptime || 0} · ${esc(lab.qoe.split(' ')[0])} ${outcome.qoe >= 0 ? '+' : ''}${outcome.qoe || 0}</p>
          <button class="button sim-continue" type="button">繼續</button>
        </div>`;
        resultDiv.querySelector('.sim-continue').onclick = () => {
          state.pendingEvent = null;
          state.phase = 'play';
          render(root, sim, state);
        };
      });
    };
  }

  function renderSummary(root, sim, state) {
    const score = Math.round(state.uptime * 0.4 + state.qoe * 0.35 + state.costEff * 0.25);
    const grade = sim.grade(score);
    const saved = saveProgress(sim.chapterId, { score, grade: grade.letter });
    const lab = labels(sim);
    root.innerHTML = `<section class="sim-screen sim-summary">
      <div class="eyebrow">今年結束</div>
      <h1>總評 ${grade.letter}｜${score} 分</h1>
      <p class="sim-lede">${esc(grade.text)}</p>
      <div class="sim-meters">
        ${meterRow(lab.uptime, state.uptime, state.uptime >= 80 ? 'good' : state.uptime >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.qoe, state.qoe, state.qoe >= 80 ? 'good' : state.qoe >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.cost, state.costEff, state.costEff >= 80 ? 'good' : state.costEff >= 50 ? 'warn' : 'bad')}
      </div>
      ${svgTopology(sim, state, { interactive: false, showControls: false })}
      <p class="sim-best">歷史最高：${saved.bestScore} 分 · 已挑戰 ${saved.attempts} 次</p>
      ${historyChart(state.history, sim.months, lab)}
      <section class="sim-log"><h2>逐月復盤</h2><ul>${state.log.map(e => logEntry(sim, e)).join('')}</ul></section>
      <div class="result-actions">
        <button class="button sim-restart" type="button">重新挑戰</button>
        <a class="button secondary" href="system-design-chapter.html?chapter=${encodeURIComponent(sim.chapterId)}">回教材複習沒守住的部分</a>
        <a class="button secondary" href="system-design.html">回到章節目錄</a>
      </div>
    </section>`;
    root.querySelector('.sim-restart').onclick = () => {
      Object.assign(state, newState(sim));
      render(root, sim, state);
    };
  }

  function boot() {
    const root = document.querySelector('#simRoot');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const chapterId = params.get('chapter') || 'sd-book-14';
    const sim = window.SYSTEM_DESIGN_SIM?.[chapterId];
    if (!sim) {
      const available = Object.keys(window.SYSTEM_DESIGN_SIM || {});
      root.innerHTML = `<section class="sim-screen"><h1>這一章還沒有模擬關卡</h1><p>目前做了模擬關卡的章節：${available.length ? esc(available.join('、')) : '（無）'}</p><a class="button" href="system-design.html">回到章節目錄</a></section>`;
      return;
    }
    document.title = `模擬關卡｜${sim.title}`;
    const state = newState(sim);
    render(root, sim, state);
  }

  // Exposed only for the automated test harness (jsdom can't fast-forward real timers, so the
  // pure geometry used by the token animation needs to be reachable and testable in isolation).
  window.__simTestHooks = { pointAlongPath };

  boot();
})();
