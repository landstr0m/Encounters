// Encounters app, part 1 of 11: rules data: XP tables, statuses, spell effects, shared terms.
// The parts are one program cut into readable files: js/boot.js loads them in this order once the monster list (MON) exists,
// and everything they declare is global on purpose (see the code map in js/boot.js).
MON.forEach(function (m) {
  if (!m.ctype) {
    var t = (m.type || "").split(",")[0].split(" of ").pop().trim().split(" ").pop().toLowerCase();
    m.ctype = t.replace(/ies$/, "y").replace(/s$/, "");
  }
});
var TYPES = Array.from(
  new Set(
    MON.map(function (m) {
      return m.ctype;
    }).filter(Boolean),
  ),
).sort();
var CRS = ["0", "1/8", "1/4", "1/2"];
for (var q = 1; q <= 30; q++) CRS.push(String(q));

// ================= 1. RULES DATA: XP tables, statuses, spell effects, exclusions =================
// Encounter XP (2024 DMG): XP by CR, and per-character budget [Low, Moderate, High] by level.
var CRXP = {
  0: 10,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000,
};
var XPB = [
  [50, 75, 100],
  [100, 150, 200],
  [150, 225, 400],
  [250, 375, 500],
  [500, 750, 1100],
  [600, 1000, 1400],
  [750, 1300, 1700],
  [1000, 1700, 2100],
  [1300, 2000, 2600],
  [1600, 2300, 3100],
  [1900, 2900, 4100],
  [2200, 3700, 4700],
  [2600, 4200, 5400],
  [2900, 4900, 6200],
  [3300, 5400, 7800],
  [3800, 6100, 9800],
  [4500, 7200, 11700],
  [5000, 8700, 14200],
  [5500, 10700, 17200],
  [6400, 13200, 22000],
];
var crv = function (x) {
  return x === "1/8" ? 0.125 : x === "1/4" ? 0.25 : x === "1/2" ? 0.5 : +x;
};
// Shared terms: the six abilities in the three spellings the data uses (key, stat-block heading, save label; ABN in the parser maps
// full names to the same 0-5 index), the defence lists on a creature or character, and the conditions that auto-fail Str and Dex saves.
var AK = ["str", "dex", "con", "int", "wis", "cha"],
  AB = ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
  ABS = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
var DEFK = ["res", "imm", "vul", "cimm"],
  NOSAVE = ["Paralyzed", "Stunned", "Unconscious", "Petrified"];
