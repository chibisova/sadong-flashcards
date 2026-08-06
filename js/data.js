// ═══════════════════════════════════════════════════════════════
// BUILT-IN SETS
// ═══════════════════════════════════════════════════════════════
const BUILT_IN_SETS = [
  {
    id: 'sadong',
    title: '사동',
    subtitle: 'Causative verbs',
    emoji: '🔀',
    promptLabel: 'Type the 사동 form',
    frontLabel: 'Translate to Korean',
    pageLabel: '사동',
    isBuiltIn: true,
    words: [
      { base:'끓다', sadong:'끓이다', suffix:'이', phraseKo:'물을 끓이다', phraseEn:'to boil water', baseEn:'to boil (intrans.)' },
      { base:'녹다', sadong:'녹이다', suffix:'이', phraseKo:'버터를 녹이다', phraseEn:'to melt butter', baseEn:'to melt (intrans.)' },
      { base:'먹다', sadong:'먹이다', suffix:'이', phraseKo:'아이에게 밥을 먹이다', phraseEn:'to feed a child', baseEn:'to eat' },
      { base:'붙다', sadong:'붙이다', suffix:'이', phraseKo:'벽에 포스터를 붙이다', phraseEn:'to stick a poster on the wall', baseEn:'to stick / cling' },
      { base:'속다', sadong:'속이다', suffix:'이', phraseKo:'사람을 속이다', phraseEn:'to deceive someone', baseEn:'to be deceived' },
      { base:'죽다', sadong:'죽이다', suffix:'이', phraseKo:'모기를 죽이다', phraseEn:'to kill a mosquito', baseEn:'to die' },
      { base:'눕다', sadong:'눕히다', suffix:'히', phraseKo:'환자를 눕히다', phraseEn:'to lay a patient down', baseEn:'to lie down' },
      { base:'앉다', sadong:'앉히다', suffix:'히', phraseKo:'손님을 앉히다', phraseEn:'to seat a guest', baseEn:'to sit' },
      { base:'읽다', sadong:'읽히다', suffix:'히', phraseKo:'학생에게 책을 읽히다', phraseEn:'to have a student read', baseEn:'to read' },
      { base:'입다', sadong:'입히다', suffix:'히', phraseKo:'아이에게 옷을 입히다', phraseEn:'to dress a child', baseEn:'to wear / put on' },
      { base:'살다', sadong:'살리다', suffix:'리', phraseKo:'사람을 살리다', phraseEn:"to save someone's life", baseEn:'to live' },
      { base:'알다', sadong:'알리다', suffix:'리', phraseKo:'소식을 알리다', phraseEn:'to announce news', baseEn:'to know' },
      { base:'울다', sadong:'울리다', suffix:'리', phraseKo:'아이를 울리다', phraseEn:'to make a child cry', baseEn:'to cry' },
      { base:'남다', sadong:'남기다', suffix:'기', phraseKo:'음식을 남기다', phraseEn:'to leave food uneaten', baseEn:'to remain' },
      { base:'맡다', sadong:'맡기다', suffix:'기', phraseKo:'아이를 맡기다', phraseEn:'to entrust a child to someone', baseEn:'to take charge of' },
      { base:'숨다', sadong:'숨기다', suffix:'기', phraseKo:'비밀을 숨기다', phraseEn:'to hide a secret', baseEn:'to hide (intrans.)' },
      { base:'신다', sadong:'신기다', suffix:'기', phraseKo:'아이에게 신발을 신기다', phraseEn:'to put shoes on a child', baseEn:'to put on footwear' },
      { base:'씻다', sadong:'씻기다', suffix:'기', phraseKo:'아이를 씻기다', phraseEn:'to wash a child', baseEn:'to wash (oneself)' },
      { base:'웃다', sadong:'웃기다', suffix:'기', phraseKo:'친구를 웃기다', phraseEn:'to make a friend laugh', baseEn:'to laugh' },
      { base:'깨다', sadong:'깨우다', suffix:'우', phraseKo:'친구를 깨우다', phraseEn:'to wake a friend up', baseEn:'to wake up' },
      { base:'서다', sadong:'세우다', suffix:'우', phraseKo:'차를 세우다', phraseEn:'to stop a car', baseEn:'to stand / stop' },
      { base:'자다', sadong:'재우다', suffix:'우', phraseKo:'아이를 재우다', phraseEn:'to put a child to sleep', baseEn:'to sleep' },
      { base:'타다', sadong:'태우다', suffix:'우', phraseKo:'손님을 태우다', phraseEn:'to give a passenger a ride', baseEn:'to ride / board' },
      { base:'차다', sadong:'채우다', suffix:'우', phraseKo:'빈칸을 채우다', phraseEn:'to fill in the blank', baseEn:'to become full' },
      { base:'낮다', sadong:'낮추다', suffix:'추', phraseKo:'목소리를 낮추다', phraseEn:"to lower one's voice", baseEn:'to be low' },
      { base:'늦다', sadong:'늦추다', suffix:'추', phraseKo:'속도를 늦추다', phraseEn:'to slow down speed', baseEn:'to be late' },
      { base:'맞다', sadong:'맞추다', suffix:'추', phraseKo:'시간을 맞추다', phraseEn:'to adjust to the time', baseEn:'to fit / be correct' },
    ]
  }
];

