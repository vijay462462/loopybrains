#!/usr/bin/env python3
"""Rebuild the app icon files with a chosen wordmark layout.

    python3 scripts/build_icons.py            # writes the default model (D)
    python3 scripts/build_icons.py --model B  # pill style
    python3 scripts/build_icons.py --previews # also writes docs/brand/models/wordmark-A to F.svg

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
FONT_LIGHT = FONT.replace('font-weight="900"', 'font-weight="400"')
GOLD = '<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#f59e0b"/><stop offset="1" stop-color="#fcd34d"/></linearGradient></defs>'
SERIF = "font-family=\"'Bitstream Charter','Georgia','Times New Roman',serif\" text-anchor=\"middle\""
MODELS.update({
    # D: serif headline with a gold hairline and a small gold LOOP (classic, premium)
    "D": f'<g {SERIF} font-weight="700">{GOLD}\n  <text x="512" y="842" font-size="116" letter-spacing="4" fill="#ffffff">THE CAMPUS</text>\n  <rect x="262" y="880" width="215" height="3" rx="1.5" fill="url(#gold)"/><rect x="547" y="880" width="215" height="3" rx="1.5" fill="url(#gold)"/>\n  <path d="M512 868 l13 14 -13 14 -13 -14z" fill="url(#gold)"/>\n  <text x="512" y="958" font-size="58" letter-spacing="46" font-weight="600" fill="url(#gold)">LOOP</text>\n</g>',
    # E: light, wide-tracked headline with a thin outlined LOOP tag (minimal, modern luxury)
    "E": f'<g {FONT_LIGHT}>{GOLD}\n  <text x="512" y="836" font-size="92" letter-spacing="16" fill="#ffffff">THE CAMPUS</text>\n  <rect x="372" y="880" width="280" height="68" rx="34" fill="none" stroke="url(#gold)" stroke-width="3.5"/>\n  <text x="512" y="930" font-size="44" letter-spacing="22" font-weight="700" fill="url(#gold)">LOOP</text>\n</g>',
    # F: frosted glass plate holding the name, gold diamonds around LOOP (stylish, app-store look)
    "F": f'<g {FONT}>{GOLD}\n  <rect x="96" y="768" width="832" height="196" rx="48" fill="#ffffff" fill-opacity=".08" stroke="#ffffff" stroke-opacity=".28" stroke-width="2.5"/>\n  <text x="512" y="868" font-size="104" letter-spacing="8" fill="#ffffff">THE CAMPUS</text>\n  <path d="M318 924 l9 10 -9 10 -9 -10z M706 924 l9 10 -9 10 -9 -10z" fill="url(#gold)"/>\n  <text x="512" y="948" font-size="46" letter-spacing="30" fill="url(#gold)">LOOP</text>\n</g>',
})
TEXT_BLOCK = re.compile(r"<g font-family=.*?</g>(?=(?:</g>)*</svg>)", re.S)


def apply(svg: str, model: str) -> str:
    if not TEXT_BLOCK.search(svg):
        raise SystemExit("could not find the text block to replace")
    return TEXT_BLOCK.sub(lambda _m: MODELS[model], svg, count=1)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", choices=sorted(MODELS), default="D")
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
