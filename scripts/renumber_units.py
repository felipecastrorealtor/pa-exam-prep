#!/usr/bin/env python3
"""
Renumber questions so the unit numbers match the textbook
(Modern Real Estate Practice in Pennsylvania, 15th ed.).

The seeded bank grouped questions by topic but filed them under numbers that
don't line up with the book: appraisal sat under 14, fair housing under 20,
PA licensing law under 22. A student studying with the book open was sent to
the wrong unit every time.

Writes a backup of the current mapping before touching anything.
Run with --apply to make changes; without it, prints the plan and exits.
"""
import json, os, sys, urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = {}
for fn in ('.env.local', '.env'):
    p = os.path.join(ROOT, fn)
    if os.path.exists(p):
        for line in open(p):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
URL = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/'); KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}

def req(method, path, payload=None, prefer=None):
    h = dict(H)
    if prefer: h['Prefer'] = prefer
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(f'{URL}/rest/v1/{path}', data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=60) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None

# Whole blocks that are topically homogeneous — verified by reading them.
BLOCK = {14: 20, 15: 13, 17: 22, 18: 22, 19: 3, 20: 16, 22: 12}

# The maths block splits across the book: commission belongs to Brokerage,
# cap rate to Appraising, millage to Taxes, and so on.
MATHS = {
    1: 14, 2: 14, 3: 14, 4: 14, 18: 14,      # commission
    5: 20, 6: 20, 7: 20, 20: 20,             # income approach to value
    8: 19, 17: 19,                            # loans and interest
    11: 7, 16: 7,                             # assessed value and mills
    12: 4,                                    # area from a legal description
    10: 13, 19: 13,                           # appreciation over a holding period
}

def target(unit_id: int, legacy_id: int) -> int:
    if unit_id == 16:
        return MATHS.get(legacy_id, 16)
    return BLOCK.get(unit_id, unit_id)

rows = req('GET', 'questions?select=id,unit_id,legacy_id&order=unit_id,legacy_id&limit=500')
print(f'{len(rows)} perguntas no banco')

backup = os.path.join(ROOT, 'scripts', 'renumber_backup.json')
json.dump(rows, open(backup, 'w'), indent=1)
print(f'backup salvo em scripts/renumber_backup.json')

grouped = defaultdict(list)
for r in rows:
    grouped[target(r['unit_id'], r['legacy_id'])].append(r)

plan = []
for new_unit in sorted(grouped):
    items = sorted(grouped[new_unit], key=lambda r: (r['unit_id'], r['legacy_id']))
    for i, r in enumerate(items, start=1):
        if r['unit_id'] != new_unit or r['legacy_id'] != i:
            plan.append({'id': r['id'], 'from': (r['unit_id'], r['legacy_id']),
                         'to': (new_unit, i)})

print(f'\n{len(plan)} perguntas mudam de lugar\n')
print('distribuição final por unidade do livro:')
for u in sorted(grouped):
    print(f'  unidade {u:>2}: {len(grouped[u]):>2} perguntas')

empty = [u for u in range(1, 23) if u not in grouped]
if empty:
    print(f'\nunidades do livro que ficam SEM perguntas: {empty}')

if '--apply' not in sys.argv:
    print('\n(simulação — rode com --apply para gravar)')
    sys.exit()

# Two passes so the unique(unit_id, legacy_id) constraint is never violated
# mid-flight: park everything on high numbers first, then land on the finals.
print('\npasso 1: numeração temporária…')
for i, r in enumerate(rows):
    req('PATCH', f"questions?id=eq.{r['id']}", {'legacy_id': 10000 + i}, prefer='return=minimal')

print('passo 2: unidade e numeração finais…')
n = 0
for new_unit in sorted(grouped):
    items = sorted(grouped[new_unit], key=lambda r: (r['unit_id'], r['legacy_id']))
    for i, r in enumerate(items, start=1):
        req('PATCH', f"questions?id=eq.{r['id']}",
            {'unit_id': new_unit, 'legacy_id': i}, prefer='return=minimal')
        n += 1
print(f'{n} perguntas gravadas')
