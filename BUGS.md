# Bug report log

Newest first. Run `python tests/run_tests.py` after every change (see the README).

## 2026-11-14 — Files are not trusted

| # | Finding | Cause | Fix / status |
|---|---------|-------|--------------|
| F1 | A file with a wrong type in a field (for example a number as a creature's type) stopped the app from starting, and it stayed that way until the browser storage was cleared | Only name, id, AC, HP and abilities were checked on the way in; the rest was used as found | Every entry is cleaned on the way in and when stored data or a backup is read: known fields only, each forced to its type, long text cut (`cleanMon()`, `cleanSpell()`, `cleanAliases()`, limits in `FMAX`). Test `hostile_or_broken_file_is_harmless` |
| F2 | No size limit on a file or link | Not considered | Over 20 MB is refused before it is read |
| F3 | Checked, no change needed: script hidden in file text (names, actions, spells, the file name) | Text is escaped wherever it is drawn | Shown as plain text on the DM device and on the table view; covered by the same test |

## 2026-11-14 — Code review, Data tab, habitats

| # | Finding | Cause | Fix / status |
|---|---------|-------|--------------|
| R1 | Data tab was one long scroll with unrelated blocks mixed | Grew feature by feature | Four sections (Encounters, Session, Sources, Backup), one on screen at a time, each a few titled cards; `openData(sec)` for jumps; test `data_tab_sections` |
| R2 | Any error while starting the app showed "Could not load monsters.json" | One `.catch` covered both the download and `boot()` | Separate messages: data file missing vs "The app could not start: …" with the error in the console |
| R3 | A saved state with the wrong shapes (e.g. `enc` not a list, a monster row without a stat block) could stop the screen drawing | `fixIds()` only repaired ids and numbers | `fixIds()` also repairs containers and drops broken rows; test `corrupt_storage_recovers` extended |
| R4 | Environment filter was approximate | Keyword rules on names only | A stat block can carry a habitat list (`hab`), which the generator uses first; new environments Grassland, Hills, Underwater; keyword rules stay as the fallback and for sites |
| R5 | Test battery ran one test at a time (75 s) and a missing control waited 30 s | Single loop, default timeouts | Parallel workers (`-j`), 8 s timeout, duplicate-name check; same tests |
| R6 | (found in review) a misplaced `runner` banner in the middle of the tests | Left from an earlier edit | Removed |

| R7 | One 320 KB `index.html` with packed lines: unreadable diffs, hard to find things | Grew in one file to save tokens | Page shell + `app.css` + twelve files in `js/`, formatted with Prettier; see `DESIGN.md` |
| R8 | Tests changed the app's source text to get a hook in | The app lived in one closure | Hook added by the test browser; tests wait for `window.STARTED`; new test `startup_problems_are_reported` |
| R9 | Nothing ran the tests unless someone remembered | No CI | `.github/workflows/tests.yml` runs tests, data check and formatting on every push |
| R10 | 2014 characters got 2024 spell versions | App built 2024-first | Rules edition switch; test `rules_edition_switch` (all 319 SRD 5.1 spells run through the lookup without error) |
| R11 | A file of your own could only hold stat blocks | Import written for monsters first | Your files (Data → Sources) accept `monsters`, `spells` and `aliases`; a row whose stat block is not loaded is named and keeps working; tests `custom_monster_file`, `own_file_end_to_end` |


Dead-code scan (functions, constants, `data-act` handlers, CSS classes, state fields): nothing unused found.

## 2026-11-13 — Play test 1 feedback, remote session

| # | Finding | Cause | Fix / status |
|---|---------|-------|--------------|
| T1 | Players confused: paper initiative next to the app | Table view only worked in the same browser | **Remote session** built: table link and player links over Supabase Realtime Broadcast; filtered snapshot (`tableSnap()`), player requests (`netReq()`), test `remote_session_links`. Checked live against the Supabase project and on two devices by Andrew (13 Nov) |
| T2 | Entering player AC / HP / initiative while running was slow | Only ✎ per row or typed text | Player links can set HP, AC, initiative, conditions when the DM ticks them. DM-side entry still to improve (combat sizing) |
| T3 | Status setting small and fiddly on the iPad | Combat controls override the 44 px default (chips 30, Use 34, cast 26, dots 22, pips 14); three steps to a status | Fixed 13 Nov: 40–44 px combat targets, taller turn card, **＋ Status** on each row (one tap), test `playtest1_attribution_deathsaves_sizing` |
| T4 | Could not find Holy Water, Acid, Alchemist's Fire, Caltrops | `reference.json` has spells and conditions only | Fixed 13 Nov: 223 SRD items in the reference tab; consumables with tap-to-use effects on the player turn card (test `consumables_on_player_card`). Named poisons added the same day |
| T5 | iPad could sleep mid-session | No wake lock | Screen wake lock while a session runs (DM and viewers) |
| T6 | (found in review) sending the saved state to other devices would leak notes, hidden effects, monster HP, library and logs | Table window reads the full state and hides parts with CSS | Remote viewers get a whitelist copy and render only the strip, big line and table line |
| T8 | Player attacks and healing did not appear on the table view | Plain pad Apply only wrote the table line when a player was a target, and never named the source | Table line and log now read "Hero → Goblin: …" (source = creature whose turn it is; no arrow if it only affects itself; hidden effects are never named) |
| T9 | Death saves not visible to players | Tokens showed only "Down" | Tokens show "Saves n · Fails n" / "Stable"; included in the remote snapshot |
| T10 | Short-rest recoveries were slow to enter for the whole table | DM had to type each player's HP | Resolved by player links: tick **HP** and players set their own HP after the rest. No further change needed |
| T11 | (request) Random themed encounters and friendlier names for groups | n/a | Encounter generator and monster namer in the Data tab, test `encounter_generator_and_namer`. Environment fit is approximate (keyword rules) until habitat data is parsed |
| T12 | No way to take a creature out of the fight without damage or removing it | Only damage to 0 HP or 🗑 Remove existed | Pad: **☠ Defeat** and **🏃 Fled** for selected monsters; fled counts as defeated and can be brought back; test `generator_extras_and_fled` |
| T13 | (request) Send treasure to Discord, shared out; coins as gems / art / diamonds | n/a | Treasure block in Data → Session with a per-player split and a Discord webhook post; test `treasure_split_and_discord`. Real webhook confirmed by Andrew 13 Nov; gem lists completed and "an" before vowels |
| T7 | (found in review) a player edit would overwrite the one-step Undo | `snap()` holds one step | Player requests never call `snap()`; they are logged and shown as a toast |

## 2026-11-06 — Player spells use slots

- Casting from the player spell list didn't spend a slot. Now the lowest fitting slot is chosen (stepper to change), spent once on Apply / Miss, Undo returns it; spells without a slot left are disabled.

## 2026-11-06 — Spells in the Defences menu; tests stop fast

- Defences menu now includes Spells, so spell links from a stat block stay in that menu.
- A typo stopped the app from loading and every test then waited 30 s for it (about 36 min in all). The runner now stops after the first "app did not start" (15 s) and says why.

## 2026-11-06 — Defences menu

- Defences now has its own tab bar (Defences, Stat block, Edit, ✕; `ui.dmode`), rows select creatures, Stat block / Edit follow the last tapped, and the Add menu is unchanged.

## 2026-11-06 — Defences drawer, player card

- Save badges on every row cluttered the table; the 🛡 button now opens a Defences drawer (one line per creature: AC, chosen save, resistances / immunities). Saves bar removed.
- Player card: saves replaced by proficiency bonus + ability modifiers (save proficiencies highlighted), race / class / level in the header, smaller Passive Perception, spell slots by class (tap to use, Reset).
- Player saves showed "?" without an imported save list; now computed from ability + proficiency.
- Seven drawer tabs overflowed (Close cut off); tabs shorten when Edit / Defences are open; visibility test covers it.

## 2026-11-06 — AC shield

- AC number sat off-centre in a stretched background-image shield. The shield is now drawn inline (theme colours, cleaner outline) with the number on its optical centre; `icon_alignment` checks it (±2 px).

## 2026-11-06 — Initiative box

- Box was far wider than needed; now ~44 px. Placeholder shows the bonus only ("+3", was "d20+3"). Input capped to two characters and clamped to −4…49 (2024 rules range).

## 2026-11-06 — Row clean-up, pad chips, code review

- Red box around the current creature's row (and not others): the row's `turn` class also matched the turn card's `.turn` style (border, padding, max-height, scroll). Row class renamed `isturn`; row tint now on the row, not per cell (patchy blocks on phones).
- Phone rows: initiative box overflowed its 54 px column into the name; column widened, gaps added.
- Tapping AC opened Edit, getting in the way of selecting; AC is now display-only (✎ edits).
- Plain pad (no action) now shows every creature as a chip to add / remove from the selection.
- Code review: removed unused `multiSum`, `loaded` and stray locals; ESLint finds no undefined names; code map updated.

## 2026-11-06 — Parchment / Dark dungeon theme

- New look: parchment (light) and dark dungeon (dark) tokens, Cormorant Garamond display font (lining, tabular numerals forced so HP reads cleanly).
- Wider display font pushed the phone toolbar's armed "Tap again to clear" onto two lines at 320 px; round label tightened on phones.
- New standard tests: core-control visibility on three screen sizes in both themes, plus contrast.

## 2026-11-06 — Condition and spell links broke lines

- Stat block condition / spell links (`a.spl`) rendered as flex boxes, so each sat on its own line with orphaned commas. Cause: the player spell list container's `.spl{display:flex}` also matched the links; now scoped to `div.spl`. Castable spells (with ▸ or use diamonds) are now one per line on purpose (`.sg .spc` block, no joining commas); spells named in running text stay inline.

## 2026-11-06 — Sticky add controls

- Monster search, filters and Initiative / HP options scrolled away with the list; now in the sticky top with the encounter summary. Same for Party: Update from Kanka / D&D Beyond, groups and search; update messages show there too.

## 2026-11-06 — Data tab, backup, effect templates

- Export left out monster files (local only), so a new device needed two steps; the backup now includes them (optional tick) and Import restores and reloads.
- Data tab grouped into Backup / Session / Sources; "Rules" tab renamed "Spells & Conditions" ("Spells" on narrow screens).
- Effects: built-in templates and saved templates (S.fxLib).

## 2026-11-06 — Damage ends, save ends, two-type spells

- Sleep / Hypnotic Pattern / "until it takes damage" conditions stayed after damage; now removed on damage (with linked Unconscious/Incapacitated).
- Save-ends statuses had only a text reminder; now Failed / Saved buttons on the target's turn (any route that adds the status, not just a cast).
- Flame Strike, Ice Storm, Meteor Swarm preloaded only the first damage type; both now.

## 2026-11-06 — Spell review: riders, turn damage, cantrips

- Hex / Hunter's Mark (and other per-hit riders) had no damage path; now a rider box per hit, default 0, own damage type, only for targets the attacker hexed/marked.
- Start-of-turn damage effects (Burning…) were text only; now tappable with dice and type preloaded.
- Player cantrips used level-1 dice at every level (Fire Bolt 1d10 at level 5); now scale by character level.
- Guiding Bolt status gave no "adv" hint on attacks against it; added. Melee chips now warn of Armor of Agathys / Fire Shield retaliation.

## 2026-11-06 — Multi-ray spells, upcasting, cast-in-action spells, Eye Rays legendary, developing statuses

- Scorching Ray / Magic Missile / Eldritch Blast gave one roll and one damage; now one target pick per ray/dart/beam ("1 of 3"), same target allowed, cast spent once.
- Player spells couldn't be upcast; **Slot − +** in the pad header now picks the slot level (upcast dice table, extra rays/darts).
- Spells inside other actions ("casts Invisibility on itself", Oni bonus action) had no cast token; parsed as `cast` but never wired. Use / ▸ now opens the spell with the caster picked; DC from the Spellcasting action. Spells with only a condition in their text (Invisibility) now preload it.
- Beholder Glare (legendary → Eye Rays) only showed a toast; now a result picker opens the chosen ray's targeting and spends the legendary use on Apply.
- Petrification Ray stopped at Restrained; "Second Failure" is now parsed as a stage. `c.stg` shows the repeat save on the target's turn (Failed → Petrified instead of Restrained). Sleep (spell) already applied Incapacitated but never progressed; now Failed → Unconscious (linked to Sleep, so it ends with it). Flesh to Stone counts 3 failures / 3 successes.

## 2026-11-06 — Review and clean-up

- Leftover CSS from the old pad (`.oc`, `.seg`) also matched the stat block's Failure / Success labels and the drawer's setting buttons, adding a gap after "Failure:" on cards; removed with the other unused rules (`.tgh`, `.tgl`, `.tgr`). Unused Multiattack-card branch and `ui.mode` removed. Test `action_parser_and_nested_cards` renamed `action_parser_and_cards`.

## 2026-11-06 — Table line, player spells, data review

- D&D Beyond characters had no class list, so their spell save DC couldn't be worked out (only Kanka characters had one); `tools/dndbeyond.py` now writes `parsed` like the Kanka export.

## 2026-11-06 — Crit, reactions, combat log (roadmap G)

- Half damage was rounded down per damage part (7 + 3 halved gave 3 + 1 = 4 instead of 5); the total is now halved once.

## 2026-11-06 — Spells, grapples, legendary actions (roadmap F)

- Spell attack bonus was only read when written as "(+9 to hit with spell attacks)"; dragons write "(spell save DC 20, +12 to hit with spell attacks)", so their Scorching Ray showed +0. Fixed.
- The legendary bar's "Use one" is replaced by a button per legendary action (kept for creatures whose legendary actions aren't listed).

