# Runs every playtest against ../index.html and reports pass/fail.
# Needs: pip install playwright && playwright install chromium   (or set CHROME=/path/to/chrome)
# Run with: python tests/run_all.py
import subprocess, sys, glob, os
here = os.path.dirname(os.path.abspath(__file__)); bad = 0
for t in sorted(glob.glob(os.path.join(here, 'test_*.py'))):
    r = subprocess.run([sys.executable, t], capture_output=True, text=True, timeout=600)
    out = (r.stdout + r.stderr).strip().splitlines()
    ok = r.returncode == 0 and out and out[-1].strip() == 'errors []'
    bad += not ok
    print(('PASS ' if ok else 'FAIL ') + os.path.basename(t) + ('' if ok else '\n   ' + '\n   '.join(out[-5:])))
print('All passed' if not bad else f'{bad} failed'); sys.exit(1 if bad else 0)