// ═══════════════════════════════════════════════════════════════
// PERMANENT FOLDERS / SETS
// Shipped with the app (unlike user-created folders/sets, which
// live in localStorage/Supabase) — always present, not editable.
// ═══════════════════════════════════════════════════════════════
const PERMANENT_FOLDERS = [
  { id: 'topik30', name: 'TOPIK30', isPermanent: true },
];

const PERMANENT_SETS = [
  {
    id: 'topik-day9',
    title: 'TOPIK Day 9',
    subtitle: 'TOPIK vocab, day 9',
    emoji: '📖',
    folderId: 'topik30',
    isPermanent: true,
    webtoonId: 'day9-demo',
    rawWords: [
      { word:'연장하다', definition:'to extend', sampleSentence:'비자를 3개월 더 연장했어요.', sentenceTranslation:'I extended my visa for three more months.' },
      { word:'처리하다', definition:'to handle, manage, process', sampleSentence:'이 문제는 제가 처리할게요.', sentenceTranslation:'I\'ll handle this problem.' },
      { word:'기업', definition:'a firm, a business', sampleSentence:'그는 작은 기업을 운영하고 있어요.', sentenceTranslation:'He runs a small business.' },
      { word:'비교하다', definition:'to compare', sampleSentence:'두 제품의 가격을 비교해 보세요.', sentenceTranslation:'Please compare the prices of the two products.' },
      { word:'선배', definition:'one\'s senior, elder', sampleSentence:'회사 선배가 저에게 많은 걸 가르쳐 줬어요.', sentenceTranslation:'My senior at work taught me a lot.' },
      { word:'고생', definition:'a hard time, adversity', sampleSentence:'이사하느라 고생 많았지요?', sentenceTranslation:'You must have had a hard time moving, right?' },
      { word:'구매하다', definition:'to buy', sampleSentence:'온라인으로 노트북을 구매했어요.', sentenceTranslation:'I bought a laptop online.' },
      { word:'남', definition:'other people, others', sampleSentence:'남의 시선을 너무 신경 쓰지 마세요.', sentenceTranslation:'Don\'t worry too much about what other people think.' },
      { word:'마침', definition:'just (about to), exactly, fortunately', sampleSentence:'마침 버스가 도착했어요.', sentenceTranslation:'The bus arrived just in time.' },
      { word:'물질', definition:'physical matter, substance', sampleSentence:'이 물질은 물에 잘 녹아요.', sentenceTranslation:'This substance dissolves easily in water.' },
      { word:'미술', definition:'art, the fine arts', sampleSentence:'저는 미술 전시회를 좋아해요.', sentenceTranslation:'I like art exhibitions.' },
      { word:'별로', definition:'not particularly (used in negative sentences)', sampleSentence:'이 영화는 별로 재미없었어요.', sentenceTranslation:'This movie wasn\'t particularly interesting.' },
      { word:'사무실', definition:'an office (room)', sampleSentence:'사무실이 집에서 가까워요.', sentenceTranslation:'The office is close to my home.' },
      { word:'어른', definition:'an adult', sampleSentence:'이제 저도 어른이 되었어요.', sentenceTranslation:'I\'ve become an adult now.' },
      { word:'예방하다', definition:'to protect, prevent', sampleSentence:'감기를 예방하려면 손을 자주 씻으세요.', sentenceTranslation:'Wash your hands often to prevent colds.' },
      { word:'일시적', definition:'temporary', sampleSentence:'그 증상은 일시적인 거예요.', sentenceTranslation:'That symptom is temporary.' },
      { word:'자신감', definition:'self-esteem, confidence', sampleSentence:'발표 후에 자신감이 많이 생겼어요.', sentenceTranslation:'I gained a lot of confidence after the presentation.' },
      { word:'재산', definition:'asset, estate, property', sampleSentence:'그는 젊을 때 많은 재산을 모았어요.', sentenceTranslation:'He accumulated a lot of assets when he was young.' },
      { word:'제도', definition:'a policy, system, institution', sampleSentence:'새로운 교육 제도가 도입되었어요.', sentenceTranslation:'A new education system was introduced.' },
      { word:'뜨다', definition:'to rise (e.g. the sun); to knit', sampleSentence:'해가 뜨는 걸 보러 일찍 일어났어요.', sentenceTranslation:'I woke up early to watch the sun rise.' },
      { word:'드물다', definition:'to be rare, uncommon', sampleSentence:'이런 기회는 정말 드물어요.', sentenceTranslation:'An opportunity like this is really rare.' },
      { word:'옮기다', definition:'to move, to transfer', sampleSentence:'짐을 새 집으로 옮겼어요.', sentenceTranslation:'I moved the luggage to the new house.' },
      { word:'유행하다', definition:'to be fashionable, to be popular', sampleSentence:'요즘 이 스타일이 유행하고 있어요.', sentenceTranslation:'This style is trending these days.' },
      { word:'일부', definition:'a part, portion, section', sampleSentence:'학생들 일부는 아직 도착하지 않았어요.', sentenceTranslation:'Some of the students haven\'t arrived yet.' },
      { word:'전시회', definition:'an exhibition, show, display', sampleSentence:'다음 주에 사진 전시회가 열려요.', sentenceTranslation:'A photo exhibition will be held next week.' },
      { word:'처음', definition:'the first time, the start', sampleSentence:'한국에 처음 왔을 때 정말 긴장했어요.', sentenceTranslation:'I was really nervous when I first came to Korea.' },
      { word:'다치다', definition:'to be injured or hurt', sampleSentence:'운동하다가 다리를 다쳤어요.', sentenceTranslation:'I hurt my leg while exercising.' },
      { word:'미래', definition:'the future', sampleSentence:'저는 미래를 위해 저축하고 있어요.', sentenceTranslation:'I\'m saving money for the future.' },
      { word:'분석하다', definition:'to analyze', sampleSentence:'자료를 분석해서 보고서를 썼어요.', sentenceTranslation:'I analyzed the data and wrote a report.' },
      { word:'살펴보다', definition:'to look into, examine, look around', sampleSentence:'계약서를 자세히 살펴보세요.', sentenceTranslation:'Please look over the contract carefully.' },
      { word:'음식', definition:'food', sampleSentence:'이 음식은 정말 맛있어요.', sentenceTranslation:'This food is really delicious.' },
      { word:'의미', definition:'a meaning', sampleSentence:'이 단어의 의미를 모르겠어요.', sentenceTranslation:'I don\'t know the meaning of this word.' },
      { word:'일으키다', definition:'to cause, provoke, give rise to', sampleSentence:'그 사고가 큰 혼란을 일으켰어요.', sentenceTranslation:'That accident caused a lot of chaos.' },
      { word:'정신', definition:'mind, mentality, spirit', sampleSentence:'시험 볼 때는 정신을 집중해야 해요.', sentenceTranslation:'You need to focus your mind during the exam.' },
      { word:'얻다', definition:'to get, gain, obtain, acquire', sampleSentence:'열심히 노력해서 좋은 결과를 얻었어요.', sentenceTranslation:'I worked hard and obtained good results.' },
      { word:'갑자기', definition:'suddenly', sampleSentence:'갑자기 비가 내리기 시작했어요.', sentenceTranslation:'It suddenly started to rain.' },
      { word:'문득', definition:'all of a sudden', sampleSentence:'문득 옛 친구가 생각났어요.', sentenceTranslation:'I suddenly thought of an old friend.' },
    ],
  },
];
