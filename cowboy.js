(() => {
  function boot() {
    const canvas = document.getElementById("cowboy-canvas");
    const scoreEl = document.getElementById("cowboy-score");
    const metaEl = document.getElementById("cowboy-meta");
    const startBtn = document.getElementById("cowboy-start");
    const statusEl = document.getElementById("cowboy-status");

    if (!canvas || !scoreEl || !metaEl || !startBtn) {
      console.error("Cowboy Duel: missing game elements");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      scoreEl.textContent = "Canvas not supported";
      return;
    }

    const desertBg = new Image();
    desertBg.src = "assets/themes/08-desert.jpg?v=2";
    desertBg.decoding = "async";

    const W = canvas.width;
    const H = canvas.height;
    const STORAGE_BEST = "arcane-horizon-cowboy-best-ms";
    const STORAGE_WINS = "arcane-horizon-cowboy-wins";

    const state = {
      mode: "idle", // idle | countdown | wait | draw | win | lose | early
      countStep: 0,
      countAt: 0,
      waitUntil: 0,
      drawAt: 0,
      playerMs: null,
      banditMs: 0,
      flash: 0,
      dust: [],
      shake: 0,
      streak: 0,
      wins: Number(localStorage.getItem(STORAGE_WINS)) || 0,
      bestMs: Number(localStorage.getItem(STORAGE_BEST)) || 0,
      lastMsg: "Wait for SHOOT — then click EXTRA FAST!",
      bangX: 0,
      bangY: 0,
      bangLife: 0,
    };

    metaEl.textContent = state.bestMs
      ? `Best: ${state.bestMs}ms · Wins: ${state.wins}`
      : `Wins: ${state.wins}`;
    scoreEl.textContent = "Reaction: —";
    startBtn.textContent = "Duel";
    if (statusEl) statusEl.textContent = state.lastMsg;

    for (let i = 0; i < 18; i += 1) {
      state.dust.push({
        x: Math.random() * W,
        y: H * 0.55 + Math.random() * H * 0.35,
        r: 1 + Math.random() * 2.5,
        vx: 0.15 + Math.random() * 0.45,
        a: 0.15 + Math.random() * 0.35,
      });
    }

    function setStatus(msg) {
      state.lastMsg = msg;
      if (statusEl) statusEl.textContent = msg;
    }

    function banditReaction() {
      // Extra-fast bandit — lightning draws, gets even meaner on streaks
      const base = 145 - Math.min(45, state.streak * 8);
      return Math.max(95, base + Math.random() * 55);
    }

    function setBusy(on) {
      window.__arcaneCowboyLock = !!on;
    }

    function startDuel() {
      state.mode = "countdown";
      state.countStep = 0;
      state.countAt = performance.now();
      state.playerMs = null;
      state.banditMs = banditReaction();
      state.flash = 0;
      state.shake = 0;
      state.bangLife = 0;
      scoreEl.textContent = "Reaction: —";
      startBtn.textContent = "Holster…";
      startBtn.disabled = true;
      setBusy(true);
      setStatus("Don't draw early…");
    }

    function falseStart() {
      state.mode = "early";
      state.shake = 10;
      state.streak = 0;
      startBtn.disabled = false;
      startBtn.textContent = "Retry";
      setBusy(false);
      setStatus("Too early! Holster and wait for SHOOT!");
      scoreEl.textContent = "FALSE START";
    }

    function finish(won, ms) {
      state.playerMs = ms;
      state.mode = won ? "win" : "lose";
      state.flash = won ? 14 : 10;
      state.shake = won ? 8 : 14;
      state.bangLife = 18;
      state.bangX = won ? W * 0.72 : W * 0.28;
      state.bangY = H * 0.42;
      startBtn.disabled = false;
      startBtn.textContent = "Duel Again";
      setBusy(false);
      scoreEl.textContent = `Reaction: ${ms}ms`;

      if (won) {
        state.streak += 1;
        state.wins += 1;
        localStorage.setItem(STORAGE_WINS, String(state.wins));
        if (!state.bestMs || ms < state.bestMs) {
          state.bestMs = ms;
          localStorage.setItem(STORAGE_BEST, String(state.bestMs));
        }
        metaEl.textContent = `Best: ${state.bestMs}ms · Wins: ${state.wins}`;
        setStatus(`You drew first! ${ms}ms (bandit ${Math.round(state.banditMs)}ms)`);

        let tokens = 8;
        if (ms < 250) tokens = 20;
        else if (ms < 320) tokens = 15;
        else if (ms < 400) tokens = 12;
        tokens += Math.min(10, state.streak);
        window.dispatchEvent(
          new CustomEvent("arcane-game-reward", {
            detail: { tokens, score: ms, game: "cowboy" },
          })
        );
      } else {
        state.streak = 0;
        setStatus(`Bandit was faster! You: ${ms}ms · Them: ${Math.round(state.banditMs)}ms`);
      }
    }

    function tryShoot() {
      if (state.mode === "countdown" || state.mode === "wait") {
        falseStart();
        return;
      }
      if (state.mode !== "draw") return;
      const ms = Math.max(1, Math.round(performance.now() - state.drawAt));
      finish(ms < state.banditMs, ms);
    }

    function update(now) {
      state.dust.forEach((d) => {
        d.x += d.vx;
        if (d.x > W + 10) d.x = -10;
      });
      if (state.flash > 0) state.flash -= 1;
      if (state.shake > 0) state.shake -= 1;
      if (state.bangLife > 0) state.bangLife -= 1;

      if (state.mode === "countdown") {
        const elapsed = now - state.countAt;
        const beat = 480; // snappy 1-2-3
        const next = state.countStep + 1;
        if (elapsed >= next * beat && state.countStep < 3) {
          state.countStep = next;
          if (state.countStep === 1) setStatus("1…");
          if (state.countStep === 2) setStatus("2…");
          if (state.countStep === 3) setStatus("3…");
        }
        if (state.countStep >= 3 && elapsed >= 3 * beat + 120) {
          state.mode = "wait";
          // Short random pause — stay sharp
          state.waitUntil = now + 180 + Math.random() * 700;
          setStatus("…");
        }
      } else if (state.mode === "wait") {
        if (now >= state.waitUntil) {
          state.mode = "draw";
          state.drawAt = now;
          setStatus("SHOOT!");
        }
      } else if (state.mode === "draw") {
        const ms = now - state.drawAt;
        if (ms >= state.banditMs) {
          finish(false, Math.round(ms));
        }
      }
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

    function drawCowboy(x, y, facing, tint, armed) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(facing, 1);

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 58, 34, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // legs
      ctx.strokeStyle = "#3a2414";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-14, 52);
      ctx.moveTo(10, 20);
      ctx.lineTo(16, 52);
      ctx.stroke();

      // boots
      ctx.fillStyle = "#1a1008";
      ctx.fillRect(-22, 48, 14, 8);
      ctx.fillRect(8, 48, 16, 8);

      // body / coat
      ctx.fillStyle = tint;
      roundRect(-18, -18, 36, 42, 8);
      ctx.fill();

      // belt
      ctx.fillStyle = "#c49a3c";
      ctx.fillRect(-18, 12, 36, 5);
      ctx.fillStyle = "#8b6914";
      ctx.fillRect(-4, 10, 8, 9);

      // arms
      ctx.strokeStyle = tint;
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (armed) {
        ctx.moveTo(12, -4);
        ctx.lineTo(38, 4);
        ctx.lineTo(52, 0);
      } else {
        ctx.moveTo(12, -2);
        ctx.lineTo(28, 14);
        ctx.lineTo(22, 28);
      }
      ctx.moveTo(-12, -2);
      ctx.lineTo(-24, 16);
      ctx.stroke();

      // gun
      if (armed) {
        ctx.fillStyle = "#222";
        ctx.fillRect(48, -4, 18, 5);
        ctx.fillRect(60, -2, 6, 8);
        ctx.fillStyle = "#c49a3c";
        ctx.fillRect(46, -1, 6, 7);
      }

      // head
      ctx.fillStyle = "#d9a679";
      ctx.beginPath();
      ctx.arc(0, -30, 14, 0, Math.PI * 2);
      ctx.fill();

      // hat
      ctx.fillStyle = "#2a1a0c";
      ctx.beginPath();
      ctx.ellipse(0, -38, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      roundRect(-12, -54, 24, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#c49a3c";
      ctx.fillRect(-12, -40, 24, 3);

      // bandana
      ctx.fillStyle = "#b33a2b";
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.quadraticCurveTo(0, -14, 10, -22);
      ctx.lineTo(8, -18);
      ctx.quadraticCurveTo(0, -12, -8, -18);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawBang(x, y) {
      if (state.bangLife <= 0) return;
      const t = state.bangLife / 18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.2);
      ctx.fillStyle = `rgba(255, 220, 80, ${0.9 * t})`;
      ctx.font = "bold 28px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BANG!", 0, 0);
      ctx.strokeStyle = `rgba(255, 120, 40, ${0.8 * t})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.lineTo(Math.cos(a) * (22 + (1 - t) * 18), Math.sin(a) * (22 + (1 - t) * 18));
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw() {
      const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
      const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // background
      if (desertBg.complete && desertBg.naturalWidth) {
        const scale = Math.max(W / desertBg.naturalWidth, H / desertBg.naturalHeight);
        const bw = desertBg.naturalWidth * scale;
        const bh = desertBg.naturalHeight * scale;
        ctx.drawImage(desertBg, (W - bw) / 2, (H - bh) / 2, bw, bh);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#f0a04b");
        g.addColorStop(0.45, "#c45c2a");
        g.addColorStop(1, "#5a2a14");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.fillStyle = "rgba(40, 16, 8, 0.28)";
      ctx.fillRect(0, 0, W, H);

      // ground strip
      ctx.fillStyle = "rgba(80, 40, 16, 0.45)";
      ctx.fillRect(0, H * 0.72, W, H * 0.28);

      state.dust.forEach((d) => {
        ctx.fillStyle = `rgba(230, 190, 140, ${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const playerArmed = state.mode === "draw" || state.mode === "win" || (state.mode === "lose" && state.playerMs != null);
      const banditArmed = state.mode === "lose" || (state.mode === "draw" && performance.now() - state.drawAt > state.banditMs - 40);

      drawCowboy(W * 0.28, H * 0.58, 1, "#4a2e18", playerArmed || state.mode === "early");
      drawCowboy(W * 0.72, H * 0.58, -1, "#2a1c14", banditArmed);

      // VS badge
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(W / 2 - 28, H * 0.58 - 18, 56, 28, 8);
      ctx.fill();
      ctx.fillStyle = "#ffc857";
      ctx.font = "bold 14px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VS", W / 2, H * 0.58 + 2);

      drawBang(state.bangX, state.bangY);

      // big callout
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (state.mode === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        roundRect(W / 2 - 210, 36, 420, 64, 12);
        ctx.fill();
        ctx.fillStyle = "#ffe6a8";
        ctx.font = "bold 22px Orbitron, sans-serif";
        ctx.fillText("COWBOY QUICK DRAW", W / 2, 58);
        ctx.fillStyle = "#ffd27a";
        ctx.font = "16px Rajdhani, sans-serif";
        ctx.fillText("EXTRA FAST bandit — click the instant you see SHOOT!", W / 2, 82);
      } else if (state.mode === "countdown" || state.mode === "wait") {
        const label = state.countStep === 0 ? "READY" : String(state.countStep);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.arc(W / 2, 78, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = state.countStep === 3 ? "#ff8c42" : "#fff4d6";
        ctx.font = "bold 44px Orbitron, sans-serif";
        ctx.fillText(state.mode === "wait" ? "…" : label, W / 2, 80);
      } else if (state.mode === "draw") {
        ctx.fillStyle = "rgba(180, 20, 20, 0.55)";
        roundRect(W / 2 - 140, 40, 280, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#fff36a";
        ctx.font = "bold 48px Orbitron, sans-serif";
        ctx.shadowColor = "#ff3d00";
        ctx.shadowBlur = 18;
        ctx.fillText("SHOOT!", W / 2, 78);
        ctx.shadowBlur = 0;
      } else if (state.mode === "win") {
        ctx.fillStyle = "rgba(20, 80, 20, 0.55)";
        roundRect(W / 2 - 160, 40, 320, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#b8ff3c";
        ctx.font = "bold 34px Orbitron, sans-serif";
        ctx.fillText("YOU WIN!", W / 2, 78);
      } else if (state.mode === "lose") {
        ctx.fillStyle = "rgba(80, 10, 10, 0.55)";
        roundRect(W / 2 - 160, 40, 320, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#ff6b6b";
        ctx.font = "bold 32px Orbitron, sans-serif";
        ctx.fillText("TOO SLOW!", W / 2, 78);
      } else if (state.mode === "early") {
        ctx.fillStyle = "rgba(80, 40, 0, 0.55)";
        roundRect(W / 2 - 170, 40, 340, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#ffc857";
        ctx.font = "bold 28px Orbitron, sans-serif";
        ctx.fillText("TOO EARLY!", W / 2, 78);
      }

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(255,255,220,${state.flash / 20})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    function frame(now) {
      update(now || performance.now());
      draw();
      requestAnimationFrame(frame);
    }

    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.mode === "idle" || state.mode === "win" || state.mode === "lose" || state.mode === "early") {
        startDuel();
      }
    });

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (state.mode === "idle") {
        startDuel();
        return;
      }
      tryShoot();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (tag === "BUTTON" && document.activeElement.id !== "cowboy-start") return;
      e.preventDefault();
      if (state.mode === "idle" || state.mode === "win" || state.mode === "lose" || state.mode === "early") {
        if (document.activeElement?.id === "cowboy-start" || e.code === "Space") startDuel();
        return;
      }
      tryShoot();
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
