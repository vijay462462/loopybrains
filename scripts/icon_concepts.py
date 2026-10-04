#!/usr/bin/env python3
"""Whole-icon concepts for The Campus Loop (not only the text). Each concept is built from small SVG parts.

    python3 scripts/icon_concepts.py --previews          # writes docs/brand/models/icon-G.svg, icon-H.svg, icon-I.svg
    python3 scripts/icon_concepts.py --apply I           # makes concept I the app icon (icon.svg, brand/icon-1024.svg, brand/maskable.svg)
    node scripts/render_icons.mjs                        # then refresh the PNG files

G  Monogram: the loop ring is a letter C wearing a graduation cap, gold accents, serif name.
H  Open book: an open book under a glowing loop, gold spine.
I  Medallion: Loopy inside a gold-rimmed round medallion on deep navy, serif name.
"""
from __future__ import annotations
import argparse, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERIF = "font-family=\"'Bitstream Charter','Georgia','Times New Roman',serif\" text-anchor=\"middle\""
DEFS = """<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1466"/><stop offset=".55" stop-color="#0f0a3d"/><stop offset="1" stop-color="#070522"/></linearGradient>
<radialGradient id="glowA" cx=".2" cy=".05" r=".9"><stop offset="0" stop-color="#a855f7" stop-opacity=".5"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
<radialGradient id="glowB" cx=".92" cy=".98" r=".75"><stop offset="0" stop-color="#f59e0b" stop-opacity=".38"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".35" stop-color="#6366f1"/><stop offset=".7" stop-color="#d946ef"/><stop offset="1" stop-color="#fb923c"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#f59e0b"/><stop offset="1" stop-color="#fcd34d"/></linearGradient>
<linearGradient id="page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c7d2fe"/></linearGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity=".5"/></filter>
</defs>"""
NAME = f'<g {SERIF} font-weight="700"><text x="512" y="842" font-size="112" letter-spacing="4" fill="#ffffff">THE CAMPUS</text>' \
       '<rect x="262" y="880" width="215" height="3" rx="1.5" fill="url(#gold)"/><rect x="547" y="880" width="215" height="3" rx="1.5" fill="url(#gold)"/><path d="M512 868 l13 14 -13 14 -13 -14z" fill="url(#gold)"/>' \
       '<text x="512" y="956" font-size="56" letter-spacing="46" font-weight="600" fill="url(#gold)">LOOP</text></g>'
SPARK = '<path d="M180 250 l11 27 27 11 -27 11 -11 27 -11 -27 -27 -11 27 -11z" fill="#fde68a"/><path d="M850 640 l8 20 20 8 -20 8 -8 20 -8 -20 -20 -8 20 -8z" fill="#67e8f9"/>'


def monogram() -> str:  # G
    return ('<g filter="url(#drop)">'
            '<circle cx="512" cy="410" r="238" fill="none" stroke="url(#ring)" stroke-width="84" stroke-linecap="round" stroke-dasharray="1100 396" transform="rotate(45 512 410)" filter="url(#soft)" opacity=".6"/>'
            '<circle cx="512" cy="410" r="238" fill="none" stroke="url(#ring)" stroke-width="72" stroke-linecap="round" stroke-dasharray="1100 396" transform="rotate(45 512 410)"/>'
            '<path d="M330 400 L512 322 L694 400 L512 478 Z" fill="#ffffff"/>'
            '<path d="M404 448 v70 q108 58 216 0 v-70" fill="none" stroke="#e0e7ff" stroke-width="22" stroke-linejoin="round"/>'
            '<path d="M694 400 v96" stroke="url(#gold)" stroke-width="10" stroke-linecap="round"/><circle cx="694" cy="508" r="17" fill="url(#gold)"/></g>' + SPARK)


