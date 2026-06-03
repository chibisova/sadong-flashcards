// ═══════════════════════════════════════════════════════════════
// CUSTOM SETS (localStorage)
// ═══════════════════════════════════════════════════════════════
let customSets = [];
let customFolders = [];
let editingSetId = null;
let selectedEmoji = '📝';
let selectedFolderId = 'starter';

const EMOJI_OPTIONS = ['📝','📚','💬','🗣️','🌸','🇰🇷','✏️','🔤','🌊','🍜','🎯','⭐','🎌','🏆','🔥','🌙'];

function loadCustomSets() {
  try {
    const raw = localStorage.getItem('kf_custom_sets');
    customSets = raw ? JSON.parse(raw) : [];
  } catch { customSets = []; }
}

function saveCustomSets() {
  localStorage.setItem('kf_custom_sets', JSON.stringify(customSets));
}

// ═══════════════════════════════════════════════════════════════
// FOLDERS (localStorage)
// ═══════════════════════════════════════════════════════════════
function loadFolders() {
  try {
    const raw = localStorage.getItem('kf_folders');
    customFolders = raw ? JSON.parse(raw) : [];
  } catch { customFolders = []; }
}

function saveFolders() {
  localStorage.setItem('kf_folders', JSON.stringify(customFolders));
}

function getAllFolders() {
  return [{ id: 'starter', name: 'Starter' }, ...customFolders];
}

function createFolder(name) {
  const folder = { id: 'folder_' + Date.now(), name, isPublic: false };
  customFolders.push(folder);
  saveFolders();
  if (typeof cloudUpsertFolder === 'function') cloudUpsertFolder(folder);
  return folder;
}

function renameFolder(id, name) {
  const f = customFolders.find(f => f.id === id);
  if (f) { f.name = name; saveFolders(); if (typeof cloudUpsertFolder === 'function') cloudUpsertFolder(f); }
}

async function setFolderPublic(id, isPublic) {
  const f = customFolders.find(f => f.id === id);
  if (!f) return;
  f.isPublic = isPublic;
  saveFolders();
  if (typeof cloudUpsertFolder === 'function') await cloudUpsertFolder(f);
  return f;
}

function deleteFolder(id, deleteSets = false) {
  if (id === 'starter') return;
  if (deleteSets) {
    const deletingIds = customSets.filter(s => s.folderId === id).map(s => s.id);
    deletingIds.forEach(sid => {
      localStorage.removeItem(sid + '_swipe');
      localStorage.removeItem(sid + '_type');
      localStorage.removeItem(sid + '_learned');
    });
    customSets = customSets.filter(s => s.folderId !== id);
  } else {
    customSets.forEach(s => { if (s.folderId === id) s.folderId = 'starter'; });
  }
  saveCustomSets();
  customFolders = customFolders.filter(f => f.id !== id);
  saveFolders();
  if (typeof cloudDeleteFolder === 'function') cloudDeleteFolder(id);
}

// ═══════════════════════════════════════════════════════════════
// FOLDER PICKER (create/edit page)
// ═══════════════════════════════════════════════════════════════
function buildFolderPicker(currentId) {
  selectedFolderId = currentId || 'starter';
  const row = document.getElementById('folderPickerRow');
  row.innerHTML = '';

  getAllFolders().forEach(f => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'folder-pill' + (f.id === selectedFolderId ? ' selected' : '');
    pill.textContent = f.name;
    pill.onclick = () => {
      document.querySelectorAll('.folder-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedFolderId = f.id;
      document.getElementById('newFolderRow').style.display = 'none';
    };
    row.appendChild(pill);
  });

  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'folder-pill folder-pill-new';
  newBtn.textContent = '＋ New';
  newBtn.onclick = () => {
    document.getElementById('newFolderRow').style.display = '';
    const inp = document.getElementById('newFolderInput');
    inp.value = '';
    inp.focus();
  };
  row.appendChild(newBtn);

  document.getElementById('newFolderRow').style.display = 'none';
}

function confirmNewFolder() {
  const row = document.getElementById('newFolderRow');
  if (row.style.display === 'none') return;
  row.style.display = 'none';
  const name = document.getElementById('newFolderInput').value.trim();
  if (!name) return;
  const folder = createFolder(name);
  selectedFolderId = folder.id;
  buildFolderPicker(folder.id);
}

