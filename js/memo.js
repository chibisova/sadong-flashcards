// ═══════════════════════════════════════════════════════════════
// MEMO MODE — Leitner System (5 boxes)
// ═══════════════════════════════════════════════════════════════
// Box intervals (days until next review after correct answer):
const MEMO_BOX_DAYS = [0, 1, 3, 7, 14, 30]; // index = box number

let memoFolderId     = null;
let memoQueue        = [];   // [{setId, wordIndex, word, wordKey}]
let memoQIdx         = 0;
let memoCards        = {};   // wordKey → {box, next_due, archived}
let memoSettings     = null; // {direction, sessionSize}
let memoResult       = { correct: 0, resetCount: 0, archived: 0 };
let memoAnswered     = false;
let memoReinserted   = new Set();
let memoTodayCount    = 0;
let memoTotalCorrect  = 0;
let memoBoxFiveCount  = 0;
let memoSessionActive = false;

// ── HELPERS ─────────────────────────────────────────────────────

function memoToday() {
  return new Date().toISOString().slice(0, 10);
}

function memoAddDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function memoGetFolderSets(folderId) {
  return getAllSets()
    .filter(s => {
      if (s.isBuiltIn) return folderId === 'builtin';
      if (folderId === 'starter') return !s.folderId || s.folderId === 'starter';
      return s.folderId === folderId;
    })
    .sort((a, b) => {
      const ta = a.id.startsWith('cset_') ? parseInt(a.id.slice(5)) : 0;
      const tb = b.id.startsWith('cset_') ? parseInt(b.id.slice(5)) : 0;
      return ta - tb;
    });
}

function memoGetAllWords(folderId) {
  const result = [];
  memoGetFolderSets(folderId).forEach(set => {
    set.words.forEach((word, idx) => {
      result.push({ setId: set.id, wordIndex: idx, word, wordKey: set.id + '_' + idx });
    });
  });
  return result;
}

