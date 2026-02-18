# Why I Run — Editor

Personal essay editor for "Why I Run" — a structured reflection on 25 motivations for ultra-endurance running. Grid-based UI with git-backed version control.

## Architecture

```
Browser (why_I_run_editor.html)
  ↓ fetch API
Express server (server.js, port 3456)
  ↓ fs.writeFileSync
data.json (persisted reasons array)
  ↓ git add + commit
.git/ (local commits)
  ↓ run.sh pushes on launch
GitHub remote (optional)
```

**Dual storage**: server writes `data.json` + git commits; browser keeps `localStorage` as fallback. Works offline (localStorage only) or with server (file + git).

## Project Files

| File | Purpose |
|------|---------|
| `why_I_run_editor.html` | Single-file client app: grid UI, editing, version snapshots, search, export. ~1000 lines. |
| `server.js` | Express backend: serves editor, REST API for load/save, git commit on every save. |
| `data.json` | Persistent storage — array of reason objects. Created on first save. Git-tracked. |
| `run.sh` | Launcher: commits pending changes → pushes to GitHub if online → starts server → opens browser. |
| `setup.sh` | One-time setup: installs deps, inits git, prints GitHub setup instructions. |
| `why_I_run_annotated.md` | Readable markdown export of all 25 reasons with raw transcript. |
| `why_I_run.docx` | Original Word document (archived). |

## Data Model

Each reason is an object in `data.json`:

```json
{
  "id": 1,
  "category": "core",
  "title": "Curiosity About Physical and Mental Limits",
  "bullets": ["Desire to explore how far...", "Testing limits of pain..."],
  "rawText": "So definitely one thing that is recurrent..."
}
```

**25 reasons** across **7 categories**: `core` (blue), `embodied` (green), `identity` (amber), `meaning` (purple), `personal` (red), `emerging` (cyan), `simulation` (orange).

## API Endpoints (server.js)

| Method | Path | Body | What it does |
|--------|------|------|--------------|
| GET | `/` | — | Serves the editor HTML |
| GET | `/api/data` | — | Returns `{ ok, data }` from data.json |
| POST | `/api/save` | `{ reasons, message }` | Writes data.json, `git add` + `git commit` |
| POST | `/api/version` | `{ reasons, label }` | Same as save but commit msg = `"Version: {label}"` |
| GET | `/api/status` | — | Returns `{ ok, hasRemote, commits[] }` |

## Editor Client (why_I_run_editor.html)

**Layout**: 3-column grid (Title | Key Points | Raw Transcript), 2 rows visible, scrollable. Category headers as colored dividers.

**Key JS globals**:
- `reasons` — the working data array
- `versions` — local version snapshots (localStorage only, key: `whyirun_versions`)
- `useServer` — boolean, auto-detected on init via `fetch('/api/status')`
- `dirty` — tracks unsaved changes

**Flow on edit**: click cell → edit inline → blur triggers `finishEdit()` → `autoSave()` → writes localStorage + POSTs to `/api/save` → server writes file + git commits.

**Flow on version save** (Cmd+S): opens modal → user types label → `saveVersion()` → adds to `versions[]` in localStorage + POSTs to `/api/version`.

**Server detection**: `detectServer()` tries `fetch('/api/status')`. If it fails (file:// protocol or server not running), falls back to localStorage-only mode. Toast shows which mode is active.

## Git Strategy

- **Every cell edit** → auto-commit with message `"Update: {timestamp}"`
- **Named versions** → commit with message `"Version: {label}"`
- **On launch** (`run.sh`): commits any uncommitted data.json changes, then pushes if internet is available
- **No background push** — push only happens at launch via `run.sh`

## Running the App

```bash
# First time
bash setup.sh
git remote add origin https://github.com/ppinheirochagas/why-i-run.git
git push -u origin main

# Every time (or use the `run` alias)
bash run.sh
# → commits pending changes
# → pushes to GitHub if online
# → starts server at http://localhost:3456
# → opens browser
# → Ctrl+C to stop
```

**Alias** (add to `~/.zshrc`):
```bash
alias run='bash /path/to/folder/run.sh'
```

## Implementation Status

**Done**:
- Grid editor with click-to-edit, search, category colors
- localStorage + server dual persistence
- Version snapshots with restore and diff preview
- Express server with git auto-commit
- run.sh launcher with internet check + push
- Export to markdown
- Toast notifications for all actions
- beforeunload warning for unsaved changes

**Not yet configured** (user must do on their machine):
- GitHub repo creation and `git remote add origin`
- Initial `git push -u origin main`
- Shell alias for `run`

## Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| Server port | `3456` | server.js line 7 |
| Data file | `./data.json` | server.js line 8 |
| Git timeout | 15s | server.js line 16 |
| localStorage keys | `whyirun_data`, `whyirun_versions` | editor HTML |
| Status poll interval | 15s | editor HTML init() |
| Category colors | hex values in `CAT_COLORS` object | editor HTML |

## Dependencies

- **express** `^4.18.0` (only npm dependency)
- **node**, **git**, **bash** (system)
