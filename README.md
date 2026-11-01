# Encounters

A lightweight, browser-based D&D 5e encounter tracker for running combat at the table. It is a static single-page app with no server, no build step and no dependencies. Everything is saved in the browser (`localStorage`), and it works offline as an installable PWA.

Player characters can be synced from a [Kanka](https://kanka.io) campaign through a GitHub Action.

## Features

**Combat flow**
- Initiative order with round and turn tracking. A sticky turn card shows the current creature's attacks, statuses and death saves.
- A compact combat table: tap rows to select one or more combatants.
- A bottom action pad with a number wheel to apply damage, healing, temp HP or statuses to the selection.
- AC, HP, temp HP and death saves (with stable/dead handling). Remove, revive and edit combatants in place.

**Monsters**
- A built-in SRD 5.2 monster library (`monsters.json`) with full stat blocks in the drawer.
- Add several at once. Grouped monsters share initiative and can be selected and managed in bulk.
- Per-creature edits (✎): extra actions, traits or notes, which can be copied to every creature of the same type.
- Import your own monster JSON files. They are kept on the device and merged with the SRD data, overriding entries with the same id.

**Players**
- A reusable party library. Tick who is at the table and add them in one go.
- Add characters by hand: `Thorn, AC 15, HP 28, init +3`.
- **Update from Kanka** loads `players.json`. It fills name, class, species, ability scores, initiative modifier, passive Perception and saving throws. Max HP is auto-filled with the estimate (see below). HP you type yourself (`Name, HP 30`) is kept on later updates. AC still has to be entered (`Name, AC 16`).

**Statuses and saving throws**
- Conditions and spell or class effects (Hasted, Slowed, Raging, cover, Bless and others) with rule text. Mechanical effects such as AC, speed and save modifiers are applied automatically.
- The **Saves** button shows one chosen saving throw for every combatant, players and monsters alike. Shaded means proficient. Statuses add notes such as `adv.`, `+2` or `auto-fail`. Player saves need Kanka data.

**Encounter prep and table view**
- Effects: lair actions, hazards or timers placed at a fixed initiative, either visible to players or hidden.
- An environment banner for terrain, light or weather.
- Prepared encounters: save a built encounter with notes, then **Load** it (replaces the monsters and keeps the players) or **Add** it as reinforcements.
- A separate read-only table window for a second screen, with options for what players can see.
- Export and import the whole app state (encounter, saved encounters, party, settings) as JSON.

## Kanka player sync

`tools/kanka_players.py` uses only the Python standard library. It reads the player characters of the Blackrock campaign (`CAMPAIGN` at the top of the script) and writes `players.json`.

- Ability scores, modifiers, saving throws and proficiencies come from the character's Kanka attributes.
- **Estimated HP** (`hpEst`) uses the class hit die: max at level 1, average after that, plus the Con modifier per level. It ignores HP bonuses from feats or species (such as Tough), so override HP by hand where needed.
- Damage resistances come from the species. To add class, feat or item resistances, give the character a Kanka property `Resistances`, `Immunities` or `Vulnerabilities` (comma-separated).

To update, open **Actions → Update players from Kanka → Run workflow** on GitHub. The workflow needs a repository secret `KANKA_API_KEY` and commits `players.json` only if it changed. Then press **Update from Kanka** in the app's party tab.

To run it locally:

```bash
KANKA_TOKEN=your_token python tools/kanka_players.py
```

## Project structure

| File | Purpose |
|---|---|
| `index.html` | The whole app: UI, styles and logic |
| `statuses.js` | Condition and status definitions with their mechanics |
| `monsters.json` | Built-in SRD 5.2 monster data |
| `players.json` | Player characters generated from Kanka |
| `tools/kanka_players.py` | Kanka → `players.json` script |
| `.github/workflows/kanka-players.yml` | Manual GitHub Action that runs the script and commits the result |
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
