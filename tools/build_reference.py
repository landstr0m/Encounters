"""Builds reference.json (SRD 5.2 spells + conditions + equipment) from open5e's data repo.

Usage: python tools/build_reference.py PATH_TO/open5e-api/data/v2/wizards-of-the-coast/srd-2024
       python tools/build_reference.py PATH_TO/open5e-api/data/v2/wizards-of-the-coast/srd-2014
The second form writes reference-2014.json: the SRD 5.1 spells only, for characters built with the 2014 rules.
Source: https://github.com/open5e/open5e-api (SRD 5.2, CC-BY-4.0).
"""
import json, sys, os

src = sys.argv[1]
L = lambda f: json.load(open(os.path.join(src, f), encoding='utf-8'))
up = {}
for o in L('SpellCastingOption.json'):
    f = o['fields']
    if f.get('damage_roll') and f['type'].startswith(('slot_level_', 'player_level_')):
        up.setdefault(f['parent'], []).append(f['type'].split('_')[-1] + ':' + f['damage_roll'])
spells = []
for s in L('Spell.json'):
    f = s['fields']
    comp = ''.join(c for c, k in (('V', 'verbal'), ('S', 'somatic'), ('M', 'material')) if f.get(k))
    if f.get('material_specified'):
        comp += ' (' + f['material_specified'] + ')'
    spells.append({
        'n': f['name'], 'l': f['level'], 'sc': f['school'], 't': f['casting_time'], 'r': f['range_text'],
        'c': comp, 'd': f['duration'], 'cn': bool(f['concentration']), 'ri': bool(f['ritual']),
        'cl': [c.replace('srd-2024_', '').replace('srd_', '') for c in f.get('classes') or []],
        'sv': f.get('saving_throw_ability') or '', 'at': bool(f.get('attack_roll')),
        'dt': f.get('damage_types') or [], 'dr': f.get('damage_roll') or '',
        'tx': f['desc'], 'hl': f.get('higher_level') or '', 'up': up.get(s['pk'], [])})