## 2026-11-06 — Targeting on a phone

- With the turn card and the pad open, the player rows were covered on a phone, so targets couldn't be picked. Targets are now chips inside the pad (opponents first). Miss moved to the pad header (Use → Miss, no target); per-target Hit/Miss buttons removed (a picked attack target is a hit). Save targets: tap a picked chip to switch Failed/Saved, ✕ to remove. Wheels stay hidden until a target is picked.

## 2026-11-06 — Tap-to-use targeting (roadmap D + E)

- Applying a save action used to take two applies (failed targets: full damage + status; saved targets: half). Now one targeting flow with per-target outcomes and one Apply. Undo used to keep only the last snapshot, so the spend after the damage would have hidden the damage from Undo; the spend inside an apply no longer takes its own snapshot.

## 2026-11-05 — Multiattack embedded in the attacks

- Multiattack was a separate card with its own Use, so the number of attacks (and the Beholder's 3 rays, each once) wasn't tracked. It is now a line above the cards; each attack it names carries its uses for the turn, shared between attacks for "in any combination"; replacements ("replace the Claw attack with Fire Breath") take the named attack's use; casting a spell that Multiattack allows counts towards it instead of using the whole action.
- Spellcasting in Multiattack ("can use Spellcasting to cast Web"): casting first no longer hides the attacks.

## 2026-11-05 — Action economy (roadmap stage C)

- Use / Used ↺ on turn-card actions; cards for a used action, bonus action or reaction are hidden until the creature's next turn. X/Day is per encounter (Andrew's choice; no long rest). The Ready/Spent recharge toggle is replaced by Use (spends it) and a "recharging ↺" button under the cards.

