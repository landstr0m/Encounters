// Encounters app, part 7 of 11: encounter generator, end-of-combat summary, treasure, prepared encounters and the Data tab.
// ---- Themed encounter generator (Data tab). Budget: the party's XP budget (XPB) for the chosen difficulty; result lands between the tier below and the tier chosen.
// Environment: a monster's own `hab` list if the data has one, otherwise the rules below (creature types + name keywords), since the stat-block data has no habitat yet.
// Environments. Natural habitats use the same keys as a monster's hab list (a file of your own can carry one, see
// tools/appendix_b.py): a monster with a list is placed by it ("any" fits every habitat on land, an empty list means no natural
// habitat = Other planes). The keyword rules below (creature types + name words) are the fallback for monsters without a
// list (SRD-only data, homebrew files) and the only rule for sites (GSITE), which are places, not habitats.
var GHIGH =
  /goat\b|eagle|harpy|griffon|hippogriff|manticore|wyvern|roc|peryton|chimera|kobold|aarakocra|galeb|basilisk|troll|bulette|lion\b|saber|red dragon|silver dragon|copper dragon|air elemental|earth elemental|wolf|bear\b|worg|goblin|hobgoblin|bugbear|ogre|bandit|berserker|scout|gargoyle|pegasus|vulture|stone|dwarf|gnoll|axe beak|blood hawk|hawk|elk\b|werebear|xorn|cloud|storm|dust mephit/i;
var GSITE = ["crypt", "dungeon"],
  GENVOLD = { cave: "underdark", coast: "coastal" }; // GENVOLD: keys saved by earlier versions
