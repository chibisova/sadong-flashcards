// Dev mode: fake signed-in session for local debugging, no real auth needed.
// Enable:  localStorage.setItem('kf_dev_mode', '1'); reload.
// Disable: localStorage.removeItem('kf_dev_mode'); reload.
// Only runs on localhost — never fires on a deployed build.

function enableDevMode() {
  currentUser = {
    id: 'dev00000-0000-0000-0000-000000000000',
    email: 'dev@local',
    user_metadata: { full_name: 'Dev User' },
  };
  updateAuthUI();
  if (typeof renderSetGrid === 'function') renderSetGrid();
  console.log('[dev] dev mode active — currentUser:', currentUser);
}

if (location.hostname === 'localhost' && localStorage.getItem('kf_dev_mode') === '1') {
  enableDevMode();
}
