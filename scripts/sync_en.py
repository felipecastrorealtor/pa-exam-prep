"""
Re-sync the English side of the bank from scripts/bank_en.json.

Matches on (unit_id, legacy_id) and UPDATES in place, so it never deletes a
question row and never cascades away translations or progress. Use this for any
correction to the English text after the initial load.

Only writes rows whose content actually differs, and prints what changed.
"""
import json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = {}
for line in open(os.path.join(ROOT, '.env.local')):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env[k] = v.strip().strip('"').strip("'")

URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}

def call(method, path, body=None, prefer=None):
    h = dict(H)
    if prefer:
        h['Prefer'] = prefer
    req = urllib.request.Request(URL + '/rest/v1/' + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers=h)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read().decode()
        return json.loads(raw) if raw.strip() else None
    except urllib.error.HTTPError as e:
        sys.exit('%s %s -> %s\n%s' % (method, path[:60], e.code, e.read().decode()[:500]))

bank = json.load(open(os.path.join(ROOT, 'scripts', 'bank_en.json')))
live = call('GET', 'questions?select=id,unit_id,legacy_id,question_en,option_a_en,'
                   'option_b_en,option_c_en,option_d_en,correct,explanation_en&limit=2000')
index = {(q['unit_id'], q['legacy_id']): q for q in live}

changed = 0
for u in bank:
    for i, q in enumerate(u['questions'], start=1):
        row = index.get((u['id'], i))
        if not row:
            print('  no row for U%d #%d' % (u['id'], i))
            continue
        want = {
            'question_en':    q['q'],
            'option_a_en':    q['opts']['A'],
            'option_b_en':    q['opts']['B'],
            'option_c_en':    q['opts']['C'],
            'option_d_en':    q['opts']['D'],
            'correct':        q['correct'],
            'explanation_en': q['exp'],
        }
        diff = {k: v for k, v in want.items() if row.get(k) != v}
        if diff:
            call('PATCH', 'questions?id=eq.' + row['id'], diff)
            changed += 1
            print('  U%-2d #%-2d updated: %s' % (u['id'], i, ', '.join(sorted(diff))))

print('\n%d row(s) updated' % changed)
