# Rahman Roadmap

Search and filter every A.R. Rahman track (2,110 songs, 1992–2026), build a queue,
and open it on YouTube Music or Spotify.

- Site: `index.html` (static, no build step). Live via GitHub Pages from `main` / root.
- Data: `data/rahman_all_tracks.txt` is the source list; run `python3 scripts/build_data.py`
  after editing it to regenerate `data/rahman.json`, which the site loads.
- Run locally: `python3 -m http.server 8000` in the repo root, then open http://localhost:8000/
