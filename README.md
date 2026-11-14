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
- **Data → Session → Open table window** opens a separate read-only window to drag onto a second screen or TV; it updates live (same browser, no internet needed).
- **Data → Session** (Table view and player links) puts the table view on other devices (see *Remote session*).

**5. After the session**
**Data → Backup → Export everything** saves the whole app, including effect templates and your monster files, as one file. Do this before and after each session as a backup. **Data → Session → Download combat log** saves what happened in each fight.

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
- 341 SRD 5.2 stat blocks built in; add your own under **Data → Sources → Your files**. Limits are tags on the card (Recharge 5–6, 3/Day, Costs 2, form-only), **Spellcasting** is split into At will / 2/Day each / 1/Day each, and cards sit two per row on the iPad, shortest first. Roll tables (Beholder Eye Rays) get a wide card with one sub-card per result, in roll order.
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
- **Save-ends effects** (Hold Person/Monster, Slow, Blindness/Deafness, Wrathful Smite, Crown of Madness, Contagion, Phantasmal Killer, monster actions that say "repeats the save at the end of each of its turns"): the target's turn card shows the save with **Failed** (stays; Phantasmal Killer preloads its 4d10) and **Saved → ends**.
- **Ends on damage:** Sleep, Hypnotic Pattern, and conditions an action says end "if it takes damage" (Beholder Sleep/Charm Ray) are removed when damage is applied; the toast says so. Hideous Laughter and Charm Person get a reminder instead.
- **Two damage types in one save** (Flame Strike, Ice Storm, Meteor Swarm) preload both parts. Ice Knife stays manual (attack, then a separate save).
- **Grapples** from attacks show the escape DC and the grappler on the chip, and end by themselves if the grappler drops to 0 HP, becomes Incapacitated or leaves.

