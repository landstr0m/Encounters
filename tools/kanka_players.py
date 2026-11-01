"""Pull Player Characters from Kanka into players.json (stdlib only).
Usage: KANKA_TOKEN=... python tools/kanka_players.py
"""
import html, json, os, re, time, urllib.request

CAMPAIGN = 227292  # Blackrock
API = f"https://api.kanka.io/1.0/campaigns/{CAMPAIGN}"
TOKEN = os.environ["KANKA_TOKEN"]
HIT_DIE = {"barbarian": 12, "fighter": 10, "paladin": 10, "ranger": 10,
           "bard": 8, "cleric": 8, "druid": 8, "monk": 8, "rogue": 8,
           "warlock": 8, "artificer": 8, "sorcerer": 6, "wizard": 6}
ABIL = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]
SAVE_PROF = {"barbarian": "str con", "bard": "dex cha", "cleric": "wis cha",
             "druid": "int wis", "fighter": "str con", "monk": "str dex",
             "paladin": "wis cha", "ranger": "str dex", "rogue": "dex int",
             "sorcerer": "con cha", "warlock": "wis cha", "wizard": "int wis",
             "artificer": "con int"}  # from the first class only (multiclassing adds none)
# Subclasses: keyword found in the class text -> canonical name.
SUBCLASS = {
    "artificer": "alchemist armorer artillerist battle smith",
    "barbarian": "berserker wild heart world tree zealot totem ancestral storm herald beast wild magic",
    "bard": "lore valor glamour dance swords whispers creation eloquence spirits",
    "cleric": "forge knowledge life light trickery war tempest death grave order peace twilight nature arcana",
    "druid": "land moon sea stars dreams shepherd spores wildfire",
    "fighter": "champion battle master eldritch knight psi warrior rune samurai echo cavalier arcane archer banneret",
    "monk": "open hand shadow elements mercy drunken kensei astral sun soul long death",
    "paladin": "devotion glory ancients vengeance conquest redemption oathbreaker crown watchers",
    "ranger": "hunter beast master fey wanderer gloom stalker horizon monster slayer swarmkeeper drakewarden",
    "rogue": "thief assassin arcane trickster soulknife inquisitive mastermind phantom scout swashbuckler",
    "sorcerer": "draconic wild magic aberrant clockwork divine soul shadow storm",
    "warlock": "archfey celestial fiend great old one hexblade fathomless genie undead undying",
    "wizard": "abjur divination evocation illusion conjuration enchantment necromancy transmutation bladesing war magic chronurgy graviturgy scribes",
}
# Multi-word keywords are matched first so "battle master" beats "beast", etc.
SUB_KEYS = {c: sorted(set(re.findall(
    r"battle master|eldritch knight|psi warrior|arcane archer|open hand|drunken|astral|"
    r"sun soul|long death|beast master|fey wanderer|gloom stalker|monster slayer|"
    r"arcane trickster|wild magic|divine soul|great old one|war magic|wild heart|"
    r"world tree|storm herald|battle smith|[a-z]+", v)), key=len, reverse=True)
    for c, v in SUBCLASS.items()}
