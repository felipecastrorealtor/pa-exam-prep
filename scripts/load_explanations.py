#!/usr/bin/env python3
"""
Move the Spanish explanation into explanation_es and write the English one
into explanation_en, for one unit at a time.

The migration put Spanish text in the English column and left the Spanish
column empty, so students studying in English were reading Spanish.

Usage: python3 scripts/load_explanations.py 12
"""
import importlib, json, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))

unit = int(sys.argv[1]) if len(sys.argv) > 1 else 12
EN = importlib.import_module(f'explanations_unit{unit}_en').EN

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

rows = req('GET', f'questions?unit_id=eq.{unit}&select=id,legacy_id,explanation_en&order=legacy_id')
print(f'unidade {unit}: {len(rows)} perguntas')

missing = [r['legacy_id'] for r in rows if r['legacy_id'] not in EN]
if missing:
    sys.exit(f'FALTAM explicações em inglês para: {missing}')

done = 0
for r in rows:
    spanish = r['explanation_en'] or ''
    english = EN[r['legacy_id']]

    # Spanish moves to its own column
    req('PATCH', f"question_translations?question_id=eq.{r['id']}",
        {'explanation_es': spanish}, prefer='return=minimal')

    # English takes the English column
    req('PATCH', f"questions?id=eq.{r['id']}", {'explanation_en': english},
        prefer='return=minimal')
    done += 1

print(f'{done} explicações atualizadas')

check = req('GET', f'questions?unit_id=eq.{unit}&select=legacy_id,explanation_en&legacy_id=eq.1')
print('amostra EN:', check[0]['explanation_en'][:95], '…')
