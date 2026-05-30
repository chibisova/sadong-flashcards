// ═══════════════════════════════════════════════════════════════
// TEST MODE
// ═══════════════════════════════════════════════════════════════
const TEST_MODES = { match: true, tf: true, type: true };
let testQuestions  = [];
let testQIdx       = 0;
let testCorrect    = 0;
let testTotal      = 0;
let testAnswerLog  = [];

// match sub-state
let matchSelected         = null;
let matchPairs            = {};
let matchWordIndices      = [];
let matchFirstAttemptWrong = new Set();

// tf / type sub-state
let tfAnswered       = false;
let testTypeAnswered = false;

function showTestPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.getElementById('navTest').classList.add('active');
  document.getElementById('mainNav').style.display = '';
  const pg = document.getElementById(pageId);
  gsap.fromTo(pg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' });
}

function openTestSetup() {
  showTestPage('pageTestSetup');
}

function toggleTestMode(mode) {
  TEST_MODES[mode] = !TEST_MODES[mode];
  const card = document.getElementById('tm-' + mode);
  card.classList.toggle('selected', TEST_MODES[mode]);
  document.getElementById('testSetupError').textContent = '';
}

function startTest() {
  const selectedModes = Object.entries(TEST_MODES).filter(([, v]) => v).map(([k]) => k);
  if (!selectedModes.length) {
    document.getElementById('testSetupError').textContent = '⚠ Select at least one mode.';
    return;
  }
  if (!WORDS.length) {
    document.getElementById('testSetupError').textContent = '⚠ No words in this set.';
    return;
  }
  testQuestions = buildTestQuestions(selectedModes);
  testQIdx     = 0;
  testCorrect  = 0;
  testAnswerLog = [];
  testTotal    = testQuestions.reduce((s, q) => s + (q.type === 'match' ? q.wordIndices.length : 1), 0);
  showTestPage('pageTest');
  renderTestQuestion();
}

function buildTestQuestions(modes) {
  const indices = shuffle([...Array(WORDS.length).keys()]);
  const buckets = {};
  modes.forEach(m => buckets[m] = []);
  indices.forEach((wi, i) => buckets[modes[i % modes.length]].push(wi));

  const questions = [];

  if (buckets.match) {
    for (let i = 0; i < buckets.match.length; i += 3)
      questions.push({ type: 'match', wordIndices: buckets.match.slice(i, i + 3) });
  }
  if (buckets.tf) {
    buckets.tf.forEach(wi => {
      const others = indices.filter(w => w !== wi);
      const isCorrect = !others.length || Math.random() < 0.5;
      const shownKoIdx = isCorrect ? wi : others[Math.floor(Math.random() * others.length)];
      questions.push({ type: 'tf', wordIdx: wi, shownKoIdx, isCorrect });
    });
  }
  if (buckets.type) {
    buckets.type.forEach(wi => questions.push({ type: 'type', wordIdx: wi }));
  }

  return shuffle(questions);
}

function wordsAnsweredBefore(idx) {
  return testQuestions.slice(0, idx).reduce((s, q) => s + (q.type === 'match' ? q.wordIndices.length : 1), 0);
}

function renderTestQuestion() {
  if (testQIdx >= testQuestions.length) { showTestResults(); return; }

  const q = testQuestions[testQIdx];
  const pct = testTotal > 0 ? (wordsAnsweredBefore(testQIdx) / testTotal) * 100 : 0;
  const typeLabel = q.type === 'match' ? '🎯 Match' : q.type === 'tf' ? '✅ True / False' : '⌨️ Type';

  const inner = document.getElementById('testInner');
  inner.innerHTML = `
    <div class="test-progress-bar"><div class="test-progress-fill" style="width:${pct}%"></div></div>
    <div class="test-q-counter">${testQIdx + 1} / ${testQuestions.length}</div>
    <div class="test-q-type-badge">${typeLabel}</div>`;

  if (q.type === 'match')  renderMatchQ(q);
  else if (q.type === 'tf') renderTFQ(q);
  else                     renderTypeQ(q);
}

