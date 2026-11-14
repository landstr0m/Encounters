// Encounters app, part 8 of 11: character sheet and Edit tab, backup export / import, reference data loading, stat-block text formatting.
function uniq(a) {
  return a.filter(function (x, i) {
    return x && a.indexOf(x) === i;
  });
}
var DLBL = [
  ["res", "Resistances"],
  ["imm", "Immunities"],
  ["vul", "Vulnerabilities"],
  ["cimm", "Condition immunities"],
];
function libOf(c) {
  return c && c.kind === "pc"
    ? S.lib.find(function (x) {
        return x.id === c.libId;
      })
    : null;
}
function pcPb(l) {
  return (
    l.pb ||
    (l.parsed && l.parsed.length
      ? 2 +
        Math.floor(
          ((l.parsed.reduce(function (a, x) {
            return a + (x.level || 0);
          }, 0) || 1) -
            1) /
            4,
        )
      : 2)
  );
}
// Character sheet part of the Edit tab: ability scores, save proficiencies, level, proficiency bonus, save DC, defences.
function pcSheetHTML(c) {
  var l = libOf(c);
  if (!l) return "";
  var ab = l.abil || {},
    pf = l.saveProf || [];
  return (
    '</div><h3>Character sheet</h3><div class="muted">Saved with ' +
    esc(l.name) +
    " for future sessions." +
    (l.k ? " Update from Kanka replaces ability scores and saves; defences you add here are kept." : "") +
    "</div>" +
    '<div class="eg ab6">' +
    AK.map(function (k) {
      var v = ab[k];
      return (
        "<label><span>" +
        k.toUpperCase() +
        ' <span data-mod="' +
        k +
        '">' +
        (v == null ? "" : sgn(Math.floor((v - 10) / 2))) +
        '</span></span><input data-pe="abil" data-k="' +
        k +
        '" type="number" inputmode="numeric" min="1" max="30" value="' +
        (v == null ? "" : v) +
        '"></label>'
      );
    }).join("") +
    "</div>" +
    '<div class="svp6"><b>Save proficiencies</b>' +
    AK.map(function (k) {
      return (
        '<label><input type="checkbox" data-pe="prof" data-k="' +
        k +
        '"' +
        (pf.indexOf(k) >= 0 ? " checked" : "") +
        ">" +
        k.toUpperCase() +
        "</label>"
      );
    }).join("") +
    '<label>Level <input data-pe="lvl" type="number" inputmode="numeric" min="1" max="20" placeholder="' +
    (pcLvl(Object.assign({}, l, { lvl: 0 })) || "") +
    '" value="' +
    (l.lvl || "") +
    '" style="width:4em" title="Total character level, used for encounter XP. Blank = from Kanka"></label>' +
    '<label>Prof. bonus <input data-pe="pb" type="number" inputmode="numeric" min="2" max="6" value="' +
    pcPb(l) +
    '" style="width:4em"></label>' +
    '<label>Save DC <input data-pe="dc" type="number" inputmode="numeric" min="8" max="30" placeholder="auto" value="' +
    (l.dc || "") +
    '" style="width:4.5em" title="Blank = worked out from class, proficiency and ability"></label>' +
    '<label>Rules <select data-pe="ed" aria-label="Rules edition for this character" title="Which version of a spell this character casts, and Paladin / Ranger spell slots">' +
    [
      ["", "Default (" + (S.pcEd === "2014" ? "5.1" : "5.2") + ")"],
      ["2014", "5.1 (2014)"],
      ["2024", "5.2 (2024)"],
    ]
      .map(function (o) {
        return '<option value="' + o[0] + '"' + ((l.ed || "") === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
      })
      .join("") +
    "</select></label></div>" +
    '<div class="eg">' +
    DLBL.map(function (d) {
      return (
        '<label class="w">' +
        d[1] +
        '<input data-pe="' +
        d[0] +
        '" type="text" placeholder="' +
        (d[0] === "cimm" ? "e.g. charmed, frightened" : "e.g. fire, poison") +
        '" value="' +
        esc((l[d[0]] || []).join(", ")) +
        '"></label>'
      );
    }).join("")
  );
}
// A character sheet field changed: validate it, store it on the library character, show what was left out.
function pcSheetChange(t, c) {
  var l = libOf(c);
  if (!l) return;
  var f = t.dataset.pe,
    k = t.dataset.k;
  if (f === "abil") {
    l.abil = l.abil || {};
    var n = t.value === "" ? null : Math.max(1, Math.min(30, Math.floor(+t.value)));
    l.abil[k] = n;
    if (n != null) t.value = n;
    var md = dr.querySelector('[data-mod="' + k + '"]');
    if (md) md.textContent = n == null ? "" : sgn(Math.floor((n - 10) / 2));
  } else if (f === "prof") {
    l.saveProf = AK.filter(function (a) {
      var b = dr.querySelector('[data-pe="prof"][data-k="' + a + '"]');
      return b && b.checked;
    });
  } else if (f === "dc") {
    var dc = Math.floor(+t.value);
    l.dc = dc >= 8 && dc <= 30 ? dc : null;
    if (!l.dc) t.value = "";
  } else if (f === "lvl") {
    var lv = Math.floor(+t.value);
    l.lvl = lv >= 1 && lv <= 20 ? lv : null;
    if (!l.lvl) t.value = "";
  } else if (f === "ed") {
    l.ed = t.value === "2014" || t.value === "2024" ? t.value : null;
  } else if (f === "pb") {
    var pb = Math.floor(+t.value);
    if (pb >= 2 && pb <= 6) l.pb = pb;
    else t.value = pcPb(l);
  } else {
    var ok =
      f === "cimm"
        ? CONDS.concat(["Exhaustion"]).map(function (x) {
            return x.toLowerCase();
          })
        : DTYPES;
    var words = t.value
        .toLowerCase()
        .split(/[,;\/]+/)
        .map(function (w) {
          return w.trim();
        })
        .filter(Boolean),
      bad = words.filter(function (w) {
        return ok.indexOf(w) < 0;
      });
    l[f] = uniq(
      words.filter(function (w) {
        return ok.indexOf(w) >= 0;
      }),
    );
    l["x" + f] = l[f].filter(function (w) {
      return (l["k" + f] || []).indexOf(w) < 0;
    });
    t.value = l[f].join(", ");
    ui.msg = bad.length ? "Not recognised, left out: " + bad.join(", ") + "." : "Saved.";
    var mg = dr.querySelector(".ed .msg");
    if (mg) mg.textContent = ui.msg;
    return;
  }
  {
    var mods = {};
    AK.forEach(function (a) {
      var v = (l.abil || {})[a];
      mods[a] = v == null ? null : Math.floor((v - 10) / 2);
    });
    if (
      AK.some(function (a) {
        return mods[a] != null;
      })
    ) {
      l.saves = {};
      AK.forEach(function (a) {
        l.saves[a] = mods[a] == null ? null : mods[a] + ((l.saveProf || []).indexOf(a) >= 0 ? pcPb(l) : 0);
      });
    }
    if (f === "abil" && k === "dex" && mods.dex != null) {
      l.ib = mods.dex;
      c.ib = mods.dex;
    }
  }
}
// Edit tab for the creature in S.edit: name, numbers, extra defences, hidden base stats; for a player also the character sheet.
function editHTML() {
  var c = S.edit != null ? findC(S.edit) : null;
  if (!c || c.kind === "fx")
    return '<p class="muted">Tap ✎ on a row in the table to rename a combatant, change its AC or hit points, or give it extra actions, spells or traits.</p>';
  var m =
      c.kind === "mon"
        ? MON.find(function (x) {
            return x.id === c.monId;
          })
        : null,
    X = c.x || [];
  var sib =
    c.kind === "mon"
      ? S.list.filter(function (o) {
          return o.monId === c.monId && o.id !== c.id;
        }).length
      : 0;
  var TY = [
    ["a", "Action"],
    ["b", "Bonus action"],
    ["r", "Reaction"],
    ["t", "Trait"],
  ];
  return (
    '<div class="ed"><h2 id="edh">' +
    esc(c.name) +
    "</h2>" +
    (m ? '<div class="muted">' + esc(m.name) + " · CR " + esc(m.cr) + " · stat block HP " + esc(m.hp) + "</div>" : "") +
    '<div class="eg"><label class="w">Display name<input data-ed="name" type="text" maxlength="40" value="' +
    esc(c.name) +
    '"></label>' +
    '<label>Base AC<input data-ed="ac" type="number" inputmode="numeric" min="0" value="' +
    c.ac +
    '"></label>' +
    '<label>Initiative<input data-ed="init" type="number" inputmode="numeric" value="' +
    (c.init == null ? "" : c.init) +
    '"></label>' +
    '<label>Max HP<input data-ed="max" type="number" inputmode="numeric" min="1" value="' +
    c.max +
    '"></label>' +
    '<label>Current HP<input data-ed="hp" type="number" inputmode="numeric" min="0" value="' +
    c.hp +
    '"></label>' +
    (c.kind === "pc" ? pcSheetHTML(c) : "") +
    (c.kind === "mon"
      ? '<label class="w">Custom group (blank = none)<input data-ed="cg" type="text" maxlength="30" placeholder="e.g. Bandits" value="' +
        esc(c.cg || "") +
        '"></label>'
      : "") +
    "</div>" +
    (m
      ? '<div class="lib"><label><input type="checkbox" data-ed="hideBase"' +
        (c.hideBase ? " checked" : "") +
        "><span>Hide the stat block\u2019s actions on the turn card, use only the extras below (e.g. a different weapon set)</span></label></div>"
      : "") +
    "<h3>Extra actions, spells and traits</h3>" +
    X.map(function (x, i) {
      return (
        '<div class="ex"><div class="er"><select data-ex="t" data-i="' +
        i +
        '" aria-label="Type">' +
        TY.map(function (t) {
          return '<option value="' + t[0] + '"' + (x.t === t[0] ? " selected" : "") + ">" + t[1] + "</option>";
        }).join("") +
        "</select>" +
        '<input data-ex="n" data-i="' +
        i +
        '" type="text" maxlength="60" placeholder="Name, e.g. Longbow" value="' +
        esc(x.n || "") +
        '"><button class="x" data-act="exrm" data-i="' +
        i +
        '" aria-label="Delete entry">×</button></div>' +
        '<textarea data-ex="d" data-i="' +
        i +
        '" rows="2" maxlength="1000" placeholder="e.g. +4, range 150/600 ft. Hit: 6 (1d8+2) piercing. Write Recharge 5-6 in the name to get a Ready/Spent toggle.">' +
        esc(x.d || "") +
        "</textarea></div>"
      );
    }).join("") +
    '<div class="row"><button class="add" data-act="exadd" style="flex:1">+ Add entry</button></div>' +
    (sib
      ? '<div class="row"><button data-act="excopy" style="flex:1">Copy extras to the other ' +
        sib +
        " " +
        esc(m ? m.name : "") +
        "</button></div>"
      : "") +
    '<div class="msg">' +
    esc(ui.msg || "Changes save when you leave a field.") +
    "</div></div>"
  );
}
// Download the one backup file: state, and (optionally) the monster files kept on this device.
function doExport() {
  var obj = { app: "encounter-tracker", version: 2, edition: "2024", exported: new Date().toISOString(), state: S };
  if (CUSTOM.length && ui.expMon !== false) obj.monsterFiles = CUSTOM;
  var name = "encounter-backup-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + ".json";
  var blob = new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" });
  var file = null;
  try {
    file = new File([blob], name, { type: "application/json" });
  } catch (e) {}
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator
      .share({ files: [file], title: name })
      .then(function () {
        ui.msg = "Exported.";
        renderDrawer();
      })
      .catch(function (e) {
        ui.msg = e && e.name === "AbortError" ? "Export cancelled." : "Sharing failed. Try again.";
        renderDrawer();
      });
    return;
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
  }, 4000);
  ui.msg = "Saved " + name + " to your downloads.";
}
// Restore a backup file: check its shape first, then replace state (and monster files); nothing changes if the file is not valid.
function doImport(f) {
  var r = new FileReader();
  r.onload = function () {
    try {
      var o = JSON.parse(r.result);
      var st = o && o.app === "encounter-tracker" ? o.state : null;
      if (!st || !Array.isArray(st.list) || !Array.isArray(st.lib)) throw new Error("bad");
      st.list.forEach(function (c) {
        if (typeof c.id !== "number" || typeof c.name !== "string" || !Array.isArray(c.conds) || isNaN(+c.hp) || isNaN(+c.max))
          throw new Error("bad");
      });
      var mf = Array.isArray(o.monsterFiles) ? okFiles(o.monsterFiles) : null;
      S = Object.assign(S, st);
      fixIds();
      ui.sel = {};
      ui.drawer = true;
      S.tab = "data";
      S.dsec = "bak";
      ui.msg =
        "Imported " +
        st.list.length +
        " combatants, " +
        st.lib.length +
        " characters, " +
        (S.enc || []).length +
        " encounters, " +
        (S.fxLib || []).length +
        " effect templates" +
        (mf ? ", " + mf.length + " of your files" : "") +
        ".";
      save();
      if (mf) {
        CUSTOM = mf;
        if (!saveCustom()) ui.msg += " Your files are too large for this device.";
        else {
          alert(ui.msg);
          location.reload();
          return;
        }
      }
      renderAll();
    } catch (e) {
      ui.msg = "That file is not a valid encounter export. Nothing was changed.";
      renderDrawer();
    }
  };
  r.onerror = function () {
    ui.msg = "Could not read that file.";
    renderDrawer();
  };
  r.readAsText(f);
}
// Rules reference: SRD 5.2 spells and full condition text from reference.json (local file, cached offline).
var REF = null,
  SPRE = null;
