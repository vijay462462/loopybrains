#!/usr/bin/env python3
"""Rebuild the app icon files with a chosen wordmark layout.

    python3 scripts/build_icons.py            # writes the default model (A)
    python3 scripts/build_icons.py --model B  # pill style
    python3 scripts/build_icons.py --previews # also writes docs/brand/models/wordmark-A|B|C.svg

It edits only the text block at the bottom of docs/icon.svg, docs/brand/icon-1024.svg and docs/brand/maskable.svg
(the mascot and ring are left untouched), then you run scripts/render_icons.mjs to refresh the PNG files.
"""
from __future__ import annotations
import argparse, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT = "font-family=\"'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif\" text-anchor=\"middle\" font-weight=\"900\""
MODELS = {
    # A: THE CAMPUS is the main word, LOOP is a small spaced tag under it
    "A": f'<g {FONT}>\n  <text x="512" y="846" font-size="118" letter-spacing="5" fill="#ffffff">THE CAMPUS</text>\n  <text x="512" y="948" font-size="72" letter-spacing="38" fill="url(#ring)">LOOP</text>\n</g>',
    # B: THE CAMPUS big, LOOP inside a small gradient pill
    "B": f'<g {FONT}>\n  <text x="512" y="838" font-size="118" letter-spacing="5" fill="#ffffff">THE CAMPUS</text>\n  <rect x="372" y="876" width="280" height="76" rx="38" fill="url(#ring)"/>\n  <text x="512" y="932" font-size="54" letter-spacing="24" fill="#150f4d">LOOP</text>\n</g>',
    # C: THE CAMPUS big, LOOP small between two thin lines
    "C": f'<g {FONT}>\n  <text x="512" y="838" font-size="112" letter-spacing="5" fill="#ffffff">THE CAMPUS</text>\n  <rect x="120" y="918" width="215" height="5" rx="2.5" fill="url(#ring)"/>\n  <rect x="689" y="918" width="215" height="5" rx="2.5" fill="url(#ring)"/>\n  <text x="512" y="942" font-size="64" letter-spacing="30" fill="url(#ring)">LOOP</text>\n</g>',
}
TEXT_BLOCK = re.compile(r"<g font-family=.*?</g>(?=(?:</g>)*</svg>)", re.S)


def apply(svg: str, model: str) -> str:
    if not TEXT_BLOCK.search(svg):
        raise SystemExit("could not find the text block to replace")
    return TEXT_BLOCK.sub(lambda _m: MODELS[model], svg, count=1)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", choices=sorted(MODELS), default="A")
    ap.add_argument("--previews", action="store_true")
    a = ap.parse_args()
    base = (ROOT / "docs/brand/icon-1024.svg").read_text(encoding="utf-8")
    for rel in ("docs/icon.svg", "docs/brand/icon-1024.svg", "docs/brand/maskable.svg"):
        p = ROOT / rel
        p.write_text(apply(p.read_text(encoding="utf-8"), a.model), encoding="utf-8")
        print("updated", rel)
    if a.previews:
        out = ROOT / "docs/brand/models"; out.mkdir(exist_ok=True)
        ref = (ROOT / "docs/brand/icon-1024.svg").read_text(encoding="utf-8")
        for m in MODELS:
            (out / f"wordmark-{m}.svg").write_text(apply(ref, m), encoding="utf-8"); print("preview", m)


if __name__ == "__main__":
    main()