var CONDS = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Exhaustion",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
  "Concentrating",
];
var FX = window.STATUS_FX || {};
// Temporary spell/class effects (2024 rules unless noted). [name, icon, reminder, mechanics]
// mechanics: ac=+/-AC, min=AC floor, spd=+/-ft, mul=speed multiplier, zero=speed 0, sv=[ability index or 'all', note on Saves badge]
var SPELLS = [
  ["Blessed", "✨", "Bless: +1d4 to attack rolls and saving throws.", { sv: ["all", "+d4"] }],
  ["Baned", "🥀", "Bane: −1d4 to attack rolls and saving throws.", { sv: ["all", "−d4"] }],
  [
    "Mind Sliver",
    "🧩",
    "Mind Sliver: −1d4 on its next saving throw before the end of the caster’s next turn.",
    { sv: ["all", "−d4 next"] },
  ],
  ["Hexed", "🔮", "Hex (warlock): caster deals +1d6 necrotic on each hit; disadvantage on checks with one chosen ability."],
  ["Marked", "🎯", "Hunter’s Mark: caster deals +1d6 force on each hit and has advantage on checks to find it."],
  ["Faerie Fire", "🧚", "Faerie Fire: attack rolls against it have advantage; Invisible gives no benefit."],
  ["Guiding Bolt", "🌟", "Guiding Bolt: the next attack roll against it has advantage (until end of caster’s next turn)."],
  ["Mocked", "🗯️", "Vicious Mockery: disadvantage on its next attack roll before the end of its next turn."],
  ["Chilled", "🥶", "Ray of Frost: speed −10 ft until the start of the caster’s next turn.", { spd: -10 }],
  [
    "Hasted",
    "⏩",
    "Haste: +2 AC, advantage on Dex saves, speed doubled, one extra action (one attack, Dash, Disengage, Hide or Utilize). When it ends: Lethargic.",
    { ac: 2, mul: 2, sv: [1, "adv."] },
  ],
  [
    "Slowed",
    "🐌",
    "Slow: −2 AC and Dex saves, speed halved, no reactions, action or bonus action (not both), one attack per turn. Wis save at end of each of its turns.",
    { ac: -2, mul: 0.5, sv: [1, "−2"] },
  ],
  ["Shield of Faith", "🛡️", "Shield of Faith: +2 AC.", { ac: 2 }],
  [
    "Dodging",
    "🤸",
    "Dodge: attacks against it have disadvantage, advantage on Dex saves (lost if Incapacitated or speed 0).",
    { sv: [1, "adv."] },
  ],
  [
    "Raging",
    "😡",
    "Rage: resistance to bludgeoning, piercing and slashing; +rage damage on Str attacks; advantage on Str checks and saves; no spells or concentration.",
    { sv: [0, "adv."] },
  ],
  ["Half cover", "🧱", "Half cover: +2 AC and Dex saves.", { ac: 2, sv: [1, "+2"] }],
  ["3/4 cover", "🏰", "Three-quarters cover: +5 AC and Dex saves.", { ac: 5, sv: [1, "+5"] }],
  // searchable extras
  ["Shocked", "🔌", "Shocking Grasp: can’t make Opportunity Attacks until the start of its next turn."],
  ["Frostbitten", "❄️", "Frostbite: disadvantage on its next weapon attack roll before the end of its next turn."],
  ["Chill Touch", "🖐️", "Chill Touch: can’t regain HP until the end of the caster’s next turn."],
  ["Starry Wisp", "⭐", "Starry Wisp: sheds dim light; can’t benefit from Invisible until the end of the caster’s next turn."],
  ["Blade Ward", "🗡️", "Blade Ward: attack rolls against it subtract 1d4."],
  ["Resistance", "🔰", "Resistance (cantrip): once per turn, reduce damage of the chosen type by 1d4."],
  ["Guidance", "🧭", "Guidance: +1d4 to ability checks with the chosen skill."],
  ["Shield", "🪞", "Shield (reaction): +5 AC until the start of its next turn.", { ac: 5 }],
  ["Barkskin", "🌳", "Barkskin: AC can’t be lower than 17.", { min: 17 }],
  ["Blurred", "🌫️", "Blur: attackers have disadvantage unless they don’t rely on sight (Blindsight, Truesight)."],
  [
    "Sanctuary",
    "🕊️",
    "Sanctuary: anyone targeting it with an attack or harmful spell makes a Wis save or must pick a new target. Ends if it attacks or harms an enemy.",
  ],
  ["Heroism", "🦸", "Heroism: immune to Frightened; temp HP equal to caster’s spell mod at the start of each of its turns."],
  ["Inspired", "🎵", "Bardic Inspiration: may roll the die and add it to one failed d20 test (within 1 hour)."],
  ["Reckless", "🪓", "Reckless Attack: advantage on Str attacks this turn; attacks against it have advantage until its next turn."],
  ["Enlarged", "⬆️", "Enlarge: size +1, advantage on Str checks and saves, weapon hits +1d4 damage.", { sv: [0, "adv."] }],
  ["Reduced", "⬇️", "Reduce: size −1, disadvantage on Str checks and saves, weapon hits −1d4 damage.", { sv: [0, "disadv."] }],
  ["Longstrider", "👟", "Longstrider: speed +10 ft.", { spd: 10 }],
  ["Commanded", "🫡", "Command: follows the one-word command on its next turn."],
  [
    "Dueled",
    "⚔️",
    "Compelled Duel: disadvantage on attacks against anyone but the caster; Wis save to move more than 30 ft from the caster.",
  ],
  ["Searing Smite", "🔥", "Searing Smite: 1d6 fire at the start of each of its turns until it succeeds on a Con save."],
  [
    "Burning",
    "🕯️",
    "Burning (e.g. Alchemist’s Fire): 1d4 fire at the start of each of its turns; an action and DC 10 Dex check puts it out.",
  ],
  ["Ensnared", "🌿", "Ensnaring Strike: Restrained; 1d6 piercing at the start of each of its turns; Str check to escape."],
  ["Shining Smite", "🔆", "Shining Smite: sheds light; attack rolls against it have advantage; Invisible gives no benefit."],
  [
    "Heat Metal",
    "♨️",
    "Heat Metal: 2d8 fire; if it keeps holding the object, disadvantage on attacks and checks until the start of the caster’s next turn.",
  ],
  ["Silenced", "🤫", "Silence: Deafened and can’t cast spells with a Verbal component while inside the sphere."],
  [
    "Protected",
    "🛐",
    "Protection from Evil and Good: aberrations, celestials, elementals, fey, fiends and undead have disadvantage on attacks against it.",
  ],
  [
    "Cursed",
    "🪬",
    "Bestow Curse: one of: disadvantage on checks and saves with one ability; disadvantage on attacks vs the caster; Wis save each turn or lose its action; or +1d8 necrotic from the caster.",
  ],
  [
    "Entranced",
    "🌀",
    "Hypnotic Pattern: Charmed, Incapacitated, speed 0. Ends if it takes damage or is shaken awake (action).",
    { zero: 1 },
  ],
  ["Fear", "😨", "Fear: Frightened, drops what it holds, and must Dash away from the caster on its turns."],
  [
    "Spirit Guardians",
    "👼",
    "Spirit Guardians: speed halved in the 15-ft emanation; 3d8 radiant or necrotic when it enters or starts its turn there (Wis half).",
    { mul: 0.5 },
  ],
  ["Stinking Cloud", "☁️", "Stinking Cloud: on a failed Con save, Poisoned and loses its action and bonus action while in the cloud."],
  [
    "Sleeping",
    "💤",
    "Sleep: Incapacitated until the end of its next turn on a failed Wis save, then Unconscious (repeat the save). Creatures that don\u2019t sleep, or are immune to Exhaustion, succeed automatically. Ends if it takes damage or is shaken awake (action).",
  ],
  ["Laughing", "😂", "Hideous Laughter: Prone and Incapacitated; Wis save at end of each turn and when it takes damage."],
  [
    "Confused",
    "🎲",
    "Confusion: no reactions; d10 each turn: 1 moves randomly, 2–6 does nothing, 7–8 attacks a random creature in reach, 9–10 acts normally.",
  ],
  ["Levitating", "🎈", "Levitate: floats in place; can move only by pushing or pulling on objects (speed 0).", { zero: 1 }],
  ["Polymorphed", "🐑", "Polymorph: uses the new form’s statistics; reverts when the temp HP is gone."],
  ["Banished", "🌌", "Banishment: removed to a harmless demiplane (Incapacitated) while the caster concentrates."],
  ["Lethargic", "😴", "After Haste ends: can’t move or take actions until after its next turn.", { zero: 1 }],
  ["Vowed", "😤", "Vow of Enmity (paladin): the paladin has advantage on attack rolls against it."],
  ["Turned", "☀️", "Turn Undead: Frightened and Incapacitated; must move away from the cleric. Ends if it takes damage."],
  [
    "Stun saved",
    "🥴",
    "Stunning Strike (succeeded): speed halved and the next attack roll against it has advantage, until the start of the monk’s next turn.",
    { mul: 0.5 },
  ],
  ["Open Hand", "👋", "Open Hand Technique: can’t take reactions until the start of the monk’s next turn."],
  ["Hamstrung", "🦵", "Brutal Strike – Hamstring: speed −15 ft until the start of the barbarian’s next turn.", { spd: -15 }],
  [
    "Staggered",
    "💢",
    "Brutal Strike – Staggering: disadvantage on its next saving throw and no Opportunity Attacks until the start of the barbarian’s next turn.",
    { sv: ["all", "disadv. next"] },
  ],
  ["Goaded", "📯", "Goading Attack: disadvantage on attacks against anyone but the fighter until the end of the fighter’s next turn."],
  ["Distracted", "👀", "Distracting Strike / Help: the next attack roll against it by someone else has advantage."],
  ["Halted", "🛑", "Sentinel: speed 0 for the rest of the current turn.", { zero: 1 }],
  ["Hexblade", "🪄", "Hexblade’s Curse (2014): warlock adds proficiency bonus to damage and scores a critical hit on 19–20 against it."],
  // general (any creature): shown in their own section above spells
  ["Disengaged", "🏃", "Disengage: its movement doesn’t provoke Opportunity Attacks for the rest of the turn."],
  [
    "Readied",
    "⏳",
    "Ready: holds an action for a stated trigger, used as a Reaction before the start of its next turn. A readied spell needs Concentration.",
  ],
  ["Total cover", "🚫", "Total cover: can’t be targeted directly by an attack or a spell."],
  // more lasting spells (2024 rules)
  [
    "Mage Armor",
    "🧥",
    "Mage Armor (8 h, no concentration): base AC becomes 13 + Dex while it wears no armor. Ends if it dons armor; Dispel Magic ends it.",
    { bd: 13 },
  ],
  ["Aid", "❤️", "Aid (8 h): max HP and current HP +5 (+5 per slot level above 2). Use Max HP on the pad if you track it."],
  [
    "Armor of Agathys",
    "🧊",
    "Armor of Agathys (1 h): has temp HP; a creature that hits it with a melee attack takes 5 cold (+5 per slot level above 1). Ends when the temp HP are gone.",
  ],
  [
    "Warding Bond",
    "🔗",
    "Warding Bond (1 h): +1 AC and saving throws, resistance to all damage; the caster takes the same damage. Ends beyond 60 ft or if the caster drops to 0 HP.",
    { ac: 1, sv: ["all", "+1"] },
  ],
  ["Stoneskin", "🪨", "Stoneskin: resistance to bludgeoning, piercing and slashing damage."],
  ["Protection from Energy", "🌈", "Protection from Energy: resistance to one chosen type (acid, cold, fire, lightning or thunder)."],
  ["Protection from Poison", "🧪", "Protection from Poison (1 h): advantage on saves against Poisoned; resistance to poison damage."],
  [
    "Fire Shield",
    "🌋",
    "Fire Shield (10 min): resistance to cold (warm shield) or fire (chill shield); a creature within 5 ft that hits it with a melee attack takes 2d8 fire or cold.",
  ],
  ["Divine Favor", "✝️", "Divine Favor (1 min): its weapon hits deal +1d4 radiant."],
  ["Magic Weapon", "🔪", "Magic Weapon (1 h): the touched weapon is +1 to attack and damage (+2 at slot 3–5, +3 at 6+)."],
  [
    "Elemental Weapon",
    "🌀",
    "Elemental Weapon: the touched weapon is +1 to attack and deals +1d4 of a chosen type (acid, cold, fire, lightning or thunder).",
  ],
  [
    "Crusader’s Mantle",
    "🚩",
    "Crusader’s Mantle: the caster and allies in the 30-ft aura deal +1d4 radiant on weapon and Unarmed Strike hits.",
  ],
  ["Fly", "🪽", "Fly: fly speed 60 ft and can hover. Falls when it ends, if still aloft."],
  ["Spider Climb", "🕷️", "Spider Climb: climb speed equal to its speed; moves on walls and ceilings with hands free."],
  ["Expeditious Retreat", "💨", "Expeditious Retreat: can take the Dash action as a Bonus Action."],
  ["Pass without Trace", "🍃", "Pass without Trace: +10 to Dexterity (Stealth) checks in the aura; leaves no tracks."],
  ["Enhance Ability", "💪", "Enhance Ability: advantage on ability checks with one chosen ability."],
  [
    "Blink",
    "🫧",
    "Blink (1 min): roll 1d6 at the end of each of its turns; on 4–6 it vanishes to the Ethereal Plane until the start of its next turn.",
  ],
  [
    "Mirror Image",
    "👥",
    "Mirror Image (1 min): 3 duplicates. When hit by an attack roll, roll a d6 per duplicate left; any 3+ means a duplicate is hit and destroyed instead. No effect on attackers that are Blinded or have Blindsight or Truesight.",
  ],
  [
    "Beacon of Hope",
    "🌅",
    "Beacon of Hope: advantage on Wis saves and Death Saving Throws; healing it receives is maximised.",
    { sv: [4, "adv."] },
  ],
  ["Death Ward", "⚰️", "Death Ward (8 h): the first time it would drop to 0 HP it drops to 1 instead, and the ward ends."],
  [
    "Freedom of Movement",
    "🦅",
    "Freedom of Movement (1 h): ignores difficult terrain; magic can’t reduce its speed or make it Paralyzed or Restrained; 5 ft of movement escapes a grapple; swim speed.",
  ],
  [
    "Holy Aura",
    "😇",
    "Holy Aura: advantage on all saving throws; attacks against it have disadvantage. A fiend or undead that hits it in melee makes a Con save or is Blinded.",
    { sv: ["all", "adv."] },
  ],
  ["Foresight", "🔭", "Foresight (8 h): advantage on D20 Tests; attacks against it have disadvantage.", { sv: ["all", "adv."] }],
  [
    "Ray of Enfeeblement",
    "🫥",
    "Ray of Enfeeblement: disadvantage on Strength-based D20 Tests and −1d8 on its damage rolls. Con save at the end of each of its turns ends it.",
    { sv: [0, "disadv."] },
  ],
  [
    "Witch Bolt",
    "🌩️",
    "Witch Bolt: the caster can deal 1d12 lightning to it as a Bonus Action each turn. Ends if it is more than 30 ft away or has total cover.",
  ],
  [
    "Mind Spike",
    "📍",
    "Mind Spike (1 h): the caster always knows where it is; it can’t become hidden from the caster and gains nothing from Invisible against them.",
  ],
  ["Suggestion", "💬", "Suggestion (8 h): Charmed and follows the suggested course of action. Ends if the caster or allies damage it."],
  [
    "Crown of Madness",
    "👑",
    "Crown of Madness: Charmed; must use its action before moving to make a melee attack against a creature the caster picks. Wis save at the end of each of its turns.",
  ],
  [
    "Phantasmal Force",
    "🎭",
    "Phantasmal Force: sees an illusion only it perceives; 2d8 psychic on the caster’s turns if it is in or within 5 ft of it. Study action and Int (Investigation) check to see through it.",
  ],
  [
    "Phantasmal Killer",
    "👁️",
    "Phantasmal Killer: disadvantage on ability checks and attack rolls; Wis save at the end of each of its turns, 4d10 psychic on a failure.",
  ],
  [
    "Irresistible Dance",
    "💃",
    "Irresistible Dance: Charmed, dances in place (all movement), disadvantage on Dex saves and attacks, attacks against it have advantage. Wis save at the end of each turn.",
    { zero: 1, sv: [1, "disadv."] },
  ],
  // spells that impose one condition: the condition is linked to the spell status and ends with it (concentration, expiry or removal)
  ["Charm Person", "💞", "Charm Person (1 h): Charmed by the caster. Ends if the caster or their allies damage it.", { cd: ["Charmed"] }],
  ["Charm Monster", "💞", "Charm Monster (1 h): Charmed by the caster. Ends if the caster or their allies damage it.", { cd: ["Charmed"] }],
  ["Hold Person", "🫷", "Hold Person: Paralyzed. Wis save at the end of each of its turns ends it.", { cd: ["Paralyzed"] }],
  ["Hold Monster", "🫷", "Hold Monster: Paralyzed. Wis save at the end of each of its turns ends it.", { cd: ["Paralyzed"] }],
  [
    "Entangle",
    "🌱",
    "Entangle: Restrained until the spell ends; an action and Str (Athletics) check against the spell DC to break free.",
    { cd: ["Restrained"] },
  ],
  [
    "Web",
    "🕸️",
    "Web: Restrained while in the webs; an action and Str (Athletics) check against the spell DC to break free. Webs are difficult terrain and burn.",
    { cd: ["Restrained"] },
  ],
  [
    "Black Tentacles",
    "🐙",
    "Black Tentacles: Restrained; 3d6 bludgeoning when it enters the area or starts its turn there. Str (Athletics) check as an action to escape.",
    { cd: ["Restrained"] },
  ],
  [
    "Flesh to Stone",
    "⛰️",
    "Flesh to Stone: Restrained. Con save at the end of each of its turns: 3 failures and it is Petrified, 3 successes end it.",
    { cd: ["Restrained"] },
  ],
  ["Color Spray", "🎨", "Color Spray: Blinded until the end of the caster’s next turn.", { cd: ["Blinded"] }],
  ["Blindness", "🕶️", "Blindness/Deafness (1 min): Blinded. Con save at the end of each of its turns ends it.", { cd: ["Blinded"] }],
  ["Deafness", "🦻", "Blindness/Deafness (1 min): Deafened. Con save at the end of each of its turns ends it.", { cd: ["Deafened"] }],
  ["Ray of Sickness", "🤮", "Ray of Sickness: Poisoned until the end of the caster’s next turn.", { cd: ["Poisoned"] }],
  ["Wrathful Smite", "😠", "Wrathful Smite (1 min): Frightened. Wis save at the end of each of its turns ends it.", { cd: ["Frightened"] }],
  ["Staggering Smite", "😵‍💫", "Staggering Smite: Stunned until the end of the caster’s next turn.", { cd: ["Stunned"] }],
  [
    "Dominate Beast",
    "🎮",
    "Dominate Beast: Charmed; the caster can command it telepathically. It repeats the save each time it takes damage.",
    { cd: ["Charmed"] },
  ],
  [
    "Dominate Person",
    "🎮",
    "Dominate Person: Charmed; the caster can command it telepathically. It repeats the save each time it takes damage.",
    { cd: ["Charmed"] },
  ],
  [
    "Dominate Monster",
    "🎮",
    "Dominate Monster: Charmed; the caster can command it telepathically. It repeats the save each time it takes damage.",
    { cd: ["Charmed"] },
  ],
  [
    "Power Word Stun",
    "⛔",
    "Power Word Stun: Stunned (if it has 150 HP or fewer). Con save at the end of each of its turns ends it.",
    { cd: ["Stunned"] },
  ],
  [
    "Invisibility",
    "👤",
    "Invisibility: Invisible until the spell ends; ends early after it attacks, deals damage or casts a spell.",
    { cd: ["Invisible"] },
  ],
  [
    "Greater Invisibility",
    "🌘",
    "Greater Invisibility: Invisible for the duration, even while attacking or casting.",
    { cd: ["Invisible"] },
  ],
  [
    "Contagion",
    "🦠",
    "Contagion: Poisoned, and disadvantage on saves with one chosen ability. Con save at the end of each of its turns until 3 successes (ends) or 3 failures (7 days).",
  ],
];
var SPX = {};
SPELLS.forEach(function (x) {
  FX[x[0]] = x[2];
  SPX[x[0]] = x[3] || {};
});
// Conditions that older spell statuses impose (cd: linked, end with the status; cp: added once, stay, e.g. Prone)
var LINK = {
  Entranced: { cd: ["Charmed", "Incapacitated"] },
  Fear: { cd: ["Frightened"] },
  Turned: { cd: ["Frightened", "Incapacitated"] },
  Laughing: { cd: ["Incapacitated"], cp: ["Prone"] },
  Sleeping: { cd: ["Incapacitated"] },
  Ensnared: { cd: ["Restrained"] },
  Suggestion: { cd: ["Charmed"] },
  "Crown of Madness": { cd: ["Charmed"] },
  "Irresistible Dance": { cd: ["Charmed"] },
  Contagion: { cd: ["Poisoned"] },
  Banished: { cd: ["Incapacitated"] },
};
Object.keys(LINK).forEach(function (k) {
  Object.assign(SPX[k], LINK[k]);
});
// Add a spell status's conditions (linkAdd) and drop them again once the status is gone (linkSweep, run on every redraw)
function linkAdd(c, x) {
  var o = SPX[x];
  if (!o) return;
  (o.cd || []).forEach(function (k) {
    if (c.conds.indexOf(k) < 0) {
      c.conds.push(k);
      c.lc = c.lc || {};
      c.lc[k] = x;
    }
  });
  (o.cp || []).forEach(function (k) {
    if (c.conds.indexOf(k) < 0) c.conds.push(k);
  });
}
function linkSweep(c) {
  if (!c.lc) return;
  var ch = false;
  Object.keys(c.lc).forEach(function (k) {
    var i = c.conds.indexOf(k);
    if (i < 0) {
      delete c.lc[k];
      return;
    }
    if (c.conds.indexOf(c.lc[k]) < 0) {
      c.conds.splice(i, 1);
      delete c.lc[k];
      ch = true;
    }
  });
  if (ch) incSync(c, false);
}
// Shown names (status keys stay the same in saved data): spell or feature names, so they match spell lists and searches.
var NAME = {
  Blessed: "Bless",
  Baned: "Bane",
  Hexed: "Hex",
  Marked: "Hunter’s Mark",
  Mocked: "Vicious Mockery",
  Chilled: "Ray of Frost",
  Hasted: "Haste",
  Slowed: "Slow",
  Raging: "Rage",
  Shocked: "Shocking Grasp",
  Frostbitten: "Frostbite",
  Blurred: "Blur",
  Inspired: "Bardic Inspiration",
  Reckless: "Reckless Attack",
  Enlarged: "Enlarge",
  Reduced: "Reduce",
  Commanded: "Command",
  Dueled: "Compelled Duel",
  Ensnared: "Ensnaring Strike",
  Silenced: "Silence",
  Protected: "Prot. from Evil and Good",
  Cursed: "Bestow Curse",
  Entranced: "Hypnotic Pattern",
  Laughing: "Hideous Laughter",
  Confused: "Confusion",
  Levitating: "Levitate",
  Polymorphed: "Polymorph",
  Banished: "Banishment",
  Sleeping: "Sleep",
  Lethargic: "Lethargic (Haste ended)",
  Vowed: "Vow of Enmity",
  Turned: "Turn Undead",
  "Stun saved": "Stunning Strike (saved)",
  "Open Hand": "Open Hand Technique",
  Hamstrung: "Hamstring Blow",
  Staggered: "Staggering Blow",
  Goaded: "Goading Attack",
  Distracted: "Help / Distracted",
  Halted: "Sentinel",
  Hexblade: "Hexblade’s Curse",
  Blindness: "Blindness/Deafness (blind)",
  Deafness: "Blindness/Deafness (deaf)",
};
function nm(x) {
  return NAME[x] || x;
}
// General statuses that apply to any creature, listed above the spells
var GEN = ["Dodging", "Disengaged", "Readied", "Distracted", "Half cover", "3/4 cover", "Total cover", "Burning"];
var COMMON = SPELLS.slice(0, 16)
  .map(function (x) {
    return x[0];
  })
  .filter(function (x) {
    return GEN.indexOf(x) < 0;
  })
  .concat(["Mage Armor"]);
