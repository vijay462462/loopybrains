#!/usr/bin/env python3
"""Data audit: every fact the app shows about a college must be traceable and well formed.

Run:  python3 scripts/audit_data.py            (exit code 1 on any ERROR, so CI can block a release)

Checks
  college-data.js   each entry has an https `source` on an official-looking host, a non-empty
                    subject list with no duplicates, "Other" last, and sane field types.
  rgukt-curriculum  subject codes follow the RGUKT pattern, credits are 0-6, categories and
                    campuses are known, no duplicate subject inside a branch/year.
  rgukt-units.js    unit numbers 1-6, strings are clean (no markup), lengths are bounded.
Only the standard library is used. JavaScript files are evaluated by `node` in a bare VM
context (no network, no file access) and handed back as JSON.
"""
from __future__ import annotations
import json, re, subprocess, sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
OFFICIAL = re.compile(r"(\.|^)(ac\.in|edu\.in|edu|gov\.in|nic\.in|res\.in|iittp\.ac\.in|nitandhra\.ac\.in|rgukt\.in|rgukt\.ac\.in|iiits\.ac\.in|vitap\.ac\.in|srmap\.edu\.in|kluniversity\.in|vignan\.ac\.in|gitam\.edu|nagarjunauniversity\.ac\.in|jntuk\.edu\.in|jntua\.ac\.in)$", re.I)
CODE = re.compile(r"^\d{2}[A-Z]{2}\d{4}[A-Z]?$|^\d{2}[A-Z]{2}XX\d{2}$")
CATS = {"BSC", "ESC", "PCC", "PEC", "OEC", "MC", "HSC", "HSMC", "PRJ", "LC", "SC", "INT", "SEM"}
UNSAFE = re.compile(r"[<>\x00-\x08\x0b\x0c\x0e-\x1f]")


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def err(self, msg: str) -> None: self.errors.append(msg)
    def warn(self, msg: str) -> None: self.warnings.append(msg)


def load_js(path: Path, expr: str):
    """Evaluate a browser data file in a bare Node VM and return window.<expr> as a Python object."""
    script = ("const vm=require('vm'),fs=require('fs');const w={};const ctx=vm.createContext({window:w});"
              "vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),ctx,{timeout:2000});"
              f"process.stdout.write(JSON.stringify(w.{expr}||null));")
    out = subprocess.run(["node", "-e", script, str(path)], capture_output=True, text=True, timeout=20)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip()[:300])
    return json.loads(out.stdout)


def audit_colleges(rep: Report) -> int:
    data = load_js(ROOT / "docs/college-data.js", "COLLEGE_DATA") or {}
    for slug, e in data.items():
        where = f"college-data[{slug}]"
        src = e.get("source", "")
        host = (urlparse(src).hostname or "") if isinstance(src, str) else ""
        if urlparse(src).scheme not in ("http", "https"):
            rep.err(f"{where}: source must be a web link ({src!r})")
        elif urlparse(src).scheme == "http":
            rep.warn(f"{where}: official site is only listed over http ({src})")
        if not OFFICIAL.search(host):
            rep.err(f"{where}: source host {host!r} does not look like an official college or university site")
        subs = e.get("subjects")
        if not isinstance(subs, list) or not subs:
            rep.err(f"{where}: subjects missing"); continue
        if len(set(s.lower() for s in subs)) != len(subs):
            rep.err(f"{where}: duplicate subjects")
        if subs[-1] != "Other":
            rep.warn(f"{where}: last subject is not 'Other'")
        for s in subs:
            if not isinstance(s, str) or not 1 <= len(s) <= 60 or UNSAFE.search(s):
                rep.err(f"{where}: bad subject {s!r}")
        if "exam" in e and not isinstance(e["exam"], str):
            rep.err(f"{where}: exam must be text")
    return len(data)


