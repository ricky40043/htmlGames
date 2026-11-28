const LearningStore = (() => {
  const STORAGE_KEY = 'softwareLearningProgressV1';
  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { lessons: {} }; } catch { return { lessons: {} }; } }
  function getLessonProgress(lessonId) { return load().lessons[lessonId] || { viewed:false, passed:false, bestScore:0, attempts:0, lastScore:0, updatedAt:null }; }
  return { load, getLessonProgress };
})();

const BOOK_STORAGE_KEY = 'softwareSystemDesignBookProgressV1';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function getCourses() { return window.SOFTWARE_LEARNING_COURSES || []; }
function getAlgorithmCourse() { return getCourses().find(course => course.id === 'algorithm-python'); }
function getBookCatalog() { return window.SYSTEM_DESIGN_BOOK?.chapters || []; }
function chapterData(id) {
  const n = Number(String(id || '').match(/(\d+)$/)?.[1] || 0);
  return window[`SYSTEM_DESIGN_CHAPTER_${String(n).padStart(2, '0')}`] || null;
}
function loadBookProgress() {
  try { return JSON.parse(localStorage.getItem(BOOK_STORAGE_KEY)) || { version:1, chapters:{} }; }
  catch { return { version:1, chapters:{} }; }
}

function algorithmStats(course) {
  if (!course) return { total:0, passed:0, percent:0 };
  const total = course.lessons.length;
  const passed = course.lessons.filter(lesson => LearningStore.getLessonProgress(lesson.id).passed).length;
  return { total, passed, percent: total ? Math.round(passed / total * 100) : 0 };
}

function chapterTag(meta) {
  if (meta?.volume && meta?.chapterNo) return `第 ${meta.volume} 冊第 ${meta.chapterNo} 章`;
  return `Chapter ${meta?.order}`;
}

function isCustomChapterPassed(meta, progress) {
  if (progress.chapters?.[meta.id]?.exam?.passed) return true;
  if (meta.customHref) {
    try {
      const hw = JSON.parse(localStorage.getItem('hotelWorld.v1') || '{}');
      if (Object.keys(hw.results || {}).length >= 12) return true;
    } catch {}
  }
  return false;
}

function bookStats() {
  const chapters = getBookCatalog();
  const progress = loadBookProgress();
  const passed = chapters.filter(chapter => isCustomChapterPassed(chapter, progress)).length;
  return { total: chapters.length, passed, percent: chapters.length ? Math.round(passed / chapters.length * 100) : 0 };
}

function chapterStats(meta) {
  const chapter = chapterData(meta.id);
  const progress = loadBookProgress();
  const state = progress.chapters?.[meta.id];
  if (!chapter && meta.customHref) {
    let hwMonths = 0;
    try {
      const hw = JSON.parse(localStorage.getItem('hotelWorld.v1') || '{}');
      hwMonths = Object.keys(hw.results || {}).length;
    } catch {}
    return {
      ready: true,
      custom: true,
      hwMonths,
      examPassed: isCustomChapterPassed(meta, progress),
      bestScore: state?.exam?.bestScore || 0,
      attempts: state?.exam?.attempts || 0,
      customDetail: meta.customDetail || '互動動畫課程'
    };
  }
  if (!chapter) return { ready:false, total:0, completed:0, examPassed:false, bestScore:0, attempts:0 };
  return {
    ready: true,
    total: chapter.sections.length,
    completed: chapter.sections.filter(section => state?.sections?.[section.id]?.completed).length,
    examPassed: !!state?.exam?.passed,
    bestScore: state?.exam?.bestScore || 0,
    attempts: state?.exam?.attempts || 0,
    sectionQuestions: chapter.sections.reduce((sum, section) => sum + section.quiz.length, 0),
    pages: chapter.sections.reduce((sum, section) => sum + section.pages.length, 0),
    finalQuestions: chapter.finalExam.length
  };
}

