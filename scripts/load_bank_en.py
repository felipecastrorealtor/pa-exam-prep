"""
Replace the whole question bank with the 440 original questions.

Ordered so a failure can never leave a unit half-empty:
  1. insert every new question under temporary legacy_ids (10000+), which cannot
     collide with the existing 1..N rows under unique(unit_id, legacy_id)
  2. delete the old rows
  3. renumber the new ones down to 1..20 per unit

Reads scripts/bank_en.json (parsed from the source HTML, answer key rebalanced).
Credentials are read from .env.local on this machine and never printed.
"""
import json, os, sys, urllib.request, urllib.error
from collections import Counter

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
total = sum(len(u['questions']) for u in bank)
assert len(bank) == 22 and total == 440, 'expected 22 units / 440 questions, got %d/%d' % (len(bank), total)

existing = call('GET', 'questions?select=id,unit_id,legacy_id&limit=2000')
print('existing questions: %d  ->  loading %d' % (len(existing), total))

# phase 1 -- insert under temporary legacy_ids
rows = []
for u in bank:
    for i, q in enumerate(u['questions'], start=1):
        rows.append({
            'unit_id':        u['id'],
            'legacy_id':      10000 + i,
            'question_en':    q['q'],
            'option_a_en':    q['opts']['A'],
            'option_b_en':    q['opts']['B'],
            'option_c_en':    q['opts']['C'],
            'option_d_en':    q['opts']['D'],
            'correct':        q['correct'],
            'explanation_en': q['exp'],
            'page_ref':       None,
            'enabled':        True,
            'is_essential':   False,
        })

inserted = []
for i in range(0, len(rows), 50):
    got = call('POST', 'questions', rows[i:i+50], prefer='return=representation')
    inserted.extend(got)
    print('  inserted %d/%d' % (len(inserted), len(rows)), end='\r')
print('\ninserted %d new rows (temporary ids)' % len(inserted))

# phase 2 -- drop the old rows
old_ids = [r['id'] for r in existing]
for i in range(0, len(old_ids), 50):
    call('DELETE', 'questions?id=in.(%s)' % ','.join(old_ids[i:i+50]))
print('deleted %d old rows' % len(old_ids))

# phase 3 -- renumber to 1..20 per unit
by_unit = {}
for r in inserted:
    by_unit.setdefault(r['unit_id'], []).append(r)
done = 0
for uid in sorted(by_unit):
    rs = sorted(by_unit[uid], key=lambda r: r['legacy_id'])
    for i, r in enumerate(rs, start=1):
        call('PATCH', 'questions?id=eq.' + r['id'], {'legacy_id': i})
        done += 1
        print('  renumbered %d/%d' % (done, len(inserted)), end='\r')
print('\nrenumbered %d rows' % done)

# verify
final = call('GET', 'questions?select=id,unit_id,legacy_id,correct&limit=2000')
per = Counter(r['unit_id'] for r in final)
bad = ['U%d=%d' % (u, n) for u, n in sorted(per.items()) if n != 20]
print('\nfinal count: %d' % len(final))
print('units not at 20:', bad or 'none')
print('answer spread :', dict(sorted(Counter(r['correct'] for r in final).items())))
dup = [k for k, n in Counter((r['unit_id'], r['legacy_id']) for r in final).items() if n > 1]
print('duplicate (unit, legacy_id):', dup or 'none')