/* ── MATCH ── */
function renderMatchQ(q) {
  matchWordIndices         = q.wordIndices;
  matchSelected            = null;
  matchPairs               = {};
  matchFirstAttemptWrong   = new Set();

  const koShuffled = shuffle([...q.wordIndices]);
  const inner = document.getElementById('testInner');

  const grid = document.createElement('div');
  grid.className = 'test-match-grid';

  const enCol = document.createElement('div'); enCol.className = 'test-match-col';
  const koCol = document.createElement('div'); koCol.className = 'test-match-col';

  q.wordIndices.forEach(wi => {
    const w = WORDS[wi];
    const el = document.createElement('div');
    el.className = 'test-match-item';
    el.dataset.wordIdx = wi; el.dataset.side = 'en';
    el.innerHTML = `<span class="test-match-en">${w.baseEn}</span>`;
    el.addEventListener('click', () => onMatchClick(el));
    enCol.appendChild(el);
  });

  koShuffled.forEach(wi => {
    const w = WORDS[wi];
    const el = document.createElement('div');
    el.className = 'test-match-item';
    el.dataset.wordIdx = wi; el.dataset.side = 'ko';
    el.innerHTML = `<span class="test-match-ko">${w.sadong || w.base}</span>`;
    el.addEventListener('click', () => onMatchClick(el));
    koCol.appendChild(el);
  });

  grid.appendChild(enCol);
  grid.appendChild(koCol);
  inner.appendChild(grid);

  gsap.from(grid.querySelectorAll('.test-match-item'), {
    y: 12, opacity: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out', clearProps: 'all'
  });
}

function onMatchClick(el) {
  if (el.classList.contains('matched-correct')) return;
  const wordIdx = parseInt(el.dataset.wordIdx);
  const side    = el.dataset.side;

  if (!matchSelected) {
    el.classList.add('selected');
    matchSelected = { side, wordIdx, el };
    return;
  }
  if (matchSelected.el === el) {
    el.classList.remove('selected');
    matchSelected = null;
    return;
  }
  if (matchSelected.side === side) {
    matchSelected.el.classList.remove('selected');
    el.classList.add('selected');
    matchSelected = { side, wordIdx, el };
    return;
  }

  const enIdx = side === 'en' ? wordIdx : matchSelected.wordIdx;
  const koIdx = side === 'ko' ? wordIdx : matchSelected.wordIdx;
  const enEl  = side === 'en' ? el : matchSelected.el;
  const koEl  = side === 'ko' ? el : matchSelected.el;

  matchSelected = null;

  if (enIdx === koIdx) {
    enEl.classList.remove('selected'); koEl.classList.remove('selected');
    enEl.classList.add('matched-correct'); koEl.classList.add('matched-correct');
    const matchCorrect = !matchFirstAttemptWrong.has(enIdx);
    if (matchCorrect) testCorrect++;
    testAnswerLog.push({ type: 'match', wordIdx: enIdx, correct: matchCorrect });
    matchPairs[enIdx] = true;
    if (Object.keys(matchPairs).length === matchWordIndices.length) {
      setTimeout(() => { testQIdx++; renderTestQuestion(); }, 650);
    }
  } else {
    matchFirstAttemptWrong.add(enIdx);
    [enEl, koEl].forEach(e => {
      e.classList.remove('selected');
      e.classList.add('flash-wrong');
      gsap.fromTo(e, { x: 0 }, {
        keyframes: { x: [-8, 8, -5, 5, 0] }, duration: 0.3, ease: 'none',
        clearProps: 'transform',
        onComplete: () => e.classList.remove('flash-wrong')
      });
    });
  }
}

/* ── TRUE / FALSE ── */
function renderTFQ(q) {
  tfAnswered = false;
  const w       = WORDS[q.wordIdx];
  const shownKo = WORDS[q.shownKoIdx];
  const inner   = document.getElementById('testInner');

  const card = document.createElement('div');
  card.className = 'test-tf-card';
  card.innerHTML = `
    <div class="test-tf-en">${w.baseEn}</div>
    <div class="test-tf-divider"></div>
    <div class="test-tf-ko">${shownKo.sadong || shownKo.base}</div>`;
  inner.appendChild(card);

  const result = document.createElement('div');
  result.className = 'test-tf-result';
  result.id = 'tfResult';
  inner.appendChild(result);

  const btns = document.createElement('div');
  btns.className = 'test-tf-btns';
  btns.id = 'tfBtns';
  btns.innerHTML = `
    <button class="test-tf-btn true-btn"  onclick="answerTF(true)">✓ True</button>
    <button class="test-tf-btn false-btn" onclick="answerTF(false)">✗ False</button>`;
  inner.appendChild(btns);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'test-next-btn';
  nextBtn.id = 'testNextBtn';
  nextBtn.textContent = 'Next →';
  nextBtn.onclick = () => { testQIdx++; renderTestQuestion(); };
  inner.appendChild(nextBtn);

  gsap.from([card, btns], { y: 14, opacity: 0, duration: 0.32, stagger: 0.08, ease: 'power2.out', clearProps: 'all' });
}