## 2026-11-05 — Card layout follow-up

- Nested Multiattack cards were one per row (the inner grid had no columns); now two per row like the top level.
- Multiattack showed only the parsed summary ("3× Eye Rays"), which hid wording such as "if available" and made it unclear whether Bite was extra; the card now shows the full sentence.
- Beholder Eye Rays was nested inside Multiattack as one long block; roll-table entries now get their own wide card (after the other actions) with one sub-card per ray. Other cards are sorted shortest first within their section so pairs on a row are similar in height.

## 2026-11-05 — Action parser and nested cards (roadmap stages A and B)

- `parseAct()` reads attacks (bonus, reach/range, damage parts with types, chosen-type damage, miss effects, riders, escape DC), saves (ability, DC, area, failure damage and conditions, half on success), Multiattack (counts, "in any combination", alternatives, "can replace one attack with"), Spellcasting (At will / X/Day each) and limits from the name (Recharge, X/Day, form-only tags). `tools/check_actions.py`: all monsters, 307/307 Multiattacks resolved.
- Known rough edges in Multiattack summaries: Clay Golem reads "2× Slam or Hasten" (the text means three Slams after Hasten); Aboleth's "(if available)" sits on the first of its two options.
- The nested card's class `sub` clashed with the Add tab's `.sub` (flex row); renamed `na`.

