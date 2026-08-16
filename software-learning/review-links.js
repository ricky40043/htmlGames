(() => {
    const params = new URLSearchParams(location.search);
    const reviewConceptId = params.get('review');
    const courseId = params.get('course');
    const lessonId = params.get('lesson');
    const courses = window.SOFTWARE_LEARNING_COURSES || [];
    const course = courses.find(c => c.id === courseId);
    const lesson = course?.lessons.find(l => l.id === lessonId);
    const root = document.querySelector('#lessonContent');
    if (!lesson || !root) return;

    const contentChildren = [...root.children];
    contentChildren.forEach((element, index) => {
        const pageNumber = index + 1;
        const pageId = `${lesson.id}-p${pageNumber}`;
        element.id = pageId;
        element.dataset.lessonPage = String(pageNumber);
        const marker = document.createElement('div');
        marker.className = 'lesson-page-marker';
        marker.textContent = `教材第 ${pageNumber} 頁`;
        element.before(marker);
    });

    if (!reviewConceptId || !window.SoftwareExamBank) return;
    const concept = window.SoftwareExamBank.getConcepts(lesson.id).find(c => c.id === reviewConceptId);
    if (!concept) return;
    const review = window.SoftwareExamBank.resolveReview(lesson, concept);
    if (!review) return;

    const target = document.getElementById(review.pageId);
    if (!target) return;

    if (review.slideIndex !== null && target.classList.contains('interactive-deck')) {
        const dot = target.querySelector(`.deck-dot[data-go="${review.slideIndex}"]`);
        if (dot) dot.click();
    }

    const banner = document.createElement('div');
    banner.className = 'review-banner';
    banner.innerHTML = `<strong>錯題複習定位</strong><br>你是從考試回來複習「${concept.name}」。這個觀念位於教材第 ${review.pageNumber} 頁${review.slideIndex !== null ? `，互動投影片第 ${review.slideIndex + 1} 張` : ''}。`;
    root.before(banner);

    target.classList.add('review-target');
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
})();