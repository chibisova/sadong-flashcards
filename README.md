# Korean Flashcards

> A minimal, offline Korean vocabulary trainer.

---

## Features

### Practice modes
| Mode | How it works |
|------|-------------|
| **🃏 Swipe** | Flip card to reveal Korean → swipe right *(got it)* or left *(review again)* |
| **⌨️ Type** | See English prompt → type the Korean word → instant feedback |

Both modes share a review queue: missed words cycle back up to 5 times before new words appear.  
Type mode requires **2 correct answers in a row** to mark a word learned.

### Sets
- **Built-in 사동 set** — 27 causative verb pairs with example phrases (끓이다, 먹이다, 살리다 …)
- **Custom sets** — create, edit, delete your own word lists, persisted in `localStorage`
- Per-set progress bar (average of swipe + type completion)

### NIKL dictionary lookup
When adding words to a custom set, typing a Korean word queries the **NIKL Korean–English Dictionary** (48 000+ entries). Matching entries appear inline with:
- Part of speech + difficulty level (초급 / 중급 / 고급)
- English definition
- Korean definition
- Sample sentence from the corpus

Click any suggestion to auto-fill the definition and example sentence fields.

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
├── index.html        # entire app — HTML + CSS + JS
└── nikl_lookup.js    # pre-built NIKL dictionary index (window.NIKL_DATA)
```


---

## Data storage

All progress and custom sets are stored in **`localStorage`** under these keys:

| Key | Contents |
|-----|----------|
| `kf_custom_sets` | JSON array of user-created sets |
| `<setId>_swipe` | Swipe deck / review / known state |
| `<setId>_type` | Type deck / review / known state |
| `kf_theme` | `"light"` or `"dark"` |

---

## Stack

HTML · CSS · Vanilla JS · [Noto Serif KR](https://fonts.google.com/noto/specimen/Noto+Serif+KR) · [Space Mono](https://fonts.google.com/specimen/Space+Mono) · [Inter](https://fonts.google.com/specimen/Inter)
