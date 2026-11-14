// Encounters app, part 4 of 11: tap-to-use: action economy, targeting, monster and player spells, consumables, action cards.
// One action card on the turn card; a Multiattack card holds the attacks it uses.
// ---- Stage C: what a monster has used. Per turn: c.ue = {a: key, b: key, r: key} (the card used for that resource);
// reaction also sets c.rx. Per encounter (X/Day counts as per encounter): c.uses = {key: n, 'sp:Spell': n}; recharge: c.spent.
// Resets: c.ue at the start of its turn; c.uses / c.spent / c.ue for everyone when combat starts.
function resUsed(c, r) {
  return r === "r" ? !!c.rx : !!(c.ue && c.ue[r]);
}
function usesLeft(c, p) {
  return p.uses ? p.uses.n - ((c.uses || {})[p.key] || 0) : null;
}
// Why a top-level card is hidden ('' = available). Cards the used Multiattack refers to stay (Eye Rays, Spellcasting replacement).
// Multiattack lives on the attacks it names: each reference is a pool of uses this turn (c.mu[i] = used).
// "in any combination" = one pool shared by several attacks; "can replace one attack with X" draws from the main pool;
// "X or Y" pools are alternatives (using one closes the other); a roll table (Eye Rays) also allows each result once (c.ray).
// Taking any Multiattack use sets c.ue.a = 'M'.
function mPools(A) {
  var M = A.find(function (x) {
    return x.kind === "multi" && x.sec === "a";
  });
  if (!M) return null;
  var P = M.multi.refs.map(function (r, i) {
    return { i: i, names: r.names, count: r.count, rep: !!r.rep, alt: !!r.alt, opt: !!r.opt, repFor: r.repFor || null };
  });
  P.main = Math.max(
    0,
    P.findIndex(function (q) {
      return !q.rep;
    }),
  );
  P.text = M.multi.text;
  return P;
}
// The pool a replacement draws from: the named attack ("replace the Claw attack"), else the first pool
function repPool(P, rq) {
  return (rq && rq.repFor && poolOf(P, rq.repFor)) || P[P.main];
}
function poolOf(P, n) {
  return P
    ? P.find(function (q) {
        return !q.rep && q.names.indexOf(n) >= 0;
      })
    : null;
}
function repOf(P, n) {
  return P
    ? P.find(function (q) {
        return q.rep && q.names.indexOf(n) >= 0;
      })
    : null;
}
function mUsed(c, q) {
  return (c.mu || {})[q.i] || 0;
}
function mLeft(c, P, q) {
  var j,
    rival = false;
  for (j = q.i; j > 0 && P[j].alt; j--) if (mUsed(c, P[j - 1])) rival = true; // an earlier alternative was used
  for (j = q.i + 1; j < P.length && P[j].alt; j++) if (mUsed(c, P[j])) rival = true; // a later alternative was used
  return rival ? 0 : q.count - mUsed(c, q);
}
function mIdle(c) {
  return !Object.keys(c.mu || {}).some(function (k) {
    return c.mu[k] > 0;
  });
}
function mSpend(c, q, d) {
  c.ue = c.ue || {};
  c.mu = c.mu || {};
  c.mu[q.i] = Math.max(0, mUsed(c, q) + d);
  if (d > 0) c.ue.a = "M";
  else if (mIdle(c) && c.ue.a === "M") {
    delete c.ue.a;
    c.ray = {};
  }
}
function hideWhy(c, A, p) {
  var ue = c.ue || {},
    mine = ue[p.sec] === p.key || (c.mrep || {})[p.key];
  if (mine) return "";
  if (p.sec === "a" && ue.a === "M") {
    var P = mPools(A);
    if (!(poolOf(P, p.n) || repOf(P, p.n))) return "res";
    if (repOf(P, p.n) && !poolOf(P, p.n) && !(c.mrep || {})[p.key] && mLeft(c, P, repPool(P, repOf(P, p.n))) <= 0) return "res";
  } else if (p.sec === "a" && ue.a) return "res";
  else if (resUsed(c, p.sec)) return "res";
  if (p.uses && usesLeft(c, p) <= 0) return "out";
  if (p.rech && c.spent && c.spent[p.key]) return "rech";
  return "";
}
function useAct(c, A, key, on) {
  var p = A.find(function (x) {
    return x.key === key;
  });
  if (!p) return;
  c.ue = c.ue || {};
  c.uses = c.uses || {};
  c.spent = c.spent || {};
  if (on) {
    c.ue[p.sec] = key;
    if (p.sec === "r") c.rx = true;
    if (p.uses) c.uses[key] = (c.uses[key] || 0) + 1;
    if (p.rech) c.spent[key] = true;
  } else {
    if (c.ue[p.sec] === key) delete c.ue[p.sec];
    if (p.sec === "r") c.rx = false;
    if (p.uses && c.uses[key]) c.uses[key]--;
    if (p.rech) delete c.spent[key];
  }
}
// Spend what an action uses (the old one-tap behaviour); how = {a: use|unuse|mpip|ray|mrep, i: card key, q: pool, d: +1/-1, r: ray row}
function doHow(c, how) {
  var mm = MON.find(function (x) {
    return x.id === c.monId;
  });
  if (!mm) return;
  var A = actsOf(mm),
    P = mPools(A),
    pk = A.find(function (x) {
      return x.key === how.i;
    });
  if (!pk) return;
  var a = how.a;
  if (how.free) return;
  if (a === "leg") {
    snap("legendary: " + pk.n);
    c.la = (c.la || 0) + (pk.cost || 1);
    if (pk.once) {
      c.lonce = c.lonce || {};
      c.lonce[pk.key] = 1;
    }
    return;
  }
  if (a === "cast") {
    var k2 = "sp:" + how.s,
      sq = poolOf(P, "Spellcasting") || repOf(P, "Spellcasting");
    c.uses = c.uses || {};
    snap("cast " + how.s);
    c.ue = c.ue || {};
    if (how.per) c.uses[k2] = (c.uses[k2] || 0) + 1;
    if (sq && pk.sec === "a") {
      var pq = sq.rep ? repPool(P, sq) : sq;
      if (c.ue.a === "M" || !c.ue.a) {
        mSpend(c, pq, 1);
        if (how.per) {
          c.msp = c.msp || {};
          c.msp[k2] = (c.msp[k2] || 0) + 1;
          c.mspq = pq.i;
        }
      }
    } else if (!c.ue[pk.sec]) c.ue[pk.sec] = pk.key;
    return;
  }
  if (a === "use" || a === "unuse") {
    snap((a === "use" ? "use " : "undo ") + pk.n);
    if (a === "unuse" && !(c.ue && c.ue[pk.sec] === pk.key)) {
      if (pk.rech && c.spent) delete c.spent[pk.key];
      else if (pk.uses && c.uses && c.uses[pk.key]) c.uses[pk.key]--;
    } else useAct(c, A, how.i, a === "use");
  } else if (a === "mpip") {
    var q3 = P[+how.q],
      d3 = +how.d;
    if (d3 > 0 && mLeft(c, P, q3) <= 0) return;
    snap("multiattack: " + pk.n);
    mSpend(c, q3, d3);
  } else if (a === "ray") {
    var q4 = P[+how.q],
      r4 = +how.r;
    c.ray = c.ray || {};
    c.ray[pk.key] = c.ray[pk.key] || {};
    var on4 = !c.ray[pk.key][r4];
    if (on4 && mLeft(c, P, q4) <= 0) return;
    snap((on4 ? "" : "undo ") + pk.table.rows[r4].n);
    if (on4) c.ray[pk.key][r4] = 1;
    else delete c.ray[pk.key][r4];
    mSpend(c, q4, on4 ? 1 : -1);
  } else if (a === "mrep") {
    var d5 = +how.d,
      mq = repPool(P, repOf(P, pk.n));
    if (d5 > 0 && mLeft(c, P, mq) <= 0) return;
    snap((d5 > 0 ? "" : "undo ") + pk.n);
    c.mrep = c.mrep || {};
    if (d5 > 0) {
      c.mrep[pk.key] = 1;
      mSpend(c, mq, 1);
      if (pk.rech) {
        c.spent = c.spent || {};
        c.spent[pk.key] = true;
      }
      if (pk.uses) {
        c.uses = c.uses || {};
        c.uses[pk.key] = (c.uses[pk.key] || 0) + 1;
      }
    } else {
      delete c.mrep[pk.key];
      mSpend(c, mq, -1);
      if (pk.rech && c.spent) delete c.spent[pk.key];
      if (pk.uses && c.uses && c.uses[pk.key]) c.uses[pk.key]--;
    }
  }
}
// ---- Stages D/E: tap an attack or save action -> pick targets -> Hit/Miss or Failed/Saved per target -> damage preloaded -> one Apply.
// ui.act = {id: attacker, how, d: parsed attack/save, n: name}; ui.out = {targetId: 'miss' | 'save' | 'rsave'} (default hit / failed).
function actStart(c, how) {
  if (!(how.a === "use" || (how.a === "mpip" && +how.d > 0) || (how.a === "mrep" && +how.d > 0) || how.a === "ray")) return false;
  var mm = MON.find(function (x) {
    return x.id === c.monId;
  });
  if (!mm) return false;
  var A = actsOf(mm),
    P = mPools(A),
    pk = A.find(function (x) {
      return x.key === how.i;
    });
  if (!pk) return false;
  var d = pk,
    n = pk.n;
  if (how.a === "ray") {
    if (c.ray && c.ray[pk.key] && c.ray[pk.key][+how.r]) return false;
    if (mLeft(c, P, P[+how.q]) <= 0) return false;
    var row = pk.table.rows[+how.r];
    d = parseAct(row.n || n, row.t, "a");
    n = row.n || n;
  }
  if (how.a === "mpip" && mLeft(c, P, P[+how.q]) <= 0) return false;
  if (d.kind === "cast" && how.a === "use" && d.cast.length === 1) {
    var sd = spellData(d.cast[0], castSp(A, pk));
    if (!sd) return false;
    spellBegin(c, sd, pk.n + (pk.n !== sd.n ? " \u2192 " + sd.n : ""), how);
    if (/on itself/i.test(rawOf(mm, pk))) ui.sel[c.id] = true;
    return true;
  }
  if (d.kind !== "atk" && d.kind !== "save") return false;
  actBegin(c, d, n, how);
  return true;
}
// Per-hit riders (Hex, Hunter's Mark, Divine Favor…): an extra damage amount per hit, default 0 (the player rolls and says it).
// on 't' = status on the target from this attacker; 's' = status on the attacker. w = weapon hits only (not spell attacks). dt '' = same type as the main damage.
var RID = {
  Hexed: { on: "t", dice: "1d6", dt: "necrotic" },
  Marked: { on: "t", dice: "1d6", dt: "force" },
  Cursed: { on: "t", dice: "1d8", dt: "necrotic" },
  "Divine Favor": { on: "s", w: 1, dice: "1d4", dt: "radiant" },
  "Elemental Weapon": { on: "s", w: 1, dice: "1d4", dt: "" },
  "Crusader\u2019s Mantle": { on: "s", w: 1, dice: "1d4", dt: "radiant" },
  Enlarged: { on: "s", w: 1, dice: "1d4", dt: "" },
  Raging: { on: "s", w: 1, dice: "rage", dt: "" },
};
function ridOn(att, t, k) {
  var r = RID[k];
  if (r.on === "s") return true;
  if (t.conds.indexOf(k) < 0) return false;
  var src = (t.cc || {})[k];
  return src == null || src === att.id;
}
function riders(T) {
  var att = ui.act ? findC(ui.act.id) : findC(S.turnId);
  if (!att || !T.length) return [];
  var d = ui.act && ui.act.d;
  if (d && d.kind !== "atk") return [];
  return Object.keys(RID)
    .filter(function (k) {
      var r = RID[k];
      if (r.w && d && d.spell) return false;
      return r.on === "s"
        ? att.conds.indexOf(k) >= 0
        : T.some(function (t) {
            return t.id !== att.id && ridOn(att, t, k);
          });
    })
    .map(function (k) {
      return { k: k, att: att };
    });
}
function ridHTML(T) {
  var R = riders(T);
  if (!R.length) return "";
  ui.rv = ui.rv || {};
  return (
    '<div class="rid">' +
    R.map(function (x) {
      var r = RID[x.k],
        dt = r.dt || slot(0).dt;
      return (
        "<label><span>" +
        esc(nm(x.k)) +
        " <small>" +
        esc(r.dice) +
        (dt ? " " + esc(dt) : "") +
        '</small></span><input data-rv="' +
        esc(x.k) +
        '" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="' +
        (ui.rv[x.k] || 0) +
        '" aria-label="' +
        esc(nm(x.k)) +
        ' damage"></label>'
      );
    }).join("") +
    "</div>"
  );
}
// Rider damage for one hit target: [[amount, type], …]
function ridFor(att, t) {
  var R = riders([t]);
  return R.filter(function (x) {
    return ridOn(att, t, x.k) && (ui.rv || {})[x.k] > 0;
  }).map(function (x) {
    return [ui.rv[x.k], RID[x.k].dt || slot(0).dt || ""];
  });
}
function actBegin(c, d, n, how) {
  ui.rv = {};
  ui.act = { id: c.id, how: how, d: d, n: n };
  ui.rxs = {};
  ui.rxFor = null;
  setTimeout(annSave, 0);
  ui.out = {};
  ui.sel = {};
  ui.menu = false;
  ui.tpk = false;
  ui.half = false;
  ui.mx = false;
  ui.ax = 0;
  ui.pend = {};
  var D = d.dmg || [];
  ui.amt = D[0] ? D[0].avg : 0;
  ui.dtype = D[0] ? D[0].type || "" : "";
  if (D.length > 1) {
    ui.ex = true;
    ui.amtO = D.slice(1).reduce(function (t, x) {
      return t + x.avg;
    }, 0);
    ui.dtO = D[1].type || "";
  } else {
    ui.ex = false;
    ui.amtO = 0;
    ui.dtO = "";
  }
  (d.conds || []).forEach(function (x) {
    if (FX[x] || CONDS.indexOf(x) >= 0) ui.pend[x] = true;
  });
  (d.st || []).forEach(function (x) {
    ui.pend[x] = true;
  });
}
// ---- Stage F: monster spells. Spell data from the Rules file (save, attack, damage dice and type, upcast table) and the
// caster's Spellcasting DC / attack bonus; the spell's status (Hold Person, Fly…) is preloaded and starts concentration.
// ---- Rules edition for player spells (the 2014 / 2024 switch). Monsters, conditions and encounter budgets are always
// 2024 (SRD 5.2). S.pcEd is the default for every character (Data > Sources > Rules edition); l.ed on a library character
// overrides it (Edit > Character sheet). A character on 2014 rules gets the SRD 5.1 version of a spell when there is one
// (REF.by14, from reference-2014.json); a spell that is not in SRD 5.1 keeps its 2024 text.
function pcEd(l) {
  var e = (l && l.ed) || S.pcEd;
  return e === "2014" ? "2014" : "2024";
}
function spKey(n) {
  return String(n)
    .replace(/\u2019/g, "'")
    .toLowerCase();
}
function spRef(name, ed) {
  if (!REF || !REF.spells) return null;
  var k = spKey(name);
  if (ed === "2014" && REF.by14 && REF.by14[k]) return REF.by14[k];
  return (
    REF.spells.find(function (x) {
      return spKey(x.n) === k;
    }) || null
  );
}
// 2014 text writes conditions in lower case ("becomes frightened"); the parsers look for the capitalised 2024 form.
function capConds(t) {
  return t.replace(
    /\b(blinded|charmed|deafened|frightened|grappled|incapacitated|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious)\b/g,
    cap,
  );
}
function spellData(name, sp, slv) {
  if (!REF || !REF.spells || !REF.spells.length) return null;
  var lv = slv ? String(slv) : (name.match(/level (\d+) version/i) || [])[1],
    base = name.replace(/\s*\(.*$/, "").trim(),
    key = spKey(base);
  var r = spRef(base, sp && sp.ed);
  if (!r) return null;
  var old = r.ed === "2014",
    tx = old ? capConds(r.tx) : r.tx;
  var dice = r.dr || "";
  // SRD 5.1 data has no damage roll for a few spells whose dice sit in the text ("deals 1d4 + 1 force damage")
  var dts = r.dt || [];
  if (!dice && old) {
    var tm = tx.match(new RegExp("(\\d+d\\d+(?: \\+ \\d+)?) (" + DTYPES.join("|") + ") damage", "i"));
    if (tm) {
      dice = tm[1];
      if (!dts.length) dts = [tm[2].toLowerCase()];
    }
  }
  if (lv && r.up)
    r.up.forEach(function (u) {
      var q = u.split(":");
      if (q[0] === lv) dice = q[1];
    });
  // Cantrip upgrade for players: "levels 5 (2d10), 11 (3d10), and 17 (4d10)" by character level
  // (2014 wording: "5th level (2d10), 11th level (3d10), and 17th level (4d10)")
  var cu =
    !r.l && sp && sp.clv
      ? (r.hl || "").match(/\b5(?:th level)? \((\d+d\d+)\), 11(?:th level)? \((\d+d\d+)\),? and 17(?:th level)? \((\d+d\d+)\)/)
      : null;
  if (cu) dice = sp.clv >= 17 ? cu[3] : sp.clv >= 11 ? cu[2] : sp.clv >= 5 ? cu[1] : dice;
  var avg = function (ds) {
    var m = ds.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/);
    return m ? Math.floor((+m[1] * (+m[2] + 1)) / 2) + (+m[3] || 0) : 0;
  };
  var st = SPELLS.map(function (x) {
    return x[0];
  })
    .filter(function (x) {
      return spName(x) === key;
    })
    .slice(0, 1);
  var d = {
    n: r.n,
    ed: old ? "2014" : "2024",
    spell: 1,
    dmg: dice && dts.length ? [{ avg: avg(dice), dice: dice, type: dts[0] }] : [],
    conds: [],
    st: st,
    lvl: lv,
    base: r.l,
    upd: !!(r.up && r.up.length),
  };
  // Several rays / darts / beams: each is its own target pick (same target allowed), one after another
  var pm = tx.match(/\b(two|three|four|five) (?:[a-z-]+ ){0,3}(?:rays|darts|beams|bolts|missiles)\b/i),
    cnt = pm ? WNUM[pm[1].toLowerCase()] : 1,
    pu = (r.hl || "").match(/one (?:more|additional) (?:ray|dart|beam|bolt|missile) for each (?:spell )?slot level above (\d)/i);
  if (pu) {
    d.upd = true;
    if (lv) cnt += Math.max(0, +lv - +pu[1]);
  }
  if (/beams at (?:level 5|5th level)/i.test((r.hl || "") + tx) && sp && sp.clv) cnt = 1 + (sp.clv >= 5) + (sp.clv >= 11) + (sp.clv >= 17);
  if (cnt > 1) d.cnt = cnt;
  var two = tx.match(/(\d+d\d+) (\w+) damage and (\d+d\d+) (\w+) damage/i);
  if (two && d.dmg.length && !/ice knife/i.test(key)) {
    var d2 = two[3] === two[1] ? dice : two[3];
    d.dmg.push({ avg: avg(d2), dice: d2, type: two[4].toLowerCase() });
  }
  if (r.at) {
    d.kind = "atk";
    d.atk = {
      type: /melee spell attack/i.test(tx) ? "melee spell" : "ranged spell",
      bonus: sp && sp.sat != null ? sp.sat : null,
      reach: null,
      range: null,
    };
  } else if (r.sv) {
    d.kind = "save";
    d.save = { ab: ABN[r.sv[0].toUpperCase() + r.sv.slice(1)], dc: sp && sp.dc != null ? sp.dc : null, area: "" };
    d.succ = /half as much damage/i.test(tx) ? "half" : null;
  } else if (st.length || d.dmg.length) d.kind = "buff";
  else if (
    (d.conds = pConds(tx).filter(function (x) {
      return x !== "Incapacitated";
    })).length
  )
    d.kind = "buff";
  else return null;
  return d;
}
// Start a spell: several rays/darts become "(1 of N)" picks; the first one spends the cast, the rest are free
// "casts Invisibility … using the same spellcasting ability as Spellcasting": DC / attack bonus come from the Spellcasting action
function castSp(A, p) {
  return p.dc || p.sat != null
    ? p
    : A.find(function (x) {
        return x.kind === "spell" && (x.dc || x.sat != null);
      }) || p;
}
function spellBegin(c, d, n, how) {
  if (d.cnt > 1) {
    how.left = d.cnt;
    how.tot = d.cnt;
    n += " (1 of " + d.cnt + ")";
  }
  actBegin(c, d, n, how);
}
// Which action a legendary action points to ("makes one Rend attack", "uses Fire Ray", "uses Spellcasting to cast Fireball")
function legRef(m, A, p) {
  var t = rawOf(m, p),
    names = A.filter(function (x) {
      return x.sec !== "l" && x.kind !== "multi";
    }).sort(function (a, b) {
      return b.n.length - a.n.length;
    });
  var q = names.find(function (x) {
    return t.indexOf(x.n) >= 0;
  });
  if (!q) return null;
  var i = t.indexOf(q.n),
    cm = t.slice(Math.max(0, i - 12), i).match(/(\w+) $/),
    cnt = cm && WNUM[cm[1].toLowerCase()] && cm[1].toLowerCase() !== "twice" ? WNUM[cm[1].toLowerCase()] : 1;
  if (/^ twice/.test(t.slice(i + q.n.length))) cnt = 2;
  var spl = q.kind === "spell" ? (t.match(/to cast ([A-Z][A-Za-z’' ]+?)(?: \(|[,.]|$)/) || [])[1] : null;
  return { q: q, cnt: cnt, spell: spl };
}
function actOut(t) {
  var a = ui.act,
    o = ui.out[t.id];
  if (o) return o;
  if (a.d.kind === "buff") return "hit";
  if (
    a.d.kind === "save" &&
    a.d.save &&
    (a.d.save.ab === 0 || a.d.save.ab === 1) &&
    t.conds.some(function (x) {
      return NOSAVE.indexOf(x) >= 0;
    })
  )
    return "fail";
  return a.d.kind === "atk" ? "hit" : "fail";
}
// Advantage / disadvantage / crit reminders for an attack against one target
function atkHints(att, t, d) {
  var h = [],
    melee = /melee/.test(d.atk.type),
    has = function (c, x) {
      return c.conds.indexOf(x) >= 0;
    };
  if (has(t, "Prone")) h.push(melee ? "adv: Prone" : "disadv: Prone");
  ["Blinded", "Paralyzed", "Stunned", "Unconscious", "Restrained", "Petrified"].forEach(function (x) {
    if (has(t, x)) h.push("adv: " + x);
  });
  if (has(t, "Faerie Fire")) h.push("adv: Faerie Fire");
  if (melee && (has(t, "Paralyzed") || has(t, "Unconscious"))) h.push("crit if within 5 ft");
  if (melee && has(t, "Armor of Agathys")) h.push("attacker takes cold (Armor of Agathys)");
  if (melee && has(t, "Fire Shield")) h.push("attacker takes 2d8 (Fire Shield)");
  if (has(t, "Guiding Bolt")) h.push("adv: Guiding Bolt");
  if (has(t, "Invisible")) h.push("disadv: Invisible");
  if (has(t, "Dodging")) h.push("disadv: Dodging");
  if (has(t, "Blurred")) h.push("disadv: Blur");
  if (att) {
    ["Blinded", "Poisoned", "Frightened", "Restrained", "Prone"].forEach(function (x) {
      if (has(att, x)) h.push("disadv: attacker " + x);
    });
    if (has(att, "Invisible")) h.push("adv: attacker Invisible");
  }
  return h;
}
// Crit: adds the dice part of each preloaded damage again (the DM rolls; this only moves the starting value)
function diceAvg(ds) {
  var m = String(ds || "").match(/(\d+)d(\d+)/);
  return m ? Math.floor((+m[1] * (+m[2] + 1)) / 2) : 0;
}
function setSlot(i, v) {
  if (i === (ui.ax || 0)) ui.amt = v;
  else ui.amtO = v;
}
function actCrit(on) {
  var D = ui.act.d.dmg || [],
    e0 = D[0] ? diceAvg(D[0].dice) : 0,
    e1 = D.slice(1).reduce(function (t, x) {
      return t + diceAvg(x.dice);
    }, 0),
    k = on ? 1 : -1;
  setSlot(0, Math.max(0, slot(0).v + k * e0));
  if (ui.ex) setSlot(1, Math.max(0, slot(1).v + k * e1));
  ui.act.crit = on;
}
// Save bonus for a target (players: their sheet; monsters: Saves line or ability modifier) and Magic Resistance
function saveMod(c, ab) {
  var k = AK[ab];
  if (c.kind === "pc") {
    var l = S.lib.find(function (x) {
      return x.id === c.libId;
    });
    return l && l.saves && l.saves[k] != null ? +l.saves[k] : null;
  }
  var m = MON.find(function (x) {
    return x.id === c.monId;
  });
  if (!m) return null;
  var sv =
      (m.extra.find(function (e) {
        return /^sav/i.test(e[0]);
      }) || [])[1] || "",
    r = sv.match(new RegExp(AB[ab] + "\\s*([+\u2212-]\\d+)", "i"));
  return r ? +r[1].replace("\u2212", "-") : Math.floor(((m.abil || [])[ab] - 10) / 2);
}
function magRes(c) {
  var m =
    c.kind === "mon" &&
    MON.find(function (x) {
      return x.id === c.monId;
    });
  return !!(
    m &&
    (m.traits || []).some(function (t) {
      return /^Magic Resistance/i.test(t[0]);
    })
  );
}
// A player's spells (from D&D Beyond) on their turn card: tap one to target monsters; DC / attack bonus from the class
function pcSpell(l) {
  var d = pcDCs(l).find(function (x) {
    return x.hit != null;
  });
  return { dc: d ? d.dc : null, sat: d ? d.hit : null, clv: (l && +l.level) || 0, ed: pcEd(l) };
}
// Spell slots from class levels. Full casters count their level, Paladin / Ranger (and Artificer) half rounded up,
// Eldritch Knight / Arcane Trickster a third (rounded up alone, down when multiclassed); Warlock Pact Magic is separate.
// 2014 rules differ for Paladin and Ranger only: no slots at level 1, and half rounded down when multiclassed.
var SLOTS = [
  [],
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
function pcSlots(l) {
  var P = ((l && l.parsed) || []).filter(function (p) {
      return +p.level;
    }),
    pact = null,
    K = [];
  var old = pcEd(l) === "2014",
    half14 = function (k) {
      return old && k[2];
    };
  P.forEach(function (p) {
    var c = (p.class || "").toLowerCase(),
      sub = (p.subclass || "").toLowerCase(),
      n = +p.level;
    if (c === "warlock") pact = { n: n >= 17 ? 4 : n >= 11 ? 3 : n >= 2 ? 2 : 1, lvl: Math.min(5, Math.ceil(n / 2)) };
    var f = /^(bard|cleric|druid|sorcerer|wizard)$/.test(c)
      ? 1
      : /^(paladin|ranger|artificer)$/.test(c)
        ? 2
        : (c === "fighter" && /eldritch knight/.test(sub)) || (c === "rogue" && /arcane trickster/.test(sub))
          ? 3
          : 0;
    if (f) K.push([f, n, c === "paladin" || c === "ranger"]);
  });
  var lv =
    K.length === 1
      ? half14(K[0]) && K[0][1] < 2
        ? 0
        : Math.ceil(K[0][1] / K[0][0])
      : K.reduce(function (a, k) {
          return a + (k[0] === 1 ? k[1] : k[0] === 2 ? (half14(k) ? Math.floor(k[1] / 2) : Math.ceil(k[1] / 2)) : Math.floor(k[1] / 3));
        }, 0);
  return { slots: SLOTS[Math.min(20, lv)] || [], pact: pact };
}
function cap(t) {
  t = String(t || "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
// Slot pips on the player's turn card: tap to mark used (c.slu, kept for the encounter), Reset when the party rests.
function slotsHTML(c, l) {
  var sp = pcSlots(l),
    u = c.slu || {};
  if (!sp.slots.length && !sp.pact) return "";
  var pips = function (k, n) {
    var used = u[k] || 0,
      o = "";
    for (var i = 0; i < n; i++)
      o +=
        '<button class="pip' +
        (i < n - used ? " on" : "") +
        '" data-act="slot" data-k="' +
        k +
        '" aria-label="' +
        (k === "p" ? "Pact" : "Level " + k) +
        " slot " +
        (i + 1) +
        (i < n - used ? "" : " (used)") +
        '"></button>';
    return o;
  };
  return (
    '<div class="slots2"><b>Spell slots</b>' +
    sp.slots
      .map(function (n, i) {
        return '<span class="slv"><small>' + (i + 1) + "</small>" + pips(i + 1, n) + "</span>";
      })
      .join("") +
    (sp.pact ? '<span class="slv"><small>Pact ' + sp.pact.lvl + "</small>" + pips("p", sp.pact.n) + "</span>" : "") +
    (Object.keys(u).length ? '<button data-act="slotr">Reset</button>' : "") +
    "</div>"
  );
}
// Slots left for a player, as castable options: [{k: level number or 'p' (pact), lvl, left}], lowest level first.
// tracked = the character has slots at all (racial / feat spells on a non-caster are never blocked).
function slotOpts(c) {
  var sp = pcSlots(libOf(c)),
    u = c.slu || {},
    o = [];
  sp.slots.forEach(function (n, i) {
    var left = n - (u[i + 1] || 0);
    if (left > 0) o.push({ k: i + 1, lvl: i + 1, left: left });
  });
  if (sp.pact) {
    var pl = sp.pact.n - (u.p || 0);
    if (pl > 0) o.push({ k: "p", lvl: sp.pact.lvl, left: pl });
  }
  o.sort(function (a, b) {
    return a.lvl - b.lvl || (a.k === "p") - (b.k === "p");
  });
  o.tracked = !!(sp.slots.length || sp.pact);
  return o;
}
// Options for the pad's Slot stepper: tracked slots left at or above the spell's level, else every level up to 9
function slotChoices(c, base) {
  var o = slotOpts(c);
  if (o.tracked)
    return o.filter(function (x) {
      return x.lvl >= base;
    });
  var a = [];
  for (var v = base; v <= 9; v++) a.push({ k: null, lvl: v });
  return a;
}
function slotStep(a) {
  var c = findC(a.id),
    O = slotChoices(c, a.d.base),
    i = O.findIndex(function (o) {
      return o.k === a.how.sk && o.lvl === (a.how.sl || a.d.base);
    }),
    cur = O[i];
  return (
    '<span class="aslot" title="Spell slot to use' +
    (a.d.upd ? " (higher slots add dice)" : "") +
    '">' +
    (cur && cur.k === "p" ? "Pact slot" : "Slot") +
    " <b>" +
    (cur ? cur.lvl : a.d.base) +
    "</b>" +
    (cur && cur.left != null ? " <small>(" + cur.left + " left)</small>" : "") +
    '<button data-act="aslot" data-d="-1"' +
    (i <= 0 ? " disabled" : "") +
    ' aria-label="Lower slot">\u2212</button><button data-act="aslot" data-d="1"' +
    (i < 0 || i >= O.length - 1 ? " disabled" : "") +
    ' aria-label="Higher slot">+</button></span>'
  );
}
// A player's cast spends its slot once (the first ray / dart; later picks are free), on Apply or Miss; Undo gives it back
function slotSpend(c, how) {
  if (how.a !== "pcast" || how.sk == null || how.free) return "";
  c.slu = c.slu || {};
  c.slu[how.sk] = (c.slu[how.sk] || 0) + 1;
  return " \u00b7 " + (how.sk === "p" ? "Pact slot" : "level " + how.sk + " slot") + " used";
}
function slotFor(c, base) {
  return (
    slotOpts(c).filter(function (x) {
      return x.lvl >= base;
    })[0] || null
  );
}
// Start a player's levelled spell on a given slot option (dice follow the slot level when the spell upcasts)
function pcCastBegin(c, name, opt) {
  var l = libOf(c),
    r = spRef(name, pcEd(l)),
    base = r ? r.l : 0,
    d = spellData(name, pcSpell(l), opt && opt.lvl > base ? opt.lvl : null);
  if (!d) return false;
  spellBegin(c, d, d.n + (opt && opt.lvl > base ? " (slot " + opt.lvl + ")" : ""), {
    a: "pcast",
    s: name,
    sk: opt ? opt.k : null,
    sl: opt ? opt.lvl : null,
  });
  return true;
}
// ---- Consumables on the player card (play test 1). Equipment text is REF.items (SRD 5.2); ITEMFX is the tap-to-use effect:
// sv = save ability index (DC 8 + Dex modifier + Proficiency Bonus unless dc is fixed), dmg = [dice, type] ('heal' / 'temp' too),
// conds / st = preloaded statuses, self = the user is picked as the target to start with. Items without an entry open their rules text.
var ITEMFX = {
  Acid: { sv: 1, dmg: [["2d6", "acid"]] },
  "Alchemist's Fire": { sv: 1, dmg: [["1d4", "fire"]], st: ["Burning"] },
  "Holy Water": { sv: 1, dmg: [["2d8", "radiant"]], note: "Fiends and Undead only" },
  Oil: { sv: 1, note: "failed: covered in oil for 1 minute, +5 Fire damage when it next takes Fire damage" },
  Net: { sv: 1, conds: ["Restrained"], note: "Huge or larger succeeds; escape: DC 10 Athletics as an action" },
  Caltrops: { sv: 1, dc: 15, dmg: [["1", "piercing"]], note: "failed: Speed 0 until the start of its next turn" },
  "Ball Bearings": { sv: 1, dc: 10, conds: ["Prone"] },
  "Hunting Trap": {
    sv: 1,
    dc: 13,
    dmg: [["1d4", "piercing"]],
    note: "failed: Speed 0 until the start of its next turn, then held by the chain",
  },
  "Poison, Basic": { dmg: [["1d4", "poison"]], note: "extra damage on a Piercing or Slashing hit with the coated weapon" },
  "Potion of Healing": { dmg: [["2d4+2", "heal"]], self: 1 },
  "Potion of Healing (greater)": { dmg: [["4d4+4", "heal"]], self: 1 },
  "Potion of Healing (superior)": { dmg: [["8d4+8", "heal"]], self: 1 },
  "Potion of Healing (supreme)": { dmg: [["10d4+20", "heal"]], self: 1 },
  "Potion of Poison": {
    dmg: [["4d6", "poison"]],
    conds: ["Poisoned"],
    self: 1,
    note: "DC 13 Con save or Poisoned for 1 hour (untick Poisoned on a success)",
  },
  "Potion of Heroism": { dmg: [["10", "temp"]], st: ["Blessed"], self: 1, note: "1 hour, no Concentration" },
  "Potion of Invisibility": { conds: ["Invisible"], self: 1, note: "1 hour; ends on an attack roll, damage or a spell" },
  "Potion of Speed": { st: ["Hasted"], self: 1, note: "1 minute, no Concentration, no lethargy" },
  // Sample poisons (SRD 5.2): Constitution save (index 2); half = half damage on a success
  "Assassin's Blood": { sv: 2, dc: 10, dmg: [["1d12", "poison"]], half: 1, conds: ["Poisoned"], note: "Poisoned 24 hours" },
  "Burnt Othur Fumes": {
    sv: 2,
    dc: 13,
    dmg: [["3d6", "poison"]],
    note: "repeat at the start of each turn: 1d6 on a failure; ends after 3 successes",
  },
  "Crawler Mucus": { sv: 2, dc: 13, conds: ["Poisoned", "Paralyzed"], note: "1 minute; repeat at the end of each turn" },
  "Essence of Ether": { sv: 2, dc: 15, conds: ["Poisoned", "Unconscious"], note: "8 hours; wakes on damage or if shaken awake (action)" },
  Malice: { sv: 2, dc: 15, conds: ["Poisoned", "Blinded"], note: "1 hour" },
  "Midnight Tears": { sv: 2, dc: 17, dmg: [["9d6", "poison"]], half: 1, note: "takes effect at midnight unless neutralised first" },
  "Oil of Taggit": { sv: 2, dc: 13, conds: ["Poisoned", "Unconscious"], note: "24 hours; wakes on damage" },
  "Pale Tincture": {
    sv: 2,
    dc: 16,
    dmg: [["1d6", "poison"]],
    conds: ["Poisoned"],
    note: "repeat every 24 hours; damage cannot be healed; ends after 7 successes",
  },
  "Purple Worm Poison": { sv: 2, dc: 21, dmg: [["10d6", "poison"]], half: 1 },
  "Serpent Venom": { sv: 2, dc: 11, dmg: [["3d6", "poison"]], half: 1 },
  "Spider's Sting": { sv: 2, dc: 13, conds: ["Poisoned"], note: "1 hour; failed by 5 or more: also Unconscious" },
  Torpor: { sv: 2, dc: 15, conds: ["Poisoned"], note: "4d6 hours; Speed halved" },
  "Truth Serum": { sv: 2, dc: 11, conds: ["Poisoned"], note: "1 hour; cannot knowingly lie" },
  "Wyvern Poison": { sv: 2, dc: 14, dmg: [["7d6", "poison"]], half: 1 },
};
var ITEMDEF = [
  "Potion of Healing",
  "Acid",
  "Alchemist's Fire",
  "Holy Water",
  "Oil",
  "Net",
  "Caltrops",
  "Ball Bearings",
  "Poison, Basic",
  "Antitoxin",
  "Healer's Kit",
];
function itemKey(n) {
  n = String(n)
    .replace(/\u2019/g, "'")
    .trim();
  var g = n.match(/\((greater|superior|supreme)\)/i);
  n = n
    .replace(/\s*\([^)]*\)/g, "")
    .trim()
    .toLowerCase();
  if (n === "basic poison") n = "poison, basic";
  return n + (g ? " (" + g[1].toLowerCase() + ")" : "");
}
function itemName(n) {
  return n === "Poison, Basic" ? "Basic Poison" : n;
}
function itemRef(n) {
  var k = itemKey(n);
  return (
    (REF &&
      (REF.items || []).find(function (x) {
        return itemKey(x.n) === k;
      })) ||
    null
  );
}
function itemData(n, c) {
  var r = itemRef(n),
    f = r && ITEMFX[r.n];
  if (!f) return null;
  var l = libOf(c),
    ab = l && l.abil,
    dx = ab && ab.dex != null ? Math.floor((ab.dex - 10) / 2) : null;
  var avg = function (ds) {
    var m = String(ds).match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
    return m ? Math.floor((+m[1] * (+m[2] + 1)) / 2) + (+m[3] || 0) : +ds;
  };
  var d = {
    n: itemName(r.n),
    item: 1,
    dmg: (f.dmg || []).map(function (x) {
      return { avg: avg(x[0]), dice: x[0], type: x[1] };
    }),
    conds: (f.conds || []).slice(),
    st: (f.st || []).filter(function (x) {
      return (
        FX[x] ||
        SPELLS.some(function (z) {
          return z[0] === x;
        })
      );
    }),
    note: f.note || "",
    self: !!f.self,
  };
  if (f.sv != null) {
    d.kind = "save";
    d.save = { ab: f.sv, dc: f.dc || (dx != null ? 8 + dx + pcPb(l) : null), area: "" };
    d.succ = f.half ? "half" : null;
  } else d.kind = "buff";
  return d;
}
function itemOpen(n) {
  var r = itemRef(n);
  if (!r) return;
  ui.ref = r.n;
  ui.refBack = "close";
  S.tab = "ref";
  if (!ui.drawer) ui.dmode = "add";
  ui.drawer = true;
  renderDrawer();
}
// Consumables on a player's turn card: carried items first (D&D Beyond), then the tap-to-use list and named poisons.
function pcItemsHTML(c, l) {
  if (RO || ui.present) return "";
  if (!REF) {
    refLoad();
    return "";
  }
  if (!(REF.items || []).length) return "";
  var seen = {},
    own = ((l && l.items) || [])
      .map(function (x) {
        var r = itemRef(x.n);
        return r && (ITEMFX[r.n] || r.cat === "potion" || r.cat === "poison") && !seen[r.n]
          ? ((seen[r.n] = 1), { n: r.n, q: x.q || 1 })
          : null;
      })
      .filter(Boolean);
  var L = own.concat(
    ITEMDEF.filter(function (n) {
      return !seen[n];
    }).map(function (n) {
      return { n: n };
    }),
  );
  return (
    '<details class="pcsp pcit"' +
    (ui.pcItOpen ? " open" : "") +
    "><summary>Consumables" +
    (own.length ? " (" + own.length + " carried)" : "") +
    '</summary><div class="spl">' +
    L.map(function (x) {
      return (
        '<button data-act="pitem" data-s="' +
        esc(x.n) +
        '"' +
        (x.q ? ' class="own" title="On the character sheet"' : "") +
        ">" +
        esc(itemName(x.n)) +
        (x.q > 1 ? " <small>\u00d7" + x.q + "</small>" : "") +
        (ITEMFX[x.n] ? "" : " <small>\u24d8</small>") +
        "</button>"
      );
    }).join("") +
    '<button data-act="pitempoi" aria-expanded="' +
    !!ui.pcPoi +
    '">Poisons ' +
    (ui.pcPoi ? "\u25b4" : "\u25be") +
    '</button><button data-act="pitemall">All equipment\u2026</button>' +
    (ui.pcPoi
      ? '<span class="poil">' +
        REF.items
          .filter(function (x) {
            return x.cat === "poison" && !seen[x.n];
          })
          .map(function (x) {
            return '<button data-act="pitem" data-s="' + esc(x.n) + '">' + esc(x.n) + " <small>" + esc(x.r) + "</small></button>";
          })
          .join("") +
        "</span>"
      : "") +
    "</div></details>"
  );
}
function pcSpellsHTML(c, l) {
  if (!l || !(l.spells || []).length || RO || ui.present) return "";
  if (!REF) {
    refLoad();
    return "";
  }
  var L = l.spells
    .map(function (n) {
      var d = spellData(n, pcSpell(l)),
        r = spRef(n, pcEd(l));
      return d ? { n: n, lv: r ? r.l : 0 } : null;
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return a.lv - b.lv || a.n.localeCompare(b.n);
    });
  if (!L.length) return "";
  var ps = pcSpell(l),
    so = slotOpts(c);
  return (
    '<details class="pcsp"' +
    (ui.pcSpOpen ? " open" : "") +
    "><summary>Spells (" +
    L.length +
    ")" +
    (pcEd(l) === "2014" ? " \u00b7 2014 rules" : "") +
    (ps.dc ? " \u00b7 save DC " + ps.dc + " \u00b7 " + sgn(ps.sat) + " to hit" : "") +
    '</summary><div class="spl">' +
    L.map(function (x) {
      var no =
        x.lv > 0 &&
        so.tracked &&
        !so.some(function (o) {
          return o.lvl >= x.lv;
        });
      return (
        '<button data-act="pcast" data-s="' +
        esc(x.n) +
        '"' +
        (no ? ' disabled title="No spell slot of level ' + x.lv + ' or higher left"' : "") +
        "><small>" +
        (x.lv ? x.lv : "C") +
        "</small> " +
        esc(x.n) +
        "</button>"
      );
    }).join("") +
    "</div></details>"
  );
}
// Table view line: what players need to roll or write down. S.ann = {h: html, n: turn count when made}; shown for that turn and the next.
function annSet(h) {
  S.tc = S.tc || 0;
  S.ann = { h: h, n: S.tc };
}
function annSave() {
  var a = ui.act;
  if (!a || a.d.kind !== "save" || a.d.save.dc == null) return;
  var att = findC(a.id),
    T = S.list.filter(function (c) {
      return ui.sel[c.id] && c.kind === "pc";
    });
  annSet(
    "<b>" +
      esc(att ? att.name : "") +
      "</b> \u2014 " +
      esc(a.n) +
      ": <b>DC " +
      a.d.save.dc +
      " " +
      ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"][a.d.save.ab] +
      " saving throw</b>" +
      (T.length
        ? " \u00b7 " +
          T.map(function (c) {
            return esc(c.name);
          }).join(", ")
        : ""),
  );
  save();
}
function renderAnn() {
  var el = $("#ann");
  if (!el) {
    el = document.createElement("div");
    el.id = "ann";
    el.className = "ann";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  var A = S.ann,
    on = (ui.present || RO) && A && (S.tc || 0) - A.n <= 1;
  el.hidden = !on;
  if (on) el.innerHTML = A.h;
}
// Heading of the pad while an action runs: what is being used and what the targets roll.
function actHead() {
  var a = ui.act,
    d = a.d,
    x =
      d.kind === "buff"
        ? d.st.length
          ? "targets get " + nm(d.st[0])
          : d.conds.length
            ? "targets get " + nm(d.conds[0])
            : d.dmg.length
              ? SPEC[d.dmg[0].type]
                ? "pick who gets it"
                : "hits automatically"
              : "targets get the effect"
        : d.kind === "atk"
          ? d.atk.type[0].toUpperCase() +
            d.atk.type.slice(1) +
            (d.atk.bonus == null ? "" : " " + sgn(d.atk.bonus)) +
            (d.atk.reach ? ", reach " + d.atk.reach + " ft." : "") +
            (d.atk.range ? ", range " + d.atk.range + " ft." : "")
          : "DC " +
            (d.save.dc == null ? "?" : d.save.dc) +
            " " +
            ABS[d.save.ab] +
            " save" +
            (d.succ === "half" ? ", half on a success" : d.succ ? "" : ", nothing on a success");
  return (
    '<div class="acth"><span><b>' +
    esc(a.n) +
    "</b> \u00b7 " +
    esc(x) +
    (d.rider ? " \u00b7 then DC " + d.rider.dc + " " + ABS[d.rider.ab] + " save" : "") +
    (d.note ? " \u00b7 <small>" + esc(d.note) + "</small>" : "") +
    "</span>" +
    (d.spell && a.how && a.how.a === "pcast" && d.base > 0 && !a.how.free ? slotStep(a) : "") +
    (d.kind === "atk"
      ? '<button class="tg crit' +
        (a.crit ? " on" : "") +
        '" data-act="acrit" aria-pressed="' +
        !!a.crit +
        '" title="Critical hit: adds the damage dice again">Crit</button><button class="amiss" data-act="amiss" title="The attack missed: spend it, nothing else">Miss</button>'
      : "") +
    '<button data-act="actx">Cancel</button></div>'
  );
}
// Targets are picked from chips inside the pad (the list behind may be covered on a phone); table taps still work too.
// Attack: chip on = hit (tap again to drop it). Save / rider save: tap toggles Failed <-> Saved, \u2715 drops it.
// Plain pad (no action): every creature as a chip, tap to add or remove it from the selection (like action targets)
function padChips() {
  var L = S.list.filter(function (t) {
    return t.kind !== "fx" && !(t.kind === "mon" && t.hp <= 0 && !ui.sel[t.id]);
  });
  return (
    '<div class="tcs">' +
    L.map(function (t) {
      return (
        '<span class="tc' +
        (ui.sel[t.id] ? " on" : "") +
        (t.kind === "pc" ? " ally" : "") +
        '" role="button" tabindex="0" data-act="pchip" data-id="' +
        t.id +
        '" aria-pressed="' +
        !!ui.sel[t.id] +
        '"><b>' +
        esc(t.name) +
        "</b></span>"
      );
    }).join("") +
    "</div>"
  );
}
// Target chips while an action runs: one chip per creature with its outcome toggle and hints (save bonus, auto-fail, reactions).
function actRows(T) {
  var a = ui.act,
    att = findC(a.id),
    atk = a.d.kind === "atk",
    tog = a.d.kind === "save" || (atk && !!a.d.rider);
  var L = S.list.filter(function (t) {
    return t.kind !== "fx" && (t.id !== a.id || a.d.kind === "buff") && !(t.kind === "mon" && t.hp <= 0 && !ui.sel[t.id]);
  });
  var foe = function (t) {
    return (att && att.kind === "mon") === (t.kind === "pc") ? 0 : 1;
  };
  L.sort(function (x, y) {
    return foe(x) - foe(y);
  });
  return (
    '<div class="tcs">' +
    (T.length ? "" : '<span class="tch">Targets:</span>') +
    L.map(function (t) {
      var on = !!ui.sel[t.id],
        o = on ? actOut(t) : "",
        sv = o === "save" || o === "rsave",
        H = on && atk ? atkHints(att, t, a.d) : [];
      if (on && a.d.kind === "save") {
        var sm = saveMod(t, a.d.save.ab);
        if (sm != null) H.unshift(ABS[a.d.save.ab] + " " + sgn(sm));
        if (a.d.spell && magRes(t)) H.push("adv: Magic Resistance");
      }
      if (
        on &&
        !atk &&
        o === "fail" &&
        !ui.out[t.id] &&
        a.d.save.ab < 2 &&
        t.conds.some(function (x) {
          return NOSAVE.indexOf(x) >= 0;
        })
      )
        H.push("auto-fail");
      return (
        '<span class="tc' +
        (on ? " on" : "") +
        (sv ? " sv" : "") +
        (foe(t) ? " ally" : "") +
        '" role="button" tabindex="0" data-act="tchip" data-id="' +
        t.id +
        '"><b>' +
        esc(t.name) +
        "</b>" +
        (on && atk ? "<small>AC " + effAC(t) + "</small>" : "") +
        (on && tog ? '<small class="st">' + (sv ? "Saved" : "Failed") + "</small>" : "") +
        H.map(function (x) {
          return '<small class="hint">' + esc(x) + "</small>";
        }).join("") +
        (on && (ui.rxs || {})[t.id] ? '<small class="rxo">\u27f2 ' + esc(ui.rxs[t.id].n) + "</small>" : "") +
        (on && !t.rx && !rxBlocked(t)
          ? '<span class="trx" data-act="trx" data-id="' +
            t.id +
            '" role="button" aria-label="' +
            esc(t.name) +
            ' uses a reaction" title="Uses a reaction">\u27f2</span>'
          : "") +
        (on && tog
          ? '<span class="tx" data-act="tdel" data-id="' + t.id + '" role="button" aria-label="Remove ' + esc(t.name) + '">\u2715</span>'
          : "") +
        "</span>"
      );
    }).join("") +
    "</div>" +
    rxPick()
  );
}
// Reaction options for one picked target: the reaction is used and its status applied on Apply (the outcome stays as declared)
function rxOpts(t) {
  var o = [],
    atk = ui.act.d.kind === "atk";
  if (t.kind === "pc") {
    var l = S.lib.find(function (x) {
        return x.id === t.libId;
      }),
      sp = l && l.spells;
    if (!sp || sp.indexOf("Shield") >= 0) o.push({ n: "Shield", st: "Shield" });
    if (atk) o.push({ n: "Uncanny Dodge", half: 1 });
    (sp || []).forEach(function (x) {
      if (["Absorb Elements", "Hellish Rebuke", "Silvery Barbs"].indexOf(x) >= 0) o.push({ n: x });
    });
  } else {
    var m = MON.find(function (x) {
      return x.id === t.monId;
    });
    (m
      ? actsOf(m).filter(function (p) {
          return p.sec === "r";
        })
      : []
    ).forEach(function (p) {
      var tx = rawOf(m, p);
      o.push({ n: p.n, st: /\bShield\b/.test(tx) ? "Shield" : "" });
    });
  }
  o.push({ n: "Other reaction" });
  return o;
}
function rxPick() {
  var t = ui.rxFor && findC(ui.rxFor);
  if (!t || !ui.act) return "";
  return (
    '<div class="rxp"><b>' +
    esc(t.name) +
    "\u2019s reaction:</b> " +
    rxOpts(t)
      .map(function (o) {
        return (
          '<button data-act="trxo" data-n="' +
          esc(o.n) +
          '" data-st="' +
          (o.st || "") +
          '" data-half="' +
          (o.half ? 1 : 0) +
          '">' +
          esc(o.n) +
          (o.half ? " <small>(half)</small>" : "") +
          "</button>"
        );
      })
      .join("") +
    ((ui.rxs || {})[t.id] ? '<button data-act="trxo" data-o="none">None</button>' : "") +
    "</div>"
  );
}
// Per target: share of the damage (1, 0.5, 0) and whether statuses apply
function actFx(t) {
  var r = actFx0(t),
    x = (ui.rxs || {})[t.id];
  if (x && x.half) r = [r[0] / 2, r[1]];
  return r;
}
function actFx0(t) {
  var a = ui.act,
    o = actOut(t);
  if (a.d.kind === "buff") return [1, true];
  if (a.d.kind === "atk") return o === "hit" ? [1, true] : o === "rsave" ? [1, false] : [0, false];
  return o === "fail" ? [1, true] : [a.d.succ === "half" ? 0.5 : 0, false];
}
function actSum(T) {
  if (!T.length) return "";
  var base = padSum(Object.keys(ui.pend)),
    k = {};
  T.forEach(function (t) {
    var o = actOut(t);
    k[o] = (k[o] || 0) + 1;
  });
  var L = { hit: "hit", miss: "missed", rsave: "hit (saved)", fail: "failed", save: "saved" },
    cnt = Object.keys(k)
      .map(function (x) {
        return k[x] + " " + L[x];
      })
      .join(", ");
  return (
    (T.every(function (t) {
      return actFx(t)[0] === 0 && !actFx(t)[1];
    })
      ? ""
      : base + " \u00b7 ") + cnt
  );
}
// Apply the running action to its targets T in one undo step: damage per outcome (hit / miss, failed / saved, crit), statuses, riders, log and table line.
function actApply(T) {
  var a = ui.act,
    att = findC(a.id);
  if (!att || !T.length) return;
  snap(
    a.n +
      " \u2192 " +
      T.map(function (t) {
        return t.name;
      }).join(", "),
  );
  var SL = padSlots(),
    D = SL.filter(function (x) {
      return !SPEC[x.dt];
    }),
    out = [],
    conc = [],
    stT = [],
    ann = [],
    x0;
  T.forEach(function (t) {
    var f = actFx(t),
      tot = 0,
      nt = [];
    // half / quarter damage: the whole amount is halved and rounded down once (remainder goes to the first part)
    if (f[0] > 0) {
      var amt = D.map(function (x) {
          return Math.floor(x.v * f[0]);
        }),
        H = Math.floor(
          D.reduce(function (q, x) {
            return q + x.v;
          }, 0) * f[0],
        );
      if (amt.length)
        amt[0] +=
          H -
          amt.reduce(function (q, v) {
            return q + v;
          }, 0);
      D.forEach(function (x, k) {
        var r = typed(t, amt[k], x.dt);
        tot += r[0];
        if (r[1]) nt.push(r[1]);
      });
      if (a.d.kind === "atk" && actOut(t) === "hit")
        ridFor(att, t).forEach(function (x) {
          var r = typed(t, x[0], x[1]);
          tot += r[0];
          if (r[1]) nt.push(r[1]);
        });
    }
    if (tot > 0) {
      dmg(t, tot);
      if (ui.mx) maxDown(t, tot);
      var ci = t.conds.indexOf("Concentrating");
      if (ci >= 0) {
        if (t.hp <= 0) {
          t.conds.splice(ci, 1);
          conc.push(esc(t.name) + " loses concentration (0 HP)");
        } else conc.push(esc(t.name) + ": Con save DC " + Math.min(30, Math.max(10, Math.floor(tot / 2))));
      }
    }
    if (f[1]) {
      stT.push(t);
      SL.forEach(function (x) {
        if (x.dt === "heal") heal(t, x.v);
        else if (x.dt === "temp") t.temp = Math.max(t.temp, x.v);
        else if (x.dt === "maxhp") maxDown(t, x.v);
      });
    }
    var o = actOut(t),
      tl =
        D.length && tot
          ? D.map(function (x) {
              return x.dt;
            })
              .filter(Boolean)
              .join(" + ")
          : "";
    ann.push(
      "<b>" +
        esc(t.name) +
        "</b> " +
        (t.kind === "pc" && tot
          ? tot + (tl ? " " + tl : "") + " damage"
          : a.d.kind === "atk"
            ? "hit"
            : o === "save"
              ? "saved"
              : o === "fail"
                ? "failed"
                : "") +
        (o === "save" && t.kind === "pc" && tot ? " (saved)" : "") +
        ((x0 = (ui.rxs || {})[t.id]) ? " \u00b7 " + esc(x0.n) : ""),
    );
    out.push(
      esc(t.name) +
        " " +
        (o === "miss"
          ? "missed"
          : o === "save" && !tot
            ? "saved"
            : tot + (o === "save" ? " (saved)" : "") + (nt.length ? " <small>(" + nt.join("; ") + ")</small>" : "")),
    );
  });
  var on = Object.keys(ui.pend).filter(function (x) {
      return ui.pend[x];
    }),
    sk = stT.length ? applyPend(stT) : [];
  stT.forEach(function (t) {
    if (a.d.stage && ui.pend[a.d.stage.from]) stgSet(t, a.d.stage.from, a.d.stage, a.d, a.n);
    (a.d.dend || []).forEach(function (x) {
      if (ui.pend[x] && t.conds.indexOf(x) >= 0) {
        t.dend = t.dend || {};
        t.dend[x] = 1;
      }
    });
  });
  var rxl = [];
  T.forEach(function (t) {
    var x = (ui.rxs || {})[t.id];
    if (!x) return;
    t.rx = true;
    if (x.st && t.conds.indexOf(x.st) < 0) {
      t.conds.push(x.st);
      expSet(t, x.st);
    }
    rxl.push(esc(t.name) + ": " + esc(x.n));
  });
  if (ui.pend.Grappled)
    stT.forEach(function (t) {
      if (t.conds.indexOf("Grappled") >= 0) {
        t.gb = att.id;
        t.gdc = a.d.esc || null;
      }
    });
  var msg = "<b>" + esc(a.n) + ":</b> " + out.join(" \u00b7 ");
  if (on.length && stT.length)
    msg +=
      "<br><b>" +
      on
        .map(function (x) {
          return esc(nm(x));
        })
        .join(", ") +
      "</b> \u2192 " +
      stT
        .map(function (t) {
          return esc(t.name);
        })
        .join(", ") +
      (sk.length ? " (immune: " + sk.join(", ") + ")" : "");
  if (conc.length) msg += "<br><b>Concentration:</b> " + conc.join(" \u00b7 ");
  msg += endedMsg();
  if (rxl.length) msg += "<br><b>Reaction:</b> " + rxl.join(" \u00b7 ");
  annSet(
    "<b>" +
      esc(att.name) +
      "</b> \u2014 " +
      esc(a.n) +
      (a.crit ? " (crit)" : "") +
      ": " +
      ann.join(" \u00b7 ") +
      (on.length && stT.length
        ? " \u00b7 " +
          on
            .map(function (x) {
              return esc(nm(x));
            })
            .join(", ") +
          " \u2192 " +
          stT
            .map(function (t) {
              return esc(t.name);
            })
            .join(", ")
        : ""),
  );
  var how = a.how;
  ui.act = null;
  ui.out = {};
  ui.rxs = {};
  ui.rxFor = null;
  ui.noSnap = true;
  doHow(att, how);
  ui.noSnap = false;
  msg += slotSpend(att, how);
  toast(msg);
  logAdd(esc(att.name) + " \u2014 " + msg + (a.crit ? " (crit)" : ""));
  finishPad();
  actNext(att, a);
}
// A legendary action with several attacks ("makes two Bite attacks") reopens targeting for the next one without spending again
function actNext(att, a) {
  var h = a.how;
  if (h && h.left > 1) {
    var h2 = Object.assign({}, h, { free: true, left: h.left - 1 });
    actBegin(att, a.d, a.n.replace(/ \(\d+ of \d+\)$/, "") + " (" + (h.tot - h2.left + 1) + " of " + h.tot + ")", h2);
  }
}
function bySize(m) {
  return function (a, b) {
    return rawOf(m, a).length - rawOf(m, b).length;
  };
}
function mPips(c, P, q, key, ro) {
  var left = mLeft(c, P, q),
    h = "";
  for (var i = 0; i < q.count; i++)
    h +=
      '<button class="mp' +
      (i < left ? " on" : "") +
      '"' +
      (ro ? ' tabindex="-1" disabled' : ' data-act="mpip" data-i="' + key + '" data-q="' + q.i + '" data-d="' + (i < left ? 1 : -1) + '"') +
      ' aria-label="' +
      (i < left ? "Use one" : "Give one back") +
      '"></button>';
  return h;
}
// One action card on the turn card: title with limits, the parsed line (to hit / DC / damage), Use button or the reason it is hidden.
function tcCard(c, m, p, secLab, kids, sub, why, P) {
  if ((p.kind === "spell" || p.kind === "cast") && !REF) refLoad();
  var txt = rawOf(m, p),
    sp = !!why,
    mine = !sub && c.ue && c.ue[p.sec] === p.key;
  var q = !sub && p.sec === "a" ? poolOf(P, p.n) : null,
    rq = !sub && p.sec === "a" && !q ? repOf(P, p.n) : null,
    rays = q && p.table ? (c.ray || {})[p.key] || {} : null;
  var body =
    p.kind === "spell"
      ? spellsHTML(p, txt, sub ? null : c)
      : p.table
        ? (p.table.intro ? '<div class="msum">' + rich(short(p.table.intro)) + "</div>" : "") +
          '<div class="nest">' +
          p.table.rows
            .map(function (r, ri) {
              var u = rays && rays[ri],
                off = rays && !u && mLeft(c, P, q) <= 0;
              return (
                '<div class="a na' +
                (u ? " used" : "") +
                (off ? " spent" : "") +
                '">' +
                (rays && !RO && (u || !off)
                  ? '<button class="tg' +
                    (u ? " on" : "") +
                    '" data-act="ray" data-i="' +
                    p.key +
                    '" data-q="' +
                    q.i +
                    '" data-r="' +
                    ri +
                    '">' +
                    (u ? "Used \u21ba" : "Use") +
                    "</button>"
                  : "") +
                '<b><span class="rn">' +
                r.r +
                "</span>" +
                esc(r.n) +
                "</b>" +
                blk(rich(short(r.t))) +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : blk(rich(short(txt))) +
          (p.kind === "cast" && !sub && !RO
            ? '<div class="sg">' +
              p.cast
                .map(function (sp) {
                  return (
                    '<span class="spc">' +
                    rich("cast: " + sp).slice(6) +
                    '<button class="spcast" data-act="cast" data-aw="1" data-i="' +
                    p.key +
                    '" data-s="' +
                    esc(sp) +
                    '" aria-label="Cast ' +
                    esc(sp) +
                    '">\u25b8</button></span>'
                  );
                })
                .join("") +
              "</div>"
            : "");
  var mr = rq && (c.mrep || {})[p.key];
  var btn =
    sub || RO
      ? ""
      : q
        ? '<span class="mpw" title="Multiattack: uses this turn">' +
          (q.names.length > 1 ? "shared " : "") +
          mPips(c, P, q, p.key, !!p.table) +
          "</span>"
        : rq
          ? mr
            ? '<button class="tg on" data-act="mrep" data-i="' + p.key + '" data-d="-1">Used \u21ba</button>'
            : why
              ? ""
              : '<button class="tg" data-act="mrep" data-i="' +
                p.key +
                '" data-d="1" title="Takes the place of one attack">Use (1 attack)</button>'
          : mine
            ? '<button class="tg on" data-act="unuse" data-i="' + p.key + '" title="Tap to undo">Used \u21ba</button>'
            : why
              ? ""
              : '<button class="tg" data-act="use" data-i="' + p.key + '">Use</button>';
  var lt = p.uses && !sub ? usesLeft(c, p) : null;
  if (q && mUsed(c, q)) mine = true;
  if (mr) mine = true;
  var tg = ui.act && ui.act.id === c.id && ui.act.how.i === p.key && !sub;
  return (
    '<div class="a' +
    (tg ? " tgt" : "") +
    (sub ? " na" : "") +
    (sp ? " spent" : "") +
    (mine ? " used" : "") +
    (p.table ? " wide" : "") +
    '">' +
    btn +
    "<b>" +
    esc(p.n) +
    (secLab ? '<span class="sec">' + secLab + "</span>" : "") +
    limHTML(p).replace(/(\d+)\/Day</, function (x, n) {
      return lt != null && lt < +n ? n + "/Day \u00b7 " + lt + " left<" : x;
    }) +
    "</b>" +
    body +
    "</div>"
  );
}
