// Encounters app, part 11 of 11: remote session (table and player links on other devices); its last lines start a viewer or resume a session.
// ================= REMOTE SESSION: table and player links on other devices =================
// The DM's device stays the source of truth. It broadcasts tableSnap() (a filtered copy: no monster HP numbers, notes,
// hidden effects, library or logs) on a channel named after S.sess.code. Viewers (?view=table&s=CODE) only render the strip.
// Player links (?view=player&s=CODE&p=LIBID&k=KEY) may send small requests, applied by netReq() if the DM's toggle is on.
// Transport: Supabase Realtime Broadcast (session.json: url + publishable key; supabase.js loaded on demand),
// or BroadcastChannel with ?net=local (same browser; used by the tests). Messages: {t:'snap'|'hello'|'req'}.
var NET = { st: "off", send: null, last: 0, t: 0, hb: 0, close: null };
function rnd(n) {
  var a = "abcdefghjkmnpqrstuvwxyz23456789",
    o = "",
    u = new Uint8Array(n);
  crypto.getRandomValues(u);
  for (var i = 0; i < n; i++) o += a[u[i] % a.length];
  return o;
}
function sessOf() {
  if (!S.sess || !S.sess.code) S.sess = { code: rnd(10), on: false, edit: { hp: false, ac: false, init: false, st: false }, keys: {} };
  S.sess.keys = S.sess.keys || {};
  return S.sess;
}
function pkOf(c) {
  return String(c.libId || "c" + c.id);
}
function tableSnap() {
  var E = sessOf().edit;
  return {
    round: S.round,
    turnId: S.turnId,
    tc: S.tc || 0,
    ann: S.ann || null,
    sess: { edit: { hp: !!E.hp, ac: !!E.ac, init: !!E.init, st: !!E.st } },
    list: S.list
      .filter(function (c) {
        return c.kind !== "fx" || c.vis;
      })
      .map(function (c) {
        if (c.kind === "fx") return { id: c.id, kind: "fx", name: c.name, init: c.init, vis: true, conds: [], hp: 1, max: 1 };
        var o = {
          id: c.id,
          kind: c.kind,
          name: c.name,
          init: c.init,
          conds: c.conds.slice(),
          grp: c.grp,
          cg: c.cg,
          monId: c.monId,
          temp: 0,
        };
        if (c.kind === "pc") {
          o.hp = c.hp;
          o.max = c.max;
          o.temp = c.temp || 0;
          o.ac = effAC(c);
          o.pk = pkOf(c);
          if (c.base != null) o.base = c.base;
          if (c.ds) o.ds = { s: c.ds.s, f: c.ds.f };
        } else {
          o.max = 2;
          o.hp = c.hp <= 0 ? 0 : c.hp * 2 <= c.max ? 1 : 2;
          if (c.fled) o.fled = true;
        }
        return o;
      }),
  };
}
// Open the realtime channel for a session code: Supabase Realtime Broadcast, or BroadcastChannel with ?net=local (tests).
function netOpen(code, onMsg, onSt) {
  if (NET.close) NET.close();
  NET.send = null;
  NET.close = null;
  if (NLOC) {
    var bc = new BroadcastChannel("enc-" + code);
    bc.onmessage = function (e) {
      onMsg(e.data);
    };
    NET.send = function (m) {
      bc.postMessage(m);
    };
    NET.close = function () {
      bc.close();
    };
    onSt("on");
    return;
  }
  onSt("wait");
  fetch("session.json", { cache: "no-store" })
    .then(function (r) {
      return r.json();
    })
    .then(function (cfg) {
      if (!cfg || !cfg.url || !cfg.key) {
        onSt("nocfg");
        return;
      }
      var go = function () {
        try {
          var sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false, autoRefreshToken: false } });
          var ch = sb.channel("enc-" + code, { config: { broadcast: { self: false } } });
          ch.on("broadcast", { event: "m" }, function (p) {
            onMsg(p.payload);
          }).subscribe(function (st) {
            onSt(st === "SUBSCRIBED" ? "on" : st === "CLOSED" ? "off" : "err");
          });
          NET.send = function (m) {
            ch.send({ type: "broadcast", event: "m", payload: m });
          };
          NET.close = function () {
            try {
              sb.removeChannel(ch);
            } catch (e) {}
          };
        } catch (e) {
          onSt("err");
        }
      };
      if (window.supabase) go();
      else {
        var sc = document.createElement("script");
        sc.src = "supabase.js";
        sc.onload = go;
        sc.onerror = function () {
          onSt("err");
        };
        document.head.appendChild(sc);
      }
    })
    .catch(function () {
      onSt("nocfg");
    });
}
var wl = null;
function wake() {
  try {
    if (navigator.wakeLock && !document.hidden)
      navigator.wakeLock
        .request("screen")
        .then(function (l) {
          wl = l;
        })
        .catch(function () {});
  } catch (e) {}
}
document.addEventListener("visibilitychange", function () {
  if (!document.hidden && (NETV || (S.sess && S.sess.on))) wake();
});
// ---- DM side ----
function netPush() {
  if (!NET || !S.sess || !S.sess.on || !NET.send || NET.st !== "on") return;
  clearTimeout(NET.t);
  NET.t = setTimeout(function () {
    if (NET.send) NET.send({ t: "snap", s: tableSnap() });
  }, 150);
}
function sessStart() {
  var Z = sessOf();
  Z.on = true;
  wake();
  netOpen(
    Z.code,
    function (m) {
      if (!m) return;
      if (m.t === "hello") netPush();
      else if (m.t === "req") netReq(m);
    },
    function (st) {
      NET.st = st;
      if (st === "on") netPush();
      renderBar();
      if (S.tab === "data" && ui.drawer) renderDrawer();
    },
  );
  clearInterval(NET.hb);
  NET.hb = setInterval(netPush, 20000);
}
function sessStop() {
  if (S.sess) S.sess.on = false;
  clearInterval(NET.hb);
  if (NET.close) NET.close();
  NET.close = NET.send = null;
  NET.st = "off";
}
// A player link asked for a change (HP, AC, initiative, condition): check the key and the DM's toggles, then apply it without an undo step.
function netReq(m) {
  var Z = S.sess;
  if (!Z || !Z.on) return;
  var c = S.list.find(function (x) {
    return x.kind === "pc" && pkOf(x) === String(m.p);
  });
  if (!c || !Z.keys[pkOf(c)] || Z.keys[pkOf(c)] !== m.k) return;
  var v = Math.floor(+m.v),
    f = m.f,
    E = Z.edit,
    msg = "";
  if ((f === "dmg" || f === "heal" || f === "hp") && E.hp && v >= 0 && v <= 999) {
    if (f === "dmg") {
      dmg(c, v);
      msg = "took " + v + " damage";
    } else if (f === "heal") {
      heal(c, v);
      msg = "healed " + v;
    } else {
      v = Math.min(c.max, v);
      if (v > c.hp) heal(c, v - c.hp);
      else if (v < c.hp) {
        var tp = c.temp;
        c.temp = 0;
        dmg(c, c.hp - v);
        c.temp = tp;
      }
      msg = "set HP to " + v;
    }
  } else if (f === "ac" && E.ac && v >= 1 && v <= 40) {
    c.ac = v;
    msg = "set AC to " + v;
  } else if (f === "init" && E.init && v >= -4 && v <= 49) {
    c.init = v;
    msg = "set initiative to " + v;
  } else if (f === "cond" && E.st && CONDS.indexOf(m.v) >= 0) {
    var i = c.conds.indexOf(m.v);
    if (i >= 0) {
      c.conds.splice(i, 1);
      incSync(c, false);
      msg = "removed " + nm(m.v);
    } else if (!condBlocked(c, m.v)) {
      c.conds.push(m.v);
      incSync(c, true);
      msg = "added " + nm(m.v);
    }
  }
  if (!msg) return;
  logAdd("<b>" + esc(c.name) + "</b> (player) " + esc(msg));
  toast("📱 <b>" + esc(c.name) + "</b> " + esc(msg));
  save();
  renderBoard();
}
function sessLink(c) {
  var Z = sessOf(),
    b = location.origin + location.pathname + "?view=" + (c ? "player" : "table") + "&s=" + Z.code + (NLOC ? "&net=local" : "");
  if (!c) return b;
  var k = pkOf(c);
  if (!Z.keys[k]) Z.keys[k] = rnd(8);
  return b + "&p=" + encodeURIComponent(k) + "&k=" + Z.keys[k];
}
function sessHTML() {
  var Z = sessOf(),
    P = S.list.filter(function (c) {
      return c.kind === "pc";
    });
  var st = {
    off: "Off",
    wait: "Connecting…",
    on: "Live",
    err: "Connection problem: check Wi-Fi; if it stays, the Supabase project may be paused (restore it in the Supabase dashboard)",
    nocfg: "Not set up yet: add your Supabase project URL and publishable key to session.json (see README)",
  }[Z.on ? NET.st : "off"];
  var h =
    '<p><b>Other devices</b>: the table link shows the turn order; a player link also lets that player change their own character when you allow it below. <span class="sst ' +
    (Z.on ? NET.st : "off") +
    '">' +
    esc(st) +
    "</span></p>" +
    '<div class="row"><button class="' +
    (Z.on ? "" : "add") +
    '" data-act="sesson">' +
    (Z.on ? "Stop session" : "Start session") +
    "</button>" +
    (Z.on
      ? '<button data-act="sesscopy" data-l="all">Copy all links</button>' +
        (S.hook ? '<button data-act="sessdisc" title="Posts only the view-only table link">Table link to Discord</button>' : "")
      : "") +
    '<button data-act="sessnew">' +
    (ui.sessNew ? "Tap again: old links stop working" : "New links") +
    "</button></div>";
  if (!Z.on) return h;
  h +=
    '<div class="sesst"><b>Players may change:</b>' +
    [
      ["hp", "HP"],
      ["ac", "AC"],
      ["init", "Initiative"],
      ["st", "Conditions"],
    ]
      .map(function (x) {
        return (
          '<label><input type="checkbox" data-act="sesstog" data-k="' +
          x[0] +
          '"' +
          (Z.edit[x[0]] ? " checked" : "") +
          "><span>" +
          x[1] +
          "</span></label>"
        );
      })
      .join("") +
    "</div>";
  var row = function (n, l, c) {
    return (
      '<div class="lib"><span class="grow"><b>' +
      esc(n) +
      '</b><br><span class="meta slk">' +
      esc(l) +
      '</span></span><button data-act="sesscopy" data-l="' +
      (c ? c.id : "t") +
      '">Copy</button></div>'
    );
  };
  h +=
    row("Table (view only)", sessLink(null), null) +
    P.map(function (c) {
      return row(c.name, sessLink(c), c);
    }).join("");
  if (!P.length) h += '<p class="muted">Add the party to get a link per player.</p>';
  return h;
}
function sessAct(act, b) {
  var Z = sessOf();
  if (act === "sesson") {
    if (Z.on) sessStop();
    else sessStart();
  } else if (act === "sesstog") {
    Z.edit[b.dataset.k] = b.checked;
  } else if (act === "sessnew") {
    if (!ui.sessNew) {
      ui.sessNew = true;
      renderDrawer();
      return;
    }
    ui.sessNew = false;
    var on = Z.on,
      E = Z.edit;
    sessStop();
    S.sess = null;
    sessOf().edit = E;
    if (on) sessStart();
  } else if (act === "sesscopy") {
    var l = b.dataset.l,
      t =
        l === "t"
          ? sessLink(null)
          : l === "all"
            ? "Table: " +
              sessLink(null) +
              "\n" +
              S.list
                .filter(function (c) {
                  return c.kind === "pc";
                })
                .map(function (c) {
                  return c.name + ": " + sessLink(c);
                })
                .join("\n")
            : sessLink(findC(l));
    ui.clip = t;
    try {
      navigator.clipboard.writeText(t).then(
        function () {
          toast("Copied");
        },
        function () {
          prompt("Copy this:", t);
        },
      );
    } catch (e) {
      prompt("Copy this:", t);
    }
  }
  if (act !== "sessnew") ui.sessNew = false;
  save();
  renderDrawer();
}
// ---- Viewer side (table or player link) ----
function meC() {
  return ME && ME.p
    ? S.list.find(function (c) {
        return c.pk === ME.p;
      })
    : null;
}
function renderMe() {
  var el = $("#me");
  if (!el) {
    el = document.createElement("div");
    el.id = "me";
    el.className = "me";
    $("#big").insertAdjacentElement("afterend", el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]");
      if (!b || !NET.send) return;
      var f = b.dataset.f,
        v = f === "cond" ? b.dataset.v : (el.querySelector('[data-in="' + b.dataset.i + '"]') || {}).value;
      if (f !== "cond" && (v === "" || v == null || isNaN(+v))) return;
      NET.send({ t: "req", p: ME.p, k: ME.k, f: f, v: f === "cond" ? v : +v });
      b.disabled = true;
      if (f === "dmg" || f === "heal") ui.meAmt = "";
      renderMe();
    });
    el.addEventListener("input", function (e) {
      if (e.target.dataset.in === "amt") ui.meAmt = e.target.value;
    });
  }
  var age = Date.now() - NET.last,
    nb = "";
  if (NET.st === "nocfg") nb = "This link is not set up yet (session.json is empty).";
  else if (!NET.last) nb = NET.st === "err" ? "Cannot connect. Check your internet connection." : "Waiting for the DM\u2019s screen…";
  else if (age > 60000) nb = "No signal from the DM for a while. This may be out of date.";
  var h = nb ? '<div class="netb">' + esc(nb) + "</div>" : "";
  var c = meC(),
    E = (S.sess || {}).edit || {};
  if (ME && ME.p && NET.last && !c) h += '<div class="mec muted">Your character is not in this encounter yet.</div>';
  if (c) {
    var ae = document.activeElement;
    if (ae && el.contains(ae) && ae.tagName === "INPUT" && !nb) {
      return;
    }
    var any = E.hp || E.ac || E.init || E.st;
    h +=
      '<div class="mec"><div class="meh"><b>' +
      esc(c.name) +
      "</b><span>HP <b>" +
      c.hp +
      "</b> / " +
      c.max +
      (c.temp ? " <small>+" + c.temp + " temp</small>" : "") +
      "</span><span>AC <b>" +
      c.ac +
      "</b></span><span>Init <b>" +
      (c.init == null ? "\u2014" : c.init) +
      "</b></span></div>" +
      (any ? "" : '<div class="muted">The DM has not opened editing.</div>') +
      (E.hp
        ? '<div class="mer"><input data-in="amt" type="number" inputmode="numeric" min="0" max="999" placeholder="Amount" value="' +
          esc(ui.meAmt || "") +
          '" aria-label="Amount"><button data-f="dmg" data-i="amt">Damage</button><button data-f="heal" data-i="amt">Heal</button><button data-f="hp" data-i="amt">Set HP</button></div>'
        : "") +
      (E.ac || E.init
        ? '<div class="mer">' +
          (E.ac
            ? '<input data-in="ac" type="number" inputmode="numeric" min="1" max="40" placeholder="AC" aria-label="AC"><button data-f="ac" data-i="ac">Set AC</button>'
            : "") +
          (E.init
            ? '<input data-in="init" type="number" inputmode="numeric" min="-4" max="49" placeholder="Init" aria-label="Initiative"><button data-f="init" data-i="init">Set initiative</button>'
            : "") +
          "</div>"
        : "") +
      (E.st
        ? '<div class="mer mest">' +
          CONDS.filter(function (x) {
            return x !== "Concentrating" && x !== "Incapacitated";
          })
            .map(function (x) {
              return (
                '<button class="' +
                (c.conds.indexOf(x) >= 0 ? "on" : "") +
                '" data-f="cond" data-v="' +
                esc(x) +
                '">' +
                esc(nm(x)) +
                "</button>"
              );
            })
            .join("") +
          "</div>"
        : "") +
      "</div>";
  }
  el.innerHTML = h;
  el.hidden = !h;
}
if (NETV) {
  ui.present = true;
  wake();
  netOpen(
    NETV,
    function (m) {
      if (!m || m.t !== "snap" || !m.s || !Array.isArray(m.s.list)) return;
      NET.last = Date.now();
      S = Object.assign(S, m.s);
      renderAll();
    },
    function (st) {
      NET.st = st;
      if (st === "on" && NET.send) NET.send({ t: "hello" });
      renderMe();
    },
  );
  setInterval(function () {
    if (!NET.last && NET.st === "on" && NET.send) NET.send({ t: "hello" });
    renderMe();
  }, 5000);
} else if (S.sess && S.sess.on) sessStart();
