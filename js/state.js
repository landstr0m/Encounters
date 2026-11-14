// Encounters app, part 2 of 11: state (S saved, ui screen-only) and combat logic: turns, adding creatures, damage, healing, undo, action log.
// ================= 2. STATE: S (saved to localStorage, exported) and ui (this screen only, not saved) =================
var S = {
  enc: [],
  encRoll: true,
  envName: "",
  envNote: "",
  round: 1,
  turnId: null,
  list: [],
  next: 1,
  libNext: 7,
  tab: "add",
  sub: "monsters",
  stat: null,
  atTable: {},
  initMode: "each",
  hpMode: "roll",
  pcEd: "2024", // rules edition for player spells: "2024" (SRD 5.2) or "2014" (SRD 5.1)
  lib: [
    { id: "l1", name: "Aria (example)", ac: 16, hp: 31, ib: 2 },
    { id: "l2", name: "Brom (example)", ac: 18, hp: 38, ib: 1 },
    { id: "l3", name: "Wren (example)", ac: 14, hp: 24, ib: 3 },
    { id: "l4", name: "Tolliver (example)", ac: 12, hp: 20, ib: 1 },
    { id: "l5", name: "Sable (example)", ac: 15, hp: 27, ib: 4 },
    { id: "l6", name: "Marek (example)", ac: 17, hp: 34, ib: 0 },
  ],
};
var ui = {
  fxRun: null,
  fx: { name: "", init: "", desc: "", vis: true, dd: "", dt: "", sv: "", dc: "", st: "", dur: "" },
  fType: "",
  fMin: "",
  fMax: "",
  q: "",
  qty: {},
  sel: {},
  amt: 0,
  half: false,
  mx: false,
  menu: false,
  pend: {},
  confirmRemove: false,
  confirmClear: false,
  msg: "",
  drawer: false,
  present: false,
  cardOpen: true,
  dsv: 1,
  mq: "",
  encName: "",
  encNote: "",
  traitsOpen: false,
  ignoreUntil: 0,
};
try {
  if (RO || sessionStorage.getItem("et-present") === "1") ui.present = true;
} catch (e) {}
try {
  var raw = NETV ? null : localStorage.getItem(KEY);
  if (raw) {
    var p = JSON.parse(raw);
    if (p && p.list) {
      S = Object.assign(S, p);
    }
  }
} catch (e) {}
function save() {
  if (RO) return;
  netPush();
  if (S.genLast && typeof genDrift === "function") {
    var gd = genDrift();
    if (gd && ui.genWarn !== gd.U.pn) {
      ui.genWarn = gd.U.pn;
      toast("The party changed: <b>Data \u2192 Encounters \u2192 Rescale</b> adjusts the generated encounter.");
    }
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    ui.saveErr = false;
  } catch (e) {
    if (!ui.saveErr) {
      ui.saveErr = true;
      alert(
        "This device\u2019s storage is full, so changes are NOT being saved. Export your encounter (Data tab), then remove a monster file you no longer need.",
      );
    }
  }
}
// State from storage or a backup file can be old or hand-edited. fixIds() makes it safe to render: the containers exist with the
// right type, broken entries are dropped, ids and numbers are numbers, and S.next is above every id in use.
function fixIds() {
  var mx = 0;
  ["list", "enc", "lib"].forEach(function (k) {
    S[k] = Array.isArray(S[k])
      ? S[k].filter(function (x) {
          return x && typeof x === "object";
        })
      : [];
  });
  ["logs", "fxLib"].forEach(function (k) {
    if (S[k] != null && !Array.isArray(S[k])) S[k] = [];
  });
  if (!S.atTable || typeof S.atTable !== "object") S.atTable = {};
  S.enc.forEach(function (e) {
    if (!Array.isArray(e.list)) e.list = [];
    e.name = String(e.name || "Encounter");
  });
  S.lib.forEach(function (l) {
    l.name = String(l.name || "Character");
  });
  S.list = S.list.filter(function (c) {
    return c.kind !== "mon" || typeof c.monId === "string";
  }); // a monster row must point at a stat block
  S.list.forEach(function (c) {
    c.name = String(c.name == null ? "?" : c.name);
  });
  S.list.forEach(function (c) {
    c.id = +c.id;
    if (c.id > mx) mx = c.id;
    ["ac", "hp", "max"].forEach(function (k) {
      c[k] = Math.floor(+c[k]) || 0;
    });
    c.temp = Math.floor(+c.temp) || 0;
    if (c.init != null && isNaN(+c.init)) c.init = null;
    if (!Array.isArray(c.conds)) c.conds = [];
  });
  if (!(S.next > mx)) S.next = mx + 1;
}
fixIds();