var GENV = [
  [
    "forest",
    "Forest",
    ["plant"],
    /wolf|bear\b|boar|spider|owlbear|dryad|treant|blight|goblin|bugbear|hobgoblin|pixie|sprite|satyr|centaur|elk\b|stirge|ettercap|green hag|displacer|unicorn|awakened|worg|owl\b|weasel|badger|panther|tiger|ape\b|gnoll|bandit|scout|druid|werewolf|wereboar|weretiger|green dragon|faerie dragon|dire|constrictor|venomous snake|will-o|scarecrow|centipede|wasp|grick|troll|ogre/i,
  ],
  [
    "underdark",
    "Underdark / caves",
    ["ooze"],
    /bats?\b|spider|ooze|jelly|pudding|cube|kobold|troglodyte|darkmantle|piercer|roper|grick|hook horror|umber hulk|myconid|drow|duergar|grimlock|cloaker|mind flayer|intellect|carrion crawler|rust monster|basilisk|troll|ogre|goblin|bugbear|hobgoblin|kuo-toa|otyugh|fomorian|purple worm|xorn|gargoyle|quaggoth|stirge|violet fungus|shrieker|gas spore|beholder|gibbering|chuul|gelatinous|centipede|fire beetle|lizard|behir|deep|shadow dragon|spectator|nothic|galeb/i,
  ],
  [
    "grassland",
    "Grassland",
    [],
    /lion\b|hyena|jackal|elephant|rhinoceros|horse|pony|axe beak|gnoll|goblin|hobgoblin|bugbear|centaur|bulette|ankheg|cockatrice|vulture|eagle|hawk|pegasus|hippogriff|griffon|scarecrow|tiger|panther|boar|elk\b|deer|wolf|worg|allosaurus|ankylosaurus|triceratops|tyrannosaurus|pteranodon|chimera|manticore|gorgon|cyclops|thri-kreen|wasp|weasel|goat\b|stirge|ogre|bandit|scout/i,
  ],
  [
    "crypt",
    "Graveyard / crypt (site)",
    ["undead"],
    /cultist|necromancer|crawling claw|scarecrow|gargoyle|swarm of (rats|bats)|rats?\b|bats?\b|raven|priest|death|grave|bone|hag|imp\b|shadow|gibbering|carrion/i,
  ],
  [
    "dungeon",
    "Dungeon / ruins (site)",
    ["construct", "ooze"],
    /mimic|gelatinous|skeleton|zombie|goblin|kobold|gargoyle|rust monster|grick|carrion|stirge|rats?\b|spider|cultist|ghoul|shadow|specter|wight|mummy|bugbear|hobgoblin|minotaur|otyugh|basilisk|gibbering|flameskull|troll|owlbear|ogre|wraith|beholder|bandit|mage|doppelganger|gorgon|medusa|naga|chimera|manticore|cockatrice|darkmantle|piercer|centipede|fire beetle|ettin/i,
  ],
  [
    "swamp",
    "Swamp",
    [],
    /lizardfolk|bullywug|crocodile|hag|hydra|shambling|will-o|frog|toad|snake|stirge|black dragon|troll|yuan-ti|constrictor|insects|leech|catoblepas|vine blight|mud mephit|ghoul|zombie|ooze|pudding|rats?\b|spider|mosquito|lizard|naga|otyugh|wererat|green slaad|slaad|myconid|violet fungus|centipede|raven|ogre/i,
  ],
  ["hill", "Hills", ["giant"], GHIGH],
  ["mountain", "Mountains", ["giant"], GHIGH],
  [
    "arctic",
    "Arctic",
    [],
    /yeti|winter wolf|white dragon|polar|mammoth|frost|ice\b|remorhaz|snow|walrus|saber|owl\b|bheur|wolf|berserker|elk\b|goat\b|silver dragon|killer whale|troll|scout|bandit|griffon|air elemental|will-o|wraith|ghost|revenant/i,
  ],
  [
    "desert",
    "Desert",
    [],
    /mummy|scorpion|jackal|camel|hyena|gnoll|blue dragon|brass dragon|dust mephit|thri-kreen|lamia|sphinx|vulture|yuan-ti|djinni|efreeti|dao|purple worm|couatl|naga|snake|cockatrice|basilisk|fire elemental|salamander|phase spider|bandit|skeleton|ghoul|lizard|magmin|magma|azer|bulette|ankheg|scout|berserker|nomad|air elemental|rakshasa|gold dragon|swarm of insects|medusa|cyclops/i,
  ],
  [
    "coastal",
    "Coast",
    [],
    /shark|merfolk|sahuagin|crab|octopus|kraken|sea |sea$|water|merrow|kuo-toa|eel\b|plesiosaurus|dolphin|whale|pirate|harpy|bronze dragon|marid|quipper|chuul|aboleth|dragon turtle|hippocampus|seahorse|storm giant|triton|ghost|steam mephit|bandit|pteranodon|toad|frog|crocodile|constrictor|hag|lizardfolk|manta|squid|turtle|will-o|blue dragon|gold dragon|rats?\b|drowned|ooze/i,
  ],
  [
    "underwater",
    "Underwater",
    [],
    /shark|merfolk|sahuagin|crab|octopus|kraken|merrow|plesiosaurus|whale|piranha|quipper|seahorse|aboleth|marid|dragon turtle|squid|water elemental|sea hag|archelon|storm giant|eel\b/i,
  ],
  [
    "urban",
    "Town / city",
    [],
    /bandit|cultist|guard|noble|spy|thug|tough|assassin|mage|priest|knight|veteran|commoner|rats?\b|doppelganger|mimic|gargoyle|ghost|vampire|gladiator|pirate|scout|warrior|berserker|cat\b|mastiff|kenku|imp\b|quasit|animated|golem|homunculus|rug|specter|cambion|incubus|succubus|oni|rakshasa|performer|shadow|wight|ghoul|crawling|scarecrow|zombie|skeleton|were|hag|gelatinous|otyugh|carrion|spider|bats?\b|raven|ooze|dog\b|horse/i,
  ],
  [
    "planar",
    "Other planes",
    ["fiend", "celestial", "elemental"],
    /slaad|modron|gith|genie|djinni|efreeti|marid|dao|mind flayer|cultist|aberrant|night hag|couatl|unicorn|pegasus|sphinx|blob|nightmare/i,
  ],
];
var GTYP = [
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead",
];
var GSHAPE = [
  ["mix", "Any mix"],
  ["boss", "Leader and followers"],
  ["horde", "Many weak"],
  ["few", "Few strong"],
];
// Theme packs (same shape as GENV): a pack replaces the environment filter.
var GPACK = [
  ["goblin", "Goblin warband", [], /goblin|hobgoblin|bugbear|worg|wolf\b/i],
  ["undead", "Undead rising", ["undead"], /necromancer|death cultist/i],
  ["cult", "Cult ritual", [], /cultist|imp\b|quasit|dretch|lemure|manes|shadow\b|priest|cambion|hell hound/i],
  ["bandit", "Bandit ambush", [], /bandit|tough|scout|spy|pirate|mastiff|assassin|berserker/i],
  ["kobold", "Kobold den", [], /kobold|wyrmling|drake|giant lizard|stirge|rats?\b/i],
  ["pack", "Hunting pack", [], /wolf|worg|hyena|jackal|gnoll|death dog|lion\b|panther|tiger|saber/i],
  ["spider", "Spider nest", [], /spider|ettercap|swarm of insects|drider|drow/i],
  ["swampfolk", "Swamp raiders", [], /lizardfolk|bullywug|crocodile|giant frog|giant toad|constrictor/i],
  ["fey", "Fey mischief", ["fey"], /dryad|satyr|pixie|sprite|blink dog|will-o/i],
  ["elem", "Elemental surge", ["elemental"], /mephit|azer|magmin|salamander/i],
  ["ooze", "Ooze and fungus", ["ooze"], /myconid|violet fungus|shrieker|gas spore|shambling/i],
  ["vault", "Vault guardians", ["construct"], /mimic|gargoyle|animated|golem|helmed|shield guardian|flameskull/i],
];
var TWISTS = [
  ["Terrain", "Difficult terrain covers half the area (rubble, mud or roots)."],
  ["Terrain", "High ground: a ledge 10 feet up gives ranged attackers cover."],
  ["Terrain", "A chasm or stream splits the area, with one narrow crossing."],
  ["Terrain", "Fog or dim light: Lightly Obscured beyond 30 feet."],
  ["Terrain", "Tight quarters: only two creatures can fight side by side."],
  ["Terrain", "Plenty of cover: pillars, trees or crates every 10 feet."],
  ["Hazard", "Something is burning; the fire spreads 5 feet each round."],
  ["Hazard", "Unstable footing: DC 10 Dexterity save or Prone when a creature Dashes."],
  ["Hazard", "A hidden pit or snare lies between the two sides."],
  ["Hazard", "Rising water or sliding sand: the low ground is lost on round 4."],
  ["Hazard", "Noise here brings something else in 1d4 rounds."],
  ["Hazard", "Brittle floor or ice: heavy impacts crack it."],
  ["Objective", "They guard a prisoner, a chest or a lever. Reaching it ends the fight."],
  ["Objective", "One enemy carries a message or key and tries to escape with it."],
  ["Objective", "A bystander is in danger and needs protecting."],
  ["Objective", "The enemies want captives: they knock out and drag away."],
  ["Objective", "A ritual or mechanism completes at the end of round 4 unless interrupted."],
  ["Objective", "The enemies are fighting each other when the party arrives."],
  ["Timing", "Reinforcements arrive on round 3: add half the followers again."],
  ["Timing", "The enemies are caught off guard: eating, sleeping or arguing."],
  ["Timing", "Ambush: the enemies are hidden; compare Stealth with Passive Perception."],
  ["Timing", "The leader holds back until the first follower falls."],
  ["Timing", "They flee at the first casualty and return later with help."],
  ["Social", "They can be talked down: hungry, lost or under orders they dislike."],
  ["Social", "One of them recognises a party member."],
  ["Social", "They offer a trade or a toll before weapons are drawn."],
];
function genOpt() {
  S.gen = S.gen || {};
  var G = S.gen;
  G.env = GENVOLD[G.env] || G.env;
  if (
    G.env == null ||
    !GENV.some(function (e) {
      return e[0] === G.env;
    })
  )
    G.env = "";
  if (G.typ == null) G.typ = "";
  if (G.diff == null) G.diff = 1;
  if (!G.shape) G.shape = "mix";
  if (G.pack == null) G.pack = "";
  if (G.tw == null) G.tw = true;
  if (G.fresh == null) G.fresh = false;
  return G;
}
function genRule(e, m) {
  if (!e[4]) e[4] = new RegExp("\\b(?:" + e[3].source + ")", "i");
  /* keywords match at the start of a word (so "rat" does not match Infiltrator) */ return e[2].indexOf(m.ctype) >= 0 || e[4].test(m.name);
}
function genFits(m, env, pack) {
  if (pack) {
    var k = GPACK.find(function (x) {
      return x[0] === pack;
    });
    return !!k && genRule(k, m);
  }
  env = GENVOLD[env] || env;
  var e =
    env &&
    GENV.find(function (x) {
      return x[0] === env;
    });
  if (!e) return true;
  if (Array.isArray(m.hab) && GSITE.indexOf(env) < 0) {
    var H = m.hab.map(function (x) {
      return String(x).toLowerCase();
    });
    return env === "planar" ? !H.length : H.indexOf(env) >= 0 || (env !== "underwater" && H.indexOf("any") >= 0);
  }
  return genRule(e, m);
}
function crNum(cr) {
  return cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : +cr;
}
function genBudget(diff) {
  var P = S.list.filter(function (c) {
      return c.kind === "pc";
    }),
    L = P.map(function (c) {
      return pcLvl(libOf(c));
    }).filter(Boolean);
  if (!P.length) return { err: "Add the party first: the budget comes from the players in the tracker." };
  if (!L.length) return { err: "No character in the party has a level yet (✎ Edit, or update from Kanka / D&D Beyond)." };
  var avg = Math.round(
      L.reduce(function (a, b) {
        return a + b;
      }, 0) / L.length,
    ),
    miss = P.length - L.length;
  while (L.length < P.length) L.push(avg);
  var B = [0, 0, 0];
  L.forEach(function (v) {
    var r = XPB[Math.min(20, v) - 1];
    B[0] += r[0];
    B[1] += r[1];
    B[2] += r[2];
  });
  return {
    B: B,
    hi: B[diff],
    lo: diff ? B[diff - 1] : Math.round(B[0] / 2),
    avg: avg,
    miss: miss,
    pn: P.length,
    cap: Math.max(1, avg) + (diff === 2 ? 1 : 0),
    maxN: Math.max(6, P.length * 2),
  };
}
// keep: locked items [{id,name,cr,n,lock}] from the last roll; the rest of the budget is rolled again around them.
function genRoll(keep) {
  var G = genOpt(),
    U = genBudget(G.diff);
  if (U.err) return U;
  keep = keep || [];
  var X = function (m) {
      return CRXP[String(m.cr)] || 0;
    },
    rnd = function (A) {
      return A[Math.floor(Math.random() * A.length)];
    },
    ri = function (a, b) {
      return b < a ? a : a + Math.floor(Math.random() * (b - a + 1));
    };
  var kx = keep.reduce(function (a, i) {
      return a + X(i) * i.n;
    }, 0),
    kn = keep.reduce(function (a, i) {
      return a + i.n;
    }, 0),
    hi = U.hi - kx,
    lo = Math.max(0, U.lo - kx),
    maxN = Math.max(0, U.maxN - kn),
    P = { length: U.pn };
  var base = MON.filter(function (m) {
    return (
      X(m) >= 25 &&
      X(m) <= hi &&
      crNum(m.cr) <= U.cap &&
      genFits(m, G.env, G.pack) &&
      (!G.typ || m.ctype === G.typ) &&
      !keep.some(function (i) {
        return i.id === m.id;
      })
    );
  });
  var cut = Date.now() - 30 * 864e5,
    pool = G.fresh
      ? base.filter(function (m) {
          return !(S.seen && S.seen[m.id] > cut);
        })
      : base,
    stale = G.fresh && !pool.length && base.length > 0;
  if (stale) pool = base;
  var best = null;
  if (!pool.length || maxN < 1) {
    if (!keep.length) return { err: "No monsters fit these options at this party level. Try another environment, theme or creature type." };
    best = { items: [], xp: 0, cnt: 0, fit: kx > U.lo };
  }
  var kin = function (a, F) {
    var K = F.filter(function (m) {
      return m.ctype === a.ctype && m.id !== a.id;
    });
    return K.length && Math.random() < 0.75 ? rnd(K) : rnd(F);
  };
  var tryOne = function () {
    var sh = G.shape === "mix" ? rnd(["boss", "boss", "horde", "few"]) : G.shape,
      It = [],
      a,
      b,
      F,
      n;
    if (sh === "boss") {
      F = pool.filter(function (m) {
        return X(m) >= hi * 0.35;
      });
      a = rnd(F.length ? F : pool);
      It.push([a, 1]);
      F = pool.filter(function (m) {
        return X(m) <= X(a) / 2 && X(m) <= hi - X(a);
      });
      if (F.length) {
        b = kin(a, F);
        n = ri(1, Math.min(maxN - 1, Math.floor((hi - X(a)) / X(b))));
        if (n > 0) It.push([b, n]);
      }
    } else if (sh === "horde") {
      F = pool.filter(function (m) {
        return X(m) <= hi / Math.max(3, P.length);
      });
      a = rnd(F.length ? F : pool);
      n = ri(Math.min(3, Math.floor(hi / X(a)) || 1), Math.min(maxN, Math.floor(hi / X(a)) || 1));
      It.push([a, n]);
      if (Math.random() < 0.4 && F.length > 1) {
        b = kin(a, F);
        var left = Math.floor((hi - X(a) * n) / X(b));
        if (b.id !== a.id && left > 0 && n < maxN) It.push([b, ri(1, Math.min(left, maxN - n))]);
      }
    } else {
      F = pool.filter(function (m) {
        return X(m) >= hi / 4;
      });
      a = rnd(F.length ? F : pool);
      n = ri(1, Math.min(3, Math.floor(hi / X(a)) || 1));
      It.push([a, n]);
      if (Math.random() < 0.5) {
        F = pool.filter(function (m) {
          return X(m) >= hi / 5 && X(m) <= hi - X(a) * n && m.id !== a.id;
        });
        if (F.length) It.push([kin(a, F), 1]);
      }
    }
    var xp = It.reduce(function (s, i) {
        return s + X(i[0]) * i[1];
      }, 0),
      cnt = It.reduce(function (s, i) {
        return s + i[1];
      }, 0);
    return {
      items: It.map(function (i) {
        return { id: i[0].id, name: i[0].name, cr: i[0].cr, n: i[1] };
      }),
      xp: xp,
      cnt: cnt,
    };
  };
  if (!best)
    for (var t = 0; t < 600; t++) {
      var r = tryOne();
      if (r.xp > hi || r.cnt > maxN) continue;
      if (r.xp > lo) {
        best = r;
        best.fit = true;
        break;
      }
      if (!best || r.xp > best.xp) best = r;
    }
  if (!best) {
    if (!keep.length) return { err: "Could not build an encounter inside the budget. Try other options." };
    best = { items: [], xp: 0, cnt: 0 };
  }
  best.items = keep.concat(best.items);
  best.xp += kx;
  best.cnt += kn;
  best.stale = stale;
  best.lo = U.lo;
  best.hi = U.hi;
  best.B = U.B;
  best.miss = U.miss;
  best.avg = U.avg;
  best.lab = best.xp <= U.B[0] ? "Low" : best.xp <= U.B[1] ? "Moderate" : "High";
  if (G.tw) best.twist = rnd(TWISTS);
  return best;
}
function genTitle(R) {
  var G = genOpt(),
    th = (GPACK.find(function (x) {
      return x[0] === G.pack;
    }) ||
      GENV.find(function (x) {
        return x[0] === G.env;
      }) ||
      [])[1];
  return (
    (th ? th + ": " : "") +
    R.items
      .map(function (i) {
        return (i.n > 1 ? i.n + " " : "") + i.name;
      })
      .join(" + ") +
    " (" +
    R.lab +
    ")"
  );
}
// Builds the creatures of a roll exactly as addMon would, without touching the tracker (for the encounter library).
function genList(R) {
  var keepL = S.list,
    keepN = S.next;
  S.list = [];
  R.items.forEach(function (i) {
    addMon(i.id, i.n);
  });
  var L = S.list;
  S.list = keepL;
  S.next = keepN;
  return L;
}
function genTwistFx(R) {
  return R.twist
    ? {
        id: S.next++,
        kind: "fx",
        name: "Twist (" + R.twist[0].toLowerCase() + ")",
        desc: R.twist[1],
        init: 20,
        vis: false,
        ac: 0,
        hp: 0,
        max: 0,
        temp: 0,
        conds: [],
        cr: "",
        spent: {},
        dd: "",
        dt: "",
        sv: "",
        dc: "",
        st: "",
        dur: "",
      }
    : null;
}
// Auto-rescale: S.genLast remembers the generated monsters and the party size; when the budget changes, add or drop the most numerous kind.
function genDrift() {
  var Z = S.genLast;
  if (!Z) return null;
  var M = S.list.filter(function (c) {
    return c.kind === "mon" && Z.ids.indexOf(c.id) >= 0 && c.hp > 0;
  });
  if (!M.length || S.turnId != null) return null;
  var U = genBudget(Z.diff);
  if (U.err) return null;
  var xp = M.reduce(function (a, c) {
    return a + (CRXP[String(c.cr)] || 0);
  }, 0);
  return (U.pn !== Z.pn || U.hi !== Z.hi) && (xp > U.hi || xp <= U.lo) ? { U: U, M: M, xp: xp } : null;
}
// The party changed after generating: add or drop generated monsters until the encounter fits the new budget (one Undo).
function genRescale() {
  var D = genDrift();
  if (!D) return;
  var Z = S.genLast,
    U = D.U,
    xp = D.xp,
    X = function (c) {
      return CRXP[String(c.cr)] || 0;
    };
  var cnt = {};
  D.M.forEach(function (c) {
    cnt[c.monId] = (cnt[c.monId] || 0) + 1;
  });
  var kind = Object.keys(cnt).sort(function (a, b) {
    return (
      cnt[b] - cnt[a] ||
      X(
        D.M.find(function (c) {
          return c.monId === a;
        }),
      ) -
        X(
          D.M.find(function (c) {
            return c.monId === b;
          }),
        )
    );
  })[0];
  var one = X(
      D.M.find(function (c) {
        return c.monId === kind;
      }),
    ),
    n = 0;
  snap("rescale encounter");
  while (xp > U.hi) {
    var Gm = S.list.filter(function (c) {
      return c.kind === "mon" && Z.ids.indexOf(c.id) >= 0 && c.hp > 0;
    });
    if (Gm.length <= 1) break;
    var kc = {};
    Gm.forEach(function (c) {
      kc[c.monId] = (kc[c.monId] || 0) + 1;
    });
    var vk = Gm.slice().sort(function (a, b) {
        return kc[b.monId] - kc[a.monId] || X(a) - X(b);
      })[0].monId,
      last = Gm.filter(function (c) {
        return c.monId === vk;
      }).pop();
    S.list = S.list.filter(function (c) {
      return c !== last;
    });
    xp -= X(last);
    n--;
  }
  while (xp <= U.lo && xp + one <= U.hi && D.M.length + n < U.maxN) {
    var n0 = S.next;
    addMon(kind, 1);
    for (var i = n0; i < S.next; i++) Z.ids.push(i);
    xp += one;
    n++;
  }
  Z.pn = U.pn;
  Z.hi = U.hi;
  save();
  renderAll();
  toast(
    n ? "Rescaled: " + (n > 0 ? "added " + n : "removed " + -n) + " · now " + xp + " XP" : "No simple change fits; roll a new encounter.",
  );
}
// End of combat: XP (fled monsters count as defeated) and suggested loot (coins by CR for creatures that carry things; fled ones take theirs along).
function endSummary() {
  var M = S.list.filter(function (c) {
      return c.kind === "mon" && c.hp <= 0;
    }),
    P = S.list.filter(function (c) {
      return c.kind === "pc";
    });
  if (!M.length) {
    S.endSum = null;
    return;
  }
  var xp = M.reduce(function (a, c) {
      return a + (CRXP[String(c.cr)] || 0);
    }, 0),
    d = function (n, f) {
      var t = 0;
      while (n--) t += 1 + Math.floor(Math.random() * f);
      return t;
    },
    gp = 0,
    pp = 0,
    it = [];
  M.forEach(function (c) {
    var m = MON.find(function (x) {
      return x.id === c.monId;
    });
    if (c.fled || !m || ["beast", "ooze", "plant", "elemental", "construct"].indexOf(m.ctype) >= 0 || /^swarm/i.test(m.name)) return;
    var cr = crNum(c.cr);
    if (cr <= 4) gp += d(3, 6);
    else if (cr <= 10) gp += d(2, 8) * 10;
    else if (cr <= 16) pp += d(2, 10) * 10;
    else pp += d(2, 8) * 100;
    if (Math.random() < 1 / 6)
      it.push(
        ["Potion of Healing", "Acid", "Alchemist’s Fire", "Holy Water", "Oil", "Antitoxin", "Basic Poison"][Math.floor(Math.random() * 7)],
      );
  });
  S.loot = lootBuild(gp + pp * 10, it);
  S.endSum = {
    t: new Date().toISOString(),
    xp: xp,
    each: P.length ? Math.floor(xp / P.length) : 0,
    pn: P.length,
    n: M.length,
    fled: M.filter(function (c) {
      return c.fled;
    }).length,
    loot: [S.loot.gp ? S.loot.gp + " GP" : ""]
      .concat(
        S.loot.items.map(function (i) {
          return i.n + " (" + i.v + " GP)";
        }),
        it,
      )
      .filter(Boolean),
  };
  logAdd(
    "Summary: <b>" +
      xp +
      " XP</b>" +
      (P.length ? " (" + S.endSum.each + " each for " + P.length + ")" : "") +
      " · " +
      M.length +
      " defeated" +
      (S.endSum.fled ? ", " + S.endSum.fled + " of them fled" : "") +
      (S.endSum.loot.length ? " · loot: " + esc(S.endSum.loot.join(", ")) : ""),
  );
}
function endHTML() {
  var E = S.endSum;
  if (!E) return "";
  return (
    '<div class="lib endsum"><span class="grow"><b>Last combat: ' +
    E.xp +
    " XP</b>" +
    (E.pn ? " · " + E.each + " each for " + E.pn + " players" : "") +
    '<br><span class="meta">' +
    E.n +
    " defeated" +
    (E.fled ? " (" + E.fled + " fled)" : "") +
    ' · treasure below</span></span><button class="x" data-act="endclr" aria-label="Dismiss summary">×</button></div>'
  );
}
// ---- Treasure: coins, a few valuables for flavour, diamonds from 300 GP up (for Revivify and the like), a split per player, and a Discord post.
// Gem names are ordinary minerals by value; the art objects are our own short descriptions. S.hook (Discord webhook URL) stays on this device and in the backup only.
var GEMS = {
  10: [
    "azurite",
    "banded agate",
    "blue quartz",
    "eye agate",
    "hematite",
    "lapis lazuli",
    "malachite",
    "moss agate",
    "obsidian",
    "rhodochrosite",
    "tiger eye",
    "turquoise",
  ],
  50: [
    "bloodstone",
    "carnelian",
    "chalcedony",
    "chrysoprase",
    "citrine",
    "jasper",
    "moonstone",
    "onyx",
    "quartz",
    "sardonyx",
    "star rose quartz",
    "zircon",
  ],
  100: ["amber", "amethyst", "chrysoberyl", "coral", "garnet", "jade", "jet", "pearl", "spinel", "tourmaline"],
  500: ["alexandrite", "aquamarine", "black pearl", "blue spinel", "peridot", "topaz"],
  1000: ["black opal", "blue sapphire", "emerald", "fire opal", "opal", "star ruby", "star sapphire", "yellow sapphire"],
  5000: ["black sapphire", "jacinth", "ruby"],
};
var ARTS = {
  25: ["a silver signet ring", "a set of ivory dice", "a lacquered wooden mask", "a jade hairpin", "an engraved silver locket"],
  250: [
    "a string of freshwater pearls",
    "a gold brooch shaped like a leaf",
    "a small bronze idol",
    "a silver goblet chased with vines",
    "a gold armband",
  ],
  750: ["a gem-set gold circlet", "a framed miniature portrait in gold", "a silver dagger with a garnet pommel"],
  2500: ["a platinum ring with a star sapphire", "a gold-and-enamel music box"],
};
function lootBuild(v, cons) {
  v = Math.max(0, Math.floor(+v || 0));
  var it = [],
    rest = v,
    P = function (A) {
      return A[Math.floor(Math.random() * A.length)];
    };
  if (S.lootConv !== false) {
    if (rest >= 1000) {
      it.push({ n: "a diamond", v: 500 });
      rest -= 500;
    }
    if (rest >= 300) {
      it.push({ n: "a diamond", v: 300 });
      rest -= 300;
    }
    var bud = Math.floor(rest / 2),
      T = [5000, 2500, 1000, 750, 500, 250, 100, 50, 25, 10],
      k = 0;
    while (k < 3) {
      var t = T.find(function (x) {
        return x <= bud;
      });
      if (!t) break;
      var gem = GEMS[t] && (!ARTS[t] || Math.random() < 0.5);
      var g = gem ? P(GEMS[t]) : "";
      it.push({ n: gem ? (/^[aeiou]/.test(g) ? "an " : "a ") + g + " gemstone" : P(ARTS[t]), v: t });
      bud -= t;
      rest -= t;
      k++;
    }
  }
  var L = { v: v, gp: rest, items: it, cons: (cons || []).slice(), t: new Date().toISOString() };
  L.split = lootSplit(L);
  return L;
}
// Valuables go to whoever has least so far (largest first); coins then even the shares out as far as they can.
function lootSplit(L) {
  var N = S.list
    .filter(function (c) {
      return c.kind === "pc";
    })
    .map(function (c) {
      return c.name;
    });
  if (!N.length) return [];
  var Sh = N.map(function (n) {
      return { name: n, v: 0, gp: 0, items: [] };
    }),
    low = function () {
      var m = Math.min.apply(
          null,
          Sh.map(function (s) {
            return s.v;
          }),
        ),
        C = Sh.filter(function (s) {
          return s.v === m;
        });
      return C[Math.floor(Math.random() * C.length)];
    };
  L.items
    .slice()
    .sort(function (a, b) {
      return b.v - a.v;
    })
    .forEach(function (i) {
      var s = low();
      s.items.push(i.n + " (" + i.v + " GP)");
      s.v += i.v;
    });
  var k0 = Math.floor(Math.random() * Sh.length);
  L.cons.forEach(function (c, i) {
    Sh[(k0 + i) % Sh.length].items.push(c);
  });
  var tgt =
      (L.gp +
        Sh.reduce(function (a, s) {
          return a + s.v;
        }, 0)) /
      Sh.length,
    need = Sh.map(function (s) {
      return Math.max(0, tgt - s.v);
    }),
    sum = need.reduce(function (a, b) {
      return a + b;
    }, 0),
    left = L.gp;
  Sh.forEach(function (s, i) {
    s.gp = sum ? Math.floor((L.gp * need[i]) / sum) : 0;
    left -= s.gp;
  });
  Sh.slice()
    .sort(function (a, b) {
      return a.v + a.gp - (b.v + b.gp);
    })
    .forEach(function (s) {
      if (left > 0) {
        s.gp++;
        left--;
      }
    });
  return Sh;
}
function lootText() {
  var L = S.loot,
    E = S.endSum;
  if (!L) return "";
  var t = "**Treasure" + (S.envName ? " — " + S.envName : "") + "** (about " + L.v + " GP in total)\n";
  if (L.split.length)
    t += L.split
      .map(function (s) {
        return "• **" + s.name + "**: " + [s.gp ? s.gp + " GP" : ""].concat(s.items).filter(Boolean).join(", ");
      })
      .join("\n");
  else
    t += [L.gp ? L.gp + " GP" : ""]
      .concat(
        L.items.map(function (i) {
          return i.n + " (" + i.v + " GP)";
        }),
        L.cons,
      )
      .filter(Boolean)
      .join(", ");
  if (E) t += "\nXP: " + E.xp + (E.pn ? " (" + E.each + " each)" : "");
  return t.slice(0, 1900);
}
function discordSend(text, what) {
  if (!/^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(S.hook || "")) {
    toast("Add a Discord webhook link first (Data → Session → Treasure).");
    return;
  }
  fetch(S.hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Encounters", content: text }),
  }).then(
    function (r) {
      toast(r.ok ? what + " sent to Discord" : "Discord refused the message (" + r.status + "). Check the webhook link.");
    },
    function () {
      toast("Could not reach Discord. Check the connection.");
    },
  );
}
function lootHTML() {
  var L = S.loot,
    ok = /^https:\/\/\S+\/api\/webhooks\//.test(S.hook || "");
  var h =
    '<div class="row lootr"><input id="lootv" type="number" inputmode="numeric" min="0" max="999999" placeholder="GP" value="' +
    (L ? L.v : "") +
    '" aria-label="Treasure value in GP"><button class="add" data-act="lootgo">' +
    (L ? "Build again" : "Build treasure") +
    '</button><button data-act="lootsend"' +
    (L ? "" : " disabled") +
    ">Send to Discord</button></div>" +
    '<div class="lib"><label><input type="checkbox" data-act="lootconv"' +
    (S.lootConv !== false ? " checked" : "") +
    "><span>Turn part of the coins into gems, art objects and jewellery; diamonds from 300 GP (for Revivify and similar)</span></label></div>";
  if (L)
    h +=
      '<div class="lootl">' +
      (L.split.length
        ? L.split
            .map(function (s) {
              return (
                '<div class="lib"><span class="grow"><b>' +
                esc(s.name) +
                '</b><br><span class="meta">' +
                esc([s.gp ? s.gp + " GP" : ""].concat(s.items).filter(Boolean).join(", ") || "nothing this time") +
                "</span></span></div>"
              );
            })
            .join("")
        : "<p>" +
          esc(
            [L.gp ? L.gp + " GP" : ""]
              .concat(
                L.items.map(function (i) {
                  return i.n + " (" + i.v + " GP)";
                }),
                L.cons,
              )
              .filter(Boolean)
              .join(", ") || "Nothing",
          ) +
          ' <span class="muted">(add the party to split it)</span></p>') +
      "</div>";
  h +=
    '<div class="row lootr"><input id="hookurl" type="url" data-act="hook" placeholder="Discord webhook link (kept on this device)" value="' +
    esc(S.hook || "") +
    '" aria-label="Discord webhook link" style="flex:1 1 260px"></div>' +
    (S.hook && !ok ? "<p><b>That does not look like a Discord webhook link.</b></p>" : "");
  return h;
}
function lootAct(act) {
  if (act === "lootgo") {
    var v = $("#lootv").value;
    if (v === "" || isNaN(+v)) {
      toast("Enter a value in GP first.");
      return;
    }
    S.loot = lootBuild(+v, S.loot && S.loot.v === Math.floor(+v) ? S.loot.cons : []);
    save();
    renderDrawer();
  } else if (act === "lootsend" && S.loot) discordSend(lootText(), "Treasure");
}
// Encounter generator card: option selects, switches, the rolled result (keep, stat block, twist) and its XP line.
function genHTML() {
  var G = genOpt(),
    R = ui.genRes,
    f = function (n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    D = genDrift();
  var sel = function (k, opts, lab) {
    return (
      '<select data-act="gen" data-k="' +
      k +
      '" aria-label="' +
      lab +
      '"' +
      (k === "env" && G.pack ? " disabled" : "") +
      ">" +
      opts
        .map(function (o) {
          return '<option value="' + o[0] + '"' + (String(G[k]) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
        })
        .join("") +
      "</select>"
    );
  };
  var chk = function (k, on, lab) {
    return (
      '<div class="lib"><label><input type="checkbox" data-act="genchk" data-k="' +
      k +
      '"' +
      (on ? " checked" : "") +
      "><span>" +
      lab +
      "</span></label></div>"
    );
  };
  var h =
    '<div class="flt genf">' +
    sel(
      "diff",
      [
        [0, "Low difficulty"],
        [1, "Moderate difficulty"],
        [2, "High difficulty"],
      ],
      "Difficulty",
    ) +
    sel("shape", GSHAPE, "Group shape") +
    sel(
      "pack",
      [["", "No theme pack"]].concat(
        GPACK.map(function (e) {
          return [e[0], e[1]];
        }),
      ),
      "Theme pack",
    ) +
    sel(
      "env",
      [["", "Any environment"]].concat(
        GENV.map(function (e) {
          return [e[0], e[1]];
        }),
      ),
      "Environment",
    ) +
    sel(
      "typ",
      [["", "Any creature type"]].concat(
        GTYP.map(function (t) {
          return [t, t.charAt(0).toUpperCase() + t.slice(1)];
        }),
      ),
      "Creature type",
    ) +
    "</div>" +
    '<details class="geno"' +
    (ui.genOpen ? " open" : "") +
    "><summary>More options</summary>" +
    chk("tw", G.tw, "Add a twist (terrain, hazard, objective or timing) as a hidden reminder") +
    chk("fresh", G.fresh, "Skip monsters used in the last 30 days") +
    chk("namer", S.namer, "Name groups with adjectives (Mean Ogre, Smelly Ogre) instead of numbers") +
    chk("quirk", S.quirk, "Give each new monster a morale and quirk line (DM only)") +
    "</details>" +
    (D
      ? '<div class="lib"><span class="grow"><b>The party changed.</b> <span class="meta">The generated monsters are now ' +
        f(D.xp) +
        " XP; the budget is " +
        f(D.U.lo) +
        "–" +
        f(D.U.hi) +
        '.</span></span><button class="add" data-act="genscale">Rescale</button></div>'
      : "") +
    '<div class="row"><button class="add" data-act="gengo">' +
    (R && !R.err ? "Roll again" : "Generate") +
    "</button>" +
    (R && !R.err
      ? '<button class="add" data-act="genadd">Add to encounter</button><button data-act="gensave">Save to library</button>'
      : "") +
    "</div>";
  if (R && R.err) h += "<p><b>" + esc(R.err) + "</b></p>";
  else if (R)
    h +=
      '<div class="genr">' +
      R.items
        .map(function (i, k) {
          return (
            '<div class="lib"><span class="grow"><b>' +
            i.n +
            " × " +
            esc(i.name) +
            '</b> <span class="meta">CR ' +
            esc(i.cr) +
            " · " +
            f((CRXP[String(i.cr)] || 0) * i.n) +
            ' XP</span></span><button class="' +
            (i.lock ? "on" : "") +
            '" data-act="genlock" data-i="' +
            k +
            '" aria-pressed="' +
            !!i.lock +
            '" title="Keep this one when rolling again">' +
            (i.lock ? "🔒 Kept" : "🔓 Keep") +
            '</button><button data-act="genstat" data-id="' +
            esc(i.id) +
            '" aria-label="Stat block of ' +
            esc(i.name) +
            '">ⓘ</button></div>'
          );
        })
        .join("") +
      (R.twist
        ? '<div class="lib"><span class="grow"><b>Twist · ' +
          R.twist[0] +
          '</b><br><span class="meta">' +
          esc(R.twist[1]) +
          '</span></span><button data-act="gentw" aria-label="Another twist">↻</button></div>'
        : "") +
      "<p><b>" +
      f(R.xp) +
      " XP · " +
      R.lab +
      '</b> <span class="muted">(budget: Low ' +
      f(R.B[0]) +
      " · Moderate " +
      f(R.B[1]) +
      " · High " +
      f(R.B[2]) +
      (R.miss ? " · " + R.miss + " without a level counted as level " + R.avg : "") +
      ")</span>" +
      (R.fit ? "" : ' <span class="muted">Closest fit found below the chosen difficulty.</span>') +
      (R.stale ? ' <span class="muted">Everything that fits was used recently, so repeats are allowed.</span>' : "") +
      "</p></div>";
  return h;
}
function genAct(act, b) {
  var R = ui.genRes,
    ok = R && R.items;
  if (act === "gengo")
    ui.genRes = genRoll(
      ok
        ? R.items.filter(function (i) {
            return i.lock;
          })
        : [],
    );
  else if (act === "genlock" && ok) {
    R.items[+b.dataset.i].lock = !R.items[+b.dataset.i].lock;
  } else if (act === "gentw" && ok) {
    var o = R.twist;
    do {
      R.twist = TWISTS[Math.floor(Math.random() * TWISTS.length)];
    } while (R.twist === o);
  } else if (act === "genadd" && ok) {
    snap("Add generated encounter");
    var n0 = S.next,
      n = 0;
    R.items.forEach(function (i) {
      addMon(i.id, i.n);
      n += i.n;
    });
    var ids = [];
    for (var k = n0; k < S.next; k++) ids.push(k);
    var tw = genTwistFx(R);
    if (tw) S.list.push(tw);
    var U = genBudget(genOpt().diff);
    S.genLast = { ids: ids, diff: genOpt().diff, pn: U.pn, hi: U.hi };
    ui.genRes = null;
    save();
    renderAll();
    toast("Added " + n + " monster" + (n > 1 ? "s" : "") + (tw ? " and a twist" : "") + " · Undo removes them");
    return;
  } else if (act === "gensave" && ok) {
    var L = genList(R),
      tw2 = genTwistFx(R);
    if (tw2) L.push(tw2);
    S.enc.push({
      id: "e" + Date.now(),
      name: genTitle(R),
      note: R.twist ? R.twist[1] : "",
      lair: false,
      list: L,
      saved: new Date().toISOString().slice(0, 10),
    });
    save();
    toast("Saved to the encounter library: " + esc(genTitle(R)));
  } else if (act === "genscale") {
    genRescale();
    return;
  } else if (act === "genstat") {
    S.stat = b.dataset.id;
    S.statC = null;
    S.tab = "stat";
  }
  renderDrawer();
}
function encHTML() {
  return (
    '<input class="search" id="encname" type="text" maxlength="50" placeholder="Encounter name, e.g. Bandit ambush" value="' +
    esc(ui.encName) +
    '">' +
    '<textarea id="encnote" maxlength="1500" placeholder="Environment and notes (shown above the table when loaded): difficult terrain, dim light, collapsing bridge DC 12 Dex…">' +
    esc(ui.encNote) +
    "</textarea>" +
    '<div class="row"><button class="add" data-act="encsave">Save current encounter</button></div>' +
    '<div class="lib"><label><input type="checkbox" id="encroll"' +
    (S.encRoll ? " checked" : "") +
    "><span>Reroll monster initiative when loading</span></label></div>" +
    (S.enc.length ? "" : '<p class="muted">No saved encounters yet.</p>') +
    S.enc
      .map(function (e, i) {
        var mon = e.list.filter(function (c) {
            return c.kind === "mon";
          }),
          fx = e.list.length - mon.length,
          cnt = {};
        mon.forEach(function (c) {
          var m = MON.find(function (x) {
            return x.id === c.monId;
          });
          var n = c.cg || (m ? m.name : c.name);
          cnt[n] = (cnt[n] || 0) + 1;
        });
        var sum =
          Object.keys(cnt)
            .map(function (k) {
              return cnt[k] + "\u00d7 " + k;
            })
            .join(", ") + (fx ? (mon.length ? ", " : "") + fx + " effect" + (fx > 1 ? "s" : "") : "");
        return (
          '<div class="enc"><div class="eh"><b>' +
          esc(e.name) +
          '</b><button class="add" data-act="encload" data-i="' +
          i +
          '">Load</button><button data-act="encadd" data-i="' +
          i +
          '">Add</button><button class="x" data-act="encdel" data-i="' +
          i +
          '" aria-label="Delete ' +
          esc(e.name) +
          '">×</button></div>' +
          '<div class="meta">' +
          esc(sum) +
          " · saved " +
          esc(e.saved || "") +
          "</div>" +
          (e.note ? '<div class="nt">' + esc(e.note) + "</div>" : "") +
          "</div>"
        );
      })
      .join("") +
    '<div class="msg">' +
    esc(ui.emsg || "") +
    "</div>"
  );
}
// ---- Data tab: four sections, one on screen at a time (S.dsec), each a few cards (dcard: title, one line of help, controls).
//   Encounters = build and keep encounters · Session = what happens at the table tonight
//   Sources    = where characters, monsters and spells come from · Backup = one file with everything
// openData(sec) is the one way other parts of the app jump here.
var DSEC = [
  ["enc", "Encounters"],
  ["sess", "Session"],
  ["src", "Sources"],
  ["bak", "Backup"],
];
function dataSec() {
  return DSEC.some(function (d) {
    return d[0] === S.dsec;
  })
    ? S.dsec
    : "enc";
}
function openData(sec) {
  ui.drawer = true;
  ui.dmode = "add";
  S.tab = "data";
  S.dsec = sec;
  renderDrawer();
}
function dcard(title, hint, body) {
  return '<section class="dcard"><h3>' + title + "</h3>" + (hint ? '<p class="muted">' + hint + "</p>" : "") + body + "</section>";
}
function dataEncHTML() {
  return (
    dcard("Encounter generator", "Random monsters that fit the XP budget of the party in the tracker (2024 rules).", genHTML()) +
    dcard(
      "Prepared encounters",
      "Build an encounter in the tracker (monsters, ✎ edits, groups, lair actions or hazards as Effects), then save it here with notes on terrain, light, weather or tactics. <b>Load</b> keeps your players and replaces the monsters; <b>Add</b> brings them in as reinforcements.",
      encHTML(),
    )
  );
}
function dataSessHTML() {
  var nl = (S.logs || []).length;
  return (
    (S.endSum ? dcard("Last combat", "", endHTML()) : "") +
    dcard("Treasure", "Enter a value in GP (End combat fills it in), build it, and post each player’s share to Discord.", lootHTML()) +
    dcard(
      "Table view and player links",
      "",
      '<p><b>This device</b>: a read-only player view in a second window that follows this one live.</p><div class="row"><button data-act="tablewin">Open table window</button></div>' +
        sessHTML(),
    ) +
    dcard(
      "Combat log",
      "Every attack, spell, damage and status applied during combat, per encounter (" + nl + " saved, last 20 kept).",
      '<div class="row"><button data-act="logdl"' +
        (nl ? "" : " disabled") +
        '>Download combat log</button><button data-act="logclr"' +
        (nl ? "" : " disabled") +
        ">" +
        (ui.logClr ? "Tap again to clear" : "Clear log") +
        "</button></div>",
    )
  );
}
// "today 11:20" or "14 Nov 11:20" for a stored time
function whenTxt(at) {
  var d = new Date(at),
    hm = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  return (
    (d.toDateString() === new Date().toDateString() ? "today" : d.getDate() + " " + d.toLocaleString("en", { month: "short" })) + " " + hm
  );
}
function dataSrcHTML() {
  var ns = REF && REF.spells ? REF.spells.length : 0;
  return (
    dcard(
      "Characters",
      "Kanka (players.json) and D&amp;D Beyond (dndbeyond.json), both written by the GitHub workflows.",
      '<div class="row"><button data-act="kanka">Update from Kanka</button><button data-act="ddb">Update from D&amp;D Beyond</button></div>',
    ) +
    dcard(
      "Your files",
      "Stat blocks and spells of your own. A matching name replaces the built-in entry. Kept on this device and in the backup, never uploaded. A picked file is a copy: add it again after you change it. A link is read once and stored the same way; its <b>Update</b> button reads it again.",
      '<div class="row"><button data-act="addmonfile">Add file…</button></div>' +
        '<div class="row"><input id="monurl" class="grow" type="url" placeholder="or paste a link (https://…)" aria-label="Link to your file" value="' +
        esc(ui.monurl || "") +
        '"><button data-act="addmonlink">Add link</button></div>' +
        '<div class="row"><input id="mongkey" class="grow" type="text" autocomplete="off" placeholder="Google API key (only for Google Drive links)" aria-label="Google API key" value="' +
        esc(
          ui.mongkey != null
            ? ui.mongkey
            : (
                CUSTOM.filter(function (f) {
                  return f.key;
                })[0] || {}
              ).key || "",
        ) +
        '"></div>' +
        (ui.fbusy
          ? '<div class="fnote" role="status">Reading…</div>'
          : FNOTE
            ? '<div class="fnote ' +
              (FNOTE.ok ? "ok" : "bad") +
              '" role="status"><b>' +
              (FNOTE.ok ? "Loaded" : "Not loaded") +
              "</b> (" +
              esc(whenTxt(FNOTE.at)) +
              "): " +
              esc(FNOTE.t.replace(/^Loaded from /, "")) +
              "</div>"
            : "") +
        (CUSTOM.length
          ? '<p class="muted fhead">On this device now:</p>'
          : '<p class="muted fhead">No files on this device: only the built-in SRD data is loaded.</p>') +
        CUSTOM.map(function (f, i) {
          return (
            '<div class="lib"><span class="grow"><b>' +
            esc(f.name) +
            '</b><br><span class="meta">' +
            f.monsters.length +
            " stat blocks" +
            ((f.spells || []).length ? ", " + f.spells.length + " spells" : "") +
            (f.url ? ", linked" : ", picked file") +
            (f.at ? " · read " + esc(whenTxt(f.at)) : "") +
            "</span></span>" +
            (f.url ? '<button data-act="updmonlink" data-i="' + i + '">Update</button>' : "") +
            '<button class="x" data-act="rmmonfile" data-i="' +
            i +
            '" aria-label="Remove ' +
            esc(f.name) +
            '">×</button></div>'
          );
        }).join(""),
    ) +
    dcard(
      "Rules edition",
      "Monsters, conditions and encounter budgets always use 5.2 (2024). This sets which version of a spell player characters cast, and Paladin / Ranger spell slots. One character can differ: ✎ Edit, Character sheet, Rules.",
      segHTML("Player spells", "pcEd", [
        ["2024", "5.2 (2024)"],
        ["2014", "5.1 (2014)"],
      ]) + '<p class="muted">Searching monsters by a 2014 name (Goblin, Orc, Veteran…) finds the 2024 stat block that replaces it.</p>',
    ) +
    dcard(
      "Loaded now",
      "",
      "<p>Monsters: " +
        MON.length +
        " stat blocks (" +
        BUILTIN +
        " built-in" +
        (CUSTOM.length ? ", " + MERGE.rep + " replaced by yours, " + MERGE.add + " added" : "") +
        ").<br>Spells: " +
        (ns || "loading…") +
        " (SRD 5.2" +
        (REF &&
        REF.spells &&
        REF.spells.some(function (x) {
          return x.src;
        })
          ? " + yours"
          : "") +
        (REF && REF.by14 && Object.keys(REF.by14).length
          ? "; " + Object.keys(REF.by14).length + " in their SRD 5.1 version for 2014 rules"
          : "") +
        ").<br>Storage used on this device: " +
        Math.round(storeUsed() / 1000) +
        " thousand characters (an iPad allows about 2,500 thousand).<br>Everything works offline.</p>",
    )
  );
}
function dataBakHTML() {
  var nm = CUSTOM.reduce(function (n, f) {
    return n + f.monsters.length;
  }, 0);
  return dcard(
    "Backup file",
    "One file with everything: tracker, saved encounters, characters, effect templates, combat logs, settings" +
      (CUSTOM.length ? " and your files" : "") +
      ". Export before and after each session; Import restores it on any device.",
    (CUSTOM.length
      ? '<div class="lib"><label><input type="checkbox" data-act="expmon"' +
        (ui.expMon !== false ? " checked" : "") +
        "><span>Include my monster files (" +
        nm +
        " stat blocks)</span></label></div>"
      : "") +
      '<div class="row"><button class="add" data-act="export">Export everything</button><button data-act="import">Import file…</button></div>',
  );
}
function dataHTML() {
  if (!REF) refLoad();
  var sec = dataSec();
  return (
    '<div class="data"><div class="sub dsub" role="tablist" aria-label="Data sections">' +
    DSEC.map(function (d) {
      return (
        '<button role="tab" aria-selected="' +
        (sec === d[0]) +
        '" data-act="dsec" data-s="' +
        d[0] +
        '" class="' +
        (sec === d[0] ? "on" : "") +
        '">' +
        d[1] +
        "</button>"
      );
    }).join("") +
    "</div>" +
    (sec === "enc" ? dataEncHTML() : sec === "sess" ? dataSessHTML() : sec === "src" ? dataSrcHTML() : dataBakHTML()) +
    '<div class="msg">' +
    esc(ui.msg || "") +
    "</div></div>"
  );
}
