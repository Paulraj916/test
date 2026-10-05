// Music Roadmap: search + filter the song catalog, build a queue, send it to a player.
const FILTERS = [
  { key: "language", label: "Language", get: s => (s.language ? [s.language] : []) },
  { key: "genres", label: "Genre", get: s => s.genres || [] },
  { key: "moods", label: "Mood", get: s => s.moods || [] },
  { key: "decade", label: "Decade", get: s => (s.year ? [`${Math.floor(s.year / 10) * 10}s`] : []) },
  { key: "artists", label: "Artist", get: s => s.artists || [] },
];
// YouTube's watch_videos link builds a temporary playlist; it accepts about 50 IDs.
const YOUTUBE_MAX = 50;

let songs = [];
const active = Object.fromEntries(FILTERS.map(f => [f.key, new Set()]));
let queue = loadQueue();

const $ = id => document.getElementById(id);

function loadQueue() {
  try { return JSON.parse(localStorage.getItem("queue")) || []; } catch { return []; }
}
function saveQueue() {
  try { localStorage.setItem("queue", JSON.stringify(queue)); } catch {}
}

const norm = text => (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function haystack(s) {
  return norm([s.title, ...(s.artists || []), s.album, s.composer, s.lyricSnippet].join(" "));
}

function matches(s, words) {
  if (!words.every(w => s._text.includes(w))) return false;
  return FILTERS.every(f => active[f.key].size === 0 || f.get(s).some(v => active[f.key].has(v)));
}

function renderFilters() {
  const box = $("filters");
  box.innerHTML = "";
  for (const f of FILTERS) {
    const counts = new Map();
    for (const s of songs) for (const v of f.get(s)) counts.set(v, (counts.get(v) || 0) + 1);
    if (counts.size === 0) continue;
    const fs = document.createElement("fieldset");
    fs.innerHTML = `<legend>${f.label}</legend>`;
    for (const [v, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = active[f.key].has(v);
      cb.onchange = () => { cb.checked ? active[f.key].add(v) : active[f.key].delete(v); renderSongs(); };
      label.append(cb, ` ${v} (${n})`);
      fs.append(label);
    }
    box.append(fs);
  }
}

function renderSongs() {
  const words = norm($("search").value).split(/\s+/).filter(Boolean);
  const shown = songs.filter(s => matches(s, words));
  $("count").textContent = `${shown.length} of ${songs.length} songs`;
  const list = $("songs");
  list.innerHTML = "";
  for (const s of shown) {
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = s.title;
    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = [s.artists.join(", "), s.album, s.year].filter(Boolean).join(" · ");
    const tags = document.createElement("div");
    tags.className = "tags";
    tags.textContent = [s.language, ...(s.genres || []), ...(s.moods || [])].filter(Boolean).join(" · ");
    meta.append(title, sub, tags);
    if (s.lyricSnippet) {
      const snip = document.createElement("div");
      snip.className = "snippet";
      snip.textContent = `“${s.lyricSnippet}”`;
      meta.append(snip);
    }
    const inQueue = queue.includes(s.id);
    const btn = document.createElement("button");
    btn.textContent = inQueue ? "Added" : "Add";
    btn.className = inQueue ? "added" : "";
    btn.onclick = () => toggle(s.id);
    li.append(meta, btn);
    list.append(li);
  }
}

function toggle(id) {
  queue = queue.includes(id) ? queue.filter(q => q !== id) : [...queue, id];
  saveQueue();
  renderSongs();
  renderQueue();
}

function queuedSongs() {
  const byId = new Map(songs.map(s => [s.id, s]));
  return queue.map(id => byId.get(id)).filter(Boolean);
}

function renderQueue() {
  const items = queuedSongs();
  $("queue-count").textContent = items.length;
  const ol = $("queue-list");
  ol.innerHTML = "";
  for (const s of items) {
    const li = document.createElement("li");
    li.textContent = `${s.title} — ${s.artists[0]}`;
    const rm = document.createElement("button");
    rm.className = "ghost";
    rm.textContent = "×";
    rm.title = "Remove";
    rm.onclick = () => toggle(s.id);
    li.append(rm);
    ol.append(li);
  }
  for (const id of ["play-youtube", "play-spotify", "copy-list", "clear-queue"]) $(id).disabled = items.length === 0;
  $("queue-note").textContent = "";
}

const searchText = s => `${s.title} ${s.artists[0]}`;

function playYouTube() {
  const items = queuedSongs();
  const ids = items.map(s => s.youtubeId).filter(Boolean).slice(0, YOUTUBE_MAX);
  const missing = items.filter(s => !s.youtubeId);
  if (ids.length) {
    window.open(`https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`, "_blank", "noopener");
  } else {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchText(items[0]))}`, "_blank", "noopener");
  }
  const notes = [];
  if (missing.length) notes.push(`${missing.length} song(s) have no YouTube link yet and were skipped.`);
  if (items.length - missing.length > YOUTUBE_MAX) notes.push(`Only the first ${YOUTUBE_MAX} were sent.`);
  $("queue-note").textContent = notes.join(" ");
}

function playSpotify() {
  // Opening a multi-track queue needs the Spotify Web API (login); until then, open the first track.
  const items = queuedSongs();
  const first = items[0];
  const url = first.spotifyId
    ? `https://open.spotify.com/track/${first.spotifyId}`
    : `https://open.spotify.com/search/${encodeURIComponent(searchText(first))}`;
  window.open(url, "_blank", "noopener");
  $("queue-note").textContent = items.length > 1
    ? "Spotify opened the first song. Use “Copy list” to import the full queue into a Spotify playlist."
    : "";
}

async function copyList() {
  const text = queuedSongs().map(s => `${s.title} - ${s.artists.join(", ")}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    $("queue-note").textContent = "Copied to clipboard.";
  } catch {
    $("queue-note").textContent = "Copy failed; your browser blocked clipboard access.";
  }
}

async function init() {
  const res = await fetch("../data/songs.json");
  songs = (await res.json()).songs.map(s => ({ ...s, _text: haystack(s) }));
  $("search").addEventListener("input", renderSongs);
  $("play-youtube").onclick = playYouTube;
  $("play-spotify").onclick = playSpotify;
  $("copy-list").onclick = copyList;
  $("clear-queue").onclick = () => { queue = []; saveQueue(); renderSongs(); renderQueue(); };
  renderFilters();
  renderSongs();
  renderQueue();
}

init().catch(err => {
  $("count").textContent = `Could not load songs: ${err.message}`;
});
