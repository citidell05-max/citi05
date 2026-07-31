(() => {
  function boot() {
    const canvas = document.getElementById("bloons-canvas");
    const metaEl = document.getElementById("bloons-meta");
    const statusEl = document.getElementById("bloons-status");
    const hudEl = document.getElementById("bloons-hud");
    const startBtn = document.getElementById("bloons-start");
    const waveBtn = document.getElementById("bloons-wave");
    const shop = document.getElementById("bloons-shop");

    if (!canvas || !metaEl || !startBtn || !waveBtn || !shop) {
      console.error("Balloon Defense: missing game elements");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (hudEl) hudEl.textContent = "Canvas not supported";
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const STORAGE_WAVE = "arcane-horizon-bloons-best-wave";
    const PATH_WIDTH = 42;

    // Bloons TD-style map path (waypoints)
    const PATH = [
      { x: -20, y: 120 },
      { x: 180, y: 120 },
      { x: 180, y: 280 },
      { x: 360, y: 280 },
      { x: 360, y: 90 },
      { x: 560, y: 90 },
      { x: 560, y: 340 },
      { x: 760, y: 340 },
      { x: 760, y: 160 },
      { x: 980, y: 160 },
    ];

    const pathLens = [];
    let totalLen = 0;
    for (let i = 0; i < PATH.length - 1; i += 1) {
      const dx = PATH[i + 1].x - PATH[i].x;
      const dy = PATH[i + 1].y - PATH[i].y;
      const len = Math.hypot(dx, dy);
      pathLens.push(len);
      totalLen += len;
    }

    function pointOnPath(dist) {
      let d = Math.max(0, Math.min(totalLen, dist));
      for (let i = 0; i < pathLens.length; i += 1) {
        if (d <= pathLens[i]) {
          const t = pathLens[i] ? d / pathLens[i] : 0;
          return {
            x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * t,
            y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * t,
          };
        }
        d -= pathLens[i];
      }
      return { ...PATH[PATH.length - 1] };
    }

    function distToPath(x, y) {
      let best = Infinity;
      for (let i = 0; i < PATH.length - 1; i += 1) {
        const ax = PATH[i].x;
        const ay = PATH[i].y;
        const bx = PATH[i + 1].x;
        const by = PATH[i + 1].y;
        const abx = bx - ax;
        const aby = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * abx + (y - ay) * aby) / (abx * abx + aby * aby || 1)));
        const px = ax + abx * t;
        const py = ay + aby * t;
        best = Math.min(best, Math.hypot(x - px, y - py));
      }
      return best;
    }

    const LAYERS = [
      { name: "red", hp: 1, speed: 1.05, color: "#ff3b3b", r: 12, reward: 1 },
      { name: "blue", hp: 1, speed: 1.2, color: "#3b7bff", r: 13, cash: 2, child: "red" },
      { name: "green", hp: 1, speed: 1.4, color: "#2fd66a", r: 14, cash: 3, child: "blue" },
      { name: "yellow", hp: 1, speed: 1.75, color: "#ffd84a", r: 15, cash: 4, child: "green" },
      { name: "pink", hp: 1, speed: 2.1, color: "#ff6ec7", r: 15, cash: 5, child: "yellow" },
      { name: "black", hp: 1, speed: 1.55, color: "#22252e", r: 16, cash: 7, child: "pink" },
      { name: "zebra", hp: 1, speed: 1.85, color: "#f2f2f2", r: 17, cash: 9, child: "black", stripe: true },
      { name: "lead", hp: 2, speed: 0.85, color: "#7a8799", r: 18, cash: 11, child: "black", lead: true },
    ];

    const LAYER_MAP = Object.fromEntries(LAYERS.map((l) => [l.name, l]));

    const TOWER_TYPES = {
      bow: {
        id: "bow",
        name: "Bow Monkey",
        cost: 50,
        range: 115,
        fireRate: 26,
        damage: 1,
        pierce: 1,
        color: "#8b5a2b",
        fur: "#c48a4a",
        tip: "Monkey with a bow — quick single pops",
      },
      bomb: {
        id: "bomb",
        name: "Bomb Monkey",
        cost: 120,
        range: 95,
        fireRate: 55,
        damage: 2,
        pierce: 1,
        splash: 42,
        color: "#5a2a8b",
        fur: "#9a6a3a",
        tip: "Monkey with bombs — AoE blasts",
      },
      sniper: {
        id: "sniper",
        name: "Sniper Monkey",
        cost: 160,
        range: 260,
        fireRate: 70,
        damage: 3,
        pierce: 1,
        color: "#2f6b3a",
        fur: "#b07a40",
        tip: "Monkey with a sniper — long range lead pops",
        canLead: true,
      },
    };

    const state = {
      mode: "idle", // idle | playing | won | lost
      lives: 40,
      cash: 250,
      wave: 0,
      bestWave: Number(localStorage.getItem(STORAGE_WAVE)) || 0,
      selected: "bow",
      towers: [],
      balloons: [],
      shots: [],
      pops: [],
      spawnQueue: [],
      spawnTimer: 0,
      waveActive: false,
      pointer: { x: 0, y: 0, inside: false },
      message: "Press Start Defense, buy towers, then Send Wave",
      rewardBank: 0,
    };

    function setStatus(msg) {
      state.message = msg;
      if (statusEl) statusEl.textContent = msg;
    }

    function syncHud(force = false) {
      const waveReady = state.mode === "playing" && !state.waveActive && !state.spawnQueue.length;
      const key = `${state.mode}|${state.lives}|${state.cash}|${state.wave}|${state.bestWave}|${state.selected}|${waveReady}|${state.waveActive}`;
      if (!force && key === state._hudKey) return;
      state._hudKey = key;
      metaEl.textContent = `Best wave: ${state.bestWave}`;
      if (hudEl) {
        hudEl.textContent = `♥ ${state.lives}  ·  $ ${state.cash}  ·  Wave ${state.wave}`;
      }
      waveBtn.disabled = !waveReady;
      startBtn.textContent = state.mode === "playing" ? "Restart" : "Start Defense";
      shop.querySelectorAll("[data-tower]").forEach((btn) => {
        const t = TOWER_TYPES[btn.dataset.tower];
        btn.classList.toggle("is-active", state.selected === t.id);
        btn.disabled = state.mode !== "playing";
        btn.title = `${t.tip} ($${t.cost})`;
      });
    }

    function resetGame() {
      if (window.arcaneGuardStudy?.()) return;
      state.mode = "playing";
      state.lives = 40;
      state.cash = 250;
      state.wave = 0;
      state.towers = [];
      state.balloons = [];
      state.shots = [];
      state.pops = [];
      state.spawnQueue = [];
      state.spawnTimer = 0;
      state.waveActive = false;
      state.rewardBank = 0;
      state._hudKey = "";
      setStatus("Place towers off the track, then Send Wave");
      syncHud(true);
    }

    function forceStudyStop() {
      if (state.mode === "idle" || state.mode === "won" || state.mode === "lost") {
        startBtn.disabled = !!window.__arcaneStudyLock;
        waveBtn.disabled = true;
        return;
      }
      state.mode = "idle";
      state.waveActive = false;
      state.spawnQueue = [];
      setBusy(false);
      startBtn.disabled = !!window.__arcaneStudyLock;
      waveBtn.disabled = true;
      setStatus("Study time — defense locked until focus ends");
      syncHud(true);
    }

    function wavePlan(n) {
      const queue = [];
      const push = (type, count, gap = 18) => {
        for (let i = 0; i < count; i += 1) queue.push({ type, gap });
      };
      if (n === 1) push("red", 12, 20);
      else if (n === 2) {
        push("red", 10, 16);
        push("blue", 8, 18);
      } else if (n === 3) {
        push("blue", 12, 14);
        push("green", 8, 16);
      } else if (n === 4) {
        push("green", 14, 12);
        push("yellow", 8, 14);
      } else if (n === 5) {
        push("yellow", 12, 12);
        push("pink", 8, 14);
        push("black", 3, 28);
      } else {
        const dens = Math.min(28, 10 + n);
        push("green", dens, Math.max(8, 16 - Math.floor(n / 3)));
        push("yellow", dens, Math.max(8, 14 - Math.floor(n / 3)));
        push("pink", 6 + Math.floor(n / 2), 12);
        push("black", 2 + Math.floor(n / 3), 22);
        if (n >= 8) push("zebra", 2 + Math.floor((n - 7) / 2), 26);
        if (n >= 10) push("lead", 1 + Math.floor((n - 9) / 2), 36);
      }
      return queue;
    }

    function startWave() {
      if (window.arcaneGuardStudy?.()) return;
      if (state.mode !== "playing" || state.waveActive) return;
      state.wave += 1;
      state.spawnQueue = wavePlan(state.wave);
      state.spawnTimer = 10;
      state.waveActive = true;
      setStatus(`Wave ${state.wave} incoming!`);
      syncHud();
    }

    function spawnBalloon(type, dist = 0) {
      const layer = LAYER_MAP[type];
      if (!layer) return;
      state.balloons.push({
        type,
        dist,
        hp: layer.hp,
        slow: 0,
        slowMul: 1,
        popId: Math.random(),
      });
    }

    function popBalloon(b, damage, canLead) {
      const layer = LAYER_MAP[b.type];
      if (!layer) return;
      if (layer.lead && !canLead) {
        // bounce ding
        state.pops.push({ x: pointOnPath(b.dist).x, y: pointOnPath(b.dist).y, life: 10, text: "CLANK", color: "#ccc" });
        return;
      }

      let dmg = damage;
      while (dmg > 0 && b.hp > 0) {
        b.hp -= 1;
        dmg -= 1;
        if (b.hp <= 0) {
          state.cash += layer.cash;
          const p = pointOnPath(b.dist);
          state.pops.push({ x: p.x, y: p.y, life: 14, text: "+$", color: "#b8ff3c" });
          if (layer.child) {
            b.type = layer.child;
            b.hp = LAYER_MAP[layer.child].hp;
          } else {
            b.dead = true;
            break;
          }
        }
      }
    }

    function canPlace(x, y) {
      if (x < 24 || y < 24 || x > W - 24 || y > H - 24) return false;
      if (distToPath(x, y) < PATH_WIDTH * 0.72) return false;
      for (const t of state.towers) {
        if (Math.hypot(t.x - x, t.y - y) < 36) return false;
      }
      return true;
    }

    function tryPlace(x, y) {
      if (state.mode !== "playing") return;
      const type = TOWER_TYPES[state.selected];
      if (!type) return;
      if (state.cash < type.cost) {
        setStatus(`Need $${type.cost} for ${type.name}`);
        return;
      }
      if (!canPlace(x, y)) {
        setStatus("Can't place on the track or on another tower");
        return;
      }
      state.cash -= type.cost;
      state.towers.push({
        type: type.id,
        x,
        y,
        cooldown: 0,
        angle: 0,
      });
      setStatus(`Placed ${type.name} (−$${type.cost})`);
      syncHud();
    }

    function fireTower(tower, nowTarget) {
      const type = TOWER_TYPES[tower.type];
      tower.cooldown = type.fireRate;
      tower.angle = Math.atan2(nowTarget.y - tower.y, nowTarget.x - tower.x);

      const speed = type.id === "sniper" ? 12 : type.id === "bow" ? 9 : 7.2;
      state.shots.push({
        x: tower.x,
        y: tower.y,
        vx: Math.cos(tower.angle) * speed,
        vy: Math.sin(tower.angle) * speed,
        damage: type.damage,
        pierce: type.pierce,
        splash: type.splash || 0,
        canLead: !!type.canLead,
        life: 70,
        color: type.id === "bomb" ? "#ff8a3d" : type.id === "sniper" ? "#9dff7a" : "#e8c27a",
        r: type.id === "bomb" ? 5 : type.id === "bow" ? 2.5 : 3,
        arrow: type.id === "bow",
        angle: tower.angle,
      });
    }

    function update() {
      if (state.mode !== "playing") return;

      // spawning
      if (state.spawnQueue.length) {
        state.spawnTimer -= 1;
        if (state.spawnTimer <= 0) {
          const next = state.spawnQueue.shift();
          spawnBalloon(next.type);
          state.spawnTimer = next.gap;
        }
      }

      // balloons
      for (const b of state.balloons) {
        if (b.dead) continue;
        const layer = LAYER_MAP[b.type];
        const spd = layer.speed * (b.slow > 0 ? b.slowMul : 1);
        if (b.slow > 0) b.slow -= 1;
        b.dist += spd;
        if (b.dist >= totalLen) {
          b.dead = true;
          state.lives -= Math.max(1, layer.hp + (layer.child ? 2 : 0));
          setStatus("A balloon leaked! −lives");
          if (state.lives <= 0) {
            state.lives = 0;
            endGame(false);
            return;
          }
        }
      }
      state.balloons = state.balloons.filter((b) => !b.dead);

      // towers aim/fire — target balloon furthest along the path
      for (const tower of state.towers) {
        const type = TOWER_TYPES[tower.type];
        if (tower.cooldown > 0) tower.cooldown -= 1;
        let best = null;
        let furthest = -1;
        for (const b of state.balloons) {
          const p = pointOnPath(b.dist);
          const d = Math.hypot(p.x - tower.x, p.y - tower.y);
          if (d <= type.range && b.dist > furthest) {
            furthest = b.dist;
            best = { b, ...p };
          }
        }
        if (best && tower.cooldown <= 0) fireTower(tower, best);
        else if (best) tower.angle = Math.atan2(best.y - tower.y, best.x - tower.x);
      }

      // shots
      for (const s of state.shots) {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 1;
        for (const b of state.balloons) {
          if (b.dead || s.life <= 0) continue;
          const p = pointOnPath(b.dist);
          if (Math.hypot(p.x - s.x, p.y - s.y) < LAYER_MAP[b.type].r + s.r) {
            if (s.splash) {
              for (const other of state.balloons) {
                if (other.dead) continue;
                const op = pointOnPath(other.dist);
                if (Math.hypot(op.x - p.x, op.y - p.y) <= s.splash) {
                  popBalloon(other, s.damage, s.canLead);
                }
              }
              state.pops.push({ x: p.x, y: p.y, life: 12, ring: s.splash, color: "rgba(255,140,60,0.4)" });
              s.life = 0;
            } else {
              popBalloon(b, s.damage, s.canLead);
              s.pierce -= 1;
              if (s.pierce <= 0) s.life = 0;
            }
          }
        }
        if (s.x < -40 || s.y < -40 || s.x > W + 40 || s.y > H + 40) s.life = 0;
      }
      state.shots = state.shots.filter((s) => s.life > 0);
      state.pops = state.pops.filter((p) => {
        p.life -= 1;
        return p.life > 0;
      });

      // wave clear
      if (state.waveActive && !state.spawnQueue.length && !state.balloons.length) {
        state.waveActive = false;
        const bonus = 40 + state.wave * 12;
        state.cash += bonus;
        if (state.wave > state.bestWave) {
          state.bestWave = state.wave;
          localStorage.setItem(STORAGE_WAVE, String(state.bestWave));
        }
        state.rewardBank += 1;
        window.dispatchEvent(
          new CustomEvent("arcane-game-reward", {
            detail: { game: "bloons", win: true, points: 0, score: state.wave },
          })
        );
        setStatus(`Wave ${state.wave} cleared! +$${bonus}`);
        if (state.wave >= 15) {
          endGame(true);
          return;
        }
      }

      syncHud();
    }

    function endGame(won) {
      state.mode = won ? "won" : "lost";
      state.waveActive = false;
      setBusy(false);
      setStatus(won ? "You held the line! Defense victory." : "Balloons got through — try again!");
      syncHud();
    }

    function setBusy(on) {
      window.__arcaneBloonsLock = !!on;
    }

    function drawPath() {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(90, 70, 40, 0.95)";
      ctx.lineWidth = PATH_WIDTH;
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i += 1) ctx.lineTo(PATH[i].x, PATH[i].y);
      ctx.stroke();

      ctx.strokeStyle = "rgba(210, 180, 120, 0.85)";
      ctx.lineWidth = PATH_WIDTH - 14;
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i += 1) ctx.lineTo(PATH[i].x, PATH[i].y);
      ctx.stroke();

      // start / end markers
      const start = PATH[0];
      const end = PATH[PATH.length - 1];
      ctx.fillStyle = "rgba(80, 200, 120, 0.85)";
      ctx.beginPath();
      ctx.arc(Math.max(18, start.x + 28), start.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 80, 80, 0.9)";
      ctx.beginPath();
      ctx.arc(Math.min(W - 18, end.x - 28), end.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBalloon(b) {
      const layer = LAYER_MAP[b.type];
      const p = pointOnPath(b.dist);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (b.slow > 0) {
        ctx.strokeStyle = "rgba(120,210,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, layer.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, layer.r * 0.85, layer.r, 0, 0, Math.PI * 2);
      ctx.fill();
      if (layer.stripe) {
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-layer.r * 0.6, -4);
        ctx.lineTo(layer.r * 0.6, -4);
        ctx.moveTo(-layer.r * 0.6, 4);
        ctx.lineTo(layer.r * 0.6, 4);
        ctx.stroke();
      }
      if (layer.lead) {
        ctx.strokeStyle = "#cfd8e3";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-layer.r * 0.25, -layer.r * 0.35, layer.r * 0.22, layer.r * 0.3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // knot
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, layer.r);
      ctx.quadraticCurveTo(4, layer.r + 8, 0, layer.r + 14);
      ctx.stroke();
      ctx.restore();
    }

    function drawMonkey(x, y, typeId, angle, ghost) {
      const type = TOWER_TYPES[typeId];
      if (!type) return;
      const a = typeof ctx.globalAlpha === "number" ? ctx.globalAlpha : 1;
      ctx.save();
      ctx.translate(x, y);
      if (ghost) ctx.globalAlpha = 0.55;

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // legs
      ctx.fillStyle = type.fur;
      ctx.fillRect(-8, 6, 6, 10);
      ctx.fillRect(2, 6, 6, 10);

      // body
      ctx.beginPath();
      ctx.ellipse(0, 2, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0d2a8";
      ctx.beginPath();
      ctx.ellipse(0, 5, 7, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // head
      ctx.fillStyle = type.fur;
      ctx.beginPath();
      ctx.arc(0, -12, 11, 0, Math.PI * 2);
      ctx.fill();
      // ears
      ctx.beginPath();
      ctx.arc(-11, -16, 5, 0, Math.PI * 2);
      ctx.arc(11, -16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8b890";
      ctx.beginPath();
      ctx.arc(-11, -16, 2.5, 0, Math.PI * 2);
      ctx.arc(11, -16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // face
      ctx.fillStyle = "#ffe0c0";
      ctx.beginPath();
      ctx.ellipse(0, -10, 7, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a120c";
      ctx.beginPath();
      ctx.arc(-3.2, -11, 1.4, 0, Math.PI * 2);
      ctx.arc(3.2, -11, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a2e18";
      ctx.beginPath();
      ctx.ellipse(0, -7.5, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // hat / gear by type
      if (typeId === "sniper") {
        ctx.fillStyle = "#2f6b3a";
        ctx.fillRect(-9, -24, 18, 5);
        ctx.fillRect(-5, -30, 10, 7);
        ctx.fillStyle = "#1e4a28";
        ctx.fillRect(4, -28, 10, 3);
      } else if (typeId === "bomb") {
        ctx.fillStyle = "#3a2048";
        ctx.beginPath();
        ctx.arc(0, -22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffb347";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -27);
        ctx.quadraticCurveTo(10, -32, 8, -36);
        ctx.stroke();
        ctx.fillStyle = "#ff6b3a";
        ctx.beginPath();
        ctx.arc(8, -36, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // bow monkey bandana
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(-9, -18, 18, 3);
      }

      // weapon aimed at target
      ctx.save();
      ctx.rotate(angle || 0);
      if (typeId === "bow") {
        ctx.strokeStyle = "#5a3418";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(14, 0, 10, -1.1, 1.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, -9);
        ctx.lineTo(14, 9);
        ctx.stroke();
        ctx.strokeStyle = "#e8c27a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(26, 0);
        ctx.stroke();
        ctx.fillStyle = "#ddd";
        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.lineTo(22, -3);
        ctx.lineTo(22, 3);
        ctx.fill();
      } else if (typeId === "sniper") {
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(8, -2.5, 28, 5);
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(30, -1.5, 10, 3);
        ctx.fillStyle = "#4a7a4a";
        ctx.fillRect(14, -6, 8, 3);
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(18, -7, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (typeId === "bomb") {
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(18, 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#444";
        ctx.fillRect(15, -8, 4, 6);
        ctx.strokeStyle = "#ffb347";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(17, -8);
        ctx.lineTo(22, -14);
        ctx.stroke();
      }
      ctx.restore();

      ctx.globalAlpha = a;
      ctx.restore();
    }

    function drawTower(tower) {
      drawMonkey(tower.x, tower.y, tower.type, tower.angle, false);
    }

    function draw() {
      // grass field
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#3d8f4a");
      g.addColorStop(1, "#2a6b38");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // soft patches
      for (let i = 0; i < 30; i += 1) {
        const x = (i * 97) % W;
        const y = (i * 53) % H;
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
        ctx.beginPath();
        ctx.ellipse(x, y, 40, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawPath();

      // ghost placement
      if (state.mode === "playing" && state.pointer.inside) {
        const type = TOWER_TYPES[state.selected];
        const ok = canPlace(state.pointer.x, state.pointer.y) && state.cash >= type.cost;
        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, type.range, 0, Math.PI * 2);
        ctx.fillStyle = ok ? "rgba(184,255,60,0.12)" : "rgba(255,80,80,0.12)";
        ctx.fill();
        ctx.strokeStyle = ok ? "rgba(184,255,60,0.55)" : "rgba(255,80,80,0.55)";
        ctx.stroke();
        drawMonkey(state.pointer.x, state.pointer.y, state.selected, 0, true);
        if (!ok) {
          ctx.strokeStyle = "rgba(255,80,80,0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(state.pointer.x - 12, state.pointer.y - 12);
          ctx.lineTo(state.pointer.x + 12, state.pointer.y + 12);
          ctx.moveTo(state.pointer.x + 12, state.pointer.y - 12);
          ctx.lineTo(state.pointer.x - 12, state.pointer.y + 12);
          ctx.stroke();
        }
      }

      state.towers.forEach(drawTower);
      state.balloons.forEach(drawBalloon);

      for (const s of state.shots) {
        if (s.arrow) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle || 0);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.stroke();
          ctx.fillStyle = "#ddd";
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(3, -2.5);
          ctx.lineTo(3, 2.5);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const p of state.pops) {
        if (p.ring) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.ring * (1.15 - p.life / 20), 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.text) {
          ctx.fillStyle = p.color;
          ctx.font = "bold 12px Orbitron, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(p.text, p.x, p.y - (14 - p.life));
        }
      }

      // overlay messages
      if (state.mode === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffe6a8";
        ctx.font = "bold 28px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BALLOON DEFENSE", W / 2, H / 2 - 18);
        ctx.fillStyle = "#dfffd0";
        ctx.font = "18px Rajdhani, sans-serif";
        ctx.fillText("Bow · Bomb · Sniper monkeys — hold the track!", W / 2, H / 2 + 14);
      } else if (state.mode === "lost" || state.mode === "won") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = state.mode === "won" ? "#b8ff3c" : "#ff6b6b";
        ctx.font = "bold 34px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(state.mode === "won" ? "VICTORY!" : "DEFEAT", W / 2, H / 2 - 8);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Rajdhani, sans-serif";
        ctx.fillText(`Reached wave ${state.wave}`, W / 2, H / 2 + 24);
      }
    }

    function frame() {
      update();
      draw();
      requestAnimationFrame(frame);
    }

    function canvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    window.addEventListener("arcane-study-lock", (e) => {
      if (e.detail?.locked) forceStudyStop();
      else {
        startBtn.disabled = false;
        waveBtn.disabled = state.mode !== "playing" || state.waveActive;
      }
    });

    startBtn.addEventListener("click", () => {
      resetGame();
      if (state.mode === "playing") setBusy(true);
    });

    waveBtn.addEventListener("click", () => {
      startWave();
    });

    shop.addEventListener("click", (e) => {
      if (window.__arcaneStudyLock) {
        window.arcaneGuardStudy?.();
        return;
      }
      const btn = e.target.closest("[data-tower]");
      if (!btn) return;
      state.selected = btn.dataset.tower;
      setStatus(`${TOWER_TYPES[state.selected].name} selected — click the map to build`);
      syncHud();
    });

    canvas.addEventListener("pointermove", (e) => {
      const p = canvasPos(e);
      state.pointer.x = p.x;
      state.pointer.y = p.y;
      state.pointer.inside = true;
    });
    canvas.addEventListener("pointerleave", () => {
      state.pointer.inside = false;
    });
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (state.mode === "idle" || state.mode === "won" || state.mode === "lost") {
        resetGame();
        setBusy(true);
        return;
      }
      const p = canvasPos(e);
      tryPlace(p.x, p.y);
    });

    setStatus(state.message);
    syncHud();
    draw();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
