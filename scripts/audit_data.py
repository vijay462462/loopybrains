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
import ast, json, math, operator, re, subprocess, sys
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


_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv, ast.Mod: operator.mod, ast.Pow: operator.pow}
_FUNCS = {"sum": sum, "range": range, "int": int, "bin": bin, "abs": abs, "min": min, "max": max, "ceil": math.ceil, "floor": math.floor, "log": math.log, "sqrt": math.sqrt, "len": len}


def safe_eval(expr: str):
    """Evaluate a tiny arithmetic expression without eval(): numbers, + - * / // % **, slices and a short allow-list of functions.
    Anything else (names, attributes, imports, lambdas, comprehensions) is rejected, so a data file cannot run code."""
    def go(n):
        if isinstance(n, ast.Expression): return go(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float, str)): return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in _OPS:
            l, r = go(n.left), go(n.right)
            if isinstance(n.op, ast.Pow) and abs(r) > 64: raise ValueError("exponent too large")
            return _OPS[type(n.op)](l, r)
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.UAdd)):
            return -go(n.operand) if isinstance(n.op, ast.USub) else go(n.operand)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in _FUNCS and not n.keywords:
            return _FUNCS[n.func.id](*[go(a) for a in n.args])
        if isinstance(n, ast.Subscript) and isinstance(n.slice, ast.Slice):
            sl = n.slice
            return go(n.value)[slice(*(go(x) if x is not None else None for x in (sl.lower, sl.upper, sl.step)))]
        raise ValueError(f"not allowed: {type(n).__name__}")
    return go(ast.parse(expr.strip(), mode="eval"))


def audit_curiosity(rep: Report) -> int:
    c = load_js(ROOT / "docs/curiosity.js", "CURIO")
    if not c:
        rep.err("curiosity.js did not load"); return 0
    tags = {"general", "math", "cs", "ece", "physics", "chem", "mech", "civil"}
    def text(v, lim, tag):
        if not isinstance(v, str) or not 3 <= len(v) <= lim or UNSAFE.search(v):
            rep.err(f"curiosity {tag}: bad text {str(v)[:40]!r}")
    def years(item, tag):
        y = item.get("y")
        if y is not None and (not isinstance(y, list) or not y or not all(isinstance(k, int) and 1 <= k <= 4 for k in y)):
            rep.err(f"curiosity {tag}: y must be a list of years 1-4")
        if item.get("t") is not None and item["t"] not in tags:
            rep.err(f"curiosity {tag}: unknown tag {item['t']!r}")
    for i, f in enumerate(c.get("facts", [])):
        years(f, f"fact {i}")
        text(f.get("q"), 300, f"fact {i}"); text(f.get("ask"), 80, f"fact {i} ask")
        if f.get("t") not in tags: rep.err(f"curiosity fact {i}: unknown tag {f.get('t')!r}")
    for i, w in enumerate(c.get("whys", [])):
        years(w, f"why {i}")
        text(w.get("q"), 160, f"why {i}"); text(w.get("x"), 400, f"why {i} explanation")
        o = w.get("o", [])
        if not (2 <= len(o) <= 4) or not isinstance(w.get("a"), int) or not 0 <= w["a"] < len(o):
            rep.err(f"curiosity why {i}: answer index must point at one of 2-4 options")
        for t in o: text(t, 120, f"why {i} option")
    for i, m in enumerate(c.get("mysteries", [])):
        years(m, f"mystery {i}") if "n" in m else None
        text(m.get("n") or m.get("t"), 60, f"mystery {i}"); text(m.get("h"), 160, f"mystery {i} hint"); text(m.get("x"), 600, f"mystery {i} text")
    for i, t in enumerate(c.get("tips", [])):
        if isinstance(t, dict): years(t, f"tip {i}"); text(t.get("q"), 260, f"tip {i}")
        else: text(t, 260, f"tip {i}")
    by_year = {y: sum(1 for k in ("facts", "whys", "mysteries") for it in c.get(k, []) if y in (it.get("y") or [1, 2, 3, 4])) for y in (1, 2, 3, 4)}
    for y, n in by_year.items():
        if n < 12: rep.warn(f"curiosity: only {n} items for year {y}")
    for i, m in enumerate(c.get("maps", [])):
        text(m.get("c"), 40, f"map {i}")
        if not 4 <= len(m.get("l", [])) <= 8: rep.err(f"curiosity map {i}: use 4 to 8 links")
        for lab, kind in m.get("l", []):
            text(lab, 40, f"map {i} link")
            if kind not in ("subject", "job", "use"): rep.err(f"curiosity map {i}: bad kind {kind!r}")
    for i, u in enumerate(c.get("uses", [])):
        text(u[0], 30, f"use {i} key"); text(u[1], 240, f"use {i}")
    for i, t in enumerate(c.get("sparks", [])): text(t, 220, f"spark {i}")
    for i, n in enumerate(c.get("now", [])):
        text(n[0], 60, f"explore {i}"); text(n[2], 200, f"explore {i} note")
        host = urlparse(n[1]).hostname or ""
        if urlparse(n[1]).scheme != "https" or not re.search(r"(^|\.)(isro\.gov\.in|nptel\.ac\.in|arxiv\.org|cern|ieee\.org|drdo\.gov\.in|kaggle\.com|nasa\.gov)$", host):
            rep.err(f"curiosity explore {i}: link must be https on a known site ({n[1]})")
    for i, z in enumerate(c.get("puzzles", [])):
        text(z.get("q"), 300, f"puzzle {i}"); text(z.get("x"), 300, f"puzzle {i} explanation")
        if len(z.get("h", [])) != 3: rep.err(f"curiosity puzzle {i}: needs exactly 3 hints")
        for t in z.get("h", []): text(t, 200, f"puzzle {i} hint")
        try:
            got = safe_eval(z["py"])
            if str(int(got) if float(got).is_integer() else got) not in [str(a) for a in z["a"]]:
                rep.err(f"curiosity puzzle {i}: stored answer {z['a']} does not match Python result {got}")
        except Exception as e:
            rep.err(f"curiosity puzzle {i}: py check failed ({e})")
    return sum(len(c.get(k, [])) for k in ("facts", "whys", "mysteries", "tips", "maps", "uses", "puzzles", "sparks", "now"))


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
