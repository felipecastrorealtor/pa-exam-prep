#!/usr/bin/env python3
"""
Load original questions into a unit.  Usage: load_questions.py 15
Expects scripts/questions_unit<N>.py exporting Q.
Refuses to run if the unit already has questions, so it can't duplicate.
"""
import importlib, json, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
unit = int(sys.argv[1])
Q = importlib.import_module(f'questions_unit{unit}').Q

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

existing = req('GET', f'questions?unit_id=eq.{unit}&select=legacy_id')
if existing:
    sys.exit(f'unidade {unit} já tem {len(existing)} perguntas — abortando para não duplicar')

rows = [{
    'unit_id': unit, 'legacy_id': i,
    'question_en': x['q'],
    'option_a_en': x['a'], 'option_b_en': x['b'],
    'option_c_en': x['c'], 'option_d_en': x['d'],
    'correct': x['correct'], 'explanation_en': x['e'],
    'enabled': True, 'is_essential': False,
} for i, x in enumerate(Q, start=1)]

created = req('POST', 'questions', rows, prefer='return=representation')
print(f'{len(created)} perguntas criadas na unidade {unit}')

by_legacy = {c['legacy_id']: c['id'] for c in created}
tr = [{
    'question_id': by_legacy[i],
    'question_es': x['qes'],
    'option_a_es': x['aes'], 'option_b_es': x['bes'],
    'option_c_es': x['ces'], 'option_d_es': x['des'],
    'explanation_es': x['ees'],
} for i, x in enumerate(Q, start=1)]
req('POST', 'question_translations', tr, prefer='return=minimal')
print(f'{len(tr)} traduções criadas')

req('PATCH', f'units?id=eq.{unit}', {'enabled': True}, prefer='return=minimal')
print(f'unidade {unit} habilitada')
