(() => {
  // Theme set: use emoji by default (safe, no external assets needed).
  // You can replace with image URLs later for custom icons.
  const TOKENS = [
    "⛏️", "🧱", "💎", "🟩",      // Minecraft vibes
    "🟥", "🟨", "🎮", "🕹️",      // Roblox / gaming vibes
    "🔷", "⬛", "💠", "⚡",       // Geometry Dash vibes
    "👾", "🚀", "🌌", "✨",      // Space/cyber vibes
    "🧩", "🔥", "🎵", "🛸"       // extra "much more stuff"
  ];

  const SETTINGS = {
    maxItemsDesktop: 80,
    maxItemsMobile: 36,
    spawnEveryMs: 220,
    minSize: 20,
    maxSize: 54,
    minDuration: 14, // seconds
    maxDuration: 30
  };

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const MAX_ITEMS = isMobile ? SETTINGS.maxItemsMobile : SETTINGS.maxItemsDesktop;

  const layer = document.createElement("div");
  layer.className = "floating-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const animNames = ["floatUpA", "floatUpB", "driftSide"];
  let active = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spawnItem() {
    if (active >= MAX_ITEMS) return;

    const el = document.createElement("div");
    el.className = "floating-item emoji";

    const token = pick(TOKENS);
    const size = rand(SETTINGS.minSize, SETTINGS.maxSize);
    const duration = rand(SETTINGS.minDuration, SETTINGS.maxDuration);
    const delay = rand(-6, 0); // stagger existing animation
    const anim = pick(animNames);

    // Position setup differs by animation
    if (anim === "driftSide") {
      el.style.top = `${rand(8, 88)}vh`;
      el.style.left = `-20vw`;
    } else {
      el.style.left = `${rand(2, 96)}vw`;
      el.style.top = `0`;
    }

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.fontSize = `${size * 0.75}px`;
    el.style.animationName = anim;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
    el.style.opacity = `${rand(0.55, 0.95)}`;

    // Slight depth effect
    const blur = rand(0, 0.6).toFixed(2);
    el.style.filter =
      `drop-shadow(0 0 7px rgba(0,247,255,0.35)) ` +
      `drop-shadow(0 0 12px rgba(255,43,214,0.2)) blur(${blur}px)`;

    el.textContent = token;
    layer.appendChild(el);
    active++;

    const cleanup = () => {
      el.removeEventListener("animationend", cleanup);
      if (el.parentNode) el.parentNode.removeChild(el);
      active--;
    };
    el.addEventListener("animationend", cleanup);
  }

  // initial burst
  const initial = Math.floor(MAX_ITEMS * 0.8);
  for (let i = 0; i < initial; i++) {
    setTimeout(spawnItem, i * 70);
  }

  // continuous spawn
  setInterval(spawnItem, SETTINGS.spawnEveryMs);

  // Optional: pause when tab inactive (performance)
  document.addEventListener("visibilitychange", () => {
    layer.style.display = document.hidden ? "none" : "block";
  });
})();
