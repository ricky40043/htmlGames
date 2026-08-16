(() => {
    const esc = value => String(value ?? '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

    function getConcepts(lessonId) {
        const rows = (window.SOFTWARE_QUESTION_SPECS || {})[lessonId] || [];
        return rows.map((row, index) => ({
            id: `${lessonId}-c${index + 1}`,
            lessonId,
            order: index + 1,
            name: row[0],
            definition: row[1],
            useWhen: row[2],
            trap: row[3],
            keywords: row[4] || [row[0]]
        }));
    }

    function blockText(block) {
        const parts = [];
        const walk = value => {
            if (typeof value === 'string') parts.push(value);
            else if (Array.isArray(value)) value.forEach(walk);
            else if (value && typeof value === 'object') Object.values(value).forEach(walk);
        };
        walk(block);
        return parts.join(' ').toLowerCase();
    }

    function resolveReview(lesson, concept) {
        if (!lesson || !concept) return null;
        const blocks = lesson.content || [];
        let best = null;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const text = blockText(block);
            const matchedKeyword = concept.keywords.find(k => text.includes(String(k).toLowerCase()));
            if (!matchedKeyword) continue;
            let slideIndex = null;
            if (Array.isArray(block.slides)) {
                const target = String(matchedKeyword).toLowerCase();
                const idx = block.slides.findIndex(slide => blockText(slide).includes(target));
                if (idx >= 0) slideIndex = idx;
            }
            best = {
                conceptId: concept.id,
                pageId: `${lesson.id}-p${i + 1}`,
                pageNumber: i + 1,
                blockIndex: i,
                slideIndex,
                label: block.title || block.text || concept.name
            };
            break;
        }
        if (!best) {
            const fallback = Math.min(Math.max(concept.order - 1, 0), Math.max(blocks.length - 1, 0));
            best = {
                conceptId: concept.id,
                pageId: `${lesson.id}-p${fallback + 1}`,
                pageNumber: fallback + 1,
                blockIndex: fallback,
                slideIndex: null,
                label: concept.name
            };
        }
        return best;
    }

    function option(id, text, misconception) {
        return { id, text, misconception };
    }

    function legacyQuestion(q, index, concept) {
        const base = {
            id: q.id || `${concept.lessonId}-legacy-${index + 1}`,
            type: q.type,
            difficulty: 'easy',
            conceptId: concept.id,
            question: q.question,
            explanation: q.explanation || concept.definition,
            review: null
        };
        if (q.type === 'fill') {
            return {
                ...base,
                answerText: q.answerText,
                wrongReason: `你可能記得大方向，但沒有把「${concept.name}」的關鍵形式記完整。${concept.trap}`
            };
        }
        const correctText = q.options[q.answer];
        return {
            ...base,
            options: q.options.map((text, optionIndex) => option(
                `${base.id}-o${optionIndex + 1}`,
                text,
                optionIndex === q.answer
                    ? ''
                    : `你可能把「${text}」和「${concept.name}」放在同一層判斷。這題真正要先確認的是：${concept.definition}。${concept.trap}`
            )),
            correctOptionId: `${base.id}-o${q.answer + 1}`,
            correctText
        };
    }

    function otherConcepts(concepts, concept) {
        return concepts.filter(c => c.id !== concept.id);
    }

    function makeDefinitionQuestion(lesson, concept, concepts) {
        const others = otherConcepts(concepts, concept).slice(0, 3);
        const id = `${lesson.id}-${concept.order}-easy-def`;
        const rows = [
            option(`${id}-correct`, concept.definition, ''),
            ...others.map((c, i) => option(`${id}-wrong-${i}`, c.definition,
                `你選到的是「${c.name}」的定義。你可能只抓到同章節的相關名詞，但本題問的是「${concept.name}」。判斷時要抓住：${concept.definition}`))
        ];
        return {
            id, type: 'choice', difficulty: 'easy', conceptId: concept.id,
            question: `下列哪一個敘述最準確描述「${concept.name}」？`,
            options: rows, correctOptionId: `${id}-correct`,
            explanation: `${concept.name}：${concept.definition}`
        };
    }

    function makeScenarioQuestion(lesson, concept, concepts) {
        const others = otherConcepts(concepts, concept).slice(0, 3);
        const id = `${lesson.id}-${concept.order}-medium-scenario`;
        const rows = [
            option(`${id}-correct`, concept.name, ''),
            ...others.map((c, i) => option(`${id}-wrong-${i}`, c.name,
                `你可能看到「${c.name}」也是本章工具就想套用，但情境的關鍵條件是：${concept.useWhen}。因此應先想到「${concept.name}」。`))
        ];
        return {
            id, type: 'choice', difficulty: 'medium', conceptId: concept.id,
            question: `情境：${concept.useWhen}。此時最直接對應的核心概念是？`,
            options: rows, correctOptionId: `${id}-correct`,
            explanation: `這個情境直接對應「${concept.name}」，因為 ${concept.definition}。`
        };
    }

    function makeConcernQuestion(lesson, concept, concepts) {
        const others = otherConcepts(concepts, concept).slice(0, 3);
        const id = `${lesson.id}-${concept.order}-medium-concern`;
        const rows = [
            option(`${id}-correct`, concept.trap, ''),
            ...others.map((c, i) => option(`${id}-wrong-${i}`, c.trap,
                `這是「${c.name}」更典型的限制。你可能把同章節不同元件的風險混在一起；「${concept.name}」要優先注意的是：${concept.trap}`))
        ];
        return {
            id, type: 'choice', difficulty: 'medium', conceptId: concept.id,
            question: `採用「${concept.name}」時，下列哪個限制或風險最值得優先確認？`,
            options: rows, correctOptionId: `${id}-correct`,
            explanation: `${concept.name} 並不是免費解法；核心限制是：${concept.trap}`
        };
    }

    function makeCritiqueQuestion(lesson, concept, concepts) {
        const wrong = otherConcepts(concepts, concept)[0] || concept;
        const id = `${lesson.id}-${concept.order}-hard-critique`;
        const correct = `這個判斷忽略了情境真正需要「${concept.name}」：${concept.useWhen}。`;
        const choices = [
            option(`${id}-correct`, correct, ''),
            option(`${id}-w1`, `只要把「${wrong.name}」的規格加大，就一定能解決。`, `你可能把「資源加大」當成萬用答案，但技術選擇要先對準瓶頸。這題的需求是：${concept.useWhen}`),
            option(`${id}-w2`, `這類問題不需要分析限制，選任何同章節技術都差不多。`, `你忽略了 system/algorithm design 的核心：不同工具處理不同前提。${concept.trap}`),
            option(`${id}-w3`, `只要平均情況有效，就可以忽略 Failure、Boundary 或 Worst-case。`, `你把 happy path 當成完整答案。進階判斷必須一起看限制：${concept.trap}`)
        ];
        return {
            id, type: 'choice', difficulty: 'hard', conceptId: concept.id,
            question: `同事面對「${concept.useWhen}」時直接選了「${wrong.name}」。下列哪個評論最完整？`,
            options: choices, correctOptionId: `${id}-correct`,
            explanation: `進階題不是看名詞是否相關，而是看前提是否匹配。此情境最直接對應「${concept.name}」。`
        };
    }

    function makeFailureQuestion(lesson, concept, concepts) {
        const others = otherConcepts(concepts, concept).slice(0, 3);
        const id = `${lesson.id}-${concept.order}-hard-failure`;
        const rows = [
            option(`${id}-correct`, `優先檢查「${concept.name}」的限制：${concept.trap}`, ''),
            ...others.map((c, i) => option(`${id}-wrong-${i}`, `先改成「${c.name}」，因為它和本章也有關。`,
                `你可能在看到故障後立刻換技術，卻沒有先驗證 Root Cause。這題已指出使用的是「${concept.name}」，應先檢查它的典型失敗模式：${concept.trap}`))
        ];
        return {
            id, type: 'choice', difficulty: 'hard', conceptId: concept.id,
            question: `系統已採用「${concept.name}」，但開始出現問題。哪個除錯方向最符合本章的 Trade-off 思維？`,
            options: rows, correctOptionId: `${id}-correct`,
            explanation: `先驗證已知限制與 Failure Mode，再決定是否換架構。${concept.trap}`
        };
    }

    function build(lesson) {
        const concepts = getConcepts(lesson.id);
        if (concepts.length < 5) return (lesson.quiz || []).map((q, i) => legacyQuestion(q, i, concepts[i % Math.max(concepts.length, 1)] || {id:`${lesson.id}-c1`,lessonId:lesson.id,name:'本章概念',definition:'本章核心概念',useWhen:'依教材情境判斷',trap:'請回教材複習',order:1,keywords:[]}));

        const legacy = (lesson.quiz || []).slice(0, 5).map((q, i) => legacyQuestion(q, i, concepts[i % concepts.length]));
        const easy = concepts.map(c => makeDefinitionQuestion(lesson, c, concepts));
        const medium = concepts.flatMap(c => [makeScenarioQuestion(lesson, c, concepts), makeConcernQuestion(lesson, c, concepts)]);
        const hard = concepts.flatMap(c => [makeCritiqueQuestion(lesson, c, concepts), makeFailureQuestion(lesson, c, concepts)]);
        const bank = [...legacy, ...easy, ...medium, ...hard];
        bank.forEach(q => {
            const concept = concepts.find(c => c.id === q.conceptId);
            q.review = resolveReview(lesson, concept);
        });
        return bank;
    }

    window.SoftwareExamBank = { getConcepts, resolveReview, build, esc };
})();