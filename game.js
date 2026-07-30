(() => {
  const canvas = document.getElementById("dash-canvas");
  const scoreEl = document.getElementById("game-score");
  const metaEl = document.getElementById("game-meta");
  const startBtn = document.getElementById("game-start");
  if (!canvas || !scoreEl || !metaEl || !startBtn) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const GROUND = H - 48;
  const STORAGE_BEST = "arcane-horizon-dash-best";

  const state = {
    running: false,
    dead: false,
    ready: true,
    score: 0,
    best: Number(localStorage.getItem(STORAGE_BEST)) || 0,
    speed: 4.2,
    tick: 0,
    spawnTimer: 0,
    bird: {
      x: 120,
      y: H * 0.45,
      vy: 0,
      r: 16,
      rot: 0,
    },
    obstacles: [],
    particles: [],
  };

  metaEl.textContent = `Best: ${state.best}`;

  function flap() {
    if (!state.running) {
      startGame();
      return;
    }
    if (state.dead) {
      resetGame();
      startGame();
      return;
    }
    state.bird.vy = -7.4;
    spawnFlapBurst();
  }

  function startGame() {
    if (state.running && !state.dead) return;
    resetGame();
    state.running = true;
    state.dead = false;
    state.ready = false;
    startBtn.textContent = "Flap!";
    loop();
  }

  function resetGame() {
    state.score = 0;
    state.speed = 4.2;
    state.tick = 0;
    state.spawnTimer = 0;
    state.obstacles = [];
    state.particles = [];
    state.bird.y = H * 0.45;
    state.bird.vy = 0;
    state.bird.rot = 0;
    scoreEl.textContent = "Score: 0";
    drawFrame();
  }

  function spawnFlapBurst() {
    for (let i = 0; i < 6; i += 1) {
      state.particles.push({
        x: state.bird.x - 8,
        y: state.bird.y,
        vx: -1 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 3,
        life: 18 + Math.random() * 10,
      });
    }
  }

  function spawnObstacle() {
    const roll = Math.random();
    const x = W + 40;

    if (roll < 0.34) {
      // ground spikes (Geometry Dash style)
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i += 1) {
        state.obstacles.push({
          type: "spike",
          x: x + i * 28,
          y: GROUND,
          w: 26,
          h: 28,
          scored: false,
        });
      }
    } else if (roll < 0.62) {
      // floating block
      const h = 40 + Math.random() * 70;
      const y = 80 + Math.random() * (GROUND - h - 100);
      state.obstacles.push({
        type: "block",
        x,
        y,
        w: 42,
        h,
        scored: false,
      });
    } else if (roll < 0.82) {
      // ceiling spike
      state.obstacles.push({
        type: "ceiling",
        x,
        y: 0,
        w: 28,
        h: 50 + Math.random() * 40,
        scored: false,
      });
    } else {
      // pillar gap like pipes / dash corridor
      const gap = 110;
      const topH = 40 + Math.random() * (GROUND - gap - 80);
      state.obstacles.push({
        type: "block",
        x,
        y: 0,
        w: 46,
        h: topH,
        scored: false,
      });
      state.obstacles.push({
        type: "block",
        x,
        y: topH + gap,
        w: 46,
        h: GROUND - (topH + gap),
        scored: false,
      });
    }
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function birdHitbox() {
    const s = state.bird.r * 1.35;
    return {
      x: state.bird.x - s * 0.45,
      y: state.bird.y - s * 0.4,
      w: s * 0.9,
      h: s * 0.75,
    };
  }

  function obstacleHitbox(o) {
    if (o.type === "spike") {
      return { x: o.x + 4, y: o.y - o.h + 4, w: o.w - 8, h: o.h - 6 };
    }
    if (o.type === "ceiling") {
      return { x: o.x + 4, y: o.y, w: o.w - 8, h: o.h - 4 };
    }
    return { x: o.x, y: o.y, w: o.w, h: o.h };
  }

  function die() {
    if (state.dead) return;
    state.dead = true;
    state.running = false;
    startBtn.textContent = "Retry";
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(STORAGE_BEST, String(state.best));
      metaEl.textContent = `Best: ${state.best}`;
    }

    const reward = Math.floor(state.score / 5);
    if (reward > 0) {
      window.dispatchEvent(
        new CustomEvent("arcane-game-reward", {
          detail: { tokens: reward, score: state.score },
        })
      );
    }

    drawFrame();
  }

  function update() {
    state.tick += 1;
    state.speed = 4.2 + Math.min(4, state.score * 0.05);

    state.bird.vy += 0.38;
    state.bird.y += state.bird.vy;
    state.bird.rot = Math.max(-0.6, Math.min(1.1, state.bird.vy * 0.08));

    if (state.bird.y + state.bird.r > GROUND) {
      state.bird.y = GROUND - state.bird.r;
      die();
      return;
    }
    if (state.bird.y - state.bird.r < 0) {
      state.bird.y = state.bird.r;
      state.bird.vy = 0;
    }

    state.spawnTimer -= 1;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      state.spawnTimer = 55 + Math.random() * 35 - Math.min(20, state.score);
    }

    const hit = birdHitbox();
    state.obstacles.forEach((o) => {
      o.x -= state.speed;
      if (!o.scored && o.x + o.w < state.bird.x) {
        o.scored = true;
        state.score += 1;
        scoreEl.textContent = `Score: ${state.score}`;
      }
      if (rectsOverlap(hit, obstacleHitbox(o))) {
        die();
      }
    });

    state.obstacles = state.obstacles.filter((o) => o.x > -80);

    state.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    });
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function drawGrid() {
    ctx.fillStyle = "rgba(10, 6, 22, 0.55)";
    ctx.fillRect(0, 0, W, H);

    // scrolling neon grid floor vibe
    const offset = (state.tick * state.speed) % 40;
    ctx.strokeStyle = "rgba(255, 113, 206, 0.18)";
    ctx.lineWidth = 1;
    for (let x = -offset; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GROUND);
      ctx.stroke();
    }
    for (let y = 0; y < GROUND; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawGround() {
    ctx.fillStyle = "#1a1028";
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = "#ff71ce";
    ctx.fillRect(0, GROUND, W, 4);
    ctx.fillStyle = "rgba(122, 240, 255, 0.7)";
    ctx.fillRect(0, GROUND + 4, W, 2);
  }

  function drawSpike(o) {
    ctx.fillStyle = "#b8ff3c";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w / 2, o.y - o.h);
    ctx.lineTo(o.x + o.w, o.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();
  }

  function drawCeilingSpike(o) {
    ctx.fillStyle = "#7af0ff";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w / 2, o.y + o.h);
    ctx.lineTo(o.x + o.w, o.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBlock(o) {
    const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
    grad.addColorStop(0, "#ff2bd6");
    grad.addColorStop(1, "#7a2bff");
    ctx.fillStyle = grad;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
  }

  function drawBird() {
    const b = state.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);

    // body
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // wing
    ctx.fillStyle = "#f0b429";
    ctx.beginPath();
    ctx.ellipse(-4, 2, 10, 6, -0.4 + Math.sin(state.tick * 0.4) * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(9.5, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = "#ff7a18";
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 25);
      ctx.fillStyle = "#7af0ff";
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    });
  }

  function drawOverlayText() {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 22px Orbitron, sans-serif";
    ctx.textAlign = "center";
    if (state.ready && !state.running) {
      ctx.fillText("HORIZON DASH", W / 2, H * 0.38);
      ctx.font = "600 16px Rajdhani, sans-serif";
      ctx.fillStyle = "rgba(215,196,234,0.95)";
      ctx.fillText("Flappy Bird in a Geometry Dash run", W / 2, H * 0.48);
      ctx.fillText("Press Play / Click / Space to flap", W / 2, H * 0.56);
    } else if (state.dead) {
      ctx.fillText("CRASHED", W / 2, H * 0.4);
      ctx.font = "600 16px Rajdhani, sans-serif";
      ctx.fillStyle = "rgba(215,196,234,0.95)";
      ctx.fillText(`Score ${state.score} · Click or Retry`, W / 2, H * 0.5);
    }
  }

  function drawFrame() {
    drawGrid();
    drawGround();
    state.obstacles.forEach((o) => {
      if (o.type === "spike") drawSpike(o);
      else if (o.type === "ceiling") drawCeilingSpike(o);
      else drawBlock(o);
    });
    drawParticles();
    drawBird();
    drawOverlayText();
  }

  let raf = 0;
  function loop() {
    if (!state.running) {
      drawFrame();
      return;
    }
    update();
    drawFrame();
    if (state.running) {
      raf = requestAnimationFrame(loop);
    }
  }

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    flap();
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    flap();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      // Don't steal space from typing in inputs
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      flap();
    }
  });

  drawFrame();
})();
