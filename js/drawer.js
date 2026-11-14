// Encounters app, part 6 of 11: drawer panels: stat block, Add (monsters / party / effects), loading prepared encounters.
// ================= 5. DRAWER PANELS: stat block, Add (monsters / party / effects), encounters, data, edit, rules =================
function statHTML() {
  if (S.stat === "pc") {
    var pc = findC(S.statC),
      kl =
        pc &&
        S.lib.find(function (l) {
          return l.id === pc.libId;
        });
    if (!kl) return '<p class="muted">This character is not in the party library.</p>';
    var ab = kl.abil || {};
    return (
      "<h3>" +
      esc(kl.name) +
      "</h3><p>" +
      esc(kl.cls || "") +
      (kl.race ? " · " + esc(kl.race) : "") +
      "</p>" +
      "<p>" +
      AK.map(function (k) {
        var v = ab[k];
        return "<b>" + k.toUpperCase() + "</b> " + (v == null ? "?" : v + " (" + sgn(Math.floor((v - 10) / 2)) + ")");
      }).join(" · ") +
      "</p>" +
      "<p>Passive Perception " +
      (kl.pp == null ? "?" : kl.pp) +
      (kl.hpEst ? " · Estimated max HP " + kl.hpEst : "") +
      "</p>" +
      (kl.parsed && kl.parsed.length
        ? "<p><b>Read as</b> " +
          kl.parsed
            .map(function (x) {
              return esc(x.class) + (x.subclass ? " (" + esc(x.subclass) + ")" : "") + " " + (x.level || "?");
            })
            .join(" / ") +
          "</p>"
        : "") +
      (kl.notes && kl.notes.length ? '<p class="muted">' + esc(kl.notes.join("; ")) + "</p>" : "") +
      (kl.saves
        ? "<p><b>Saves</b> " +
          AK.map(function (k) {
            var p = (kl.saveProf || []).indexOf(k) >= 0;
            return (
              (p ? "<b>" : "") +
              k.toUpperCase() +
              " " +
              (kl.saves[k] == null ? "?" : sgn(kl.saves[k])) +
              (p ? "</b>" : "") +
              ((kl.adv || []).indexOf(k) >= 0 ? " (adv.)" : "")
            );
          }).join(" · ") +
          ' <span class="muted">(bold = proficient)</span></p>'
        : "") +
      [
        ["Resistances", kl.res],
        ["Immunities", kl.imm],
        ["Vulnerabilities", kl.vul],
        ["Condition immunities", kl.cimm],
      ]
        .map(function (x) {
          return x[1] && x[1].length ? "<p><b>" + x[0] + "</b> " + esc(x[1].join(", ")) + "</p>" : "";
        })
        .join("") +
      (kl.traits || [])
        .map(function (t) {
          return "<p><b><i>" + esc(t.name) + ".</i></b> " + esc(t.text) + ' <span class="muted">(' + esc(t.src) + ")</span></p>";
        })
        .join("") +
      (kl.speed || kl.senses
        ? "<p>" +
          (kl.speed ? "<b>Speed</b> " + esc(kl.speed) : "") +
          (kl.speed && kl.senses ? " · " : "") +
          (kl.senses ? "<b>Senses</b> " + esc(kl.senses) : "") +
          "</p>"
        : "") +
      (kl.advNote ? '<p class="muted">Save advantage: ' + esc(kl.advNote) + "</p>" : "") +
      (kl.acNote ? '<p class="muted">' + esc(kl.acNote) + "</p>" : "") +
      (kl.url ? '<p><a href="' + esc(kl.url) + '" target="_blank" rel="noopener">Open in Kanka</a></p>' : "") +
      (kl.durl ? '<p><a href="' + esc(kl.durl) + '" target="_blank" rel="noopener">Open in D&amp;D Beyond</a></p>' : "") +
      (kl.url || kl.durl ? "" : '<p class="muted">Not linked to Kanka or D&amp;D Beyond. Add scores and defences with ✎ Edit.</p>')
    );
  }
  var m = MON.find(function (x) {
    return x.id === S.stat;
  });
  if (!m) return '<p class="muted">Tap ⓘ on a monster in the table, or a name in the search list, to open its stat block here.</p>';
  var names = AB;
  var ab = m.abil
    .map(function (v, i) {
      return "<div><b>" + names[i] + "</b><span>" + esc(v) + " (" + sgn(mod(+v)) + ")</span></div>";
    })
    .join("");
  var sc = S.statC != null ? findC(S.statC) : null,
    cx = "";
  if (sc && sc.monId === m.id && (sc.name !== m.name || sc.hideBase || (sc.x || []).length)) {
    var TL = { a: "Action", b: "Bonus action", r: "Reaction", t: "Trait" };
    cx =
      '<div class="cx"><h3>' +
      esc(sc.name) +
      "</h3>" +
      (sc.hideBase ? "<p><i>Uses only the extras below instead of the actions in this stat block.</i></p>" : "") +
      (sc.x || [])
        .map(function (x) {
          return "<p><b>" + esc(x.n || "Extra") + '.</b> <span class="muted">(' + TL[x.t] + ")</span> " + rich(x.d || "") + "</p>";
        })
        .join("") +
      '<p><button data-act="sedit">Edit ' +
      esc(sc.name) +
      "</button></p></div>";
  }
  var ex = m.extra
    .map(function (e) {
      return (
        "<dt>" +
        esc(e[0]) +
        "</dt><dd>" +
        (/^(Immune|Resist|Vulnerable)$/.test(e[0])
          ? esc(e[1])
              .split(";")
              .map(function (part, i) {
                return i
                  ? part.replace(CNRE, '<a class="spl cnd" data-act="spl" data-n="$1">$1</a>')
                  : part.replace(DTW, dtSpan).replace(CNRE, '<a class="spl cnd" data-act="spl" data-n="$1">$1</a>');
              })
              .join(";")
          : esc(e[1])) +
        "</dd>"
      );
    })
    .join("");
  var tr = m.traits
    .map(function (t) {
      return ent(t[0], t[1]);
    })
    .join("");
  var A = actsOf(m),
    nested = {};
  A.forEach(function (p) {
    nestOf(A, p).forEach(function (q) {
      nested[q.key] = 1;
    });
  });
  var one = function (p, kids) {
    var txt = rawOf(m, p),
      body =
        p.kind === "multi"
          ? rich(txt) +
            (kids.length
              ? '<div class="nest">' +
                kids
                  .map(function (q) {
                    return one(q, []);
                  })
                  .join("") +
                "</div>"
              : "")
          : p.kind === "spell"
            ? spellsHTML(p, txt)
            : p.kind === "info"
              ? esc(txt)
              : blk(rich(txt));
    return '<div class="p sba"><b>' + esc(p.n) + ".</b>" + limHTML(p) + " " + body + "</div>";
  };
  var sec = function (h, k) {
    var L = A.filter(function (p) {
      return p.sec === k && !nested[p.key];
    });
    return L.length
      ? "<h3>" +
          h +
          "</h3>" +
          L.map(function (p) {
            return one(p, nestOf(A, p));
          }).join("")
      : "";
  };
  return (
    '<div class="sb">' +
    cx +
    '<img class="thumb" src="img/' +
    esc(m.srcId || m.id) +
    '.webp" alt="" onerror="this.remove()"><h2>' +
    esc(m.name) +
    '</h2><div class="type">' +
    esc(m.type) +
    "</div>" +
    "<dl><dt>AC</dt><dd>" +
    esc(m.ac) +
    (m.acn ? " (" + esc(m.acn) + ")" : "") +
    "</dd><dt>HP</dt><dd>" +
    esc(m.hp) +
    " (" +
    esc(m.dice) +
    ")</dd><dt>Speed</dt><dd>" +
    esc(m.speed) +
    "</dd><dt>CR</dt><dd>" +
    esc(m.cr) +
    "</dd></dl>" +
    '<div class="abil">' +
    ab +
    "</div><dl>" +
    ex +
    "</dl>" +
    (tr ? "<h3>Traits</h3>" + tr : "") +
    sec("Actions", "a") +
    sec("Bonus actions", "b") +
    sec("Reactions", "r") +
    sec("Legendary actions", "l") +
    "</div>"
  );
}
function segHTML(label, key, opts) {
  return (
    '<div class="seg"><b>' +
    label +
    "</b>" +
    opts
      .map(function (o) {
        return (
          '<button data-act="set" data-k="' +
          key +
          '" data-v="' +
          o[0] +
          '" class="' +
          (S[key] === o[0] ? "on" : "") +
          '">' +
          o[1] +
          "</button>"
        );
      })
      .join("") +
    "</div>"
  );
}
function selHTML(id, act, first, opts, cur) {
  return (
    '<select id="' +
    id +
    '" data-act="' +
    act +
    '" aria-label="' +
    first +
    '"><option value="">' +
    first +
    "</option>" +
    opts
      .map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      })
      .join("") +
    "</select>"
  );
}
function filtHTML() {
  var cap = function (t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  var crs = CRS.map(function (x) {
    return [x, "CR " + x];
  });
  return (
    '<div class="flt">' +
    selHTML(
      "ftype",
      "ftype",
      "All types",
      TYPES.map(function (t) {
        return [t, cap(t)];
      }),
      ui.fType,
    ) +
    selHTML("fmin", "fmin", "CR from", crs, ui.fMin) +
    selHTML("fmax", "fmax", "CR to", crs, ui.fMax) +
    "</div>"
  );
}
// Effect payload: dd = damage dice (rolled at the table), dt = damage type, sv = save ability index, dc, st = status, dur = how long the status lasts.
var FXDUR = [
  ["", "Normal duration"],
  ["fx", "1 round (until it acts again)"],
  ["e", "To end of target\u2019s next turn"],
];
function fxSum(c) {
  var p = [];
  if (c.dd || c.dt) p.push((c.dd || "") + (c.dt ? " " + c.dt : "") + " damage");
  if (c.sv !== "" && c.sv != null) p.push(AB[+c.sv] + " save" + (c.dc ? " DC " + c.dc : ""));
  if (c.st)
    p.push(
      c.st +
        (c.dd || c.dt ? " on a failed save" : "") +
        (c.dur === "fx" ? " (1 round)" : c.dur === "e" ? " (to end of its next turn)" : ""),
    );
  return p.join(" · ");
}
function fxHas(c) {
  return !!(c.dd || c.dt || c.st || (c.sv !== "" && c.sv != null));
}
function fxApplyStatus(T, fx) {
  var skip = [];
  T.forEach(function (c) {
    var x = fx.st;
    if (condBlocked(c, x)) {
      skip.push(esc(c.name));
      return;
    }
    if (c.conds.indexOf(x) < 0) {
      c.conds.push(x);
      linkAdd(c, x);
    }
    if (fx.dur === "fx") {
      c.exp = c.exp || {};
      c.exp[x] = { src: fx.id, k: "s", h: false };
    } else if (fx.dur === "e") {
      c.exp = c.exp || {};
      c.exp[x] = { src: c.id, k: "e", h: c.id === S.turnId };
    } else expSet(c, x);
    incSync(c, true);
  });
  return skip;
}
function curFx() {
  var f = ui.fxRun != null && ui.fxRun === S.turnId ? findC(ui.fxRun) : null;
  return f && f.kind === "fx" ? f : null;
}
// Effect templates: a few built-in examples (edit before adding) + the DM's own, saved in S.fxLib (and in the backup)
var FXT = [
  { name: "Lair action", init: "20", desc: "Pick one lair action from the stat block", vis: true },
  {
    name: "Collapsing ceiling",
    init: "10",
    desc: "Area under the cracks",
    vis: true,
    dd: "4d10",
    dt: "bludgeoning",
    sv: "1",
    dc: "15",
    st: "Prone",
  },
  { name: "Poison gas", init: "20", desc: "Creatures in the cloud", vis: true, dd: "2d8", dt: "poison", sv: "2", dc: "13", st: "Poisoned" },
  {
    name: "Spreading fire",
    init: "10",
    desc: "Creatures in burning squares",
    vis: true,
    dd: "1d10",
    dt: "fire",
    sv: "1",
    dc: "12",
    st: "Burning",
  },
  { name: "Reinforcements", init: "0", desc: "Arrive at the end of round 3", vis: false },
];
function fxBlank() {
  return { name: "", init: "", desc: "", vis: true, dd: "", dt: "", sv: "", dc: "", st: "", dur: "" };
}
function fxTplHTML() {
  var L = S.fxLib || [];
  return (
    '<div class="fxt"><b>Templates</b> ' +
    FXT.map(function (t, i) {
      return '<button data-act="fxtpl" data-i="b' + i + '">' + esc(t.name) + "</button>";
    }).join("") +
    L.map(function (t, i) {
      return (
        '<span class="fxs"><button data-act="fxtpl" data-i="s' +
        i +
        '">★ ' +
        esc(t.name) +
        '</button><button class="x" data-act="fxtrm" data-i="' +
        i +
        '" aria-label="Delete template ' +
        esc(t.name) +
        '">×</button></span>'
      );
    }).join("") +
    "</div>"
  );
}
// Add > Effects: the form for a lair action or hazard (initiative, damage, save, status, duration) and the templates.
function fxPanelHTML() {
  var f = ui.fx;
  var stl = CONDS.concat(
    SPELLS.map(function (x) {
      return x[0];
    }),
  );
  return (
    '<p class="muted" style="font-size:.9rem;margin:0 0 8px">An effect acts at a fixed point in the initiative order, such as a lair action or a timed spell. It is never selected for damage or healing.</p>' +
    fxTplHTML() +
    '<input class="search" id="fxname" type="text" maxlength="40" placeholder="Name, e.g. Lair action" value="' +
    esc(f.name) +
    '" aria-label="Effect name">' +
    '<input class="search" id="fxinit" type="number" inputmode="numeric" placeholder="Initiative number, e.g. 20" value="' +
    esc(f.init) +
    '" aria-label="Effect initiative">' +
    '<input class="search" id="fxdesc" type="text" maxlength="200" placeholder="Note for you (players never see it)" value="' +
    esc(f.desc) +
    '" aria-label="Note for the DM">' +
    '<div class="lib"><label><input type="checkbox" id="fxvis"' +
    (f.vis ? " checked" : "") +
    "><span>Show the name to players in the initiative order</span></label></div>" +
    '<h3 style="margin:10px 0 4px">What it does <span class="muted" style="font-weight:400;font-size:.85rem">(optional; dice are rolled at the table)</span></h3>' +
    '<div class="flt"><input class="search" id="fxdd" type="text" maxlength="20" placeholder="Damage, e.g. 2d6" value="' +
    esc(f.dd) +
    '" aria-label="Damage dice" style="margin:0;max-width:8em">' +
    selHTML(
      "fxdt",
      "fxdt",
      "Damage type",
      DTYPES.map(function (t) {
        return [t, DTI[t] + " " + t[0].toUpperCase() + t.slice(1)];
      }),
      f.dt,
    ) +
    "</div>" +
    '<div class="flt">' +
    selHTML(
      "fxsv",
      "fxsv",
      "No save",
      AB.map(function (a, i) {
        return [String(i), a + " save"];
      }),
      f.sv,
    ) +
    '<input class="search" id="fxdc" type="number" inputmode="numeric" min="1" max="30" placeholder="DC" value="' +
    esc(f.dc) +
    '" aria-label="Save DC" style="margin:0;max-width:6em"></div>' +
    '<div class="flt">' +
    selHTML(
      "fxst",
      "fxst",
      "No status",
      stl
        .map(function (x) {
          return [x, nm(x)];
        })
        .sort(function (a, b) {
          return a[1].localeCompare(b[1]);
        }),
      f.st,
    ) +
    selHTML("fxdur", "fxdur", "Normal duration", FXDUR.slice(1), f.dur) +
    "</div>" +
    '<div class="row"><button class="add" data-act="addfx" style="flex:1">Add effect</button><button data-act="fxsave" title="Keep this effect as a template for later">Save as template</button></div>' +
    '<div class="msg">' +
    esc(ui.msg || "") +
    "</div>"
  );
}
// One-line summary of what is in the encounter, shown at the top of the Add tab.
function encSumHTML() {
  var M = S.list.filter(function (c) {
      return c.kind === "mon";
    }),
    P = S.list.filter(function (c) {
      return c.kind === "pc";
    }),
    F = S.list.filter(function (c) {
      return c.kind === "fx";
    });
  if (!M.length && !P.length && !F.length) return '<div class="esum muted">Nothing in the encounter yet.</div>';
  var g = {},
    o = [];
  M.forEach(function (c) {
    if (!g[c.monId]) {
      g[c.monId] = {
        n: 0,
        name: (
          MON.find(function (m) {
            return m.id === c.monId;
          }) || c
        ).name,
      };
      o.push(c.monId);
    }
    g[c.monId].n++;
  });
  var xp = M.filter(function (c) {
    return c.hp > 0;
  }).reduce(function (a, c) {
    return a + (CRXP[String(c.cr)] || 0);
  }, 0);
  var xh = xpHTML(),
    lab = (/· ([A-Za-z ]+)<\/b>/.exec(xh) || [])[1] || "";
  return (
    '<div class="esum"><span class="et"><b>This encounter</b>' +
    (M.length ? " · " + xp.toLocaleString("en") + " XP" + (lab ? ' · <b class="lv">' + lab + "</b>" : "") : "") +
    "</span>" +
    (P.length ? '<span class="ec">👤 ' + P.length + "</span>" : "") +
    o
      .map(function (id) {
        return (
          '<span class="ec">' +
          esc(g[id].name) +
          " ×" +
          g[id].n +
          '<button data-act="sumrm" data-m="' +
          esc(id) +
          '" aria-label="Remove one ' +
          esc(g[id].name) +
          '">−</button></span>'
        );
      })
      .join("") +
    (F.length ? '<span class="ec">⚡ ' + F.length + "</span>" : "") +
    "</div>"
  );
}
function addTopHTML() {
  return (
    '<div class="sub"><button data-act="sub" data-s="monsters" class="' +
    (S.sub === "monsters" ? "on" : "") +
    '">Monsters</button><button data-act="sub" data-s="party" class="' +
    (S.sub === "party" ? "on" : "") +
    '">Party</button><button data-act="sub" data-s="effects" class="' +
    (S.sub === "effects" ? "on" : "") +
    '">Effects</button></div>' +
    encSumHTML() +
    // controls that stay put while scrolling the list below (DM changes them while adding)
    (S.sub === "monsters"
      ? '<div class="segs">' +
        segHTML("Initiative", "initMode", [
          ["each", "Roll each"],
          ["group", "One per group"],
        ]) +
        segHTML("Hit points", "hpMode", [
          ["roll", "Roll HD"],
          ["avg", "Average"],
        ]) +
        "</div>" +
        '<input class="search" id="search" type="search" placeholder="Search monsters" value="' +
        esc(ui.q) +
        '" aria-label="Search monsters">' +
        filtHTML()
      : S.sub === "party"
        ? partyTopHTML()
        : "")
  );
}
// Top of Add > Party: Update from Kanka / D&D Beyond, group filter chips, tick-whole-group, search.
function partyTopHTML() {
  var nd = S.lib.filter(khpDiff).length;
  // Groups / tags (l.tags): one character can be in several (campaigns, parties, guest lists); ui.pg filters, '-' = untagged
  var G = {};
  S.lib.forEach(function (l) {
    (l.tags || []).forEach(function (t) {
      G[t] = (G[t] || 0) + 1;
    });
  });
  var gk = Object.keys(G).sort(),
    pg = ui.pg && (ui.pg === "-" || G[ui.pg]) ? ui.pg : "";
  return (
    '<div class="row upd"><b>Update from</b><button data-act="kanka">Kanka</button><button data-act="ddb">D&amp;D Beyond</button>' +
    (nd ? '<button data-act="usekhp" data-l="all">Use Kanka HP for all (' + nd + ")</button>" : "") +
    "</div>" +
    (gk.length
      ? '<div class="fxt pgrp"><b>Groups</b> <button class="' +
        (pg ? "" : "on") +
        '" data-act="pgrp" data-g="">All</button>' +
        gk
          .map(function (t) {
            return (
              '<button class="' +
              (pg === t ? "on" : "") +
              '" data-act="pgrp" data-g="' +
              esc(t) +
              '">' +
              esc(t) +
              " <small>" +
              G[t] +
              "</small></button>"
            );
          })
          .join("") +
        '<button class="' +
        (pg === "-" ? "on" : "") +
        '" data-act="pgrp" data-g="-">No group</button>' +
        (pg && pg !== "-" ? '<button data-act="pgtick" title="Tick everyone in this group">Tick all in ' + esc(pg) + "</button>" : "") +
        "</div>"
      : "") +
    '<datalist id="tagdl">' +
    gk
      .map(function (t) {
        return '<option value="' + esc(t) + '">';
      })
      .join("") +
    "</datalist>" +
    '<input class="search" id="pq" type="search" placeholder="Search ' +
    S.lib.length +
    ' characters" value="' +
    esc(ui.pq || "") +
    '" aria-label="Search characters">' +
    (ui.msg ? '<div class="msg" role="status">' + esc(ui.msg) + "</div>" : "")
  );
}
// Add > Party: the character library with groups, search, ticks for who is at the table, and Add.
function partyHTML() {
  var q = (ui.pq || "").trim().toLowerCase();
  var inE = function (l) {
    return S.list.some(function (c) {
      return c.libId === l.id;
    });
  };
  // Groups / tags (l.tags): one character can be in several (campaigns, parties, guest lists); ui.pg filters, '-' = untagged
  var G = {};
  S.lib.forEach(function (l) {
    (l.tags || []).forEach(function (t) {
      G[t] = (G[t] || 0) + 1;
    });
  });
  var pg = ui.pg && (ui.pg === "-" || G[ui.pg]) ? ui.pg : "";
  var inG = function (l) {
    return !pg || (pg === "-" ? !(l.tags || []).length : (l.tags || []).indexOf(pg) >= 0);
  };
  var L = S.lib.filter(function (l) {
    return inG(l) && (!q || (l.name + " " + (l.cls || "") + " " + (l.tags || []).join(" ")).toLowerCase().indexOf(q) >= 0);
  });
  var rank = function (l) {
    return S.atTable[l.id] ? 0 : inE(l) ? 2 : 1;
  };
  L = L.slice().sort(function (a, b) {
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
  var row = function (l) {
    var e = inE(l);
    return (
      '<div class="lib"><label><input type="checkbox" data-act="at" data-l="' +
      l.id +
      '"' +
      (S.atTable[l.id] ? " checked" : "") +
      (e ? " disabled" : "") +
      "><span><b>" +
      esc(l.name) +
      '</b><br><span class="meta">' +
      (l.chk ? "<b>set AC/HP</b> · " : "") +
      "AC " +
      l.ac +
      " · HP " +
      l.hp +
      (khpDiff(l) ? " (Kanka " + l.hpEst + ")" : "") +
      " · init " +
      sgn(l.ib) +
      (l.cls ? " · " + esc(l.cls) : "") +
      (e ? " · in encounter" : "") +
      " · <i>" +
      [l.k ? "Kanka" : "", l.ddb ? "D&amp;D Beyond" : ""].filter(Boolean).join(" + ") +
      (l.k || l.ddb ? "" : "by hand") +
      "</i>" +
      ((l.tags || []).length
        ? "<br>" +
          l.tags
            .map(function (t) {
              return '<span class="ptag">' + esc(t) + "</span>";
            })
            .join("")
        : "") +
      "</span></span></label>" +
      '<button data-act="tagl" data-l="' +
      l.id +
      '" aria-label="Groups for ' +
      esc(l.name) +
      '" title="Groups">🏷</button>' +
      (khpDiff(l) ? '<button data-act="usekhp" data-l="' + l.id + '" title="Set max HP to the Kanka estimate">Use Kanka HP</button>' : "") +
      '<button class="x" data-act="dellib" data-l="' +
      l.id +
      '" aria-label="Delete ' +
      esc(l.name) +
      ' from library">×</button></div>' +
      (ui.tagL === l.id
        ? '<div class="row"><input data-tg="' +
          l.id +
          '" type="text" list="tagdl" placeholder="Groups, comma separated, e.g. Blackrock, Guests" value="' +
          esc((l.tags || []).join(", ")) +
          '" aria-label="Groups for ' +
          esc(l.name) +
          '"></div>'
        : "")
    );
  };
  var tk = S.lib.filter(function (l) {
    return S.atTable[l.id] && !inE(l);
  });
  return (
    mergeHTML() +
    '<div id="plist">' +
    (L.map(row).join("") || '<p class="muted">No character matches.</p>') +
    "</div>" +
    '<div class="row"><input id="newchar" type="text" placeholder="Name (optional: , AC 15, HP 28, init +3, lvl 2)" aria-label="New character"><button data-act="newchar">Save</button></div>' +
    '<div class="msg">Saved characters are reused every session. Tick who is at the table today.</div>' +
    (S.lib.length
      ? '<div class="row"><button class="danger' +
        (ui.confirmLib ? " armed" : "") +
        '" data-act="libclear" style="flex:1">' +
        (ui.confirmLib
          ? "Tap again: delete all " + S.lib.length + " saved characters (Update from Kanka reloads them; hand-set AC/HP are lost)"
          : "Delete all saved characters…") +
        "</button></div>"
      : "") +
    '<div class="dfoot"><button class="add" data-act="addparty" style="flex:1"' +
    (tk.length ? "" : " disabled") +
    ">" +
    (tk.length
      ? "Add " +
        tk.length +
        " ticked: " +
        esc(
          tk
            .map(function (l) {
              return l.name;
            })
            .join(", "),
        )
      : "Tick characters to add") +
    "</button>" +
    (tk.length ? '<button data-act="untick">Untick all</button>' : "") +
    "</div>"
  );
}
function addPanelHTML() {
  var h = "";
  if (S.sub === "monsters") {
    h += '<div id="results">' + resultsHTML() + "</div>";
  } else if (S.sub === "effects") {
    h += fxPanelHTML();
  } else {
    return h + partyHTML();
  }
  return h;
}
function encSave() {
  var nm = ui.encName.trim();
  if (!nm) return "Give the encounter a name first.";
  var L = S.list.filter(function (c) {
    return c.kind !== "pc";
  });
  if (!L.length) return "Add monsters or effects to the tracker first, then save.";
  var snap = clone(L).map(function (c) {
    c.spent = {};
    ["base", "rx", "la", "lr", "exp", "cc"].forEach(function (k) {
      delete c[k];
    });
    return c;
  });
  var old = S.enc.find(function (e) {
    return e.name.toLowerCase() === nm.toLowerCase();
  });
  if (old && !confirm("Overwrite the saved encounter \u201c" + old.name + "\u201d?")) return "";
  var e = {
    id: old ? old.id : "e" + Date.now(),
    name: nm,
    note: ui.encNote.trim(),
    lair: !!S.lair,
    list: snap,
    saved: new Date().toISOString().slice(0, 10),
  };
  if (old) S.enc[S.enc.indexOf(old)] = e;
  else S.enc.push(e);
  ui.encName = ui.encNote = "";
  return "Saved \u201c" + nm + "\u201d (" + snap.length + " entries).";
}
// Load a prepared encounter (replace the monsters, keep the players) or add it as reinforcements.
function encLoad(e, add) {
  if (
    !add &&
    S.list.some(function (c) {
      return c.kind !== "pc";
    }) &&
    !confirm("Replace the current monsters and effects with \u201c" + e.name + "\u201d? Players stay.")
  )
    return "";
  if (!add) {
    S.list = S.list.filter(function (c) {
      return c.kind === "pc";
    });
    S.list.forEach(function (c) {
      c.init = null;
    });
    S.turnId = null;
    S.round = 1;
  }
  var names = {},
    gmap = {},
    roll = {};
  S.list.forEach(function (c) {
    names[c.name] = 1;
  });
  clone(e.list).forEach(function (c) {
    c.id = S.next++;
    if (c.grp && c.grp.indexOf("g") === 0) {
      gmap[c.grp] = gmap[c.grp] || "g" + c.id;
      c.grp = gmap[c.grp];
    }
    if (names[c.name]) {
      var mm = /^(.*) (\d+)$/.exec(c.name),
        base = mm ? mm[1] : c.name,
        k = mm ? +mm[2] : 1;
      while (names[base + " " + k]) k++;
      c.name = base + " " + k;
    }
    names[c.name] = 1;
    if (c.kind === "mon" && S.encRoll) {
      var m = MON.find(function (x) {
        return x.id === c.monId;
      });
      if (m) {
        var r = d(20) + mod(+m.abil[1]);
        if (c.grp) {
          if (roll[c.grp] == null) roll[c.grp] = r;
          r = roll[c.grp];
        }
        c.init = r;
      }
    }
    S.list.push(c);
  });
  if (!add || e.note) {
    S.envName = e.name;
    S.envNote = e.note || "";
  }
  if (!add || e.lair) S.lair = !!e.lair;
  pruneSel();
  return (
    (add ? "Added " : "Loaded ") +
    "\u201c" +
    e.name +
    "\u201d. " +
    (S.list.some(function (c) {
      return c.kind === "pc" && c.init == null;
    })
      ? "Enter player initiatives, then Start combat."
      : "")
  );
}
