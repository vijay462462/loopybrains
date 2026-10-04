#!/usr/bin/env python3
"""Readiness check for push alerts. Prints what is done and what is still missing (exit code 1 if anything is missing).

It only reads files in this repository. It does not contact Firebase, so it cannot tell whether the functions
are actually deployed: the last two items are things only you can confirm in the Firebase console.
"""
from __future__ import annotations
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(rel: str) -> str:
    p = ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def checks() -> list[tuple[bool, str, str]]:
    cfg, sw, rules, fn, app, html = (read(x) for x in ("docs/config.js", "docs/sw.js", "firestore.rules", "functions/index.js", "docs/app.js", "docs/index.html"))
    key = re.search(r'push:\s*\{\s*vapidKey:\s*"([^"]*)"', cfg)
    vapid = key.group(1) if key else ""
    return [
        (bool(re.fullmatch(r"[A-Za-z0-9_-]{60,200}", vapid)), "Web Push key in docs/config.js", "Paste the public key from Firebase console > Cloud Messaging (see PUSH.md step 2 and 3)"),
        ("addEventListener('push'" in sw and "notificationclick" in sw, "Service worker handles push and clicks", "docs/sw.js is missing the push handlers"),
        ("match /pushTokens/{uid}" in rules and "allow get, list: if false" in rules, "pushTokens rule blocks reading tokens", "firestore.rules is missing the pushTokens rule"),
        ("exports.notifyOnReply" in fn and "sendEachForMulticast" in fn, "notifyOnReply function written", "functions/index.js is missing notifyOnReply"),
        ("enablePush" in app and "firebase-messaging.js" in app, "App can register a token", "docs/app.js is missing enablePush"),
        ("https://*.googleapis.com" in html, "Content Security Policy allows Google APIs", "Add https://*.googleapis.com to connect-src in docs/index.html"),
    ]


def main() -> int:
    bad = 0
    for ok, label, fix in checks():
        print(("  ok    " if ok else "  MISSING ") + label + ("" if ok else "  -> " + fix)); bad += not ok
    print("\nStill to confirm in the Firebase console (this script cannot see it): Blaze plan is on; `firebase deploy --only functions:notifyOnReply` finished.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
