# Bug report log

Newest first. Run `python tests/run_tests.py` after every change (see the README).

## 2026-11-03 — Monster data check (all 503 entries) ✅ done, no need to repeat

Every entry in `monsters.json` (Monster Manual 2024 import) was checked once, systematically, by `tools/check_monsters.py` plus the app's own highlighter:
- **Stats:** CR, AC, ability scores, HP vs hit dice average, hit dice vs Con modifier: all 503 correct.
- **Dice in text:** all 1,192 dice expressions are written with standard characters (no en/em dashes, minus signs, `ld8`, `1 d8` or broken brackets), every `N (XdY + Z)` average matches its dice, and the app highlights 1,192 / 1,192.
- **Spell links:** 786 spell names in casting entries link to the Rules tab.
- **Text:** checked for stray OCR characters, joined words, doubled words, unbalanced brackets, cut-off entries, accented letters, attack/save/senses/speed formats and spelling (dictionary + D&D word list). **62 fixes** applied, e.g. misread "fly" in 11 speed lines (`ih 80 ft.` → `fly 80 ft.`), `can it ioe a use` → `can expend a use` (Demilich), `Wisdorr` → `Wisdom` (Kenku), `ona` → `on a` (10×), `lgnan` → `Ignan`, `reach 5 feet` → `reach 5 ft.`, stray `]`, `<a`, `’`.
- **Confirmed from the book by Andrew** and fixed: Ettercap Passive Perception 13; Nightmare `60 ft., fly 90 ft. (hover)`; Primeval Owlbear `40 ft., climb 40 ft., fly 5 ft.`; Vampire Umbral Lord `40 ft., climb 40 ft., fly 40 ft. (hover)`. The checker now reports 0 items.
- **Page-break losses** (found after Andrew spotted the Vampire Umbral Lord): Vampire Umbral Lord's right column was missing (Hunger of Hadar, Sanguine Drain, legendary actions) and was added from a photo of the book; Ancient Silver Dragon was missing its Legendary Action Uses line; Wererat's Hand Crossbow was merged into Scratch and has been split. The checker now also looks for actions a Multiattack names but that are missing, merged entries and missing Legendary Action Uses.
- **Added from book photos:** Arcanaloth (Banishing Claw, Fiendish Burst, Spellcasting, Teleport, Counterspell), Abominable Yeti (Ice Throw, Chilling Gaze, Cold Breath), Blob of Annihilation (Restraining Glob, legendary actions); Erinyes Multiattack corrected to Withering Sword. Balor and Pit Fiend confirmed: no legendary actions. Checker reports 0 items.
- Re-run `python tools/check_monsters.py` only after importing new or changed monster data.

## 2026-11-03 (evening) — iPad test feedback

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 14 | Phone: Next button squeezed during combat, Clear pushed off-screen at 360 px | Too many toolbar buttons on one line | Table view hidden on phones; Clear hidden on phones during combat (End combat first); buttons keep their size and wrap if needed |
| 13 | Phone: Close button off-screen when the Edit tab is shown | Six drawer tabs at fixed width | Tabs shrink to fit; Close becomes ✕ on phones |
| 12 | Initiative token labels ("UP NOW", "NEXT") clipped at the bottom | Label height smaller than its line height | Label height matches line height |
| 11 | "Up: Githzerai Monk 1" on a group token overlapped the initiative number | Long label wrapped onto a second line | Label is one line and shows the member number ("Up: #1") |
| 10 | Modified AC in the table shield (e.g. 21 with 16 struck through) was cramped | Two numbers in a small shield | Shield shows only the current AC (green if raised, red if lowered); base AC stays in the tooltip. Initiative tokens keep the struck-through base |

## 2026-11-03 — XP, End combat, Rules tab

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 9 | XP bar fill was invisible | Its class `bar` clashed with the round bar's styles | Renamed to `xbar` |
| 8 | Tapping a filter dropdown in the drawer could re-render the drawer and close the dropdown | Clicks on `<select>` fell through to the drawer's re-render | Clicks on dropdowns are ignored; changes are handled on `change` |

Added: encounter XP bar (planning only), End combat, player Level field, Rules tab with local SRD 5.2 spells and conditions. Test battery now 41 tests, all passing.

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