function renderBookCourseCard() {
  const stats = bookStats();
  const ready = getBookCatalog().filter(meta => chapterData(meta.id) || meta.customHref);
  const rows = ready.map(meta => {
    const s = chapterStats(meta);
    const href = meta.customHref || `system-design-chapter.html?chapter=${meta.id}`;
    const status = s.examPassed
      ? `✅ 已通過${s.bestScore ? ` · 最高 ${s.bestScore} 分` : ''}`
      : s.custom
        ? (s.hwMonths ? `🏨 營運挑戰 ${s.hwMonths}/12 月` : '🎬 互動動畫課程')
        : s.completed
          ? `📖 ${s.completed}/${s.total} 小節完成`
          : '可開始';
    const metaText = s.custom
      ? `${escapeHtml(s.customDetail)} · ${status}`
      : `${s.total} 小節 · ${s.pages} 教材頁 · ${s.sectionQuestions} 題小節練習 · ${s.finalQuestions} 題章末考 · ${status}`;
    return `
      <a class="lesson-row" href="${escapeHtml(href)}">
        <div>
          <div class="lesson-title">${escapeHtml(chapterTag(meta))}｜${escapeHtml(meta.title)}</div>
          <div class="lesson-meta">${metaText}</div>
        </div><span class="row-arrow">›</span>
      </a>`;
  }).join('');

  return `
    <section class="course-card book-mode-card">
      <div class="course-card-header">
        <div class="course-icon">🏗️</div>
        <div class="course-heading">
          <h2>系統設計｜Alex Xu 書本模式</h2>
          <p>依 Volume 1 的 16 個 Chapter 與 Volume 2 實戰章節逐章深入研究。包含小節教材、互動動畫與模擬挑戰。</p>
        </div>
        <div class="course-score">${stats.passed}/${stats.total}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
      <div class="lesson-list">
        ${rows}
        <a class="lesson-row" href="system-design.html"><div><div class="lesson-title">查看完整系統設計路線</div><div class="lesson-meta">第 1 冊 16 章全數完成 · 第 2 冊已完成第 3、7 章</div></div><span class="row-arrow">›</span></a>
      </div>
    </section>`;
}

function renderAlgorithmCourseCard(course) {
  if (!course) return '';
  const stats = algorithmStats(course);
  const lessons = course.lessons.map(lesson => {
    const progress = LearningStore.getLessonProgress(lesson.id);
    const status = progress.passed ? '✅ 已通過' : progress.viewed ? '📖 學習中' : '未開始';
    return `<a class="lesson-row" href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}"><div><div class="lesson-title">${escapeHtml(lesson.title)}</div><div class="lesson-meta">${escapeHtml(lesson.level)} · ${escapeHtml(lesson.duration)} · ${status}</div></div><span class="row-arrow">›</span></a>`;
  }).join('');
  return `<section class="course-card"><div class="course-card-header"><div class="course-icon">${course.icon}</div><div class="course-heading"><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.description)}</p></div><div class="course-score">${stats.passed}/${stats.total}</div></div><div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div><div class="lesson-list">${lessons}</div></section>`;
}

function renderDashboard() {
  const container = document.querySelector('#courseList');
  if (!container) return;
  const algo = getAlgorithmCourse();
  const book = bookStats();
  const algorithm = algorithmStats(algo);
  const total = book.total + algorithm.total;
  const passed = book.passed + algorithm.passed;
  document.querySelector('#overallPassed').textContent = passed;
  document.querySelector('#overallTotal').textContent = total;
  document.querySelector('#overallPercent').textContent = total ? Math.round(passed / total * 100) : 0;
  container.innerHTML = renderBookCourseCard() + renderAlgorithmCourseCard(algo);
}

