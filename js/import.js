// ═══════════════════════════════════════════════════════════════
// PHOTO IMPORT  (Gemini + OpenRouter)
// ═══════════════════════════════════════════════════════════════
const PI_PROMPT = `You are extracting Korean vocabulary from TOPIK study book screenshots.
The FIRST image is the word list page. Words may have marks/checkmarks/crosses on them — extract ONLY the unmarked words (ones the user has not marked as already known).
The REMAINING images contain example sentences for each word.

Return a JSON array only, no markdown, no explanation. Each object:
{
  "korean": "Korean word",
  "english": "English translation",
  "sample_korean": "Example sentence in Korean",
  "sample_english": "Example sentence translation"
}

If no example sentence is found for a word, omit those fields. If you cannot find any unmarked words, return an empty array [].`;

let _piProvider     = localStorage.getItem('import_provider') || 'gemini';
let _piListFile     = null;
let _piExampleFiles = [];
let _piWords        = [];

function piShowStep(id) {
  document.querySelectorAll('.pi-step').forEach(s => s.classList.remove('pi-active'));
  document.getElementById(id).classList.add('pi-active');
}

function piSelectProvider(p) {
  _piProvider = p;
  localStorage.setItem('import_provider', p);
  document.getElementById('piTabGemini').classList.toggle('pi-tab-active',     p === 'gemini');
  document.getElementById('piTabOpenRouter').classList.toggle('pi-tab-active', p === 'openrouter');
  document.getElementById('piPanelGemini').style.display     = p === 'gemini'     ? '' : 'none';
  document.getElementById('piPanelOpenRouter').style.display = p === 'openrouter' ? '' : 'none';
  document.getElementById('piKeyError').textContent = '';
}

function openPhotoImport() {
  document.getElementById('piOverlay').classList.remove('hidden');
  _piProvider = localStorage.getItem('import_provider') || 'gemini';
  piSelectProvider(_piProvider);
  document.getElementById('piGeminiKey').value = localStorage.getItem('gemini_api_key')     || '';
  document.getElementById('piORKey').value     = localStorage.getItem('openrouter_api_key') || '';
  document.getElementById('piORModel').value   = localStorage.getItem('openrouter_model')   || '';
  const key = _piProvider === 'gemini'
    ? localStorage.getItem('gemini_api_key')
    : localStorage.getItem('openrouter_api_key');
  if (key) {
    piShowStep('piStepUpload');
  } else {
    document.getElementById('piKeyError').textContent = '';
    piShowStep('piStepKey');
  }
}

function closePhotoImport() {
  document.getElementById('piOverlay').classList.add('hidden');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePhotoImport();
});

function piSaveKey() {
  document.getElementById('piKeyError').textContent = '';
  if (_piProvider === 'gemini') {
    const key = document.getElementById('piGeminiKey').value.trim();
    if (!key) { document.getElementById('piKeyError').textContent = '⚠ Paste your Gemini API key first.'; return; }
    localStorage.setItem('gemini_api_key', key);
  } else {
    const key   = document.getElementById('piORKey').value.trim();
    const model = document.getElementById('piORModel').value.trim();
    if (!key)   { document.getElementById('piKeyError').textContent = '⚠ Paste your OpenRouter API key first.'; return; }
    if (!model) { document.getElementById('piKeyError').textContent = '⚠ Enter a model ID.'; return; }
    localStorage.setItem('openrouter_api_key', key);
    localStorage.setItem('openrouter_model', model);
  }
  piShowStep('piStepUpload');
}

function piChangeKey() {
  document.getElementById('piKeyError').textContent = '';
  piShowStep('piStepKey');
}

function piOnListFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  _piListFile = file;
  const prev = document.getElementById('piPreviewList');
  prev.innerHTML = '';
  const img = document.createElement('img');
  img.className = 'pi-preview-thumb';
  img.src = URL.createObjectURL(file);
  prev.appendChild(img);
  document.getElementById('piUploadError').textContent = '';
}

function piOnExampleFiles(e) {
  _piExampleFiles = [...e.target.files];
  const prev = document.getElementById('piPreviewExamples');
  prev.innerHTML = '';
  _piExampleFiles.forEach(f => {
    const img = document.createElement('img');
    img.className = 'pi-preview-thumb';
    img.src = URL.createObjectURL(f);
    prev.appendChild(img);
  });
}

function piFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function piParseJSON(raw) {
  let s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const arrMatch = s.match(/\[[\s\S]*\]/);
  if (arrMatch) s = arrMatch[0];
  s = s.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
  const words = JSON.parse(s);
  if (!Array.isArray(words)) throw new Error('Response was not a JSON array.');
  return words;
}

async function piCallGemini(key, allFiles, bases) {
  const parts = [
    { text: PI_PROMPT },
    ...allFiles.map((f, i) => ({ inlineData: { mimeType: f.type, data: bases[i] } }))
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }) }
  );
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function piCallOpenRouter(key, allFiles, bases) {
  const content = [
    { type: 'text', text: PI_PROMPT },
    ...allFiles.map((f, i) => ({
      type: 'image_url',
      image_url: { url: `data:${f.type};base64,${bases[i]}` }
    }))
  ];
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: localStorage.getItem('openrouter_model') || '',
      messages: [{ role: 'user', content }],
    })
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function piExtract() {
  const key = _piProvider === 'gemini'
    ? localStorage.getItem('gemini_api_key')
    : localStorage.getItem('openrouter_api_key');
  if (!key) { piChangeKey(); return; }
  if (!_piListFile) {
    document.getElementById('piUploadError').textContent = '⚠ Upload the word list screenshot first.';
    return;
  }
  document.getElementById('piUploadError').textContent = '';
  piShowStep('piStepLoading');

  try {
    const allFiles = [_piListFile, ..._piExampleFiles];
    const bases    = await Promise.all(allFiles.map(piFileToBase64));
    const raw = _piProvider === 'gemini'
      ? await piCallGemini(key, allFiles, bases)
      : await piCallOpenRouter(key, allFiles, bases);
    _piWords = piParseJSON(raw);
    piShowResults(_piWords);

  } catch (err) {
    const other = _piProvider === 'gemini' ? 'openrouter' : 'gemini';
    piShowStep('piStepResults');
    document.getElementById('piResultList').innerHTML     = '';
    document.getElementById('piResultsLabel').textContent = '';
    document.getElementById('piAddBtn').style.display     = 'none';
    document.getElementById('piResultError').innerHTML    =
      `⚠ ${escHtml(err.message)}<br><a href="#" style="color:var(--accent)" onclick="piChangeKey();piSelectProvider('${other}');return false">switch provider?</a>`;
  }
}

function piShowResults(words) {
  piShowStep('piStepResults');
  const list   = document.getElementById('piResultList');
  const lbl    = document.getElementById('piResultsLabel');
  const addBtn = document.getElementById('piAddBtn');
  const errEl  = document.getElementById('piResultError');

  errEl.textContent = '';
  list.innerHTML    = '';

  if (!words.length) {
    lbl.textContent      = 'No unmarked words found.';
    addBtn.style.display = 'none';
    return;
  }

  const n = words.length;
  lbl.textContent      = `Found ${n} word${n !== 1 ? 's' : ''}`;
  addBtn.style.display = '';
  addBtn.textContent   = `Add ${n} word${n !== 1 ? 's' : ''} to set →`;

  words.forEach(w => {
    const item = document.createElement('div');
    item.className = 'pi-result-item';
    item.innerHTML = `
      <div class="pi-result-ko">${escHtml(w.korean || '—')}</div>
      <div class="pi-result-en">${escHtml(w.english || '—')}</div>
      ${w.sample_korean ? `<div class="pi-result-sample">${escHtml(w.sample_korean)}${w.sample_english ? `<br><em>${escHtml(w.sample_english)}</em>` : ''}</div>` : ''}`;
    list.appendChild(item);
  });

  gsap.from(list.children, {
    y: 8, opacity: 0, duration: 0.26, stagger: 0.04, ease: 'power2.out', clearProps: 'all'
  });
}

function piAddWords() {
  _piWords.forEach(w => {
    addWordRow(w.korean || '', w.english || '', w.sample_korean || '', w.sample_english || '');
  });
  closePhotoImport();
}

function piGoUpload() {
  document.getElementById('piResultError').textContent = '';
  piShowStep('piStepUpload');
}
