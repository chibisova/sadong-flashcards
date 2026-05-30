// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page' + name[0].toUpperCase() + name.slice(1));
  pg.classList.add('active');
  document.getElementById('nav'  + name[0].toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('mainNav').style.display = '';
  gsap.fromTo(pg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' });
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
function toggleTheme() {
  document.body.classList.add('theme-switching');
  const isLight = document.body.classList.toggle('light');
  document.body.offsetHeight;
  document.body.classList.remove('theme-switching');
  const icon = isLight ? '🌙' : '☀️';
  ['themeBtn','menuThemeBtn'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = icon;
  });
  localStorage.setItem('kf_theme', isLight ? 'light' : 'dark');
}

// ═══════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════
function renderSetGrid() {
  const grid = document.getElementById('setGrid');
  grid.innerHTML = '';

  getAllSets().forEach(set => {
    let swipePct = 0, typePct = 0;
    try {
      const sw = JSON.parse(localStorage.getItem(set.id + '_swipe'));
      if (sw && sw.known && set.words.length)
        swipePct = sw.known.length / set.words.length * 100;
    } catch {}
    try {
      const ty = JSON.parse(localStorage.getItem(set.id + '_type'));
      if (ty && ty.known && set.words.length)
        typePct = ty.known.length / set.words.length * 100;
    } catch {}
    const avgPct = Math.round((swipePct + typePct) / 2);

    const editBtn = set.isBuiltIn ? '' :
      `<button class="set-edit-btn" onclick="event.stopPropagation();openEditSet('${set.id}')">✏️ Edit</button>`;
    const exportBtn =
      `<button class="set-edit-btn" onclick="event.stopPropagation();exportSet('${set.id}')">↓ Export</button>`;

    const card = document.createElement('div');
    card.className = 'set-card';
    card.onclick = () => selectSet(set.id);
    card.innerHTML = `
      <div class="set-emoji">${set.emoji}</div>
      <div class="set-info">
        <div class="set-name">${set.title}</div>
        <div class="set-subtitle">${set.subtitle || ''}</div>
      </div>
      <div class="set-meta">
        <div class="set-count">${set.words.length} words</div>
        <div class="set-progress"><div class="set-progress-fill" style="width:${avgPct}%"></div></div>
        ${editBtn}
        ${exportBtn}
      </div>
      <div class="set-arrow">›</div>`;
    grid.appendChild(card);
  });

  const addCard = document.createElement('button');
  addCard.className = 'add-set-card';
  addCard.onclick = openCreateSet;
  addCard.innerHTML = `<span class="add-set-plus">＋</span><span class="add-set-label">New set</span>`;
  grid.appendChild(addCard);

  gsap.from(grid.children, {
    y: 18, opacity: 0, duration: 0.38, stagger: 0.07,
    ease: 'power2.out', clearProps: 'all'
  });
}

function showMenu() {
  document.getElementById('mainNav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('pageMenu');
  pg.classList.add('active');
  renderSetGrid();
  gsap.fromTo(pg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' });
}

function selectSet(id) {
  const set = getAllSets().find(s => s.id === id);
  if (!set) return;

  activeFolderId = id;
  activeFolder   = set;
  WORDS          = set.words;

  document.getElementById('s-total').textContent = WORDS.length;
  document.getElementById('t-total').textContent = WORDS.length;
  document.getElementById('s-done-sub').textContent = `All ${WORDS.length} words swiped. Reset to go again.`;
  document.getElementById('s-pg-label').textContent  = set.pageLabel + ' · Swipe';
  document.getElementById('t-pg-label').textContent  = set.pageLabel + ' · Type';
  document.getElementById('t-prompt-lbl').textContent = set.promptLabel;

  document.getElementById('mainNav').style.display = '';

  S.busy = false; S.isFlipped = false; S.wrap = null; S.current = null;
  document.getElementById('s-done').classList.remove('show');
  document.getElementById('s-stage').style.display = '';
  showPage('swipe');
  if (swipeLoad() && (S.deck.length > 0 || S.review.length > 0 || S.known.size > 0)) {
    S.showCard();
  } else { swipeReset(); }

  T.current = null; T.answered = false; T.fromReview = false;
  document.getElementById('t-done').classList.remove('show');
  document.getElementById('t-content').style.display = '';
  if (typeLoad() && (T.deck.length > 0 || T.review.length > 0 || T.known.size > 0)) {
    T.showCard();
  } else { typeReset(); }
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
loadCustomSets();

if (localStorage.getItem('kf_theme') === 'light' ||
    localStorage.getItem('sadong_theme') === 'light') {
  document.body.classList.add('light');
  ['themeBtn','menuThemeBtn'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '🌙';
  });
}

showMenu();
