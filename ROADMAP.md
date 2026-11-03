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
| Stat blocks: dice/attack/DC highlighting, spell and condition names linked to the Rules tab | ✅ | Spells link anywhere in the text; ability names like Fear Ray or Bright Light are excluded |
| Monster data check (all 503 entries) | ✅ | 3 Nov 2026, see BUGS.md; `tools/check_monsters.py` |
| Code map, CLAUDE.md, README how-to | ✅ | |
| Controlled live table test | 📋 | Next |
| v1.0 | 📋 | After the live test; see checklist below |

### Before v1.0 (checklist)
- [ ] Live table test on the iPad; log findings in BUGS.md
- [ ] `monsters.json` back to SRD-only; Monster Manual data as a local file (Data → Monster files)
- [x] Book checks flagged by the data check (confirmed and fixed 3 Nov)
- [ ] Player's Handbook spells as a local file (needs a spell import in the app, see Reference extensions)

## Stage 2: planned features

### Effects that act on the board (✅ first version)
Effects can carry damage dice (rolled at the table), a damage type, a save (ability + DC) and a status with a duration (normal, 1 round, or to the end of the target's next turn). On the effect's turn, **Apply…** opens the Saves view on that ability and preloads the pad: select targets, type the roll, **Damage** = failed save (damage + status), **Half** = saved (no status), **+ Status** = status only.
Still open (📋): saved target lists, "after N rounds" durations. (Prepared encounters already keep the payload.)

### Encounter difficulty extensions (💡)
- CR / XP for effects and hazards, counted in the encounter XP.
- Lair XP (2024 stat blocks list a higher XP in lair).
- "Rounds to defeat" estimate from party damage, as a second balance check.

### Reference extensions
- 📋 **Player's Handbook spells (local):** Andrew provides the PHB 2024 spell chapter (text PDF); a local parser (like the Monster Manual one) writes a spell file that is loaded on the device via Data, merged with `reference.json`, never committed. Needs: the parser, and a "spell file" import in the Data tab. Then non-SRD monster spells (Synaptic Static, Destructive Wave…) link too.
- 💡 Tap a spell status chip (Bless, Hex…) to open its spell entry.
- 💡 Player spell lists (needs a spell list per character, e.g. a Kanka property).

### Character library (📋)
The party list should become a source-independent library (Kanka may not stay the main source; D&D Beyond or another character builder may be added).
- Groups / tags (e.g. "Blackrock regulars", "guest players") and filtering the list by group.
- Import from several sources into the same library, with the source shown per character.
- Keep the library small: it is for session planning, not an archive. Export covers backups.
- Done: search, ticked first, pinned Add button, Delete all (keeps characters in the current encounter, hand-made included).

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

## Comparison with other tools (re-scored 3 Nov 2026)

Score 0–5 for Encounters against popular trackers (D&D Beyond Maps/Encounter Builder, Improved Initiative, Shieldmaiden, Kobold+ Fight Club). "Before" = score at the first review (3 Nov, morning); – = not scored then.

| Feature | Before | Now | Notes |
|---|---|---|---|
| Initiative, rounds, turn card | 5 | 5 | Dice to roll highlighted; spell links |
| Batch damage/heal/temp HP + Undo | 5 | 5 | Undo also covers End combat |
| Damage types (resist/immune/vulnerable) | 5 | 5 | |
| Conditions with rule text + auto-effects | 5 | 5 | Full 2024 condition text in Rules |
| Concentration links, auto-expiry | 5 | 5 | Effects can now apply timed statuses |
| Legendary/lair, reactions | 5 | 5 | |
| Saves view, player DCs | 4 | 4 | Player saves still need Kanka or sheet data |
| Monster library + homebrew import | 4 | 4 | No 2014 toggle |
| Prepared encounters / reinforcements | 4 | 4 | |
| Encounter difficulty / XP budget | 0 | 4 | Live XP bar + drawer summary; no lair XP or hazard CR yet |
| Spell / rules lookup | 1 | 4 | SRD 5.2 spells and conditions offline, linked from stat blocks; PHB spells pending |
| Lair actions / hazards that act | – | 4 | Damage, save and timed status from effects |
| Building encounters on a phone | – | 4 | Phone layout and pinned drawer summary |
| Party library management | – | 3 | Search, pinned add, delete all; groups/tags planned |
| Player view on another device | 2 | 2 | Same browser only (network stage) |
| Cross-device sync / cloud save | 0 | 0 | Manual Export/Import (network stage) |
| Character import | 3 | 3 | Kanka; D&D Beyond public link planned |
| Dice roller | 0 | n/a | Deliberately absent: dice are physical |
| Maps / tokens | 0 | n/a | Out of scope for in-person play |
| Voice input | 0 | 0 | Long-term goal; no competitor has it |

DM pain points: tracking HP, conditions and durations ✅; forgotten triggers ✅; book flipping ✅ (stat blocks, conditions, spells; PHB spells pending); balancing encounters ✅ (XP), improving further with hazard CR and lair XP; players not ready on their turn ❌ (idea: an "on deck" line in the table view); slow setup ✅ (party library, prepared encounters).
