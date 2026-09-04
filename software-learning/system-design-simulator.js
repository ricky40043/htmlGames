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

  // ---------- Component options (每個能力可以選不同做法/策略，不只是開關) ----------
  // Every component declares `options`, an ordered list starting with an 'off' entry. Clicking
  // a node cycles forward through this list. `state.choice[componentId]` holds the selected
  // option id; a missing/invalid entry falls back to the first (off) option.

  function findComponent(sim, componentId) {
    return sim.components.find(c => c.id === componentId);
  }

  function currentOptionId(sim, componentId, state) {
    const comp = findComponent(sim, componentId);
    if (!comp) return 'off';
    const chosen = state.choice[componentId];
    if (chosen && comp.options.some(o => o.id === chosen)) return chosen;
    return comp.options[0]?.id || 'off';
  }

  function currentOption(sim, componentId, state) {
    const comp = findComponent(sim, componentId);
    const id = currentOptionId(sim, componentId, state);
    return comp?.options.find(o => o.id === id) || { id: 'off', label: '關閉', cost: 0 };
  }

  function nextOptionId(sim, componentId, state) {
    const comp = findComponent(sim, componentId);
    if (!comp) return 'off';
    const ids = comp.options.map(o => o.id);
    const idx = ids.indexOf(currentOptionId(sim, componentId, state));
    return ids[(idx + 1) % ids.length];
  }

  // Passed into each scenario's `resolve`/`computeFlow` functions instead of the raw state, so
  // scenario data can either do a simple on/off check (`ctx.has(id)`) or branch on exactly
  // which strategy was chosen (`ctx.get(id)`).
  function makeChoiceCtx(sim, state) {
    return {
      get: id => currentOptionId(sim, id, state),
      has: id => currentOptionId(sim, id, state) !== 'off',
      option: id => currentOption(sim, id, state)
    };
  }

  function snapshotChoices(sim, state) {
    const snap = {};
    sim.components.forEach(c => { snap[c.id] = currentOptionId(sim, c.id, state); });
    return snap;
  }

  function newState(sim) {
    return {
      month: 0, uptime: 100, qoe: 100, costEff: 100, choice: {}, usersServed: 0, speed: 1,
      chunk: null, chunkTimer: null,
      log: [], history: [{ month: 0, uptime: 100, qoe: 100 }], phase: 'briefing'
    };
  }

  function weeklyCostPenalty(sim, state) {
    let total = 0;
    sim.components.forEach(c => { total += currentOption(sim, c.id, state).cost || 0; });
    return total;
  }

  function applyMonthCost(sim, state) {
    const penalty = weeklyCostPenalty(sim, state);
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

  function checkChip(sim, componentId, optionId) {
    const comp = findComponent(sim, componentId);
    const opt = comp?.options.find(o => o.id === optionId);
    const on = optionId !== 'off';
    return `<span class="sim-chip ${on ? 'has' : 'missing'}">${on ? '✅' : '❌'} ${esc(comp?.shortName || componentId)}：${esc(opt?.label || optionId)}</span>`;
  }

  function logEntry(sim, entry) {
    const lab = labels(sim);
    const chips = (entry.relevantComponents || []).map(id => checkChip(sim, id, entry.choiceSnapshot[id])).join('');
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

  function nodeIsOn(sim, state, node) {
    return node.kind !== 'component' || currentOptionId(sim, node.componentId, state) !== 'off';
  }

  function edgesSvg(sim, state) {
    const topo = sim.topology;
    return topo.edges.map(e => {
      const a = findNode(topo, e.from), b = findNode(topo, e.to);
      if (!a || !b) return '';
      // An edge is only "inactive" when it explicitly requires a capability that's off (e.g. a
      // direct-upload bypass that only exists once you've turned it on). It must NOT go dashed
      // just because the node at one end is a resilience/cost capability that's currently off —
      // that node is still structurally there (e.g. CDN with popularity-tiering off is still a
      // CDN, just not cost-optimized); dimming its wires falsely implies the path is broken.
      // The node's own ✓/✕ colour is what shows whether that capability is currently on.
      const isActive = !e.requiresComponent || currentOptionId(sim, e.requiresComponent, state) !== 'off';
      const cls = ['sim-topo-edge', e.kind === 'stub' ? 'stub' : '', isActive ? 'active' : 'inactive'].filter(Boolean).join(' ');
      return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-edge="${esc(e.from)}-${esc(e.to)}"/>`;
    }).join('');
  }

  // A node whose current option represents "N instances behind this point" (e.g. an API
  // server pool: off = one fragile server, a richer option = several) is laid out as a small
  // horizontal cluster instead of one circle — this is what makes "I added another server"
  // visible, and lets a token land on a specific, randomly-picked instance instead of an
  // abstract single dot.
  function clusterPositions(sim, state, node) {
    if (!node.pool) return [{ x: node.x, y: node.y }];
    const opt = currentOption(sim, node.componentId, state);
    const count = Math.max(1, opt.instances || 1);
    const spacing = 26;
    const startX = node.x - (spacing * (count - 1)) / 2;
    return Array.from({ length: count }, (_, i) => ({ x: startX + i * spacing, y: node.y }));
  }

  function nodeInnerSvg(sim, state, n, interactive) {
    const isComponent = n.kind === 'component';
    const on = nodeIsOn(sim, state, n);
    const r = n.pool ? 13 : n.size === 'small' ? 15 : n.kind === 'user' ? 25 : 23;
    const labelOffset = n.size === 'small' ? 15 : n.kind === 'user' ? 25 : 23;
    const positions = clusterPositions(sim, state, n);
    const opt = isComponent ? currentOption(sim, n.componentId, state) : null;
    const countNote = n.pool ? `（${positions.length} 台）` : '';
    const costText = opt ? `${opt.cost > 0 ? '+' : ''}${opt.cost}/月 · ${opt.label}${countNote}` : '';
    const badge = n.kind === 'user' ? `<text class="sim-topo-badge" x="${n.x}" y="${n.y + labelOffset + 16}">已服務 ${numFmt(state.usersServed || 0)} 人</text>` : '';
    const circles = positions.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${r}"/>`).join('');
    const marks = isComponent ? positions.map(p => `<text class="sim-topo-mark" x="${p.x}" y="${p.y + 5}">${on ? '✓' : '✕'}</text>`).join('') : '';
    return `${circles}${marks}
        <text class="sim-topo-label" x="${n.x}" y="${n.y + labelOffset + 14}">${esc(n.label)}</text>
        ${costText ? `<text class="sim-topo-cost" x="${n.x}" y="${n.y - labelOffset - 6}">${esc(costText)}</text>` : ''}
        ${badge}`;
  }

  function nodesSvg(sim, state, interactive) {
    const topo = sim.topology;
    return topo.nodes.map(n => {
      const isComponent = n.kind === 'component';
      const on = nodeIsOn(sim, state, n);
      const cls = ['sim-topo-node', n.kind, on ? 'on' : 'off', isComponent && interactive ? 'clickable' : '', n.pool ? 'pool' : ''].filter(Boolean).join(' ');
      const attrs = isComponent && interactive ? `role="button" tabindex="0" data-toggle="${esc(n.componentId)}"` : '';
      return `<g class="${cls}" data-node="${esc(n.id)}" ${attrs}>${nodeInnerSvg(sim, state, n, interactive)}</g>`;
    }).join('');
  }

  const SPEED_OPTIONS = [0.1, 0.5, 1, 2];

  function svgTopology(sim, state, { interactive = false, showControls = false } = {}) {
    const topo = sim.topology;
    if (!topo) return '<p class="sim-topo-missing">這個場景還沒有拓樸圖資料。</p>';
    const legend = sim.components.map(c => {
      const opt = currentOption(sim, c.id, state);
      const on = opt.id !== 'off';
      return `<a class="sim-topo-legend-item" data-legend="${esc(c.id)}" href="${reviewHref(sim.chapterId, c.sectionId, c.pageId)}" target="_blank" rel="noreferrer"><span class="sim-legend-mark">${on ? '✅' : '⬜️'}</span> ${esc(c.shortName)}：<span class="sim-legend-choice">${esc(opt.label)}</span> <small>教材對照 →</small></a>`;
    }).join('');
    const speedControls = showControls ? `<div class="sim-speed-controls">
        <span class="sim-speed-label">播放速度</span>
        ${SPEED_OPTIONS.map(s => `<button class="button secondary sim-speed-btn ${state.speed === s ? 'active' : ''}" type="button" data-speed="${s}">${s}x</button>`).join('')}
      </div>` : '';
    return `<div class="sim-topo-wrap ${interactive ? '' : 'locked'}">
      <svg class="sim-topo" viewBox="${esc(topo.viewBox)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="架構拓樸圖">
        ${regionBoxesSvg(topo)}
        ${edgesSvg(sim, state)}
        ${nodesSvg(sim, state, interactive)}
      </svg>
      ${interactive ? '<p class="sim-topo-hint">點節點可以循環切換這個能力的不同做法（關閉→做法一→做法二→…）；圓點連線代表目前流量會不會實際走這條路。</p>' : '<p class="sim-topo-hint">目前是唯讀狀態——結果由你先前選的做法決定。</p>'}
      ${showControls ? `<div class="sim-topo-controls">
        <button class="button secondary sim-add-users" type="button" data-add="100">${esc(sim.addUsersLabel || '＋100 使用者')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="watch">${esc(sim.demoLabels?.watch || '▶ 模擬一次讀取請求')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="upload">${esc(sim.demoLabels?.upload || '⬆ 模擬一次寫入請求')}</button>
      </div>` : ''}
      ${speedControls}
      <div class="sim-trace">
        <div class="sim-trace-head"><span>即時處理紀錄</span><button class="sim-trace-clear" type="button">清空</button></div>
        <div class="sim-trace-body"></div>
      </div>
      <div class="sim-topo-legend">${legend}</div>
    </div>`;
  }

  // Appends one timestamped line to the trace-log panel — this is the "what actually happened
  // when I did X" detail view, one step per node the request/token visits.
  function traceLine(root, text, tone = '') {
    const body = root.querySelector('.sim-trace-body');
    if (!body) return;
    const now = new Date();
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 100)}`;
    const line = document.createElement('div');
    line.className = `sim-trace-line ${tone}`.trim();
    const tsSpan = document.createElement('span');
    tsSpan.className = 'sim-trace-ts';
    tsSpan.textContent = stamp;
    line.appendChild(tsSpan);
    line.appendChild(document.createTextNode(text));
    body.appendChild(line);
    while (body.children.length > 50) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }

  function wireTraceClear(root) {
    root.querySelector('.sim-trace-clear')?.addEventListener('click', () => {
      const body = root.querySelector('.sim-trace-body');
      if (body) body.innerHTML = '';
    });
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

  function spawnToken(svgEl, waypoints, { className = '', tokenClass = 'sim-token', durationMs = 1800, onDone, onHop } = {}) {
    if (!svgEl || waypoints.length < 2) { onDone?.(null); return null; }
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', '7');
    circle.setAttribute('class', `${tokenClass} ${className}`.trim());
    circle.setAttribute('cx', waypoints[0].x);
    circle.setAttribute('cy', waypoints[0].y);
    svgEl.appendChild(circle);
    const start = Date.now();
    const segCount = waypoints.length - 1;
    let nextHop = 1;
    const fireHopsUpTo = t => {
      while (nextHop < waypoints.length && t >= nextHop / segCount) {
        onHop?.(nextHop);
        nextHop++;
      }
    };
    const timer = setInterval(() => {
      const t = (Date.now() - start) / durationMs;
      if (t >= 1) {
        clearInterval(timer);
        fireHopsUpTo(1);
        const end = waypoints[waypoints.length - 1];
        circle.setAttribute('cx', end.x);
        circle.setAttribute('cy', end.y);
        onDone?.(circle);
        return;
      }
      fireHopsUpTo(t);
      const p = pointAlongPath(waypoints, t);
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
    }, 40);
    return { circle, stop: () => clearInterval(timer) };
  }

  // Picks ONE instance position per pool node the flow passes through (a different random
  // server each time), so a token visibly lands on a specific box instead of an abstract point.
  function waypointsFor(sim, state, nodeIds) {
    const topo = sim.topology;
    return nodeIds.map(id => findNode(topo, id)).filter(Boolean).map(n => {
      const positions = clusterPositions(sim, state, n);
      return positions[Math.floor(Math.random() * positions.length)];
    });
  }

  // Cycling a capability's option used to trigger a full render() — that wiped the trace log,
  // killed any in-flight token animation, and flashed the whole screen on every click. This
  // updates only the node, its edges, and its legend row in place. For pool nodes the instance
  // *count* can change between options, so the node's inner markup is rebuilt (still scoped to
  // just this one <g>, not the whole screen) rather than patched field-by-field.
  function updateComponentVisual(root, sim, state, componentId) {
    const topo = sim.topology;
    const g = topo.nodes.find(n => n.componentId === componentId);
    if (!g) return;
    const opt = currentOption(sim, componentId, state);
    const on = opt.id !== 'off';
    const nodeEl = root.querySelector(`[data-node="${g.id}"]`);
    if (nodeEl) {
      nodeEl.classList.toggle('on', on);
      nodeEl.classList.toggle('off', !on);
      const interactive = nodeEl.hasAttribute('data-toggle');
      nodeEl.innerHTML = nodeInnerSvg(sim, state, g, interactive);
    }
    // Only edges that explicitly require this component ever change state when it's toggled —
    // every other edge is a static structural connection (see the note in edgesSvg above).
    topo.edges.forEach(e => {
      if (e.requiresComponent !== componentId) return;
      const isActive = currentOptionId(sim, componentId, state) !== 'off';
      const line = root.querySelector(`[data-edge="${e.from}-${e.to}"]`);
      if (line) {
        line.classList.toggle('active', isActive);
        line.classList.toggle('inactive', !isActive);
      }
    });
    const legendEl = root.querySelector(`[data-legend="${componentId}"]`);
    if (legendEl) {
      legendEl.querySelector('.sim-legend-mark').textContent = on ? '✅' : '⬜️';
      legendEl.querySelector('.sim-legend-choice').textContent = opt.label;
    }
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

  // A batch of new users isn't just a decorative puff of dots at the users node — some of them
  // actually go watch something. Fire a few real "watch" tokens along the current path (same
  // mechanic as the manual ▶ demo button), staggered slightly so they don't land in a single
  // frame, and let the topology visually show organic traffic happening.
  function spawnAmbientViewers(root, sim, state, svgEl, batchSize) {
    const topo = sim.topology;
    if (!topo?.computeFlow) return;
    const ctx = makeChoiceCtx(sim, state);
    const flowIds = topo.computeFlow('watch', ctx);
    if (flowIds.length < 2) return;
    const count = clamp(Math.round(batchSize / 40), 1, 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Recomputed per token (not hoisted) so each simulated viewer that lands on a pool
        // node (e.g. the API server pool) can be routed to a different random instance.
        const waypoints = waypointsFor(sim, state, flowIds);
        spawnToken(svgEl, waypoints, {
          className: 'ambient',
          tokenClass: 'sim-token-ambient',
          durationMs: (1100 + Math.random() * 900) / (state.speed || 1),
          onDone: circle => setTimeout(() => circle?.remove(), 300 / (state.speed || 1))
        });
      }, Math.random() * 650);
    }
    traceLine(root, `其中約 ${numFmt(count)} 位使用者立刻開始觀看內容`);
  }

  function wireTopologyControls(root, sim, state, onCycle) {
    const svgEl = root.querySelector('svg.sim-topo');
    if (!svgEl) return;
    root.querySelectorAll('[data-toggle]').forEach(g => {
      const activate = () => onCycle(g.dataset.toggle);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(); } });
    });
    root.querySelectorAll('.sim-add-users').forEach(btn => {
      btn.onclick = () => {
        const batch = Number(btn.dataset.add || 100);
        state.usersServed = (state.usersServed || 0) + batch;
        const badge = svgEl.querySelector('.sim-topo-badge');
        if (badge) badge.textContent = `已服務 ${numFmt(state.usersServed)} 人`;
        burstUsers(sim.topology, svgEl);
        traceLine(root, `湧入 ${numFmt(batch)} 位新使用者`, 'head');
        spawnAmbientViewers(root, sim, state, svgEl, batch);
      };
    });
    root.querySelectorAll('.sim-demo').forEach(btn => {
      btn.onclick = () => {
        const kind = btn.dataset.kind;
        const ctx = makeChoiceCtx(sim, state);
        const flowIds = sim.topology.computeFlow(kind, ctx);
        const waypoints = waypointsFor(sim, state, flowIds);
        svgEl.querySelector('.sim-token-demo')?.remove();
        traceLine(root, `— 開始模擬：${btn.textContent.trim()} —`, 'head');
        spawnToken(svgEl, waypoints, {
          className: kind, tokenClass: 'sim-token-demo',
          durationMs: 1600 / (state.speed || 1),
          onHop: idx => {
            const n = findNode(sim.topology, flowIds[idx]);
            traceLine(root, `抵達「${n?.label || flowIds[idx]}」${n?.arriveLabel ? '：' + n.arriveLabel : ''}`);
          },
          onDone: () => traceLine(root, '— 完成 —', 'done')
        });
      };
    });
    root.querySelectorAll('[data-speed]').forEach(btn => {
      btn.onclick = () => {
        state.speed = Number(btn.dataset.speed);
        root.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', b === btn));
      };
    });
  }

  // Animates the "does this month's request survive" moment on the event screen: a token
  // travels the current watch-path and either completes (ok) or stops at the first capability
  // that's still switched off (fail) — this is the causal "what happened because of what I
  // did" visual. The *magnitude* of the outcome (which strategy, not just on/off) lives in the
  // narrative text and score deltas the scenario's own resolve() function returns.
  function animateEventOutcome(root, sim, state, svgEl, event, outcome, done) {
    const topo = sim.topology;
    if (!topo || !svgEl) { setTimeout(done, 200); return; }
    if (event.severity === 'cost') {
      traceLine(root, `— 帳務／成本事件：${event.title} —`, 'head');
      (event.relevantComponents || []).forEach(id => {
        const n = topo.nodes.find(x => x.componentId === id);
        const g = n && svgEl.querySelector(`[data-node="${n.id}"]`);
        g?.classList.add('stressed');
        if (n) traceLine(root, `「${n.label}」承受成本壓力`);
      });
      setTimeout(done, 900 / (state.speed || 1));
      return;
    }
    // Events can override which nodes the token visits (`demoFlow`) — the default watch/browse
    // path often doesn't pass through every component (e.g. a small satellite node that sits
    // off to the side), so without an override the "break point" visual couldn't land on the
    // node that's actually missing.
    const flowIds = event.demoFlow || topo.computeFlow('watch', makeChoiceCtx(sim, state));
    // Only look for a break point when the event actually failed — some events succeed via an
    // OR of capabilities, so a "still off" relevant component doesn't always mean it broke there.
    const missingId = outcome.ok ? null : (event.relevantComponents || []).find(id => currentOptionId(sim, id, state) === 'off');
    const missingNode = missingId ? topo.nodes.find(n => n.componentId === missingId) : null;
    let travelIds = flowIds;
    if (missingNode) {
      const idx = flowIds.indexOf(missingNode.id);
      if (idx >= 0) travelIds = flowIds.slice(0, idx + 1);
    }
    const waypoints = waypointsFor(sim, state, travelIds);
    traceLine(root, `— 事件發生：${event.title} —`, 'head');
    spawnToken(svgEl, waypoints, {
      className: outcome.ok ? 'ok' : 'bad',
      tokenClass: 'sim-token-event',
      durationMs: 1500 / (state.speed || 1),
      onHop: idx => {
        const n = findNode(topo, travelIds[idx]);
        traceLine(root, `抵達「${n?.label || travelIds[idx]}」${n?.arriveLabel ? '：' + n.arriveLabel : ''}`);
      },
      onDone: () => {
        if (missingNode) {
          svgEl.querySelector(`[data-node="${missingNode.id}"]`)?.classList.add('failing');
          traceLine(root, `⚠️ 在「${missingNode.label}」中斷——這個能力目前是關閉的。`, 'bad');
        } else if (outcome.ok) {
          waypoints.length && svgEl.querySelectorAll('.sim-topo-node.on').forEach(g => g.classList.add('success'));
          traceLine(root, '✅ 請求順利完成。', 'ok');
        }
        setTimeout(done, 600 / (state.speed || 1));
      }
    });
  }

  // ---------- Chunk-upload sandbox ----------
  // A free-play "kill the server mid-upload" experiment, separate from the scripted monthly
  // events: start a chunked upload, crash it whenever you want, then see whether recovery
  // resumes from where it broke or has to retransmit the whole thing.

  function renderChunkLab(sim) {
    const cs = sim.chunkSim;
    if (!cs) return '';
    const resumeComp = findComponent(sim, cs.resumeComponentId);
    return `<section class="sim-chunklab">
      <h2>🧪 ${esc(cs.label || '上傳穩定性實驗室')}</h2>
      <p class="sim-chunklab-desc">${esc(cs.desc || `模擬上傳一個大檔案，過程中你可以隨時讓伺服器當機，看復原時是從中斷點繼續，還是整個重傳——結果取決於你現在有沒有開啟「${resumeComp?.name || ''}」。`)}</p>
      <div class="sim-chunk-track"><div class="sim-chunk-fill" style="width:0%"></div></div>
      <p class="sim-chunk-label">尚未開始</p>
      <div class="sim-chunklab-actions">
        <button class="button secondary sim-chunk-start" type="button">${esc(cs.startLabel || '開始上傳')}</button>
        <button class="button secondary sim-chunk-crash" type="button" disabled>💥 現在讓伺服器壞掉</button>
        <button class="button secondary sim-chunk-recover" type="button" disabled>🔌 觸發重新連線</button>
      </div>
    </section>`;
  }

  function wireChunkLab(root, sim, state) {
    const cs = sim.chunkSim;
    if (!cs) return;
    // A previous mount may have left a ticking interval pointed at now-detached DOM nodes —
    // always clear it before wiring the fresh one.
    if (state.chunkTimer) { clearInterval(state.chunkTimer); state.chunkTimer = null; }

    const track = root.querySelector('.sim-chunk-fill');
    const label = root.querySelector('.sim-chunk-label');
    const startBtn = root.querySelector('.sim-chunk-start');
    const crashBtn = root.querySelector('.sim-chunk-crash');
    const recoverBtn = root.querySelector('.sim-chunk-recover');
    const svgEl = root.querySelector('svg.sim-topo');
    if (!track) return;

    const setProgress = () => {
      const pct = Math.round((state.chunk.done / state.chunk.total) * 100);
      track.style.width = `${pct}%`;
      label.textContent = state.chunk.crashed
        ? `⚠️ 伺服器已當機 · 已完成 ${state.chunk.done}/${state.chunk.total} 個區塊`
        : state.chunk.done >= state.chunk.total
          ? `✅ 上傳完成 · 實際傳送 ${state.chunk.sent} 個區塊（重傳 ${state.chunk.resent} 個）`
          : `上傳中 · ${state.chunk.done}/${state.chunk.total} 個區塊`;
    };

    const tickChunk = () => {
      state.chunk.done += 1;
      state.chunk.sent += 1;
      traceLine(root, `區塊 ${state.chunk.done}/${state.chunk.total} 上傳完成 ✓`);
      setProgress();
      if (state.chunk.done >= state.chunk.total) {
        clearInterval(state.chunkTimer);
        state.chunkTimer = null;
        startBtn.disabled = false;
        crashBtn.disabled = true;
        recoverBtn.disabled = true;
        traceLine(root, `— 上傳全部完成，共實際傳送 ${state.chunk.sent} 個區塊，其中重傳 ${state.chunk.resent} 個 —`, 'done');
      }
    };

    const startUpload = () => {
      state.chunk = { done: 0, total: cs.total, crashed: false, sent: 0, resent: 0 };
      startBtn.disabled = true;
      crashBtn.disabled = false;
      recoverBtn.disabled = true;
      traceLine(root, `— 開始上傳：${cs.label || '大型檔案'}（共 ${cs.total} 個區塊）—`, 'head');
      setProgress();
      state.chunkTimer = setInterval(tickChunk, 700 / (state.speed || 1));
    };

    startBtn.onclick = startUpload;

    crashBtn.onclick = () => {
      clearInterval(state.chunkTimer);
      state.chunkTimer = null;
      state.chunk.crashed = true;
      crashBtn.disabled = true;
      recoverBtn.disabled = false;
      traceLine(root, `⚠️ 伺服器在區塊 ${state.chunk.done}/${state.chunk.total} 時當機！`, 'bad');
      svgEl?.querySelector(`[data-node="${cs.crashNodeId}"]`)?.classList.add('failing');
      setProgress();
    };

    recoverBtn.onclick = () => {
      recoverBtn.disabled = true;
      svgEl?.querySelector(`[data-node="${cs.crashNodeId}"]`)?.classList.remove('failing');
      const canResume = currentOptionId(sim, cs.resumeComponentId, state) !== 'off';
      state.chunk.crashed = false;
      if (canResume) {
        traceLine(root, `✅ 偵測到「${findComponent(sim, cs.resumeComponentId)?.name || '斷點續傳'}」：從區塊 ${state.chunk.done + 1}/${state.chunk.total} 繼續，不重傳已完成的部分。`, 'ok');
      } else {
        traceLine(root, `🔁 沒有斷點續傳機制：必須整份重傳，從區塊 1/${state.chunk.total} 重新開始。`, 'bad');
        state.chunk.resent += state.chunk.done;
        state.chunk.done = 0;
      }
      crashBtn.disabled = false;
      setProgress();
      state.chunkTimer = setInterval(tickChunk, 700 / (state.speed || 1));
    };

    // Restore the panel if an upload was already in progress before this re-render (e.g. the
    // player toggled a capability mid-upload).
    if (state.chunk) {
      const finished = state.chunk.done >= state.chunk.total && !state.chunk.crashed;
      startBtn.disabled = !finished;
      crashBtn.disabled = state.chunk.crashed || finished;
      recoverBtn.disabled = !state.chunk.crashed;
      setProgress();
      if (!state.chunk.crashed && !finished) {
        state.chunkTimer = setInterval(tickChunk, 700 / (state.speed || 1));
      }
    }
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
      ${renderChunkLab(sim)}
      ${nextEvent ? `<div class="sim-hint">下個月可能會發生足以考驗架構的事件——先決定好要不要調整能力配置。</div>` : ''}
      <button class="button sim-advance" type="button">${state.month >= sim.months ? '查看今年總結' : `推進到第 ${state.month + 1} 個月`}</button>
      ${historyChart(state.history, sim.months, lab)}
      ${state.log.length ? `<section class="sim-log"><h2>即時事件紀錄</h2><ul>${state.log.map(e => logEntry(sim, e)).join('')}</ul></section>` : ''}
    </section>`;

    wireTopologyControls(root, sim, state, componentId => {
      const before = currentOptionId(sim, componentId, state);
      const next = nextOptionId(sim, componentId, state);
      state.choice[componentId] = next;
      updateComponentVisual(root, sim, state, componentId);
      const comp = findComponent(sim, componentId);
      const opt = comp?.options.find(o => o.id === next);
      traceLine(root, `「${comp?.shortName || componentId}」從「${comp?.options.find(o => o.id === before)?.label || before}」切換成「${opt?.label || next}」`, next === 'off' ? '' : 'ok');
    });
    wireTraceClear(root);
    wireChunkLab(root, sim, state);

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
      const comp = findComponent(sim, id);
      const optId = currentOptionId(sim, id, state);
      const opt = comp?.options.find(o => o.id === optId);
      const on = optId !== 'off';
      return `<span class="sim-chip pending ${on ? 'has' : 'missing'}">${esc(comp?.shortName || id)}：${esc(opt?.label || optId)}</span>`;
    }).join('');
    root.innerHTML = `<section class="sim-screen sim-event">
      <div class="eyebrow">第 ${state.month} 個月 · 事件發生</div>
      <h1>${esc(event.title)}</h1>
      <p class="sim-lede">${esc(event.narrative)}</p>
      ${chips ? `<div class="sim-event-check"><small>這次事件會考驗：</small><div class="sim-log-chips">${chips}</div></div>` : ''}
      ${svgTopology(sim, state, { interactive: false, showControls: false })}
      <p class="sim-event-hint">結果由你這幾個月選的做法決定，現在已經來不及調整。</p>
      <button class="button sim-resolve" type="button">查看結果</button>
      <div id="simEventResult"></div>
    </section>`;
    wireTraceClear(root);

    root.querySelector('.sim-resolve').onclick = () => {
      const resolveBtn = root.querySelector('.sim-resolve');
      resolveBtn.disabled = true;
      const outcome = event.resolve(makeChoiceCtx(sim, state));
      const svgEl = root.querySelector('svg.sim-topo');
      animateEventOutcome(root, sim, state, svgEl, event, outcome, () => {
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
          choiceSnapshot: snapshotChoices(sim, state)
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
    wireTraceClear(root);
    root.querySelector('.sim-restart').onclick = () => {
      if (state.chunkTimer) clearInterval(state.chunkTimer);
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
  window.__simTestHooks = { pointAlongPath, waypointsFor, clusterPositions };

  boot();
})();
