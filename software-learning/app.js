const LearningStore = (() => {
    const STORAGE_KEY = 'softwareLearningProgressV1';

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { lessons: {} };
        } catch {
            return { lessons: {} };
        }
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getLessonProgress(lessonId) {
        const data = load();
        return data.lessons[lessonId] || {
            viewed: false,
            passed: false,
            bestScore: 0,
            attempts: 0,
            lastScore: 0,
            updatedAt: null
        };
    }

    function markViewed(lessonId) {
        const data = load();
        const current = getLessonProgress(lessonId);
        data.lessons[lessonId] = {
            ...current,
            viewed: true,
            updatedAt: new Date().toISOString()
        };
        save(data);
    }

    function saveExamResult(lessonId, score) {
        const data = load();
        const current = getLessonProgress(lessonId);
        data.lessons[lessonId] = {
            ...current,
            viewed: true,
            passed: current.passed || score >= 80,
            bestScore: Math.max(current.bestScore, score),
            lastScore: score,
            attempts: current.attempts + 1,
            updatedAt: new Date().toISOString()
        };
        save(data);
        return data.lessons[lessonId];
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return { load, getLessonProgress, markViewed, saveExamResult, reset };
})();

function getCourses() {
    return window.SOFTWARE_LEARNING_COURSES || [];
}

function getCourse(courseId) {
    return getCourses().find(course => course.id === courseId);
}

function getLesson(courseId, lessonId) {
    const course = getCourse(courseId);
    if (!course) return null;
    return course.lessons.find(lesson => lesson.id === lessonId) || null;
}

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function courseStats(course) {
    const total = course.lessons.length;
    const passed = course.lessons.filter(lesson => LearningStore.getLessonProgress(lesson.id).passed).length;
    return {
        total,
        passed,
        percent: total === 0 ? 0 : Math.round((passed / total) * 100)
    };
}

function renderDashboard() {
    const container = document.querySelector('#courseList');
    if (!container) return;

    const courses = getCourses();
    const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0);
    const passedLessons = courses.reduce(
        (sum, course) => sum + course.lessons.filter(lesson => LearningStore.getLessonProgress(lesson.id).passed).length,
        0
    );

    document.querySelector('#overallPassed').textContent = passedLessons;
    document.querySelector('#overallTotal').textContent = totalLessons;
    document.querySelector('#overallPercent').textContent = totalLessons ? Math.round((passedLessons / totalLessons) * 100) : 0;

    container.innerHTML = courses.map(course => {
        const stats = courseStats(course);
        const lessons = course.lessons.map(lesson => {
            const progress = LearningStore.getLessonProgress(lesson.id);
            const status = progress.passed ? '✅ 已通過' : progress.viewed ? '📖 學習中' : '未開始';
            return `
                <a class="lesson-row" href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">
                    <div>
                        <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                        <div class="lesson-meta">${escapeHtml(lesson.level)} · ${escapeHtml(lesson.duration)} · ${status}</div>
                    </div>
                    <span class="row-arrow">›</span>
                </a>
            `;
        }).join('');

        return `
            <section class="course-card">
                <div class="course-card-header">
                    <div class="course-icon">${course.icon}</div>
                    <div class="course-heading">
                        <h2>${escapeHtml(course.title)}</h2>
                        <p>${escapeHtml(course.description)}</p>
                    </div>
                    <div class="course-score">${stats.passed}/${stats.total}</div>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
                <div class="lesson-list">${lessons}</div>
            </section>
        `;
    }).join('');
}

function renderLesson() {
    const params = getQueryParams();
    const courseId = params.get('course');
    const lessonId = params.get('lesson');
    const course = getCourse(courseId);
    const lesson = getLesson(courseId, lessonId);

    if (!course || !lesson) {
        document.querySelector('#lessonRoot').innerHTML = '<div class="empty-state"><h2>找不到課程</h2><a class="button" href="index.html">回首頁</a></div>';
        return;
    }

    LearningStore.markViewed(lesson.id);
    const progress = LearningStore.getLessonProgress(lesson.id);

    document.title = `${lesson.title}｜軟體工程學習`;
    document.querySelector('#breadcrumb').textContent = `${course.icon} ${course.title}`;
    document.querySelector('#lessonTitle').textContent = lesson.title;
    document.querySelector('#lessonSummary').textContent = lesson.summary;
    document.querySelector('#lessonMeta').textContent = `${lesson.level} · ${lesson.duration}`;

    const content = lesson.content.map(block => {
        if (block.type === 'heading') return `<h2>${escapeHtml(block.text)}</h2>`;
        if (block.type === 'bullet') return `<div class="lesson-bullet">• ${escapeHtml(block.text)}</div>`;
        if (block.type === 'callout') return `<div class="callout">${escapeHtml(block.text)}</div>`;
        if (block.type === 'code') return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
        return `<p>${escapeHtml(block.text)}</p>`;
    }).join('');

    document.querySelector('#lessonContent').innerHTML = content;
    document.querySelector('#lessonStatus').innerHTML = progress.passed
        ? `<span class="status-pass">✅ 已通過 · 最高 ${progress.bestScore} 分</span>`
        : '<span class="status-learning">尚未通過本章考試</span>';
    document.querySelector('#examButton').href = `exam.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}`;
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase().replaceAll(' ', '');
}

