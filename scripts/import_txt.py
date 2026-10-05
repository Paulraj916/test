#!/usr/bin/env python3
"""Import a plain-text song list into data/songs.json.

Each non-empty line is "Title - Artist" (artists may be joined with "," or "&").
Lines starting with "#" are ignored. Songs already present (same id) are skipped.

Usage: python3 scripts/import_txt.py path/to/songs.txt
"""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "songs.json"


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_line(line):
    title, sep, artist_part = line.partition(" - ")
    if not sep:
        return None
    artists = [a.strip() for a in re.split(r",|&|\bfeat\.?|\bft\.?", artist_part) if a.strip()]
    title = title.strip()
    if not title or not artists:
        return None
    return {
        "id": f"{slug(artists[0])}-{slug(title)}",
        "title": title,
        "artists": artists,
        "album": None,
        "year": None,
        "language": None,
        "genres": [],
        "moods": [],
        "composer": None,
        "lyricSnippet": None,
        "youtubeId": None,
        "spotifyId": None,
    }


def main(path):
    db = json.loads(DATA.read_text(encoding="utf-8"))
    known = {s["id"] for s in db["songs"]}
    added, bad = 0, []
    for n, raw in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        song = parse_line(line)
        if song is None:
            bad.append(f"line {n}: {line}")
            continue
        if song["id"] in known:
            continue
        db["songs"].append(song)
        known.add(song["id"])
        added += 1
    DATA.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"added {added} songs, total {len(db['songs'])}")
    for b in bad:
        print("could not parse", b, file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