function order() {
  return S.list
    .map(function (c, i) {
      return [c, i];
    })
    .sort(function (a, b) {
      var x = a[0].init,
        y = b[0].init;
      if (x == null && y == null) return a[1] - b[1];
      if (x == null) return 1;
      if (y == null) return -1;
      return y - x || a[1] - b[1];
    })
    .map(function (p) {
      return p[0];
    });
}
function stepFrom(O, i) {
  var wrap = 0;
  for (var k = 0; k < O.length; k++) {
    i++;
    if (i >= O.length) {
      i = 0;
      wrap++;
    }
    if (!isOut(O[i])) return { i: i, wrap: wrap };
  }
  return null;
}

// ================= 3. COMBAT LOGIC: turns, adding creatures, damage, healing, undo =================
function nextTurn() {
  var O = order();
  if (!O.length) return;
  var idx = O.findIndex(function (c) {
    return c.id === S.turnId;
  });
  var r = stepFrom(O, idx);
  if (!r) return;
  if (idx < 0) S.round = 1;
  else S.round += r.wrap;
  var E = S.turnId;
  S.prevTurn = idx < 0 ? null : E;
  S.turnId = O[r.i].id;
  ui.legDis = null;
  ui.fxRun = null;
  if (idx < 0) {
    logStart();
  }
  if (idx < 0)
    S.list.forEach(function (x) {
      x.uses = {};
      x.spent = {};
      x.ue = {};
      x.mu = {};
      x.ray = {};
      x.mrep = {};
      x.msp = {};
    });
  S.tc = (S.tc || 0) + 1;
  var nx = O[r.i];
  nx.rx = false;
  nx.la = 0;
  nx.lonce = {};
  nx.ue = {};
  nx.mu = {};
  nx.ray = {};
  nx.mrep = {};
  nx.msp = {};
  var gone = expTick(E, S.turnId);
  if (gone.length) toast("Ended: " + esc(gone.join(", ")));
  logAdd("\u2014 Round " + S.round + ": " + nx.name + "\u2019s turn");
}
function nextId() {
  var O = order();
  var idx = O.findIndex(function (c) {
    return c.id === S.turnId;
  });
  if (idx < 0) return null;
  for (var k = 0; k < O.length; k++) {
    var r = stepFrom(O, idx);
    if (!r) return null;
    var c = O[r.i];
    if (c.id === S.turnId) return null;
    if (!shown(c)) {
      idx = r.i;
      continue;
    }
    return c.id;
  }
  return null;
}
function rollHP(dice, fallback) {
  var m = /^(\d+)d(\d+)(?:([+-])(\d+))?$/.exec(
    String(dice || "")
      .replace(/\s+/g, "")
      .replace("\u2212", "-"),
  );
  if (!m) return fallback;
  var t = 0;
  for (var i = 0; i < +m[1]; i++) t += d(+m[2]);
  if (m[3]) t += (m[3] === "+" ? 1 : -1) * +m[4];
  return Math.max(1, t);
}
// Monster namer (Data tab switch, S.namer): a group gets "Mean Ogre", "Smelly Ogre" instead of "Ogre 1", "Ogre 2". Numbers return if the list runs out.
var ADJ = [
  "Mean",
  "Smelly",
  "Tall",
  "Scarred",
  "One-eyed",
  "Limping",
  "Grinning",
  "Hungry",
  "Nervous",
  "Loud",
  "Sneaky",
  "Burly",
  "Scrawny",
  "Grumpy",
  "Twitchy",
  "Muddy",
  "Toothless",
  "Hairy",
  "Bald",
  "Stout",
  "Lanky",
  "Sleepy",
  "Angry",
  "Jittery",
  "Proud",
  "Drooling",
  "Wheezing",
  "Squinting",
  "Hunched",
  "Tattooed",
  "Pale",
  "Sooty",
  "Cackling",
  "Silent",
  "Bold",
  "Cowardly",
  "Greedy",
  "Old",
  "Young",
  "Wiry",
  "Crooked",
  "Snarling",
  "Clumsy",
  "Swift",
  "Grim",
  "Jolly",
  "Filthy",
  "Shifty",
  "Ragged",
  "Bruised",
  "Bandaged",
  "Gap-toothed",
  "Wild-eyed",
  "Bow-legged",
  "Hoarse",
  "Fidgety",
  "Smug",
  "Sulky",
  "Reckless",
  "Wary",
];
function adjName(base, used) {
  var F = ADJ.filter(function (a) {
    return !used[a + " " + base];
  });
  if (!F.length) return "";
  var n = F[Math.floor(Math.random() * F.length)] + " " + base;
  used[n] = 1;
  return n;
}
// Morale + quirk line per monster (Data tab switch, S.quirk): DM-only flavour on the turn card, never sent to the table view.
var MORALE = [
  "Flees when Bloodied",
  "Flees when it is the last one standing",
  "Fights to the death",
  "Surrenders when Bloodied",
  "Flees if the leader falls",
  "Runs for help when Bloodied",
  "Fights on while any ally stands",
  "Bargains for its life at low HP",
];
var QUIRK = [
  "hums while fighting",
  "taunts the smallest foe",
  "keeps glancing at the exit",
  "protects its nearest ally",
  "goes for whoever hit it last",
  "hates fire",
  "collects trophies",
  "talks to itself",
  "fights dirty",
  "shows off",
  "goes for the loudest foe",
  "is afraid of magic",
  "hides a limp",
  "wants the shiniest thing in sight",
  "laughs when hit",
  "never turns its back",
  "holds a grudge against spellcasters",
  "keeps count of its kills out loud",
  "stays near cover",
  "charges the farthest foe",
];
var QBEAST = [
  "goes for whoever hit it last",
  "attacks the nearest foe",
  "guards its spot",
  "drags a downed foe away",
  "goes for the smallest foe",
  "is hungry: goes for the weakest",
  "circles before it strikes",
  "backs off from fire",
];
function quirkLine(m) {
  var mind = m.abil && m.abil[3] <= 3,
    P = function (A) {
      return A[Math.floor(Math.random() * A.length)];
    };
  return (
    "Morale: " +
    (mind && ["ooze", "construct", "plant", "undead"].indexOf(m.ctype) >= 0 ? "Fights until destroyed" : P(MORALE)) +
    " \u00b7 Quirk: " +
    P(mind ? QBEAST : QUIRK)
  );
}
function addMon(id, qty) {
  var m = MON.find(function (x) {
    return x.id === id;
  });
  if (!m) return;
  var existing = S.list.filter(function (c) {
    return c.monId === id;
  });
  var n0 = existing.length;
  var used = {};
  S.list.forEach(function (c) {
    used[c.name] = 1;
  });
  if (n0 === 1 && existing[0].name === m.name) existing[0].name = (S.namer && adjName(m.name, used)) || m.name + " 1";
  var pre = m.name + " ";
  existing.forEach(function (c) {
    var k = c.name.indexOf(pre) === 0 ? +c.name.slice(pre.length) : NaN;
    if (k > n0) n0 = k;
  });
  var im = mod(m.abil[1]);
  var shared = d(20) + im,
    grp = qty > 1 ? "g" + S.next : null;
  for (var i = 1; i <= qty; i++) {
    var hp = S.hpMode === "roll" ? rollHP(m.dice, m.hp) : m.hp;
    var init = S.initMode === "group" ? shared : d(20) + im;
    S.list.push({
      id: S.next++,
      kind: "mon",
      monId: id,
      name: qty > 1 || n0 > 0 ? (S.namer && adjName(m.name, used)) || m.name + " " + (n0 + i) : m.name,
      init: init,
      ac: m.ac,
      hp: hp,
      max: hp,
      temp: 0,
      conds: [],
      cr: m.cr,
      spent: {},
      grp: grp,
    });
    if (S.quirk) S.list[S.list.length - 1].q = quirkLine(m);
  }
}
function gkey(c) {
  return c.cg ? "cg:" + c.cg.toLowerCase() : c.monId;
}
function setGroup(T, name) {
  T = T.filter(function (c) {
    return c.kind === "mon";
  });
  name = (name || "").trim();
  if (!name) {
    T.forEach(function (c) {
      delete c.cg;
      if (c.grp && c.grp.indexOf("c:") === 0) delete c.grp;
    });
    return T.length;
  }
  var key = "c:" + name.toLowerCase();
  var old = S.list.filter(function (c) {
    return c.grp === key && c.cg && T.indexOf(c) < 0 && !isDead(c);
  });
  var ins = T.map(function (c) {
    return c.init;
  }).filter(function (v) {
    return v != null;
  });
  var init = old.length ? old[0].init : ins.length ? Math.max.apply(null, ins) : null;
  if (old.length) name = old[0].cg;
  T.forEach(function (c) {
    c.cg = name;
    c.grp = key;
    c.init = init;
  });
  var mem = S.list.filter(function (c) {
      return c.grp === key;
    }),
    at = S.list.indexOf(mem[0]);
  var rest = S.list.filter(function (c) {
    return c.grp !== key;
  });
  rest.splice(
    S.list.slice(0, at).filter(function (c) {
      return c.grp !== key;
    }).length,
    0,
    mem[0],
  );
  rest.splice.apply(rest, [rest.indexOf(mem[0]) + 1, 0].concat(mem.slice(1)));
  S.list = rest;
  return T.length;
}
function addPc(l) {
  if (
    S.list.some(function (c) {
      return c.libId === l.id;
    })
  )
    return false;
  S.list.push({
    id: S.next++,
    kind: "pc",
    libId: l.id,
    name: l.name,
    init: null,
    ib: l.ib,
    ac: l.ac,
    hp: l.hp,
    max: l.hp,
    temp: 0,
    conds: [],
    cr: "",
    spent: {},
    ds: null,
  });
  return true;
}
function dsOf(c) {
  if (!c.ds) c.ds = { s: 0, f: 0 };
  return c.ds;
}
var CAUSE = ["Paralyzed", "Petrified", "Stunned", "Unconscious"];
function incSync(c, added) {
  var has = CAUSE.some(function (x) {
      return c.conds.indexOf(x) >= 0;
    }),
    i = c.conds.indexOf("Incapacitated");
  if (i < 0) c.autoInc = false;
  if (has && i < 0 && added) {
    c.conds.push("Incapacitated");
    c.autoInc = true;
  } else if (!has && c.autoInc && i >= 0) {
    c.conds.splice(i, 1);
    c.autoInc = false;
  }
}
function shown(c) {
  return c.kind !== "fx" || c.vis || !ui.present;
}
function rmComb(c) {
  if (c.id === S.turnId) S.turnId = nextIdExcluding([c]);
  S.list = S.list.filter(function (x) {
    return x.id !== c.id;
  });
  pruneSel();
}
function maxDown(c, n) {
  if (c.base == null) c.base = c.max;
  c.max = Math.max(0, c.max - n);
  c.hp = Math.min(c.hp, c.max);
  if (c.max <= 0) {
    c.hp = 0;
    if (c.kind === "pc") setDead(c);
  }
}
function maxReset(c) {
  if (c.base != null) {
    c.max = c.base;
    c.base = null;
  }
}
function setDead(c) {
  if (c.conds.indexOf("Dead") < 0) c.conds.push("Dead");
}
function addFail(c, n) {
  var ds = dsOf(c);
  ds.f = Math.min(3, ds.f + n);
  if (ds.f >= 3) setDead(c);
}
var DTYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];
// Spell statuses blocked by immunity to the condition they impose.
var CIM = {
  Entranced: ["charmed"],
  Fear: ["frightened"],
  Turned: ["frightened"],
  "Stinking Cloud": ["poisoned"],
  Sleeping: ["exhaustion", "unconscious"],
};
function monLine(c, re) {
  var m =
    c.kind === "mon" &&
    MON.find(function (x) {
      return x.id === c.monId;
    });
  return m
    ? (
        (m.extra.find(function (e) {
          return re.test(e[0]);
        }) || [])[1] || ""
      ).toLowerCase()
    : "";
}
// Defences of a creature: resistances, immunities, vulnerabilities and condition immunities, from its sheet or stat block plus manual extras.
function defs(c) {
  var d = { res: [], imm: [], vul: [], cimm: [] };
  if (c.kind === "pc") {
    var l =
      S.lib.find(function (x) {
        return x.id === c.libId;
      }) || {};
    d.res = (l.res || []).slice();
    d.imm = (l.imm || []).slice();
    d.vul = (l.vul || []).slice();
    d.cimm = (l.cimm || []).slice();
  } else if (c.kind === "mon") {
    var R = monLine(c, /^res/i),
      I = monLine(c, /^imm/i),
      V = monLine(c, /^vul/i),
      has = function (t, w) {
        return new RegExp("\\b" + w + "\\b").test(t);
      };
    DTYPES.forEach(function (t) {
      if (has(R, t)) d.res.push(t);
      if (has(I, t)) d.imm.push(t);
      if (has(V, t)) d.vul.push(t);
    });
    CONDS.concat(["Exhaustion"]).forEach(function (x) {
      if (has(I, x.toLowerCase())) d.cimm.push(x.toLowerCase());
    });
  }
  if (c.conds.indexOf("Raging") >= 0 || c.conds.indexOf("Stoneskin") >= 0) d.res.push("bludgeoning", "piercing", "slashing");
  if (c.conds.indexOf("Protection from Poison") >= 0) d.res.push("poison");
  if (c.conds.indexOf("Warding Bond") >= 0) d.res = DTYPES.slice();
  if (c.conds.indexOf("Petrified") >= 0) d.res = DTYPES.slice();
  return d;
}
// Damage after resistance (half, round down), immunity (0) and vulnerability (double).
function typed(c, n, t) {
  if (!t) return [n, ""];
  var d = defs(c),
    r = d.res.indexOf(t) >= 0,
    v = d.vul.indexOf(t) >= 0;
  if (d.imm.indexOf(t) >= 0) return [0, "immune"];
  if (r && v) return [n, ""];
  if (r) return [Math.floor(n / 2), "resists"];
  if (v) return [n * 2, "vulnerable"];
  return [n, ""];
}
function condBlocked(c, x) {
  var d = defs(c).cimm;
  return (
    CIM[x] ||
    (SPX[x] && SPX[x].cd
      ? SPX[x].cd.map(function (k) {
          return k.toLowerCase();
        })
      : [x.toLowerCase()])
  ).some(function (k) {
    return d.indexOf(k) >= 0;
  });
}
// One-step undo: snapshot the encounter before any change made from the bar, pad, chips or death saves.
function snap(label) {
  if (ui.noSnap) return;
  ui.undo = { label: label, s: JSON.stringify({ list: S.list, round: S.round, turnId: S.turnId, prev: S.prevTurn }) };
}
function undo() {
  if (!ui.undo) return;
  logAdd("Undid: " + ui.undo.label);
  var o = JSON.parse(ui.undo.s);
  S.list = o.list;
  S.round = o.round;
  S.turnId = o.turnId;
  S.prevTurn = o.prev;
  toast("Undid: " + esc(ui.undo.label));
  ui.undo = null;
  pruneSel();
  finishPad();
}
// ---- Action log: one entry list per combat (S.logs), started when combat starts; downloadable from the Data tab.
function logAdd(h) {
  if (RO || S.turnId == null) return;
  S.logs = S.logs || [];
  var L = S.logs[S.logs.length - 1];
  if (!L || L.end) return;
  L.e.push([
    new Date().toISOString(),
    S.round,
    String(h)
      .replace(/<br>/g, " \u00b7 ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  ]);
}
function logStart() {
  S.seen = S.seen || {};
  S.list.forEach(function (c) {
    if (c.kind === "mon") S.seen[c.monId] = Date.now();
  });
  S.logs = (S.logs || []).slice(-19);
  S.logs.push({ name: S.envName || "Encounter", start: new Date().toISOString(), e: [] });
}
function logEnd() {
  var L = (S.logs || [])[S.logs.length - 1];
  if (L && !L.end) L.end = new Date().toISOString();
}
function logText() {
  var t = "# Combat log\n";
  (S.logs || []).forEach(function (L) {
    var d = new Date(L.start);
    t +=
      "\n## " +
      L.name +
      " \u2014 " +
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      "\n\n";
    L.e.forEach(function (x) {
      t += /^\u2014/.test(x[2]) ? "\n**" + x[2].replace(/^\u2014 /, "") + "**\n" : "- " + x[2] + "\n";
    });
  });
  return t;
}
function doLogDownload() {
  var name = "combat-log-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + ".md",
    blob = new Blob([logText()], { type: "text/markdown" });
  var file = null;
  try {
    file = new File([blob], name, { type: "text/markdown" });
  } catch (e) {}
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(function () {});
    return;
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function toast(h) {
  var t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.innerHTML = h;
  t.classList.add("on");
  clearTimeout(toast.tm);
  toast.tm = setTimeout(function () {
    t.classList.remove("on");
  }, 6000);
  t.onclick = function () {
    t.classList.remove("on");
  };
}
// Statuses that end when the creature takes damage (Sleep, Hypnotic Pattern, plus conditions an action said end on damage: c.dend)
var DEND = ["Sleeping", "Entranced"],
  DREM = {
    Laughing: "Wis save (adv.) or stays",
    "Charm Person": "ends if the caster or allies did it",
    "Charm Monster": "ends if the caster or allies did it",
  };
function dmgEnds(c) {
  ui.ended = ui.ended || [];
  var gone = c.conds.filter(function (x) {
    return DEND.indexOf(x) >= 0 || (c.dend || {})[x];
  });
  gone.forEach(function (x) {
    c.conds.splice(c.conds.indexOf(x), 1);
    if (c.dend) delete c.dend[x];
    if (c.stg) delete c.stg[x];
  });
  if (gone.length) {
    linkSweep(c);
    incSync(c, false);
    ui.ended.push(
      esc(c.name) +
        ": " +
        gone
          .map(function (x) {
            return esc(nm(x));
          })
          .join(", ") +
        " ended",
    );
  }
  c.conds.forEach(function (x) {
    if (DREM[x]) ui.ended.push(esc(c.name) + ": " + esc(nm(x)) + " \u2014 " + DREM[x]);
  });
}
function endedMsg() {
  var e = ui.ended || [];
  ui.ended = [];
  return e.length ? "<br><b>Damage:</b> " + e.join(" \u00b7 ") : "";
}
function dmg(c, n) {
  var before = c.hp;
  if (n > 0) dmgEnds(c);
  var t = Math.min(c.temp, n);
  c.temp -= t;
  n -= t;
  c.hp = Math.max(0, c.hp - n);
  if (c.kind === "pc" && n > 0 && !isPcDead(c)) {
    if (before > 0 && c.hp === 0) {
      c.ds = { s: 0, f: 0 };
      if (n - before >= c.max) setDead(c);
    } else if (before === 0) {
      var ds = dsOf(c);
      if (ds.s >= 3) ds.s = 0;
      addFail(c, 1);
      if (n >= c.max) setDead(c);
    }
  }
}
function heal(c, n) {
  c.hp = Math.min(c.max, c.hp + n);
  if (c.hp > 0) {
    c.ds = null;
    var i = c.conds.indexOf("Dead");
    if (i >= 0) c.conds.splice(i, 1);
  }
}
function dsAct(c, act, b) {
  var ds = dsOf(c);
  if (act === "dsS") {
    ds.s = Math.min(3, ds.s + 1);
  } else if (act === "dsF") {
    addFail(c, 1);
  } else if (act === "ds1") {
    addFail(c, 2);
  } else if (act === "ds20") {
    c.hp = 1;
    c.ds = null;
    var i = c.conds.indexOf("Dead");
    if (i >= 0) c.conds.splice(i, 1);
  } else if (act === "dsdec") {
    var k = b.dataset.k;
    ds[k] = Math.max(0, ds[k] - 1);
    if (k === "f" && ds.f < 3) {
      var j = c.conds.indexOf("Dead");
      if (j >= 0) c.conds.splice(j, 1);
    }
  }
}

function fxHTML(c, cls) {
  if (!c.conds.length) return "";
  return (
    '<div class="' +
    (cls || "") +
    '">' +
    c.conds
      .map(function (x) {
        return '<div class="fx"><b>' + esc(nm(x)) + ".</b> " + esc(FX[x] || "") + "</div>";
      })
      .join("") +
    "</div>"
  );
}
function dsHTML(c) {
  if (c.kind !== "pc" || c.hp > 0 || isPcDead(c)) return "";
  var ds = dsOf(c);
  function dots(k, n) {
    var s = "";
    for (var i = 0; i < 3; i++)
      s +=
        i < n
          ? '<button class="dot ' + k + ' on" data-act="dsdec" data-k="' + k + '" aria-label="Remove one"></button>'
          : '<span class="dot ' + k + '"></span>';
    return s;
  }
  return (
    '<div class="ds"><div class="dsl"><span class="dl">Saves</span>' +
    dots("s", ds.s) +
    '<span class="dl">Fails</span>' +
    dots("f", ds.f) +
    (ds.s >= 3 ? '<span class="stb">Stable</span>' : "") +
    "</div>" +
    '<div class="dsb"><button data-act="dsS">Success</button><button data-act="dsF">Fail</button><button data-act="ds20">Nat 20</button><button data-act="ds1">Nat 1</button></div></div>'
  );
}
