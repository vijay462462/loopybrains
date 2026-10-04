#!/usr/bin/env python3
"""Pilot report: the numbers that tell you whether students really use the app.

Input  : a JSON export with the keys doubts, replies, profiles (each a list of documents), for example
         saved from the Firebase console export or from the admin page.  Only these fields are read:
         doubts   { id, subject, createdAt, authorId?, anonymous?, resolvedReplyId?, deleted? }
         replies  { id, parentId, parentColl, createdAt, authorId?, deleted? }
         profiles { id, updatedAt?, streak? }
Output : a Markdown report (stdout or -o file) with aggregates only. Names, titles and bodies are never
         read, and author ids are hashed with a per-run salt before counting, so the report cannot
         identify a student and can be shared with the college safely.

Run    : python3 scripts/pilot_report.py export.json -o pilot-week3.md
         python3 scripts/pilot_report.py --demo        (synthetic data, to see the format)
Metrics (all in India time, IST)
  * weekly active students      distinct authors of a doubt or reply in the last 7 days
  * next-day return rate        of students first seen on day D, how many acted again on D+1
  * 7-day return rate           same, for D+7 (only students old enough to be measured)
  * answered within 24 hours    share of doubts that got a reply from someone else in 24h
  * median / p90 first answer   time to the first reply, in hours
  * unanswered > 48h            doubts that need a human nudge, by subject
Targets from the pilot plan: next-day return >= 30%, answered within 24h >= 60%.
"""
from __future__ import annotations
import argparse, hashlib, json, os, random, statistics, sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))
HOUR, DAY = 3600_000, 86_400_000
TARGET_D1, TARGET_ANS24 = 0.30, 0.60


@dataclass(frozen=True)
class Event:
    who: str
    day: int      # days since epoch in IST
    at: int       # ms


def day_of(ms: int) -> int:
    return int((ms + 330 * 60_000) // DAY)


def ms(v) -> int | None:
    return int(v) if isinstance(v, (int, float)) and v > 0 else None


def build(data: dict, salt: bytes):
    def anon(x) -> str | None:
        return hashlib.blake2b(str(x).encode(), key=salt, digest_size=8).hexdigest() if x else None
    doubts = [d for d in data.get("doubts", []) if isinstance(d, dict) and not d.get("deleted") and ms(d.get("createdAt"))]
    replies = [r for r in data.get("replies", []) if isinstance(r, dict) and not r.get("deleted") and r.get("parentColl", "doubts") == "doubts" and ms(r.get("createdAt"))]
    events: list[Event] = []
    for x in doubts + replies:
        w = anon(x.get("authorId"))
        if w:
            events.append(Event(w, day_of(x["createdAt"]), x["createdAt"]))
    return doubts, replies, events, anon


def retention(events: list[Event], today: int, lag: int) -> tuple[int, int]:
    """(returned, measurable): students first seen at least `lag` days ago who acted on first+lag."""
    days: dict[str, set[int]] = defaultdict(set)
    for e in events:
        days[e.who].add(e.day)
    ok = tot = 0
    for ds in days.values():
        first = min(ds)
        if first + lag <= today:
            tot += 1
            ok += (first + lag) in ds
    return ok, tot


def first_answers(doubts, replies, anon):
    by_parent: dict[str, list[dict]] = defaultdict(list)
    for r in replies:
        by_parent[r.get("parentId")].append(r)
    hours: list[float] = []
    open_old: Counter = Counter()
    now = max([d["createdAt"] for d in doubts] + [r["createdAt"] for r in replies] + [0])
    for d in doubts:
        others = [r for r in by_parent.get(d.get("id"), []) if anon(r.get("authorId")) != anon(d.get("authorId")) or not d.get("authorId")]
        if others:
            hours.append((min(r["createdAt"] for r in others) - d["createdAt"]) / HOUR)
        elif now - d["createdAt"] > 48 * HOUR:
            open_old[str(d.get("subject", "Other"))[:40]] += 1
    return hours, open_old


def pct(a: int, b: int) -> str:
    return f"{100 * a / b:.0f}% ({a}/{b})" if b else "not enough data yet"


def verdict(ok: bool | None) -> str:
    return "n/a" if ok is None else ("on target" if ok else "below target")


def report(data: dict, salt: bytes) -> str:
    doubts, replies, events, anon = build(data, salt)
    if not events:
        return "# Pilot report\n\nNo activity found in the export.\n"
    last = max(e.at for e in events)
    today = day_of(last)
    week = {e.who for e in events if e.day > today - 7}
    d1, d1n = retention(events, today, 1)
    d7, d7n = retention(events, today, 7)
    hours, open_old = first_answers(doubts, replies, anon)
    ans24 = sum(1 for h in hours if h <= 24)
    asked = len(doubts)
    ans_rate = ans24 / asked if asked else None
    d1_rate = d1 / d1n if d1n else None
    ts = datetime.fromtimestamp(last / 1000, IST).strftime("%d %b %Y %H:%M IST")
    lines = [f"# Pilot report (data up to {ts})", "",
             f"- Doubts asked: **{asked}**, answers given: **{len(replies)}**, students seen: **{len({e.who for e in events})}**",
             f"- Weekly active students: **{len(week)}**",
             f"- Next-day return: **{pct(d1, d1n)}**, target 30%: {verdict(None if d1_rate is None else d1_rate >= TARGET_D1)}",
             f"- 7-day return: **{pct(d7, d7n)}**",
             f"- Doubts answered within 24 hours: **{pct(ans24, asked)}**, target 60%: {verdict(None if ans_rate is None else ans_rate >= TARGET_ANS24)}"]
    if hours:
        qs = statistics.quantiles(hours, n=10) if len(hours) >= 10 else [max(hours)] * 9
        lines.append(f"- First answer: median **{statistics.median(hours):.1f} h**, 90th percentile **{qs[8]:.1f} h**")
    if open_old:
        lines += ["", "## Doubts waiting more than 48 hours, by subject", ""] + [f"- {s}: {n}" for s, n in open_old.most_common(8)]
        lines.append("\nAsk senior helpers in these subjects to answer, or recruit one per subject.")
    lines += ["", "_Aggregates only. Author ids are hashed with a per-run salt; no names or post text were read._", ""]
    return "\n".join(lines)


def demo() -> dict:
    rnd, now = random.Random(7), int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    students = [f"s{i}" for i in range(60)]
    doubts, replies = [], []
    for i in range(140):
        t = now - rnd.randint(0, 9 * DAY)
        doubts.append({"id": f"d{i}", "subject": rnd.choice(["Maths", "Physics", "C Programming", "Chemistry"]), "createdAt": t, "authorId": rnd.choice(students)})
        if rnd.random() < 0.7:
            replies.append({"id": f"r{i}", "parentId": f"d{i}", "parentColl": "doubts", "createdAt": t + int(rnd.expovariate(1 / (14 * HOUR))), "authorId": rnd.choice(students)})
    return {"doubts": doubts, "replies": replies, "profiles": []}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("export", nargs="?", help="JSON export with doubts, replies, profiles")
    ap.add_argument("-o", "--out", help="write the Markdown report to this file")
    ap.add_argument("--demo", action="store_true", help="use synthetic data")
    a = ap.parse_args()
    if not a.export and not a.demo:
        ap.error("give an export file or --demo")
    data = demo() if a.demo else json.load(open(a.export, encoding="utf-8"))
    text = report(data, os.urandom(16))
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text); print("wrote", a.out)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
