// ═══════════════════════════════════════════════════════════════
// ACTIVE SESSION STATE
// ═══════════════════════════════════════════════════════════════
let WORDS        = [];
let activeFolderId = null;
let activeFolder   = null;

const MAX_REVIEW   = 5;
const NEEDED_STREAK = 2;

// ═══════════════════════════════════════════════════════════════
// UTILITY (study-specific)
// ═══════════════════════════════════════════════════════════════
function hl(sadong, suffix) {
  if (!suffix) return sadong;
  const stem = sadong.slice(0, -1);
  const idx  = stem.lastIndexOf(suffix[0]);
  if (idx === -1) return sadong;
  return stem.slice(0, idx) + `<span class="sfx">${stem.slice(idx)}</span>다`;
}

// ═══════════════════════════════════════════════════════════════
// SWIPE PAGE
// ═══════════════════════════════════════════════════════════════
const S = {
  deck: [], review: [], known: new Set(),
  current: null, busy: false, isFlipped: false, wrap: null,

  pick() {
    if (this.review.length >= MAX_REVIEW) return this.review[0];
    if (this.review.length > 0 && this.deck.length > 0)
      return Math.random() < 0.35 ? this.review[0] : this.deck[0];
    if (this.review.length > 0) return this.review[0];
    if (this.deck.length > 0)   return this.deck[0];
    return null;
  },

  updateStats() {
    document.getElementById('s-known').textContent  = this.known.size;
    document.getElementById('s-review').textContent = this.review.length;
    document.getElementById('s-left').textContent   = this.deck.length;
    const qb = document.getElementById('s-qbar');
    if (this.review.length >= MAX_REVIEW) {
      qb.textContent = '⚠ Queue full — looping review cards'; qb.className = 'queue-bar warn';
    } else if (this.review.length > 0) {
      qb.textContent = `${this.review.length} / ${MAX_REVIEW} in review`; qb.className = 'queue-bar';
    } else {
      qb.textContent = this.deck.length > 0 ? '→ New words' : ''; qb.className = 'queue-bar ok';
    }
  },

  showCard() {
    const stage = document.getElementById('s-stage');
    stage.innerHTML = '';
    this.isFlipped = false; this.wrap = null;

    if (this.known.size === WORDS.length) {
      stage.style.display = 'none';
      const sDone = document.getElementById('s-done');
      sDone.classList.add('show');
      gsap.from(sDone.children, { y: 18, opacity: 0, duration: 0.45, stagger: 0.1, ease: 'back.out(1.5)', clearProps: 'all' });
      return;
    }

    const idx = this.pick();
    if (idx === null) return;
    this.current = idx;
    const w = WORDS[idx];

    const suffixBadge = w.suffix
      ? `<span class="suffix-badge">~${w.suffix}</span>` : '';
    const baseLine = (w.base !== w.sadong || w.suffix)
      ? `<div class="base-line"><span class="base-word">${w.base}</span><span class="arr">→</span></div>` : '';
    const frontLbl = activeFolder ? activeFolder.frontLabel : 'Translate to Korean';

    const wrap = document.createElement('div');
    wrap.className = 'card-wrap';
    wrap.innerHTML = `
      <div class="swipe-lbl left">Review</div>
      <div class="swipe-lbl right">Got it!</div>
      <div class="flipper">
        <div class="face face-front">
          <div class="front-label">${frontLbl}</div>
          <div class="front-en">${w.baseEn}</div>
          <div class="front-phrase">${w.phraseEn}</div>
          <div class="tap-hint">tap to reveal (optional)</div>
        </div>
        <div class="face face-back">
          ${suffixBadge}
          ${baseLine}
          <div class="sadong-word">${hl(w.sadong, w.suffix)}</div>
          <div class="div-line"></div>
          <div class="phrase-ko">${w.phraseKo}</div>
          <div class="phrase-en-sm">${w.phraseEn}</div>
        </div>
        <div class="face-spacer"></div>
      </div>`;

    stage.appendChild(wrap);
    this.wrap = wrap;
    this.updateStats();

    wrap.style.opacity = '0'; wrap.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
      wrap.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      wrap.style.opacity = '1'; wrap.style.transform = 'scale(1)';
      setTimeout(() => { if (wrap.isConnected) wrap.style.transition = ''; }, 220);
    });

    this.initDrag(wrap);
    wrap.querySelector('.flipper').addEventListener('click', e => {
      if (wrap._dragged) return;
      const f = wrap.querySelector('.flipper');
      if (this.isFlipped) { f.classList.remove('is-flipped'); this.isFlipped = false; }
      else                { f.classList.add('is-flipped');    this.isFlipped = true;  }
    });
  },

  initDrag(wrap) {
    const lblL = wrap.querySelector('.swipe-lbl.left');
    const lblR = wrap.querySelector('.swipe-lbl.right');
    let startX = 0, dx = 0, active = false;

    const onStart = x => { if (this.busy) return; startX = x; dx = 0; active = true; wrap._dragged = false; wrap.style.transition = ''; };
    const onMove  = x => {
      if (!active || !wrap.isConnected) return;
      dx = x - startX;
      if (Math.abs(dx) > 4) wrap._dragged = true;
      wrap.style.transform = `translateX(${dx}px) rotate(${dx * 0.06}deg)`;
      const r = Math.min(Math.abs(dx) / 90, 1);
      lblR.style.opacity = dx > 15 ? r : 0;
      lblL.style.opacity = dx < -15 ? r : 0;
    };
    const onEnd   = () => {
      if (!active) return; active = false;
      if (!wrap.isConnected) return;
      if (dx > 90)  { this.flyOut(wrap, 'right'); return; }
      if (dx < -90) { this.flyOut(wrap, 'left');  return; }
      wrap.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
      wrap.style.transform = ''; lblL.style.opacity = lblR.style.opacity = 0;
      setTimeout(() => { if (wrap.isConnected) { wrap.style.transition = ''; wrap._dragged = false; } }, 320);
    };

    wrap.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
    wrap.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e.touches[0].clientX); }, { passive: false });
    wrap.addEventListener('touchend', onEnd);
    wrap.addEventListener('mousedown', e => {
      onStart(e.clientX);
      const mm = e2 => onMove(e2.clientX);
      const mu = () => { onEnd(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
      document.addEventListener('mousemove', mm);
      document.addEventListener('mouseup', mu);
    });
  },

  flyOut(wrap, dir) {
    if (this.busy) return; this.busy = true;
    const x = dir === 'right' ? 700 : -700;
    wrap.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease';
    wrap.style.transform  = `translateX(${x}px) rotate(${dir === 'right' ? 14 : -14}deg)`;
    wrap.style.opacity    = '0';
    setTimeout(() => {
      const ri = this.review.indexOf(this.current), di = this.deck.indexOf(this.current);
      if (ri !== -1) this.review.splice(ri, 1);
      if (di !== -1) this.deck.splice(di, 1);
      if (dir === 'right') { this.known.add(this.current); }
      else { if (!this.review.includes(this.current)) this.review.push(this.current); }
      this.busy = false; swipeSave(); this.showCard();
    }, 300);
  }
};

