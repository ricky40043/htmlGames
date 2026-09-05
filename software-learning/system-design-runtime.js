(() => {
  'use strict';

  // One 10 GB Drive example contains 2,560 four-megabyte blocks. Keep enough rows to inspect
  // that complete upload plus later versions instead of silently truncating the lesson at 500.
  const MAX_TABLE_ROWS = 10000;

  const clone = value => {
    if (value == null) return value;
    try { return structuredClone(value); }
    catch {
      try { return JSON.parse(JSON.stringify(value)); }
      catch { return value; }
    }
  };

  const nowStamp = () => new Date().toLocaleTimeString('zh-Hant-TW', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  function normalizeTable(table = {}) {
    return {
      id: table.id || 'records',
      label: table.label || table.id || 'records',
      key: table.key || '',
      schema: clone(table.schema || []),
      rows: clone(table.seed || table.rows || [])
    };
  }

  function normalizeStore(store = {}) {
    const tables = {};
    const sourceTables = Array.isArray(store.tables) ? store.tables : Object.values(store.tables || {});
    sourceTables.forEach(table => { tables[table.id] = normalizeTable(table); });
    return {
      id: store.id,
      nodeId: store.nodeId || store.id,
      label: store.label || store.id,
      kind: store.kind || 'database',
      description: store.description || '',
      tables,
      operations: []
    };
  }

  function createRuntime(dataModel = {}) {
    const stores = {};
    (dataModel.stores || []).forEach(store => { stores[store.id] = normalizeStore(store); });
    return {
      requestSeq: 0,
      counts: {},
      requests: [],
      nodeActivity: {},
      routeCursor: {},
      stores
    };
  }

  function hydrateRuntime(saved, dataModel = {}) {
    const fresh = createRuntime(dataModel);
    if (!saved || typeof saved !== 'object') return fresh;
    fresh.requestSeq = Number(saved.requestSeq) || 0;
    fresh.counts = { ...(saved.counts || {}) };
    fresh.requests = clone(saved.requests || []).slice(0, 100);
    fresh.nodeActivity = clone(saved.nodeActivity || {});
    fresh.routeCursor = { ...(saved.routeCursor || {}) };
    Object.entries(saved.stores || {}).forEach(([storeId, oldStore]) => {
      if (!fresh.stores[storeId]) fresh.stores[storeId] = normalizeStore(oldStore);
      const store = fresh.stores[storeId];
      store.operations = clone(oldStore.operations || []).slice(0, 100);
      Object.entries(oldStore.tables || {}).forEach(([tableId, oldTable]) => {
        if (!store.tables[tableId]) store.tables[tableId] = normalizeTable(oldTable);
        store.tables[tableId].rows = clone(oldTable.rows || []).slice(-MAX_TABLE_ROWS);
      });
    });
    return fresh;
  }

  function beginRequest(runtime, spec = {}) {
    const seq = ++runtime.requestSeq;
    const kind = spec.kind || 'request';
    runtime.counts[kind] = (runtime.counts[kind] || 0) + 1;
    const request = {
      id: spec.id || `REQ-${String(seq).padStart(3, '0')}`,
      seq,
      kind,
      label: spec.label || kind,
      payload: clone(spec.payload || {}),
      region: spec.region || '',
      status: 'running',
      currentNodeId: '',
      startedAt: nowStamp(),
      finishedAt: '',
      hops: []
    };
    runtime.requests.unshift(request);
    if (runtime.requests.length > 100) runtime.requests.length = 100;
    return request;
  }

  function visitNode(runtime, request, nodeId, detail = '') {
    if (!runtime || !request || !nodeId) return;
    const hop = { nodeId, detail, at: nowStamp() };
    request.currentNodeId = nodeId;
    request.hops.push(hop);
    const activity = runtime.nodeActivity[nodeId] ??= [];
    activity.unshift({
      requestId: request.id,
      kind: request.kind,
      label: request.label,
      detail,
      payload: clone(request.payload),
      status: request.status,
      at: hop.at
    });
    if (activity.length > 80) activity.length = 80;
  }

  function finishRequest(runtime, request, status = 'completed', detail = '') {
    if (!runtime || !request) return request;
    request.status = status;
    request.finishedAt = nowStamp();
    request.result = detail;
    request.currentNodeId = '';
    new Set(request.hops.map(hop => hop.nodeId)).forEach(nodeId => {
      (runtime.nodeActivity[nodeId] || []).forEach(hit => {
        if (hit.requestId === request.id) hit.status = status;
      });
    });
    return request;
  }

  function ensureStore(runtime, storeId, defaults = {}) {
    if (!runtime || !storeId) return null;
    if (!runtime.stores[storeId]) runtime.stores[storeId] = normalizeStore({ id: storeId, ...defaults });
    return runtime.stores[storeId];
  }

  function ensureTable(store, tableId, defaults = {}) {
    if (!store || !tableId) return null;
    if (!store.tables[tableId]) store.tables[tableId] = normalizeTable({ id: tableId, ...defaults });
    return store.tables[tableId];
  }

  function write(runtime, storeId, tableId, row, options = {}) {
    const store = ensureStore(runtime, storeId, options.store || {});
    const table = ensureTable(store, tableId, options.table || {});
    if (!store || !table) return null;
    const key = options.key || table.key;
    const next = clone(row || {});
    let mode = 'INSERT';
    if (key && next[key] != null) {
      const idx = table.rows.findIndex(old => old?.[key] === next[key]);
      if (idx >= 0) {
        table.rows[idx] = { ...table.rows[idx], ...next };
        mode = 'UPDATE';
      } else table.rows.push(next);
    } else table.rows.push(next);
    if (table.rows.length > MAX_TABLE_ROWS) table.rows.splice(0, table.rows.length - MAX_TABLE_ROWS);
    store.operations.unshift({
      at: nowStamp(), mode, tableId, requestId: options.requestId || '', row: next
    });
    if (store.operations.length > 100) store.operations.length = 100;
    return next;
  }

  function tableRowCount(runtime, storeId) {
    const store = runtime?.stores?.[storeId];
    if (!store) return 0;
    return Object.values(store.tables).reduce((sum, table) => sum + table.rows.length, 0);
  }

  function pickRoundRobin(runtime, poolId, candidates) {
    if (!candidates?.length) return null;
    const cursor = runtime.routeCursor[poolId] || 0;
    const picked = candidates[cursor % candidates.length];
    runtime.routeCursor[poolId] = cursor + 1;
    return picked;
  }

  // The chapter pages and the simulator use the same request vocabulary. This helper animates
  // HTML teaching diagrams while the simulator uses the same begin/visit/finish lifecycle for
  // its SVG packets.
  function animateSequence(container, options = {}) {
    if (!container) return;
    const steps = [...container.querySelectorAll('[data-flow-step]')];
    const arrows = [...container.querySelectorAll('[data-flow-arrow]')];
    if (!steps.length) return;
    const generation = Number(container.dataset.flowGeneration || 0) + 1;
    container.dataset.flowGeneration = String(generation);
    steps.forEach(el => el.classList.remove('active', 'visited'));
    arrows.forEach(el => el.classList.remove('active'));
    const status = container.querySelector('[data-flow-status]');
    const payload = options.payload || container.dataset.flowPayload || 'request payload';
    let index = 0;
    const interval = Math.max(180, Number(options.interval || 620));
    const advance = () => {
      if (Number(container.dataset.flowGeneration) !== generation) return;
      steps.forEach((el, i) => {
        el.classList.toggle('active', i === index);
        if (i < index) el.classList.add('visited');
      });
      arrows.forEach((el, i) => el.classList.toggle('active', i < index));
      const title = steps[index]?.querySelector('strong')?.textContent || `步驟 ${index + 1}`;
      if (status) status.textContent = `${payload} → ${title}`;
      options.onStep?.(index, steps[index]);
      index += 1;
      if (index < steps.length) setTimeout(advance, interval);
      else setTimeout(() => {
        if (Number(container.dataset.flowGeneration) !== generation) return;
        steps.forEach(el => { el.classList.remove('active'); el.classList.add('visited'); });
        arrows.forEach(el => el.classList.add('active'));
        if (status) status.textContent = `✅ ${payload} 已走完整條路徑`;
        options.onDone?.();
      }, interval);
    };
    advance();
  }

  window.SystemDesignRuntime = Object.freeze({
    createRuntime,
    hydrateRuntime,
    beginRequest,
    visitNode,
    finishRequest,
    write,
    ensureStore,
    ensureTable,
    tableRowCount,
    pickRoundRobin,
    animateSequence,
    clone
  });
})();
