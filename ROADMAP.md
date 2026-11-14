# Roadmap and goal tracker

Status: ✅ done · 🔨 in progress · 📋 planned · 💡 idea. Last reviewed 14 Nov 2026.

## Next steps (start here in a new chat)

**Code review and clean-up done (14 Nov 2026):** Data tab in four sections, habitat lists, shared terms, sturdier start-up and saved-state repair, parallel tests (details in `BUGS.md`). **Structure (14 Nov):** the app is now a page shell, `app.css` and twelve files in `js/`, formatted with Prettier, with a Tests workflow on every push. `DESIGN.md` explains why and lists the open design points.

**2014 / 2024 switch built (14 Nov):** player spells and Paladin / Ranger slots follow the character's edition (default in Data → Sources, override per character); a stat block's older names (`aka`) find it in the search. Monsters, conditions and budgets stay 2024. Possible follow-ups: read the edition from the D&D Beyond sheet, 2014 versions of more spells through a file of your own, 2014 conditions if ever wanted.

**Play test 1 done (12 Nov 2026).** Worked well: monster cards, tap attacks with preloaded damage/statuses, target chips, HP, random HP, initiative, status and concentration tracking. Follow-ups, in order:
- ✅ **Remote session** (built 13 Nov): table link + per-player links, DM toggles for HP / AC / initiative / conditions. Supabase project connected; Andrew's two-device test passed (13 Nov): table view, initiative, AC and HP from player links all work. Next: use it in a full session.
- ✅ **Combat sizing on iPad** (13 Nov): combat buttons 40–44 px (Use, cast, Multiattack circles, chips, death-save dots, legendary pips, status menu), turn card up to 58 % of the screen, **＋ Status** on every row opens the status menu in one tap, 📡 toolbar button opens the player toggles. Check at the next table test.
- ✅ **Table line names the source** (13 Nov): damage, healing and statuses applied with the pad on someone's turn show as "Hero → Goblin: …" on the table view and in the log; death saves show on player tokens (also on other devices).
- ✅ **Encounter generator** (13 Nov): Data tab; random monsters inside the party's XP budget for Low / Moderate / High, with environment, creature type and group shape; Roll again, ⓘ stat block, Add to encounter (one Undo). Environments are rules on creature type + name keywords (`GENV`), because the stat-block data has no habitat.
- ✅ **Monster namer** (13 Nov): Data-tab switch; groups get adjectives ("Mean Ogre", "Smelly Ogre") instead of numbers.
- ✅ **Treasure and Discord** (13 Nov): Data → Session → Treasure. A GP value (filled in by End combat, or typed for a quest reward) becomes coins plus up to three valuables (gems, art objects, jewellery) and diamonds: one worth 300 GP from 300 GP, plus one worth 500 GP from 1,000 GP. Split per player (valuables to whoever has least, coins even it out) and posted to a Discord channel through a webhook link kept on the device. The Remote session block can post the view-only table link the same way. Real webhook confirmed by Andrew (13 Nov): the treasure post arrives as expected. Gem names now cover the full gemstone lists by value (checked against the DMG, 13 Nov); art objects stay our own descriptions.
- 💡 Discord: post the end-of-combat summary automatically; a "who takes what" poll; per-player private links by DM (needs a bot, not a webhook).
- ✅ **Habitat data** (14 Nov): a stat block can carry a habitat list (`hab`) that the generator uses first; `tools/appendix_b.py` adds the lists to a file of your own.
- ✅ **Generator extras** (13 Nov): keep (lock) a monster and roll the rest; 12 theme packs (Goblin warband, Undead rising, Cult ritual…); a twist per encounter (26 terrain / hazard / objective / timing / social prompts, added as a hidden effect at initiative 20); morale + quirk line per monster on its turn card (switch); skip monsters used in the last 30 days (`S.seen`, set at combat start); Save to library; Rescale when the party changes (adds or drops monsters to fit the new budget).
- ✅ **Defeat / Fled** (13 Nov): pad buttons for selected monsters. Defeat = 0 HP at once. Fled = leaves the fight with its HP remembered, counts as defeated (XP yes, loot no), "↺" brings it back.
- ✅ **End-of-combat summary** (13 Nov): XP total and per player, defeated / fled counts, suggested loot (coins by CR for creatures that carry things, 1-in-6 consumable); in the log and Data → Session. Loot checked by Andrew against the DMG (13 Nov): fine.
- 📋 **Player link: temp HP** next to Damage / Heal / Set HP.
- 💡 **Player link: full character edit** with one DM switch (a player version of the DM's ✎ sheet: max HP, abilities, saves, defences), so the DM never has to set max HP by hand. Today Kanka / D&D Beyond imports cover max HP well.
- ✅ **Equipment reference** (13 Nov): 237 SRD 5.2 items (all gear, tools, weapons, the four Potions of Healing, 18 magic potions and oils) in `reference.json`; search or the **Equipment** filter in Spells & Conditions.
- ✅ **Consumables on the player card** (13 Nov): tap an item on a player's turn → targets → Apply, like monster actions. With effects: Acid, Alchemist's Fire, Holy Water, Oil, Net, Caltrops, Ball Bearings, Hunting Trap, Basic Poison, Potions of Healing (4 grades), Poison, Heroism, Invisibility, Speed. Other items open their rules text.
- 🔨 **D&D Beyond items:** `dndbeyond.py` now exports each character's inventory (name + quantity); carried consumables show first on the card. Shows after the next D&D Beyond workflow run + **Update from D&D Beyond**; check with a real sheet.
- ✅ **Named poisons** (13 Nov): the 14 SRD 5.2 sample poisons (Assassin's Blood … Wyvern Poison) in the reference (summarised in `build_reference.py`, as the open5e data lacks them) and under **Poisons ▾** in Consumables, with the Con save DC, damage, half-on-save and conditions preloaded. Serpent Venom confirmed against the book (13 Nov): DC 11 Con, 3d6 Poison, half on a save.
- 💡 Consumables: count down carried quantities; more potion effects (Resistance type picker, Giant Strength, Growth); spell scrolls; let players tap their own consumables from the player link.
- 📋 Repeat the table test with the app as the only tracker (paper + app confused players).
- 📋 **Dungeon Master's Vault character import** (one player keeps his sheet there): same character shape as the Kanka / D&D Beyond imports. Waiting for the sheet link.

1. ✅ **Controlled live table test** (12 Nov) on the iPad with the tap-to-use flow (monster turns, legendary bar, player spells, table view line). Log findings in `BUGS.md`, then fix before v1.0.
2. ✅ **Data tab redesign** (14 Nov): four sections, one on screen at a time: *Encounters* (generator, prepared encounters), *Session* (last combat, treasure, table view and player links, combat log), *Sources* (Kanka / D&D Beyond, monster files, what is loaded), *Backup* (export / import). Earlier clean-up (6 Nov: one backup file incl. monster files, effect templates, Rules tab renamed Spells & Conditions): group into *Backup* (export / import), *Session* (combat log, table window, prepared encounters) and *Sources* (monster files, spells, Kanka / D&D Beyond), with one line of help each.
3. 📋 **v1.0 checklist** (below).
4. Then pick from Stage 2: character library groups, effects "after N rounds", compact stat block, 2014/2024 toggle.

## Stage 1: table-ready tracker (alpha → v1.0)

| Goal | Status | Notes |
|---|---|---|
| Initiative, HP, AC, conditions, death saves, Undo | ✅ | |
| Damage types, resistances/immunities, concentration, legendary/lair, reactions | ✅ | |
| Kanka player sync (GitHub Action) | ✅ | Also checks levels against session reports |
| D&D Beyond public character import (GitHub Action), per-field Keep / Use merge | ✅ | Unofficial and fragile; public sheets only |
| Your files: own stat blocks and spells, loaded on the device (Data → Sources) | ✅ | Kept on the device and in the backup |
| Your files by link (Dropbox, Gist, Supabase Storage; Google Drive with an API key), with Update | ✅ | 14 Nov; read once and stored, so still offline at the table |
| File integrity check: known fields only, forced types, size limits; script in file text never runs | ✅ | 14 Nov; `cleanMon()` / `cleanSpell()` / `cleanAliases()`; test `hostile_or_broken_file_is_harmless` |
| Tests run everywhere on a made-up book (`tests/fixtures/test-book.json`); own file only for one optional check | ✅ | 14 Nov; 86 tests on GitHub, none skipped there |
| Content-Security-Policy on the page (second lock: even a missed escape could not run script or send data elsewhere) | 📋 | Needs the inline handlers and allowed hosts (Supabase, Discord, Drive) listed first |
| Tell the user what a file check dropped or cut, per entry | 💡 | Today only the count of skipped entries is shown |
| Encounter XP / difficulty while planning | ✅ | 2024 DMG budgets; hidden while combat runs |
| End combat without clearing | ✅ | Keeps creatures, HP and statuses |
| Spells & Conditions tab: SRD 5.2 spells (SRD 5.1 for 2014 rules), full condition text, offline | ✅ | `reference.json`, `reference-2014.json` |
| Effects (lair actions, hazards) with damage / save / status | ✅ | |
| Action pad: number and type wheels, Half, + Extra, Max HP −, statuses, one Apply | ✅ | Heal / Temp HP / Max HP in the type wheel |
| Status list: General section, spell names, single-condition spells linked, concentration prompts | ✅ | |
| Monster actions parsed (341/341) and shown as tappable cards | ✅ | `tools/check_actions.py` |
| Action economy: actions / bonus / reactions per turn, Multiattack circles, recharge, X/Day per encounter | ✅ | |
| Tap-to-use: targets, hit/miss or failed/saved, preloaded damage, crit, reactions, one Apply | ✅ | |
| Monster spells, legendary actions, grapples through the same flow | ✅ | |
| Player spells against monsters (D&D Beyond spell lists) | ✅ | |
| Table view line (save DC to roll, player damage to write down) | ✅ | |
| Combat log per encounter, downloadable | ✅ | |
| Phone layout for building encounters; iPad/desktop one-line toolbar | ✅ | |
| Code map, CLAUDE.md, README user manual | ✅ | Reviewed 6 Nov 2026 |
| Controlled live table test | ✅ | 12 Nov; follow-ups at the top |
| v1.0 | 📋 | After the live test; see checklist |

### Before v1.0 (checklist)
- [x] Live table test on the iPad; log findings in BUGS.md (12 Nov)

## Tap-to-use monster actions (mini roadmap A–G) ✅ complete 6 Nov 2026

| Stage | What | Status |
|---|---|---|
| A | Parser: attacks, saves, damage parts, Multiattack, Spellcasting, limits; coverage report | ✅ 341/341 monsters, 188/188 Multiattacks; 12 entries are text-only effects the DM reads |
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
- 💡 Compact stat block setting (Failure / Success inline).
- 💡 Tap a spell status chip (Bless, Hex…) to open its spell entry.

### Character library (📋)
- ✅ Search, ticked first, pinned Add, Delete all; Kanka and D&D Beyond import into one library.
- ✅ Groups / tags (e.g. "Blackrock regulars", "guest players"), filter by group, tick whole group; source shown per character.

### Data and edition (📋)
- Local monster images (kept out of the repo).
- ✅ 2014 / 2024 rules switch (14 Nov): SRD 5.1 spells for 2014 characters, half-caster slots, 2014 monster names.
- 💡 Data files (reviewed 6 Nov 2026): Kanka and D&D Beyond exports share one character shape. Monster actions stay as stat-block text parsed in the app (your own files use the same format and need no build step). Possible later: monster saves / resistances / immunities as fields in `monsters.json` to drop about 15 lines of text matching in `defs()` / `saveOf()`.

### Blackrock levelling (Kanka)
- ✅ Level check in the Kanka workflow: sessions per character from report links, expected level, Discord message for the Loremasters (`kanka_levels.md`). Flags reports with no characters named.
- 💡 If Andrew gets edit rights on the Blackrock Kanka: write the new level to each character's "Class, Subclass & Levels" field automatically after each report (needs a token with write access and a way to pick which class gets the level for multiclass characters).

## Stage 3: network features (📋, deliberately postponed)
- ✅ Cross-device table view and player links (Supabase Realtime Broadcast, see README *Remote session*); confirmed on two devices 13 Nov.
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
| Monster library + homebrew import | 4 | 4 | 2014 names find 2024 stat blocks; no 2014 stat blocks |
| Prepared encounters / reinforcements | 4 | 4 | |
| Encounter difficulty / XP budget | 4 | 4 | No lair XP or hazard CR yet |
| Spell / rules lookup | 4 | 4 | Spells & Conditions tab; both editions of SRD spells; more through your own files |
| Lair actions / hazards that act | 4 | 4 | Templates + saved templates; start-of-turn damage one tap. Missing "after N rounds" |
| Building encounters on a phone | 4 | 4 | |
| Party library management | 3 | 4 | Groups/tags, filter, tick a whole group, source per character |
| Character import | 3 | 4 | Kanka + D&D Beyond; links found in Kanka descriptions import automatically (name/class checked) |
| Player view on another device | 2 | 5 | Remote session (13 Nov): table link and per-player links on other devices (Supabase Realtime), DM toggles for HP / AC / initiative / conditions |
| Combat log / session record | – | 4 | Per encounter, downloadable; not yet fed into reports |
| Backup / restore | – | 4 | One file with everything incl. monster files; still manual |
| Cross-device sync / cloud save | 0 | 1 | Live table and player links only; app state is still manual Export/Import |
| Dice roller | 0 | n/a | Deliberately absent: dice are physical |
| Maps / tokens | 0 | n/a | Out of scope for in-person play |
| Voice input | 0 | 0 | Long-term goal |

DM pain points: tracking HP, conditions and durations ✅; forgotten triggers ✅; book flipping ✅ (cards, spells, conditions); flipping between sources ✅ (actions applied from the card); balancing encounters ✅ (XP); players not ready on their turn ❌ (idea: an "on deck" line in the table view); slow setup ✅ (party library, prepared encounters, imports).
