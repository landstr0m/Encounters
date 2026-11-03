# Roadmap and goal tracker

Status: ✅ done · 🔨 in progress · 📋 planned · 💡 idea

## Stage 1: table-ready tracker (alpha → v1.0)

| Goal | Status | Notes |
|---|---|---|
| Initiative, HP, AC, conditions, death saves, Undo | ✅ | |
| Damage types, resistances/immunities, concentration, legendary/lair, reactions | ✅ | |
| Kanka player sync (GitHub Action) | ✅ | |
| Monster Manual 2024 import (local) | ✅ | Move MM data out of the public `monsters.json` before v1.0 |
| Encounter XP / difficulty while planning | ✅ | 2024 DMG budgets; hidden while combat runs |
| End combat without clearing | ✅ | Keeps creatures, HP and statuses |
| Rules tab: SRD 5.2 spells + full condition text, offline | ✅ | `reference.json`, built by `tools/build_reference.py` |
| Effects with damage/save/status | ✅ | First version, see below |
| Phone layout for building encounters; party list search, pinned Add button, delete all | ✅ | |
| Controlled live table test | 📋 | Next |
| v1.0 | 📋 | After the live test |

## Stage 2: planned features

### Effects that act on the board (✅ first version)
Effects can carry damage dice (rolled at the table), a damage type, a save (ability + DC) and a status with a duration (normal, 1 round, or to the end of the target's next turn). On the effect's turn, **Apply…** opens the Saves view on that ability and preloads the pad: select targets, type the roll, **Damage** = failed save (damage + status), **Half** = saved (no status), **+ Status** = status only.
Still open (📋): saved target lists, "after N rounds" durations. (Prepared encounters already keep the payload.)

### Encounter difficulty extensions (💡)
- CR / XP for effects and hazards, counted in the encounter XP.
- Lair XP (2024 stat blocks list a higher XP in lair).
- "Rounds to defeat" estimate from party damage, as a second balance check.

### Reference extensions (💡)
- Tap a spell status chip (Bless, Hex…) to open its spell entry.
- Monster spellcasting lines linked to spell entries.
- Player spell lists (needs a spell list per character, e.g. a Kanka property).

### Data and edition (📋)
- Local monster images (kept out of the repo).
- 2014 (5.1) edition toggle.

## Stage 3: network features (📋, deliberately postponed)
Kept out until the offline app is stable at the table.
- **Cross-device table view** through a free realtime service (today: same browser only).
- **Cloud backup / sync** of app state (today: manual Export/Import).
- **D&D Beyond public-character import from a link.** Unofficial: D&D Beyond has no public API and the character JSON can change without warning. Only public characters, no credentials. Would run like the Kanka flow (GitHub Action writes `players.json`). Using a login cookie for purchased content is not planned: fragile and an account risk.

## Later ideas (from the original plan)
- MCP server / voice input at the table, with an at-a-glance status.
- Scene and encounter library; tracking which scenes land well.
- Kanka articles/reports after the session (on confirmation).
- Lights (Lumi?) and music (Pocket Bard) on scene changes.

## Comparison with other tools (Nov 2026)

Strengths: rules automation (damage types, concentration links, auto-expiring effects, condition immunities, Undo) goes beyond Improved Initiative, Shieldmaiden and D&D Beyond's tracker.

Gaps vs others: cross-device player view, cloud sync, dice roller (deliberately absent; dice are physical), maps (out of scope).

DM pain points covered: tracking HP, conditions and durations; forgotten triggers; book flipping (stat blocks, conditions, spells). Not yet covered: players not ready on their turn (an "on deck" line in the table view could help), boring or HP-heavy monsters (balance tools above).
