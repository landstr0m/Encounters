# Roadmap and goal tracker

Status: ✅ done · 🔨 in progress · 📋 planned · 💡 idea. Last reviewed 6 Nov 2026.

## Next steps (start here in a new chat)

1. 📋 **Controlled live table test** on the iPad with the tap-to-use flow (monster turns, legendary bar, player spells, table view line). Log findings in `BUGS.md`, then fix before v1.0.
2. ✅ **Data tab clean-up** (done 6 Nov: one backup file incl. monster files, effect templates, Rules tab renamed Spells & Conditions): group into *Backup* (export / import), *Session* (combat log, table window, prepared encounters) and *Sources* (monster files, spells, Kanka / D&D Beyond), with one line of help each.
3. 📋 **v1.0 checklist** (below): Monster Manual and PHB spells out of the public repo, loaded as local files.
4. Then pick from Stage 2: character library groups, effects "after N rounds", compact stat block, 2014/2024 toggle.

## Stage 1: table-ready tracker (alpha → v1.0)

| Goal | Status | Notes |
|---|---|---|
| Initiative, HP, AC, conditions, death saves, Undo | ✅ | |
| Damage types, resistances/immunities, concentration, legendary/lair, reactions | ✅ | |
| Kanka player sync (GitHub Action) | ✅ | |
| D&D Beyond public character import (GitHub Action), per-field Keep / Use merge | ✅ | Unofficial and fragile; public sheets only |
| Monster Manual 2024 import (local) | ✅ | Move MM data out of the public `monsters.json` before v1.0 |
| Encounter XP / difficulty while planning | ✅ | 2024 DMG budgets; hidden while combat runs |
| End combat without clearing | ✅ | Keeps creatures, HP and statuses |
| Spells & Conditions tab: SRD 5.2 + PHB spells, full condition text, offline | ✅ | `reference.json`, `spells-phb.json` (temporary) |
| Effects (lair actions, hazards) with damage / save / status | ✅ | |
| Action pad: number and type wheels, Half, + Extra, Max HP −, statuses, one Apply | ✅ | Heal / Temp HP / Max HP in the type wheel |
| Status list: General section, spell names, single-condition spells linked, concentration prompts | ✅ | |
| Monster actions parsed (503/503) and shown as tappable cards | ✅ | `tools/check_actions.py` |
| Action economy: actions / bonus / reactions per turn, Multiattack circles, recharge, X/Day per encounter | ✅ | |
| Tap-to-use: targets, hit/miss or failed/saved, preloaded damage, crit, reactions, one Apply | ✅ | |
| Monster spells, legendary actions, grapples through the same flow | ✅ | |
| Player spells against monsters (D&D Beyond spell lists) | ✅ | |
| Table view line (save DC to roll, player damage to write down) | ✅ | |
| Combat log per encounter, downloadable | ✅ | |
| Phone layout for building encounters; iPad/desktop one-line toolbar | ✅ | |
| Code map, CLAUDE.md, README user manual | ✅ | Reviewed 6 Nov 2026 |
| Controlled live table test | 📋 | **Next** |
| v1.0 | 📋 | After the live test; see checklist |

### Before v1.0 (checklist)
- [ ] Live table test on the iPad; log findings in BUGS.md
- [ ] `monsters.json` back to SRD-only; Monster Manual data as a local file (Data → Monster files)
- [ ] `spells-phb.json` out of the public repo; load it as a local file (needs a spell-file import in the Data tab)
- [x] Book checks flagged by the data check (3 Nov)
- [x] Player's Handbook spells (all 51 non-SRD spells)

## Tap-to-use monster actions (mini roadmap A–G) ✅ complete 6 Nov 2026

| Stage | What | Status |
|---|---|---|
| A | Parser: attacks, saves, damage parts, Multiattack, Spellcasting, limits; coverage report | ✅ 503/503 monsters, 307/307 Multiattacks; 17 entries are text-only effects the DM reads |
| B | Cards: limit tags, spell groups, roll tables as sub-cards, two per row | ✅ |
| C | Action economy: Use, hidden used cards, X/Day per encounter (no long rest), Multiattack circles | ✅ |
| D + E | Targeting: chips in the pad, Miss without target, failed/saved per target, preloaded damage, adv/crit reminders | ✅ |
| F | Monster spells (DC, upcast dice, status, concentration), legendary action buttons, grapples linked | ✅ |
| G | Crit toggle, reactions on targets (Shield, Uncanny Dodge, monster reactions), combat log, table view line, player spells | ✅ |

Open follow-ups from A–G:
- 📋 Legendary actions still also listed in the turn card's Traits fold (the between-turns bar is the tappable version).
- ✅ Player spell slots (from class levels, tap to use).
- 💡 Clay Golem's and Aboleth's Multiattack summaries read slightly off (see BUGS.md); the full sentence is shown, so low priority.

## Stage 2: planned features

### Effects
- ✅ Damage, save and timed status; Apply on the effect's turn.
- 📋 Saved target lists, "after N rounds" durations.

### Encounter difficulty extensions (💡)
- CR / XP for effects and hazards, counted in the encounter XP.
- Lair XP (2024 stat blocks list a higher XP in lair).
- "Rounds to defeat" estimate from party damage.

