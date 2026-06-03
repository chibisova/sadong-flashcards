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
function createSetCard(set) {
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
  return card;
}

function createFolderCard(folder, name, count) {
  const isBuiltin = folder === null;
  const folderId  = folder ? folder.id : 'builtin';
  const emoji     = isBuiltin ? '📦' : (folder.id === 'starter' ? '🗂️' : '📁');
  const canManage = !isBuiltin && folder.id !== 'starter';

  const card = document.createElement('div');
  card.className = 'folder-card';
  card.onclick = () => openFolderContents(folderId);
  card.innerHTML = `
    <div class="folder-card-emoji">${emoji}</div>
    <div class="folder-card-info">
      <div class="folder-card-name">${escHtml(name)}</div>
      <div class="folder-card-count">${count} set${count !== 1 ? 's' : ''}</div>
    </div>
    ${canManage ? `<div class="folder-card-actions">
      <button class="folder-action-btn" onclick="event.stopPropagation();startRenameFolder('${folder.id}')">✏️</button>
      <button class="folder-action-btn folder-del-btn" onclick="event.stopPropagation();confirmDeleteFolder('${folder.id}')">🗑</button>
    </div>` : ''}
    <div class="set-arrow">›</div>`;
  return card;
}

function renderSetGrid() { renderFolderList(); }

function renderFolderList() {
  loadFolders();
  const grid = document.getElementById('setGrid');
  grid.innerHTML = '';

  document.getElementById('folderBackBtn').style.display = 'none';
  document.getElementById('menuLabel').textContent = '한국어 · Flashcards';
  document.getElementById('menuH1').innerHTML = 'Choose a <em>folder</em>';

  const allSets = getAllSets();

  const builtIns = allSets.filter(s => s.isBuiltIn);
  if (builtIns.length) grid.appendChild(createFolderCard(null, 'Built-in', builtIns.length));

  getAllFolders().forEach(folder => {
    const count = allSets.filter(s => {
      if (s.isBuiltIn) return false;
      if (folder.id === 'starter') return !s.folderId || s.folderId === 'starter';
      return s.folderId === folder.id;
    }).length;
    grid.appendChild(createFolderCard(folder, folder.name, count));
  });

  const addCard = document.createElement('button');
  addCard.className = 'add-set-card';
  addCard.onclick = () => openCreateSet();
  addCard.innerHTML = `<span class="add-set-plus">＋</span><span class="add-set-label">New set</span>`;
  grid.appendChild(addCard);

  gsap.from(grid.children, {
    y: 18, opacity: 0, duration: 0.38, stagger: 0.07,
    ease: 'power2.out', clearProps: 'all'
  });
}

function openFolderContents(folderId) {
  loadFolders();
  const grid = document.getElementById('setGrid');
  grid.innerHTML = '';

  const isBuiltin  = folderId === 'builtin';
  const folder     = isBuiltin ? null : getAllFolders().find(f => f.id === folderId);
  const folderName = isBuiltin ? 'Built-in' : (folder ? folder.name : 'Starter');

  document.getElementById('folderBackBtn').style.display = '';
  document.getElementById('menuLabel').textContent = 'Folder';
  document.getElementById('menuH1').innerHTML = escHtml(folderName);

  const allSets = getAllSets();
  const sets = allSets.filter(s => {
    if (isBuiltin) return s.isBuiltIn;
    if (s.isBuiltIn) return false;
    if (folderId === 'starter') return !s.folderId || s.folderId === 'starter';
    return s.folderId === folderId;
  });

  sets.forEach(set => grid.appendChild(createSetCard(set)));

  if (!isBuiltin) {
    const addCard = document.createElement('button');
    addCard.className = 'add-set-card';
    addCard.onclick = () => openCreateSet(folderId);
    addCard.innerHTML = `<span class="add-set-plus">＋</span><span class="add-set-label">New set</span>`;
    grid.appendChild(addCard);

    const transferCard = document.createElement('button');
    transferCard.className = 'add-set-card';
    transferCard.onclick = () => openTransferModal(folderId);
    transferCard.innerHTML = `<span class="add-set-plus">↗</span><span class="add-set-label">Transfer set here</span>`;
    grid.appendChild(transferCard);
  }

  gsap.from(grid.children, {
    y: 18, opacity: 0, duration: 0.38, stagger: 0.07,
    ease: 'power2.out', clearProps: 'all'
  });
}

function showFolderList() { renderFolderList(); }

function startRenameFolder(id) {
  const folder = getAllFolders().find(f => f.id === id);
  if (!folder) return;
  const newName = prompt('Rename folder:', folder.name);
  if (newName && newName.trim()) {
    renameFolder(id, newName.trim());
    renderFolderList();
  }
}

