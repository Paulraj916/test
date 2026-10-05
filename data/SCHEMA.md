# Song data schema

All songs live in `data/songs.json` as `{ "version": 1, "songs": [ ... ] }`.

| Field          | Type             | Required | Notes |
|----------------|------------------|----------|-------|
| `id`           | string           | yes      | Unique slug: `<main-artist>-<title>`, lowercase, `a-z0-9-` only. |
| `title`        | string           | yes      | Song title as officially released. |
| `artists`      | string[]         | yes      | Main artist first, then featured artists. |
| `album`        | string \| null   | no       | Album or movie/soundtrack name. |
| `year`         | number \| null   | no       | Original release year. |
| `language`     | string \| null   | no       | One language, English name (`Tamil`, `Spanish`, ...). |
| `genres`       | string[]         | no       | Title Case, reuse existing values before inventing new ones. |
| `moods`        | string[]         | no       | Small fixed vocabulary: Calm, Sad, Happy, Romantic, Dance, Epic, Energetic. |
| `composer`     | string \| null   | no       | Music director / composer, when known. |
| `lyricSnippet` | string \| null   | no       | **One short line only** (the hook people remember). Never full lyrics: copyright. |
| `youtubeId`    | string \| null   | no       | 11-char video ID of the official video / official audio upload. |
| `spotifyId`    | string \| null   | no       | 22-char track ID from `open.spotify.com/track/<id>`. |

Rules:
- Unknown = `null` (or `[]` for lists). Never guess an ID; a wrong ID plays the wrong song.
- Keep the file valid JSON; run `python3 scripts/validate.py` before committing.
