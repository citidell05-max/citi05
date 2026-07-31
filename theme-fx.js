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
  let themeId = "sunrise";
  let tick = 0;
  let reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const PRESETS = {
    sunrise: {
      label: "Arcane Sunrise",
      mote: "#ffd27a",
      mote2: "#ff4fd8",
      kind: "spark",
      count: 42,
      beams: true,
      beamColor: "rgba(255, 190, 90, 0.08)",
      ornaments: ["☀", "✦", "◇"],
    },
    sunset: {
      label: "Sunset Palm",
      mote: "#ff8c42",
      mote2: "#ff71ce",
      kind: "dust",
      count: 36,
      beams: true,
      beamColor: "rgba(255, 120, 60, 0.07)",
      ornaments: ["🌴", "✦", "☾"],
    },
    cyberpunk: {
      label: "Cyber Purple",
      mote: "#d16bff",
      mote2: "#7af0ff",
      kind: "rain",
      count: 55,
      beams: false,
      scan: true,
      ornaments: ["◈", "⚡", "◆"],
    },
    forest: {
      label: "Forest Mist",
      mote: "#8cff9a",
      mote2: "#ffe66d",
      kind: "firefly",
      count: 38,
      beams: false,
      ornaments: ["🍃", "✦", "✧"],
    },
    ocean: {
      label: "Deep Ocean",
      mote: "#4fd2ff",
      mote2: "#b8ff3c",
      kind: "bubble",
      count: 40,
      beams: true,
      beamColor: "rgba(80, 200, 255, 0.06)",
      ornaments: ["◉", "≋", "✧"],
    },
    aurora: {
      label: "Aurora",
      mote: "#7dffb0",
      mote2: "#6ecbff",
      kind: "ribbon",
      count: 28,
      beams: false,
      aurora: true,
      ornaments: ["❄", "✦", "✧"],
    },
    volcano: {
      label: "Volcano",
      mote: "#ff7a3c",
      mote2: "#ff3d5a",
      kind: "ember",
      count: 48,
      beams: false,
      ornaments: ["▲", "✦", "◆"],
    },
    ice: {
      label: "Ice Cavern",
      mote: "#d8f6ff",
      mote2: "#9fe9ff",
      kind: "snow",
      count: 50,
      beams: true,
      beamColor: "rgba(180, 240, 255, 0.05)",
      ornaments: ["❄", "✧", "◇"],
    },
    desert: {
      label: "Desert Dusk",
      mote: "#ffb347",
      mote2: "#ff6f91",
      kind: "sand",
      count: 45,
      beams: false,
      ornaments: ["◆", "✧", "☾"],
    },
    space: {
      label: "Cosmic Nebula",
      mote: "#b388ff",
      mote2: "#66e0ff",
      kind: "star",
      count: 70,
      beams: false,
      ornaments: ["✦", "✧", "✶"],
    },
    neonrain: {
      label: "Neon Rain",
      mote: "#ff4fd8",
      mote2: "#4de1ff",
      kind: "rain",
      count: 65,
      beams: false,
      scan: true,
      ornaments: ["┊", "◆", "⚡"],
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
        len: 10 + Math.random() * 18,
        speed: 4 + Math.random() * 7,
        drift: -0.4 + Math.random() * 0.2,
        a: 0.15 + Math.random() * 0.35,
        color: Math.random() > 0.5 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "bubble") {
      return {
        x: Math.random() * w,
        y: h + Math.random() * h * 0.4,
        r: 2 + Math.random() * 5,
        speed: 0.4 + Math.random() * 1.1,
        wobble: Math.random() * Math.PI * 2,
        a: 0.2 + Math.random() * 0.35,
        color: preset.mote,
        kind,
      };
    }
    if (kind === "snow" || kind === "sand" || kind === "dust") {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: kind === "sand" ? 1 + Math.random() * 1.8 : 1.2 + Math.random() * 2.4,
        speed: 0.3 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * (kind === "sand" ? 1.4 : 0.8),
        a: 0.2 + Math.random() * 0.45,
        color: Math.random() > 0.4 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "ember") {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 40,
        r: 1.5 + Math.random() * 3,
        speed: 0.8 + Math.random() * 2.2,
        drift: (Math.random() - 0.5) * 0.8,
        a: 0.35 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? preset.mote : preset.mote2,
        kind,
      };
    }
    if (kind === "firefly" || kind === "spark" || kind === "star" || kind === "ribbon") {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: kind === "star" ? 0.8 + Math.random() * 1.8 : 1.5 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.6,
        a: 0.25 + Math.random() * 0.55,
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

  function rebuild(id) {
    themeId = PRESETS[id] ? id : "sunrise";
    const preset = PRESETS[themeId];
    document.body.dataset.theme = themeId;
    particles = [];
    const count = reduced ? Math.floor(preset.count * 0.35) : preset.count;
    for (let i = 0; i < count; i += 1) particles.push(makeParticle(preset));

    beams = [];
    if (preset.beams && !reduced) {
      for (let i = 0; i < 7; i += 1) {
        beams.push({
          x: w * (0.2 + Math.random() * 0.6),
          w: 40 + Math.random() * 90,
          a: 0.04 + Math.random() * 0.06,
          drift: (Math.random() - 0.5) * 0.15,
        });
      }
    }

    if (ornaments) {
      ornaments.innerHTML = "";
      ornaments.dataset.theme = themeId;
      const badge = document.createElement("div");
      badge.className = "theme-badge";
      badge.innerHTML = `<span>${preset.ornaments[0] || "✦"}</span><strong>${preset.label}</strong>`;
      ornaments.appendChild(badge);

      (preset.ornaments || []).forEach((sym, i) => {
        const el = document.createElement("span");
        el.className = `theme-float theme-float-${i + 1}`;
        el.textContent = sym;
        ornaments.appendChild(el);
      });

      const frame = document.createElement("div");
      frame.className = "theme-frame";
      ornaments.appendChild(frame);
    }
  }

  function update() {
    tick += 1;
    const preset = PRESETS[themeId] || PRESETS.sunrise;

    beams.forEach((b) => {
      b.x += b.drift;
      if (b.x < -80) b.x = w + 40;
      if (b.x > w + 80) b.x = -40;
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
        p.x += Math.sin(p.wobble) * 0.6;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
      } else if (p.kind === "ember") {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(tick * 0.03 + p.x) * 0.2;
        if (p.y < -20) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
      } else if (p.kind === "snow" || p.kind === "sand" || p.kind === "dust") {
        p.y += p.speed;
        p.x += p.drift + Math.sin(tick * 0.02 + p.y * 0.01) * 0.3;
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
      } else {
        p.phase += 0.01 + p.speed * 0.02;
        p.twinkle += 0.05;
        p.x += Math.cos(p.phase) * 0.25;
        p.y += Math.sin(p.phase * 0.8) * 0.2;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
    });

    // keep reference quiet
    void preset;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const preset = PRESETS[themeId] || PRESETS.sunrise;

    // soft vignette / atmosphere wash
    const wash = ctx.createRadialGradient(w * 0.5, h * 0.35, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    wash.addColorStop(0, "rgba(255,255,255,0)");
    wash.addColorStop(1, "rgba(8,4,18,0.18)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    if (preset.aurora) {
      for (let i = 0; i < 4; i += 1) {
        const y = h * (0.12 + i * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) {
          const yy = y + Math.sin(x * 0.01 + tick * 0.02 + i) * (18 + i * 6);
          ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = i % 2 ? "rgba(125,255,176,0.12)" : "rgba(110,203,255,0.12)";
        ctx.lineWidth = 10 + i * 4;
        ctx.stroke();
      }
    }

    if (preset.scan) {
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      for (let y = (tick % 6); y < h; y += 6) ctx.fillRect(0, y, w, 1);
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
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // bottom ground haze accent
    const haze = ctx.createLinearGradient(0, h * 0.7, 0, h);
    haze.addColorStop(0, "rgba(0,0,0,0)");
    haze.addColorStop(1, "rgba(10,6,20,0.22)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
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
