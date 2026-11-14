// Encounters app, part 3 of 11: top bar and initiative strip.
// ================= 4. BOARD RENDERING: top bar, initiative strip, turn card, table, XP bar, action pad =================
function renderBar() {
  if (RO) {
    $("#bar").innerHTML = '<div class="round"><small>Round</small>' + S.round + "</div>";
    return;
  }
  var started = S.turnId != null;
  $("#bar").innerHTML =
    '<div class="round"><small>Round</small>' +
    S.round +
    "</div>" +
    '<button class="primary" data-act="next">' +
    (started ? 'Next<span class="tx"> turn</span> ▸' : 'Start<span class="tx"> combat</span>') +
    "</button>" +
    (started
      ? '<button data-act="endc" title="End combat: keeps creatures, HP and statuses; resets round and turn" aria-label="End combat"><span class="ic">■</span><span class="tx"> End combat</span></button>'
      : "") +
    (ui.undo
      ? '<button data-act="undo" title="Undo: ' +
        esc(ui.undo.label) +
        '" aria-label="Undo"><span class="ic">↶</span><span class="tx"> Undo</span></button>'
      : "") +
    '<span class="spacer"></span>' +
    '<button class="dmonly" data-act="openadd" aria-label="Add"><span class="ic">＋</span><span class="tx"> Add</span></button>' +
    '<button class="dmonly' +
    (ui.drawer && ui.dmode === "def" ? " on" : "") +
    '" data-act="saves" title="Defences: AC, saving throws, resistances and immunities of every creature" aria-label="Defences"><span class="ic">🛡</span><span class="tx"> Defences</span></button>' +
    (S.sess && S.sess.on
      ? '<button class="dmonly sessb s-' +
        NET.st +
        '" data-act="sessopen" aria-label="Remote session" title="Remote session: links and what players may change"><span class="ic">📡</span></button>'
      : "") +
    '<button data-act="present" aria-label="Table view"><span class="ic">🖥</span><span class="tx"> ' +
    (ui.present ? "Exit table view" : "Table view") +
    "</span></button>" +
    '<button class="danger dmonly' +
    (ui.confirmClear ? " armed" : "") +
    '" data-act="clear" aria-label="Clear">' +
    (ui.confirmClear ? "Tap again to clear all" : '<span class="ic">🗑</span><span class="tx"> Clear</span>') +
    "</button>";
  document.body.classList.toggle("idle", !started);
}
// One token in the initiative strip (also what the table view shows): name, HP state, statuses, death saves.
function tokHTML(c, isNext) {
  if (c.kind === "fx") {
    var nw = c.id === S.turnId;
    return (
      '<div class="tok fx' +
      (nw ? " now" : "") +
      (isNext ? " next" : "") +
      '"><div class="lab">' +
      (nw ? "Up now" : isNext ? "Next" : "") +
      '</div><div class="in">' +
      (c.init == null ? "\u2014" : c.init) +
      '</div><div class="nm">' +
      esc(c.name) +
      '</div><div class="mini">' +
      (c.vis ? "" : "<span>Hidden</span>") +
      "</div></div>"
    );
  }
  var now = c.id === S.turnId,
    down = c.hp <= 0 || isPcDead(c);
  var pct = c.max ? Math.max(0, Math.min(100, (c.hp / c.max) * 100)) : 0;
  var lvl = pct > 50 ? "ok" : pct > 25 ? "warn" : "bad";
  var tags = c.conds
    .filter(function (x) {
      return x !== "Dead";
    })
    .map(function (x) {
      return "<span>" + esc(nm(x)) + "</span>";
    });
  if (c.base != null && c.max > 0) tags.push("<span>Max HP \u2212" + (c.base - c.max) + "</span>");
  if (c.kind === "pc" && c.hp <= 0 && !isPcDead(c) && c.ds)
    tags.push('<span class="dsm">' + (c.ds.s >= 3 ? "Stable" : "Saves " + c.ds.s + " \u00b7 Fails " + c.ds.f) + "</span>");
  if (isPcDead(c)) tags.unshift('<span class="dn">Dead</span>');
  else if (c.hp <= 0) tags.unshift('<span class="dn">' + (c.kind === "pc" ? "Down" : c.fled ? "Fled" : "Dead") + "</span>");
  else if (c.kind === "mon" && c.hp * 2 <= c.max) tags.unshift('<span class="bl">Bloodied</span>');
  if (!ui.present && !down) {
    tags.unshift('<span class="acp">AC ' + acHTML(c) + "</span>");
    if (c.rx || rxBlocked(c)) tags.push('<span class="rxu">No reaction</span>');
    var lgo = legOf(c);
    if (lgo && lgo.la) tags.push("<span>LA " + (lgo.la - (c.la || 0)) + "/" + lgo.la + "</span>");
  }
  var showBar = c.kind === "pc" || !ui.present;
  return (
    '<div class="tok ' +
    c.kind +
    (now ? " now" : "") +
    (isNext ? " next" : "") +
    (down ? " down" : "") +
    (ui.sel[c.id] && !ui.present ? " sel" : "") +
    '">' +
    '<div class="lab">' +
    (now ? "Up now" : isNext ? "Next" : "") +
    "</div>" +
    '<div class="in">' +
    (c.init == null ? "—" : c.init) +
    "</div>" +
    '<div class="nm">' +
    esc(c.name) +
    "</div>" +
    '<div class="mini">' +
    tags.join("") +
    "</div>" +
    (showBar ? '<div class="track"><div class="fill ' + lvl + '" style="width:' + pct + '%"></div></div>' : "") +
    "</div>"
  );
}
// A group of identical monsters as one token in the initiative strip.
function grpTokHTML(g, nid) {
  var cur = g.find(function (c) {
      return c.id === S.turnId;
    }),
    nx =
      !cur &&
      g.some(function (c) {
        return c.id === nid;
      });
  var up = g.filter(function (c) {
      return c.hp > 0;
    }),
    bl = up.filter(function (c) {
      return c.hp * 2 <= c.max;
    }).length;
  var hp = 0,
    mx = 0;
  g.forEach(function (c) {
    hp += Math.max(0, c.hp);
    mx += c.max;
  });
  var pct = mx ? (hp / mx) * 100 : 0,
    lvl = pct > 50 ? "ok" : pct > 25 ? "warn" : "bad";
  var nm =
    g[0].cg ||
    (
      MON.find(function (m) {
        return m.id === g[0].monId;
      }) || { name: g[0].name }
    ).name + " Group";
  var ns = ui.present
    ? 0
    : g.filter(function (c) {
        return ui.sel[c.id];
      }).length;
  return (
    '<div class="tok mon' +
    (cur ? " now" : "") +
    (nx ? " next" : "") +
    (ns ? " sel" : "") +
    '"><div class="lab">' +
    (cur ? "Up: " + esc((/ (\d+)$/.exec(cur.name) || [])[1] ? "#" + / (\d+)$/.exec(cur.name)[1] : cur.name) : nx ? "Next" : "") +
    '</div><div class="in">' +
    g[0].init +
    '</div><div class="nm">' +
    esc(nm) +
    "</div>" +
    '<div class="mini"><span>×' +
    up.length +
    "</span>" +
    (ns && ns < g.length ? "<span>" + ns + " selected</span>" : "") +
    (bl ? '<span class="bl">' + bl + " bloodied</span>" : "") +
    (function (nf) {
      var nd = g.length - up.length - nf;
      return (nd > 0 ? '<span class="dn">' + nd + " down</span>" : "") + (nf ? '<span class="dn">' + nf + " fled</span>" : "");
    })(
      g.filter(function (c) {
        return c.fled;
      }).length,
    ) +
    "</div>" +
    (ui.present ? "" : '<div class="track"><div class="fill ' + lvl + '" style="width:' + pct + '%"></div></div>') +
    "</div>"
  );
}
function renderStrip() {
  var O = order().filter(function (c) {
      return shown(c) && (!isOut(c) || c.id === S.turnId);
    }),
    nid = nextId();
  var strip = $("#strip");
  var G = [];
  O.forEach(function (c) {
    var g = G[G.length - 1];
    if (c.grp && g && g[0].grp === c.grp && g[0].init === c.init) g.push(c);
    else G.push([c]);
  });
  strip.innerHTML = O.length
    ? G.map(function (g) {
        return g.length > 1 ? grpTokHTML(g, nid) : tokHTML(g[0], g[0].id === nid);
      }).join("")
    : '<div class="muted" style="padding:12px">Add combatants to build the initiative order.</div>';
  var cur = strip.querySelector(".now");
  if (cur) {
    strip.scrollLeft = Math.max(0, cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2);
  }
  var c1 = S.list.find(function (c) {
      return c.id === S.turnId;
    }),
    c2 = S.list.find(function (c) {
      return c.id === nid;
    });
  $("#big").innerHTML =
    c1 && !shown(c1)
      ? ""
      : c1
        ? '<div class="u">' + esc(c1.name) + " is up</div>" + (c2 ? '<div class="n">Next: ' + esc(c2.name) + "</div>" : "")
        : '<div class="n">Combat is about to begin</div>';
}
function short(t) {
  return t
    .replace("Melee or Ranged Attack Roll: ", "Melee/ranged ")
    .replace("Melee Attack Roll: ", "Melee ")
    .replace("Ranged Attack Roll: ", "Ranged ")
    .replace("Melee or Ranged Weapon Attack: ", "Melee/ranged ")
    .replace("Melee Weapon Attack: ", "Melee ")
    .replace("Ranged Weapon Attack: ", "Ranged ")
    .replace(" to hit", "")
    .replace(", one target. Hit: ", " \u2192 ")
    .replace(" Hit: ", " \u2192 ");
}
