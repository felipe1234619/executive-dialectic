#!/usr/bin/env python3
"""Offline structural and safety checks for the public static application."""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ("index.html", "app.html")
FORBIDDEN = [
    re.compile(r"(?i)service[_-]?role\s*[:=]\s*['\"][^'\"]+"),
    re.compile(r"(?i)postgres(?:ql)?://[^\s'\"]+"),
    re.compile(r"(?i)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
]
class Inspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
        self.lang = False
        self.main = 0
        self.titles = 0
        self.h1 = 0
        self.skip = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html" and a.get("lang"): self.lang = True
        if tag == "main": self.main += 1
        if tag == "title": self.titles += 1
        if tag == "h1": self.h1 += 1
        if "id" in a: self.ids.add(a["id"])
        if tag in ("a", "link"): self.links.append(a.get("href", ""))
        if tag == "a" and a.get("class") == "skip-link": self.skip = True

errors = []
for name in PAGES:
    page = ROOT / name
    if not page.is_file():
        errors.append(f"missing: {name}")
        continue
    text = page.read_text(encoding="utf-8")
    p = Inspector()
    p.feed(text)
    if not (p.lang and p.main == 1 and p.titles == 1 and p.h1 == 1 and p.skip):
        errors.append(f"{name}: missing document semantics or skip link")
    for href in p.links:
        if not href or href.startswith(("https://", "mailto:")): continue
        if href.startswith("#"):
            if href[1:] not in p.ids: errors.append(f"{name}: missing anchor {href}")
        else:
            path, _, fragment = href.partition("#")
            target = (ROOT / path).resolve()
            if not target.is_relative_to(ROOT) or not target.is_file():
                errors.append(f"{name}: missing local target {href}")
            elif fragment and target == page and fragment not in p.ids:
                errors.append(f"{name}: missing anchor {href}")
    for rule in FORBIDDEN:
        if rule.search(text): errors.append(f"{name}: possible secret pattern")
css = ROOT / "assets/styles.css"
if not css.is_file(): errors.append("missing stylesheet")
else:
    css_text = css.read_text(encoding="utf-8")
    for rule in FORBIDDEN:
        if rule.search(css_text): errors.append("stylesheet: possible secret pattern")
if not (ROOT / ".github/workflows/pages.yml").is_file(): errors.append("missing Pages workflow")
if errors:
    print("FAIL static verification:")
    print("\n".join(" - " + e for e in errors))
    sys.exit(1)
print("PASS: structural links, semantics, local assets and basic secret patterns")
