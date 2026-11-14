// Encounters app, part 10 of 11: event handlers: every button carries data-act="..."; each area has one click listener.
// ================= 6. EVENT HANDLERS: every button carries data-act="..."; each area has one click listener =================
$("#bar").addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]");
  if (!b) return;
  var a = b.dataset.act;
  if (a === "undo") {
    undo();
  } else if (a === "endc") {
    endSummary();
    logAdd("Combat ended");
    logEnd();
    snap("end combat");
    S.turnId = null;
    S.round = 1;
    S.prevTurn = null;
    ui.legDis = null;
    S.list.forEach(function (c) {
      delete c.exp;
      c.rx = false;
      c.la = 0;
      c.ue = {};
      c.mu = {};
      c.ray = {};
      c.mrep = {};
      c.msp = {};
    });
    toast(
      "Combat ended. Creatures, HP and statuses kept." +
        (S.endSum ? " <b>" + S.endSum.xp + " XP</b>, summary in Data \u2192 Session." : ""),
    );
  } else if (a === "next") {
    snap("next turn");
    nextTurn();
    ui.confirmClear = false;
  } else if (a === "openadd") {
    ui.drawer = true;
    ui.dmode = "add";
    if (S.tab === "def") S.tab = "add";
  } else if (a === "saves") {
    if (ui.drawer && ui.dmode === "def") ui.drawer = false;
    else {
      ui.drawer = true;
      ui.dmode = "def";
      S.tab = "def";
    }
    save();
    renderAll();
    return;
  } else if (a === "sessopen") {
    openData("sess");
    var sb0 = document.querySelector('#drawer [data-act="sesson"]');
    if (sb0) sb0.scrollIntoView();
    return;
  } else if (a === "present") {
    ui.present = !ui.present;
    if (ui.present) ui.drawer = false;
    document.body.classList.toggle("present", ui.present);
    try {
      sessionStorage.setItem("et-present", ui.present ? "1" : "0");
    } catch (e) {}
    renderBoard();
    renderDrawer();
    return;
  } else if (a === "clear") {
    if (ui.confirmClear) {
      snap("clear all");
      S.list = [];
      S.turnId = null;
      S.round = 1;
      S.envName = S.envNote = "";
      S.lair = false;
      S.prevTurn = null;
      ui.confirmClear = false;
      S.atTable = {};
      ui.sel = {};
    } else {
      ui.confirmClear = true;
    }
  }
  save();
  renderBoard();
  renderDrawer();
});
$("#turn").addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]");
  if (!b) return;
  var a = b.dataset.act;
  if (a === "spl") {
    openSpell(b.dataset.n);
    save();
    renderDrawer();
    return;
  }
  var c = findC(S.turnId);
  if (!c) return;
  if (c.kind === "fx") {
    if (a === "fxvis") c.vis = !c.vis;
    else if (a === "fxrm") rmComb(c);
    else if (a === "fxgo") {
      ui.fxRun = c.id;
      ui.dtype = c.dt || "";
      ui.amt = 0;
      ui.amtO = 0;
      ui.dtO = "";
      ui.ax = 0;
      ui.ex = false;
      ui.half = false;
      ui.mx = false;
      ui.pend = {};
      if (c.st) ui.pend[c.st] = true;
      if (c.sv !== "" && c.sv != null) {
        ui.dsv = +c.sv;
      }
      toast("Select who is affected.");
    }
    save();
    renderBoard();
    return;
  }
  if (a === "laspend") {
    var lc = findC(b.dataset.id);
    if (lc) {
      snap("legendary");
      lc.la = (lc.la || 0) + 1;
    }
  } else if (a === "pitem") {
    var d9 = itemData(b.dataset.s, c);
    if (!d9) {
      itemOpen(b.dataset.s);
      return;
    }
    actBegin(c, d9, d9.n, { a: "item" });
    if (d9.self) ui.sel[c.id] = true;
    ui.pcItOpen = true;
  } else if (a === "pitempoi") {
    ui.pcPoi = !ui.pcPoi;
    ui.pcItOpen = true;
    renderTurn();
    return;
  } else if (a === "pitemall") {
    ui.ref = null;
    ui.rq = "";
    ui.rk = "item";
    ui.rl = null;
    ui.rc = "";
    S.tab = "ref";
    if (!ui.drawer) ui.dmode = "add";
    ui.drawer = true;
    renderDrawer();
    return;
  } else if (a === "pcast") {
    var lp2 = libOf(c),
      rr2 = spRef(b.dataset.s, pcEd(lp2)),
      bl2 = rr2 ? rr2.l : 0,
      op2 = bl2 > 0 ? slotFor(c, bl2) : null;
    if (lp2 && bl2 > 0 && slotOpts(c).tracked && !op2) {
      toast(esc(c.name) + ": no spell slot of level " + bl2 + " or higher left");
      return;
    }
    if (lp2 && pcCastBegin(c, b.dataset.s, op2)) ui.pcSpOpen = true;
  } else if (a === "lact") {
    var L0 = findC(b.dataset.id),
      lm0 =
        L0 &&
        MON.find(function (x) {
          return x.id === L0.monId;
        });
    if (lm0) {
      var LA0 = actsOf(lm0),
        lp = LA0.find(function (x) {
          return x.key === b.dataset.i;
        }),
        howL = { a: "leg", i: lp.key };
      var d0 = lp.kind === "atk" || lp.kind === "save" ? lp : null,
        n0 = lp.n,
        rf = d0 ? null : legRef(lm0, LA0, lp);
      if (rf && rf.spell) {
        refLoad();
        d0 = spellData(rf.spell, rf.q);
        n0 = lp.n + " \u2192 " + rf.spell;
      } else if (rf && (rf.q.kind === "atk" || rf.q.kind === "save")) {
        d0 = rf.q;
        n0 = lp.n + (lp.n !== rf.q.n ? " \u2192 " + rf.q.n : "");
        if (rf.cnt > 1) {
          howL.left = rf.cnt;
          howL.tot = rf.cnt;
          n0 += " (1 of " + rf.cnt + ")";
        }
      }
      if (d0) {
        if (d0.spell) spellBegin(L0, d0, n0, howL);
        else actBegin(L0, d0, n0, howL);
      } else if (rf && rf.q.table) {
        ui.legPick = { id: L0.id, i: lp.key, t: rf.q.key };
      } else {
        doHow(L0, howL);
        toast("<b>" + esc(L0.name) + ":</b> " + esc(lp.n) + (rf && rf.q.table ? " \u2014 roll for a ray" : ""));
        logAdd(esc(L0.name) + " \u2014 legendary: " + esc(lp.n));
      }
    }
  } else if (a === "ladis") {
    ui.legDis = S.turnId;
  } else if (a === "lrayx") {
    ui.legPick = null;
  } else if (a === "tick") {
    var k8 = tickOf(b.dataset.c);
    if (k8) {
      ui.act = null;
      finishPad();
      ui.sel = {};
      ui.sel[c.id] = true;
      ui.amt = k8.avg;
      ui.dtype = k8.dt;
      toast(esc(nm(b.dataset.c)) + ": " + esc(c.name) + " selected, adjust to the roll and Apply");
    }
  } else if (a === "slot") {
    var sk = b.dataset.k,
      sn = sk === "p" ? (pcSlots(libOf(c)).pact || {}).n : pcSlots(libOf(c)).slots[sk - 1];
    c.slu = c.slu || {};
    snap("spell slot");
    c.slu[sk] = b.classList.contains("on") ? Math.min(sn, (c.slu[sk] || 0) + 1) : Math.max(0, (c.slu[sk] || 0) - 1);
    if (!c.slu[sk]) delete c.slu[sk];
  } else if (a === "slotr") {
    snap("reset spell slots");
    c.slu = {};
  } else if (a === "stg") {
    stgRoll(c, b.dataset.c, b.dataset.r === "s");
  } else if (a === "lray") {
    var g7 = ui.legPick,
      L7 = g7 && findC(g7.id),
      m7 =
        L7 &&
        MON.find(function (x) {
          return x.id === L7.monId;
        });
    ui.legPick = null;
    if (m7) {
      var A7 = actsOf(m7),
        lp7 = A7.find(function (x) {
          return x.key === g7.i;
        }),
        tb7 = A7.find(function (x) {
          return x.key === g7.t;
        }),
        row7 = tb7 && tb7.table.rows[+b.dataset.r];
      if (lp7 && row7) {
        var d7 = parseAct(row7.n, row7.t, "a"),
          h7 = { a: "leg", i: lp7.key };
        if (d7.kind === "atk" || d7.kind === "save") actBegin(L7, d7, lp7.n + " \u2192 " + row7.n, h7);
        else {
          doHow(L7, h7);
          toast("<b>" + esc(L7.name) + ":</b> " + esc(row7.n) + " \u2014 " + rich(short(row7.t)));
          logAdd(esc(L7.name) + " \u2014 legendary: " + esc(row7.n));
        }
      }
    }
  } else if (a === "tcol") {
    ui.cardOpen = !ui.cardOpen;
  } else if (a === "tinfo") {
    if (!ui.drawer) ui.dmode = "add";
    S.stat = c.kind === "mon" ? c.monId : "pc";
    S.statC = c.id;
    S.tab = "stat";
    ui.drawer = true;
    save();
    renderDrawer();
    return;
  } else if (a === "tedit") {
    if (!ui.drawer) ui.dmode = "add";
    S.edit = c.id;
    S.tab = "edit";
    ui.msg = "";
    ui.drawer = true;
    save();
    renderDrawer();
    return;
  } else if (a === "spent") {
    c.spent = c.spent || {};
    c.spent[b.dataset.i] = !c.spent[b.dataset.i];
  } else if (a === "use" || a === "unuse" || a === "mpip" || a === "ray" || a === "mrep") {
    var how = { a: a, i: b.dataset.i, q: b.dataset.q, d: b.dataset.d, r: b.dataset.r };
    if (!actStart(c, how)) doHow(c, how);
  } else if (a === "cast") {
    var ms = MON.find(function (x) {
      return x.id === c.monId;
    });
    if (ms) {
      var A2 = actsOf(ms),
        ps = A2.find(function (x) {
          return x.key === b.dataset.i;
        }),
        k2 = "sp:" + b.dataset.s,
        P2 = mPools(A2),
        sq = poolOf(P2, "Spellcasting") || repOf(P2, "Spellcasting");
      c.uses = c.uses || {};
      var on2 = b.classList.contains("on") || b.dataset.aw === "1",
        sd = on2 && ps ? spellData(b.dataset.full || b.dataset.s, castSp(A2, ps)) : null,
        how2 = { a: "cast", i: b.dataset.i, s: b.dataset.s, per: b.dataset.aw !== "1" };
      if (sd) {
        if (ps.kind === "cast") {
          how2 = { a: "use", i: ps.key };
        }
        spellBegin(c, sd, sd.n + (sd.lvl ? " (level " + sd.lvl + ")" : ""), how2);
        if (ps.kind === "cast" && /on itself/i.test(rawOf(ms, ps))) ui.sel[c.id] = true;
        save();
        renderBoard();
        return;
      }
      if (b.dataset.aw === "1") {
        doHow(c, how2);
        toast("<b>" + esc(b.dataset.s) + "</b> cast");
        logAdd(esc(c.name) + " casts " + esc(b.dataset.s));
      } else if (b.classList.contains("on")) {
        snap("cast " + b.dataset.s);
        logAdd(esc(c.name) + " casts " + esc(b.dataset.s));
        c.uses[k2] = (c.uses[k2] || 0) + 1;
        c.ue = c.ue || {};
        if (sq && ps && ps.sec === "a") {
          var pq = sq.rep ? repPool(P2, sq) : sq;
          if (c.ue.a === "M" || !c.ue.a) {
            mSpend(c, pq, 1);
            c.msp = c.msp || {};
            c.msp[k2] = (c.msp[k2] || 0) + 1;
            c.mspq = pq.i;
          }
        } else if (ps && !c.ue[ps.sec]) c.ue[ps.sec] = ps.key;
      } else if (c.uses[k2]) {
        snap("restore " + b.dataset.s);
        c.uses[k2]--;
        if (c.msp && c.msp[k2] && P2) {
          c.msp[k2]--;
          mSpend(c, P2[c.mspq || 0], -1);
        }
      }
    }
  } else if (a === "showall") {
    ui.showAll = !ui.showAll;
  } else if (a === "cond") {
    snap("remove " + b.dataset.c);
    var i = c.conds.indexOf(b.dataset.c);
    if (i >= 0) c.conds.splice(i, 1);
    incSync(c, false);
  } else if (a.indexOf("ds") === 0) {
    snap("death save");
    dsAct(c, a, b);
  }
  save();
  renderBoard();
});
$("#turn").addEventListener(
  "toggle",
  function (e) {
    if (e.target.tagName === "DETAILS") {
      if (e.target.classList.contains("geno")) ui.genOpen = e.target.open;
      else if (e.target.classList.contains("pcit")) ui.pcItOpen = e.target.open;
      else if (e.target.classList.contains("pcsp")) ui.pcSpOpen = e.target.open;
      else ui.traitsOpen = e.target.open;
    }
  },
  true,
);
$("#env").addEventListener("click", function (e) {
  if (e.target.closest('[data-act="envx"]')) {
    S.envName = S.envNote = "";
    save();
    renderTable();
  }
});
$("#tbl").addEventListener("click", function (e) {
  if (e.target.closest("input")) return;
  var b = e.target.closest("[data-act]");
  var act = b ? b.dataset.act : null;
  if (act === "start") {
    if (!ui.drawer) ui.dmode = "add";
    ui.drawer = true;
    S.tab = "add";
    S.sub = b.dataset.s;
    ui.msg = "";
    save();
    renderDrawer();
    return;
  }
  if (act === "lair") {
    S.lair = !S.lair;
    save();
    renderBoard();
    return;
  }
  if (act === "viewgrp") {
    if (!ui.drawer) ui.dmode = "add";
    S.stat = b.dataset.m;
    S.statC = null;
    S.tab = "stat";
    ui.drawer = true;
    save();
    renderDrawer();
    return;
  }
  if (act === "selgrp") {
    var g = b.dataset.g;
    S.list.forEach(function (c) {
      if (!isDead(c) && (g === "pc" ? c.kind === "pc" : c.kind === "mon" && gkey(c) === g)) {
        ui.sel[c.id] = true;
        ui.lastSel = ui.lastSel && ui.sel[ui.lastSel] ? ui.lastSel : c.id;
      }
    });
    renderTable();
    renderStrip();
    renderPad();
    return;
  }
  if (act === "revive") {
    var rc = findC(b.dataset.id);
    if (rc) {
      snap("restore " + rc.name);
      rc.hp = rc.fled && rc.fhp ? rc.fhp : 1;
      delete rc.fled;
      delete rc.fhp;
    }
    save();
    renderBoard();
    return;
  }
  if (act === "purge") {
    S.list = S.list.filter(function (c) {
      return !(c.kind === "mon" && gkey(c) === b.dataset.m && isDead(c) && c.id !== S.turnId);
    });
    pruneSel();
    save();
    renderBoard();
    return;
  }
  var row = e.target.closest("tr.r");
  if (!row) return;
  var c = findC(row.dataset.id);
  if (!c) return;
  if (c.kind === "fx") {
    if (act === "fxvis") c.vis = !c.vis;
    else if (act === "fxrm") rmComb(c);
    save();
    renderBoard();
    return;
  }
  if (act === "cond") {
    snap("remove " + b.dataset.c);
    var i = c.conds.indexOf(b.dataset.c);
    if (i >= 0) c.conds.splice(i, 1);
    incSync(c, false);
    save();
    renderBoard();
    return;
  }
  if (act && act.indexOf("ds") === 0) {
    snap("death save");
    dsAct(c, act, b);
    save();
    renderBoard();
    return;
  }
  if (act === "info") {
    if (!ui.drawer) ui.dmode = "add";
    S.stat = c.kind === "mon" ? c.monId : "pc";
    S.statC = c.id;
    S.tab = "stat";
    ui.drawer = true;
    save();
    renderDrawer();
    return;
  }
  if (act === "rx") {
    snap("reaction");
    c.rx = !c.rx;
    save();
    renderBoard();
    return;
  }
  if (act === "pip") {
    snap("legendary");
    var k = b.dataset.k;
    c[k] = (c[k] || 0) + (b.classList.contains("on") ? 1 : -1);
    if (c[k] < 0) c[k] = 0;
    save();
    renderBoard();
    return;
  }
  if (act === "rowst") {
    ui.sel[c.id] = true;
    ui.lastSel = c.id;
    ui.menu = true;
    ui.mq = "";
    ui.confirmRemove = false;
    refLoad();
    renderTable();
    renderStrip();
    renderPad();
    return;
  }
  if (act === "edit") {
    if (!ui.drawer) ui.dmode = "add";
    S.edit = c.id;
    S.tab = "edit";
    ui.msg = "";
    ui.drawer = true;
    save();
    renderDrawer();
    return;
  }
  if (ui.sel[c.id]) delete ui.sel[c.id];
  else {
    ui.sel[c.id] = true;
    ui.lastSel = c.id;
  }
  ui.confirmRemove = false;
  ui.menu = false;
  ui.pend = {};
  if (ui.drawer && S.tab === "stat") {
    statPick();
    save();
    renderDrawer();
  }
  renderTable();
  renderStrip();
  renderPad();
});
// Initiative: 2024 rules keep it between -4 (Dex 1, no bonus) and below 50; at most two characters ("12", "-3")
function initClamp(v) {
  return Math.max(-4, Math.min(49, v));
}
$("#tbl").addEventListener("input", function (e) {
  var t = e.target;
  if (t.dataset.act !== "init") return;
  var m = String(t.value).match(/^-?\d{0,2}/),
    k = m ? m[0] : "";
  if (/^-\d{2}/.test(k)) k = k.slice(0, 2);
  if (k !== String(t.value)) t.value = k;
});
$("#tbl").addEventListener("change", function (e) {
  var t = e.target,
    act = t.dataset.act;
  if (act !== "init" && act !== "ac") return;
  var row = t.closest("tr.r");
  var c = findC(row.dataset.id);
  if (!c) return;
  var v = t.value === "" ? null : Math.floor(+t.value);
  if (act === "init") {
    if (v != null) {
      v = initClamp(v);
      t.value = v;
    }
    c.init = v;
    delete c.grp;
  } else if (v != null && v >= 0) {
    c.ac = v;
  }
  save();
  renderBoard();
});
var padEl = $("#pad");
padEl.addEventListener("change", function (e) {
  if (e.target.id === "dtype") {
    ui.dtype = e.target.value;
    renderPad();
  }
});
padEl.addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]");
  if (!b) return;
  var a = b.dataset.act;
  var T = S.list.filter(function (c) {
    return ui.sel[c.id];
  });
  var v = Math.floor(+ui.amt) || 0;
  if (a === "wi") {
    var n = +b.dataset.n,
      inp = $("#amtin");
    if (n === ui.amt && inp) {
      inp.value = n;
      inp.parentNode.classList.add("typing");
      inp.focus();
      inp.select();
      return;
    }
    ui.amt = n;
    if (inp) inp.value = n;
    var w = $("#wheel");
    if (w) {
      ui.ignoreUntil = Date.now() + 500;
      w.scrollTo({ top: n * IH, behavior: "smooth" });
    }
    return;
  }
  if (a === "desel") {
    finishPad();
  } else if (a === "pslot") {
    swapSlot(+b.dataset.k);
  } else if (a === "ptog") {
    var tk = b.dataset.k;
    if (tk === "half") {
      ui.half = !ui.half;
      var fh = curFx();
      if (fh && fh.st) {
        if (ui.half) delete ui.pend[fh.st];
        else ui.pend[fh.st] = true;
      }
    } else if (tk === "extra") {
      ui.ex = !ui.ex;
      if (ui.ex) swapSlot(1);
      else {
        swapSlot(0);
        ui.amtO = 0;
        ui.dtO = "";
      }
    } else ui.mx = !ui.mx;
  } else if (a === "actx") {
    ui.act = null;
    ui.out = {};
    finishPad();
  } else if (a === "acrit") {
    actCrit(!ui.act.crit);
  } else if (a === "aslot") {
    var A9 = ui.act,
      c9 = findC(A9.id),
      O9 = slotChoices(c9, A9.d.base),
      i9 = O9.findIndex(function (o) {
        return o.k === A9.how.sk && o.lvl === (A9.how.sl || A9.d.base);
      }),
      n9 = O9[Math.max(0, Math.min(O9.length - 1, i9 + +b.dataset.d))];
    if (n9) {
      var s9 = ui.sel,
        o9 = ui.out;
      if (pcCastBegin(c9, A9.how.s, n9)) {
        ui.sel = s9;
        ui.out = o9;
      }
    }
  } else if (a === "trx") {
    ui.rxFor = ui.rxFor === b.dataset.id ? null : b.dataset.id;
  } else if (a === "trxo") {
    ui.rxs = ui.rxs || {};
    var ro = b.dataset.o;
    if (ro === "none") delete ui.rxs[ui.rxFor];
    else ui.rxs[ui.rxFor] = { n: b.dataset.n, st: b.dataset.st || "", half: b.dataset.half === "1" };
    ui.rxFor = null;
  } else if (a === "tdel") {
    setTimeout(annSave, 0);
    delete ui.sel[b.dataset.id];
    delete ui.out[b.dataset.id];
  } else if (a === "pchip") {
    var pid = b.dataset.id;
    if (ui.sel[pid]) delete ui.sel[pid];
    else ui.sel[pid] = true;
    renderBoard();
    return;
  } else if (a === "tchip") {
    setTimeout(annSave, 0);
    var tt = findC(b.dataset.id),
      atk0 = ui.act.d.kind === "atk";
    if (!ui.sel[tt.id]) ui.sel[tt.id] = true;
    else if ((atk0 && !ui.act.d.rider) || ui.act.d.kind === "buff") {
      delete ui.sel[tt.id];
      delete ui.out[tt.id];
    } else {
      var o0 = actOut(tt);
      ui.out[tt.id] = atk0 ? (o0 === "hit" ? "rsave" : "hit") : o0 === "fail" ? "save" : "fail";
    }
  } else if (a === "amiss") {
    var a0 = ui.act,
      at0 = findC(a0.id),
      h0 = a0.how,
      n0 = a0.n;
    ui.act = null;
    ui.out = {};
    snap("miss");
    doHow(at0, h0);
    toast("<b>" + esc(n0) + ":</b> missed" + slotSpend(at0, h0));
    annSet("<b>" + esc(at0.name) + "</b> \u2014 " + esc(n0) + ": missed");
    logAdd(esc(at0.name) + " \u2014 " + esc(n0) + ": missed");
    finishPad();
    actNext(at0, a0);
  } else if (a === "papply" && ui.act) {
    actApply(T);
    save();
    renderBoard();
    return;
  } else if (a === "papply") {
    var pk = Object.keys(ui.pend),
      SL = padSlots(),
      D = SL.filter(function (x) {
        return !SPEC[x.dt];
      });
    if (!SL.length && !pk.length) return;
    snap(padSum(pk).replace(/<[^>]+>/g, "") || "apply");
    var out = [],
      conc = [],
      mxo = [],
      hv = function (n) {
        return ui.half ? Math.floor(n / 2) : n;
      };
    T.forEach(function (c) {
      if (D.length) {
        var tot = 0,
          nt = [],
          ra = findC(S.turnId);
        D.forEach(function (x) {
          var r = typed(c, hv(x.v), x.dt);
          tot += r[0];
          if (r[1]) nt.push(r[1]);
        });
        if (ra && ra.id !== c.id)
          ridFor(ra, c).forEach(function (x) {
            var r = typed(c, hv(x[0]), x[1]);
            tot += r[0];
            if (r[1]) nt.push(r[1]);
          });
        if (tot > 0) dmg(c, tot);
        if (ui.mx && tot > 0) maxDown(c, tot);
        out.push(esc(c.name) + " " + tot + (nt.length ? " <small>(" + nt.join("; ") + ")</small>" : ""));
        var ci = c.conds.indexOf("Concentrating");
        if (ci >= 0 && tot > 0) {
          if (c.hp <= 0) {
            c.conds.splice(ci, 1);
            conc.push(esc(c.name) + " loses concentration (0 HP)");
          } else conc.push(esc(c.name) + ": Con save DC " + Math.min(30, Math.max(10, Math.floor(tot / 2))));
        }
      }
      SL.forEach(function (x) {
        if (x.dt === "heal") heal(c, x.v);
        else if (x.dt === "temp") c.temp = Math.max(c.temp, x.v);
        else if (x.dt === "maxhp") {
          maxDown(c, x.v);
          mxo.push(esc(c.name) + " \u2212" + x.v);
        }
      });
    });
    var dl = D.map(function (x) {
      return x.dt;
    })
      .filter(Boolean)
      .map(function (t) {
        return t[0].toUpperCase() + t.slice(1);
      })
      .join(" + ");
    var msg = out.length && (dl || out.length > 1) ? "<b>" + (dl ? dl + " " : "") + "damage:</b> " + out.join(" · ") : "";
    if (mxo.length) msg += (msg ? "<br>" : "") + "<b>Max HP:</b> " + mxo.join(" · ");
    if (conc.length) msg += (msg ? "<br>" : "") + "<b>Concentration:</b> " + conc.join(" · ");
    var em = endedMsg();
    if (em) msg += msg ? em : em.slice(4);
    var on = pk.filter(function (x) {
        return ui.pend[x];
      }),
      sk = applyPend(T);
    if (on.length)
      msg +=
        (msg ? "<br>" : "") +
        "<b>" +
        on
          .map(function (x) {
            return esc(nm(x));
          })
          .join(", ") +
        "</b> applied" +
        (sk.length ? " (Immune, not applied: " + sk.join(", ") + ")" : "");
    else if (sk.length) msg += (msg ? "<br>" : "") + "<b>Immune, not applied:</b> " + sk.join(" · ");
    if (msg) toast(msg);
    // Table line and log name the creature whose turn it is as the source (a player's attack or healing), unless it only affects itself
    var pcs = T.filter(function (c) {
        return c.kind === "pc";
      }),
      ra0 = S.turnId != null ? findC(S.turnId) : null,
      src =
        ra0 &&
        ra0.kind !== "fx" &&
        T.some(function (c) {
          return c.id !== ra0.id;
        })
          ? esc(ra0.name)
          : "";
    if ((pcs.length && (D.length || SL.length)) || (src && (SL.length || pk.length)))
      annSet(
        (src ? "<b>" + src + "</b> \u2192 " : "") +
          T.map(function (c) {
            return "<b>" + esc(c.name) + "</b>";
          }).join(", ") +
          ": " +
          padSum(pk),
      );
    logAdd(
      (src ? src + " \u2192 " : "") +
        T.map(function (c) {
          return esc(c.name);
        }).join(", ") +
        ": " +
        padSum(pk),
    );
    finishPad();
  } else if (a === "ti") {
    var tw = $("#twheel"),
      k = +b.dataset.i,
      N = TL().length;
    if (k % N === TL().indexOf(ui.dtype || "")) {
      ui.tpk = true;
      renderPad();
      return;
    }
    if (tw) tw.scrollTo({ top: k * IH, behavior: "smooth" });
    return;
  } else if (a === "tset") {
    ui.dtype = b.dataset.t;
    ui.tpk = false;
  } else if (a === "tpclose") {
    ui.tpk = false;
  } else if (a === "padhp") {
    var k = b.dataset.k;
    if (k === "maxreset") {
      snap("reset max HP");
      T.forEach(maxReset);
      finishPad();
    } else if (v > 0) {
      snap({ dmg: "damage", half: "half damage", heal: "heal", maxdn: "max HP down", temp: "temp HP" }[k] || k);
      var out = [],
        conc = [];
      T.forEach(function (c) {
        if (k === "dmg" || k === "half") {
          var r = typed(c, k === "half" ? Math.floor(v / 2) : v, ui.dtype);
          dmg(c, r[0]);
          out.push(esc(c.name) + " " + r[0] + (r[1] ? " <small>(" + r[1] + ")</small>" : ""));
          var ci = c.conds.indexOf("Concentrating");
          if (ci >= 0 && r[0] > 0) {
            if (c.hp <= 0) {
              c.conds.splice(ci, 1);
              conc.push(esc(c.name) + " loses concentration (0 HP)");
            } else conc.push(esc(c.name) + ": Con save DC " + Math.min(30, Math.max(10, Math.floor(r[0] / 2))));
          }
        } else if (k === "heal") heal(c, v);
        else if (k === "maxdn") maxDown(c, v);
        else c.temp = Math.max(c.temp, v);
      });
      var msg =
        out.length && (ui.dtype || out.length > 1)
          ? "<b>" + (ui.dtype ? ui.dtype[0].toUpperCase() + ui.dtype.slice(1) + " " : "") + "damage:</b> " + out.join(" · ")
          : "";
      if (conc.length) msg += (msg ? "<br>" : "") + "<b>Concentration:</b> " + conc.join(" · ");
      if (msg) toast(msg);
      finishPad();
    }
  } else if (a === "fxst") {
    var fx2 = curFx();
    if (fx2) {
      snap(fx2.st);
      var sk2 = fxApplyStatus(T, fx2);
      toast("<b>" + esc(fx2.st) + "</b> applied" + (sk2.length ? " · immune: " + sk2.join(", ") : ""));
      finishPad();
    }
  } else if (a === "fxdone") {
    ui.fxRun = null;
    finishPad();
  } else if (a === "padgroup") {
    if (
      T.length &&
      T.every(function (c) {
        return c.cg && c.cg === T[0].cg;
      })
    ) {
      setGroup(T, "");
      finishPad();
    } else {
      var sug =
        (
          T.find(function (c) {
            return c.cg;
          }) || {}
        ).cg || "";
      var gnm = prompt("Name for this group (monsters only, they share one initiative):", sug);
      if (gnm === null) return;
      if (!setGroup(T, gnm)) alert("Select at least one monster to group.");
      finishPad();
    }
  } else if (a === "padmore") {
    ui.more = !ui.more;
  } else if (a === "padstatus") {
    ui.menu = !ui.menu;
    ui.mq = "";
    if (ui.menu) refLoad();
  } else if (a === "mi") {
    var x = b.dataset.c,
      base = condState(T, x),
      cur = effState(T, x);
    var want = cur === "all" ? false : true;
    if ((want && base === "all") || (!want && base === "none")) delete ui.pend[x];
    else ui.pend[x] = want;
    if (want && !ui.dtype && REF && REF.spells) {
      var sn = spName(x),
        sp = REF.spells.find(function (r) {
          return r.n.replace(/\u2019/g, "'").toLowerCase() === sn;
        });
      if (sp && sp.dt && sp.dt.length === 1) ui.dtype = sp.dt[0];
    }
    if (want)
      EXCL.forEach(function (g) {
        if (g.indexOf(x) >= 0)
          g.forEach(function (p) {
            if (p !== x) {
              if (condState(T, p) !== "none") ui.pend[p] = false;
              else delete ui.pend[p];
            }
          });
      });
  } else if (a === "mcancel") {
    ui.menu = false;
    var fc = curFx();
    ui.pend = {};
    if (fc && fc.st && !ui.half) ui.pend[fc.st] = true;
    ui.mq = "";
  } else if (a === "mapply") {
    ui.menu = false;
    ui.mq = "";
  } else if (a === "paddef" || a === "padfled") {
    // Instant defeat, or fled: leaves the fight but counts as defeated (XP yes, loot no). Fled keeps its HP for "bring back".
    var MT = T.filter(function (c) {
      return c.kind === "mon" && c.hp > 0;
    });
    if (!MT.length) return;
    snap((a === "padfled" ? "fled " : "defeat ") + MT.length);
    MT.forEach(function (c) {
      if (a === "padfled") {
        c.fhp = c.hp;
        c.fled = true;
      }
      c.temp = 0;
      dmg(c, c.hp);
    });
    var nmz = MT.map(function (c) {
      return "<b>" + esc(c.name) + "</b>";
    }).join(", ");
    logAdd(nmz + (a === "padfled" ? " fled" : " defeated (set by the DM)"));
    if (a === "padfled") annSet(nmz + (MT.length > 1 ? " flee!" : " flees!"));
    if (
      MT.some(function (c) {
        return c.id === S.turnId;
      })
    )
      S.turnId = nextIdExcluding(MT);
    finishPad();
  } else if (a === "padremove") {
    if (ui.confirmRemove) {
      snap("remove " + T.length);
      if (
        T.some(function (c) {
          return c.id === S.turnId;
        })
      )
        S.turnId = nextIdExcluding(T);
      S.list = S.list.filter(function (c) {
        return !ui.sel[c.id];
      });
      finishPad();
      renderDrawer();
    } else {
      ui.confirmRemove = true;
    }
  }
  save();
  renderBoard();
});
padEl.addEventListener(
  "scroll",
  function (e) {
    if (!e.target) return;
    if (e.target.id === "twheel") {
      if (Date.now() < ui.ignoreUntil) return;
      wheelSettle(e.target);
      var L = TL(),
        k = Math.round(e.target.scrollTop / IH),
        t = L[((k % L.length) + L.length) % L.length];
      if (t !== (ui.dtype || "")) {
        var was = SPEC[ui.dtype];
        ui.dtype = t;
        if (!!SPEC[t] !== !!was && !ui.ex) {
          var hb = $("#pad [data-k=half]"),
            mb = $("#pad [data-k=maxdn]");
          if (hb) hb.disabled = !!SPEC[t];
          if (mb) mb.disabled = !!SPEC[t];
          if (SPEC[t]) {
            ui.half = ui.mx = false;
            if (hb) hb.classList.remove("on");
            if (mb) mb.classList.remove("on");
          }
        }
        padLive();
      }
      return;
    }
    if (e.target.id !== "wheel") return;
    if (Date.now() < ui.ignoreUntil) return;
    wheelSettle(e.target);
    var i = Math.max(0, Math.min(WMAX, Math.round(e.target.scrollTop / IH)));
    if (i !== ui.amt) {
      ui.amt = i;
      var inp = $("#amtin");
      if (inp) inp.value = i;
      padLive();
    }
  },
  true,
);
padEl.addEventListener("input", function (e) {
  var t = e.target;
  if (t.dataset && t.dataset.rv) {
    ui.rv = ui.rv || {};
    ui.rv[t.dataset.rv] = Math.min(99, +t.value.replace(/\D/g, "") || 0);
    return;
  }
  if (t.id === "msearch") {
    ui.mq = t.value;
    var mr = $("#mres");
    if (mr)
      mr.innerHTML = spellGrid(
        S.list.filter(function (c) {
          return ui.sel[c.id];
        }),
      );
    return;
  }
  if (t.id !== "amtin") return;
  var digits = t.value.replace(/\D/g, "").slice(0, 3);
  t.value = digits;
  ui.amt = digits === "" ? 0 : parseInt(digits, 10);
  padLive();
  var w = $("#wheel");
  if (w) {
    ui.ignoreUntil = Date.now() + 250;
    w.style.scrollSnapType = "none";
    w.scrollTop = Math.min(ui.amt, WMAX) * IH;
    w.style.scrollSnapType = "";
  }
});
padEl.addEventListener("focusin", function (e) {
  if (e.target.id === "amtin") e.target.select();
});
padEl.addEventListener("focusout", function (e) {
  if (e.target.id === "amtin") {
    e.target.value = ui.amt;
    e.target.parentNode.classList.remove("typing");
  }
});
padEl.addEventListener("keydown", function (e) {
  if (e.target.id === "amtin" && e.key === "Enter") e.target.blur();
});
var dr = $("#drawer");
dr.addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]");
  if (!b) return;
  var act = b.dataset.act;
  if (act === "qty" || act === "at" || b.tagName === "SELECT") return;
  if (act === "dsv") {
    ui.dsv = +b.dataset.n;
    renderDrawer();
    return;
  }
  if (act === "pgrp") {
    ui.pg = b.dataset.g;
    renderDrawer();
    return;
  }
  if (act === "tagl") {
    ui.tagL = ui.tagL === b.dataset.l ? null : b.dataset.l;
    renderDrawer();
    var ti = dr.querySelector("[data-tg]");
    if (ti) ti.focus();
    return;
  }
  if (act === "pgtick") {
    S.lib.forEach(function (l) {
      if (
        (l.tags || []).indexOf(ui.pg) >= 0 &&
        !S.list.some(function (c) {
          return c.libId === l.id;
        })
      )
        S.atTable[l.id] = true;
    });
    save();
    renderDrawer();
    return;
  }
  if (act !== "libclear") ui.confirmLib = false;
  if (act === "export") {
    doExport();
    renderDrawer();
    return;
  }
  if (act === "expmon") {
    ui.expMon = b.checked;
    return;
  }
  if (act === "logdl") {
    doLogDownload();
    return;
  }
  if (act === "logclr") {
    if (ui.logClr) {
      S.logs = [];
      ui.logClr = false;
      save();
    } else ui.logClr = true;
    renderDrawer();
    return;
  }
  if (act === "import") {
    var pf = $("#impfile");
    if (pf) pf.click();
    return;
  }
  if (act === "addmonfile") {
    var mf = $("#monfile");
    if (mf) mf.click();
    return;
  }
  if (act === "rmmonfile") {
    CUSTOM.splice(+b.dataset.i, 1);
    saveCustom();
    location.reload();
    return;
  }
  if (act.indexOf("gen") === 0 && act !== "gen") {
    genAct(act, b);
    return;
  }
  if (act === "endclr") {
    S.endSum = null;
    save();
    renderDrawer();
    return;
  }
  if (act === "lootgo" || act === "lootsend") {
    lootAct(act);
    return;
  }
  if (act === "sessdisc") {
    discordSend("**Table view** for tonight: " + sessLink(null), "Table link");
    return;
  }
  if (act.indexOf("sess") === 0) {
    sessAct(act, b);
    return;
  }
  if (act === "tablewin") {
    window.open(location.pathname + "?view=table", "_blank");
    return;
  }
  if (act === "close") {
    ui.drawer = false;
  } else if (act === "drow") {
    var dc = findC(b.dataset.id);
    if (dc) {
      if (ui.sel[dc.id]) delete ui.sel[dc.id];
      else {
        ui.sel[dc.id] = true;
        ui.lastSel = dc.id;
        S.edit = dc.id;
        statPick();
      }
      renderBoard();
    }
  } else if (act === "tab") {
    S.tab = b.dataset.t;
    if (S.tab === "stat") statPick();
    ui.msg = ui.emsg = "";
    ui.refBack = null;
    if (S.tab !== "ref") ui.ref = null;
  } else if (act === "ref") {
    ui.ref = b.dataset.n;
    dr.scrollTop = 0;
  } else if (act === "refed") {
    ui.refEd = b.dataset.v;
  } else if (act === "refback") {
    ui.ref = null;
    if (ui.refBack) {
      if (ui.refBack === "close") ui.drawer = false;
      else S.tab = ui.refBack;
      ui.refBack = null;
    }
  } else if (act === "spl") {
    openSpell(b.dataset.n);
  } else if (act === "sub") {
    S.sub = b.dataset.s;
    ui.msg = "";
  } else if (act === "dsec") {
    S.dsec = b.dataset.s;
    ui.msg = ui.emsg = "";
  } else if (act === "set") {
    S[b.dataset.k] = b.dataset.v;
  } else if (act === "view") {
    S.stat = b.dataset.m;
    S.statC = null;
    S.tab = "stat";
  } else if (act === "encsave") {
    ui.emsg = encSave();
  } else if (act === "encload" || act === "encadd") {
    var en = S.enc[+b.dataset.i];
    if (en) {
      var r0 = encLoad(en, act === "encadd");
      if (r0) ui.emsg = r0;
    }
  } else if (act === "encdel") {
    var ed = S.enc[+b.dataset.i];
    if (ed && confirm("Delete the saved encounter \u201c" + ed.name + "\u201d?")) {
      S.enc.splice(+b.dataset.i, 1);
      ui.emsg = "Deleted.";
    }
  } else if (act === "sedit") {
    S.edit = S.statC;
    S.tab = "edit";
    ui.msg = "";
  } else if (act === "exadd" || act === "exrm" || act === "excopy") {
    var ec = findC(S.edit);
    if (!ec) return;
    ec.x = ec.x || [];
    if (act === "exadd") {
      ec.x.push({ t: "a", n: "", d: "" });
      ui.msg = "";
    } else if (act === "exrm") {
      ec.x.splice(+b.dataset.i, 1);
      ui.msg = "";
    } else {
      var nn = 0;
      S.list.forEach(function (o) {
        if (o.monId === ec.monId && o.id !== ec.id) {
          o.x = clone(ec.x);
          o.hideBase = !!ec.hideBase;
          nn++;
        }
      });
      ui.msg = "Copied to " + nn + " others.";
    }
    save();
    renderBoard();
    renderDrawer();
    if (act === "exadd") {
      var ni = dr.querySelectorAll('[data-ex="n"]');
      if (ni.length) ni[ni.length - 1].focus();
    }
    return;
  } else if (act === "addmon") {
    var q = Math.max(1, Math.min(20, Math.floor(+ui.qty[b.dataset.m] || 1)));
    addMon(b.dataset.m, q);
    ui.qty[b.dataset.m] = 1;
  } else if (act === "sumrm") {
    var rl = S.list.filter(function (c) {
      return c.monId === b.dataset.m;
    });
    if (rl.length) {
      snap("remove " + rl[rl.length - 1].name);
      rmComb(rl[rl.length - 1]);
    }
  } else if (act === "untick") {
    S.atTable = {};
  } else if (act === "libclear") {
    if (ui.confirmLib) {
      S.lib = S.lib.filter(function (l) {
        return S.list.some(function (c) {
          return c.libId === l.id;
        });
      });
      S.atTable = {};
      ui.confirmLib = false;
      ui.msg = S.lib.length ? "Deleted. Characters in the current encounter were kept." : "All saved characters deleted.";
    } else {
      ui.confirmLib = true;
    }
  } else if (act === "addparty") {
    var n = 0;
    S.lib.forEach(function (l) {
      if (S.atTable[l.id] && addPc(l)) {
        n++;
        S.atTable[l.id] = false;
      }
    });
    ui.msg = n ? n + " added. Enter each player’s initiative roll in the table." : "Tick at least one character first.";
  } else if (act === "newchar") {
    var inp = $("#newchar");
    var p = parseChar(inp ? inp.value : "");
    var ex =
      p &&
      S.lib.find(function (l) {
        return l.name.toLowerCase() === p.name.toLowerCase();
      });
    if (ex) {
      if (p.ac != null) {
        ex.ac = p.ac;
        ex.chk = false;
      }
      if (p.hp != null) {
        ex.hp = p.hp;
        ex.hpMan = true;
      }
      if (/init/i.test(inp.value)) ex.ib = p.ib;
      if (p.lvl) ex.lvl = p.lvl;
      ui.msg = "Updated " + ex.name + ".";
    } else if (p) {
      S.lib.push({
        id: "l" + S.libNext++,
        name: p.name,
        ac: p.ac == null ? 10 : p.ac,
        hp: p.hp == null ? 10 : p.hp,
        ib: p.ib,
        lvl: p.lvl,
        chk: p.ac == null,
        hpMan: p.hp != null,
      });
      ui.msg = "Saved " + p.name + (p.ac == null || p.hp == null ? " (AC/HP default 10; change them with ✎ Edit once added)." : ".");
    } else {
      ui.msg = "Type at least a name, e.g. Thorn (optionally , AC 15, HP 28, init +3)";
    }
  } else if (act === "ddb") {
    ui.msg = "Loading dndbeyond.json…";
    fetch("dndbeyond.json?t=" + Date.now())
      .then(function (r) {
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (P) {
        ui.msg = ddbUpdate(P);
        save();
        renderDrawer();
      })
      .catch(function () {
        ui.msg = "Could not load dndbeyond.json. Add links to dndbeyond.txt on GitHub (the workflow then runs by itself).";
        renderDrawer();
      });
  } else if (act === "muse" || act === "mkeep") {
    ddbPick(+b.dataset.i, act === "muse");
  } else if (act === "mall") {
    while (ui.merge && ui.merge.length) ddbPick(0, b.dataset.v === "1");
  } else if (act === "kanka") {
    ui.msg = "Loading players.json…";
    fetch("players.json?t=" + Date.now())
      .then(function (r) {
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (P) {
        var nw = 0,
          up = 0,
          df = 0;
        P.forEach(function (p) {
          var l =
            S.lib.find(function (x) {
              return x.k === p.id;
            }) ||
            S.lib.find(function (x) {
              return !x.k && x.name.toLowerCase() === p.name.toLowerCase();
            });
          if (!l) {
            l = { id: "l" + S.libNext++, ac: 10, hp: p.hpEst || 10, chk: true };
            S.lib.push(l);
            nw++;
          } else up++;
          l.k = p.id;
          l.name = p.name;
          l.ib = p.initMod != null ? p.initMod : p.mods && p.mods.dex != null ? p.mods.dex : l.ib || 0;
          if (p.hpEst && !l.hpMan && (l.chk || l.hp === l.hpEst)) l.hp = p.hpEst;
          else if (p.hpEst && l.hp !== p.hpEst) df++;
          l.saves = p.saves;
          l.saveProf = p.saveProf;
          DEFK.forEach(function (f, i) {
            var kv = p[["resist", "immune", "vulnerable", "condImmune"][i]] || [];
            l["k" + f] = kv;
            l[f] = uniq(kv.concat(l["x" + f] || []));
          });
          l.adv = p.advSaves || [];
          l.traits = p.traits || [];
          l.parsed = p.parsed || [];
          l.notes = p.notes || [];
          l.cls = p.classes;
          l.race = p.race;
          l.abil = p.abilities;
          l.pp = p.passivePerception;
          l.hpEst = p.hpEst;
          l.url = p.url;
        });
        S.lib.sort(function (a, b) {
          return a.name.localeCompare(b.name);
        });
        ui.msg =
          nw +
          " new, " +
          up +
          " updated from Kanka." +
          (df ? " " + df + " with hand-set HP that differs from Kanka: tap “Use Kanka HP” to take the estimate." : "") +
          " Type “Name, AC 15” (optionally “, HP 28”) below to set AC or override HP.";
        save();
        renderDrawer();
      })
      .catch(function () {
        ui.msg = "Could not load players.json. Run the Kanka workflow on GitHub first.";
        renderDrawer();
      });
  } else if (act === "usekhp") {
    S.lib.forEach(function (l) {
      if (khpDiff(l) && (b.dataset.l === "all" || l.id === b.dataset.l)) {
        l.hp = l.hpEst;
        l.hpMan = false;
      }
    });
    ui.msg = "Max HP set to the Kanka estimate.";
  } else if (act === "dellib") {
    S.lib = S.lib.filter(function (l) {
      return l.id !== b.dataset.l;
    });
  } else if (act === "fxtpl") {
    var i3 = b.dataset.i,
      t3 = i3[0] === "b" ? FXT[+i3.slice(1)] : (S.fxLib || [])[+i3.slice(1)];
    if (t3) ui.fx = Object.assign(fxBlank(), clone(t3));
    ui.msg = t3 ? "Loaded \u201c" + t3.name + "\u201d: check the numbers, then Add effect." : "";
  } else if (act === "fxtrm") {
    (S.fxLib || []).splice(+b.dataset.i, 1);
  } else if (act === "fxsave") {
    var t4 = clone(ui.fx);
    t4.name = t4.name.trim();
    if (!t4.name) ui.msg = "Give the effect a name first.";
    else {
      S.fxLib = S.fxLib || [];
      var o4 = S.fxLib.findIndex(function (x) {
        return x.name.toLowerCase() === t4.name.toLowerCase();
      });
      if (o4 >= 0) S.fxLib[o4] = t4;
      else S.fxLib.push(t4);
      ui.msg = (o4 >= 0 ? "Updated" : "Saved") + " template \u201c" + t4.name + "\u201d.";
    }
  } else if (act === "addfx") {
    var f = ui.fx,
      nm = f.name.trim(),
      iv = f.init === "" ? NaN : Math.floor(+f.init);
    if (!nm) ui.msg = "Give the effect a name.";
    else if (isNaN(iv)) ui.msg = "Enter the initiative number it acts on.";
    else {
      S.list.push({
        id: S.next++,
        kind: "fx",
        name: nm,
        desc: f.desc.trim(),
        init: iv,
        vis: !!f.vis,
        ac: 0,
        hp: 0,
        max: 0,
        temp: 0,
        conds: [],
        cr: "",
        spent: {},
        dd: f.dd.trim(),
        dt: f.dt,
        sv: f.sv,
        dc: f.dc === "" ? "" : Math.floor(+f.dc),
        st: f.st,
        dur: f.st ? f.dur : "",
      });
      ui.fx = { name: "", init: "", desc: "", vis: f.vis, dd: "", dt: "", sv: "", dc: "", st: "", dur: "" };
      ui.msg = "Added " + nm + " at initiative " + iv + ".";
    }
  }
  save();
  renderBoard();
  renderDrawer();
});
dr.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target.id === "newchar") {
    var sb = dr.querySelector('[data-act="newchar"]');
    if (sb) sb.click();
  }
});
dr.addEventListener("input", function (e) {
  var t = e.target;
  if (t.id === "search") {
    ui.q = t.value;
    $("#results").innerHTML = resultsHTML();
  } else if (t.id === "pq") {
    ui.pq = t.value;
    var tp = document.createElement("div");
    tp.innerHTML = partyHTML();
    $("#plist").innerHTML = tp.querySelector("#plist").innerHTML;
  } else if (t.id === "refq") {
    ui.rq = t.value;
    ui.ref = null;
    var rh = document.createElement("div");
    rh.innerHTML = refHTML();
    $("#refl").innerHTML = rh.querySelector("#refl").innerHTML;
  } else if (t.dataset.act === "qty") {
    ui.qty[t.dataset.m] = t.value;
  } else if (t.id === "fxname") ui.fx.name = t.value;
  else if (t.id === "fxinit") ui.fx.init = t.value;
  else if (t.id === "fxdesc") ui.fx.desc = t.value;
  else if (t.id === "fxdd") ui.fx.dd = t.value;
  else if (t.id === "fxdc") ui.fx.dc = t.value;
  else if (t.id === "encname") ui.encName = t.value;
  else if (t.id === "encnote") ui.encNote = t.value;
});
dr.addEventListener(
  "toggle",
  function (e) {
    if (e.target.classList && e.target.classList.contains("geno")) ui.genOpen = e.target.open;
  },
  true,
);
dr.addEventListener("change", function (e) {
  var t = e.target;
  if (t.dataset.act === "sesstog") {
    sessAct("sesstog", t);
    return;
  }
  if (t.dataset.act === "gen") {
    genOpt()[t.dataset.k] = t.dataset.k === "diff" ? +t.value : t.value;
    if (!(
      ui.genRes &&
      ui.genRes.items &&
      ui.genRes.items.some(function (i) {
        return i.lock;
      })
    ))
      ui.genRes = null;
    save();
    renderDrawer();
    return;
  }
  if (t.dataset.act === "hook") {
    S.hook = t.value.trim();
    save();
    renderDrawer();
    return;
  }
  if (t.dataset.act === "lootconv") {
    S.lootConv = t.checked;
    save();
    return;
  }
  if (t.dataset.act === "genchk") {
    var gk = t.dataset.k;
    ui.genOpen = true;
    if (gk === "namer" || gk === "quirk") S[gk] = t.checked;
    else {
      genOpt()[gk] = t.checked;
      if (gk === "tw" && ui.genRes && ui.genRes.items)
        ui.genRes.twist = t.checked ? TWISTS[Math.floor(Math.random() * TWISTS.length)] : null;
    }
    save();
    renderDrawer();
    return;
  }
  if (t.dataset.pe) {
    var pc = findC(S.edit);
    if (pc) pcSheetChange(t, pc);
    save();
    renderBoard();
    return;
  }
  if (t.dataset.ed || t.dataset.ex) {
    var c = findC(S.edit);
    if (!c) return;
    var f = t.dataset.ed,
      n = t.value === "" ? NaN : Math.floor(+t.value);
    if (t.dataset.ex) {
      var x = (c.x || [])[+t.dataset.i];
      if (x) x[t.dataset.ex] = t.value;
    } else if (f === "name") {
      var v = t.value.trim();
      if (v) {
        c.name = v;
        var hh = $("#edh");
        if (hh) hh.textContent = v;
      } else t.value = c.name;
    } else if (f === "ac") {
      if (n >= 0) {
        c.ac = n;
        var la = libOf(c);
        if (la) {
          la.ac = n;
          la.chk = false;
        }
      } else t.value = c.ac;
    } else if (f === "init") {
      c.init = isNaN(n) ? null : n;
      delete c.grp;
    } else if (f === "max") {
      if (n >= 1) {
        var full = c.hp >= c.max;
        c.max = n;
        c.base = null;
        c.hp = full ? n : Math.min(c.hp, n);
        var lh = libOf(c);
        if (lh) {
          lh.hp = n;
          lh.hpMan = true;
        }
        var hi = dr.querySelector('[data-ed="hp"]');
        if (hi) hi.value = c.hp;
      } else t.value = c.max;
    } else if (f === "hp") {
      if (n >= 0) {
        c.hp = Math.min(n, c.max);
        t.value = c.hp;
        if (c.hp > 0) {
          c.ds = null;
          var di = c.conds.indexOf("Dead");
          if (di >= 0) c.conds.splice(di, 1);
        }
      } else t.value = c.hp;
    } else if (f === "hideBase") {
      c.hideBase = t.checked;
    } else if (f === "cg") {
      setGroup([c], t.value);
      var ii = dr.querySelector('[data-ed="init"]');
      if (ii) ii.value = c.init == null ? "" : c.init;
    }
    save();
    renderBoard();
    return;
  }
  if (t.dataset.tg) {
    var lt = S.lib.find(function (x) {
      return x.id === t.dataset.tg;
    });
    if (lt) {
      lt.tags = uniq(
        t.value.split(",").map(function (x) {
          return x.trim();
        }),
      );
      save();
      renderDrawer();
    }
    return;
  }
  if (t.dataset.act === "at") {
    S.atTable[t.dataset.l] = t.checked;
    save();
    var ft = dr.querySelector(".dfoot");
    if (ft) {
      var tmp = document.createElement("div");
      tmp.innerHTML = partyHTML();
      ft.outerHTML = tmp.querySelector(".dfoot").outerHTML;
    }
  }
  if (t.id === "fxvis") ui.fx.vis = t.checked;
  if (["fxdt", "fxsv", "fxst", "fxdur"].indexOf(t.id) >= 0) ui.fx[t.id.slice(2)] = t.value;
  if (t.id === "encroll") {
    S.encRoll = t.checked;
    save();
  }
  if (t.dataset.act === "rl" || t.dataset.act === "rc" || t.dataset.act === "rk") {
    ui[t.dataset.act] = t.value;
    renderDrawer();
  }
  if (t.dataset.act === "ftype" || t.dataset.act === "fmin" || t.dataset.act === "fmax") {
    ui[t.dataset.act === "ftype" ? "fType" : t.dataset.act === "fmin" ? "fMin" : "fMax"] = t.value;
    $("#results").innerHTML = resultsHTML();
  }
  if (t.id === "impfile" && t.files && t.files[0]) {
    doImport(t.files[0]);
    t.value = "";
  }
  if (t.id === "monfile" && t.files && t.files[0]) {
    readMonFile(t.files[0], function (msg) {
      ui.msg = msg;
      renderDrawer();
    });
    t.value = "";
  }
});
function pull() {
  if (NETV) return;
  var ae = document.activeElement;
  if (!RO && ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
  try {
    var r2 = localStorage.getItem(KEY);
    if (r2) {
      var p2 = JSON.parse(r2);
      if (p2 && p2.list) {
        S = Object.assign(S, p2);
        fixIds();
        pruneSel();
        renderAll();
      }
    }
  } catch (x) {}
}
window.addEventListener("storage", function (e) {
  if (e.key === KEY) pull();
});
// Any tap elsewhere (or 4 s) cancels a pending "Tap again to clear" / "Sure?" confirmation
var armT = null;
document.addEventListener(
  "click",
  function (e) {
    var t = e.target.closest && e.target.closest("[data-act]"),
      a = t ? t.dataset.act : "";
    if (ui.confirmClear && a !== "clear") {
      ui.confirmClear = false;
      renderBar();
    }
    if (ui.confirmRemove && a !== "padremove") {
      ui.confirmRemove = false;
      renderPad();
    }
    clearTimeout(armT);
    armT = setTimeout(function () {
      var c = ui.confirmClear || ui.confirmRemove;
      ui.confirmClear = ui.confirmRemove = false;
      if (c) {
        renderBar();
        renderPad();
      }
    }, 4000);
  },
  true,
);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) pull();
});
