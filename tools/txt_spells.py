"""Turns pasted spell text (one '=== Name' block per spell, see README) into the app's spell format.

Usage: python tools/txt_spells.py local/spells.txt            -> prints JSON
       python tools/txt_spells.py local/spells.txt --merge    -> adds/updates them in local/my-books.json (your own file)
Block: '=== Name', 'Level N School (Class, Class)' (or 'Cantrip School (...)'), 'Casting Time:', 'Range:',
'Components:', 'Duration:', description, optional 'Using a Higher-Level Spell Slot:', optional '--- Stat block name' + stat block.
"""
import json, re, sys

DT = "acid bludgeoning cold fire force lightning necrotic piercing poison psychic radiant slashing thunder".split()
AB = {"Strength": "strength", "Dexterity": "dexterity", "Constitution": "constitution",
      "Intelligence": "intelligence", "Wisdom": "wisdom", "Charisma": "charisma"}


def parse(text):
    out = []
    for blk in re.split(r"^=== ", text, flags=re.M)[1:]:
        lines = [l.rstrip() for l in blk.strip().splitlines()]
        name, head = lines[0].strip(), lines[1]
        m = re.match(r"(?:Level (\d)|Cantrip) (\w+) \(([^)]*)\)", head)
        if not m:
            raise ValueError(f"{name}: second line should be 'Level N School (Classes)'")
        f, body, hl, stat = {}, [], "", []
        for l in lines[2:]:
            k = re.match(r"(Casting Time|Range|Components|Duration): (.*)", l)
            if k and not body:
                f[k.group(1)] = k.group(2); continue
            if stat or l.startswith("--- "):
                stat.append(("**" + l[4:] + "**") if l.startswith("--- ") else l); continue
            if l.startswith("Using a Higher-Level Spell Slot:"):
                hl = l.split(":", 1)[1].strip(); continue
            if l:
                body.append(l)
        tx = "\n\n".join(body) + ("\n\n" + "\n\n".join(x for x in stat if x) if stat else "")
        main = "\n".join(body)
        lvl = int(m.group(1) or 0)
        dice = re.search(r"\b(\d+d\d+)\b", main)
        dts = []
        for t in re.findall(r"\b(" + "|".join(d.title() for d in DT) + r") damage", main):
            if t.lower() not in dts:
                dts.append(t.lower())
        # the spell's own save, not a "save at the end of each of its turns" to end it (Blinding Smite)
        sv = next((m2 for x in re.split(r"(?<=\.) ", main) if "end of each of its turns" not in x
                   for m2 in [re.search(r"\b(" + "|".join(AB) + r") saving throw", x)] if m2), None)
        up = []
        u = re.search(r"increases? by (\d+)d(\d+) for each spell slot level above (\d)", hl)
        if dice and u:
            n0, s0 = map(int, dice.group(1).split("d"))
            for L in range(int(u.group(3)) + 1, 10):
                up.append(f"{L}:{n0 + int(u.group(1)) * (L - int(u.group(3)))}d{s0}")
        dur = f.get("Duration", "")
        out.append({"n": name, "l": lvl, "sc": m.group(2).lower(), "t": f.get("Casting Time", ""), "r": f.get("Range", ""),
                    "c": f.get("Components", ""), "d": re.sub(r"^Concentration, up to ", "", dur), "cn": dur.startswith("Concentration"),
                    "ri": False, "cl": [c.strip().lower() for c in m.group(3).split(",")],
                    "sv": AB[sv.group(1)] if sv else "", "at": bool(re.search(r"spell attack", main)),
                    "dt": dts, "dr": dice.group(1) if dice and dts else "", "tx": tx, "hl": hl, "up": up})
    return out


if __name__ == "__main__":
    sp = parse(open(sys.argv[1], encoding="utf-8").read())
    if "--merge" in sys.argv:
        import os
        path = os.path.join("local", "my-books.json")
        p = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {"monsters": [], "spells": [], "aliases": {}}
        names = {s["n"] for s in sp}
        p["spells"] = sorted([s for s in p.get("spells", []) if s["n"] not in names] + sp, key=lambda s: s["n"])
        json.dump(p, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"Merged {len(sp)} spells; {len(p['spells'])} in {path}. Add the file again in the app (Data > Sources > Your files).")
    else:
        print(json.dumps(sp, ensure_ascii=False, indent=1))
