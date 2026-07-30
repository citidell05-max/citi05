(() => {
  const STORAGE_KEY = "arcane-horizon-v1";
  const QUEST_XP = 25;
  const FOCUS_XP = 40;
  const CIRCUMFERENCE = 552.92;

  const RANKS = [
    "Novice Seeker",
    "Rune Apprentice",
    "Horizon Scout",
    "Arcane Adept",
    "Focus Warden",
    "Mythic Scholar",
    "Void Walker",
    "Horizon Master",
  ];

  const els = {
    form: document.getElementById("quest-form"),
    input: document.getElementById("quest-input"),
    list: document.getElementById("quest-list"),
    empty: document.getElementById("quest-empty"),
    questCount: document.getElementById("quest-count"),
    timerDisplay: document.getElementById("timer-display"),
    timerLabel: document.getElementById("timer-label"),
    timerMode: document.getElementById("timer-mode"),
    timerToggle: document.getElementById("timer-toggle"),
    timerReset: document.getElementById("timer-reset"),
    ring: document.getElementById("ring-progress"),
    modeBtns: document.querySelectorAll(".mode-btn"),
    levelNum: document.getElementById("level-num"),
    levelBadge: document.getElementById("level-badge"),
    rankName: document.getElementById("rank-name"),
    xpCurrent: document.getElementById("xp-current"),
    xpNeeded: document.getElementById("xp-needed"),
    xpFill: document.getElementById("xp-fill"),
    xpBar: document.getElementById("xp-bar"),
    sessionXp: document.getElementById("session-xp"),
    toast: document.getElementById("toast"),
  };

  const state = loadState();
  let sessionXp = 0;
  let timerId = null;
  let remaining = state.timer.minutes * 60;
  let running = false;
  let toastTimer = null;

  function xpForLevel(level) {
    return 100 + (level - 1) * 50;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          quests: Array.isArray(parsed.quests) ? parsed.quests : [],
          level: Number(parsed.level) || 1,
          xp: Number(parsed.xp) || 0,
          timer: {
            mode: parsed.timer?.mode || "focus",
            minutes: Number(parsed.timer?.minutes) || 25,
          },
        };
      }
    } catch {
      /* ignore corrupt storage */
    }
    return {
      quests: [],
      level: 1,
      xp: 0,
      timer: { mode: "focus", minutes: 25 },
    };
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quests: state.quests,
        level: state.level,
        xp: state.xp,
        timer: state.timer,
      })
    );
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    requestAnimationFrame(() => els.toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove("is-visible");
      setTimeout(() => {
        els.toast.hidden = true;
      }, 250);
    }, 2200);
  }

  function uid() {
    return crypto.randomUUID?.() || `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function renderQuests() {
    els.list.innerHTML = "";
    const active = state.quests.filter((q) => !q.done).length;
    els.questCount.textContent = `${active} active`;
    els.empty.hidden = state.quests.length > 0;

    state.quests.forEach((quest) => {
      const li = document.createElement("li");
      li.className = `quest-item${quest.done ? " is-done" : ""}`;
      li.dataset.id = quest.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "quest-check";
      check.setAttribute("aria-label", quest.done ? "Mark quest incomplete" : "Complete quest");
      check.textContent = quest.done ? "✓" : "";

      const title = document.createElement("p");
      title.className = "quest-title";
      title.textContent = quest.title;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "quest-delete";
      del.setAttribute("aria-label", `Delete quest ${quest.title}`);
      del.textContent = "×";

      check.addEventListener("click", () => toggleQuest(quest.id));
      del.addEventListener("click", () => deleteQuest(quest.id));

      li.append(check, title, del);
      els.list.appendChild(li);
    });
  }

  function addQuest(title) {
    state.quests.unshift({
      id: uid(),
      title: title.trim(),
      done: false,
    });
    saveState();
    renderQuests();
  }

  function toggleQuest(id) {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) return;

    if (!quest.done) {
      quest.done = true;
      gainXp(QUEST_XP, "Quest complete");
    } else {
      quest.done = false;
    }
    saveState();
    renderQuests();
  }

  function deleteQuest(id) {
    state.quests = state.quests.filter((q) => q.id !== id);
    saveState();
    renderQuests();
  }

  function gainXp(amount, reason) {
    state.xp += amount;
    sessionXp += amount;
    els.sessionXp.textContent = `+${sessionXp} XP this session`;

    let leveled = false;
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level += 1;
      leveled = true;
    }

    saveState();
    renderXp();

    if (leveled) {
      els.levelBadge.classList.remove("is-levelup");
      void els.levelBadge.offsetWidth;
      els.levelBadge.classList.add("is-levelup");
      showToast(`Level up! You are now LVL ${state.level}`);
    } else {
      showToast(`+${amount} XP — ${reason}`);
    }
  }

  function renderXp() {
    const needed = xpForLevel(state.level);
    const pct = Math.min(100, Math.round((state.xp / needed) * 100));
    const rankIndex = Math.min(RANKS.length - 1, state.level - 1);

    els.levelNum.textContent = String(state.level);
    els.rankName.textContent = RANKS[rankIndex];
    els.xpCurrent.textContent = String(state.xp);
    els.xpNeeded.textContent = String(needed);
    els.xpFill.style.width = `${pct}%`;
    els.xpBar.setAttribute("aria-valuenow", String(pct));
    els.sessionXp.textContent = `+${sessionXp} XP this session`;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateRing() {
    const total = state.timer.minutes * 60;
    const progress = total === 0 ? 0 : remaining / total;
    els.ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
  }

  function renderTimer() {
    els.timerDisplay.textContent = formatTime(remaining);
    const isBreak = state.timer.mode !== "focus";
    els.timerLabel.textContent = isBreak
      ? state.timer.mode === "long"
        ? "Long Break"
        : "Short Break"
      : "Focus Session";
    els.timerMode.textContent = isBreak ? "Break" : "Focus";
    els.ring.classList.toggle("is-break", isBreak);
    els.timerToggle.textContent = running ? "Pause" : remaining < state.timer.minutes * 60 ? "Resume" : "Start";
    updateRing();
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
    running = false;
  }

  function completeTimer() {
    stopTimer();
    remaining = 0;
    renderTimer();

    if (state.timer.mode === "focus") {
      gainXp(FOCUS_XP, "Focus session complete");
    } else {
      showToast("Break over — time to refocus");
    }

    remaining = state.timer.minutes * 60;
    renderTimer();
  }

  function tick() {
    if (remaining <= 1) {
      completeTimer();
      return;
    }
    remaining -= 1;
    renderTimer();
  }

  function startTimer() {
    if (running) return;
    running = true;
    timerId = setInterval(tick, 1000);
    renderTimer();
  }

  function toggleTimer() {
    if (running) {
      stopTimer();
      renderTimer();
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    stopTimer();
    remaining = state.timer.minutes * 60;
    renderTimer();
  }

  function setMode(mode, minutes) {
    stopTimer();
    state.timer = { mode, minutes };
    remaining = minutes * 60;
    saveState();

    els.modeBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });
    renderTimer();
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.input.value.trim();
    if (!title) return;
    addQuest(title);
    els.input.value = "";
    els.input.focus();
  });

  els.timerToggle.addEventListener("click", toggleTimer);
  els.timerReset.addEventListener("click", resetTimer);

  els.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.mode, Number(btn.dataset.minutes));
    });
  });

  els.modeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === state.timer.mode);
  });

  els.ring.style.strokeDasharray = String(CIRCUMFERENCE);

  renderQuests();
  renderXp();
  renderTimer();
})();
