# Korean Flashcards

> A minimal, offline Korean vocabulary trainer.

---

## Features

### Practice modes
| Mode | How it works |
|------|-------------|
| **🃏 Swipe** | Flip card to reveal Korean → swipe right *(got it)* or left *(review again)* |
| **⌨️ Type** | See English prompt → type the Korean word → instant feedback |
| **📝 Test** | Timed quiz mixing Match (3×3), True/False, and Type questions — covers every word in the set once |
| **📊 Progress** | Per-word status across both study modes; manually mark words as learned |

Both study modes share a review queue: missed words cycle back up to 5 times before new words appear.  
Type mode requires **2 correct answers in a row** to mark a word learned.

Test mode lets you choose which question types to include. Results show a score ring and a full answer review with corrections for wrong answers.

### Sets
- **Built-in 사동 set** — 27 causative verb pairs with example phrases (끓이다, 먹이다, 살리다 …)
- **Custom sets** — create, edit, delete your own word lists, persisted in `localStorage`
- Per-set progress bar (average of swipe + type completion)

### Import / Export
- **↑ Import JSON** — load words from a `.json` file when creating or editing a set. Supported fields: `korean`, `english`, `sample_korean`, `sample_english` (plus common aliases like `word`, `definition`, `ko`, `en`)
- **↓ Export** — download any set (built-in or custom) as a `.json` file in the same format, ready to re-import or share

### NIKL dictionary lookup
When adding words to a custom set, typing a Korean word queries the **NIKL Korean–English Dictionary** (48 000+ entries). Matching entries appear inline with:
- Part of speech + difficulty level (초급 / 중급 / 고급)
- English definition
- Korean definition
- Sample sentence from the corpus

Click any suggestion to auto-fill the definition and example sentence fields.

### ✦ Import from photos *(experimental)*
Upload screenshots of a vocabulary book page and have an AI extract unmarked words automatically. Supports **Gemini** (free, recommended) and **OpenRouter** (paid models only for image input). API keys are stored locally in `localStorage` and never sent anywhere except the chosen provider.

> **Note:** This feature is under active development. OpenRouter free-tier models frequently lack image support — use Gemini for reliable results.

### Other
- **Light / dark theme** toggle (persisted)
- Mobile-first, swipe gestures on touch screens
- Keyboard shortcuts in swipe mode: `←` / `→` arrows, `Space` / `Enter` to flip

---

## Getting started

```
git clone <repo>
cd sadong-flashcards
open index.html          # macOS
# or just double-click index.html in Finder / Explorer
```

No build step. No server required. Works from `file://`.

> **First-time NIKL lookup:** `nikl_lookup.js` (~17 MB) loads in the background the first time you open the Create/Edit set page. The browser caches it after that.

---

## File structure

```
sadong-flashcards/
├── index.html          # HTML skeleton + page markup
├── nikl_lookup.js      # pre-built NIKL dictionary index (window.NIKL_DATA)
├── css/
│   └── style.css       # all styles (themes, components, animations)
└── js/
    ├── data.js         # built-in word sets (BUILT_IN_SETS)
    ├── sets.js         # custom set CRUD, word rows, JSON import/export, NIKL lookup
    ├── study.js        # swipe engine, type engine, progress tracking, session state
    ├── test.js         # test mode (match, true/false, type questions + results)
    ├── import.js       # photo import modal, Gemini + OpenRouter API calls
    └── app.js          # utilities (shuffle, escHtml, debounce), menu, theme, boot
```

Plain script tags, no bundler, no ES modules — all variables and functions are global.

---

## Data storage

All progress and custom sets are stored in **`localStorage`** under these keys:

| Key | Contents |
|-----|----------|
| `kf_custom_sets` | JSON array of user-created sets |
| `<setId>_swipe` | Swipe deck / review / known state |
| `<setId>_type` | Type deck / review / known state |
| `<setId>_learned` | Manually marked learned words |
| `kf_theme` | `"light"` or `"dark"` |
| `gemini_api_key` | Gemini API key for photo import |
| `openrouter_api_key` | OpenRouter API key for photo import |
| `openrouter_model` | OpenRouter model ID |
| `import_provider` | Last-used photo import provider |

---

## Stack

HTML · CSS · Vanilla JS · [GSAP 3](https://gsap.com) · [Noto Serif KR](https://fonts.google.com/noto/specimen/Noto+Serif+KR) · [Space Mono](https://fonts.google.com/specimen/Space+Mono) · [Inter](https://fonts.google.com/specimen/Inter)
