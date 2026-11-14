// Encounters app, part 9 of 11: action parser (stat-block text -> data), the cards built from it, Spells & Conditions tab, D&D Beyond merge.
// ================= ACTION PARSER (roadmap: tap-to-use actions, stage A) =================
// Turns stat block entries into data: what it costs, how often it can be used, and what it does.
// parseAct(name, text, sec) -> {n, sec, cost, rech, uses, tag, kind, atk, dmg, save, fail, succ, miss, conds, esc, cast, multi, spells, ok}
//   sec: a action, b bonus action, r reaction, l legendary, t trait
//   kind: atk (attack roll), save (saving throw), multi (Multiattack), spell (Spellcasting list), cast (casts one spell), info, other
var WNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, twice: 2, thrice: 3 };
var ABN = { Strength: 0, Dexterity: 1, Constitution: 2, Intelligence: 3, Wisdom: 4, Charisma: 5 };
// Damage parts in a sentence: "7 (1d8 + 3) Slashing damage plus 3 (1d6) Fire damage" -> [{avg, dice, type}, ...].
function pDmg(t) {
  var o = [],
    re =
      /(\d+)(?: \(([^)]*\d+d\d+[^)]*)\))? (Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder) damage/g,
    m;
  while ((m = re.exec(t))) o.push({ avg: +m[1], dice: (m[2] || "").replace(/\s+/g, ""), type: m[3].toLowerCase() });
  var T2 = "(Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder)",
    c2 = t.match(new RegExp("(\\d+)(?: \\(([^)]*\\d+d\\d+[^)]*)\\))? " + T2 + " or " + T2 + " damage")); // "Necrotic or Radiant damage (its choice)"
  if (c2) o.push({ avg: +c2[1], dice: (c2[2] || "").replace(/\s+/g, ""), type: "", choice: [c2[3].toLowerCase(), c2[4].toLowerCase()] });
  var ch = t.match(/(\d+)(?: \(([^)]*\d+d\d+[^)]*)\))? damage of a type chosen by [^:]*:\s*([^.]*)/); // "22 (4d10) damage of a type chosen by the cultist: Acid, Cold, …"
  if (ch)
    o.push({
      avg: +ch[1],
      dice: (ch[2] || "").replace(/\s+/g, ""),
      type: "",
      choice: ch[3]
        .toLowerCase()
        .replace(/\bor\b/g, "")
        .split(/[,\s]+/)
        .filter(function (x) {
          return DTYPES.indexOf(x) >= 0;
        }),
    });
  return o;
}
function pConds(t) {
  var o = [];
  (
    t.match(
      /\b(Blinded|Charmed|Deafened|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious)\b/g,
    ) || []
  ).forEach(function (x) {
    if (o.indexOf(x) < 0) o.push(x);
  });
  if (/Exhaustion level/i.test(t) && o.indexOf("Exhaustion") < 0) o.push("Exhaustion");
  return o;
}
function pSpells(t) {
  // "At Will: A, B 2/Day Each: C 1/Day: D" -> [{per:'At will',n:0,list:[...]}, {per:'2/Day each',n:2,list:[...]}]
  var g = [],
    re = /(At Will|(\d+)\/Day(?: Each)?):\s*/gi,
    m,
    cuts = [];
  while ((m = re.exec(t))) cuts.push([m.index, re.lastIndex, m[1], m[2]]);
  cuts.forEach(function (c, i) {
    var body = t
      .slice(c[1], i + 1 < cuts.length ? cuts[i + 1][0] : t.length)
      .trim()
      .replace(/\.$/, "");
    var list = [],
      depth = 0,
      cur = "";
    for (var k = 0; k < body.length; k++) {
      var ch = body[k];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && !depth) {
        list.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) list.push(cur.trim());
    g.push({
      per: /at will/i.test(c[2]) ? "At will" : c[3] + "/Day" + (/each/i.test(c[2]) ? " each" : ""),
      n: c[3] ? +c[3] : 0,
      list: list,
    });
  });
  return g;
}
// Roll tables inside an entry ("1: Charm Ray. …", "1-4. The target …") -> {intro, rows:[{r, n, t}]}
function pTable(t) {
  var re = /([.:;] |^)(\d{1,2})(?:-(\d{1,2}))?[:.] (?=[A-Z])/g,
    m,
    cut = [],
    nx = 1;
  while ((m = re.exec(t))) {
    var a = +m[2],
      z = +(m[3] || m[2]);
    if (a !== nx) continue;
    cut.push([m.index + m[1].length, re.lastIndex, m[2] + (m[3] ? "–" + m[3] : ""), m[0].slice(-2, -1)]);
    nx = z + 1;
  }
  if (cut.length < 2) return null;
  return {
    intro: t.slice(0, cut[0][0]).trim(),
    rows: cut.map(function (c, i) {
      var x = t.slice(c[1], i + 1 < cut.length ? cut[i + 1][0] : t.length).trim(),
        d = x.indexOf(". "),
        n = "";
      if (c[3] === ":" && d > 0 && d < 60) {
        n = x.slice(0, d);
        x = x.slice(d + 2);
      }
      return { r: c[2], n: n, t: x };
    }),
  };
}
// One stat-block entry (name + text) -> data: kind (atk / save / multi / spell / text), attack bonus, save DC, damage parts, limits (recharge, X/Day), riders.
function parseAct(name, text, sec, others) {
  var t = String(text || ""),
    n = String(name || ""),
    p = {
      raw: n,
      n: n,
      sec: sec || "a",
      cost: sec === "l" ? 1 : 0,
      rech: null,
      uses: null,
      tag: "",
      kind: "other",
      dmg: [],
      conds: [],
      ok: true,
    };
  var paren = n.match(/\s*\(([^)]*)\)\s*$/);
  if (paren) {
    var q = paren[1],
      r;
    if ((r = q.match(/^Recharge (\d)(?:-6)?$/i))) p.rech = r[1] === "6" ? "6" : r[1] + "–6";
    else if (/^Recharge after a (Short or )?Long Rest$/i.test(q)) p.rech = "rest";
    else if ((r = q.match(/^(\d+)\/Day$/i))) p.uses = { n: +r[1], per: "Day" };
    else if ((r = q.match(/^Costs? (\d) Actions?$/i))) p.cost = +r[1];
    else p.tag = q;
    if (p.rech || p.uses || (sec === "l" && /^Costs?/i.test(q)) || p.tag) p.n = n.slice(0, paren.index).trim();
  }
  if (
    sec === "l" &&
    /can't take this action again until the start of its next turn|can’t take this action again until the start of its next turn/i.test(t)
  )
    p.once = true;
  var tb = pTable(t);
  if (tb) p.table = tb;
  if (/^Legendary Action Uses$/i.test(p.n)) {
    p.kind = "info";
    var lu = t.match(/^(\d+)(?: \((\d+) in Lair\))?/);
    if (lu) {
      p.la = +lu[1];
      p.lair = lu[2] ? +lu[2] : null;
    }
    return p;
  }
  var am = t.match(
    /^(Melee or Ranged|Melee|Ranged) (?:Attack Roll|Weapon Attack|Spell Attack):\s*([+−-]\d+)(?:,\s*(?:reach (\d+) ft\.)?(?: or )?(?:range ([\d/]+) ft\.)?)?/i,
  );
  var sm = t.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:\s*DC (\d+)(?:,\s*([^.]*))?/);
  if (/^Multiattack/i.test(p.n)) {
    p.kind = "multi";
    p.multi = pMulti(t, others || []);
    p.ok = p.multi.refs.length > 0;
    return p;
  }
  if (/^Spellcasting/i.test(p.n)) {
    p.kind = "spell";
    p.spells = pSpells(t);
    var dc = t.match(/spell save DC (\d+)/);
    if (dc) p.dc = +dc[1];
    var ab2 = t.match(/([+−-]\d+) to hit with spell attacks/);
    if (ab2) p.sat = +ab2[1].replace("−", "-");
    if (!p.spells.length) {
      var c1 = t.match(/casts ([A-Z][\w’' ]+?)(?: \(|,| twice| once|$)/);
      if (c1) p.spells = [{ per: "", n: 0, list: [c1[1].trim()] }];
    }
    p.ok = p.spells.length > 0;
    return p;
  }
  if (am) {
    p.kind = "atk";
    p.atk = { type: am[1].toLowerCase(), bonus: +am[2].replace("−", "-"), reach: am[3] ? +am[3] : null, range: am[4] || null };
    var hit = (t.split(/Hit:/)[1] || "").split(/Miss:|Hit or Miss:/)[0];
    p.dmg = pDmg(hit);
    p.conds = pConds(hit);
    var mi = t.match(/(?:Miss|Hit or Miss):\s*([^]*)$/);
    if (mi) {
      p.miss = mi[1].trim();
      p.missDmg = pDmg(p.miss);
    }
    var e = hit.match(/escape DC (\d+)/i);
    if (e) p.esc = +e[1];
    var hs = hit.match(
      /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:? DC (\d+)|DC (\d+) (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/,
    );
    if (hs) p.rider = { ab: ABN[hs[1] || hs[4]], dc: +(hs[2] || hs[3]) };
    p.ok = p.dmg.length > 0 || p.conds.length > 0;
    if (p.ok && !p.dmg.length) p.textOnly = true;
    return p;
  }
  if (sm) {
    p.kind = "save";
    p.save = { ab: ABN[sm[1]], dc: +sm[2], area: (sm[3] || "").trim() };
    var fl = t.match(/(?:First )?Failure(?: or Success)?:\s*([^]*?)(?=(?:Success|Failure|First Failure|Second Failure):|$)/);
    var sc = t.match(/(?:^|[.\s])Success:\s*([^]*?)(?=(?:Failure|First Failure|Second Failure):|$)/);
    var both = t.match(/Failure or Success:\s*([^]*?)(?=(?:Failure|Success):|$)/);
    var ft = fl ? fl[1] : "";
    p.fail = { dmg: pDmg(ft), conds: pConds(ft) };
    p.succ = sc ? (/^Half damage/i.test(sc[1].trim()) ? "half" : sc[1].trim()) : null;
    if (both) p.both = both[1].trim();
    p.dmg = p.fail.dmg;
    p.conds = p.fail.conds;
    var sf = t.match(/Second Failure:\s*([^]*?)(?=(?:Success|Failure|Third Failure):|$)/),
      nx = sf
        ? pConds(sf[1]).filter(function (x) {
            return p.fail.conds.indexOf(x) < 0 && x !== "Incapacitated";
          })
        : [];
    var fc = p.fail.conds.filter(function (x) {
      return x !== "Incapacitated";
    });
    if (nx.length && fc.length) p.stage = { from: fc[0], to: nx[0], need: 1, rm: /instead/i.test(sf[1]) };
    else if (fc.length && /repeats? the save at the end of each of its turns/i.test(ft)) p.stage = { from: fc[0], to: null, need: 1 };
    if (fc.length && /until it takes damage|ends if the target takes damage|ends if it takes damage/i.test(ft)) p.dend = fc;
    p.ok = !!fl || !!both;
    if (!p.dmg.length && !p.conds.length) p.textOnly = true;
    return p;
  }
  var cs = t.match(/\bcasts ([A-Z][A-Za-z’' ]+?)(?: \(level \d+ version\))?(?:,| on | in | or |\.| requiring| using|$)/);
  if (cs) {
    p.kind = "cast";
    p.cast = [cs[1].trim()];
    var or = t.match(/\bcasts [A-Z][A-Za-z’' ]+? or ([A-Z][A-Za-z’' ]+?)(?: in |,|\.| requiring)/);
    if (or) p.cast.push(or[1].trim());
  }
  p.dmg = pDmg(t);
  p.conds = pConds(t);
  var sv2 = t.match(
    /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:? DC (\d+)|DC (\d+) (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/,
  );
  if (sv2) p.rider = { ab: ABN[sv2[1] || sv2[4]], dc: +(sv2[2] || sv2[3]) };
  return p;
}
// Multiattack: which actions it uses and how many times. refs = [{name, count, any}] in text order.
function pMulti(t, others) {
  var names = others
    .map(function (o) {
      return o.n;
    })
    .filter(function (x) {
      return x && !/^Multiattack/i.test(x);
    })
    .sort(function (a, b) {
      return b.length - a.length;
    });
  var refs = [],
    low = t,
    seen = {},
    blank = function (a, b) {
      low = low.slice(0, a) + Array(b - a + 1).join("#") + low.slice(b);
    };
  var anyM = t.match(/makes (\w+) attacks?,? using ([^.]*?) in any combination/i);
  if (anyM) {
    var k = WNUM[anyM[1].toLowerCase()] || +anyM[1] || 1,
      set = names
        .filter(function (x) {
          return anyM[2].indexOf(x) >= 0;
        })
        .sort(function (a, b) {
          return anyM[2].indexOf(a) - anyM[2].indexOf(b);
        });
    if (set.length) {
      refs.push({ names: set, count: k, any: true, at: anyM.index, end: anyM.index + anyM[0].length });
      set.forEach(function (x) {
        seen[x] = 1;
      });
      blank(anyM.index, anyM.index + anyM[0].length);
    }
  }
  names.forEach(function (x) {
    if (seen[x]) return;
    var i = low.indexOf(x);
    if (i < 0) return;
    var bef = low.slice(Math.max(0, i - 14), i),
      cm = bef.match(/(\w+) $/),
      w = cm && cm[1].toLowerCase(),
      cnt = WNUM[w] && w !== "twice" ? WNUM[w] : cm && /^\d+$/.test(cm[1]) ? +cm[1] : 1;
    var aft = t.slice(i + x.length, i + x.length + 14),
      end = i + x.length;
    if (/^ twice/.test(aft)) cnt = 2;
    else if (/^ three times/.test(aft)) cnt = 3;
    var am = aft.match(/^ attacks?/);
    if (am) end += am[0].length;
    var sent = t.slice(0, i).split(/\.\s/).pop();
    var rf = sent.match(/\breplace (?:the|one|a) ([A-Z][\w’' -]*?) attack/);
    refs.push({
      names: [x],
      count: cnt,
      at: i,
      end: end,
      rep: /\breplace\b[^.]*\bwith\b/i.test(sent),
      repFor: rf ? rf[1] : null,
      opt: /if available/i.test(t.slice(i, i + x.length + 40).split(/\./)[0]) || /\bcan use\b/i.test(sent.slice(-40)),
    });
    seen[x] = 1;
    blank(i, i + x.length);
  });
  if (/use Spellcasting|uses Spellcasting|Spellcasting to cast/i.test(t) && !seen.Spellcasting) {
    var si = t.indexOf("Spellcasting");
    refs.push({ names: ["Spellcasting"], count: 1, at: si, end: si + 12, rep: /replace/i.test(t), opt: true });
  }
  refs.sort(function (a, b) {
    return a.at - b.at;
  });
  // "X or Y", "X, Y, or Z", "… attacks, or it makes three …": alternatives to the previous entry
  for (var r = 1; r < refs.length; r++) {
    var gap = t.slice(refs[r - 1].end, refs[r].at);
    if (
      (!refs[r].rep && /(^|\s|,)or\b/.test(gap) && !/[.]/.test(gap)) ||
      (/^,\s*$/.test(gap) && /,? or /.test(t.slice(refs[r].end, refs[r].end + 60)) && r + 1 < refs.length)
    )
      refs[r].alt = true;
  }
  refs.forEach(function (r) {
    delete r.at;
    delete r.end;
  });
  return { refs: refs, text: t };
}
// Parsed entries per monster (cached on the monster object)
function actsOf(m) {
  if (m._acts) return m._acts;
  var all = [];
  [
    ["a", m.actions],
    ["b", m.bonus],
    ["r", m.react],
    ["l", m.leg],
  ].forEach(function (g) {
    (g[1] || []).forEach(function (e, i) {
      all.push({ sec: g[0], i: i, e: e });
    });
  });
  var base = all.map(function (x) {
    return { n: x.e[0].replace(/\s*\([^)]*\)\s*$/, "") };
  });
  m._acts = all.map(function (x) {
    var p = parseAct(x.e[0], x.e[1], x.sec, base);
    p.i = x.i;
    p.key = x.sec + x.i;
    return p;
  });
  return m._acts;
}
// ---- Stage B: cards built from the parsed actions (turn card and stat block share these) ----
var SECF = { a: "actions", b: "bonus", r: "react", l: "leg" };
function rawOf(m, p) {
  return ((m[SECF[p.sec]] || [])[p.i] || ["", ""])[1];
}
function limHTML(p) {
  var h = "";
  if (p.uses) h += '<span class="lim">' + p.uses.n + "/Day</span>";
  if (p.rech) h += '<span class="lim">' + (p.rech === "rest" ? "Recharge on rest" : "Recharge " + p.rech) + "</span>";
  if (p.cost > 1) h += '<span class="lim">Costs ' + p.cost + "</span>";
  if (p.once) h += '<span class="lim">Once per round</span>';
  if (p.tag) h += '<span class="lim lt">' + esc(p.tag) + "</span>";
  return h;
}
// Spellcasting on a card: the spells of a monster grouped by uses (At Will, 1/Day...) as tappable buttons.
function spellsHTML(p, txt, c) {
  if (
    !p.spells.length ||
    p.spells.some(function (g) {
      return !g.per;
    })
  )
    return blk(rich(txt));
  var lk = function (l, g) {
    if (c && !g.n)
      return l
        .map(function (sp) {
          var nm2 = sp.replace(/\s*\(.*$/, ""),
            r = rich("cast: " + sp).slice(6);
          return (
            '<span class="spc">' +
            r +
            (RO
              ? ""
              : '<button class="spcast" data-act="cast" data-aw="1" data-i="' +
                p.key +
                '" data-s="' +
                esc(nm2) +
                '" data-full="' +
                esc(sp) +
                '" aria-label="Cast ' +
                esc(nm2) +
                '">\u25b8</button>') +
            "</span>"
          );
        })
        .join("");
    if (!c || !g.n) return rich("cast: " + l.join(", ")).slice(6);
    return l
      .map(function (sp) {
        var nm2 = sp.replace(/\s*\(.*$/, ""),
          u = (c.uses || {})["sp:" + nm2] || 0,
          left = g.n - u,
          pp = "";
        for (var i = 0; i < g.n; i++)
          pp +=
            '<button class="pip' +
            (i < left ? " on" : "") +
            '" data-act="cast" data-i="' +
            p.key +
            '" data-s="' +
            esc(nm2) +
            '" data-full="' +
            esc(sp) +
            '" aria-label="' +
            (i < left ? "Cast " : "Restore ") +
            esc(nm2) +
            '"></button>';
        var r = rich("cast: " + sp).slice(6);
        return '<span class="spc' + (left <= 0 ? " out" : "") + '">' + (left <= 0 ? "<s>" + r + "</s>" : r) + pp + "</span>";
      })
      .join("");
  };
  return (
    (p.dc || p.sat != null
      ? '<div class="sgh">' +
        (p.dc ? 'Spell save <span class="dcx">DC ' + p.dc + "</span>" : "") +
        (p.sat != null ? ' \u00b7 <span class="hit">' + sgn(p.sat) + "</span> to hit" : "") +
        "</div>"
      : "") +
    p.spells
      .map(function (g) {
        return '<div class="sg"><b>' + esc(g.per) + "</b> " + lk(g.list, g) + "</div>";
      })
      .join("")
  );
}
// Stat block only: which actions a Multiattack nests (its referenced actions in the same section, except Spellcasting and roll tables)
function nestOf(A, p) {
  var out = [];
  if (p.kind !== "multi") return out;
  p.multi.refs.forEach(function (r) {
    r.names.forEach(function (n) {
      var q = A.find(function (x) {
        return x.sec === p.sec && x.n === n && x.kind !== "multi" && x.kind !== "spell" && !x.table;
      });
      if (q && out.indexOf(q) < 0) out.push(q);
    });
  });
  return out;
}
function openSpell(n) {
  if (!ui.refBack) ui.refBack = ui.drawer ? S.tab : "close";
  ui.drawer = true;
  S.tab = "ref";
  ui.ref = n;
}
var LVN = ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
// Spells & Conditions tab: search and filters, the list, and one entry (spell, condition or equipment item) when it is open.
function refHTML() {
  refLoad();
  if (REF.loading) return '<p class="muted">Loading rules…</p>';
  if (REF.err) return '<p class="muted">Could not load reference.json.</p>';
  if (ui.ref) {
    var cd = REF.conditions[ui.ref];
    var back =
      '<div class="row"><button data-act="refback">◂ ' +
      (ui.refBack === "stat" ? "Stat block" : ui.refBack === "close" ? "Close" : "Back") +
      "</button></div>";
    if (cd)
      return (
        back +
        "<h3>" +
        esc(ui.ref) +
        "</h3>" +
        esc(cd)
          .replace(/\n \* /g, "<br>• ")
          .replace(/\n/g, "<br>")
      );
    var it =
      !REF.spells.some(function (z) {
        return z.n === ui.ref;
      }) &&
      (REF.items || []).find(function (z) {
        return z.n === ui.ref;
      });
    if (it) {
      var itx = it.tx
        .split("\n")
        .filter(function (l) {
          return !/^\|[-| ]+\|$/.test(l);
        })
        .map(function (l) {
          return l[0] === "|"
            ? l
                .replace(/^\||\|$/g, "")
                .split("|")
                .map(function (q) {
                  return q.trim();
                })
                .join(" \u2014 ")
            : l;
        })
        .join("\n");
      return (
        back +
        "<h3>" +
        esc(itemName(it.n)) +
        "</h3><p><i>" +
        esc(it.cat.replace(/-/g, " ")) +
        (it.r ? ", " + esc(it.r.replace(/-/g, " ")) : "") +
        (it.cost ? " \u00b7 " + esc(it.cost) : "") +
        "</i></p><p>" +
        rich(itx).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") +
        "</p>" +
        (ITEMFX[it.n] ? '<p class="muted">Tap it under Consumables on a player\u2019s turn card to apply it with targets.</p>' : "")
      );
    }
    var x = REF.spells.find(function (z) {
      return z.n === ui.ref;
    });
    if (x) {
      // Both editions of a spell: the switch starts on the default for player spells (S.pcEd) and stays where it is put (ui.refEd)
      var x14 = REF.by14 && REF.by14[spKey(x.a || x.n)],
        red = x.ed === "2014" || (x14 && (ui.refEd || S.pcEd) === "2014") ? "2014" : "2024",
        edSeg =
          x14 && x.ed !== "2014"
            ? '<div class="seg refed"><b>Rules</b>' +
              [
                ["2024", "5.2 (2024)"],
                ["2014", "5.1 (2014)"],
              ]
                .map(function (o) {
                  return '<button data-act="refed" data-v="' + o[0] + '" class="' + (red === o[0] ? "on" : "") + '">' + o[1] + "</button>";
                })
                .join("") +
              "</div>"
            : "";
      if (red === "2014" && x14) x = x14;
      var cap = function (t) {
        return t.charAt(0).toUpperCase() + t.slice(1);
      };
      return (
        back +
        "<h3>" +
        esc(x.n) +
        "</h3>" +
        edSeg +
        "<p><i>" +
        (x.l ? LVN[x.l] + "-level " + esc(x.sc) : cap(esc(x.sc)) + " cantrip") +
        (x.ri ? " (ritual)" : "") +
        "</i></p>" +
        "<p><b>Casting time</b> " +
        esc(cap(x.t)) +
        " · <b>Range</b> " +
        esc(x.r) +
        "<br><b>Components</b> " +
        esc(x.c) +
        "<br><b>Duration</b> " +
        (x.cn ? "Concentration, " : "") +
        esc(x.d) +
        "</p>" +
        (x.sv || x.at || x.dt.length
          ? "<p>" +
            (x.sv ? "<b>Save</b> " + esc(cap(x.sv)) + " " : "") +
            (x.at ? "<b>Spell attack</b> " : "") +
            (x.dt.length ? "<b>Damage</b> " + esc(x.dr) + " " + esc(x.dt.join(", ")) : "") +
            "</p>"
          : "") +
        "<p>" +
        rich(x.tx).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") +
        "</p>" +
        (x.hl ? "<p><b>" + (x.l ? "Using a Higher-Level Spell Slot." : "Cantrip Upgrade.") + "</b> " + rich(x.hl) + "</p>" : "") +
        (x.a ? '<p class="muted">Another name for the spell ' + esc(x.a) + ".</p>" : "") +
        (x.src ? '<p class="muted">Source: your file ' + esc(x.src) + ".</p>" : "") +
        (x.ed === "2014"
          ? '<p class="muted">Source: SRD 5.1 (2014 rules)' +
            (edSeg ? "" : "; this spell has no 2024 version under the same name") +
            ".</p>"
          : "") +
        '<p class="muted">Classes: ' +
        esc(x.cl.map(cap).join(", ")) +
        "</p>"
      );
    }
  }
  var q = (ui.rq || "").toLowerCase(),
    lv = ui.rl == null ? "" : ui.rl,
    cl = ui.rc || "",
    rk = ui.rk || "";
  var C = Object.keys(REF.conditions).filter(function (k) {
    return (!rk || rk === "cond") && !lv && !cl && (!q || k.toLowerCase().indexOf(q) >= 0);
  });
  var SP = REF.spells.filter(function (x) {
    return (
      (x.a ? q && x.n.toLowerCase().indexOf(q) >= 0 : !q || x.n.toLowerCase().indexOf(q) >= 0) &&
      (lv === "" || x.l === +lv) &&
      (!cl || x.cl.indexOf(cl) >= 0) &&
      (!rk || rk === "spell")
    );
  });
  var cls = ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"];
  return (
    '<input class="search" id="refq" type="search" placeholder="Search spells, conditions and equipment" value="' +
    esc(ui.rq || "") +
    '" aria-label="Search rules">' +
    '<div class="flt">' +
    selHTML(
      "rk",
      "rk",
      "Everything",
      [
        ["spell", "Spells"],
        ["cond", "Conditions"],
        ["item", "Equipment"],
      ],
      rk,
    ) +
    selHTML(
      "rl",
      "rl",
      "All levels",
      LVN.map(function (n, i) {
        return [String(i), n];
      }),
      lv,
    ) +
    selHTML(
      "rc",
      "rc",
      "All classes",
      cls.map(function (c) {
        return [c, c.charAt(0).toUpperCase() + c.slice(1)];
      }),
      cl,
    ) +
    "</div>" +
    '<div class="refl" id="refl">' +
    refList(C, SP) +
    "</div>"
  );
}
refLoad();
// The list part of the Spells & Conditions tab for the current search and filters (conditions, spells, equipment).
function refList(C, SP) {
  // Equipment: everything when "Equipment" is picked, otherwise only on a search (so the default list stays conditions + spells)
  var q = (ui.rq || "").toLowerCase(),
    rk = ui.rk || "",
    IT =
      (rk === "item" || (!rk && q)) && (ui.rl == null || ui.rl === "") && !ui.rc
        ? (REF.items || []).filter(function (x) {
            return !q || x.n.toLowerCase().indexOf(q) >= 0 || itemName(x.n).toLowerCase().indexOf(q) >= 0;
          })
        : [];
  var ih =
    IT.slice(0, 120)
      .map(function (x) {
        return (
          '<button data-act="ref" data-n="' +
          esc(x.n) +
          '"><b>' +
          esc(itemName(x.n)) +
          "</b> <small>" +
          esc(x.cat.replace(/-/g, " ")) +
          (x.cost ? " \u00b7 " + esc(x.cost) : "") +
          (x.r ? " \u00b7 " + esc(x.r.replace(/-/g, " ")) : "") +
          "</small></button>"
        );
      })
      .join("") + (IT.length > 120 ? '<p class="muted">' + (IT.length - 120) + " more, narrow the search.</p>" : "");
  if (rk === "item") return ih || '<p class="muted">Nothing found.</p>';
  var h = C.map(function (k) {
    return '<button data-act="ref" data-n="' + esc(k) + '"><b>' + esc(k) + "</b> <small>condition</small></button>";
  }).join("");
  h += SP.slice(0, 80)
    .map(function (x) {
      return (
        '<button data-act="ref" data-n="' +
        esc(x.n) +
        '"><b>' +
        esc(x.n) +
        "</b> <small>" +
        (x.l ? LVN[x.l] : "cantrip") +
        " · " +
        esc(x.t) +
        (x.cn ? " · conc." : "") +
        (x.sv ? " · " + esc(x.sv.slice(0, 3)) + " save" : "") +
        "</small></button>"
      );
    })
    .join("");
  if (SP.length > 80) h += '<p class="muted">' + (SP.length - 80) + " more, narrow the search.</p>";
  h += ih;
  return h || '<p class="muted">Nothing found.</p>';
}
function renderDrawer() {
  var dr = $("#drawer");
  dr.hidden = !ui.drawer;
  document.body.classList.toggle("drawon", ui.drawer);
  if (!ui.drawer) return;
  // Two menus share the drawer: the Add menu (+ Add) and the Defences menu (🛡, ui.dmode='def'). Each keeps its own tab bar,
  // so Stat block / Edit opened from Defences come back to Defences.
  if (ui.dmode === "def" && ["def", "stat", "edit", "ref"].indexOf(S.tab) < 0) ui.dmode = "add"; // a tab the Defences menu doesn't have: back to the Add menu
  var tb = function (t, lab) {
      return '<button class="tab' + (S.tab === t ? " on" : "") + '" data-act="tab" data-t="' + t + '">' + lab + "</button>";
    },
    hasEd = S.edit != null && findC(S.edit);
  var cls = '<button data-act="close" class="cls" aria-label="Close panel"><span class="tx">Close</span><span class="ic">✕</span></button>';
  var bar =
    ui.dmode === "def"
      ? tb("def", "Defences") + tb("stat", "Stat block") + (hasEd ? tb("edit", "Edit") : "") + tb("ref", "Spells") + cls
      : tb("add", "Add") +
        tb("stat", "Stat block") +
        (hasEd ? tb("edit", "Edit") : "") +
        tb("ref", '<span class="lg">Spells &amp; Conditions</span><span class="sh">Spells</span>') +
        tb("data", "Data") +
        cls;
  dr.innerHTML =
    '<div class="dtop"><div class="dh' +
    (ui.dmode !== "def" && hasEd ? " many" : "") +
    '">' +
    bar +
    "</div>" +
    (S.tab === "add" ? addTopHTML() : "") +
    "</div>" +
    (S.tab === "def"
      ? defHTML()
      : S.tab === "add"
        ? addPanelHTML()
        : S.tab === "ref"
          ? refHTML()
          : S.tab === "data"
            ? dataHTML()
            : S.tab === "edit"
              ? editHTML()
              : statHTML());
}
// A grapple ends when the grappler is gone, at 0 HP or Incapacitated
function grabSweep() {
  S.list.forEach(function (t) {
    if (t.gb == null) return;
    if (t.conds.indexOf("Grappled") < 0) {
      delete t.gb;
      delete t.gdc;
      return;
    }
    var g = findC(t.gb);
    if (!g || g.hp <= 0 || g.conds.indexOf("Incapacitated") >= 0) {
      t.conds.splice(t.conds.indexOf("Grappled"), 1);
      delete t.gb;
      delete t.gdc;
      incSync(t, false);
      toast(esc(t.name) + " is no longer Grappled" + (g ? " (" + esc(g.name) + " can\u2019t hold on)" : ""));
    }
  });
}
function renderBoard() {
  if (NETV) {
    renderAnn();
    renderBar();
    renderStrip();
    renderMe();
    return;
  }
  if (!RO) {
    ccSweep();
    S.list.forEach(linkSweep);
    grabSweep();
  }
  renderAnn();
  renderBar();
  renderStrip();
  renderTurn();
  renderTable();
  renderPad();
}
function renderAll() {
  document.body.classList.toggle("present", ui.present);
  renderBoard();
  renderDrawer();
}
// D&D Beyond import (dndbeyond.json, written by the GitHub workflow). New characters are added; a character already in the
// library (same D&D Beyond id, or same name) is updated field by field: empty fields fill in, differences wait in ui.merge
// for Keep / Use D&D Beyond. A kept value is remembered so the same difference isn't asked again.
var DDBF = [
  ["ac", "AC"],
  ["hp", "Max HP"],
  ["ib", "Initiative bonus"],
  ["lvl", "Level"],
  ["str", "STR"],
  ["dex", "DEX"],
  ["con", "CON"],
  ["int", "INT"],
  ["wis", "WIS"],
  ["cha", "CHA"],
  ["saves", "Saving throws"],
  ["adv", "Save advantage"],
  ["res", "Resistances"],
  ["imm", "Immunities"],
  ["vul", "Vulnerabilities"],
  ["cimm", "Condition immunities"],
  ["pp", "Passive Perception"],
  ["cls", "Class"],
  ["race", "Species"],
];
function ddbVal(p, k) {
  var A = AK;
  if (A.indexOf(k) >= 0) return p.abilities ? p.abilities[k] : null;
  return {
    ac: p.ac,
    hp: p.hp,
    ib: p.initMod,
    lvl: p.level,
    saves: p.saves,
    adv: { a: (p.advSaves || []).slice().sort(), n: p.advNote || "" },
    res: p.resist,
    imm: p.immune,
    vul: p.vulnerable,
    cimm: p.condImmune,
    pp: p.passivePerception,
    cls: p.classes,
    race: p.race,
  }[k];
}
function libVal(l, k) {
  var A = AK;
  if (A.indexOf(k) >= 0) return l.abil ? l.abil[k] : null;
  if (k === "adv") return l.adv ? { a: l.adv.slice().sort(), n: l.advNote || "" } : null;
  return l[k];
}
function ddbShow(k, v) {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  if (k === "saves")
    return AK.map(function (a) {
      return a.toUpperCase() + " " + (v[a] == null ? "?" : sgn(v[a]));
    }).join(" ");
  if (k === "adv")
    return (
      (v.a.length
        ? v.a
            .map(function (a) {
              return a.toUpperCase();
            })
            .join(", ")
        : "none") + (v.n ? " (" + v.n + ")" : "")
    );
  return "" + v;
}
function ddbSet(l, k, v, p) {
  var A = AK;
  if (A.indexOf(k) >= 0) {
    l.abil = Object.assign({}, l.abil || {});
    l.abil[k] = v;
  } else if (k === "adv") {
    l.adv = v.a.slice();
    l.advNote = v.n;
  } else if (DEFK.indexOf(k) >= 0) l[k] = uniq(v.concat(l["x" + k] || []));
  else {
    l[k] = v;
    if (k === "ac") l.chk = false;
    if (k === "hp") l.hpMan = true;
    if (k === "saves" && p) l.saveProf = (p.saveProf || []).slice();
  }
  if (l.keep) delete l.keep[k];
}
// Merge dndbeyond.json into the library: new characters are added, known ones updated field by field; returns the message to show.
function ddbUpdate(P) {
  var nw = 0,
    up = 0;
  ui.merge = (ui.merge || []).filter(function () {
    return false;
  });
  P.forEach(function (p) {
    var l =
      S.lib.find(function (x) {
        return x.ddb === p.id;
      }) ||
      (p.kanka
        ? S.lib.find(function (x) {
            return x.k === p.kanka;
          })
        : null) ||
      S.lib.find(function (x) {
        return !x.ddb && x.name.toLowerCase() === p.name.toLowerCase();
      });
    if (!l) {
      l = { id: "l" + S.libNext++, name: p.name, ac: 10, hp: 10, ib: 0 };
      S.lib.push(l);
      nw++;
      DDBF.forEach(function (f) {
        var v = ddbVal(p, f[0]);
        if (v != null) ddbSet(l, f[0], v, p);
      });
    } else {
      up++;
      DDBF.forEach(function (f) {
        var k = f[0],
          v = ddbVal(p, k),
          c = libVal(l, k),
          J = JSON.stringify;
        if (v == null) return;
        if (c == null || c === "") {
          ddbSet(l, k, v, p);
          return;
        }
        var n = function (x) {
          return Array.isArray(x) ? x.slice().sort() : x;
        };
        if (J(n(c)) === J(n(v)) || (l.keep && l.keep[k] === J(v))) return;
        ui.merge.push({ l: l.id, k: k, lab: f[1], cur: ddbShow(k, c), nw: ddbShow(k, v), v: v, p: p });
      });
    }
    l.ddb = p.id;
    l.durl = p.url;
    if (p.parsed && p.parsed.length) l.parsed = p.parsed;
    l.speed = p.speed;
    l.senses = p.senses;
    l.spells = p.spells || [];
    l.items = p.items || [];
    l.acNote = p.acNote || "";
    if (!l.saveProf) l.saveProf = (p.saveProf || []).slice();
  });
  S.lib.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  return (
    nw +
    " new, " +
    up +
    " updated from D&D Beyond." +
    (ui.merge.length ? " " + ui.merge.length + " difference" + (ui.merge.length > 1 ? "s" : "") + " to check above." : "")
  );
}
function ddbPick(i, use) {
  var m = ui.merge[i];
  if (!m) return;
  var l = S.lib.find(function (x) {
    return x.id === m.l;
  });
  if (l) {
    if (use) ddbSet(l, m.k, m.v, m.p);
    else {
      l.keep = l.keep || {};
      l.keep[m.k] = JSON.stringify(m.v);
    }
  }
  ui.merge.splice(i, 1);
}
function mergeHTML() {
  var M = ui.merge || [];
  if (!M.length) return "";
  return (
    '<div class="cx"><h3>D&amp;D Beyond differs (' +
    M.length +
    ')</h3><div class="row"><button data-act="mall" data-v="1" style="flex:1">Use D&amp;D Beyond for all</button><button data-act="mall" data-v="0" style="flex:1">Keep all</button></div>' +
    M.map(function (m, i) {
      var l =
        S.lib.find(function (x) {
          return x.id === m.l;
        }) || {};
      return (
        '<div class="lib"><span class="grow"><b>' +
        esc(l.name || "?") +
        "</b> · " +
        esc(m.lab) +
        '<br><span class="meta">Now: ' +
        esc(m.cur) +
        "<br>D&amp;D Beyond: " +
        esc(m.nw) +
        '</span></span><button data-act="mkeep" data-i="' +
        i +
        '">Keep</button><button data-act="muse" data-i="' +
        i +
        '">Use</button></div>'
      );
    }).join("") +
    "</div>"
  );
}
function khpDiff(l) {
  return !!(l.k && l.hpEst && l.hp !== l.hpEst);
}
function parseChar(t) {
  var name = t.split(",")[0].trim();
  if (!name) return null;
  var ac = (t.match(/AC\s*(\d+)/i) || [])[1],
    hp = (t.match(/HP\s*(\d+)/i) || [])[1],
    ini = (t.match(/init\w*\s*([+-]?\d+)/i) || [])[1],
    lv = (t.match(/(?:lvl|level|lv)\s*(\d+)/i) || [])[1];
  return { name: name, ac: ac ? +ac : null, hp: hp ? +hp : null, ib: ini ? +ini : 0, lvl: lv ? Math.min(20, +lv) : null };
}
function findC(id) {
  return S.list.find(function (x) {
    return x.id === +id;
  });
}
// Stat block tab follows the table: the most recently tapped selected creature, else the last one selected.
function statPick() {
  var id = ui.sel[ui.lastSel] ? ui.lastSel : Object.keys(ui.sel)[0] || ui.lastSel,
    c = id != null && findC(id);
  if (!c || c.kind === "fx") return;
  S.stat = c.kind === "mon" ? c.monId : "pc";
  S.statC = c.id;
}
function pruneSel() {
  Object.keys(ui.sel).forEach(function (k) {
    if (!findC(k)) delete ui.sel[k];
  });
}
// Pad summary: everything one Apply will do (amount in the chosen mode, half, max HP, statuses on/off)
// Two amount slots: main and extra. ui.amt / ui.dtype always hold the slot being edited, ui.amtO / ui.dtO the other one.
function slot(i) {
  return i === (ui.ax || 0) ? { v: ui.amt || 0, dt: ui.dtype || "" } : { v: ui.amtO || 0, dt: ui.dtO || "" };
}
function swapSlot(i) {
  if (i === (ui.ax || 0)) return;
  var v = ui.amt,
    d = ui.dtype;
  ui.amt = ui.amtO || 0;
  ui.dtype = ui.dtO || "";
  ui.amtO = v;
  ui.dtO = d;
  ui.ax = i;
}
function padSlots() {
  return [slot(0)].concat(ui.ex ? [slot(1)] : []).filter(function (x) {
    return x.v > 0;
  });
}
function padSum(pk) {
  var SL = padSlots(),
    p = [],
    h = function (n) {
      return ui.half ? Math.floor(n / 2) : n;
    },
    D = SL.filter(function (x) {
      return !SPEC[x.dt];
    });
  if (D.length)
    p.push(
      D.map(function (x) {
        return h(x.v) + (x.dt ? " " + x.dt : "");
      }).join(" + ") +
        " damage" +
        (ui.half ? " (half)" : "") +
        (ui.mx ? " and max HP" : ""),
    );
  SL.forEach(function (x) {
    if (x.dt === "heal") p.push("heal " + x.v);
    else if (x.dt === "temp") p.push(x.v + " temp HP");
    else if (x.dt === "maxhp") p.push("max HP \u2212" + x.v);
  });
  pk.forEach(function (k) {
    p.push((ui.pend[k] ? "+ " : "\u2212 ") + nm(k));
  });
  return p.map(esc).join(" \u00b7 ");
}
function applyPend(T) {
  var skip = [],
    fx = curFx();
  Object.keys(ui.pend).forEach(function (x) {
    if (fx && fx.st === x && ui.pend[x]) {
      fxApplyStatus(T, fx).forEach(function (n) {
        skip.push(n + " (" + esc(nm(x)) + ")");
      });
      return;
    }
    T.forEach(function (c) {
      var i = c.conds.indexOf(x);
      if (ui.pend[x] && condBlocked(c, x)) {
        skip.push(esc(c.name) + " (" + esc(nm(x)) + ")");
        return;
      }
      if (ui.pend[x]) {
        if (i < 0) {
          c.conds.push(x);
          expSet(c, x);
          ccSet(c, x);
          linkAdd(c, x);
          if (x === "Shield") c.rx = true;
          if (STG[x]) stgSet(c, x, STG[x], ui.act ? ui.act.d : {}, ui.act ? ui.act.n : nm(x));
        }
      } else if (i >= 0) {
        c.conds.splice(i, 1);
        if (x === "Dead" && c.kind === "pc" && c.hp <= 0 && c.ds && c.ds.f >= 3) c.ds.f = 2;
      }
    });
  });
  T.forEach(function (c) {
    incSync(c, true);
  });
  return skip;
}
function finishPad() {
  var fx = curFx();
  ui.tpk = false;
  ui.dtype = (fx && fx.dt) || "";
  ui.sel = {};
  ui.amt = 0;
  ui.amtO = 0;
  ui.dtO = "";
  ui.ax = 0;
  ui.ex = false;
  ui.menu = false;
  ui.pend = {};
  ui.half = false;
  ui.mx = false;
  if (fx && fx.st) ui.pend[fx.st] = true;
  ui.mq = "";
  ui.confirmRemove = false;
  ui.rv = {};
}
function nextIdExcluding(T) {
  var ids = {};
  T.forEach(function (c) {
    ids[c.id] = true;
  });
  var O = order();
  var idx = O.findIndex(function (c) {
    return c.id === S.turnId;
  });
  for (var k = 1; k <= O.length; k++) {
    var c = O[(idx + k) % O.length];
    if (!ids[c.id] && !isOut(c)) return c.id;
  }
  return null;
}