### Reference extensions
- ✅ Status list sorted: General section first, spells the creatures in the encounter can cast listed first, real spell names.
- ✅ Player spell lists (from D&D Beyond).
- 📋 **Player's Handbook spells (local):** parser for Andrew's PHB epub (like the Monster Manual one) and a spell-file import in the Data tab; never committed.
- 💡 Compact stat block setting (Failure / Success inline).
- 💡 Tap a spell status chip (Bless, Hex…) to open its spell entry.

### Character library (📋)
- ✅ Search, ticked first, pinned Add, Delete all; Kanka and D&D Beyond import into one library.
- ✅ Groups / tags (e.g. "Blackrock regulars", "guest players"), filter by group, tick whole group; source shown per character.

### Data and edition (📋)
- Local monster images (kept out of the repo).
- 2014 / 2024 rules toggle with a small variants table.
- 💡 Data files (reviewed 6 Nov 2026): Kanka and D&D Beyond exports share one character shape. Monster actions stay as book text parsed in the app (local Monster Manual files use the same format and need no build step). Possible later: monster saves / resistances / immunities as fields in `monsters.json` (and the local parser) to drop about 15 lines of text matching in `defs()` / `saveOf()`.

## Stage 3: network features (📋, deliberately postponed)
- Cross-device table view through a free realtime service (today: same browser only).
- Cloud backup / sync of app state (today: manual Export / Import).

## Later ideas (from the original plan)
- 💡 Encounters generated from DM notes: an AI writes a prepared-encounter file (documented schema) that the app imports with Load / Add.
- MCP server / voice input at the table, with an at-a-glance status.
- Scene and encounter library; tracking which scenes land well (the combat log is a first data source).
- Kanka articles / reports after the session (the combat log can feed them).
- Lights (Lumi?) and music (Pocket Bard) on scene changes.

## Comparison with other tools (re-scored 6 Nov 2026, afternoon)

Score 0–5 against popular trackers (D&D Beyond Encounter Builder, Improved Initiative, Shieldmaiden, Kobold+ Fight Club). "3 Nov" = previous review; – = not scored then.

| Feature | 3 Nov | Now | Notes |
|---|---|---|---|
| Initiative, rounds, turn card | 5 | 5 | Turn card shows only what the creature can still do |
| Batch damage/heal/temp HP + Undo | 5 | 5 | One Apply for damage, half on save, statuses; Undo covers the whole action |
| Damage types (resist/immune/vulnerable) | 5 | 5 | Two damage types per action, each checked separately |
| Conditions with rule text + auto-effects | 5 | 5 | Single-condition spells linked; save-ends buttons, staged effects (Petrification, Sleep), damage ends Sleep / Hypnotic Pattern |
| Concentration links, auto-expiry | 5 | 5 | Prompt to end concentration when no targets are left |
| Legendary/lair, reactions | 5 | 5 | Legendary actions tappable; reactions flagged on targets |
| Monster actions: tap to use (attack / save / spell) | – | 5 | Preloaded damage, targets, crit, per-target outcome; spells inside other actions, roll-table legendaries (Eye Rays) |
| Player spells (upcast, multi-ray, cantrip scaling, Hex/Mark riders) | – | 5 | Each ray/beam its own pick; per-hit riders default 0 |
| Action economy tracking (multiattack, recharge, X/Day) | – | 5 | |
| Saves view, player DCs | 4 | 5 | DCs from Kanka or D&D Beyond; save bonuses on target chips |
| Monster library + homebrew import | 4 | 4 | No 2014 toggle |
| Prepared encounters / reinforcements | 4 | 4 | |
| Encounter difficulty / XP budget | 4 | 4 | No lair XP or hazard CR yet |
| Spell / rules lookup | 4 | 4 | Tab renamed Spells & Conditions; PHB spells partly; local PHB import pending |
| Lair actions / hazards that act | 4 | 4 | Templates + saved templates; start-of-turn damage one tap. Missing "after N rounds" |
| Building encounters on a phone | 4 | 4 | |
| Party library management | 3 | 4 | Groups/tags, filter, tick a whole group, source per character |
| Character import | 3 | 4 | Kanka + D&D Beyond; links found in Kanka descriptions import automatically (name/class checked) |
| Player view on another device | 2 | 3 | Table view line added; still same browser only |
| Combat log / session record | – | 4 | Per encounter, downloadable; not yet fed into reports |
| Backup / restore | – | 4 | One file with everything incl. monster files; still manual |
| Cross-device sync / cloud save | 0 | 0 | Manual Export/Import (network stage) |
| Dice roller | 0 | n/a | Deliberately absent: dice are physical |
| Maps / tokens | 0 | n/a | Out of scope for in-person play |
| Voice input | 0 | 0 | Long-term goal |

DM pain points: tracking HP, conditions and durations ✅; forgotten triggers ✅; book flipping ✅ (cards, spells, conditions); flipping between sources ✅ (actions applied from the card); balancing encounters ✅ (XP); players not ready on their turn ❌ (idea: an "on deck" line in the table view); slow setup ✅ (party library, prepared encounters, imports).