spells.sort(key=lambda x: (x['n']))
if os.path.basename(os.path.normpath(src)) == 'srd-2014':
    json.dump({'source': 'SRD 5.1 (CC-BY-4.0) via open5e-api', 'spells': spells}, open('reference-2014.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(len(spells), 'spells (SRD 5.1) -> reference-2014.json')
    sys.exit()
conds = {c['fields']['describes'].title(): c['fields']['desc'] for c in L('ConditionDescription.json')}
# Equipment: every SRD item with rules text, plus the magic potions and oils. "Potions of Healing" is split into its four grades.
items = []
for x in L('Item.json'):
    f = x['fields']
    if not (f.get('desc') or '').strip():
        continue
    if f['name'] == 'Potions of Healing':
        for g, hp, r in (('greater', '4d4 + 4', 'uncommon'), ('superior', '8d4 + 8', 'rare'), ('supreme', '10d4 + 20', 'very-rare')):
            items.append({'n': 'Potion of Healing (%s)' % g, 'cat': 'potion', 'r': r, 'tx': 'As a Bonus Action, you can drink this potion or administer it to another creature within 5 feet of yourself. The creature that drinks it regains %s Hit Points.' % hp})
        continue
    c = float(f.get('cost') or 0)
    items.append({'n': f['name'], 'cat': f['category'], 'cost': ('%g GP' % c) if c >= 1 else ('%g SP' % (c * 10)) if c >= 0.1 else ('%g CP' % (c * 100)) if c else '', 'tx': f['desc']})
for x in L('MagicItem.json'):
    f = x['fields']
    if f['category'] == 'potion':
        items.append({'n': f['name'], 'cat': 'potion', 'r': f.get('rarity') or '', 'tx': f['desc']})
# Sample poisons (SRD 5.2 "Poison", pp. 197-198; not in the open5e data set). Summarised in our own words: name, cost, type, effect.
HOW = {'Contact': 'Contact: smeared on an object; a creature that touches it with exposed skin is affected.',
       'Ingested': 'Ingested: the creature must swallow a whole dose.',
       'Inhaled': 'Inhaled: released as a powder or gas, it affects creatures in a 5-foot Cube, then disperses. Holding your breath does not help.',
       'Injury': 'Injury: a Bonus Action coats one weapon or piece of ammunition; a creature that takes Piercing or Slashing damage from it is affected.'}
POISONS = [
    ("Assassin's Blood", 150, 'Ingested', 'DC 10 Constitution saving throw. Failed save: 6 (1d12) Poison damage and the Poisoned condition for 24 hours. Successful save: half as much damage only.'),
    ('Burnt Othur Fumes', 500, 'Inhaled', 'DC 13 Constitution saving throw or take 10 (3d6) Poison damage, and repeat the save at the start of each of its turns, taking 3 (1d6) Poison damage on each failure. The poison ends after three successful saves.'),
    ('Crawler Mucus', 200, 'Contact', 'DC 13 Constitution saving throw or have the Poisoned condition for 1 minute and the Paralyzed condition while Poisoned this way. The creature repeats the save at the end of each of its turns, ending the effect on a success.'),
    ('Essence of Ether', 300, 'Inhaled', 'DC 15 Constitution saving throw or have the Poisoned condition for 8 hours and the Unconscious condition while Poisoned this way. The creature wakes if it takes damage or another creature takes an action to shake it awake.'),
    ('Malice', 250, 'Inhaled', 'DC 15 Constitution saving throw or have the Poisoned condition for 1 hour and the Blinded condition while Poisoned this way.'),
    ('Midnight Tears', 1500, 'Ingested', 'No effect until the stroke of midnight. If the poison has not been neutralised before then (anything that ends the Poisoned condition does so), the creature makes a DC 17 Constitution saving throw, taking 31 (9d6) Poison damage on a failed save or half as much on a successful one.'),
    ('Oil of Taggit', 400, 'Contact', 'DC 13 Constitution saving throw or have the Poisoned condition for 24 hours and the Unconscious condition while Poisoned this way. The creature wakes if it takes damage.'),
    ('Pale Tincture', 250, 'Ingested', 'DC 16 Constitution saving throw or take 3 (1d6) Poison damage and have the Poisoned condition. The creature repeats the save every 24 hours, taking 3 (1d6) Poison damage on a failure. The damage cannot be healed until the poison ends, after seven successful saves.'),
    ('Purple Worm Poison', 2000, 'Injury', 'DC 21 Constitution saving throw, taking 35 (10d6) Poison damage on a failed save or half as much on a successful one. Harvested from a dead or Incapacitated Purple Worm.'),
    ('Serpent Venom', 200, 'Injury', 'DC 11 Constitution saving throw, taking 10 (3d6) Poison damage on a failed save or half as much on a successful one. Harvested from a dead or Incapacitated Giant Venomous Snake.'),
    ("Spider's Sting", 200, 'Injury', 'DC 13 Constitution saving throw or have the Poisoned condition for 1 hour. If the save fails by 5 or more, the creature also has the Unconscious condition while Poisoned this way; it wakes if it takes damage or another creature takes an action to shake it awake.'),
    ('Torpor', 600, 'Ingested', 'DC 15 Constitution saving throw or have the Poisoned condition for 4d6 hours. Its Speed is halved while it is Poisoned this way.'),
    ('Truth Serum', 150, 'Ingested', 'DC 11 Constitution saving throw or have the Poisoned condition for 1 hour. A creature Poisoned this way cannot knowingly lie.'),
    ('Wyvern Poison', 1200, 'Injury', 'DC 14 Constitution saving throw, taking 24 (7d6) Poison damage on a failed save or half as much on a successful one. Harvested from a dead or Incapacitated Wyvern.'),
]
for n, gp, typ, tx in POISONS:
    items.append({'n': n, 'cat': 'poison', 'cost': '%d GP' % gp, 'r': typ.lower(), 'tx': tx + '\n\n' + HOW[typ]})
items.sort(key=lambda x: x['n'])
out = {'source': 'SRD 5.2 (CC-BY-4.0) via open5e-api', 'spells': spells, 'conditions': conds, 'items': items}
json.dump(out, open('reference.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(spells), 'spells,', len(conds), 'conditions,', len(items), 'items')