function swipeOut(dir) { S.flyOut(S.wrap, dir); }

function swipeSave() {
  if (!activeFolderId) return;
  localStorage.setItem(activeFolderId + '_swipe', JSON.stringify({
    deck: S.deck, review: S.review, known: [...S.known],
  }));
}
function swipeLoad() {
  if (!activeFolderId) return false;
  try {
    const d = JSON.parse(localStorage.getItem(activeFolderId + '_swipe'));
    if (!d) return false;
    S.deck = d.deck || []; S.review = d.review || []; S.known = new Set(d.known || []);
    return true;
  } catch { return false; }
}
function swipeReset() {
  if (!activeFolderId) return;
  localStorage.removeItem(activeFolderId + '_swipe');
  const ml = loadManualLearned();
  S.deck = shuffle([...Array(WORDS.length).keys()].filter(i => !ml.has(i)));
  S.review = []; S.known = new Set(ml); S.current = null; S.busy = false; S.isFlipped = false;
  document.getElementById('s-done').classList.remove('show');
  document.getElementById('s-stage').style.display = '';
  S.showCard();
}

window.addEventListener('keydown', e => {
  if (!document.getElementById('pageSwipe').classList.contains('active')) return;
  if (e.key === 'ArrowRight') S.flyOut(S.wrap, 'right');
  if (e.key === 'ArrowLeft')  S.flyOut(S.wrap, 'left');
  if ((e.key === ' ' || e.key === 'Enter') && S.wrap) {
    e.preventDefault();
    const f = S.wrap.querySelector('.flipper');
    if (S.isFlipped) { f.classList.remove('is-flipped'); S.isFlipped = false; }
    else             { f.classList.add('is-flipped');    S.isFlipped = true; }
  }
});

