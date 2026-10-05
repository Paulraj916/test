#!/usr/bin/env python3
"""Convert data/rahman_all_tracks.txt into data/rahman.json for the site.

Input lines look like: "12. Title — Film (Hindi version of the Tamil score) — Hindi — 1992".
Output is a compact list of [title, film, language, year, dubbedFrom|null].

Usage: python3 scripts/build_data.py
"""
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
DUB = re.compile(r"(.*) \((\w+) version of the (\w+) score\)$")


def main():
    songs = []
    for n, line in enumerate((DATA / "rahman_all_tracks.txt").read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        parts = line.split(". ", 1)[1].split(" — ")
        if len(parts) < 4:
            raise SystemExit(f"line {n}: expected 'Title — Film — Language — Year': {line}")
        # Titles may themselves contain " — ", so read the last three fields from the right.
        title, (film, lang, year) = " — ".join(parts[:-3]), parts[-3:]
        m = DUB.match(film)
        songs.append([title, m.group(1), lang, int(year), m.group(3)] if m else [title, film, lang, int(year), None])
    (DATA / "rahman.json").write_text(json.dumps(songs, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {len(songs)} songs")


if __name__ == "__main__":
    main()
