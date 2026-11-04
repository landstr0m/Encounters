# Encounters

A lightweight, browser-based D&D 5e (2024 rules) encounter tracker for running combat at an in-person table. It is a static single-page app with no server, no build step and no dependencies. Everything is saved in the browser (`localStorage`), and it works offline as an installable app.

Live at **https://landstr0m.io/Encounters/** (GitHub Pages). Dice are rolled at the table; the app tracks everything else.

## Install

- **iPad / iPhone:** open the page in Safari → Share → **Add to Home Screen**. (iOS never shows an install prompt.)
- **Android:** accept the install prompt, or browser menu → Install app.
- **Laptop:** Chrome or Edge → install icon at the right of the address bar.

After an update, open the app once while online, then close and reopen it to get the new version.

## How to run a session

**1. Before the session: the party**
1. Open **＋ Add → Party**.
2. Press **Update from Kanka** to load the player characters (see *Kanka player sync*), or type a character by hand: `Thorn, AC 15, HP 28, init +3, lvl 2`. Only the name is required.
3. Use the search box to find who is playing, tick them, and press **Add N ticked** (pinned at the bottom).
4. Ask each player for their AC (and Max HP if the Kanka estimate is wrong) and set it with ✎ on their row, or type `Name, AC 16` in the party tab.

**2. Build the encounter**
1. **＋ Add → Monsters**: search, filter by type and CR, set a quantity and press **Add**. Choose *Roll each* or *One per group* initiative and *Roll HD* or *Average* hit points first.
2. Watch **This encounter** at the top of the drawer (XP and difficulty, monsters × count; − removes one) and the **Encounter XP** bar above the table.
3. Optional: **Effects** for lair actions, hazards or timers at a fixed initiative, with optional damage, save and status (see *Effects*).
4. Optional: save it as a **prepared encounter** (Data tab) to load in a later session.

**3. Run combat**
1. Type each player's initiative roll into their row, then press **Start combat**. **Next turn ▸** moves on; **↶ Undo** reverses the last change.
2. The **turn card** shows the current creature's attacks (dice to roll are highlighted), statuses, reminders and death saves. Tap a spell or condition name to read its rule.
3. **Tap rows to select** creatures, then use the **action pad**: spin or type the amount, pick a damage type if it matters, and press **Damage**, **Half**, **Heal**, **Temp HP** or **Status ▾**.
4. **Saves** shows one saving throw for everyone (useful before a Fireball).
5. **■ End combat** stops the turn order but keeps creatures, HP and statuses. **Clear** (two taps) empties the tracker.

**4. Players' screen (optional)**
- **Table view** (toolbar) switches this screen to what players see: no stat blocks, DM notes or hidden effects.
- **Data → Open table window** opens a separate read-only window to drag onto a second screen or TV; it updates live. This only works in the same browser on the same device for now (cross-device sync is planned).

**5. After the session**
**Data → Export** saves everything (encounter, prepared encounters, party, settings) as a file. Do this before and after each session as a backup.

## Feature reference

**Combat**
- Initiative order with rounds and turns. Groups of the same monster can share initiative and be selected together (**Select all** on the group header).
- **Undo** (one step) covers damage, healing, statuses, death saves, removals, turn changes, End combat and Clear.
- **Damage types:** halved if the target resists (round down), 0 if immune, doubled if vulnerable. Monster defences come from their stat blocks, player defences from Kanka or the character sheet. Raging and Petrified add their resistances. A note shows what each target took.
- **Concentration:** damage to a Concentrating creature shows the Con save DC. A concentration spell status (Bless, Haste, Hex, Spirit Guardians…) added on someone's turn is linked to that caster; when their concentration ends, every linked status ends too (Haste ending adds Lethargic).
- **Short effects end by themselves** (Shield, Dodge, Vicious Mockery, Guiding Bolt, Ray of Frost and others), with a toast and Undo.
- **AC** is shown in a shield on each row: green when raised (Shield, cover, Haste), red when lowered (Slow). Initiative tokens and the turn card also show the base AC struck through. Tap the shield to set base AC.
- **Reactions:** tap "Reaction ready" when used; it resets on that creature's turn. Shown as "No reactions" while Incapacitated, Slowed etc.
- **Legendary monsters:** LA and LR pips on the row; **In lair** on the group header switches to lair counts; the turn card reminds you of unused legendary actions after other creatures' turns.
- **Turn-card reminders** for start-of-turn effects (Burning, Spirit Guardians…) and end-of-turn saves (Slow, Hideous Laughter…).
- **Players' turn card:** save DCs and spell attack per class, saves, defences, passive Perception, traits.
- **Max HP −** (under More on the pad) for effects like a spectre's Life Drain; **Reset max** undoes it.

