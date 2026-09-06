"""
Load Spanish translations for the question bank.

Reads scripts/es/uNN.json (one file per unit, keyed by the question number
within the unit) and upserts question_translations, matching each row to its
question by (unit_id, legacy_id).

Safe to re-run: it upserts on question_id and only touches the units whose
files are present, so translation can land unit by unit while the rest of the
bank keeps falling back to English in the UI.

Credentials come from .env.local on this machine and are never printed.
"""
import json, os, sys, glob, urllib.request, urllib.error

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

questions = call('GET', 'questions?select=id,unit_id,legacy_id&limit=2000')
index = {(q['unit_id'], q['legacy_id']): q['id'] for q in questions}
print('questions in bank: %d' % len(questions))

# The translation files are keyed by the question number as it appears in the
# source document, which runs 1..440 across the whole bank. legacy_id runs 1..20
# WITHIN each unit. Build the map from bank_en.json's per-unit ordering rather
# than assuming the two agree -- they only do for unit 1.
bank = json.load(open(os.path.join(ROOT, 'scripts', 'bank_en.json')))
srcnum_to_legacy = {}
for u in bank:
    for i, q in enumerate(u['questions'], start=1):
        srcnum_to_legacy[(u['id'], q['n'])] = i

files = sorted(glob.glob(os.path.join(ROOT, 'scripts', 'es', 'u*.json')))
if not files:
    sys.exit('no translation files found in scripts/es/')

rows, problems = [], []
for path in files:
    data = json.load(open(path, encoding='utf-8'))
    uid = data['unit']
    for n, t in data['questions'].items():
        legacy = srcnum_to_legacy.get((uid, int(n)))
        qid = index.get((uid, legacy)) if legacy else None
        if not qid:
            problems.append('U%s Q%s: no matching question row' % (uid, n))
            continue
        missing = [f for f in ('q', 'A', 'B', 'C', 'D', 'e') if not (t.get(f) or '').strip()]
        if missing:
            problems.append('U%s Q%s: empty %s' % (uid, n, ','.join(missing)))
            continue
        rows.append({
            'question_id':    qid,
            'question_es':    t['q'],
            'option_a_es':    t['A'],
            'option_b_es':    t['B'],
            'option_c_es':    t['C'],
            'option_d_es':    t['D'],
            'explanation_es': t['e'],
        })
    print('  %s -> %d translations' % (os.path.basename(path), len(data['questions'])))

if problems:
    print('\nPROBLEMS (%d):' % len(problems))
    for p in problems[:20]:
        print('  -', p)
    sys.exit('refusing to load with problems outstanding')

for i in range(0, len(rows), 50):
    call('POST', 'question_translations', rows[i:i+50],
         prefer='resolution=merge-duplicates,return=minimal')
    print('  upserted %d/%d' % (min(i + 50, len(rows)), len(rows)), end='\r')
print('\nupserted %d translations' % len(rows))

# verify
tr = call('GET', 'question_translations?select=question_id,question_es,explanation_es&limit=2000')
by_id = {t['question_id']: t for t in tr}
filled = [q for q in questions if (by_id.get(q['id'], {}).get('explanation_es') or '').strip()]
from collections import Counter
per = Counter(q['unit_id'] for q in filled)
print('\nunits with Spanish loaded:')
for u in sorted(per):
    print('  U%-2d  %d/20' % (u, per[u]))
print('total Spanish: %d / %d' % (len(filled), len(questions)))
