(() => {
    const STORAGE_KEY = 'softwareLearningProgressV1';
    const esc = window.SoftwareExamBank?.esc || (v => String(v));
    const DIFFICULTIES = [
        { key: 'easy', label: '基礎', description: '定義、核心觀念、基本判斷' },
        { key: 'medium', label: '應用', description: '情境、工具選擇、限制判斷' },
        { key: 'hard', label: '進階', description: 'Trade-off、Failure、Root Cause' }
    ];

    function loadProgress() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { lessons: {} }; }
        catch { return { lessons: {} }; }
    }

    function saveAttempt(lessonId, score, detail) {
        const data = loadProgress();
        const current = data.lessons[lessonId] || { viewed: true, passed: false, bestScore: 0, attempts: 0, lastScore: 0 };
        data.lessons[lessonId] = {
            ...current,
            viewed: true,
            passed: current.passed || score >= 80,
            bestScore: Math.max(current.bestScore || 0, score),
            lastScore: score,
            attempts: (current.attempts || 0) + 1,
            lastDifficultyStats: detail.difficultyStats,
            wrongQuestionIds: detail.wrongQuestionIds,
            weakConceptIds: [...new Set(detail.weakConceptIds)],
            lastAttemptAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data.lessons[lessonId];
    }

    function shuffle(items) {
        const array = [...items];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function prepareQuestion(question) {
        if (question.type !== 'choice') return { ...question };
        return { ...question, options: shuffle(question.options) };
    }

    function selectExamQuestions(bank) {
        return DIFFICULTIES.flatMap(group => {
            const pool = bank.filter(q => q.difficulty === group.key);
            return shuffle(pool).slice(0, 10).map(prepareQuestion);
        });
    }

    function reviewUrl(courseId, lessonId, question) {
        const concept = encodeURIComponent(question.conceptId || '');
        return `lesson.html?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lessonId)}&review=${concept}`;
    }

    function renderQuestion(question, globalIndex, courseId, lessonId) {
        const diff = DIFFICULTIES.find(d => d.key === question.difficulty) || DIFFICULTIES[0];
        const typeLabel = question.type === 'fill' ? '填空題' : '單選題';
        if (question.type === 'fill') {
            return `
                <section class="question-card" data-question="${esc(question.id)}" data-difficulty="${question.difficulty}">
                    <div class="question-number">第 ${globalIndex + 1} 題 · ${typeLabel}<span class="difficulty-chip ${question.difficulty}">${diff.label}</span></div>
                    <h3>${esc(question.question)}</h3>
                    <input class="fill-input" type="text" name="${esc(question.id)}" autocomplete="off" placeholder="輸入答案" />
                    <div class="explanation" hidden></div>
                </section>`;
        }
        const options = question.options.map((option, i) => `
            <label class="option-row">
                <input type="radio" name="${esc(question.id)}" value="${esc(option.id)}" />
                <span>${String.fromCharCode(65 + i)}. ${esc(option.text)}</span>
            </label>`).join('');
        return `
            <section class="question-card" data-question="${esc(question.id)}" data-difficulty="${question.difficulty}">
                <div class="question-number">第 ${globalIndex + 1} 題 · ${typeLabel}<span class="difficulty-chip ${question.difficulty}">${diff.label}</span></div>
                <h3>${esc(question.question)}</h3>
                <div class="options">${options}</div>
                <div class="explanation" hidden></div>
            </section>`;
    }

    function renderExam() {
        const params = new URLSearchParams(location.search);
        const courseId = params.get('course');
        const lessonId = params.get('lesson');
        const courses = window.SOFTWARE_LEARNING_COURSES || [];
        const course = courses.find(c => c.id === courseId);
        const lesson = course?.lessons.find(l => l.id === lessonId);
        const root = document.querySelector('#examRoot');
        if (!course || !lesson || !window.SoftwareExamBank) {
            root.innerHTML = '<div class="empty-state"><h2>找不到考試資料</h2><a class="button" href="index.html">回首頁</a></div>';
            return;
        }

        const bank = window.SoftwareExamBank.build(lesson);
        const questions = selectExamQuestions(bank);
        const counts = Object.fromEntries(DIFFICULTIES.map(d => [d.key, questions.filter(q => q.difficulty === d.key).length]));

        document.title = `${lesson.title}考試｜軟體工程學習`;
        document.querySelector('#examCourse').textContent = `${course.icon} ${course.title}`;
        document.querySelector('#examTitle').textContent = `${lesson.title}－章節考試`;
        document.querySelector('#examInfo').innerHTML = `
            <div>${questions.length} 題 · 80 分通過 · 每次題目與選項都會重新洗牌</div>
            <div class="exam-blueprint">
                <div><strong>${counts.easy}</strong><small>基礎題</small></div>
                <div><strong>${counts.medium}</strong><small>應用題</small></div>
                <div><strong>${counts.hard}</strong><small>進階題</small></div>
            </div>`;

        const form = document.querySelector('#examForm');
        let globalIndex = 0;
        form.innerHTML = DIFFICULTIES.map(diff => {
            const sectionQuestions = questions.filter(q => q.difficulty === diff.key);
            const html = sectionQuestions.map(q => renderQuestion(q, globalIndex++, courseId, lessonId)).join('');
            return `
                <section class="exam-difficulty-section">
                    <div class="difficulty-heading">
                        <h2>${diff.label}題</h2>
                        <span>${diff.description} · ${sectionQuestions.length} 題</span>
                    </div>
                    ${html}
                </section>`;
        }).join('');

        document.querySelector('#submitExam').addEventListener('click', () => {
            let correct = 0;
            const difficultyStats = Object.fromEntries(DIFFICULTIES.map(d => [d.key, { correct: 0, total: 0 }]));
            const wrongQuestionIds = [];
            const weakConceptIds = [];

            questions.forEach(question => {
                const card = form.querySelector(`[data-question="${CSS.escape(question.id)}"]`);
                const explanation = card.querySelector('.explanation');
                difficultyStats[question.difficulty].total += 1;
                let isCorrect = false;
                let selectedText = '';
                let misconception = '';

                if (question.type === 'fill') {
                    const value = form.elements[question.id]?.value || '';
                    isCorrect = String(value).trim().toLowerCase().replaceAll(' ', '') === String(question.answerText || '').trim().toLowerCase().replaceAll(' ', '');
                    selectedText = value || '未作答';
                    misconception = question.wrongReason || '答案的形式或核心概念還沒有完全對上教材。';
                } else {
                    const selected = form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`);
                    const selectedId = selected?.value || '';
                    const selectedOption = question.options.find(o => o.id === selectedId);
                    isCorrect = selectedId === question.correctOptionId;
                    selectedText = selectedOption?.text || '未作答';
                    misconception = selectedOption?.misconception || '這個選項沒有抓到題目的核心判斷條件。';
                }

                if (isCorrect) {
                    correct += 1;
                    difficultyStats[question.difficulty].correct += 1;
                } else {
                    wrongQuestionIds.push(question.id);
                    if (question.conceptId) weakConceptIds.push(question.conceptId);
                }

                card.classList.toggle('correct', isCorrect);
                card.classList.toggle('incorrect', !isCorrect);
                explanation.hidden = false;
                const review = question.review;
                const reviewText = review
                    ? `教材第 ${review.pageNumber} 頁${review.slideIndex !== null ? `（互動投影片第 ${review.slideIndex + 1} 張）` : ''}`
                    : '本章教材';
                if (isCorrect) {
                    explanation.innerHTML = `<strong>✅ 正確</strong><br>${esc(question.explanation)}`;
                } else {
                    explanation.innerHTML = `
                        <strong>❌ 你選了：${esc(selectedText)}</strong><br>
                        <b>可能的思考誤區：</b>${esc(misconception)}<br>
                        <b>正確判斷：</b>${esc(question.explanation)}<br>
                        <a class="review-link" href="${reviewUrl(courseId, lessonId, question)}">↩ 回 ${esc(reviewText)} 複習「${esc((window.SoftwareExamBank.getConcepts(lessonId).find(c => c.id === question.conceptId)?.name) || '本題觀念')}」</a>`;
                }
            });

            const score = Math.round((correct / questions.length) * 100);
            const saved = saveAttempt(lesson.id, score, { difficultyStats, wrongQuestionIds, weakConceptIds });
            const resultBox = document.querySelector('#examResult');
            resultBox.hidden = false;
            resultBox.className = `exam-result ${score >= 80 ? 'pass' : 'fail'}`;
            const statHtml = DIFFICULTIES.map(d => {
                const s = difficultyStats[d.key];
                const pct = s.total ? Math.round(s.correct / s.total * 100) : 0;
                return `<div><small>${d.label}</small><strong>${s.correct}/${s.total} · ${pct}%</strong></div>`;
            }).join('');
            resultBox.innerHTML = `
                <div class="result-score">${score} 分</div>
                <div>${score >= 80 ? '✅ 本章通過' : '尚未通過；先看下方錯題診斷再回教材複習。'}</div>
                <div class="difficulty-result-grid">${statHtml}</div>
                <div class="result-meta">答對 ${correct}/${questions.length} · 累計作答 ${saved.attempts} 次 · 最高 ${saved.bestScore} 分 · 弱點概念 ${new Set(weakConceptIds).size} 個</div>
                <div class="result-actions">
                    <a class="button secondary" href="lesson.html?course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.id)}">回課程</a>
                    <button class="button" type="button" onclick="window.location.reload()">重新抽題再考</button>
                </div>`;
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.querySelector('#submitExam').disabled = true;
        });
    }

    renderExam();
})();