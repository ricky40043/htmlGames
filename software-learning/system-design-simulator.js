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

  // ---------- Live (editable) topology ----------
  // A scenario's `topology` is its STARTING architecture, not a fixed picture. When the scenario
  // opts in with `mutableTopology: true`, the run gets its own deep copy in `state.topo` that the
  // player can genuinely extend at runtime — add a region, add machines, add user groups — and
  // every render/flow/load function reads that copy instead of the frozen scenario data. The
  // scenario's `computeFlow` is carried over by reference (it's a pure function of node-id
  // conventions, so it keeps working for regions that didn't exist when it was written).
  function topoOf(sim, state) {
    return state?.topo || sim.topology;
  }

  function cloneTopology(topo) {
    if (!topo) return topo;
    return {
      ...topo,
      nodes: topo.nodes.map(n => ({ ...n })),
      edges: topo.edges.map(e => ({ ...e })),
      regionIds: [...(topo.regionIds || [])],
      regionLabel: { ...(topo.regionLabel || {}) }
    };
  }

  // Region audience split is a set of WEIGHTS, not fixed percentages, so adding a region
  // genuinely redistributes the same total audience instead of inventing viewers out of thin
  // air — which is also the real lesson: a new edge region relieves the existing ones.
  function regionWeights(sim, state) {
    const topo = topoOf(sim, state);
    const declared = sim.capacity?.regionWeight || {};
    const w = {};
    (topo?.regionIds || []).forEach(r => { w[r] = state?.regionWeight?.[r] ?? declared[r] ?? 1; });
    return w;
  }

  function regionShare(sim, state, regionKey) {
    const w = regionWeights(sim, state);
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    if (!total || !(regionKey in w)) return 0;
    return w[regionKey] / total;
  }

  // ---------- Individual machines ----------
  // Every machine in a pool is its own object with its own identity ("#2"), its own up/down
  // state and its own hit target. Requests are only ever routed to machines that are up, and a
  // request already in flight toward a machine that is pulled dies where it is — which is the
  // whole point of being able to kill one.

  function instanceKey(nodeId, idx) { return `${nodeId}::${idx}`; }

  function instanceIsDown(state, nodeId, idx) {
    return !!state?.instanceDown?.[instanceKey(nodeId, idx)];
  }

  function setInstanceDown(state, nodeId, idx, down) {
    state.instanceDown = state.instanceDown || {};
    if (down) state.instanceDown[instanceKey(nodeId, idx)] = true;
    else delete state.instanceDown[instanceKey(nodeId, idx)];
  }

  function aliveInstanceIndexes(sim, state, node) {
    const n = instanceCount(sim, state, node);
    return Array.from({ length: n }, (_, i) => i).filter(i => !instanceIsDown(state, node.id, i));
  }

  function newState(sim) {
    const cs = sim.dragViewerSim;
    return {
      month: 0, uptime: 100, qoe: 100, costEff: 100, choice: {}, usersServed: 0, speed: 1,
      chunk: null, chunkTimer: null,
      abr: null, abrTimer: null,
      // Machines the player added by hand with the ＋ buttons on the topology, on top of
      // whatever baseline the chosen redundancy strategy already gives that node. Keyed by node
      // id, so each region's pool scales independently (adding Taiwan streaming servers must not
      // silently also add them in the US).
      extraInstances: {},
      // Machines the player has pulled the plug on, keyed "<nodeId>::<index>".
      instanceDown: {},
      // The editable copy of the architecture (see topoOf) plus the audience weight per region.
      topo: sim.mutableTopology ? cloneTopology(sim.topology) : null,
      regionWeight: { ...(sim.capacity?.regionWeight || {}) },
      nextRegionSeq: 1, nextGroupSeq: 1,
      dragViewer: cs ? {
        x: cs.start.x, y: cs.start.y, inZone: false, wander: false,
        regionId: cs.homeRegionId || sim.topology?.regionIds?.[0] || null,
        qualityId: (cs.ladder || sim.abrSim?.ladder || []).slice(-1)[0]?.id
      } : null,
      // The bad-signal zone is a movable AND resizable object, not scenery painted at a fixed
      // spot — its live geometry lives here so it survives a full renderPlay remount, exactly
      // like the avatar's position does.
      badZone: cs?.zone ? { x: cs.zone.x, y: cs.zone.y, width: cs.zone.width, height: cs.zone.height } : null,
      dragViewerTimer: null,
      log: [], history: [{ month: 0, uptime: 100, qoe: 100 }], phase: 'briefing'
    };
  }

  // ---------- Instances, capacity and load ----------
  // A pool node's machine count is (strategy baseline) + (machines the player added by hand).
  // Hand-added machines can never take a node below its strategy's baseline — to go lower you
  // have to change the strategy, which is the decision that actually carries the trade-off.

  const MAX_INSTANCES = 8;

  function baseInstances(sim, state, node) {
    if (!node.pool) return 1;
    return Math.max(1, currentOption(sim, node.componentId, state).instances || 1);
  }

  function instanceCount(sim, state, node) {
    if (!node.pool) return 1;
    return baseInstances(sim, state, node) + Math.max(0, state.extraInstances?.[node.id] || 0);
  }

  // What fraction of watch traffic never reaches the origin at all, because an edge cache
  // answered it. Declared by the scenario (`capacity.offloadFrom` names the component whose
  // current option carries an `offload` figure), so scenarios without a CDN just get 0.
  function offloadRatio(sim, state) {
    const id = sim.capacity?.offloadFrom;
    if (!id) return 0;
    return currentOption(sim, id, state).offload || 0;
  }

  // Live load for one node: how many of this month's concurrent viewers actually land on it,
  // versus how many its current machine count can carry. This is what makes both the CDN
  // decision and the ＋/－ buttons mean something measurable rather than decorative.
  function nodeLoad(sim, state, node) {
    if (!node?.capacityPerInstance || !sim.capacity) return null;
    let demand = sim.viewersAtMonth(state.month) * regionShare(sim, state, node.regionKey);
    // Hand-placed user groups are extra, concrete audience sitting in a specific region — they
    // are on top of the modelled baseline, not a slice of it.
    demand += (topoOf(sim, state)?.nodes || [])
      .filter(n => n.kind === 'user' && n.headcount && n.regionKey === node.regionKey)
      .reduce((s, n) => s + n.headcount, 0);
    if (node.loadKind === 'stream') demand *= (1 - offloadRatio(sim, state));
    else if (node.loadKind === 'api') demand *= (sim.capacity.apiRatio ?? 0.2);
    // Capacity comes only from machines that are actually up: pulling one out really does
    // shrink what this tier can carry, which is what makes killing a machine mean something.
    const capacity = aliveInstanceIndexes(sim, state, node).length * node.capacityPerInstance;
    return { demand: Math.round(demand), capacity, ratio: capacity > 0 ? demand / capacity : Infinity };
  }

  function overloadedNodes(sim, state) {
    if (!topoOf(sim, state)?.nodes) return [];
    return topoOf(sim, state).nodes
      .map(n => ({ node: n, load: nodeLoad(sim, state, n) }))
      .filter(x => x.load && x.load.ratio > 1)
      .sort((a, b) => b.load.ratio - a.load.ratio);
  }

  function weeklyCostPenalty(sim, state) {
    let total = 0;
    sim.components.forEach(c => { total += currentOption(sim, c.id, state).cost || 0; });
    // Hand-added machines are real machines: they show up on the bill every month, which is the
    // counterweight that stops "just add servers forever" from being a free win.
    (topoOf(sim, state)?.nodes || []).forEach(n => {
      const extra = Math.max(0, state.extraInstances?.[n.id] || 0);
      if (extra) total += extra * (n.extraInstanceCost ?? 1);
    });
    return total;
  }

  function applyMonthCost(sim, state) {
    const penalty = weeklyCostPenalty(sim, state);
    state.costEff = clamp(state.costEff - penalty * 0.6);
  }

  // A month spent over capacity costs playback quality — the whole point of showing a load
  // ratio is that ignoring it has consequences. Scales with how far over the worst node is, so
  // being 5% over is a nudge and being 4x over is a disaster.
  function applyMonthOverload(sim, state) {
    const over = overloadedNodes(sim, state);
    if (!over.length) return null;
    const worst = over[0];
    const penalty = Math.min(10, Math.max(1, Math.round((worst.load.ratio - 1) * 6)));
    state.qoe = clamp(state.qoe - penalty);
    return { count: over.length, worst, penalty };
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
    return `<li class="sim-log-item ${entry.ok ? 'ok' : 'bad'}${entry.capacityIssue ? ' capacity' : ''}">
      <div class="sim-log-head"><span class="sim-log-tag">${entry.capacityIssue ? '容量' : entry.ok ? 'PASS' : 'FAIL'}</span><span>第 ${entry.month} 個月 · ${esc(entry.title)}</span></div>
      <p class="sim-log-narrative">${esc(entry.narrative)}</p>
      ${chips ? `<div class="sim-log-chips">${chips}</div>` : ''}
      <p class="sim-log-result">${esc(entry.result)}</p>
      <p class="sim-log-delta">${esc(lab.uptime.split(' ')[0])} ${entry.uptime >= 0 ? '+' : ''}${entry.uptime} · ${esc(lab.qoe.split(' ')[0])} ${entry.qoe >= 0 ? '+' : ''}${entry.qoe}</p>
    </li>`;
  }

  // ---------- Topology diagram ----------

  function findNode(topo, id) { return topo.nodes.find(n => n.id === id); }

  // Which region's own drawn box (the same dashed rectangles regionBoxesSvg renders) a point
  // falls inside, if any. This is what decides which region is actually "serving" a viewer
  // who's been dragged to a given spot — being inside Taiwan's box means Taiwan's regional
  // stack serves you, not "whichever server icon happens to be nearest in pixel space" (that
  // was an arbitrary function of unrelated canvas layout, not a real routing decision — nothing
  // about which server instance answers you depends on raw pixel distance to its icon; every
  // instance in the chosen region's pool is already interchangeable, which is what "stateless"
  // actually buys you, not "there's no such thing as region-based routing at all").
  // A region's drawn box is the extent of its FIXED stack. Nodes the player can drag around
  // (user groups, and anything else flagged `movable`) are deliberately excluded: otherwise
  // dragging a group downward stretches its own region's rectangle to follow it, the group is
  // then still "inside" the region it just left, and it can never be moved anywhere else.
  function regionBoxes(topo) {
    const groups = {};
    // `zone` groups nodes into a drawn box; `region` (used separately by hopWeights for travel
    // speed) still governs whether two nodes count as "the same place" for latency purposes.
    // They're usually identical, but a centralized backend that's physically same-region as one
    // edge stack still wants its own box rather than merging into that edge stack's box.
    topo.nodes.forEach(n => {
      if (n.movable) return;
      const key = n.zone || n.region;
      if (key) (groups[key] ??= []).push(n);
    });
    const pad = 36;
    return Object.entries(groups).map(([name, ns]) => ({
      name, region: ns[0].region,
      x0: Math.min(...ns.map(n => n.x)) - pad, y0: Math.min(...ns.map(n => n.y)) - pad,
      x1: Math.max(...ns.map(n => n.x)) + pad, y1: Math.max(...ns.map(n => n.y)) + pad
    }));
  }

  function regionIdAtPoint(topo, x, y) {
    if (!topo.regionIds || !topo.regionLabel) return null;
    // Smallest containing box wins, so a point inside a backend zone nested near an edge stack
    // resolves to the tighter, more specific one rather than to whichever was declared first.
    const hits = regionBoxes(topo)
      .filter(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)
      .sort((a, b) => (a.x1 - a.x0) * (a.y1 - a.y0) - (b.x1 - b.x0) * (b.y1 - b.y0));
    for (const b of hits) {
      const match = Object.entries(topo.regionLabel).find(([, l]) => l === b.region);
      if (match) return match[0];
    }
    return null;
  }

  function regionBoxesSvg(topo) {
    return regionBoxes(topo).map(b =>
      // The name sits just ABOVE its box rather than inside the top-left corner: inside, it
      // collided with whatever node happened to be drawn near that corner (the backend zone's
      // label ran straight through the transcode workers' machine numbers).
      `<rect class="sim-topo-region" x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" rx="16"/><text class="sim-topo-region-label" x="${b.x0 + 2}" y="${b.y0 - 5}">${esc(b.name)}</text>`
    ).join('');
  }

  // "Is this capability currently switched on" — NOT the same question as "does this box exist".
  function nodeIsOn(sim, state, node) {
    return node.kind !== 'component' || currentOptionId(sim, node.componentId, state) !== 'off';
  }

  // Does this box physically exist and carry traffic right now? A component declared
  // `presence: 'always'` (a server pool, a database, a cache) is always there — its option only
  // decides how well protected it is, so switching that option off must never draw it as a dead
  // ✕ box. Only a `presence: 'optional'` component (a CDN you haven't bought, an upload bypass
  // you haven't enabled) genuinely disappears when it's off. Scenarios that don't declare
  // `presence` keep the original behaviour (off = absent).
  function nodeIsPresent(sim, state, node) {
    if (node.kind !== 'component') return true;
    if (findComponent(sim, node.componentId)?.presence === 'always') return true;
    return currentOptionId(sim, node.componentId, state) !== 'off';
  }

  function edgesSvg(sim, state) {
    const topo = topoOf(sim, state);
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
    const count = instanceCount(sim, state, node);
    const spacing = 26;
    const startX = node.x - (spacing * (count - 1)) / 2;
    return Array.from({ length: count }, (_, i) => ({ x: startX + i * spacing, y: node.y }));
  }

  // The ＋/－ pair that lets the player add or remove machines on a pool node directly on the
  // diagram. They live inside the node's own <g>, so they're rebuilt whenever the node repaints;
  // their clicks are handled by one delegated capture-phase listener on the svg (see
  // wireTopologyControls) rather than per-element listeners that would die on every repaint.
  function instanceStepperSvg(sim, state, n, count) {
    const halfW = 13 * (count - 1) + 13;
    const dx = halfW + 17;
    const atMax = count >= MAX_INSTANCES;
    const atMin = (state.extraInstances?.[n.id] || 0) <= 0;
    const btn = (offset, delta, glyph, disabled, label) => `<g class="sim-node-stepper${disabled ? ' disabled' : ''}" data-instance-delta="${delta}" data-instance-node="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(label)}">
          <circle cx="${n.x + offset}" cy="${n.y}" r="9"/>
          <text x="${n.x + offset}" y="${n.y + 4}">${glyph}</text>
        </g>`;
    return btn(-dx, -1, '−', atMin, `${n.label}：減少一台機器`) + btn(dx, 1, '+', atMax, `${n.label}：增加一台機器`);
  }

  function nodeInnerSvg(sim, state, n, interactive) {
    const isComponent = n.kind === 'component';
    const on = nodeIsOn(sim, state, n);
    const present = nodeIsPresent(sim, state, n);
    const r = n.pool ? 13 : n.size === 'small' ? 15 : n.kind === 'user' ? 25 : 23;
    const labelOffset = n.size === 'small' ? 15 : n.kind === 'user' ? 25 : 23;
    const positions = clusterPositions(sim, state, n);
    const opt = isComponent ? currentOption(sim, n.componentId, state) : null;
    const aliveCount = n.pool ? aliveInstanceIndexes(sim, state, n).length : 1;
    const countNote = n.pool ? `（${aliveCount}/${positions.length} 台運作中）` : '';
    // The strategy label is its own hit target on pool nodes: clicking a MACHINE pulls that one
    // machine's plug, so the "which strategy" decision needs somewhere else to live.
    const costText = opt ? `${opt.cost > 0 ? '+' : ''}${opt.cost}/月 · ${opt.label}${countNote}` : '';
    // One line BELOW the node label, not two pixels under it — at +16 against the label's +14
    // the two strings printed on top of each other and rendered the users node unreadable.
    const headText = n.kind === 'user'
      ? (n.headcount ? `${numFmt(n.headcount)} 人` : `已服務 ${numFmt(state.usersServed || 0)} 人`)
      : '';
    const badge = headText ? `<text class="sim-topo-badge" x="${n.x}" y="${n.y + labelOffset + 30}">${esc(headText)}</text>` : '';
    // ✓ protected · ⚠ running but with no redundancy · ✕ not built at all · ✕(red, dead) a
    // machine whose plug you pulled. The old two-state ✓/✕ was the source of "the server is X,
    // so why is it still sending me data?" — a live server with no spare capacity is not a dead
    // server, and must not look like one.
    const glyph = present ? (on ? '✓' : '⚠') : '✕';
    // Each machine is its own <g> so it can be clicked, killed, labelled "#2" and targeted by a
    // token independently of its siblings.
    const machines = positions.map((p, i) => {
      const down = n.pool && instanceIsDown(state, n.id, i);
      const cls = ['sim-topo-instance', n.pool ? 'machine' : '', down ? 'down' : '', interactive && n.pool ? 'killable' : ''].filter(Boolean).join(' ');
      const mark = isComponent ? `<text class="sim-topo-mark" x="${p.x}" y="${p.y + 5}">${down ? '✕' : glyph}</text>` : '';
      const idx = n.pool ? `<text class="sim-topo-instance-id" x="${p.x}" y="${p.y - r - 3}">#${i + 1}</text>` : '';
      const tip = n.pool
        ? `<title>${esc(n.label)} #${i + 1}${down ? '（已當機）' : ''}${interactive ? ' — 點一下可以拔掉／插回這一台，模擬單台當機' : ''}</title>`
        : '';
      return `<g class="${cls}"${n.pool ? ` data-instance="${esc(instanceKey(n.id, i))}"${interactive ? ' role="button" tabindex="0"' : ''}` : ''}>${tip}<circle cx="${p.x}" cy="${p.y}" r="${r}"/>${mark}${idx}</g>`;
    }).join('');
    const load = nodeLoad(sim, state, n);
    const loadText = load
      ? `<text class="sim-topo-load${load.ratio > 1 ? ' over' : ''}" x="${n.x}" y="${n.y + labelOffset + 28}">負載 ${numFmt(load.demand)} / ${numFmt(load.capacity)}（${load.capacity ? Math.round(load.ratio * 100) + '%' : '全部當機'}）</text>`
      : '';
    const absentNote = !present
      ? `<text class="sim-topo-absent" x="${n.x}" y="${n.y + labelOffset + 28}">（未建置，流量不會經過這裡）</text>` : '';
    return `${machines}
        <text class="sim-topo-label" x="${n.x}" y="${n.y + labelOffset + 14}">${esc(n.label)}</text>
        ${costText ? `<text class="sim-topo-cost${interactive && n.pool ? ' strategy' : ''}" x="${n.x}" y="${n.y - labelOffset - 6}"${interactive && n.pool ? ' data-strategy-hit="1" role="button" tabindex="0"' : ''}>${esc(costText)}</text>` : ''}
        ${loadText}${absentNote}${badge}
        ${interactive && n.pool ? instanceStepperSvg(sim, state, n, positions.length) : ''}`;
  }

  function nodeClassName(sim, state, n, interactive) {
    const isComponent = n.kind === 'component';
    const on = nodeIsOn(sim, state, n);
    const present = nodeIsPresent(sim, state, n);
    const load = nodeLoad(sim, state, n);
    const allDown = n.pool && aliveInstanceIndexes(sim, state, n).length === 0;
    return ['sim-topo-node', n.kind, on ? 'on' : 'off', present ? 'present' : 'absent',
      isComponent && interactive ? 'clickable' : '', n.pool ? 'pool' : '',
      allDown ? 'all-down' : '',
      load && load.ratio > 1 ? 'overloaded' : ''].filter(Boolean).join(' ');
  }

  // Is this node able to accept a request right now? A pool with every machine pulled cannot,
  // and neither can a component that was never built.
  function nodeCanServe(sim, state, node) {
    if (!node) return false;
    if (!nodeIsPresent(sim, state, node)) return false;
    if (node.pool) return aliveInstanceIndexes(sim, state, node).length > 0;
    return true;
  }

  function nodesSvg(sim, state, interactive) {
    const topo = topoOf(sim, state);
    return topo.nodes.map(n => {
      const isComponent = n.kind === 'component';
      const attrs = isComponent && interactive ? `role="button" tabindex="0" data-toggle="${esc(n.componentId)}"` : '';
      return `<g class="${nodeClassName(sim, state, n, interactive)}" data-node="${esc(n.id)}" ${interactive ? 'data-interactive="1"' : ''} ${attrs}>${nodeInnerSvg(sim, state, n, interactive)}</g>`;
    }).join('');
  }

  // Repaints every node's class + inner markup from current state. Node-scoped (never touches
  // the <svg> root, the edges, the drag-viewer group or the trace log), and used instead of a
  // per-node patch because one change can move several nodes' numbers at once — turning the CDN
  // off, for instance, multiplies every region's streaming-server load, not just one node's.
  // Edges are pure geometry between two node positions, so a moved node has to drag its wires
  // with it. Patching the existing <line> elements keeps the drag smooth (no full SVG rebuild).
  function repaintEdges(root, sim, state) {
    const topo = topoOf(sim, state);
    (topo?.edges || []).forEach(e => {
      const a = findNode(topo, e.from), b = findNode(topo, e.to);
      const line = root.querySelector(`[data-edge="${e.from}-${e.to}"]`);
      if (!a || !b || !line) return;
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    });
  }

  function repaintNodes(root, sim, state) {
    (topoOf(sim, state)?.nodes || []).forEach(n => {
      const el = root.querySelector(`[data-node="${n.id}"]`);
      if (!el) return;
      const interactive = el.dataset.interactive === '1';
      // Animation-only markers are applied imperatively elsewhere; preserve them across repaint.
      const transient = ['failing', 'stressed', 'success'].filter(c => el.classList.contains(c));
      el.setAttribute('class', [nodeClassName(sim, state, n, interactive), ...transient].join(' '));
      el.innerHTML = nodeInnerSvg(sim, state, n, interactive);
    });
  }

  const SPEED_OPTIONS = [0.1, 0.5, 1, 2];

  // A persistent, draggable "test viewer" avatar you can pull into a marked bad-network zone —
  // its position always renders from `state.dragViewer`, never from the scenario's start-position
  // config, so it survives a full renderPlay remount (month advance) exactly where you left it.
  function dragViewerSvg(sim, state) {
    const cs = sim.dragViewerSim;
    const dv = state.dragViewer;
    if (!cs || !dv) return '';
    const ladder = cs.ladder || sim.abrSim?.ladder || [];
    const qLabel = ladder.find(q => q.id === dv.qualityId)?.label || dv.qualityId || '--';
    const z = state.badZone || { x: cs.zone.x, y: cs.zone.y, width: cs.zone.width, height: cs.zone.height };
    const zw = z.width ?? cs.zone.width, zh = z.height ?? cs.zone.height;
    const regionName = topoOf(sim, state)?.regionLabel?.[dv.regionId] || dv.regionId || '';
    return `
      <g class="sim-drag-zone-g" data-drag-zone tabindex="0" role="button" aria-label="拖曳訊號不良區到你想測試的地區；方向鍵移動，Shift＋方向鍵縮放">
        <rect class="sim-drag-zone${dv.inZone ? ' active' : ''}" x="${z.x}" y="${z.y}" width="${zw}" height="${zh}" rx="10"/>
        <text class="sim-drag-zone-label" x="${z.x + 10}" y="${z.y + 22}">${esc(cs.zone.label)}</text>
        <rect class="sim-drag-zone-handle" data-zone-handle x="${z.x + zw - 9}" y="${z.y + zh - 9}" width="18" height="18" rx="4"><title>拖曳這個角可以縮放訊號不良區</title></rect>
      </g>
      <g class="sim-drag-viewer${dv.inZone ? ' in-zone' : ''}" data-drag-viewer tabindex="0" role="button" aria-label="拖曳測試觀眾到別的地區或訊號不良區，或按 Enter 切換">
        <circle cx="${dv.x}" cy="${dv.y}" r="14"/>
        <text class="sim-drag-viewer-emoji" x="${dv.x}" y="${dv.y + 5}">🙋</text>
        <text class="sim-drag-viewer-quality q-${esc(dv.qualityId || '')}" x="${dv.x}" y="${dv.y + 30}">${esc(qLabel)}</text>
        <text class="sim-drag-viewer-region" x="${dv.x}" y="${dv.y + 44}">${esc(regionName ? `由${regionName}服務` : '')}</text>
      </g>`;
  }

  // ---------- Runtime architecture editing ----------
  // The starting three regions are a starting point, not a fixed truth. `regionBlueprint` in the
  // scenario data describes how ONE region's stack is built (its nodes, its edges, its layout
  // row height), so the same recipe that produced Taiwan/US/Japan can produce a region the
  // player invents at month 4 — the topology is generated, never hard-coded per region.

  // Lowest point of the region STACKS (hand-placed user groups are excluded — they're dragged
  // around freely and must not push new regions ever further down the canvas).
  function regionRowBounds(sim, state) {
    const topo = topoOf(sim, state);
    const ys = topo.nodes.filter(n => n.regionKey && !n.headcount).map(n => n.y);
    return ys.length ? Math.max(...ys) : 0;
  }

  function addRegion(sim, state, label) {
    const bp = sim.regionBlueprint;
    const topo = topoOf(sim, state);
    if (!bp || !topo) return null;
    const name = (label || '').trim();
    if (!name) return { error: '請先輸入地區名稱。' };
    if (Object.values(topo.regionLabel).includes(name)) return { error: `「${name}」這個地區已經存在了。` };
    if (topo.regionIds.length >= (bp.maxRegions || 6)) return { error: `這個模擬最多支援 ${bp.maxRegions || 6} 個地區。` };
    const key = `r${state.nextRegionSeq++}`;
    const baseY = regionRowBounds(sim, state) + (bp.rowGap || 320);
    topo.nodes.push(...bp.nodes(key, name, baseY));
    topo.edges.push(...bp.edges(key));
    topo.regionIds.push(key);
    topo.regionLabel[key] = name;
    state.regionWeight[key] = bp.defaultWeight ?? 1;
    // Grow the canvas downward so a newly added row is actually visible.
    const [vx, vy, vw, vh] = String(topo.viewBox).split(/\s+/).map(Number);
    const needed = regionRowBounds(sim, state) + 130;
    if (needed > vy + vh) topo.viewBox = `${vx} ${vy} ${vw} ${Math.ceil(needed - vy)}`;
    return { key, name };
  }

  function removeRegion(sim, state, key) {
    const topo = topoOf(sim, state);
    if (!topo || topo.regionIds.length <= 1) return { error: '至少要保留一個地區。' };
    const label = topo.regionLabel[key];
    topo.nodes = topo.nodes.filter(n => n.regionKey !== key);
    topo.edges = topo.edges.filter(e => !e.from.endsWith(`_${key}`) && !e.to.endsWith(`_${key}`));
    topo.regionIds = topo.regionIds.filter(r => r !== key);
    delete topo.regionLabel[key];
    delete state.regionWeight[key];
    if (state.dragViewer?.regionId === key) state.dragViewer.regionId = topo.regionIds[0];
    return { key, name: label };
  }

  // "+100 users" should not be an abstract counter — it drops a real, named, draggable group of
  // 100 people into a region, which then shows up in that region's load like any other audience.
  function addUserGroup(sim, state, regionKey, headcount) {
    const topo = topoOf(sim, state);
    const anchor = findNode(topo, `users_${regionKey}`);
    if (!anchor) return null;
    const seq = state.nextGroupSeq++;
    const ring = topo.nodes.filter(n => n.kind === 'user' && n.regionKey === regionKey && n.headcount).length;
    const id = `userGroup_${seq}`;
    topo.nodes.push({
      id, kind: 'user', label: `使用者群組 #${seq}`, region: anchor.region, regionKey,
      headcount, movable: true,
      x: anchor.x + 4 + (ring % 2 ? 46 : -34), y: anchor.y + 62 + Math.floor(ring / 2) * 40,
      arriveLabel: '這一群使用者的裝置收到回應'
    });
    topo.edges.push({ from: id, to: `loadBalancer_${regionKey}`, kind: 'stub' });
    return findNode(topo, id);
  }

  function architectureEditorHtml(sim, state) {
    const topo = topoOf(sim, state);
    const w = regionWeights(sim, state);
    const total = Object.values(w).reduce((s, v) => s + v, 0) || 1;
    const rows = topo.regionIds.map(r => `<li>
        <b>${esc(topo.regionLabel[r] || r)}</b>
        <span>觀眾占比 ${Math.round((w[r] / total) * 100)}%</span>
        <button class="sim-mini-btn" type="button" data-region-remove="${esc(r)}">移除</button>
      </li>`).join('');
    return `<details class="sim-arch-editor" open>
      <summary>🏗️ 架構編輯：自己新增地區與使用者群組</summary>
      <p class="sim-arch-note">地區不是寫死的。新增一個地區會照同一份藍圖生出它自己的 CDN、Load Balancer、串流伺服器與 API 伺服器，並把總觀眾人數重新分配到所有地區——這也是真實世界加一個 edge region 的效果。</p>
      <div class="sim-arch-row">
        <input type="text" class="sim-arch-input" data-region-name placeholder="新地區名稱，例如「新加坡」" aria-label="新地區名稱" />
        <button class="button secondary" type="button" data-region-add>＋ 新增地區</button>
      </div>
      <div class="sim-arch-row">
        <select class="sim-arch-select" data-group-region aria-label="要把使用者群組放在哪一個地區">
          ${topo.regionIds.map(r => `<option value="${esc(r)}">${esc(topo.regionLabel[r] || r)}</option>`).join('')}
        </select>
        <button class="button secondary" type="button" data-group-add="100">＋ 新增 100 人（成為獨立節點）</button>
      </div>
      <ul class="sim-arch-regions">${rows}</ul>
    </details>`;
  }

  function svgTopology(sim, state, { interactive = false, showControls = false } = {}) {
    const topo = topoOf(sim, state);
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
        ${interactive && showControls ? dragViewerSvg(sim, state) : ''}
      </svg>
      ${interactive
        ? '<p class="sim-topo-hint"><b>點單獨一台機器</b>（#1／#2…）＝把那一台拔掉或插回去，正在傳給它的請求會當場中斷；<b>點節點上方有底線的策略文字</b>＝切換備援做法；<b>＋／−</b>＝加開或收掉機器。符號：<b>✓</b> 有保護 · <b>⚠</b> 機器照跑但沒備援 · <b>✕</b> 還沒建，流量不會經過它。負載超過 100% 變紅色，代表這一區的機器已經吃不下這些觀眾。</p>'
        : '<p class="sim-topo-hint">目前是唯讀狀態——結果由你先前選的做法與當時開的機器數量決定。</p>'}
      ${showControls ? `<div class="sim-topo-controls">
        <button class="button secondary sim-add-users" type="button" data-add="100">${esc(sim.addUsersLabel || '＋100 使用者')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="watch">${esc(sim.demoLabels?.watch || '▶ 模擬一次讀取請求')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="upload">${esc(sim.demoLabels?.upload || '⬆ 模擬一次寫入請求')}</button>
        ${sim.demoLabels?.search ? `<button class="button secondary sim-demo" type="button" data-kind="search">${esc(sim.demoLabels.search)}</button>` : ''}
        ${sim.concurrentViewersLabel ? `<button class="button secondary sim-demo-concurrent" type="button" data-count="10">${esc(sim.concurrentViewersLabel)}</button>` : ''}
        ${sim.dragViewerSim ? '<button class="button secondary sim-wander-btn" type="button" data-viewer-wander aria-pressed="false">🚶 讓觀眾隨機走動</button>' : ''}
      </div>
      ${sim.mutableTopology ? architectureEditorHtml(sim, state) : ''}` : ''}
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

  // Cumulative fraction-of-total-duration boundary for each waypoint (0..1). Uniform when no
  // per-segment weights are given (the original, still-default behaviour); otherwise a heavier
  // segment claims a proportionally bigger slice of the same total travel time.
  function weightBoundaries(segCount, weights) {
    if (!weights || weights.length !== segCount) {
      return Array.from({ length: segCount + 1 }, (_, i) => i / segCount);
    }
    const total = weights.reduce((s, w) => s + w, 0) || segCount;
    let acc = 0;
    const bounds = [0];
    weights.forEach(w => { acc += w / total; bounds.push(acc); });
    bounds[bounds.length - 1] = 1; // guard float drift so the last boundary is always exactly 1
    return bounds;
  }

  // Pure interpolation so this is unit-testable without touching timers/DOM. `weights` lets a
  // specific hop (e.g. one that crosses regions) claim a bigger share of the same total duration
  // than a same-region hop — this is what makes "Taiwan and the US are actually far apart"
  // visible as the token noticeably slowing down on that one segment, not just a number in text.
  function pointAlongPath(points, t, weights) {
    const segCount = points.length - 1;
    if (segCount <= 0) return points[0];
    const tt = clamp(t, 0, 1);
    const bounds = weightBoundaries(segCount, weights);
    let i = 0;
    while (i < segCount - 1 && tt >= bounds[i + 1]) i++;
    const span = bounds[i + 1] - bounds[i];
    const localT = span > 0 ? (tt - bounds[i]) / span : 0;
    const a = points[i], b = points[i + 1];
    return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
  }

  // `guard` is checked every frame: the moment it returns false the packet is considered lost in
  // transit — it stops where it is, turns red, and `onLost` fires instead of `onDone`. That is
  // what "pull a machine out and watch the half-delivered requests die" actually looks like.
  function spawnToken(svgEl, waypoints, { className = '', tokenClass = 'sim-token', durationMs = 1800, weights, radius = 7, onDone, onHop, guard, onLost } = {}) {
    if (!svgEl || waypoints.length < 2) { onDone?.(null); return null; }
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('class', `${tokenClass} ${className}`.trim());
    circle.setAttribute('cx', waypoints[0].x);
    circle.setAttribute('cy', waypoints[0].y);
    svgEl.appendChild(circle);
    const start = Date.now();
    const segCount = waypoints.length - 1;
    const bounds = weightBoundaries(segCount, weights);
    let nextHop = 1;
    const fireHopsUpTo = t => {
      while (nextHop < waypoints.length && t >= bounds[nextHop]) {
        onHop?.(nextHop);
        nextHop++;
      }
    };
    const timer = setInterval(() => {
      if (guard && !guard()) {
        clearInterval(timer);
        circle.setAttribute('class', `${tokenClass} ${className} lost`.trim());
        setTimeout(() => circle.remove(), 900);
        onLost?.(circle);
        return;
      }
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
      const p = pointAlongPath(waypoints, t, weights);
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
    }, 40);
    return { circle, stop: () => clearInterval(timer) };
  }

  // Picks ONE machine per pool node the flow passes through — and only ever a machine that is
  // actually up, because a load balancer does not hand requests to a box it knows is dead. The
  // chosen machines come back alongside the points so the caller can keep watching them: if one
  // of them is pulled while the request is still travelling, that request has to die too.
  function routeFor(sim, state, nodeIds) {
    const topo = topoOf(sim, state);
    const points = [];
    const chosen = [];
    // Waypoint index → which machine was picked there, so the trace log can say "went to #2"
    // instead of the useless "went to the API server pool".
    const chosenAt = {};
    const visited = [];
    let blockedAt = null;
    // A request that revisits the same pool node on the way back out (…→ server → storage →
    // server → …) has to come back to the SAME machine, not teleport to a sibling.
    const sticky = {};
    for (const id of nodeIds) {
      const n = findNode(topo, id);
      if (!n) continue;
      if (n.pool) {
        const alive = aliveInstanceIndexes(sim, state, n);
        if (!alive.length) { blockedAt = n; break; }
        const idx = n.id in sticky ? sticky[n.id] : alive[Math.floor(Math.random() * alive.length)];
        sticky[n.id] = idx;
        const positions = clusterPositions(sim, state, n);
        chosenAt[points.length] = { nodeId: n.id, idx };
        points.push(positions[idx]);
        if (!chosen.some(c => c.nodeId === n.id && c.idx === idx)) chosen.push({ nodeId: n.id, idx });
      } else {
        points.push({ x: n.x, y: n.y });
      }
      visited.push(id);
    }
    return { points, chosen, chosenAt, blockedAt, visited };
  }

  // Backwards-compatible thin wrapper (still exposed to the test harness).
  function waypointsFor(sim, state, nodeIds) {
    return routeFor(sim, state, nodeIds).points;
  }

  // "Are all the machines this request was routed to still up?" — evaluated every animation
  // frame, so pulling a machine's plug kills the requests already in flight toward it.
  function routeStillAlive(state, chosen) {
    return chosen.every(c => !instanceIsDown(state, c.nodeId, c.idx));
  }

  // A hop between two nodes tagged with a different `.region` physically crosses an ocean —
  // give it a bigger share of the token's travel time than a same-region hop gets. Nodes with no
  // region (chapters that don't use multi-region topology) always compare unequal to nothing, so
  // this is a no-op everywhere except a topology that actually declares regions.
  function hopWeights(topo, nodeIds) {
    return nodeIds.slice(1).map((id, i) => {
      const a = findNode(topo, nodeIds[i]), b = findNode(topo, id);
      const crossRegion = a?.region && b?.region && a.region !== b.region;
      return crossRegion ? (topo.crossRegionWeight || 3) : 1;
    });
  }

  // Cycling a capability's option used to trigger a full render() — that wiped the trace log,
  // killed any in-flight token animation, and flashed the whole screen on every click. This
  // updates only the node, its edges, and its legend row in place. For pool nodes the instance
  // *count* can change between options, so the node's inner markup is rebuilt (still scoped to
  // just this one <g>, not the whole screen) rather than patched field-by-field.
  function updateComponentVisual(root, sim, state, componentId) {
    const topo = topoOf(sim, state);
    const nodes = topo.nodes.filter(n => n.componentId === componentId);
    if (!nodes.length) return;
    const opt = currentOption(sim, componentId, state);
    const on = opt.id !== 'off';
    // Every node is repainted, not just the ones carrying this component: one capability change
    // can move numbers on unrelated boxes (turning the CDN off multiplies every region's
    // streaming-server load), and a diagram showing stale load figures is worse than none.
    repaintNodes(root, sim, state);
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

  function burstUsers(topo, svgEl, atNode) {
    const usersNode = atNode || topo.nodes.find(n => n.kind === 'user');
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

  // One place where every simulated request is born, so the demo buttons, the ambient traffic,
  // the concurrent-viewers burst and the test viewer's own video segments all obey exactly the
  // same rules: route only to machines that are up, refuse to start at all if a whole tier is
  // dead, and die in transit if the machine you were routed to is pulled mid-flight.
  function spawnRequest(root, sim, state, svgEl, flowIds, opts = {}) {
    const topo = topoOf(sim, state);
    const { points, chosen, blockedAt, visited, chosenAt } = routeFor(sim, state, flowIds);
    if (blockedAt) {
      if (opts.trace !== false) {
        traceLine(root, `⛔ 請求無法送出：「${blockedAt.label}」這一組機器全部當機了，負載平衡器找不到任何一台可以接手。`, 'bad');
      }
      // Still show the doomed request travelling as far as it can get, so the break point is
      // visible on the diagram rather than the request silently never appearing.
      if (points.length >= 2) {
        spawnToken(svgEl, points, { ...opts.token, className: `${opts.token?.className || ''} lost`.trim(), onDone: c => { c?.setAttribute('class', `${opts.token?.tokenClass || 'sim-token'} lost`); setTimeout(() => c?.remove(), 900); } });
      }
      opts.onBlocked?.(blockedAt);
      return null;
    }
    if (points.length < 2) return null;
    // Position-only remap hook: the test viewer replaces its own `users_*` waypoints with
    // wherever the avatar is standing right now.
    const finalPoints = opts.mapPoint ? points.map((p, i) => opts.mapPoint(visited[i], p) || p) : points;
    return spawnToken(svgEl, finalPoints, {
      weights: hopWeights(topo, visited),
      ...opts.token,
      guard: () => routeStillAlive(state, chosen),
      onLost: () => {
        if (opts.trace !== false) {
          const dead = chosen.find(c => instanceIsDown(state, c.nodeId, c.idx));
          const n = dead && findNode(topo, dead.nodeId);
          traceLine(root, `💥 傳到一半的請求中斷了：它被導到「${n?.label || dead?.nodeId}」#${(dead?.idx ?? 0) + 1}，那一台在傳輸途中被拔掉了。`, 'bad');
        }
        opts.onLost?.();
      },
      onHop: opts.token?.onHop ? idx => opts.token.onHop(idx, chosenAt[idx], visited[idx]) : undefined,
      onDone: opts.token?.onDone
    });
  }

  // A batch of new users isn't just a decorative puff of dots at the users node — some of them
  // actually go watch something. Fire a few real "watch" tokens along the current path (same
  // mechanic as the manual ▶ demo button), staggered slightly so they don't land in a single
  // frame, and let the topology visually show organic traffic happening.
  function spawnAmbientViewers(root, sim, state, svgEl, batchSize, forcedRegionId, originNode) {
    const topo = topoOf(sim, state);
    if (!topo?.computeFlow) return;
    const ctx = makeChoiceCtx(sim, state);
    const regionIds = topo.regionIds;
    const count = clamp(Math.round(batchSize / 40), 1, 4);
    // Picked up front (not inside the setTimeout below) so the trace-log breakdown line can
    // report real counts immediately instead of racing the staggered spawns that haven't fired yet.
    // A batch that belongs to one specific user group all comes from that group's own region.
    const picks = Array.from({ length: count }, () => forcedRegionId
      || (regionIds?.length ? regionIds[Math.floor(Math.random() * regionIds.length)] : undefined));
    const regionTally = {};
    picks.forEach(r => { if (r) regionTally[r] = (regionTally[r] || 0) + 1; });
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Pool instance still picked per token (not hoisted) so each simulated viewer that lands
        // on a pool node (e.g. a regional API pool) can independently hit a different server.
        const regionId = picks[i];
        const flowIds = topo.computeFlow('watch', ctx, regionId);
        if (flowIds.length < 2) return;
        spawnRequest(root, sim, state, svgEl, flowIds, {
          trace: false,
          // These viewers are the group standing at `originNode`, so their requests start and
          // end there rather than at the region's generic users icon.
          mapPoint: originNode ? (nodeId, p) => (nodeId === `users_${regionId}` ? { x: originNode.x, y: originNode.y } : p) : undefined,
          token: {
            className: 'ambient',
            tokenClass: 'sim-token-ambient',
            durationMs: (1100 + Math.random() * 900) / (state.speed || 1),
            onDone: circle => setTimeout(() => circle?.remove(), 300 / (state.speed || 1))
          }
        });
      }, Math.random() * 650);
    }
    const breakdown = regionIds?.length
      ? `（分布：${regionIds.map(r => `${esc(topo.regionLabel?.[r] || r)} ${regionTally[r] || 0}`).join('・')}）`
      : '';
    traceLine(root, `其中約 ${numFmt(count)} 位使用者立刻開始觀看內容${breakdown}`);
  }

  function wireTopologyControls(root, sim, state, onCycle, onInstanceDelta, onInstanceKill, onStructureChange, onLoadChange) {
    const svgEl = root.querySelector('svg.sim-topo');
    if (!svgEl) return;
    // Clicking an individual MACHINE pulls its plug (or plugs it back in). Same capture-phase
    // trick as the steppers: it must not also bubble into the node's "cycle the strategy"
    // handler. The strategy label above the node is the hit target for that instead.
    if (onInstanceKill) {
      const handleKill = evt => {
        const g = evt.target.closest?.('[data-instance]');
        if (!g) return;
        if (evt.type === 'keydown' && evt.key !== 'Enter' && evt.key !== ' ') return;
        evt.stopPropagation();
        evt.preventDefault();
        const [nodeId, idx] = g.dataset.instance.split('::');
        onInstanceKill(nodeId, Number(idx));
      };
      svgEl.addEventListener('click', handleKill, true);
      svgEl.addEventListener('keydown', handleKill, true);
    }
    // The ＋/− buttons sit INSIDE the node <g> that already has its own "cycle this capability"
    // click handler, and they get rebuilt on every repaint. Both problems are solved by one
    // delegated listener in the CAPTURE phase on the svg: capture reaches the svg before the
    // node's own bubbling handler, so stopPropagation here genuinely prevents a stray option
    // cycle, and nothing is bound to the short-lived stepper elements themselves.
    if (onInstanceDelta) {
      const handleStepper = evt => {
        const btn = evt.target.closest?.('[data-instance-delta]');
        if (!btn) return;
        if (evt.type === 'keydown' && evt.key !== 'Enter' && evt.key !== ' ') return;
        evt.stopPropagation();
        evt.preventDefault();
        onInstanceDelta(btn.dataset.instanceNode, Number(btn.dataset.instanceDelta));
      };
      svgEl.addEventListener('click', handleStepper, true);
      svgEl.addEventListener('keydown', handleStepper, true);
    }
    root.querySelectorAll('[data-toggle]').forEach(g => {
      const activate = () => onCycle(g.dataset.toggle);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(); } });
    });
    root.querySelectorAll('.sim-add-users').forEach(btn => {
      btn.onclick = () => {
        const batch = Number(btn.dataset.add || 100);
        state.usersServed = (state.usersServed || 0) + batch;
        const topo = topoOf(sim, state);
        burstUsers(topo, svgEl);
        // On a scenario with an editable topology this batch is not a counter — it becomes its
        // own node on the diagram, in a region, draggable to another one, and counted in that
        // region's load like any other audience.
        if (sim.mutableTopology && topo.regionIds?.length) {
          const pick = root.querySelector('[data-group-region]')?.value || topo.regionIds[0];
          const node = addUserGroup(sim, state, pick, batch);
          if (node) {
            traceLine(root, `湧入 ${numFmt(batch)} 位新使用者，成為「${node.label}」這個獨立節點，放在「${esc(topo.regionLabel?.[pick] || pick)}」，可以直接把它拖到別的地區。`, 'head');
            // Rebuild the diagram so the new node exists, THEN show those people arriving and
            // actually watching something — on the fresh SVG, and starting from their own node
            // rather than from the region's generic users icon.
            onStructureChange?.();
            const freshSvg = root.querySelector('svg.sim-topo');
            burstUsers(topoOf(sim, state), freshSvg, node);
            spawnAmbientViewers(root, sim, state, freshSvg, batch, pick, node);
            return;
          }
        }
        const badge = svgEl.querySelector('.sim-topo-badge');
        if (badge) badge.textContent = `已服務 ${numFmt(state.usersServed)} 人`;
        traceLine(root, `湧入 ${numFmt(batch)} 位新使用者`, 'head');
        spawnAmbientViewers(root, sim, state, svgEl, batch);
      };
    });
    // --- Architecture editor: add/remove a whole region, add a user group ---
    if (onStructureChange) {
      root.querySelector('[data-region-add]')?.addEventListener('click', () => {
        const input = root.querySelector('[data-region-name]');
        const res = addRegion(sim, state, input?.value);
        if (!res) return;
        if (res.error) { traceLine(root, `⚠️ ${res.error}`, 'bad'); return; }
        traceLine(root, `🏗️ 新增地區「${esc(res.name)}」：已照藍圖生出它自己的 CDN、Load Balancer、串流伺服器與 API 伺服器，總觀眾人數重新分配到所有地區。`, 'ok');
        onStructureChange();
      });
      root.querySelectorAll('[data-region-remove]').forEach(b => {
        b.addEventListener('click', () => {
          const res = removeRegion(sim, state, b.dataset.regionRemove);
          if (res.error) { traceLine(root, `⚠️ ${res.error}`, 'bad'); return; }
          traceLine(root, `🏗️ 移除地區「${esc(res.name)}」，它的觀眾被重新分配到其他地區。`, '');
          onStructureChange();
        });
      });
      root.querySelector('[data-group-add]')?.addEventListener('click', ev => {
        const n = Number(ev.currentTarget.dataset.groupAdd || 100);
        const pick = root.querySelector('[data-group-region]')?.value;
        const node = addUserGroup(sim, state, pick, n);
        if (!node) return;
        state.usersServed = (state.usersServed || 0) + n;
        traceLine(root, `🏗️ 新增「${node.label}」（${numFmt(n)} 人）到「${esc(topoOf(sim, state).regionLabel?.[pick] || pick)}」，可以直接拖到別的地區。`, 'ok');
        onStructureChange();
      });
    }
    // --- Any node flagged `movable` (user groups) can be dragged between regions ---
    {
      let dragNode = null, dx = 0, dy = 0;
      svgEl.addEventListener('pointerdown', evt => {
        const g = evt.target.closest?.('[data-node]');
        if (!g) return;
        const n = findNode(topoOf(sim, state), g.dataset.node);
        if (!n?.movable) return;
        const p = svgCoordsFromEvent(svgEl, evt);
        dragNode = n; dx = p.x - n.x; dy = p.y - n.y;
        g.classList.add('dragging');
        evt.preventDefault();
      });
      svgEl.addEventListener('pointermove', evt => {
        if (!dragNode) return;
        const p = svgCoordsFromEvent(svgEl, evt);
        dragNode.x = p.x - dx;
        dragNode.y = p.y - dy;
        repaintNodes(root, sim, state);
        repaintEdges(root, sim, state);
      });
      const dropNode = () => {
        if (!dragNode) return;
        const topo = topoOf(sim, state);
        const hit = regionIdAtPoint(topo, dragNode.x, dragNode.y);
        if (hit && hit !== dragNode.regionKey) {
          dragNode.regionKey = hit;
          dragNode.region = topo.regionLabel[hit] || dragNode.region;
          const edge = topo.edges.find(e => e.from === dragNode.id);
          if (edge) edge.to = `loadBalancer_${hit}`;
          traceLine(root, `🏗️「${dragNode.label}」搬到「${esc(topo.regionLabel[hit] || hit)}」，改由這一區的機器承載。`, 'head');
        }
        svgEl.querySelector(`[data-node="${dragNode.id}"]`)?.classList.remove('dragging');
        dragNode = null;
        repaintNodes(root, sim, state);
        repaintEdges(root, sim, state);
        onLoadChange?.();
      };
      svgEl.addEventListener('pointerup', dropNode);
      svgEl.addEventListener('pointerleave', dropNode);
    }
    root.querySelectorAll('.sim-demo').forEach(btn => {
      btn.onclick = () => {
        const kind = btn.dataset.kind;
        const ctx = makeChoiceCtx(sim, state);
        const topo = topoOf(sim, state);
        const regionIds = topo.regionIds;
        const regionId = regionIds?.length ? regionIds[Math.floor(Math.random() * regionIds.length)] : undefined;
        const regionLabel = regionId && topo.regionLabel?.[regionId];
        const flowIds = topo.computeFlow(kind, ctx, regionId);
        svgEl.querySelector('.sim-token-demo')?.remove();
        traceLine(root, `— 開始模擬：${btn.textContent.trim()}${regionLabel ? `（來自「${regionLabel}」的請求）` : ''} —`, 'head');
        spawnRequest(root, sim, state, svgEl, flowIds, {
          token: {
            className: kind, tokenClass: 'sim-token-demo',
            durationMs: 1600 / (state.speed || 1),
            onHop: (idx, machine, nodeId) => {
              const n = findNode(topoOf(sim, state), nodeId);
              // Naming the exact machine is the whole point of splitting the pool apart: you can
              // now see that this request went to #2, and kill #2 to watch what happens.
              const which = machine ? ` #${machine.idx + 1}` : '';
              traceLine(root, `抵達「${n?.label || nodeId}」${which}${n?.arriveLabel ? '：' + n.arriveLabel : ''}`);
            },
            onDone: () => traceLine(root, '— 完成 —', 'done')
          }
        });
      };
    });
    // "N people watching the SAME video" is a different demonstration than the generic +users
    // ambient traffic: waypoints (and therefore the picked region + picked pool instance) are
    // resolved ONCE and shared by every spawned token, so they visibly all ride the identical
    // path — this is the point being made (a popular video's viewers mostly hit the same CDN
    // edge/streaming-server copy, not N independent origin trips).
    root.querySelectorAll('.sim-demo-concurrent').forEach(btn => {
      btn.onclick = () => {
        const topo = topoOf(sim, state);
        const ctx = makeChoiceCtx(sim, state);
        const regionIds = topo.regionIds;
        const regionId = regionIds?.length ? regionIds[Math.floor(Math.random() * regionIds.length)] : undefined;
        const regionLabel = regionId && topo.regionLabel?.[regionId];
        const flowIds = topo.computeFlow('watch', ctx, regionId);
        const route = routeFor(sim, state, flowIds);
        const count = Number(btn.dataset.count || 10);
        if (route.blockedAt) {
          traceLine(root, `⛔ 這 ${count} 個人的請求全部送不出去：「${route.blockedAt.label}」整組機器都當機了。`, 'bad');
          return;
        }
        const machineNote = route.chosen.map(c => `${findNode(topo, c.nodeId)?.label} #${c.idx + 1}`).join('、');
        traceLine(root, `— 模擬 ${count} 人同時觀看同一部影片${regionLabel ? `（${regionLabel}地區）` : ''}${machineNote ? `，全部被導到同一組機器：${machineNote}` : ''} —`, 'head');
        const weights = hopWeights(topo, route.visited);
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            spawnToken(svgEl, route.points, {
              className: 'concurrent', tokenClass: 'sim-token-ambient',
              durationMs: (1400 + Math.random() * 400) / (state.speed || 1),
              weights,
              guard: () => routeStillAlive(state, route.chosen),
              onDone: circle => setTimeout(() => circle?.remove(), 250 / (state.speed || 1))
            });
          }, i * 60 + Math.random() * 40);
        }
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
    const topo = topoOf(sim, state);
    if (!topo || !svgEl) { setTimeout(done, 200); return; }
    if (event.severity === 'cost') {
      traceLine(root, `— 帳務／成本事件：${event.title} —`, 'head');
      (event.relevantComponents || []).forEach(id => {
        // A capability can exist at more than one physical node (e.g. once per region) — stress
        // every instance, not just the first one declared, since the cost pressure applies to all.
        topo.nodes.filter(x => x.componentId === id).forEach(n => {
          svgEl.querySelector(`[data-node="${n.id}"]`)?.classList.add('stressed');
          traceLine(root, `「${n.label}」承受成本壓力`);
        });
      });
      setTimeout(done, 900 / (state.speed || 1));
      return;
    }
    // Events can override which nodes the token visits (`demoFlow`) — the default watch/browse
    // path often doesn't pass through every component (e.g. a small satellite node that sits
    // off to the side), so without an override the "break point" visual couldn't land on the
    // node that's actually missing.
    // A scripted demoFlow names specific nodes (users_us, apiServer_us…), and on an editable
    // topology the player may well have removed that whole region by the time the event fires.
    // Rewrite the path onto a region that still exists rather than animating nothing.
    const ctx = makeChoiceCtx(sim, state);
    let flowIds = event.demoFlow || topo.computeFlow('watch', ctx);
    if (event.demoFlow && flowIds.some(id => !findNode(topo, id))) {
      const live = topo.regionIds?.[0];
      const remapped = live ? flowIds.map(id => id.replace(/_[a-z0-9]+$/i, `_${live}`)) : flowIds;
      flowIds = remapped.every(id => findNode(topo, id))
        ? remapped
        : (topo.computeFlow ? topo.computeFlow('watch', ctx, live) : []).filter(id => findNode(topo, id));
    }
    // Only look for a break point when the event actually failed — some events succeed via an
    // OR of capabilities, so a "still off" relevant component doesn't always mean it broke there.
    const missingId = outcome.ok ? null : (event.relevantComponents || []).find(id => currentOptionId(sim, id, state) === 'off');
    // Look for the missing capability only among the nodes actually on this flow's path — a
    // capability can now exist at several physical nodes (e.g. once per region), and the token
    // only ever visits one of them, so a global first-match could point at a node it never went
    // near and put the "broke here" marker on the wrong region's box.
    const missingNode = missingId ? flowIds.map(id => findNode(topo, id)).find(n => n?.componentId === missingId) : null;
    let travelIds = flowIds;
    if (missingNode) {
      const idx = flowIds.indexOf(missingNode.id);
      if (idx >= 0) travelIds = flowIds.slice(0, idx + 1);
    }
    const waypoints = waypointsFor(sim, state, travelIds);
    const weights = hopWeights(topo, travelIds);
    traceLine(root, `— 事件發生：${event.title} —`, 'head');
    spawnToken(svgEl, waypoints, {
      className: outcome.ok ? 'ok' : 'bad',
      tokenClass: 'sim-token-event',
      durationMs: 1500 / (state.speed || 1),
      weights,
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

  // ---------- Adaptive bitrate playback sandbox ----------
  // A free-play "watch this play out" experiment, separate from the scripted monthly events:
  // playback is cut into fixed-length segments, and each segment's quality is decided by the
  // bandwidth the player *just* measured — the standard throughput-based ABR behaviour every
  // real DASH/HLS video player uses. You can force the network to degrade or recover at any
  // point and watch the quality (and, if the network is bad enough for long enough, the buffer)
  // react in real time, one segment at a time.

  function renderAbrLab(sim) {
    const cs = sim.abrSim;
    if (!cs) return '';
    return `<section class="sim-abrlab">
      <h2>📶 ${esc(cs.label || '自適應畫質播放實驗室')}</h2>
      <p class="sim-abrlab-desc">${esc(cs.desc || '模擬播放一部影片，畫面切成一個個固定長度的片段：每段要用什麼畫質，由播放器當下量測到的頻寬決定。')}</p>
      <div class="sim-abr-buffer-row"><span class="sim-abr-buffer-label">緩衝區</span><div class="sim-abr-buffer-track"><div class="sim-abr-buffer-fill" style="width:0%"></div></div></div>
      <p class="sim-abr-status">尚未開始</p>
      <div class="sim-abr-strip"></div>
      <div class="sim-abrlab-actions">
        <button class="button secondary sim-abr-start" type="button">${esc(cs.startLabel || '▶ 開始播放')}</button>
        <button class="button secondary sim-abr-degrade" type="button" disabled>🐌 模擬網路變差</button>
        <button class="button secondary sim-abr-recover" type="button" disabled>🚀 模擬網路恢復</button>
      </div>
    </section>`;
  }

  function wireAbrLab(root, sim, state) {
    const cs = sim.abrSim;
    if (!cs) return;
    // A previous mount may have left a ticking interval pointed at now-detached DOM nodes —
    // always clear it before wiring the fresh one.
    if (state.abrTimer) { clearInterval(state.abrTimer); state.abrTimer = null; }

    const bufferFill = root.querySelector('.sim-abr-buffer-fill');
    const status = root.querySelector('.sim-abr-status');
    const strip = root.querySelector('.sim-abr-strip');
    const startBtn = root.querySelector('.sim-abr-start');
    const degradeBtn = root.querySelector('.sim-abr-degrade');
    const recoverBtn = root.querySelector('.sim-abr-recover');
    if (!strip) return;

    const ladder = cs.ladder;
    const segmentSec = cs.segmentSec || 5;
    const maxBuffer = cs.maxBufferSec || 15;

    const setStatus = () => {
      const st = state.abr;
      bufferFill.style.width = `${clamp((st.buffer / maxBuffer) * 100)}%`;
      bufferFill.classList.toggle('low', st.buffer <= 2);
      const curQ = ladder.find(q => q.id === st.qualityId);
      status.textContent = st.idx >= st.total
        ? `✅ 播放完成 · 共 ${st.total} 個片段`
        : `播放中 · 第 ${st.idx}/${st.total} 段 · 目前畫質 ${curQ?.label || st.qualityId} · 緩衝 ${st.buffer.toFixed(1)} 秒`;
    };

    const appendSegBlock = seg => {
      const div = document.createElement('div');
      div.className = `sim-abr-seg q-${seg.qualityId}${seg.stalled ? ' stalled' : ''}`;
      div.textContent = ladder.find(q => q.id === seg.qualityId)?.label || seg.qualityId;
      div.title = `第 ${seg.idx} 段 · 量測頻寬 ${seg.mbps.toFixed(1)} Mbps`;
      strip.appendChild(div);
    };

    const finish = () => {
      clearInterval(state.abrTimer);
      state.abrTimer = null;
      startBtn.disabled = false;
      degradeBtn.disabled = true;
      recoverBtn.disabled = true;
      setStatus();
      const stalls = state.abr.segments.filter(s => s.stalled).length;
      traceLine(root, `— 播放結束，共 ${state.abr.total} 個片段，其中 ${stalls} 次卡頓重新緩衝 —`, 'done');
    };

    const tickAbr = () => {
      const st = state.abr;
      if (st.idx >= st.total) { finish(); return; }
      const [lo, hi] = st.condition === 'poor' ? (cs.poorMbpsRange || [0.4, 1.6]) : (cs.goodMbpsRange || [4.0, 7.5]);
      const measured = lo + Math.random() * (hi - lo);
      const curIdx = Math.max(0, ladder.findIndex(q => q.id === st.qualityId));
      // The highest tier the measured throughput can actually sustain right now.
      let sustainableIdx = 0;
      for (let i = ladder.length - 1; i >= 0; i--) {
        if (measured >= ladder[i].mbps * 0.9) { sustainableIdx = i; break; }
      }
      // Step down (possibly more than one tier at once) whenever the current tier isn't
      // sustainable; step up only ONE tier at a time even with plenty of headroom to spare —
      // real ABR players are conservative about climbing back up right after a drop.
      let nextIdx;
      if (sustainableIdx < curIdx) nextIdx = sustainableIdx;
      else if (curIdx < ladder.length - 1 && measured > ladder[curIdx + 1].mbps * 1.3) nextIdx = curIdx + 1;
      else nextIdx = curIdx;
      const chosen = ladder[nextIdx];
      const downloadTimeSec = (chosen.mbps * segmentSec) / measured;
      st.buffer = downloadTimeSec > segmentSec
        ? st.buffer - (downloadTimeSec - segmentSec)
        : Math.min(maxBuffer, st.buffer + (segmentSec - downloadTimeSec));
      let stalled = false;
      if (st.buffer <= 0) {
        stalled = true;
        st.buffer = 1; // small grace buffer so playback can resume next tick
        nextIdx = 0; // be maximally conservative right after a stall
      }
      st.qualityId = ladder[nextIdx].id;
      st.idx += 1;
      const seg = { idx: st.idx, qualityId: ladder[nextIdx].id, mbps: measured, stalled };
      st.segments.push(seg);
      appendSegBlock(seg);
      if (stalled) {
        traceLine(root, `⚠️ 第 ${seg.idx} 段：緩衝區見底，播放卡頓！量測頻寬僅 ${measured.toFixed(1)} Mbps，畫質降到最低的「${ladder[0].label}」重新開始累積緩衝。`, 'bad');
      } else {
        const tone = nextIdx === curIdx ? '' : nextIdx < curIdx ? 'bad' : 'ok';
        traceLine(root, `第 ${seg.idx}/${st.total} 段（第 ${(seg.idx - 1) * segmentSec}–${seg.idx * segmentSec} 秒）：量測頻寬 ${measured.toFixed(1)} Mbps，選擇畫質「${chosen.label}」`, tone);
      }
      setStatus();
      if (st.idx >= st.total) finish();
    };

    const start = () => {
      state.abr = { idx: 0, total: cs.segments, qualityId: ladder[ladder.length - 1].id, buffer: maxBuffer * 0.4, condition: 'normal', segments: [] };
      strip.innerHTML = '';
      startBtn.disabled = true;
      degradeBtn.disabled = false;
      recoverBtn.disabled = true;
      traceLine(root, `— 開始播放：${cs.label || '影片'}（共 ${cs.segments} 個 ${segmentSec} 秒片段，起始畫質「${ladder[ladder.length - 1].label}」）—`, 'head');
      setStatus();
      state.abrTimer = setInterval(tickAbr, (cs.tickMs || 650) / (state.speed || 1));
    };

    startBtn.onclick = start;
    degradeBtn.onclick = () => {
      state.abr.condition = 'poor';
      degradeBtn.disabled = true;
      recoverBtn.disabled = false;
      traceLine(root, '📉 模擬網路狀況變差（頻寬大幅下降）', 'bad');
    };
    recoverBtn.onclick = () => {
      state.abr.condition = 'normal';
      recoverBtn.disabled = true;
      degradeBtn.disabled = false;
      traceLine(root, '📈 模擬網路狀況恢復正常', 'ok');
    };

    // Restore the panel if playback was already in progress before this re-render.
    if (state.abr) {
      const finished = state.abr.idx >= state.abr.total;
      startBtn.disabled = !finished;
      degradeBtn.disabled = finished || state.abr.condition === 'poor';
      recoverBtn.disabled = finished || state.abr.condition === 'normal';
      state.abr.segments.forEach(appendSegBlock);
      setStatus();
      if (!finished) {
        state.abrTimer = setInterval(tickAbr, (cs.tickMs || 650) / (state.speed || 1));
      }
    }
  }

  // Converts a pointer event's screen coordinates into the SVG's own viewBox coordinate space.
  // Real browsers implement createSVGPoint/getScreenCTM for this; jsdom (this project's only
  // available test environment) implements neither, so the fallback — treating clientX/clientY
  // as already being in SVG space — isn't just a safety net, it's also the seam the automated
  // tests drive through by dispatching pointer events with clientX/clientY pre-set to the
  // desired SVG coordinates.
  function svgCoordsFromEvent(svgEl, evt) {
    if (typeof svgEl.createSVGPoint === 'function' && typeof svgEl.getScreenCTM === 'function') {
      const ctm = svgEl.getScreenCTM();
      if (ctm) {
        const pt = svgEl.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
      }
    }
    return { x: evt.clientX, y: evt.clientY };
  }

  // ---------- Draggable "drop a viewer into bad network" probe ----------
  // A persistent avatar, separate from the scripted monthly events and the standalone ABR
  // sandbox: drag it into the marked zone (or focus it and press Enter/Space, for keyboard
  // users) and its own playback — ticking continuously in the background, independent of the
  // ABR lab panel below — starts sampling the *poor* bandwidth range instead of the good one, so
  // its next 5-second segment visibly drops quality right there on the topology, no separate
  // panel required. Reuses the same throughput-based decision logic as the ABR lab (same ladder,
  // same hysteresis) so the two stay consistent.

  function wireDragViewer(root, sim, state) {
    const cs = sim.dragViewerSim;
    if (!cs || !state.dragViewer) return;
    if (state.dragViewerTimer) { clearInterval(state.dragViewerTimer); state.dragViewerTimer = null; }

    const svgEl = root.querySelector('svg.sim-topo');
    const g = root.querySelector('[data-drag-viewer]');
    if (!svgEl || !g) return;
    const topo = topoOf(sim, state);
    const circle = g.querySelector('circle');
    const emojiText = g.querySelector('.sim-drag-viewer-emoji');
    const qualityText = g.querySelector('.sim-drag-viewer-quality');
    const regionText = g.querySelector('.sim-drag-viewer-region');
    const zoneG = root.querySelector('[data-drag-zone]');
    const zoneRect = root.querySelector('.sim-drag-zone');
    const zoneLabel = root.querySelector('.sim-drag-zone-label');
    if (!state.badZone) state.badZone = { x: cs.zone.x, y: cs.zone.y };
    if (!state.dragViewer.regionId) state.dragViewer.regionId = cs.homeRegionId || topo?.regionIds?.[0] || null;

    const zoneW = () => state.badZone.width ?? cs.zone.width;
    const zoneH = () => state.badZone.height ?? cs.zone.height;
    const inZone = (x, y) => x >= state.badZone.x && x <= state.badZone.x + zoneW()
      && y >= state.badZone.y && y <= state.badZone.y + zoneH();

    const refreshZoneFlag = () => {
      const was = state.dragViewer.inZone;
      state.dragViewer.inZone = inZone(state.dragViewer.x, state.dragViewer.y);
      g.classList.toggle('in-zone', state.dragViewer.inZone);
      zoneRect?.classList.toggle('active', state.dragViewer.inZone);
      if (state.dragViewer.inZone !== was) {
        // Deliberately says "the segment that arrives NEXT", because that is exactly what
        // happens: the segment already in flight was fetched under the old conditions and still
        // plays at its original quality. Real players behave the same way.
        traceLine(root, state.dragViewer.inZone
          ? '🙋 測試觀眾走進訊號不良區——目前正在傳的那一段還是照舊畫質播完，要等下一段收到之後畫質才會降下來。'
          : '🙋 測試觀眾離開訊號不良區——同樣要等下一段收到之後，畫質才會開始往回爬。', state.dragViewer.inZone ? 'bad' : 'ok');
      }
    };

    const setPos = (x, y) => {
      state.dragViewer.x = x;
      state.dragViewer.y = y;
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      emojiText.setAttribute('x', x);
      emojiText.setAttribute('y', y + 5);
      qualityText.setAttribute('x', x);
      qualityText.setAttribute('y', y + 30);
      regionText?.setAttribute('x', x);
      regionText?.setAttribute('y', y + 44);
      // This viewer belongs to whichever region's drawn box they are standing in. Step outside
      // every box and nothing hands them over to someone else — a device does not lose its
      // region by sitting between two rectangles — so the last region keeps serving them.
      const hit = regionIdAtPoint(topo, x, y);
      if (hit && hit !== state.dragViewer.regionId) {
        state.dragViewer.regionId = hit;
        if (regionText) regionText.textContent = `由${topo.regionLabel?.[hit] || hit}服務`;
        state.dragViewer.lastPathKind = null;
        traceLine(root, `🙋 測試觀眾移動到「${esc(topo.regionLabel?.[hit] || hit)}」，改由這一區的節點服務。`, 'head');
      }
      refreshZoneFlag();
    };

    const handle = root.querySelector('[data-zone-handle]');
    const paintZone = () => {
      const { x, y } = state.badZone;
      zoneRect?.setAttribute('x', x);
      zoneRect?.setAttribute('y', y);
      zoneRect?.setAttribute('width', zoneW());
      zoneRect?.setAttribute('height', zoneH());
      zoneLabel?.setAttribute('x', x + 10);
      zoneLabel?.setAttribute('y', y + 22);
      handle?.setAttribute('x', x + zoneW() - 9);
      handle?.setAttribute('y', y + zoneH() - 9);
      refreshZoneFlag();
    };
    const setZonePos = (x, y) => {
      state.badZone.x = x;
      state.badZone.y = y;
      paintZone();
    };
    const MIN_ZONE = 60;
    const setZoneSize = (w, h) => {
      state.badZone.width = Math.max(MIN_ZONE, w);
      state.badZone.height = Math.max(MIN_ZONE, h);
      paintZone();
    };

    // One shared drag state for both movable objects: whichever was grabbed last owns the
    // pointer until it's released. `grabDX/DY` keeps the zone from jumping so its top-left
    // corner snaps under the cursor when you grab it by the middle.
    let dragTarget = null;
    let grabDX = 0, grabDY = 0;
    const beginDrag = (target, el, evt, originX, originY) => {
      dragTarget = target;
      const p = svgCoordsFromEvent(svgEl, evt);
      grabDX = p.x - originX;
      grabDY = p.y - originY;
      el.classList.add('dragging');
      el.setPointerCapture?.(evt.pointerId);
      evt.preventDefault();
    };
    g.addEventListener('pointerdown', evt => beginDrag('viewer', g, evt, state.dragViewer.x, state.dragViewer.y));
    zoneG?.addEventListener('pointerdown', evt => beginDrag('zone', zoneG, evt, state.badZone.x, state.badZone.y));
    // The corner handle resizes instead of moving; it sits inside the zone group, so it has to
    // claim the pointer first and stop the move-drag from also starting.
    handle?.addEventListener('pointerdown', evt => {
      evt.stopPropagation();
      beginDrag('zone-resize', zoneG, evt, state.badZone.x + zoneW(), state.badZone.y + zoneH());
    });
    const endDrag = evt => {
      if (!dragTarget) return;
      dragTarget = null;
      g.classList.remove('dragging');
      zoneG?.classList.remove('dragging');
      g.releasePointerCapture?.(evt.pointerId);
      zoneG?.releasePointerCapture?.(evt.pointerId);
    };
    svgEl.addEventListener('pointermove', evt => {
      if (!dragTarget) return;
      const p = svgCoordsFromEvent(svgEl, evt);
      if (dragTarget === 'viewer') setPos(p.x - grabDX, p.y - grabDY);
      else if (dragTarget === 'zone-resize') setZoneSize(p.x - grabDX - state.badZone.x, p.y - grabDY - state.badZone.y);
      else setZonePos(p.x - grabDX, p.y - grabDY);
    });
    svgEl.addEventListener('pointerup', endDrag);
    svgEl.addEventListener('pointerleave', endDrag);
    // Keyboard equivalents of both drags — also the path the automated tests drive through,
    // since neither needs any coordinate-space conversion to verify.
    g.addEventListener('keydown', evt => {
      if (evt.key !== 'Enter' && evt.key !== ' ') return;
      evt.preventDefault();
      const target = state.dragViewer.inZone
        ? cs.start
        : { x: state.badZone.x + zoneW() / 2, y: state.badZone.y + zoneH() / 2 };
      setPos(target.x, target.y);
    });
    zoneG?.addEventListener('keydown', evt => {
      // Arrows move it; shift+arrows resize it — the keyboard equivalent of the corner handle.
      const step = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[evt.key];
      if (!step) return;
      evt.preventDefault();
      if (evt.shiftKey) setZoneSize(zoneW() + step[0], zoneH() + step[1]);
      else setZonePos(state.badZone.x + step[0], state.badZone.y + step[1]);
    });
    paintZone();

    // "Let the viewer walk around on their own" — a random walk that genuinely wanders in and
    // out of the bad-signal zone, so you can watch quality fall and recover without holding the
    // mouse down. Bounded to the drawing area so they can never wander off the canvas.
    const wanderBtn = root.querySelector('[data-viewer-wander]');
    const syncWanderBtn = () => {
      if (!wanderBtn) return;
      wanderBtn.classList.toggle('active', !!state.dragViewer.wander);
      wanderBtn.textContent = state.dragViewer.wander ? '🚶 隨機走動中（點一下停止）' : '🚶 讓觀眾隨機走動';
      wanderBtn.setAttribute('aria-pressed', String(!!state.dragViewer.wander));
    };
    wanderBtn?.addEventListener('click', () => {
      state.dragViewer.wander = !state.dragViewer.wander;
      syncWanderBtn();
      traceLine(root, state.dragViewer.wander
        ? '🚶 測試觀眾開始隨機走動，會自己走進走出訊號不良區。'
        : '🚶 測試觀眾停下來了。', '');
    });
    syncWanderBtn();

    const [vbX, vbY, vbW, vbH] = String(topo?.viewBox || '0 0 1000 1000').split(/\s+/).map(Number);
    const stepWander = () => {
      if (!state.dragViewer.wander || dragTarget) return;
      const dv = state.dragViewer;
      dv.heading = (dv.heading ?? Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 1.1;
      const stepLen = 26;
      let nx = dv.x + Math.cos(dv.heading) * stepLen;
      let ny = dv.y + Math.sin(dv.heading) * stepLen;
      if (nx < vbX + 20 || nx > vbX + vbW - 20) { dv.heading = Math.PI - dv.heading; nx = clamp(nx, vbX + 20, vbX + vbW - 20); }
      if (ny < vbY + 20 || ny > vbY + vbH - 20) { dv.heading = -dv.heading; ny = clamp(ny, vbY + 20, vbY + vbH - 20); }
      setPos(nx, ny);
    };

    const ladder = cs.ladder || sim.abrSim?.ladder || [];
    const poorRange = cs.poorMbpsRange || sim.abrSim?.poorMbpsRange || [0.4, 1.6];
    const goodRange = cs.goodMbpsRange || sim.abrSim?.goodMbpsRange || [4.0, 7.5];
    const tickMs = cs.tickMs || sim.abrSim?.tickMs || 900;

    // ONE segment per tick, and the quality decision belongs to the segment's ARRIVAL, not its
    // departure. That ordering is the whole point: walking into the bad-signal area cannot
    // retroactively change the segment already in flight — it plays out at the quality it was
    // requested at, and only the segment that arrives AFTER that measures the worse bandwidth
    // and drops to 360p. Walking back out behaves the same way in reverse, so quality climbs
    // back one arrival at a time instead of snapping. Real ABR players work exactly like this.
    const tick = () => {
      stepWander();
      const dv = state.dragViewer;
      const r = dv.regionId;
      const ctx = makeChoiceCtx(sim, state);
      // This segment takes the SAME path every other watch request takes — resolved from the
      // scenario's own computeFlow for this viewer's region. So when the CDN is on and the
      // segment hits the edge, the packet genuinely leaves the CDN node; when it misses, it
      // genuinely comes from the streaming servers; and when there is no CDN at all, the CDN
      // node is not on the path and nothing comes out of it.
      const flowIds = (topo?.computeFlow ? topo.computeFlow('watch', ctx, r) : []) || [];
      if (flowIds.length < 2) return;
      const servedFromOrigin = flowIds.includes(`streamServer_${r}`);
      const originNode = findNode(topo, `streamServer_${r}`);
      const regionName = topo?.regionLabel?.[r] || r;

      // The quality this segment is being FETCHED at was decided when the previous one arrived.
      const sendIdx = Math.max(0, ladder.findIndex(q => q.id === dv.qualityId));

      // Announce where the bytes are coming from only when that actually changes, otherwise
      // every single tick would spam the log with the same line.
      const edgeCacheId = sim.capacity?.offloadFrom;
      const hasEdgeCache = edgeCacheId ? ctx.has(edgeCacheId) : false;
      const pathKind = servedFromOrigin ? (hasEdgeCache ? 'miss' : 'noCdn') : 'edge';
      if (pathKind !== dv.lastPathKind) {
        dv.lastPathKind = pathKind;
        if (pathKind === 'edge') traceLine(root, `🙋 這段影片在「${esc(regionName)}」的 CDN 邊緣節點命中，直接從 CDN 送出，完全沒有碰到後面的串流伺服器。`, 'ok');
        else if (pathKind === 'miss') traceLine(root, `🙋 CDN 沒有這部影片，這段回源到「${esc(regionName)}」的串流伺服器，再經 CDN 送出。`, '');
        else traceLine(root, `🙋 目前沒有建 CDN，每一段都直接從「${esc(regionName)}」的串流伺服器送出。`, '');
      }

      // Decided at ARRIVAL, from the conditions that hold at that moment.
      const onSegmentArrived = () => {
        // Being served from an overloaded origin is not free: a streaming tier carrying more
        // viewers than it has capacity for delivers each of them less bandwidth, which the ABR
        // logic then reacts to — the same causal chain as the bad-signal zone, but caused by an
        // architecture decision instead of by where the viewer is standing.
        const load = servedFromOrigin ? nodeLoad(sim, state, originNode) : null;
        const overloadFactor = load && load.ratio > 1 ? Math.max(0.15, 1 - (load.ratio - 1) * 0.5) : 1;
        const [lo, hi] = dv.inZone ? poorRange : goodRange;
        const measured = (lo + Math.random() * (hi - lo)) * overloadFactor;
        const curIdx = Math.max(0, ladder.findIndex(q => q.id === dv.qualityId));
        let sustainableIdx = 0;
        for (let i = ladder.length - 1; i >= 0; i--) {
          if (measured >= ladder[i].mbps * 0.9) { sustainableIdx = i; break; }
        }
        let nextIdx;
        if (sustainableIdx < curIdx) nextIdx = sustainableIdx;
        else if (curIdx < ladder.length - 1 && measured > ladder[curIdx + 1].mbps * 1.3) nextIdx = curIdx + 1;
        else nextIdx = curIdx;
        if (nextIdx !== curIdx) {
          dv.qualityId = ladder[nextIdx].id;
          qualityText.textContent = ladder[nextIdx].label;
          qualityText.setAttribute('class', `sim-drag-viewer-quality q-${ladder[nextIdx].id}`);
          traceLine(root, `🙋 這一段收到了：量測頻寬 ${measured.toFixed(1)} Mbps，所以「下一段」畫質${nextIdx < curIdx ? '降為' : '回升為'}「${ladder[nextIdx].label}」。`, nextIdx < curIdx ? 'bad' : 'ok');
        }
        if (overloadFactor < 1 && !dv.warnedOverload) {
          dv.warnedOverload = true;
          traceLine(root, `⚠️「${esc(originNode?.label || regionName)}」已超載（負載 ${Math.round(load.ratio * 100)}%），分給每位觀眾的頻寬被壓縮，畫質會被迫下降——加開機器或用 CDN 分流才救得回來。`, 'bad');
        }
        if (overloadFactor >= 1) dv.warnedOverload = false;
      };

      spawnRequest(root, sim, state, svgEl, flowIds, {
        trace: true,
        // Both ends of this round trip are the viewer themself, wherever they are standing now.
        mapPoint: (nodeId, p) => (nodeId === `users_${r}` ? { x: dv.x, y: dv.y } : p),
        token: {
          tokenClass: 'sim-token-segment',
          className: `q-${ladder[sendIdx].id}`,
          radius: 5 + sendIdx * 4,
          durationMs: (tickMs * 0.9) / (state.speed || 1),
          onDone: c => { c?.remove(); onSegmentArrived(); }
        },
        // A segment lost because its machine was pulled is a stall, not an arrival: nothing is
        // measured, so the quality for the next segment is left exactly where it was.
        onLost: () => traceLine(root, '🙋 這一段影片沒有送達（負責的機器中途被拔掉），播放器會卡住重新請求。', 'bad'),
        onBlocked: () => traceLine(root, '🙋 測試觀眾完全收不到影片：這一區沒有任何一台機器可以服務他。', 'bad')
      });
    };

    qualityText.textContent = ladder.find(q => q.id === state.dragViewer.qualityId)?.label || state.dragViewer.qualityId || '--';
    refreshZoneFlag();
    state.dragViewerTimer = setInterval(tick, tickMs / (state.speed || 1));
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
      <ul class="sim-briefing-list">${sim.briefing.map(t => `<li>${esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>
      <button class="button sim-start" type="button">開始這一年</button>
      <a class="button secondary" href="system-design-chapter.html?chapter=${encodeURIComponent(sim.chapterId)}">先回教材複習</a>
    </section>`;
    root.querySelector('.sim-start').onclick = () => {
      state.phase = 'play';
      render(root, sim, state);
    };
  }

  // The "your architecture currently cannot carry this month's traffic" banner. Rendered from
  // the same nodeLoad numbers the diagram draws, so the two can never disagree.
  function overloadBannerHtml(sim, state) {
    const over = overloadedNodes(sim, state);
    if (!over.length) return '';
    const list = over.slice(0, 3).map(x => `${esc(x.node.label)}（${Math.round(x.load.ratio * 100)}%）`).join('、');
    return `<div class="sim-hint bad">⚠️ 目前有 ${over.length} 個節點超載：${list}${over.length > 3 ? ' 等' : ''}。再推進一個月會扣播放品質分數——用節點旁的 ＋ 加開機器，或改用 CDN 把觀看流量分流到邊緣節點。</div>`;
  }

  function refreshLoadSummary(root, sim, state) {
    const box = root.querySelector('[data-load-summary]');
    if (box) box.innerHTML = overloadBannerHtml(sim, state);
    const cost = root.querySelector('[data-cost-readout]');
    if (cost) cost.textContent = String(weeklyCostPenalty(sim, state));
  }

  function renderPlay(root, sim, state) {
    const viewers = sim.viewersAtMonth(state.month);
    const nextEvent = sim.events.find(e => e.month === state.month + 1);
    const lab = labels(sim);
    root.innerHTML = `<section class="sim-screen sim-play">
      <header class="sim-dashboard-head">
        <div class="eyebrow">${esc(sim.title)}</div>
        <h1>第 ${state.month} / ${sim.months} 個月</h1>
        <p class="sim-viewers">${esc(sim.viewersLabel || '目前尖峰同時使用人數估計')}：<strong>${numFmt(viewers)}</strong>　·　每月營運成本指數：<strong data-cost-readout>${weeklyCostPenalty(sim, state)}</strong></p>
      </header>
      <div data-load-summary>${overloadBannerHtml(sim, state)}</div>
      <div class="sim-meters">
        ${meterRow(lab.uptime, state.uptime, state.uptime >= 80 ? 'good' : state.uptime >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.qoe, state.qoe, state.qoe >= 80 ? 'good' : state.qoe >= 50 ? 'warn' : 'bad')}
        ${meterRow(lab.cost, state.costEff, state.costEff >= 80 ? 'good' : state.costEff >= 50 ? 'warn' : 'bad')}
      </div>
      ${svgTopology(sim, state, { interactive: true, showControls: true })}
      ${renderChunkLab(sim)}
      ${renderAbrLab(sim)}
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
      // Changing a strategy can change instance counts and, through the CDN, every region's
      // load — refresh the overload banner and the cost readout, not just the diagram.
      refreshLoadSummary(root, sim, state);
      // The test viewer's probe only announces where its bytes come from when that changes;
      // clearing the marker here makes it re-announce right after you flip a capability, which
      // is exactly the moment you want to see "…now it comes from the CDN instead" in the log.
      if (state.dragViewer) state.dragViewer.lastPathKind = null;
    }, (nodeId, delta) => {
      const node = findNode(topoOf(sim, state), nodeId);
      if (!node) return;
      const base = baseInstances(sim, state, node);
      const curExtra = Math.max(0, state.extraInstances[nodeId] || 0);
      const nextExtra = Math.max(0, Math.min(MAX_INSTANCES - base, curExtra + delta));
      if (nextExtra === curExtra) {
        traceLine(root, delta > 0
          ? `「${node.label}」已經到這個模擬的機器數上限（${MAX_INSTANCES} 台）。`
          : `「${node.label}」已經是目前備援策略的基本台數，要再減少請先切換這個節點的備援策略。`, 'bad');
        return;
      }
      state.extraInstances[nodeId] = nextExtra;
      repaintNodes(root, sim, state);
      refreshLoadSummary(root, sim, state);
      const load = nodeLoad(sim, state, node);
      traceLine(root, `「${node.label}」${delta > 0 ? '加開' : '收掉'}一台機器，現在共 ${base + nextExtra} 台${
        load ? `，負載變成 ${Math.round(load.ratio * 100)}%` : ''
      }（每台每月成本 ${node.extraInstanceCost ?? 1}）。`, delta > 0 ? 'ok' : '');
    }, (nodeId, idx) => {
      // Pull (or re-seat) one specific machine. Requests already in flight toward it die on the
      // spot — see spawnToken's guard — and the load balancer stops routing to it immediately.
      const node = findNode(topoOf(sim, state), nodeId);
      if (!node) return;
      const nowDown = !instanceIsDown(state, nodeId, idx);
      const aliveAfter = aliveInstanceIndexes(sim, state, node).length + (nowDown ? -1 : 1);
      setInstanceDown(state, nodeId, idx, nowDown);
      repaintNodes(root, sim, state);
      refreshLoadSummary(root, sim, state);
      if (nowDown) {
        traceLine(root, aliveAfter > 0
          ? `💀 拔掉「${node.label}」#${idx + 1}。負載平衡器立刻把流量改導到剩下的 ${aliveAfter} 台，正在傳給這台的請求則直接中斷。`
          : `💀 拔掉「${node.label}」#${idx + 1}——這是最後一台，這一層現在完全沒有機器可以服務請求了。`, 'bad');
      } else {
        traceLine(root, `🔌 把「${node.label}」#${idx + 1} 插回去，它重新開始接收流量（共 ${aliveAfter} 台運作中）。`, 'ok');
      }
    }, () => {
      // A structural change (new region / new user group) changes the node and edge lists
      // themselves, so the diagram is rebuilt — but the trace log is carried across so the
      // record of what you just did survives the rebuild.
      const log = root.querySelector('.sim-trace-body')?.innerHTML || '';
      renderPlay(root, sim, state);
      const body = root.querySelector('.sim-trace-body');
      if (body && log) { body.innerHTML = log; body.scrollTop = body.scrollHeight; }
    }, () => refreshLoadSummary(root, sim, state));
    wireTraceClear(root);
    wireChunkLab(root, sim, state);
    wireAbrLab(root, sim, state);
    wireDragViewer(root, sim, state);

    root.querySelector('.sim-advance').onclick = () => {
      if (state.month >= sim.months) {
        state.phase = 'summary';
        return render(root, sim, state);
      }
      // Overload is charged for the month you just finished — i.e. against the capacity you
      // actually had while those viewers were watching — before the traffic estimate steps up.
      const overload = applyMonthOverload(sim, state);
      state.month += 1;
      applyMonthCost(sim, state);
      if (overload) {
        state.log.push({
          month: state.month - 1,
          title: '容量不足：節點超載',
          narrative: `這個月有 ${overload.count} 個節點的負載超過容量，最嚴重的是「${overload.worst.node.label}」（${Math.round(overload.worst.load.ratio * 100)}%）。`,
          result: '超過容量的機器沒辦法給每位觀眾足夠的頻寬，觀眾端表現為緩衝變久、畫質被迫下降。加開機器或把觀看流量分流到 CDN 邊緣節點都能解決。',
          ok: false, uptime: 0, qoe: -overload.penalty,
          relevantComponents: [], choiceSnapshot: snapshotChoices(sim, state),
          capacityIssue: true
        });
      }
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
      if (state.abrTimer) clearInterval(state.abrTimer);
      if (state.dragViewerTimer) clearInterval(state.dragViewerTimer);
      Object.assign(state, newState(sim));
      render(root, sim, state);
    };
  }

  // ---------- Free-build sandbox mode ----------
  // A separate, unscripted mode (chapter=sandbox): no strategies, no events, no scoring — just a
  // blank canvas you build your own topology on. Drag a node type out of the palette to create
  // it, click an existing node to configure its label/region/connections, drag it to reposition.
  // Reuses the exact pointer+SVG-coordinate machinery already built for the draggable test-viewer
  // (svgCoordsFromEvent's getScreenCTM fallback is what makes this testable in jsdom at all) and
  // the same regionBoxesSvg used everywhere else, so a sandbox topology looks and groups exactly
  // like every scripted chapter's does.

  const SANDBOX_NODE_TYPES = [
    { type: 'user', label: '使用者', icon: '👤' },
    { type: 'cdn', label: 'CDN', icon: '☁️' },
    { type: 'loadBalancer', label: 'Load Balancer', icon: '⚖️' },
    { type: 'api', label: 'API 伺服器', icon: '🖥️' },
    { type: 'db', label: '資料庫', icon: '🗄️' },
    { type: 'cache', label: '快取', icon: '⚡' },
    { type: 'storage', label: '儲存系統', icon: '📦' },
    { type: 'queue', label: '訊息佇列', icon: '📨' },
    { type: 'worker', label: '工作程序', icon: '⚙️' },
    { type: 'custom', label: '自訂', icon: '🔷' }
  ];
  const sandboxTypeMeta = type => SANDBOX_NODE_TYPES.find(t => t.type === type) || SANDBOX_NODE_TYPES[SANDBOX_NODE_TYPES.length - 1];

  // Not a hard whitelist — a sandbox that blocked "unusual" connections outright would fight
  // anyone trying to deliberately model a weird real system. Missing from this list just means
  // "flag it with a warning icon", never "refuse to create the edge".
  const SANDBOX_SENSIBLE_PAIRS = {
    user: ['cdn', 'loadBalancer', 'api'],
    cdn: ['user', 'loadBalancer', 'storage', 'api'],
    loadBalancer: ['user', 'cdn', 'api', 'worker'],
    api: ['user', 'loadBalancer', 'db', 'cache', 'storage', 'queue', 'worker', 'cdn'],
    db: ['api', 'worker', 'cache'],
    cache: ['api', 'db', 'worker'],
    storage: ['api', 'worker', 'cdn', 'queue'],
    queue: ['api', 'worker', 'storage'],
    worker: ['queue', 'db', 'cache', 'storage', 'loadBalancer', 'api']
  };
  function sandboxIsSensible(typeA, typeB) {
    if (typeA === 'custom' || typeB === 'custom') return true;
    const list = SANDBOX_SENSIBLE_PAIRS[typeA];
    return !list || list.includes(typeB);
  }

  // Unweighted BFS over the edges the player actually drew — this is what "▶ 模擬請求" answers:
  // is there really a connected path from this node to that one, and if so, which one.
  function sandboxFindPath(state, fromId, toId) {
    if (fromId === toId) return [fromId];
    const adj = {};
    state.edges.forEach(e => {
      (adj[e.from] ??= []).push(e.to);
      (adj[e.to] ??= []).push(e.from);
    });
    const visited = new Set([fromId]);
    const queue = [[fromId]];
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      for (const next of (adj[last] || [])) {
        if (next === toId) return [...path, next];
        if (!visited.has(next)) { visited.add(next); queue.push([...path, next]); }
      }
    }
    return null;
  }

  function newSandboxState() {
    return {
      nodes: [], edges: [], nextId: 1, selectedNodeId: null,
      regions: ['A 區'], activeRegion: 'A 區',
      simFrom: '', simTo: ''
    };
  }

  function sandboxNodesSvg(state, selectedId) {
    return state.nodes.map(n => {
      const meta = sandboxTypeMeta(n.type);
      const selected = n.id === selectedId;
      return `<g class="sim-topo-node sandbox-node${selected ? ' selected' : ''}" data-sandbox-node="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(n.label)}">
        <circle cx="${n.x}" cy="${n.y}" r="24"/>
        <text class="sim-topo-mark sandbox-icon" x="${n.x}" y="${n.y + 7}">${meta.icon}</text>
        <text class="sim-topo-label" x="${n.x}" y="${n.y + 40}">${esc(n.label)}</text>
      </g>`;
    }).join('');
  }

  function sandboxEdgesSvg(state) {
    return state.edges.map(e => {
      const a = state.nodes.find(n => n.id === e.from), b = state.nodes.find(n => n.id === e.to);
      if (!a || !b) return '';
      return `<line class="sim-topo-edge active" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }).join('');
  }

  function renderSandbox(root, state) {
    const selected = state.nodes.find(n => n.id === state.selectedNodeId);
    root.innerHTML = `<section class="sim-screen sim-sandbox">
      <div class="eyebrow">自由建構模式</div>
      <h1>拓樸圖沙盒</h1>
      <p class="sim-lede">從左邊工具列把截點類型拖到畫布上放開就能新增；點一下既有截點可以設定名稱、地區與連線；直接拖曳截點可以移動位置。畫完可以按「模擬請求」讓一個真的請求沿著你畫的連線跑一次。</p>
      <div class="sim-sandbox-layout">
        <div class="sim-sandbox-palette">
          ${SANDBOX_NODE_TYPES.map(t => `<div class="sim-palette-item" data-palette-type="${t.type}" role="button" tabindex="0"><span class="sim-palette-icon">${t.icon}</span><span>${esc(t.label)}</span></div>`).join('')}
          <div class="sim-sandbox-region-block">
            <label class="sim-sandbox-field">目前地區（新截點會加進這裡）
              <select class="sim-sandbox-active-region">
                ${state.regions.map(r => `<option value="${esc(r)}" ${r === state.activeRegion ? 'selected' : ''}>${esc(r)}</option>`).join('')}
              </select>
            </label>
            <div class="sim-sandbox-region-add">
              <input type="text" class="sim-sandbox-new-region-input" placeholder="新地區名稱">
              <button class="button secondary sim-sandbox-add-region-btn" type="button">＋ 新增地區</button>
            </div>
          </div>
          <button class="button secondary sim-sandbox-clear" type="button">清空畫布</button>
        </div>
        <div class="sim-sandbox-canvas-wrap">
          <svg class="sim-topo sim-sandbox-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" role="img" aria-label="自訂拓樸圖畫布">
            ${regionBoxesSvg({ nodes: state.nodes })}
            <g class="sandbox-edges-group">${sandboxEdgesSvg(state)}</g>
            ${sandboxNodesSvg(state, state.selectedNodeId)}
          </svg>
          <div class="sim-sandbox-toolbar">
            <select class="sim-sandbox-sim-from"><option value="">起點…</option>${state.nodes.map(n => `<option value="${esc(n.id)}" ${state.simFrom === n.id ? 'selected' : ''}>${sandboxTypeMeta(n.type).icon} ${esc(n.label)}</option>`).join('')}</select>
            <select class="sim-sandbox-sim-to"><option value="">終點…</option>${state.nodes.map(n => `<option value="${esc(n.id)}" ${state.simTo === n.id ? 'selected' : ''}>${sandboxTypeMeta(n.type).icon} ${esc(n.label)}</option>`).join('')}</select>
            <button class="button sim-sandbox-simulate-btn" type="button">▶ 模擬請求</button>
            <button class="button secondary sim-sandbox-check-btn" type="button">🔍 檢查架構</button>
            <button class="button secondary sim-sandbox-export-btn" type="button">⬇️ 匯出 JSON</button>
          </div>
          <div class="sim-trace">
            <div class="sim-trace-head"><span>即時處理紀錄</span><button class="sim-trace-clear" type="button">清空</button></div>
            <div class="sim-trace-body"></div>
          </div>
        </div>
      </div>
      ${selected ? `<div class="sim-sandbox-modal-backdrop" data-sandbox-backdrop>
      <div class="sim-sandbox-config" role="dialog" aria-modal="true">
        <h2>${sandboxTypeMeta(selected.type).icon} 設定截點</h2>
        <label class="sim-sandbox-field">顯示名稱<input type="text" class="sim-sandbox-label-input" value="${esc(selected.label)}"></label>
        <label class="sim-sandbox-field">所屬地區
          <select class="sim-sandbox-region-select">
            ${state.regions.map(r => `<option value="${esc(r)}" ${r === (selected.region || '') ? 'selected' : ''}>${esc(r)}</option>`).join('')}
          </select>
        </label>
        <div class="sim-sandbox-field">
          <span>連線到</span>
          <div class="sim-sandbox-connections">
            ${state.nodes.filter(n => n.id !== selected.id).map(n => {
              const connected = state.edges.some(e => (e.from === selected.id && e.to === n.id) || (e.from === n.id && e.to === selected.id));
              const sensible = sandboxIsSensible(selected.type, n.type);
              const warnIcon = connected && !sensible ? ' <span class="sim-sandbox-conn-warn-icon" title="這種連線不常見">⚠️</span>' : '';
              return `<label class="sim-sandbox-conn-item${connected && !sensible ? ' warn' : ''}"><input type="checkbox" class="sim-sandbox-conn-toggle" data-target="${esc(n.id)}" ${connected ? 'checked' : ''}> ${sandboxTypeMeta(n.type).icon} ${esc(n.label)}${warnIcon}</label>`;
            }).join('') || '<p class="sim-sandbox-empty">畫布上還沒有其他截點可以連線。</p>'}
          </div>
        </div>
        <div class="sim-sandbox-config-actions">
          <button class="button secondary sim-sandbox-delete" type="button">🗑 刪除這個截點</button>
          <button class="button secondary sim-sandbox-close" type="button">關閉</button>
        </div>
      </div>
      </div>` : ''}
    </section>`;
    wireSandbox(root, state);
  }

  function wireSandbox(root, state) {
    const svgEl = root.querySelector('svg.sim-sandbox-svg');
    if (!svgEl) return;

    const rerender = () => renderSandbox(root, state);

    // Every render calls wireSandbox again, so any Escape listener from a previous mount would
    // otherwise stack up (document-level listeners aren't cleaned up when their DOM is replaced).
    // At most one should ever be live at a time — remove the last one before maybe attaching a
    // fresh one below.
    if (state._sandboxEscapeHandler) {
      document.removeEventListener('keydown', state._sandboxEscapeHandler);
      state._sandboxEscapeHandler = null;
    }

    // Drag a palette chip out onto the canvas to create a node there. The ghost node is a real
    // SVG element from the moment the drag starts, positioned via svgCoordsFromEvent — since
    // that's an affine transform it stays mathematically correct even while the pointer is over
    // the HTML palette rather than the SVG itself, so there's no special-casing needed for "is
    // the pointer currently over the canvas".
    root.querySelectorAll('.sim-palette-item').forEach(chip => {
      chip.addEventListener('pointerdown', evt => {
        const type = chip.dataset.paletteType;
        const meta = sandboxTypeMeta(type);
        const ghost = document.createElementNS(SVG_NS, 'g');
        ghost.setAttribute('class', 'sim-topo-node sandbox-node ghost');
        const p0 = svgCoordsFromEvent(svgEl, evt);
        ghost.innerHTML = `<circle cx="${p0.x}" cy="${p0.y}" r="24"/><text class="sim-topo-mark sandbox-icon" x="${p0.x}" y="${p0.y + 7}">${meta.icon}</text>`;
        svgEl.appendChild(ghost);
        let last = p0;
        const onMove = mv => {
          const p = svgCoordsFromEvent(svgEl, mv);
          last = p;
          ghost.querySelector('circle').setAttribute('cx', p.x);
          ghost.querySelector('circle').setAttribute('cy', p.y);
          const t = ghost.querySelector('text');
          t.setAttribute('x', p.x);
          t.setAttribute('y', p.y + 7);
        };
        const onUp = () => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          ghost.remove();
          const id = `n${state.nextId++}`;
          state.nodes.push({ id, type, region: state.activeRegion, label: meta.label, x: Math.round(last.x), y: Math.round(last.y) });
          state.selectedNodeId = id;
          rerender();
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp, { once: true });
      });
    });

    // Existing nodes: a short drag repositions the node; a drag under the movement threshold is
    // treated as a click that opens the config panel instead (classic click-vs-drag disambiguation).
    root.querySelectorAll('[data-sandbox-node]').forEach(g => {
      const id = g.dataset.sandboxNode;
      const activateSelect = () => { state.selectedNodeId = id; rerender(); };
      let moved = false;
      g.addEventListener('pointerdown', evt => {
        moved = false;
        const startClient = { x: evt.clientX, y: evt.clientY };
        const onMove = mv => {
          if (!moved && Math.hypot(mv.clientX - startClient.x, mv.clientY - startClient.y) > 4) moved = true;
          if (!moved) return;
          const p = svgCoordsFromEvent(svgEl, mv);
          const node = state.nodes.find(n => n.id === id);
          if (!node) return;
          node.x = Math.round(p.x);
          node.y = Math.round(p.y);
          const circle = g.querySelector('circle');
          const [markText, labelText] = g.querySelectorAll('text');
          circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
          markText.setAttribute('x', node.x); markText.setAttribute('y', node.y + 7);
          labelText.setAttribute('x', node.x); labelText.setAttribute('y', node.y + 40);
          // Edges touching this node are redrawn each move so they stay attached while dragging.
          // Setting innerHTML on an existing <g> (not the <svg> root) is the same safe pattern
          // used everywhere else in this file for patching SVG content in place.
          svgEl.querySelector('.sandbox-edges-group').innerHTML = sandboxEdgesSvg(state);
        };
        const onUp = () => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          if (moved) rerender(); else activateSelect();
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp, { once: true });
      });
      g.addEventListener('keydown', evt => {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); activateSelect(); }
      });
    });

    root.querySelector('.sim-sandbox-clear')?.addEventListener('click', () => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      rerender();
    });

    // Regions are a real, managed list now (not free text typed fresh on every node) — new
    // nodes default to whichever region is currently "active", and creating a new region is its
    // own explicit step, matching "先有一個 A 區域，要別的地區要先新建立".
    root.querySelector('.sim-sandbox-active-region')?.addEventListener('change', evt => {
      state.activeRegion = evt.target.value;
    });
    root.querySelector('.sim-sandbox-add-region-btn')?.addEventListener('click', () => {
      const input = root.querySelector('.sim-sandbox-new-region-input');
      const name = (input?.value || '').trim();
      if (!name) return;
      if (!state.regions.includes(name)) state.regions.push(name);
      state.activeRegion = name;
      rerender();
    });

    wireTraceClear(root);
    root.querySelector('.sim-sandbox-sim-from')?.addEventListener('change', evt => { state.simFrom = evt.target.value; });
    root.querySelector('.sim-sandbox-sim-to')?.addEventListener('change', evt => { state.simTo = evt.target.value; });

    // "Does this actually connect to anything" answered for real: BFS over the edges the player
    // drew, then a genuine spawnToken animation along whatever path exists — reusing the exact
    // same engine machinery every scripted chapter's demo button uses, not a separate mechanic.
    root.querySelector('.sim-sandbox-simulate-btn')?.addEventListener('click', () => {
      const fromId = state.simFrom, toId = state.simTo;
      if (!fromId || !toId) { traceLine(root, '⚠️ 請先選擇起點與終點。', 'bad'); return; }
      const fromNode = state.nodes.find(n => n.id === fromId), toNode = state.nodes.find(n => n.id === toId);
      const path = sandboxFindPath(state, fromId, toId);
      if (!path) {
        traceLine(root, `❌ 找不到路徑：「${fromNode?.label}」跟「${toNode?.label}」目前沒有連通，檢查一下中間是不是少畫了一條線。`, 'bad');
        return;
      }
      const waypoints = path.map(id => { const n = state.nodes.find(x => x.id === id); return { x: n.x, y: n.y }; });
      traceLine(root, `— 開始模擬請求：「${fromNode?.label}」→「${toNode?.label}」，共 ${waypoints.length - 1} 段連線 —`, 'head');
      svgEl.querySelector('.sim-token-demo')?.remove();
      spawnToken(svgEl, waypoints, {
        tokenClass: 'sim-token-demo',
        durationMs: 1600,
        onHop: idx => { const n = state.nodes.find(x => x.id === path[idx]); traceLine(root, `抵達「${n?.label || path[idx]}」`); },
        onDone: () => traceLine(root, '— 完成，這條路徑真的連通 —', 'done')
      });
    });

    root.querySelector('.sim-sandbox-check-btn')?.addEventListener('click', () => {
      if (!state.nodes.length) { traceLine(root, '架構檢查：畫布上還沒有任何截點。', 'bad'); return; }
      const isolated = state.nodes.filter(n => !state.edges.some(e => e.from === n.id || e.to === n.id));
      if (!isolated.length) traceLine(root, `架構檢查：${state.nodes.length} 個截點都至少有一條連線，沒有孤立截點。`, 'ok');
      else traceLine(root, `⚠️ 架構檢查：發現 ${isolated.length} 個孤立截點（沒有任何連線）：${isolated.map(n => n.label).join('、')}。`, 'bad');
    });

    root.querySelector('.sim-sandbox-export-btn')?.addEventListener('click', () => {
      const data = JSON.stringify({ regions: state.regions, nodes: state.nodes, edges: state.edges }, null, 2);
      try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sandbox-topology.json';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        traceLine(root, '⬇️ 已匯出目前架構為 sandbox-topology.json。', 'done');
      } catch {
        traceLine(root, '⚠️ 這個瀏覽器不支援直接下載檔案，架構的 JSON 內容已印在瀏覽器主控台（console）。', 'bad');
        console.log(data);
      }
    });

    const selected = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!selected) return;
    root.querySelector('.sim-sandbox-label-input')?.addEventListener('input', evt => { selected.label = evt.target.value; });
    root.querySelector('.sim-sandbox-label-input')?.addEventListener('change', rerender);
    root.querySelector('.sim-sandbox-region-select')?.addEventListener('change', evt => { selected.region = evt.target.value; rerender(); });
    root.querySelectorAll('.sim-sandbox-conn-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        const targetId = cb.dataset.target;
        const idx = state.edges.findIndex(e => (e.from === selected.id && e.to === targetId) || (e.from === targetId && e.to === selected.id));
        if (cb.checked && idx === -1) state.edges.push({ from: selected.id, to: targetId });
        else if (!cb.checked && idx !== -1) state.edges.splice(idx, 1);
        rerender();
      });
    });
    root.querySelector('.sim-sandbox-delete')?.addEventListener('click', () => {
      state.nodes = state.nodes.filter(n => n.id !== selected.id);
      state.edges = state.edges.filter(e => e.from !== selected.id && e.to !== selected.id);
      state.selectedNodeId = null;
      rerender();
    });
    root.querySelector('.sim-sandbox-close')?.addEventListener('click', () => {
      state.selectedNodeId = null;
      rerender();
    });
    // Clicking the dimmed backdrop (but not the dialog itself) closes the modal, same as
    // pressing Escape — both are standard modal-dismiss conventions.
    const backdrop = root.querySelector('[data-sandbox-backdrop]');
    backdrop?.addEventListener('click', evt => {
      if (evt.target === backdrop) { state.selectedNodeId = null; rerender(); }
    });
    if (backdrop) {
      const onEscape = evt => {
        if (evt.key !== 'Escape') return;
        state.selectedNodeId = null;
        rerender();
      };
      state._sandboxEscapeHandler = onEscape;
      document.addEventListener('keydown', onEscape);
    }
  }

  function boot() {
    const root = document.querySelector('#simRoot');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const chapterId = params.get('chapter') || 'sd-book-14';
    if (chapterId === 'sandbox') {
      document.title = '自由建構模式｜拓樸圖沙盒';
      renderSandbox(root, newSandboxState());
      return;
    }
    const sim = window.SYSTEM_DESIGN_SIM?.[chapterId];
    if (!sim) {
      const available = Object.keys(window.SYSTEM_DESIGN_SIM || {});
      root.innerHTML = `<section class="sim-screen"><h1>這一章還沒有模擬關卡</h1><p>目前做了模擬關卡的章節：${available.length ? esc(available.join('、')) : '（無）'}</p><a class="button" href="system-design.html">回到章節目錄</a><p class="sim-sandbox-hint"><a href="system-design-simulator.html?chapter=sandbox">或試試自由建構模式 →</a></p></section>`;
      return;
    }
    document.title = `模擬關卡｜${sim.title}`;
    const state = newState(sim);
    // The live state object, so the automated tests can assert on the same architecture the
    // screen is actually rendering (jsdom has no way to read it back out of the SVG).
    window.__simTestHooks.stateRef = () => state;
    render(root, sim, state);
  }

  // Exposed only for the automated test harness (jsdom can't fast-forward real timers, so the
  // pure geometry used by the token animation needs to be reachable and testable in isolation).
  window.__simTestHooks = {
    pointAlongPath, waypointsFor, clusterPositions, hopWeights,
    instanceCount, nodeLoad, overloadedNodes, weeklyCostPenalty, regionIdAtPoint, nodeIsPresent,
    routeFor, regionShare, instanceIsDown, aliveInstanceIndexes, nodeCanServe, topoOf
  };

  boot();
})();
