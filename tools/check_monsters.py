"""Checks every entry in a monster JSON file for data problems.

Usage: python tools/check_monsters.py [monsters.json] [--fix]

Checks (each entry, every text field):
- stats: CR is a known value, AC/HP/abilities are numbers in range, HP matches the average of its hit dice
- dice in text: "7 (1d8 + 3)" average matches the dice; dice written with odd characters
  (en/em dash, minus sign, "ld8", "1 d8", missing spaces or brackets) that the app might not read
- text: unbalanced brackets, stray characters, doubled words, entries that look cut off
- spelling: words not in an English dictionary and not used elsewhere in D&D text (likely typing errors)
--fix normalises dashes/minus signs and spacing inside dice expressions and attack bonuses only;
everything else is reported for a person to check.
"""
import json, re, sys, collections

path = next((a for a in sys.argv[1:] if not a.startswith('--')), 'monsters.json')
FIX = '--fix' in sys.argv
D = json.load(open(path, encoding='utf-8'))
M = D['monsters'] if isinstance(D, dict) else D
CRS = {'0', '1/8', '1/4', '1/2'} | {str(i) for i in range(1, 31)}
TEXT = ('traits', 'actions', 'bonus', 'react', 'leg')
DASH = '–—−'
issues = collections.defaultdict(list)
fixed = 0


def avg(n, s, mod):
    return int(n * (s + 1) / 2) + mod


def norm_dice(t):
    """Normalise dash characters and spacing in dice and attack bonuses (safe, mechanical)."""
    t2 = re.sub(r'(\d+d\d+)\s*([+' + DASH + r'-])\s*(\d+)', lambda m: m.group(1) + ' ' + ('+' if m.group(2) == '+' else '-') + ' ' + m.group(3), t)
    t2 = re.sub(r'\b[lI](d\d+)', r'1\1', t2)                       # ld8 / Id8 -> 1d8
    t2 = re.sub(r'\b(\d+) d(\d+)\b', r'\1d\2', t2)                  # 1 d8 -> 1d8
    t2 = re.sub(r'(Roll: |Attack: )[' + DASH + r'](\d)', r'\1-\2', t2)  # Attack Roll: –1
    t2 = re.sub(r'(Roll: |Attack: )\+ (\d)', r'\1+\2', t2)
    return t2


def check_text(m, where, t):
    global fixed
    if FIX:
        t2 = norm_dice(t)
        if t2 != t:
            fixed += 1
            t = t2
    for g in re.finditer(r'(\d+) \((\d+)d(\d+)(?: ([+-]) (\d+))?\)', t):
        n, a, s = int(g.group(1)), int(g.group(2)), int(g.group(3))
        mod = int(g.group(5) or 0) * (-1 if g.group(4) == '-' else 1)
        if n != avg(a, s, mod):
            issues['dice average'].append(f"{m['name']} / {where}: {g.group(0)} (average is {avg(a, s, mod)})")
    if re.search(r'\d+d\d+\s*[' + DASH + r']\s*\d', t) or re.search(r'\b[lI]d\d+|\b\d+ d\d+\b|\d+d \d+', t):
        issues['dice symbols'].append(f"{m['name']} / {where}: {t[:120]}")
    if re.search(r'\(\d+d\d+[^)]{0,12}$', t) or re.search(r'\d+d\d+\s*\+\s*\d+\)\)', t):
        issues['dice brackets'].append(f"{m['name']} / {where}")
    if t.count('(') != t.count(')') or t.count('[') != t.count(']'):
        issues['unbalanced brackets'].append(f"{m['name']} / {where}: {t[:140]}")
    if re.search(r'[|~¢©®{}<>_\\@#^]|�', t):
        issues['stray characters'].append(f"{m['name']} / {where}: {re.search(r'.{0,30}[|~¢©®{}<>_@#^\\�].{0,30}', t).group(0)}")
    dw = re.search(r'\b(\w{2,})\s+\1\b', t, re.I)
    if dw and dw.group(1).lower() not in ('that', 'had'):
        issues['doubled word'].append(f"{m['name']} / {where}: …{t[max(0, dw.start() - 20):dw.end() + 20]}…")
    if t and 'casts' not in t and not re.search(r'[.!?)”:]$|\d$|ft\.$|Day$|\)$', t.strip()):
        issues['may be cut off'].append(f"{m['name']} / {where}: …{t.strip()[-60:]}")
    return t


