"""Pull Player Characters from Kanka into players.json (stdlib only).
Usage: KANKA_TOKEN=... python tools/kanka_players.py
"""
import json, os, re, time, urllib.request

CAMPAIGN = 227292  # Blackrock
API = f"https://api.kanka.io/1.0/campaigns/{CAMPAIGN}"
TOKEN = os.environ["KANKA_TOKEN"]
HIT_DIE = {"barbarian": 12, "fighter": 10, "paladin": 10, "ranger": 10,
           "bard": 8, "cleric": 8, "druid": 8, "monk": 8, "rogue": 8,
           "warlock": 8, "artificer": 8, "sorcerer": 6, "wizard": 6}
ABIL = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]


def get(url):
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}", "Accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(20 * (attempt + 1))  # rate limit: back off and retry
    raise RuntimeError("Kanka rate limit: too many retries")


def num(v):
    m = re.search(r"[-+]?\d+", str(v or ""))
    return int(m.group()) if m else None


def parse_classes(text):
    """'Bard - 2' or 'Fighter 3 / Wizard 2' -> [('bard', 2), ('wizard', 2)]"""
    out = []
    for part in re.split(r"[/,;&]", text or ""):
        cls = next((c for c in HIT_DIE if c in part.lower()), None)
        lvl = num(part)
        if cls and lvl:
            out.append((cls, abs(lvl)))
    return out


def est_hp(classes, con_mod):
    """Fixed-average HP (2024 rules). Ignores feats/species bonuses like Tough."""
    if not classes or con_mod is None:
        return None
    hp, first = 0, True
    for cls, lvl in classes:
        d = HIT_DIE[cls]
        for _ in range(lvl):
            hp += (d if first else d // 2 + 1) + con_mod
            first = False
    return hp


def main():
    players, url = [], f"{API}/characters?related=1"
    while url:
        page = get(url)
        for c in page["data"]:
            if c.get("is_private") or "player" not in (c.get("type") or "").lower():
                continue
            attrs = c.get("attributes")
            if attrs is None:  # fallback if 'related' didn't include them
                time.sleep(2.5)
                attrs = get(f"{API}/entities/{c['entity_id']}/attributes")["data"]
            a = {x["name"].strip(): x.get("value") for x in attrs
                 if not x.get("is_private") and x.get("name")}
            scores = {k[:3].lower(): num(a.get(k)) for k in ABIL}
            mods = {k: (v - 10) // 2 if v is not None else None for k, v in scores.items()}
            classes_raw = a.get("Class, Subclass & Levels", "")
            classes = parse_classes(classes_raw)
            perc = next((num(v) for k, v in a.items() if k.lower().startswith("perception")), None)
            players.append({
                "id": c["entity_id"], "name": c["name"], "title": c.get("title"),
                "race": a.get("Race"), "classes": classes_raw,
                "level": sum(l for _, l in classes) or None,
                "abilities": scores, "mods": mods, "initMod": mods["dex"],
                "passivePerception": 10 + (perc if perc is not None else (mods["wis"] or 0)),
                "hpEst": est_hp(classes, mods["con"]),
                "image": c.get("image_thumb"),
                "url": f"https://app.kanka.io/w/{CAMPAIGN}/entities/{c['entity_id']}",
            })
        url = page.get("links", {}).get("next")
        if url:
            time.sleep(2.5)
    players.sort(key=lambda p: p["name"])
    with open("players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(players)} player characters to players.json")


if __name__ == "__main__":
    main()