## 2026-11-05 — Concentration with no targets left

- Targeted spells (Hold Person/Monster, Hypnotic Pattern, Slow, Faerie Fire, Bane, Compelled Duel, Dominate ×3, Banishment, Polymorph, Crown of Madness, Hideous Laughter, Irresistible Dance, Phantasmal Killer, Ray of Enfeeblement, Flesh to Stone, Confusion, Fear, Sleep): when the last linked target is free, a prompt offers to end the caster's concentration. Not automatic, because the linked caster is whoever's turn it was (a readied spell links to the wrong creature) and targets may be off the board.

## 2026-11-04 — Single-condition spells

- Reverses the earlier choice to leave out spells that only impose a condition: 20 added (Charm Person/Monster, Hold Person/Monster, Entangle, Web, Black Tentacles, Flesh to Stone, Color Spray, Blindness/Deafness, Ray of Sickness, Wrathful and Staggering Smite, Dominate Beast/Person/Monster, Power Word Stun, Invisibility, Greater Invisibility). Each adds its condition, linked so it ends with the spell (concentration, expiry or removal). Older statuses that describe a condition (Hypnotic Pattern, Fear, Turn Undead, Hideous Laughter, Sleep, Ensnaring Strike, Suggestion…) now apply it the same way; Hideous Laughter's Prone stays after it ends.

