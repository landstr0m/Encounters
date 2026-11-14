"""Adds habitats and older names to a monster file of your own, and cross-checks type and CR, from lists you paste in.

Usage: python tools/appendix_b.py [FILE] [--write]        (FILE defaults to local/my-books.json)

Everything this tool reads and writes is your own material and stays in the git-ignored folder local/:
  local/appendix-b-habitat.txt     habitat tables         (required)  headings "Forest Monsters", rows "CR<tab>Name, Name"
  local/appendix-b-type.txt        names by creature type (optional)  a type heading, then one name per line
  local/appendix-b-cr.txt          names by CR            (optional)  headings "CR 1/4", then one name per line
  local/appendix-b-conversions.txt older names            (optional)  rows "old name<tab>current name"

What it does:
- habitat: each stat block gets "hab": a sorted list of habitat keys (arctic, coastal, desert, forest, grassland, hill,
  mountain, swamp, underdark, underwater, urban; "any" for the Any Habitat table). A stat block in none of the tables gets
  an empty list, which the encounter generator reads as "no natural habitat".
- older names: each stat block gets "aka": the older names that now point to it, so a search for the old name finds it.
- cross-checks (report only): names in the lists with no stat block, stat blocks missing from the CR list, and stat blocks
  whose CR or creature type differs from the lists. These catch typing slips in the file.
Without --write nothing is changed. Afterwards add the file again in the app (Data > Sources > Your files).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.join(ROOT, 'local', 'my-books.json'))
WRITE = '--write' in sys.argv
TYPES = ['aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental', 'fey', 'fiend', 'giant', 'humanoid',
         'monstrosity', 'ooze', 'plant', 'undead']


def key(name):
    """Name as a lookup key: lower case, straight apostrophes, no punctuation."""
    return re.sub(r'[^a-z0-9 ]', '', name.lower().replace('’', "'").replace('-', ' ')).strip()


def lines(fname):
    p = os.path.join(ROOT, 'local', fname)
    if not os.path.exists(p):
        return None
    return [l.strip() for l in open(p, encoding='utf-8').read().split('\n') if l.strip()]


D = json.load(open(path, encoding='utf-8'))
M = D['monsters'] if isinstance(D, dict) else D
by = {key(m['name']): m for m in M}
# "Name (Type 1)" variants are listed under their base name: they share its entries
base = {}
for m in M:
    g = re.match(r'(.+?) \(.+\)$', m['name'])
    if g:
        base.setdefault(key(g.group(1)), []).append(key(m['name']))


def expand(name):
    """'Black dragons (all)' -> every stat block whose name ends in 'Black Dragon' or 'Black Dragon Wyrmling'."""
    g = re.match(r'(.+?)s \(all\)$', name)
    if not g:
        return base.get(key(name), [key(name)])
    stem = key(g.group(1))
    return [k for k in by if re.search(r'\b' + re.escape(stem) + r'( wyrmling)?$', k)] or [key(name)]


problems = []

# ---- habitats
H = lines('appendix-b-habitat.txt')
if H is None:
    sys.exit('local/appendix-b-habitat.txt not found (see the top of this file).')
hab, cur, cr_hab = {}, None, {}
for l in H:
    g = re.match(r'(Any Habitat|[A-Z][a-z]+) Monsters$', l)
    if g:
        cur = 'any' if g.group(1) == 'Any Habitat' else g.group(1).lower()
        continue
    g = re.match(r'(\d+(?:/\d+)?)\t(.+)$', l)
    if cur and g:
        for n in g.group(2).split(','):
            for k in expand(n.strip()):
                hab.setdefault(k, set()).add(cur)
                cr_hab.setdefault(k, g.group(1))
for k in sorted(hab):
    if k not in by:
        problems.append(f'habitat list: no stat block named "{k}" ({", ".join(sorted(hab[k]))})')
changed = 0
for m in M:
    new = sorted(hab.get(key(m['name']), []))
    if m.get('hab') != new:
        changed += 1
    m['hab'] = new
    c = cr_hab.get(key(m['name']))
    if c and c != str(m.get('cr')):
        problems.append(f'{m["name"]}: CR {m.get("cr")} in the file, {c} in the habitat list')

# ---- CR list
C = lines('appendix-b-cr.txt')
if C:
    cur, seen = None, set()
    for l in C:
        g = re.match(r'CR (\d+(?:/\d+)?)$', l)
        if g:
            cur = g.group(1)
        elif cur:
            for k in expand(l):
                seen.add(k)
                if k not in by:
                    problems.append(f'CR list: no stat block named "{l}" (CR {cur})')
                elif str(by[k].get('cr')) != cur:
                    problems.append(f'{by[k]["name"]}: CR {by[k].get("cr")} in the file, {cur} in the CR list')
    for k in sorted(set(by) - seen):
        problems.append(f'{by[k]["name"]}: stat block not in the CR list')

# ---- creature types
T = lines('appendix-b-type.txt')
if T:
    cur = None
    for l in T:
        if l.lower() in TYPES:
            cur = l.lower()
        elif cur:
            for k in expand(l):
                if k not in by:
                    problems.append(f'type list: no stat block named "{l}" ({cur})')
                elif cur not in by[k].get('type', '').lower() and by[k].get('ctype') != cur:
                    problems.append(f'{by[k]["name"]}: type "{by[k].get("type")}" in the file, {cur} in the type list')

# ---- 2014 names (Stat Block Conversions): "Lizard King/Queen" and "Half-Ogre (Ogrillon)" give two names each
V = lines('appendix-b-conversions.txt')
if V:
    aka = {}
    for l in V[1:] if '2014' in V[0] else V:
        if '\t' not in l:
            continue
        old, new = [x.strip() for x in l.split('\t')[:2]]
        g = re.match(r'(.+?) \((.+)\)$', old)
        olds = [g.group(1)] + ([] if g.group(2).startswith('if ') else [g.group(2)]) if g else [old]
        g = re.match(r'(.+) (\w+)/(\w+)$', olds[0])
        if g:
            olds = [g.group(1) + ' ' + g.group(2), g.group(1) + ' ' + g.group(3)] + olds[1:]
        if key(new) not in by:
            problems.append(f'conversions: no stat block named "{new}" (for {old})')
            continue
        for o in olds:
            if key(o) not in by and o not in aka.setdefault(key(new), []):
                aka[key(new)].append(o)
    for m in M:
        a = sorted(aka.get(key(m['name']), []))
        if a:
            m['aka'] = a
        else:
            m.pop('aka', None)
    print(sum(1 for m in M if m.get('aka')), 'stat blocks answer to a 2014 name.')

n_hab = sum(1 for m in M if m['hab'])
print(f'{len(M)} stat blocks: {n_hab} with a habitat, {len(M) - n_hab} without (planar or not listed); {changed} changed.')
for p in sorted(set(problems)):
    print(' -', p)
if WRITE:
    json.dump(D, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('Written:', path)
else:
    print('Dry run: add --write to save.')
