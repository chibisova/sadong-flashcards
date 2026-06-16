// SUPABASE_URL and SUPABASE_KEY come from js/config.js (git-ignored).
// Copy js/config.example.js → js/config.js and fill in your credentials.
const SUPABASE_READY = typeof SUPABASE_URL !== 'undefined' &&
  SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co';

const sb = SUPABASE_READY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;


let currentUser = null;

// ═══════════════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════════════
if (sb) {
  sb.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
    if (event === 'INITIAL_SESSION' && currentUser && typeof renderSetGrid === 'function') {
      renderSetGrid();
    }
    if (event === 'SIGNED_IN') {
      try { await syncFolders();           } catch (err) { console.error('[auth] syncFolders error:', err.message); }
      try { await syncSets();              } catch (err) { console.error('[auth] syncSets error:',   err.message); }
      try { await memoFetchUserStats();     } catch (err) { console.error('[auth] memoUserStats:', err.message); }
      try { await memoFetchBoxFiveCount();  } catch (err) { console.error('[auth] memoBox5:',      err.message); }
      renderSetGrid();
    }
    if (event === 'SIGNED_OUT') {
      customSets      = [];
      customFolders   = [];
      memoTotalCorrect = 0;
      memoBoxFiveCount = 0;
      localStorage.removeItem('kf_custom_sets');
      localStorage.removeItem('kf_folders');
      renderSetGrid();
    }
  });

}
updateAuthUI();  // initial render (before async getSession resolves)

function updateAuthUI() {
  const greeting    = document.getElementById('menuGreeting');
  const signedInEl  = document.getElementById('settingsSignedIn');
  const signedOutEl = document.getElementById('settingsSignedOut');
  const emailEl     = document.getElementById('settingsEmail');

  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    const short = name.length > 16 ? name.slice(0, 15) + '…' : name;
    if (greeting) greeting.textContent = 'Hello, ' + short;
    if (signedInEl)  signedInEl.style.display  = '';
    if (signedOutEl) signedOutEl.style.display  = 'none';
    if (emailEl)     emailEl.textContent         = currentUser.email;
  } else {
    if (greeting) greeting.textContent = 'Korean Flashcards';
    if (signedInEl)  signedInEl.style.display  = 'none';
    if (signedOutEl) signedOutEl.style.display  = '';
  }
}

function openSignOutConfirm() {
  document.getElementById('settingsOverlay').classList.add('hidden');
  document.getElementById('signOutConfirmOverlay').classList.remove('hidden');
}

function closeSignOutConfirm() {
  document.getElementById('signOutConfirmOverlay').classList.add('hidden');
  document.getElementById('settingsOverlay').classList.remove('hidden');
}

function executeSignOut() {
  document.getElementById('signOutConfirmOverlay').classList.add('hidden');
  Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('kf_custom_sets');
  window.location.reload();
}

function signOut() { executeSignOut(); }

// ═══════════════════════════════════════════════════════════════
// AUTH MODAL
// ═══════════════════════════════════════════════════════════════
let _authTab = 'signin';

function openAuthModal() {
  document.getElementById('authOverlay').classList.remove('hidden');
  authShowStep('authStepMain');
  authShowTab('signin');
  document.getElementById('authEmail').value    = '';
  document.getElementById('authPassword').value = '';
  document.getElementById('authError').textContent = '';
  setTimeout(() => document.getElementById('authEmail').focus(), 60);
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.add('hidden');
}

function authShowTab(tab) {
  _authTab = tab;
  document.getElementById('authTabSignIn').classList.toggle('pi-tab-active', tab === 'signin');
  document.getElementById('authTabSignUp').classList.toggle('pi-tab-active', tab === 'signup');
  document.getElementById('authSubmitBtn').textContent =
    tab === 'signin' ? 'Sign in →' : 'Create account →';
  document.getElementById('authError').textContent = '';
}

function authShowStep(id) {
  ['authStepMain', 'authStepLoading', 'authStepConfirm'].forEach(s => {
    document.getElementById(s).classList.toggle('pi-active', s === id);
  });
}

async function authSubmit() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl    = document.getElementById('authError');

  if (!email || !password) { errEl.textContent = '⚠ Fill in email and password.'; return; }
  if (password.length < 6) { errEl.textContent = '⚠ Password must be at least 6 characters.'; return; }

  errEl.textContent = '';
  document.getElementById('authLoadingLbl').textContent =
    _authTab === 'signin' ? 'Signing in…' : 'Creating account…';
  authShowStep('authStepLoading');

  try {
    let result;
    if (_authTab === 'signin') {
      result = await sb.auth.signInWithPassword({ email, password });
    } else {
      result = await sb.auth.signUp({ email, password });
    }

    const { error } = result;
    if (error) {
      authShowStep('authStepMain');
      document.getElementById('authError').textContent = '⚠ ' + error.message;
    } else if (_authTab === 'signup') {
      authShowStep('authStepConfirm');
    } else {
      closeAuthModal();
    }
  } catch (err) {
    console.error('[auth] submit error:', err);
    authShowStep('authStepMain');
    document.getElementById('authError').textContent = '⚠ ' + err.message;
  }
}

