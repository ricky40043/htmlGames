(() => {
  const STORAGE_KEY = 'softwareSystemDesignSimProgressV1';
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
      month: 0, uptime: 100, qoe: 100, costEff: 100, active,
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

  // Small inline SVG line chart tracing uptime/QoE across the months played so far —
  // this is the "what actually happened over time" view, not just the current numbers.
  function historyChart(history, months, lab) {
    const w = 600, h = 140, padL = 8, padR = 8, padT = 10, padB = 22;
    const x = m => padL + (w - padL - padR) * (m / months);
    const y = v => padT + (h - padT - padB) * (1 - clamp(v) / 100);
    const line = key => history.map(p => `${x(p.month).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const gridY = [0, 50, 100].map(v => `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" class="sim-chart-grid"/><text x="${w - padR}" y="${y(v) - 3}" class="sim-chart-axis" text-anchor="end">${v}</text>`).join('');
    const markers = ptKey => history.map(p => `<circle cx="${x(p.month).toFixed(1)}" cy="${y(p[ptKey]).toFixed(1)}" r="3" class="sim-chart-dot ${ptKey}"/>`).join('');
    const monthTicks = history.map(p => `<text x="${x(p.month).toFixed(1)}" y="${h - 6}" class="sim-chart-axis" text-anchor="middle">${p.month}</text>`).join('');
    return `<div class="sim-chart-wrap">
      <div class="sim-chart-legend"><span class="uptime">— ${esc(lab.uptime.split(' ')[0])}</span><span class="qoe">— ${esc(lab.qoe.split(' ')[0])}</span></div>
      <svg class="sim-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(lab.uptime)}與${esc(lab.qoe)}歷史趨勢">
        ${gridY}
        <polyline points="${line('uptime')}" class="sim-chart-line uptime" fill="none"/>
        <polyline points="${line('qoe')}" class="sim-chart-line qoe" fill="none"/>
        ${markers('uptime')}${markers('qoe')}
        ${monthTicks}
      </svg>
    </div>`;
  }

  function componentCard(sim, state, comp, highlightIds) {
    const on = state.active.has(comp.id);
    const costLabel = comp.cost > 0 ? `消耗營運效率 ${comp.cost}/月` : comp.cost < 0 ? `提升營運效率 ${-comp.cost}/月` : '不影響營運效率';
    const flagged = highlightIds && highlightIds.includes(comp.id);
    return `<article class="sim-comp ${on ? 'on' : ''} ${flagged ? 'flagged' : ''}" data-comp="${esc(comp.id)}">
      <header>
        <label class="sim-toggle">
          <input type="checkbox" data-comp-toggle="${esc(comp.id)}" ${on ? 'checked' : ''}>
          <span>${esc(comp.name)}</span>
        </label>
        <small>${esc(costLabel)}</small>
      </header>
      <p>${esc(comp.desc)}</p>
      <a class="sim-ref-link" href="${reviewHref(sim.chapterId, comp.sectionId, comp.pageId)}" target="_blank" rel="noreferrer">教材對照 →</a>
    </article>`;
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
      ${historyChart(state.history, sim.months, lab)}
      <div class="sim-comp-grid">${sim.components.map(c => componentCard(sim, state, c)).join('')}</div>
      ${nextEvent ? `<div class="sim-hint">下個月可能會發生足以考驗架構的事件——先決定好要不要調整能力配置。</div>` : ''}
      <button class="button sim-advance" type="button">${state.month >= sim.months ? '查看今年總結' : `推進到第 ${state.month + 1} 個月`}</button>
      ${state.log.length ? `<section class="sim-log"><h2>即時事件紀錄</h2><ul>${state.log.map(e => logEntry(sim, e)).join('')}</ul></section>` : ''}
    </section>`;

    root.querySelectorAll('[data-comp-toggle]').forEach(input => {
      input.onchange = () => {
        const id = input.dataset.compToggle;
        if (input.checked) state.active.add(id); else state.active.delete(id);
        render(root, sim, state);
      };
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
      <p class="sim-event-hint">結果由你這幾個月裝上的架構能力決定，現在已經來不及調整。</p>
      <button class="button sim-resolve" type="button">查看結果</button>
    </section>`;
    root.querySelector('.sim-resolve').onclick = () => {
      const outcome = event.resolve(state.active);
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
      state.pendingEvent = null;
      state.phase = 'play';
      render(root, sim, state);
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
      ${historyChart(state.history, sim.months, lab)}
      <p class="sim-best">歷史最高：${saved.bestScore} 分 · 已挑戰 ${saved.attempts} 次</p>
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

  boot();
})();
