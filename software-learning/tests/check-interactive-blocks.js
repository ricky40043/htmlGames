/*
 * 互動層的結構檢查。
 *
 * 這一層是手寫的資料，最容易出的錯不是語法，而是「指到一個不存在的東西」：
 * 頁面 id 打錯、arch 的連線接到不存在的節點、資料流的某一步沒有對應的連線、
 * 或是 probe 沒有正確答案。這些在瀏覽器裡只會安靜地少畫一條線，所以用這支
 * 腳本一次擋掉。
 *
 * 執行：node tests/check-interactive-blocks.js
 * 也會被 `node --test tests/` 一起跑到。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');

const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

const run = file => {
  const full = path.join(dataDir, file);
  if (!fs.existsSync(full)) throw new Error(`找不到資料檔：${file}`);
  vm.runInContext(fs.readFileSync(full, 'utf8'), sandbox, { filename: file });
};

const catalog = (() => {
  run('system-design-book-catalog.js');
  return sandbox.window.SYSTEM_DESIGN_BOOK.chapters;
})();

catalog.forEach(chapter => (chapter.dataFiles || []).forEach(run));
['system-design-book-translation-overrides.js'].forEach(run);

const interactiveFiles = fs.readdirSync(dataDir)
  .filter(f => /^system-design-book-interactive-ch\d+\.js$/.test(f))
  .sort();
interactiveFiles.forEach(run);

// 先把注入前的頁面收起來，才能檢查 replace/insertAfter 的索引是否在範圍內。
const pagesBefore = new Map();
Object.keys(sandbox.window)
  .filter(key => /^SYSTEM_DESIGN_CHAPTER_\d+$/.test(key))
  .forEach(key => sandbox.window[key].sections.forEach(section => {
    section.pages.forEach(page => pagesBefore.set(page.id, page.blocks.length));
  }));

const errors = [];
const stats = { pages: 0, arch: 0, probe: 0, edges: 0, steps: 0 };

interactiveFiles.forEach(file => {
  const chapterKey = `SYSTEM_DESIGN_INTERACTIVE_CH${file.match(/ch(\d+)/)[1]}`;
  const patches = sandbox.window[chapterKey];
  if (!patches) { errors.push(`${file}：沒有定義 ${chapterKey}`); return; }

  Object.entries(patches).forEach(([pageId, patch]) => {
    const where = `${file} · ${pageId}`;
    if (!pagesBefore.has(pageId)) { errors.push(`${where}：教材裡沒有這一頁`); return; }
    stats.pages++;
    const blockCount = pagesBefore.get(pageId);

    Object.keys(patch.replace || {}).forEach(i => {
      if (Number(i) >= blockCount) errors.push(`${where}：replace 索引 ${i} 超出原本的 ${blockCount} 個區塊`);
    });
    Object.keys(patch.insertAfter || {}).forEach(i => {
      if (Number(i) >= blockCount) errors.push(`${where}：insertAfter 索引 ${i} 超出原本的 ${blockCount} 個區塊`);
    });

    const blocks = [
      ...Object.values(patch.replace || {}),
      ...Object.values(patch.insertAfter || {}),
      ...(patch.append || [])
    ];
    if (!blocks.length) errors.push(`${where}：這一頁登記了補丁但沒有任何區塊`);

    blocks.forEach(block => {
      if (block.type === 'arch') {
        stats.arch++;
        const ids = new Set();
        (block.nodes || []).forEach(node => {
          if (!node.id) errors.push(`${where}：arch 有節點沒有 id`);
          if (ids.has(node.id)) errors.push(`${where}：arch 節點 id 重複 → ${node.id}`);
          if (!node.label) errors.push(`${where}：arch 節點 ${node.id} 沒有 label`);
          ids.add(node.id);
        });
        if (!ids.size) errors.push(`${where}：arch 沒有任何節點`);

        const edgeKeys = new Set();
        (block.edges || []).forEach(edge => {
          stats.edges++;
          if (!ids.has(edge.from)) errors.push(`${where}：arch 連線起點不存在 → ${edge.from}`);
          if (!ids.has(edge.to)) errors.push(`${where}：arch 連線終點不存在 → ${edge.to}`);
          if (edge.from === edge.to) errors.push(`${where}：arch 連線起訖相同 → ${edge.from}`);
          const key = `${edge.from}>${edge.to}`;
          if (edgeKeys.has(key)) errors.push(`${where}：arch 有重複的連線 → ${key}`);
          edgeKeys.add(key);
        });

        (block.flows || []).forEach(flow => {
          if (!flow.label) errors.push(`${where}：arch 有資料流沒有 label`);
          if (!(flow.steps || []).length) errors.push(`${where}：資料流「${flow.label}」沒有步驟`);
          (flow.steps || []).forEach((step, i) => {
            stats.steps++;
            if (step.node) {
              // 只點亮單一節點的步驟
              if (!ids.has(step.node)) {
                errors.push(`${where}：資料流「${flow.label}」第 ${i + 1} 步指到不存在的節點 → ${step.node}`);
              }
            } else {
              const key = `${step.from}>${step.to}`;
              if (!edgeKeys.has(key)) {
                errors.push(`${where}：資料流「${flow.label}」第 ${i + 1} 步用了不存在的連線 → ${key}`);
              }
            }
            if (!step.text) errors.push(`${where}：資料流「${flow.label}」第 ${i + 1} 步沒有說明文字`);
          });
        });

        // 同一格被兩個節點佔住的話，grid 會把它們疊在一起。
        const cells = new Map();
        (block.nodes || []).forEach(node => {
          const row = Number(node.row) || 1;
          const col = Number(node.col) || 1;
          for (let c = col; c < col + (Number(node.span) || 1); c++) {
            const cell = `${row}:${c}`;
            if (cells.has(cell)) errors.push(`${where}：arch 節點 ${node.id} 與 ${cells.get(cell)} 佔到同一格 (row ${row}, col ${c})`);
            cells.set(cell, node.id);
          }
        });
      }

      if (block.type === 'probe') {
        stats.probe++;
        if (!block.ask) errors.push(`${where}：probe 沒有題目`);
        const options = block.options || [];
        if (options.length < 2) errors.push(`${where}：probe「${block.ask}」選項少於 2 個`);
        const correct = options.filter(o => o[1] === true).length;
        if (correct !== 1) errors.push(`${where}：probe「${block.ask}」的正確選項有 ${correct} 個，應該剛好 1 個`);
        options.forEach((o, i) => {
          if (!o[0]) errors.push(`${where}：probe 第 ${i + 1} 個選項沒有文字`);
          if (!o[2]) errors.push(`${where}：probe 第 ${i + 1} 個選項沒有回饋說明`);
        });
      }
    });
  });
});

// 逐頁互動的覆蓋率：這三章的每一頁都應該至少有一個 arch 或 probe。
run('system-design-book-interactive.js');
const targetChapters = ['sd-book-14', 'sd-book-15', 'sd-book-17'];
const coverage = [];
Object.keys(sandbox.window)
  .filter(key => /^SYSTEM_DESIGN_CHAPTER_\d+$/.test(key))
  .map(key => sandbox.window[key])
  .filter(chapter => targetChapters.includes(chapter.id))
  .forEach(chapter => {
    const bare = [];
    let total = 0;
    chapter.sections.forEach(section => section.pages.forEach(page => {
      total++;
      const interactive = page.blocks.some(b => ['arch', 'probe', 'liveDiagram', 'diagram'].includes(b.type));
      if (!interactive) bare.push(page.id);
    }));
    coverage.push({ id: chapter.id, total, bare });
  });

console.log(`檢查了 ${interactiveFiles.length} 個互動檔、${stats.pages} 頁`);
console.log(`  架構圖 ${stats.arch} 張（連線 ${stats.edges} 條、資料流步驟 ${stats.steps} 步）`);
console.log(`  逐頁自我檢核 ${stats.probe} 題`);
coverage.forEach(c => {
  const done = c.total - c.bare.length;
  console.log(`  ${c.id}：${done}/${c.total} 頁有互動${c.bare.length ? `（缺：${c.bare.join(', ')}）` : ''}`);
});

test('互動層的頁面 id、架構圖連線與 probe 選項都指得到東西', () => {
  assert.deepEqual(errors, [], `\n  - ${errors.join('\n  - ')}`);
});

test('三個服務章節的每一頁都至少有一個互動區塊', () => {
  coverage.forEach(c => assert.deepEqual(c.bare, [], `${c.id} 有 ${c.bare.length} 頁沒有互動`));
});
