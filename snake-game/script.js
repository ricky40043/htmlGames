const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const overlayEl = document.getElementById('overlay');
const startOverlayEl = document.getElementById('start-overlay');
const finalScoreEl = document.getElementById('final-score');

// Constants
const GRID_SIZE = 20;
let TILE_COUNT = 20; // mutable now
let CANVAS_SIZE = TILE_COUNT * GRID_SIZE;

// Game state
let snake = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = -1;
let nextDx = 0;
let nextDy = -1;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let selectedBaseSpeed = 150; // default
let gameSpeed = 150; // ms
let lastTime = 0;

// Initialize canvas base width
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
highScoreEl.textContent = highScore;

let selectedTileCount = 20; // default mapped to "小"

function initGame() {
  TILE_COUNT = selectedTileCount;
  CANVAS_SIZE = TILE_COUNT * GRID_SIZE;
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  let startX = Math.floor(TILE_COUNT / 2);
  let startY = Math.floor(TILE_COUNT / 2);
  
  snake = [
    { x: startX, y: startY },
    { x: startX, y: startY + 1 },
    { x: startX, y: startY + 2 }
  ];
  dx = 0; dy = -1;
  nextDx = 0; nextDy = -1;
  score = 0;
  gameSpeed = selectedBaseSpeed;
  scoreEl.textContent = score;
  placeFood();
  overlayEl.classList.remove('visible');
  startOverlayEl.classList.remove('visible');
  gameRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function setSpeed(spd, btn) {
  selectedBaseSpeed = spd;
  // Update UI for speed options
  document.querySelectorAll('.speed-options .settings-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setSize(tiles, btn) {
  selectedTileCount = tiles;
  // Update UI for size options
  document.querySelectorAll('.size-options .settings-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function showMenu() {
  overlayEl.classList.remove('visible');
  startOverlayEl.classList.add('visible');
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * TILE_COUNT),
    y: Math.floor(Math.random() * TILE_COUNT)
  };
  // Avoid placing food on snake
  if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
    placeFood();
  }
}

function update() {
  if (!gameRunning) return;

  dx = nextDx;
  dy = nextDy;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Check collision with walls
  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    gameOver();
    return;
  }

  // Check collision with self
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check if food eaten
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
    placeFood();
    // Speed up slightly
    if (gameSpeed > 60) gameSpeed -= 1;
  } else {
    snake.pop();
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#11111a';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw grid (subtle)
  ctx.strokeStyle = '#1a1a25';
  ctx.lineWidth = 1;
  for (let i = 0; i < TILE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
    ctx.stroke();
  }

  // Draw food (glowing circle)
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#f87171';
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(
    food.x * GRID_SIZE + GRID_SIZE / 2,
    food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0, Math.PI * 2
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw snake
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    ctx.fillStyle = isHead ? '#4ade80' : '#22c39e';
    
    // Smooth snake look
    const r = 4; // Corner radius
    const x = segment.x * GRID_SIZE + 1;
    const y = segment.y * GRID_SIZE + 1;
    const w = GRID_SIZE - 2;
    const h = GRID_SIZE - 2;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    // Add eyes to head
    if (isHead) {
      ctx.fillStyle = '#111';
      let eyeX1, eyeY1, eyeX2, eyeY2;
      if (dx === 1) { // Right
        eyeX1 = x + 12; eyeY1 = y + 4; eyeX2 = x + 12; eyeY2 = y + 12;
      } else if (dx === -1) { // Left
        eyeX1 = x + 4; eyeY1 = y + 4; eyeX2 = x + 4; eyeY2 = y + 12;
      } else if (dy === 1) { // Down
        eyeX1 = x + 4; eyeY1 = y + 12; eyeX2 = x + 12; eyeY2 = y + 12;
      } else { // Up
        eyeX1 = x + 4; eyeY1 = y + 4; eyeX2 = x + 12; eyeY2 = y + 4;
      }
      ctx.fillRect(eyeX1, eyeY1, 3, 3);
      ctx.fillRect(eyeX2, eyeY2, 3, 3);
    }
  });
}

function gameLoop(currentTime) {
  if (!gameRunning) return;

  const deltaTime = currentTime - lastTime;
  if (deltaTime > gameSpeed) {
    update();
    draw();
    lastTime = currentTime;
  }
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  finalScoreEl.textContent = score;
  overlayEl.classList.add('visible');
}

// Input Handlers
function changeDirection(newDx, newDy) {
  // Prevent 180 degree turns
  if (newDx === -dx || newDy === -dy) return;
  nextDx = newDx;
  nextDy = newDy;
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': case 'w': changeDirection(0, -1); break;
    case 'ArrowDown': case 's': changeDirection(0, 1); break;
    case 'ArrowLeft': case 'a': changeDirection(-1, 0); break;
    case 'ArrowRight': case 'd': changeDirection(1, 0); break;
  }
});

// The game no longer starts automatically.
// initGame();
