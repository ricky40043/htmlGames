/*
 * 題庫出題品質自動化檢查。
 *
 * 針對第 14、15、17 章（YouTube、Google Drive、Google 地圖）的 236 題選擇題，
 * 防止出現「正解幾乎總是最長選項」的系統性出題瑕疵。
 *
 * 驗收標準：
 * 1. 「明顯偏長」= 0 題（正解字數 > 誘答平均字數 × 1.8 且多出 10 字以上）
 * 2. 「正解剛好最長」≤ 40%
 * 3. 任一題的「正解字數 − 最長誘答字數」≤ 5
 * 4. 每題剛好 1 個正解，每個誘答都有非空的誤區說明
 * 5. 指定的重複題幹無逐字重複
 *
 * 執行：node --test tests/check-quiz-quality.js
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

const quizFiles = [
  'system-design-book-ch14-part1.js',
  'system-design-book-ch14-part2.js',
  'system-design-book-ch14-final.js',
  'system-design-book-ch15-part1.js',
  'system-design-book-ch15-part2.js',
  'system-design-book-ch15-final.js',
  'system-design-book-ch17-part1.js',
  'system-design-book-ch17-part2.js',
  'system-design-book-ch17-final.js'
];

quizFiles.forEach(run);

const chapters = [
  { id: 'ch14', data: sandbox.window.SYSTEM_DESIGN_CHAPTER_14 },
  { id: 'ch15', data: sandbox.window.SYSTEM_DESIGN_CHAPTER_15 },
  { id: 'ch17', data: sandbox.window.SYSTEM_DESIGN_CHAPTER_17 }
];

const allQuestions = [];
chapters.forEach(ch => {
  if (!ch.data) throw new Error(`找不到章節資料：${ch.id}`);
  (ch.data.sections || []).forEach(sec => {
    (sec.quiz || []).forEach(q => {
      allQuestions.push({ chapter: ch.id, section: sec.id, type: 'section', q });
    });
  });
  (ch.data.finalExam || []).forEach(q => {
    allQuestions.push({ chapter: ch.id, section: 'finalExam', type: 'final', q });
  });
});

// 指標計算
let correctLongestCount = 0;
let obviousLongestCount = 0;
const diffGreaterThan5 = [];
const structureErrors = [];
const emptyMisconceptions = [];

allQuestions.forEach(({ chapter, section, q }) => {
  const where = `${chapter} · ${section} · ${q.id}`;
  const options = q.options || [];
  const correctOptions = options.filter(o => o.correct === true);
  const wrongOptions = options.filter(o => !o.correct);

  if (correctOptions.length !== 1) {
    structureErrors.push(`${where}：「${q.question}」的正解個數為 ${correctOptions.length}，必須剛好 1 個`);
    return;
  }
  if (wrongOptions.length < 1) {
    structureErrors.push(`${where}：「${q.question}」沒有任何誘答`);
    return;
  }

  wrongOptions.forEach((w, idx) => {
    if (!w.misconception || typeof w.misconception !== 'string' || !w.misconception.trim()) {
      emptyMisconceptions.push(`${where}：誘答 ${idx + 1}「${w.text}」缺少非空的誤區說明`);
    }
  });

  const correctText = correctOptions[0].text || '';
  const cLen = correctText.length;
  const wLens = wrongOptions.map(w => (w.text || '').length);
  const maxW = Math.max(...wLens);
  const avgW = wLens.reduce((sum, len) => sum + len, 0) / wLens.length;

  if (cLen >= maxW) {
    correctLongestCount++;
  }

  // 定義：正解字數 > 誘答平均字數 × 1.8，且多出 10 字以上
  if (cLen > avgW * 1.8 && (cLen - avgW) > 10) {
    obviousLongestCount++;
  }

  // 任一題的「正解字數 − 最長誘答字數」≤ 5
  const diff = cLen - maxW;
  if (diff > 5) {
    const longestWrong = wrongOptions.find(w => (w.text || '').length === maxW);
    diffGreaterThan5.push({
      where,
      id: q.id,
      question: q.question,
      diff,
      cLen,
      correctText,
      maxW,
      longestWrongText: longestWrong ? longestWrong.text : ''
    });
  }
});

// 重複題幹檢查
const duplicateCheckPairs = [
  ['sd15-s01-q3', 'sd15-ex-e02'],
  ['sd15-s02-q2', 'sd15-ex-e04'],
  ['sd15-s06-q2', 'sd15-ex-e07'],
  ['sd15-s11-q4', 'sd15-ex-m09']
];
const duplicateErrors = [];

duplicateCheckPairs.forEach(([sId, fId]) => {
  const sq = allQuestions.find(item => item.q.id === sId)?.q;
  const fq = allQuestions.find(item => item.q.id === fId)?.q;
  if (!sq || !fq) {
    duplicateErrors.push(`找不到要比對的題目：${sId} 或 ${fId}`);
  } else if (sq.question.trim() === fq.question.trim()) {
    duplicateErrors.push(`${sId} 與 ${fId} 題幹完全相同：「${sq.question}」`);
  }
});

const total = allQuestions.length;
const correctLongestRatio = (correctLongestCount / total) * 100;

console.log(`題庫品質量測結果（共 ${total} 題）：`);
console.log(`  - 正解剛好最長：${correctLongestCount} 題 (${correctLongestRatio.toFixed(1)}%) [標準：≤ 40%]`);
console.log(`  - 明顯偏長題數：${obviousLongestCount} 題 [標準：0 題]`);
console.log(`  - 正解字數 − 最長誘答字數 > 5：${diffGreaterThan5.length} 題 [標準：0 題]`);
console.log(`  - 誘答缺少誤區說明：${emptyMisconceptions.length} 題 [標準：0 題]`);
console.log(`  - 指定重複題幹：${duplicateErrors.length} 組 [標準：0 組]`);

test('題庫總題數應為 236 題', () => {
  assert.equal(total, 236, `預期 236 題，實際 ${total} 題`);
});

test('每題剛好 1 個正解，選項結構完整', () => {
  assert.deepEqual(structureErrors, [], `\n  - ${structureErrors.join('\n  - ')}`);
});

test('每個誘答都有非空的誤區說明', () => {
  assert.deepEqual(emptyMisconceptions, [], `\n  - ${emptyMisconceptions.join('\n  - ')}`);
});

test('明顯偏長題數必須為 0 題', () => {
  assert.equal(obviousLongestCount, 0, `有 ${obviousLongestCount} 題明顯偏長`);
});

test('任一題的「正解字數 − 最長誘答字數」≤ 5', () => {
  const details = diffGreaterThan5.map(d =>
    `${d.where}: 正解(${d.cLen}字)「${d.correctText}」比最長誘答(${d.maxW}字)「${d.longestWrongText}」多 ${d.diff} 字`
  );
  assert.deepEqual(diffGreaterThan5, [], `有 ${diffGreaterThan5.length} 題正解比最長誘答多超過 5 字：\n  - ${details.slice(0, 10).join('\n  - ')}${details.length > 10 ? `\n  ... 還有 ${details.length - 10} 題` : ''}`);
});

test('正解剛好最長比例 ≤ 40%', () => {
  assert.ok(
    correctLongestRatio <= 40,
    `正解最長比例為 ${correctLongestRatio.toFixed(1)}% (${correctLongestCount}/${total})，超出標準 40%`
  );
});

test('ch15 4 組小節與章末考題幹無逐字重複', () => {
  assert.deepEqual(duplicateErrors, [], `\n  - ${duplicateErrors.join('\n  - ')}`);
});
