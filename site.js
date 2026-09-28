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

  function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'mix1';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
    document.querySelectorAll('.theme-switch button').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.theme === theme));
    });
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
