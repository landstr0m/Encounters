# Project context for future sessions

**What this is:** Andrew's D&D 5e (2024 rules) encounter tracker for his in-person Blackrock campaign (west-marches style: different players and characters each session, one-shot sessions, 6ish players at levels 1–3). Combat runs on an iPad or laptop; phones are only for building encounters. Dice are rolled physically at the table, so the app never rolls attacks or damage (only optional monster HP/initiative).

**Long-term direction:** this started as a project to learn MCP. The tracker is stage 1; later stages (MCP server, voice input, Kanka reports, lights/music) are in `ROADMAP.md`.

## Conventions
- **Keep it small:** few simple files, no build step, no frameworks, no npm. `index.html` holds all UI and logic (code map at the top of its script).
- **Workflow:** Claude pushes straight to `main`; Andrew reviews on GitHub and tests on the iPad. For quick local edits he pulls and runs `python -m http.server 8000`.
- **Every change:** run `python tests/run_tests.py` (all must pass), add a test for new features, bump `CACHE` in `sw.js`, log bugs in `BUGS.md`, tick goals in `ROADMAP.md`, keep `README.md` usage instructions current.
- **Data changes:** run `python tools/check_monsters.py` after editing `monsters.json`; it should report only known items.
- **Replies to Andrew:** short. He has a limited token budget. Ask before design choices that aren't obvious.
- **Rules wording:** use 2024 (SRD 5.2) terms and condition names.

## Data and licensing (important)
- `monsters.json` **temporarily holds the 2024 Monster Manual** (Andrew's own book, parsed locally for personal use). Before v1.0: restore SRD-only data in the public repo and load the book data as a local file via Data → Monster files. Never commit book text otherwise (`.gitignore` has `local/`, `*.local.json`, `img/`).
- `reference.json` is SRD 5.2 only (CC-BY-4.0). `spells-phb.json` **temporarily** holds Player's Handbook spells not in the SRD (Andrew's epub, OCR-cleaned) plus book-name aliases; before v1.0 it moves to a local file too. Merged in `refLoad()`.
- `dndbeyond.json` is written by the D&D Beyond Action from `dndbeyond.txt` (public sheets only, no login). Status names: internal keys stay fixed for saved data; shown names are in `NAME` in `index.html`.
- `players.json` is written by the Kanka GitHub Action (secret `KANKA_API_KEY`). Kanka may not stay the main source, so treat the party library as source-independent.

## Where things are
- State: `S` (saved, exported) and `ui` (screen only). `save()` persists; `renderBoard()` / `renderDrawer()` redraw.
- Buttons: `data-act="..."` handled by one click listener per area (search `act==='name'`).
- Status mechanics: `SPELLS` table and `EXP` (auto-expiry) in `index.html`; status wording in `statuses.js`.
- Undo: `snap(label)` before a change.
- Tests inject `window.__e` to evaluate code inside the app (see `tests/run_tests.py`).
