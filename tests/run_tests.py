"""Browser test battery for the Encounters app.

Run from the repo root:  python tests/run_tests.py
Needs:  pip install playwright && playwright install chromium
(or set CHROME=/path/to/chrome to use an installed Chrome).

Each test gets a fresh browser context (empty localStorage). A test hook is
injected into the served index.html (window.__e evaluates code inside the app)
so tests can set up state and inspect it; the app itself is not changed.
"""
import functools, http.server, json, os, sys, tempfile, threading, traceback
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", 8799))
URL = f"http://localhost:{PORT}/index.html"
TESTS, RESULTS = [], []


def test(fn):
    TESTS.append(fn)
    return fn


class App:
    def __init__(self, browser, w=1366, h=900, query=""):
        self.ctx = browser.new_context(viewport={"width": w, "height": h}, accept_downloads=True)
        self.pg = self.ctx.new_page()
        self.errors = []
        self.pg.on("pageerror", lambda e: self.errors.append(str(e)))
        self.pg.on("console", lambda m: m.type == "error" and "404" not in m.text and self.errors.append(m.text))
        self.pg.on("response", lambda r: r.status >= 400 and "/img/" not in r.url and self.errors.append(f"{r.status} {r.url}"))
        self.pg.on("dialog", lambda d: d.accept(self.prompt_answer) if d.type == "prompt" else d.accept())
        self.prompt_answer = ""
        self.ctx.route("**/index.html*", self._hook)
        self.pg.goto(URL + query)
        self.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")

    @staticmethod
    def _hook(route):
        body = route.fetch().text().replace(
            "function boot(MON){", "function boot(MON){window.__e=function(c){return eval(c)};", 1)
        route.fulfill(body=body, content_type="text/html")

    def e(self, code):
        return self.pg.evaluate("c => window.__e(c)", code)

    def j(self, code):
        return json.loads(self.e("JSON.stringify(" + code + ")"))

    def click(self, sel):
        self.pg.click(sel)
        self.pg.wait_for_timeout(60)

    def select(self, *ids):
        self.e("ui.more=true;ui.sel={};" + "".join(f"ui.sel[{i}]=true;" for i in ids) + "renderBoard()")

    def pad(self, kind, amount, dtype=""):
        # kind: dmg, half, heal, temp or maxdn (damage that also lowers max HP); one Apply does it all
        if kind in ("heal", "temp"):
            dtype = kind
        self.e(f"ui.amt={amount};ui.dtype='{dtype}';ui.half={'true' if kind == 'half' else 'false'};"
               f"ui.mx={'true' if kind == 'maxdn' else 'false'};var f=curFx();if(f&&f.st){{if(ui.half)delete ui.pend[f.st];else ui.pend[f.st]=true;}}renderPad()")
        self.click('[data-act="papply"]')

    def mon(self, mid, qty=1):
        return self.e(f"addMon('{mid}',{qty});save();renderBoard();S.list.slice(-{qty}).map(function(c){{return c.id;}})")

    def pc(self, name="Hero", ac=15, hp=20, **extra):
        x = json.dumps(dict(id="lt" + name, name=name, ac=ac, hp=hp, ib=2, **extra))
        return self.e(f"S.lib.push({x});addPc(S.lib[S.lib.length-1]);save();renderBoard();S.list[S.list.length-1].id")

    def c(self, cid):
        return self.j(f"findC({cid})")

    def status(self, *names, search=False):
        self.click('[data-act="padstatus"]')
        for n in names:
            if search:
                self.pg.fill("#msearch", n.split()[0])
                self.pg.wait_for_timeout(150)
            self.click(f'[data-act="mi"][data-c="{n}"]')
        self.click('[data-act="mapply"]')
        self.click('[data-act="papply"]')

    def close(self):
        self.ctx.close()


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def eq(a, b, msg=""):
    if a != b:
        raise AssertionError(f"{msg} expected {b!r}, got {a!r}")


# ---------------------------------------------------------------- tests
@test
def loads_without_errors(b):
    a = App(b)
    check(a.e("MON.length") > 100, "monster library should load")
    check(a.pg.title(), "page has a title")
    eq(a.errors, [], "console errors on load:")


@test
def add_monsters_through_ui(b):
    a = App(b)
    a.click('[data-act="openadd"]')
    a.pg.fill("#search", "goblin warrior")
    a.pg.wait_for_timeout(150)
    a.pg.fill('[data-act="qty"][data-m="mm-goblin-warrior"]', "3")
    a.pg.dispatch_event('[data-act="qty"][data-m="mm-goblin-warrior"]', "input")
    a.click('[data-act="addmon"][data-m="mm-goblin-warrior"]')
    L = a.j("S.list.map(function(c){return c.name})")
    eq(L, ["Goblin Warrior 1", "Goblin Warrior 2", "Goblin Warrior 3"], "names")
    check(all(a.j("S.list.map(function(c){return c.hp>0&&c.init!=null})")), "HP and initiative rolled")


@test
def add_party_through_ui(b):
    a = App(b)
    a.click('[data-act="openadd"]')
    a.click('[data-act="sub"][data-s="party"]')
    a.pg.check('[data-act="at"][data-l="l1"]')
    a.pg.check('[data-act="at"][data-l="l2"]')
    a.click('[data-act="addparty"]')
    eq(a.j("S.list.map(function(c){return c.kind})"), ["pc", "pc"], "two players added")
    check(a.pg.is_disabled('[data-act="addparty"]'), "add button disabled when nothing is ticked")
    eq(a.e("S.list.length"), 2, "no duplicates")


