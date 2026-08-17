(() => {
  const glossary = Array.isArray(window.SYSTEM_DESIGN_GLOSSARY) ? window.SYSTEM_DESIGN_GLOSSARY : [];
  if (!glossary.length) return;

  const entries = glossary
    .flatMap(term => (term.aliases || []).map(alias => ({ term, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const isWordChar = ch => !!ch && /[A-Za-z0-9_]/.test(ch);
  const boundaryOk = (text, start, len) => {
    const before = text[start - 1];
    const after = text[start + len];
    const first = text[start];
    const last = text[start + len - 1];
    if (isWordChar(first) && isWordChar(before)) return false;
    if (isWordChar(last) && isWordChar(after)) return false;
    return true;
  };

  const label = term => term.abbr
    ? `${term.zh}（${term.en}, ${term.abbr}）`
    : `${term.zh}（${term.en}）`;

  function findNext(text, from) {
    let best = null;
    for (const entry of entries) {
      let idx = text.indexOf(entry.alias, from);
      while (idx >= 0 && !boundaryOk(text, idx, entry.alias.length)) {
        idx = text.indexOf(entry.alias, idx + 1);
      }
      if (idx < 0) continue;
      if (!best || idx < best.index || (idx === best.index && entry.alias.length > best.entry.alias.length)) {
        best = { index: idx, entry };
      }
    }
    return best;
  }

  function transformTextNode(node, context) {
    const text = node.nodeValue || '';
    if (!text.trim()) return;
    let cursor = 0;
    let hit = false;
    const frag = document.createDocumentFragment();

    while (cursor < text.length) {
      const found = findNext(text, cursor);
      if (!found) break;
      hit = true;
      if (found.index > cursor) frag.append(document.createTextNode(text.slice(cursor, found.index)));

      const { term, alias } = found.entry;
      const first = !context.seen.has(term.id);
      if (first) context.seen.add(term.id);

      if (context.allowLinks && first) {
        const a = document.createElement('a');
        a.className = 'book-term-link';
        a.href = term.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = label(term);
        a.title = `${term.note}（開啟外部說明）`;
        a.setAttribute('aria-label', `${label(term)}：${term.note}，開啟外部說明`);
        const mark = document.createElement('sup');
        mark.textContent = '↗';
        a.append(mark);
        frag.append(a);
      } else {
        const span = document.createElement('span');
        span.className = 'book-term-plain';
        span.textContent = first ? label(term) : term.zh;
        span.title = `${label(term)}：${term.note}`;
        frag.append(span);
      }
      cursor = found.index + alias.length;
    }

    if (!hit) return;
    if (cursor < text.length) frag.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(frag);
  }

  function processRoot(root, { allowLinks = false, seen = new Set() } = {}) {
    if (!root) return seen;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script,style,pre,code,a,.book-term-link')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => transformTextNode(node, { allowLinks, seen }));
    return seen;
  }

  function addLegend(page) {
    if (!page || page.querySelector('.book-term-legend')) return;
    const legend = document.createElement('div');
    legend.className = 'book-term-legend';
    legend.innerHTML = '<strong>📘 專有名詞閱讀方式</strong><span>本頁第一次出現的術語會顯示「中文（English）」；有 <b>↗</b> 的術語可開啟外部中文／官方說明。後續重複出現時以中文為主。</span>';
    page.insertBefore(legend, page.children[1] || null);
  }

  function run() {
    const page = document.querySelector('.book-page');
    if (page) {
      addLegend(page);
      processRoot(page, { allowLinks: true, seen: new Set() });
    }

    // 標題、摘要與題目也做中文化，但不放外部連結，避免干擾導覽與作答。
    [
      document.querySelector('.book-course-header'),
      document.querySelector('.book-section-header'),
      document.querySelector('.book-section-nav'),
      document.querySelector('.book-section-quiz'),
      document.querySelector('#bookExamRoot')
    ].forEach(root => processRoot(root, { allowLinks: false, seen: new Set() }));
  }

  run();
})();