function renderExam() {
    const params = getQueryParams();
    const courseId = params.get('course');
    const lessonId = params.get('lesson');
    const course = getCourse(courseId);
    const lesson = getLesson(courseId, lessonId);

    if (!course || !lesson) {
        document.querySelector('#examRoot').innerHTML = '<div class="empty-state"><h2>找不到考試</h2><a class="button" href="index.html">回首頁</a></div>';
        return;
    }

    document.title = `${lesson.title}考試｜軟體工程學習`;
    document.querySelector('#examCourse').textContent = `${course.icon} ${course.title}`;
    document.querySelector('#examTitle').textContent = `${lesson.title}－章節考試`;
    document.querySelector('#examInfo').textContent = `${lesson.quiz.length} 題 · 80 分通過`;

    const form = document.querySelector('#examForm');
    form.innerHTML = lesson.quiz.map((question, index) => {
        if (question.type === 'fill') {
            return `
                <section class="question-card" data-question="${question.id}">
                    <div class="question-number">第 ${index + 1} 題 · 程式填空</div>
                    <h3>${escapeHtml(question.question)}</h3>
                    <input class="fill-input" type="text" name="${question.id}" autocomplete="off" placeholder="輸入答案" />
                    <div class="explanation" hidden></div>
                </section>
            `;
        }

        const options = question.options.map((option, optionIndex) => `
            <label class="option-row">
                <input type="radio" name="${question.id}" value="${optionIndex}" />
                <span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>
            </label>
        `).join('');

        return `
            <section class="question-card" data-question="${question.id}">
                <div class="question-number">第 ${index + 1} 題 · 單選題</div>
                <h3>${escapeHtml(question.question)}</h3>
                <div class="options">${options}</div>
                <div class="explanation" hidden></div>
            </section>
        `;
    }).join('');

    document.querySelector('#submitExam').addEventListener('click', () => {
        let correct = 0;

        lesson.quiz.forEach(question => {
            const card = document.querySelector(`[data-question="${question.id}"]`);
            const explanation = card.querySelector('.explanation');
            let isCorrect = false;

            if (question.type === 'fill') {
                const value = form.elements[question.id].value;
                isCorrect = normalizeText(value) === normalizeText(question.answerText);
            } else {
                const selected = form.querySelector(`input[name="${question.id}"]:checked`);
                isCorrect = selected && Number(selected.value) === question.answer;
            }

            if (isCorrect) correct += 1;
            card.classList.toggle('correct', isCorrect);
            card.classList.toggle('incorrect', !isCorrect);
            explanation.hidden = false;
            explanation.textContent = `${isCorrect ? '✅ 正確' : '❌ 錯誤'}：${question.explanation}`;
        });

        const score = Math.round((correct / lesson.quiz.length) * 100);
        const result = LearningStore.saveExamResult(lesson.id, score);
        const resultBox = document.querySelector('#examResult');
        resultBox.hidden = false;
        resultBox.className = `exam-result ${score >= 80 ? 'pass' : 'fail'}`;
        resultBox.innerHTML = `
            <div class="result-score">${score} 分</div>
            <div>${score >= 80 ? '✅ 本章通過' : '還沒通過，再複習一次就好。'}</div>
            <div class="result-meta">答對 ${correct}/${lesson.quiz.length} · 累計作答 ${result.attempts} 次 · 最高 ${result.bestScore} 分</div>
            <div class="result-actions">
                <a class="button secondary" href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">回課程</a>
                <button class="button" type="button" onclick="window.location.reload()">再考一次</button>
            </div>
        `;
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelector('#submitExam').disabled = true;
    });
}

function renderProgress() {
    const root = document.querySelector('#progressList');
    if (!root) return;

    root.innerHTML = getCourses().map(course => {
        const stats = courseStats(course);
        const rows = course.lessons.map(lesson => {
            const progress = LearningStore.getLessonProgress(lesson.id);
            return `
                <tr>
                    <td>${escapeHtml(lesson.title)}</td>
                    <td>${progress.passed ? '✅ 通過' : progress.viewed ? '📖 學習中' : '—'}</td>
                    <td>${progress.attempts}</td>
                    <td>${progress.bestScore} 分</td>
                    <td><a href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">前往</a></td>
                </tr>
            `;
        }).join('');

        return `
            <section class="progress-section">
                <div class="progress-title">
                    <h2>${course.icon} ${escapeHtml(course.title)}</h2>
                    <span>${stats.passed}/${stats.total} 通過</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>章節</th><th>狀態</th><th>作答</th><th>最高分</th><th></th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </section>
        `;
    }).join('');

    document.querySelector('#resetProgress').addEventListener('click', () => {
        if (!window.confirm('確定清除所有課程進度與成績嗎？')) return;
        LearningStore.reset();
        window.location.reload();
    });
}

const page = document.body.dataset.page;
if (page === 'dashboard') renderDashboard();
if (page === 'lesson') renderLesson();
if (page === 'exam') renderExam();
if (page === 'progress') renderProgress();