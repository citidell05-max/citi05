(() => {
  const canvas = document.getElementById("bg-birds");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let birds = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function makeBird(fromLeft) {
    const y = 40 + Math.random() * Math.min(280, height * 0.35);
    const speed = 0.7 + Math.random() * 1.4;
    return {
      x: fromLeft ? -40 : width + 40,
      y,
      baseY: y,
      dir: fromLeft ? 1 : -1,
      speed,
      size: 10 + Math.random() * 10,
      wing: Math.random() * Math.PI * 2,
      wingSpeed: 0.18 + Math.random() * 0.22,
      bob: Math.random() * Math.PI * 2,
    };
  }

  function seedBirds() {
    birds = [];
    const count = Math.max(5, Math.min(10, Math.floor(width / 180)));
    for (let i = 0; i < count; i += 1) {
      const bird = makeBird(Math.random() > 0.5);
      bird.x = Math.random() * width;
      birds.push(bird);
    }
  }

  function drawBird(b) {
    const flap = Math.sin(b.wing);
    const x = b.x;
    const y = b.y + Math.sin(b.bob) * 6;

    ctx.save();
    ctx.translate(x, y);
    if (b.dir < 0) ctx.scale(-1, 1);

    // body
    ctx.fillStyle = "rgba(20, 18, 16, 0.85)";
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size * 0.9, b.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.arc(b.size * 0.75, -b.size * 0.1, b.size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = "rgba(220, 140, 40, 0.95)";
    ctx.beginPath();
    ctx.moveTo(b.size * 1.0, -b.size * 0.08);
    ctx.lineTo(b.size * 1.35, 0);
    ctx.lineTo(b.size * 1.0, b.size * 0.1);
    ctx.closePath();
    ctx.fill();

    // wing
    ctx.fillStyle = "rgba(35, 32, 28, 0.9)";
    ctx.beginPath();
    ctx.moveTo(-b.size * 0.1, 0);
    ctx.quadraticCurveTo(
      b.size * 0.1,
      -b.size * (0.9 + flap * 0.55),
      b.size * 0.7,
      -b.size * 0.15
    );
    ctx.quadraticCurveTo(b.size * 0.2, -b.size * 0.05, -b.size * 0.1, 0);
    ctx.fill();

    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);

    birds.forEach((b) => {
      b.x += b.speed * b.dir;
      b.wing += b.wingSpeed;
      b.bob += 0.03;

      if ((b.dir > 0 && b.x > width + 50) || (b.dir < 0 && b.x < -50)) {
        Object.assign(b, makeBird(b.dir < 0));
      }

      drawBird(b);
    });

    requestAnimationFrame(frame);
  }

  resize();
  seedBirds();
  window.addEventListener("resize", () => {
    resize();
    seedBirds();
  });
  requestAnimationFrame(frame);
})();
