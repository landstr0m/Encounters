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
2. **Monster's turn:** the turn card shows only what it can still do. Tap **Use** on an action (or a Multiattack circle). Missed? tap **Miss**. Hit, or a save action? tap the target chips in the pad (tap a save target again for *Saved*), set the wheels to the rolled damage (the average is preloaded) and tap **Apply**. Damage, half on a save, statuses, concentration and the use are all handled in one go.
3. **Player's turn:** apply what they did with the pad (tap their target rows, spin the amount and type, Apply), or, for players with a D&D Beyond spell list, open **Spells** on their turn card and tap the spell.
4. **Between turns:** legendary monsters get a bar with their legendary actions; tap one (attacks open targeting, movement just spends the use).
5. **Anything else** (a trap, a DM ruling, lowering damage to keep the table fun): tap the rows, set amount, type, Half, + Extra or Status on the pad, then Apply. The type wheel also holds 💔 Max HP −, 💠 Temp HP and ❤️ Heal.
6. **Saves** shows one saving throw for everyone. **■ End combat** stops the turn order but keeps creatures, HP and statuses. **Clear** (two taps) empties the tracker.

**4. Players' screen (optional)**
- **Table view** (toolbar) switches this screen to what players see: no stat blocks, DM notes or hidden effects.
- **Data → Open table window** opens a separate read-only window to drag onto a second screen or TV; it updates live. This only works in the same browser on the same device for now (cross-device sync is planned).

**5. After the session**
**Data → Export** saves everything (encounter, prepared encounters, party, settings) as a file. Do this before and after each session as a backup. **Data → Download combat log** saves what happened in each fight.

## Feature reference

**Combat**
- Initiative order with rounds and turns. Groups of the same monster can share initiative and be selected together (**Select all** on the group header).
- **Undo** (one step) covers damage, healing, statuses, death saves, removals, turn changes, End combat and Clear.
- **Damage types:** halved if the target resists (round down), 0 if immune, doubled if vulnerable. Monster defences come from their stat blocks, player defences from Kanka or the character sheet. Raging and Petrified add their resistances. A note shows what each target took.
- **Concentration:** damage to a Concentrating creature shows the Con save DC. A concentration spell status (Bless, Haste, Hex, Spirit Guardians…) added on someone's turn is linked to that caster; when their concentration ends, every linked status ends too (Haste ending adds Lethargic).
- **Short effects end by themselves** (Shield, Dodge, Vicious Mockery, Guiding Bolt, Ray of Frost and others), with a toast and Undo.
- **AC** is shown in a shield on each row: green when raised (Shield, cover, Haste), red when lowered (Slow). Initiative tokens and the turn card also show the base AC struck through. Tap the shield to set base AC.
- **Reactions:** tap "Reaction ready" when used; it resets on that creature's turn. Shown as "No reactions" while Incapacitated, Slowed etc.
- **Legendary monsters:** LA and LR pips on the row; **In lair** on the group header switches to lair counts; after other creatures' turns a bar offers their legendary actions (see *Monster turns*).
- **Turn-card reminders** for start-of-turn effects (Burning, Spirit Guardians…) and end-of-turn saves (Slow, Hideous Laughter…).
- **Players' turn card:** save DCs and spell attack per class, saves, defences, passive Perception, traits.
- **Max HP −** (pad toggle: lowers max HP by the damage taken, e.g. Life Drain; or the 💔 type for max HP only); **Reset max** (under More) undoes it.

**Statuses and saves**
- The status menu has three parts: the 15 conditions, **General** statuses for any creature (Dodging, Disengaged, Readied, Help, half / three-quarters / total cover, Burning), then **spells and effects** (Bless, Haste, Mage Armor, Hex, Rage…) with rule text. Spells and features are shown by their own names. AC, speed, save and resistance changes apply automatically (Mage Armor: base AC 13 + Dex). Paralyzed, Stunned etc. add Incapacitated.
- Spells that impose one condition (Hold Person, Charm Person, Web, Color Spray, Invisibility…) add that condition too, linked to the spell: when the spell ends (concentration lost, expiry, or tapping its chip) the condition goes with it. A condition the creature already had stays.
- For spells aimed at specific creatures (Hold Person, Hypnotic Pattern, Slow, Faerie Fire, Bane, Banishment, Dominate…), when the last affected creature is free the app asks whether to end the caster's concentration (**End** / **Keep**). Area spells (Web, Spirit Guardians…) and Hex / Hunter's Mark never ask.
- Spells that creatures in the encounter can cast (monster Spellcasting, D&D Beyond spell lists) are listed first; search finds the rest.
- Creatures immune to a condition are skipped (and listed) when you apply it to a group.
- **Saves** view: shaded = proficient; notes such as `adv.`, `+d4` or `auto-fail` come from statuses and traits.

