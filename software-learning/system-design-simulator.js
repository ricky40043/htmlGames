(() => {
  const STORAGE_KEY = 'softwareSystemDesignSimProgressV1';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const Runtime = window.SystemDesignRuntime;
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

  function dataModelOf(sim) {
    return sim.dataModel || { stores: sim.dataStores || [] };
  }

  function storeForNode(sim, nodeId) {
    return (dataModelOf(sim).stores || []).find(store => store.nodeId === nodeId);
  }

  function operationSpec(sim, state, kind, regionId, payload = {}) {
    const seq = (state.runtime?.counts?.[kind] || 0) + 1;
    const fromScenario = sim.operationFactory?.(kind, seq, {
      month: state.month,
      regionId,
      choices: makeChoiceCtx(sim, state),
      payload
    });
    return fromScenario || {
      label: `${kind === 'upload' ? '寫入' : kind === 'watch' ? '讀取' : '請求'} #${seq}`,
      payload: { operation: kind, sequence: seq }
    };
  }

  function applyRuntimeWrites(state, writes, request) {
    (writes || []).forEach(write => Runtime?.write(
      state.runtime,
      write.storeId,
      write.tableId,
      typeof write.row === 'function' ? write.row(request) : write.row,
      { key: write.key, requestId: request?.id }
    ));
  }

  // ---------- Scenario vocabulary ----------
  // This engine now drives more than one product. Everything below used to say「觀眾」「影片」
  // 「畫質」「串流伺服器」inline, which reads as nonsense the moment the scenario is a map app
  // instead of a video platform. A scenario can override any of these words via `sim.lexicon`;
  // the defaults are exactly the strings the video chapter shipped with, so that chapter's
  // output is unchanged.
  const LEXICON_DEFAULTS = {
    viewer: '觀眾',            // the population being served
    testViewer: '測試觀眾',     // the draggable avatar
    item: '影片',              // the thing being requested
    segment: '影片',           // the unit that arrives one at a time
    quality: '畫質',           // what degrades when bandwidth drops
    edgeNode: 'CDN 邊緣節點',   // where a cache hit is answered
    originNode: '串流伺服器',   // where a miss has to go
    regionParts: 'CDN、Load Balancer、串流伺服器與 API 伺服器',
    watchVerb: '觀看',
    concurrentNoun: '同一部影片',
    wanderIdle: '🚶 讓觀眾隨機走動',
    wanderActive: '🚶 隨機走動中（點一下停止）',
    zoneName: '訊號不良區',
    edgeShort: 'CDN',        // short name for the edge tier in running prose
    client: '播放器',         // what the user-facing client is called
    itemMeasure: '部',       // measure word that goes with `item`
    overloadSymptom: '緩衝變久',
    qoeMetric: '播放品質'    // the name of the second score meter in running prose
  };
  function lex(sim, key) {
    return sim?.lexicon?.[key] ?? LEXICON_DEFAULTS[key];
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
      // Optional 100-user traffic generator. One timer launches one randomized operation at a
      // time; requests already in flight keep finishing if the player stops the generator.
      randomTraffic: { active: false, launched: 0, total: 100, counts: { watch: 0, search: 0, upload: 0 } },
      randomTrafficTimer: null,
      // Machines the player added by hand with the ＋ buttons on the topology, on top of
      // whatever baseline the chosen redundancy strategy already gives that node. Keyed by node
      // id, so each region's pool scales independently (adding Taiwan streaming servers must not
      // silently also add them in the US).
      extraInstances: {},
      // Every visible machine gets a stable position. The old renderer derived all circles from
      // one centre point on every repaint, which meant adding #3 moved #1/#2 and made it
      // impossible to lay a pool out by hand.
      instancePositions: {},
      // Structural wires can be hidden when a dense architecture becomes hard to read. Keep
      // the preference in state so month changes and topology rebuilds do not turn them back on.
      showConnections: true,
      // Machines the player has pulled the plug on, keyed "<nodeId>::<index>".
      instanceDown: {},
      // The editable copy of the architecture (see topoOf) plus the audience weight per region.
      topo: (sim.mutableTopology || sim.draggableTopology) ? cloneTopology(sim.topology) : null,
      regionWeight: { ...(sim.capacity?.regionWeight || {}) },
      nextRegionSeq: 1, nextGroupSeq: 1,
      dragViewer: cs ? {
        x: cs.start.x, y: cs.start.y, inZone: false, wander: false,
        regionId: cs.homeRegionId || sim.topology?.regionIds?.[0] || null,
        // What is on screen right now, and what the next request will ask for. See wireDragViewer.
        qualityId: (cs.ladder || sim.abrSim?.ladder || []).slice(-1)[0]?.id,
        fetchQualityId: (cs.ladder || sim.abrSim?.ladder || []).slice(-1)[0]?.id
      } : null,
      // The bad-signal zone is a movable AND resizable object, not scenery painted at a fixed
      // spot — its live geometry lives here so it survives a full renderPlay remount, exactly
      // like the avatar's position does.
      badZone: cs?.zone ? { x: cs.zone.x, y: cs.zone.y, width: cs.zone.width, height: cs.zone.height } : null,
      dragViewerTimer: null,
      runtime: Runtime?.createRuntime(dataModelOf(sim)) || {
        requestSeq: 0, counts: {}, requests: [], nodeActivity: {}, routeCursor: {}, stores: {}
      },
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
    return Math.min(MAX_INSTANCES, baseInstances(sim, state, node) + Math.max(0, state.extraInstances?.[node.id] || 0));
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
    // Which slice of the modelled population this tier actually carries. `offloadKind` names the
    // one tier an edge cache absorbs traffic from, so its demand shrinks as the hit rate rises;
    // every other tier takes a ratio from `loadRatio`, which may be a plain number or a function
    // of the player's current choices (a scenario where batching divides the write rate needs
    // that). The video chapter's original 'stream'/'api' pair stays the default, so its numbers
    // are unchanged.
    const offloadKind = sim.capacity.offloadKind || 'stream';
    const ratios = sim.capacity.loadRatio || { api: sim.capacity.apiRatio ?? 0.2 };
    if (node.loadKind === offloadKind) demand *= (1 - offloadRatio(sim, state));
    else if (node.loadKind in ratios) {
      const r = ratios[node.loadKind];
      demand *= (typeof r === 'function' ? r(makeChoiceCtx(sim, state)) : r);
    }
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

  function edgeEndpointOptions(sim, state, node) {
    if (!node?.pool) return [{ x: node.x, y: node.y, idx: null }];
    return clusterPositions(sim, state, node).map((point, idx) => ({ ...point, idx }));
  }

  // A pool is not one dot. Every visible machine gets its own structural wire, so adding #2
  // visibly adds a connection and dragging #2 moves that connection with it. A pool-to-pool
  // edge draws all valid pairs because either load balancer may choose any healthy instance.
  function expandedEdges(sim, state) {
    const topo = topoOf(sim, state);
    return topo.edges.flatMap(e => {
      const a = findNode(topo, e.from), b = findNode(topo, e.to);
      if (!a || !b) return [];
      return edgeEndpointOptions(sim, state, a).flatMap(from =>
        edgeEndpointOptions(sim, state, b).map(to => ({ edge: e, from, to }))
      );
    });
  }

  function edgesSvg(sim, state) {
    return expandedEdges(sim, state).map(({ edge: e, from, to }) => {
      // An edge is only "inactive" when it explicitly requires a capability that's off (e.g. a
      // direct-upload bypass that only exists once you've turned it on). It must NOT go dashed
      // just because the node at one end is a resilience/cost capability that's currently off —
      // that node is still structurally there (e.g. CDN with popularity-tiering off is still a
      // CDN, just not cost-optimized); dimming its wires falsely implies the path is broken.
      // The node's own ✓/✕ colour is what shows whether that capability is currently on.
      const isActive = !e.requiresComponent || currentOptionId(sim, e.requiresComponent, state) !== 'off';
      const cls = ['sim-topo-edge', e.kind === 'stub' ? 'stub' : '', isActive ? 'active' : 'inactive'].filter(Boolean).join(' ');
      const fromKey = from.idx == null ? e.from : instanceKey(e.from, from.idx);
      const toKey = to.idx == null ? e.to : instanceKey(e.to, to.idx);
      return `<line class="${cls}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" data-edge="${esc(e.from)}-${esc(e.to)}" data-edge-route="${esc(fromKey)}--${esc(toKey)}"/>`;
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
    state.instancePositions = state.instancePositions || {};
    const saved = state.instancePositions[node.id] ??= {};
    // Keep #1 exactly where it started. New machines occupy spacious, deterministic slots and
    // never push their older siblings aside; after creation every one of them can be dragged.
    const slots = [
      [0, 0], [62, 0], [-62, 0], [0, 62], [0, -62],
      [62, 62], [-62, 62], [62, -62]
    ];
    return Array.from({ length: count }, (_, i) => {
      if (!saved[i]) {
        const [ox, oy] = slots[i] || [i * 34, 0];
        saved[i] = { x: node.x + ox, y: node.y + oy };
      }
      return saved[i];
    });
  }

  // The ＋/－ pair that lets the player add or remove machines on a pool node directly on the
  // diagram. They live inside the node's own <g>, so they're rebuilt whenever the node repaints;
  // their clicks are handled by one delegated capture-phase listener on the svg (see
  // wireTopologyControls) rather than per-element listeners that would die on every repaint.
  function poolLayout(positions, radius) {
    const xs = positions.map(p => p.x), ys = positions.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return {
      x: (minX + maxX) / 2,
      top: minY - radius,
      bottom: maxY + radius
    };
  }

  function instanceStepperSvg(sim, state, n, count, layout) {
    // Put the controls on their own row below the whole machine group. They follow the group's
    // live bounding box, rather than remaining at the obsolete logical anchor after a machine
    // has been dragged away.
    const y = layout.bottom + 37;
    const dx = 14;
    const atMax = count >= MAX_INSTANCES;
    const atMin = (state.extraInstances?.[n.id] || 0) <= 0;
    const btn = (offset, delta, glyph, disabled, label) => `<g class="sim-node-stepper${disabled ? ' disabled' : ''}" data-instance-delta="${delta}" data-instance-node="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(label)}">
          <circle cx="${layout.x + offset}" cy="${y}" r="9"/>
          <text x="${layout.x + offset}" y="${y + 4}">${glyph}</text>
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
    const layout = n.pool ? poolLayout(positions, r) : { x: n.x, top: n.y - r, bottom: n.y + r };
    const uiX = layout.x;
    const labelY = n.pool ? layout.bottom + 17 : n.y + labelOffset + 14;
    const costY = n.pool ? layout.top - 10 : n.y - labelOffset - 6;
    const opt = isComponent ? currentOption(sim, n.componentId, state) : null;
    const aliveCount = n.pool ? aliveInstanceIndexes(sim, state, n).length : 1;
    const countNote = n.pool ? `（${aliveCount}/${positions.length} 台運作中）` : '';
    // The strategy label is its own hit target on pool nodes: clicking a MACHINE pulls that one
    // machine's plug, so the "which strategy" decision needs somewhere else to live.
    //
    // The price shown here has to be the price of what is ACTUALLY on screen. Machines the
    // player added by hand cost `extraInstanceCost` each every month (weeklyCostPenalty already
    // charges for them), so a node showing three machines while its label says "0/月" was simply
    // lying about the bill.
    const extraHere = n.pool ? Math.max(0, state.extraInstances?.[n.id] || 0) : 0;
    const nodeCost = (opt?.cost || 0) + extraHere * (n.extraInstanceCost ?? 1);
    const extraNote = extraHere ? `＋自行加開 ${extraHere} 台` : '';
    const costText = opt
      ? `${nodeCost > 0 ? '+' : ''}${nodeCost}/月 · ${opt.label}${extraNote}${countNote}`
      : '';
    // One line BELOW the node label, not two pixels under it — at +16 against the label's +14
    // the two strings printed on top of each other and rendered the users node unreadable.
    const headText = n.kind === 'user'
      ? (n.headcount ? `${numFmt(n.headcount)} 人` : `已服務 ${numFmt(state.usersServed || 0)} 人`)
      : '';
    const badge = headText ? `<text class="sim-topo-badge" x="${uiX}" y="${n.y + labelOffset + 30}">${esc(headText)}</text>` : '';
    const store = storeForNode(sim, n.id);
    const storedRows = store && Runtime ? Runtime.tableRowCount(state.runtime, store.id) : 0;
    const storeBadge = store
      ? `<text class="sim-topo-data-count" x="${uiX + 25}" y="${layout.top - 7}">🗃 ${storedRows}</text>`
      : '';
    // ✓ protected · ⚠ running but with no redundancy · ✕ not built at all · ✕(red, dead) a
    // machine whose plug you pulled. The old two-state ✓/✕ was the source of "the server is X,
    // so why is it still sending me data?" — a live server with no spare capacity is not a dead
    // server, and must not look like one.
    //
    // ⚠ means "壞一台就沒有人接手". On a POOL that has to be decided by how many machines are
    // actually up, not by which strategy was picked: three machines drawn on screen ARE
    // redundancy, however they got there, and marking them ⚠ contradicted the picture. Machines
    // the player added by hand are real machines.
    const redundant = n.pool ? aliveCount > 1 : on;
    const glyph = present ? (redundant ? '✓' : '⚠') : '✕';
    // Each machine is its own <g> so it can be clicked, killed, labelled "#2" and targeted by a
    // token independently of its siblings.
    const machines = positions.map((p, i) => {
      const down = n.pool && instanceIsDown(state, n.id, i);
      const cls = ['sim-topo-instance', n.pool ? 'machine' : '', down ? 'down' : '', interactive && n.pool ? 'killable draggable' : ''].filter(Boolean).join(' ');
      const mark = isComponent ? `<text class="sim-topo-mark" x="${p.x}" y="${p.y + 5}">${down ? '✕' : glyph}</text>` : '';
      const idx = n.pool ? `<text class="sim-topo-instance-id" x="${p.x}" y="${p.y - r - 3}">#${i + 1}</text>` : '';
      const tip = n.pool
        ? `<title>${esc(n.label)} #${i + 1}${down ? '（已當機）' : ''}${interactive ? ' — 拖曳可移動；點一下可拔掉／插回' : ''}</title>`
        : '';
      return `<g class="${cls}"${n.pool ? ` data-instance="${esc(instanceKey(n.id, i))}"${interactive ? ' role="button" tabindex="0"' : ''}` : ''}>${tip}<circle cx="${p.x}" cy="${p.y}" r="${r}"/>${mark}${idx}</g>`;
    }).join('');
    const load = nodeLoad(sim, state, n);
    const loadText = load
      ? `<text class="sim-topo-load${load.ratio > 1 ? ' over' : ''}" x="${uiX}" y="${n.pool ? layout.bottom + 54 : n.y + labelOffset + 28}">負載 ${numFmt(load.demand)} / ${numFmt(load.capacity)}（${load.capacity ? Math.round(load.ratio * 100) + '%' : '全部當機'}）</text>`
      : '';
    const absentNote = !present
      ? `<text class="sim-topo-absent" x="${uiX}" y="${n.pool ? layout.bottom + 54 : n.y + labelOffset + 28}">（未建置，流量不會經過這裡）</text>` : '';
    return `${machines}${storeBadge}
        <text class="sim-topo-label" x="${uiX}" y="${labelY}">${esc(n.label)}</text>
        ${costText ? `<text class="sim-topo-cost${interactive ? ' strategy' : ''}" x="${uiX}" y="${costY}"${interactive ? ' data-strategy-hit="1" role="button" tabindex="0"' : ''}>${esc(costText)}</text>` : ''}
        ${loadText}${absentNote}${badge}
        ${interactive && n.pool ? instanceStepperSvg(sim, state, n, positions.length, layout) : ''}`;
  }

  function nodeClassName(sim, state, n, interactive) {
    const isComponent = n.kind === 'component';
    // Same rule as the glyph: on a pool, "protected" means more than one machine is actually up,
    // no matter whether that came from the strategy or from the player pressing ＋.
    const on = n.pool
      ? nodeIsPresent(sim, state, n) && aliveInstanceIndexes(sim, state, n).length > 1
      : nodeIsOn(sim, state, n);
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
      const store = storeForNode(sim, n.id);
      const canActivate = interactive && (isComponent || store);
      const ariaLabel = store
        ? `${n.label}，查看已儲存的資料與收到的 Request`
        : `${n.label}，調整架構策略`;
      const attrs = [
        canActivate ? `role="button" tabindex="0" aria-label="${esc(ariaLabel)}"` : '',
        isComponent && interactive ? `data-toggle="${esc(n.componentId)}"` : '',
        store && interactive ? `data-store-id="${esc(store.id)}"` : ''
      ].filter(Boolean).join(' ');
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
    const group = root.querySelector('.sim-topo-edges');
    if (group) group.innerHTML = edgesSvg(sim, state);
  }

  function repaintNodes(root, sim, state) {
    (topoOf(sim, state)?.nodes || []).forEach(n => {
      const el = root.querySelector(`[data-node="${n.id}"]`);
      if (!el) return;
      const interactive = el.dataset.interactive === '1';
      // Animation-only markers are applied imperatively elsewhere; preserve them across repaint.
      const transient = ['failing', 'stressed', 'success', 'receiving', 'inspected'].filter(c => el.classList.contains(c));
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
        <span>${esc(lex(sim, 'viewer'))}占比 ${Math.round((w[r] / total) * 100)}%</span>
        <button class="sim-mini-btn" type="button" data-region-remove="${esc(r)}">移除</button>
      </li>`).join('');
    return `<details class="sim-arch-editor" open>
      <summary>🏗️ 架構編輯：自己新增地區與使用者群組</summary>
      <p class="sim-arch-note">地區不是寫死的。新增一個地區會照同一份藍圖生出它自己的${esc(lex(sim, 'regionParts'))}，並把總${esc(lex(sim, 'viewer'))}人數重新分配到所有地區——這也是真實世界加一個 edge region 的效果。</p>
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

  function payloadLegendHtml() {
    return `<div class="sim-payload-legend" aria-label="傳輸球顏色圖例">
      <span><i class="payload-video"></i>影片串流</span>
      <span><i class="payload-file"></i>檔案／區塊</span>
      <span><i class="payload-metadata"></i>Metadata 資料</span>
      <span><i class="payload-api"></i>API 請求</span>
      <span><i class="payload-notification"></i>通知事件</span>
    </div>`;
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
    // On a phone this diagram is ~1300 units wide inside a ~360px viewport: scaled to fit, every
    // label renders at about 3px and the whole thing is unreadable. The scroll wrapper lets the
    // stylesheet give the SVG a real minimum width on small screens and pan it sideways instead,
    // which is the only way a diagram this dense stays legible on a phone.
    const connectionVisible = state.showConnections !== false;
    return `<div class="sim-topo-wrap ${interactive ? '' : 'locked'}${connectionVisible ? '' : ' connections-hidden'}">
      <div class="sim-topo-scroll">
        <svg class="sim-topo" viewBox="${esc(topo.viewBox)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="架構拓樸圖">
          ${regionBoxesSvg(topo)}
          <g class="sim-topo-edges">${edgesSvg(sim, state)}</g>
          ${nodesSvg(sim, state, interactive)}
          ${interactive && showControls ? dragViewerSvg(sim, state) : ''}
        </svg>
      </div>
      <p class="sim-topo-scroll-hint">← 左右滑動可以看完整張架構圖 →</p>
      ${interactive
        ? '<p class="sim-topo-hint"><b>點一般能力節點的圓球</b>就能直接切換成打勾／下一種策略。伺服器群組的圓球是單台機器：拖曳可移動，短按可拔掉／插回；群組策略請點上方有底線的文字。<b>點資料庫／儲存節點</b>可看 schema 與資料。伺服器群組名稱下方的 ＋／− 會真正新增／收掉一台機器。</p>'
        : '<p class="sim-topo-hint">目前是唯讀狀態——結果由你先前選的做法與當時開的機器數量決定。</p>'}
      ${showControls ? `<div class="sim-topo-controls">
        <button class="button secondary sim-add-users" type="button" data-add="100">${esc(sim.addUsersLabel || '＋100 使用者')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="watch">${esc(sim.demoLabels?.watch || '▶ 模擬一次讀取請求')}</button>
        <button class="button secondary sim-demo" type="button" data-kind="upload">${esc(sim.demoLabels?.upload || '⬆ 模擬一次寫入請求')}</button>
        ${sim.demoLabels?.search ? `<button class="button secondary sim-demo" type="button" data-kind="search">${esc(sim.demoLabels.search)}</button>` : ''}
        ${sim.concurrentViewersLabel ? `<button class="button secondary sim-demo-concurrent" type="button" data-count="10">${esc(sim.concurrentViewersLabel)}</button>` : ''}
        <button class="button secondary sim-random-traffic-btn${state.randomTraffic?.active ? ' active' : ''}" type="button" data-random-traffic aria-pressed="${!!state.randomTraffic?.active}">${state.randomTraffic?.active ? `⏹ 停止隨機模式（${state.randomTraffic.launched}/${state.randomTraffic.total}）` : '🎲 啟動 100 人隨機操作'}</button>
        ${sim.dragViewerSim ? `<button class="button secondary sim-wander-btn" type="button" data-viewer-wander aria-pressed="false">${esc(lex(sim, 'wanderIdle'))}</button>` : ''}
        <button class="button secondary sim-connections-btn" type="button" data-toggle-connections aria-pressed="${connectionVisible}">${connectionVisible ? '🙈 隱藏連線' : '🔗 顯示連線'}</button>
      </div>
      ${payloadLegendHtml()}
      ${runtimeSummaryHtml(sim, state)}
      ${sim.mutableTopology ? architectureEditorHtml(sim, state) : ''}` : ''}
      ${speedControls}
      <div class="sim-trace">
        <div class="sim-trace-head"><span>即時處理紀錄</span><button class="sim-trace-clear" type="button">清空</button></div>
        <div class="sim-trace-body"></div>
      </div>
      <div class="sim-topo-legend">${legend}</div>
    </div>`;
  }

  function runtimeSummaryHtml(sim, state) {
    const counts = state.runtime?.counts || {};
    const latest = state.runtime?.requests?.slice(0, 4) || [];
    const kindLabel = { upload: '上傳', watch: '讀取', search: '通知／搜尋', request: '自訂請求' };
    const kinds = ['upload', 'watch', 'search', ...(counts.request ? ['request'] : [])];
    return `<section class="sim-runtime-summary" data-runtime-summary>
      <div class="sim-runtime-counts">
        ${kinds.map(kind => `<span><b data-runtime-count="${kind}">${counts[kind] || 0}</b>${kindLabel[kind]}</span>`).join('')}
        <button class="sim-mini-btn" type="button" data-request-ledger>查看所有 Request</button>
      </div>
      <div class="sim-runtime-latest" data-runtime-latest>${latest.length
        ? latest.map(req => `<span class="${esc(req.status)}"><b>${esc(req.id)}</b> ${esc(req.label)} · ${esc(req.status === 'running' ? '傳送中' : req.status === 'completed' ? '完成' : '失敗')}</span>`).join('')
        : '<span>尚未送出請求。每按一次上方按鈕都會新增一筆，不會覆蓋。</span>'}</div>
    </section>`;
  }

  function refreshRuntimeSummary(root, sim, state) {
    const old = root.querySelector('[data-runtime-summary]');
    if (!old) return;
    const holder = document.createElement('div');
    holder.innerHTML = runtimeSummaryHtml(sim, state);
    old.replaceWith(holder.firstElementChild);
    root.querySelector('[data-request-ledger]')?.addEventListener('click', () => openDataInspector(root, sim, state, '__requests'));
  }

  const valueText = value => {
    if (value == null) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  function rowsTableHtml(table) {
    const rows = (table.rows || []).slice(-20).reverse();
    const schemaFields = (table.schema || []).map(field => typeof field === 'string' ? field : field.name);
    const rowFields = rows.flatMap(row => Object.keys(row || {}));
    const fields = [...new Set([...schemaFields, ...rowFields])].slice(0, 9);
    const schema = (table.schema || []).length
      ? `<details class="sim-store-schema" open><summary>Schema（${esc(table.label)}）</summary><div class="sim-schema-grid">${table.schema.map(field => {
          const item = typeof field === 'string' ? { name: field } : field;
          return `<div><code>${esc(item.name)}</code><span>${esc(item.type || 'text')}</span><small>${esc(item.note || '')}</small></div>`;
        }).join('')}</div></details>` : '';
    const body = rows.length && fields.length
      ? `<div class="sim-store-table-wrap"><table class="sim-store-table"><thead><tr>${fields.map(field => `<th>${esc(field)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${fields.map(field => `<td title="${esc(valueText(row[field]))}">${esc(valueText(row[field]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : '<p class="sim-store-empty">目前還沒有資料。送出請求後再回來看，row 會留在這裡。</p>';
    return `<section class="sim-store-table-section"><h3>${esc(table.label)} <small>${table.rows.length} rows</small></h3>${schema}${body}</section>`;
  }

  function openDataInspector(root, sim, state, storeId) {
    root.querySelector('[data-store-inspector]')?.remove();
    const runtime = state.runtime;
    const requestMode = storeId === '__requests';
    const store = requestMode ? null : runtime?.stores?.[storeId];
    if (!requestMode && !store) return;
    const nodeActivity = requestMode ? [] : (runtime.nodeActivity?.[store.nodeId] || []);
    const requests = runtime?.requests || [];
    const requestRows = requests.slice(0, 40).map(req => ({
      request_id: req.id,
      type: req.kind,
      label: req.label,
      status: req.status,
      payload: req.payload,
      route: req.hops.map(h => {
        const machine = String(h.detail || '').match(/#\d+/)?.[0];
        return `${h.nodeId}${machine ? ` ${machine}` : ''}`;
      }).join(' → '),
      hop_details: req.hops.map(h => `${h.nodeId}: ${h.detail || '抵達'}`).join(' | '),
      started_at: req.startedAt
    }));
    const activityRows = nodeActivity.slice(0, 30).map(item => ({
      time: item.at,
      request_id: item.requestId,
      operation: item.kind,
      status: item.status,
      payload: item.payload,
      detail: item.detail
    }));
    const title = requestMode ? 'Request 總覽' : store.label;
    const content = requestMode
      ? rowsTableHtml({ label: 'requests', rows: requestRows, schema: [
          { name: 'request_id', type: 'string', note: '每按一次操作就建立新的唯一 ID' },
          { name: 'type', type: 'enum', note: 'upload / watch / search' },
          { name: 'status', type: 'enum', note: 'running / completed / failed' },
          { name: 'payload', type: 'JSON', note: '這次傳送的完整資料' },
          { name: 'route', type: 'path', note: '含實際被分流到的 #1／#2…機器' }
        ] })
      : `${Object.values(store.tables).map(rowsTableHtml).join('')}
        ${rowsTableHtml({ label: '最近抵達這個節點的 requests', rows: activityRows, schema: [] })}`;
    root.insertAdjacentHTML('beforeend', `<div class="sim-store-backdrop" data-store-inspector>
      <aside class="sim-store-inspector" role="dialog" aria-modal="true" aria-label="${esc(title)} 資料檢視">
        <header><div><span>${requestMode ? 'REQUEST LEDGER' : esc(store.kind)}</span><h2>${esc(title)}</h2><p>${esc(requestMode ? '每一次操作都是獨立 request；動畫結束後記錄仍會保留。' : store.description)}</p></div><button type="button" data-inspector-close aria-label="關閉">×</button></header>
        ${content}
      </aside>
    </div>`);
    const backdrop = root.querySelector('[data-store-inspector]');
    const inspectedNode = !requestMode && store?.nodeId
      ? root.querySelector(`[data-node="${store.nodeId}"]`)
      : null;
    inspectedNode?.classList.add('inspected');
    const close = () => {
      inspectedNode?.classList.remove('inspected');
      backdrop?.remove();
    };
    backdrop?.querySelector('[data-inspector-close]')?.addEventListener('click', close);
    backdrop?.addEventListener('click', event => { if (event.target === backdrop) close(); });
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
    if (!svgEl || !waypoints.length) { onDone?.(null); return null; }
    if (waypoints.length === 1) {
      onHop?.(0);
      onDone?.(null);
      return null;
    }
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('class', `${tokenClass} ${className}`.trim());
    circle.setAttribute('cx', waypoints[0].x);
    circle.setAttribute('cy', waypoints[0].y);
    svgEl.appendChild(circle);
    // The source is a real hop too. Previously only indices 1…N fired, so the request ledger
    // silently omitted the client that originated every operation.
    onHop?.(0);
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
        // Deterministic round-robin is deliberate teaching behaviour: three consecutive
        // requests visibly land on #1, #2 and #3. Random routing could pick #1 three times and
        // make a correctly working pool look broken.
        const idx = n.id in sticky
          ? sticky[n.id]
          : (state.runtime && Runtime ? Runtime.pickRoundRobin(state.runtime, n.id, alive) : alive[0]);
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

  // ---------- Packet travel time ----------
  // Packets move at a CONSTANT speed, and a path's duration falls out of how long that path
  // physically is. Splitting a fixed total duration evenly across hops (the earlier behaviour)
  // produced exactly the wrong intuition: the short hop to a nearby CDN edge crawled while the
  // long haul across an ocean raced, because both got the same slice of time. Being close is
  // supposed to be *why* the CDN answers quickly, so distance has to drive duration, not the
  // other way round.
  const TOKEN_UNITS_PER_MS = 2.6;   // viewBox units travelled per millisecond at 1x
  const TOKEN_MIN_MS = 180;         // floor so a very short hop is still perceptible
  const TOKEN_MAX_MS = 6000;

  // Weight per segment = its actual drawn length, multiplied for a hop that crosses regions:
  // an ocean is not just far, it is also slower per unit of distance (propagation + peering).
  function distanceWeights(topo, nodeIds, points) {
    return points.slice(1).map((p, i) => {
      const a = points[i];
      const dist = Math.hypot(p.x - a.x, p.y - a.y) || 1;
      const na = findNode(topo, nodeIds[i]), nb = findNode(topo, nodeIds[i + 1]);
      const cross = na?.region && nb?.region && na.region !== nb.region;
      return dist * (cross ? (topo.crossRegionWeight || 3) : 1);
    });
  }

  function pathDurationMs(weights, speed, scale = 1) {
    const total = weights.reduce((sum, wgt) => sum + wgt, 0);
    const ms = clamp(total / TOKEN_UNITS_PER_MS, TOKEN_MIN_MS, TOKEN_MAX_MS) * scale;
    return ms / (speed || 1);
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
    // A strategy may change a pool's baseline instance count, which changes the number of
    // concrete wires just as surely as pressing the ＋ button does.
    repaintEdges(root, sim, state);
    // Only edges that explicitly require this component ever change state when it's toggled —
    // every other edge is a static structural connection (see the note in edgesSvg above).
    topo.edges.forEach(e => {
      if (e.requiresComponent !== componentId) return;
      const isActive = currentOptionId(sim, componentId, state) !== 'off';
      root.querySelectorAll(`[data-edge="${e.from}-${e.to}"]`).forEach(line => {
        line.classList.toggle('active', isActive);
        line.classList.toggle('inactive', !isActive);
      });
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
    // Weights come from where the packet actually travels (after any remapping), so a viewer
    // standing right next to their CDN edge really does get a shorter, quicker hop than one
    // standing across the map.
    const weights = distanceWeights(topo, visited, finalPoints);
    return spawnToken(svgEl, finalPoints, {
      weights,
      durationMs: pathDurationMs(weights, state.speed, opts.durationScale ?? 1),
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
          durationScale: 0.9 + Math.random() * 0.35,
          token: {
            className: `ambient payload-${sim.chapterId === 'sd-book-14' ? 'video' : 'file'}`,
            tokenClass: 'sim-token-ambient',
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

  function topologyFlows(topo, kind, ctx, regionId) {
    const raw = topo.computeFlows?.(kind, ctx, regionId);
    const flows = raw || [topo.computeFlow?.(kind, ctx, regionId) || []];
    return flows.map((flow, i) => Array.isArray(flow)
      ? { id: `branch-${i + 1}`, label: '', nodes: flow }
      : {
          id: flow.id || `branch-${i + 1}`,
          label: flow.label || '',
          nodes: flow.nodes || [],
          payloadType: flow.payloadType,
          packetCount: flow.packetCount,
          packetLabel: flow.packetLabel,
          chunkBytes: flow.chunkBytes
        }
    ).filter(flow => flow.nodes.length > 1);
  }

  function payloadTypeFor(sim, kind, flow) {
    if (flow?.payloadType) return flow.payloadType;
    if (flow?.id === 'metadata') return 'metadata';
    if (kind === 'search') return sim.chapterId === 'sd-book-15' ? 'notification' : 'api';
    if (kind === 'upload' || kind === 'watch') return sim.chapterId === 'sd-book-14' ? 'video' : 'file';
    return 'api';
  }

  function edgeRouteKey(nodeId, machine) {
    return machine ? instanceKey(nodeId, machine.idx) : nodeId;
  }

  function flashTopologyHop(root, fromId, toId, fromMachine, toMachine) {
    const node = root.querySelector(`[data-node="${toId}"]`);
    node?.classList.add('receiving');
    setTimeout(() => node?.classList.remove('receiving'), 760);
    if (!fromId) return;
    const direct = `${edgeRouteKey(fromId, fromMachine)}--${edgeRouteKey(toId, toMachine)}`;
    const reverse = `${edgeRouteKey(toId, toMachine)}--${edgeRouteKey(fromId, fromMachine)}`;
    const edge = root.querySelector(`[data-edge-route="${direct}"]`)
      || root.querySelector(`[data-edge-route="${reverse}"]`)
      || root.querySelector(`[data-edge="${fromId}-${toId}"]`)
      || root.querySelector(`[data-edge="${toId}-${fromId}"]`);
    edge?.classList.add('transmitting');
    setTimeout(() => edge?.classList.remove('transmitting'), 760);
  }

  function runTopologyDemo(root, sim, state, kind) {
    const svgEl = root.querySelector('svg.sim-topo');
    const topo = topoOf(sim, state);
    if (!svgEl || !topo) return;
    const ctx = makeChoiceCtx(sim, state);
    const regionIds = topo.regionIds;
    const regionId = regionIds?.length ? regionIds[Math.floor(Math.random() * regionIds.length)] : undefined;
    const regionLabel = regionId && topo.regionLabel?.[regionId];
    const flows = topologyFlows(topo, kind, ctx, regionId);
    if (!flows.length || !Runtime || !state.runtime) return;
    const spec = operationSpec(sim, state, kind, regionId);
    const request = Runtime.beginRequest(state.runtime, {
      kind,
      label: spec.label,
      payload: spec.payload,
      region: regionLabel || regionId || ''
    });
    if (!request) return;
    applyRuntimeWrites(state, spec.writesOnStart, request);
    refreshRuntimeSummary(root, sim, state);
    repaintNodes(root, sim, state);
    const payloadText = Object.entries(request.payload || {}).slice(0, 3).map(([key, value]) => `${key}=${valueText(value)}`).join(' · ');
    traceLine(root, `— ${request.id}：${spec.label}${regionLabel ? `（${regionLabel}）` : ''}${payloadText ? `｜${payloadText}` : ''} —`, 'head');

    let remaining = flows.length;
    let failed = false;
    const settled = new Set();
    const appliedHopWrites = new Set();
    const settleBranch = (branchId, ok) => {
      if (settled.has(branchId)) return;
      settled.add(branchId);
      remaining -= 1;
      if (!ok) failed = true;
      if (remaining > 0) return;
      if (failed) {
        Runtime.finishRequest(state.runtime, request, 'failed', '路徑中斷');
        applyRuntimeWrites(state, spec.writesOnFail, request);
        traceLine(root, `— ${request.id} 失敗；已完成的其他 request 與資料不會被清掉 —`, 'bad');
      } else {
        applyRuntimeWrites(state, spec.writesOnComplete, request);
        Runtime.finishRequest(state.runtime, request, 'completed', '所有分支完成');
        traceLine(root, `— ${request.id} 完成；這是第 ${state.runtime.counts[kind]} 次${kind === 'upload' ? '上傳' : '操作'} —`, 'done');
      }
      refreshRuntimeSummary(root, sim, state);
      repaintNodes(root, sim, state);
    };

    flows.forEach((flow, flowIndex) => {
      if (flow.label) traceLine(root, `${request.id} 分支 ${flowIndex + 1}：${flow.label}`, '');
      const payloadType = payloadTypeFor(sim, kind, flow);
      const visualPacketLimit = Math.max(1, Math.min(12, Number(flow.packetCount) || 1));
      const logicalPacketCount = visualPacketLimit > 1
        ? Math.max(1, Number(spec.payload?.block_count)
          || (flow.chunkBytes && spec.payload?.size_bytes ? Math.ceil(Number(spec.payload.size_bytes) / Number(flow.chunkBytes)) : 0)
          || visualPacketLimit)
        : 1;
      const packetCount = Math.min(visualPacketLimit, logicalPacketCount);
      if (packetCount > 1) {
        const visualNote = logicalPacketCount > packetCount ? `；畫面抽樣顯示其中 ${packetCount} 個` : '';
        traceLine(root, `${request.id} 客戶端先把${flow.packetLabel || '內容'}切成 ${logicalPacketCount} 個可獨立重試的小封包${visualNote}，並依序送出。`, 'ok');
      }
      let packetsRemaining = packetCount;
      let packetFailed = false;
      const settlePacket = ok => {
        packetsRemaining -= 1;
        if (!ok) packetFailed = true;
        if (packetsRemaining === 0) settleBranch(flow.id, !packetFailed);
      };
      for (let packetIndex = 0; packetIndex < packetCount; packetIndex++) {
        setTimeout(() => {
          let previous = '';
          let previousMachine = null;
          let packetSettled = false;
          const settleThisPacket = ok => {
            if (packetSettled) return;
            packetSettled = true;
            settlePacket(ok);
          };
          const verbose = packetIndex === 0;
          const handle = spawnRequest(root, sim, state, svgEl, flow.nodes, {
            trace: verbose,
            token: {
              className: `${kind} branch-${flowIndex + 1} payload-${payloadType} packet-${packetIndex + 1}`,
              tokenClass: 'sim-token-demo',
              radius: packetCount > 1 ? 4.5 : (flows.length > 1 ? 6 + flowIndex : 7),
              onHop: (idx, machine, nodeId) => {
                const n = findNode(topoOf(sim, state), nodeId);
                const which = machine ? ` #${machine.idx + 1}` : '';
                if (verbose) Runtime.visitNode(state.runtime, request, nodeId, `${flow.label || kind}${which}`);
                flashTopologyHop(root, previous, nodeId, previousMachine, machine);
                previous = nodeId;
                previousMachine = machine;
                if (!verbose) {
                  if (machine) traceLine(root, `${request.id} ${logicalPacketCount > packetCount ? '視覺抽樣 · ' : ''}${flow.packetLabel || '內容'}封包 ${packetIndex + 1}/${packetCount} →「${n?.label || nodeId}」 #${machine.idx + 1}`);
                  return;
                }
                (spec.writesOnHop || []).forEach((write, writeIndex) => {
                  if (write.nodeId !== nodeId || appliedHopWrites.has(writeIndex)) return;
                  appliedHopWrites.add(writeIndex);
                  applyRuntimeWrites(state, [write], request);
                  repaintNodes(root, sim, state);
                });
                traceLine(root, `${request.id} 抵達「${n?.label || nodeId}」${which}${n?.arriveLabel ? '：' + n.arriveLabel : ''}`);
              },
              onDone: circle => {
                setTimeout(() => circle?.remove(), 320);
                settleThisPacket(true);
              }
            },
            onLost: () => settleThisPacket(false),
            onBlocked: () => settleThisPacket(false)
          });
          if (!handle) settleThisPacket(false);
        }, packetIndex * Math.max(70, 170 / (state.speed || 1)));
      }
    });
  }

  function randomTrafficButtonText(state) {
    const rt = state.randomTraffic;
    return rt?.active
      ? `⏹ 停止隨機模式（${rt.launched}/${rt.total}）`
      : '🎲 啟動 100 人隨機操作';
  }

  function paintRandomTrafficButton(root, state) {
    const btn = root.querySelector('[data-random-traffic]');
    if (!btn) return;
    const active = !!state.randomTraffic?.active;
    btn.textContent = randomTrafficButtonText(state);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  function stopRandomTraffic(root, state, announce = true) {
    if (state.randomTrafficTimer) clearTimeout(state.randomTrafficTimer);
    state.randomTrafficTimer = null;
    const rt = state.randomTraffic;
    if (!rt?.active) return;
    rt.active = false;
    paintRandomTrafficButton(root, state);
    if (announce) {
      traceLine(root, `⏹ 已停止隨機模式：共送出 ${rt.launched} 個操作（觀看／下載 ${rt.counts.watch}、搜尋／通知 ${rt.counts.search}、上傳 ${rt.counts.upload}）。已在傳輸中的封包仍會完成。`);
    }
  }

  function wireRandomTraffic(root, sim, state) {
    const btn = root.querySelector('[data-random-traffic]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (state.randomTraffic?.active) {
        stopRandomTraffic(root, state);
        return;
      }
      if (state.randomTrafficTimer) clearTimeout(state.randomTrafficTimer);
      state.randomTraffic = { active: true, launched: 0, total: 100, counts: { watch: 0, search: 0, upload: 0 } };
      paintRandomTrafficButton(root, state);
      traceLine(root, '🎲 100 人隨機操作模式啟動：每位虛擬使用者會隨機觀看／下載、搜尋／接收通知或上傳；每個操作都走真實節點、伺服器分流與資料寫入。', 'head');

      const launchNext = () => {
        const rt = state.randomTraffic;
        if (!rt?.active) return;
        if (rt.launched >= rt.total) {
          rt.active = false;
          state.randomTrafficTimer = null;
          paintRandomTrafficButton(root, state);
          traceLine(root, `✅ 100 人隨機模式完成：觀看／下載 ${rt.counts.watch}、搜尋／通知 ${rt.counts.search}、上傳 ${rt.counts.upload}。所有 Request 與寫入資料都保留可查。`, 'done');
          return;
        }
        // Read traffic is normally the majority; upload remains frequent enough that the player
        // can see packetization and persistent writes without turning all 100 operations into a
        // wall of multi-packet animations.
        const roll = Math.random();
        const kind = roll < 0.58 ? 'watch' : roll < 0.82 ? 'search' : 'upload';
        rt.launched += 1;
        rt.counts[kind] += 1;
        runTopologyDemo(root, sim, state, kind);
        paintRandomTrafficButton(root, state);
        const delay = Math.max(90, (220 + Math.random() * 260) / (state.speed || 1));
        state.randomTrafficTimer = setTimeout(launchNext, delay);
      };
      launchNext();
    });
  }

  function wireTopologyControls(root, sim, state, onCycle, onInstanceDelta, onInstanceKill, onStructureChange, onLoadChange, onInspectStore) {
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
        if (evt.type === 'click' && state._suppressInstanceClick === g.dataset.instance) {
          state._suppressInstanceClick = null;
          return;
        }
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
      const activate = event => {
        if (state._suppressNodeClick === g.dataset.node) {
          state._suppressNodeClick = null;
          return;
        }
        const strategyHit = event?.target?.closest?.('[data-strategy-hit]');
        const circleHit = event?.target?.closest?.('circle');
        if (g.dataset.storeId && !strategyHit) {
          onInspectStore?.(g.dataset.storeId);
          return;
        }
        // A normal capability circle is the primary switch. Pool circles are intercepted above
        // because they represent concrete machines (kill/recover), while data-node circles keep
        // opening the inspector. Empty space and labels do not accidentally change strategy.
        if (event?.type === 'click' && !strategyHit && !circleHit) return;
        onCycle(g.dataset.toggle);
      };
      g.addEventListener('click', activate);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(ev); } });
    });
    root.querySelectorAll('[data-store-id]:not([data-toggle])').forEach(g => {
      g.addEventListener('click', event => {
        if (state._suppressNodeClick === g.dataset.node) { state._suppressNodeClick = null; return; }
        event.stopPropagation();
        onInspectStore?.(g.dataset.storeId);
      });
      g.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onInspectStore?.(g.dataset.storeId); }
      });
    });
    root.querySelector('[data-request-ledger]')?.addEventListener('click', () => onInspectStore?.('__requests'));
    root.querySelector('[data-toggle-connections]')?.addEventListener('click', event => {
      state.showConnections = state.showConnections === false;
      const visible = state.showConnections !== false;
      root.querySelector('.sim-topo-wrap')?.classList.toggle('connections-hidden', !visible);
      event.currentTarget.setAttribute('aria-pressed', String(visible));
      event.currentTarget.textContent = visible ? '🙈 隱藏連線' : '🔗 顯示連線';
      traceLine(root, visible ? '🔗 已顯示架構連線。' : '🙈 已隱藏架構連線；節點與傳輸球仍會照常運作。');
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
        traceLine(root, `🏗️ 新增地區「${esc(res.name)}」：已照藍圖生出它自己的${esc(lex(sim, 'regionParts'))}，總${esc(lex(sim, 'viewer'))}人數重新分配到所有地區。`, 'ok');
        onStructureChange();
      });
      root.querySelectorAll('[data-region-remove]').forEach(b => {
        b.addEventListener('click', () => {
          const res = removeRegion(sim, state, b.dataset.regionRemove);
          if (res.error) { traceLine(root, `⚠️ ${res.error}`, 'bad'); return; }
          traceLine(root, `🏗️ 移除地區「${esc(res.name)}」，它的${esc(lex(sim, 'viewer'))}被重新分配到其他地區。`, '');
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
    // --- Every concrete machine can be positioned independently. A short press still means
    // kill/recover; crossing the movement threshold turns the same gesture into a drag. ---
    {
      let dragInstance = null;
      let moved = false;
      let startClient = null;
      let offset = { x: 0, y: 0 };
      svgEl.addEventListener('pointerdown', evt => {
        const machine = evt.target.closest?.('[data-instance]');
        if (!machine || evt.target.closest?.('[data-instance-delta]')) return;
        const [nodeId, idxText] = machine.dataset.instance.split('::');
        const idx = Number(idxText);
        const node = findNode(topoOf(sim, state), nodeId);
        if (!node?.pool) return;
        const point = svgCoordsFromEvent(svgEl, evt);
        const current = clusterPositions(sim, state, node)[idx];
        dragInstance = { nodeId, idx, key: machine.dataset.instance };
        startClient = { x: evt.clientX, y: evt.clientY };
        offset = { x: point.x - current.x, y: point.y - current.y };
        moved = false;
        machine.classList.add('dragging');
        svgEl.setPointerCapture?.(evt.pointerId);
        evt.preventDefault();
      });
      svgEl.addEventListener('pointermove', evt => {
        if (!dragInstance) return;
        if (!moved && Math.hypot(evt.clientX - startClient.x, evt.clientY - startClient.y) < 5) return;
        moved = true;
        const point = svgCoordsFromEvent(svgEl, evt);
        const [vx, vy, vw, vh] = String(topoOf(sim, state).viewBox).split(/\s+/).map(Number);
        const pos = state.instancePositions[dragInstance.nodeId][dragInstance.idx];
        pos.x = clamp(point.x - offset.x, vx + 18, vx + vw - 18);
        pos.y = clamp(point.y - offset.y, vy + 18, vy + vh - 18);
        repaintNodes(root, sim, state);
        repaintEdges(root, sim, state);
      });
      const finishInstanceDrag = () => {
        if (!dragInstance) return;
        if (moved) {
          state._suppressInstanceClick = dragInstance.key;
          const node = findNode(topoOf(sim, state), dragInstance.nodeId);
          const pos = state.instancePositions[dragInstance.nodeId][dragInstance.idx];
          traceLine(root, `📌 已把「${node?.label || dragInstance.nodeId}」#${dragInstance.idx + 1} 移到 (${Math.round(pos.x)}, ${Math.round(pos.y)})；之後的請求會真的跑到這個位置。`, 'ok');
        }
        dragInstance = null;
        moved = false;
      };
      svgEl.addEventListener('pointerup', finishInstanceDrag);
      svgEl.addEventListener('pointercancel', finishInstanceDrag);
      svgEl.addEventListener('pointerleave', evt => { if (evt.buttons === 0) finishInstanceDrag(); });
    }

    // --- Draggable logical nodes. Ch14 user groups retain their region hand-off behaviour;
    // Ch14/15 can additionally opt the whole topology into free layout with draggableTopology. ---
    {
      let dragNode = null, dx = 0, dy = 0, moved = false, startClient = null;
      svgEl.addEventListener('pointerdown', evt => {
        if (evt.target.closest?.('[data-instance],[data-instance-delta],[data-strategy-hit]')) return;
        const g = evt.target.closest?.('[data-node]');
        if (!g) return;
        const n = findNode(topoOf(sim, state), g.dataset.node);
        if (!n || (!n.movable && !sim.draggableTopology)) return;
        const p = svgCoordsFromEvent(svgEl, evt);
        dragNode = n; dx = p.x - n.x; dy = p.y - n.y;
        moved = false;
        startClient = { x: evt.clientX, y: evt.clientY };
        g.classList.add('dragging');
        svgEl.setPointerCapture?.(evt.pointerId);
        evt.preventDefault();
      });
      svgEl.addEventListener('pointermove', evt => {
        if (!dragNode) return;
        if (!moved && Math.hypot(evt.clientX - startClient.x, evt.clientY - startClient.y) < 5) return;
        moved = true;
        const p = svgCoordsFromEvent(svgEl, evt);
        const before = { x: dragNode.x, y: dragNode.y };
        const [vx, vy, vw, vh] = String(topoOf(sim, state).viewBox).split(/\s+/).map(Number);
        dragNode.x = clamp(p.x - dx, vx + 30, vx + vw - 30);
        dragNode.y = clamp(p.y - dy, vy + 30, vy + vh - 30);
        // Moving a logical pool label moves its machines as a group; individual machine drags
        // remain independent afterwards.
        if (dragNode.pool) {
          const mx = dragNode.x - before.x, my = dragNode.y - before.y;
          Object.values(state.instancePositions?.[dragNode.id] || {}).forEach(pos => { pos.x += mx; pos.y += my; });
        }
        repaintNodes(root, sim, state);
        repaintEdges(root, sim, state);
      });
      const dropNode = () => {
        if (!dragNode) return;
        const topo = topoOf(sim, state);
        const hit = dragNode.movable ? regionIdAtPoint(topo, dragNode.x, dragNode.y) : null;
        if (hit && hit !== dragNode.regionKey) {
          dragNode.regionKey = hit;
          dragNode.region = topo.regionLabel[hit] || dragNode.region;
          const edge = topo.edges.find(e => e.from === dragNode.id);
          if (edge) edge.to = `loadBalancer_${hit}`;
          traceLine(root, `🏗️「${dragNode.label}」搬到「${esc(topo.regionLabel[hit] || hit)}」，改由這一區的機器承載。`, 'head');
        }
        if (moved) state._suppressNodeClick = dragNode.id;
        svgEl.querySelector(`[data-node="${dragNode.id}"]`)?.classList.remove('dragging');
        dragNode = null;
        moved = false;
        repaintNodes(root, sim, state);
        repaintEdges(root, sim, state);
        onLoadChange?.();
      };
      svgEl.addEventListener('pointerup', dropNode);
      svgEl.addEventListener('pointercancel', dropNode);
      svgEl.addEventListener('pointerleave', evt => { if (evt.buttons === 0) dropNode(); });
    }
    root.querySelectorAll('.sim-demo').forEach(btn => {
      btn.onclick = () => runTopologyDemo(root, sim, state, btn.dataset.kind);
    });
    wireRandomTraffic(root, sim, state);
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
        traceLine(root, `— 模擬 ${count} 人同時${esc(lex(sim, 'watchVerb'))}${esc(lex(sim, 'concurrentNoun'))}${regionLabel ? `（${regionLabel}地區）` : ''}${machineNote ? `，全部被導到同一組機器：${machineNote}` : ''} —`, 'head');
        const weights = distanceWeights(topo, route.visited, route.points);
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            spawnToken(svgEl, route.points, {
              className: `concurrent payload-${sim.chapterId === 'sd-book-14' ? 'video' : 'file'}`, tokenClass: 'sim-token-ambient',
              durationMs: pathDurationMs(weights, state.speed, 0.95 + Math.random() * 0.2),
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
        // The test viewer's segment cadence is derived from the speed, so it has to be re-paced
        // rather than left running at the rate it was started with.
        state.repaceDragViewer?.();
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
    const weights = distanceWeights(topo, travelIds, waypoints);
    traceLine(root, `— 事件發生：${event.title} —`, 'head');
    spawnToken(svgEl, waypoints, {
      className: outcome.ok ? 'ok' : 'bad',
      tokenClass: 'sim-token-event',
      durationMs: pathDurationMs(weights, state.speed),
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

  // ---------- Upload visualisation lab ----------
  // The whole point of this panel is to answer one question honestly and visually: when a
  // server dies while a large file is uploading, what exactly survives? It models the three
  // things the chapter says happen in parallel —
  //   1. the BYTES:    file → blocks → 壓縮 → 加密 → 上傳 → 已確實寫入雲端儲存
  //   2. the METADATA: 一開始就寫入並標成 pending，只有雲端儲存的回調才能翻成 uploaded
  //   3. the PEOPLE:   另一台裝置透過通知服務看到的狀態
  // — and lets the player kill any of the three servers mid-flight to see which blocks are
  // durable, which are lost, and why a half-uploaded file never becomes downloadable.

  const UL_STAGES = ['split', 'compressed', 'encrypted', 'inflight'];
  const ulBytes = n => (n >= 1024 * 1024 * 1024
    ? `${(n / 1024 / 1024 / 1024).toFixed(n >= 10 * 1024 * 1024 * 1024 ? 0 : 1)} GB`
    : n >= 1024 * 1024 ? `${Math.round(n / 1024 / 1024)} MB` : `${Math.round(n / 1024)} KB`);

  function renderUploadLab(sim) {
    const ul = sim.uploadLab;
    if (!ul) return '';
    const files = ul.files || [];
    return `<section class="sim-uploadlab" data-upload-lab>
      <h2>📤 ${esc(ul.label || '上傳可視化實驗室')}</h2>
      <p class="sim-uploadlab-desc">${esc(ul.desc || '完整演一次上傳：檔案被切成區塊、逐塊壓縮加密送進雲端儲存，同時另一條路先把 metadata 寫成 pending。你可以在任何時候把某一台伺服器打掛，看看已經寫進去的區塊、正在傳的區塊與檔案狀態各自會怎樣。')}</p>

      <div class="sim-ul-filerow">
        <label>選一個要上傳的檔案</label>
        <select class="sim-ul-file" aria-label="選擇檔案">
          ${files.map((f, i) => `<option value="${esc(f.id)}"${i === 0 ? ' selected' : ''}>${esc(f.name)}（${ulBytes(f.bytes)}）</option>`).join('')}
        </select>
        <button class="button secondary sim-ul-start" type="button">▶ 開始上傳</button>
        <button class="button secondary sim-ul-edit" type="button" disabled>✏️ 改幾個區塊後再傳一次</button>
        <button class="button secondary sim-ul-reset" type="button">↺ 重來</button>
      </div>

      <div class="sim-ul-pipeline">
        <div class="sim-ul-lane" data-ul-lane="client"><b>客戶端 #1</b><span class="sim-ul-lane-state" data-ul-state="client">待命</span></div>
        <span class="sim-ul-arrow">→</span>
        <div class="sim-ul-lane" data-ul-lane="blockServer"><b>區塊伺服器</b><span class="sim-ul-lane-state" data-ul-state="blockServer">待命</span><button class="sim-ul-kill" type="button" data-ul-kill="blockServer">💥 打掛</button></div>
        <span class="sim-ul-arrow">→</span>
        <div class="sim-ul-lane" data-ul-lane="storage"><b>雲端儲存系統</b><span class="sim-ul-lane-state" data-ul-state="storage">待命</span><button class="sim-ul-kill" type="button" data-ul-kill="storage">💥 打掛</button></div>
        <span class="sim-ul-arrow">→</span>
        <div class="sim-ul-lane" data-ul-lane="api"><b>API 伺服器</b><span class="sim-ul-lane-state" data-ul-state="api">待命</span><button class="sim-ul-kill" type="button" data-ul-kill="api">💥 打掛</button></div>
      </div>

      <div class="sim-ul-grid" data-ul-grid role="img" aria-label="區塊上傳狀態"></div>
      <p class="sim-ul-gridnote" data-ul-gridnote></p>

      <div class="sim-ul-status">
        <div class="sim-ul-card"><small>metadata 檔案狀態</small><strong data-ul-meta>尚未建立</strong></div>
        <div class="sim-ul-card"><small>已確實寫入雲端儲存</small><strong data-ul-durable>0</strong></div>
        <div class="sim-ul-card"><small>本次實際送出</small><strong data-ul-sent>0</strong></div>
        <div class="sim-ul-card"><small>另一台裝置（客戶端 #2）看到</small><strong data-ul-peer>看不到這個檔案</strong></div>
      </div>

      <ul class="sim-ul-legend">
        <li><i class="s-waiting"></i>尚未處理</li>
        <li><i class="s-split"></i>已切分</li>
        <li><i class="s-compressed"></i>已壓縮</li>
        <li><i class="s-encrypted"></i>已加密</li>
        <li><i class="s-inflight"></i>傳輸中</li>
        <li><i class="s-stored"></i>已確實寫入（安全）</li>
        <li><i class="s-lost"></i>傳輸中丟失</li>
        <li><i class="s-skipped"></i>沒變動，不必傳</li>
        <li><i class="s-deduped"></i>雜湊重複，直接引用</li>
      </ul>
    </section>`;
  }

  function wireUploadLab(root, sim, state) {
    const ul = sim.uploadLab;
    if (!ul) return;
    if (state.uploadTimer) { clearTimeout(state.uploadTimer); state.uploadTimer = null; }
    const panel = root.querySelector('[data-upload-lab]');
    if (!panel) return;

    const q = s => panel.querySelector(s);
    const grid = q('[data-ul-grid]');
    const gridNote = q('[data-ul-gridnote]');
    const fileSel = q('.sim-ul-file');
    const startBtn = q('.sim-ul-start');
    const editBtn = q('.sim-ul-edit');
    const resetBtn = q('.sim-ul-reset');
    const blockBytes = ul.blockBytes || 4 * 1024 * 1024;
    const maxCells = ul.maxCells || 96;
    const svgEl = root.querySelector('svg.sim-topo');

    const fileOf = id => (ul.files || []).find(f => f.id === id) || (ul.files || [])[0];

    function build(fileId) {
      const f = fileOf(fileId);
      const totalBlocks = Math.max(1, Math.ceil(f.bytes / blockBytes));
      // Derive the cell COUNT from the group size, not the other way round. Picking
      // cells = min(total, maxCells) first and then rounding groupSize up overshoots
      // (512 blocks over 96 cells → groupSize 6 → 576 slots), and the surplus cells end up
      // holding a negative number of blocks, which then corrupts every byte total.
      const groupSize = Math.ceil(totalBlocks / Math.min(totalBlocks, maxCells));
      const cellCount = Math.ceil(totalBlocks / groupSize);
      // Two cells share a hash with an earlier cell, so dedupe has something real to show.
      const dupOf = {};
      if (cellCount >= 8) { dupOf[Math.floor(cellCount * 0.55)] = 2; dupOf[Math.floor(cellCount * 0.8)] = 5; }
      return {
        fileId: f.id, fileName: f.name, fileBytes: f.bytes, totalBlocks, groupSize,
        cells: Array.from({ length: cellCount }, (_, i) => ({
          st: 'waiting',
          blocks: Math.min(groupSize, totalBlocks - i * groupSize),
          dup: dupOf[i]
        })),
        active: [], cursor: 0, running: false, pass: 1,
        meta: 'none', sentBytes: 0, wastedBytes: 0,
        down: { blockServer: false, storage: false, api: false },
        callbackPending: false, changed: null
      };
    }

    const u = () => state.upload;
    const cellBlocks = c => c.blocks;
    const durableCells = () => u().cells.filter(c => c.st === 'stored' || c.st === 'skipped' || c.st === 'deduped');
    const durableBlocks = () => durableCells().reduce((s, c) => s + cellBlocks(c), 0);
    const allSettled = () => u().cells.every(c => ['stored', 'skipped', 'deduped'].includes(c.st));

    function beginLabRuntime(pass2) {
      if (!Runtime || !state.runtime) return;
      const st = u();
      const spec = operationSpec(sim, state, 'upload', undefined, {
        file_name: st.fileName,
        size_bytes: st.fileBytes,
        file_id: pass2 ? st.runtimeFileId : undefined,
        version_number: pass2 ? (st.runtimeVersion || 1) + 1 : 1,
        previous_blocks: pass2 ? st.runtimeBlocks : undefined,
        changed_blocks: pass2 ? st.changedBlocks : undefined,
        delta_enabled: pass2 && (!ul.deltaComponentId || currentOptionId(sim, ul.deltaComponentId, state) !== 'off'),
        version_action: pass2 ? 'changed_blocks' : 'new_file'
      });
      const request = Runtime.beginRequest(state.runtime, {
        kind: 'upload', label: spec.label, payload: spec.payload
      });
      state.uploadRuntime = { request, spec };
      st.runtimeFileId = spec.payload.file_id;
      st.runtimeVersion = spec.payload.version_number;
      st.runtimeBlocks = spec.blockRefs || st.runtimeBlocks || [];
      Runtime.visitNode(state.runtime, request, 'users', pass2 ? '送出變更版本' : '選擇檔案並開始上傳');
      applyRuntimeWrites(state, spec.writesOnStart, request);
      const hopNodes = [...new Set((spec.writesOnHop || []).map(write => write.nodeId).filter(Boolean))];
      hopNodes.forEach(nodeId => Runtime.visitNode(state.runtime, request, nodeId, '先建立 pending metadata'));
      applyRuntimeWrites(state, spec.writesOnHop, request);
      refreshRuntimeSummary(root, sim, state);
      repaintNodes(root, sim, state);
    }

    function finishLabRuntime() {
      const tracked = state.uploadRuntime;
      if (!tracked?.request || tracked.request.status !== 'running') return;
      const sequence = [ul.nodes?.storage, ul.nodes?.api, 'metadataDB', 'notifyService'].filter(Boolean);
      sequence.forEach(nodeId => Runtime.visitNode(state.runtime, tracked.request, nodeId, '上傳完成與狀態回調'));
      applyRuntimeWrites(state, tracked.spec.writesOnComplete, tracked.request);
      Runtime.finishRequest(state.runtime, tracked.request, 'completed', '所有區塊已落地，metadata=uploaded');
      refreshRuntimeSummary(root, sim, state);
      repaintNodes(root, sim, state);
    }

    function abortLabRuntime(reason) {
      const tracked = state.uploadRuntime;
      if (!tracked?.request || tracked.request.status !== 'running') return;
      applyRuntimeWrites(state, tracked.spec.writesOnFail, tracked.request);
      Runtime.finishRequest(state.runtime, tracked.request, 'failed', reason);
      refreshRuntimeSummary(root, sim, state);
      repaintNodes(root, sim, state);
    }

    function paint() {
      const st = u();
      if (!st) return;
      grid.innerHTML = st.cells.map((c, i) =>
        `<i class="sim-ul-cell s-${c.st}" title="區塊 #${i * st.groupSize + 1}–#${i * st.groupSize + c.blocks}"></i>`).join('');
      gridNote.textContent = st.cells.length < st.totalBlocks
        ? `檔案 ${st.fileName} 共 ${st.totalBlocks.toLocaleString()} 個 ${ulBytes(blockBytes)} 區塊；每一格代表 ${st.groupSize} 個區塊。`
        : `檔案 ${st.fileName} 共 ${st.totalBlocks} 個 ${ulBytes(blockBytes)} 區塊，一格一個。`;

      const metaText = { none: '尚未建立', pending: '⏳ pending（已建立，位元組還沒到齊）', uploaded: '✅ uploaded（可以下載了）' }[st.meta];
      q('[data-ul-meta]').textContent = metaText;
      q('[data-ul-meta]').className = st.meta === 'uploaded' ? 'ok' : st.meta === 'pending' ? 'warn' : '';
      q('[data-ul-durable]').textContent = `${durableBlocks().toLocaleString()} / ${st.totalBlocks.toLocaleString()} 個區塊`;
      q('[data-ul-sent]').textContent = `${ulBytes(st.sentBytes)}${st.wastedBytes ? `（其中 ${ulBytes(st.wastedBytes)} 是重傳浪費掉的）` : ''}`;
      q('[data-ul-peer]').textContent = st.meta === 'uploaded'
        ? '✅ 檔案已完整上傳，可以下載'
        : st.meta === 'pending' ? '👀 看得到檔案，狀態「上傳中」——不會下載到半個檔案' : '看不到這個檔案';

      ['blockServer', 'storage', 'api'].forEach(k => {
        const el = panel.querySelector(`[data-ul-state="${k}"]`);
        const lane = panel.querySelector(`[data-ul-lane="${k}"]`);
        const dead = st.down[k];
        lane.classList.toggle('dead', dead);
        el.textContent = dead ? '💥 已當機' : st.running ? '運作中' : '待命';
        panel.querySelector(`[data-ul-kill="${k}"]`).textContent = dead ? '🔌 復原' : '💥 打掛';
      });
      panel.querySelector('[data-ul-state="client"]').textContent =
        st.running ? '上傳中' : allSettled() && st.meta === 'uploaded' ? '完成' : '待命';

      startBtn.disabled = st.running;
      startBtn.textContent = allSettled() && st.meta === 'uploaded' ? '▶ 再上傳一個檔案' : '▶ 開始新的上傳';
      editBtn.disabled = !(allSettled() && st.meta === 'uploaded');
    }

    function stop() {
      if (state.uploadTimer) { clearTimeout(state.uploadTimer); state.uploadTimer = null; }
      if (u()) u().running = false;
    }

    function schedule() {
      if (state.uploadTimer) clearTimeout(state.uploadTimer);
      state.uploadTimer = setTimeout(tick, Math.max(40, (ul.stageMs || 150) / (state.speed || 1)));
    }

    // One pipeline step: advance every in-flight cell one stage, then admit new ones.
    function tick() {
      const st = u();
      if (!st || !st.running) return;
      const parallel = ul.parallel || 4;

      // advance
      st.active = st.active.filter(i => {
        const c = st.cells[i];
        if (!c) return false;
        if (st.down.blockServer && UL_STAGES.includes(c.st)) return false; // handled by the kill
        const idx = UL_STAGES.indexOf(c.st);
        if (idx < 0) return false;
        if (c.st === 'inflight') {
          if (st.down.storage) return true;               // stuck in flight until storage returns
          c.st = 'stored';
          st.sentBytes += cellBlocks(c) * blockBytes;
          return false;
        }
        c.st = UL_STAGES[idx + 1];
        return true;
      });

      // admit
      while (st.active.length < parallel && st.cursor < st.cells.length) {
        // Check the failure state BEFORE consuming the cursor: bailing out after `cursor++`
        // would step over a still-waiting cell and strand it, so the upload could never finish.
        if (st.down.blockServer || st.down.storage) break;
        const i = st.cursor++;
        const c = st.cells[i];
        if (['stored', 'skipped', 'deduped'].includes(c.st)) continue;
        const canDedupe = !ul.dedupeComponentId || currentOptionId(sim, ul.dedupeComponentId, state) !== 'off';
        if (c.dup != null && canDedupe) {
          c.st = 'deduped';
          traceLine(root, `區塊 #${i * st.groupSize + 1} 的雜湊與先前的區塊相同，直接引用，不必再存一份。`, 'ok');
          continue;
        }
        c.st = 'split';
        st.active.push(i);
      }

      paint();

      if (allSettled()) {
        stop();
        if (st.down.api) {
          st.callbackPending = true;
          traceLine(root, '⚠️ 所有區塊都已確實寫入雲端儲存，但 API 伺服器當機，收不到「上傳完成」的回調——檔案狀態卡在 pending，其他裝置看得到它卻不能下載。位元組是安全的，檔案還不能用。', 'bad');
          paint();
          return;
        }
        finishCallback();
        return;
      }
      if (!st.active.length && st.cursor >= st.cells.length) { stop(); paint(); return; }
      schedule();
    }

    function finishCallback() {
      const st = u();
      st.callbackPending = false;
      st.meta = 'uploaded';
      traceLine(root, '雲端儲存系統觸發上傳完成的回調 → API 伺服器把 metadata 狀態改成 uploaded。', 'ok');
      traceLine(root, '通知服務通報客戶端 #2：檔案已完整上傳，可以下載了。', 'ok');
      traceLine(root, `— 上傳結束：實際送出 ${ulBytes(st.sentBytes)}${st.wastedBytes ? `，其中 ${ulBytes(st.wastedBytes)} 是當機後重傳浪費的` : ''} —`, 'done');
      finishLabRuntime();
      paint();
    }

    function start(pass2) {
      const st = u();
      st.running = true;
      st.active = [];
      st.cursor = 0;
      if (!state.uploadRuntime?.request || state.uploadRuntime.request.status !== 'running') beginLabRuntime(pass2);
      if (!pass2) {
        st.meta = 'pending';
        traceLine(root, `— 開始上傳「${st.fileName}」（${ulBytes(st.fileBytes)}，共 ${st.totalBlocks.toLocaleString()} 個 ${ulBytes(blockBytes)} 區塊）—`, 'head');
        traceLine(root, '兩個請求同時出發：① 寫入 metadata 並把狀態設為 pending ② 把檔案內容送進區塊伺服器。', '');
        traceLine(root, '通知服務通報客戶端 #2：有個新檔案正在上傳中。', '');
      }
      paint();
      schedule();
    }

    startBtn.onclick = () => {
      abortLabRuntime('使用者開始另一個檔案上傳');
      state.upload = build(fileSel.value);
      start(false);
    };

    resetBtn.onclick = () => { stop(); abortLabRuntime('實驗面板已重設'); state.upload = build(fileSel.value); paint(); };
    fileSel.onchange = () => { stop(); abortLabRuntime('改選另一個檔案'); state.upload = build(fileSel.value); paint(); };

    // Second pass: the delta-sync demonstration.
    editBtn.onclick = () => {
      const st = u();
      const canDelta = ul.deltaComponentId ? currentOptionId(sim, ul.deltaComponentId, state) !== 'off' : true;
      const n = Math.max(1, Math.round(st.cells.length * 0.08));
      const changed = new Set();
      while (changed.size < n) changed.add(Math.floor(Math.random() * st.cells.length));
      st.pass += 1;
      st.sentBytes = 0;
      st.wastedBytes = 0;
      st.meta = 'pending';
      st.changed = [...changed];
      st.changedBlocks = st.changed.flatMap(i => Array.from(
        { length: st.cells[i].blocks },
        (_, offset) => i * st.groupSize + offset + 1
      ));
      st.cells.forEach((c, i) => {
        if (canDelta && !changed.has(i)) { c.st = 'skipped'; return; }
        c.st = 'waiting';
        if (canDelta) c.dup = null;   // a genuinely changed block no longer matches an old hash
      });
      const changedBytes = st.cells.filter((c, i) => changed.has(i)).reduce((s, c) => s + cellBlocks(c) * blockBytes, 0);
      traceLine(root, canDelta
        ? `✏️ 改了 ${changed.size} 格（約 ${ulBytes(changedBytes)}）後再上傳一次。有差異同步：只有變動過的區塊會重新送出，其餘全部跳過。`
        : `✏️ 改了 ${changed.size} 格後再上傳一次。沒有差異同步：整份 ${ulBytes(st.fileBytes)} 都要重新送出。`,
        canDelta ? 'ok' : 'bad');
      start(true);
    };

    panel.querySelectorAll('[data-ul-kill]').forEach(btn => {
      btn.onclick = () => {
        const st = u();
        if (!st) return;
        const k = btn.dataset.ulKill;
        const nodeId = ul.nodes?.[k];
        if (!st.down[k]) {
          st.down[k] = true;
          svgEl?.querySelector(`[data-node="${nodeId}"]`)?.classList.add('failing');
          if (k === 'blockServer') {
            const lost = st.active.length;
            const lostBytes = st.active.reduce((s, i) => s + cellBlocks(st.cells[i]) * blockBytes, 0);
            st.active.forEach(i => { st.cells[i].st = 'lost'; });
            st.active = [];
            stop();
            traceLine(root, `💥 區塊伺服器當機！正在處理中的 ${lost} 格（約 ${ulBytes(lostBytes)}）當場中斷；已經確實寫入雲端儲存的 ${durableBlocks().toLocaleString()} 個區塊不受影響。`, 'bad');
          } else if (k === 'storage') {
            const lost = st.active.filter(i => st.cells[i].st === 'inflight');
            lost.forEach(i => { st.cells[i].st = 'lost'; });
            st.active = st.active.filter(i => st.cells[i].st !== 'lost');
            stop();
            const replication = currentOptionId(sim, 'storageReplication', state);
            const durableNote = replication === 'crossRegion'
              ? '已寫入的區塊在另一個區域仍有複本。'
              : replication === 'sameRegion'
                ? '同區副本也受區域故障影響，暫時無法保證可讀。'
                : '沒有第二份已確認複本，資料可能無法復原。';
            traceLine(root, `💥 雲端儲存系統當機！正在寫入的 ${lost.length} 格中斷，新的區塊也無法再落地。${durableNote}`, 'bad');
          } else {
            traceLine(root, '💥 API 伺服器當機！位元組照常送進雲端儲存——但「上傳完成」的回調沒有人收，檔案狀態會卡在 pending。', 'bad');
          }
        } else {
          st.down[k] = false;
          svgEl?.querySelector(`[data-node="${nodeId}"]`)?.classList.remove('failing');
          if (k === 'api') {
            traceLine(root, '🔌 API 伺服器恢復。', 'ok');
            if (st.callbackPending && allSettled()) { finishCallback(); return; }
          } else {
            const canResume = ul.resumeComponentId ? currentOptionId(sim, ul.resumeComponentId, state) !== 'off' : true;
            if (canResume) {
              const kept = durableBlocks();
              st.cells.forEach(c => { if (c.st === 'lost') c.st = 'waiting'; });
              traceLine(root, `🔌 恢復，而且有斷點續傳：已經確實寫入的 ${kept.toLocaleString()} 個區塊不必重傳，從中斷的地方接著傳。`, 'ok');
            } else {
              const waste = durableBlocks() * blockBytes;
              st.wastedBytes += waste;
              st.cells.forEach(c => { c.st = 'waiting'; });
              traceLine(root, `🔌 恢復，但沒有斷點續傳：整份檔案必須從頭重傳，剛才已經寫進去的 ${ulBytes(waste)} 全部白費。`, 'bad');
            }
            if (!st.down.blockServer && !st.down.storage && !allSettled()) { start(true); return; }
          }
        }
        paint();
      };
    });

    if (!state.upload || !fileOf(state.upload.fileId)) state.upload = build(fileSel.value);
    else fileSel.value = state.upload.fileId;
    paint();
    if (state.upload.running) schedule();
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
    if (state.dragViewerTimer) { clearTimeout(state.dragViewerTimer); state.dragViewerTimer = null; }

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
          ? `🙋 ${lex(sim, 'testViewer')}走進${lex(sim, 'zoneName')}——目前正在傳的那一段還是照舊${lex(sim, 'quality')}播完，要等下一段收到之後${lex(sim, 'quality')}才會降下來。`
          : `🙋 ${lex(sim, 'testViewer')}離開${lex(sim, 'zoneName')}——同樣要等下一段收到之後，${lex(sim, 'quality')}才會開始往回爬。`, state.dragViewer.inZone ? 'bad' : 'ok');
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
        traceLine(root, `🙋 ${esc(lex(sim, 'testViewer'))}移動到「${esc(topo.regionLabel?.[hit] || hit)}」，改由這一區的節點服務。`, 'head');
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
      wanderBtn.textContent = state.dragViewer.wander ? lex(sim, 'wanderActive') : lex(sim, 'wanderIdle');
      wanderBtn.setAttribute('aria-pressed', String(!!state.dragViewer.wander));
    };
    wanderBtn?.addEventListener('click', () => {
      state.dragViewer.wander = !state.dragViewer.wander;
      syncWanderBtn();
      traceLine(root, state.dragViewer.wander
        ? `🚶 ${lex(sim, 'testViewer')}開始隨機走動，會自己走進走出${lex(sim, 'zoneName')}。`
        : `🚶 ${lex(sim, 'testViewer')}停下來了。`, '');
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
    let segmentInFlight = false;
    // Every remount (advancing a month re-renders the whole play screen) creates a fresh closure
    // over fresh DOM. With a self-scheduling chain that is dangerous in a way a plain interval
    // never was: a token spawned by the PREVIOUS generation is still animating, and when it
    // lands its callbacks would schedule the next segment using the old, now-detached elements —
    // stealing the timer from the live generation and writing playback state through dead nodes.
    // A generation stamp makes every stale callback a no-op.
    const gen = (state.dragViewerGen = (state.dragViewerGen || 0) + 1);
    const isCurrent = () => state.dragViewerGen === gen;
    const scheduleNext = () => {
      if (!isCurrent()) return;
      if (state.dragViewerTimer) clearTimeout(state.dragViewerTimer);
      state.dragViewerTimer = setTimeout(() => { if (isCurrent()) tick(); }, Math.max(90, tickMs * 0.25) / (state.speed || 1));
    };

    // ONE segment per tick, and TWO separate quality values — which is the whole subtlety here:
    //
    //   dv.qualityId      what the viewer is WATCHING right now = the quality of the segment
    //                     that most recently arrived. This is what the label shows.
    //   dv.fetchQualityId what the player will ASK FOR next, decided by the bandwidth measured
    //                     when the last segment landed.
    //
    // Collapsing these two into one variable (the earlier bug) made the label jump the instant
    // the decision was made — i.e. just as the next packet departed — even though what was on
    // screen at that moment was still the previous segment. Keeping them apart means the
    // displayed quality changes exactly when the lower-quality segment ARRIVES, one full
    // segment after the decision, and you can watch the small red packet travel across the
    // diagram before the label follows it down. Real players behave this way.
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
      // Exactly one segment is ever in flight, and the next is requested only once this one has
      // settled (arrived, was lost, or could not be sent). Segment flight time now depends on
      // how far the bytes actually travel, so a fixed interval would either overlap segments
      // (short interval, long path) or leave dead air — and the cadence itself is informative:
      // with a nearby CDN answering, segments tick along quickly; from a distant origin they
      // visibly crawl.
      let settled = false;
      const settle = () => { if (settled) return; settled = true; segmentInFlight = false; scheduleNext(); };
      if (flowIds.length < 2) { settle(); return; }
      segmentInFlight = true;
      const servedFromOrigin = flowIds.includes(`streamServer_${r}`);
      const originNode = findNode(topo, `streamServer_${r}`);
      const regionName = topo?.regionLabel?.[r] || r;

      // The quality this segment is being FETCHED at was decided when the previous one arrived.
      // Note this is deliberately NOT dv.qualityId (what is currently playing).
      const sendIdx = Math.max(0, ladder.findIndex(q => q.id === (dv.fetchQualityId || dv.qualityId)));

      // Announce where the bytes are coming from only when that actually changes, otherwise
      // every single tick would spam the log with the same line.
      const edgeCacheId = sim.capacity?.offloadFrom;
      const hasEdgeCache = edgeCacheId ? ctx.has(edgeCacheId) : false;
      const pathKind = servedFromOrigin ? (hasEdgeCache ? 'miss' : 'noCdn') : 'edge';
      if (pathKind !== dv.lastPathKind) {
        dv.lastPathKind = pathKind;
        if (pathKind === 'edge') traceLine(root, `🙋 這段${esc(lex(sim, 'segment'))}在「${esc(regionName)}」的${esc(lex(sim, 'edgeNode'))}命中，直接從${esc(lex(sim, 'edgeShort'))}送出，完全沒有碰到後面的${esc(lex(sim, 'originNode'))}。`, 'ok');
        else if (pathKind === 'miss') traceLine(root, `🙋 ${esc(lex(sim, 'edgeShort'))}沒有這${esc(lex(sim, 'itemMeasure'))}${esc(lex(sim, 'item'))}，這段回源到「${esc(regionName)}」的${esc(lex(sim, 'originNode'))}，再經${esc(lex(sim, 'edgeShort'))}送出。`, '');
        else traceLine(root, `🙋 目前沒有建 CDN，每一段都直接從「${esc(regionName)}」的串流伺服器送出。`, '');
      }

    // Runs when the segment we just sent has completed its round trip back to the viewer.
      // `sentIdx` is the quality THIS segment was encoded at — it becomes what is on screen.
      const onSegmentArrived = sentIdx => {
        // 1. What is playing is now this segment. The label follows the picture, not the plan.
        if (dv.qualityId !== ladder[sentIdx].id) {
          const wentDown = ladder.findIndex(q => q.id === dv.qualityId) > sentIdx;
          dv.qualityId = ladder[sentIdx].id;
          qualityText.textContent = ladder[sentIdx].label;
          qualityText.setAttribute('class', `sim-drag-viewer-quality q-${ladder[sentIdx].id}`);
          traceLine(root, `🙋 這一段（${ladder[sentIdx].label}）送達了，畫面現在才${wentDown ? '降成' : '變成'}「${ladder[sentIdx].label}」。`, wentDown ? 'bad' : 'ok');
        }
        // 2. Only now, having measured how this segment actually travelled, decide what to ask
        //    for NEXT. That request goes out on the next tick and will not be visible on screen
        //    until it in turn arrives.
        // Being served from an overloaded origin is not free: a streaming tier carrying more
        // viewers than it has capacity for delivers each of them less bandwidth, which the ABR
        // logic then reacts to — the same causal chain as the bad-signal zone, but caused by an
        // architecture decision instead of by where the viewer is standing.
        const load = servedFromOrigin ? nodeLoad(sim, state, originNode) : null;
        const overloadFactor = load && load.ratio > 1 ? Math.max(0.15, 1 - (load.ratio - 1) * 0.5) : 1;
        const [lo, hi] = dv.inZone ? poorRange : goodRange;
        const measured = (lo + Math.random() * (hi - lo)) * overloadFactor;
        const curIdx = sentIdx;
        let sustainableIdx = 0;
        for (let i = ladder.length - 1; i >= 0; i--) {
          if (measured >= ladder[i].mbps * 0.9) { sustainableIdx = i; break; }
        }
        let nextIdx;
        if (sustainableIdx < curIdx) nextIdx = sustainableIdx;
        else if (curIdx < ladder.length - 1 && measured > ladder[curIdx + 1].mbps * 1.3) nextIdx = curIdx + 1;
        else nextIdx = curIdx;
        if (nextIdx !== curIdx) {
          dv.fetchQualityId = ladder[nextIdx].id;
          traceLine(root, `🙋 量測到的頻寬是 ${measured.toFixed(1)} Mbps，所以「下一段」改抓「${ladder[nextIdx].label}」——畫面要等那一段真的收到才會變。`, nextIdx < curIdx ? 'bad' : '');
        }
        if (overloadFactor < 1 && !dv.warnedOverload) {
          dv.warnedOverload = true;
          traceLine(root, `⚠️「${esc(originNode?.label || regionName)}」已超載（負載 ${Math.round(load.ratio * 100)}%），分給每位${esc(lex(sim, 'viewer'))}的頻寬被壓縮，${esc(lex(sim, 'quality'))}會被迫下降——加開機器或用${esc(lex(sim, 'edgeShort'))}分流才救得回來。`, 'bad');
        }
        if (overloadFactor >= 1) dv.warnedOverload = false;
      };

      const handle = spawnRequest(root, sim, state, svgEl, flowIds, {
        trace: true,
        // Both ends of this round trip are the viewer themself, wherever they are standing now.
        mapPoint: (nodeId, p) => (nodeId === `users_${r}` ? { x: dv.x, y: dv.y } : p),
        token: {
          tokenClass: 'sim-token-segment',
          className: `q-${ladder[sendIdx].id}`,
          radius: 5 + sendIdx * 4,
          onDone: c => { c?.remove(); if (!isCurrent()) return; onSegmentArrived(sendIdx); settle(); }
        },
        // A segment lost because its machine was pulled is a stall, not an arrival: nothing is
        // measured, so the quality for the next segment is left exactly where it was.
        onLost: () => { if (!isCurrent()) return; traceLine(root, `🙋 這一段${lex(sim, 'segment')}沒有送達（負責的機器中途被拔掉），${lex(sim, 'client')}會卡住重新請求。`, 'bad'); settle(); },
        onBlocked: () => { if (!isCurrent()) return; traceLine(root, `🙋 ${lex(sim, 'testViewer')}完全收不到${lex(sim, 'item')}：這一區沒有任何一台機器可以服務他。`, 'bad'); settle(); }
      });
      if (!handle) settle();
    };

    qualityText.textContent = ladder.find(q => q.id === state.dragViewer.qualityId)?.label || state.dragViewer.qualityId || '--';
    refreshZoneFlag();
    // Re-pacing on a speed change is only safe while nothing is in the air — otherwise it would
    // launch a second segment alongside the one still travelling and break the one-in-flight
    // invariant the whole quality model rests on.
    state.repaceDragViewer = () => { if (!segmentInFlight) scheduleNext(); };
    scheduleNext();
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
    return `<div class="sim-hint bad">⚠️ 目前有 ${over.length} 個節點超載：${list}${over.length > 3 ? ' 等' : ''}。再推進一個月會扣${esc(lex(sim, 'qoeMetric'))}分數——用節點旁的 ＋ 加開機器，或改用${esc(lex(sim, 'edgeShort'))}把流量分流到邊緣節點。</div>`;
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
      ${renderUploadLab(sim)}
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
      if (delta < 0) {
        const removedIndex = base + nextExtra;
        delete state.instancePositions?.[nodeId]?.[removedIndex];
        setInstanceDown(state, nodeId, removedIndex, false);
      }
      repaintNodes(root, sim, state);
      repaintEdges(root, sim, state);
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
    }, () => refreshLoadSummary(root, sim, state), storeId => openDataInspector(root, sim, state, storeId));
    wireTraceClear(root);
    wireUploadLab(root, sim, state);
    wireChunkLab(root, sim, state);
    wireAbrLab(root, sim, state);
    wireDragViewer(root, sim, state);

    root.querySelector('.sim-advance').onclick = () => {
      stopRandomTraffic(root, state, false);
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
          result: `超過容量的機器沒辦法給每位${lex(sim, 'viewer')}足夠的頻寬，${lex(sim, 'viewer')}端表現為${lex(sim, 'overloadSymptom')}、${lex(sim, 'quality')}被迫下降。加開機器或把流量分流到${lex(sim, 'edgeShort')}都能解決。`,
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
      if (state.dragViewerTimer) clearTimeout(state.dragViewerTimer);
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
    { type: 'notification', label: '通知服務', icon: '🔔' },
    { type: 'worker', label: '工作程序', icon: '⚙️' },
    { type: 'custom', label: '自訂', icon: '🔷' }
  ];
  const sandboxTypeMeta = type => SANDBOX_NODE_TYPES.find(t => t.type === type) || SANDBOX_NODE_TYPES[SANDBOX_NODE_TYPES.length - 1];

  // Not a hard whitelist — a sandbox that blocked "unusual" connections outright would fight
  // anyone trying to deliberately model a weird real system. Missing from this list just means
  // "flag it with a warning icon", never "refuse to create the edge".
  const SANDBOX_SENSIBLE_PAIRS = {
    user: ['cdn', 'loadBalancer', 'api', 'notification'],
    cdn: ['user', 'loadBalancer', 'storage', 'api'],
    loadBalancer: ['user', 'cdn', 'api', 'worker'],
    api: ['user', 'loadBalancer', 'db', 'cache', 'storage', 'queue', 'worker', 'cdn', 'notification'],
    db: ['api', 'worker', 'cache'],
    cache: ['api', 'db', 'worker'],
    storage: ['api', 'worker', 'cdn', 'queue'],
    queue: ['api', 'worker', 'storage'],
    notification: ['user', 'api', 'queue'],
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
    state.edges.forEach(e => { (adj[e.from] ??= []).push(e.to); });
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

  const SANDBOX_STORAGE_KEY = 'softwareSystemDesignBlankSceneV2';
  const SANDBOX_STORE_TYPES = new Set(['db', 'cache', 'storage', 'queue', 'notification']);

  function sandboxStoreId(node) { return node?.storeId || `sandbox-${node?.id}`; }

  function sandboxStoreDefaults(node) {
    const meta = {
      db: ['database', 'records', 'rows'],
      cache: ['cache', 'entries', 'cache entries'],
      storage: ['object storage', 'objects', 'objects'],
      queue: ['durable queue', 'messages', 'messages'],
      notification: ['event stream', 'events', 'notification events']
    }[node.type] || ['store', 'records', 'records'];
    return {
      nodeId: node.id,
      label: node.label,
      kind: meta[0],
      description: `空白模擬器中的「${node.label}」。每個抵達這裡的 request 都會留下可檢查的模擬資料。`,
      tables: [{
        id: meta[1], label: meta[2], key: 'request_id', schema: [
          { name: 'request_id', type: 'string', note: '產生這筆資料的 request' },
          { name: 'from', type: 'node id', note: '請求起點' },
          { name: 'to', type: 'node id', note: '請求終點' },
          { name: 'payload', type: 'JSON', note: '沿路傳送的完整內容' },
          { name: 'received_at', type: 'timestamp', note: '抵達時間' }
        ]
      }]
    };
  }

  function sandboxEnsureNodeStore(state, node) {
    if (!Runtime || !state.runtime || !node || !SANDBOX_STORE_TYPES.has(node.type)) return null;
    node.storeId = sandboxStoreId(node);
    return Runtime.ensureStore(state.runtime, node.storeId, sandboxStoreDefaults(node));
  }

  function sandboxSerializable(state) {
    return {
      version: 2,
      nodes: Runtime?.clone(state.nodes) || state.nodes,
      edges: Runtime?.clone(state.edges) || state.edges,
      nextId: state.nextId,
      regions: [...state.regions],
      activeRegion: state.activeRegion,
      simFrom: state.simFrom,
      simTo: state.simTo,
      simPayload: state.simPayload,
      showConnections: state.showConnections !== false,
      runtime: Runtime?.clone(state.runtime) || state.runtime
    };
  }

  function saveSandboxState(state) {
    try { localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(sandboxSerializable(state))); }
    catch { /* localStorage can be disabled; the canvas still works for this session. */ }
  }

  function newSandboxState(saved) {
    const raw = saved && typeof saved === 'object' ? saved : {};
    const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
    const inferredNextId = nodes.reduce((max, node) => Math.max(max, Number(String(node.id || '').match(/(\d+)$/)?.[1]) || 0), 0) + 1;
    const state = {
      nodes,
      edges: Array.isArray(raw.edges) ? raw.edges : [],
      nextId: Math.max(1, inferredNextId, Number(raw.nextId) || 1), selectedNodeId: null,
      regions: Array.isArray(raw.regions) && raw.regions.length ? raw.regions : ['A 區'],
      activeRegion: raw.activeRegion || raw.regions?.[0] || 'A 區',
      simFrom: raw.simFrom || '', simTo: raw.simTo || '',
      simPayload: raw.simPayload || '{"action":"demo"}',
      showConnections: raw.showConnections !== false,
      runtime: Runtime?.hydrateRuntime(raw.runtime, { stores: [] }) || {
        requestSeq: 0, counts: {}, requests: [], nodeActivity: {}, routeCursor: {}, stores: {}
      }
    };
    state.nodes.forEach(node => sandboxEnsureNodeStore(state, node));
    return state;
  }

  function loadSandboxState() {
    try { return newSandboxState(JSON.parse(localStorage.getItem(SANDBOX_STORAGE_KEY))); }
    catch { return newSandboxState(); }
  }

  function sandboxNodesSvg(state, selectedId) {
    return state.nodes.map(n => {
      const meta = sandboxTypeMeta(n.type);
      const selected = n.id === selectedId;
      const store = sandboxEnsureNodeStore(state, n);
      const rowCount = store && Runtime ? Runtime.tableRowCount(state.runtime, store.id) : 0;
      return `<g class="sim-topo-node sandbox-node${selected ? ' selected' : ''}" data-sandbox-node="${esc(n.id)}"${store ? ` data-sandbox-store="${esc(store.id)}"` : ''} role="button" tabindex="0" aria-label="${esc(n.label)}">
        <circle cx="${n.x}" cy="${n.y}" r="24"/>
        <text class="sim-topo-mark sandbox-icon" x="${n.x}" y="${n.y + 7}">${meta.icon}</text>
        <text class="sim-topo-label" x="${n.x}" y="${n.y + 40}">${esc(n.label)}</text>
        ${store ? `<text class="sim-topo-data-count" data-sandbox-store-count="${esc(store.id)}" x="${n.x + 25}" y="${n.y - 20}">🗃 ${rowCount}</text>` : ''}
      </g>`;
    }).join('');
  }

  function sandboxEdgesSvg(state) {
    return state.edges.map(e => {
      const a = state.nodes.find(n => n.id === e.from), b = state.nodes.find(n => n.id === e.to);
      if (!a || !b) return '';
      return `<line class="sim-topo-edge active" data-sandbox-edge="${esc(e.from)}-${esc(e.to)}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#sandbox-arrow)"/>`;
    }).join('');
  }

  function renderSandbox(root, state) {
    const selected = state.nodes.find(n => n.id === state.selectedNodeId);
    root.innerHTML = `<section class="sim-screen sim-sandbox">
      <div class="eyebrow">自由建構模式</div>
      <h1>拓樸圖沙盒</h1>
      <p class="sim-lede">從左邊工具列把節點類型拖到畫布就能新增；點一下既有節點可設定名稱、地區與單向連線，直接拖曳可移動位置。每次模擬都會新增一筆 request，經過資料庫、快取、儲存或佇列時也會真的留下資料；整個場景會自動保存在這台裝置。</p>
      ${runtimeSummaryHtml({}, state)}
      <div class="sim-sandbox-layout">
        <div class="sim-sandbox-palette">
          ${SANDBOX_NODE_TYPES.map(t => `<div class="sim-palette-item" data-palette-type="${t.type}" role="button" tabindex="0"><span class="sim-palette-icon">${t.icon}</span><span>${esc(t.label)}</span></div>`).join('')}
          <div class="sim-sandbox-region-block">
            <label class="sim-sandbox-field">目前地區（新節點會加進這裡）
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
        <div class="sim-sandbox-canvas-wrap${state.showConnections === false ? ' connections-hidden' : ''}">
          <div class="sim-topo-scroll">
            <svg class="sim-topo sim-sandbox-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" role="img" aria-label="自訂拓樸圖畫布">
              <defs><marker id="sandbox-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>
              ${regionBoxesSvg({ nodes: state.nodes })}
              <g class="sandbox-edges-group">${sandboxEdgesSvg(state)}</g>
              ${sandboxNodesSvg(state, state.selectedNodeId)}
            </svg>
          </div>
          <div class="sim-sandbox-toolbar">
            <select class="sim-sandbox-sim-from"><option value="">起點…</option>${state.nodes.map(n => `<option value="${esc(n.id)}" ${state.simFrom === n.id ? 'selected' : ''}>${sandboxTypeMeta(n.type).icon} ${esc(n.label)}</option>`).join('')}</select>
            <select class="sim-sandbox-sim-to"><option value="">終點…</option>${state.nodes.map(n => `<option value="${esc(n.id)}" ${state.simTo === n.id ? 'selected' : ''}>${sandboxTypeMeta(n.type).icon} ${esc(n.label)}</option>`).join('')}</select>
            <input class="sim-sandbox-payload" type="text" value="${esc(state.simPayload || '')}" aria-label="Request payload" placeholder='{"action":"upload"}'>
            <button class="button sim-sandbox-simulate-btn" type="button">▶ 模擬請求</button>
            <button class="button secondary sim-sandbox-check-btn" type="button">🔍 檢查架構</button>
            <button class="button secondary sim-sandbox-connections-btn" type="button" aria-pressed="${state.showConnections !== false}">${state.showConnections === false ? '🔗 顯示連線' : '🙈 隱藏連線'}</button>
            <button class="button secondary sim-sandbox-export-btn" type="button">⬇️ 匯出 JSON</button>
            <button class="button secondary sim-sandbox-import-btn" type="button">⬆️ 匯入 JSON</button>
            <input class="sim-sandbox-import-file" type="file" accept="application/json,.json" hidden>
          </div>
          ${payloadLegendHtml()}
          <div class="sim-trace">
            <div class="sim-trace-head"><span>即時處理紀錄</span><button class="sim-trace-clear" type="button">清空</button></div>
            <div class="sim-trace-body"></div>
          </div>
        </div>
      </div>
      ${selected ? `<div class="sim-sandbox-modal-backdrop" data-sandbox-backdrop>
      <div class="sim-sandbox-config" role="dialog" aria-modal="true">
        <h2>${sandboxTypeMeta(selected.type).icon} 設定節點</h2>
        <label class="sim-sandbox-field">顯示名稱<input type="text" class="sim-sandbox-label-input" value="${esc(selected.label)}"></label>
        <label class="sim-sandbox-field">所屬地區
          <select class="sim-sandbox-region-select">
            ${state.regions.map(r => `<option value="${esc(r)}" ${r === (selected.region || '') ? 'selected' : ''}>${esc(r)}</option>`).join('')}
          </select>
        </label>
        <div class="sim-sandbox-field">
          <span>單向連出到（${esc(selected.label)} → 目標）</span>
          <div class="sim-sandbox-connections">
            ${state.nodes.filter(n => n.id !== selected.id).map(n => {
              const connected = state.edges.some(e => e.from === selected.id && e.to === n.id);
              const sensible = sandboxIsSensible(selected.type, n.type);
              const warnIcon = connected && !sensible ? ' <span class="sim-sandbox-conn-warn-icon" title="這種連線不常見">⚠️</span>' : '';
              return `<label class="sim-sandbox-conn-item${connected && !sensible ? ' warn' : ''}"><input type="checkbox" class="sim-sandbox-conn-toggle" data-target="${esc(n.id)}" ${connected ? 'checked' : ''}> ${sandboxTypeMeta(n.type).icon} ${esc(n.label)}${warnIcon}</label>`;
            }).join('') || '<p class="sim-sandbox-empty">畫布上還沒有其他節點可以連線。</p>'}
          </div>
        </div>
        <div class="sim-sandbox-config-actions">
          ${selected.storeId ? `<button class="button sim-sandbox-inspect" type="button" data-store-id="${esc(selected.storeId)}">🗃 查看節點資料</button>` : ''}
          <button class="button secondary sim-sandbox-delete" type="button">🗑 刪除這個節點</button>
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

    const rerender = () => {
      saveSandboxState(state);
      renderSandbox(root, state);
    };

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
      const createKeyboardNode = () => {
        const type = chip.dataset.paletteType;
        const meta = sandboxTypeMeta(type);
        const index = state.nodes.length;
        const id = `n${state.nextId++}`;
        const node = {
          id, type, region: state.activeRegion, label: meta.label,
          x: 170 + (index % 4) * 210,
          y: 150 + (Math.floor(index / 4) % 3) * 190
        };
        state.nodes.push(node);
        sandboxEnsureNodeStore(state, node);
        state.selectedNodeId = id;
        rerender();
      };
      chip.addEventListener('keydown', evt => {
        if (evt.key !== 'Enter' && evt.key !== ' ') return;
        evt.preventDefault();
        createKeyboardNode();
      });
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
          const node = { id, type, region: state.activeRegion, label: meta.label, x: Math.round(last.x), y: Math.round(last.y) };
          state.nodes.push(node);
          sandboxEnsureNodeStore(state, node);
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
      state.simFrom = '';
      state.simTo = '';
      state.runtime = Runtime?.createRuntime({ stores: [] }) || { requestSeq: 0, counts: {}, requests: [], nodeActivity: {}, routeCursor: {}, stores: {} };
      rerender();
    });

    // Regions are a real, managed list now (not free text typed fresh on every node) — new
    // nodes default to whichever region is currently "active", and creating a new region is its
    // own explicit step, matching "先有一個 A 區域，要別的地區要先新建立".
    root.querySelector('.sim-sandbox-active-region')?.addEventListener('change', evt => {
      state.activeRegion = evt.target.value;
      saveSandboxState(state);
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
    root.querySelector('[data-request-ledger]')?.addEventListener('click', () => openDataInspector(root, {}, state, '__requests'));
    root.querySelector('.sim-sandbox-sim-from')?.addEventListener('change', evt => { state.simFrom = evt.target.value; saveSandboxState(state); });
    root.querySelector('.sim-sandbox-sim-to')?.addEventListener('change', evt => { state.simTo = evt.target.value; saveSandboxState(state); });
    root.querySelector('.sim-sandbox-payload')?.addEventListener('input', evt => { state.simPayload = evt.target.value; saveSandboxState(state); });
    root.querySelector('.sim-sandbox-connections-btn')?.addEventListener('click', event => {
      state.showConnections = state.showConnections === false;
      const visible = state.showConnections !== false;
      root.querySelector('.sim-sandbox-canvas-wrap')?.classList.toggle('connections-hidden', !visible);
      event.currentTarget.setAttribute('aria-pressed', String(visible));
      event.currentTarget.textContent = visible ? '🙈 隱藏連線' : '🔗 顯示連線';
      saveSandboxState(state);
      traceLine(root, visible ? '🔗 已顯示自訂場景連線。' : '🙈 已隱藏自訂場景連線；模擬請求仍會沿原路徑傳送。');
    });

    // "Does this actually connect to anything" answered for real: BFS over the edges the player
    // drew, then a genuine spawnToken animation along whatever path exists — reusing the exact
    // same engine machinery every scripted chapter's demo button uses, not a separate mechanic.
    root.querySelector('.sim-sandbox-simulate-btn')?.addEventListener('click', () => {
      const fromId = state.simFrom, toId = state.simTo;
      if (!fromId || !toId) { traceLine(root, '⚠️ 請先選擇起點與終點。', 'bad'); return; }
      const fromNode = state.nodes.find(n => n.id === fromId), toNode = state.nodes.find(n => n.id === toId);
      const path = sandboxFindPath(state, fromId, toId);
      if (!path) {
        traceLine(root, `❌ 找不到單向路徑：「${fromNode?.label}」無法走到「${toNode?.label}」。檢查箭頭方向，或補上缺少的連線。`, 'bad');
        return;
      }
      let payload;
      try { payload = JSON.parse(state.simPayload || '{}'); }
      catch { payload = { value: state.simPayload || '' }; }
      const payloadHint = String(payload.type || payload.kind || payload.action || '').toLowerCase();
      const payloadType = /video|影片/.test(payloadHint) ? 'video'
        : /file|upload|block|檔案|區塊/.test(payloadHint) ? 'file'
          : /metadata|data|資料/.test(payloadHint) ? 'metadata'
            : /notify|event|通知/.test(payloadHint) ? 'notification' : 'api';
      const request = Runtime?.beginRequest(state.runtime, {
        kind: 'request',
        label: `${fromNode?.label || fromId} → ${toNode?.label || toId}`,
        payload: { ...payload, from: fromId, to: toId }
      });
      const waypoints = path.map(id => { const n = state.nodes.find(x => x.id === id); return { x: n.x, y: n.y }; });
      traceLine(root, `— ${request?.id || 'Request'}：「${fromNode?.label}」→「${toNode?.label}」，共 ${waypoints.length - 1} 段單向連線；payload=${valueText(payload)} —`, 'head');
      refreshRuntimeSummary(root, {}, state);
      let previousId = '';
      spawnToken(svgEl, waypoints, {
        tokenClass: 'sim-token-demo',
        className: `payload-${payloadType}`,
        durationMs: 1600,
        onHop: idx => {
          const nodeId = path[idx];
          const node = state.nodes.find(x => x.id === nodeId);
          Runtime?.visitNode(state.runtime, request, nodeId, `抵達 ${node?.label || nodeId}`);
          const nodeEl = svgEl.querySelector(`[data-sandbox-node="${nodeId}"]`);
          nodeEl?.classList.add('receiving');
          setTimeout(() => nodeEl?.classList.remove('receiving'), 720);
          if (previousId) {
            const edge = svgEl.querySelector(`[data-sandbox-edge="${previousId}-${nodeId}"]`);
            edge?.classList.add('transmitting');
            setTimeout(() => edge?.classList.remove('transmitting'), 720);
          }
          previousId = nodeId;
          const store = sandboxEnsureNodeStore(state, node);
          if (store) {
            const tableId = Object.keys(store.tables)[0];
            Runtime.write(state.runtime, store.id, tableId, {
              request_id: request.id,
              from: fromId,
              to: toId,
              payload,
              received_at: new Date().toLocaleTimeString('zh-Hant-TW', { hour12: false })
            }, { key: 'request_id', requestId: request.id });
            const badge = svgEl.querySelector(`[data-sandbox-store-count="${store.id}"]`);
            if (badge) badge.textContent = `🗃 ${Runtime.tableRowCount(state.runtime, store.id)}`;
          }
          saveSandboxState(state);
          traceLine(root, `${request.id} 抵達「${node?.label || nodeId}」${store ? '，已寫入節點資料' : ''}`);
        },
        onDone: circle => {
          Runtime?.finishRequest(state.runtime, request, 'completed', '抵達目的節點');
          saveSandboxState(state);
          refreshRuntimeSummary(root, {}, state);
          traceLine(root, `— ${request?.id || 'Request'} 完成；先前的 request 與資料仍保留 —`, 'done');
          setTimeout(() => circle?.remove(), 320);
        }
      });
    });

    root.querySelector('.sim-sandbox-check-btn')?.addEventListener('click', () => {
      if (!state.nodes.length) { traceLine(root, '架構檢查：畫布上還沒有任何節點。', 'bad'); return; }
      const isolated = state.nodes.filter(n => !state.edges.some(e => e.from === n.id || e.to === n.id));
      if (!isolated.length) traceLine(root, `架構檢查：${state.nodes.length} 個節點都至少有一條連線，沒有孤立節點。`, 'ok');
      else traceLine(root, `⚠️ 架構檢查：發現 ${isolated.length} 個孤立節點（沒有任何連線）：${isolated.map(n => n.label).join('、')}。`, 'bad');
    });

    root.querySelector('.sim-sandbox-export-btn')?.addEventListener('click', () => {
      const data = JSON.stringify(sandboxSerializable(state), null, 2);
      try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'system-design-scene.json';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        traceLine(root, '⬇️ 已匯出完整場景（節點、單向連線、request 與資料表）為 system-design-scene.json。', 'done');
      } catch {
        traceLine(root, '⚠️ 這個瀏覽器不支援直接下載檔案，架構的 JSON 內容已印在瀏覽器主控台（console）。', 'bad');
        console.log(data);
      }
    });

    const importInput = root.querySelector('.sim-sandbox-import-file');
    root.querySelector('.sim-sandbox-import-btn')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const raw = JSON.parse(await file.text());
        if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) throw new Error('缺少 nodes / edges');
        const loaded = newSandboxState(raw);
        const ids = new Set(loaded.nodes.map(node => node.id));
        loaded.edges = loaded.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to);
        Object.assign(state, loaded);
        saveSandboxState(state);
        renderSandbox(root, state);
      } catch (error) {
        traceLine(root, `⚠️ 匯入失敗：${error?.message || 'JSON 格式不正確'}`, 'bad');
      }
    });

    const selected = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!selected) return;
    root.querySelector('.sim-sandbox-label-input')?.addEventListener('input', evt => {
      selected.label = evt.target.value;
      const store = selected.storeId && state.runtime.stores[selected.storeId];
      if (store) store.label = selected.label;
      saveSandboxState(state);
    });
    root.querySelector('.sim-sandbox-label-input')?.addEventListener('change', rerender);
    root.querySelector('.sim-sandbox-region-select')?.addEventListener('change', evt => { selected.region = evt.target.value; rerender(); });
    root.querySelectorAll('.sim-sandbox-conn-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        const targetId = cb.dataset.target;
        const idx = state.edges.findIndex(e => e.from === selected.id && e.to === targetId);
        if (cb.checked && idx === -1) state.edges.push({ from: selected.id, to: targetId });
        else if (!cb.checked && idx !== -1) state.edges.splice(idx, 1);
        rerender();
      });
    });
    root.querySelector('.sim-sandbox-delete')?.addEventListener('click', () => {
      if (selected.storeId) delete state.runtime.stores[selected.storeId];
      state.nodes = state.nodes.filter(n => n.id !== selected.id);
      state.edges = state.edges.filter(e => e.from !== selected.id && e.to !== selected.id);
      state.selectedNodeId = null;
      rerender();
    });
    root.querySelector('.sim-sandbox-close')?.addEventListener('click', () => {
      state.selectedNodeId = null;
      rerender();
    });
    root.querySelector('.sim-sandbox-inspect')?.addEventListener('click', () => {
      openDataInspector(root, {}, state, selected.storeId);
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
      const sandboxState = loadSandboxState();
      window.__simTestHooks.stateRef = () => sandboxState;
      renderSandbox(root, sandboxState);
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
    routeFor, distanceWeights, pathDurationMs, regionShare, instanceIsDown, aliveInstanceIndexes, nodeCanServe, topoOf
  };

  boot();
})();
