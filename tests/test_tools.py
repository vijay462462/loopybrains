"""Unit tests for the Python tools. Run: python3 -m unittest discover -s tests -p "test_*.py" """
import importlib.util, pathlib, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    import sys; m = importlib.util.module_from_spec(spec); sys.modules[name] = m; spec.loader.exec_module(m); return m


syl, rep = load("extract_syllabus"), load("pilot_report")
H = 3600_000


class Syllabus(unittest.TestCase):
    TEXT = "Course Code: 23MA2101\nCourse Title: Probability\nUnit - I (8 Contact Hours) Probability\nBayes <b>theorem</b>\nUnit - II Random Variable\nPMF and PDF\nText Books\nBook\nCourse Code: 23CS2101\nUnit 1 Arrays\nlists\n"

    def test_units_found_and_markup_removed(self):
        out = syl.parse(self.TEXT)
        self.assertEqual(set(out), {"23MA2101", "23CS2101"})
        self.assertEqual([u["u"] for u in out["23MA2101"]["n"]], [1, 2])
        self.assertNotIn("<", out["23MA2101"]["n"][0]["x"])
        self.assertEqual(out["23MA2101"]["n"][1]["x"], "PMF and PDF")      # text books are cut off

    def test_duplicate_and_bad_units_ignored(self):
        out = syl.parse("Course Code: 23MA2101\nUnit - I A\nx\nUnit - I B\ny\nUnit - VII Z\nz\n")
        self.assertEqual(len(out["23MA2101"]["n"]), 1)


class Pilot(unittest.TestCase):
    def data(self):
        t0 = 1_700_000_000_000
        return {"doubts": [{"id": "d1", "subject": "Maths", "createdAt": t0, "authorId": "a"},
                           {"id": "d2", "subject": "Physics", "createdAt": t0, "authorId": "b"}],
                "replies": [{"id": "r1", "parentId": "d1", "parentColl": "doubts", "createdAt": t0 + 2 * H, "authorId": "b"},
                            {"id": "r2", "parentId": "d2", "parentColl": "doubts", "createdAt": t0 + 30 * H, "authorId": "b"},
                            {"id": "r3", "parentId": "d1", "parentColl": "doubts", "createdAt": t0 + 26 * H, "authorId": "a"}]}

    def test_first_answer_ignores_self_replies(self):
        doubts, replies, _, anon = rep.build(self.data(), b"salt")
        hours, _ = rep.first_answers(doubts, replies, anon)
        self.assertEqual(sorted(round(h) for h in hours), [2])         # d2 only answered by its own author, so not counted

    def test_report_has_no_raw_ids(self):
        text = rep.report(self.data(), b"salt")
        self.assertIn("Doubts asked: **2**", text)
        self.assertNotIn('"a"', text)

    def test_retention_lag(self):
        ev = [rep.Event("x", 10, 0), rep.Event("x", 11, 0), rep.Event("y", 10, 0), rep.Event("z", 20, 0)]
        self.assertEqual(rep.retention(ev, 20, 1), (1, 2))              # z is too new to measure


if __name__ == "__main__":
    unittest.main()