function memoLoadSettings(folderId) {
  try {
    const raw = localStorage.getItem('memo_' + folderId + '_settings');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function memoSaveSettings(folderId, settings) {
  localStorage.setItem('memo_' + folderId + '_settings', JSON.stringify(settings));
}

// ── SUPABASE ─────────────────────────────────────────────────────

async function memoFetchCards(folderId) {
  if (!sb || !currentUser) return {};
  const { data, error } = await sb
    .from('memo_cards')
    .select('word_key, box, next_due, archived')
    .eq('user_id', currentUser.id)
    .eq('folder_local_id', folderId);
  if (error) { console.error('[memo] fetch:', error.message); return {}; }
  const map = {};
  (data || []).forEach(r => {
    map[r.word_key] = { box: r.box, next_due: r.next_due, archived: r.archived };
  });
  return map;
}

async function memoUpsertCard(folderId, wordKey, box, nextDue, archived) {
  if (!sb || !currentUser) return;
  const { error } = await sb.from('memo_cards').upsert({
    user_id:         currentUser.id,
    folder_local_id: folderId,
    word_key:        wordKey,
    box,
    next_due:        nextDue,
    archived:        archived || false,
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'user_id,folder_local_id,word_key' });
  if (error) console.error('[memo] upsert:', error.message);
}

async function memoBulkInsert(folderId, rows) {
  if (!sb || !currentUser || !rows.length) return;
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await sb.from('memo_cards').insert(rows.slice(i, i + batchSize));
    if (error) console.error('[memo] bulk insert:', error.message);
  }
}

// ── STATS ─────────────────────────────────────────────────────────

function memoSaveLastSession(correct, missed) {
  localStorage.setItem('memo_last_session', JSON.stringify({ correct, missed }));
}

function memoLoadTodayCount() {
  try {
    const raw = localStorage.getItem('memo_today');
    if (!raw) { memoTodayCount = 0; return; }
    const { date, count } = JSON.parse(raw);
    memoTodayCount = date === memoToday() ? (count || 0) : 0;
  } catch { memoTodayCount = 0; }
}

function memoUpdateTodayCount(n) {
  if (!n) return;
  memoLoadTodayCount();
  memoTodayCount += n;
  localStorage.setItem('memo_today', JSON.stringify({ date: memoToday(), count: memoTodayCount }));
}

async function memoFetchUserStats() {
  if (!sb || !currentUser) return;
  const { data } = await sb
    .from('user_stats')
    .select('total_correct')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  memoTotalCorrect = data?.total_correct || 0;
}

async function memoIncrementTotalCorrect(n) {
  if (!sb || !currentUser || !n) return;
  const { data, error } = await sb.rpc('add_correct', { delta: n });
  if (error) { console.error('[memo] add_correct:', error.message); return; }
  memoTotalCorrect = data || (memoTotalCorrect + n);
}

async function memoFetchBoxFiveCount() {
  if (!sb || !currentUser) return;
  const { count, error } = await sb
    .from('memo_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('box', 5)
    .eq('archived', false);
  if (error) { console.error('[memo] box5 count:', error.message); return; }
  memoBoxFiveCount = count || 0;
}

function memoLoadLastSession() {
  try {
    const raw = localStorage.getItem('memo_last_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function memoGetFolderDisplayName(folderId) {
  if (folderId === 'builtin') return 'Built-in';
  if (folderId === 'starter') return 'Starter';
  const f = getAllFolders().find(f => f.id === folderId);
  return f ? f.name : 'Unknown folder';
}

// ── ENTRY POINT ─────────────────────────────────────────────────

async function openMemoMode(folderId) {
  if (!userIsSignedIn()) return;
  localStorage.setItem('memo_last_folder', folderId);

  memoFolderId = folderId;
  const allWords = memoGetAllWords(folderId);
  if (!allWords.length) {
    showMemoPage('pageMemoResults');
    document.getElementById('memoResultsContent').innerHTML = `
      <div class="memo-done-emoji">📭</div>
      <div class="memo-done-title">No words <em>yet!</em></div>
      <div class="memo-done-sub">Add words to a set in this folder first, then come back.</div>
      <div class="memo-results-actions">
        <button class="memo-action-btn ghost" onclick="memoBackToFolder()">← Go back</button>
      </div>`;
    return;
  }

  memoCards    = await memoFetchCards(folderId);

  memoSettings = memoLoadSettings(folderId);
  const isFirstTime = Object.keys(memoCards).length === 0;

  if (isFirstTime || !memoSettings) {
    openMemoSetupModal(isFirstTime);
  } else {
    await memoStartSession();
  }
}

// ── SETUP MODAL ─────────────────────────────────────────────────

function openMemoSetupModal(isFirstTime) {
  const importRow = document.getElementById('memoSetupImportRow');
  if (importRow) importRow.style.display = isFirstTime ? '' : 'none';
  document.getElementById('memoSetupOverlay').classList.remove('hidden');
  const s = memoSettings || {};
  const dirVal = s.direction || 'en-ko';
  const dirEl = document.querySelector(`input[name="memoDir"][value="${dirVal}"]`);
  if (dirEl) dirEl.checked = true;
  document.getElementById('memoSessionSize').value = s.sessionSize || 20;
  const importEl = document.getElementById('memoImportFrom');
  if (importEl) importEl.value = 'progress';
  const saveBtn = document.getElementById('memoSaveBtn');
  if (saveBtn) saveBtn.textContent = isFirstTime ? 'Start →' : 'Save →';
}

function openMemoMidSettings() {
  openMemoSetupModal(false);
}

function closeMemoSetupModal() {
  document.getElementById('memoSetupOverlay').classList.add('hidden');
}

function memoSetupConfirmOrWarn() {
  if (memoSessionActive) {
    document.getElementById('memoSetupOverlay').classList.add('hidden');
    document.getElementById('memoResetConfirmOverlay').classList.remove('hidden');
  } else {
    memoSetupConfirm();
  }
}

function memoConfirmResetSession() {
  document.getElementById('memoResetConfirmOverlay').classList.add('hidden');
  memoSetupConfirm();
}

function memoHideSettingsWarning() {
  document.getElementById('memoResetConfirmOverlay').classList.add('hidden');
  document.getElementById('memoSetupOverlay').classList.remove('hidden');
}

async function memoSetupConfirm() {
  const dirEl = document.querySelector('input[name="memoDir"]:checked');
  const direction   = dirEl ? dirEl.value : 'en-ko';
  const sessionSize = Math.max(1, Math.min(200,
    parseInt(document.getElementById('memoSessionSize').value) || 20));
  const importEl    = document.getElementById('memoImportFrom');
  const importMode  = importEl ? importEl.value : 'progress';
  const isFirstTime = Object.keys(memoCards).length === 0;

  memoSettings = { direction, sessionSize };
  memoSaveSettings(memoFolderId, memoSettings);
  closeMemoSetupModal();

  if (isFirstTime) {
    await memoInitFirstTime(memoFolderId, importMode);
    memoCards = await memoFetchCards(memoFolderId);
  }

  await memoStartSession();
}

async function memoInitFirstTime(folderId, importMode) {
  const allWords = memoGetAllWords(folderId);
  const today    = memoToday();
  const rows     = [];

  if (importMode === 'progress') {
    const knownKeys = new Set();
    memoGetFolderSets(folderId).forEach(set => {
      try {
        const raw = localStorage.getItem(set.id + '_type');
        if (!raw) return;
        const d = JSON.parse(raw);
        (d.known || []).forEach(idx => knownKeys.add(set.id + '_' + idx));
      } catch {}
    });
    allWords.forEach(({ wordKey }) => {
      const isKnown = knownKeys.has(wordKey);
      rows.push({
        user_id:         currentUser.id,
        folder_local_id: folderId,
        word_key:        wordKey,
        box:             isKnown ? 2 : 1,
        next_due:        isKnown ? memoAddDays(3) : today,
        archived:        false,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      });
    });
  } else {
    allWords.forEach(({ wordKey }) => {
      rows.push({
        user_id:         currentUser.id,
        folder_local_id: folderId,
        word_key:        wordKey,
        box:             1,
        next_due:        today,
        archived:        false,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      });
    });
  }

  await memoBulkInsert(folderId, rows);
}

// ── SESSION BUILD ─────────────────────────────────────────────────

async function memoStartSession() {
  const sessionSize = memoSettings.sessionSize || 20;
  const today       = memoToday();
  const allWords    = memoGetAllWords(memoFolderId);
  const allWordMap  = {};
  allWords.forEach(w => { allWordMap[w.wordKey] = w; });

  // Due cards (not archived, next_due <= today)
  const dueKeys = Object.entries(memoCards)
    .filter(([, c]) => !c.archived && c.next_due <= today)
    .map(([k]) => k);

  const sessionKeys = shuffle(dueKeys).slice(0, sessionSize);

  // Fill remaining with new words (not yet in memo_cards), chronological order
  if (sessionKeys.length < sessionSize) {
    const needed   = sessionSize - sessionKeys.length;
    const newWords = allWords.filter(w => !memoCards[w.wordKey]);
    newWords.slice(0, needed).forEach(w => sessionKeys.push(w.wordKey));
  }

  memoQueue = sessionKeys.map(k => allWordMap[k]).filter(Boolean);

  if (!memoQueue.length) {
    memoShowNoCards();
    return;
  }

  memoQIdx       = 0;
  memoResult     = { correct: 0, resetCount: 0, archived: 0 };
  memoAnswered   = false;
  memoReinserted = new Set();

  memoSessionActive = true;
  showMemoSessionPage();
  memoShowCard();
}

function memoShowNoCards() {
  memoSessionActive = false;
  const today  = memoToday();
  const future = Object.values(memoCards)
    .filter(c => !c.archived && c.next_due > today)
    .map(c => c.next_due)
    .sort();
  const msg = future.length
    ? `Next review: <strong>${future[0]}</strong>`
    : 'All words archived — you learned everything! 🎉';

  showMemoPage('pageMemoResults');
  document.getElementById('memoResultsContent').innerHTML = `
    <div class="memo-done-emoji">✨</div>
    <div class="memo-done-title">Nothing due <em>today!</em></div>
    <div class="memo-done-sub">${msg}</div>
    <button class="memo-action-btn ghost" onclick="memoBackToFolder()">← Back to folder</button>`;
}

// ── PAGE CONTROL ─────────────────────────────────────────────────

function showMemoPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mainNav').style.display = 'none';
  const pg = document.getElementById(pageId);
  pg.classList.add('active');
  gsap.fromTo(pg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' });
}

function showMemoSessionPage() {
  showMemoPage('pageMemo');
  memoUpdateProgress();
}

function memoUpdateProgress() {
  const total = memoQueue.length;
  const done  = Math.min(memoQIdx, total);
  document.getElementById('memoProgressText').textContent = `${done} / ${total}`;
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById('memoProgressBar').style.width = pct + '%';
}

function memoBackToFolder() {
  document.getElementById('mainNav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('pageMenu');
  pg.classList.add('active');
  gsap.fromTo(pg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' });
  if (memoFolderId) openFolderContents(memoFolderId);
  else renderSetGrid();
}

// ── CARD DISPLAY ─────────────────────────────────────────────────

function memoShowCard() {
  if (memoQIdx >= memoQueue.length) { memoShowResults(); return; }

  const item = memoQueue[memoQIdx];
  const w    = item.word;
  const dir  = memoSettings.direction;
  const card = memoCards[item.wordKey];
  const box  = card ? card.box : 1;

  const badge = document.getElementById('memoBoxBadge');
  badge.textContent = 'Box ' + box;
  badge.className   = 'memo-box-badge box-' + box;

  if (dir === 'en-ko') {
    document.getElementById('memoPromptLbl').textContent  = 'Type in Korean';
    document.getElementById('memoPromptWord').textContent = w.baseEn;
    document.getElementById('memoPromptSub').textContent  = w.phraseEn || '';
    document.getElementById('memoInput').placeholder      = 'Type Korean…';
  } else {
    document.getElementById('memoPromptLbl').textContent   = 'Type in English';
    document.getElementById('memoPromptWord').innerHTML    = hl(w.sadong, w.suffix);
    document.getElementById('memoPromptSub').textContent   = w.phraseKo || '';
    document.getElementById('memoInput').placeholder       = 'Type English…';
  }

  const inp = document.getElementById('memoInput');
  inp.value = ''; inp.className = 'type-input'; inp.disabled = false;
  document.getElementById('memoFeedback').innerHTML         = '';
  document.getElementById('memoSubmitBtn').style.display    = '';
  document.getElementById('memoNextBtn').style.display      = 'none';
  memoAnswered = false;
  memoUpdateProgress();
  inp.focus();
}

// ── CHECK ANSWER ─────────────────────────────────────────────────

async function memoCheck() {
  if (memoAnswered) return;
  memoAnswered = true;

  const item = memoQueue[memoQIdx];
  const w    = item.word;
  const dir  = memoSettings.direction;
  const inp  = document.getElementById('memoInput');
  const val  = inp.value.trim();
  const card = memoCards[item.wordKey] || { box: 1 };

  const correct = dir === 'en-ko'
    ? val === w.sadong
    : val.toLowerCase() === (w.baseEn || '').toLowerCase();

  inp.disabled  = true;
  inp.className = 'type-input ' + (correct ? 'correct' : 'wrong');
  document.getElementById('memoSubmitBtn').style.display = 'none';
  document.getElementById('memoNextBtn').style.display   = 'block';

  const fb = document.getElementById('memoFeedback');

  if (correct) {
    memoResult.correct++;
    if (card.box >= 5) {
      // Box 5 correct → archived
      memoCards[item.wordKey] = { box: 5, next_due: memoAddDays(30), archived: true };
      memoResult.archived++;
      await memoUpsertCard(memoFolderId, item.wordKey, 5, memoAddDays(30), true);
      fb.innerHTML = `<div class="memo-fb-correct"><span class="memo-fb-icon">★</span><span>Learned! Word archived.</span></div>`;
    } else {
      const newBox  = card.box + 1;
      const nextDue = memoAddDays(MEMO_BOX_DAYS[newBox]);
      memoCards[item.wordKey] = { box: newBox, next_due: nextDue, archived: false };
      await memoUpsertCard(memoFolderId, item.wordKey, newBox, nextDue, false);
      fb.innerHTML = `<div class="memo-fb-correct"><span class="memo-fb-icon">✓</span><span>Box ${card.box} → Box ${newBox}</span></div>`;
    }
    gsap.fromTo(fb.firstElementChild, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2.4)', clearProps: 'all' });
  } else {
    memoResult.resetCount++;
    const nextDue = memoAddDays(MEMO_BOX_DAYS[1]);
    memoCards[item.wordKey] = { box: 1, next_due: nextDue, archived: false };
    await memoUpsertCard(memoFolderId, item.wordKey, 1, nextDue, false);

    const answerHtml = dir === 'en-ko'
      ? hl(w.sadong, w.suffix)
      : escHtml(w.baseEn || '');
    const subtext = dir === 'en-ko'
      ? escHtml(w.phraseKo || '')
      : escHtml(w.phraseEn || '');

    fb.innerHTML = `
      <div class="memo-fb-wrong">
        <div class="memo-fb-wrong-lbl">Correct answer</div>
        <div class="memo-fb-answer">${answerHtml}</div>
        ${subtext ? `<div class="memo-fb-phrase">${subtext}</div>` : ''}
        <div class="memo-fb-reset">↩ Reset to Box 1</div>
      </div>`;
    gsap.fromTo(fb.firstElementChild, { x: 0 }, { keyframes: { x: [-9,9,-6,6,-3,3,0] }, duration: 0.38, ease: 'none', clearProps: 'all' });
    gsap.fromTo(inp, { x: 0 }, { keyframes: { x: [-7,7,-5,5,0] }, duration: 0.3, ease: 'none', clearProps: 'all' });

    // Reinsert once per card per session
    if (!memoReinserted.has(item.wordKey)) {
      memoReinserted.add(item.wordKey);
      const offset   = Math.floor(Math.random() * 5) + 4;
      const insertAt = Math.min(memoQIdx + offset + 1, memoQueue.length);
      memoQueue.splice(insertAt, 0, { ...item });
    }
  }

  memoQIdx++;
}

function memoNext() { memoShowCard(); }

// ── RESULTS ─────────────────────────────────────────────────────

function memoShowResults() {
  memoSessionActive = false;
  showMemoPage('pageMemoResults');
  memoSaveLastSession(memoResult.correct, memoResult.resetCount);
  if (memoResult.correct > 0) {
    memoUpdateTodayCount(memoResult.correct);
    memoIncrementTotalCorrect(memoResult.correct);
  }
  memoFetchBoxFiveCount();
  const total = memoResult.correct + memoResult.resetCount;
  const pct   = total > 0 ? Math.round(memoResult.correct / total * 100) : 100;
  const archivedRow = memoResult.archived
    ? `<div class="memo-stat"><span class="memo-stat-num" style="color:var(--cyan)">${memoResult.archived}</span><span class="memo-stat-lbl">Archived</span></div>`
    : '';

  document.getElementById('memoResultsContent').innerHTML = `
    <div class="memo-done-emoji">🧠</div>
    <div class="memo-done-title">Session <em>complete!</em></div>
    <div class="memo-results-stats">
      <div class="memo-stat"><span class="memo-stat-num green">${memoResult.correct}</span><span class="memo-stat-lbl">Correct</span></div>
      <div class="memo-stat"><span class="memo-stat-num red">${memoResult.resetCount}</span><span class="memo-stat-lbl">Missed</span></div>
      <div class="memo-stat"><span class="memo-stat-num muted">${pct}%</span><span class="memo-stat-lbl">Score</span></div>
      ${archivedRow}
    </div>
    <div class="memo-results-actions">
      <button class="memo-action-btn" onclick="openMemoMode(memoFolderId)">New session →</button>
      <button class="memo-action-btn ghost" onclick="openMemoSetupModal(false)">Change settings</button>
      <button class="memo-action-btn ghost" onclick="memoBackToFolder()">← Back to folder</button>
    </div>`;
}
