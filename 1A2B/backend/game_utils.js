/**
 * 1A2B 後端邏輯與演算法工具集
 */

function generateRandomAnswer() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * digits.length);
    result += digits[idx];
    digits.splice(idx, 1);
  }
  return result;
}

function calculate1A2B(guess, answer) {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 4; i++) {
    if (guess[i] === answer[i]) {
      a++;
    } else if (answer.includes(guess[i])) {
      b++;
    }
  }
  return { a, b };
}

function isValid4Digits(numStr) {
  if (!numStr || numStr.length !== 4) return false;
  if (!/^\d{4}$/.test(numStr)) return false;
  const set = new Set(numStr.split(''));
  return set.size === 4;
}

function assignTargets(players) {
  const n = players.length;
  const result = players.map(p => ({ ...p }));

  if (n === 1) {
    const aiAnswer = generateRandomAnswer();
    result[0].targetPlayerId = 'SYSTEM_AI';
    result[0].targetName = '🤖 系統 AI';
    result[0].targetAnswer = aiAnswer;
  } else {
    for (let i = 0; i < n; i++) {
      const targetIdx = (i + 1) % n;
      result[i].targetPlayerId = players[targetIdx].id;
      result[i].targetName = players[targetIdx].name;
      result[i].targetAnswer = players[targetIdx].answer;
    }
  }

  return result;
}

function sortLeaderboard(players) {
  return [...players].sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;

    if (a.completed && b.completed) {
      if (a.guesses.length !== b.guesses.length) {
        return a.guesses.length - b.guesses.length;
      }
      return (a.finishTimeSec || 0) - (b.finishTimeSec || 0);
    }

    const maxAa = Math.max(...a.guesses.map(g => g.a), 0);
    const maxAb = Math.max(...b.guesses.map(g => g.a), 0);
    if (maxAa !== maxAb) return maxAb - maxAa;

    return a.guesses.length - b.guesses.length;
  });
}

module.exports = {
  generateRandomAnswer,
  calculate1A2B,
  isValid4Digits,
  assignTargets,
  sortLeaderboard
};
