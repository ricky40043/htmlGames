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

  function shortSectionTitle(section) {
    const title = String(section?.title || '').trim();
    const localized = title.replace(/\s*[（(][^）)]*[）)]/g, '').trim();
    const short = localized.split(/\s*[：:]\s*|\s*——\s*|\s+—\s+/)[0].trim();
    if (!short || short.length <= 24) return short || title;
    const compact = short.split(/\s+(?:vs|and)\s+|\s+與\s+|、/i)[0].trim();
    return compact || short;
  }

  function chapterHref(chapterId, sectionId, pageId = '') {
    const params = new URLSearchParams({ chapter: chapterId });
    if (sectionId) params.set('section', sectionId);
    if (pageId) params.set('page', pageId);
    return `system-design-chapter.html?${params.toString()}`;
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
        ${review ? `<a class="book-review-link" href="system-design-chapter.html?chapter=${encodeURIComponent(chapter.id)}&section=${encodeURIComponent(review.sectionId)}&page=${encodeURIComponent(q.reviewPageId)}&review=1">回 Chapter ${chapter.order} 教材第 ${review.number} 頁：${esc(review.title)}</a>` : ''}`;
    }
    return { correct, selectedId: selected?.id || '' };
  }

  function chapterProgress(chapter) {
    const state = chapterState(chapter.id);
    const completed = chapter.sections.filter(s => state.sections[s.id]?.completed).length;
    return {
      state,
      completed,
      total: chapter.sections.length,
      percent: chapter.sections.length ? Math.round(completed / chapter.sections.length * 100) : 0
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
        status = p.state.exam?.passed ? '✅ 已通過' : p.completed ? `📖 ${p.completed}/${p.total} 小節` : '可開始';
        detail = `${data.sections.length} 小節 · ${data.sections.reduce((n, s) => n + s.quiz.length, 0)} 題小節練習 · ${data.finalExam.length} 題章末考`;
        cls = 'ready';
      }
      return `<a class="book-chapter-card ${cls}" href="system-design-chapter.html?chapter=${encodeURIComponent(meta.id)}"><div class="chapter-number">Chapter ${meta.order}</div><div><h2>${esc(meta.title)}</h2><p>${esc(detail)}</p></div><span>${esc(status)} ›</span></a>`;
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
      root.innerHTML = `<section class="book-placeholder"><div class="chapter-number">Chapter ${meta.order}</div><h1>${esc(meta.title)}</h1><p>這一章尚未開始製作。依目前流程，會先把上一章研究、教材、小節題庫與 30 題章末考完整做完，再進入下一章。</p><div class="result-actions">${prev ? `<a class="button secondary" href="system-design-chapter.html?chapter=${encodeURIComponent(prev.id)}">回 Chapter ${prev.order}</a>` : ''}${nextReady ? `<a class="button" href="system-design-chapter.html?chapter=${encodeURIComponent(nextReady.id)}">前往 Chapter ${nextReady.order}</a>` : ''}<a class="button secondary" href="system-design.html">回 16 Chapter 目錄</a></div></section>`;
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

    document.title = `Chapter ${chapter.order}｜${shortSectionTitle(section)}`;
    document.querySelector('#bookChapterTitle').textContent = `Chapter ${chapter.order}｜${chapter.title}`;
    document.querySelector('#bookChapterSummary').textContent = chapter.subtitle;
    document.querySelector('#bookProgressText').textContent = `已完成 ${progress.completed}/${progress.total} 小節`;
    document.querySelector('#bookProgressFill').style.width = `${progress.percent}%`;

    document.querySelector('#bookSectionNav').innerHTML = chapter.sections.map(s => {
      const done = progress.state.sections[s.id]?.completed;
      return `<a class="${s.id === section.id ? 'active' : ''}" href="${chapterHref(chapter.id, s.id)}"><span>${done ? '✓' : s.order}</span><div><b>${esc(shortSectionTitle(s))}</b><small>${done ? '已完成' : '未完成'}</small></div></a>`;
    }).join('');

    document.querySelector('#bookSectionMeta').innerHTML = `<span>小節 ${section.order}/${chapter.sections.length}</span><span>${esc(section.duration)}</span><span>小節練習 ${section.quiz.length} 題</span>`;
    document.querySelector('#bookSectionTitle').textContent = shortSectionTitle(section);
    document.querySelector('#bookSectionSummary').textContent = section.summary;

    const pInfo = map.get(page.id);
    document.querySelector('#bookPageCounter').textContent = `Chapter ${chapter.order} 教材第 ${pInfo.number} 頁 · 本小節 ${pageIdx + 1}/${section.pages.length}`;
    document.querySelector('#bookPageStage').innerHTML = `<article class="book-page ${params.get('review') ? 'review-highlight' : ''}" id="${esc(page.id)}"><h2>${esc(page.title)}</h2>${page.blocks.map(blockHtml).join('')}</article>`;

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
          ? { href: chapterHref(previousChapter.id, previousChapter.sections[previousChapter.sections.length - 1]?.id, previousChapter.sections[previousChapter.sections.length - 1]?.pages[previousChapter.sections[previousChapter.sections.length - 1].pages.length - 1]?.id), label: '上一章' }
          : null;
    const nextTarget = next
      ? { href: chapterHref(chapter.id, section.id, next.id), label: '下一頁' }
      : nextSection
        ? { href: chapterHref(chapter.id, nextSection.id, nextSection.pages[0]?.id), label: '下一小節' }
        : nextChapter
          ? { href: chapterHref(nextChapter.id, nextChapter.sections[0]?.id, nextChapter.sections[0]?.pages[0]?.id), label: '下一章' }
          : { href: `system-design-exam.html?chapter=${encodeURIComponent(chapter.id)}`, label: '進入章末考' };
    const pageDots = `<div class="book-page-dots">${section.pages.map((p, i) => `<a class="${i === pageIdx ? 'active' : ''}" href="${chapterHref(chapter.id, section.id, p.id)}" aria-label="第 ${i + 1} 頁"></a>`).join('')}</div>`;
    const chapterBack = '<a class="button secondary book-chapter-back" href="system-design.html" aria-label="回到章節">回到章節</a>';
    const renderPageControls = () => `${previousTarget ? `<a class="button secondary" href="${previousTarget.href}">${esc(previousTarget.label)}</a>` : '<span></span>'}${pageDots}${nextTarget ? `<a class="button" href="${nextTarget.href}">${esc(nextTarget.label)}</a>` : '<span></span>'}`;
    document.querySelector('#bookTopControls').innerHTML = `${renderPageControls()}${chapterBack}`;
    document.querySelector('#bookPageControls').innerHTML = `${renderPageControls()}${chapterBack}`;

    document.querySelector('#bookResearch').innerHTML = `<details><summary>本小節研究依據</summary>${(section.research || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.label)}</a>`).join('')}</details>`;

    const quizRoot = document.querySelector('#bookSectionQuiz');
    if (pageIdx === section.pages.length - 1) renderSectionQuiz(chapter, section, quizRoot, map);
    else quizRoot.innerHTML = '<div class="book-next-hint">讀完本小節最後一頁後，會出現 3–5 題小節練習。</div>';
  }

  function renderSectionQuiz(chapter, section, root, map) {
    const questions = shuffle(section.quiz).map(prepareQuestion);
    root.innerHTML = `<header><span>小節練習</span><h2>${esc(shortSectionTitle(section))}</h2><p>${questions.length} 題。送出後會逐題診斷錯誤思路，並指出應回 Chapter ${chapter.order} 教材第幾頁複習。</p></header><div class="book-quiz-list">${questions.map((q, i) => renderQuestion(q, i)).join('')}</div><button class="button book-submit" type="button">送出小節練習</button><div class="book-quiz-result" hidden></div>`;

    root.querySelector('.book-submit').onclick = () => {
      let correct = 0;
      const wrong = [];
      questions.forEach(q => {
        const r = gradeQuestion(root, q, map, chapter);
        if (r.correct) correct++;
        else wrong.push(q.id);
      });
      const score = Math.round(correct / questions.length * 100);
      const saved = saveSection(chapter.id, section.id, score, wrong);
      const idx = chapter.sections.findIndex(s => s.id === section.id);
      const nextSection = chapter.sections[idx + 1];
      const result = root.querySelector('.book-quiz-result');
      result.hidden = false;
      result.innerHTML = `<div class="book-result-score">${score} 分</div><p>答對 ${correct}/${questions.length} · 本小節最高 ${saved.bestScore} 分</p><div class="result-actions">${nextSection ? `<a class="button" href="${chapterHref(chapter.id, nextSection.id)}">進入下一小節</a>` : `<a class="button" href="system-design-exam.html?chapter=${chapter.id}">進入章末考</a>`}<button class="button secondary" onclick="location.reload()">重新練習</button></div>`;
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

    document.querySelector('#bookExamTitle').textContent = `Chapter ${chapter.order}｜${chapter.title}`;
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

      const score = Math.round(correct / questions.length * 100);
      const saved = saveExam(chapter.id, score, { wrongQuestionIds: wrong, difficultyStats: stats });
      const result = document.querySelector('#bookExamResult');
      result.hidden = false;
      const nextMeta = catalog().find(c => c.order === chapter.order + 1);
      const statHtml = groups.map(d => `<div><small>${DIFF_LABEL[d]}</small><strong>${stats[d].correct}/${stats[d].total} · ${stats[d].total ? Math.round(stats[d].correct / stats[d].total * 100) : 0}%</strong></div>`).join('');
      result.innerHTML = `<div class="book-result-score">${score} 分</div><p>${score >= PASS_SCORE ? `✅ Chapter ${chapter.order} 通過` : `尚未通過 Chapter ${chapter.order}；先依錯題連結回教材複習。`}</p><div class="difficulty-result-grid">${statHtml}</div><p>答對 ${correct}/${questions.length} · 章末考 ${saved.attempts} 次 · 最高 ${saved.bestScore} 分</p><div class="result-actions"><a class="button secondary" href="system-design-chapter.html?chapter=${chapter.id}">回 Chapter ${chapter.order}</a>${nextMeta ? `<a class="button" href="system-design-chapter.html?chapter=${nextMeta.id}">進入下一章</a>` : `<a class="button" href="system-design.html">完成全書</a>`}<button class="button secondary" type="button" onclick="location.reload()">重新抽題再考</button></div>`;
      document.querySelector('#bookExamSubmit').disabled = true;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  const page = document.body.dataset.bookPage;
  if (page === 'catalog') renderCatalog();
  if (page === 'chapter') renderChapter();
  if (page === 'exam') renderExam();
})();
