"""Report how well the action parser reads every monster's actions.

Run from the repo root:  python tools/check_actions.py
Loads the app in a headless browser (same setup as the tests) and runs parseAct() on
every action, bonus action, reaction and legendary action in monsters.json.
Prints a summary per kind and lists the entries that didn't parse fully.
"""
import functools, http.server, os, sys, threading
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tests"))
import run_tests as R  # noqa: E402  (reuses the test harness: App, PORT, ROOT)
from playwright.sync_api import sync_playwright  # noqa: E402


def main():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("localhost", R.PORT), functools.partial(Quiet, directory=R.ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        kw = {"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}
        b = p.chromium.launch(**kw)
        a = R.App(b)
        res = a.j("""(function(){var out={kinds:{},bad:[],text:0,multi:0,multiOk:0,spellGroups:0,mons:0,full:0};
          MON.forEach(function(m){var ok=true;actsOf(m).forEach(function(x){
            var k=x.kind;out.kinds[k]=(out.kinds[k]||0)+1;
            if(k==='multi'){out.multi++;if(x.ok)out.multiOk++;}
            if(k==='spell')out.spellGroups+=x.spells.length;if(x.textOnly&&x.ok)out.text++;
            if(!x.ok){ok=false;out.bad.push(m.name+' | '+x.raw+' ('+k+')');}});
            out.mons++;if(ok)out.full++;});return out;})()""")
        a.close(); b.close()
    print(f"Monsters: {res['mons']}, fully parsed: {res['full']}")
    print("Entries by kind:", ", ".join(f"{k} {v}" for k, v in sorted(res["kinds"].items(), key=lambda x: -x[1])))
    print(f"Multiattack resolved: {res['multiOk']}/{res['multi']}; spell groups: {res['spellGroups']}")
    print(f"Attacks/saves with an effect but no damage or condition (the DM reads the text): {res['text']}")
    print(f"Not fully parsed: {len(res['bad'])}")
    for x in res["bad"]:
        print("  -", x)


if __name__ == "__main__":
    main()
