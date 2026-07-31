(() => {
  function boot() {
    const canvas = document.getElementById("cup-canvas");
    const metaEl = document.getElementById("cup-meta");
    const statusEl = document.getElementById("cup-status");
    const hudEl = document.getElementById("cup-hud");
    const startBtn = document.getElementById("cup-start");
    if (!canvas || !metaEl || !startBtn || !hudEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const GROUND = H - 54;
    const STORAGE_BEST = "arcane-horizon-cup-best";

    const keys = { left: false, right: false, up: false, down: false, shoot: false };
    const state = {
      mode: "idle", // idle | playing | win | lose
      best: Number(localStorage.getItem(STORAGE_BEST)) || 0,
      t: 0,
      player: null,
      boss: null,
      bullets: [],
      bossShots: [],
      particles: [],
      score: 0,
      parryFlash: 0,
    };

    metaEl.textContent = `Wins: ${state.best}`;
    startBtn.textContent = "Fight Boss";
    if (statusEl) statusEl.textContent = "A/D or ←/→ move · W/↑/Space jump · S/↓ duck · Click or F shoot · Parry pink shots";

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function syncHud() {
      if (state.mode !== "playing" || !state.player || !state.boss) {
        hudEl.textContent = state.mode === "win" ? "BOSS DOWN!" : state.mode === "lose" ? "KNOCKED OUT" : "Ready to rumble";
        return;
      }
      hudEl.textContent = `HP ${Math.max(0, Math.ceil(state.player.hp))}  ·  Boss ${Math.max(0, Math.ceil(state.boss.hp))}  ·  Score ${state.score}`;
    }

    function setBusy(on) {
      window.__arcaneCupLock = !!on;
    }

    function forceStudyStop() {
      if (state.mode !== "playing") {
        startBtn.disabled = !!window.__arcaneStudyLock;
        return;
      }
      state.mode = "idle";
      setBusy(false);
      startBtn.disabled = !!window.__arcaneStudyLock;
      startBtn.textContent = "Fight Boss";
      setStatus("Study time — boss fight locked until focus ends");
      syncHud();
    }

    function reset() {
      if (window.arcaneGuardStudy?.()) return;
      state.mode = "playing";
      setBusy(true);
      state.t = 0;
      state.score = 0;
      state.bullets = [];
      state.bossShots = [];
      state.particles = [];
      state.parryFlash = 0;
      state.player = {
        x: 140,
        y: GROUND,
        vx: 0,
        vy: 0,
        w: 28,
        h: 40,
        hp: 3,
        facing: 1,
        onGround: true,
        duck: false,
        shootCd: 0,
        invuln: 0,
        anim: 0,
      };
      state.boss = {
        x: W - 180,
        y: GROUND,
        hp: 100,
        maxHp: 100,
        phase: 1,
        facing: -1,
        cd: 40,
        pattern: 0,
        slam: 0,
        bob: 0,
      };
      startBtn.textContent = "Restart";
      setStatus("Don't get hit! Duck under low shots · Parry glowing pink orbs");
      syncHud();
    }

    function end(win) {
      state.mode = win ? "win" : "lose";
      setBusy(false);
      startBtn.textContent = "Fight Again";
      if (win) {
        state.best += 1;
        localStorage.setItem(STORAGE_BEST, String(state.best));
        metaEl.textContent = `Wins: ${state.best}`;
        setStatus("Boss defeated! Progress toward Tokens recorded");
      } else {
        setStatus("You got dunked — try again, cup fighter!");
      }
      if (win || state.score > 0) {
        window.dispatchEvent(
          new CustomEvent("arcane-game-reward", {
            detail: {
              game: "cuphead",
              win: !!win,
              points: state.score,
              score: state.score,
            },
          })
        );
      }
      syncHud();
    }

    function hurtPlayer(dmg) {
      const p = state.player;
      if (!p || p.invuln > 0 || state.mode !== "playing") return;
      p.hp -= dmg;
      p.invuln = 55;
      p.vx = -p.facing * 4;
      p.vy = -6;
      burst(p.x, p.y - 20, "#ff6b6b", 10);
      if (p.hp <= 0) end(false);
    }

    function burst(x, y, color, n) {
      for (let i = 0; i < n; i += 1) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 1,
          life: 16 + Math.random() * 10,
          color,
          r: 2 + Math.random() * 3,
        });
      }
    }

    function shoot() {
      const p = state.player;
      if (!p || p.shootCd > 0 || p.duck) return;
      p.shootCd = 8;
      state.bullets.push({
        x: p.x + p.facing * 18,
        y: p.y - (p.duck ? 14 : 22),
        vx: p.facing * 11,
        vy: 0,
        r: 4,
        life: 55,
      });
    }

    function bossAttack() {
      const b = state.boss;
      const p = state.player;
      if (!b || !p) return;
      b.pattern = (b.pattern + 1) % 4;

      if (b.pattern === 0) {
        // arc of shots
        for (let i = -2; i <= 2; i += 1) {
          state.bossShots.push({
            x: b.x - 30,
            y: b.y - 50,
            vx: -4.2,
            vy: i * 1.1,
            r: 8,
            life: 110,
            pink: false,
          });
        }
        setStatus("Bullet spray!");
      } else if (b.pattern === 1) {
        // low duckable shot + high
        state.bossShots.push({
          x: b.x - 20,
          y: GROUND - 18,
          vx: -6.5,
          vy: 0,
          r: 10,
          life: 100,
          pink: false,
          low: true,
        });
        state.bossShots.push({
          x: b.x - 20,
          y: GROUND - 70,
          vx: -5.2,
          vy: 0.2,
          r: 9,
          life: 100,
          pink: false,
        });
        setStatus("Duck the low one!");
      } else if (b.pattern === 2) {
        // pink parry orb
        state.bossShots.push({
          x: b.x - 10,
          y: b.y - 90,
          vx: -3.2,
          vy: -2.2,
          r: 12,
          life: 130,
          pink: true,
          grav: 0.08,
        });
        setStatus("PARRY the pink orb — jump into it!");
      } else {
        // slam telegraph
        b.slam = 36;
        setStatus("Boss slam incoming — jump!");
      }
    }

    function update() {
      if (state.mode !== "playing") return;
      state.t += 1;
      const p = state.player;
      const b = state.boss;
      p.anim += 1;
      if (p.shootCd > 0) p.shootCd -= 1;
      if (p.invuln > 0) p.invuln -= 1;
      if (state.parryFlash > 0) state.parryFlash -= 1;

      p.duck = keys.down && p.onGround;
      const spd = p.duck ? 2.2 : 4.2;
      if (keys.left) {
        p.vx = -spd;
        p.facing = -1;
      } else if (keys.right) {
        p.vx = spd;
        p.facing = 1;
      } else {
        p.vx *= 0.7;
      }

      if (keys.up && p.onGround && !p.duck) {
        p.vy = -11.5;
        p.onGround = false;
      }
      if (keys.shoot) shoot();

      p.vy += 0.55;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 30) p.x = 30;
      if (p.x > W - 40) p.x = W - 40;
      if (p.y >= GROUND) {
        p.y = GROUND;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }

      // boss AI
      b.bob += 0.08;
      b.cd -= 1;
      if (b.slam > 0) {
        b.slam -= 1;
        if (b.slam === 8) {
          burst(b.x - 40, GROUND, "#ffaa44", 16);
          if (Math.abs(p.x - (b.x - 50)) < 90 && p.onGround) hurtPlayer(1);
        }
      }
      if (b.cd <= 0) {
        bossAttack();
        b.cd = Math.max(28, 55 - Math.floor((b.maxHp - b.hp) / 8));
      }
      b.phase = b.hp < 40 ? 2 : 1;
      // pace toward / away slightly
      const targetX = W - 160 + Math.sin(state.t * 0.02) * 30;
      b.x += (targetX - b.x) * 0.03;

      // player bullets vs boss
      for (const bullet of state.bullets) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life -= 1;
        if (Math.abs(bullet.x - b.x) < 50 && bullet.y > b.y - 90 && bullet.y < b.y + 10) {
          const dmg = b.phase === 2 ? 1.2 : 1;
          b.hp -= dmg;
          state.score += 10;
          bullet.life = 0;
          burst(bullet.x, bullet.y, "#ffe66d", 6);
          if (b.hp <= 0) end(true);
        }
      }
      state.bullets = state.bullets.filter((s) => s.life > 0 && s.x > -20 && s.x < W + 20);

      // boss shots
      for (const s of state.bossShots) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.grav) s.vy += s.grav;
        s.life -= 1;

        const ph = p.duck ? 22 : 40;
        const py = p.y - ph;
        const hit =
          s.x > p.x - 14 &&
          s.x < p.x + 14 &&
          s.y > py &&
          s.y < p.y + 4;

        if (hit) {
          if (s.pink && !p.onGround && p.vy < 2) {
            // parry
            s.life = 0;
            state.parryFlash = 12;
            p.vy = -9;
            p.invuln = 20;
            state.score += 50;
            b.hp -= 4;
            burst(s.x, s.y, "#ff4fd8", 18);
            setStatus("PARRY! Boss staggered");
            if (b.hp <= 0) end(true);
          } else if (!(s.low && p.duck)) {
            s.life = 0;
            hurtPlayer(1);
          }
        }
      }
      state.bossShots = state.bossShots.filter((s) => s.life > 0 && s.x > -40 && s.y < H + 40);

      state.particles = state.particles.filter((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15;
        pt.life -= 1;
        return pt.life > 0;
      });

      if (state.t % 15 === 0) syncHud();
    }

    function roundRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function drawCup(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.facing, 1);
      const flash = p.invuln > 0 && Math.floor(p.invuln / 3) % 2 === 0;
      if (flash) ctx.globalAlpha = 0.35;

      const duck = p.duck;
      // legs
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (!duck) {
        const swing = p.onGround ? Math.sin(p.anim * 0.35) * 6 : 0;
        ctx.moveTo(-6, -8);
        ctx.lineTo(-8 + swing, 0);
        ctx.moveTo(6, -8);
        ctx.lineTo(8 - swing, 0);
      } else {
        ctx.moveTo(-10, -6);
        ctx.lineTo(-14, 0);
        ctx.moveTo(4, -6);
        ctx.lineTo(8, 0);
      }
      ctx.stroke();

      // cup body
      ctx.fillStyle = "#f4f1ea";
      roundRect(-14, duck ? -28 : -42, 28, duck ? 22 : 34, 6);
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.stroke();

      // stripes
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(-14, duck ? -22 : -34, 28, 5);

      // handle
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-16, duck ? -18 : -28, 8, 0.4, -0.4, true);
      ctx.stroke();

      // face
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-4, duck ? -18 : -30, 2, 0, Math.PI * 2);
      ctx.arc(5, duck ? -18 : -30, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.beginPath();
      ctx.arc(1, duck ? -14 : -25, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();

      // straw gun
      if (!duck) {
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(10, -36, 18, 4);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(24, -38, 6, 8);
      }

      ctx.restore();
    }

    function drawBoss(b) {
      ctx.save();
      ctx.translate(b.x, b.y + Math.sin(b.bob) * 4);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 4, 48, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // ink body
      const mad = b.phase === 2;
      ctx.fillStyle = mad ? "#4a1a6b" : "#2c1654";
      ctx.beginPath();
      ctx.ellipse(0, -50, 55, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mad ? "#ff3d7f" : "#ff6b9d";
      ctx.beginPath();
      ctx.ellipse(0, -40, 34, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-16, -55, 12, 14, -0.2, 0, Math.PI * 2);
      ctx.ellipse(16, -55, 12, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(-14, -53, 5, 0, Math.PI * 2);
      ctx.arc(14, -53, 5, 0, Math.PI * 2);
      ctx.fill();

      // gloves
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-50, -20, 14, 0, Math.PI * 2);
      ctx.arc(40, -30, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (b.slam > 18) {
        ctx.fillStyle = "rgba(255,80,40,0.35)";
        ctx.fillRect(-100, -8, 80, 8);
      }

      // hp bar
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundRect(W - 220, 18, 180, 14, 6);
      ctx.fill();
      ctx.fillStyle = mad ? "#ff4d6d" : "#ffb347";
      roundRect(W - 220, 18, 180 * Math.max(0, b.hp / b.maxHp), 14, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Orbitron, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("INK KING", W - 40, 14);
    }

    function draw() {
      // cartoon stage
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#7ec8ff");
      g.addColorStop(0.55, "#ffe29a");
      g.addColorStop(1, "#f0a868");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // hills
      ctx.fillStyle = "#6bcf7a";
      ctx.beginPath();
      ctx.moveTo(0, H - 80);
      ctx.quadraticCurveTo(200, H - 160, 420, H - 90);
      ctx.quadraticCurveTo(700, H - 170, W, H - 70);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();

      // ground
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(0, GROUND + 2, W, H - GROUND);
      ctx.fillStyle = "#7a5230";
      ctx.fillRect(0, GROUND, W, 8);
      // stripes
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let x = 0; x < W; x += 40) ctx.fillRect(x, GROUND + 10, 20, 6);

      if (state.parryFlash > 0) {
        ctx.fillStyle = `rgba(255,100,220,${state.parryFlash / 20})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (state.mode === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff6d8";
        ctx.font = "bold 30px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("INK BOSS BLITZ", W / 2, H / 2 - 20);
        ctx.fillStyle = "#ffe0a0";
        ctx.font = "18px Rajdhani, sans-serif";
        ctx.fillText("Cuphead-style boss fight — shoot, duck, jump, PARRY!", W / 2, H / 2 + 14);
        return;
      }

      for (const pt of state.particles) {
        ctx.globalAlpha = Math.min(1, pt.life / 12);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const s of state.bullets) {
        ctx.fillStyle = "#fff36a";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e67e22";
        ctx.stroke();
      }

      for (const s of state.bossShots) {
        ctx.fillStyle = s.pink ? "#ff4fd8" : "#2c1654";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.pink) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.beginPath();
          ctx.arc(s.x - 3, s.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#ff6b9d";
          ctx.beginPath();
          ctx.arc(s.x - 2, s.y - 2, s.r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (state.boss) drawBoss(state.boss);
      if (state.player) drawCup(state.player);

      // hearts
      if (state.player) {
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i < state.player.hp ? "#ff4d6d" : "rgba(0,0,0,0.25)";
          ctx.beginPath();
          const hx = 24 + i * 28;
          const hy = 28;
          ctx.moveTo(hx, hy + 4);
          ctx.bezierCurveTo(hx - 12, hy - 10, hx - 14, hy + 10, hx, hy + 16);
          ctx.bezierCurveTo(hx + 14, hy + 10, hx + 12, hy - 10, hx, hy + 4);
          ctx.fill();
        }
      }

      if (state.mode === "win" || state.mode === "lose") {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = state.mode === "win" ? "#b8ff3c" : "#ff6b6b";
        ctx.font = "bold 36px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(state.mode === "win" ? "KNOCKOUT!" : "DEFEAT", W / 2, H / 2);
      }
    }

    function frame() {
      update();
      draw();
      requestAnimationFrame(frame);
    }

    function mapKey(code, down) {
      if (code === "ArrowLeft" || code === "KeyA") keys.left = down;
      if (code === "ArrowRight" || code === "KeyD") keys.right = down;
      if (code === "ArrowUp" || code === "KeyW" || code === "Space") keys.up = down;
      if (code === "ArrowDown" || code === "KeyS") keys.down = down;
      if (code === "KeyF") keys.shoot = down;
    }

    window.addEventListener("keydown", (e) => {
      if (window.__arcaneCowboyLock) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyW", "KeyA", "KeyS", "KeyD", "KeyF"].includes(e.code)) {
        if (state.mode === "playing") e.preventDefault();
        mapKey(e.code, true);
        if (e.code === "Space" && state.mode === "playing") keys.up = true;
      }
    });
    window.addEventListener("keyup", (e) => mapKey(e.code, false));

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (state.mode !== "playing") {
        reset();
        return;
      }
      keys.shoot = true;
      shoot();
    });
    canvas.addEventListener("pointerup", () => {
      keys.shoot = false;
    });

    // mobile buttons via HUD clicks already; add simple side zones
    canvas.addEventListener("pointermove", (e) => {
      if (state.mode !== "playing" || e.buttons === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      keys.left = x < W * 0.28;
      keys.right = x > W * 0.72;
    });

    window.addEventListener("arcane-study-lock", (e) => {
      if (e.detail?.locked) forceStudyStop();
      else startBtn.disabled = false;
    });

    startBtn.addEventListener("click", () => reset());

    window.addEventListener("keydown", (e) => {
      if (!window.__arcaneStudyLock) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyZ", "KeyX"].includes(e.code)) {
        e.preventDefault();
      }
    }, true);

    syncHud();
    draw();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
