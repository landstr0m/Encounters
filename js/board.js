// Encounters app, part 5 of 11: turn card, main table, XP bar and the action pad.
// Turn card: the creature whose turn it is, with only what it can still do (action cards, spells, legendary bar, player slots and consumables).
function renderTurn() {
  var el = $("#turn");
  var c = S.list.find(function (x) {
    return x.id === S.turnId;
  });
  if (!c) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.hidden = false;
  if (c.kind === "fx") {
    el.innerHTML =
      '<div class="th"><span class="tn">' +
      esc(c.name) +
      '</span><span class="st"><i>EFFECT</i>init ' +
      c.init +
      '</span><span class="sp"></span><button data-act="fxvis">' +
      (c.vis ? "Visible to players" : "Hidden from players") +
      '</button><button data-act="fxrm">Remove</button></div>' +
      (c.desc ? '<p style="margin:6px 0 0">' + esc(c.desc) + "</p>" : "") +
      (fxHas(c) && !RO
        ? '<p style="margin:6px 0 0"><b>' +
          esc(fxSum(c)) +
          "</b> " +
          (ui.fxRun === c.id
            ? '<span class="muted">Select the targets below, enter the rolled damage and tap Damage (failed save) or Half (saved).</span>'
            : '<button class="primary" data-act="fxgo">Apply\u2026</button>') +
          "</p>"
        : "");
    return;
  }
  var m =
    c.kind === "mon"
      ? MON.find(function (x) {
          return x.id === c.monId;
        })
      : null;
  var chips = c.conds
    .map(function (x) {
      return '<button class="chip" data-act="cond" data-c="' + esc(x) + '" title="Remove ' + esc(nm(x)) + '">' + esc(nm(x)) + " ×</button>";
    })
    .join("");
  var h =
    '<div class="th"><span class="tn">' +
    esc(c.name) +
    "</span>" +
    '<span class="st"><i>AC</i>' +
    (effAC(c) !== +c.ac ? "<s>" + c.ac + '</s> <b class="' + acCls(c) + '">' + effAC(c) + "</b>" : c.ac) +
    '</span><span class="st"><i>HP</i>' +
    c.hp +
    "/" +
    c.max +
    (c.base != null ? " (max \u2212" + (c.base - c.max) + ")" : "") +
    (c.temp > 0 ? " +" + c.temp : "") +
    "</span>";
  var l = libOf(c),
    dcs = pcDCs(l),
    X = c.x || [],
    dv = uniq(
      dcs
        .map(function (d) {
          return d.dc;
        })
        .filter(function (v) {
          return v != null;
        }),
    );
  if (dv.length) h += '<span class="st"><i>DC</i>' + dv.join("/") + "</span>";
  h += m
    ? '<span class="st"><i>SPEED</i>' +
      (effSpeed(c, m.speed) !== m.speed
        ? "<s>" + esc(m.speed) + '</s> <b class="em">' + esc(effSpeed(c, m.speed)) + "</b>"
        : esc(m.speed)) +
      '</span><span class="st"><i>CR</i>' +
      esc(m.cr) +
      "</span>"
    : '<span class="st muted">' +
      (c.kind === "pc"
        ? l
          ? esc(
              [
                l.race,
                (l.parsed || []).length
                  ? l.parsed
                      .map(function (p) {
                        return cap(p.class) + (p.subclass ? " (" + p.subclass + ")" : "") + " " + (p.level || "");
                      })
                      .join(" / ")
                  : l.cls || "",
              ]
                .filter(Boolean)
                .join(" \u00b7 ") || "Player turn",
            )
          : "Player turn"
        : "Stat block not loaded: add your file under Data \u2192 Sources") +
      "</span>";
  // Player card body: DCs, saves, defences and traits (so Show/Hide has something to show).
  var pb = "";
  if (l) {
    pb += dcs
      .map(function (d) {
        return (
          '<div class="a"><b>' +
          (d.dc == null ? "DC ?" : "DC " + d.dc) +
          (d.hit != null ? " \u00b7 " + sgn(d.hit) + " to hit" : "") +
          "</b>" +
          esc(d.what) +
          "</div>"
        );
      })
      .join("");
    // ability modifiers for attack rolls (save proficiencies highlighted, modifier only), proficiency bonus
    var ab = l.abil || {},
      ap = l.saveProf || [],
      am = AK.map(function (k, i) {
        var v = ab[k];
        return (
          '<span class="sv' +
          (ap.indexOf(k) >= 0 ? " svp" : "") +
          '" title="' +
          (ap.indexOf(k) >= 0 ? "Save proficiency" : "") +
          '">' +
          AB[i] +
          " " +
          (v == null ? "?" : sgn(Math.floor((v - 10) / 2))) +
          "</span>"
        );
      }).join("");
    var df = defs(c),
      dl = [
        ["Resists", df.res],
        ["Immune", df.imm],
        ["Vulnerable", df.vul],
        ["Cond. immune", df.cimm],
      ]
        .filter(function (x) {
          return x[1].length;
        })
        .map(function (x) {
          return x[0] + " " + uniq(x[1]).join(", ");
        })
        .join(" \u00b7 ");
    pb =
      '<div class="acts2">' +
      pb +
      '<div class="a pcs"><b>Proficiency ' +
      sgn(pcPb(l)) +
      "</b>" +
      am +
      "</div>" +
      (dl ? '<div class="a"><b>Defences</b>' + esc(dl) + "</div>" : "") +
      "</div>" +
      (ppOf(c) != null ? '<div class="ppl">Passive Perception ' + ppOf(c) + "</div>" : "") +
      slotsHTML(c, l);
    pb += pcSpellsHTML(c, l) + pcItemsHTML(c, l);
    if ((l.traits || []).length)
      pb +=
        "<details" +
        (ui.traitsOpen ? " open" : "") +
        "><summary>Traits (" +
        l.traits.length +
        ")</summary>" +
        l.traits
          .map(function (t) {
            return "<p><b>" + esc(t.name) + ".</b> " + esc(t.text) + "</p>";
          })
          .join("") +
        "</details>";
  }
  var body = !!(m || X.length || pb);
  h +=
    '<span class="sp"></span>' +
    '<button data-act="tedit">Edit</button>' +
    (m ? '<button data-act="tinfo">Full stat block</button>' : "") +
    (l ? '<button data-act="tinfo">Character</button>' : "") +
    (body
      ? '<button data-act="tcol" aria-expanded="' + ui.cardOpen + '">' + (ui.cardOpen ? "Hide details" : "Show details") + "</button>"
      : "") +
    "</div>";
  if (c.q && !ui.present) h += '<div class="ql">' + esc(c.q) + "</div>";
  if (chips) h += '<div class="tc">' + chips + "</div>";
  if (!ui.present) h = remHTML(c) + h;
  h += fxHTML(c, "fxs");
  h += dsHTML(c);
  if (ui.cardOpen && pb) h += pb;
  if (ui.cardOpen && (m || X.length)) {
    var acts = [],
      SL = { a: "", b: "Bonus", r: "Reaction" };
    if (m && !c.hideBase) {
      var A = actsOf(m).filter(function (p) {
          return p.sec !== "l";
        }),
        P = mPools(A),
        nested = {};
      A.forEach(function (p) {
        if (p.kind === "multi") nested[p.key] = 1;
      });
      if (P) h += '<div class="mline"><b>Multiattack</b> ' + rich(P.text) + "</div>";
      var inM = function (p) {
        return p.sec === "a" && (poolOf(P, p.n) || repOf(P, p.n)) ? 0 : 1;
      };
      var SO = { a: 0, b: 1, r: 2 },
        bs = bySize(m),
        top = A.filter(function (p) {
          return !nested[p.key];
        }).sort(function (x, y) {
          return (x.table ? 1 : 0) - (y.table ? 1 : 0) || SO[x.sec] - SO[y.sec] || inM(x) - inM(y) || bs(x, y);
        });
      var vis = [],
        hid = [];
      top.forEach(function (p) {
        var w = hideWhy(c, A, p);
        (w && !ui.showAll ? hid : vis).push([p, w]);
      });
      h +=
        '<div class="acts2">' +
        vis
          .map(function (x) {
            return tcCard(c, m, x[0], SL[x[0].sec], [], 0, x[1], P);
          })
          .join("") +
        "</div>";
      var hw = top.filter(function (p) {
        return hideWhy(c, A, p);
      });
      if (hw.length && !RO) {
        var grp = { res: [], out: [], rech: [] };
        hw.forEach(function (p) {
          grp[hideWhy(c, A, p)].push(p);
        });
        var RL = { a: "Action used", b: "Bonus action used", r: "Reaction used" },
          rs = uniq(
            grp.res.map(function (p) {
              return p.sec;
            }),
          );
        h +=
          '<div class="hidl">' +
          rs
            .map(function (r) {
              return (
                "<span>" +
                RL[r] +
                " <small>(" +
                grp.res.filter(function (p) {
                  return p.sec === r;
                }).length +
                " hidden)</small></span>"
              );
            })
            .join("") +
          grp.rech
            .map(function (p) {
              return (
                '<button data-act="unuse" data-i="' +
                p.key +
                '" title="Tap when it recharges">' +
                esc(p.n) +
                " \u00b7 recharging \u21ba</button>"
              );
            })
            .join("") +
          grp.out
            .map(function (p) {
              return (
                '<button data-act="unuse" data-i="' +
                p.key +
                '" title="Tap to give one use back">' +
                esc(p.n) +
                " \u00b7 used up \u21ba</button>"
              );
            })
            .join("") +
          '<button data-act="showall">' +
          (ui.showAll ? "Hide used" : "Show all") +
          "</button></div>";
      }
    }
    X.forEach(function (x, i) {
      if (x.t !== "t" && (x.n || x.d) && (ui.showAll || !resUsed(c, x.t)))
        acts.push(["x" + i, { a: "Extra", b: "Bonus · extra", r: "Reaction · extra" }[x.t] || "Extra", [x.n || "Extra", x.d || ""], 1]);
    });
    if (acts.length)
      h +=
        '<div class="acts2">' +
        acts
          .map(function (x) {
            var a = x[2],
              rech = /Recharge/.test(a[0]);
            var sp = rech && c.spent && c.spent[x[0]];
            return (
              '<div class="a' +
              (sp ? " spent" : "") +
              '">' +
              (rech ? '<button class="tg" data-act="spent" data-i="' + x[0] + '">' + (sp ? "Spent" : "Ready") + "</button>" : "") +
              "<b>" +
              esc(a[0]) +
              (x[1] ? '<span class="sec' + (x[3] ? " cu" : "") + '">' + x[1] + "</span>" : "") +
              "</b>" +
              blk(rich(short(a[1]))) +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    var leg = m ? m.leg || [] : [];
    var more = X.filter(function (x) {
      return x.t === "t" && (x.n || x.d);
    })
      .map(function (x) {
        return [x.n || "Extra", x.d || ""];
      })
      .concat(
        m ? m.traits || [] : [],
        leg.map(function (t) {
          return ["Legendary: " + t[0], t[1]];
        }),
      );
    if (more.length) {
      h +=
        "<details" +
        (ui.traitsOpen ? " open" : "") +
        "><summary>Traits" +
        (leg.length ? " and legendary actions" : "") +
        " (" +
        more.length +
        ")</summary>" +
        more
          .map(function (t) {
            return ent(t[0], t[1]);
          })
          .join("") +
        "</details>";
    }
  }
  el.innerHTML = h;
}

// Defences drawer (toolbar 🛡): every creature on one line: AC, the chosen saving throw, resistances / immunities / vulnerabilities.
function defHTML() {
  var k = ui.dsv == null ? 1 : ui.dsv,
    L = S.list
      .filter(function (c) {
        return c.kind !== "fx";
      })
      .slice()
      .sort(function (a, b) {
        return (b.init == null ? -99 : b.init) - (a.init == null ? -99 : a.init);
      });
  var seg =
    '<div class="dsv"><b>Saving throw</b>' +
    AB.map(function (a, i) {
      return (
        '<button data-act="dsv" data-n="' +
        i +
        '" class="' +
        (i === k ? "on" : "") +
        '" aria-pressed="' +
        (i === k) +
        '">' +
        a +
        "</button>"
      );
    }).join("") +
    "</div>";
  var row = function (c) {
    var d = defs(c),
      bits = [
        ["Resist", d.res],
        ["Immune", d.imm],
        ["Vulnerable", d.vul],
        ["Cond. immune", d.cimm],
      ]
        .filter(function (x) {
          return x[1].length;
        })
        .map(function (x) {
          return '<span class="dk">' + x[0] + "</span> " + esc(uniq(x[1]).join(", "));
        });
    if (magRes(c)) bits.push('<span class="dk">Magic Resistance</span>');
    return (
      '<div class="drow' +
      (c.hp <= 0 ? " down" : "") +
      (ui.sel[c.id] ? " on" : "") +
      '" role="button" tabindex="0" data-act="drow" data-id="' +
      c.id +
      '" aria-pressed="' +
      !!ui.sel[c.id] +
      '"><b class="dn">' +
      esc(c.name) +
      '</b><span class="dac" title="AC">' +
      SHIELD +
      '<span class="acv">' +
      effAC(c) +
      "</span></span>" +
      (saveOf(c, k) || '<span class="sv">' + AB[k] + " ?</span>") +
      '<span class="dd">' +
      (bits.join(" \u00b7 ") || '<span class="muted">no resistances</span>') +
      "</span></div>"
    );
  };
  return (
    '<div class="defs">' +
    seg +
    '<p class="muted" style="margin:0 0 6px;font-size:.85rem">Tap creatures to select them; ✕ closes and keeps them selected for the pad. Stat block / Edit show the last one tapped.</p>' +
    (L.length ? L.map(row).join("") : '<p class="muted">No creatures in the encounter yet.</p>') +
    "</div>"
  );
}
// Save bonus of creature c for ability index i (0 = Str ... 5 = Cha); null when unknown.
function saveOf(c, i) {
  var r, n;
  if (c.kind === "pc") {
    var l = S.lib.find(function (x) {
        return x.id === c.libId;
      }),
      k = AB[i].toLowerCase();
    if (!l) return null;
    if (l.saves && l.saves[k] != null) n = l.saves[k];
    else if (l.abil && l.abil[k] != null) n = Math.floor((l.abil[k] - 10) / 2) + ((l.saveProf || []).indexOf(k) >= 0 ? pcPb(l) : 0);
    else return null;
    r = (l.saveProf || []).indexOf(k) >= 0;
    var spAdv = (l.adv || []).indexOf(k) >= 0;
  } else {
    var m = MON.find(function (x) {
      return x.id === c.monId;
    });
    if (!m) return null;
    var sv =
      (m.extra.find(function (e) {
        return /^sav/i.test(e[0]);
      }) || [])[1] || "";
    r = new RegExp("\\b" + AB[i] + "\\w*\\s*([+\u2212-]\\s*\\d+)", "i").exec(sv);
    n = r ? +r[1].replace("\u2212", "-").replace(/\s/g, "") : mod(+m.abil[i]);
  }
  var has = function (x) {
      return c.conds.indexOf(x) >= 0;
    },
    notes = [];
  if (i < 2 && (has("Paralyzed") || has("Stunned") || has("Unconscious") || has("Petrified"))) notes.push("auto-fail");
  else {
    if (spAdv) notes.push("adv.");
    if (i === 1 && has("Restrained")) notes.push("disadv.");
    c.conds.forEach(function (x) {
      var f = (SPX[x] || {}).sv;
      if (f && (f[0] === "all" || f[0] === i)) notes.push(f[1]);
    });
  }
  var note = notes
    .map(function (t) {
      return "<small" + (/^(\+|adv)/.test(t) ? "" : ' class="b"') + ">" + t + "</small>";
    })
    .join("");
  return (
    '<span class="sv' +
    (r ? " svp" : "") +
    '" title="' +
    (r ? "Proficient" : "Ability modifier") +
    '">' +
    AB[i] +
    " " +
    sgn(n) +
    note +
    "</span>"
  );
}
function offHTML(c) {
  if (c.hp <= 0 || isPcDead(c)) return "";
  var t = [],
    pp = ppOf(c),
    df = ui.sel[c.id] ? defs(c) : null;
  t.push(
    rxBlocked(c)
      ? '<span class="rxu">No reactions</span>'
      : '<button class="rxb' +
          (c.rx ? " used" : "") +
          '" data-act="rx" title="Tap when the reaction is used; it resets on its turn">' +
          (c.rx ? "Reaction used" : "Reaction ready") +
          "</button>",
  );
  var lg = legHTML(c);
  if (lg) t.push(lg);
  if (pp != null) t.push('<span title="Passive Perception">\u{1F441} ' + pp + "</span>");
  if (df)
    [
      ["Res", df.res],
      ["Imm", df.imm],
      ["Vuln", df.vul],
    ].forEach(function (x) {
      if (x[1].length) t.push("<span>" + x[0] + ": " + esc(uniq(x[1]).join(", ")) + "</span>");
    });
  return '<div class="off dmonly">' + t.join("") + "</div>";
}
var SHIELD =
  '<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 3 L34.6 8.2 C35.2 8.4 35.5 8.9 35.5 9.5 V21.5 C35.5 31.2 28.9 38.9 20 42.8 C11.1 38.9 4.5 31.2 4.5 21.5 V9.5 C4.5 8.9 4.8 8.4 5.4 8.2 Z"/></svg>';
// One creature row in the main table: initiative box, name and statuses, AC shield, HP bar, edit and stat-block buttons.
function rowHTML(c) {
  var pct = c.max ? Math.max(0, Math.min(100, (c.hp / c.max) * 100)) : 0;
  var lvl = pct > 50 ? "ok" : pct > 25 ? "warn" : "bad";
  var pcDead = isPcDead(c);
  var down = c.hp <= 0 || pcDead;
  var chips = c.conds
    .map(function (x) {
      var k = c.cc && c.cc[x] != null ? findC(c.cc[x]) : null;
      return (
        '<button class="chip" data-act="cond" data-c="' +
        esc(x) +
        '" title="' +
        esc(FX[x] || x) +
        ' (tap to remove)">' +
        esc(nm(x)) +
        (k && k.id !== c.id ? " <small>(" + esc(k.name) + ")</small>" : "") +
        (x === "Grappled" && c.gb != null && findC(c.gb)
          ? " <small>(" + (c.gdc ? "escape DC " + c.gdc + ", " : "") + esc(findC(c.gb).name) + ")</small>"
          : "") +
        " ×</button>"
      );
    })
    .join("");
  var ph = c.kind === "pc" && c.ib != null ? sgn(c.ib) : "—";
  return (
    '<tr class="r' +
    (c.id === S.turnId ? " isturn" : "") +
    (down ? " down" : "") +
    (ui.sel[c.id] ? " sel" : "") +
    '" data-id="' +
    c.id +
    '">' +
    '<td class="c-in"><input class="num" type="number" min="-4" max="49" step="1" data-act="init" placeholder="' +
    esc(ph) +
    '" value="' +
    (c.init == null ? "" : c.init) +
    '" aria-label="Initiative for ' +
    esc(c.name) +
    '"></td>' +
    '<td><span class="name">' +
    esc(c.name) +
    "</span>" +
    (c.kind === "pc" ? "" : '<span class="tag">CR ' + esc(c.cr) + "</span>") +
    offHTML(c) +
    '<div class="conds">' +
    chips +
    '<button class="chip stadd" data-act="rowst" aria-label="Add a status to ' +
    esc(c.name) +
    '">\uff0b Status</button></div>' +
    (ui.sel[c.id] ? fxHTML(c) : "") +
    "</td>" +
    '<td class="c-ac"><span class="acb" role="img" title="Current AC' +
    (effAC(c) !== +c.ac ? " (base " + c.ac + "; ✎ to change)" : "") +
    '" aria-label="AC ' +
    effAC(c) +
    '">' +
    SHIELD +
    '<span class="acv">' +
    (effAC(c) !== +c.ac ? '<b class="' + acCls(c) + '">' + effAC(c) + "</b>" : "" + effAC(c)) +
    "</span></span></td>" +
    '<td class="c-hp"><div class="hpnum"><span class="cur">' +
    c.hp +
    '</span><span class="max">/ ' +
    c.max +
    "</span>" +
    (c.base != null ? '<span class="mred">max \u2212' + (c.base - c.max) + "</span>" : "") +
    (c.temp > 0 ? '<span class="temp">+' + c.temp + "</span>" : "") +
    (down ? '<span class="state">' + (pcDead ? "Dead" : "Down") + "</span>" : "") +
    "</div>" +
    '<div class="track"><div class="fill ' +
    lvl +
    '" style="width:' +
    pct +
    '%"></div></div>' +
    (pcDead ? '<div class="dsd">Heal 1+ HP to revive</div>' : dsHTML(c)) +
    "</td>" +
    '<td class="c-i"><button class="ib" data-act="edit" aria-label="Edit ' +
    esc(c.name) +
    '" title="Edit">✎</button><button class="ib" data-act="info" aria-label="Stat block for ' +
    esc(c.name) +
    '">ⓘ</button></td>' +
    "</tr>"
  );
}
function fxRow(c) {
  return (
    '<tr class="r fxr' +
    (c.id === S.turnId ? " isturn" : "") +
    '" data-id="' +
    c.id +
    '"><td class="c-in"><input class="num" type="number" min="-4" max="49" step="1" data-act="init" value="' +
    (c.init == null ? "" : c.init) +
    '" aria-label="Initiative for ' +
    esc(c.name) +
    '"></td>' +
    '<td colspan="4"><span class="name">' +
    esc(c.name) +
    '</span><span class="tag">Effect</span>' +
    (c.desc ? '<div class="fx" style="margin-top:2px">' + esc(c.desc) + "</div>" : "") +
    '<div class="dsb" style="margin-top:4px"><button data-act="fxvis">' +
    (c.vis ? "Visible to players" : "Hidden from players") +
    '</button><button data-act="fxrm">Remove</button></div></td></tr>'
  );
}
function pcLvl(l) {
  if (!l) return 0;
  if (l.lvl) return l.lvl;
  return (l.parsed || []).reduce(function (a, x) {
    return a + (x.level || 0);
  }, 0);
}
// XP bar while planning: encounter XP against the party's Low / Moderate / High budgets (2024 DMG).
function xpHTML() {
  var M = S.list.filter(function (c) {
      return c.kind === "mon" && c.hp > 0;
    }),
    P = S.list.filter(function (c) {
      return c.kind === "pc";
    });
  if (!M.length) return "";
  var xp = M.reduce(function (a, c) {
      return a + (CRXP[String(c.cr)] || 0);
    }, 0),
    B = [0, 0, 0],
    miss = [];
  P.forEach(function (c) {
    var v = pcLvl(libOf(c));
    if (!v) {
      miss.push(c.name);
      return;
    }
    var r = XPB[Math.min(20, v) - 1];
    B[0] += r[0];
    B[1] += r[1];
    B[2] += r[2];
  });
  var f = function (n) {
    return n.toLocaleString("en");
  };
  if (!B[2])
    return (
      "<b>Encounter XP " +
      f(xp) +
      "</b> · " +
      M.length +
      " monsters. " +
      (P.length ? "Set player levels (✎ Edit) to see difficulty." : "Add the party to see difficulty.")
    );
  var lab = xp <= B[0] ? "Low" : xp <= B[1] ? "Moderate" : xp <= B[2] ? "High" : "Above High";
  var top = Math.max(xp, B[2]) * 1.1,
    pc = function (n) {
      return ((n / top) * 100).toFixed(1) + "%";
    };
  return (
    "<b>Encounter XP " +
    f(xp) +
    " · " +
    lab +
    '</b> <span class="muted">(' +
    M.length +
    " monsters, " +
    (P.length - miss.length) +
    " players)</span>" +
    '<div class="xbar"><b class="' +
    (xp > B[2] ? "over" : "") +
    '" style="width:' +
    pc(xp) +
    '"></b>' +
    B.map(function (b) {
      return '<i style="left:' + pc(b) + '"></i>';
    }).join("") +
    "</div>" +
    '<span class="muted">Low ' +
    f(B[0]) +
    " · Moderate " +
    f(B[1]) +
    " · High " +
    f(B[2]) +
    (miss.length ? " · no level: " + esc(miss.join(", ")) + " (✎ Edit)" : "") +
    "</span>"
  );
}
// Main table: players, then monsters grouped by stat block (or custom group), then effects; encounter notes above.
function renderTable() {
  var h = "";
  var xb = $("#xpb"),
    xh = S.turnId == null ? xpHTML() : "";
  xb.hidden = !xh;
  xb.innerHTML = xh;
  var ev = $("#env");
  ev.hidden = !String(S.envNote || "").trim();
  if (!ev.hidden)
    ev.innerHTML =
      "<div><b>" +
      esc(S.envName || "Notes") +
      "</b>\n" +
      esc(S.envNote) +
      '</div><button data-act="envx" aria-label="Hide encounter notes">Hide</button>';
  var pcs = S.list.filter(function (c) {
    return c.kind === "pc";
  });
  if (pcs.length) {
    h +=
      '<tr class="grp"><th colspan="5">Players · ' +
      pcs.length +
      '<button class="gb" data-act="selgrp" data-g="pc">Select all</button></th></tr>' +
      pcs.map(rowHTML).join("");
  }
  var seen = [],
    groups = {};
  S.list.forEach(function (c) {
    if (c.kind === "mon") {
      var k = gkey(c);
      if (!groups[k]) {
        groups[k] = [];
        seen.push(k);
      }
      groups[k].push(c);
    }
  });
  seen.forEach(function (id) {
    var g = groups[id],
      cg = id.indexOf("cg:") === 0,
      m = cg
        ? { name: g[0].cg }
        : MON.find(function (x) {
            return x.id === id;
          });
    var alive = g.filter(function (c) {
        return !isDead(c);
      }),
      dead = g.filter(isDead);
    h +=
      '<tr class="grp"><th colspan="5">' +
      esc(m ? m.name : String(g[0].name).replace(/ \d+$/, "") + " (stat block not loaded)") +
      " · " +
      alive.length +
      " alive" +
      (alive.length ? '<button class="gb" data-act="selgrp" data-g="' + esc(id) + '">Select all</button>' : "") +
      (cg ? "" : '<button class="gb" data-act="viewgrp" data-m="' + id + '">Stat block</button>') +
      (legOf(g[0])
        ? '<button class="gb' +
          (S.lair ? " on" : "") +
          '" data-act="lair" title="Legendary uses follow this (e.g. 3, or 4 in lair)">In lair: ' +
          (S.lair ? "yes" : "no") +
          "</button>"
        : "") +
      "</th></tr>" +
      alive.map(rowHTML).join("");
    if (dead.length) {
      h +=
        '<tr class="dead"><td colspan="5">Defeated: ' +
        dead
          .map(function (c) {
            return (
              '<button data-act="revive" data-id="' +
              c.id +
              '" title="' +
              (c.fled ? "Bring back with the HP it left with" : "Restore at 1 HP") +
              '">' +
              esc(c.name) +
              (c.fled ? " (fled)" : "") +
              " ↺</button>"
            );
          })
          .join("") +
        '<button data-act="purge" data-m="' +
        esc(id) +
        '">Remove defeated</button></td></tr>';
    }
  });
  var fxs = S.list.filter(function (c) {
    return c.kind === "fx";
  });
  if (fxs.length) h += '<tr class="grp"><th colspan="5">Effects \u00B7 ' + fxs.length + "</th></tr>" + fxs.map(fxRow).join("");
  $("#tbl").innerHTML =
    h ||
    '<tr><td class="empty"><p>No combatants yet.</p><button class="add" data-act="start" data-s="party">Add your party</button> <button class="add" data-act="start" data-s="monsters">Add monsters</button></td></tr>';
}
// Damage type wheel: Untyped, the 13 types, and (extra slot) Max HP only. Tap the middle item for the full list.
// Grouped: no type / healing / max HP, then physical, poison, elemental, then force, necrotic, psychic, radiant. The wheel loops.
// Wheel order (loops, so Heal sits just above Untyped); TGRP = the picker's groups, TDIV = where the wheel draws a divider.
var TORD = [
  "",
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "fire",
  "lightning",
  "thunder",
  "force",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "maxhp",
  "temp",
  "heal",
];
var SPEC = { heal: 1, temp: 1, maxhp: 1 },
  TGRP = [
    ["", "heal", "temp", "maxhp"],
    ["bludgeoning", "piercing", "slashing"],
    ["acid", "cold", "fire", "lightning", "thunder"],
    ["force", "necrotic", "poison", "psychic", "radiant"],
  ],
  TDIV = [1, 4, 9, 14];
function TL() {
  return TORD;
}
function DTI2(t) {
  return tLab(t).split(" ")[0];
}
function tLab(t) {
  return t === ""
    ? "Untyped"
    : t === "heal"
      ? "\u2764\ufe0f Heal"
      : t === "temp"
        ? "\ud83d\udca0 Temp HP"
        : t === "maxhp"
          ? "\ud83d\udc94 Max HP \u2212"
          : DTI[t] + " " + t[0].toUpperCase() + t.slice(1);
}
function tWheel() {
  var h = '<div class="sp"></div>';
  for (var r = 0; r < 3; r++)
    TL().forEach(function (t, i) {
      h +=
        '<div class="wi' +
        (TDIV.indexOf(i) >= 0 ? " g" : "") +
        '" data-act="ti" data-i="' +
        (r * TL().length + i) +
        '">' +
        tLab(t) +
        "</div>";
    });
  return h + '<div class="sp"></div>';
}
function tPick() {
  return (
    '<div class="tpick"><div class="tph"><b>Type</b><button data-act="tpclose">Close</button></div>' +
    TGRP.map(function (g) {
      return (
        '<div class="tpg">' +
        g
          .map(function (t) {
            return (
              '<button class="' + (t === (ui.dtype || "") ? "on" : "") + '" data-act="tset" data-t="' + t + '">' + tLab(t) + "</button>"
            );
          })
          .join("") +
        "</div>"
      );
    }).join("") +
    "</div>"
  );
}
// Wheels snap in JS (CSS scroll-snap made iOS stop after a fling until the wheel was tapped again).
function wheelFit(el) {
  var box = el.parentNode,
    pd = Math.max(0, (box.clientHeight - IH) / 2);
  [].forEach.call(el.querySelectorAll(".sp"), function (x) {
    x.style.height = pd + "px";
  });
  [].forEach.call(box.querySelectorAll(".wband,.amtin"), function (x) {
    x.style.top = pd + "px";
  });
}
function wheelSettle(el) {
  clearTimeout(el._st);
  el._st = setTimeout(function () {
    var k = Math.round(el.scrollTop / IH);
    if (el.id === "twheel") {
      var N = TL().length;
      if (k < N || k >= 2 * N) {
        var nk = N + (((k % N) + N) % N);
        ui.ignoreUntil = Date.now() + 80;
        el.scrollTop = el.scrollTop + (nk - k) * IH;
        k = nk;
      }
    }
    if (Math.abs(el.scrollTop - k * IH) > 1) el.scrollTo({ top: k * IH, behavior: "smooth" });
  }, 110);
}
// Keep the Apply label and the slot tabs current while a wheel spins (no full redraw, so the scroll isn't interrupted)
function padLive() {
  var b = $("#pad [data-act=papply]");
  if (b && ui.act) {
    b.innerHTML =
      "Apply: " +
      actSum(
        S.list.filter(function (c) {
          return ui.sel[c.id];
        }),
      );
    b = null;
  }
  if (b) {
    var sm = padSum(Object.keys(ui.pend));
    b.disabled = !sm;
    b.innerHTML = sm ? "Apply: " + sm : "Pick an amount or a status";
  }
  var t = $('#pad .slots [data-k="' + (ui.ax || 0) + '"]');
  if (t) t.innerHTML = (ui.ax ? "+ Extra " : "Main ") + "<b>" + ui.amt + "</b>" + (ui.dtype ? " " + DTI2(ui.dtype) : "");
}
var WHEEL = "";
(function () {
  var s = '<div class="sp"></div>';
  for (var i = 0; i <= WMAX; i++) s += '<div class="wi" data-act="wi" data-n="' + i + '">' + i + "</div>";
  WHEEL = s + '<div class="sp"></div>';
})();
function condState(T, x) {
  var n = T.filter(function (c) {
    return c.conds.indexOf(x) >= 0;
  }).length;
  return n === T.length ? "all" : n ? "some" : "none";
}
function effState(T, x) {
  if (Object.prototype.hasOwnProperty.call(ui.pend, x)) return ui.pend[x] ? "all" : "none";
  return condState(T, x);
}
// Status menu of the pad: search, General section, spells the creatures in the encounter can cast first, then everything.
function menuHTML(T) {
  var list = CONDS.slice();
  if (
    T.every(function (c) {
      return c.kind === "pc";
    })
  )
    list.push("Dead");
  var n = Object.keys(ui.pend).length;
  return (
    '<div class="menu"><div class="mt"><div class="mh">Status · ' +
    T.length +
    ' selected</div><button data-act="mcancel">Cancel</button><button class="add" data-act="mapply">Done' +
    (n ? " (" + n + ")" : "") +
    '</button></div><div class="ms">Conditions</div><div class="mg">' +
    list.map(btn).join("") +
    '</div><div class="ms">General</div><div class="mg">' +
    GEN.map(btn).join("") +
    '</div><div class="ms ss">Spells and effects<input id="msearch" type="search" autocomplete="off" placeholder="Search ' +
    SPELLS.length +
    ' spells and abilities\u2026" value="' +
    esc(ui.mq) +
    '" aria-label="Search spells and abilities"></div><div class="mg" id="mres">' +
    spellGrid(T) +
    '</div><div class="muted" style="font-size:.75rem">Paralyzed, Petrified, Stunned and Unconscious also apply Incapacitated. Tap a chip on a creature to end an effect.</div></div>'
  );
  function btn(x) {
    return mbtn(T, x);
  }
}
function mbtn(T, x) {
  var s = effState(T, x);
  return (
    '<button class="mi ' +
    s +
    '" data-act="mi" data-c="' +
    esc(x) +
    '" title="' +
    esc(FX[x] || "") +
    '"><span class="bx">' +
    (ICON[x] || "•") +
    "</span>" +
    esc(nm(x)) +
    "</button>"
  );
}
// Statuses for spells that creatures in this encounter can cast (monster Spellcasting text, imported player spell lists)
function spName(x) {
  var r = FX[x] || "",
    m = r.match(/^([^:(]+?)\s*(?:\(|:)/);
  return (m ? m[1] : nm(x)).replace(/\u2019/g, "'").toLowerCase();
}
function present() {
  var t = "";
  S.list.forEach(function (c) {
    if (c.kind === "pc") {
      var l = S.lib.find(function (x) {
        return x.id === c.libId;
      });
      if (l && l.spells) t += "|" + l.spells.join("|");
    } else if (c.kind === "mon") {
      var m = MON.find(function (x) {
        return x.id === c.monId;
      });
      if (m)
        ["traits", "actions", "bonus", "react", "leg"].forEach(function (f) {
          (m[f] || []).forEach(function (e) {
            if (/spell/i.test(e[0]) || /\bcasts?\b/i.test(e[1])) t += "|" + e[1];
          });
        });
    }
  });
  t = t.replace(/\u2019/g, "'").toLowerCase();
  if (!t) return [];
  return SPELLS.map(function (x) {
    return x[0];
  }).filter(function (x) {
    if (GEN.indexOf(x) >= 0) return false;
    var n = spName(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^a-z])" + n + "($|[^a-z])").test(t);
  });
}
function spellGrid(T) {
  var q = (ui.mq || "").trim().toLowerCase(),
    L;
  if (q)
    L = SPELLS.filter(function (x) {
      return (
        (x[0] + " " + nm(x[0]) + " " + x[2])
          .toLowerCase()
          .replace(/\u2019/g, "'")
          .indexOf(q.replace(/\u2019/g, "'")) >= 0
      );
    })
      .slice(0, 16)
      .map(function (x) {
        return x[0];
      });
  else {
    L = present().concat(
      COMMON.filter(function (x) {
        return present().indexOf(x) < 0;
      }),
    );
    SPELLS.forEach(function (x) {
      if (L.indexOf(x[0]) < 0 && GEN.indexOf(x[0]) < 0 && effState(T, x[0]) !== "none") L.push(x[0]);
    });
  }
  return L.length
    ? L.map(function (x) {
        return mbtn(T, x);
      }).join("")
    : '<div class="muted" style="grid-column:1/-1;font-size:.85rem">No match. Try a spell or ability name.</div>';
}
// Action pad at the bottom: amount and damage-type wheels, Half / Extra / Max HP, statuses, target chips while an action runs, one Apply.
function renderPad() {
  var T = S.list.filter(function (c) {
    return ui.sel[c.id];
  });
  var pad = $("#pad");
  if (ui.act && !findC(ui.act.id)) ui.act = null;
  var on = (T.length > 0 || !!ui.act) && !ui.present;
  pad.hidden = !on;
  document.body.classList.toggle("padon", on);
  document.body.classList.toggle("menuon", on && !!ui.menu);
  if (!on) return;
  var fx = curFx(),
    pk = Object.keys(ui.pend),
    pn = pk.length,
    sum = padSum(pk),
    nod = SPEC[slot(0).dt] && (!ui.ex || SPEC[slot(1).dt]);
  if (nod) {
    ui.half = false;
    ui.mx = false;
  }
  pad.innerHTML =
    '<div class="pi">' +
    (fx ? '<div class="fxb">⚡ <b>' + esc(fx.name) + ":</b> " + esc(fxSum(fx)) + ' <button data-act="fxdone">Done</button></div>' : "") +
    (ui.act
      ? actHead() + actRows(T)
      : '<div class="pt"><div class="who"><b>' +
        T.length +
        ' selected</b></div><button data-act="desel">Deselect</button></div>' +
        padChips()) +
    (ui.act && !T.length
      ? ""
      : '<div class="pmain"><div class="wheelbox"><div class="wheel" id="wheel" aria-label="Amount wheel">' +
        WHEEL +
        '</div><div class="wband"></div><div class="wfade t"></div><div class="wfade b"></div><input class="amtin" id="amtin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" value="' +
        ui.amt +
        '" aria-label="Amount" tabindex="-1"></div>' +
        '<div class="wheelbox tbox"><div class="wheel twh" id="twheel" aria-label="Type wheel: tap the middle for the list">' +
        tWheel() +
        '</div><div class="wband"></div><div class="wfade t"></div><div class="wfade b"></div></div>' +
        '<div class="pr">' +
        (ui.ex
          ? '<div class="amtrow"><div class="slots">' +
            [0, 1]
              .map(function (i) {
                var sv = slot(i);
                return (
                  '<button class="' +
                  (ui.ax === i ? "on" : "") +
                  '" data-act="pslot" data-k="' +
                  i +
                  '">' +
                  (i ? "+ Extra " : "Main ") +
                  "<b>" +
                  sv.v +
                  "</b>" +
                  (sv.dt ? " " + DTI2(sv.dt) : "") +
                  "</button>"
                );
              })
              .join("") +
            "</div></div>"
          : "") +
        ridHTML(T) +
        '<div class="pacts">' +
        (ui.act
          ? ""
          : '<button class="tg' +
            (ui.half ? " on" : "") +
            '" data-act="ptog" data-k="half" aria-pressed="' +
            !!ui.half +
            '"' +
            (nod ? " disabled" : "") +
            ">Half</button>") +
        '<button class="tg' +
        (ui.ex ? " on" : "") +
        '" data-act="ptog" data-k="extra" aria-pressed="' +
        !!ui.ex +
        '"' +
        ' title="A second amount with its own damage type (or max HP only), applied together">+ Extra</button>' +
        '<button class="tg d' +
        (ui.mx ? " on" : "") +
        '" data-act="ptog" data-k="maxdn" aria-pressed="' +
        !!ui.mx +
        '"' +
        (nod ? " disabled" : "") +
        ' title="Also lower max HP by the damage taken (e.g. Life Drain)">Max HP \u2212</button>' +
        '<button class="tg' +
        (pn ? " on" : "") +
        '" data-act="padstatus">Status' +
        (pn ? " (" + pn + ")" : "") +
        " ▾</button>" +
        (ui.act
          ? ""
          : (T.some(function (c) {
              return c.kind === "mon" && c.hp > 0;
            })
              ? '<button class="rm pdf" data-act="paddef" title="Defeat now (0 HP)">\u2620 Defeat</button><button class="rm pdf" data-act="padfled" title="Left the fight: counts as defeated">\ud83c\udfc3 Fled</button>'
              : "") +
            '<button class="rm' +
            (ui.confirmRemove ? " armed" : "") +
            '" data-act="padremove" aria-label="Remove from encounter" title="Remove from encounter">' +
            (ui.confirmRemove ? "🗑 Sure?" : "🗑") +
            "</button>" +
            '<button data-act="padmore" aria-expanded="' +
            !!ui.more +
            '">' +
            (ui.more ? "Less \u25b4" : "More \u25be") +
            "</button>") +
        (ui.more && !ui.act
          ? '<button data-act="padhp" data-k="maxreset">Reset max</button><button data-act="padgroup">' +
            (T.some(function (c) {
              return c.cg;
            }) &&
            T.every(function (c) {
              return c.cg && c.cg === T[0].cg;
            })
              ? "Ungroup"
              : "Group\u2026") +
            "</button>"
          : "") +
        "</div>" +
        (ui.act
          ? T.length
            ? '<button class="papply" data-act="papply">Apply: ' + actSum(T) + "</button>"
            : ""
          : '<button class="papply" data-act="papply"' +
            (sum ? "" : " disabled") +
            ">" +
            (sum ? "Apply: " + sum : "Pick an amount or a status") +
            "</button>") +
        "</div></div>") +
    (ui.menu ? menuHTML(T) : "") +
    (ui.tpk ? tPick() : "") +
    "</div>";
  var mn = pad.querySelector(".menu");
  if (mn) {
    mn.style.maxHeight = "";
    mn.style.maxHeight = Math.max(200, mn.getBoundingClientRect().bottom - 8) + "px";
  }
  var w = $("#wheel");
  if (w) {
    wheelFit(w);
    ui.ignoreUntil = Date.now() + 250;
    w.scrollTop = Math.min(ui.amt, WMAX) * IH;
  }
  var tw = $("#twheel");
  if (tw) {
    wheelFit(tw);
    tw.scrollTop = (TL().length + Math.max(0, TL().indexOf(ui.dtype || ""))) * IH;
  }
}
// Add > Monsters: search results for the name, type and CR filters (first 40), with quantity steppers.
function resultsHTML() {
  var q = ui.q.trim().toLowerCase();
  var lo = ui.fMin === "" ? -1 : crv(ui.fMin),
    hi = ui.fMax === "" ? 99 : crv(ui.fMax);
  // aka = older names of a stat block (a file of your own can carry them): searching the old name finds the new one
  var akaHit = function (m) {
    return q
      ? (m.aka || []).find(function (a) {
          return a.toLowerCase().indexOf(q) >= 0;
        })
      : null;
  };
  var all = MON.filter(function (m) {
    return (
      (!q || m.name.toLowerCase().indexOf(q) >= 0 || m.type.toLowerCase().indexOf(q) >= 0 || akaHit(m)) &&
      (!ui.fType || m.ctype === ui.fType) &&
      crv(m.cr) >= lo &&
      crv(m.cr) <= hi
    );
  });
  var r = all.slice(0, 40);
  return (
    r
      .map(function (m) {
        return (
          '<div class="res"><button class="resname" data-act="view" data-m="' +
          m.id +
          '"><b>' +
          esc(m.name) +
          "</b><span>CR " +
          esc(m.cr) +
          " · AC " +
          esc(m.ac) +
          " · HP " +
          esc(m.dice) +
          " · init " +
          sgn(mod(m.abil[1])) +
          (m.ed === "2014" ? " · SRD 5.1" : "") +
          (akaHit(m) && m.name.toLowerCase().indexOf(q) < 0 ? " · 2014: " + esc(akaHit(m)) : "") +
          "</span></button>" +
          '<input class="qty" type="number" min="1" max="20" inputmode="numeric" value="' +
          (ui.qty[m.id] || 1) +
          '" data-act="qty" data-m="' +
          m.id +
          '" aria-label="Quantity of ' +
          esc(m.name) +
          '">' +
          '<button class="add" data-act="addmon" data-m="' +
          m.id +
          '">Add</button></div>'
        );
      })
      .join("") +
      (all.length > r.length ? '<p class="muted">Showing ' + r.length + " of " + all.length + ". Type to narrow the list.</p>" : "") ||
    '<p class="muted">No monster matches.</p>'
  );
}