// ═══════════════════════════════════════════════════════════════
// TYPE PAGE
// ═══════════════════════════════════════════════════════════════
const T = {
  deck: [], review: [], known: new Set(),
  current: null, fromReview: false, answered: false,

  pick() {
    if (this.review.length >= MAX_REVIEW) return { item: this.review[0], fromReview: true };
    if (this.review.length > 0 && this.deck.length > 0)
      return Math.random() < 0.35
        ? { item: this.review[0], fromReview: true }
        : { item: this.deck[0],   fromReview: false };
    if (this.review.length > 0) return { item: this.review[0], fromReview: true };
    if (this.deck.length > 0)   return { item: this.deck[0],   fromReview: false };
    return null;
  },

  updateStats() {
    document.getElementById('t-known').textContent  = this.known.size;
    document.getElementById('t-review').textContent = this.review.length;
    document.getElementById('t-left').textContent   = this.deck.length;
    const qb = document.getElementById('t-qbar');
    if (this.review.length >= MAX_REVIEW) {
      qb.textContent = '⚠ Queue full — looping review cards'; qb.className = 'queue-bar warn';
    } else if (this.review.length > 0) {
      qb.textContent = `${this.review.length} / ${MAX_REVIEW} in review`; qb.className = 'queue-bar';
    } else {
      qb.textContent = this.deck.length > 0 ? '→ New words' : ''; qb.className = 'queue-bar ok';
    }
  },

  showCard() {
    if (this.known.size === WORDS.length) { this.showDone(); return; }
    const pick = this.pick();
    if (!pick) { this.showDone(); return; }

    this.fromReview = pick.fromReview;
    this.current    = pick.item;
    this.answered   = false;

    const idx    = this.fromReview ? this.current.idx : this.current;
    const w      = WORDS[idx];
    const streak = this.fromReview ? this.current.streak : 0;

    document.getElementById('t-base-en').textContent   = w.baseEn;
    document.getElementById('t-phrase-en').textContent = w.phraseEn;

    const dots = document.getElementById('t-dots');
    dots.innerHTML = '';
    for (let i = 0; i < NEEDED_STREAK; i++) {
      const d = document.createElement('div');
      d.className = 'sdot' + (i < streak ? ' on' : '');
      dots.appendChild(d);
    }

    const inp = document.getElementById('t-input');
    inp.value = ''; inp.className = 'type-input'; inp.disabled = false;
    document.getElementById('t-feedback').innerHTML = '';
    document.getElementById('t-next').style.display   = 'none';
    document.getElementById('t-submit').style.display = '';
    inp.focus();
    this.updateStats();
  },

  check() {
    if (this.answered) return;
    this.answered = true;
    const idx = this.fromReview ? this.current.idx : this.current;
    const w   = WORDS[idx];
    const inp = document.getElementById('t-input');
    const val = inp.value.trim();
    const ok  = val === w.sadong;

    inp.disabled = true;
    inp.className = 'type-input ' + (ok ? 'correct' : 'wrong');
    const fb = document.getElementById('t-feedback');

    if (ok) {
      let streak = 1;
      if (this.fromReview) { this.current.streak++; streak = this.current.streak; }
      const mastered = streak >= NEEDED_STREAK;
      const dots = document.getElementById('t-dots').querySelectorAll('.sdot');
      if (dots[streak - 1]) dots[streak - 1].classList.add('on');
      fb.innerHTML = `<div class="fb-correct"><span class="fb-correct-icon">✓</span><span class="fb-correct-text">${mastered ? 'Mastered! ★' : `Correct! ${streak}/${NEEDED_STREAK}`}</span></div>`;
      gsap.fromTo(fb.firstElementChild, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2.4)', clearProps: 'all' });
      if (mastered) {
        this.known.add(idx);
        if (this.fromReview) this.review.splice(this.review.indexOf(this.current), 1);
        else                 this.deck.splice(this.deck.indexOf(this.current), 1);
      } else {
        if (this.fromReview) { this.review.splice(this.review.indexOf(this.current), 1); this.review.push(this.current); }
        else { this.deck.splice(this.deck.indexOf(this.current), 1); this.review.push({ idx: this.current, streak: 1 }); }
      }
    } else {
      fb.innerHTML = `
        <div>
          <div class="fb-wrong-lbl">Correct answer</div>
          <div class="fb-answer">${hl(w.sadong, w.suffix)}</div>
          <div class="fb-phrase">${w.phraseKo}</div>
        </div>`;
      gsap.fromTo(fb.firstElementChild, { x: 0 }, { keyframes: { x: [-9, 9, -6, 6, -3, 3, 0] }, duration: 0.38, ease: 'none', clearProps: 'all' });
      gsap.fromTo(inp, { x: 0 }, { keyframes: { x: [-7, 7, -5, 5, 0] }, duration: 0.3, ease: 'none', clearProps: 'all' });
      if (this.fromReview) {
        this.current.streak = 0;
        this.review.splice(this.review.indexOf(this.current), 1);
        this.review.push(this.current);
      } else {
        this.deck.splice(this.deck.indexOf(this.current), 1);
        if (!this.review.find(r => r.idx === this.current))
          this.review.push({ idx: this.current, streak: 0 });
      }
    }
    document.getElementById('t-submit').style.display = 'none';
    document.getElementById('t-next').style.display   = 'block';
    this.updateStats(); typeSave();
  },

  next() { this.showCard(); },
  showDone() {
    document.getElementById('t-content').style.display = 'none';
    const tDone = document.getElementById('t-done');
    tDone.classList.add('show');
    gsap.from(tDone.children, { y: 18, opacity: 0, duration: 0.45, stagger: 0.1, ease: 'back.out(1.5)', clearProps: 'all' });
  }
};