# Class/subclass features that change saves or damage taken: (class, subclass or "", level, effect)
FEATURES = [
    ("barbarian", "", 1, {"trait": ("Rage", "While raging: resistance to bludgeoning, piercing and slashing; advantage on Str checks and saves.")}),
    ("monk", "", 14, {"prof": "str dex con int wis cha", "trait": ("Disciplined Survivor", "Proficient in all saves; spend 1 Focus to reroll a failed save.")}),
    ("paladin", "", 6, {"trait": ("Aura of Protection", "Adds its Cha modifier (min +1) to its saves and those of allies within 10 ft.")}),
    ("rogue", "", 7, {"trait": ("Evasion", "Dex save for half damage: none on a success, half on a failure.")}),
    ("monk", "", 7, {"trait": ("Evasion", "Dex save for half damage: none on a success, half on a failure.")}),
    ("rogue", "", 15, {"prof": "wis cha", "trait": ("Slippery Mind", "Proficient in Wis and Cha saves.")}),
    ("fighter", "", 9, {"trait": ("Indomitable", "Can reroll a failed save, adding its fighter level.")}),
    ("cleric", "forge", 6, {"res": ["fire"], "trait": ("Soul of the Forge", "Resistance to fire; +1 AC in heavy armor.")}),
    ("cleric", "forge", 17, {"imm": ["fire"], "trait": ("Saint of Forge and Fire", "Immune to fire.")}),
    ("sorcerer", "storm", 6, {"res": ["lightning", "thunder"], "trait": ("Heart of the Storm", "Resistance to lightning and thunder.")}),
    ("sorcerer", "draconic", 6, {"trait": ("Elemental Affinity", "Resistance to its draconic damage type (add it as a Resistances property in Kanka).")}),
    ("warlock", "celestial", 6, {"res": ["radiant"], "trait": ("Radiant Soul", "Resistance to radiant.")}),
    ("paladin", "devotion", 7, {"cimm": ["charmed"], "trait": ("Aura of Devotion", "It and allies within 10 ft can't be Charmed.")}),
    ("paladin", "ancients", 7, {"trait": ("Aura of Warding", "It and allies within 10 ft have resistance to damage from spells.")}),
]
# Species traits (first match wins): resistances, advantage on saves, notes.
SPECIES = [
    ("dhampir", {}),
    ("kalashtar", {"res": ["psychic"], "adv": "wis", "trait": ("Dual Mind", "Advantage on all Wis saves; resistance to psychic.")}),
    ("tiefling", {"res": ["fire"], "trait": ("Hellish Resistance", "Resistance to fire.")}),
    ("stout", {"res": ["poison"], "trait": ("Stout Resilience & Brave", "Resistance to poison; advantage on saves vs Poisoned and Frightened.")}),
    ("halfling", {"trait": ("Brave", "Advantage on saves to avoid or end Frightened.")}),
    ("dwarf", {"res": ["poison"], "trait": ("Dwarven Resilience", "Resistance to poison; advantage on saves to avoid or end Poisoned.")}),
    ("genasi (fire)", {"res": ["fire"], "trait": ("Fire Resistance", "Resistance to fire.")}),
    ("genasi (water)", {"res": ["acid"], "trait": ("Acid Resistance", "Resistance to acid.")}),
    ("genasi (air)", {"res": ["lightning"], "trait": ("Lightning Resistance", "Resistance to lightning.")}),
    ("genasi (earth)", {}),
    ("aasimar", {"res": ["necrotic", "radiant"], "trait": ("Celestial Resistance", "Resistance to necrotic and radiant.")}),
    ("yuan-ti", {"res": ["poison"], "cimm": ["poisoned"], "trait": ("Magic Resistance", "Advantage on saves vs spells; resistance to poison; immune to Poisoned.")}),
    ("satyr", {"trait": ("Magic Resistance", "Advantage on saves vs spells.")}),
    ("warforged", {"res": ["poison"], "trait": ("Constructed Resilience", "Resistance to poison; advantage on saves vs Poisoned; can't be magically put to sleep.")}),
    ("gnome", {"adv": "int wis cha", "trait": ("Gnomish Cunning", "Advantage on Int, Wis and Cha saves.")}),
    ("elf", {"trait": ("Fey Ancestry", "Advantage on saves to avoid or end Charmed; magic can't put it to sleep.")}),  # also half-elf, drow
    ("goblin", {"trait": ("Fey Ancestry", "Advantage on saves to avoid or end Charmed.")}),  # also hobgoblin
    ("dragonborn", {"trait": ("Draconic Resistance", "Resistance to its ancestry's damage type.")}),
]
# Species damage resistances (first match wins). Class/feat/item resistances are not
# covered: add a Kanka property "Resistances", "Immunities" or "Vulnerabilities"
# (comma-separated, e.g. "fire, poison") to a character to add or override.
DMG = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
       "piercing", "poison", "psychic", "radiant", "slashing", "thunder"]


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
    """'Cleric, Forge Domain - 2' or 'Fighter 3 / Rune Knight Wizard 2'
    -> [('cleric', 'forge', 2)]. Each class name starts a block; the subclass and
    level are looked for in that block (subclass also just before the class)."""
    t = (text or "").lower()
    hits = sorted((m.start(), m.end(), c) for c in HIT_DIE
                  for m in re.finditer(r"\b" + c + r"\b", t))
    out = []
    for i, (st, en, cls) in enumerate(hits):
        nxt = hits[i + 1][0] if i + 1 < len(hits) else len(t)
        prev = hits[i - 1][1] if i else 0
        block, before = t[en:nxt], t[prev:st]
        lvl = num(block) or num(before)
        sub = next((k for k in SUB_KEYS[cls] if re.search(r"\b" + k, block + " " + before)), "")
        out.append((cls, sub, abs(lvl) if lvl else None))
    return out


