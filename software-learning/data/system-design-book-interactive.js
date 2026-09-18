/*
 * 把各章的互動層（arch 架構圖、probe 逐頁自我檢核）套進教材頁。
 *
 * 教材文字與書頁一致，這一層只負責「補上書上有、但原本教材沒畫出來的圖」
 * 以及「讓每一頁讀的時候都有東西可以動手」。分開放的理由與
 * system-design-book-translation-overrides.js 相同：日後重新匯入教材內容時，
 * 這些互動不會被無聲蓋掉。
 *
 * 每一頁支援三種操作，依 replace → insertAfter → append 的順序套用：
 *   replace     { 索引: 區塊 }   以新區塊取代原本那一個
 *   insertAfter { 索引: 區塊 }   插在該索引的後面
 *   append      [ 區塊, ... ]    接在整頁最後
 */
(() => {
  const patchSets = Object.keys(window)
    .filter(key => /^SYSTEM_DESIGN_INTERACTIVE_CH\d+$/.test(key))
    .map(key => window[key])
    .filter(Boolean);
  if (!patchSets.length) return;

  const pages = new Map();
  Object.keys(window)
    .filter(key => /^SYSTEM_DESIGN_CHAPTER_\d+$/.test(key))
    .map(key => window[key])
    .filter(chapter => chapter && Array.isArray(chapter.sections))
    .forEach(chapter => chapter.sections.forEach(section => {
      section.pages.forEach(page => pages.set(page.id, page));
    }));

  const missing = [];

  patchSets.forEach(patches => {
    Object.entries(patches).forEach(([pageId, patch]) => {
      const page = pages.get(pageId);
      if (!page || !Array.isArray(page.blocks)) { missing.push(pageId); return; }

      Object.entries(patch.replace || {}).forEach(([index, block]) => {
        const i = Number(index);
        if (i >= 0 && i < page.blocks.length) page.blocks[i] = block;
        else page.blocks.push(block);
      });

      // 由大到小插入，才不會讓後面的索引被前面的插入推移。
      Object.entries(patch.insertAfter || {})
        .map(([index, block]) => [Number(index), block])
        .sort((a, b) => b[0] - a[0])
        .forEach(([i, block]) => page.blocks.splice(Math.min(i + 1, page.blocks.length), 0, block));

      (patch.append || []).forEach(block => page.blocks.push(block));
    });
  });

  if (missing.length && window.console) {
    console.warn('[system-design] 互動層找不到這些教材頁，請確認頁面 id：', missing);
  }
})();
