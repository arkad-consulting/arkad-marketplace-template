#!/usr/bin/env python3
"""Tests for lint_post.py. Run: python3 -I test_lint_post.py"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lint_post import lint, load_phrases  # noqa: E402


def checks(text, lang="en"):
    return [f["check"] for f in lint(text, lang)]


class LintPost(unittest.TestCase):
    def test_clean_post_has_no_finding(self):
        self.assertEqual(checks("We cut onboarding from 4 days to 1.\n\nHere is how."), [])

    def test_language_and_shared_phrases_are_loaded(self):
        en = load_phrases("en")
        self.assertIn("delve into", en)
        self.assertIn("game-changer", en)
        self.assertNotIn("plongeons dans", en)

    def test_slop_phrase_is_case_insensitive(self):
        self.assertIn("slop_phrase", checks("Let us Delve Into the numbers."))

    def test_other_language_phrase_is_ignored(self):
        self.assertNotIn("slop_phrase", checks("Plongeons dans les chiffres.", "en"))
        self.assertIn("slop_phrase", checks("Plongeons dans les chiffres.", "fr"))

    def test_long_hook(self):
        self.assertIn("long_hook", checks("x" * 151 + "\nbody"))

    def test_too_long(self):
        self.assertIn("too_long", checks("short hook\n" + "word " * 700))

    def test_hashtags(self):
        self.assertIn("hashtags", checks("hook\n#a #b #c #d"))
        self.assertNotIn("hashtags", checks("hook\n#a #b #c"))

    def test_em_dashes(self):
        self.assertIn("em_dashes", checks("one — two — three — four"))


if __name__ == "__main__":
    unittest.main(verbosity=1)