// Pairs that can't be active together: turning one on turns the other off
var EXCL = [
  ["Half cover", "3/4 cover"],
  ["Raging", "Concentrating"],
  ["Enlarged", "Reduced"],
  ["Hasted", "Lethargic"],
  ["Stunned", "Stun saved"],
];
var ZERO = ["Grappled", "Restrained", "Paralyzed", "Petrified", "Unconscious"];
function dexMod(c) {
  var v = null;
  if (c.kind === "pc") {
    var l = S.lib.find(function (x) {
      return x.id === c.libId;
    });
    v = l && l.abil && l.abil.dex;
  } else {
    var m = MON.find(function (x) {
      return x.id === c.monId;
    });
    v = m && m.abil[1];
  }
  return v == null || v === "" ? null : Math.floor((+v - 10) / 2);
}
// Mage Armor (bd): base AC becomes 13 + Dex if that is higher (unknown Dex: assumes unarmored AC, so +3).
function effAC(c) {
  var a = +c.ac,
    mn = 0;
  c.conds.forEach(function (x) {
    var o = SPX[x];
    if (o && o.bd) {
      var d = dexMod(c);
      a = Math.max(a, d == null ? +c.ac + 3 : o.bd + d);
    }
  });
  c.conds.forEach(function (x) {
    var o = SPX[x];
    if (o) {
      a += o.ac || 0;
      if (o.min > mn) mn = o.min;
    }
  });
  return Math.max(a, mn);
}
// Off-turn info: current AC (base struck through when modified), reaction, passive Perception, save effects from statuses.
function acCls(c) {
  var e = effAC(c),
    b = +c.ac;
  return e > b ? "em up" : e < b ? "em dn" : "";
}
function acHTML(c) {
  var e = effAC(c);
  return e !== +c.ac ? '<b class="' + acCls(c) + '">' + e + "</b> <s>" + c.ac + "</s>" : "" + e;
}
// Short effects that end on their own. s = start of its next turn, e = end of its next turn;
// c* = same, but counted on the turn of whoever applied it (the creature whose turn it was).
var EXP = {
  "Color Spray": "ce",
  "Ray of Sickness": "ce",
  "Staggering Smite": "ce",
  Shield: "s",
  Dodging: "s",
  Disengaged: "s",
  Readied: "s",
  Reckless: "s",
  Shocked: "s",
  Mocked: "e",
  Frostbitten: "e",
  Lethargic: "e",
  Commanded: "e",
  Chilled: "cs",
  "Stun saved": "cs",
  "Open Hand": "cs",
  "Guiding Bolt": "ce",
  "Chill Touch": "ce",
  "Starry Wisp": "ce",
  "Mind Sliver": "ce",
};
// Developing effects: repeat the save at the end of the target's turn; enough failures turn the first status into the next.
// c.stg[status] = {to, need, rm (replace the first status), f, s (failures, successes), ab, dc, n (source)}
var STG = {
  Sleeping: { to: "Unconscious", need: 1 },
  "Flesh to Stone": { to: "Petrified", need: 3, rm: 1 },
  Contagion: { to: null, need: 3 },
};
// "save at the end of each of its turns ends it": Saved ends the status, Failed keeps it (to: null)
[
  "Hold Person",
  "Hold Monster",
  "Blindness",
  "Deafness",
  "Wrathful Smite",
  "Power Word Stun",
  "Crown of Madness",
  "Ray of Enfeeblement",
  "Slowed",
  "Phantasmal Killer",
  "Laughing",
].forEach(function (x) {
  STG[x] = { to: null, need: 1 };
});
function stgSet(t, x, o, d, n) {
  if (t.conds.indexOf(x) < 0) return;
  t.stg = t.stg || {};
  t.stg[x] = { to: o.to, need: o.need || 1, rm: !!o.rm, f: 0, s: 0, ab: d.save ? d.save.ab : null, dc: d.save ? d.save.dc : null, n: n };
}
// A repeat save for a staged or save-ends status: count successes / failures, then end it or move to the next stage.
function stgRoll(c, x, ok) {
  var g = (c.stg || {})[x];
  if (!g) return;
  snap((ok ? "save vs " : "fail vs ") + nm(x));
  if (ok) {
    g.s++;
    if (g.s >= g.need) {
      var i = c.conds.indexOf(x);
      if (i >= 0) c.conds.splice(i, 1);
      delete c.stg[x];
      linkSweep(c);
      incSync(c, false);
      toast(esc(c.name) + ": " + esc(nm(x)) + " ends");
    }
  } else if (!g.to) {
    g.f++;
    if (g.need > 1 && g.f >= g.need) {
      delete c.stg[x];
      toast(esc(c.name) + ": " + esc(nm(x)) + " \u2014 " + g.need + " failures, it lasts (no more saves)");
    } else {
      var k9 = tickOf(x);
      if (k9) {
        ui.act = null;
        finishPad();
        ui.sel = {};
        ui.sel[c.id] = true;
        ui.amt = k9.avg;
        ui.dtype = k9.dt;
      }
      toast(esc(c.name) + " fails: " + esc(nm(x)) + " continues" + (k9 ? " \u2014 damage preloaded" : ""));
    }
  } else {
    g.f++;
    if (g.f >= g.need) {
      if (g.rm) {
        var j = c.conds.indexOf(x);
        if (j >= 0) c.conds.splice(j, 1);
        linkSweep(c);
      }
      if (c.conds.indexOf(g.to) < 0 && !condBlocked(c, g.to)) {
        c.conds.push(g.to);
        if (!g.rm) {
          c.lc = c.lc || {};
          c.lc[g.to] = x;
        }
      }
      incSync(c, true);
      delete c.stg[x];
      toast(esc(c.name) + " is now " + esc(nm(g.to)));
    }
  }
  logAdd(
    esc(c.name) +
      " \u2014 " +
      esc(g.n || nm(x)) +
      ": " +
      (ok ? "saved" : "failed") +
      (g.need > 1 ? " (" + (ok ? g.s : g.f) + "/" + g.need + ")" : ""),
  );
}
// A start/end-of-turn effect's damage from its rule text ("1d4 fire", "3d8 radiant or necrotic", "temp HP"): {avg, dt}
function tickOf(x) {
  var t = FX[x] || "",
    m = t.match(
      /(\d+)d(\d+)(?:\s*\+\s*(\d+))? (acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)/i,
    );
  if (m) return { avg: Math.floor((+m[1] * (+m[2] + 1)) / 2) + (+m[3] || 0), dt: m[4].toLowerCase() };
  return /temp HP/i.test(t) ? { avg: 0, dt: "temp" } : null;
}
function stgHTML(c) {
  var G = c.stg || {};
  return Object.keys(G)
    .filter(function (x) {
      return c.conds.indexOf(x) >= 0;
    })
    .map(function (x) {
      var g = G[x];
      return (
        '<div class="legr tick"><b>End of turn: ' +
        esc(g.n || nm(x)) +
        "</b> \u2014 " +
        (g.dc ? "DC " + g.dc + " " : "") +
        (g.ab != null ? ABS[g.ab] + " " : "") +
        "save" +
        (g.need > 1 ? " (" + g.f + " failed, " + g.s + " saved of " + g.need + ")" : "") +
        ' <button data-act="stg" data-c="' +
        esc(x) +
        '" data-r="f">Failed' +
        (g.to ? " \u2192 " + esc(nm(g.to)) : "") +
        '</button><button data-act="stg" data-c="' +
        esc(x) +
        '" data-r="s">Saved' +
        (g.to || g.need > 1 ? "" : " \u2192 ends") +
        "</button></div>"
      );
    })
    .join("");
}
function expSet(c, x) {
  var k = EXP[x];
  if (!k) return;
  var src = k.charAt(0) === "c" ? S.turnId : c.id;
  if (src == null) return;
  c.exp = c.exp || {};
  c.exp[x] = { src: src, k: k.slice(-1), h: false };
}
// Runs as the turn passes from creature E to creature N; returns 'Name: effect' strings that ended.
function expTick(E, N) {
  var gone = [];
  S.list.forEach(function (c) {
    if (!c.exp) return;
    Object.keys(c.exp).forEach(function (x) {
      var o = c.exp[x],
        i = c.conds.indexOf(x);
      if (i < 0) {
        delete c.exp[x];
        return;
      }
      var end = (o.src === E && o.k === "e" && o.h) || (o.src === N && o.k === "s");
      if (end) {
        c.conds.splice(i, 1);
        delete c.exp[x];
        gone.push(c.name + ": " + x);
        incSync(c, false);
      } else if (o.src === N && o.k === "e") o.h = true;
    });
  });
  return gone;
}
// Legendary actions (refill on its turn) and Legendary Resistance (per encounter). Counts follow the In lair switch.
function legOf(c) {
  if (c.kind !== "mon") return null;
  var m = MON.find(function (x) {
    return x.id === c.monId;
  });
  if (!m) return null;
  var L = m.leg || [],
    u = L.find(function (t) {
      return /^legendary action uses/i.test(t[0]);
    }),
    la = 0,
    lr = 0,
    r;
  if (u) {
    r = /^(\d+)(?:\s*\((\d+) in lair\))?/i.exec(u[1]);
    la = r ? (S.lair && r[2] ? +r[2] : +r[1]) : 3;
  } else if (L.length) la = 3;
  var t = (m.traits || []).find(function (x) {
    return /^legendary resistance/i.test(x[0]);
  });
  if (t) {
    r = /(\d+)\/day(?:, or (\d+)\/day in lair)?/i.exec(t[0]);
    lr = r ? (S.lair && r[2] ? +r[2] : +r[1]) : 3;
  }
  return la || lr
    ? {
        la: la,
        lr: lr,
        acts: L.filter(function (x) {
          return x !== u;
        }),
      }
    : null;
}
function pips(c, k, mx) {
  var used = Math.min(mx, c[k] || 0),
    h = "";
  for (var i = 0; i < mx; i++)
    h +=
      '<button class="pip' +
      (i < mx - used ? " on" : "") +
      '" data-act="pip" data-k="' +
      k +
      '" aria-label="' +
      (i < mx - used ? "Spend" : "Restore") +
      ' one"></button>';
  return h;
}
function legHTML(c) {
  var g = legOf(c);
  if (!g) return "";
  return (
    (g.la ? '<span class="leg" title="Legendary actions: refill at the start of its turn">LA ' + pips(c, "la", g.la) + "</span>" : "") +
    (g.lr ? '<span class="leg" title="Legendary Resistance: per encounter">LR ' + pips(c, "lr", g.lr) + "</span>" : "")
  );
}
// Turn-card reminders: legendary monsters with uses left (after another creature's turn), and start/end-of-turn effects.
function remHTML(c) {
  var h = "";
  if (S.prevTurn != null && ui.legDis !== S.turnId)
    S.list.forEach(function (o) {
      var g = legOf(o);
      if (!g || !g.la || o.id === S.prevTurn || o.id === S.turnId || o.hp <= 0 || rxBlocked(o)) return;
      var left = g.la - (o.la || 0);
      if (left <= 0) return;
      var lm = MON.find(function (x) {
          return x.id === o.monId;
        }),
        LA = lm
          ? actsOf(lm).filter(function (p) {
              return p.sec === "l" && p.kind !== "info";
            })
          : [];
      h +=
        '<div class="legr" data-id="' +
        o.id +
        '"><b>\u25C6 ' +
        esc(o.name) +
        ": " +
        left +
        " legendary action" +
        (left > 1 ? "s" : "") +
        " left</b> " +
        (LA.length
          ? LA.map(function (p) {
              var no = (p.cost || 1) > left || (o.lonce || {})[p.key];
              return (
                '<button data-act="lact" data-id="' +
                o.id +
                '" data-i="' +
                p.key +
                '"' +
                (no ? " disabled" : "") +
                ">" +
                esc(p.n) +
                ((p.cost || 1) > 1 ? " <small>(" + p.cost + ")</small>" : "") +
                "</button>"
              );
            }).join("")
          : '<button data-act="laspend" data-id="' + o.id + '">Use one</button>') +
        '<button data-act="ladis" aria-label="Dismiss">\u00D7</button></div>';
      var pk =
        ui.legPick && ui.legPick.id === o.id && LA.length
          ? actsOf(lm).find(function (x) {
              return x.key === ui.legPick.t;
            })
          : null;
      if (pk && pk.table)
        h +=
          '<div class="legr lpick"><b>' +
          esc(o.name) +
          ": which result? (roll " +
          esc((rawOf(lm, pk).match(/roll (\d*d\d+)/) || [])[1] || "it") +
          ")</b> " +
          pk.table.rows
            .map(function (r, ri) {
              return '<button data-act="lray" data-r="' + ri + '"><small>' + esc(r.r) + "</small> " + esc(r.n) + "</button>";
            })
            .join("") +
          '<button data-act="lrayx">Cancel</button></div>';
    });
  var st = [],
    en = [];
  c.conds.forEach(function (x) {
    var t = FX[x] || "";
    if (/start of each of its turns|start of its turn|starts its turn/i.test(t)) st.push(x);
    if (/end of each (of its )?turns?/i.test(t)) en.push(x);
  });
  var tk = function (x) {
    return tickOf(x)
      ? '<button data-act="tick" data-c="' +
          esc(x) +
          '" title="Select this creature with the damage preloaded">' +
          esc(nm(x)) +
          " \u25b8</button>"
      : esc(nm(x));
  };
  if (st.length)
    h += '<div class="legr tick"><b>Start of turn:</b> ' + st.map(tk).join(", ") + " \u2014 roll damage or effect (rule text below)</div>";
  en = en.filter(function (x) {
    return !(c.stg || {})[x];
  });
  h += stgHTML(c);
  if (en.length)
    h += '<div class="legr tick"><b>End of turn:</b> ' + en.map(tk).join(", ") + " \u2014 save or effect (see rule text)</div>";
  return h;
}
// Concentration spells: a status added on someone's turn is linked to that caster. The caster gets Concentrating;
// when that ends (removed, 0 HP, Incapacitated, a new concentration spell) every linked status is removed.
var CONC = [
  "Blessed",
  "Baned",
  "Hexed",
  "Marked",
  "Faerie Fire",
  "Hasted",
  "Slowed",
  "Shield of Faith",
  "Blurred",
  "Heroism",
  "Enlarged",
  "Reduced",
  "Dueled",
  "Ensnared",
  "Shining Smite",
  "Heat Metal",
  "Silenced",
  "Protected",
  "Cursed",
  "Entranced",
  "Fear",
  "Spirit Guardians",
  "Stinking Cloud",
  "Laughing",
  "Confused",
  "Levitating",
  "Polymorphed",
  "Banished",
  "Sleeping",
  "Blade Ward",
  "Guidance",
  "Resistance",
  "Stoneskin",
  "Protection from Energy",
  "Elemental Weapon",
  "Crusader’s Mantle",
  "Fly",
  "Spider Climb",
  "Expeditious Retreat",
  "Pass without Trace",
  "Enhance Ability",
  "Beacon of Hope",
  "Holy Aura",
  "Ray of Enfeeblement",
  "Witch Bolt",
  "Mind Spike",
  "Suggestion",
  "Crown of Madness",
  "Phantasmal Force",
  "Phantasmal Killer",
  "Irresistible Dance",
  "Hold Person",
  "Hold Monster",
  "Entangle",
  "Web",
  "Black Tentacles",
  "Flesh to Stone",
  "Dominate Beast",
  "Dominate Person",
  "Dominate Monster",
  "Invisibility",
  "Greater Invisibility",
];
// Spells aimed at specific creatures, with no lasting area and no moving to a new target: when the last affected creature
// is free (saved, damaged awake, chip removed), the app offers to end the caster's concentration.
var TARG = [
  "Hold Person",
  "Hold Monster",
  "Entranced",
  "Slowed",
  "Faerie Fire",
  "Baned",
  "Dueled",
  "Dominate Beast",
  "Dominate Person",
  "Dominate Monster",
  "Banished",
  "Polymorphed",
  "Crown of Madness",
  "Laughing",
  "Irresistible Dance",
  "Phantasmal Killer",
  "Ray of Enfeeblement",
  "Flesh to Stone",
  "Confused",
  "Fear",
  "Sleeping",
];
function ccSet(c, x) {
  if (ui.act && ui.act.d && ui.act.d.item) return; /* potions and other items never start concentration */
  var K = findC(S.turnId);
  if (CONC.indexOf(x) < 0 || !K || K.kind === "fx") return;
  ccEnd(K, x);
  c.cc = c.cc || {};
  c.cc[x] = K.id;
  K.ccs = K.ccs || {};
  K.ccs[x] = 1;
  if (K.conds.indexOf("Concentrating") < 0 && K.conds.indexOf("Raging") < 0) K.conds.push("Concentrating");
}
// Remove statuses linked to caster K (all of them, or all but spell 'keep'); returns what ended.
function ccEnd(K, keep) {
  var gone = [];
  if (K.ccs)
    Object.keys(K.ccs).forEach(function (x) {
      if (x !== keep) delete K.ccs[x];
    });
  S.list.forEach(function (c) {
    if (!c.cc) return;
    Object.keys(c.cc).forEach(function (x) {
      if (c.cc[x] !== K.id || x === keep) return;
      delete c.cc[x];
      var i = c.conds.indexOf(x);
      if (i < 0) return;
      c.conds.splice(i, 1);
      incSync(c, false);
      gone.push(c.name + ": " + x);
      if (x === "Hasted" && c.conds.indexOf("Lethargic") < 0) {
        c.conds.push("Lethargic");
        expSet(c, "Lethargic");
        gone[gone.length - 1] += " (now Lethargic)";
      }
    });
  });
  return gone;
}
// Runs on every board render: ends concentration that can no longer be held.
function ccSweep() {
  var gone = [],
    casters = {};
  S.list.forEach(function (c) {
    Object.keys(c.cc || {}).forEach(function (x) {
      if (c.conds.indexOf(x) < 0) delete c.cc[x];
      else casters[c.cc[x]] = 1;
    });
  });
  Object.keys(casters).forEach(function (id) {
    var K = findC(id);
    if (K && K.conds.indexOf("Concentrating") >= 0 && K.hp > 0 && K.conds.indexOf("Incapacitated") < 0) return;
    if (K) {
      var i = K.conds.indexOf("Concentrating");
      if (i >= 0) K.conds.splice(i, 1);
    }
    gone = gone.concat(ccEnd(K || { id: +id }));
  });
  if (gone.length) {
    toast("Concentration ended: " + esc(gone.join(", ")));
    save();
  }
  // A targeted spell with nobody left under it: ask (once) whether the caster's concentration ends
  S.list.forEach(function (K) {
    if (!K.ccs) return;
    Object.keys(K.ccs).forEach(function (x) {
      if (
        S.list.some(function (c) {
          return c.cc && c.cc[x] === K.id;
        })
      )
        return;
      delete K.ccs[x];
      if (
        TARG.indexOf(x) >= 0 &&
        K.conds.indexOf("Concentrating") >= 0 &&
        !S.list.some(function (c) {
          return (
            c.cc &&
            Object.keys(c.cc).some(function (y) {
              return c.cc[y] === K.id;
            })
          );
        })
      )
        ui.ccAsk = { k: K.id, x: x };
    });
  });
  ccAskShow();
}
function ccAskShow() {
  var el = $("#ccask"),
    q = ui.ccAsk,
    K = q && findC(q.k);
  if (!K || K.conds.indexOf("Concentrating") < 0 || RO) {
    ui.ccAsk = null;
    if (el) el.hidden = true;
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "ccask";
    el.className = "ccask";
    el.setAttribute("role", "alertdialog");
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var Q = ui.ccAsk,
        C = Q && findC(Q.k);
      if (b.dataset.v === "end" && C) {
        snap("end concentration");
        var i = C.conds.indexOf("Concentrating");
        if (i >= 0) C.conds.splice(i, 1);
        ccEnd(C);
        save();
      }
      ui.ccAsk = null;
      el.hidden = true;
      renderBoard();
    });
  }
  el.hidden = false;
  el.innerHTML =
    "<span><b>" +
    esc(nm(q.x)) +
    "</b> has no targets left. End <b>" +
    esc(K.name) +
    '</b>\u2019s concentration?</span><button data-v="keep">Keep</button><button class="primary" data-v="end">End</button>';
}
var NORX = ["Incapacitated", "Slowed", "Confused", "Open Hand"];
function rxBlocked(c) {
  return c.conds.some(function (x) {
    return NORX.indexOf(x) >= 0 || CAUSE.indexOf(x) >= 0;
  });
}
function ppOf(c) {
  if (c.kind === "pc") {
    var l = libOf(c);
    return l && l.pp != null ? l.pp : null;
  }
  var r = /passive perception\s*(\d+)/.exec(monLine(c, /^sens/i));
  return r ? +r[1] : null;
}
// Save DCs a player sets (8 + proficiency + ability). One line per class, so multiclass characters list each.
var CDC = {
  artificer: ["int", "Spells"],
  bard: ["cha", "Spells"],
  cleric: ["wis", "Spells"],
  druid: ["wis", "Spells"],
  paladin: ["cha", "Spells"],
  ranger: ["wis", "Spells"],
  sorcerer: ["cha", "Spells"],
  warlock: ["cha", "Spells"],
  wizard: ["int", "Spells"],
  monk: ["wis", "Monk features", 2],
  rogue: ["dex", "Cunning Strike", 5],
};
var SDC = [
  [/eldritch/, "int", "Spells"],
  [/arcane/, "int", "Spells"],
  [/battle/, "str/dex", "Maneuvers"],
  [/rune/, "con", "Runes"],
];
function pcDCs(l) {
  if (!l) return [];
  var pb = pcPb(l),
    ab = l.abil || {},
    out = [];
  if (l.dc) return [{ dc: +l.dc, what: "Set by hand", hit: null }];
  var md = function (k) {
    var v = k === "str/dex" ? Math.max(ab.str || 0, ab.dex || 0) : ab[k];
    return v ? Math.floor((v - 10) / 2) : null;
  };
  (l.parsed || []).forEach(function (x) {
    var C = [],
      b = CDC[x.class];
    if (b && (x.level || 0) >= (b[2] || 1)) C.push(b);
    SDC.forEach(function (s) {
      if (s[0].test(x.subclass || "") && (x.level || 0) >= 3) C.push(s.slice(1));
    });
    C.forEach(function (r) {
      var m = md(r[0]);
      out.push({
        dc: m == null ? null : 8 + pb + m,
        hit: r[1] === "Spells" && m != null ? pb + m : null,
        what: x.class.charAt(0).toUpperCase() + x.class.slice(1) + " " + r[1].toLowerCase() + " (" + r[0].toUpperCase() + ")",
      });
    });
  });
  return out;
}
function effSpeed(c, sp) {
  var add = 0,
    mul = 1,
    zero = false;
  c.conds.forEach(function (x) {
    var o = SPX[x];
    if (ZERO.indexOf(x) >= 0 || (o && o.zero)) zero = true;
    if (o) {
      add += o.spd || 0;
      mul *= o.mul || 1;
    }
  });
  if (!zero && !add && mul === 1) return sp;
  return String(sp).replace(/(\d+)(\s*ft)/g, function (m0, n, u) {
    return (zero ? 0 : Math.max(0, Math.floor((+n + add) * mul))) + u;
  });
}
var ICON = {
  Blinded: "🙈",
  Charmed: "💘",
  Deafened: "🔇",
  Exhaustion: "😩",
  Frightened: "😱",
  Grappled: "🤼",
  Incapacitated: "💫",
  Invisible: "👻",
  Paralyzed: "⚡",
  Petrified: "🗿",
  Poisoned: "🤢",
  Prone: "🛌",
  Restrained: "⛓️",
  Stunned: "😵",
  Unconscious: "💤",
  Concentrating: "🧠",
  Dead: "💀",
};
SPELLS.forEach(function (x) {
  ICON[x[0]] = x[1];
});
var KEY = "encounter-tracker-app-v1";
var QS = location.search,
  RO = /[?&]view=(table|player)\b/.test(QS),
  NETV = RO ? (/[?&]s=([\w-]+)/.exec(QS) || [])[1] || "" : "",
  ME = NETV ? { p: (/[?&]p=([\w-]+)/.exec(QS) || [])[1] || "", k: (/[?&]k=([\w-]+)/.exec(QS) || [])[1] || "" } : null,
  NLOC = /[?&]net=local\b/.test(QS);
var WMAX = 200,
  IH = 44;
var $ = function (s) {
  return document.querySelector(s);
};
var esc = function (s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};
var mod = function (s) {
  return Math.floor((s - 10) / 2);
};
var sgn = function (n) {
  return (n >= 0 ? "+" : "") + n;
};
var d = function (n) {
  return Math.floor(Math.random() * n) + 1;
};
var isDead = function (c) {
  return c.kind === "mon" && c.hp <= 0;
};
var isPcDead = function (c) {
  return c.kind === "pc" && c.conds.indexOf("Dead") >= 0;
};
var isOut = function (c) {
  return isDead(c) || isPcDead(c);
};
