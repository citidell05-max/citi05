(() => {
  function boot() {
    const canvas = document.getElementById("dash-canvas");
    const scoreEl = document.getElementById("game-score");
    const metaEl = document.getElementById("game-meta");
    const startBtn = document.getElementById("game-start");

    if (!canvas || !scoreEl || !metaEl || !startBtn) {
      console.error("Horizon Dash: missing game elements");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      scoreEl.textContent = "Canvas not supported";
      return;
    }

    const sceneBg = new Image();
    sceneBg.src = "assets/themes/11-sunrise.jpg?v=2";
    window.addEventListener("arcane-theme-change", (e) => {
      if (e.detail?.theme?.src) sceneBg.src = e.detail.theme.src;
    });
    sceneBg.decoding = "async";

    const W = canvas.width;
    const H = canvas.height;
    const GROUND = H - 48;
    const STORAGE_BEST = "arcane-horizon-dash-best";
    const GRAVITY = 0.32;
    const FLAP_FORCE = -7.2;

    const state = {
      mode: "idle", // idle | playing | dead
      score: 0,
      best: Number(localStorage.getItem(STORAGE_BEST)) || 0,
      speed: 3.8,
      tick: 0,
      spawnIn: 90,
      bird: { x: 130, y: H * 0.42, vy: 0, r: 16, rot: 0 },
      obstacles: [],
      particles: [],
      skyBirds: [],
    };

    metaEl.textContent = `Best: ${state.best}`;
    startBtn.textContent = "Play";
    scoreEl.textContent = "Score: 0";

    for (let i = 0; i < 4; i += 1) {
      state.skyBirds.push({
        x: Math.random() * W,
        y: 30 + Math.random() * 90,
        speed: 0.6 + Math.random() * 1.1,
        dir: Math.random() > 0.5 ? 1 : -1,
        wing: Math.random() * 10,
        size: 8 + Math.random() * 6,
      });
    }

    function ellipse(x, y, rx, ry) {
      if (typeof ctx.ellipse === "function") {
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        return;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx, ry);
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.restore();
    }

    function resetRun() {
      state.score = 0;
      state.speed = 3.8;
      state.tick = 0;
      state.spawnIn = 90;
      state.obstacles = [];
      state.particles = [];
      state.bird.y = H * 0.42;
      state.bird.vy = FLAP_FORCE;
      state.bird.rot = -0.35;
      scoreEl.textContent = "Score: 0";
    }

    function startRun() {
      resetRun();
      state.mode = "playing";
      startBtn.textContent = "Flap!";
      burst();
    }

    function flap() {
      if (state.mode === "idle" || state.mode === "dead") {
        startRun();
        return;
      }
      state.bird.vy = FLAP_FORCE;
      burst();
    }

    function burst() {
      for (let i = 0; i < 7; i += 1) {
        state.particles.push({
          x: state.bird.x - 10,
          y: state.bird.y,
          vx: -1.5 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 3,
          life: 16 + Math.random() * 12,
        });
      }
    }

    function spawnObstacle() {
      const roll = Math.random();
      const x = W + 50;

      if (roll < 0.3) {
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i += 1) {
          state.obstacles.push({
            type: "spike",
            x: x + i * 30,
            y: GROUND,
            w: 26,
            h: 26,
            scored: false,
          });
        }
      } else if (roll < 0.55) {
        const h = 36 + Math.random() * 60;
        const y = 70 + Math.random() * (GROUND - h - 110);
        state.obstacles.push({
          type: "block",
          x,
          y,
          w: 40,
          h,
          scored: false,
        });
      } else if (roll < 0.75) {
        state.obstacles.push({
          type: "ceiling",
          x,
          y: 0,
          w: 28,
          h: 45 + Math.random() * 35,
          scored: false,
        });
      } else {
        const gap = 120;
        const topH = 50 + Math.random() * (GROUND - gap - 90);
        state.obstacles.push({
          type: "block",
          x,
          y: 0,
          w: 44,
          h: topH,
          scored: false,
        });
        state.obstacles.push({
          type: "block",
          x,
          y: topH + gap,
          w: 44,
          h: GROUND - (topH + gap),
          scored: false,
        });
      }
    }

    function birdBox() {
      const s = state.bird.r;
      return {
        x: state.bird.x - s * 0.55,
        y: state.bird.y - s * 0.5,
        w: s * 1.1,
        h: s,
      };
    }

    function obsBox(o) {
      if (o.type === "spike") {
        return { x: o.x + 5, y: o.y - o.h + 6, w: o.w - 10, h: o.h - 8 };
      }
      if (o.type === "ceiling") {
        return { x: o.x + 5, y: o.y, w: o.w - 10, h: o.h - 6 };
      }
      return { x: o.x, y: o.y, w: o.w, h: o.h };
    }

    function hit(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function die() {
      if (state.mode !== "playing") return;
      state.mode = "dead";
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
    }

    function update() {
      if (state.mode !== "playing") return;

      state.tick += 1;
      state.speed = 3.8 + Math.min(3.5, state.score * 0.045);

      state.bird.vy += GRAVITY;
      state.bird.y += state.bird.vy;
      state.bird.rot = Math.max(-0.55, Math.min(1.0, state.bird.vy * 0.075));

      if (state.bird.y + state.bird.r >= GROUND) {
        state.bird.y = GROUND - state.bird.r;
        die();
        return;
      }
      if (state.bird.y - state.bird.r < 0) {
        state.bird.y = state.bird.r;
        state.bird.vy = 0;
      }

      state.spawnIn -= 1;
      if (state.spawnIn <= 0) {
        spawnObstacle();
        state.spawnIn = 70 + Math.random() * 40 - Math.min(25, state.score);
      }

      const box = birdBox();
      for (const o of state.obstacles) {
        o.x -= state.speed;
        if (!o.scored && o.x + o.w < state.bird.x - 10) {
          o.scored = true;
          state.score += 1;
          scoreEl.textContent = `Score: ${state.score}`;
        }
        if (hit(box, obsBox(o))) {
          die();
          break;
        }
      }

      state.obstacles = state.obstacles.filter((o) => o.x > -100);
      state.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
      });
      state.particles = state.particles.filter((p) => p.life > 0);

      state.skyBirds.forEach((b) => {
        b.x += b.speed * b.dir;
        b.wing += 0.25;
        if (b.x < -40) b.x = W + 40;
        if (b.x > W + 40) b.x = -40;
      });
    }

    function drawBackground() {
      if (sceneBg.complete && sceneBg.naturalWidth) {
        const scroll = (state.tick * state.speed * 0.35) % W;
        // Parallax draw twice for seamless scroll
        ctx.drawImage(sceneBg, -scroll, 0, W, H);
        ctx.drawImage(sceneBg, W - scroll, 0, W, H);
        ctx.fillStyle = "rgba(12, 4, 24, 0.35)";
        ctx.fillRect(0, 0, W, GROUND);
      } else {
        ctx.fillStyle = "#0b0716";
        ctx.fillRect(0, 0, W, H);
      }

      state.skyBirds.forEach((b) => {
        const flap = Math.sin(b.wing);
        ctx.save();
        ctx.translate(b.x, b.y);
        if (b.dir < 0) ctx.scale(-1, 1);
        ctx.fillStyle = "rgba(15, 12, 10, 0.8)";
        ctx.beginPath();
        ellipse(0, 0, b.size * 0.8, b.size * 0.35);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(4, -b.size * (0.8 + flap * 0.4), b.size * 0.6, -2);
        ctx.quadraticCurveTo(2, 0, -2, 0);
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = "rgba(18, 10, 28, 0.92)";
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = "#ff71ce";
      ctx.fillRect(0, GROUND, W, 4);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(0, GROUND + 4, W, 2);
    }

    function drawObstacles() {
      state.obstacles.forEach((o) => {
        if (o.type === "spike") {
          ctx.fillStyle = "#b8ff3c";
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x + o.w / 2, o.y - o.h);
          ctx.lineTo(o.x + o.w, o.y);
          ctx.closePath();
          ctx.fill();
        } else if (o.type === "ceiling") {
          ctx.fillStyle = "#7af0ff";
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x + o.w / 2, o.y + o.h);
          ctx.lineTo(o.x + o.w, o.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#ff2bd6";
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
        }
      });
    }

    function drawBird() {
      const b = state.bird;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);

      ctx.fillStyle = "#ffd84d";
      ctx.beginPath();
      ellipse(0, 0, 18, 14);
      ctx.fill();

      ctx.fillStyle = "#f0b429";
      ctx.beginPath();
      ellipse(-4, 2, 10, 6);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(8, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.arc(9.5, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();

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
        ctx.globalAlpha = Math.max(0, p.life / 24);
        ctx.fillStyle = "#7af0ff";
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
      });
    }

    function drawUI() {
      ctx.textAlign = "center";
      if (state.mode === "idle") {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("HORIZON DASH", W / 2, H * 0.36);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(220,200,240,0.95)";
        ctx.fillText("Flappy Bird + Geometry Dash", W / 2, H * 0.46);
        ctx.fillText("Click Play / canvas / Space to start", W / 2, H * 0.55);
      } else if (state.mode === "dead") {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("CRASHED", W / 2, H * 0.4);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(220,200,240,0.95)";
        ctx.fillText(`Score ${state.score} — click Retry`, W / 2, H * 0.5);
      } else if (state.tick < 90) {
        ctx.fillStyle = "rgba(184,255,60,0.9)";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("GO!", W / 2, 40);
      }
    }

    function draw() {
      drawBackground();
      drawObstacles();
      drawParticles();
      drawBird();
      drawUI();
    }

    function frame() {
      update();
      draw();
      requestAnimationFrame(frame);
    }

    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      flap();
    });

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      flap();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      if (window.__arcaneCowboyLock || window.__arcaneCupLock) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") {
        if (tag === "BUTTON" && document.activeElement.id !== "game-start") return;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      e.preventDefault();
      flap();
    });

    draw();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