function renderBookProgressSection() {
  const catalog = getBookCatalog();
  const progress = loadBookProgress();
  const rows = catalog.map(meta => {
    const data = chapterData(meta.id);
    const state = progress.chapters?.[meta.id];
    const href = meta.customHref || `system-design-chapter.html?chapter=${meta.id}`;
    let status = '尚未製作';
    if (isCustomChapterPassed(meta, progress)) status = '✅ 通過';
    else if (meta.customHref) {
      let hwMonths = 0;
      try { hwMonths = Object.keys(JSON.parse(localStorage.getItem('hotelWorld.v1') || '{}').results || {}).length; } catch {}
      status = hwMonths ? `🏨 營運挑戰 ${hwMonths}/12 月` : '🎬 互動動畫課程';
    } else if (data) {
      status = Object.keys(state?.sections || {}).length ? '📖 學習中' : '未開始';
    }
    return `<tr><td>${escapeHtml(chapterTag(meta))}｜${escapeHtml(meta.title)}</td><td>${status}</td><td>${state?.exam?.attempts || 0}</td><td>${state?.exam?.bestScore || 0} 分</td><td><a href="${escapeHtml(href)}">${data || meta.customHref ? '前往' : '查看'}</a></td></tr>`;
  }).join('');

  const sectionTables = catalog.filter(meta => chapterData(meta.id)).map(meta => {
    const chapter = chapterData(meta.id);
    const state = progress.chapters?.[meta.id];
    const sectionRows = chapter.sections.map(section => {
      const s = state?.sections?.[section.id];
      return `<tr><td>${section.order}. ${escapeHtml(section.title)}</td><td>${s?.completed ? '✅ 完成' : '—'}</td><td>${s?.attempts || 0}</td><td>${s?.bestScore || 0} 分</td><td><a href="system-design-chapter.html?chapter=${meta.id}&section=${section.id}">前往</a></td></tr>`;
    }).join('');
    return `<section class="progress-section"><div class="progress-title"><h2>${escapeHtml(chapterTag(meta))}｜小節進度</h2><span>${chapter.sections.length} 小節 · 每節 3–5 題</span></div><div class="table-wrap"><table><thead><tr><th>小節</th><th>狀態</th><th>練習次數</th><th>最高分</th><th></th></tr></thead><tbody>${sectionRows}</tbody></table></div></section>`;
  }).join('');

  return `<section class="progress-section"><div class="progress-title"><h2>🏗️ 系統設計｜第 1 冊 & 第 2 冊</h2><span>以章末測驗或營運挑戰作為 Chapter 通過標準</span></div><div class="table-wrap"><table><thead><tr><th>章節</th><th>狀態</th><th>章末考次數</th><th>最高分</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>${sectionTables}`;
}

function renderAlgorithmProgressSection(course) {
  if (!course) return '';
  const stats = algorithmStats(course);
  const rows = course.lessons.map(lesson => {
    const progress = LearningStore.getLessonProgress(lesson.id);
    return `<tr><td>${escapeHtml(lesson.title)}</td><td>${progress.passed ? '✅ 通過' : progress.viewed ? '📖 學習中' : '—'}</td><td>${progress.attempts}</td><td>${progress.bestScore} 分</td><td><a href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">前往</a></td></tr>`;
  }).join('');
  return `<section class="progress-section"><div class="progress-title"><h2>${course.icon} ${escapeHtml(course.title)}</h2><span>${stats.passed}/${stats.total} 通過</span></div><div class="table-wrap"><table><thead><tr><th>章節</th><th>狀態</th><th>作答</th><th>最高分</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderProgress() {
  const root = document.querySelector('#progressList');
  if (!root) return;
  root.innerHTML = renderBookProgressSection() + renderAlgorithmProgressSection(getAlgorithmCourse());
  document.querySelector('#resetProgress').addEventListener('click', () => {
    if (!window.confirm('確定清除所有課程進度與成績嗎？')) return;
    localStorage.removeItem('softwareLearningProgressV1');
    localStorage.removeItem(BOOK_STORAGE_KEY);
    window.location.reload();
  });
}

const page = document.body.dataset.page;
if (page === 'dashboard') renderDashboard();
if (page === 'progress') renderProgress();