**Effects (lair actions, hazards, timers)**
- **＋ Add → Effects:** name, initiative, a note for you, and whether players see it.
- Optional payload: damage dice as a reminder (e.g. `2d6`), damage type, save (ability + DC), and a status lasting its normal duration, 1 round, or to the end of the target's next turn.
- On its turn press **Apply…**: the Saves view opens on that ability and the pad is preloaded. Select the targets, type the roll, then **Apply** (failed save: damage + its status, already ticked) or toggle **Half** first (saved: half damage, the status is unticked). Amount 0 applies the status only. **Done** ends it.

**Monster cards**
- 503 stat blocks (currently the 2024 Monster Manual, see *Data*). Limits are tags on the card (Recharge 5–6, 3/Day, Costs 2, form-only), **Spellcasting** is split into At will / 2/Day each / 1/Day each, and cards sit two per row on the iPad, shortest first. Roll tables (Beholder Eye Rays) get a wide card with one sub-card per result, in roll order.
- **Multiattack** is a line above the cards; its uses sit on the attacks as circles (Githzerai Monk: two on Psi Strike). "Any combination" shares the circles between attacks; "can replace one attack with Fire Breath" gives that card **Use (1 attack)**, taking the named attack's circle; Beholder Eye Rays allows three rays, each once.
- **Action economy:** once an action, bonus action or reaction is used, the other cards needing it are hidden until the creature's next turn (the used card stays, *Used ↺* undoes it). Recharge and X/Day abilities (X/Day counts per encounter) disappear when spent and are listed below the cards: tap ↺ when one recharges. **Show all** shows everything. Starting combat resets all uses.