function answerTF(userSaidTrue) {
  if (tfAnswered) return;
  tfAnswered = true;
  const q       = testQuestions[testQIdx];
  const correct = userSaidTrue === q.isCorrect;
  if (correct) testCorrect++;
  testAnswerLog.push({ type: 'tf', wordIdx: q.wordIdx, shownKoIdx: q.shownKoIdx, isCorrect: q.isCorrect, userSaidTrue, correct });

  const result  = document.getElementById('tfResult');
  const correctW = WORDS[q.wordIdx];

  if (correct) {
    const msg = q.isCorrect ? '✓ Correct!' : '✓ Correct — that was NOT the right translation.';
    result.innerHTML = `<span class="test-tf-result-text correct">${msg}</span>`;
    gsap.fromTo(result.firstElementChild, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2.4)', clearProps: 'all' });
  } else {
    const correctKo = correctW.sadong || correctW.base;
    const msg = q.isCorrect
      ? `✗ Wrong — "${correctKo}" IS the correct translation`
      : `✗ Wrong — the correct answer is: ${correctKo}`;
    result.innerHTML = `<span class="test-tf-result-text wrong">${msg}</span>`;
    gsap.fromTo(result.firstElementChild, { x: 0 }, { keyframes: { x: [-9, 9, -6, 6, 0] }, duration: 0.38, ease: 'none', clearProps: 'all' });
  }

  document.getElementById('tfBtns').querySelectorAll('button').forEach(b => b.disabled = true);
  document.getElementById('testNextBtn').style.display = 'block';
}

/* ── TYPE ── */
function renderTypeQ(q) {
  testTypeAnswered = false;
  const w     = WORDS[q.wordIdx];
  const inner = document.getElementById('testInner');

  const card = document.createElement('div');
  card.className = 'type-card';
  card.innerHTML = `
    <div class="type-prompt-lbl">Type in Korean</div>
    <div class="type-base-en">${w.baseEn}</div>
    <div class="type-phrase-en">${w.phraseEn || ''}</div>`;
  inner.appendChild(card);

  const inputRow = document.createElement('div');
  inputRow.className = 'type-input-row';
  inputRow.innerHTML = `
    <input class="type-input" id="testTypeInput" type="text" placeholder="Type in Korean…"
           autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    <button class="type-submit" id="testTypeSubmit" onclick="checkTestType()">Check</button>`;
  inner.appendChild(inputRow);

  const feedback = document.createElement('div');
  feedback.className = 'type-feedback';
  feedback.id = 'testTypeFeedback';
  inner.appendChild(feedback);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'test-next-btn';
  nextBtn.id = 'testNextBtn';
  nextBtn.textContent = 'Next →';
  nextBtn.onclick = () => { testQIdx++; renderTestQuestion(); };
  inner.appendChild(nextBtn);

  const inp = document.getElementById('testTypeInput');
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (!testTypeAnswered) checkTestType();
      else { testQIdx++; renderTestQuestion(); }
    }
  });

  gsap.from(card, { y: 14, opacity: 0, duration: 0.32, ease: 'power2.out', clearProps: 'all' });
  inp.focus();
}

function checkTestType() {
  if (testTypeAnswered) return;
  testTypeAnswered = true;
  const q   = testQuestions[testQIdx];
  const w   = WORDS[q.wordIdx];
  const inp = document.getElementById('testTypeInput');
  const val = inp.value.trim();
  const ok  = val === w.sadong;

  if (ok) testCorrect++;
  testAnswerLog.push({ type: 'type', wordIdx: q.wordIdx, userInput: val, correct: ok });
  inp.disabled = true;
  inp.className = 'type-input ' + (ok ? 'correct' : 'wrong');

  const fb = document.getElementById('testTypeFeedback');
  if (ok) {
    fb.innerHTML = `<div class="fb-correct"><span class="fb-correct-icon">✓</span><span class="fb-correct-text">Correct!</span></div>`;
    gsap.fromTo(fb.firstElementChild, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2.4)', clearProps: 'all' });
  } else {
    fb.innerHTML = `
      <div>
        <div class="fb-wrong-lbl">Correct answer</div>
        <div class="fb-answer">${hl(w.sadong, w.suffix)}</div>
        ${w.phraseKo ? `<div class="fb-phrase">${w.phraseKo}</div>` : ''}
      </div>`;
    gsap.fromTo(inp, { x: 0 }, { keyframes: { x: [-7, 7, -5, 5, 0] }, duration: 0.3, ease: 'none', clearProps: 'all' });
  }

  document.getElementById('testTypeSubmit').style.display = 'none';
  document.getElementById('testNextBtn').style.display = 'block';
}