for m in M:
    nm = m.get('name', '?')
    if str(m.get('cr')) not in CRS:
        issues['CR'].append(f"{nm}: {m.get('cr')!r}")
    try:
        if not 1 <= int(m['ac']) <= 30: raise ValueError
    except Exception:
        issues['AC'].append(f"{nm}: {m.get('ac')!r}")
    dm = re.fullmatch(r'(\d+)d(\d+)(?: ?([+-]) ?(\d+))?', str(m.get('dice', '')).replace('−', '-'))
    if not dm:
        issues['hit dice format'].append(f"{nm}: {m.get('dice')!r}")
    else:
        mod = int(dm.group(4) or 0) * (-1 if dm.group(3) == '-' else 1)
        if int(m['hp']) != avg(int(dm.group(1)), int(dm.group(2)), mod):
            issues['HP vs hit dice'].append(f"{nm}: HP {m['hp']} but {m['dice']} averages {avg(int(dm.group(1)), int(dm.group(2)), mod)}")
        con = (int(m['abil'][2]) - 10) // 2
        if mod != con * int(dm.group(1)):
            issues['hit dice vs Con'].append(f"{nm}: {m['dice']} but Con mod {con:+d} x {dm.group(1)} = {con * int(dm.group(1)):+d}")
    if not re.fullmatch(r"\d+ ft\.(?: \([^)]*\))?(?:, (?:burrow|climb|fly|swim|climb or fly) \d+ ft\.(?: \([^)]*\))?)*|\d+ ft\., \d+ ft\. \([a-z]+ form only\)(?:, climb \d+ ft\. \([a-z]+ form only\))?", m.get('speed', '')):
        issues['speed format'].append(f"{nm}: {m.get('speed')!r}")
    for e in m.get('extra') or []:
        if e[0] == 'Senses' and not re.search(r'Passive Perception \d+$', e[1]):
            issues['senses format'].append(f"{nm}: {e[1]!r}")
    for k in ('actions', 'bonus', 'react', 'leg'):
        for e in m.get(k) or []:
            if 'Attack Roll' in e[1] and not re.search(r'Attack Roll: [+-]\d+(?: \([^)]*\))?, (?:reach \d+ ft\.|range \d+(?:/\d+)? ft\.)', e[1]):
                issues['attack format'].append(f"{nm} / {e[0]}: {e[1][:90]}")
            if re.search(r'[^\x00-\x7F’“”—–−×]', e[0] + e[1]):
                issues['odd characters'].append(f"{nm} / {e[0]}")
            if re.search(r'\b(?:ona|ina|ofa|toa|isa|ifa|itis|ifit|ofthe|inthe|tothe)\b', e[1].replace('kuo-toa', '')):
                issues['joined words'].append(f"{nm} / {e[0]}")
    ab = m.get('abil')
    if not (isinstance(ab, list) and len(ab) == 6 and all(isinstance(x, int) and 1 <= x <= 30 for x in ab)):
        issues['ability scores'].append(f"{nm}: {ab!r}")
    for k in TEXT:
        for e in m.get(k) or []:
            e[1] = check_text(m, f"{k}: {e[0]}", e[1])
            if not e[0].strip() or len(e[0]) > 70:
                issues['entry name'].append(f"{nm} / {k}: {e[0][:80]!r}")
    for e in m.get('extra') or []:
        if e[0] in ('Saves', 'Skills'):
            for part in e[1].split(','):
                if not re.fullmatch(r"\s*[A-Z][A-Za-z ]+ [+-]\d+(?: \([^)]*\))?\s*", part.replace('−', '-')):
                    issues['saves/skills format'].append(f"{nm}: {e[0]} {e[1]}")
                    break