**Monster turns (tap to use)**
- Tap **Use**, a circle, a ray's Use, **Use (1 attack)**, a spell's diamond (per day) or ▸ (at will). The card is highlighted and the pad shows the action and **target chips** (opponents first, allies dashed), so targets can be picked even when the list is covered on a phone; tapping rows in the list works too.
- **Attack:** **Miss** spends it with no target. Hit: tap the target chip (AC and reminders such as *adv: Prone*, *crit if within 5 ft*; tap again to drop it). **Crit** adds the damage dice again to the preloaded values.
- **Save action or spell:** tap each target chip (red = Failed, tap again = Saved, ✕ removes). Chips show each target's save bonus, *auto-fail* (Paralyzed/Stunned on Str/Dex) and *adv: Magic Resistance* for spells.
- Once a target is picked the wheels appear with the damage (both parts and types) and conditions preloaded. Change anything, then **Apply**: hits and failed saves take full damage and statuses, saves take half (or nothing, per the text). The use is spent only on Apply or Miss; **Cancel** spends nothing; one Undo reverts the whole action.
- **Reactions:** a picked target with its reaction ready shows ⟲ on its chip: pick Shield (adds +5 AC until its next turn), Uncanny Dodge (halves its damage), a reaction spell from its D&D Beyond list, a monster's own reaction, or Other. The reaction is used on Apply; the hit stays as declared at the table.
- **Monster spells:** DC and attack bonus from its Spellcasting, damage from the spell (upcast versions use the right dice), the spell's status preloaded (Hold Person, Fly…), concentration on the caster. Buff spells can target the caster. Spells with nothing to apply are just counted.
- **Legendary actions:** the between-turns bar has a button per legendary action (cost in brackets). Attacks and spells (Pounce → Rend, Fiery Rays → Scorching Ray) open targeting and spend on Apply or Miss; several attacks (two Bites) step through for one cost; movement-only actions spend at once; once-per-round actions grey out.
- **Several rays or darts** (Scorching Ray, Magic Missile, Eldritch Blast by character level): each one is its own target pick, shown as "(1 of 3)"; the same target can be picked again. The cast is spent on the first.
- **Spells in other actions** ("casts Invisibility on itself", e.g. the Oni's bonus action): Use (or the ▸ token) opens the spell with the caster picked.
- **Roll-table legendary actions** (Beholder Glare → Eye Rays): tap it, pick the rolled result, then target and Apply as usual.
- **Per-hit riders** (Hex, Hunter's Mark, Bestow Curse on a target from this attacker; Divine Favor, Elemental Weapon, Crusader's Mantle, Enlarge, Rage on the attacker): a dashed box per rider appears with the damage, default 0. Type what the player rolled; it is added to each hit with its own type (each ray or beam starts at 0 again). Weapon-only riders are skipped for spell attacks. Also on the plain pad on the attacker's turn.
- **Start/end-of-turn damage** (Burning, Searing Smite, Ensnaring Strike, Spirit Guardians, Black Tentacles, Phantasmal Killer, Heroism temp HP): tap the effect's ▸ on the turn card to select the creature with the dice and type preloaded.
- **Developing effects** (Petrification Ray, Sleep, Flesh to Stone): on the target's turn the card shows its repeat save with **Failed → Petrified / Unconscious** and **Saved** (Flesh to Stone counts 3 of each).
- **Grapples** from attacks show the escape DC and the grappler on the chip, and end by themselves if the grappler drops to 0 HP, becomes Incapacitated or leaves.

**Player turns**
- Players with a D&D Beyond spell list get a **Spells** fold on their turn card (save DC and attack bonus from class and ability). Tap a spell to target monsters as above; **Slot − +** in the pad header upcasts it (more dice from the spell's table, extra rays or darts); Apply puts the spell's status on the monsters and concentration on the player. Player weapon attacks: use the pad (players roll and tell you).

**Table view line and combat log**
- When a monster uses a save action, the table view shows the DC and ability to roll (and who rolls) at the bottom; after Apply it shows each player's damage to write down (monsters only show hit / saved / statuses, not their HP). It stays for that turn and the next, also in the table window.
- Every attack, spell, damage, status, reaction, legendary action and undo during combat is logged per encounter (named after the loaded encounter). **Data → Download combat log** saves it as a text file (last 20 combats kept; **Clear log** empties it).

**Stat block text**
- Roll tables (Beholder Eye Rays, Umber Hulk Confusing Gaze…) are shown as one row per result, and every entry puts Failure / Success on their own lines.
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

## D&D Beyond player import

Works on its own (no Kanka needed), for public characters only (character sheet privacy: Public). Unofficial: D&D Beyond has no public API, so it may break if they change their data.

- Add character links (or ids) to `dndbeyond.txt` on GitHub, one per line. Saving the file runs **Actions → Update players from D&D Beyond** by itself (or press Run workflow), which writes `dndbeyond.json`.
- In the app: party tab → **Update from D&D Beyond**. New characters are added. A character already in the list (same name, e.g. from Kanka) is matched: empty fields fill in, and each value that differs (AC, HP, ability scores, saves, defences, class…) is shown with **Keep** or **Use**. Kept values aren't asked again.
- Read from the sheet: ability scores, exact max HP, AC (armour, shield, Dex, magic items; Mage Armor is left out, use the status), initiative, saves and save advantage (with notes such as *Against Magic*), resistances and immunities from species, class, feats and equipped items only, passive Perception, speed, senses, spell names (used only to sort the status menu).
- Test the converter on a saved sheet: `python tools/dndbeyond.py --file character.json`.

## Development

Run locally (needed so the JSON files load):

```bash
python -m http.server 8000      # then open http://localhost:8000
```

Before pushing:

```bash
pip install playwright && playwright install chromium
python tests/run_tests.py            # full browser test battery (60 tests, phone to desktop)
python tests/run_tests.py typed undo # only tests whose names contain these words
python tools/check_monsters.py       # data check after changing monsters.json (see BUGS.md)
python tools/check_actions.py        # action parser coverage after parser or monster changes
```

Then bump `CACHE` in `sw.js` so installed apps pick up the change. Log bugs and fixes in `BUGS.md`; plans live in `ROADMAP.md`. `CLAUDE.md` has the conventions and context for picking the project up again.

| File | Purpose |
|---|---|
| `index.html` | The whole app: styles, then a script in 7 sections (see the code map at the top of the script, which also lists the feature blocks) |
| `statuses.js` | Rule text shown for each status (edit wording here; mechanics are in `index.html`) |
| `monsters.json` | Monster stat blocks |
| `reference.json` | SRD 5.2 spells and conditions (built by `tools/build_reference.py`) |
| `spells-phb.json` | **Temporary:** Player's Handbook spells not in the SRD, book-name aliases, and the list of spells still missing |
| `players.json` | Player characters from Kanka (written by the workflow) |
| `tools/kanka_players.py` | Kanka → `players.json` |
| `tools/check_actions.py` | Action parser coverage report (runs the app's `parseAct()` on every monster) |
| `dndbeyond.txt`, `dndbeyond.json`, `tools/dndbeyond.py` | D&D Beyond links → characters (workflow `dndbeyond-players.yml`) |
| `tools/build_reference.py` | open5e-api SRD 5.2 data → `reference.json` |
| `tools/check_monsters.py` | Checks every monster entry (stats, dice, text, spelling); `--fix` normalises dice symbols |
| `.github/workflows/kanka-players.yml`, `dndbeyond-players.yml` | GitHub Actions for the Kanka sync (manual) and the D&D Beyond import (runs when `dndbeyond.txt` changes) |
| `tests/run_tests.py` | Browser test battery (Playwright) |
| `ROADMAP.md`, `BUGS.md`, `CLAUDE.md` | Goals and plans; bug and data-check log; project conventions |
| `sw.js`, `manifest.webmanifest`, `icon-*.png`, `fonts.css` | Offline cache, install metadata, icons, fonts |

## Data and licence

- Spells, conditions and rules text: SRD 5.2 (CC-BY-4.0), spell data via [open5e-api](https://github.com/open5e/open5e-api).
- `spells-phb.json` **temporarily contains 35 Player's Handbook 2024 spells** (OCR from the owner's epub, checked and corrected), same arrangement as the monsters below.
- `monsters.json` **temporarily contains the 2024 Monster Manual** (imported from the owner's own book for personal use at his table) to make testing easier. Before v1.0 it goes back to SRD-only, and the book data moves to a local file imported on the device (**Data → Monster files**), which is never committed.
- App data stays in your browser on the current device. Export it regularly as a backup.
