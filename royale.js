(() => {
  function boot() {
    const canvas = document.getElementById("royale-canvas");
    const metaEl = document.getElementById("royale-meta");
    const statusEl = document.getElementById("royale-status");
    const hudEl = document.getElementById("royale-hud");
    const startBtn = document.getElementById("royale-start");
    const handEl = document.getElementById("royale-hand");
    if (!canvas || !metaEl || !startBtn || !hudEl || !handEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const STORAGE_WINS = "arcane-horizon-royale-wins";

    const CARDS = [
      { id: "knight", name: "Knight", cost: 3, hp: 55, dmg: 8, speed: 0.7, range: 28, color: "#c0c7d1", role: "melee" },
      { id: "archer", name: "Archers", cost: 3, hp: 28, dmg: 5, speed: 0.85, range: 110, color: "#6ab04c", role: "ranged", count: 2 },
      { id: "giant", name: "Giant", cost: 5, hp: 140, dmg: 12, speed: 0.4, range: 30, color: "#e67e22", role: "tank" },
      { id: "minion", name: "Minions", cost: 3, hp: 22, dmg: 6, speed: 1.15, range: 90, color: "#9b59b6", role: "air", count: 3 },
      { id: "spear", name: "Spear Gob", cost: 2, hp: 20, dmg: 4, speed: 1.05, range: 95, color: "#27ae60", role: "ranged", count: 2 },
      { id: "valk", name: "Valkyrie", cost: 4, hp: 70, dmg: 10, speed: 0.75, range: 36, color: "#e74c3c", role: "splash" },
      { id: "wizard", name: "Wizard", cost: 5, hp: 40, dmg: 9, speed: 0.65, range: 120, color: "#3498db", role: "splashranged" },
      { id: "hog", name: "Hog", cost: 4, hp: 60, dmg: 14, speed: 1.25, range: 28, color: "#8e5a3c", role: "building" },
    ];

    const state = {
      mode: "idle", // idle | playing | win | lose
      wins: Number(localStorage.getItem(STORAGE_WINS)) || 0,
      elixir: 5,
      enemyElixir: 5,
      selected: 0,
      hand: [],
      deck: [],
      units: [],
      towers: [],
      shots: [],
      effects: [],
      t: 0,
      aiTimer: 0,
      overtimer: false,
    };

    metaEl.textContent = `Wins: ${state.wins}`;
    startBtn.textContent = "Battle";
    if (statusEl) statusStatus("Pick a card, tap your side of the arena to deploy");

    function statusStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function laneY(side) {
      // side: player bottom, enemy top
      return side === "player" ? H * 0.72 : H * 0.28;
    }

    function makeTowers() {
      state.towers = [
        { id: "p-king", side: "player", kind: "king", x: W / 2, y: H - 55, hp: 160, max: 160, range: 120, dmg: 7, cd: 0 },
        { id: "p-left", side: "player", kind: "prince", x: W * 0.22, y: H - 120, hp: 90, max: 90, range: 100, dmg: 5, cd: 0 },
        { id: "p-right", side: "player", kind: "prince", x: W * 0.78, y: H - 120, hp: 90, max: 90, range: 100, dmg: 5, cd: 0 },
        { id: "e-king", side: "enemy", kind: "king", x: W / 2, y: 55, hp: 160, max: 160, range: 120, dmg: 7, cd: 0 },
        { id: "e-left", side: "enemy", kind: "prince", x: W * 0.22, y: 120, hp: 90, max: 90, range: 100, dmg: 5, cd: 0 },
        { id: "e-right", side: "enemy", kind: "prince", x: W * 0.78, y: 120, hp: 90, max: 90, range: 100, dmg: 5, cd: 0 },
      ];
    }

    function shuffleDeck() {
      const ids = CARDS.map((c) => c.id);
      for (let i = ids.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      state.deck = ids;
      state.hand = state.deck.splice(0, 4);
    }

    function cardById(id) {
      return CARDS.find((c) => c.id === id);
    }

    function renderHand() {
      handEl.innerHTML = "";
      state.hand.forEach((id, i) => {
        const c = cardById(id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `royale-card${state.selected === i ? " is-active" : ""}${state.elixir < c.cost ? " is-disabled" : ""}`;
        btn.dataset.index = String(i);
        btn.innerHTML = `<strong>${c.name}</strong><span>${c.cost} Elixir</span>`;
        btn.addEventListener("click", () => {
          state.selected = i;
          renderHand();
          statusStatus(`${c.name} ready — tap your half of the arena`);
        });
        handEl.appendChild(btn);
      });
    }

    function syncHud() {
      const pk = state.towers.find((t) => t.id === "p-king");
      const ek = state.towers.find((t) => t.id === "e-king");
      hudEl.textContent = `Elixir ${state.elixir.toFixed(1)}  ·  Your King ${pk ? Math.ceil(pk.hp) : 0}  ·  Enemy King ${ek ? Math.ceil(ek.hp) : 0}`;
      metaEl.textContent = `Wins: ${state.wins}`;
      renderHand();
    }

    function reset() {
      state.mode = "playing";
      state.elixir = 5;
      state.enemyElixir = 5;
      state.selected = 0;
      state.units = [];
      state.shots = [];
      state.effects = [];
      state.t = 0;
      state.aiTimer = 50;
      state.overtimer = false;
      makeTowers();
      shuffleDeck();
      startBtn.textContent = "Surrender";
      statusStatus("Battle start! Spend elixir, crush their king tower");
      syncHud();
    }

    function end(win) {
      state.mode = win ? "win" : "lose";
      startBtn.textContent = "Battle Again";
      if (win) {
        state.wins += 1;
        localStorage.setItem(STORAGE_WINS, String(state.wins));
        window.dispatchEvent(
          new CustomEvent("arcane-game-reward", {
            detail: { game: "royale", win: true, points: 0, score: state.wins },
          })
        );
        statusStatus("Victory Royale! Progress toward Tokens recorded");
      } else {
        statusStatus("Defeat — rebuild your push and try again");
      }
      syncHud();
    }

    function spawnUnit(card, side, x, y) {
      const count = card.count || 1;
      const spread = count > 1 ? 18 : 0;
      for (let i = 0; i < count; i += 1) {
        state.units.push({
          card: card.id,
          side,
          x: x + (i - (count - 1) / 2) * spread,
          y,
          hp: card.hp,
          max: card.hp,
          dmg: card.dmg,
          speed: card.speed * (side === "player" ? -1 : 1), // player marches up (negative y)
          range: card.range,
          role: card.role,
          color: card.color,
          cd: 0,
          retarget: 0,
          target: null,
        });
      }
    }

    function deployPlayer(x, y) {
      if (state.mode !== "playing") return;
      // only own half
      if (y < H * 0.48) {
        statusStatus("Deploy on YOUR side (bottom half)");
        return;
      }
      const id = state.hand[state.selected];
      const card = cardById(id);
      if (!card) return;
      if (state.elixir < card.cost) {
        statusStatus("Not enough elixir");
        return;
      }
      state.elixir -= card.cost;
      spawnUnit(card, "player", Math.max(40, Math.min(W - 40, x)), Math.max(H * 0.52, Math.min(H - 70, y)));
      // cycle card
      const next = state.deck.shift();
      state.hand[state.selected] = next;
      state.deck.push(id);
      state.effects.push({ x, y, life: 14, color: "rgba(80,180,255,0.45)" });
      syncHud();
    }

    function deployEnemy() {
      const affordable = CARDS.filter((c) => c.cost <= state.enemyElixir);
      if (!affordable.length) return;
      // prefer pressure when ahead / defend when behind
      const ek = state.towers.find((t) => t.id === "e-king");
      const pk = state.towers.find((t) => t.id === "p-king");
      let card = affordable[Math.floor(Math.random() * affordable.length)];
      if (pk && ek && ek.hp < pk.hp) {
        card = affordable.sort((a, b) => b.cost - a.cost)[0] || card;
      }
      state.enemyElixir -= card.cost;
      const lane = Math.random() > 0.5 ? W * 0.25 : W * 0.75;
      const x = lane + (Math.random() - 0.5) * 60;
      const y = 90 + Math.random() * 80;
      spawnUnit(card, "enemy", x, y);
      state.effects.push({ x, y, life: 14, color: "rgba(255,80,80,0.4)" });
    }

    function livingTowers(side) {
      return state.towers.filter((t) => t.side === side && t.hp > 0);
    }

    function findTarget(u) {
      // hog prefers towers
      let best = null;
      let bestD = Infinity;
      const enemies = state.units.filter((o) => o.side !== u.side && o.hp > 0);
      const towers = livingTowers(u.side === "player" ? "enemy" : "player");

      const pool = u.role === "building" ? towers : enemies.concat(towers);
      const list = pool.length ? pool : towers;
      for (const t of list) {
        const tx = t.x;
        const ty = t.y;
        const d = Math.hypot(tx - u.x, ty - u.y);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      return best;
    }

    function isTower(t) {
      return t && t.kind;
    }

    function updateCombat() {
      // elixir
      const rate = state.overtimer ? 0.045 : 0.028;
      state.elixir = Math.min(10, state.elixir + rate);
      state.enemyElixir = Math.min(10, state.enemyElixir + rate * 0.95);

      state.aiTimer -= 1;
      if (state.aiTimer <= 0) {
        deployEnemy();
        state.aiTimer = 45 + Math.random() * 50;
      }

      // units move / attack
      for (const u of state.units) {
        if (u.hp <= 0) continue;
        if (u.cd > 0) u.cd -= 1;
        u.retarget -= 1;
        if (u.retarget <= 0 || !u.target || (u.target.hp || 0) <= 0) {
          u.target = findTarget(u);
          u.retarget = 20;
        }
        const t = u.target;
        if (!t) continue;
        const tx = t.x;
        const ty = t.y;
        const dist = Math.hypot(tx - u.x, ty - u.y);
        if (dist > u.range) {
          const ang = Math.atan2(ty - u.y, tx - u.x);
          const spd = Math.abs(u.speed);
          u.x += Math.cos(ang) * spd;
          u.y += Math.sin(ang) * spd;
        } else if (u.cd <= 0) {
          u.cd = u.role.includes("ranged") || u.role === "air" ? 22 : 16;
          if (u.role === "ranged" || u.role === "splashranged" || u.role === "air") {
            state.shots.push({
              x: u.x,
              y: u.y,
              tx,
              ty,
              target: t,
              dmg: u.dmg,
              splash: u.role.includes("splash") ? 40 : 0,
              color: u.color,
              life: 20,
              side: u.side,
            });
          } else {
            applyDamage(t, u.dmg, u.role === "splash" ? 36 : 0, u.x, u.y);
          }
        }
      }

      // towers shoot
      for (const tw of state.towers) {
        if (tw.hp <= 0) continue;
        // prince towers inactive until king? keep all active for fun
        if (tw.cd > 0) {
          tw.cd -= 1;
          continue;
        }
        let best = null;
        let bestD = Infinity;
        for (const u of state.units) {
          if (u.side === tw.side || u.hp <= 0) continue;
          const d = Math.hypot(u.x - tw.x, u.y - tw.y);
          if (d <= tw.range && d < bestD) {
            bestD = d;
            best = u;
          }
        }
        if (best) {
          tw.cd = 18;
          state.shots.push({
            x: tw.x,
            y: tw.y,
            tx: best.x,
            ty: best.y,
            target: best,
            dmg: tw.dmg,
            splash: 0,
            color: tw.side === "player" ? "#7af0ff" : "#ff6b6b",
            life: 16,
            side: tw.side,
          });
        }
      }

      // shots
      for (const s of state.shots) {
        s.life -= 1;
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        s.x += dx * 0.35;
        s.y += dy * 0.35;
        if (Math.hypot(dx, dy) < 12 || s.life <= 0) {
          if (s.target && s.target.hp > 0) applyDamage(s.target, s.dmg, s.splash, s.x, s.y);
          s.life = 0;
        }
      }
      state.shots = state.shots.filter((s) => s.life > 0);
      state.units = state.units.filter((u) => u.hp > 0);
      state.effects = state.effects.filter((e) => {
        e.life -= 1;
        return e.life > 0;
      });

      // unlock king area when princes die — already all active
      const pk = state.towers.find((t) => t.id === "p-king");
      const ek = state.towers.find((t) => t.id === "e-king");
      if (ek && ek.hp <= 0) end(true);
      else if (pk && pk.hp <= 0) end(false);

      // overtime after long battle
      if (state.t > 60 * 90) state.overtimer = true;
    }

    function applyDamage(target, dmg, splash, x, y) {
      if (splash > 0) {
        const side = target.side;
        const foes = state.units.filter((u) => u.side === side);
        const towers = state.towers.filter((t) => t.side === side);
        foes.concat(towers).forEach((o) => {
          if (Math.hypot(o.x - x, o.y - y) <= splash) o.hp -= dmg;
        });
        state.effects.push({ x, y, life: 10, color: "rgba(255,180,60,0.45)", r: splash });
      } else {
        target.hp -= dmg;
      }
    }

    function update() {
      if (state.mode !== "playing") return;
      state.t += 1;
      updateCombat();
      if (state.t % 12 === 0) syncHud();
    }

    function drawArena() {
      // grass
      ctx.fillStyle = "#3d8f4a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#357a40";
      for (let y = 0; y < H; y += 28) {
        for (let x = (y / 28) % 2 === 0 ? 0 : 28; x < W; x += 56) {
          ctx.fillRect(x, y, 28, 28);
        }
      }

      // river
      ctx.fillStyle = "#3aa0d8";
      ctx.fillRect(0, H / 2 - 22, W, 44);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let i = 0; i < 8; i += 1) {
        ctx.fillRect(30 + i * 120, H / 2 - 4 + Math.sin(state.t * 0.05 + i) * 3, 40, 3);
      }

      // bridges
      ctx.fillStyle = "#8b6914";
      ctx.fillRect(W * 0.2 - 28, H / 2 - 28, 56, 56);
      ctx.fillRect(W * 0.8 - 28, H / 2 - 28, 56, 56);
      ctx.fillStyle = "#c4a35a";
      ctx.fillRect(W * 0.2 - 22, H / 2 - 22, 44, 44);
      ctx.fillRect(W * 0.8 - 22, H / 2 - 22, 44, 44);

      // deploy zone tint
      ctx.fillStyle = "rgba(80,160,255,0.06)";
      ctx.fillRect(0, H / 2, W, H / 2);
      ctx.fillStyle = "rgba(255,80,80,0.06)";
      ctx.fillRect(0, 0, W, H / 2);
    }

    function drawTower(t) {
      if (t.hp <= 0) {
        // rubble
        ctx.fillStyle = "rgba(40,40,40,0.5)";
        ctx.fillRect(t.x - 16, t.y - 10, 32, 16);
        return;
      }
      const king = t.kind === "king";
      ctx.fillStyle = t.side === "player" ? "#4aa3ff" : "#ff5a5a";
      ctx.beginPath();
      ctx.moveTo(t.x - (king ? 28 : 20), t.y + 12);
      ctx.lineTo(t.x - (king ? 22 : 16), t.y - (king ? 36 : 26));
      ctx.lineTo(t.x + (king ? 22 : 16), t.y - (king ? 36 : 26));
      ctx.lineTo(t.x + (king ? 28 : 20), t.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath();
      ctx.moveTo(t.x - 10, t.y - (king ? 36 : 26));
      ctx.lineTo(t.x, t.y - (king ? 50 : 38));
      ctx.lineTo(t.x + 10, t.y - (king ? 36 : 26));
      ctx.fill();
      // hp
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(t.x - 22, t.y + 16, 44, 6);
      ctx.fillStyle = t.side === "player" ? "#7af0ff" : "#ff6b6b";
      ctx.fillRect(t.x - 22, t.y + 16, 44 * Math.max(0, t.hp / t.max), 6);
    }

    function drawUnit(u) {
      ctx.save();
      ctx.translate(u.x, u.y);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = u.color;
      ctx.beginPath();
      ctx.arc(0, 0, u.role === "tank" || u.card === "giant" ? 16 : 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = u.side === "player" ? "#7af0ff" : "#ff8a8a";
      ctx.lineWidth = 2;
      ctx.stroke();
      // hp pip
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(-12, -20, 24, 4);
      ctx.fillStyle = "#b8ff3c";
      ctx.fillRect(-12, -20, 24 * Math.max(0, u.hp / u.max), 4);
      ctx.restore();
    }

    function draw() {
      drawArena();
      state.towers.forEach(drawTower);
      state.units.forEach(drawUnit);

      for (const s of state.shots) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const e of state.effects) {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r || 16 * (1.2 - e.life / 16), 0, Math.PI * 2);
        ctx.stroke();
      }

      // elixir bar
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(20, H - 22, W - 40, 12);
      ctx.fillStyle = "#c56cff";
      ctx.fillRect(20, H - 22, (W - 40) * (state.elixir / 10), 12);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Orbitron, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`ELIXIR ${Math.floor(state.elixir)}/10`, 28, H - 12);
      if (state.overtimer) {
        ctx.fillStyle = "#ffb347";
        ctx.textAlign = "right";
        ctx.fillText("OVERTIME", W - 28, H - 12);
      }

      if (state.mode === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffe6a8";
        ctx.font = "bold 28px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ARENA CLASH", W / 2, H / 2 - 16);
        ctx.fillStyle = "#dfffd0";
        ctx.font = "18px Rajdhani, sans-serif";
        ctx.fillText("Clash Royale vibes — cards, elixir, towers", W / 2, H / 2 + 16);
      } else if (state.mode === "win" || state.mode === "lose") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = state.mode === "win" ? "#b8ff3c" : "#ff6b6b";
        ctx.font = "bold 34px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(state.mode === "win" ? "VICTORY!" : "DEFEAT", W / 2, H / 2);
      }
    }

    function frame() {
      update();
      draw();
      requestAnimationFrame(frame);
    }

    function canvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * W,
        y: ((e.clientY - rect.top) / rect.height) * H,
      };
    }

    startBtn.addEventListener("click", () => {
      if (state.mode === "playing") {
        end(false);
        return;
      }
      reset();
    });

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (state.mode === "idle" || state.mode === "win" || state.mode === "lose") {
        reset();
        return;
      }
      const p = canvasPos(e);
      deployPlayer(p.x, p.y);
    });

    // start with empty hand UI
    state.hand = CARDS.slice(0, 4).map((c) => c.id);
    makeTowers();
    syncHud();
    draw();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
