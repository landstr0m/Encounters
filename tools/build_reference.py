"""Builds reference.json (SRD 5.2 spells + conditions) from open5e's data repo.

Usage: python tools/build_reference.py PATH_TO/open5e-api/data/v2/wizards-of-the-coast/srd-2024
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
        'cl': [c.replace('srd-2024_', '') for c in f.get('classes') or []],
        'sv': f.get('saving_throw_ability') or '', 'at': bool(f.get('attack_roll')),
        'dt': f.get('damage_types') or [], 'dr': f.get('damage_roll') or '',
        'tx': f['desc'], 'hl': f.get('higher_level') or '', 'up': up.get(s['pk'], [])})
spells.sort(key=lambda x: (x['n']))
conds = {c['fields']['describes'].title(): c['fields']['desc'] for c in L('ConditionDescription.json')}
out = {'source': 'SRD 5.2 (CC-BY-4.0) via open5e-api', 'spells': spells, 'conditions': conds}
json.dump(out, open('reference.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(spells), 'spells,', len(conds), 'conditions')
