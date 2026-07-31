(() => {
  const canvas = document.getElementById("theme-fx");
  const ornaments = document.getElementById("theme-ornaments");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let particles = [];
  let beams = [];
  let orbs = [];
  let themeId = "sunrise";
  let tick = 0;
  let reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const PRESETS = {
    dark: {
      label: "Theme Locked",
      motto: "Earn Tokens to Unlock",
      mote: "#5a4a78",
      mote2: "#2a2038",
      kind: "dust",
      count: 18,
      beams: false,
      ornaments: ["◆", "◇", "✦", "✧", "◈"],
      corners: ["◆", "◇", "◆", "◇"],
    },
    sunrise: {
      label: "Arcane Sunrise",
      motto: "Rise & Focus",
      mote: "#ffd27a",
      mote2: "#ff4fd8",
      kind: "spark",
      count: 56,
      beams: true,
      beamColor: "rgba(255, 190, 90, 0.1)",
      sun: true,
      ornaments: ["☀", "✦", "◇", "✶", "✧"],
      corners: ["◈", "◆", "◇", "◈"],
    },
    sunset: {
      label: "Sunset Palm",
      motto: "Golden Hour Study",
      mote: "#ff8c42",
      mote2: "#ff71ce",
      kind: "dust",
      count: 48,
      beams: true,
      beamColor: "rgba(255, 120, 60, 0.09)",
      horizon: true,
      ornaments: ["☾", "✦", "◇", "✶", "✧"],
      corners: ["◆", "◇", "◆", "◇"],
    },
    cyberpunk: {
      label: "Cyber Purple",
      motto: "Neon Protocol",
      mote: "#d16bff",
      mote2: "#7af0ff",
      kind: "rain",
      count: 70,
      beams: false,
      scan: true,
      grid: true,
      ornaments: ["◈", "⚡", "◆", "▣", "◇"],
      corners: ["▣", "◈", "▣", "◈"],
    },
    forest: {
      label: "Forest Mist",
      motto: "Quiet Grove",
      mote: "#8cff9a",
      mote2: "#ffe66d",
      kind: "firefly",
      count: 52,
      beams: false,
      mist: true,
      ornaments: ["✧", "✦", "◇", "✶", "✧"],
      corners: ["◇", "✦", "◇", "✦"],
    },
    ocean: {
      label: "Deep Ocean",
      motto: "Tide of Focus",
      mote: "#4fd2ff",
      mote2: "#b8ff3c",
      kind: "bubble",
      count: 54,
      beams: true,
      beamColor: "rgba(80, 200, 255, 0.08)",
      waves: true,
      ornaments: ["◉", "≋", "✧", "◇", "✦"],
      corners: ["◉", "◇", "◉", "◇"],
    },
    aurora: {
      label: "Aurora",
      motto: "Northern Glow",
      mote: "#7dffb0",
      mote2: "#6ecbff",
      kind: "ribbon",
      count: 40,
      beams: false,
      aurora: true,
      ornaments: ["❄", "✦", "✧", "✶", "◇"],
      corners: ["✦", "❄", "✦", "❄"],
    },
    volcano: {
      label: "Volcano",
      motto: "Forge Ahead",
      mote: "#ff7a3c",
      mote2: "#ff3d5a",
      kind: "ember",
      count: 64,
      beams: false,
      heat: true,
      ornaments: ["▲", "✦", "◆", "✶", "◇"],
      corners: ["▲", "◆", "▲", "◆"],
    },
    ice: {
      label: "Ice Cavern",
      motto: "Crystal Calm",
      mote: "#d8f6ff",
      mote2: "#9fe9ff",
      kind: "snow",
      count: 68,
      beams: true,
      beamColor: "rgba(180, 240, 255, 0.07)",
      frost: true,
      ornaments: ["❄", "✧", "◇", "✦", "✶"],
      corners: ["❄", "◇", "❄", "◇"],
    },
    desert: {
      label: "Desert Dusk",
      motto: "Dust & Discipline",
      mote: "#ffb347",
      mote2: "#ff6f91",
      kind: "sand",
      count: 58,
      beams: false,
      dunes: true,
      ornaments: ["◆", "✧", "☾", "✦", "◇"],
      corners: ["◆", "☾", "◆", "☾"],
    },
    space: {
      label: "Cosmic Nebula",
      motto: "Orbit Your Goals",
      mote: "#b388ff",
      mote2: "#66e0ff",
      kind: "star",
      count: 90,
      beams: false,
      nebula: true,
      ornaments: ["✦", "✧", "✶", "★", "◇"],
      corners: ["✦", "✶", "✦", "✶"],
    },
    neonrain: {
      label: "Neon Rain",
      motto: "Chrome Focus",
      mote: "#ff4fd8",
      mote2: "#4de1ff",
      kind: "rain",
      count: 80,
      beams: false,
      scan: true,
      grid: true,
      ornaments: ["┊", "◆", "⚡", "◈", "✧"],
      corners: ["◈", "┊", "◈", "┊"],
    },
    vipgold: {
      label: "Gem Vault",
      motto: "VIP Treasure",
      mote: "#ffd27a",
      mote2: "#ffb347",
      kind: "spark",
      count: 70,
      beams: true,
      beamColor: "rgba(255, 210, 120, 0.12)",
      sun: true,
      ornaments: ["◆", "✦", "◇", "✶", "✧"],
      corners: ["◆", "✦", "◆", "✦"],
    },
    viproyal: {
      label: "Royal Obsidian",
      motto: "VIP Regalia",
      mote: "#d16bff",
      mote2: "#ff71ce",
      kind: "star",
      count: 75,
      beams: false,
      nebula: true,
      ornaments: ["◈", "✦", "◆", "✧", "✶"],
      corners: ["◈", "◆", "◈", "◆"],
    },
    vipcrystal: {
      label: "Crystal Crown",
      motto: "VIP Prism",
      mote: "#9fe9ff",
      mote2: "#b388ff",
      kind: "spark",
      count: 68,
      beams: true,
      beamColor: "rgba(160, 230, 255, 0.1)",
      frost: true,
      ornaments: ["❄", "✦", "◇", "✧", "✶"],
      corners: ["◇", "✦", "◇", "✦"],
    },
  };

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle(preset) {
    const kind = preset.kind;
    if (kind === "rain") {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        len: 10 + Math.random() * 22,
        speed: 4 + Math.random() * 8,
        drift: -0.5 + Math.random() * 0.25,
        a: 0.18 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "bubble") {
      return {
        x: Math.random() * w,
        y: h + Math.random() * h * 0.4,
        r: 2 + Math.random() * 6,
        speed: 0.4 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
        a: 0.22 + Math.random() * 0.4,
        color: Math.random() > 0.35 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "snow" || kind === "sand" || kind === "dust") {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: kind === "sand" ? 1 + Math.random() * 2 : 1.2 + Math.random() * 2.8,
        speed: 0.25 + Math.random() * 1.35,
        drift: (Math.random() - 0.5) * (kind === "sand" ? 1.6 : 0.9),
        a: 0.22 + Math.random() * 0.5,
        color: Math.random() > 0.4 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "ember") {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 40,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.9 + Math.random() * 2.4,
        drift: (Math.random() - 0.5) * 0.9,
        a: 0.4 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "firefly" || kind === "spark" || kind === "star" || kind === "ribbon") {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: kind === "star" ? 0.8 + Math.random() * 2 : 1.5 + Math.random() * 3.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.7,
        a: 0.28 + Math.random() * 0.55,
        color: Math.random() > 0.45 ? preset.mote : preset.mote2,
        kind,
        twinkle: Math.random() * Math.PI * 2,
      };
    }
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 2,
      speed: 0.5,
      a: 0.3,
      color: preset.mote,
      kind: "spark",
      phase: 0,
      twinkle: 0,
    };
  }

  function buildOrnaments(preset) {
    if (!ornaments) return;
    ornaments.innerHTML = "";
    ornaments.dataset.theme = themeId;

    const badge = document.createElement("div");
    badge.className = "theme-badge";
    badge.innerHTML = `<span>${preset.ornaments[0] || "✦"}</span><strong>${preset.label}</strong>`;
    ornaments.appendChild(badge);

    const motto = document.createElement("div");
    motto.className = "theme-motto";
    motto.textContent = preset.motto || "";
    ornaments.appendChild(motto);

    (preset.ornaments || []).forEach((sym, i) => {
      const el = document.createElement("span");
      el.className = `theme-float theme-float-${i + 1}`;
      el.textContent = sym;
      ornaments.appendChild(el);
    });

    (preset.corners || []).forEach((sym, i) => {
      const el = document.createElement("span");
      el.className = `theme-corner theme-corner-${i + 1}`;
      el.textContent = sym;
      ornaments.appendChild(el);
    });

    for (let i = 1; i <= 3; i += 1) {
      const orb = document.createElement("div");
      orb.className = `theme-orb theme-orb-${i}`;
      ornaments.appendChild(orb);
    }

    const railL = document.createElement("div");
    railL.className = "theme-rail theme-rail-left";
    ornaments.appendChild(railL);
    const railR = document.createElement("div");
    railR.className = "theme-rail theme-rail-right";
    ornaments.appendChild(railR);

    const sparkRow = document.createElement("div");
    sparkRow.className = "theme-spark-row";
    for (let i = 0; i < 5; i += 1) {
      const s = document.createElement("span");
      s.textContent = preset.ornaments[i % preset.ornaments.length] || "✦";
      sparkRow.appendChild(s);
    }
    ornaments.appendChild(sparkRow);

    const frame = document.createElement("div");
    frame.className = "theme-frame";
    ornaments.appendChild(frame);
  }

  function rebuild(id) {
    themeId = PRESETS[id] ? id : "sunrise";
    const preset = PRESETS[themeId];
    document.body.dataset.theme = themeId;
    particles = [];
    const count = reduced ? Math.floor(preset.count * 0.35) : preset.count;
    for (let i = 0; i < count; i += 1) particles.push(makeParticle(preset));

    beams = [];
    if (preset.beams && !reduced) {
      for (let i = 0; i < 8; i += 1) {
        beams.push({
          x: w * (0.15 + Math.random() * 0.7),
          w: 36 + Math.random() * 100,
          a: 0.04 + Math.random() * 0.07,
          drift: (Math.random() - 0.5) * 0.18,
        });
      }
    }

    orbs = [];
    if (!reduced) {
      for (let i = 0; i < 4; i += 1) {
        orbs.push({
          x: w * (0.15 + Math.random() * 0.7),
          y: h * (0.2 + Math.random() * 0.5),
          r: 40 + Math.random() * 90,
          phase: Math.random() * Math.PI * 2,
          color: i % 2 ? preset.mote : preset.mote2,
        });
      }
    }

    buildOrnaments(preset);
  }

  function update() {
    tick += 1;

    beams.forEach((b) => {
      b.x += b.drift;
      if (b.x < -80) b.x = w + 40;
      if (b.x > w + 80) b.x = -40;
    });

    orbs.forEach((o) => {
      o.phase += 0.008;
      o.x += Math.cos(o.phase) * 0.15;
      o.y += Math.sin(o.phase * 0.7) * 0.12;
    });

    particles.forEach((p) => {
      if (p.kind === "rain") {
        p.y += p.speed;
        p.x += p.drift;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
      } else if (p.kind === "bubble") {
        p.y -= p.speed;
        p.wobble += 0.04;
        p.x += Math.sin(p.wobble) * 0.65;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
      } else if (p.kind === "ember") {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(tick * 0.03 + p.x) * 0.22;
        if (p.y < -20) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
      } else if (p.kind === "snow" || p.kind === "sand" || p.kind === "dust") {
        p.y += p.speed;
        p.x += p.drift + Math.sin(tick * 0.02 + p.y * 0.01) * 0.35;
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
      } else {
        p.phase += 0.01 + p.speed * 0.02;
        p.twinkle += 0.05;
        p.x += Math.cos(p.phase) * 0.28;
        p.y += Math.sin(p.phase * 0.8) * 0.22;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
    });
  }

  function drawAtmosphere(preset) {
    if (preset.sun) {
      const sx = w * 0.78;
      const sy = h * 0.18;
      const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 160);
      g.addColorStop(0, "rgba(255, 220, 120, 0.28)");
      g.addColorStop(0.45, "rgba(255, 120, 180, 0.1)");
      g.addColorStop(1, "rgba(255, 120, 180, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, 160, 0, Math.PI * 2);
      ctx.fill();
    }

    if (preset.horizon) {
      const y = h * 0.62;
      const g = ctx.createLinearGradient(0, y - 40, 0, y + 80);
      g.addColorStop(0, "rgba(255, 120, 60, 0)");
      g.addColorStop(0.45, "rgba(255, 110, 70, 0.12)");
      g.addColorStop(1, "rgba(40, 10, 30, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 40, w, 140);
    }

    if (preset.mist) {
      for (let i = 0; i < 3; i += 1) {
        const y = h * (0.55 + i * 0.1) + Math.sin(tick * 0.01 + i) * 8;
        const g = ctx.createLinearGradient(0, y, 0, y + 50);
        g.addColorStop(0, "rgba(140, 255, 154, 0)");
        g.addColorStop(0.5, "rgba(180, 255, 200, 0.06)");
        g.addColorStop(1, "rgba(140, 255, 154, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, y, w, 50);
      }
    }

    if (preset.waves) {
      for (let i = 0; i < 3; i += 1) {
        const y = h * (0.72 + i * 0.06);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 12) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + tick * 0.03 + i) * (6 + i * 2));
        }
        ctx.strokeStyle = `rgba(79, 210, 255, ${0.08 + i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (preset.heat) {
      const g = ctx.createRadialGradient(w * 0.5, h, 20, w * 0.5, h, h * 0.55);
      g.addColorStop(0, "rgba(255, 80, 40, 0.16)");
      g.addColorStop(0.5, "rgba(255, 60, 40, 0.05)");
      g.addColorStop(1, "rgba(255, 60, 40, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.35, w, h * 0.65);
    }

    if (preset.frost) {
      ctx.strokeStyle = "rgba(200, 245, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i += 1) {
        const x = (w / 8) * i + ((tick * 0.2) % 40);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 30, h * 0.25);
        ctx.stroke();
      }
    }

    if (preset.dunes) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h * 0.78 + Math.sin(x * 0.008 + tick * 0.005) * 18);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, h * 0.75, 0, h);
      g.addColorStop(0, "rgba(255, 160, 70, 0.08)");
      g.addColorStop(1, "rgba(40, 16, 8, 0.12)");
      ctx.fillStyle = g;
      ctx.fill();
    }

    if (preset.nebula) {
      orbs.forEach((o) => {
        const g = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, o.r);
        g.addColorStop(0, `${o.color}33`);
        g.addColorStop(0.5, `${o.color}14`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (preset.grid) {
      ctx.strokeStyle = "rgba(209, 107, 255, 0.05)";
      ctx.lineWidth = 1;
      const step = 48;
      const offset = (tick * 0.35) % step;
      for (let x = -step + offset; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -step + offset * 0.5; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const preset = PRESETS[themeId] || PRESETS.sunrise;

    const wash = ctx.createRadialGradient(w * 0.5, h * 0.35, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    wash.addColorStop(0, "rgba(255,255,255,0)");
    wash.addColorStop(1, "rgba(8,4,18,0.2)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    drawAtmosphere(preset);

    if (preset.aurora) {
      for (let i = 0; i < 5; i += 1) {
        const y = h * (0.1 + i * 0.07);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 14) {
          const yy = y + Math.sin(x * 0.01 + tick * 0.02 + i) * (20 + i * 7);
          ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = i % 2 ? "rgba(125,255,176,0.14)" : "rgba(110,203,255,0.14)";
        ctx.lineWidth = 12 + i * 4;
        ctx.stroke();
      }
    }

    if (preset.scan) {
      ctx.fillStyle = "rgba(255,255,255,0.018)";
      for (let y = tick % 5; y < h; y += 5) ctx.fillRect(0, y, w, 1);
      const bandY = ((tick * 2) % (h + 80)) - 40;
      const band = ctx.createLinearGradient(0, bandY, 0, bandY + 60);
      band.addColorStop(0, "rgba(125, 240, 255, 0)");
      band.addColorStop(0.5, "rgba(125, 240, 255, 0.06)");
      band.addColorStop(1, "rgba(125, 240, 255, 0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY, w, 60);
    }

    if (!preset.nebula) {
      orbs.forEach((o) => {
        const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 0.7);
        g.addColorStop(0, `${o.color}22`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    beams.forEach((b) => {
      const g = ctx.createLinearGradient(b.x, 0, b.x + b.w, h);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.45, preset.beamColor || "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(b.x, 0);
      ctx.lineTo(b.x + b.w, 0);
      ctx.lineTo(b.x + b.w * 0.55, h);
      ctx.lineTo(b.x - b.w * 0.2, h);
      ctx.closePath();
      ctx.fill();
    });

    particles.forEach((p) => {
      ctx.globalAlpha = p.a * (p.twinkle != null ? 0.55 + Math.sin(p.twinkle) * 0.45 : 1);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.kind === "rain") {
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.drift * 3, p.y + p.len);
        ctx.stroke();
      } else if (p.kind === "bubble") {
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha *= 0.35;
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.25, p.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "star") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(p.x - p.r * 2.2, p.y - 0.5, p.r * 4.4, 1);
        ctx.fillRect(p.x - 0.5, p.y - p.r * 2.2, 1, p.r * 4.4);
      } else if (p.kind === "ember") {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    const haze = ctx.createLinearGradient(0, h * 0.68, 0, h);
    haze.addColorStop(0, "rgba(0,0,0,0)");
    haze.addColorStop(1, "rgba(10,6,20,0.26)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
  }

  function frame() {
    if (!reduced) update();
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("arcane-theme-change", (e) => {
    const id = e.detail?.theme?.id;
    if (id) rebuild(id);
  });

  window.addEventListener("resize", () => {
    resize();
    rebuild(themeId);
  });

  resize();
  rebuild(document.body.dataset.theme || "sunrise");
  requestAnimationFrame(frame);
})();
