# Bug report log

Newest first. Run `python tests/run_tests.py` after every change (see the README).

## 2026-11-02 — off-turn info

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 7 | Show/Hide on the turn card did nothing on a player's turn | Player cards had no collapsible content, so the toggle changed nothing | Player cards now have a body (DCs, saves, defences, traits); the button reads Show/Hide details and only appears when there is something to hide |

Added: current AC on rows and tokens (base AC set via Edit), reaction tracking, passive Perception, status save effects, player save DCs. Later the same day: legendary action/resistance pips with an In lair switch and turn-card reminders; short effects (Shield, Dodge, Guiding Bolt and others) now expire automatically; start/end-of-turn effect reminders. Removed the duplicated save-effect tags from rows (the Saves view already shows them). Then: concentration statuses linked to their caster and removed together when concentration ends; In lair saved with prepared encounters. Test battery now 39 tests, all passing.

## 2026-11-01 — pre-live-test polish

### Test battery (tests/run_tests.py, now 35 tests)
First run: 24/30. No app bugs were found; the failures were in the test harness:
- Monster images (`img/*.webp`) are kept locally and are not in the repo, so their 404s were counted as errors. The harness now ignores `/img/` 404s. The app already hides missing images.
- On a phone (390 px) the open drawer covers the whole screen, so the action pad is behind it until the drawer is closed. This is the intended phone layout, so the test now closes the drawer first at phone width.
- Edge-case tests were added (dead monsters, all-dead turns, effects in the selection, players removed from the party library, old save files, Petrified, amount 0, removing the only creature). All passed.

### Improvements after review (all tested)
Undo (one step), concentration save reminders, rule text only on selected rows, rare pad actions behind More, and start buttons on the empty screen.

### Final run
35/35 passed on two consecutive runs (no flaky tests), no console errors at six screen sizes (phone to desktop), and the Python code is pyflakes-clean.

### Fixed this session
| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 6 | Saves on a hand-made player's stat block showed "+null" for blank scores | Missing scores weren't handled | Shows "?" |
| 5 | On the player edit page, filled ability boxes sat lower than empty ones | The modifier label wrapped onto its own line | Label and modifier on one line |
| 4 | Status menu Apply button hidden behind the open stat block (laptop, iPad) | The menu opened into the drawer area, and its top could run off-screen | Menu fits left of the drawer, height capped with a pinned header; on narrow screens the pad comes in front while the menu is open. On small laptops the menu can still cover part of the stat block |
| 3 | No estimated HP for "Cleric, Forge Domain - 2" and "Fighter, Rune Knight - 3" | The class parser split on commas, leaving the class without a level | A class name starts a block; subclass and level are read from that block |
| 2 | A Kanka update didn't refresh hand-set HP even after a level-up elsewhere | Hand-set HP always won | Differences are shown with "Use Kanka HP" (per player or all) |
| 1 | Player saves didn't show in the Saves view | Only monsters were supported | Players use Kanka or hand-entered saves |

### Known limits (not bugs)
- Traits only cover features that change saves or damage taken. A draconic sorcerer's element needs a Kanka `Resistances` property.
- A Kanka update replaces ability scores and saves (Kanka is treated as the source of truth); hand-added defences are kept.
- To do before v1.0: move the Monster Manual data out of the public `monsters.json`.
