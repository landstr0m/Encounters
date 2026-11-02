# Encounters

A lightweight, browser-based D&D 5e encounter tracker for running combat at the table. It is a static single-page app with no server, no build step and no dependencies. Everything is saved in the browser (`localStorage`), and it works offline as an installable PWA.

Player characters can be synced from a [Kanka](https://kanka.io) campaign through a GitHub Action.

## Features

**Combat flow**
- Initiative order with round and turn tracking. A sticky turn card shows the current creature's attacks, statuses and death saves.
- A compact combat table: tap rows to select one or more combatants. Status chips stay small; their rule text appears on selected rows and on the turn card.
- A bottom action pad with a number wheel to apply damage, healing, temp HP or statuses to the selection. Rarely used actions (Max HP −, Reset max, Group) sit behind **More**.
- **Undo** (↶ next to Next turn) reverses the last damage, heal, status change, death save, removal, turn change or Clear.
- **Concentration reminders:** when a Concentrating creature takes damage, a note gives the Con save DC (half the damage, min 10, max 30). At 0 HP, Concentrating is removed automatically.
- **Damage types:** pick a type (fire, cold, …) before Damage or Half. Each target takes the right amount: halved if it resists (round down), 0 if immune, doubled if vulnerable. Monster defences come from their stat blocks, player defences from Kanka; Raging and Petrified add their resistances. A note shows what each target took.
- AC, HP, temp HP and death saves (with stable/dead handling). Remove, revive and edit combatants in place.
- Off-turn info on every row and initiative token: **current AC** (base AC struck through when cover, Shield, Haste etc. change it; tap the AC or ✎ Edit to set base AC), a **reaction** button (tap when used, resets on that creature's turn, shown as "No reactions" while Incapacitated, Slowed, Confused etc.; applying Shield marks it used) and passive Perception (👁). Selected rows also list resistances and immunities.
- **Legendary monsters** show diamond pips on their row: LA (legendary actions, refill at the start of its turn) and LR (Legendary Resistance, per encounter). Tap a filled pip to spend, an empty one to restore. **In lair** on the monster's group header switches to the lair counts. After each other creature's turn the turn card reminds you of unused legendary actions, with the action names and a **Use one** button (× dismisses it for that turn).
- **Short effects end by themselves** (a toast says what ended; Undo reverses it): Shield, Dodge, Reckless Attack and Shocking Grasp at the start of the creature's next turn; Vicious Mockery, Frostbite, Command and Lethargic at the end of its next turn; Ray of Frost, Stunning Strike (saved) and Open Hand at the start of the applier's next turn; Guiding Bolt, Chill Touch, Starry Wisp and Mind Sliver at the end of the applier's next turn. "Applier" is whoever's turn it was when you added the status.
- The turn card also flags **start-of-turn effects** (Burning, Searing Smite, Ensnared, Heroism, Spirit Guardians) and **end-of-turn saves** (Slow, Hideous Laughter and similar).
- On a player's turn the card shows their **save DCs** (8 + proficiency + ability) and spell attack bonus, one line per class for multiclass characters (spellcasters, Eldritch Knight, Arcane Trickster, Battle Master, Rune Knight, Monk, Rogue Cunning Strike), plus saves, defences, passive Perception and traits. **Show/Hide details** collapses this. A DC can be set by hand on the character sheet (blank = auto).

**Monsters**
- A built-in SRD 5.2 monster library (`monsters.json`) with full stat blocks in the drawer.
- Add several at once. Grouped monsters share initiative and can be selected and managed in bulk.
- Per-creature edits (✎): extra actions, traits or notes, which can be copied to every creature of the same type.
- Import your own monster JSON files. They are kept on the device and merged with the SRD data, overriding entries with the same id.

**Players**
- A reusable party library. Tick who is at the table and add them in one go.
- Add characters by hand with just a name (`Thorn`); AC and HP default to 10. You can also type `Thorn, AC 15, HP 28, init +3`. Then use ✎ Edit on the player in the tracker to fill in the character sheet: ability scores (modifiers are calculated), save proficiencies and proficiency bonus (saves are recalculated), resistances, immunities, vulnerabilities and condition immunities. These, and AC and Max HP changed on that page, are saved with the character for future sessions. Current HP stays with the encounter.
- **Update from Kanka** loads `players.json`. It fills name, class and subclass, species, ability scores, initiative modifier, passive Perception, saving throws, resistances and species/class traits. Tap ⓘ on a player to see this as a stat block, including how the class text was read. Max HP is auto-filled with the estimate (see below). If a hand-set HP differs from the latest Kanka estimate (for example after a level-up in another game), the party list shows both values with a **Use Kanka HP** button, plus a **Use Kanka HP for all** button. AC still has to be entered (`Name, AC 16`).

**Statuses and saving throws**
- Conditions and spell or class effects (Hasted, Slowed, Raging, cover, Bless, Sleep and others) with rule text. Mechanical effects such as AC, speed and save modifiers are applied automatically.
- **Condition immunities:** applying a status to a group skips creatures immune to it (from monster stat blocks and player traits) and lists who was skipped. Spell statuses count the condition they impose: Hypnotic Pattern = Charmed, Fear and Turn Undead = Frightened, Stinking Cloud = Poisoned, Sleep = Exhaustion or Unconscious.
- The **Saves** button shows one chosen saving throw for every combatant, players and monsters alike. Shaded means proficient. Statuses and species traits add notes such as `adv.`, `+2` or `auto-fail`. Player saves need Kanka data.

**Encounter prep and table view**
- Effects: lair actions, hazards or timers placed at a fixed initiative, either visible to players or hidden.
- An environment banner for terrain, light or weather.
- Prepared encounters: save a built encounter with notes, then **Load** it (replaces the monsters and keeps the players) or **Add** it as reinforcements.
- A separate read-only table window for a second screen, with options for what players can see.
- Export and import the whole app state (encounter, saved encounters, party, settings) as JSON.

## Kanka player sync

`tools/kanka_players.py` uses only the Python standard library. It reads the player characters of the Blackrock campaign (`CAMPAIGN` at the top of the script) and writes `players.json`.

- The class field is read leniently: `Cleric, Forge Domain - 2`, `Fighter, Runemaster - 3`, `College of Glamour Bard - 3` and `Fighter 3 / Wizard 2` all work. Each class name starts a block, and the subclass and level are taken from that block. Anything not understood is printed in the workflow log and shown on the player's stat block.
- Ability scores and modifiers come from Kanka. Saving throws listed in Kanka are used as-is. If none are listed, proficiencies are inferred from the first class (plus proficiency bonus by level).
- Species and class/subclass features that affect saves or damage are added as traits: for example Gnomish Cunning, Dwarven Resilience, Dual Mind, Fey Ancestry, Soul of the Forge and Heart of the Storm. The tables are at the top of the script and are easy to extend.
- **Estimated HP** (`hpEst`) uses the class hit die: max at level 1, average after that, plus the Con modifier per level. It ignores HP bonuses from feats or species (such as Tough), so override HP by hand where needed.
- To add resistances from feats, items or choices the script can't know (such as a draconic damage type), give the character a Kanka property `Resistances`, `Immunities` or `Vulnerabilities` (comma-separated).

To update, open **Actions → Update players from Kanka → Run workflow** on GitHub. The workflow needs a repository secret `KANKA_API_KEY` and commits `players.json` only if it changed. Then press **Update from Kanka** in the app's party tab.

To run it locally:

```bash
KANKA_TOKEN=your_token python tools/kanka_players.py
```

## Testing

`tests/run_tests.py` is a browser test battery (Playwright, about 35 tests). It covers combat flow, damage and death saves, typed damage, statuses and immunities, saves, groups, editing, the party library and Kanka import, prepared encounters, export/import, persistence, the table window, homebrew monster files, and layouts from phone to desktop. Run it before pushing changes:

```bash
pip install playwright && playwright install chromium
python tests/run_tests.py            # all tests
python tests/run_tests.py typed undo # only tests whose names contain these words
```

Bugs found and fixed are logged in `BUGS.md`.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | The whole app: UI, styles and logic |
| `statuses.js` | Condition and status definitions with their mechanics |
| `monsters.json` | Built-in SRD 5.2 monster data |
| `players.json` | Player characters generated from Kanka |
| `tools/kanka_players.py` | Kanka → `players.json` script |
| `.github/workflows/kanka-players.yml` | Manual GitHub Action that runs the script and commits the result |
| `tests/run_tests.py` | Browser test battery |
| `BUGS.md` | Bug report log |
| `sw.js` | Service worker for offline caching (bump `CACHE` when you publish changes) |
| `manifest.webmanifest`, `icon-*.png`, `fonts.css` | PWA metadata, icons and fonts |

## Running it

Serve the folder with any static server so that `fetch` works for the JSON files:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

It can also be hosted as-is on GitHub Pages. Opening `index.html` directly from disk works for most things, but the browser may block loading the JSON files.

## Data and licence

Monster data and rules references are based on the SRD 5.2, embedded for offline use. App data stays in your browser on the current device. Export it before and after each session as a backup.
