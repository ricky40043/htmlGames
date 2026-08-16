const LearningStore = (() => {
    const STORAGE_KEY = 'softwareLearningProgressV1';
    function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { lessons: {} }; } catch { return { lessons: {} }; } }
    function getLessonProgress(lessonId) { return load().lessons[lessonId] || { viewed:false, passed:false, bestScore:0, attempts:0, lastScore:0, updatedAt:null }; }
    function reset() { localStorage.removeItem(STORAGE_KEY); }
    return { load, getLessonProgress, reset };
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
function getChapterOne() { return window.SYSTEM_DESIGN_CHAPTER_01 || null; }
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

function bookStats() {
    const chapters = getBookCatalog();
    const progress = loadBookProgress();
    const passed = chapters.filter(chapter => progress.chapters?.[chapter.id]?.exam?.passed).length;
    return { total: chapters.length, passed, percent: chapters.length ? Math.round(passed / chapters.length * 100) : 0 };
}

function chapterOneStats() {
    const chapter = getChapterOne();
    const progress = loadBookProgress().chapters?.['sd-book-01'];
    if (!chapter) return { total:0, completed:0, examPassed:false, bestScore:0 };
    const completed = chapter.sections.filter(section => progress?.sections?.[section.id]?.completed).length;
    return {
        total: chapter.sections.length,
        completed,
        examPassed: !!progress?.exam?.passed,
        bestScore: progress?.exam?.bestScore || 0
    };
}

function renderBookCourseCard() {
    const stats = bookStats();
    const chapterStats = chapterOneStats();
    const status = chapterStats.examPassed
        ? `✅ Chapter 1 已通過 · 最高 ${chapterStats.bestScore} 分`
        : chapterStats.completed
            ? `📖 Chapter 1：${chapterStats.completed}/${chapterStats.total} 小節完成`
            : 'Chapter 1 已可開始';

    return `
        <section class="course-card book-mode-card">
            <div class="course-card-header">
                <div class="course-icon">🏗️</div>
                <div class="course-heading">
                    <h2>系統設計｜Alex Xu 書本模式</h2>
                    <p>依 Volume 1 的 16 個 Chapter 逐章重做。每章拆多個小節，小節有 3–5 題練習，最後再做 30 題章末測驗。</p>
                </div>
                <div class="course-score">${stats.passed}/${stats.total}</div>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
            <div class="lesson-list">
                <a class="lesson-row" href="system-design-chapter.html?chapter=sd-book-01">
                    <div>
                        <div class="lesson-title">Chapter 1｜使用者人數——從零到百萬規模</div>
                        <div class="lesson-meta">13 小節 · 33 教材頁 · 52 題小節練習 · 30 題章末考 · ${status}</div>
                    </div><span class="row-arrow">›</span>
                </a>
                <a class="lesson-row" href="system-design.html">
                    <div>
                        <div class="lesson-title">查看完整 16 Chapter 路線</div>
                        <div class="lesson-meta">Chapter 2 起會依序深入研究、完成一章再做下一章</div>
                    </div><span class="row-arrow">›</span>
                </a>
            </div>
        </section>`;
}

function renderAlgorithmCourseCard(course) {
    if (!course) return '';
    const stats = algorithmStats(course);
    const lessons = course.lessons.map(lesson => {
        const progress = LearningStore.getLessonProgress(lesson.id);
        const status = progress.passed ? '✅ 已通過' : progress.viewed ? '📖 學習中' : '未開始';
        return `
            <a class="lesson-row" href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">
                <div>
                    <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                    <div class="lesson-meta">${escapeHtml(lesson.level)} · ${escapeHtml(lesson.duration)} · ${status}</div>
                </div><span class="row-arrow">›</span>
            </a>`;
    }).join('');
    return `
        <section class="course-card">
            <div class="course-card-header">
                <div class="course-icon">${course.icon}</div>
                <div class="course-heading"><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.description)}</p></div>
                <div class="course-score">${stats.passed}/${stats.total}</div>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
            <div class="lesson-list">${lessons}</div>
        </section>`;
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
    const chapter = getChapterOne();
    const catalog = getBookCatalog();
    const progress = loadBookProgress();
    const rows = catalog.map(meta => {
        const chapterState = progress.chapters?.[meta.id];
        const ready = meta.status === 'ready' && chapter;
        const status = chapterState?.exam?.passed ? '✅ 通過' : ready ? (Object.keys(chapterState?.sections || {}).length ? '📖 學習中' : '未開始') : '尚未製作';
        const attempts = chapterState?.exam?.attempts || 0;
        const best = chapterState?.exam?.bestScore || 0;
        const link = ready ? `system-design-chapter.html?chapter=${meta.id}` : `system-design-chapter.html?chapter=${meta.id}`;
        return `<tr><td>Chapter ${meta.order}｜${escapeHtml(meta.title)}</td><td>${status}</td><td>${attempts}</td><td>${best} 分</td><td><a href="${link}">${ready ? '前往' : '查看'}</a></td></tr>`;
    }).join('');

    const sectionRows = chapter ? chapter.sections.map(section => {
        const state = progress.chapters?.['sd-book-01']?.sections?.[section.id];
        return `<tr><td>${section.order}. ${escapeHtml(section.title)}</td><td>${state?.completed ? '✅ 完成' : '—'}</td><td>${state?.attempts || 0}</td><td>${state?.bestScore || 0} 分</td><td><a href="system-design-chapter.html?chapter=sd-book-01&section=${section.id}">前往</a></td></tr>`;
    }).join('') : '';

    return `
        <section class="progress-section">
            <div class="progress-title"><h2>🏗️ 系統設計｜16 Chapter</h2><span>以章末 30 題測驗作為 Chapter 通過標準</span></div>
            <div class="table-wrap"><table><thead><tr><th>章節</th><th>狀態</th><th>章末考次數</th><th>最高分</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        </section>
        <section class="progress-section">
            <div class="progress-title"><h2>Chapter 1｜小節進度</h2><span>13 小節 · 每節 3–5 題</span></div>
            <div class="table-wrap"><table><thead><tr><th>小節</th><th>狀態</th><th>練習次數</th><th>最高分</th><th></th></tr></thead><tbody>${sectionRows}</tbody></table></div>
        </section>`;
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