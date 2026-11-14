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
      var o = {
        name: cStr(f.name) || "file",
        monsters: cleanAll(f.monsters, cleanMon),
        spells: cleanAll(f.spells, cleanSpell),
        aliases: cleanAliases(f.aliases),
      };
      if (typeof f.url === "string") o.url = f.url.slice(0, 2000); // a linked file: where Update reads it again
      if (isFinite(+f.at) && +f.at > 0) o.at = +f.at; // when it was last read (shown in the list)
      if (typeof f.key === "string") o.key = f.key.slice(0, 200);
      return o;
    });
}
function saveCustom() {
  try {
    localStorage.setItem(CKEY, JSON.stringify(CUSTOM));
    return true;
  } catch (e) {
    return false;
  }
}
// The result of the last attempt to add or update a file (text, ok, when). It is drawn inside the "Your files" card and
// survives the reload after a successful load, so there is always an answer to "did that work?".
var FNKEY = CKEY + "-note",
  FNOTE = null;
try {
  FNOTE = JSON.parse(localStorage.getItem(FNKEY) || "null");
  if (!FNOTE || typeof FNOTE.t !== "string") FNOTE = null;
} catch (e) {
  FNOTE = null;
}
function fileNote(t, ok) {
  FNOTE = t ? { t: String(t).slice(0, 600), ok: !!ok, at: Date.now() } : null;
  try {
    if (FNOTE) localStorage.setItem(FNKEY, JSON.stringify(FNOTE));
    else localStorage.removeItem(FNKEY);
  } catch (e) {}
}
// Characters stored by this site on this device. An iPad allows about 2.5 million.
function storeUsed() {
  var n = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      n += k.length + (localStorage.getItem(k) || "").length;
    }
  } catch (e) {}
  return n;
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
// ---- Files are not trusted. Whatever is in a file (picked, linked, from a backup or already stored), only the known
// fields are kept, each forced to its expected type and a sane length; anything else is dropped. The rest of the app
// can then rely on the shape (a number where it expects text used to stop the app from starting). Text is still
// escaped when drawn (esc(), rich()): this is about shape and size, that is about script injection.
var FMAX = { bytes: 20e6, items: 5000, list: 100, name: 200, text: 20000 };
function cStr(v, max) {
  return (typeof v === "string" ? v : typeof v === "number" && isFinite(v) ? String(v) : "").slice(0, max || FMAX.name);
}
function cNum(v, lo, hi) {
  v = +v;
  return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;
}
function cList(v, max) {
  return (Array.isArray(v) ? v : [])
    .filter(function (x) {
      return typeof x === "string" && x;
    })
    .slice(0, FMAX.list)
    .map(function (x) {
      return x.slice(0, max || FMAX.name);
    });
}
function cPairs(v) {
  return (Array.isArray(v) ? v : [])
    .filter(function (t) {
      return Array.isArray(t) && typeof t[0] === "string" && typeof t[1] === "string";
    })
    .slice(0, FMAX.list)
    .map(function (t) {
      return [t[0].slice(0, FMAX.name), t[1].slice(0, FMAX.text)];
    });
}
function cleanMon(m) {
  if (!okMon(m) || !m.name.trim() || !m.id.trim()) return null;
  var o = {
    id: cStr(m.id),
    name: cStr(m.name),
    type: cStr(m.type),
    cr: cStr(m.cr, 10) || "0",
    ac: cNum(m.ac, 0, 99),
    acn: cStr(m.acn),
    hp: Math.round(cNum(m.hp, 0, 99999)),
    dice: cStr(m.dice, 40),
    speed: cStr(m.speed),
    abil: m.abil.map(function (x) {
      return Math.round(cNum(x, 0, 99));
    }),
  };
  ["extra", "traits", "actions", "bonus", "react", "leg"].forEach(function (k) {
    o[k] = cPairs(m[k]);
  });
  if (Array.isArray(m.hab)) o.hab = cList(m.hab, 40);
  if (Array.isArray(m.aka)) o.aka = cList(m.aka);
  if (m.ed === "2014" || m.ed === "2024") o.ed = m.ed;
  return o;
}
function cleanSpell(x) {
  if (!okSpell(x) || !x.n.trim()) return null;
  var o = { n: cStr(x.n), tx: x.tx.slice(0, FMAX.text), l: Math.round(cNum(x.l, 0, 9)) };
  ["sc", "t", "r", "c", "d", "sv", "dr"].forEach(function (k) {
    o[k] = cStr(x[k], 400);
  });
  o.hl = cStr(x.hl, FMAX.text);
  ["cn", "ri", "at"].forEach(function (k) {
    o[k] = x[k] === true;
  });
  ["cl", "dt", "up"].forEach(function (k) {
    o[k] = cList(x[k], 60);
  });
  return o;
}
function cleanAliases(A) {
  var o = {};
  if (!A || typeof A !== "object" || Array.isArray(A)) return o;
  Object.keys(A)
    .slice(0, FMAX.items)
    .forEach(function (k) {
      if (typeof A[k] === "string" && k.trim() && ["__proto__", "constructor", "prototype"].indexOf(k) < 0)
        o[k.slice(0, FMAX.name)] = A[k].slice(0, FMAX.name);
    });
  return o;
}
function cleanAll(L, fn) {
  return (Array.isArray(L) ? L : []).slice(0, FMAX.items).map(fn).filter(Boolean);
}
// Load what is stored (after the checks above are defined, as they use FMAX).
try {
  CUSTOM = okFiles(JSON.parse(localStorage.getItem(CKEY) || "[]"));
} catch (e) {
  CUSTOM = [];
}
// Read a file picked in Data > Sources > Your files. It may hold stat blocks, spells or both:
//   a list of stat blocks, or {"monsters": [...], "spells": [...], "aliases": {"Other name": "Spell name"}}
// Valid entries are kept on this device (and in the backup); nothing changes when the file has none.
function readMonFile(file, done) {
  if (file.size > FMAX.bytes) return done("That file is too large (over 20 MB). Nothing was changed.");
  var r = new FileReader();
  r.onload = function () {
    readMonText(file.name, r.result, done);
  };
  r.readAsText(file);
}
// The same for a link (Data > Sources > Your files > Add link). The link, like the file, is kept on this device and in
// the backup only. A web page may only read from hosts that allow it:
//   Dropbox share links and "raw" links (a secret GitHub Gist, Supabase Storage) work as they are;
//   Google Drive only answers through its API, which needs an API key (the file must be shared "anyone with the link").
function linkUrl(u, key) {
  u = String(u || "").trim();
  var g = /^https:\/\/(?:drive|docs)\.google\.com\/.*?(?:\/d\/|[?&]id=)([\w-]{10,})/.exec(u);
  if (g)
    return key
      ? { drive: g[1], url: "https://www.googleapis.com/drive/v3/files/" + g[1] + "?alt=media&key=" + encodeURIComponent(key) }
      : { err: "A Google Drive link needs a Google API key (see the README). Nothing was changed." };
  if (/^https:\/\/(?:www\.)?dropbox\.com\//.test(u))
    return { url: u.replace(/^https:\/\/(?:www\.)?dropbox\.com/, "https://dl.dropboxusercontent.com") };
  if (/^https:\/\/\S+$/.test(u) || u.indexOf(location.origin + "/") === 0) return { url: u };
  return { err: "That is not a link (it should start with https://). Nothing was changed." };
}
function linkName(u) {
  var a = document.createElement("a");
  a.href = u;
  var n = decodeURIComponent(a.pathname.split("/").pop() || "");
  return /\.json$/i.test(n) ? n : a.hostname + " link";
}
function readMonLink(url, key, done, name) {
  key = String(key || "").trim();
  var L = linkUrl(url, key),
    get = function (u) {
      return fetch(u, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw r.status;
        if (+r.headers.get("content-length") > FMAX.bytes) throw 0;
        return r.text();
      });
    };
  if (L.err) return done(L.err);
  var named = name
    ? Promise.resolve(name)
    : L.drive
      ? get("https://www.googleapis.com/drive/v3/files/" + L.drive + "?fields=name&key=" + encodeURIComponent(key)).then(function (t) {
          return JSON.parse(t).name;
        })
      : Promise.resolve(linkName(L.url));
  named
    .then(function (n) {
      return get(L.url).then(function (text) {
        var link = { url: String(url).trim() };
        if (L.drive) link.key = key;
        readMonText(n, text, done, link);
      });
    })
    .catch(function (e) {
      var why =
        typeof e !== "number"
          ? "no answer the app may read: you are offline, or the host does not let web apps read the file (see the README)"
          : e === 0
            ? "the file is over 20 MB"
            : L.drive && (e === 400 || e === 403)
              ? "Google answered " +
                e +
                ": the API key was refused. Check that the key is typed in full, that the Google Drive API is enabled for it, and that its website restriction (if any) allows " +
                location.origin
              : e === 404 || e === 401 || e === 403
                ? "the host answered " + e + ": share the file so anyone with the link can view it, and check the link"
                : "the host answered " + e;
      done("Could not read that link (" + why + "). Nothing was changed.");
    });
}
function readMonText(fname, text, done, link) {
  var file = { name: cStr(fname) || "file" };
  if (String(text).length > FMAX.bytes) return done("That file is too large (over 20 MB). Nothing was changed.");
  (function () {
    try {
      var j = JSON.parse(String(text).replace(/^\uFEFF/, "")),
        L = Array.isArray(j) ? j : (j && j.monsters) || [],
        SP = (!Array.isArray(j) && j && j.spells) || [],
        AL = (!Array.isArray(j) && j && j.aliases) || {};
      if (!Array.isArray(L) || !Array.isArray(SP) || typeof AL !== "object") throw 0;
      AL = cleanAliases(AL);
      var good = cleanAll(L, cleanMon),
        spells = cleanAll(SP, cleanSpell),
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
      CUSTOM = keep.concat([Object.assign({ name: file.name, monsters: good, spells: spells, aliases: AL, at: Date.now() }, link || {})]);
      if (!saveCustom()) {
        CUSTOM = before;
        saveCustom();
        done(
          "The file was read (" +
            good.length +
            " stat blocks, " +
            spells.length +
            " spells) but this device has no room to store it (" +
            Math.round(storeUsed() / 1000) +
            " thousand characters already used). Remove a file you no longer need or clear old combat logs, then try again. Nothing was changed.",
        );
        return;
      }
      var bk = {};
      BOOT_BASE.forEach(function (m) {
        bk[nkey(m.name)] = 1;
      });
      var rep = good.filter(function (m) {
        return bk[nkey(m.name)];
      }).length;
      var sum =
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
        (bad ? "\n" + bad + " entries skipped (a stat block needs name, id, AC, HP and abilities; a spell needs a name and text)" : "");
      fileNote(sum.replace(/\n/g, " "), true); // shown in the card after the reload
      alert(sum + "\n\nThe app will now reload.");
      location.reload();
    } catch (e) {
      done("That file is not a valid monster or spell file. Nothing was changed.");
    }
  })();
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