# Structure: content lost or merged at page/column breaks during import.
try:
    SPELLS = {x['n'].lower() for x in json.load(open('reference.json', encoding='utf-8'))['spells']}
except Exception:
    SPELLS = set()
MERGED = re.compile(r"(?<=[.)]) ((?:[A-Z][\w’'-]*)(?: (?:of |the |and )?[A-Z][\w’'-]*)*(?: \([^)]*\))?)\. (?=(?:Melee|Ranged|Melee or Ranged) Attack Roll:|(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:|Trigger:)")
KNOWN_SPELLS = {'melf’s acid arrow'}
for m in M:
    names = [a[0].split(' (')[0].lower() for k in TEXT for a in m.get(k) or []]
    for a in (m.get('actions') or []):
        if a[0] == 'Multiattack':
            for n in re.findall(r"(?:using|makes (?:one|two|three|four|five|six) |use of |uses |use its )([A-Z][a-z’'-]+(?: (?:of the |of |the )?[A-Z][a-z’'-]+)*)", a[1]):
                l = n.lower()
                if l in SPELLS or l in KNOWN_SPELLS or l in m['name'].lower():
                    continue
                if not any(x == l or x.startswith(l) or l.rstrip('s') == x for x in names):
                    issues['missing action (page break?)'].append(f"{m['name']} (p. {m.get('page')}): Multiattack mentions {n}")
    for k in TEXT:
        for a in m.get(k) or []:
            g = MERGED.search(a[1])
            if g or a[1].count('Attack Roll:') > 1:
                issues['merged entries'].append(f"{m['name']} / {a[0]}: contains {g.group(1) if g else 'two attacks'}")
    if m.get('leg') and not m['leg'][0][0].startswith('Legendary Action Uses'):
        issues['legendary uses missing'].append(m['name'])

# Spelling: words not in the dictionary and used at most twice in the whole file.
try:
    from spellchecker import SpellChecker
    sp = SpellChecker()
    words = collections.Counter()
    where = {}
    for m in M:
        for k in TEXT:
            for e in m.get(k) or []:
                for w in re.findall(r"[A-Za-z][a-z’']+", e[0] + ' ' + e[1]):
                    w2 = w.lower().replace('’', "'")
                    words[w2] += 1
                    where.setdefault(w2, m['name'])
    known = set()
    try:
        R = json.load(open('reference.json', encoding='utf-8'))
        for s in R['spells']:
            known |= {w.lower() for w in re.findall(r"[A-Za-z]+", s['n'] + ' ' + s['tx'])}
    except Exception:
        pass
    # D&D words the dictionary doesn't know (weapons, languages, named spells); add to this when a real word is flagged
    known |= {'gythka', 'chatkcha', 'handaxe', 'handaxes', 'warhammer', 'spellcaster', 'teleported', "heroes'", "jallarzi", 'greataxe', 'greatclub', 'morningstar', 'shortbow', 'longsword', 'shortsword', 'greatsword', 'undercommon', 'tremorsense', 'auran', 'aquan', 'ignan', 'terran', 'celestia', 'amphibiousness', 'unworked', 'melf', 'multiattack', "thieves'"}
    known |= {w.lower() for m in M for w in re.findall(r"[A-Za-z]+", m['name'] + ' ' + m['type'])}
    for w, n in words.items():
        base = re.sub(r"'s$", '', w)
        if n <= 2 and base not in known and sp.unknown([base]):
            issues['spelling (check)'].append(f"{where[w]}: {w}")
except ImportError:
    print('(pip install pyspellchecker for the spelling check)')

total = sum(len(v) for v in issues.values())
print(f"Checked {len(M)} monsters. {total} items to review." + (f" Normalised {fixed} text entries." if FIX else ''))
for k, v in issues.items():
    print(f"\n## {k} ({len(v)})")
    for x in v:
        print(' -', x)
if FIX and fixed:
    json.dump(D, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
