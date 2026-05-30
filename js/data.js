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