**Player turns**
- Players with a D&D Beyond spell list get a **Spells** fold on their turn card (save DC and attack bonus from class and ability). Tap a spell to target monsters as above; **Slot − +** in the pad header upcasts it (more dice from the spell's table, extra rays or darts); Apply puts the spell's status on the monsters and concentration on the player. Player weapon attacks: use the pad (players roll and tell you).

**Table view line and combat log**
- Damage, healing or statuses applied with the pad during someone's turn are shown as coming from that creature ("Hero → Goblin Warrior 1: 7 Slashing"), so players see their own attacks and heals land. Player tokens show death saves ("Saves 1 · Fails 2", "Stable").
- When a monster uses a save action, the table view shows the DC and ability to roll (and who rolls) at the bottom; after Apply it shows each player's damage to write down (monsters only show hit / saved / statuses, not their HP). It stays for that turn and the next, also in the table window.
- Every attack, spell, damage, status, reaction, legendary action and undo during combat is logged per encounter (named after the loaded encounter). **Data → Session → Download combat log** saves it as a text file (last 20 combats kept; **Clear log** empties it).

**Stat block text**
- Roll tables (Beholder Eye Rays, Umber Hulk Confusing Gaze…) are shown as one row per result, and every entry puts Failure / Success on their own lines.
- Dice to roll are highlighted, attack bonuses green, DCs amber, and damage types have their own colour and symbol (🔥 Fire, ❄️ Cold, ⚡ Lightning, 💀 Necrotic…), also in the defences lines and the damage-type pickers. Spell names (blue) and conditions (red, e.g. *Paralyzed*) are links: tap to read the rule, then **◂ Stat block** to go back. Spells missing from the data (see Spells & Conditions tab) don't link.
- ✎ Edit per creature: name, AC, HP, initiative, extra actions/traits/notes (can be copied to every creature of that type), or a custom group.
- **Data → Sources → Your files:** import your own monster JSON files; they stay on this device and override built-in entries with the same name.

**Players (party library)**
- Search, ticked characters first, **Add N ticked** and **Untick all** pinned at the bottom.
- **Delete all saved characters…** (two taps) empties the library except characters in the current encounter. Export first if you want a backup.
- ✎ Edit → character sheet: ability scores, save proficiencies, proficiency bonus, Level, save DC override, resistances, immunities, vulnerabilities, condition immunities. Saved for future sessions.
- Kanka HP: if a hand-set Max HP differs from the Kanka estimate (e.g. after a level-up in another game), **Use Kanka HP** (or **for all**) takes the estimate.

**Encounter XP (2024 DMG)**
- While combat isn't running, the XP bar shows the living monsters' XP against the party's Low / Moderate / High budget. Player levels come from Kanka, the sheet's **Level** field, or `Name, lvl 3`.

**Spells & Conditions tab**
- 339 SRD 5.2 spells and the full text of the 15 conditions. Search and filter by level and class; works offline. Your files can add spells and other names for spells.

**Prepared encounters and notes (Data → Encounters)**
- Save the current monsters and effects with a note; later **Load** (replaces monsters, keeps players) or **Add** (reinforcements). The note shows as a banner above the table. In lair is saved too.

**Screens**
- iPad and laptop: full layout; the drawer opens on the right.
- Phone (≤600 px, or held sideways): two-line rows and an icon toolbar, meant for building encounters on the go. Sideways, the action pad docks on the right. Running combat is best on the iPad or laptop.
- The initiative strip is hidden until combat starts.

## Encounter generator and monster names
- **Data → Encounters → Encounter generator** rolls a random group of monsters for the party currently in the tracker. Pick the **difficulty** (Low / Moderate / High, the 2024 XP budgets), an **environment**, a **creature type** and a **group shape** (leader and followers, many weak, few strong, or any mix), then **Generate**. **Roll again** until you like it, ⓘ opens a stat block, **Add to encounter** puts them in the tracker (Undo removes them all).
- The total lands between the tier below and the tier you picked; no monster is above the party's average level in CR (one higher on High), and the group is at most twice the party size.
- Characters need a level (from Kanka / D&D Beyond or ✎ Edit); any without one count as the party average.
- **Environment** uses a monster's habitat list (`hab`) when its stat block has one: Arctic, Coast, Desert, Forest, Grassland, Hills, Mountains, Swamp, Underdark, Underwater, Town; `any` fits everywhere on land and an empty list means no natural habitat (**Other planes**). The built-in SRD stat blocks have no list, so they go by creature type and name, as do the sites *Graveyard* and *Dungeon*.
- **Theme pack** (Goblin warband, Undead rising, Cult ritual, Bandit ambush…) picks from one family of monsters and replaces the environment.
- **🔓 Keep** on a rolled monster locks it: **Roll again** keeps it and rolls the rest of the budget around it.
- **Twist:** each roll comes with a prompt (terrain, hazard, objective, timing or social); ↻ gives another. On **Add to encounter** it becomes a hidden effect at initiative 20, so it reminds you each round and players never see it.
- **Save to library** stores the roll under Data → Encounters → Prepared encounters without touching the tracker.
- **Rescale:** if a player joins or leaves before combat starts, the generator offers to add or drop monsters so the same difficulty still fits.
- **More options:** skip monsters used in the last 30 days; give each new monster a **morale and quirk line** ("Morale: Flees when Bloodied · Quirk: hums while fighting") shown on its turn card for you only.
- **Name groups with adjectives** (same place): when you add several of one monster they become "Mean Ogre", "Smelly Ogre", "Tall Ogre" instead of "Ogre 1, 2, 3". Works for monsters added by hand too; rename any of them with ✎ as usual.

## Defeat, Fled and the end-of-combat summary
- Select one or more monsters: the pad has **☠ Defeat** (0 HP at once) and **🏃 Fled** (leaves the fight; the table view says so). A fled monster counts as defeated; **↺** in its group's Defeated line brings it back with the HP it left with.
- **End combat** writes a summary to the log and to Data → Session: XP in total and per player (fled monsters included), and suggested loot (coins by CR for creatures that would carry any, now and then a consumable; fled monsters keep theirs). Treat the loot as a suggestion.

## Treasure and Discord
- **Data → Session → Treasure:** End combat fills in the coin value of the loot; you can also type any value (e.g. a 450 GP quest reward) and press **Build treasure**.
- With the switch on, part of the coins become up to three **gems, art objects or pieces of jewellery**, and larger rewards include **diamonds**: one worth 300 GP from 300 GP up (Revivify), and one worth 500 GP as well from 1,000 GP (Raise Dead). The total value stays the same. **Build again** for a different mix.
- The treasure is **split between the players in the tracker**: valuables go to whoever has least so far, and the coins even the shares out as far as they can.
- **Send to Discord** posts the list with each player's share (and the XP) to a channel. One-time setup: in Discord, open the channel's settings → Integrations → Webhooks → New Webhook → Copy Webhook URL, and paste it into the field under Treasure. You need the *Manage Webhooks* permission on that channel (your own server or a channel the admins set up for you). The link is kept on this device and in your backup only: anyone who has it can post to that channel, so do not share it.
- While a remote session runs, **Table link to Discord** posts the view-only table link to the same channel (player links are never posted, since each one can edit a character).

## Consumables and equipment
- On a **player's turn**, the turn card has **Consumables**. Tap one (e.g. Acid, Alchemist's Fire, Holy Water, Net, Caltrops, Potion of Healing): the save DC (8 + Dex modifier + Proficiency Bonus, or the item's fixed DC), average damage or healing and any status are preloaded; pick targets (Failed / Saved) and **Apply**, exactly like a monster action. Type the rolled amount on the wheel if you want the real roll. Potions start with the drinker picked; tap someone else to administer it.
- **Poisons ▾** in the same section lists the 14 named poisons (Assassin's Blood, Serpent Venom, Purple Worm Poison…) with their Constitution save DC, damage (half on a success where the rules say so) and conditions preloaded; the short reminder next to the name covers durations and repeat saves.
- Items a character carries on D&D Beyond are listed first (bold, with the quantity); the common ones follow. Items marked ⓘ only open their rules text. **All equipment…** opens the full list.
- **Spells & Conditions** also searches all SRD equipment and poisons (237 items); choose **Equipment** in the first filter to browse it.
- Quantities are not counted down; players track their own inventory.

## Remote session (table and player links)

**Data → Session → Start session** gives you links to send to other devices (Copy, or *Copy all links* for one Discord message):
- 📡 in the toolbar (shown while a session runs; green border = live) jumps straight to these settings.
- **Table (view only):** the initiative strip, who is up and who is next, and the table line (saves to roll, damage to write down). Put it on a second iPad, a TV or players' phones.
- **One link per player:** the same view plus that player's own card. Under **Players may change**, tick HP, AC, Initiative or Conditions to let players set those for their own character; untick to close it again. Each change shows as a 📱 note on your screen and in the combat log, and does not replace your Undo.
- Links stay the same between sessions (players can bookmark theirs) until you press **New links**.
- Your device stays in charge and keeps working without internet; other devices catch up when the connection returns and show a warning if they hear nothing for a minute.
- Other devices only receive what the table view shows: names, turn order, conditions, player HP/AC, and for monsters only healthy / bloodied / down. No monster HP numbers, stat blocks, notes or hidden effects are sent.
- Screens stay awake while a session runs (where the browser supports it).

**One-time setup (free Supabase project, about 5 minutes):**
1. Create an account and a project at supabase.com (any name and region; no tables are needed).
2. In the project's **Settings → API keys**, copy the **Project URL** and the **publishable** key (older projects call it the *anon* key). Both are meant to be public.
3. Put them in `session.json` in this repo: `{"url": "https://xxxx.supabase.co", "key": "sb_publishable_..."}` and commit.
4. Free projects are paused after a week without use: if the status shows a connection problem before a session, open the Supabase dashboard and restore the project.

Limits: anyone with a link can see the table view, and someone who knows the session code could send a fake table picture to other viewers (never to your device), so share links only with your table. `supabase.js` is the official supabase-js browser build (v2.119.0, MIT), loaded only when a session starts.

## Kanka player sync
- The sync also scans each character's public description, attributes, posts and links for D&D Beyond sheet links and saves them as `ddb` in `players.json` (the Action log lists what it found). The same run then imports those sheets into `dndbeyond.json`, but only links them to the Kanka character if the name and class match (otherwise the log says why); no need to add them to `dndbeyond.txt`.

`tools/kanka_players.py` (Python standard library only) reads the player characters of the Blackrock campaign (`CAMPAIGN` at the top of the script) and writes `players.json`.

- To update: GitHub → **Actions → Update players from Kanka → Run workflow**, then **Update from Kanka** in the app's party tab. The workflow needs the repository secret `KANKA_API_KEY` and commits `players.json` only if it changed.
- Locally: `KANKA_TOKEN=your_token python tools/kanka_players.py`
- The class field is read leniently (`Cleric, Forge Domain - 2`, `Fighter 3 / Wizard 2`…). Anything not understood is printed in the workflow log and shown on the player's stat block (ⓘ).
- Saving throws listed in Kanka are used as-is; otherwise they are inferred from the first class.
- Species and class features that affect saves or damage become traits (Gnomish Cunning, Dwarven Resilience, Fey Ancestry…). The tables are at the top of the script.
- **Estimated HP** = max hit die at level 1, average after, plus Con per level. Feats like Tough aren't included; override by hand.
- Extra defences: give the character a Kanka property `Resistances`, `Immunities` or `Vulnerabilities` (comma-separated).

### Level check (Loremaster message)
- The same workflow runs `tools/kanka_levels.py`: it counts the session reports (Kanka → Reports) that link each player character, works out the level from the Character Creation rules (1 / 3 / 6 / 10 / 14 sessions, then every 4; Act 1 cap 5) and compares it with the Kanka level.
- The result is in `kanka_levels.md` and on the Actions run page: a ready-to-paste Discord message with level-ups to log, reports that name no characters, and sessions per character.
- Sessions that don't count (a character played as an NPC) are listed in `EXCLUDE` at the top of the script. Characters typed or tagged NPC are skipped.

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
python tests/run_tests.py            # full browser test battery (phone to desktop), run in parallel workers
python tests/run_tests.py typed undo # only tests whose names contain these words
python tests/run_tests.py -j1        # one at a time, in order (use this if a failure is hard to read)
# A few tests need a file of your own at local/my-books.json and are skipped without it.
python tools/check_monsters.py       # data check after changing monsters.json (see BUGS.md)
python tools/check_actions.py        # action parser coverage after parser or monster changes
```

Then bump `CACHE` in `sw.js` so installed apps pick up the change. Log bugs and fixes in `BUGS.md`; plans live in `ROADMAP.md`. `CLAUDE.md` has the conventions and context for picking the project up again.

| File | Purpose |
|---|---|
| `index.html` | The page shell only |
| `app.css` | Styles |
| `js/boot.js` | Starts the app: loads `monsters.json`, then the eleven parts below in order. The code map at its top lists every file and feature block |
| `js/rules.js`, `state.js`, `bar.js`, `actions.js`, `board.js`, `drawer.js`, `datatab.js`, `sheet.js`, `parser.js`, `events.js`, `session.js` | The program, in load order: rules data, state and combat logic, top bar, tap-to-use actions, board, drawer panels, Data tab and generator, character sheet and backup, action parser, event handlers, remote session |
| `statuses.js` | Rule text shown for each status (edit wording here; mechanics are in `js/rules.js`) |
| `reference-2014.json` | SRD 5.1 spells for characters on 2014 rules (built by `tools/build_reference.py …/srd-2014`) |
| `.prettierrc`, `.prettierignore` | Code formatting (run `npx prettier --write .` after editing) |
| `.github/workflows/tests.yml` | Runs the tests on every push |
| `DESIGN.md` | Design decisions and why, with the open points |
| `monsters.json` | Monster stat blocks |
| `reference.json` | SRD 5.2 spells and conditions (built by `tools/build_reference.py`) |
| `players.json` | Player characters from Kanka (written by the workflow) |
| `tools/kanka_players.py` | Kanka → `players.json` |
| `tools/check_actions.py` | Action parser coverage report (runs the app's `parseAct()` on every monster) |
| `dndbeyond.txt`, `dndbeyond.json`, `tools/dndbeyond.py` | D&D Beyond links → characters (workflow `dndbeyond-players.yml`) |
| `tools/build_reference.py` | open5e-api SRD 5.2 data → `reference.json` |
| `tools/appendix_b.py` | For a file of your own in `local/`: adds habitat lists (`hab`) and older names (`aka`) from lists you paste into `local/`, and cross-checks CR and creature type |
| `tools/check_monsters.py` | Checks every monster entry (stats, dice, text, spelling); `--fix` normalises dice symbols |
| `.github/workflows/kanka-players.yml`, `dndbeyond-players.yml` | GitHub Actions for the Kanka sync (manual) and the D&D Beyond import (runs when `dndbeyond.txt` changes) |
| `tests/run_tests.py` | Browser test battery (Playwright) |
| `ROADMAP.md`, `BUGS.md`, `CLAUDE.md` | Goals and plans; bug and data-check log; project conventions |
| `sw.js`, `manifest.webmanifest`, `icon-*.png`, `fonts.css` | Offline cache, install metadata, icons, fonts |

## Data and licence

- Spells, conditions and rules text: SRD 5.2 (CC-BY-4.0), spell data via [open5e-api](https://github.com/open5e/open5e-api).
- Monsters: SRD 5.2 (CC-BY-4.0), via [5e-bits/5e-database](https://github.com/5e-bits/5e-database). Spells for 2014 rules: SRD 5.1 (CC-BY-4.0).
- Your own files (**Data → Sources → Your files**) stay on your device and in your backups. The `local/` folder is git-ignored for the same reason: keep anything that is not open content there.
- App data stays in your browser on the current device. Export it regularly as a backup.

## Defences
🛡 **Defences** in the toolbar opens a drawer listing every creature on one line: AC, the saving throw you pick at the top (Str…Cha, with advantage / auto-fail notes), resistances, immunities, vulnerabilities, condition immunities and Magic Resistance. It is its own menu (Defences · Stat block · Edit · Spells · ✕): tap creatures to select them, Stat block and Edit show the last one tapped and keep the Defences tabs so you can go back; ✕ closes and leaves them selected with the pad open. Tap 🛡 again to close. **+ Add** opens the usual menu.

## Player turn card
Shows race, class (subclass) and level, spell save DC and to-hit, proficiency bonus and the six ability modifiers (save-proficient ones highlighted, modifier only), a small Passive Perception line, and **spell slots** worked out from the class levels (multiclass rules; Warlock Pact Magic separate). Casting a levelled spell from the spell list uses the lowest slot that fits (the pad's **Slot − +** picks another; a Pact slot shows as such; more dice when the spell upcasts); the slot is spent on Apply or Miss, once per cast (all rays / darts), and Undo returns it. Spells with no slot left are greyed out; cantrips never are, and characters without class spell slots (feat or species spells) are not tracked. Tap a slot to mark it used or recover it by hand (Arcane Recovery, Fey Touched…); **Reset** after a rest.

## Selecting creatures
**＋ Status** on a row selects it and opens the status menu in one tap (other selected rows stay selected, so one pick can go to several creatures). Tap rows to select them; the pad then lists every creature as a chip, so you can add or remove targets without scrolling. ✎ opens Edit (the AC shield no longer does).

## Look
Light mode is **Parchment** (warm paper, deep red accent, Cormorant Garamond for names and numbers); dark mode is **Dark dungeon** (charcoal with a soft gold accent). The app follows the device's light/dark setting. Fonts are built in, so it still works offline.

## Character groups
In Add → Party, tap 🏷 on a character and type its groups, comma separated (e.g. `Blackrock, Guests`); a character can be in several. Group buttons above the search filter the list (**No group** shows untagged); **Tick all in <group>** ticks the whole group for the next encounter. Each row also shows where the character came from (Kanka, D&D Beyond or by hand). Groups survive Kanka / D&D Beyond updates and are in the backup.

## Rules edition (2014 / 2024)
Monsters, conditions and encounter budgets always use the 2024 rules (SRD 5.2). Two things follow the edition of the **character**:
- **Spells a player casts:** on 2014 rules the tracker uses the SRD 5.1 version (Chill Touch 1d8 at range, not 1d10 in melee). A spell that is not in SRD 5.1 keeps its 2024 text.
- **Paladin and Ranger spell slots:** none at level 1 and rounded down when multiclassed on 2014 rules.

Set the default under **Data → Sources → Rules edition**; one character can differ under **✎ Edit → Character sheet → Rules**. The turn card says "2014 rules" next to the spell list. In **Spells & Conditions** a spell with two versions has a switch between them.

**2014 monster names:** a stat block can list older names (`aka`); searching Add → Monsters for one of them finds it, marked "2014: …".

## Data tab
Four sections, one on screen at a time (the app remembers the last one):
- **Encounters:** the encounter generator, and prepared encounters (save, Load, Add).
- **Session:** the last combat summary, treasure and the Discord post, the table window and remote session links, and the combat log.
- **Sources:** *Update from* Kanka and D&D Beyond, your monster files, and what is loaded now (monster and spell counts).
- **Backup:** *Export everything* writes one file with the tracker, saved encounters, characters, effect templates, combat logs, settings and (ticked by default) your monster files. *Import* restores all of it on any device.

## Effect templates
In Add → Effects, tap a template (Lair action, Collapsing ceiling, Poison gas, Spreading fire, Reinforcements) to fill the form, check the numbers, then Add effect. **Save as template** keeps your own (★, × to delete); they are in the backup file.