def book() -> str:  # H
    return ('<g transform="translate(0 -78)"><g filter="url(#drop)">'
            '<circle cx="512" cy="330" r="160" fill="none" stroke="url(#ring)" stroke-width="70" stroke-linecap="round" stroke-dasharray="760 245" transform="rotate(-70 512 330)" filter="url(#soft)" opacity=".6"/>'
            '<circle cx="512" cy="330" r="160" fill="none" stroke="url(#ring)" stroke-width="58" stroke-linecap="round" stroke-dasharray="760 245" transform="rotate(-70 512 330)"/>'
            '<circle cx="512" cy="330" r="38" fill="url(#gold)"/>'
            '<path d="M512 560 C430 505 320 502 238 540 L238 760 C320 722 430 726 512 784 Z" fill="url(#page)"/>'
            '<path d="M512 560 C594 505 704 502 786 540 L786 760 C704 722 594 726 512 784 Z" fill="url(#page)" opacity=".92"/>'
            '<path d="M512 560 L512 784" stroke="url(#gold)" stroke-width="10" stroke-linecap="round"/>'
            '<path d="M290 590 C350 570 420 574 476 604 M290 640 C350 620 420 624 476 654 M290 690 C350 670 420 674 476 704" fill="none" stroke="#a5b4fc" stroke-width="7" stroke-linecap="round"/>'
            '<path d="M548 604 C604 574 674 570 734 590 M548 654 C604 624 674 620 734 640 M548 704 C604 674 674 670 734 690" fill="none" stroke="#a5b4fc" stroke-width="7" stroke-linecap="round"/></g></g>' + SPARK)


def medallion(base: str) -> str:  # I (reuses Loopy from the current icon)
    m = re.search(r'<svg x="270" y="262" width="484" height="532".*?</svg>', base, re.S)
    loopy = m.group(0) if m else ""
    loopy = loopy.replace('x="270" y="262" width="484" height="532"', 'x="312" y="176" width="400" height="440"', 1)
    return ('<g filter="url(#drop)"><circle cx="512" cy="392" r="296" fill="#0b0830"/><circle cx="512" cy="392" r="296" fill="url(#glowA)"/>'
            '<circle cx="512" cy="392" r="296" fill="none" stroke="url(#gold)" stroke-width="16"/><circle cx="512" cy="392" r="268" fill="none" stroke="url(#ring)" stroke-width="6" opacity=".9"/>'
            + loopy + '</g>' + SPARK)


def build(concept: str, base: str, maskable: bool = False) -> str:
    art = {"G": monogram, "H": book}.get(concept, lambda: medallion(base))()
    rx = 0 if maskable else 230
    body = f'<rect width="1024" height="1024" rx="{rx}" fill="url(#bg)"/><rect width="1024" height="1024" rx="{rx}" fill="url(#glowA)"/><rect width="1024" height="1024" rx="{rx}" fill="url(#glowB)"/>' + art + NAME
    if maskable:
        body = body.replace(f'<rect width="1024" height="1024" rx="0"', '<rect width="1024" height="1024" rx="0"')
        inner = f'<g transform="translate(102.4 102.4) scale(.8)">{art}{NAME}</g>'
        body = f'<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glowA)"/><rect width="1024" height="1024" fill="url(#glowB)"/>' + inner
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{DEFS}{body}</svg>'


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--previews", action="store_true"); ap.add_argument("--apply", choices=["G", "H", "I"])
    a = ap.parse_args()
    base = (ROOT / "docs/brand/models/icon-source-loopy.svg")
    if not base.exists():
        base.write_text((ROOT / "docs/brand/icon-1024.svg").read_text(encoding="utf-8"), encoding="utf-8")
    src = base.read_text(encoding="utf-8")
    out = ROOT / "docs/brand/models"; out.mkdir(exist_ok=True)
    if a.previews:
        for c in "GHI":
            (out / f"icon-{c}.svg").write_text(build(c, src), encoding="utf-8"); print("preview", c)
    if a.apply:
        (ROOT / "docs/icon.svg").write_text(build(a.apply, src), encoding="utf-8")
        (ROOT / "docs/brand/icon-1024.svg").write_text(build(a.apply, src), encoding="utf-8")
        (ROOT / "docs/brand/maskable.svg").write_text(build(a.apply, src, True), encoding="utf-8"); print("applied", a.apply)


if __name__ == "__main__":
    main()
