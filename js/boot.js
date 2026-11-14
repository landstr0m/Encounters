/* ENCOUNTERS APP: CODE MAP
   index.html is only the page shell; app.css holds the styles; the program is the files in js/, loaded in this order:
     boot.js     this file: monster files kept on this device, loading monsters.json, then loading the parts below
     rules.js    1  rules data: XP tables, statuses, spell effects, shared terms (AK / AB / ABS, DEFK, NOSAVE)
     state.js    2  state (S saved, ui screen-only), combat logic: turns, damage, healing, undo, action log
     bar.js      3  top bar and initiative strip
     actions.js  4  tap-to-use: action economy, targeting, spells, consumables, action cards
     board.js    5  turn card, main table, XP bar, action pad
     drawer.js   6  drawer panels: stat block, Add (monsters / party / effects)
     datatab.js  7  encounter generator, treasure, prepared encounters, Data tab
     sheet.js    8  character sheet, Edit tab, backup export / import, reference loading, stat-block text
     parser.js   9  action parser, cards, Spells & Conditions tab, D&D Beyond merge
     events.js   10 event handlers (one click listener per area, switching on data-act)
     session.js  11 remote session (table and player links)
   Why the order matters: each part runs top to bottom when it loads, so a constant must be defined in the same or an earlier
   part than the code that uses it while loading. Functions may call functions from later parts, because they only run after
   everything has loaded. Everything is global on purpose (no build step, no modules): one program, cut into readable files.
   Adding a file: put it in PARTS below, in FILES in sw.js, and in the table in README.md.
   Patterns used everywhere:
   - Render functions rebuild HTML strings; state changes then call save() + renderBoard() / renderDrawer().
   - Buttons have data-act="name"; the area's click listener switches on it (search act === "name" to find a handler).
   - snap('label') before a change makes it undoable (one step).
   - esc() every piece of user or data text that goes into HTML; rich() for stat block text (dice, spell links).
   - Add a test in tests/run_tests.py for each feature; bump CACHE in sw.js when publishing.
   Main feature blocks (search the comment headings):
   - "ACTION PARSER": parseAct() / actsOf() turn stat block text into data (attacks, saves, Multiattack, Spellcasting, limits).
   - "Stage B/C": cards (tcCard, limHTML, spellsHTML), action economy (c.ue per turn, c.uses per encounter, hideWhy, useAct).
   - "Multiattack lives on the attacks": pools (mPools, mLeft, mSpend), replacements, Eye-Ray style roll tables.
   - "Stages D/E": tap-to-use targeting (actStart / actBegin -> chips -> actApply), crit, reactions, doHow (spending).
   - "Stage F": spellData() for monster and player spells, legRef() for legendary actions, grabSweep() for grapples.
   - "Action log" (S.logs) and "Table view line" (S.ann) for the table window.
   - "REMOTE SESSION": S.sess, tableSnap() (filtered copy sent to other devices), netOpen() (Supabase or ?net=local), netReq() (player edits), renderMe().
   - Pad: renderPad() + padEl click handler; wheels (amount, type) snap in JS; padChips() = selection chips when no action runs.
   - Spells in play: spellBegin() (one pick per ray/dart, "(1 of N)"), slot stepper (data-act aslot), castSp() (DC from Spellcasting).
   - Per-hit riders: RID / riders() / ridFor() (Hex, Hunter's Mark, Divine Favor…), amounts typed per hit, default 0.
   - Effects over time: STG + stgSet/stgRoll (repeat saves: staged and save-ends), DEND/dmgEnds (ends on damage),
     tickOf() (start/end-of-turn damage preloaded), EXP (auto-expiry), legPick (roll-table legendary actions).
   - Drawer extras: FXT / S.fxLib (effect templates), l.tags (party groups, partyTopHTML), doExport/doImport (one backup file).
   - Look: colours only via :root tokens (light = parchment, dark = dark dungeon); tests check visibility, contrast, icon alignment.
*/
function clone(o) {
  return JSON.parse(JSON.stringify(o));
} // deep copy of plain data (state, templates, saved encounters)