def est_hp(classes, con_mod):
    """Fixed-average HP (2024 rules). Ignores feats/species bonuses like Tough."""
    if not classes or con_mod is None:
        return None
    hp, first = 0, True  # first listed class is treated as the starting class
    for cls, _, lvl in classes:
        if not lvl:
            return None
        d = HIT_DIE[cls]
        for _ in range(lvl):
            hp += (d if first else d // 2 + 1) + con_mod
            first = False
    return hp


def dmg_list(text):
    return [d for d in DMG if d in (text or "").lower()]


def traits_and_defenses(race, classes, a):
    """Species + class/subclass features -> resistances, advantage on saves, traits."""
    race = (race or "").lower()
    res, imm, cimm, adv, prof, traits = set(), set(), set(), set(), set(), []
    def apply(fx, src):
        res.update(fx.get("res", [])); imm.update(fx.get("imm", []))
        cimm.update(fx.get("cimm", [])); adv.update(fx.get("adv", "").split())
        prof.update(fx.get("prof", "").split())
        if "trait" in fx:
            traits.append({"name": fx["trait"][0], "text": fx["trait"][1], "src": src})
    sp = next(((k, fx) for k, fx in SPECIES if k in race), None)
    if sp:
        apply(sp[1], "species")
    if "dragonborn" in race:
        res.update(dmg_list(race))  # e.g. "Dragonborn (Red, fire)"
    for cls, sub, lvl in classes:
        for fc, fs, fl, fx in FEATURES:
            if fc == cls and fs in ("", sub) and (lvl or 0) >= fl:
                apply(fx, cls + (" (" + sub + ")" if fs else ""))
    get = lambda k: next((v for n, v in a.items() if n.lower() == k), None)
    res |= set(dmg_list(get("resistances")))  # Kanka properties add to these
    imm |= set(dmg_list(get("immunities")))
    return {"resist": sorted(res - imm), "immune": sorted(imm),
            "vulnerable": dmg_list(get("vulnerabilities")),
            "condImmune": sorted(cimm), "advSaves": sorted(adv), "traits": traits}, prof


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
            a = {html.unescape(x["name"]).strip(): x.get("value") for x in attrs
                 if not x.get("is_private") and x.get("name")}
            scores = {k[:3].lower(): num(a.get(k)) for k in ABIL}
            mods = {k: (v - 10) // 2 if v is not None else None for k, v in scores.items()}
            classes_raw = a.get("Class, Subclass & Levels", "")
            classes = parse_classes(classes_raw)
            level = sum(l or 0 for _, _, l in classes) or None
            pb = 2 + ((level or 1) - 1) // 4
            fx, fprof = traits_and_defenses(a.get("Race"), classes, a)
            notes = []
            if not classes:
                notes.append("class not recognised")
            elif not all(l for _, _, l in classes):
                notes.append("level missing")
            # Kanka lists only proficient saves, as "DEX: +4"; else infer from class
            kprof = [k for k in mods if num(a.get(k.upper())) is not None]
            prof = kprof or (SAVE_PROF[classes[0][0]].split() if classes else [])
            prof = [k for k in mods if k in set(prof) | fprof]
            saves = {}
            for k, m in mods.items():
                if num(a.get(k.upper())) is not None:
                    saves[k] = num(a[k.upper()])
                elif m is not None:
                    saves[k] = m + (pb if k in prof else 0)
                else:
                    saves[k] = None
            if not kprof and classes:
                notes.append("save proficiencies inferred from class")
            for n in notes:
                print(f"  {c['name']}: {n} ({classes_raw!r})")
            perc = next((num(v) for k, v in a.items() if k.lower().startswith("perception")), None)
            players.append({
                "id": c["entity_id"], "name": c["name"], "title": c.get("title"),
                "race": a.get("Race"), "classes": classes_raw,
                "parsed": [{"class": cl, "subclass": sb, "level": lv} for cl, sb, lv in classes],
                "level": level, "notes": notes,
                "abilities": scores, "mods": mods, "initMod": mods["dex"],
                "passivePerception": 10 + (perc if perc is not None else (mods["wis"] or 0)),
                "saves": saves, "saveProf": prof, **fx,
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