def audit_curriculum(rep: Report) -> int:
    c = load_js(ROOT / "docs/rgukt-curriculum.js", "RGUKT_CURRICULUM")
    if not c:
        rep.err("rgukt-curriculum.js did not load"); return 0
    camps, n = set(c.get("campuses", {})), 0
    for year, branches in c["data"].items():
        for br, rows in branches.items():
            seen = set()
            for r in rows:
                n += 1
                name, code, credits, cat, where = r
                tag = f"curriculum[{year}/{br}/{name}]"
                if not all(CODE.match(x.strip()) for x in code.split("/")):
                    rep.err(f"{tag}: odd code {code!r}")
                if not isinstance(credits, (int, float)) or not 0 <= credits <= 6:
                    rep.err(f"{tag}: credits {credits!r}")
                if cat not in CATS:
                    rep.warn(f"{tag}: unknown category {cat!r}")
                if where != "ALL" and not set(where.split(",")) <= camps:
                    rep.err(f"{tag}: unknown campus in {where!r}")
                if (name, code) in seen:
                    rep.err(f"{tag}: duplicate row")
                seen.add((name, code))
    return n


def audit_units(rep: Report) -> int:
    u = load_js(ROOT / "docs/rgukt-units.js", "RGUKT_UNITS") or {}
    cur = load_js(ROOT / "docs/rgukt-curriculum.js", "RGUKT_CURRICULUM") or {"data": {}}
    known = {x.strip() for yr in cur["data"].values() for rows in yr.values() for r in rows for x in r[1].split("/")}
    for code, e in u.items():
        if code not in known:
            rep.warn(f"units[{code}]: not in the curriculum list")
        nums = [x.get("u") for x in e.get("n", [])]
        if len(nums) != len(set(nums)) or not all(isinstance(k, int) and 1 <= k <= 6 for k in nums):
            rep.err(f"units[{code}]: unit numbers must be unique and 1-6, got {nums}")
        for x in e.get("n", []):
            for k, lim in (("t", 120), ("x", 700)):
                v = x.get(k, "")
                if not isinstance(v, str) or len(v) > lim or UNSAFE.search(v):
                    rep.err(f"units[{code}] unit {x.get('u')}: bad {k}")
    return len(u)


def audit_curiosity(rep: Report) -> int:
    c = load_js(ROOT / "docs/curiosity.js", "CURIO")
    if not c:
        rep.err("curiosity.js did not load"); return 0
    tags = {"general", "math", "cs", "ece", "physics", "chem", "mech", "civil"}
    def text(v, lim, tag):
        if not isinstance(v, str) or not 3 <= len(v) <= lim or UNSAFE.search(v):
            rep.err(f"curiosity {tag}: bad text {str(v)[:40]!r}")
    for i, f in enumerate(c.get("facts", [])):
        text(f.get("q"), 300, f"fact {i}"); text(f.get("ask"), 80, f"fact {i} ask")
        if f.get("t") not in tags: rep.err(f"curiosity fact {i}: unknown tag {f.get('t')!r}")
    for i, w in enumerate(c.get("whys", [])):
        text(w.get("q"), 160, f"why {i}"); text(w.get("x"), 400, f"why {i} explanation")
        o = w.get("o", [])
        if not (2 <= len(o) <= 4) or not isinstance(w.get("a"), int) or not 0 <= w["a"] < len(o):
            rep.err(f"curiosity why {i}: answer index must point at one of 2-4 options")
        for t in o: text(t, 120, f"why {i} option")
    for i, m in enumerate(c.get("mysteries", [])):
        text(m.get("t"), 60, f"mystery {i}"); text(m.get("h"), 160, f"mystery {i} hint"); text(m.get("x"), 600, f"mystery {i} text")
    for i, t in enumerate(c.get("tips", [])): text(t, 260, f"tip {i}")
    return sum(len(c.get(k, [])) for k in ("facts", "whys", "mysteries", "tips"))


def main() -> int:
    rep = Report()
    n_col, n_rows, n_units, n_cur = audit_colleges(rep), audit_curriculum(rep), audit_units(rep), audit_curiosity(rep)
    print(f"audited {n_col} college entries, {n_rows} curriculum rows, {n_units} syllabus entries, {n_cur} curiosity items")
    for w in rep.warnings: print("  WARN ", w)
    for e in rep.errors: print("  ERROR", e)
    print("data audit:", "FAILED" if rep.errors else "ok")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