// ================= YOUR FILES: your own stat blocks and spells, kept on this device and merged over the built-in data =================
var CKEY = "encounter-tracker-monsters",
  CUSTOM = [],
  BUILTIN = 0,
  MERGE = { rep: 0, add: 0 };
// Stored files are checked on the way in (an older version stored stat blocks only)
function okFiles(L) {
  return (Array.isArray(L) ? L : [])
    .filter(function (f) {
      return f && typeof f.name === "string" && (Array.isArray(f.monsters) || Array.isArray(f.spells));
    })
    .map(function (f) {
      return {
        name: f.name,
        monsters: Array.isArray(f.monsters) ? f.monsters.filter(okMon) : [],
        spells: Array.isArray(f.spells) ? f.spells.filter(okSpell) : [],
        aliases: f.aliases && typeof f.aliases === "object" ? f.aliases : {},
      };
    });
}
try {
  CUSTOM = okFiles(JSON.parse(localStorage.getItem(CKEY) || "[]"));
} catch (e) {
  CUSTOM = [];
}
function saveCustom() {
  try {
    localStorage.setItem(CKEY, JSON.stringify(CUSTOM));
    return true;
  } catch (e) {
    return false;
  }
}
var nkey = function (n) {
  return String(n)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};
function okMon(m) {
  return (
    m &&
    typeof m.name === "string" &&
    typeof m.id === "string" &&
    !isNaN(+m.ac) &&
    !isNaN(+m.hp) &&
    Array.isArray(m.abil) &&
    m.abil.length === 6
  );
}
function fixMon(m) {
  ["extra", "traits", "actions", "bonus", "react", "leg"].forEach(function (k) {
    if (!Array.isArray(m[k])) m[k] = [];
  });
  m.ac = +m.ac;
  m.hp = +m.hp;
  m.cr = String(m.cr == null ? "0" : m.cr);
  m.type = m.type || "";
  m.speed = m.speed || "";
  m.dice = m.dice || String(m.hp);
  return m;
}
function mergeMon(base) {
  var out = base.slice(),
    byName = {},
    byId = {};
  MERGE = { rep: 0, add: 0 };
  out.forEach(function (m, i) {
    byName[nkey(m.name)] = i;
    byId[m.id] = i;
  });
  CUSTOM.forEach(function (f) {
    f.monsters.forEach(function (m0) {
      var m = fixMon(clone(m0)),
        k = nkey(m.name),
        i = byName[k];
      if (i == null && byId[m.id] != null) i = byId[m.id];
      if (i != null) {
        m.srcId = m.id;
        m.id = out[i].id;
        out[i] = m;
        MERGE.rep++;
      } // keep built-in id so saved encounters still find it
      else {
        if (byId[m.id] != null) m.id = m.id + "-" + out.length;
        byName[k] = byId[m.id] = out.length;
        out.push(m);
        MERGE.add++;
      }
    });
  });
  return out;
}
// A spell entry needs a name and its text; the other fields (level, range, damage...) follow reference.json and are optional.
function okSpell(x) {
  return x && typeof x.n === "string" && x.n && typeof x.tx === "string";
}
// Read a file picked in Data > Sources > Your files. It may hold stat blocks, spells or both:
//   a list of stat blocks, or {"monsters": [...], "spells": [...], "aliases": {"Other name": "Spell name"}}
// Valid entries are kept on this device (and in the backup); nothing changes when the file has none.
function readMonFile(file, done) {
  var r = new FileReader();
  r.onload = function () {
    try {
      var j = JSON.parse(String(r.result).replace(/^\uFEFF/, "")),
        L = Array.isArray(j) ? j : (j && j.monsters) || [],
        SP = (!Array.isArray(j) && j && j.spells) || [],
        AL = (!Array.isArray(j) && j && j.aliases) || {};
      if (!Array.isArray(L) || !Array.isArray(SP) || typeof AL !== "object") throw 0;
      var good = L.filter(okMon),
        spells = SP.filter(okSpell),
        bad = L.length - good.length + (SP.length - spells.length);
      if (!good.length && !spells.length) {
        done("No valid stat blocks or spells found in " + file.name + ". Nothing was changed.");
        return;
      }
      var known = {};
      CUSTOM.forEach(function (f) {
        if (f.name !== file.name)
          f.monsters.forEach(function (m) {
            known[nkey(m.name)] = f.name;
          });
      });
      var dup = good.filter(function (m) {
        return known[nkey(m.name)];
      }).length;
      var before = CUSTOM,
        keep = CUSTOM.filter(function (f) {
          return f.name !== file.name;
        });
      CUSTOM = keep.concat([{ name: file.name, monsters: good, spells: spells, aliases: AL }]);
      if (!saveCustom()) {
        CUSTOM = before;
        saveCustom();
        done("File too large for this device storage. Nothing was changed.");
        return;
      }
      var bk = {};
      BOOT_BASE.forEach(function (m) {
        bk[nkey(m.name)] = 1;
      });
      var rep = good.filter(function (m) {
        return bk[nkey(m.name)];
      }).length;
      alert(
        "Loaded from " +
          file.name +
          ":\n" +
          good.length +
          " stat blocks (" +
          rep +
          " replace built-in monsters, " +
          (good.length - rep) +
          " are new)\n" +
          spells.length +
          " spells" +
          (dup ? "\n" + dup + " stat blocks are also in another of your files (this newest file wins)" : "") +
          (bad ? "\n" + bad + " entries skipped (a stat block needs name, id, AC, HP and abilities; a spell needs a name and text)" : "") +
          "\n\nThe app will now reload.",
      );
      location.reload();
    } catch (e) {
      done("That file is not a valid monster or spell file. Nothing was changed.");
    }
  };
  r.readAsText(file);
}

