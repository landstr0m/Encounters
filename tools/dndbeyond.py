"""Fetch public D&D Beyond characters and write dndbeyond.json for the Encounters app.

Run from the repo root:  python tools/dndbeyond.py
Reads character links or ids from dndbeyond.txt (one per line, # for comments).
Only PUBLIC characters work (sheet privacy "Public"); no login is used.
Unofficial: D&D Beyond has no public API, so the JSON may change. If a character
fails, its previous entry in dndbeyond.json is kept and the reason is printed.
Test without the network:  python tools/dndbeyond.py --file saved_character.json
"""
import json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST, OUT = os.path.join(ROOT, "dndbeyond.txt"), os.path.join(ROOT, "dndbeyond.json")
API = "https://character-service.dndbeyond.com/character/v5/character/{}"
AB = ["str", "dex", "con", "int", "wis", "cha"]
FULL = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
DT = {"acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"}
CONDS = {"blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"}


def mod(v):
    return (v - 10) // 2


def fetch(cid):
    req = urllib.request.Request(API.format(cid), headers={"User-Agent": "Encounters-tracker (personal use)", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        j = json.load(r)
    if not j.get("success") or not j.get("data"):
        raise ValueError(j.get("message") or "no data (is the character public?)")
    return j["data"]


def convert(d):
    level = sum(c["level"] for c in d["classes"]) or 1
    pb = 2 + (level - 1) // 4
    # Item modifiers count only for equipped items (and attuned, if attunement is needed):
    # an unequipped Potion of Fire Resistance must not give fire resistance.
    live = {i["definition"]["id"] for i in d.get("inventory", []) if i.get("equipped") and (not i["definition"].get("canAttune") or i.get("isAttuned"))}
    mods = [m for k, v in d["modifiers"].items() for m in (v or []) if k != "item" or m.get("componentId") in live]
    got = lambda t, s=None: [m for m in mods if m["type"] == t and (s is None or m["subType"] == s)]
    # Ability scores: base + bonuses, then overrides and "set" items (e.g. 19 Strength)
    sc = {}
    for i, k in enumerate(AB):
        base = (d["stats"][i]["value"] or 10) + (d["bonusStats"][i]["value"] or 0)
        base += sum(m["value"] or 0 for m in got("bonus", FULL[i] + "-score"))
        for m in got("set", FULL[i] + "-score"):
            base = max(base, m["value"] or 0)
        sc[k] = d["overrideStats"][i]["value"] or base
    md = {k: mod(v) for k, v in sc.items()}
    # Max HP
    hp = d.get("overrideHitPoints") or ((d.get("baseHitPoints") or 0) + md["con"] * level + (d.get("bonusHitPoints") or 0)
                                        + sum((m["value"] or 0) * level for m in got("bonus", "hit-points-per-level")))
    # AC (custom bonuses that are Mage Armor are left out: the app has a Mage Armor status instead)
    cv = [v for v in d.get("characterValues", []) if v["typeId"] in (1, 2, 3) and v.get("value") is not None]
    note = lambda v: re.search(r"mage\s*armou?r", v.get("notes") or "", re.I)
    armor = [i["definition"] for i in d.get("inventory", []) if i.get("equipped") and i["definition"].get("armorClass")]
    body = [a for a in armor if a.get("armorTypeId") in (1, 2, 3)]
    if body:
        a = body[0]; t = a["armorTypeId"]
        ac = a["armorClass"] + (md["dex"] if t == 1 else min(md["dex"], 2) if t == 2 else 0)
        ac += sum(m["value"] or 0 for m in got("bonus", "armored-armor-class"))
    else:
        un = [10 + md["dex"] + (md[AB[m["statId"] - 1]] if m.get("statId") else (m["value"] or 0)) for m in got("set", "unarmored-armor-class")]
        ac = max([10 + md["dex"]] + un)
        ac += sum(m["value"] or 0 for m in got("bonus", "unarmored-armor-class"))
    ac += sum(a["armorClass"] for a in armor if a.get("armorTypeId") == 4)  # shield
    ac += sum(m["value"] or 0 for m in got("bonus", "armor-class"))
    ac += sum(v["value"] for v in cv if v["typeId"] in (2, 3) and not note(v))
    over = [v["value"] for v in cv if v["typeId"] == 1]
    if over:
        ac = over[0]
    mage = [v["value"] for v in cv if v["typeId"] in (2, 3) and note(v)]
    # Saves, advantage, defences
    prof = [k for i, k in enumerate(AB) if got("proficiency", FULL[i] + "-saving-throws")]
    allb = sum(m["value"] or 0 for m in got("bonus", "saving-throws"))
    saves = {k: md[k] + (pb if k in prof else 0) + allb + sum(m["value"] or 0 for m in got("bonus", FULL[i] + "-saving-throws")) for i, k in enumerate(AB)}
    adv, advn = [], []
    for i, k in enumerate(AB):
        for m in got("advantage", FULL[i] + "-saving-throws"):
            adv.append(k)
            if m.get("restriction"):
                advn.append(m["restriction"].strip())
    defs = lambda t: sorted({m["subType"] for m in got(t) if m["subType"] in DT})
    cimm = sorted({m["subType"] for m in got("immunity") if m["subType"] in CONDS})
    # Initiative, passive Perception, speed, senses
    ini = md["dex"] + sum((m["value"] if m["value"] is not None else pb) for m in got("bonus", "initiative"))
    perc = 2 * pb if got("expertise", "perception") else pb if got("proficiency", "perception") else 0
    pp = 10 + md["wis"] + perc + sum(m["value"] or 0 for m in got("bonus", "passive-perception"))
    sp = (d["race"].get("weightSpeeds") or {}).get("normal") or {}
    walk = (sp.get("walk") or 30) + sum(m["value"] or 0 for m in got("bonus", "speed"))
    speed = ", ".join([f"{walk} ft."] + [f"{k} {v} ft." for k, v in sp.items() if k != "walk" and v])
    senses = ", ".join(f"{m['subType'].replace('-', ' ').title()} {m['value']} ft." for m in got("set-base") if m["subType"] in ("darkvision", "blindsight", "tremorsense", "truesight"))
    # Spell names: used only to list this character's spells first in the status menu
    spells = set()
    for cs in d.get("classSpells") or []:
        spells.update(s["definition"]["name"] for s in cs.get("spells") or [])
    for v in (d.get("spells") or {}).values():
        spells.update(s["definition"]["name"] for s in v or [])
    # Carried items (name + quantity); the app shows the consumables among them on the player card
    inv = {}
    for i in d.get("inventory") or []:
        n = ((i.get("definition") or {}).get("name") or "").strip()
        if n:
            inv[n] = inv.get(n, 0) + (i.get("quantity") or 1)
    items = [{"n": n, "q": q} for n, q in sorted(inv.items())]
    cls = " / ".join(((c.get("subclassDefinition") or {}).get("name", "") + " " + c["definition"]["name"]).strip() + f" {c['level']}" for c in d["classes"])
    return {
        "id": d["id"], "name": d["name"].strip(), "classes": cls, "level": level, "race": (d.get("race") or {}).get("fullName", ""),
        "abilities": sc, "mods": md, "initMod": ini, "passivePerception": pp, "ac": ac, "hp": hp,
        "acNote": (f"Mage Armor on the sheet (+{mage[0]}); use the Mage Armor status" if mage else ""),
        "saves": saves, "saveProf": prof, "advSaves": sorted(set(adv)), "advNote": "; ".join(sorted(set(advn))),
        "resist": defs("resistance"), "immune": defs("immunity"), "vulnerable": defs("vulnerability"), "condImmune": cimm,
        "speed": speed, "senses": senses, "spells": sorted(spells), "items": items,
        # same shape as the Kanka export, so the app works out spell save DC / attack bonus the same way for both sources
        "parsed": [{"class": c["definition"]["name"].lower(), "subclass": ((c.get("subclassDefinition") or {}).get("name") or ""), "level": c["level"]} for c in d["classes"]],
        "image": (d.get("decorations") or {}).get("avatarUrl") or "", "url": d.get("readonlyUrl") or f"https://www.dndbeyond.com/characters/{d['id']}",
        "modified": d.get("dateModified", ""),
    }


def check_match(k, p):
    """'' if a Kanka character and a D&D Beyond sheet look like the same character, else the reason."""
    w = lambda n: set(re.findall(r"[a-z]+", n.lower()))
    if not (w(k["name"]) & w(p["name"])):
        return f"name {p['name']!r} vs {k['name']!r}"
    kc = {c["class"] for c in k.get("parsed") or []}
    dc = {c["class"] for c in p.get("parsed") or []}
    if kc and dc and not (kc & dc):
        return f"class {', '.join(sorted(dc))} vs {', '.join(sorted(kc))}"
    return ""


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--file":
        raw = json.load(open(sys.argv[2], encoding="utf-8"))
        print(json.dumps(convert(raw.get("data", raw)), indent=1))
        return
    ids = []
    if os.path.exists(LIST):
        for line in open(LIST, encoding="utf-8"):
            m = re.search(r"(\d{5,})", line.split("#")[0])
            if m and m.group(1) not in ids:
                ids.append(m.group(1))
    # Links found by the Kanka sync (players.json "ddb"), cross-checked by name and class before linking
    kan = {}
    if os.path.exists("players.json"):
        for k in json.load(open("players.json", encoding="utf-8")):
            for d in k.get("ddb") or []:
                cid = str(d["id"])
                kan.setdefault(cid, k)
                if cid not in ids:
                    ids.append(cid)
    old = {str(p["id"]): p for p in (json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else [])}
    out, bad = [], 0
    for cid in ids:
        try:
            p = convert(fetch(cid)); out.append(p); print(f"OK   {cid} {p['name']} (AC {p['ac']}, HP {p['hp']}, {len(p['spells'])} spells)")
            k = kan.get(cid)
            if k:
                why = check_match(k, p)
                if why:
                    p["kankaMismatch"] = why; print(f"WARN {cid}: Kanka link from {k['name']} not used ({why})")
                else:
                    p["kanka"] = k["id"]; print(f"     linked to Kanka {k['name']}")
        except Exception as e:  # keep the last good copy
            bad += 1; print(f"FAIL {cid}: {e}")
            if cid in old:
                out.append(old[cid])
    out.sort(key=lambda p: p["name"].lower())
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(out)} characters written to dndbeyond.json ({bad} failed)")


if __name__ == "__main__":
    main()
