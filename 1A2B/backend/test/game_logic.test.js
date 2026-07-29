const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValid4Digits,
  calculate1A2B,
  assignTargets,
  sortLeaderboard,
  generateRandomAnswer
} = require('../game_utils.js');

test('1. 驗證 4 位不重複數字函數 (isValid4Digits)', () => {
  assert.equal(isValid4Digits('1234'), true);
  assert.equal(isValid4Digits('0987'), true);
  assert.equal(isValid4Digits('1233'), false);
  assert.equal(isValid4Digits('123'), false);
  assert.equal(isValid4Digits('12345'), false);
  assert.equal(isValid4Digits('abcd'), false);
});

test('2. 1A2B 計算正確性 (calculate1A2B)', () => {
  assert.deepEqual(calculate1A2B('1234', '1234'), { a: 4, b: 0 });
  assert.deepEqual(calculate1A2B('1234', '4321'), { a: 0, b: 4 });
  assert.deepEqual(calculate1A2B('1234', '1243'), { a: 2, b: 2 });
  assert.deepEqual(calculate1A2B('1234', '5678'), { a: 0, b: 0 });
});

test('3. 隨機 4 位題目生成器 (generateRandomAnswer)', () => {
  for (let i = 0; i < 20; i++) {
    const ans = generateRandomAnswer();
    assert.equal(isValid4Digits(ans), true);
  }
});

test('4. 題目指派邏輯 (assignTargets) - 無人數限制與單人模式', async (t) => {
  await t.test('單人模式 (N=1)', () => {
    const players = [{ id: 'p1', name: 'Alice', answer: '1234' }];
    const assigned = assignTargets(players);
    assert.equal(assigned.length, 1);
    assert.notEqual(assigned[0].targetPlayerId, null);
    assert.ok(assigned[0].targetAnswer);
  });

  await t.test('雙人對戰 (N=2)', () => {
    const players = [
      { id: 'p1', name: 'Alice', answer: '1234' },
      { id: 'p2', name: 'Bob', answer: '5678' }
    ];
    const assigned = assignTargets(players);
    assert.equal(assigned[0].targetPlayerId, 'p2');
    assert.equal(assigned[1].targetPlayerId, 'p1');
  });

  await t.test('多人對戰 (N=10 人)', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      answer: `${i}234`
    }));
    const assigned = assignTargets(players);
    assert.equal(assigned.length, 10);
    for (let i = 0; i < 10; i++) {
      const expectedTargetIdx = (i + 1) % 10;
      assert.equal(assigned[i].targetPlayerId, `p${expectedTargetIdx}`);
    }
  });
});

test('5. 排行榜勝負排序算法 (sortLeaderboard)', () => {
  const players = [
    {
      id: 'p1',
      name: 'Alice',
      completed: true,
      guesses: [{ a: 1 }, { a: 2 }, { a: 4 }],
      finishTimeSec: 45
    },
    {
      id: 'p2',
      name: 'Bob',
      completed: true,
      guesses: [{ a: 1 }, { a: 4 }],
      finishTimeSec: 50
    },
    {
      id: 'p3',
      name: 'Charlie',
      completed: true,
      guesses: [{ a: 1 }, { a: 2 }, { a: 4 }],
      finishTimeSec: 30
    },
    {
      id: 'p4',
      name: 'Dave',
      completed: false,
      guesses: [{ a: 1 }],
      finishTimeSec: null
    }
  ];

  const sorted = sortLeaderboard(players);
  assert.equal(sorted[0].id, 'p2');
  assert.equal(sorted[1].id, 'p3');
  assert.equal(sorted[2].id, 'p1');
  assert.equal(sorted[3].id, 'p4');
});