/* ── RESULTS ── */
function showTestResults() {
  showTestPage('pageTestResults');
  const pct   = testTotal > 0 ? Math.round(testCorrect / testTotal * 100) : 0;
  const wrong  = testTotal - testCorrect;
  const emoji  = pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '👍' : '💪';
  const title  = pct >= 90 ? '<em>Amazing!</em>' : pct >= 70 ? 'Great <em>job!</em>' : pct >= 50 ? 'Good <em>effort!</em>' : 'Keep <em>practicing!</em>';

  const r            = 44;
  const circumference = 2 * Math.PI * r;
  const dashOffset   = circumference * (1 - pct / 100);

  const inner = document.getElementById('testResultsInner');
  inner.innerHTML = `
    <div class="test-results-emoji">${emoji}</div>
    <h2 style="font-size:26px;font-weight:300">${title}</h2>
    <div class="test-score-ring">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--glass-border)" stroke-width="8"/>
        <circle id="scoreArc" cx="50" cy="50" r="${r}" fill="none" stroke="var(--green)" stroke-width="8"
                stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                stroke-linecap="round" style="filter:drop-shadow(0 0 6px var(--green-glow))"/>
      </svg>
      <div class="test-score-pct">
        <div class="test-score-num">${pct}%</div>
        <div class="test-score-sub">${testCorrect} / ${testTotal}</div>
      </div>
    </div>
    <div class="test-breakdown">
      <div class="test-breakdown-row">
        <span class="test-breakdown-lbl">Correct</span>
        <span class="test-breakdown-val" style="color:var(--green)">${testCorrect}</span>
      </div>
      <div class="test-breakdown-row">
        <span class="test-breakdown-lbl">Incorrect</span>
        <span class="test-breakdown-val" style="color:var(--red)">${wrong}</span>
      </div>
      <div class="test-breakdown-row">
        <span class="test-breakdown-lbl">Total words</span>
        <span class="test-breakdown-val">${testTotal}</span>
      </div>
    </div>
    <div class="test-results-btns">
      <button class="test-again-btn" onclick="openTestSetup()">Test again →</button>
      <button class="test-back-btn"  onclick="switchToSwipe()">Back to study</button>
    </div>
    <div class="test-answer-log" id="testAnswerLog"></div>`;

  gsap.from(inner.children, { y: 18, opacity: 0, duration: 0.45, stagger: 0.1, ease: 'back.out(1.5)', clearProps: 'all' });
  gsap.to('#scoreArc', { strokeDashoffset: dashOffset, duration: 1, ease: 'power2.out', delay: 0.5 });

  renderAnswerLog();
}

function renderAnswerLog() {
  const container = document.getElementById('testAnswerLog');
  if (!testAnswerLog.length) return;

  const hdr = document.createElement('div');
  hdr.className = 'test-answer-log-hdr';
  hdr.textContent = 'Answer Review';
  container.appendChild(hdr);

  testAnswerLog.forEach(entry => {
    const w = WORDS[entry.wordIdx];
    const row = document.createElement('div');
    row.className = 'test-answer-row ' + (entry.correct ? 'correct' : 'wrong');

    const icon = entry.correct ? '✓' : '✗';

    if (entry.type === 'match') {
      row.innerHTML = `
        <div class="test-answer-icon">${icon}</div>
        <div class="test-answer-body">
          <div class="test-answer-ko">${w.sadong || w.base}</div>
          <div class="test-answer-en">${w.baseEn}</div>
          <div class="test-answer-detail ${entry.correct ? 'correct' : 'wrong'}">
            ${entry.correct ? 'Matched first try' : 'Needed multiple attempts'}
          </div>
        </div>`;

    } else if (entry.type === 'tf') {
      const shownKo = WORDS[entry.shownKoIdx];
      const userAnswer = entry.userSaidTrue ? 'True' : 'False';
      const correctAnswer = entry.isCorrect ? 'True' : 'False';
      row.innerHTML = `
        <div class="test-answer-icon">${icon}</div>
        <div class="test-answer-body">
          <div class="test-answer-ko">${w.sadong || w.base}</div>
          <div class="test-answer-en">${w.baseEn}</div>
          <div class="test-answer-detail ${entry.correct ? 'correct' : 'wrong'}">
            Shown: ${shownKo.sadong || shownKo.base} — answered ${userAnswer}
            ${!entry.correct ? ` · correct: ${correctAnswer}` : ''}
          </div>
          ${!entry.correct ? `<div class="test-answer-correction">${w.sadong || w.base}</div>` : ''}
        </div>`;

    } else {
      row.innerHTML = `
        <div class="test-answer-icon">${icon}</div>
        <div class="test-answer-body">
          <div class="test-answer-ko">${w.sadong || w.base}</div>
          <div class="test-answer-en">${w.baseEn}</div>
          <div class="test-answer-detail ${entry.correct ? 'correct' : 'wrong'}">
            ${entry.correct ? `Typed correctly` : `Typed: "${entry.userInput || '—'}"`}
          </div>
          ${!entry.correct ? `<div class="test-answer-correction">${hl(w.sadong, w.suffix)}</div>` : ''}
        </div>`;
    }

    container.appendChild(row);
  });

  gsap.from(container.querySelectorAll('.test-answer-row'), {
    y: 10, opacity: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'all', delay: 0.6
  });
}