let _pendingDeleteFolderId = null;

function confirmDeleteFolder(id) {
  const folder = getAllFolders().find(f => f.id === id);
  if (!folder) return;
  _pendingDeleteFolderId = id;

  document.getElementById('folderDeleteTitle').textContent = `Delete "${folder.name}"?`;
  document.getElementById('folderDeleteSetsCheck').checked = false;

  const count = customSets.filter(s => s.folderId === id).length;
  const checkRow = document.getElementById('folderDeleteCheckRow');
  if (count > 0) {
    document.getElementById('folderDeleteCheckText').textContent =
      `Also delete the ${count} set${count > 1 ? 's' : ''} inside`;
    checkRow.style.display = '';
  } else {
    checkRow.style.display = 'none';
  }

  document.getElementById('folderDeleteOverlay').classList.remove('hidden');
}

function closeFolderDeleteModal() {
  document.getElementById('folderDeleteOverlay').classList.add('hidden');
  _pendingDeleteFolderId = null;
}

function executeFolderDelete() {
  if (!_pendingDeleteFolderId) return;
  const deleteSets = document.getElementById('folderDeleteSetsCheck').checked;
  deleteFolder(_pendingDeleteFolderId, deleteSets);
  closeFolderDeleteModal();
  renderFolderList();
}

// ═══════════════════════════════════════════════════════════════
// TRANSFER SETS
// ═══════════════════════════════════════════════════════════════
let _transferTargetFolderId = null;
let _transferSelectedIds    = new Set();

function openTransferModal(folderId) {
  _transferTargetFolderId = folderId;
  _transferSelectedIds    = new Set();

  const allSets   = getAllSets();
  const otherSets = allSets.filter(s => {
    if (s.isBuiltIn) return false;
    const cs = customSets.find(c => c.id === s.id);
    const csFolder = cs ? (cs.folderId || 'starter') : 'starter';
    if (folderId === 'starter') return csFolder !== 'starter';
    return csFolder !== folderId;
  });

  const list     = document.getElementById('transferSetList');
  const emptyMsg = document.getElementById('transferEmptyMsg');
  const btn      = document.getElementById('transferConfirmBtn');
  list.innerHTML = '';

  if (!otherSets.length) {
    emptyMsg.style.display = '';
    btn.style.display = 'none';
  } else {
    emptyMsg.style.display = 'none';
    btn.style.display = '';
    btn.disabled = true;
    btn.textContent = 'Select sets to move';

    otherSets.forEach(set => {
      const cs           = customSets.find(c => c.id === set.id);
      const csFolder     = cs ? (cs.folderId || 'starter') : 'starter';
      const srcFolder    = getAllFolders().find(f => f.id === csFolder);
      const srcName      = srcFolder ? srcFolder.name : 'Starter';

      const item = document.createElement('div');
      item.className = 'transfer-set-item';
      item.innerHTML = `
        <span class="transfer-set-emoji">${set.emoji}</span>
        <div class="transfer-set-body">
          <div class="transfer-set-name">${escHtml(set.title)}</div>
          <div class="transfer-set-src">in ${escHtml(srcName)}</div>
        </div>
        <span class="transfer-check">○</span>`;
      item.onclick = () => {
        if (_transferSelectedIds.has(set.id)) {
          _transferSelectedIds.delete(set.id);
          item.classList.remove('selected');
          item.querySelector('.transfer-check').textContent = '○';
        } else {
          _transferSelectedIds.add(set.id);
          item.classList.add('selected');
          item.querySelector('.transfer-check').textContent = '✓';
        }
        const n = _transferSelectedIds.size;
        btn.disabled = n === 0;
        btn.textContent = n === 0
          ? 'Select sets to move'
          : `Move ${n} set${n > 1 ? 's' : ''} here →`;
      };
      list.appendChild(item);
    });
  }

  document.getElementById('transferSetOverlay').classList.remove('hidden');
}

function closeTransferModal() {
  document.getElementById('transferSetOverlay').classList.add('hidden');
  _transferTargetFolderId = null;
  _transferSelectedIds    = new Set();
}

function executeTransfer() {
  if (!_transferTargetFolderId || !_transferSelectedIds.size) return;
  customSets.forEach(s => {
    if (_transferSelectedIds.has(s.id)) s.folderId = _transferTargetFolderId;
  });
  saveCustomSets();
  const dest = _transferTargetFolderId;
  closeTransferModal();
  openFolderContents(dest);
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
loadFolders();

if (localStorage.getItem('kf_theme') === 'light' ||
    localStorage.getItem('sadong_theme') === 'light') {
  document.body.classList.add('light');
  ['themeBtn','menuThemeBtn'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '🌙';
  });
}

showMenu();