## 2026-11-04 — Type wheel v2

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 20 | Selected damage type sat at the bottom of the wheel's band instead of the middle | The wheel's CSS class `tw` clashed with the table wrapper `.tw` (12 px top margin) | Class renamed; spacer and band positions are now measured from the box, so the middle item is always centred |
| 21 | Wheels stopped after a fling on iPad/phone and needed a tap before they turned again | CSS `scroll-snap-stop: always` with mandatory snapping (a known iOS sticking issue) | CSS snapping removed; the wheels snap to the nearest item in script once scrolling stops |

- Heal and Temp HP moved into the type wheel (the Damage / Heal / Temp HP buttons are gone), types grouped, the wheel loops (Radiant above Untyped), and tapping the middle item opens a grouped list.

## 2026-11-04 — Pad wheels

- Damage type is now a second wheel next to the (narrower, 3-digit) number wheel; tapping its middle item opens the full list. The spin hint is gone and Remove is a 🗑 icon.
- The Apply label didn't update while spinning the number wheel (only after the next redraw); both wheels now update it live.

## 2026-11-04 — Extra damage on the pad

- Most monster attacks deal two damage types with separate rolls; the pad now has **+ Extra**, a second amount with its own type, applied in the same Apply with independent resistances.
- Checked `monsters.json` for max HP reductions without damage: Demilich (Energy Drain), Otyugh (Bite, on a failed save), plus slow curses (Mummy, Mummy Lord, Blue Slaad, Death Dog: every 24 h or on rests). Covered by the extra type *Max HP only*.

## 2026-11-04 — One Apply on the action pad

