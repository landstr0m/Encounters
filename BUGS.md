# Bug report log

Newest first. Run `python tests/run_tests.py` after every change (see the README).

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

- `parseAct()` reads attacks (bonus, reach/range, damage parts with types, chosen-type damage, miss effects, riders, escape DC), saves (ability, DC, area, failure damage and conditions, half on success), Multiattack (counts, "in any combination", alternatives, "can replace one attack with"), Spellcasting (At will / X/Day each) and limits from the name (Recharge, X/Day, form-only tags). `tools/check_actions.py`: 503/503 monsters, 307/307 Multiattacks resolved.
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
- Cross-checked against the PHB 2024 / SRD 5.2 spell list: added 33 lasting effects (Mage Armor, Aid, Warding Bond, Stoneskin, Protection from Energy/Poison, Fly, Mirror Image, Blink, Beacon of Hope, Death Ward, Ray of Enfeeblement, Crown of Madness…). Spells that only impose a condition (Hold Person, Web, Color Spray…) use the condition.
- D&D Beyond import: an unequipped Potion of Fire Resistance gave Aer fire resistance in the raw data; the converter only counts equipped (and attuned) items. Aer's sheet adds Mage Armour as a custom AC bonus; the converter leaves it out (AC 13) and notes it.

## 2026-11-04 — Roll tables in stat blocks

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 19 | Stat block tab showed the last monster opened with ⓘ or the search list, not the creature selected in the table (ⓘ is hidden behind the pad while selecting) | Tab only reused `S.stat` | Opening the Stat block tab now shows the most recently tapped selected creature (monster or player), or the last one selected if none is selected now. While the tab is open it follows each tap live |
| 18 | iPad: toolbar wrapped onto two lines when Undo was present and Clear was armed ("Tap again to clear all"), and in combat with End combat + Undo | Only phones (≤600 px) had a no-wrap toolbar; tablets used the wrapping desktop bar | Toolbar never wraps on any screen above phone size: Add/Saves/Table view/Clear keep labels, End combat and Undo are icon-only everywhere (Andrew's choice), armed Clear text wraps inside its button. Test covers iPad mini to 1920 px desktop |
| 17 | Typed amount box beside the wheel was squeezed to a sliver on phones | The box, hint and damage-type picker shared one row | Box removed; tap the middle (selected) number on the wheel to type, Enter or tapping away closes it; spinning still changes the amount |
| 16 | Phone: toolbar wrapped onto two lines when Undo appeared (≈390 px screens) | Phone buttons had a fixed 44 px minimum plus padding and the bar was allowed to wrap | Phone toolbar never wraps; icon buttons shrink to 34 px if needed, the armed Clear button shows its text on two small lines |
| 15 | Beholder Eye Rays (and other roll tables) were one wall of text, options hard to find | Stat block text was shown as a single paragraph | `blk()` lays out numbered results (`1: Charm Ray.` or `1-4.`) as one row each with the roll number and name as a header, and puts Failure / Success / Failure or Success on their own lines in every entry (from 2026-11-04, Andrew's choice; a compact option is noted in ROADMAP.md). Done at display time, so the JSON is unchanged and imported monster files get it too. Applies to Beholder, Death Tyrant, Beholder Zombie, Spectator, Umber Hulk, Gibbering Mouther, Elemental Cataclysm, in the stat block and the turn card |

## 2026-11-03 — Player's Handbook spells (`spells-phb.json`)

- The SRD 5.2 spell text is the 2024 PHB text, so only the **51 PHB spells not in the SRD** were taken from the epub (OCR text, pages 233–341). Book names of 17 SRD spells (Melf's Acid Arrow, Bigby's Hand, Tasha's Hideous Laughter…) are aliases to the SRD entries.
- **35 added** after cleaning: picture captions and page footers removed, OCR words fixed ("filied", "triry", "Sell slot", "idi0O" → 1d10, "6110" → 6d10, "witha", "Ona"…), every word spell-checked, every header field checked.
- **16 still missing** (text interleaved between columns or lost; not guessed): Arcane Gate, Arcane Vigor, Blinding Smite, Conjure Volley, Grasping Vine, Hail of Thorns, Lightning Arrow, Swift Quiver, and Summon Aberration, Beast, Celestial, Construct, Elemental, Fey, Fiend, Undead (stat blocks). None of them appear in any monster stat block (checked), so they are low priority; cross-check via the D&D Beyond connection.

## 2026-11-03 — Monster data check (all 503 entries) ✅ done, no need to repeat

Every entry in `monsters.json` (Monster Manual 2024 import) was checked once, systematically, by `tools/check_monsters.py` plus the app's own highlighter:
- **Stats:** CR, AC, ability scores, HP vs hit dice average, hit dice vs Con modifier: all 503 correct.
- **Dice in text:** all 1,192 dice expressions are written with standard characters (no en/em dashes, minus signs, `ld8`, `1 d8` or broken brackets), every `N (XdY + Z)` average matches its dice, and the app highlights 1,192 / 1,192.
- **Spell links:** 786 spell names in casting entries link to the Rules tab.
- **Text:** checked for stray OCR characters, joined words, doubled words, unbalanced brackets, cut-off entries, accented letters, attack/save/senses/speed formats and spelling (dictionary + D&D word list). **62 fixes** applied, e.g. misread "fly" in 11 speed lines (`ih 80 ft.` → `fly 80 ft.`), `can it ioe a use` → `can expend a use` (Demilich), `Wisdorr` → `Wisdom` (Kenku), `ona` → `on a` (10×), `lgnan` → `Ignan`, `reach 5 feet` → `reach 5 ft.`, stray `]`, `<a`, `’`.
- **Confirmed from the book by Andrew** and fixed: Ettercap Passive Perception 13; Nightmare `60 ft., fly 90 ft. (hover)`; Primeval Owlbear `40 ft., climb 40 ft., fly 5 ft.`; Vampire Umbral Lord `40 ft., climb 40 ft., fly 40 ft. (hover)`. The checker now reports 0 items.
- **Page-break losses** (found after Andrew spotted the Vampire Umbral Lord): Vampire Umbral Lord's right column was missing (Hunger of Hadar, Sanguine Drain, legendary actions) and was added from a photo of the book; Ancient Silver Dragon was missing its Legendary Action Uses line; Wererat's Hand Crossbow was merged into Scratch and has been split. The checker now also looks for actions a Multiattack names but that are missing, merged entries and missing Legendary Action Uses.
- **Added from book photos:** Arcanaloth (Banishing Claw, Fiendish Burst, Spellcasting, Teleport, Counterspell), Abominable Yeti (Ice Throw, Chilling Gaze, Cold Breath), Blob of Annihilation (Restraining Glob, legendary actions); Erinyes Multiattack corrected to Withering Sword. Balor and Pit Fiend confirmed: no legendary actions. Checker reports 0 items.
- Re-run `python tools/check_monsters.py` only after importing new or changed monster data.

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
- To do before v1.0: move the Monster Manual data out of the public `monsters.json`.