function rawToEngineWord(r) {
  return {
    base:     r.word,
    sadong:   r.word,
    suffix:   '',
    baseEn:   r.definition          || '',
    phraseEn: r.sentenceTranslation  || '',
    phraseKo: r.sampleSentence       || '',
  };
}

function getAllSets() {
  const custom = customSets.map(cs => ({
    ...cs,
    isBuiltIn:   false,
    promptLabel: 'Type the word',
    frontLabel:  "What's the Korean?",
    pageLabel:   cs.title,
    words:       (cs.rawWords || []).map(rawToEngineWord),
  }));
  return [...BUILT_IN_SETS, ...custom];
}

// ═══════════════════════════════════════════════════════════════
// CREATE / EDIT SET PAGE
// ═══════════════════════════════════════════════════════════════
function buildEmojiPicker(current) {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = '';
  EMOJI_OPTIONS.forEach(e => {
    const span = document.createElement('span');
    span.className = 'emoji-opt' + (e === current ? ' selected' : '');
    span.textContent = e;
    span.onclick = () => {
      document.querySelectorAll('.emoji-opt').forEach(x => x.classList.remove('selected'));
      span.classList.add('selected');
      selectedEmoji = e;
    };
    picker.appendChild(span);
  });
  selectedEmoji = current;
}