// reference.json = SRD 5.2. Your files (Data > Sources) can add spells and other names (aliases) for spells.
function refLoad() {
  if (REF) return;
  REF = { spells: [], conditions: {}, loading: 1 };
  var opt = function (file) {
    return fetch(file)
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
  };
  var old = opt("reference-2014.json"); // SRD 5.1 spells for characters on 2014 rules (optional: without it everything is 2024)
  fetch("reference.json")
    .then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    })
    .then(function (j) {
      return Promise.resolve().then(function () {
        // spells from your files: a matching name replaces the built-in spell; aliases add a second name for a spell
        CUSTOM.forEach(function (f) {
          (f.spells || []).forEach(function (x0) {
            var x = Object.assign({}, x0, { src: f.name }),
              i = j.spells.findIndex(function (y) {
                return spKey(y.n) === spKey(x.n);
              });
            if (i >= 0) j.spells[i] = x;
            else j.spells.push(x);
          });
        });
        CUSTOM.forEach(function (f) {
          Object.keys(f.aliases || {}).forEach(function (a) {
            var t = j.spells.find(function (x) {
              return x.n === f.aliases[a];
            });
            if (
              t &&
              !j.spells.some(function (x) {
                return spKey(x.n) === spKey(a);
              })
            ) {
              var c = Object.assign({}, t);
              c.n = a;
              c.a = t.n;
              j.spells.push(c);
            }
          });
        });
        return old.then(function (o) {
          // by14: 2014 version of a spell by name. The two SRD 5.1 spells with no 2024 namesake also join the list.
          j.by14 = {};
          ((o && o.spells) || []).forEach(function (x) {
            x.ed = "2014";
            j.by14[spKey(x.n)] = x;
            if (
              !j.spells.some(function (y) {
                return spKey(y.n) === spKey(x.n);
              })
            )
              j.spells.push(x);
          });
          j.spells.sort(function (a, b) {
            return a.n.localeCompare(b.n);
          });
          return j;
        });
      });
    })
    .then(function (j) {
      REF = j;
      SPRE = null;
      if (ui.drawer && (S.tab === "ref" || S.tab === "stat")) renderDrawer();
      renderTurn();
    })
    .catch(function () {
      REF = { spells: [], conditions: {}, err: 1 };
      if (S.tab === "ref") renderDrawer();
    });
}
// Stat block text: highlight dice to roll, attack bonuses and DCs; link spell names (in entries that cast spells) to the Rules tab.
// Damage types: symbol + colour (CSS .dt-<type>). Stat-block text always capitalises them ("Cold damage").
var DTI = {
  acid: "🧪",
  bludgeoning: "🔨",
  cold: "❄️",
  fire: "🔥",
  force: "✴️",
  lightning: "⚡",
  necrotic: "💀",
  piercing: "🏹",
  poison: "☠️",
  psychic: "🧠",
  radiant: "☀️",
  slashing: "🗡️",
  thunder: "💥",
};
var DTN = "Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder";
var DTRE = new RegExp("\\b(" + DTN + ")\\b(?=(?:,? (?:or |and )?(?:" + DTN + "))* damage)", "g"),
  DTW = new RegExp("\\b(" + DTN + ")\\b", "g");
