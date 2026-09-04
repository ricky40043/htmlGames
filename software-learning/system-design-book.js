(() => {
  const STORAGE_KEY = 'softwareSystemDesignBookProgressV1';
  const PASS_SCORE = 80;
  const DIFF_LABEL = { easy: '基礎', medium: '應用', hard: '進階' };
  const esc = v => String(v ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const shuffle = items => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { version: 1, chapters: {} }; }
    catch { return { version: 1, chapters: {} }; }
  }

  function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function emptyChapterState() {
    return { sections: {}, exam: { attempts: 0, bestScore: 0, lastScore: 0, passed: false } };
  }

  function chapterState(chapterId) {
    return load().chapters?.[chapterId] || emptyChapterState();
  }

  function saveSection(chapterId, sectionId, score, wrongIds) {
    const d = load();
    d.chapters[chapterId] ??= emptyChapterState();
    const c = d.chapters[chapterId];
    const old = c.sections[sectionId] || { attempts: 0, bestScore: 0, lastScore: 0, completed: false };
    c.sections[sectionId] = {
      ...old,
      completed: true,
      attempts: (old.attempts || 0) + 1,
      bestScore: Math.max(old.bestScore || 0, score),
      lastScore: score,
      wrongQuestionIds: wrongIds,
      updatedAt: new Date().toISOString()
    };
    save(d);
    return c.sections[sectionId];
  }

  function saveSectionCompletion(chapterId, sectionId, completed) {
    const d = load();
    d.chapters[chapterId] ??= emptyChapterState();
    const c = d.chapters[chapterId];
    const old = c.sections[sectionId] || { attempts: 0, bestScore: 0, lastScore: 0, completed: false };
    c.sections[sectionId] = {
      ...old,
      completed: !!completed,
      updatedAt: new Date().toISOString()
    };
    save(d);
    return c.sections[sectionId];
  }

  function saveChapterCompletion(chapterId, completed) {
    const d = load();
    d.chapters[chapterId] ??= emptyChapterState();
    d.chapters[chapterId].completed = !!completed;
    d.chapters[chapterId].updatedAt = new Date().toISOString();
    save(d);
    return d.chapters[chapterId];
  }

  function saveExam(chapterId, score, detail) {
    const d = load();
    d.chapters[chapterId] ??= emptyChapterState();
    const old = d.chapters[chapterId].exam || {};
    d.chapters[chapterId].exam = {
      ...old,
      attempts: (old.attempts || 0) + 1,
      bestScore: Math.max(old.bestScore || 0, score),
      lastScore: score,
      passed: old.passed || score >= PASS_SCORE,
      wrongQuestionIds: detail.wrongQuestionIds,
      difficultyStats: detail.difficultyStats,
      updatedAt: new Date().toISOString()
    };
    save(d);
    return d.chapters[chapterId].exam;
  }

  function catalog() { return window.SYSTEM_DESIGN_BOOK?.chapters || []; }

  function chapterData(id) {
    const n = Number(String(id || '').match(/(\d+)$/)?.[1] || 0);
    return window[`SYSTEM_DESIGN_CHAPTER_${String(n).padStart(2, '0')}`] || null;
  }

  function chapterMeta(id) { return catalog().find(c => c.id === id); }

  // How a chapter is NAMED on screen. `order` stays a plain running number because sequencing,
  // prev/next and the progress index all key off it; a chapter that comes from a different
  // volume just declares `volume`/`chapterNo` and is labelled by its own book instead of by its
  // position in this list.
  function chapterTag(c) {
    // Callers pass either a catalog entry or a loaded chapter object; the volume numbering only
    // lives in the catalog, so resolve back to it rather than duplicating the fields in the
    // chapter data files.
    const meta = (c?.volume && c?.chapterNo) ? c : (chapterMeta(c?.id) || c);
    if (meta?.volume && meta?.chapterNo) return `第 ${meta.volume} 冊第 ${meta.chapterNo} 章`;
    return `第 ${meta?.order ?? c?.order} 章`;
  }

  function shortSectionTitle(section) {
    const title = String(section?.title || '').trim();
    const localized = title.replace(/\s*[（(][^）)]*[）)]/g, '').trim();
    const parts = localized.split(/\s*[：:]\s*|\s*——\s*|\s+—\s+/).map(part => part.trim()).filter(Boolean);
    const generic = /^(?:step\s*\d+|requirements?|rehashing problem|question definition|先拆\s+requirements|問題定義|需求與|需求、規模)/i;
    const short = parts.length > 1 && generic.test(parts[0]) ? parts[1] : (parts[0] || title);
    if (!short || short.length <= 24) return short || title;
    const compact = short.split(/\s+(?:vs|and)\s+|\s+與\s+|、/i)[0].trim();
    return compact || short;
  }

  function shortChapterTitle(chapter) {
    const labels = {
      1: '使用者規模', 2: '粗略估算', 3: '面試框架', 4: '網路限速器',
      5: '一致性雜湊', 6: '鍵值儲存', 7: '唯一 ID', 8: '短網址',
      9: '網路爬蟲', 10: '通知系統', 11: '動態訊息', 12: '聊天系統',
      13: '搜尋自動補全', 14: '影片平台', 15: '雲端檔案同步', 16: '持續學習',
      17: '地圖與導航'
    };
    if (labels[chapter?.order]) return labels[chapter.order];
    const title = String(chapter?.title || '').trim();
    const short = title.split(/\s*——\s*|\s*：\s*|\s*:\s*/)[0].trim();
    return short && short.length <= 14 ? short : title;
  }

  function teachingGuide(chapter) {
    return window.SYSTEM_DESIGN_TEACHING_GUIDES?.[chapter?.id] || {};
  }

  function firstReadableBlock(page) {
    const block = (page?.blocks || []).find(item => item.type === 'lead' || item.type === 'p' || item.type === 'callout');
    if (!block) return '';
    return String(block.text || '').replace(/\s+/g, ' ').trim();
  }

  function pageTakeaway(page) {
    const text = firstReadableBlock(page);
    if (text.length <= 190) return text;
    return `${text.slice(0, 187).replace(/[，。；、\s]+$/, '')}…`;
  }

  function renderChapterTeachingGuide(chapter) {
    const guide = teachingGuide(chapter);
    const target = document.querySelector('#bookChapterGuide');
    if (!target) return;
    target.innerHTML = guide.purpose ? `
      <section class="book-teaching-guide book-chapter-teaching-guide">
        <div class="book-guide-kicker">這章要怎麼學</div>
        <h2>${esc(guide.title || '先理解問題，再記住元件')}</h2>
        <p class="book-guide-purpose">${esc(guide.purpose)}</p>
        <div class="book-guide-columns">
          <div><strong>閱讀順序</strong><ol>${(guide.steps || []).map(step => `<li>${esc(step)}</li>`).join('')}</ol></div>
          <div><strong>學完的判斷標準</strong><p>${esc(guide.outcome || '')}</p></div>
        </div>
      </section>` : '';
  }

  function renderSectionTeachingGuide(chapter, section, pageIdx) {
    const target = document.querySelector('#bookLearningGuide');
    if (!target) return;
    const guide = teachingGuide(chapter);
    const pages = section.pages || [];
    const current = pages[pageIdx];
    const firstQuestion = section.quiz?.[0]?.question || '這一節的元件要解決什麼問題？';
    target.innerHTML = `
      <section class="book-teaching-guide book-section-teaching-guide">
        <div class="book-guide-kicker">本節學習路線</div>
        <p><strong>先理解：</strong>${esc(section.summary || guide.purpose || '')}</p>
        <div class="book-section-roadmap">
          <div class="book-roadmap-list">
            ${pages.map((item, index) => `<a class="${index === pageIdx ? 'active' : ''}" href="${chapterHref(chapter.id, section.id, item.id)}"><span>${index + 1}</span><div><strong>${esc(item.title)}</strong><small>${index === pageIdx ? '你正在這一步' : '前往這一步'}</small></div></a>`).join('')}
          </div>
          <div class="book-guide-check">
            <strong>讀完先不要急著背</strong>
            <p>先用自己的話回答：${esc(firstQuestion)}</p>
            <small>目前：第 ${pageIdx + 1}/${pages.length} 步${current ? ` · ${esc(current.title)}` : ''}</small>
          </div>
        </div>
      </section>`;
  }

  function chapterHref(chapterId, sectionId, pageId = '') {
    const params = new URLSearchParams({ chapter: chapterId });
    if (sectionId) params.set('section', sectionId);
    if (pageId) params.set('page', pageId);
    return `system-design-chapter.html?${params.toString()}`;
  }

  function chapterEdgeHref(meta, edge = 'first') {
    const data = chapterData(meta?.id);
    const sections = data?.sections || [];
    const section = edge === 'last' ? sections[sections.length - 1] : sections[0];
    const pages = section?.pages || [];
    const page = edge === 'last' ? pages[pages.length - 1] : pages[0];
    return section && page ? chapterHref(meta.id, section.id, page.id) : `system-design-chapter.html?chapter=${encodeURIComponent(meta?.id || '')}`;
  }

  function pageIndexMap(chapter) {
    const map = new Map();
    let n = 1;
    (chapter?.sections || []).forEach(section => section.pages.forEach(page => {
      map.set(page.id, {
        number: n++,
        sectionId: section.id,
        sectionTitle: section.title,
        title: page.title
      });
    }));
    return map;
  }

  function blockHtml(block) {
    if (block.type === 'lead') return `<p class="book-lead">${esc(block.text)}</p>`;
    if (block.type === 'p') return `<p>${esc(block.text)}</p>`;
    if (block.type === 'bullets') return `<ul class="book-bullets">${block.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (block.type === 'diagram') return `<div class="book-diagram"><div class="diagram-chain">${block.nodes.map((n, i) => `<div class="book-node"><strong>${esc(n[0])}</strong><small>${esc(n[1] || '')}</small></div>${i < block.nodes.length - 1 ? '<span class="book-arrow">→</span>' : ''}`).join('')}</div>${block.caption ? `<p>${esc(block.caption)}</p>` : ''}</div>`;
    if (block.type === 'compare') return `<div class="book-compare">${block.items.map(x => `<article><h4>${esc(x[0])}</h4><p>${esc(x[1])}</p></article>`).join('')}</div>`;
    if (block.type === 'stepper') return `<div class="book-stepper">${block.steps.map((x, i) => `<article><span>${i + 1}</span><div><h4>${esc(x[0])}</h4><p>${esc(x[1])}</p></div></article>`).join('')}</div>`;
    if (block.type === 'code') return `<pre class="book-code"><code>${esc(block.text)}</code></pre>`;
    if (block.type === 'callout') return `<aside class="book-callout"><strong>${esc(block.title || '重點')}</strong><p>${esc(block.text)}</p></aside>`;
    if (block.type === 'table') {
      const head = block.head ? `<thead><tr>${block.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : '';
      const body = `<tbody>${(block.rows || []).map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
      const caption = block.caption ? `<p class="book-table-caption">${esc(block.caption)}</p>` : '';
      return `<div class="book-table-wrap"><table class="book-table">${head}${body}</table></div>${caption}`;
    }
    return '';
  }

  function prepareQuestion(q) {
    return { ...q, options: shuffle(q.options || []) };
  }

  function optionHtml(q) {
    return q.options.map(o => `<label class="book-option"><input type="radio" name="${esc(q.id)}" value="${esc(o.id)}"><span>${esc(o.text)}</span></label>`).join('');
  }

  function renderQuestion(q, index, extra = '') {
    return `<article class="book-question" data-qid="${esc(q.id)}"><div class="book-qmeta">第 ${index + 1} 題 ${extra}</div><h3>${esc(q.question)}</h3><div class="book-options">${optionHtml(q)}</div><div class="book-feedback" hidden></div></article>`;
  }

  function gradeQuestion(root, q, map, chapter) {
    const card = root.querySelector(`[data-qid="${CSS.escape(q.id)}"]`);
    const picked = card.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`);
    const selected = q.options.find(o => o.id === picked?.value);
    const correct = !!selected?.correct;
    card.classList.toggle('correct', correct);
    card.classList.toggle('incorrect', !correct);
    card.querySelectorAll('input').forEach(i => i.disabled = true);
    const feedback = card.querySelector('.book-feedback');
    feedback.hidden = false;
    const review = map.get(q.reviewPageId);

    if (correct) {
      feedback.innerHTML = `<b>✅ 正確</b><p>${esc(q.explanation)}</p>`;
    } else {
      const reason = selected?.misconception || '你可能還沒有把題目的限制條件與正確概念連起來。';
      feedback.innerHTML = `
        <b>❌ ${selected ? `你選了：${esc(selected.text)}` : '未作答'}</b>
        <p><strong>可能的思考誤區：</strong>${esc(reason)}</p>
        <p><strong>正確判斷：</strong>${esc(q.explanation)}</p>
        ${review ? `<a class="book-review-link" href="system-design-chapter.html?chapter=${encodeURIComponent(chapter.id)}&section=${encodeURIComponent(review.sectionId)}&page=${encodeURIComponent(q.reviewPageId)}&question=${encodeURIComponent(q.id)}&review=1">回到${chapterTag(chapter)}教材第 ${review.number} 頁，重做這一題：${esc(review.title)}</a>` : ''}`;
    }
    return { correct, selectedId: selected?.id || '' };
  }

  function chapterProgress(chapter) {
    const state = chapterState(chapter.id);
    const chapterCompleted = state.completed === true;
    const completed = chapterCompleted ? chapter.sections.length : chapter.sections.filter(s => state.sections[s.id]?.completed).length;
    return {
      state,
      chapterCompleted,
      completed,
      total: chapter.sections.length,
      percent: chapter.sections.length ? Math.round(completed / chapter.sections.length * 100) : 0
    };
  }

  function renderCompletionControls(chapter, section, progress) {
    const chapterActions = document.querySelector('#bookChapterActions');
    const sectionActions = document.querySelector('#bookSectionActions');
    const chapterDone = progress.chapterCompleted;
    const sectionDone = chapterDone || !!progress.state.sections[section.id]?.completed;

    chapterActions.innerHTML = `<button id="bookChapterComplete" class="button secondary book-completion-toggle" type="button" aria-pressed="${chapterDone}">${chapterDone ? '☑ 本章已完成' : '□ 標記本章全部完成'}</button>`;
    sectionActions.innerHTML = `<button id="bookSectionComplete" class="button secondary book-completion-toggle" type="button" aria-pressed="${sectionDone}" ${chapterDone ? 'disabled' : ''}>${sectionDone ? '☑ 本小節已完成' : '□ 標記本小節完成'}</button>${chapterDone ? '<small>已由本章完成狀態一併標記</small>' : ''}`;

    chapterActions.querySelector('#bookChapterComplete').onclick = () => {
      saveChapterCompletion(chapter.id, !chapterDone);
      renderChapter();
    };
    sectionActions.querySelector('#bookSectionComplete').onclick = () => {
      saveSectionCompletion(chapter.id, section.id, !sectionDone);
      renderChapter();
    };
  }

  function renderCatalog() {
    const root = document.querySelector('#bookChapterList');
    if (!root) return;
    root.innerHTML = catalog().map(meta => {
      const data = chapterData(meta.id);
      let status = '尚未製作';
      let detail = '依需求一次深入完成一章';
      let cls = 'planned';
      if (data) {
        const p = chapterProgress(data);
        status = p.state.exam?.passed ? '✅ 已通過' : p.chapterCompleted ? '☑ 本章已完成' : p.completed ? `📖 ${p.completed}/${p.total} 小節` : '可開始';
        detail = `${data.sections.length} 小節 · ${data.sections.reduce((n, s) => n + s.quiz.length, 0)} 題小節練習 · ${data.finalExam.length} 題章末考`;
        cls = 'ready';
      }
      const simBadge = meta.simulator ? `<a class="book-sim-badge" href="${esc(meta.simulator)}">🎮 模擬關卡</a>` : '';
      return `<div class="book-chapter-row">
        <a class="book-chapter-card ${cls}" href="system-design-chapter.html?chapter=${encodeURIComponent(meta.id)}"><div class="chapter-number">${chapterTag(meta)}</div><div><h2>${esc(meta.title)}</h2><p>${esc(detail)}</p></div><span>${esc(status)}</span></a>
        ${simBadge}
      </div>`;
    }).join('');
  }

  function renderChapter() {
    const params = new URLSearchParams(location.search);
    const chapterId = params.get('chapter') || 'sd-book-01';
    const meta = chapterMeta(chapterId);
    const chapter = chapterData(chapterId);
    const root = document.querySelector('#bookChapterRoot');

    if (!meta) {
      root.innerHTML = '<div class="empty-state"><h2>找不到章節</h2></div>';
      return;
    }

    if (!chapter) {
      const prev = catalog().find(c => c.order === meta.order - 1);
      const nextReady = catalog().find(c => c.order === meta.order + 1 && chapterData(c.id));
      root.innerHTML = `<section class="book-placeholder"><div class="chapter-number">${chapterTag(meta)}</div><h1>${esc(meta.title)}</h1><p>這一章尚未開始製作。依目前流程，會先把上一章研究、教材、小節題庫與 30 題章末考完整做完，再進入下一章。</p><div class="result-actions">${prev ? `<a class="button secondary" href="system-design-chapter.html?chapter=${encodeURIComponent(prev.id)}">回到${chapterTag(prev)}</a>` : ''}${nextReady ? `<a class="button" href="system-design-chapter.html?chapter=${encodeURIComponent(nextReady.id)}">前往${chapterTag(nextReady)}</a>` : ''}<a class="button secondary" href="system-design.html">回到章節目錄</a></div></section>`;
      return;
    }

    const map = pageIndexMap(chapter);
    const requestedSection = params.get('section');
    const section = chapter.sections.find(s => s.id === requestedSection) || chapter.sections[0];
    const requestedPage = params.get('page');
    let pageIdx = section.pages.findIndex(p => p.id === requestedPage);
    if (pageIdx < 0) pageIdx = 0;
    const page = section.pages[pageIdx];
    const progress = chapterProgress(chapter);

    document.title = `${chapterTag(chapter)}｜${shortSectionTitle(section)}`;
    document.querySelector('#bookChapterTitle').textContent = `${chapterTag(chapter)}｜${shortChapterTitle(chapter)}`;
    document.querySelector('#bookChapterSummary').textContent = chapter.subtitle;
    document.querySelector('#bookProgressText').textContent = `已完成 ${progress.completed}/${progress.total} 小節`;
    document.querySelector('#bookProgressFill').style.width = `${progress.percent}%`;
    renderChapterTeachingGuide(chapter);
    renderCompletionControls(chapter, section, progress);

    document.querySelector('#bookSectionNav').innerHTML = chapter.sections.map(s => {
      const done = progress.chapterCompleted || progress.state.sections[s.id]?.completed;
      return `<a class="${s.id === section.id ? 'active' : ''}" href="${chapterHref(chapter.id, s.id)}"><span>${done ? '✓' : s.order}</span><div><b>${esc(shortSectionTitle(s))}</b><small>${done ? '已完成' : '未完成'}</small></div></a>`;
    }).join('');

    document.querySelector('#bookSectionMeta').innerHTML = `<span>小節 ${section.order}/${chapter.sections.length}</span><span>${esc(section.duration)}</span><span>小節練習 ${section.quiz.length} 題</span>`;
    document.querySelector('#bookSectionTitle').textContent = shortSectionTitle(section);
    document.querySelector('#bookSectionSummary').textContent = section.summary;
    renderSectionTeachingGuide(chapter, section, pageIdx);

    const pInfo = map.get(page.id);
    document.querySelector('#bookPageCounter').textContent = `${chapterTag(chapter)}教材第 ${pInfo.number} 頁 · 本小節 ${pageIdx + 1}/${section.pages.length}`;
    const takeaway = pageTakeaway(page);
    document.querySelector('#bookPageStage').innerHTML = `<article class="book-page ${params.get('review') ? 'review-highlight' : ''}" id="${esc(page.id)}"><h2>${esc(page.title)}</h2><div class="book-page-purpose"><strong>這頁只先回答一件事</strong><p>先找出這個做法要解決的問題，再看它怎麼運作，以及它會帶來什麼代價。</p></div>${page.blocks.map(blockHtml).join('')}${takeaway ? `<aside class="book-page-takeaway"><strong>這頁先記住</strong><p>${esc(takeaway)}</p></aside>` : ''}</article>`;

    const sectionIdx = chapter.sections.findIndex(s => s.id === section.id);
    const previousSection = sectionIdx > 0 ? chapter.sections[sectionIdx - 1] : null;
    const nextSection = sectionIdx < chapter.sections.length - 1 ? chapter.sections[sectionIdx + 1] : null;
    const previousChapter = catalog().find(c => c.order === chapter.order - 1 && chapterData(c.id));
    const nextChapter = catalog().find(c => c.order === chapter.order + 1 && chapterData(c.id));
    const prev = pageIdx > 0 ? section.pages[pageIdx - 1] : null;
    const next = pageIdx < section.pages.length - 1 ? section.pages[pageIdx + 1] : null;
    const previousTarget = prev
        ? { href: chapterHref(chapter.id, section.id, prev.id), label: '上一頁' }
      : previousSection
        ? { href: chapterHref(chapter.id, previousSection.id, previousSection.pages[previousSection.pages.length - 1]?.id), label: '上一小節' }
        : previousChapter
          ? { href: chapterEdgeHref(previousChapter, 'last'), label: '上一章' }
          : null;
    const nextTarget = next
        ? { href: chapterHref(chapter.id, section.id, next.id), label: '下一頁' }
      : nextSection
        ? { href: chapterHref(chapter.id, nextSection.id, nextSection.pages[0]?.id), label: '下一小節' }
      : nextChapter
          ? { href: chapterEdgeHref(nextChapter, 'first'), label: '下一章' }
          : { href: `system-design-exam.html?chapter=${encodeURIComponent(chapter.id)}`, label: '進入章末考' };
    const pageDots = `<div class="book-page-dots">${section.pages.map((p, i) => `<a class="${i === pageIdx ? 'active' : ''}" href="${chapterHref(chapter.id, section.id, p.id)}" aria-label="第 ${i + 1} 頁"></a>`).join('')}</div>`;
    const chapterBack = '<a class="button secondary book-chapter-back" href="system-design.html" aria-label="回到章節目錄">回到章節目錄</a>';
    const renderPageControls = () => `<div class="book-page-control-side">${previousTarget ? `<a class="button secondary" href="${previousTarget.href}">${esc(previousTarget.label)}</a>` : '<span></span>'}</div>${pageDots}<div class="book-page-control-actions">${nextTarget ? `<a class="button" href="${nextTarget.href}">${esc(nextTarget.label)}</a>` : '<span></span>'}${chapterBack}</div>`;
    document.querySelector('#bookTopControls').innerHTML = renderPageControls();
    document.querySelector('#bookPageControls').innerHTML = renderPageControls();

    document.querySelector('#bookResearch').innerHTML = `<details><summary>本小節研究依據</summary>${(section.research || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.label)}</a>`).join('')}</details>`;

    const quizRoot = document.querySelector('#bookSectionQuiz');
    const requestedQuestion = params.get('question');
    if (pageIdx === section.pages.length - 1 || requestedQuestion) renderSectionQuiz(chapter, section, quizRoot, map, requestedQuestion);
    else quizRoot.innerHTML = '<div class="book-next-hint">讀完本小節最後一頁後，會出現 3–5 題小節練習。</div>';
  }

  function renderSectionQuiz(chapter, section, root, map, requestedQuestionId = '') {
    const requestedQuestion = section.quiz.find(q => q.id === requestedQuestionId) || chapter.finalExam.find(q => q.id === requestedQuestionId);
    const singleReview = !!requestedQuestion;
    const examReview = singleReview && chapter.finalExam.some(q => q.id === requestedQuestion.id);
    const questions = shuffle(singleReview ? [requestedQuestion] : section.quiz).map(prepareQuestion);
    const quizTitle = singleReview ? `${examReview ? '章末考' : ''}錯題複習` : '小節練習';
    const quizDescription = singleReview
      ? '這裡只重做你剛才答錯的這一題；不會重新要求你完成整個小節。'
      : `先回想本節的因果關係，再作答 ${questions.length} 題。送出後會逐題說明錯在哪裡，並提供回教材複習的頁面。`;
    const submitLabel = singleReview ? '送出這一題' : '送出小節練習';
    const quizBridge = singleReview ? '' : `<div class="book-quiz-bridge"><strong>開始前的小結</strong><p>如果你還不能用一句話說明「這一節解決什麼問題、為什麼不能只用原本的方法」，先回到上方學習路線重看，不用急著猜。</p></div>`;
    root.innerHTML = `<header><span>${quizTitle}</span><h2>${esc(shortSectionTitle(section))}</h2><p>${quizDescription}</p></header>${quizBridge}<div class="book-quiz-list">${questions.map((q, i) => renderQuestion(q, i)).join('')}</div><button class="button book-submit" type="button">${submitLabel}</button><div class="book-quiz-result" hidden></div>`;

    root.querySelector('.book-submit').onclick = () => {
      let correct = 0;
      const wrong = [];
      questions.forEach(q => {
        const r = gradeQuestion(root, q, map, chapter);
        if (r.correct) correct++;
        else wrong.push(q.id);
      });
      window.refreshBookTerms?.();
      const score = Math.round(correct / questions.length * 100);
      const saved = singleReview ? null : saveSection(chapter.id, section.id, score, wrong);
      if (!singleReview) renderCompletionControls(chapter, section, chapterProgress(chapter));
      const idx = chapter.sections.findIndex(s => s.id === section.id);
      const nextSection = chapter.sections[idx + 1];
      const result = root.querySelector('.book-quiz-result');
      result.hidden = false;
      const fullQuizHref = examReview
        ? `system-design-exam.html?chapter=${encodeURIComponent(chapter.id)}`
        : chapterHref(chapter.id, section.id, section.pages[section.pages.length - 1]?.id);
      result.innerHTML = singleReview
        ? `<div class="book-result-score">${score === 100 ? '答對了' : '再想一下'}</div><p>${score === 100 ? '這題已答對，可以繼續閱讀教材。' : '這次仍未答對，可以再試一次或回到教材。'}</p><div class="result-actions"><a class="button secondary" href="${fullQuizHref}">${examReview ? '回到章末考全部題目' : '回到本小節全部題目'}</a><button class="button" onclick="location.reload()">再答一次</button></div>`
        : `<div class="book-result-score">${score} 分</div><p>答對 ${correct}/${questions.length} · 本小節最高 ${saved.bestScore} 分</p><div class="result-actions">${nextSection ? `<a class="button" href="${chapterHref(chapter.id, nextSection.id)}">進入下一小節</a>` : `<a class="button" href="system-design-exam.html?chapter=${chapter.id}">進入章末考</a>`}<button class="button secondary" onclick="location.reload()">重新練習</button></div>`;
      root.querySelector('.book-submit').disabled = true;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  function renderExam() {
    const params = new URLSearchParams(location.search);
    const chapterId = params.get('chapter') || 'sd-book-01';
    const chapter = chapterData(chapterId);
    const root = document.querySelector('#bookExamRoot');
    if (!chapter) {
      root.innerHTML = '<div class="empty-state"><h2>此章尚無章末考</h2><a class="button" href="system-design.html">回章節目錄</a></div>';
      return;
    }

    const map = pageIndexMap(chapter);
    const groups = ['easy', 'medium', 'hard'];
    const questions = groups.flatMap(d => shuffle(chapter.finalExam.filter(q => q.difficulty === d)).slice(0, 10).map(prepareQuestion));

    document.querySelector('#bookExamTitle').textContent = `${chapterTag(chapter)}｜${chapter.title}`;
    document.querySelector('#bookExamInfo').textContent = `${questions.length} 題章末測驗 · 基礎 10 / 應用 10 / 進階 10 · ${PASS_SCORE} 分通過 · 題目與選項每次重新洗牌`;

    let n = 0;
    const form = document.querySelector('#bookExamForm');
    form.innerHTML = groups.map(d => {
      const qs = questions.filter(q => q.difficulty === d);
      return `<section class="book-exam-group"><div class="book-diff-title"><h2>${DIFF_LABEL[d]}題</h2><span>${qs.length} 題</span></div>${qs.map(q => renderQuestion(q, n++, `· ${DIFF_LABEL[d]}`)).join('')}</section>`;
    }).join('');

    document.querySelector('#bookExamSubmit').onclick = () => {
      let correct = 0;
      const wrong = [];
      const stats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
      questions.forEach(q => {
        stats[q.difficulty].total++;
        const r = gradeQuestion(form, q, map, chapter);
        if (r.correct) {
          correct++;
          stats[q.difficulty].correct++;
        } else wrong.push(q.id);
      });
      window.refreshBookTerms?.();

      const score = Math.round(correct / questions.length * 100);
      const saved = saveExam(chapter.id, score, { wrongQuestionIds: wrong, difficultyStats: stats });
      const result = document.querySelector('#bookExamResult');
      result.hidden = false;
      const nextMeta = catalog().find(c => c.order === chapter.order + 1);
      const currentMeta = chapterMeta(chapter.id);
      const simCta = score >= PASS_SCORE && currentMeta?.simulator ? `<a class="button" href="${esc(currentMeta.simulator)}">🎮 挑戰本章模擬關卡</a>` : '';
      const statHtml = groups.map(d => `<div><small>${DIFF_LABEL[d]}</small><strong>${stats[d].correct}/${stats[d].total} · ${stats[d].total ? Math.round(stats[d].correct / stats[d].total * 100) : 0}%</strong></div>`).join('');
      result.innerHTML = `<div class="book-result-score">${score} 分</div><p>${score >= PASS_SCORE ? `✅ ${chapterTag(chapter)}通過` : `尚未通過${chapterTag(chapter)}；先依錯題連結回教材複習。`}</p><div class="difficulty-result-grid">${statHtml}</div><p>答對 ${correct}/${questions.length} · 章末考 ${saved.attempts} 次 · 最高 ${saved.bestScore} 分</p><div class="result-actions">${simCta}<a class="button secondary" href="system-design-chapter.html?chapter=${chapter.id}">回到${chapterTag(chapter)}</a>${nextMeta ? `<a class="button" href="system-design-chapter.html?chapter=${nextMeta.id}">進入下一章</a>` : `<a class="button" href="system-design.html">完成全書</a>`}<button class="button secondary" type="button" onclick="location.reload()">重新抽題再考</button></div>`;
      document.querySelector('#bookExamSubmit').disabled = true;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  const page = document.body.dataset.bookPage;
  if (page === 'catalog') renderCatalog();
  if (page === 'chapter') renderChapter();
  if (page === 'exam') renderExam();
})();