function typeCheck() { T.check(); }
function typeNext()  { T.next(); }

function typeSave() {
  if (!activeFolderId) return;
  localStorage.setItem(activeFolderId + '_type', JSON.stringify({
    deck: T.deck, review: T.review, known: [...T.known],
  }));
}
function typeLoad() {
  if (!activeFolderId) return false;
  try {
    const d = JSON.parse(localStorage.getItem(activeFolderId + '_type'));
    if (!d) return false;
    T.deck = d.deck || []; T.review = d.review || []; T.known = new Set(d.known || []);
    return true;
  } catch { return false; }
}
function typeReset() {
  if (!activeFolderId) return;
  localStorage.removeItem(activeFolderId + '_type');
  const ml = loadManualLearned();
  T.deck = shuffle([...Array(WORDS.length).keys()].filter(i => !ml.has(i)));
  T.review = []; T.known = new Set(ml); T.current = null; T.answered = false;
  document.getElementById('t-done').classList.remove('show');
  document.getElementById('t-content').style.display = '';
  T.showCard();
}

document.getElementById('t-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (!T.answered) typeCheck();
    else             typeNext();
  }
});

// ═══════════════════════════════════════════════════════════════
// PROGRESS PAGE
// ═══════════════════════════════════════════════════════════════
function loadManualLearned() {
  try {
    const raw = localStorage.getItem(activeFolderId + '_learned');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveManualLearned(set) {
  localStorage.setItem(activeFolderId + '_learned', JSON.stringify([...set]));
}

function getWordStatus(idx) {
  const swipe = S.known.has(idx) ? 'known'
    : S.review.includes(idx) ? 'review' : 'new';
  const typeKnown  = T.known.has(idx);
  const typeReview = T.review.some(r => (typeof r === 'object' ? r.idx : r) === idx);
  return { swipe, type: typeKnown ? 'known' : typeReview ? 'review' : 'new' };
}

function renderProgressList(skipAnim = false) {
  if (!WORDS.length) return;
  const list = document.getElementById('progressList');
  list.innerHTML = '';

  document.getElementById('p-pg-label').textContent =
    (activeFolder ? activeFolder.pageLabel : '') + ' · Progress';

  const manualLearned = loadManualLearned();
  let learnedCount = 0;

  WORDS.forEach((w, idx) => {
    const learned = manualLearned.has(idx);
    if (learned) learnedCount++;
    const { swipe, type } = getWordStatus(idx);

    const item = document.createElement('div');
    item.className = 'prog-item' + (learned ? ' is-learned' : '');
    item.id = 'prog-item-' + idx;
    item.innerHTML = `
      <div class="prog-words">
        <div class="prog-ko">${w.sadong || w.base}</div>
        <div class="prog-en">${w.baseEn}</div>
      </div>
      <div class="prog-dots">
        <div class="prog-mode-row">
          <span class="prog-mode-lbl">swipe</span>
          <span class="prog-dot ${swipe}"></span>
        </div>
        <div class="prog-mode-row">
          <span class="prog-mode-lbl">type</span>
          <span class="prog-dot ${type}"></span>
        </div>
      </div>
      <button class="prog-learn-btn${learned ? ' learned' : ''}"
              onclick="toggleLearnedWord(${idx})">
        ${learned ? '✓ learned' : 'mark learned'}
      </button>`;
    list.appendChild(item);
  });

  document.getElementById('p-total').textContent     = WORDS.length;
  document.getElementById('p-learned').textContent   = learnedCount;
  document.getElementById('p-remaining').textContent = WORDS.length - learnedCount;

  if (!skipAnim) {
    gsap.from(list.children, {
      y: 14, opacity: 0, duration: 0.35, stagger: 0.045,
      ease: 'power2.out', clearProps: 'all'
    });
  }
}

function toggleLearnedWord(idx) {
  const manualLearned = loadManualLearned();

  if (manualLearned.has(idx)) {
    manualLearned.delete(idx);
    S.known.delete(idx);
    T.known.delete(idx);
    if (!S.deck.includes(idx) && !S.review.includes(idx))
      S.deck.push(idx);
    if (!T.deck.includes(idx) && !T.review.some(r => (r.idx ?? r) === idx))
      T.deck.push(idx);
  } else {
    manualLearned.add(idx);
    S.known.add(idx);
    T.known.add(idx);
    S.deck   = S.deck.filter(i => i !== idx);
    S.review = S.review.filter(i => i !== idx);
    T.deck   = T.deck.filter(i => i !== idx);
    T.review = T.review.filter(r => (r.idx ?? r) !== idx);
  }

  saveManualLearned(manualLearned);
  swipeSave();
  typeSave();
  renderProgressList(true);
  const pulseEl = document.getElementById('prog-item-' + idx);
  if (pulseEl) gsap.fromTo(pulseEl, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)', clearProps: 'all' });
}

function switchToSwipe() {
  showPage('swipe');
  S.updateStats();
  if (S.current !== null && S.known.has(S.current) && !S.busy) {
    S.showCard();
  }
}

function switchToType() {
  showPage('type');
  T.updateStats();
  if (T.current !== null && !T.answered) {
    const idx = typeof T.current === 'object' ? T.current.idx : T.current;
    if (T.known.has(idx)) T.showCard();
  }
}
