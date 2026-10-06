#!/usr/bin/env bash
# Quick checks before every release: every script parses, no leftover placeholders, versions agree.
set -e
cd "$(dirname "$0")/.."
fail=0
for f in docs/*.js functions/index.js; do
  node --check "$f" 2>/dev/null || { node --input-type=module --check < "$f" 2>/dev/null || { echo "SYNTAX ERROR in $f"; fail=1; }; }
done
v=$(grep -o 'app.js?v=[0-9]*' docs/index.html | head -1 | cut -d= -f2)
for f in docs/sw.js docs/admin.html docs/colleges.html; do grep -q "v=$v" "$f" || { echo "VERSION MISMATCH in $f (index.html is v$v)"; fail=1; }; done
grep -q "spark-v$v" docs/sw.js || { echo "Service worker cache name is not spark-v$v"; fail=1; }
if grep -rn 'class="todo"' docs/*.html >/dev/null; then echo "NOTE: a page still has a highlighted placeholder to fill in:"; grep -rn 'class="todo"' docs/*.html | cut -c1-120; fi
if command -v python3 >/dev/null; then
  python3 scripts/audit_data.py | grep -E "ERROR|data audit" || true
  python3 scripts/audit_data.py >/dev/null || fail=1
  python3 -m unittest discover -s tests -p "test_*.py" >/dev/null 2>&1 || { echo "PYTHON TOOL TESTS FAILED (run: python3 -m unittest discover -s tests -p \"test_*.py\")"; fail=1; }
fi
node tests/packs.test.mjs || fail=1
[ $fail = 0 ] && echo "All checks passed (version $v)"
exit $fail