- Spells that deal damage and add a status (Shocking Grasp, Ray of Frost…) needed two separate applies. The pad now has Damage / Heal / Temp HP, Half and Max HP − toggles, statuses picked with Status ▾ → Done, and one **Apply** that does it all (one undo step). Picking a damage spell's status sets its damage type when none is chosen.
- Max HP − now lowers max HP by the damage taken (Life Drain style) instead of a separate amount.
- iPad with the drawer open: the pad was partly under the drawer; it now sits beside it.
- A group-name variable called `nm` hid the new `nm()` name helper inside the pad handler ("nm is not a function"); renamed.

## 2026-11-04 — Status list review and D&D Beyond import

- Status list: **General** section (Dodging, Disengaged, Readied, Help / Distracted, half / 3/4 / total cover, Burning) now sits above spells. Spell and feature statuses are shown by their real names (Bless, Hunter’s Mark, Hypnotic Pattern…); saved keys are unchanged, so old encounters still load.
- Cross-checked against the SRD 5.2 spell list: added 33 lasting effects (Mage Armor, Aid, Warding Bond, Stoneskin, Protection from Energy/Poison, Fly, Mirror Image, Blink, Beacon of Hope, Death Ward, Ray of Enfeeblement, Crown of Madness…). Spells that only impose a condition (Hold Person, Web, Color Spray…) use the condition.
- D&D Beyond import: an unequipped Potion of Fire Resistance gave Aer fire resistance in the raw data; the converter only counts equipped (and attuned) items. Aer's sheet adds Mage Armour as a custom AC bonus; the converter leaves it out (AC 13) and notes it.