function addWordRow(word, definition, sampleSentence, sentenceTranslation) {
  const list = document.getElementById('wordList');
  const idx  = list.children.length;

  const card = document.createElement('div');
  card.className = 'word-card';
  card.innerHTML = `
    <div class="word-card-header">
      <span class="word-num">Word ${idx + 1}</span>
      <button class="word-del-btn" onclick="deleteWordRow(this)" title="Remove">×</button>
    </div>
    <input class="set-input set-input-ko" type="text"
           placeholder="Korean word (e.g. 사과)" data-field="word"
           value="${escHtml(word || '')}"
           autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    <input class="set-input" type="text"
           placeholder="Definition (e.g. apple)" data-field="definition"
           value="${escHtml(definition || '')}">
    <input class="set-input set-input-ko" type="text"
           placeholder="Sample sentence in Korean (optional)" data-field="sentence"
           value="${escHtml(sampleSentence || '')}"
           autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    <input class="set-input" type="text"
           placeholder="Sentence translation in English (optional)" data-field="sentence-translation"
           value="${escHtml(sentenceTranslation || '')}">`;
  list.appendChild(card);
  attachNIKLLookup(card);
  if (!word) gsap.from(card, { y: -10, opacity: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' });
  updateWordCount();

  if (!word) {
    card.querySelector('[data-field="word"]').focus();
  }
}

function deleteWordRow(btn) {
  btn.closest('.word-card').remove();
  document.querySelectorAll('#wordList .word-card').forEach((card, i) => {
    card.querySelector('.word-num').textContent = `Word ${i + 1}`;
  });
  updateWordCount();
}

function updateWordCount() {
  const n = document.getElementById('wordList').children.length;
  document.getElementById('wordCountLabel').textContent = n === 1 ? '1 word' : `${n} words`;
}

function exportSet(id) {
  const set = getAllSets().find(s => s.id === id);
  if (!set) return;

  const data = set.words.map(w => {
    const obj = { korean: w.sadong || w.base, english: w.baseEn };
    if (w.phraseKo) obj.sample_korean  = w.phraseKo;
    if (w.phraseEn) obj.sample_english = w.phraseEn;
    return obj;
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = set.title.replace(/\s+/g, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerJsonUpload() {
  document.getElementById('jsonFileInput').click();
}

function importJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('expected an array at root');

      const words = data.map(item => ({
        word:                item.korean   || item.word   || item.ko || '',
        definition:          item.english  || item.definition || item.en || '',
        sampleSentence:      item.sample_korean || item.sampleSentence || item.sentence_ko || '',
        sentenceTranslation: item.sample_english || item.sentenceTranslation || item.sentence_en || '',
      })).filter(w => w.word || w.definition);

      if (!words.length) throw new Error('no valid words found in file');

      const titleInput = document.getElementById('setTitleInput');
      if (!titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.json$/i, '').replace(/[_-]/g, ' ');
      }

      document.getElementById('wordList').innerHTML = '';
      words.forEach(w => addWordRow(w.word, w.definition, w.sampleSentence, w.sentenceTranslation));
      document.getElementById('createError').textContent = '';
    } catch (err) {
      document.getElementById('createError').textContent = '⚠ JSON error: ' + err.message;
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function openCreateSet(folderId) {
  if (!folderId || typeof folderId !== 'string') folderId = 'starter';
  loadNIKLData();
  loadFolders();
  editingSetId = null;
  document.getElementById('createPageTitle').textContent = 'New set';
  document.getElementById('setTitleInput').value    = '';
  document.getElementById('setSubtitleInput').value = '';
  document.getElementById('wordList').innerHTML     = '';
  document.getElementById('createError').textContent = '';
  document.getElementById('createDeleteBtn').style.display = 'none';
  buildEmojiPicker('📝');
  buildFolderPicker(folderId);
  addWordRow();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('pageCreate').classList.add('active');
}

function openEditSet(id) {
  loadNIKLData();
  loadFolders();
  const cs = customSets.find(s => s.id === id);
  if (!cs) return;

  editingSetId = id;
  document.getElementById('createPageTitle').textContent = 'Edit set';
  document.getElementById('setTitleInput').value    = cs.title    || '';
  document.getElementById('setSubtitleInput').value = cs.subtitle || '';
  document.getElementById('wordList').innerHTML     = '';
  document.getElementById('createError').textContent = '';
  document.getElementById('createDeleteBtn').style.display = '';
  buildEmojiPicker(cs.emoji || '📝');
  buildFolderPicker(cs.folderId || 'starter');

  (cs.rawWords || []).forEach(w => addWordRow(w.word, w.definition, w.sampleSentence, w.sentenceTranslation));
  if (!cs.rawWords || cs.rawWords.length === 0) addWordRow();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('pageCreate').classList.add('active');
}

function cancelCreate() {
  showMenu();
}

function saveSet() {
  const title    = document.getElementById('setTitleInput').value.trim();
  const subtitle = document.getElementById('setSubtitleInput').value.trim();
  const errorEl  = document.getElementById('createError');

  if (!title) {
    errorEl.textContent = '⚠ Title is required.';
    document.getElementById('setTitleInput').focus();
    return;
  }

  const rawWords = [];
  document.querySelectorAll('#wordList .word-card').forEach(card => {
    const word    = card.querySelector('[data-field="word"]').value.trim();
    const def     = card.querySelector('[data-field="definition"]').value.trim();
    const sent    = card.querySelector('[data-field="sentence"]').value.trim();
    const sentTr  = card.querySelector('[data-field="sentence-translation"]').value.trim();
    if (word || def) rawWords.push({ word, definition: def, sampleSentence: sent, sentenceTranslation: sentTr });
  });

  if (rawWords.length === 0) {
    errorEl.textContent = '⚠ Add at least one word.';
    return;
  }
  const missing = rawWords.find(w => !w.word);
  if (missing) {
    errorEl.textContent = '⚠ Every word needs a Korean entry.';
    return;
  }

  errorEl.textContent = '';

  let savedSet;
  if (editingSetId) {
    const idx = customSets.findIndex(s => s.id === editingSetId);
    if (idx !== -1) {
      customSets[idx] = { ...customSets[idx], title, subtitle, emoji: selectedEmoji, rawWords, folderId: selectedFolderId };
      savedSet = customSets[idx];
    }
  } else {
    savedSet = { id: 'cset_' + Date.now(), title, subtitle, emoji: selectedEmoji, rawWords, folderId: selectedFolderId };
    customSets.push(savedSet);
  }

  saveCustomSets();
  if (savedSet && typeof cloudUpsertSet === 'function') cloudUpsertSet(savedSet);
  showMenu();
}

function deleteCurrentSet() {
  if (!editingSetId) return;
  const title = document.getElementById('setTitleInput').value.trim();
  document.getElementById('setDeleteTitle').textContent = `Delete "${title}"?`;
  document.getElementById('setDeleteOverlay').classList.remove('hidden');
}

function closeSetDeleteModal() {
  document.getElementById('setDeleteOverlay').classList.add('hidden');
}

function executeSetDelete() {
  if (!editingSetId) return;
  const deletingId = editingSetId;
  localStorage.removeItem(deletingId + '_swipe');
  localStorage.removeItem(deletingId + '_type');
  localStorage.removeItem(deletingId + '_learned');

  customSets = customSets.filter(s => s.id !== deletingId);
  saveCustomSets();
  if (typeof cloudDeleteSet === 'function') cloudDeleteSet(deletingId);
  editingSetId = null;
  closeSetDeleteModal();
  showMenu();
}

// ═══════════════════════════════════════════════════════════════
// NIKL DICTIONARY LOOKUP  (data from nikl_lookup.js)
// Entry format: [pos, lvl, enDef, koDef, [use1, use2]]
// ═══════════════════════════════════════════════════════════════
let _niklLoading = false;

function loadNIKLData() {
  if (window.NIKL_DATA || _niklLoading) return;
  _niklLoading = true;
  const s = document.createElement('script');
  s.src = 'nikl_lookup.js';
  document.head.appendChild(s);
}

function lookupNIKL(word) {
  if (!window.NIKL_DATA) return null;
  return window.NIKL_DATA[word] || [];
}

function attachNIKLLookup(card) {
  const koInput  = card.querySelector('[data-field="word"]');
  const defInput = card.querySelector('[data-field="definition"]');
  const senInput = card.querySelector('[data-field="sentence"]');

  const panel = document.createElement('div');
  panel.className = 'nikl-panel';
  panel.style.display = 'none';
  koInput.insertAdjacentElement('afterend', panel);

  function renderEntries(word) {
    const entries = lookupNIKL(word);

    if (entries === null) {
      panel.style.display = '';
      panel.innerHTML = '<div class="nikl-loading">loading dictionary…</div>';
      const wait = setInterval(() => {
        if (window.NIKL_DATA) { clearInterval(wait); renderEntries(word); }
      }, 300);
      return;
    }

    if (!entries.length) {
      panel.style.display = '';
      panel.innerHTML = '<div class="nikl-no-result">No match in NIKL dictionary.</div>';
      return;
    }

    panel.style.display = '';
    panel.innerHTML = '';

    const badge = document.createElement('div');
    badge.innerHTML = '<span class="nikl-badge">📖 NIKL suggestions — click to fill</span>';
    panel.appendChild(badge);

    entries.forEach(([pos, lvl, en, ko, uses]) => {
      if (!en) return;
      const use = (uses && uses[0]) || '';

      const entryEl = document.createElement('div');
      entryEl.className = 'nikl-entry';

      const hdr = document.createElement('div');
      hdr.className = 'nikl-entry-hdr';
      hdr.innerHTML = (pos ? `<span class="nikl-pos">${pos}</span>` : '') +
                      (lvl ? `<span class="nikl-level">${lvl}</span>` : '');
      entryEl.appendChild(hdr);

      const btn = document.createElement('button');
      btn.className = 'nikl-def-btn';
      btn.innerHTML =
        `<div class="nikl-def-en">${en}</div>` +
        (ko  ? `<div class="nikl-def-ko">${ko}</div>` : '') +
        (use ? `<div class="nikl-use">${use}</div>` : '');

      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        defInput.value = en;
        if (use) senInput.value = use;
        panel.style.display = 'none';
        defInput.focus();
      });
      entryEl.appendChild(btn);
      panel.appendChild(entryEl);
    });
  }

  const doLookup = debounce((word) => {
    if (!word || !/[가-힣]/.test(word)) { panel.style.display = 'none'; return; }
    renderEntries(word);
  }, 400);

  koInput.addEventListener('input',  e => doLookup(e.target.value.trim()));
  koInput.addEventListener('blur',   () => setTimeout(() => { panel.style.display = 'none'; }, 200));
  koInput.addEventListener('focus',  e => { if (e.target.value.trim()) doLookup(e.target.value.trim()); });
}
