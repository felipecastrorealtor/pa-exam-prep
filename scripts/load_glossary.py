#!/usr/bin/env python3
"""Load the 129 glossary terms into Supabase. Reads .env.local; never prints secrets."""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glossary_en_a import EN_A
from glossary_en_b import EN_B

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
EN = {**EN_A, **EN_B}
terms = json.load(open(os.path.join(ROOT, 'scripts', 'glossary-source.json')))

missing = [t['id'] for t in terms if t['id'] not in EN]
if missing:
    sys.exit(f'FALTAM definições em inglês para: {missing}')

rows = [{
    'slug': t['id'], 'term_en': t['en'], 'term_es': t['es'],
    'definition_en': EN[t['id']], 'definition_es': t['def'], 'enabled': True,
} for t in terms]
print(f'{len(rows)} termos prontos, todos com definição em inglês')

for i in range(0, len(rows), 40):
    body = json.dumps(rows[i:i+40]).encode()
    req = urllib.request.Request(f'{URL}/rest/v1/glossary_terms?on_conflict=slug', data=body,
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json',
                 'Prefer': 'resolution=merge-duplicates,return=minimal'}, method='POST')
    urllib.request.urlopen(req, timeout=60)
    print(f'  gravados {min(i+40, len(rows))}/{len(rows)}')

req = urllib.request.Request(f'{URL}/rest/v1/glossary_terms?select=slug&limit=1',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Prefer': 'count=exact'})
print('total no banco:', urllib.request.urlopen(req, timeout=30).headers.get('Content-Range'))