function dtSpan(m) {
  var k = m.toLowerCase();
  return '<span class="dt dt-' + k + '"><i>' + DTI[k] + "</i>" + m + "</span>";
}
var AMB = ["Light", "Darkness", "Resistance", "Darkvision", "Fly", "Teleport"];
var CNRE =
  /\b(Blinded|Charmed|Deafened|Exhaustion|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious)\b/g;
function spRe() {
  if (SPRE || !REF || !REF.spells || !REF.spells.length) return SPRE;
  var n = REF.spells
    .map(function (x) {
      return x.n;
    })
    .sort(function (a, b) {
      return b.length - a.length;
    })
    .map(function (x) {
      return esc(x)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/&#39;/g, "(?:&#39;|\u2019)");
    });
  SPRE = new RegExp("\\b(" + n.join("|") + ")\\b", "g");
  return SPRE;
}
// Stat-block text -> HTML: escapes it, makes dice and save DCs stand out and turns spell and condition names into links.
function rich(t) {
  t = String(t || "");
  var h = esc(t);
  var cast = /cast/i.test(t);
  if (spRe())
    h = h.replace(SPRE, function (m, p1, off, str) {
      var bef = str.slice(Math.max(0, off - 20), off),
        aft = str.slice(off + m.length, off + m.length + 12);
      if (AMB.indexOf(m) >= 0 && !cast) return m; // plain words: only in casting text
      if (/^ [A-Z][a-z]/.test(aft) || /^ attack/.test(aft)) return m; // part of a longer name: Fear Ray, Shield Bash
      if (/[A-Z][a-z]+ $/.test(bef) && !/(?:\u2019|&#39;)s $/.test(bef)) return m; // Bright Light, Long Jump (but Melf’s Acid Arrow links)
      return '<a class="spl" data-act="spl" data-n="' + m.replace("\u2019", "&#39;") + '">' + m + "</a>";
    });
  h = h.replace(CNRE, '<a class="spl cnd" data-act="spl" data-n="$1">$1</a>');
  h = h.replace(DTRE, dtSpan);
  h = h.replace(/(\d+ )?\((\d+d\d+(?: ?[+\u2212-] ?\d+)?)\)|(\b\d*d\d+(?: ?[+\u2212-] ?\d+)?)(?![\w(])/g, function (m) {
    return '<span class="dice">' + m + "</span>";
  });
  h = h.replace(
    /((?:Melee|Ranged|Melee\/ranged)(?: or Ranged)?(?: Attack Roll:| Weapon Attack:)? )([+\u2212-]\d+)/g,
    '$1<span class="hit">$2</span>',
  );
  h = h.replace(/\bDC \d+/g, '<span class="dcx">$&</span>');
  return h;
}
// Lay out one stat-block entry: roll tables as rows, and one line per save outcome (Failure / Success).
function blk(h) {
  // Roll tables ("1: Charm Ray. …" or "1-4. The target …") become one row per result; every entry gets one line per save outcome (ROADMAP: optional compact mode).
  var re = /([.:;] |^)(\d{1,2})(?:-(\d{1,2}))?[:.] (?=[A-Z<])/g,
    m,
    cut = [],
    nx = 1;
  while ((m = re.exec(h))) {
    var a = +m[2],
      z = +(m[3] || m[2]);
    if (a !== nx) continue;
    cut.push([m.index + m[1].length, re.lastIndex, m[2] + (m[3] ? "–" + m[3] : ""), m[0].slice(-2, -1)]);
    nx = z + 1;
  }
  var oc = function (x) {
    return x
      .replace(/(^|\. )((?:First |Second )?Failure(?: or Success)?|Success):/g, function (_, p, l) {
        return (p ? "." : "") + '<br><b class="oc">' + l + ":</b>";
      })
      .replace(/^<br>/, "");
  };
  if (cut.length < 2) return oc(h);
  var out = oc(h.slice(0, cut[0][0]).trim()) + '<div class="ro">';
  cut.forEach(function (c, i) {
    var t = h.slice(c[1], i + 1 < cut.length ? cut[i + 1][0] : h.length).trim(),
      hd = "",
      d = t.indexOf(". ");
    if (c[3] === ":" && d > 0 && d < 60) {
      hd = '<b class="rh">' + t.slice(0, d) + "</b><br>";
      t = t.slice(d + 2);
    }
    out += '<div><span class="rn">' + c[2] + "</span><div>" + hd + oc(t) + "</div></div>";
  });
  return out + "</div>";
}
function ent(n, t) {
  var x = blk(rich(t));
  return x.indexOf("<div") >= 0 ? '<div class="p"><b>' + esc(n) + ".</b> " + x + "</div>" : "<p><b>" + esc(n) + ".</b> " + x + "</p>";
}
