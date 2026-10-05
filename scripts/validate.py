#!/usr/bin/env python3
"""Check data/songs.json against data/SCHEMA.md. Exits non-zero on any error."""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "songs.json"
MOODS = {"Calm", "Sad", "Happy", "Romantic", "Dance", "Epic", "Energetic"}


def check(song):
    errs = []
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", song.get("id") or ""):
        errs.append("bad id")
    if not song.get("title"):
        errs.append("missing title")
    if not song.get("artists"):
        errs.append("missing artists")
    if song.get("youtubeId") and not re.fullmatch(r"[A-Za-z0-9_-]{11}", song["youtubeId"]):
        errs.append("bad youtubeId")
    if song.get("spotifyId") and not re.fullmatch(r"[A-Za-z0-9]{22}", song["spotifyId"]):
        errs.append("bad spotifyId")
    if song.get("year") is not None and not (1000 < song["year"] < 2100):
        errs.append("bad year")
    if set(song.get("moods") or []) - MOODS:
        errs.append(f"unknown moods {set(song['moods']) - MOODS}")
    snippet = song.get("lyricSnippet") or ""
    if len(snippet) > 120 or "\n" in snippet:
        errs.append("lyricSnippet must be one short line")
    return errs


def main():
    songs = json.loads(DATA.read_text(encoding="utf-8"))["songs"]
    seen, failed = set(), False
    for s in songs:
        errs = check(s)
        if s.get("id") in seen:
            errs.append("duplicate id")
        seen.add(s.get("id"))
        for e in errs:
            failed = True
            print(f"{s.get('id', '?')}: {e}")
    print(f"{len(songs)} songs checked, {'FAILED' if failed else 'ok'}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
