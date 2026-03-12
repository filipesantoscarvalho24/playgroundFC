const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');

const ROAD_MARGIN = 60;
const LANE_WIDTH = (canvas.width - ROAD_MARGIN * 2) / 3;
const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 84;

const keys = {
  left: false,
  right: false,
};

const state = {
  running: true,
  score: 0,
  best: Number(localStorage.getItem('raceBest') ?? 0),
  speed: 5,
  trafficTimer: 0,
  stripeOffset: 0,
  player: {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 7,
  },
  enemies: [],
};

bestEl.textContent = state.best;

function randomLaneX() {
  const lane = Math.floor(Math.random() * 3);
  return ROAD_MARGIN + lane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
}

function spawnEnemy() {
  state.enemies.push({
    x: randomLaneX(),
    y: -120,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    color: `hsl(${Math.random() * 360} 85% 55%)`,
    speed: state.speed + 1 + Math.random() * 2.2,
  });
}

function drawRoad() {
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(ROAD_MARGIN, 0, canvas.width - ROAD_MARGIN * 2, canvas.height);

  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(ROAD_MARGIN - 10, 0, 10, canvas.height);
  ctx.fillRect(canvas.width - ROAD_MARGIN, 0, 10, canvas.height);

  const stripeHeight = 46;
  const gap = 38;
  ctx.fillStyle = '#f2f2f2';
  for (let lane = 1; lane <= 2; lane += 1) {
    const stripeX = ROAD_MARGIN + lane * LANE_WIDTH - 4;
    for (let y = -stripeHeight + state.stripeOffset; y < canvas.height; y += stripeHeight + gap) {
      ctx.fillRect(stripeX, y, 8, stripeHeight);
    }
  }
}

function drawCar(car, color = '#43d147') {
  ctx.save();
  ctx.translate(car.x, car.y);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, car.width, car.height);

  ctx.fillStyle = '#171717';
  ctx.fillRect(7, 10, car.width - 14, 20);
  ctx.fillRect(7, car.height - 32, car.width - 14, 18);

  ctx.fillStyle = '#cfcfcf';
  ctx.fillRect(4, 14, 4, 16);
  ctx.fillRect(car.width - 8, 14, 4, 16);
  ctx.fillRect(4, car.height - 30, 4, 16);
  ctx.fillRect(car.width - 8, car.height - 30, 4, 16);

  ctx.restore();
}

function hit(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resetGame() {
  state.running = true;
  state.score = 0;
  state.speed = 5;
  state.trafficTimer = 0;
  state.enemies = [];
  state.player.x = canvas.width / 2 - PLAYER_WIDTH / 2;
  scoreEl.textContent = '0';
  statusEl.textContent = 'Back on track! Avoid traffic.';
}

function gameOver() {
  state.running = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  bestEl.textContent = String(state.best);
  localStorage.setItem('raceBest', String(state.best));
  statusEl.textContent = 'Crash! Press Space to restart.';
}

function update() {
  if (!state.running) return;

  if (keys.left) state.player.x -= state.player.speed;
  if (keys.right) state.player.x += state.player.speed;

  const leftBound = ROAD_MARGIN + 8;
  const rightBound = canvas.width - ROAD_MARGIN - state.player.width - 8;
  state.player.x = Math.max(leftBound, Math.min(rightBound, state.player.x));

  state.trafficTimer += 1;
  if (state.trafficTimer > Math.max(28, 86 - state.speed * 7)) {
    spawnEnemy();
    state.trafficTimer = 0;
  }

  state.stripeOffset = (state.stripeOffset + state.speed) % 84;
  state.speed += 0.0015;
  state.score += 0.12;

  for (const enemy of state.enemies) {
    enemy.y += enemy.speed;
    if (hit(state.player, enemy)) {
      gameOver();
      break;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.y < canvas.height + 120);
  scoreEl.textContent = String(Math.floor(state.score));
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoad();

  for (const enemy of state.enemies) {
    drawCar(enemy, enemy.color);
  }

  drawCar(state.player);

  if (!state.running) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '22px sans-serif';
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 35);
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') keys.left = true;
  if (key === 'arrowright' || key === 'd') keys.right = true;

  if (event.code === 'Space' && !state.running) {
    resetGame();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') keys.left = false;
  if (key === 'arrowright' || key === 'd') keys.right = false;
});

loop();
