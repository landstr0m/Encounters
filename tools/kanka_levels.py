"""Check Blackrock character levels against session reports (stdlib only).

Counts how many session reports link (mention) each player character, works
out the level the Character Creation rules give, compares it with the level in
players.json (written by kanka_players.py just before this runs) and writes a
Discord-ready message for the Loremasters to kanka_levels.md.

Reads the campaign's public pages, so it needs no token.
Usage: python tools/kanka_levels.py
"""
import html, json, os, re, urllib.request

WORLD = "https://app.kanka.io/w/blackrock"
REPORTS, CHARACTERS = 11, 1        # entity type ids: /t/11 Reports, /t/1 Characters
TOTALS = [1, 3, 6, 10, 14]         # total sessions needed for levels 2..6, then every 4
ACT_CAP = 5                        # Act 1 level cap (extra sessions are banked)
# Sessions that don't count for a character (played as an NPC that session).
EXCLUDE = {"Cromsuns Blacknose": ["Smoke and Loss"]}
OUT = "kanka_levels.md"


def fetch(url, as_json=False):
    hdr = {"User-Agent": "encounters-level-check"}
    if as_json:
        hdr |= {"Accept": "application/json", "X-Requested-With": "XMLHttpRequest"}
    with urllib.request.urlopen(urllib.request.Request(url, headers=hdr)) as r:
        return json.load(r) if as_json else r.read().decode("utf-8", "replace")


def listing(type_id):
    out, url = [], f"{WORLD}/t/{type_id}/api"
    while url:
        page = fetch(url, True)["entities"]
        out += page["data"]
        url = page["links"].get("next")
    return out


def level_for(n):
    """Sessions played -> level by the rules (before the Act 1 cap)."""
    lvl = 1 + sum(n >= t for t in TOTALS)
    if n > TOTALS[-1]:
        lvl += (n - TOTALS[-1]) // 4
    return lvl


def body(page):
    """Report text between the page tabs and the word count (skips menus)."""
    m = re.search(r"Properties</a>.*?</ul>(.*?)Word count", page, re.S)
    return m.group(1) if m else page


def main():
    chars = [c for c in listing(CHARACTERS) if c.get("type") != "NPC"
             and not any(t["name"] == "NPC" for t in c.get("tags", []))]
    with open("players.json", encoding="utf-8") as f:
        kanka = {p["id"]: p.get("level") for p in json.load(f)}

    attended = {c["name"]: [] for c in chars}
    no_names = []
    reports = sorted(listing(REPORTS), key=lambda r: r["name"])
    for r in reports:
        m = re.match(r"Session\s*(\d+)\s*-\s*(.*)", r["name"])
        num, title = (m.group(1), m.group(2).strip()) if m else (r["name"], r["name"])
        page = body(fetch(r["urls"]["show"]))
        ids = {int(i) for i in re.findall(r"/entities/(\d+)", page)}
        text = html.unescape(re.sub(r"<[^>]+>", " ", page))
        seen = [c["name"] for c in chars if c["id"] in ids or c["name"] in text]
        if not seen:
            no_names.append(f"Session {num} - {title}")
        for name in seen:
            if title not in EXCLUDE.get(name, []):
                attended[name].append(num)

    updates, missing, rows = [], [], []
    for c in sorted(chars, key=lambda c: c["name"]):
        s = attended[c["name"]]
        want = min(level_for(len(s)), ACT_CAP)
        have = kanka.get(c["id"])
        rows.append(f"{c['name']}: {len(s)} ({', '.join(s) or '-'})")
        if have is None:
            missing.append(f"- **{c['name']}**: no level on Kanka, should be **{want}** "
                           f"({len(s)} sessions)")
        elif have < want:
            updates.append(f"- **{c['name']}**: Level {have} → **{want}** "
                           f"({len(s)} sessions: {', '.join(s)})")

    msg = ["**Blackrock level check**"]
    if updates or missing:
        msg += ["", "Level-ups to log on Kanka:"] + updates + missing
    else:
        msg += ["", "All character levels match the session reports. ✅"]
    if no_names:
        msg += ["", "Session reports with no characters named (please add who attended):"]
        msg += [f"- {n}" for n in no_names]
    msg += ["", "Sessions attended per character:", "```", *rows, "```"]
    text = "\n".join(msg) + "\n"

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    if os.environ.get("GITHUB_STEP_SUMMARY"):   # shows on the Actions run page
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