// ═══════════════════════════════════════════════════════════════
// CLOUD SYNC
// ═══════════════════════════════════════════════════════════════
async function syncSets() {
  if (!sb || !currentUser) return;

  const { data: rows, error } = await sb
    .from('sets')
    .select('*')
    .eq('user_id', currentUser.id);

  if (error) { console.error('[supabase] fetch:', error.message); return; }

  const cloudMap = {};
  (rows || []).forEach(r => { cloudMap[r.local_id] = r; });

  // Push sets that exist locally but not in cloud for this user.
  // These are legitimately offline-created sets (local was cleared on sign-out,
  // so anything here was created after that clear — i.e. for the current user).
  const toInsert = customSets
    .filter(s => !cloudMap[s.id])
    .map(s => localSetToRow(s));
  if (toInsert.length) {
    const { error: ie } = await sb.from('sets').insert(toInsert);
    if (ie) console.error('[supabase] insert:', ie.message);
  }

  // Replace local entirely with cloud data (cloud is authoritative after sign-in)
  customSets = (rows || []).map(rowToLocalSet);
  localStorage.setItem('kf_custom_sets', JSON.stringify(customSets));
}

async function cloudUpsertSet(set) {
  if (!sb || !currentUser) return;
  const { error } = await sb
    .from('sets')
    .upsert(localSetToRow(set), { onConflict: 'user_id,local_id' });
  if (error) console.error('[supabase] upsert:', error.message);
}

async function cloudDeleteSet(localId) {
  if (!sb || !currentUser) return;
  const { error } = await sb
    .from('sets')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('local_id', localId);
  if (error) console.error('[supabase] delete:', error.message);
}

function localSetToRow(s) {
  return {
    user_id:         currentUser.id,
    local_id:        s.id,
    title:           s.title,
    subtitle:        s.subtitle       || '',
    emoji:           s.emoji          || '📝',
    raw_words:       s.rawWords       || [],
    folder_local_id: s.folderId       || null,
    updated_at:      new Date().toISOString(),
  };
}

function rowToLocalSet(r) {
  return {
    id:       r.local_id,
    title:    r.title,
    subtitle: r.subtitle       || '',
    emoji:    r.emoji          || '📝',
    rawWords: r.raw_words      || [],
    folderId: r.folder_local_id || 'starter',
  };
}

// ═══════════════════════════════════════════════════════════════
// FOLDER CLOUD SYNC
// ═══════════════════════════════════════════════════════════════
async function syncFolders() {
  if (!sb || !currentUser) return;

  const { data: rows, error } = await sb
    .from('folders').select('*').eq('user_id', currentUser.id);
  if (error) { console.error('[supabase] folders fetch:', error.message); return; }

  const cloudMap = {};
  (rows || []).forEach(r => { cloudMap[r.local_id] = r; });

  const toInsert = customFolders
    .filter(f => !cloudMap[f.id])
    .map(f => ({
      user_id:   currentUser.id,
      local_id:  f.id,
      name:      f.name,
      is_public: f.isPublic || false,
    }));
  if (toInsert.length) {
    const { error: ie } = await sb.from('folders').insert(toInsert);
    if (ie) console.error('[supabase] folders insert:', ie.message);
  }

  // Re-fetch to get generated UUIDs for newly inserted rows
  const { data: allRows } = await sb
    .from('folders').select('*').eq('user_id', currentUser.id);

  customFolders = (allRows || []).map(r => ({
    id:         r.local_id,
    name:       r.name,
    isPublic:   r.is_public,
    supabaseId: r.id,
  }));
  saveFolders();
}

async function cloudUpsertFolder(folder) {
  if (!sb || !currentUser) return;
  const { error: ue } = await sb
    .from('folders')
    .upsert({
      user_id:    currentUser.id,
      local_id:   folder.id,
      name:       folder.name,
      is_public:  folder.isPublic || false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,local_id' });
  if (ue) { console.error('[supabase] folder upsert:', ue.message); return; }

  const { data: row, error: se } = await sb
    .from('folders').select('id')
    .eq('user_id', currentUser.id).eq('local_id', folder.id)
    .single();
  if (se) { console.error('[supabase] folder select:', se.message); return; }
  if (row?.id) {
    const f = customFolders.find(f => f.id === folder.id);
    if (f) { f.supabaseId = row.id; saveFolders(); }
  }
}

async function cloudDeleteFolder(localId) {
  if (!sb || !currentUser) return;
  const { error } = await sb.from('folders').delete()
    .eq('user_id', currentUser.id).eq('local_id', localId);
  if (error) console.error('[supabase] folder delete:', error.message);
}

async function cloudFetchPublicFolder(folderUuid) {
  if (!sb) { console.warn('[share] sb not initialized'); return null; }
  const { data: folder, error: fe } = await sb
    .from('folders').select('*').eq('id', folderUuid).eq('is_public', true).single();
  if (fe) { console.error('[share] folder fetch error:', fe.message); return null; }
  if (!folder) { console.warn('[share] folder not found or not public'); return null; }
  const { data: sets, error: se } = await sb
    .from('sets').select('*')
    .eq('user_id', folder.user_id).eq('folder_local_id', folder.local_id);
  if (se) { console.error('[share] sets fetch error:', se.message); return null; }
  return { folder, sets: sets || [] };
}
