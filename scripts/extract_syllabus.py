#!/usr/bin/env python3
"""Turn RGUKT syllabus PDFs into unit-wise topics for the app.

Usage:
    pip install pypdf
    python3 scripts/extract_syllabus.py CSE_BoS.pdf ECE_BoS.pdf ... -o docs/rgukt-units.js
    python3 scripts/extract_syllabus.py --text sample.txt -o /tmp/out.js     # parse already-extracted text (for testing)

What it does
  * reads each PDF page by page and finds every "Course Code: <code>" block;
  * inside a block it reads "Unit - I ... Unit - VI" headings and the topic text under each one;
  * writes docs/rgukt-units.js:  window.RGUKT_UNITS = { "<code>": { n: [ {u, t, x} ... ] } }.

Safety
  * Output is plain data. Every string is stripped of control characters and angle brackets and
    length-limited, and the app shows it with textContent, so a hostile PDF cannot inject markup.
  * Only files you pass in are read. Nothing is downloaded and nothing is executed.
  * Always review the generated file before publishing: PDF text extraction is never perfect.
"""
import argparse, json, re, sys, unicodedata
from pathlib import Path

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
CODE = re.compile(r"Course\s*Code\s*[:\-]?\s*([0-9]{2}[A-Z]{2}[0-9A-Z]{3,6})", re.I)
NAME = re.compile(r"Course\s*(?:Title|Name)\s*[:\-]?\s*(.+)", re.I)
UNIT = re.compile(r"(?m)^\s*Unit\s*[-–—:.]?\s*(VI|IV|V|III|II|I|[1-6])\b[^\n]*")
STOP = re.compile(r"(?im)^\s*(Text\s*Books?|Reference\s*Books?|Course\s*Outcomes?|Suggested\s*Readings?|Web\s*Resources?|Online\s*Resources?|Laboratory)\b")
MAX_TITLE, MAX_TOPICS, MAX_UNITS = 120, 700, 6


def clean(s: str, limit: int) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[\x00-\x1f\x7f<>]", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" -:–—")
    return s[:limit]


def read_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("Install the reader first: pip install pypdf")
    return "\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages)


def unit_no(tok: str) -> int:
    return int(tok) if tok.isdigit() else ROMAN[tok.upper()]


def parse(text: str) -> dict:
    out = {}
    marks = list(CODE.finditer(text))
    for i, m in enumerate(marks):
        block = text[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(text)]
        code = m.group(1).upper()
        name_m = NAME.search(block[:400])
        units = []
        heads = list(UNIT.finditer(block))
        for j, h in enumerate(heads):
            try:
                n = unit_no(h.group(1))
            except KeyError:
                continue
            end = heads[j + 1].start() if j + 1 < len(heads) else len(block)
            body = block[h.end(): end]
            stop = STOP.search(body)
            if stop:
                body = body[: stop.start()]
            head_txt = re.sub(r"(?i)^\s*Unit\s*[-–—:.]?\s*(VI|IV|V|III|II|I|[1-6])\b", "", h.group(0))
            head_txt = re.sub(r"\(\s*\d+\s*(?:contact\s*)?hours?\s*\)", "", head_txt, flags=re.I)
            title = clean(head_txt, MAX_TITLE)
            topics = clean(body, MAX_TOPICS)
            if 1 <= n <= MAX_UNITS and (title or topics) and not any(u["u"] == n for u in units):
                units.append({"u": n, "t": title, "x": topics})
        if units:
            out[code] = {"name": clean(name_m.group(1), 120) if name_m else "", "n": sorted(units, key=lambda u: u["u"])}
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*", help="syllabus PDF files")
    ap.add_argument("--text", help="a text file to parse instead of PDFs")
    ap.add_argument("-o", "--out", default="docs/rgukt-units.js")
    a = ap.parse_args()
    if not a.files and not a.text:
        ap.error("give at least one PDF, or --text")
    data = {}
    sources = [Path(a.text)] if a.text else [Path(f) for f in a.files]
    for src in sources:
        text = src.read_text(encoding="utf-8", errors="replace") if a.text else read_pdf(src)
        found = parse(text)
        print(f"{src.name}: {len(found)} courses, {sum(len(v['n']) for v in found.values())} units")
        for k, v in found.items():
            data.setdefault(k, v)
    body = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True).replace("</", "<\\/")
    Path(a.out).write_text(
        "// Unit-wise topics read from the official RGUKT syllabus PDFs by scripts/extract_syllabus.py. Review before publishing.\n"
        "window.RGUKT_UNITS = " + body + ";\n", encoding="utf-8")
    print(f"wrote {a.out} with {len(data)} courses")


if __name__ == "__main__":
    main()