// ================= START-UP: load monsters.json (+ files imported on this device), then the parts =================
var PARTS = ["rules", "state", "bar", "actions", "board", "drawer", "datatab", "sheet", "parser", "events", "session"];
var MON = [],
  BOOT_BASE = [],
  STARTED = false;
// Three different failures, three different messages: the data file not arriving (offline before the first visit), a part of
// the program not arriving, or the app itself failing while it starts (a bug; the error is also in the console).
function bootMsg(t) {
  if (bootMsg.shown) return;
  bootMsg.shown = true;
  document.body.insertAdjacentHTML("afterbegin", '<p style="padding:20px">' + t + "</p>");
}
window.addEventListener("error", function (e) {
  if (!STARTED && e.message)
    bootMsg(
      "The app could not start: " +
        String(e.message).replace(/</g, "&lt;") +
        ". Reload the page; if the message stays, note it down and report it.",
    );
});
// The parts are added together and run strictly in order (async=false); the page is drawn when the last one has run.
function loadParts() {
  PARTS.forEach(function (p, i) {
    var s = document.createElement("script");
    s.src = "js/" + p + ".js";
    s.async = false;
    s.onerror = function () {
      bootMsg("Could not load js/" + p + ".js. Open the app once with an internet connection.");
    };
    if (i === PARTS.length - 1)
      s.onload = function () {
        if (bootMsg.shown) return;
        renderAll();
        save();
        STARTED = true;
      };
    document.body.appendChild(s);
  });
}
fetch("monsters.json")
  .then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function (j) {
    if (!j || !Array.isArray(j.monsters)) throw new Error('monsters.json has no "monsters" list');
    BOOT_BASE = j.monsters;
    BUILTIN = j.monsters.length;
    MON = mergeMon(j.monsters);
    loadParts();
  })
  .catch(function (e) {
    console.error(e);
    bootMsg("Could not load monsters.json. Open the app once with an internet connection.");
  });
if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
