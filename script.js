(() => {
  const STORAGE_KEY = "arcane-horizon-v1";
  const SFX_STORAGE_KEY = "arcane-horizon-v1-sfx";
  const THEME_STORAGE_KEY = "arcane-horizon-theme-id";
  const BG_STORAGE_KEY = "arcane-horizon-v6-bg";
  const THEMES = [
    { id: "sunrise", name: "Arcane Sunrise", src: "assets/themes/11-sunrise.jpg?v=5", accent: "#ffb347", accent2: "#ff4fd8", overlay: "rgba(18, 8, 28, 0.12)" },
    { id: "sunset", name: "Sunset Palm", src: "assets/themes/01-sunset.jpg?v=4", accent: "#ff8c42", accent2: "#ff4fd8", overlay: "rgba(40, 10, 30, 0.18)" },
    { id: "cyberpunk", name: "Cyber Purple", src: "assets/themes/02-cyberpunk.jpg?v=4", accent: "#d16bff", accent2: "#ff4fd8", overlay: "rgba(18, 4, 36, 0.28)" },
    { id: "forest", name: "Forest Mist", src: "assets/themes/03-forest.jpg?v=4", accent: "#8cff9a", accent2: "#6ad1ff", overlay: "rgba(8, 20, 12, 0.2)" },
    { id: "ocean", name: "Deep Ocean", src: "assets/themes/04-ocean.jpg?v=4", accent: "#4fd2ff", accent2: "#2b7cff", overlay: "rgba(4, 20, 40, 0.28)" },
    { id: "aurora", name: "Aurora", src: "assets/themes/05-aurora.jpg?v=4", accent: "#7dffb0", accent2: "#6ecbff", overlay: "rgba(4, 16, 28, 0.24)" },
    { id: "volcano", name: "Volcano", src: "assets/themes/06-volcano.jpg?v=4", accent: "#ff7a3c", accent2: "#ff3d5a", overlay: "rgba(30, 8, 8, 0.28)" },
    { id: "ice", name: "Ice Cavern", src: "assets/themes/07-ice.jpg?v=4", accent: "#9fe9ff", accent2: "#d8f6ff", overlay: "rgba(8, 24, 36, 0.22)" },
    { id: "desert", name: "Desert Dusk", src: "assets/themes/08-desert.jpg?v=4", accent: "#ffb347", accent2: "#ff6f91", overlay: "rgba(36, 16, 8, 0.22)" },
    { id: "space", name: "Cosmic Nebula", src: "assets/themes/09-space.jpg?v=4", accent: "#b388ff", accent2: "#66e0ff", overlay: "rgba(10, 4, 28, 0.26)" },
    { id: "neonrain", name: "Neon Rain", src: "assets/themes/10-neonrain.jpg?v=4", accent: "#ff4fd8", accent2: "#4de1ff", overlay: "rgba(16, 4, 24, 0.3)" },
    { id: "curacao", name: "Curaçao Coast", src: "assets/themes/15-curacao.jpg?v=1", accent: "#2ec4ff", accent2: "#ff6b9d", overlay: "rgba(8, 28, 48, 0.22)" },
    { id: "vipgold", name: "Gem Vault", src: "assets/themes/12-vipgold.jpg?v=1", accent: "#ffd27a", accent2: "#ffb347", overlay: "rgba(28, 12, 4, 0.22)", vip: true },
    { id: "viproyal", name: "Royal Obsidian", src: "assets/themes/13-viproyal.jpg?v=1", accent: "#d16bff", accent2: "#ff71ce", overlay: "rgba(12, 4, 24, 0.28)", vip: true },
    { id: "vipcrystal", name: "Crystal Crown", src: "assets/themes/14-vipcrystal.jpg?v=1", accent: "#9fe9ff", accent2: "#b388ff", overlay: "rgba(8, 16, 32, 0.24)", vip: true },
  ];
  const BG_DEFAULT = THEMES[0].src;
  const QUEST_XP = 40;
  const FOCUS_XP = 55;
  const QUEST_TOKENS = 10;
  const FOCUS_TOKENS = 15;
  const QUEST_GEMS = 2;
  const FOCUS_GEMS = 3;
  const DAILY_CHEST_GEMS = 100;
  const THEME_TOKEN_COST = 100;
  const GAME_UNLOCK_COST = 150;
  const GAME_WIN_GOAL = 3;
  const GAME_POINT_GOAL = 100;
  const GAME_MILESTONE_TOKENS = 10;
  const ACHIEVEMENTS = [
    { id: "first_quest", title: "First Quest", desc: "Complete your first quest", icon: "Q1", test: (s) => (s.stats?.quests || 0) >= 1 },
    { id: "quest_hunter", title: "Quest Hunter", desc: "Complete 10 quests", icon: "Q10", test: (s) => (s.stats?.quests || 0) >= 10 },
    { id: "quest_legend", title: "Quest Legend", desc: "Complete 50 quests", icon: "Q50", test: (s) => (s.stats?.quests || 0) >= 50 },
    { id: "deep_focus", title: "Deep Focus", desc: "Finish 1 focus session", icon: "F1", test: (s) => (s.stats?.focus || 0) >= 1 },
    { id: "focus_master", title: "Focus Master", desc: "Finish 10 focus sessions", icon: "F10", test: (s) => (s.stats?.focus || 0) >= 10 },
    { id: "streak_starter", title: "Streak Starter", desc: "Reach a 3-day streak", icon: "S3", test: (s) => Math.max(s.streak || 0, s.bestStreak || 0) >= 3 },
    { id: "week_warrior", title: "Week Warrior", desc: "Reach a 7-day best streak", icon: "S7", test: (s) => (s.bestStreak || 0) >= 7 },
    { id: "rising_star", title: "Rising Star", desc: "Reach level 5", icon: "L5", test: (s) => (s.level || 1) >= 5 },
    { id: "horizon_hero", title: "Horizon Hero", desc: "Reach level 10", icon: "L10", test: (s) => (s.level || 1) >= 10 },
    { id: "chest_opener", title: "Chest Opener", desc: "Open the daily gem chest", icon: "CH", test: (s) => (s.chestClaims || 0) >= 1 },
    { id: "theme_bonus", title: "Theme Bonus", desc: "Open the Theme Chest", icon: "TH", test: (s) => !!s.themeChestClaimed },
    { id: "token_stack", title: "Token Stack", desc: "Hold at least 100 Tokens", icon: "100", test: (s) => (s.tokens || 0) >= 100 },
    { id: "game_ready", title: "Game Ready", desc: "Unlock your first mini-game", icon: "G1", test: (s) => (s.ownedGames || []).length >= 1 },
    { id: "game_champ", title: "Game Champ", desc: "Win 3 mini-game matches", icon: "W3", test: (s) => (s.stats?.gameWins || 0) >= 3 },
    { id: "point_scorer", title: "Point Scorer", desc: "Earn 100 game points", icon: "P100", test: (s) => (s.stats?.gamePoints || 0) >= 100 },
    { id: "island_focus", title: "Island Focus", desc: "Equip the Curaçao Coast theme", icon: "CW", test: () => currentThemeId === "curacao" },
    { id: "eli_buddy", title: "ELI Buddy", desc: "Open ELI AI for homework help", icon: "ELI", test: (s) => !!s.stats?.eliOpened },
    { id: "vip_key", title: "VIP Key", desc: "Unlock VIP with the moderator code", icon: "VIP", test: (s) => !!s.vipUnlocked && s.vipUnlockSource === "moderator" },
  ];
  const PLAYABLE_GAMES = [
    { id: "dash", name: "Horizon Dash", startIds: ["game-start"] },
    { id: "cowboy", name: "Cowboy Quick Draw", startIds: ["cowboy-start"] },
    { id: "bloons", name: "Balloon Defense", startIds: ["bloons-start", "bloons-wave"] },
    { id: "cuphead", name: "Ink Boss Blitz", startIds: ["cup-start"] },
    { id: "royale", name: "Arena Clash", startIds: ["royale-start"] },
  ];
  const VIP_COST = 25000;
  const MOD_VIP_CODE = "ONLY4VIP";
  const CIRCUMFERENCE = 552.92;

  const RANKS = [
    "Wanderer",
    "Arcane Initiate",
    "Rune Apprentice",
    "Mystic Guardian",
    "Astral Knight",
    "Eternal Paragon",
    "Void Walker",
    "Horizon Master",
    "Storm Weaver",
    "Celestial Warden",
    "Dragon Sage",
    "Eclipse Lord",
    "Arcane Sovereign",
    "Mythic Ascendant",
    "Horizon Phoenix",
  ];

  const SFX_DEFAULTS = {
    add: "sounds/quest-add.wav",
    complete: "sounds/quest-complete.wav",
    delete: "sounds/quest-delete.wav",
    timer: "sounds/timer-done.wav",
    levelup: "sounds/level-up.wav",
    click: "sounds/click.wav",
  };


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
    sfxToggle: document.getElementById("sfx-toggle"),
    musicToggle: document.getElementById("music-toggle"),
    bgMusic: document.getElementById("bg-music"),
    themeToggle: document.getElementById("theme-toggle"),
    themePanel: document.getElementById("theme-panel"),
    themeGrid: document.getElementById("theme-grid"),
    bgPhoto: document.getElementById("bg-photo"),
    bgOverlay: document.querySelector(".bg-overlay"),
    vipToggle: document.getElementById("vip-toggle"),
    vipLabel: document.getElementById("vip-label"),
    modToggle: document.getElementById("mod-toggle"),
    modPanel: document.getElementById("mod-panel"),
    modCode: document.getElementById("mod-code"),
    tokenCount: document.getElementById("token-count"),
    gemCount: document.getElementById("gem-count"),
    streakCount: document.getElementById("streak-count"),
    streakDisplay: document.getElementById("streak-display"),
    streakTitle: document.getElementById("streak-title"),
    historyMeta: document.getElementById("history-meta"),
    historyList: document.getElementById("history-list"),
    historyEmpty: document.getElementById("history-empty"),
    historyClear: document.getElementById("history-clear"),
    dailyChest: document.getElementById("daily-chest"),
    dailyChestLabel: document.getElementById("daily-chest-label"),
    dailyChestMeta: document.getElementById("daily-chest-meta"),
    themeChest: document.getElementById("theme-chest"),
    themeChestLabel: document.getElementById("theme-chest-label"),
    themeChestMeta: document.getElementById("theme-chest-meta"),
    leaderboardList: document.getElementById("leaderboard-list"),
    leaderboardMeta: document.getElementById("leaderboard-meta"),
    achievementsGrid: document.getElementById("achievements-grid"),
    achievementsMeta: document.getElementById("achievements-meta"),
    dailyAttachment: document.getElementById("daily-attachment"),
    dailyNoteText: document.getElementById("daily-note-text"),
    liveClockTime: document.getElementById("live-clock-time"),
    liveClockDate: document.getElementById("live-clock-date"),
    guideFab: document.getElementById("guide-fab"),
    guideDrawer: document.getElementById("guide-drawer"),
    guideClose: document.getElementById("guide-close"),
    guideDailyText: document.getElementById("guide-daily-text"),
    guideChat: document.getElementById("guide-chat"),
    guideForm: document.getElementById("guide-form"),
    guideInput: document.getElementById("guide-input"),
    guideChips: document.getElementById("guide-chips"),
  };

  const AI_RIVALS = [
    { id: "nova", name: "shadowfox92", tag: "Player", bias: 1.18 },
    { id: "quill", name: "StudyQueen", tag: "Player", bias: 1.05 },
    { id: "ember", name: "nightowl_x", tag: "Player", bias: 0.92 },
    { id: "luna", name: "KaiZen7", tag: "Player", bias: 1.12 },
    { id: "hex", name: "PixelPanda", tag: "Player", bias: 0.88 },
    { id: "orbit", name: "arcane_mike", tag: "Player", bias: 1.28 },
    { id: "rift", name: "LunaBytes", tag: "Player", bias: 0.97 },
    { id: "prism", name: "QuestHunter", tag: "Player", bias: 1.08 },
    { id: "blaze", name: "FocusFrog", tag: "Player", bias: 1.15 },
    { id: "volt", name: "xXTokenKingXx", tag: "Player", bias: 0.94 },
  ];

  const state = loadState();
  if (!Array.isArray(state.ownedThemes)) state.ownedThemes = [];
  if (!Array.isArray(state.ownedGames)) state.ownedGames = [];
  if (!state.unlockedAchievements || typeof state.unlockedAchievements !== "object") {
    state.unlockedAchievements = {};
  }
  if (!state.stats || typeof state.stats !== "object") {
    state.stats = { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false };
  }
  state.stats.quests = Math.max(0, Number(state.stats.quests) || 0);
  state.stats.focus = Math.max(0, Number(state.stats.focus) || 0);
  state.stats.gameWins = Math.max(0, Number(state.stats.gameWins) || 0);
  state.stats.gamePoints = Math.max(0, Number(state.stats.gamePoints) || 0);
  state.stats.eliOpened = !!state.stats.eliOpened;
  let currentThemeId = localStorage.getItem(THEME_STORAGE_KEY) || "";
  if (currentThemeId && !THEMES.some((t) => t.id === currentThemeId)) currentThemeId = "";
  // Regular themes free; VIP themes stay locked until moderator VIP unlock
  const FREE_THEME_IDS = THEMES.filter((t) => !t.vip).map((t) => t.id);
  const VIP_THEME_IDS = THEMES.filter((t) => t.vip).map((t) => t.id);
  if (localStorage.getItem("arcane-horizon-vip-theme-lock-v1") !== "1") {
    const owned = new Set(Array.isArray(state.ownedThemes) ? state.ownedThemes : []);
    FREE_THEME_IDS.forEach((id) => owned.add(id));
    VIP_THEME_IDS.forEach((id) => owned.delete(id));
    state.ownedThemes = [...owned];
    if (VIP_THEME_IDS.includes(currentThemeId)) {
      currentThemeId = "sunrise";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, "sunrise");
      } catch {
        /* ignore */
      }
    }
    localStorage.setItem("arcane-horizon-vip-theme-lock-v1", "1");
    localStorage.setItem("arcane-horizon-theme-free-v1", "1");
    localStorage.setItem("arcane-horizon-theme-shop-v2", "1");
  } else if (!Array.isArray(state.ownedThemes) || state.ownedThemes.length < FREE_THEME_IDS.length) {
    const owned = new Set(Array.isArray(state.ownedThemes) ? state.ownedThemes : []);
    FREE_THEME_IDS.forEach((id) => owned.add(id));
    if (!(state.vipUnlocked && state.vipUnlockSource === "moderator")) {
      VIP_THEME_IDS.forEach((id) => owned.delete(id));
    }
    state.ownedThemes = [...owned];
  }
  // Lock all games behind Tokens until purchased
  if (localStorage.getItem("arcane-horizon-game-shop-v1") !== "1") {
    state.ownedGames = [];
    localStorage.setItem("arcane-horizon-game-shop-v1", "1");
  }
  // Always re-show today's positive words after this update
  try {
    localStorage.removeItem("arcane-horizon-daily-note-hide");
  } catch {
    /* ignore */
  }
  let sessionXp = Number(state.sessionXp) || 0;
  let timerId = null;
  let remaining = Number.isFinite(state.timer.remaining)
    ? state.timer.remaining
    : state.timer.minutes * 60;
  let running = false;
  let toastTimer = null;
  let audioCtx = null;
  let sfxEnabled = state.sfxEnabled;
  // Force music available; users can still turn it off
  let musicEnabled = state.musicEnabled !== false;
  if (localStorage.getItem("arcane-horizon-music-v3") !== "1") {
    musicEnabled = true;
    state.musicEnabled = true;
    localStorage.setItem("arcane-horizon-music-v3", "1");
  }
  let vipEnabled = !!state.vipEnabled && state.vipUnlockSource === "moderator";
  let vipUnlocked = !!state.vipUnlocked && state.vipUnlockSource === "moderator";
  let vipUnlockSource = state.vipUnlockSource === "moderator" ? "moderator" : null;

  const sfxData = loadSfxFromStorage();
  const sfxBuffers = {};
  Object.entries(sfxData).forEach(([name, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 0.75;
    audio.addEventListener("error", () => {
      console.warn("SFX missing:", name, src);
    });
    try {
      audio.load();
    } catch {
      /* ignore */
    }
    sfxBuffers[name] = audio;
  });

  function xpForLevel(level) {
    return 100 + (level - 1) * 50;
  }

  const HISTORY_LIMIT = 60;

  function defaultState() {
    return {
      quests: [],
      level: 1,
      xp: 0,
      sessionXp: 0,
      tokens: 0,
      gems: 0,
      streak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      lastChestDate: null,
      chestClaims: 0,
      themeChestClaimed: false,
      ownedThemes: [],
      ownedGames: [],
      gameWinProgress: 0,
      gamePointProgress: 0,
      unlockedAchievements: {},
      stats: { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false },
      history: [],
      vipEnabled: false,
      vipUnlocked: false,
      vipUnlockSource: null,
      sfxEnabled: true,
      musicEnabled: true,
      timer: {
        mode: "focus",
        minutes: 25,
        remaining: 25 * 60,
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const minutes = Number(parsed.timer?.minutes) || 25;
        const remainingSaved = Number(parsed.timer?.remaining);
        return {
          quests: Array.isArray(parsed.quests) ? parsed.quests : [],
          level: Number(parsed.level) || 1,
          xp: Number(parsed.xp) || 0,
          sessionXp: Number(parsed.sessionXp) || 0,
          tokens: Number(parsed.tokens) || 0,
          gems: Number(parsed.gems) || 0,
          streak: Math.max(0, Number(parsed.streak) || 0),
          bestStreak: Math.max(0, Number(parsed.bestStreak) || 0),
          lastActiveDate: typeof parsed.lastActiveDate === "string" ? parsed.lastActiveDate : null,
          lastChestDate: typeof parsed.lastChestDate === "string" ? parsed.lastChestDate : null,
          chestClaims: Math.max(0, Number(parsed.chestClaims) || 0),
          themeChestClaimed: !!parsed.themeChestClaimed,
          ownedThemes: Array.isArray(parsed.ownedThemes)
            ? parsed.ownedThemes.filter((id) => typeof id === "string")
            : [],
          ownedGames: Array.isArray(parsed.ownedGames)
            ? parsed.ownedGames.filter((id) => typeof id === "string")
            : [],
          gameWinProgress: Math.max(0, Number(parsed.gameWinProgress) || 0),
          gamePointProgress: Math.max(0, Number(parsed.gamePointProgress) || 0),
          unlockedAchievements:
            parsed.unlockedAchievements && typeof parsed.unlockedAchievements === "object"
              ? parsed.unlockedAchievements
              : {},
          stats: {
            quests: Math.max(0, Number(parsed.stats?.quests) || 0),
            focus: Math.max(0, Number(parsed.stats?.focus) || 0),
            gameWins: Math.max(0, Number(parsed.stats?.gameWins) || 0),
            gamePoints: Math.max(0, Number(parsed.stats?.gamePoints) || 0),
            eliOpened: !!parsed.stats?.eliOpened,
          },
          history: Array.isArray(parsed.history) ? parsed.history.slice(0, HISTORY_LIMIT) : [],
          vipEnabled: !!parsed.vipEnabled && parsed.vipUnlockSource === "moderator",
          vipUnlocked: !!parsed.vipUnlocked && parsed.vipUnlockSource === "moderator",
          vipUnlockSource: parsed.vipUnlockSource === "moderator" ? "moderator" : null,
          sfxEnabled: parsed.sfxEnabled !== false,
          musicEnabled: parsed.musicEnabled !== false,
          timer: {
            mode: parsed.timer?.mode || "focus",
            minutes,
            remaining: Number.isFinite(remainingSaved) ? remainingSaved : minutes * 60,
          },
        };
      }
    } catch {
      /* ignore corrupt storage */
    }
    return defaultState();
  }

  function saveState() {
    state.sessionXp = sessionXp;
    state.sfxEnabled = sfxEnabled;
    state.musicEnabled = musicEnabled;
    state.vipEnabled = vipEnabled;
    state.vipUnlocked = vipUnlocked;
    state.vipUnlockSource = vipUnlockSource;
    state.timer.remaining = remaining;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quests: state.quests,
        level: state.level,
        xp: state.xp,
        sessionXp,
        tokens: state.tokens,
        gems: state.gems,
        streak: state.streak || 0,
        bestStreak: state.bestStreak || 0,
        lastActiveDate: state.lastActiveDate || null,
        lastChestDate: state.lastChestDate || null,
        chestClaims: state.chestClaims || 0,
        themeChestClaimed: !!state.themeChestClaimed,
        ownedThemes: Array.isArray(state.ownedThemes) ? state.ownedThemes : [],
        ownedGames: Array.isArray(state.ownedGames) ? state.ownedGames : [],
        gameWinProgress: state.gameWinProgress || 0,
        gamePointProgress: state.gamePointProgress || 0,
        unlockedAchievements: state.unlockedAchievements || {},
        stats: state.stats || { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false },
        history: Array.isArray(state.history) ? state.history.slice(0, HISTORY_LIMIT) : [],
        vipEnabled,
        vipUnlocked,
        vipUnlockSource,
        sfxEnabled,
        musicEnabled,
        timer: {
          mode: state.timer.mode,
          minutes: state.timer.minutes,
          remaining,
        },
      })
    );
  }

  function loadSfxFromStorage() {
    // Always prefer the real files in /sounds (migrate off old base64 packs).
    if (localStorage.getItem("arcane-horizon-sfx-files-v1") !== "1") {
      localStorage.setItem(SFX_STORAGE_KEY, JSON.stringify(SFX_DEFAULTS));
      localStorage.setItem("arcane-horizon-sfx-files-v1", "1");
      return { ...SFX_DEFAULTS };
    }
    try {
      const raw = localStorage.getItem(SFX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const merged = { ...SFX_DEFAULTS, ...parsed };
          // Force file paths if anything still looks like embedded data
          Object.keys(SFX_DEFAULTS).forEach((key) => {
            if (!merged[key] || String(merged[key]).startsWith("data:")) {
              merged[key] = SFX_DEFAULTS[key];
            }
          });
          return merged;
        }
      }
    } catch {
      /* reseeding below */
    }
    localStorage.setItem(SFX_STORAGE_KEY, JSON.stringify(SFX_DEFAULTS));
    return { ...SFX_DEFAULTS };
  }

  function getTheme(id) {
    if (!id) return null;
    return THEMES.find((t) => t.id === id) || null;
  }

  function preloadThemes() {
    THEMES.forEach((theme) => {
      const img = new Image();
      img.decoding = "async";
      img.src = theme.src;
    });
  }

  function isVipTheme(theme) {
    return !!theme?.vip;
  }

  function ownsTheme(themeId) {
    const theme = getTheme(themeId);
    if (!theme) return false;
    if (isVipTheme(theme)) return !!vipUnlocked;
    return true;
  }

  function themePriceLabel(theme) {
    if (isVipTheme(theme) && !vipUnlocked) return "VIP Locked";
    if (isVipTheme(theme)) return "VIP";
    return "Free";
  }

  function canUseTheme(theme) {
    if (!theme) return false;
    if (isVipTheme(theme)) return !!vipUnlocked;
    return true;
  }

  function applyDarkBackdrop() {
    currentThemeId = "";
    document.documentElement.style.setProperty("--bg-image", "none");
    document.body.dataset.theme = "dark";
    document.body.classList.add("theme-locked-dark");
    const scene = document.querySelector(".bg-scene");
    if (scene) {
      scene.style.backgroundImage = "none";
      scene.style.backgroundColor = "#07040f";
    }
    if (els.bgPhoto) {
      els.bgPhoto.removeAttribute("src");
      els.bgPhoto.hidden = true;
    }
    if (els.bgOverlay) {
      els.bgOverlay.style.background = "rgba(4, 2, 12, 0.55)";
    }
    window.dispatchEvent(
      new CustomEvent("arcane-theme-change", {
        detail: { theme: { id: "dark", name: "Dark Lock", accent: "#7af0ff", accent2: "#ff4fd8" } },
      })
    );
  }

  function tryBuyTheme(theme) {
    if (!theme) return { ok: false, reason: "Theme not found" };
    if (isVipTheme(theme) && !vipUnlocked) {
      return { ok: false, reason: "VIP themes stay locked — enter the moderator code first" };
    }
    if (!Array.isArray(state.ownedThemes)) state.ownedThemes = [];
    if (!state.ownedThemes.includes(theme.id)) {
      state.ownedThemes.push(theme.id);
      saveState();
    }
    return { ok: true, bought: false };
  }

  function applyTheme(id, { persist = true, toast = false } = {}) {
    if (!id) {
      applyDarkBackdrop();
      renderThemeGrid();
      return;
    }
    const theme = getTheme(id);
    if (!theme) {
      applyDarkBackdrop();
      renderThemeGrid();
      return;
    }
    if (!canUseTheme(theme)) {
      showToast(
        isVipTheme(theme)
          ? "VIP themes stay locked — enter the moderator code first"
          : "Theme unavailable"
      );
      playSfx("click");
      return;
    }
    currentThemeId = theme.id;
    const src = theme.src;
    document.body.classList.remove("theme-locked-dark");

    document.documentElement.style.setProperty("--bg-image", `url("${src}")`);

    const scene = document.querySelector(".bg-scene");
    if (scene) {
      scene.style.backgroundImage = `url("${src}")`;
      scene.style.backgroundSize = "cover";
      scene.style.backgroundPosition = "center";
      scene.style.backgroundRepeat = "no-repeat";
      scene.style.backgroundColor = "#12081f";
    }

    if (els.bgPhoto) {
      els.bgPhoto.hidden = false;
      els.bgPhoto.decoding = "async";
      els.bgPhoto.onerror = () => {
        showToast("Theme image failed — staying on dark lock");
        applyDarkBackdrop();
        renderThemeGrid();
      };
      els.bgPhoto.src = src;
    }

    if (els.bgOverlay) {
      els.bgOverlay.style.background = theme.overlay;
    }

    document.documentElement.style.setProperty("--neon-cyan", theme.accent);
    document.documentElement.style.setProperty("--neon-magenta", theme.accent2);
    document.body.dataset.theme = theme.id;

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme.id);
        localStorage.setItem(BG_STORAGE_KEY, src);
        [
          "arcane-horizon-v1-bg",
          "arcane-horizon-v2-bg",
          "arcane-horizon-v3-bg",
          "arcane-horizon-v4-bg",
          "arcane-horizon-v5-bg",
        ].forEach((key) => localStorage.removeItem(key));
      } catch {
        /* ignore */
      }
    }

    renderThemeGrid();
    window.dispatchEvent(new CustomEvent("arcane-theme-change", { detail: { theme } }));
    if (toast) showToast(`Theme: ${theme.name}`);
  }

  function renderThemeGrid() {
    if (!els.themeGrid) return;

    const syncCard = (btn, theme) => {
      if (!theme) return;
      const active = theme.id === currentThemeId && canUseTheme(theme);
      const locked = isVipTheme(theme) && !vipUnlocked;
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("is-vip", isVipTheme(theme));
      btn.classList.toggle("is-locked", locked);
      btn.setAttribute("aria-selected", String(active));
      btn.setAttribute("aria-disabled", String(locked));
      btn.setAttribute("role", "option");
      btn.title = locked
        ? `${theme.name} — VIP Locked (moderator code)`
        : theme.name;

      const img = btn.querySelector("img");
      if (img) {
        if (locked) {
          img.hidden = true;
          img.removeAttribute("src");
          img.alt = "";
        } else {
          img.hidden = false;
          if (img.getAttribute("src") !== theme.src) {
            img.src = theme.src;
            img.alt = theme.name;
          }
        }
      }

      let lockMark = btn.querySelector(".theme-lock-mark");
      if (locked) {
        if (!lockMark) {
          lockMark = document.createElement("i");
          lockMark.className = "theme-lock-mark";
          lockMark.setAttribute("aria-hidden", "true");
          btn.appendChild(lockMark);
        }
        lockMark.textContent = "LOCKED";
      } else if (lockMark) {
        lockMark.remove();
      }

      let label = btn.querySelector("span");
      if (!label) {
        label = document.createElement("span");
        btn.appendChild(label);
      }
      label.textContent = locked
        ? `${theme.name} · VIP Locked`
        : isVipTheme(theme)
          ? `${theme.name} · VIP`
          : theme.name;

      let badge = btn.querySelector(".theme-vip-badge");
      if (!badge) {
        badge = document.createElement("em");
        badge.className = "theme-vip-badge";
        btn.appendChild(badge);
      }
      badge.textContent = locked ? "VIP LOCKED" : active ? "ACTIVE" : themePriceLabel(theme).toUpperCase();
      badge.classList.toggle("is-price", locked);
    };

    // Prefer the pictures already in HTML — sync active state + fresh URLs
    const existing = els.themeGrid.querySelectorAll("[data-theme]");
    if (existing.length) {
      existing.forEach((btn) => syncCard(btn, getTheme(btn.dataset.theme)));
      return;
    }

    els.themeGrid.innerHTML = "";
    THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.theme = theme.id;
      const img = document.createElement("img");
      img.src = theme.src;
      img.alt = theme.name;
      img.decoding = "async";
      img.onerror = () => {
        img.replaceWith(Object.assign(document.createElement("div"), {
          className: "theme-fallback",
          textContent: theme.name,
        }));
      };
      btn.append(img, document.createElement("span"));
      els.themeGrid.appendChild(btn);
      syncCard(btn, theme);
    });
  }

  function applyBackgroundFromStorage() {
    const saved = getTheme(currentThemeId);
    if (!saved || !canUseTheme(saved)) {
      currentThemeId = "sunrise";
    }
    applyTheme(currentThemeId, { persist: true, toast: false });
  }

  function chestReadyToday() {
    return state.lastChestDate !== todayKey();
  }

  function renderDailyChest() {
    if (!els.dailyChest) return;
    const ready = chestReadyToday();
    const isNewcomer = !(state.chestClaims > 0);
    els.dailyChest.classList.toggle("is-ready", ready);
    els.dailyChest.classList.toggle("is-claimed", !ready);
    els.dailyChest.disabled = !ready;
    if (els.dailyChestLabel) {
      els.dailyChestLabel.textContent = ready
        ? isNewcomer
          ? "Welcome Chest"
          : "Daily Chest"
        : "Chest Claimed";
    }
    if (els.dailyChestMeta) {
      els.dailyChestMeta.textContent = ready
        ? `+${DAILY_CHEST_GEMS} Gems`
        : "Come back tomorrow";
    }
    els.dailyChest.title = ready
      ? `Open for ${DAILY_CHEST_GEMS} gems${isNewcomer ? " (newcomer bonus)" : ""}`
      : "Already opened today — come back tomorrow";
    els.dailyChest.setAttribute("aria-disabled", String(!ready));
  }

  function claimDailyChest() {
    if (!chestReadyToday()) {
      showToast("Daily chest already opened — come back tomorrow");
      playSfx("click");
      return;
    }
    const isNewcomer = !(state.chestClaims > 0);
    state.gems = (state.gems || 0) + DAILY_CHEST_GEMS;
    state.lastChestDate = todayKey();
    state.chestClaims = (state.chestClaims || 0) + 1;
    addHistory({
      type: "chest",
      text: isNewcomer ? "Welcome chest opened" : "Daily chest opened",
      gems: DAILY_CHEST_GEMS,
    });
    saveState();
    renderWallet();
    renderDailyChest();
    renderHistory();
    renderLeaderboard();
    checkAchievements();
    playSfx("levelup");
    showToast(
      isNewcomer
        ? `Welcome! Chest opened — +${DAILY_CHEST_GEMS} Gems`
        : `Daily chest opened — +${DAILY_CHEST_GEMS} Gems`
    );
  }

  function renderThemeChest() {
    if (!els.themeChest) return;
    const claimed = !!state.themeChestClaimed;
    const ready = !claimed;
    els.themeChest.classList.toggle("is-ready", ready);
    els.themeChest.classList.toggle("is-claimed", !ready);
    els.themeChest.disabled = !ready;
    if (els.themeChestLabel) {
      els.themeChestLabel.textContent = claimed ? "Theme Claimed" : "Theme Chest";
    }
    if (els.themeChestMeta) {
      els.themeChestMeta.textContent = claimed ? "Already opened" : "+50 Tokens";
    }
    els.themeChest.title = ready
      ? "Open for +50 Tokens and a random theme equip"
      : "Theme chest already opened";
    els.themeChest.setAttribute("aria-disabled", String(!ready));
  }

  function claimThemeChest() {
    if (state.themeChestClaimed) {
      showToast("Theme chest already opened");
      playSfx("click");
      return;
    }
    // Themes are free now — chest gives Tokens + equips a random look
    const bonus = 50;
    state.tokens = (state.tokens || 0) + bonus;
    state.themeChestClaimed = true;
    const picks = THEMES.filter((t) => !t.vip);
    const theme = picks[Math.floor(Math.random() * picks.length)] || THEMES[0];
    addHistory({
      type: "chest",
      text: `Theme chest — +${bonus} Tokens · equipped ${theme.name}`,
      tokens: bonus,
    });
    saveState();
    renderWallet();
    renderThemeChest();
    renderThemeGrid();
    renderHistory();
    renderLeaderboard();
    applyTheme(theme.id, { persist: true, toast: false });
    checkAchievements();
    playSfx("levelup");
    showToast(`Theme chest opened — +${bonus} Tokens · ${theme.name}`);
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededUnit(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function playerPowerScore() {
    const level = Number(state.level) || 1;
    const xp = Number(state.xp) || 0;
    const streak = Number(state.streak) || 0;
    const best = Number(state.bestStreak) || 0;
    const tokens = Number(state.tokens) || 0;
    const gems = Number(state.gems) || 0;
    const chests = Number(state.chestClaims) || 0;
    return (
      level * 1200 +
      xp * 2 +
      streak * 85 +
      best * 40 +
      tokens * 3 +
      gems * 8 +
      chests * 40 +
      sessionXp
    );
  }

  function buildLeaderboard() {
    const day = todayKey();
    const youScore = playerPowerScore();
    const rankIndex = Math.min(RANKS.length - 1, (state.level || 1) - 1);
    const entries = [
      {
        id: "you",
        name: "You",
        tag: RANKS[rankIndex] || "Wanderer",
        score: youScore,
        level: state.level || 1,
        isYou: true,
        ai: false,
      },
    ];

    AI_RIVALS.forEach((bot, i) => {
      const seed = hashSeed(`${day}:${bot.id}:${i}`);
      const wobble = 0.78 + seededUnit(seed) * 0.55;
      const pace = 0.9 + seededUnit(seed + 17) * 0.45;
      // Keep AI near the player so climbing feels real, with daily drift
      const base = Math.max(400, Math.round(youScore * bot.bias * wobble * pace));
      const floor = 900 + Math.round(seededUnit(seed + 3) * 4200);
      const score = Math.max(floor, base);
      const level = Math.max(1, Math.min(RANKS.length, Math.round(score / 1400)));
      entries.push({
        id: bot.id,
        name: bot.name,
        tag: bot.tag,
        score,
        level,
        isYou: false,
        ai: true,
      });
    });

    entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return entries.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  function renderLeaderboard() {
    if (!els.leaderboardList) return;
    const board = buildLeaderboard();
    const you = board.find((e) => e.isYou);
    if (els.leaderboardMeta) {
      els.leaderboardMeta.textContent = you
        ? `Your rank: #${you.rank} · ${you.score.toLocaleString()} pts`
        : "Your rank: —";
    }

    els.leaderboardList.innerHTML = "";
    board.forEach((entry) => {
      const li = document.createElement("li");
      li.className = `leaderboard-row${entry.isYou ? " is-you" : ""}${entry.rank <= 3 ? ` is-top-${entry.rank}` : ""}`;
      li.innerHTML = `
        <span class="lb-rank">#${entry.rank}</span>
        <span class="lb-main">
          <strong class="lb-name">${entry.name}</strong>
          <span class="lb-tag">${entry.tag}</span>
        </span>
        <span class="lb-stats">
          <span class="lb-level">LVL ${entry.level}</span>
          <strong class="lb-score">${entry.score.toLocaleString()}</strong>
        </span>
      `;
      els.leaderboardList.appendChild(li);
    });
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = "sine", gainValue = 0.08, when = 0) {
    const ctx = ensureAudio();
    if (!ctx || !sfxEnabled) return;

    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playSfx(name) {
    if (!sfxEnabled) return;

    const clip = sfxBuffers[name];
    if (clip) {
      try {
        // Clone so rapid clicks can overlap instead of cutting off
        const node = clip.cloneNode(true);
        node.volume = clip.volume;
        const playPromise = node.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            try {
              clip.pause();
              clip.currentTime = 0;
              const retry = clip.play();
              if (retry && typeof retry.catch === "function") {
                retry.catch(() => playSfxFallback(name));
              }
            } catch {
              playSfxFallback(name);
            }
          });
        }
        return;
      } catch {
        /* fall through */
      }
    }

    playSfxFallback(name);
  }

  function playSfxFallback(name) {
    switch (name) {
      case "add":
        playTone(520, 0.1, "triangle", 0.12);
        playTone(780, 0.12, "triangle", 0.1, 0.07);
        break;
      case "complete":
        playTone(440, 0.1, "sine", 0.12);
        playTone(554, 0.12, "sine", 0.1, 0.08);
        playTone(659, 0.16, "sine", 0.1, 0.16);
        break;
      case "delete":
        playTone(320, 0.12, "square", 0.06);
        playTone(220, 0.14, "square", 0.05, 0.06);
        break;
      case "timer":
        playTone(660, 0.12, "sawtooth", 0.08);
        playTone(880, 0.14, "sawtooth", 0.07, 0.12);
        playTone(990, 0.18, "triangle", 0.08, 0.24);
        break;
      case "levelup":
        playTone(523, 0.12, "triangle", 0.12);
        playTone(659, 0.12, "triangle", 0.1, 0.1);
        playTone(784, 0.12, "triangle", 0.1, 0.2);
        playTone(1046, 0.22, "sine", 0.12, 0.32);
        break;
      case "click":
        playTone(700, 0.05, "square", 0.05);
        break;
      default:
        break;
    }
  }

  function renderSfxToggle() {
    els.sfxToggle.textContent = sfxEnabled ? "Sound: On" : "Sound: Off";
    els.sfxToggle.setAttribute("aria-pressed", String(sfxEnabled));
  }

  const bgMusic = els.bgMusic || new Audio("sounds/on-and-on.mp3");
  bgMusic.loop = true;
  bgMusic.preload = "auto";
  bgMusic.volume = 0.85;
  try {
    bgMusic.setAttribute("playsinline", "");
  } catch {}

  let musicStarted = false;

  function renderMusicToggle() {
    const playing = musicEnabled && !bgMusic.paused;
    els.musicToggle.textContent = playing ? "Music: On" : musicEnabled ? "Music: Start" : "Music: Off";
    els.musicToggle.setAttribute("aria-pressed", String(playing));
  }

  function syncBackgroundMusic(fromGesture = false) {
    if (!musicEnabled) {
      bgMusic.pause();
      musicStarted = false;
      renderMusicToggle();
      return Promise.resolve(false);
    }

    ensureAudio();
    try {
      bgMusic.muted = false;
      bgMusic.volume = 0.85;
      if (bgMusic.readyState < 2) {
        bgMusic.load();
      }
    } catch {}

    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.then === "function") {
      return playPromise
        .then(() => {
          musicStarted = true;
          renderMusicToggle();
          if (fromGesture) showToast("On & On playing");
          return true;
        })
        .catch((err) => {
          musicStarted = false;
          renderMusicToggle();
          console.warn("Music play blocked/failed", err);
          showToast("Press Music: Start to play the song");
          return false;
        });
    }

    musicStarted = !bgMusic.paused;
    renderMusicToggle();
    return Promise.resolve(musicStarted);
  }

  bgMusic.addEventListener("error", () => {
    showToast("Music file failed to load");
    console.error("bg music error", bgMusic.error);
  });

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
    playSfx("add");
  }

  function toggleQuest(id) {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) return;

    if (!quest.done) {
      quest.done = true;
      gainXp(QUEST_XP, "Quest complete");
    } else {
      quest.done = false;
      playSfx("click");
    }
    saveState();
    renderQuests();
  }

  function deleteQuest(id) {
    state.quests = state.quests.filter((q) => q.id !== id);
    saveState();
    renderQuests();
    playSfx("delete");
  }

  function renderWallet() {
    els.tokenCount.textContent = String(state.tokens || 0);
    els.gemCount.textContent = String(state.gems || 0);
  }

  function renderVipToggle() {
    if (!vipUnlocked) {
      els.vipLabel.textContent = "VIP Locked";
      els.vipToggle.classList.add("is-locked");
      els.vipToggle.setAttribute("aria-pressed", "false");
      els.vipToggle.title = "Locked — enter moderator code to unlock VIP";
      return;
    }
    els.vipToggle.classList.remove("is-locked");
    els.vipLabel.textContent = vipEnabled ? "VIP: On" : "VIP: Off";
    els.vipToggle.setAttribute("aria-pressed", String(vipEnabled));
    els.vipToggle.title = "VIP unlocked — toggle gem rewards";
  }

  function openModeratorSearch() {
    els.modPanel.removeAttribute("hidden");
    els.modToggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      els.modCode.focus();
      els.modCode.select();
    });
  }

  function unlockFreeVip(source) {
    if (source !== "moderator") {
      showToast("VIP stays locked until the moderator code is entered");
      return;
    }
    vipUnlocked = true;
    vipEnabled = true;
    vipUnlockSource = "moderator";
    state.vipUnlocked = true;
    state.vipEnabled = true;
    state.vipUnlockSource = "moderator";
    if (!Array.isArray(state.ownedThemes)) state.ownedThemes = [];
    VIP_THEME_IDS.forEach((id) => {
      if (!state.ownedThemes.includes(id)) state.ownedThemes.push(id);
    });
    saveState();
    renderWallet();
    renderVipToggle();
    renderThemeGrid();
    checkAchievements();
    playSfx("levelup");
    showToast("Moderator code accepted — VIP gem themes unlocked");
    els.modPanel.setAttribute("hidden", "");
    els.modToggle.setAttribute("aria-expanded", "false");
    els.modCode.value = "";
  }

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function renderLiveClock() {
    if (!els.liveClockTime && !els.liveClockDate) return;
    const now = new Date();
    if (els.liveClockTime) {
      els.liveClockTime.textContent = now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
      els.liveClockTime.dateTime = now.toISOString();
    }
    if (els.liveClockDate) {
      els.liveClockDate.textContent = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  function startLiveClock() {
    renderLiveClock();
    window.setInterval(renderLiveClock, 1000);
  }

  const DAILY_AFFIRMATIONS = [
    "You showed up — that already puts you ahead of yesterday.",
    "Small focused steps beat perfect plans you never start.",
    "Your future self is cheering for the work you do today.",
    "Progress is quiet at first. Keep going anyway.",
    "One focused session can change the whole day.",
    "You are allowed to begin again, right now.",
    "Discipline is self-respect in motion.",
    "Curiosity is your superpower — feed it today.",
    "Rest is part of the grind. Breaks make focus sharper.",
    "You don’t need to finish everything — just the next quest.",
    "Consistency builds realms. One day at a time.",
    "Doubt is loud. Action is louder.",
    "Your streak starts with a single honest minute of focus.",
    "Learning compounds. Every note, every quest, every win.",
    "Be kind to your brain — then ask it for one more try.",
    "You are building a habit stronger than motivation.",
    "Today’s effort is tomorrow’s easy mode.",
    "Mistakes are just loading screens for mastery.",
    "Protect your focus like it’s treasure — because it is.",
    "You belong in rooms you’re still growing into.",
    "Clear one quest. Celebrate. Then clear another.",
    "The horizon moves closer every time you study.",
    "Brave people feel nervous too — they start anyway.",
    "Your energy returns when you finish what you start.",
    "A calm mind unlocks harder levels.",
    "You are not behind. You are becoming.",
    "Make today a +1 day. That’s enough.",
    "Focus is a skill — and you’re training it now.",
    "Let today’s positive note be your warm-up quest.",
    "You’ve survived every hard day so far. Keep going.",
    "Your goals don’t need perfection. They need presence.",
  ];

  function dailyAffirmationFor(date = new Date()) {
    const key = todayKey(date);
    const idx = hashSeed(key + ":affirm") % DAILY_AFFIRMATIONS.length;
    return DAILY_AFFIRMATIONS[idx];
  }

  function renderDailyAttachment() {
    const note = dailyAffirmationFor();
    if (els.dailyNoteText) els.dailyNoteText.textContent = note;
    if (els.guideDailyText) els.guideDailyText.textContent = note;
    if (els.dailyAttachment) els.dailyAttachment.hidden = false;
  }

  function setGuideOpen(open) {
    if (!els.guideDrawer || !els.guideFab) return;
    els.guideDrawer.hidden = !open;
    els.guideFab.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("eli-open", open);
    if (open) {
      if (!state.stats) state.stats = { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false };
      if (!state.stats.eliOpened) {
        state.stats.eliOpened = true;
        saveState();
        checkAchievements();
      }
      renderDailyAttachment();
      window.setTimeout(() => els.guideInput?.focus(), 40);
    }
  }

  const eliMemory = [];

  function appendGuideBubble(role, text) {
    if (!els.guideChat) return;
    const bubble = document.createElement("div");
    bubble.className = `guide-bubble ${role === "user" ? "is-user" : "is-ai"}`;
    const who = document.createElement("strong");
    who.textContent = role === "user" ? "You" : "ELI AI";
    const body = document.createElement("div");
    body.textContent = text;
    bubble.append(who, body);
    els.guideChat.appendChild(bubble);
    els.guideChat.scrollTop = els.guideChat.scrollHeight;
    return bubble;
  }

  function setEliTyping(on) {
    if (!els.guideChat) return;
    let tip = els.guideChat.querySelector(".guide-bubble.is-typing");
    if (on) {
      if (tip) return;
      tip = document.createElement("div");
      tip.className = "guide-bubble is-ai is-typing";
      tip.innerHTML = "<strong>ELI AI</strong><div>Thinking…</div>";
      els.guideChat.appendChild(tip);
      els.guideChat.scrollTop = els.guideChat.scrollHeight;
    } else if (tip) {
      tip.remove();
    }
  }

  function safeMathEval(expr) {
    const cleaned = String(expr)
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/x/gi, "*")
      .replace(/[^0-9+\-*/().,%\s]/g, "")
      .trim();
    if (!cleaned || cleaned.length > 80) return null;
    if (!/^[\d+\-*/().,%\s]+$/.test(cleaned)) return null;
    try {
      // percent: 20% of 50 → (20/100)*50 style not supported; simple 50% → 0.5
      const normalized = cleaned.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${normalized});`)();
      if (typeof val !== "number" || !Number.isFinite(val)) return null;
      return Math.round(val * 10000) / 10000;
    } catch {
      return null;
    }
  }

  function trySolveMath(raw) {
    const text = String(raw || "").trim();
    const eq = text.match(
      /(?:what\s+is|solve|calculate|compute)?\s*([0-9x×÷+\-*/().,%\s]+)=\s*\??/i
    ) || text.match(/^(?:what\s+is|solve|calculate|compute)\s+(.+)$/i);
    let expr = null;
    if (eq) expr = eq[1];
    else if (/^[\d+\-*/().,%\s×÷x]+$/.test(text)) expr = text;
    else {
      const embedded = text.match(/([0-9]+(?:\.[0-9]+)?(?:\s*[+\-*/×÷x]\s*[0-9]+(?:\.[0-9]+)?)+\s*(?:%?)?)/i);
      if (embedded) expr = embedded[1];
    }
    if (!expr) return null;
    const answer = safeMathEval(expr);
    if (answer === null) return null;
    return `Let’s solve it step by step.\n\nProblem: ${expr.trim()}\nAnswer: ${answer}\n\nTip: check your work by doing the problem again the other way (like subtraction to check addition). You got this!`;
  }

  function guideReply(raw) {
    const original = String(raw || "").trim();
    const msg = original.toLowerCase();
    const activeQuests = (state.quests || []).filter((q) => !q.done).length;
    const tokens = state.tokens || 0;
    const gems = state.gems || 0;
    const streak = state.streak || 0;
    const level = state.level || 1;

    const math = trySolveMath(original);
    if (math) return math;

    if (!msg) {
      return "Hi! I’m ELI AI. Ask me about math, reading, writing, science, or any homework question — I’ll explain it in kid-friendly steps.";
    }
    if (/(hi|hello|hey|yo)\b/.test(msg)) {
      return `Hey! I’m ELI AI — your homework buddy (like ChatGPT, made for kids). You’re LVL ${level} in Arcane Horizon. What subject are we working on: math, reading, writing, or science?`;
    }
    if (/who are you|what are you|eli ai|chatgpt|your name/.test(msg)) {
      return "I’m ELI AI — a helpful homework AI for kids. I explain ideas simply, help you practice, and cheer you on. I won’t just give secret answers with no learning — we solve things together!";
    }
    if (/motivate|motivation|encourage|i('?|\s+a)m stuck|hard|give up|homework feel/.test(msg)) {
      return `${dailyAffirmationFor()}\n\nHomework tip: set a tiny goal (one page or 5 problems), start Focus 25, then take a short break. Ask me one question at a time — we’ll crush it.`;
    }
    if (/math homework|help me with math|math help|algebra|fraction|percent|multiply|divide|addition|subtraction/.test(msg)) {
      return "Math mode on! Paste a problem like “12 × 8”, “3/4 of 20”, or “what is 15% of 80”. I’ll show the answer and how we got there. You can also say “explain fractions” or “help with long division”.";
    }
    if (/fraction/.test(msg)) {
      return "Fractions are parts of a whole. The top number (numerator) is how many parts you have. The bottom (denominator) is how many equal parts make one whole. Example: 3/4 means 3 slices of a pizza cut into 4. Want to try a fraction problem together?";
    }
    if (/percent|percentage|%/.test(msg) && !math) {
      return "Percents mean “out of 100.” 25% = 25/100 = 1/4. To find 20% of 50: do 0.20 × 50 = 10. Send me a percent problem and we’ll solve it!";
    }
    if (/long division|divide|division/.test(msg) && !math) {
      return "Long division steps: Divide → Multiply → Subtract → Bring down → Repeat. Example idea: 84 ÷ 4 → 4 goes into 8 two times, bring down 4, 4 goes into 4 once → 21. Paste your division problem and I’ll walk through it.";
    }
    if (/reading homework|help me with reading|reading|comprehension|main idea|summar/.test(msg)) {
      return "Reading help: 1) Read the title. 2) Ask “what is this mostly about?” 3) Find 2–3 key details. 4) Write the main idea in one kid sentence. Paste a short paragraph and I can help you find the main idea!";
    }
    if (/write|writing|paragraph|essay|sentence|story/.test(msg)) {
      return "Writing helper: use this mini plan — Hook (start), 2 detail sentences, Closing sentence. Example starter: “Today I learned ___ because ___.” Tell me your topic (animals, friendship, space…) and I’ll help you build a paragraph.";
    }
    if (/science|planet|photosynthesis|gravity|magnet|animal|habitat|water cycle/.test(msg)) {
      if (/photosynthesis/.test(msg)) {
        return "Photosynthesis (kid version): plants use sunlight + water + air (carbon dioxide) to make food (sugar) and release oxygen. Think of the plant as a tiny kitchen powered by the sun!";
      }
      if (/water cycle/.test(msg)) {
        return "Water cycle: Evaporation (water turns to vapor) → Condensation (clouds form) → Precipitation (rain/snow) → Collection (rivers, lakes, oceans). Then it repeats!";
      }
      if (/gravity/.test(msg)) {
        return "Gravity is the invisible pull that keeps us on Earth and makes things fall down. Bigger objects pull harder — that’s why Earth holds the Moon in orbit!";
      }
      return "Science mode! Ask me to explain a topic simply — like planets, animals, magnets, the water cycle, or photosynthesis — or paste your science question.";
    }
    if (/history|president|ancient|egypt|rome|war|civil/.test(msg)) {
      return "History tip: answer with Who / What / When / Where / Why. That keeps your answer clear. Tell me the history question and I’ll help you organize a short answer.";
    }
    if (/explain (this )?like i('?|\s+a)m 10|explain simply|simple words|eli5/.test(msg)) {
      return "Got it — kid mode. Paste the hard sentence or topic, and I’ll explain it with easy words, a fun example, and one practice question.";
    }
    if (/homework|school|assignment|worksheet|study for/.test(msg)) {
      return "I’m ready for homework help! Tell me the subject and the question. Examples:\n• “What is 9 × 7?”\n• “Help me write about dolphins”\n• “Explain photosynthesis”\n• “What’s the main idea of this paragraph?”";
    }
    if (/focus plan|pomodoro|study plan|schedule/.test(msg)) {
      return "Kid focus plan: 1) Write one homework quest. 2) Start Focus 25. 3) Ask ELI AI if you get stuck. 4) Short break 5. 5) Check answers. Games wait until Focus is done!";
    }
    if (/study tip|how to study|concentrate|distract/.test(msg)) {
      return "Study tip: phone away, water nearby, one subject at a time. After each page/problem set, tell me what you learned in one sentence — that makes it stick.";
    }
    if (/token/.test(msg)) {
      return `Tokens are free game money. You have ${tokens}. Finish quests (+10) and Focus (+15) to earn more. Games cost 150 Tokens to unlock.`;
    }
    if (/gem/.test(msg)) {
      return `Gems are VIP points. You have ${gems}. Open the Daily Chest for +100 Gems.`;
    }
    if (/theme|background/.test(msg)) {
      return "Regular themes are free — open Themes and tap one. VIP themes stay locked until a moderator unlocks VIP.";
    }
    if (/positive|affirmation|daily attachment|daily note/.test(msg)) {
      return `Today’s positive words: “${dailyAffirmationFor()}”`;
    }
    if (/game|mini-?game/.test(msg)) {
      return "Games unlock for 150 Tokens each, and they lock during Focus time so homework comes first. Breaks are okay for play!";
    }
    if (/chest|daily chest|welcome|theme chest/.test(msg)) {
      return "Daily Chest = +100 Gems once a day. Theme Chest = +50 Tokens one time. Grab them in the top wallet row!";
    }
    if (/vip|moderator|code/.test(msg)) {
      return "VIP unlocks with the moderator code under Moderator Only. Then VIP themes open up.";
    }
    if (/streak/.test(msg)) {
      return `Your streak is ${streak} day${streak === 1 ? "" : "s"}. Finish a quest or Focus today to keep it glowing!`;
    }
    if (/quest|todo|task/.test(msg)) {
      return activeQuests
        ? `You’ve got ${activeQuests} quest${activeQuests === 1 ? "" : "s"}. Turn one homework task into a quest, then start Focus!`
        : "Add a homework quest like “Finish math page 12” — then ask me for help on any sticky problem.";
    }
    if (/timer|focus timer|break/.test(msg)) {
      return "Use Focus 25 for homework power time. Short Break 5 and Long Break 15 are for rest. Games pause during Focus.";
    }

    // Context from recent chat
    const recent = eliMemory.slice(-3).map((m) => m.text).join(" ");
    if (/yes|yeah|yep|ok|okay|sure|please/.test(msg) && /math|fraction|reading|write|science/.test(recent)) {
      return "Awesome — paste the exact homework question now and I’ll help step by step.";
    }

    return `I’m ELI AI, your homework helper. I can help with math problems, reading main ideas, writing paragraphs, and science explanations.\n\nYou said: “${original.slice(0, 160)}”\n\nTry adding the subject, like “Math: 48 ÷ 6” or “Explain gravity simply,” and I’ll jump right in. (LVL ${level} · streak ${streak})`;
  }

  function askGuide(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return;
    appendGuideBubble("user", cleaned);
    eliMemory.push({ role: "user", text: cleaned });
    if (eliMemory.length > 12) eliMemory.splice(0, eliMemory.length - 12);
    setEliTyping(true);
    window.setTimeout(() => {
      setEliTyping(false);
      const reply = guideReply(cleaned);
      appendGuideBubble("ai", reply);
      eliMemory.push({ role: "ai", text: reply });
      playSfx("click");
    }, 380 + Math.min(900, cleaned.length * 8));
  }

  function initHorizonGuide() {
    if (els.guideChat && !els.guideChat.childElementCount) {
      appendGuideBubble(
        "ai",
        "Hi! I’m ELI AI — your ChatGPT-style homework helper for kids. Ask me about math, reading, writing, or science. I’ll explain things simply and help you learn step by step."
      );
    }
    els.guideFab?.addEventListener("click", () => {
      ensureAudio();
      const open = els.guideDrawer?.hidden !== false;
      setGuideOpen(open);
      playSfx("click");
    });
    els.guideClose?.addEventListener("click", () => {
      ensureAudio();
      setGuideOpen(false);
      playSfx("click");
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && els.guideDrawer && !els.guideDrawer.hidden) {
        setGuideOpen(false);
      }
    });
    els.guideForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      ensureAudio();
      const value = els.guideInput?.value || "";
      if (els.guideInput) els.guideInput.value = "";
      askGuide(value);
    });
    els.guideChips?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ask]");
      if (!btn) return;
      ensureAudio();
      askGuide(btn.getAttribute("data-ask"));
    });
  }

  function dayOffsetKey(days) {
    const dt = new Date();
    dt.setHours(12, 0, 0, 0);
    dt.setDate(dt.getDate() + days);
    return todayKey(dt);
  }

  function touchStreak() {
    const today = todayKey();
    const yesterday = dayOffsetKey(-1);
    if (state.lastActiveDate === today) {
      return { grew: false, streak: state.streak || 0 };
    }
    if (state.lastActiveDate === yesterday) {
      state.streak = (state.streak || 0) + 1;
    } else {
      state.streak = 1;
    }
    state.lastActiveDate = today;
    state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
    return { grew: true, streak: state.streak };
  }

  function addHistory({ type, text, xp = 0, tokens = 0, gems = 0 }) {
    if (!Array.isArray(state.history)) state.history = [];
    state.history.unshift({
      id: uid(),
      type: type || "activity",
      text,
      xp,
      tokens,
      gems,
      at: Date.now(),
    });
    if (state.history.length > HISTORY_LIMIT) {
      state.history.length = HISTORY_LIMIT;
    }
  }

  function formatHistoryWhen(ts) {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function renderStreak() {
    // Drop expired streak display if a day was missed
    const today = todayKey();
    const yesterday = dayOffsetKey(-1);
    if (state.lastActiveDate && state.lastActiveDate !== today && state.lastActiveDate !== yesterday) {
      state.streak = 0;
    }
    const streak = state.streak || 0;
    const best = state.bestStreak || 0;
    if (els.streakCount) els.streakCount.textContent = String(streak);
    if (els.streakDisplay) els.streakDisplay.textContent = String(streak);
    if (els.historyMeta) els.historyMeta.textContent = `Best streak: ${best}`;
    if (els.streakTitle) {
      if (!streak) els.streakTitle.textContent = "Start your streak today";
      else if (streak === 1) els.streakTitle.textContent = "Streak started — come back tomorrow";
      else els.streakTitle.textContent = `${streak}-day streak on fire`;
    }
  }

  function renderHistory() {
    if (!els.historyList || !els.historyEmpty) return;
    const items = Array.isArray(state.history) ? state.history : [];
    els.historyList.innerHTML = "";
    els.historyEmpty.hidden = items.length > 0;
    items.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "history-item";
      const main = document.createElement("p");
      main.className = "history-item-main";
      main.textContent = entry.text;
      const meta = document.createElement("p");
      meta.className = "history-item-meta";
      const bits = [];
      if (entry.xp) bits.push(`${entry.xp > 0 ? "+" : ""}${entry.xp} XP`);
      if (entry.tokens) bits.push(`${entry.tokens > 0 ? "+" : ""}${entry.tokens} Tokens`);
      if (entry.gems) bits.push(`${entry.gems > 0 ? "+" : ""}${entry.gems} Gems`);
      meta.textContent = bits.join(" · ") || entry.type || "Activity";
      const when = document.createElement("span");
      when.className = "history-item-when";
      when.textContent = formatHistoryWhen(entry.at);
      li.append(main, meta, when);
      els.historyList.appendChild(li);
    });
  }

  function isAchievementUnlocked(id) {
    return !!(state.unlockedAchievements && state.unlockedAchievements[id]);
  }

  function renderAchievements() {
    if (!els.achievementsGrid) return;
    const unlockedCount = ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id)).length;
    if (els.achievementsMeta) {
      els.achievementsMeta.textContent = `${unlockedCount} / ${ACHIEVEMENTS.length} unlocked`;
    }
    els.achievementsGrid.innerHTML = "";
    ACHIEVEMENTS.forEach((ach) => {
      const unlocked = isAchievementUnlocked(ach.id);
      const li = document.createElement("li");
      li.className = `achievement-card ${unlocked ? "is-unlocked" : "is-locked"}`;
      const icon = document.createElement("span");
      icon.className = "achievement-icon";
      icon.textContent = unlocked ? ach.icon : "···";
      const copy = document.createElement("div");
      copy.className = "achievement-copy";
      const title = document.createElement("strong");
      title.textContent = ach.title;
      const desc = document.createElement("p");
      desc.textContent = unlocked ? ach.desc : "Keep studying to unlock this badge";
      const status = document.createElement("span");
      status.className = "achievement-status";
      if (unlocked) {
        status.textContent = `Unlocked ${formatHistoryWhen(state.unlockedAchievements[ach.id])}`;
      } else {
        status.textContent = "Locked";
      }
      copy.append(title, desc, status);
      li.append(icon, copy);
      els.achievementsGrid.appendChild(li);
    });
  }

  function unlockAchievement(id) {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach || isAchievementUnlocked(id)) return false;
    if (!state.unlockedAchievements) state.unlockedAchievements = {};
    state.unlockedAchievements[id] = Date.now();
    addHistory({
      type: "achievement",
      text: `Achievement unlocked: ${ach.title}`,
    });
    playSfx("levelup");
    showToast(`Achievement: ${ach.title}`);
    return true;
  }

  function checkAchievements({ silent = false } = {}) {
    let gained = 0;
    ACHIEVEMENTS.forEach((ach) => {
      if (isAchievementUnlocked(ach.id)) return;
      let ok = false;
      try {
        ok = !!ach.test(state);
      } catch {
        ok = false;
      }
      if (!ok) return;
      if (silent) {
        if (!state.unlockedAchievements) state.unlockedAchievements = {};
        state.unlockedAchievements[ach.id] = Date.now();
      } else if (unlockAchievement(ach.id)) {
        gained += 1;
      }
    });
    if (gained || silent) {
      saveState();
      renderAchievements();
      if (!silent) renderHistory();
    }
    return gained;
  }

  function gainRewards({ xp, tokens, gems = 0, reason }) {
    state.xp += xp;
    sessionXp += xp;
    state.tokens = (state.tokens || 0) + tokens;

    const gemGain = vipEnabled ? gems : 0;
    if (gemGain > 0) {
      state.gems = (state.gems || 0) + gemGain;
    }

    const streakInfo = touchStreak();
    const isFocus = reason === "Focus session complete";
    const isQuest = reason === "Quest complete";
    if (!state.stats) state.stats = { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false };
    if (isFocus) state.stats.focus = (state.stats.focus || 0) + 1;
    if (isQuest) state.stats.quests = (state.stats.quests || 0) + 1;

    addHistory({
      type: isFocus ? "focus" : "quest",
      text: reason,
      xp,
      tokens,
      gems: gemGain,
    });

    let leveled = false;
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level += 1;
      leveled = true;
    }

    if (leveled) {
      addHistory({
        type: "level",
        text: `Level up — now LVL ${state.level}`,
        xp: 0,
        tokens: 0,
      });
    }

    saveState();
    renderXp();
    renderWallet();
    renderVipToggle();
    renderStreak();
    renderHistory();
    renderLeaderboard();
    checkAchievements();

    if (leveled) {
      els.levelBadge.classList.remove("is-levelup");
      void els.levelBadge.offsetWidth;
      els.levelBadge.classList.add("is-levelup");
      playSfx("levelup");
      const streakNote = streakInfo.grew ? ` · ${state.streak}-day streak` : "";
      showToast(`Level up! You are now LVL ${state.level}${streakNote}`);
      return;
    }

    playSfx(isFocus ? "timer" : "complete");
    const gemText = gemGain > 0 ? ` · +${gemGain} Gems` : "";
    const streakText = streakInfo.grew ? ` · ${state.streak}-day streak` : "";
    showToast(`+${xp} XP · +${tokens} Tokens${gemText}${streakText} — ${reason}`);
  }

  function gainXp(amount, reason) {
    // Back-compat wrapper used by older call sites during transition
    const isFocus = reason === "Focus session complete";
    gainRewards({
      xp: amount,
      tokens: isFocus ? FOCUS_TOKENS : QUEST_TOKENS,
      gems: isFocus ? FOCUS_GEMS : QUEST_GEMS,
      reason,
    });
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

  function isStudyTimeActive() {
    return running && state.timer.mode === "focus";
  }

  function ownsGame(gameId) {
    if (!Array.isArray(state.ownedGames)) state.ownedGames = [];
    return !!gameId && state.ownedGames.includes(gameId);
  }

  function getPlayableGame(gameId) {
    return PLAYABLE_GAMES.find((g) => g.id === gameId) || null;
  }

  function tryBuyGame(gameId) {
    const game = getPlayableGame(gameId);
    if (!game) return { ok: false, reason: "Unknown game" };
    if (ownsGame(game.id)) return { ok: true, bought: false };
    if ((state.tokens || 0) < GAME_UNLOCK_COST) {
      return { ok: false, reason: `Need ${GAME_UNLOCK_COST} Tokens to unlock ${game.name}` };
    }
    state.tokens -= GAME_UNLOCK_COST;
    state.ownedGames.push(game.id);
    addHistory({
      type: "game-unlock",
      text: `Unlocked game: ${game.name}`,
      tokens: -GAME_UNLOCK_COST,
    });
    saveState();
    renderWallet();
    renderHistory();
    renderLeaderboard();
    renderGameLocks();
    checkAchievements();
    return { ok: true, bought: true, amount: GAME_UNLOCK_COST, name: game.name };
  }

  function renderGameLocks() {
    PLAYABLE_GAMES.forEach((game) => {
      const panel = document.querySelector(`[data-game="${game.id}"]`);
      if (!panel) return;
      const owned = ownsGame(game.id);
      panel.classList.toggle("is-game-locked", !owned);
      panel.classList.toggle("is-game-owned", owned);

      const buyBtn = panel.querySelector("[data-buy-game]");
      if (buyBtn) {
        buyBtn.hidden = owned;
        buyBtn.disabled = owned;
        buyBtn.textContent = `Unlock · ${GAME_UNLOCK_COST} Tokens`;
      }
      const lockNote = panel.querySelector(".game-lock-note");
      if (lockNote) {
        lockNote.hidden = owned;
        lockNote.textContent = `Locked · ${GAME_UNLOCK_COST} Tokens to unlock`;
      }
    });
    syncStudyGameLock();
  }

  function syncStudyGameLock() {
    const studyLocked = isStudyTimeActive();
    window.__arcaneStudyLock = studyLocked;
    document.body.classList.toggle("is-study-lock", studyLocked);

    PLAYABLE_GAMES.forEach((game) => {
      const owned = ownsGame(game.id);
      const locked = studyLocked || !owned;
      game.startIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.disabled = locked || (id === "bloons-wave" && !owned);
        if (!owned) {
          el.title = `Unlock ${game.name} for ${GAME_UNLOCK_COST} Tokens`;
        } else if (studyLocked) {
          el.title = "Locked during study time";
        } else if (el.dataset.studyLock === "1" || el.title.includes("Locked") || el.title.includes("Unlock")) {
          el.removeAttribute("title");
        }
      });
    });

    window.dispatchEvent(new CustomEvent("arcane-study-lock", { detail: { locked: studyLocked } }));
  }

  window.arcaneGuardStudy = function arcaneGuardStudy(gameId) {
    if (isStudyTimeActive()) {
      showToast("Games locked during study time — finish your focus session first");
      playSfx("click");
      return true;
    }
    if (gameId && !ownsGame(gameId)) {
      showToast(`Unlock this game for ${GAME_UNLOCK_COST} Tokens`);
      playSfx("click");
      return true;
    }
    return false;
  };

  window.arcaneOwnsGame = function arcaneOwnsGame(gameId) {
    return ownsGame(gameId);
  };

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
    running = false;
    saveState();
    syncStudyGameLock();
  }

  function completeTimer() {
    stopTimer();
    remaining = 0;
    renderTimer();

    if (state.timer.mode === "focus") {
      gainXp(FOCUS_XP, "Focus session complete");
    } else {
      playSfx("timer");
      showToast("Break over — time to refocus");
    }

    remaining = state.timer.minutes * 60;
    saveState();
    renderTimer();
    syncStudyGameLock();
  }

  function tick() {
    if (remaining <= 1) {
      completeTimer();
      return;
    }
    remaining -= 1;
    saveState();
    renderTimer();
  }

  function startTimer() {
    if (running) return;
    running = true;
    timerId = setInterval(tick, 1000);
    renderTimer();
    syncStudyGameLock();
    if (isStudyTimeActive()) {
      showToast("Study time — games locked until focus ends");
    }
    playSfx("click");
  }

  function toggleTimer() {
    if (running) {
      stopTimer();
      renderTimer();
      playSfx("click");
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    stopTimer();
    remaining = state.timer.minutes * 60;
    saveState();
    renderTimer();
    syncStudyGameLock();
    playSfx("click");
  }

  function setMode(mode, minutes) {
    stopTimer();
    state.timer = { mode, minutes, remaining: minutes * 60 };
    remaining = minutes * 60;
    saveState();

    els.modeBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });
    renderTimer();
    syncStudyGameLock();
    playSfx("click");
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    ensureAudio();
    const title = els.input.value.trim();
    if (!title) return;
    addQuest(title);
    els.input.value = "";
    els.input.focus();
  });

  els.sfxToggle.addEventListener("click", () => {
    ensureAudio();
    sfxEnabled = !sfxEnabled;
    state.sfxEnabled = sfxEnabled;
    saveState();
    renderSfxToggle();
    if (sfxEnabled) playSfx("add");
  });

  els.themeToggle.addEventListener("click", () => {
    const willOpen = els.themePanel.hasAttribute("hidden");
    if (willOpen) {
      els.themePanel.removeAttribute("hidden");
      els.themeToggle.setAttribute("aria-expanded", "true");
      renderThemeGrid();
    } else {
      els.themePanel.setAttribute("hidden", "");
      els.themeToggle.setAttribute("aria-expanded", "false");
    }
    playSfx("click");
  });

  // Works even if cards are already in HTML
  els.themeGrid?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-theme]");
    if (!card) return;
    const theme = getTheme(card.dataset.theme);
    if (!theme) return;
    const purchase = tryBuyTheme(theme);
    if (!purchase.ok) {
      showToast(purchase.reason);
      playSfx("click");
      renderThemeGrid();
      return;
    }
    applyTheme(theme.id, { toast: true });
    checkAchievements();
    playSfx("click");
    renderThemeGrid();
  });

  els.dailyChest?.addEventListener("click", () => {
    ensureAudio();
    claimDailyChest();
  });

  els.themeChest?.addEventListener("click", () => {
    ensureAudio();
    claimThemeChest();
  });

  document.querySelectorAll("[data-buy-game]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ensureAudio();
      const gameId = btn.getAttribute("data-buy-game");
      const result = tryBuyGame(gameId);
      if (!result.ok) {
        showToast(result.reason);
        playSfx("click");
        return;
      }
      if (result.bought) {
        playSfx("levelup");
        showToast(`Unlocked ${result.name} for ${result.amount} Tokens`);
      }
    });
  });

  els.musicToggle.addEventListener("click", () => {
    ensureAudio();

    // If enabled but not actually playing, this click starts it
    if (musicEnabled && bgMusic.paused) {
      syncBackgroundMusic(true);
      return;
    }

    musicEnabled = !musicEnabled;
    state.musicEnabled = musicEnabled;
    saveState();
    renderMusicToggle();

    if (musicEnabled) {
      syncBackgroundMusic(true);
    } else {
      bgMusic.pause();
      musicStarted = false;
      showToast("Music off");
      renderMusicToggle();
    }
  });

  els.vipToggle.addEventListener("click", () => {
    ensureAudio();

    // Stay locked until moderator code unlocks VIP — do not open anything here
    if (!vipUnlocked) {
      playSfx("click");
      showToast("VIP is locked — use Moderator Only and enter the code");
      return;
    }

    vipEnabled = !vipEnabled;
    state.vipEnabled = vipEnabled;
    saveState();
    renderVipToggle();
    playSfx("click");
    showToast(vipEnabled ? "VIP on — earn Gems from quests & focus" : "VIP off — Tokens only");
  });

  els.modToggle.addEventListener("click", () => {
    ensureAudio();
    const willOpen = els.modPanel.hasAttribute("hidden");
    if (willOpen) {
      els.modPanel.removeAttribute("hidden");
      els.modToggle.setAttribute("aria-expanded", "true");
      playSfx("click");
      requestAnimationFrame(() => {
        els.modCode.focus();
        els.modCode.select();
      });
    } else {
      els.modPanel.setAttribute("hidden", "");
      els.modToggle.setAttribute("aria-expanded", "false");
      playSfx("click");
    }
  });

  els.modPanel.addEventListener("submit", (e) => {
    e.preventDefault();
    ensureAudio();
    const code = els.modCode.value.trim();
    if (code.toUpperCase() === MOD_VIP_CODE) {
      unlockFreeVip("moderator");
      return;
    }
    playSfx("delete");
    showToast("Invalid moderator code");
    els.modCode.focus();
    els.modCode.select();
  });

  els.timerToggle.addEventListener("click", () => {
    ensureAudio();
    toggleTimer();
  });
  els.timerReset.addEventListener("click", () => {
    ensureAudio();
    resetTimer();
  });

  els.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      ensureAudio();
      setMode(btn.dataset.mode, Number(btn.dataset.minutes));
    });
  });

  els.modeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === state.timer.mode);
  });

  const unlockAudio = () => {
    if (document.body.classList.contains("splash-active")) return;
    ensureAudio();
    if (musicEnabled) syncBackgroundMusic(true);
  };
  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("keydown", unlockAudio);


  window.addEventListener("arcane-game-reward", (event) => {
    const game = event.detail?.game || "dash";
    const win = !!event.detail?.win;
    const points = Math.max(0, Number(event.detail?.points) || 0);
    if (!win && points <= 0) return;

    const labels = {
      cowboy: "Quick Draw",
      bloons: "Balloon Defense",
      cuphead: "Ink Boss",
      royale: "Arena Clash",
      dash: "Horizon Dash",
    };
    const label = labels[game] || "Game";

    state.gameWinProgress = Math.max(0, Number(state.gameWinProgress) || 0) + (win ? 1 : 0);
    state.gamePointProgress = Math.max(0, Number(state.gamePointProgress) || 0) + points;
    if (!state.stats) state.stats = { quests: 0, focus: 0, gameWins: 0, gamePoints: 0, eliOpened: false };
    if (win) state.stats.gameWins = (state.stats.gameWins || 0) + 1;
    if (points > 0) state.stats.gamePoints = (state.stats.gamePoints || 0) + points;

    let gained = 0;
    const parts = [];
    while (state.gameWinProgress >= GAME_WIN_GOAL) {
      state.gameWinProgress -= GAME_WIN_GOAL;
      gained += GAME_MILESTONE_TOKENS;
      parts.push(`${GAME_WIN_GOAL} wins`);
    }
    while (state.gamePointProgress >= GAME_POINT_GOAL) {
      state.gamePointProgress -= GAME_POINT_GOAL;
      gained += GAME_MILESTONE_TOKENS;
      parts.push(`${GAME_POINT_GOAL} pts`);
    }

    const streakInfo = touchStreak();
    if (gained > 0) {
      state.tokens = (state.tokens || 0) + gained;
      addHistory({
        type: "game",
        text: `${label} milestone (${parts.join(" + ")})`,
        tokens: gained,
      });
    }

    saveState();
    renderWallet();
    renderVipToggle();
    renderStreak();
    renderHistory();
    renderLeaderboard();
    renderThemeGrid();
    renderGameLocks();
    checkAchievements();

    const streakText = streakInfo.grew ? ` · ${state.streak}-day streak` : "";
    if (gained > 0) {
      showToast(`${label}: +${gained} Tokens${streakText}`);
    } else {
      showToast(
        `${label} progress · ${state.gameWinProgress}/${GAME_WIN_GOAL} wins · ${state.gamePointProgress}/${GAME_POINT_GOAL} pts`
      );
    }
  });

  els.historyClear?.addEventListener("click", () => {
    state.history = [];
    state.streak = 0;
    state.bestStreak = 0;
    state.lastActiveDate = null;
    saveState();
    renderHistory();
    renderStreak();
    renderLeaderboard();
    playSfx("click");
    showToast("History & streak reset");
  });

  window.addEventListener("beforeunload", saveState);

  preloadThemes();
  applyBackgroundFromStorage();
  renderThemeGrid();
  if (els.themePanel) els.themePanel.removeAttribute("hidden");
  if (els.themeToggle) els.themeToggle.setAttribute("aria-expanded", "true");

  els.ring.style.strokeDasharray = String(CIRCUMFERENCE);

  // One-time wipe of saved activity history / streak panel
  if (localStorage.getItem("arcane-horizon-history-reset-v1") !== "1") {
    state.history = [];
    state.streak = 0;
    state.bestStreak = 0;
    state.lastActiveDate = null;
    localStorage.setItem("arcane-horizon-history-reset-v1", "1");
    saveState();
  }

  renderSfxToggle();
  renderMusicToggle();
  renderVipToggle();
  renderWallet();
  renderDailyChest();
  renderThemeChest();
  renderDailyAttachment();
  initHorizonGuide();
  renderStreak();
  renderHistory();
  renderLeaderboard();
  renderAchievements();
  checkAchievements({ silent: true });
  renderQuests();
  renderXp();
  renderTimer();
  renderGameLocks();
  startLiveClock();

  function runSplashScreen() {
    const splash = document.getElementById("splash-screen");
    const fill = document.getElementById("splash-loader-fill");
    const text = document.getElementById("splash-loader-text");
    const enterBtn = document.getElementById("splash-enter");
    if (!splash) {
      document.body.classList.remove("splash-active");
      if (musicEnabled) showToast("Tap Music: Start if you don't hear the song");
      return;
    }

    let ready = false;
    let entered = false;

    const steps = [
      { at: 12, label: "Summoning stars…" },
      { at: 28, label: "Charging arcane cores…" },
      { at: 46, label: "Loading quests & themes…" },
      { at: 64, label: "Calibrating study timer…" },
      { at: 82, label: "Warming up games…" },
      { at: 100, label: "Ready" },
    ];

    const started = performance.now();
    const duration = 4500;

    // Keep splash on top until the player enters — never auto-dismiss.
    document.body.classList.add("splash-active");
    splash.removeAttribute("hidden");
    splash.classList.remove("is-done");

    const artImg = splash.querySelector(".splash-art img");
    if (artImg) {
      const markArt = () => splash.classList.add("splash-has-art");
      const markMissing = () => splash.classList.remove("splash-has-art");
      if (artImg.complete && artImg.naturalWidth > 0) markArt();
      else {
        artImg.addEventListener("load", markArt, { once: true });
        artImg.addEventListener("error", markMissing, { once: true });
      }
    }

    function finishSplash() {
      if (entered || !ready) return;
      entered = true;
      ensureAudio();
      if (musicEnabled) syncBackgroundMusic(true);
      splash.classList.add("is-done");
      document.body.classList.remove("splash-active");
      window.setTimeout(() => {
        splash.setAttribute("hidden", "");
        splash.remove();
        renderDailyAttachment();
      }, 700);
    }

    function tickSplash(now) {
      const t = Math.min(1, (now - started) / duration);
      const progress = Math.round(t * 100);
      if (fill) fill.style.width = `${progress}%`;
      const step = [...steps].reverse().find((s) => progress >= s.at) || steps[0];
      if (text) text.textContent = step.label;
      if (t < 1) {
        requestAnimationFrame(tickSplash);
        return;
      }
      ready = true;
      if (text) text.textContent = "Tap to enter";
      if (enterBtn) {
        enterBtn.hidden = false;
        enterBtn.focus();
      }
    }

    enterBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      finishSplash();
    });
    splash.addEventListener("click", () => {
      if (ready) finishSplash();
    });
    window.addEventListener("keydown", (e) => {
      if (!ready || entered) return;
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        finishSplash();
      }
    });

    requestAnimationFrame(tickSplash);
  }

  runSplashScreen();
})();