@test
def initiative_order_and_turns(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior", 2)
    p = a.pc("Hero")
    a.e(f"findC({g[0]}).init=5;findC({g[1]}).init=18;renderBoard()")
    a.pg.fill(f'tr[data-id="{p}"] [data-act="init"]', "12")
    a.pg.press(f'tr[data-id="{p}"] [data-act="init"]', "Tab")
    eq(a.j("order().map(function(c){return c.id})"), [g[1], p, g[0]], "order by initiative")
    a.click('[data-act="next"]')
    eq(a.e("S.turnId"), g[1], "combat starts with highest")
    a.click('[data-act="next"]'); a.click('[data-act="next"]'); a.click('[data-act="next"]')
    eq((a.e("S.turnId"), a.e("S.round")), (g[1], 2), "wraps to round 2")
    a.e(f"findC({p}).hp=0;setDead(findC({p}));findC({g[0]}).hp=0;renderBoard()")
    a.click('[data-act="next"]')
    eq(a.e("S.turnId"), g[1], "dead creatures are skipped")


@test
def damage_temp_heal(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    a.e(f"var c=findC({m});c.hp=c.max=20;c.temp=5")
    a.select(m)
    a.pad("dmg", 8)
    eq((a.c(m)["hp"], a.c(m)["temp"]), (17, 0), "temp HP absorbs first")
    a.select(m); a.pad("half", 7)
    eq(a.c(m)["hp"], 14, "half rounds down (7 -> 3)")
    a.select(m); a.pad("heal", 50)
    eq(a.c(m)["hp"], 20, "heal capped at max")
    a.select(m); a.pad("temp", 6)
    a.select(m); a.pad("temp", 3)
    eq(a.c(m)["temp"], 6, "temp HP does not stack, keeps higher")
    eq(a.j("ui.sel"), {}, "selection cleared after apply")


@test
def death_saves_and_dying(b):
    a = App(b)
    p = a.pc("Hero", hp=10)
    a.select(p); a.pad("dmg", 12)
    c = a.c(p)
    eq((c["hp"], c["ds"]), (0, {"s": 0, "f": 0}), "drops to 0 and starts death saves")
    a.select(p); a.pad("dmg", 3)
    eq(a.c(p)["ds"]["f"], 1, "damage at 0 HP adds a failure")
    a.e(f"S.turnId={p};renderBoard()")
    for _ in range(2):
        a.click('#turn [data-act="dsF"]')
    check("Dead" in a.c(p)["conds"], "three failures = dead")
    a.click('#turn [data-act="dsdec"][data-k="f"]') if a.pg.query_selector('#turn [data-act="dsdec"][data-k="f"]') else a.e(f"dsAct(findC({p}),'dsdec',{{dataset:{{k:'f'}}}});renderBoard()")
    check("Dead" not in a.c(p)["conds"], "removing a failure revives (undo)")
    a.e(f"S.turnId={p};renderBoard()")
    a.click('#turn [data-act="ds20"]')
    eq((a.c(p)["hp"], a.c(p)["ds"]), (1, None), "nat 20 = 1 HP")
    q = a.pc("Frail", hp=10)
    a.select(q); a.pad("dmg", 20)
    check("Dead" in a.c(q)["conds"], "massive damage (>= max beyond 0) kills outright")
    a.select(q); a.pad("heal", 5)
    check("Dead" not in a.c(q)["conds"] and a.c(q)["hp"] == 5, "healing a dead PC (e.g. Revivify) clears Dead")


@test
def typed_damage(b):
    a = App(b)
    sk, fe, gw = a.mon("mm-skeleton")[0], a.mon("mm-fire-elemental")[0], a.mon("mm-goblin-warrior")[0]
    p = a.pc("Raging", res=["fire"])
    a.e("S.list.forEach(function(c){c.hp=c.max=100})")
    a.select(sk, fe, gw, p); a.pad("dmg", 21, "fire")
    eq([a.c(x)["hp"] for x in (sk, fe, gw, p)], [79, 100, 79, 90], "fire: immune elemental, resistant PC (21->10)")
    a.select(sk, fe); a.pad("dmg", 9, "bludgeoning")
    eq([a.c(x)["hp"] for x in (sk, fe)], [61, 96], "bludgeoning: vulnerable x2, resistant half")
    a.e(f"findC({p}).conds.push('Raging')")
    a.select(p); a.pad("dmg", 10, "slashing")
    eq(a.c(p)["hp"], 85, "Raging halves slashing")
    check("damage" in a.pg.inner_text("#toast").lower(), "result note shown")
    eq(a.e("ui.dtype"), "", "type resets after apply")


@test
def statuses_and_incapacitated(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    a.select(m); a.status("Paralyzed")
    eq(sorted(a.c(m)["conds"]), ["Incapacitated", "Paralyzed"], "Paralyzed adds Incapacitated")
    a.click(f'tr[data-id="{m}"] [data-act="cond"][data-c="Paralyzed"]')
    eq(a.c(m)["conds"], [], "removing Paralyzed removes auto Incapacitated")
    a.select(m); a.status("Half cover", search=True)
    a.select(m); a.status("3/4 cover", search=True)
    eq(a.c(m)["conds"], ["3/4 cover"], "cover levels are exclusive")
    eq(a.e(f"effAC(findC({m}))"), a.c(m)["ac"] + 5, "3/4 cover adds +5 AC")


@test
def condition_immunity(b):
    a = App(b)
    sk, gw = a.mon("mm-skeleton")[0], a.mon("mm-goblin-warrior")[0]
    p = a.pc("Elfy", cimm=["charmed"])
    a.select(sk, gw, p); a.status("Poisoned", "Charmed")
    eq(a.c(sk)["conds"], ["Charmed"], "skeleton immune to Poisoned")
    eq(a.c(p)["conds"], ["Poisoned"], "player immune to Charmed")
    eq(sorted(a.c(gw)["conds"]), ["Charmed", "Poisoned"], "goblin gets both")
    check("Immune" in a.pg.inner_text("#toast"), "skipped creatures listed")


@test
def saves_view(b):
    a = App(b)
    a.mon("mm-skeleton")
    a.pc("Hero", saves={"str": 1, "dex": 5, "con": 2, "int": 0, "wis": 1, "cha": 0}, saveProf=["dex"], adv=["dex"])
    a.click('[data-act="saves"]')
    a.click('[data-act="sv"][data-n="1"]')
    t = a.pg.inner_text("#tbl")
    check("DEX +3" in t, "skeleton Dex save shown (ability mod)")
    check("DEX +5" in t and "ADV" in t.upper(), "player Dex save with species advantage")


@test
def groups(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior", 2) + a.mon("mm-skeleton", 1)
    a.select(*g)
    a.prompt_answer = "Ambush"
    a.click('[data-act="padgroup"]')
    eq(len(set(a.j("S.list.map(function(c){return c.init})"))), 1, "group shares one initiative")
    eq(set(a.j("S.list.map(function(c){return c.cg})")), {"Ambush"}, "group name set")
    a.select(*g); a.click('[data-act="padgroup"]')
    eq(a.j("S.list.filter(function(c){return c.cg}).length"), 0, "ungroup")


@test
def remove_with_confirm(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior", 3)
    a.e(f"S.turnId={g[0]}")
    a.select(g[0])
    a.click('[data-act="padremove"]')
    eq(a.e("S.list.length"), 3, "first tap only arms")
    a.click('[data-act="padremove"]')
    eq(a.e("S.list.length"), 2, "second tap removes")
    check(a.e("S.turnId") in g[1:], "turn moves to someone still in combat")


@test
def max_hp_down_and_reset(b):
    a = App(b)
    p = a.pc("Hero", hp=30)
    a.select(p); a.pad("maxdn", 8)
    eq((a.c(p)["max"], a.c(p)["hp"]), (22, 22), "max HP reduced (e.g. Spectre)")
    a.select(p); a.click('[data-act="padhp"][data-k="maxreset"]')
    eq(a.c(p)["max"], 30, "reset restores max")


@test
def edit_monster_and_extras(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior", 2)
    a.e(f"S.edit={m[0]};S.tab='edit';ui.drawer=true;renderDrawer()")
    a.pg.fill('[data-ed="name"]', "Boss <b>x</b>"); a.pg.press('[data-ed="name"]', "Tab")
    a.pg.fill('[data-ed="ac"]', "17"); a.pg.press('[data-ed="ac"]', "Tab")
    a.pg.fill('[data-ed="max"]', "40"); a.pg.press('[data-ed="max"]', "Tab")
    a.click('[data-act="exadd"]')
    a.pg.fill('[data-ex="n"]', "Big Axe"); a.pg.press('[data-ex="n"]', "Tab")
    a.click('[data-act="excopy"]')
    c = a.c(m[0])
    eq((c["name"], c["ac"], c["max"]), ("Boss <b>x</b>", 17, 40), "edits saved")
    eq(a.c(m[1])["x"][0]["n"], "Big Axe", "extras copied to the other goblin")
    check(a.pg.query_selector("#tbl b:text('x')") is None and "<b>x</b>" in a.pg.inner_text("#tbl"), "names are escaped (no HTML injection)")


@test
def player_sheet_and_new_character(b):
    a = App(b)
    a.click('[data-act="openadd"]'); a.click('[data-act="sub"][data-s="party"]')
    a.pg.fill("#newchar", "Pip"); a.click('[data-act="newchar"]')
    l = a.j("S.lib.find(function(l){return l.name==='Pip'})")
    eq((l["ac"], l["hp"], l["chk"]), (10, 10, True), "name-only character defaults to 10/10")
    a.pg.fill("#newchar", "Pip, AC 14"); a.click('[data-act="newchar"]')
    eq(a.j("S.lib.filter(function(l){return l.name==='Pip'}).length"), 1, "same name updates, no duplicate")
    eq(a.e("S.lib.find(function(l){return l.name==='Pip'}).ac"), 14, "AC updated")
    p = a.e("addPc(S.lib.find(function(l){return l.name==='Pip'}));S.list[S.list.length-1].id")
    a.e(f"S.edit={p};S.tab='edit';ui.drawer=true;renderDrawer()")
    a.pg.fill('[data-pe="abil"][data-k="dex"]', "18"); a.pg.press('[data-pe="abil"][data-k="dex"]', "Tab")
    a.pg.check('[data-pe="prof"][data-k="dex"]')
    a.pg.fill('[data-pe="imm"]', "poison, nonsense"); a.pg.press('[data-pe="imm"]', "Tab")
    a.pg.fill('[data-ed="max"]', "26"); a.pg.press('[data-ed="max"]', "Tab")
    l = a.j("S.lib.find(function(l){return l.name==='Pip'})")
    eq((l["saves"]["dex"], l["imm"], l["hp"], l["ib"]), (6, ["poison"], 26, 4), "sheet saved to library")
    a.e(f"S.list=S.list.filter(function(c){{return c.id!=={p}}});addPc(S.lib.find(function(l){{return l.name==='Pip'}}))")
    eq(a.j("S.list[S.list.length-1].max"), 26, "re-added player keeps edited max HP")


@test
def kanka_import(b):
    a = App(b)
    n = len(json.load(open(os.path.join(ROOT, "players.json"), encoding="utf-8")))
    a.click('[data-act="openadd"]'); a.click('[data-act="sub"][data-s="party"]')
    a.click('[data-act="kanka"]')
    a.pg.wait_for_function("window.__e('S.lib.filter(function(l){return l.k}).length')>0")
    eq(a.e("S.lib.filter(function(l){return l.k}).length"), n, "all Kanka players imported")
    k = a.j("S.lib.find(function(l){return l.k&&l.hpEst})")
    eq(k["hp"], k["hpEst"], "new Kanka players get estimated HP")
    a.e(f"var l=S.lib.find(function(l){{return l.k===\"{k['k']}\"||l.k=={k['k']}}});l.hp=99;l.hpMan=true;renderDrawer()")
    a.click('[data-act="kanka"]')
    a.pg.wait_for_timeout(400)
    check(a.pg.query_selector('[data-act="usekhp"][data-l="all"]'), "Use Kanka HP for all offered when hand-set HP differs")
    a.click('[data-act="usekhp"][data-l="all"]')
    eq(a.e("S.lib.filter(khpDiff).length"), 0, "all aligned with Kanka")
    eq(a.e("S.lib.filter(function(l){return l.k}).length"), n, "second import adds no duplicates")


@test
def effects_hidden_from_players(b):
    a = App(b)
    a.click('[data-act="openadd"]'); a.click('[data-act="sub"][data-s="effects"]')
    a.pg.fill("#fxname", "Secret lair"); a.pg.dispatch_event("#fxname", "input")
    a.pg.fill("#fxinit", "20"); a.pg.dispatch_event("#fxinit", "input")
    a.pg.uncheck("#fxvis")
    a.click('[data-act="addfx"]')
    eq(a.j("S.list.map(function(c){return [c.kind,c.init,c.vis]})"), [["fx", 20, False]], "hidden effect added")
    a.click('[data-act="close"]')
    a.click('[data-act="present"]')
    check("Secret lair" not in a.pg.inner_text("body"), "hidden effect not shown in table view")


@test
def prepared_encounters(b):
    a = App(b)
    a.pc("Hero")
    a.mon("mm-goblin-warrior", 2)
    a.e("ui.encName='Road ambush';ui.encNote='fog'")
    msg = a.e("encSave()")
    check("Saved" in msg, msg)
    a.e("S.list=S.list.filter(function(c){return c.kind==='pc'});renderBoard()")
    a.e("encLoad(S.enc[0],false);renderBoard()")
    eq(sorted(a.j("S.list.map(function(c){return c.kind})")), ["mon", "mon", "pc"], "load keeps players, brings monsters back")
    a.e("encLoad(S.enc[0],true);renderBoard()")
    eq(a.e("S.list.filter(function(c){return c.kind==='mon'}).length"), 4, "add brings reinforcements")
    eq(len(set(a.j("S.list.filter(function(c){return c.kind==='mon'}).map(function(c){return c.name})"))), 4, "reinforcements get unique names")


@test
def export_import_roundtrip(b):
    a = App(b)
    a.pc("Hero"); a.mon("mm-skeleton", 2)
    a.e("S.tab='data';ui.drawer=true;renderDrawer()")
    with a.pg.expect_download() as dl:
        a.click('[data-act="export"]')
    path = os.path.join(tempfile.mkdtemp(), "x.json")
    dl.value.save_as(path)
    a.e("S.list=[];save();renderBoard()")
    a.pg.set_input_files("#impfile", path)
    a.pg.wait_for_timeout(400)
    eq(a.e("S.list.length"), 3, "import restores the encounter")
    bad = os.path.join(tempfile.mkdtemp(), "bad.json")
    open(bad, "w").write('{"nope":1}')
    a.pg.set_input_files("#impfile", bad)
    a.pg.wait_for_timeout(300)
    eq(a.e("S.list.length"), 3, "bad file changes nothing")


@test
def persists_after_reload(b):
    a = App(b)
    p = a.pc("Hero"); a.mon("mm-skeleton")
    a.select(p); a.pad("dmg", 4)
    a.pg.reload(); a.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")
    eq((a.e("S.list.length"), a.c(p)["hp"]), (2, 16), "state survives reload")


@test
def corrupt_storage_recovers(b):
    a = App(b)
    a.pg.evaluate("localStorage.setItem('encounter-tracker-app-v1','{broken');localStorage.setItem('encounter-tracker-monsters','nope')")
    a.pg.reload(); a.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")
    eq(a.errors, [], "no errors with corrupt storage:")
    eq(a.e("S.list.length"), 0, "starts empty")


@test
def table_window_read_only(b):
    a = App(b)
    a.mon("mm-goblin-warrior", 2)
    t = App.__new__(App)
    t.ctx, t.errors = a.ctx, []
    t.pg = a.ctx.new_page()
    t.pg.on("pageerror", lambda e: t.errors.append(str(e)))
    t.pg.goto(URL + "?view=table"); t.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")
    eq(t.e("S.list.length"), 2, "table window shows the same encounter")
    check(not t.pg.query_selector('[data-act="next"]'), "no DM controls in the table window")
    a.select(*a.j("S.list.map(function(c){return c.id})")); a.pad("dmg", 1)
    t.pg.wait_for_timeout(400)
    eq(t.j("S.list.map(function(c){return c.hp})"), a.j("S.list.map(function(c){return c.hp})"), "updates live")
    eq(t.errors, [], "table window errors:")


@test
def clear_all_needs_two_taps(b):
    a = App(b)
    a.mon("mm-goblin-warrior", 2)
    a.click('[data-act="clear"]')
    eq(a.e("S.list.length"), 2, "first tap arms")
    a.click('[data-act="clear"]')
    eq(a.e("S.list.length"), 0, "second tap clears")


@test
def custom_monster_file(b):
    a = App(b)
    f = os.path.join(tempfile.mkdtemp(), "homebrew.json")
    json.dump({"monsters": [{"id": "hb-ooze", "name": "Glitter Ooze", "ac": 9, "hp": 30, "abil": [12, 6, 16, 1, 6, 2],
                             "extra": [["Immune", "Acid; Blinded"]]}, {"name": "broken"}]}, open(f, "w"))
    a.e("S.tab='data';ui.drawer=true;renderDrawer()")
    with a.pg.expect_navigation():
        a.pg.set_input_files("#monfile", f)
    a.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")
    m = a.mon("hb-ooze")[0]
    a.select(m); a.pad("dmg", 10, "acid")
    eq(a.c(m)["hp"], a.c(m)["max"], "homebrew immunity works")


@test
def edge_cases(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior", 2)
    a.select(g[0]); a.pad("dmg", 999)
    eq(a.c(g[0])["hp"], 0, "monster at 0")
    a.select(g[0]); a.pad("heal", 3)
    eq(a.c(g[0])["hp"], 3, "monster healed from 0")
    a.e("S.list.forEach(function(c){c.hp=0});S.turnId=null;renderBoard()")
    a.click('[data-act="next"]')
    eq(a.e("S.turnId"), None, "all dead: combat does not start, no crash")
    a.e("S.list.push({id:S.next++,kind:'fx',name:'Lair',desc:'',init:20,vis:true,ac:0,hp:0,max:0,temp:0,conds:[],cr:'',spent:{}});renderBoard()")
    a.click('[data-act="selall"]') if a.pg.query_selector('[data-act="selall"]') else None
    eq(a.e("S.list.filter(function(c){return c.kind==='fx'&&ui.sel[c.id]}).length"), 0, "effects never get selected")
    p = a.pc("Gone")
    a.e(f"S.lib=S.lib.filter(function(l){{return l.name!=='Gone'}});S.edit={p};S.tab='edit';ui.drawer=true;renderDrawer()")
    a.select(p); a.pad("dmg", 2, "fire")
    eq(a.c(p)["hp"], 18, "player removed from party library still takes damage")
    a.e(f"S.stat='pc';S.statC={p};S.tab='stat';renderDrawer();ui.sv=2;renderBoard()")
    q = a.e("S.lib.push({id:'old1',name:'Old save',ac:12,hp:9,ib:0});addPc(S.lib[S.lib.length-1]);renderBoard();S.list[S.list.length-1].id")
    a.e(f"S.stat='pc';S.statC={q};renderDrawer()")
    a.select(q); a.pad("dmg", 2, "cold")
    eq(a.c(q)["hp"], 7, "old-format player (no Kanka fields) works")
    m = a.mon("mm-goblin-warrior")[0]
    a.e(f"findC({m}).conds.push('Petrified');findC({m}).hp=findC({m}).max=40")
    a.select(m); a.pad("dmg", 10, "force")
    eq(a.c(m)["hp"], 35, "Petrified resists all damage")
    a.e("ui.amt=0;ui.sel={};ui.sel[" + str(m) + "]=true;renderPad()")
    check(a.e("document.querySelector('[data-act=papply]').disabled"), "nothing to apply: Apply disabled")
    eq(a.c(m)["hp"], 35, "amount 0 does nothing")
    eq(a.errors, [], "errors:")


@test
def remove_last_and_turn_state(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    a.click('[data-act="next"]')
    a.select(m); a.click('[data-act="padremove"]'); a.click('[data-act="padremove"]')
    eq((a.e("S.list.length"), a.e("S.turnId")), (0, None), "removing the only creature ends combat state")
    a.click('[data-act="next"]')
    eq(a.errors, [], "errors:")


@test
def undo_last_change(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    hp = a.c(m)["hp"]
    a.select(m); a.pad("dmg", 3)
    a.click('[data-act="undo"]')
    eq(a.c(m)["hp"], hp, "undo restores HP")
    check(not a.pg.query_selector('[data-act="undo"]'), "undo is one step and then hidden")
    a.click('[data-act="next"]'); a.click('[data-act="undo"]')
    eq(a.e("S.turnId"), None, "undo next turn")
    a.click('[data-act="clear"]'); a.click('[data-act="clear"]'); a.click('[data-act="undo"]')
    eq(a.e("S.list.length"), 1, "undo clear all")
    a.select(m); a.status("Prone"); a.click('[data-act="undo"]')
    eq(a.c(m)["conds"], [], "undo statuses")
    a.pg.reload(); a.pg.wait_for_function("window.__e && window.__e('MON.length') > 0")
    eq(a.e("S.list.length"), 1, "state after undo was saved")


@test
def concentration_reminders(b):
    a = App(b)
    m, p = a.mon("mm-goblin-warrior")[0], a.pc("Caster", hp=30)
    a.e(f"findC({m}).hp=findC({m}).max=50;findC({m}).conds.push('Concentrating');findC({p}).conds.push('Concentrating')")
    a.select(m, p); a.pad("dmg", 26)
    t = a.pg.inner_text("#toast")
    check("DC 13" in t and "DC 10" not in t.split("Caster")[0], f"DC = half damage, min 10: {t}")
    a.select(p); a.pad("dmg", 40)
    check("Concentrating" not in a.c(p)["conds"] and "loses concentration" in a.pg.inner_text("#toast"), "0 HP ends concentration")


@test
def simpler_screens(b):
    a = App(b)
    a.click('[data-act="start"][data-s="party"]')
    check(a.pg.query_selector('[data-act="addparty"]'), "empty screen: Add your party opens the party tab")
    a.click('[data-act="close"]')
    m = a.mon("mm-goblin-warrior")[0]
    a.e(f"findC({m}).conds.push('Prone');renderBoard()")
    check("Prone." not in a.pg.inner_text("#tbl"), "rule text hidden on unselected rows")
    a.e(f"ui.more=false;ui.sel={{}};ui.sel[{m}]=true;renderBoard()")
    check("Prone." in a.pg.inner_text("#tbl"), "rule text shown on selected rows")
    check(not a.pg.query_selector('[data-k="maxreset"]'), "rare pad buttons hidden")
    a.click('[data-act="padmore"]')
    check(a.pg.query_selector('[data-k="maxreset"]'), "More shows them")


@test
def off_turn_info_and_dc(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    p = a.pc("Bard", abil={"str": 8, "dex": 14, "con": 12, "int": 10, "wis": 12, "cha": 17}, pp=13,
             parsed=[{"class": "bard", "subclass": "", "level": 5}, {"class": "rogue", "subclass": "arcane trickster", "level": 3}],
             saves={"str": -1, "dex": 5, "con": 1, "int": 0, "wis": 1, "cha": 6}, saveProf=["dex", "cha"])
    a.e(f"findC({m}).init=20;findC({p}).init=5;findC({m}).conds.push('3/4 cover');renderBoard()")
    check("20" in a.pg.inner_text(f'tr[data-id="{m}"] .acb'), "row shows current AC, not base")
    check("\U0001F441 9" in a.pg.inner_text(f'tr[data-id="{m}"]'), "monster passive Perception on row")
    a.click(f'tr[data-id="{m}"] [data-act="rx"]')
    eq(a.c(m).get("rx"), True, "reaction marked used")
    a.click('[data-act="next"]')
    eq(a.c(m).get("rx"), False, "reaction resets on own turn")
    a.e(f"findC({m}).conds.push('Stunned');renderBoard()")
    check("No reactions" in a.pg.inner_text(f'tr[data-id="{m}"]'), "stunned: no reactions")
    a.click('[data-act="next"]')
    t = a.pg.inner_text("#turn")
    check("DC 14" in t and "+6 to hit" in t and "DC 11" in t, "multiclass DCs: bard 8+3+3, arcane trickster 8+3+0")
    check("Saves" in t, "player card shows saves")
    a.click('#turn [data-act="tcol"]')
    check("+6 to hit" not in a.pg.inner_text("#turn"), "Hide details hides the player card body")
    a.click('#turn [data-act="tcol"]')
    check("+6 to hit" in a.pg.inner_text("#turn"), "Show details brings it back")
    a.click(f'tr[data-id="{m}"] .acb')
    eq((a.e("S.tab"), a.e("S.edit")), ("edit", m), "tapping AC opens Edit for base AC")
    eq(a.errors, [], "errors:")


@test
def legendary_and_auto_expiry(b):
    a = App(b)
    d = a.e("MON.find(function(m){return /in Lair/.test(((m.leg||[])[0]||['',''])[1])}).id")
    m = a.mon(d)[0]; p = a.pc("Hero"); q = a.pc("Mage")
    a.e(f"findC({m}).init=20;findC({p}).init=15;findC({q}).init=10;renderBoard()")
    a.click('[data-act="next"]')
    check(not a.pg.query_selector('#turn [data-act="laspend"]'), "no legendary prompt on its own turn")
    n = a.e(f"legOf(findC({m})).la")
    a.click('[data-act="lair"]')
    eq(a.e(f"legOf(findC({m})).la"), n + 1, "In lair adds a use")
    a.click('[data-act="next"]')
    check(not a.pg.query_selector('#turn [data-act="laspend"]'), "no prompt right after its own turn")
    a.select(m); a.status("Shield", search=True)
    a.select(m); a.status("Guiding Bolt", search=True)
    a.click('[data-act="next"]')
    a.click('#turn [data-act="laspend"]')
    eq(a.c(m)["la"], 1, "Use one spends a legendary action")
    a.click(f'tr[data-id="{m}"] .pip[data-k="lr"].on')
    eq(a.c(m)["lr"], 1, "pip spends Legendary Resistance")
    a.click('[data-act="next"]')
    eq((a.c(m)["conds"], a.c(m)["la"], a.c(m)["lr"]), (["Guiding Bolt"], 0, 1), "Shield ends and actions refill on its turn; LR does not")
    a.click('[data-act="next"]'); a.click('[data-act="next"]')
    eq(a.c(m)["conds"], [], "Guiding Bolt ends at the end of the caster's next turn")
    a.click('[data-act="undo"]')
    eq(a.c(m)["conds"], ["Guiding Bolt"], "undo brings it back")
    eq(a.errors, [], "errors:")


@test
def concentration_links(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior", 2); p = a.pc("Cleric"); q = a.pc("Wizard")
    a.e(f"findC({p}).init=20;findC({q}).init=15;findC({g[0]}).init=10;findC({g[1]}).init=5;renderBoard()")
    a.click('[data-act="next"]')  # Cleric casts Bless on both players
    a.select(p, q); a.status("Blessed", search=True)
    check("Concentrating" in a.c(p)["conds"], "caster gets Concentrating")
    check("(Cleric)" in a.pg.inner_text(f'tr[data-id="{q}"]'), "chip names the caster")
    a.click('[data-act="next"]')  # Wizard hastes himself, then is knocked out later
    a.select(q); a.status("Hasted", search=True)
    a.select(g[0], g[1]); a.status("Slowed", search=True)  # second concentration spell replaces Haste
    eq(("Hasted" in a.c(q)["conds"], "Lethargic" in a.c(q)["conds"]), (False, True), "new concentration ends Haste, Lethargic follows")
    a.click(f'tr[data-id="{p}"] [data-act="cond"][data-c="Concentrating"]')
    eq(["Blessed" in a.c(x)["conds"] for x in (p, q)], [False, False], "dropping concentration removes Bless")
    a.e(f"findC({q}).hp=0;renderBoard()")
    eq(["Slowed" in a.c(x)["conds"] for x in g], [False, False], "caster at 0 HP drops Slow")
    eq(a.errors, [], "errors:")


@test
def lair_saved_with_encounter(b):
    a = App(b)
    a.e("addMon(MON.find(function(m){return (m.leg||[]).length}).id,1);S.lair=true;ui.encName='Lair fight';ui.encNote='';encSave();S.list=[];S.lair=false;encLoad(S.enc[0],false)")
    eq(a.e("S.lair"), True, "loading restores In lair")
    eq(a.errors, [], "errors:")


def layout_case(b, w, h):
    a = App(b, w, h)
    a.mon("mm-skeleton", 3); a.pc("Hero")
    eq(a.pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), True, f"{w}px: no sideways scroll")
    a.select(*a.j("S.list.map(function(c){return c.id})"))
    a.e("S.stat='mm-skeleton';S.statC=S.list[0].id;S.tab='stat';ui.drawer=true;ui.menu=true;renderDrawer();renderBoard()")
    vis = a.pg.evaluate("""()=>{const b=document.querySelector('[data-act=mapply]').getBoundingClientRect();
        const t=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return !!(t&&t.closest('[data-act=mapply]'))}""")
    eq(vis, True, f"{w}x{h}: status Apply reachable with stat block open")
    a.e("ui.menu=false;" + ("ui.drawer=false;renderDrawer();" if w < 600 else "") + "renderPad()")
    vis = a.pg.evaluate("""()=>{const b=document.querySelector('[data-act=papply]').getBoundingClientRect();
        const t=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return !!(t&&t.closest('[data-act=papply]'))}""")
    eq(vis, True, f"{w}x{h}: Damage button reachable")
    eq(a.errors, [], "errors:")


for _w, _h in [(390, 844), (820, 1180), (1024, 768), (1180, 820), (1366, 768), (1920, 1080)]:
    TESTS.append(functools.update_wrapper(lambda b, w=_w, h=_h: layout_case(b, w, h), layout_case))
    TESTS[-1].__name__ = f"layout_{_w}x{_h}"


# ---------------------------------------------------------------- runner
@test
def xp_calculator_and_end_combat(b):
    a = App(b)
    a.e("S.lib=[{id:'l1',name:'A',ac:12,hp:20,ib:0,lvl:3},{id:'l2',name:'B',ac:12,hp:20,ib:0,parsed:[{class:'bard',level:2},{class:'wizard',level:1}]}];"
        "addPc(S.lib[0]);addPc(S.lib[1]);var m=MON.find(function(x){return x.cr==='1';});addMon(m.id,2);renderBoard()")
    t = a.pg.inner_text("#xpb")
    check("400" in t and "Moderate" in t, "2 x CR 1 = 400 XP vs two level-3 budgets (300/450/800): " + t)
    a.e("S.list.forEach(function(c){if(c.init==null)c.init=10;});renderBoard()")
    a.click('[data-act="next"]')
    check(a.pg.is_hidden("#xpb"), "XP bar hidden while combat runs")
    a.e("S.list[2].hp=3;S.list[2].conds.push('Prone');renderBoard()")
    a.click('[data-act="endc"]')
    check(a.e("S.turnId") is None and a.e("S.round") == 1, "combat ended")
    check(a.e("S.list[2].hp") == 3 and "Prone" in a.j("S.list[2].conds"), "HP and statuses kept")
    check(not a.pg.is_hidden("#xpb"), "XP bar back after combat")
    a.click('[data-act="undo"]')
    check(a.e("S.turnId") is not None, "undo restores combat")
    check(not a.errors, a.errors)


@test
def rules_reference(b):
    a = App(b)
    a.e("ui.drawer=true;S.tab='ref';renderDrawer()")
    a.pg.wait_for_selector('#refl button')
    a.pg.fill('#refq', 'fireb')
    a.pg.wait_for_timeout(60)
    check("Fireball" in a.pg.inner_text('#refl'), "search finds Fireball")
    a.click('#refl [data-n="Fireball"]')
    t = a.pg.inner_text('#drawer')
    check("8d6" in t and "Dexterity" in t, "spell card shows damage and save")
    a.click('[data-act="refback"]')
    a.pg.fill('#refq', 'prone')
    a.click('#refl [data-n="Prone"]')
    check("Prone" in a.pg.inner_text('#drawer'), "condition text shown")
    a.click('[data-act="refback"]')
    a.pg.fill('#refq', '')
    a.pg.select_option('#rc', 'warlock')
    a.pg.select_option('#rl', '0')
    names = a.pg.inner_text('#refl')
    check("Eldritch Blast" in names and "Fireball" not in names, "class + level filter")
    check(a.e("REF.spells.length") > 300, "SRD 5.2 spells loaded")
    check(not a.errors, a.errors)


@test
def effect_damage_and_status(b):
    a = App(b)
    a.e("S.lib=[{id:'l1',name:'A',ac:12,hp:20,ib:0,lvl:3}];addPc(S.lib[0]);S.list[0].init=5;"
        "var m=MON.find(function(x){return x.cr==='1';});addMon(m.id,2);S.list[1].init=4;S.list[2].init=3;renderAll()")
    a.e("ui.drawer=true;S.tab='add';S.sub='effects';renderDrawer()")
    a.pg.fill('#fxname', 'Rockfall'); a.pg.fill('#fxinit', '20'); a.pg.fill('#fxdd', '2d6')
    a.pg.select_option('#fxdt', 'bludgeoning'); a.pg.select_option('#fxsv', '1'); a.pg.fill('#fxdc', '13')
    a.pg.select_option('#fxst', 'Prone'); a.pg.select_option('#fxdur', 'fx')
    a.click('[data-act="addfx"]')
    fx = a.j("S.list.find(function(c){return c.kind==='fx';})")
    check(fx["dd"] == "2d6" and fx["st"] == "Prone" and fx["dc"] == 13, fx)
    a.click('[data-act="next"]')
    check("DEX save DC 13" in a.pg.inner_text('#turn'), "turn card shows payload")
    a.click('[data-act="fxgo"]')
    check(a.e("ui.sv") == 1, "Saves view opens on DEX")
    a.select(2, 3)
    a.pad("dmg", 7)
    check(a.e("S.list[1].hp") == a.e("S.list[1].max") - 7, "damage applied")
    check("Prone" in a.j("S.list[1].conds") and "Prone" in a.j("S.list[2].conds"), "status on failed save")
    a.select(1)
    a.pad("half", 7)
    check("Prone" not in a.j("S.list[0].conds"), "no status on half")
    for _ in range(4):
        a.click('[data-act="next"]')
    check(a.e("S.turnId") == fx["id"] and "Prone" not in a.j("S.list[1].conds"), "Prone ended when the effect acts again")
    check(not a.errors, a.errors)


@test
def party_list_tools(b):
    a = App(b, 390, 844)
    a.e("S.lib=[];for(var i=0;i<20;i++)S.lib.push({id:'l'+i,name:'Char '+String.fromCharCode(65+i),ac:12,hp:20,ib:0});ui.drawer=true;S.tab='add';S.sub='party';renderDrawer()")
    a.pg.check('[data-act="at"][data-l="l15"]')
    check("Char P" in a.pg.inner_text('.dfoot'), "footer names the ticked character")
    box = a.pg.query_selector('.dfoot').bounding_box()
    check(box["y"] + box["height"] <= 845, "add button visible without scrolling")
    a.pg.fill('#pq', 'char t')
    check(a.pg.query_selector_all('#plist .lib').__len__() == 1, "search filters")
    a.pg.fill('#pq', '')
    a.e("renderDrawer()")
    check("Char P" in a.pg.inner_text('#plist .lib'), "ticked character pinned first")
    a.click('[data-act="addparty"]')
    a.e("addMon(MON.find(function(x){return x.cr==='1';}).id,2);renderDrawer()")
    check("×2" in a.pg.inner_text('.esum'), "encounter summary shows monsters")
    a.click('[data-act="sumrm"]')
    eq(a.e("S.list.filter(function(c){return c.kind==='mon'}).length"), 1, "minus removes one")
    a.click('[data-act="libclear"]')
    a.click('[data-act="libclear"]')
    eq(a.j("S.lib.map(function(l){return l.name})"), ["Char P"], "delete all keeps characters in the encounter")
    w = a.pg.evaluate("document.querySelector('#tbl').getBoundingClientRect().right")
    check(w <= 390, "phone table fits the screen")
    check(not a.errors, a.errors)


@test
def stat_block_dice_and_spell_links(b):
    a = App(b)
    a.pg.wait_for_function("window.__e('REF&&REF.spells.length>0')")
    h = a.e("rich('Melee Attack Roll: +4, reach 5 ft. Hit: 6 (1d8 + 2) Slashing damage. DC 13')")
    check('<span class="dice">6 (1d8 + 2)</span>' in h and '<span class="hit">+4</span>' in h and 'dcx' in h, h)
    check('spl' not in a.e("rich('A shield bash: 4 (1d4) damage.')"), "lowercase words are not linked")
    h2 = a.e("rich('Bright Light. Fly Speed 20 ft. Fear Ray. Shield Bash. Under a Bless spell it has the Paralyzed condition.')")
    check(h2.count('class="spl"') == 1 and 'data-n="Bless"' in h2, "spells link outside casting text, ability names don't: " + h2)
    check('class="spl cnd" data-act="spl" data-n="Paralyzed"' in h2, "conditions are linked")
    h3 = a.e("rich('Hit: 7 (2d6) Cold damage. Bludgeoning, Piercing, and Slashing damage. Fire Aura.')")
    check(h3.count('class="dt ') == 4 and 'dt-cold' in h3 and 'Fire Aura' in h3, "damage types marked only before 'damage': " + h3)
    m = a.e("MON.find(function(x){return (x.actions||[]).concat(x.traits||[]).some(function(t){return /casts/.test(t[1])&&/Mage Hand/.test(t[1]);});}).id")
    a.e(f"ui.drawer=true;S.tab='stat';S.stat='{m}';S.statC=null;renderDrawer()")
    a.click('#drawer a.spl[data-n="Mage Hand"]')
    check(a.e("S.tab") == "ref" and "Mage Hand" in a.pg.inner_text('#drawer'), "spell link opens the rule")
    a.click('[data-act="refback"]')
    check(a.e("S.tab") == "stat", "back returns to the stat block")
    a.click('#drawer a.cnd')
    check(a.e("S.tab") == "ref" and a.e("REF.conditions[ui.ref]") is not None, "condition link opens the condition text")
    check(not a.errors, a.errors)


@test
def roll_tables_laid_out(b):
    a = App(b)
    n = a.e("MON.filter(function(m){return ['traits','actions','bonus','react','leg'].some(function(k){return (m[k]||[]).some(function(t){return blk(rich(t[1])).indexOf('class=\"ro\"')>=0;});});}).map(function(m){return m.name;}).sort().join(',')")
    for x in ["Beholder", "Death Tyrant", "Spectator", "Beholder Zombie", "Umber Hulk", "Gibbering Mouther", "Elemental Cataclysm"]:
        check(x in n.split(","), x + " roll table laid out: " + n)
    a.e("ui.drawer=true;S.tab='stat';S.stat='mm-beholder';S.statC=null;renderDrawer()")
    eq(a.e("document.querySelectorAll('#drawer .ro>div').length"), 10, "ten eye rays")
    check("Charm Ray" in a.e("document.querySelector('#drawer .ro .rh').textContent"), "ray names are headers")
    check(a.e("document.querySelectorAll('#drawer .ro .oc').length") >= 15, "failure/success on their own lines")
    check("<div" not in a.e("blk(rich('Melee Attack Roll: +4, reach 5 ft. Hit: 6 (1d8 + 2) Slashing damage.'))"), "short actions unchanged")
    check('class="oc"' in a.e("blk(rich('Dexterity Saving Throw: DC 12. Failure: 7 (2d6) Fire damage. Success: Half damage.'))"), "short saves get outcome lines too")
    check(not a.errors, a.errors)


@test
def phone_toolbar_one_line(b):
    a = App(b)
    J = "(function(){var k=[].slice.call(document.querySelectorAll('#bar>button')).filter(function(x){return x.offsetParent});var t=k.map(function(x){return Math.round(x.getBoundingClientRect().top)});return Math.max.apply(0,t)-Math.min.apply(0,t)+document.documentElement.scrollWidth-innerWidth})()"
    for w in (320, 360, 412):
        a.pg.set_viewport_size({"width": w, "height": 800})
        for started, armed in (("null", "false"), ("null", "true"), ("'z'", "false")):  # Clear is hidden on phones in combat
            if True:
                a.e(f"S.turnId={started};ui.undo={{label:'x'}};ui.confirmClear={armed};renderBar()")
                eq(a.e(J), 0, f"toolbar on one line, no side scroll at {w}px (combat={started}, armed={armed})")
    check(not a.errors, a.errors)


@test
def tablet_toolbar_one_line(b):
    a = App(b)
    J = "(function(){var k=[].slice.call(document.querySelectorAll('#bar>button')).filter(function(x){return x.offsetParent});var t=k.map(function(x){return Math.round(x.getBoundingClientRect().top)});return Math.max.apply(0,t)-Math.min.apply(0,t)+document.documentElement.scrollWidth-innerWidth})()"
    for w, h in ((744, 1133), (768, 1024), (820, 1180), (834, 1194), (1024, 768), (1180, 820), (1366, 768), (1920, 1080)):
        a.pg.set_viewport_size({"width": w, "height": h})
        for started in ("null", "'z'"):
            for armed in ("false", "true"):
                a.e(f"S.turnId={started};ui.undo={{label:'x'}};ui.confirmClear={armed};ui.present=false;renderBar()")
                eq(a.e(J), 0, f"toolbar on one line at {w}x{h} (combat={started}, armed={armed})")
                eq(a.e("[].slice.call(document.querySelectorAll('#bar [data-act=endc] .tx,#bar [data-act=undo] .tx')).filter(function(x){return x.offsetParent}).length"), 0, f"End combat/Undo icon-only at {w}px")
    check(not a.errors, a.errors)


@test
def stat_tab_follows_selection(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior")[0]
    d = a.mon("mm-green-dragon-wyrmling")[0]
    p = a.pc("Aer")
    tap = lambda i: a.e(f"document.querySelector('tr.r[data-id=\"{i}\"] td:nth-child(2)').click()")
    tab = lambda: a.e("ui.drawer=true;renderDrawer();document.querySelector('#drawer [data-act=tab][data-t=stat]').click()")
    a.e(f"S.stat='mm-goblin-warrior';S.statC={g};save()")
    tap(d); tab()
    eq(a.e("S.statC"), d, "selected monster shown"); eq(a.e("S.stat"), "mm-green-dragon-wyrmling", "its stat block")
    tap(p); tab()
    eq(a.e("S.statC"), p, "latest tapped of several selected wins"); eq(a.e("S.stat"), "pc", "player sheet")
    a.e("finishPad();renderBoard()"); a.e(f"S.stat='mm-goblin-warrior';S.statC={g}"); tab()
    eq(a.e("S.statC"), p, "nothing selected: last selected creature")
    tap(d)
    eq(a.e("S.statC"), d, "open Stat block tab follows taps live")
    check("Wyrmling" in a.e("document.querySelector('#drawer').textContent"), "drawer redrawn")
    check(not a.errors, a.errors)


@test
def general_statuses_and_mage_armor(b):
    a = App(b)
    p = a.pc("Aer", ac=13, abil={"dex": 16})
    m = a.mon("mm-archmage")[0]
    a.select(p, m); a.e("ui.menu=true;renderPad()")
    sec = a.e("[].map.call(document.querySelectorAll('.menu .ms'),function(x){return x.firstChild.textContent.trim()})")
    eq(sec[:3], ["Conditions", "General", "Spells and effects"], "General section sits above spells")
    gen = a.e("[].map.call(document.querySelectorAll('.menu .mg')[1].querySelectorAll('.mi'),function(x){return x.dataset.c})")
    check("Half cover" in gen and "Dodging" in gen and "Total cover" in gen, gen)
    check("Bless" in a.e("document.querySelector('#mres').textContent"), "spell names shown (Bless, not Blessed)")
    a.e(f"findC({p}).conds.push('Mage Armor');findC({m}).conds.push('Mage Armor')")
    eq(a.e(f"effAC(findC({p}))"), 16, "Mage Armor: 13 + Dex 3")
    eq(a.e(f"effAC(findC({m}))"), 17, "higher natural AC kept")
    a.e(f"findC({p}).conds.push('Shield')"); eq(a.e(f"effAC(findC({p}))"), 21, "Shield stacks on Mage Armor")
    check(not a.errors, a.errors)


@test
def dndbeyond_import_and_merge(b):
    a = App(b)
    a.pc("Aer Prismray", ac=13, hp=14, saves={"str": -1, "dex": 3, "con": 0, "int": 5, "wis": 4, "cha": 0}, adv=["cha", "int", "wis"], res=[], cls="Illusion Wizard - 3")
    P = [dict(id=172192516, name="Aer Prismray", classes="School of Illusion Wizard 3", level=3, race="Gnome", abilities=dict(str=8, dex=16, con=10, int=16, wis=14, cha=10),
              initMod=3, passivePerception=14, ac=13, hp=14, acNote="", saves=dict(str=-1, dex=3, con=0, int=5, wis=4, cha=0), saveProf=["int", "wis"], advSaves=["cha", "int", "wis"],
              advNote="Against Magic", resist=[], immune=[], vulnerable=[], condImmune=[], speed="25 ft.", senses="Darkvision 60 ft.", spells=["Mage Armor", "Shield", "Color Spray"], url="u"),
         dict(id=5, name="Newbie", classes="Fighter 1", level=1, race="Human", abilities=dict(str=16, dex=12, con=14, int=8, wis=10, cha=10), initMod=1, passivePerception=10,
              ac=16, hp=12, saves={}, saveProf=["str", "con"], advSaves=[], resist=[], immune=[], vulnerable=[], condImmune=[], spells=[], url="v")]
    msg = a.e(f"ddbUpdate({json.dumps(P)})")
    check("1 new, 1 updated" in msg, msg)
    ks = a.e("ui.merge.map(function(m){return m.k})")
    eq(sorted(ks), ["adv", "cls", "ib"], "only real differences are asked (advantage note, class wording, init +2 vs +3)")
    eq(a.e("S.lib.find(function(l){return l.name==='Newbie'}).ac"), 16, "new D&D Beyond character added")
    a.e("ui.drawer=true;S.tab='add';S.sub='party';renderDrawer()")
    check(a.e("document.querySelectorAll('#drawer [data-act=muse]').length") == 3, "a Use button per difference")
    a.e("document.querySelector('#drawer [data-act=mkeep]').click()")
    a.e("document.querySelector('#drawer [data-act=muse]').click()")
    a.e("document.querySelector('#drawer [data-act=mall][data-v=\"1\"]').click()")
    eq(a.e("ui.merge.length"), 0, "all answered")
    eq(a.e("S.lib.find(function(l){return l.name==='Aer Prismray'}).ib"), 2, "kept value stays (first row: init)")
    eq(a.e("S.lib.find(function(l){return l.name==='Aer Prismray'}).advNote"), "Against Magic", "used value applied")
    a.e(f"ddbUpdate({json.dumps(P)})")
    eq(a.e("ui.merge.length"), 0, "kept and used answers are not asked again")
    eq(a.e("S.lib.find(function(l){return l.name==='Aer Prismray'}).speed"), "25 ft.", "speed filled in")
    # spells of creatures present float to the top of the status list
    a.e("addPc(S.lib.find(function(l){return l.name==='Aer Prismray'}));renderBoard()")
    pr = a.e("present()")
    check("Mage Armor" in pr and "Shield" in pr, pr)
    a.mon("mm-archmage")
    check("Fly" in a.e("present()") or "Mind Spike" in a.e("present()") or len(a.e("present()")) > len(pr), "monster spellcasting adds its spells")
    check(not a.errors, a.errors)


@test
def one_apply_damage_and_status(b):
    a = App(b)
    g = a.mon("mm-goblin-warrior")[0]
    a.e(f"findC({g}).hp=findC({g}).max=20")
    a.e("refLoad()"); a.pg.wait_for_function("window.__e(\"REF && REF.spells && REF.spells.length\") > 0")
    a.select(g); a.e("ui.amt=7;renderPad()")
    a.click('[data-act="padstatus"]'); a.pg.fill("#msearch", "shocking"); a.pg.wait_for_timeout(150)
    a.click('[data-act="mi"][data-c="Shocked"]')
    eq(a.e("ui.dtype"), "lightning", "picking Shocking Grasp sets lightning")
    a.click('[data-act="mapply"]')
    check("7 lightning damage" in a.pg.inner_text('[data-act="papply"]') and "Shocking Grasp" in a.pg.inner_text('[data-act="papply"]'), "Apply button sums it up")
    a.click('[data-act="papply"]')
    eq(a.c(g)["hp"], 13, "damage applied"); check("Shocked" in a.c(g)["conds"], "status applied in the same tap")
    # half + max HP down, then heal mode
    a.select(g); a.e("ui.amt=6;renderPad()"); a.click('[data-act="ptog"][data-k="half"]'); a.click('[data-act="ptog"][data-k="maxdn"]'); a.click('[data-act="papply"]')
    eq((a.c(g)["hp"], a.c(g)["max"]), (10, 17), "half damage also lowers max HP")
    a.select(g); a.e("ui.amt=5;ui.dtype='heal';renderPad()")
    check(a.e("document.querySelector('[data-act=ptog][data-k=half]').disabled"), "half only for damage")
    a.click('[data-act="papply"]'); eq(a.c(g)["hp"], 15, "heal mode")
    a.click('[data-act="undo"]'); eq(a.c(g)["hp"], 10, "one undo step")
    # extra damage: own type, own resistances (skeleton: vulnerable to bludgeoning, immune to poison)
    k = a.mon("mm-skeleton")[0]; a.e(f"findC({k}).hp=findC({k}).max=30")
    a.select(k); a.e("ui.amt=4;ui.dtype='bludgeoning';renderPad()")
    a.click('[data-act="ptog"][data-k="extra"]'); a.e("ui.amt=5;ui.dtype='poison';renderPad()")
    check("4 bludgeoning + 5 poison damage" in a.pg.inner_text('[data-act="papply"]'), a.pg.inner_text('[data-act="papply"]'))
    a.click('[data-act="papply"]'); eq(a.c(k)["hp"], 22, "8 bludgeoning (vulnerable) + 0 poison (immune)")
    # damage type wheel: spinning picks the type, the middle item opens the full list
    a.select(k); a.e("ui.amt=3;renderPad()"); a.pg.wait_for_timeout(300)
    a.e("var t=document.getElementById('twheel');t.scrollTop=(TL().length+TL().indexOf('fire'))*IH;t.dispatchEvent(new Event('scroll'))")
    eq(a.e("ui.dtype"), "fire", "type wheel sets the damage type")
    check("3 fire damage" in a.pg.inner_text('[data-act="papply"]'), "Apply label follows the wheel")
    a.e("var t=document.getElementById('twheel');t.scrollTop=(TL().length-1)*IH;t.dispatchEvent(new Event('scroll'))")
    eq(a.e("ui.dtype"), "heal", "wheel loops: Heal sits just above Untyped")
    a.pg.wait_for_timeout(400)
    check(a.e("var t=document.getElementById('twheel');Math.round(t.scrollTop/IH)>=TL().length&&Math.round(t.scrollTop/IH)<2*TL().length"), "loop recentres after settling")
    eq(a.e("ui.dtype"), "heal", "still Heal after recentring")
    eq(a.e("TL()[1]"), "bludgeoning", "physical damage just below Untyped")
    a.e("renderPad()"); a.pg.wait_for_timeout(100)
    a.e("var k=TL().length+TL().indexOf(ui.dtype);document.querySelector('#twheel .wi[data-i=\"'+k+'\"]').click()")
    check(a.pg.is_visible('.tpick'), "tapping the middle type opens the list")
    a.click('.tpick [data-t="cold"]'); eq(a.e("ui.dtype"), "cold", "picked from the list")
    # middle of the wheel lines up with the band
    off = a.e("(function(){var w=document.getElementById('twheel'),b=w.parentNode.querySelector('.wband').getBoundingClientRect(),k=Math.round(w.scrollTop/IH),i=w.querySelector('.wi[data-i=\"'+k+'\"]').getBoundingClientRect();return Math.abs((i.top+i.bottom)/2-(b.top+b.bottom)/2)})()")
    check(off < 2, f"selected type centred in the band (off by {off}px)")
    check("Spin" not in a.pg.inner_text('#pad'), "no spin hint")
    a.e("finishPad();renderBoard()")
    # max HP only (Demilich Energy Drain, Otyugh bite): extra slot without damage
    a.select(g); a.click('[data-act="ptog"][data-k="extra"]'); a.e("ui.amt=4;ui.dtype='maxhp';renderPad()")
    a.click('[data-act="papply"]'); eq((a.c(g)["hp"], a.c(g)["max"]), (10, 13), "max HP lowered without damage")
    check(not a.errors, a.errors)


@test
def wheel_tap_to_type(b):
    a = App(b)
    m = a.mon("mm-goblin-warrior")[0]
    a.select(m); a.e("ui.amt=3;renderPad()")
    a.pg.wait_for_selector('#wheel')
    check(not a.pg.is_visible('#amtin'), "no separate number box")
    a.e("document.querySelector('#wheel .wi[data-n=\"5\"]').click()")
    eq(a.e("ui.amt"), 5, "tapping a number picks it")
    check(not a.pg.is_visible('#amtin'), "picking a number does not open typing")
    a.e("document.querySelector('#wheel .wi[data-n=\"5\"]').click()")
    check(a.pg.is_visible('#amtin'), "tapping the middle number opens typing")
    a.pg.keyboard.type("47")
    eq(a.e("ui.amt"), 47, "typed amount")
    a.pg.keyboard.press("Enter")
    check(not a.pg.is_visible('#amtin'), "Enter closes typing")
    a.pg.wait_for_timeout(400)
    a.e("var w=document.getElementById('wheel');ui.ignoreUntil=0;w.scrollTop=12*44;w.dispatchEvent(new Event('scroll'))")
    eq(a.e("ui.amt"), 12, "scrolling still changes the amount")
    check(not a.errors, a.errors)


@test
def phb_spells_and_aliases(b):
    a = App(b)
    a.pg.wait_for_function("window.__e('REF&&REF.spells.length>0')")
    check(a.e("REF.spells.some(function(x){return x.n==='Hunger of Hadar'&&x.src==='PHB';})"), "PHB spell loaded")
    h = a.e("rich('The vampire casts Hunger of Hadar (level 5 version). The dragon casts Melf\u2019s Acid Arrow.')")
    check('data-n="Hunger of Hadar"' in h and 'Melf' in h and 'Acid Arrow</a>' in h, h)
    a.e("ui.drawer=true;S.tab='ref';ui.ref=null;ui.rq='';renderDrawer()")
    names = a.pg.inner_text('#refl')
    check("Melf" not in names, "aliases hidden from the unfiltered list")
    a.pg.fill('#refq', 'melf')
    check("Melf" in a.pg.inner_text('#refl'), "aliases found by search")
    check(not a.errors, a.errors)


def main():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("localhost", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    only = sys.argv[1:]
    with sync_playwright() as p:
        kw = {"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}
        b = p.chromium.launch(**kw)
        for t in TESTS:
            if only and not any(o in t.__name__ for o in only):
                continue
            try:
                t(b)
                RESULTS.append((t.__name__, None))
                print(f"PASS  {t.__name__}")
            except Exception as ex:
                RESULTS.append((t.__name__, ex))
                print(f"FAIL  {t.__name__}: {ex}")
                if os.environ.get("TRACE"):
                    traceback.print_exc()
        b.close()
    srv.shutdown()
    bad = [r for r in RESULTS if r[1]]
    print(f"\n{len(RESULTS) - len(bad)}/{len(RESULTS)} passed")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