**Statuses and saves**
- The 15 conditions plus spell and class effects (Bless, Haste, Slow, Raging, cover, Hex…), with rule text. AC, speed and save modifiers apply automatically. Paralyzed, Stunned etc. add Incapacitated.
- Creatures immune to a condition are skipped (and listed) when you apply it to a group.
- **Saves** view: shaded = proficient; notes such as `adv.`, `+d4` or `auto-fail` come from statuses and traits.

**Effects (lair actions, hazards, timers)**
- **＋ Add → Effects:** name, initiative, a note for you, and whether players see it.
- Optional payload: damage dice as a reminder (e.g. `2d6`), damage type, save (ability + DC), and a status lasting its normal duration, 1 round, or to the end of the target's next turn.
- On its turn press **Apply…**: the Saves view opens on that ability and the pad is preloaded. Select the targets, type the roll, then **Damage** (failed save: damage + status), **Half** (saved: half, no status) or **+ Status** (status only). **Done** ends it.

**Monsters**
- 503 stat blocks (currently the 2024 Monster Manual, see *Data*). Full stat block in the drawer (ⓘ or **Stat block**).
- Roll tables (Beholder Eye Rays, Umber Hulk Confusing Gaze…) are shown as one row per result, and long entries put Failure / Success on their own lines.
- Dice to roll are highlighted, attack bonuses green, DCs amber, and damage types have their own colour and symbol (🔥 Fire, ❄️ Cold, ⚡ Lightning, 💀 Necrotic…), also in the defences lines and the damage-type pickers. Spell names (blue) and conditions (red, e.g. *Paralyzed*) are links: tap to read the rule, then **◂ Stat block** to go back. Spells missing from the data (see Rules tab) don't link.
- ✎ Edit per creature: name, AC, HP, initiative, extra actions/traits/notes (can be copied to every creature of that type), or a custom group.
- **Data → Monster files:** import your own monster JSON files; they stay on this device and override built-in entries with the same name.

**Players (party library)**
- Search, ticked characters first, **Add N ticked** and **Untick all** pinned at the bottom.
- **Delete all saved characters…** (two taps) empties the library except characters in the current encounter. Export first if you want a backup.
- ✎ Edit → character sheet: ability scores, save proficiencies, proficiency bonus, Level, save DC override, resistances, immunities, vulnerabilities, condition immunities. Saved for future sessions.
- Kanka HP: if a hand-set Max HP differs from the Kanka estimate (e.g. after a level-up in another game), **Use Kanka HP** (or **for all**) takes the estimate.

**Encounter XP (2024 DMG)**
- While combat isn't running, the XP bar shows the living monsters' XP against the party's Low / Moderate / High budget. Player levels come from Kanka, the sheet's **Level** field, or `Name, lvl 3`.

**Rules tab**
- 339 SRD 5.2 spells plus 35 more from the Player's Handbook (`spells-phb.json`), and the full text of the 15 conditions. Search and filter by level and class; works offline. Book names of SRD spells (Melf's Acid Arrow, Bigby's Hand…) are found by search and link from stat blocks. Spell text gets the same dice, damage-type and condition highlighting as stat blocks.
- 16 PHB spells are still missing (OCR too damaged), listed in `spells-phb.json` → `missing`.

**Prepared encounters and notes (Data tab)**
- Save the current monsters and effects with a note; later **Load** (replaces monsters, keeps players) or **Add** (reinforcements). The note shows as a banner above the table. In lair is saved too.