## 2026-11-04 — Roll tables in stat blocks

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 19 | Stat block tab showed the last monster opened with ⓘ or the search list, not the creature selected in the table (ⓘ is hidden behind the pad while selecting) | Tab only reused `S.stat` | Opening the Stat block tab now shows the most recently tapped selected creature (monster or player), or the last one selected if none is selected now. While the tab is open it follows each tap live |
| 18 | iPad: toolbar wrapped onto two lines when Undo was present and Clear was armed ("Tap again to clear all"), and in combat with End combat + Undo | Only phones (≤600 px) had a no-wrap toolbar; tablets used the wrapping desktop bar | Toolbar never wraps on any screen above phone size: Add/Saves/Table view/Clear keep labels, End combat and Undo are icon-only everywhere (Andrew's choice), armed Clear text wraps inside its button. Test covers iPad mini to 1920 px desktop |
| 17 | Typed amount box beside the wheel was squeezed to a sliver on phones | The box, hint and damage-type picker shared one row | Box removed; tap the middle (selected) number on the wheel to type, Enter or tapping away closes it; spinning still changes the amount |
| 16 | Phone: toolbar wrapped onto two lines when Undo appeared (≈390 px screens) | Phone buttons had a fixed 44 px minimum plus padding and the bar was allowed to wrap | Phone toolbar never wraps; icon buttons shrink to 34 px if needed, the armed Clear button shows its text on two small lines |
| 15 | Beholder Eye Rays (and other roll tables) were one wall of text, options hard to find | Stat block text was shown as a single paragraph | `blk()` lays out numbered results (`1: Charm Ray.` or `1-4.`) as one row each with the roll number and name as a header, and puts Failure / Success / Failure or Success on their own lines in every entry (from 2026-11-04, Andrew's choice; a compact option is noted in ROADMAP.md). Done at display time, so the JSON is unchanged and imported monster files get it too. Applies to Beholder, Death Tyrant, Beholder Zombie, Spectator, Umber Hulk, Gibbering Mouther, Elemental Cataclysm, in the stat block and the turn card |

## 2026-11-03 (evening) — iPad test feedback

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 14 | Phone: Next button squeezed during combat, Clear pushed off-screen at 360 px | Too many toolbar buttons on one line | Table view hidden on phones; Clear hidden on phones during combat (End combat first); buttons keep their size and wrap if needed |
| 13 | Phone: Close button off-screen when the Edit tab is shown | Six drawer tabs at fixed width | Tabs shrink to fit; Close becomes ✕ on phones |
| 12 | Initiative token labels ("UP NOW", "NEXT") clipped at the bottom | Label height smaller than its line height | Label height matches line height |
| 11 | "Up: Githzerai Monk 1" on a group token overlapped the initiative number | Long label wrapped onto a second line | Label is one line and shows the member number ("Up: #1") |
| 10 | Modified AC in the table shield (e.g. 21 with 16 struck through) was cramped | Two numbers in a small shield | Shield shows only the current AC (green if raised, red if lowered); base AC stays in the tooltip. Initiative tokens keep the struck-through base |

## 2026-11-03 — XP, End combat, Rules tab

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 9 | XP bar fill was invisible | Its class `bar` clashed with the round bar's styles | Renamed to `xbar` |
| 8 | Tapping a filter dropdown in the drawer could re-render the drawer and close the dropdown | Clicks on `<select>` fell through to the drawer's re-render | Clicks on dropdowns are ignored; changes are handled on `change` |

Added: encounter XP bar (planning only), End combat, player Level field, Rules tab with local SRD 5.2 spells and conditions. Test battery now 41 tests, all passing.

## 2026-11-02 — off-turn info

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 7 | Show/Hide on the turn card did nothing on a player's turn | Player cards had no collapsible content, so the toggle changed nothing | Player cards now have a body (DCs, saves, defences, traits); the button reads Show/Hide details and only appears when there is something to hide |

Added: current AC on rows and tokens (base AC set via Edit), reaction tracking, passive Perception, status save effects, player save DCs. Later the same day: legendary action/resistance pips with an In lair switch and turn-card reminders; short effects (Shield, Dodge, Guiding Bolt and others) now expire automatically; start/end-of-turn effect reminders. Removed the duplicated save-effect tags from rows (the Saves view already shows them). Then: concentration statuses linked to their caster and removed together when concentration ends; In lair saved with prepared encounters. Test battery now 39 tests, all passing.

## 2026-11-01 — pre-live-test polish

### Test battery (tests/run_tests.py, now 35 tests)
First run: 24/30. No app bugs were found; the failures were in the test harness:
- Monster images (`img/*.webp`) are kept locally and are not in the repo, so their 404s were counted as errors. The harness now ignores `/img/` 404s. The app already hides missing images.
- On a phone (390 px) the open drawer covers the whole screen, so the action pad is behind it until the drawer is closed. This is the intended phone layout, so the test now closes the drawer first at phone width.
- Edge-case tests were added (dead monsters, all-dead turns, effects in the selection, players removed from the party library, old save files, Petrified, amount 0, removing the only creature). All passed.

### Improvements after review (all tested)
Undo (one step), concentration save reminders, rule text only on selected rows, rare pad actions behind More, and start buttons on the empty screen.

### Final run
35/35 passed on two consecutive runs (no flaky tests), no console errors at six screen sizes (phone to desktop), and the Python code is pyflakes-clean.

### Fixed this session
| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 6 | Saves on a hand-made player's stat block showed "+null" for blank scores | Missing scores weren't handled | Shows "?" |
| 5 | On the player edit page, filled ability boxes sat lower than empty ones | The modifier label wrapped onto its own line | Label and modifier on one line |
| 4 | Status menu Apply button hidden behind the open stat block (laptop, iPad) | The menu opened into the drawer area, and its top could run off-screen | Menu fits left of the drawer, height capped with a pinned header; on narrow screens the pad comes in front while the menu is open. On small laptops the menu can still cover part of the stat block |
| 3 | No estimated HP for "Cleric, Forge Domain - 2" and "Fighter, Rune Knight - 3" | The class parser split on commas, leaving the class without a level | A class name starts a block; subclass and level are read from that block |
| 2 | A Kanka update didn't refresh hand-set HP even after a level-up elsewhere | Hand-set HP always won | Differences are shown with "Use Kanka HP" (per player or all) |
| 1 | Player saves didn't show in the Saves view | Only monsters were supported | Players use Kanka or hand-entered saves |

### Known limits (not bugs)
- Traits only cover features that change saves or damage taken. A draconic sorcerer's element needs a Kanka `Resistances` property.
- A Kanka update replaces ability scores and saves (Kanka is treated as the source of truth); hand-added defences are kept.
