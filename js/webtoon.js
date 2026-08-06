// ═══════════════════════════════════════════════════════════════
// WEBTOON MODE (Phase 1 — static viewer)
// Lives as a tab on a set's practice page (alongside Swipe/Type/
// Test/Progress), shown only when that set has a matching story.
// Data shape here is what a future "Generate webtoon" pipeline
// (LLM story + image-gen, see README) would also need to produce.
// ═══════════════════════════════════════════════════════════════

const WEBTOON_STORIES = {
  'day9-demo': {
    id: 'day9-demo',
    title: '처음 (First Time)',
    images: [
      'assets/webtoon/day9/9_1.png',
      'assets/webtoon/day9/9_2.png',
      'assets/webtoon/day9/9_3.png',
      'assets/webtoon/day9/9_4.png',
    ],
    panels: [
      { korean: '처음... 떨려요...',                              english: 'First time... I\'m nervous...',                         words: ['처음'] },
      { korean: '저는 선배예요, 잘 부탁해요!',                      english: 'I\'m your senior, nice to meet you!',                    words: ['선배'] },
      { korean: '기업 업무를 처리하다 — 이걸 다 처리해야 해요...',   english: 'Handling company work — I have to handle all of this...', words: ['기업', '처리하다'] },
      { korean: '비교해도 답이 안 보여... 고생이네',                english: 'Even comparing them, I can\'t find the answer... what a hard time', words: ['비교하다', '고생'] },
      { korean: '갑자기!!',                                        english: 'Suddenly!!',                                             words: ['갑자기'] },
      { korean: '제가 옮길게요, 다치지 않게 조심해요',              english: 'I\'ll move it, be careful not to get hurt',              words: ['옮기다', '다치다'] },
      { korean: '문득 떠오른 기억',                                 english: 'A memory that suddenly comes to mind',                   words: ['문득'] },
      { korean: '자신감을 얻었어요!',                               english: 'I\'ve gained confidence!',                               words: ['자신감', '얻다'] },
      { korean: '마감을 연장했습니다 — 마침 다행이에요',            english: 'The deadline has been extended — what a relief, just in time', words: ['연장하다', '마침'] },
      { korean: '이런 순간은 드물어요!',                            english: 'Moments like this are rare!',                            words: ['드물다'] },
      { korean: '미래를 향한 첫걸음',                               english: 'A first step toward the future',                         words: ['미래'] },
    ],
  },
};

let _webtoonTranscriptOpen = false;

function openWebtoonForActiveSet() {
  const story = activeFolder && WEBTOON_STORIES[activeFolder.webtoonId];
  if (!story) return;
  renderWebtoon(story);
  showPage('webtoon');
}

function renderWebtoon(story) {
  document.getElementById('webtoonTitle').textContent = story.title;

  const scroll = document.getElementById('webtoonScroll');
  scroll.innerHTML = story.images
    .map(src => `<img class="webtoon-panel-img" src="${src}" alt="">`)
    .join('');

  const transcript = document.getElementById('webtoonTranscript');
  transcript.innerHTML = story.panels
    .map((p, i) => `
      <div class="webtoon-line" onclick="this.classList.toggle('revealed')">
        <div class="webtoon-line-num">${i + 1}</div>
        <div class="webtoon-line-text">
          <div class="webtoon-line-kr">${escHtml(p.korean)}</div>
          <div class="webtoon-line-en">${escHtml(p.english)}</div>
        </div>
      </div>`)
    .join('');

  _webtoonTranscriptOpen = false;
  document.getElementById('webtoonTranscript').classList.remove('open');
  document.getElementById('webtoonScroll').classList.remove('dimmed');
}

function closeWebtoonTranscript() {
  _webtoonTranscriptOpen = false;
  document.getElementById('webtoonTranscript').classList.remove('open');
  document.getElementById('webtoonScroll').classList.remove('dimmed');
}

function toggleWebtoonTranscript() {
  _webtoonTranscriptOpen = !_webtoonTranscriptOpen;
  document.getElementById('webtoonTranscript').classList.toggle('open', _webtoonTranscriptOpen);
  document.getElementById('webtoonScroll').classList.toggle('dimmed', _webtoonTranscriptOpen);
}