**Screens**
- iPad and laptop: full layout; the drawer opens on the right.
- Phone (≤600 px, or held sideways): two-line rows and an icon toolbar, meant for building encounters on the go. Sideways, the action pad docks on the right. Running combat is best on the iPad or laptop.
- The initiative strip is hidden until combat starts.

## Kanka player sync

`tools/kanka_players.py` (Python standard library only) reads the player characters of the Blackrock campaign (`CAMPAIGN` at the top of the script) and writes `players.json`.

- To update: GitHub → **Actions → Update players from Kanka → Run workflow**, then **Update from Kanka** in the app's party tab. The workflow needs the repository secret `KANKA_API_KEY` and commits `players.json` only if it changed.
- Locally: `KANKA_TOKEN=your_token python tools/kanka_players.py`
- The class field is read leniently (`Cleric, Forge Domain - 2`, `Fighter 3 / Wizard 2`…). Anything not understood is printed in the workflow log and shown on the player's stat block (ⓘ).
- Saving throws listed in Kanka are used as-is; otherwise they are inferred from the first class.
- Species and class features that affect saves or damage become traits (Gnomish Cunning, Dwarven Resilience, Fey Ancestry…). The tables are at the top of the script.
- **Estimated HP** = max hit die at level 1, average after, plus Con per level. Feats like Tough aren't included; override by hand.
- Extra defences: give the character a Kanka property `Resistances`, `Immunities` or `Vulnerabilities` (comma-separated).

## Development

Run locally (needed so the JSON files load):

```bash
python -m http.server 8000      # then open http://localhost:8000
```

Before pushing:

```bash
pip install playwright && playwright install chromium
python tests/run_tests.py            # full browser test battery (46 tests, phone to desktop)
python tests/run_tests.py typed undo # only tests whose names contain these words
python tools/check_monsters.py       # data check after changing monsters.json (see BUGS.md)
```

Then bump `CACHE` in `sw.js` so installed apps pick up the change. Log bugs and fixes in `BUGS.md`; plans live in `ROADMAP.md`. `CLAUDE.md` has the conventions and context for picking the project up again.

| File | Purpose |
|---|---|
| `index.html` | The whole app: styles, then a script in 7 sections (see the code map at the top of the script) |
| `statuses.js` | Rule text shown for each status (edit wording here; mechanics are in `index.html`) |
| `monsters.json` | Monster stat blocks |
| `reference.json` | SRD 5.2 spells and conditions (built by `tools/build_reference.py`) |
| `spells-phb.json` | **Temporary:** Player's Handbook spells not in the SRD, book-name aliases, and the list of spells still missing |
| `players.json` | Player characters from Kanka (written by the workflow) |
| `tools/kanka_players.py` | Kanka → `players.json` |
| `tools/build_reference.py` | open5e-api SRD 5.2 data → `reference.json` |
| `tools/check_monsters.py` | Checks every monster entry (stats, dice, text, spelling); `--fix` normalises dice symbols |
| `.github/workflows/kanka-players.yml` | Manual GitHub Action for the Kanka sync |
| `tests/run_tests.py` | Browser test battery (Playwright) |
| `ROADMAP.md`, `BUGS.md`, `CLAUDE.md` | Goals and plans; bug and data-check log; project conventions |
| `sw.js`, `manifest.webmanifest`, `icon-*.png`, `fonts.css` | Offline cache, install metadata, icons, fonts |

## Data and licence

- Spells, conditions and rules text: SRD 5.2 (CC-BY-4.0), spell data via [open5e-api](https://github.com/open5e/open5e-api).
- `spells-phb.json` **temporarily contains 35 Player's Handbook 2024 spells** (OCR from the owner's epub, checked and corrected), same arrangement as the monsters below.
- `monsters.json` **temporarily contains the 2024 Monster Manual** (imported from the owner's own book for personal use at his table) to make testing easier. Before v1.0 it goes back to SRD-only, and the book data moves to a local file imported on the device (**Data → Monster files**), which is never committed.
- App data stays in your browser on the current device. Export it regularly as a backup.
