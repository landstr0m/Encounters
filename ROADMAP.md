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
| Stat blocks: dice/attack/DC and damage-type highlighting, spell and condition names linked to the Rules tab | ✅ | Spells link anywhere in the text; ability names like Fear Ray or Bright Light are excluded |
| Monster data check (all 503 entries) | ✅ | 3 Nov 2026, see BUGS.md; `tools/check_monsters.py` |
| Code map, CLAUDE.md, README how-to | ✅ | |
| Controlled live table test | 📋 | Next |
| v1.0 | 📋 | After the live test; see checklist below |

### Before v1.0 (checklist)
- [ ] Live table test on the iPad; log findings in BUGS.md
- [ ] `monsters.json` back to SRD-only; Monster Manual data as a local file (Data → Monster files)
- [x] Book checks flagged by the data check (confirmed and fixed 3 Nov)
- [x] Player's Handbook spells (35 of 51 non-SRD spells). The 16 missing ones are low priority: none appear in any monster stat block, and players track their own spells. Cross-check with the D&D Beyond (cobalt) connection.
- [ ] `spells-phb.json` out of the public repo; load it as a local file (needs a spell-file import in the Data tab)

## Stage 2: planned features

### Effects that act on the board (✅ first version)
Effects can carry damage dice (rolled at the table), a damage type, a save (ability + DC) and a status with a duration (normal, 1 round, or to the end of the target's next turn). On the effect's turn, **Apply…** opens the Saves view on that ability and preloads the pad: select targets, type the roll, **Damage** = failed save (damage + status), **Half** = saved (no status), **+ Status** = status only.
Still open (📋): saved target lists, "after N rounds" durations. (Prepared encounters already keep the payload.)

### Tap-to-use monster actions (📋 mini roadmap, agreed 5 Nov 2026)
Goal: on a monster's turn, tap an action on its card → pick targets → mark who was hit / who saved → type the rolled damage → one Apply does damage (per type, resistances), half on a save, statuses, concentration and expiry. The DM can still change anything before Apply, and Undo covers it. Dice stay physical: the app never rolls.

**A. Read the actions (data, no UI change)** ✅ 5 Nov 2026: 503/503 monsters parse; 17 attacks/saves have text-only effects the DM reads
- [x] Parser turns each action's text into a structure: kind (attack / save / other), attack bonus, reach or range, damage parts (dice + type, one per part), save ability and DC, what happens on a fail and on a success (half damage? none?), damage on a miss ("Miss:" / "Hit or Miss"), statuses and their duration or repeat save, escape DC for grapples.
- [x] Cost and limits: Action / Bonus Action / Reaction / Legendary (cost 1–3), Recharge X–6, X/Day (each), at-will.
- [x] Spellcasting entries split into at will and X/day each, with the spell names linked to statuses and the Rules tab.
- [x] Multiattack parsed: "two Rend attacks", "one Bite and two Claw", "replaces one attack with Spellcasting", "or" options.
- [x] `tools/check_actions.py`: reports how many of the 503 monsters parse fully, and lists the rest to fix by hand (like `check_monsters.py`).

**B. Cards that show it** ✅ 5 Nov 2026 (legendary actions still in the Traits fold on the turn card)
- [x] Multiattack nested: its attacks shown inside it ("2× Rend"), not as a separate card.
- [x] Each action tagged with its cost (A / BA / R / L2) and limits (Recharge 5–6, 1/Day).

**C. Track what's used** ✅ 5 Nov 2026 (Andrew's rules: no long rest; X/Day = per encounter, since monsters aren't players)
- [x] **Use** on each action, bonus action and reaction card. The used card stays (marked Used ↺, tap to undo); the other cards needing that resource are hidden until the creature's next turn.
- [x] Multiattack embedded in the attacks (5 Nov 2026): uses per attack this turn (circles), shared pools for "any combination", alternatives, replacements drawing from the named attack, roll tables with each result once (Beholder: 3 rays, each once).
- [x] X/Day counted per encounter, reset when combat starts; per-day spells have one pip per use (tap = cast, also uses the action).
- [x] Spent recharge and used-up abilities are listed under the cards (tap ↺ when it recharges); **Show all** reveals hidden cards.
- [ ] Legendary actions on the turn card still sit in the Traits fold (pips in the table track them).

**D + E. Tap-to-use for save actions and attacks** ✅ 6 Nov 2026 (first version, for review at the table)
- [x] Tap Use (or a Multiattack circle / ray / replacement) on an attack or save action → tap targets → per target Hit/Miss or Failed/Saved (one tap each; defaults Hit / Failed) → damage parts, types and conditions preloaded → set the rolled damage → one Apply (full / half / none per target; statuses only on hit or failed save).
- [x] Spends the use on Apply only; Cancel spends nothing; one Undo covers it.
- [x] Miss: Use → Miss, no target (misses have no effect in the 2024 Monster Manual: the 12 "Hit or Miss" lines are thrown weapons returning).
- [x] Targets picked from chips inside the pad (works when the list is covered on a phone); wheels appear once a target is picked.
- [x] AC per target (cover and Shield included), advantage/disadvantage reminders from statuses, crit reminder vs Paralyzed/Unconscious in melee, auto-fail Str/Dex saves when Paralyzed/Stunned/Unconscious/Petrified.
- [x] Attacks with a rider save (hit, then a save against the status): second Failed/Saved button per hit target.
- [ ] Crit toggle (the DM types the doubled total for now).

**F. Spells, grapples and legendary actions** ✅ 6 Nov 2026
- [x] Casting from Spellcasting (per-day diamonds, ▸ for at-will) opens targeting with the spell's save/attack, damage (upcast dice) and status; uses the daily count and starts concentration on the caster.
- [x] Grapples linked to the grappler (escape DC on the chip; ends if the grappler is at 0 HP, Incapacitated or gone).
- [x] Legendary actions as buttons in the between-turns bar: attacks and spells open targeting (cost spent on Apply/Miss, multi-attack legendary actions step through for one cost), movement-only ones spend straight away, once-per-round ones grey out.
- [ ] Start/end-of-turn damage and repeat saves from riders use the existing turn reminders (no change).

**G. Crit, reactions, log** ✅ 6 Nov 2026
- [x] Crit toggle (adds the dice again to the preloaded damage).
- [x] Reactions flagged on picked targets (⟲): uses the reaction, applies Shield's status or halves for Uncanny Dodge; the declared hit is not changed (Andrew: players declare at the table).
- [x] Combat log per encounter, downloadable from the Data tab.
- [ ] Same flow for player spells and attacks against monsters (from D&D Beyond spell lists), using the monsters' save bonuses and Magic Resistance.
- [ ] Player spell slots (only if the D&D Beyond import proves reliable; it's unofficial and fragile).
- [ ] Optional table-view line ("Goblin hits Aer: 5 slashing").
- [ ] **Data tab clean-up:** group into Backup (export/import), Session (combat log, table window), Sources (monster files, spells, Kanka/D&D Beyond), with short help text.

### Encounter difficulty extensions (💡)
- CR / XP for effects and hazards, counted in the encounter XP.
- Lair XP (2024 stat blocks list a higher XP in lair).
- "Rounds to defeat" estimate from party damage, as a second balance check.

### Reference extensions
- 💡 Optional **compact stat block** setting, if layout changes add up and blocks get too long: Failure / Success inline instead of on their own lines (one switch in `blk()`), maybe roll tables collapsed
- 📋 **Sort and present effects/spells better:** sort the status/effect list (possibly from D&D Beyond public character profiles: show each character's own spells and abilities first), and find a way to present spell effects so the DM doesn't need to remember 60+ effects. Re-check the effects list now that spells beyond the SRD are loaded.
- 📋 **Player's Handbook spells (local):** Andrew's PHB 2024 epub has OCR text for all ~390 spells (epub pages 233–341, some OCR errors in headings); a local parser (like the Monster Manual one) writes a spell file that is loaded on the device via Data, merged with `reference.json`, never committed. Needs: the parser, and a "spell file" import in the Data tab. Then non-SRD monster spells (Synaptic Static, Destructive Wave…) link too.
- 📋 **Nest Multiattack:** now part of *Tap-to-use monster actions* (A and B).
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
- **2014 and 2024 rules compatibility:** a toggle in the Data tab. Work out what each ruleset needs, flag only actionable differences, and keep a small variants table instead of duplicating every monster, ability and spell.

## Stage 3: network features (📋, deliberately postponed)
Kept out until the offline app is stable at the table.
- **Cross-device table view** through a free realtime service (today: same browser only).
- **Cloud backup / sync** of app state (today: manual Export/Import).
- ✅ **D&D Beyond public-character import** (4 Nov 2026): `dndbeyond.txt` → workflow → `dndbeyond.json`, per-field Keep/Use merge with same-name characters. Unofficial: D&D Beyond has no public API and the character JSON can change without warning. Only public characters, no credentials. Would run like the Kanka flow (GitHub Action writes `players.json`). Using a login cookie for purchased content is not planned: fragile and an account risk.

## Later ideas (from the original plan)
- 💡 **Encounters generated from DM notes:** Andrew gives his session notes to an AI (Claude), which writes a file of ready-made encounters (monsters by id, counts, effects with damage/save/status, environment notes, lair flag) that the app imports and that he then uses with **Load** / **Add**. Open questions: the file format (probably the existing prepared-encounter JSON, documented as a schema so any AI or tool can write it), matching monster names to ids, and an "import encounters" button that adds them without replacing the party or app state.
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
