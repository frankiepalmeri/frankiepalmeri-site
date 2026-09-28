(function () {
  const TWITCH_USER = 'frankiepalmeri';
  const THEME_KEY = 'fp-theme-mix';
  const THEMES = ['mix1', 'mix2', 'mix3'];

  function embedParents() {
    const hosts = new Set([
      location.hostname || 'localhost',
      'frankiepalmeri.com',
      'www.frankiepalmeri.com',
      'frankiepalmeri.github.io',
      'localhost',
      '127.0.0.1'
    ]);
    return Array.from(hosts)
      .filter(Boolean)
      .map((h) => 'parent=' + encodeURIComponent(h))
      .join('&');
  }

  function mountTwitch(user) {
    if (!user) return;
    const parents = embedParents();

    const player = document.getElementById('player');
    if (player) {
      player.innerHTML = '';
      const playerFrame = document.createElement('iframe');
      playerFrame.src =
        'https://player.twitch.tv/?channel=' +
        encodeURIComponent(user) +
        '&' +
        parents +
        '&muted=true';
      playerFrame.allowFullscreen = true;
      playerFrame.allow = 'autoplay; fullscreen';
      playerFrame.title = 'Twitch live stream';
      player.appendChild(playerFrame);
    }

    const chat = document.getElementById('chat');
    if (chat) {
      chat.innerHTML = '';
      const chatFrame = document.createElement('iframe');
      chatFrame.src =
        'https://www.twitch.tv/embed/' +
        encodeURIComponent(user) +
        '/chat?' +
        parents +
        '&darkpopout';
      chatFrame.title = 'Twitch chat';
      chat.appendChild(chatFrame);
    }

    const link = document.getElementById('twitch-channel');
    if (link) link.href = 'https://www.twitch.tv/' + encodeURIComponent(user);
  }

  /* ===== Dense Matrix rain (Mix 1) ===== */
  const MATRIX_GLYPHS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
    '0123456789ABCDEF<>[]{}|/\\$#@%&*=+~^:;.';

  let rainRaf = 0;
  let rainCtx = null;
  let rainCols = [];
  let rainW = 0;
  let rainH = 0;
  let rainFont = 14;
  let rainActive = false;

  function resizeRain() {
    const canvas = document.getElementById('matrix-rain');
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rainW = window.innerWidth;
    rainH = window.innerHeight;
    canvas.width = Math.floor(rainW * dpr);
    canvas.height = Math.floor(rainH * dpr);
    canvas.style.width = rainW + 'px';
    canvas.style.height = rainH + 'px';
    rainCtx = canvas.getContext('2d');
    rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rainFont = rainW < 640 ? 11 : rainW < 1100 ? 13 : 15;
    const colCount = Math.ceil(rainW / (rainFont * 0.72));
    const prev = rainCols;
    rainCols = new Array(colCount);
    for (let i = 0; i < colCount; i++) {
      rainCols[i] = prev[i] || {
        y: Math.random() * -rainH,
        speed: 0.55 + Math.random() * 1.35,
        len: 12 + Math.floor(Math.random() * 28),
        seed: Math.floor(Math.random() * 10000)
      };
    }
  }

  function glyph(seed, row) {
    const i = (seed * 131 + row * 17) % MATRIX_GLYPHS.length;
    return MATRIX_GLYPHS.charAt(Math.abs(i));
  }

  function tickRain() {
    if (!rainActive || !rainCtx) return;
    // phosphor trail fade — denser feel
    rainCtx.fillStyle = 'rgba(1, 6, 3, 0.085)';
    rainCtx.fillRect(0, 0, rainW, rainH);
    rainCtx.font = rainFont + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    rainCtx.textBaseline = 'top';

    const step = rainFont * 0.95;
    for (let i = 0; i < rainCols.length; i++) {
      const col = rainCols[i];
      const x = i * rainFont * 0.72;
      const headRow = Math.floor(col.y / step);

      for (let r = 0; r < col.len; r++) {
        const row = headRow - r;
        if (row < -2) continue;
        const y = row * step;
        if (y > rainH) continue;
        const ch = glyph(col.seed + i, row + ((Date.now() / 80) | 0));
        if (r === 0) {
          rainCtx.fillStyle = '#d6ffd0';
          rainCtx.shadowColor = '#39ff14';
          rainCtx.shadowBlur = 10;
        } else if (r < 3) {
          rainCtx.fillStyle = '#39ff14';
          rainCtx.shadowBlur = 4;
        } else if (r < col.len * 0.45) {
          rainCtx.fillStyle = 'rgba(57,255,20,0.85)';
          rainCtx.shadowBlur = 0;
        } else {
          rainCtx.fillStyle = 'rgba(20,140,50,' + (0.55 - r / col.len * 0.4) + ')';
          rainCtx.shadowBlur = 0;
        }
        rainCtx.fillText(ch, x, y);
      }

      col.y += col.speed * step * 0.22;
      if (col.y - col.len * step > rainH) {
        col.y = Math.random() * -rainH * 0.4;
        col.speed = 0.55 + Math.random() * 1.35;
        col.len = 12 + Math.floor(Math.random() * 28);
        col.seed = Math.floor(Math.random() * 10000);
      }
    }
    rainCtx.shadowBlur = 0;
    rainRaf = requestAnimationFrame(tickRain);
  }

  function startRain() {
    const canvas = document.getElementById('matrix-rain');
    if (!canvas) return;
    rainActive = true;
    resizeRain();
    // seed opaque first paint so trails build denser
    if (rainCtx) {
      rainCtx.fillStyle = '#010603';
      rainCtx.fillRect(0, 0, rainW, rainH);
    }
    cancelAnimationFrame(rainRaf);
    rainRaf = requestAnimationFrame(tickRain);
  }

  function stopRain() {
    rainActive = false;
    cancelAnimationFrame(rainRaf);
    rainRaf = 0;
    const canvas = document.getElementById('matrix-rain');
    if (canvas && rainCtx) {
      rainCtx.clearRect(0, 0, rainW, rainH);
    }
  }

  let rainResizeBound = false;
  function ensureRainResize() {
    if (rainResizeBound) return;
    rainResizeBound = true;
    window.addEventListener('resize', () => {
      if (rainActive) resizeRain();
    });
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'mix1';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
    document.querySelectorAll('.theme-switch button').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.theme === theme));
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        theme === 'mix1' ? '#010603' : theme === 'mix2' ? '#050000' : '#06020f'
      );
    }

    if (theme === 'mix1') {
      ensureRainResize();
      startRain();
    } else {
      stopRain();
    }
    if (theme === 'mix3') spawnEsoteric();
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (_) {}
    setTheme(THEMES.includes(saved) ? saved : 'mix1');
    document.querySelectorAll('.theme-switch button').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
  }

  const CRYPTO = [
    'GOD IS THE SIGNAL',
    'CREATION HUMS IN STATIC',
    'HEAVEN IS A FREQUENCY',
    'HELL IS AN ECHO',
    'THE WORD BECAME NOISE',
    'AS ABOVE · SO BELOW',
    'THE VEIL IS THIN TONIGHT',
    'IN THE BEGINNING WAS THE STREAM',
    'BLOOD OF THE LAMB / CODE OF THE MACHINE',
    'ANGELS IN THE BUFFER',
    'DEMONS IN THE LATENCY',
    'FORGIVE US OUR PACKETS',
    'THY WILL BE RENDERED',
    'THE THRONE IS EMPTY / THE CHAT IS FULL',
    'LIGHT WITHOUT FORM',
    'FORM WITHOUT MERCY',
    'WHO WATCHES THE WATCHERS?',
    'AMEN · AGAIN · AMEN'
  ];

  let esotericBuilt = false;
  function spawnEsoteric() {
    const layer = document.getElementById('esoteric');
    if (!layer || esotericBuilt) return;
    esotericBuilt = true;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('span');
      el.className = 'float-text';
      el.textContent = CRYPTO[i % CRYPTO.length];
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const dx = (Math.random() * 40 - 20) + 'vw';
      const dy = (Math.random() * 50 - 25) + 'vh';
      const rot = (Math.random() * 60 - 30) + 'deg';
      const dur = 18 + Math.random() * 28;
      el.style.left = startX + 'vw';
      el.style.top = startY + 'vh';
      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--rot', rot);
      el.style.animationDuration = dur + 's';
      el.style.animationDelay = -Math.random() * dur + 's';
      el.style.fontSize = 0.65 + Math.random() * 0.9 + 'rem';
      layer.appendChild(el);
    }
  }

  const y = document.getElementById('y');
  if (y) y.textContent = String(new Date().getFullYear());

  initTheme();
  mountTwitch(TWITCH_USER);
})();
