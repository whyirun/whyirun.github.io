const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const app = express();
const PORT = 3456;
const DATA_FILE = path.join(__dirname, 'data.json');
const ESSAYS_FILE = path.join(__dirname, 'essays.json');
const EDITOR_FILE = path.join(__dirname, 'why_I_run_editor.html');

app.use(express.json({ limit: '5mb' }));

// ========== GIT HELPERS ==========
function gitExec(cmd) {
  try {
    return execSync(cmd, { cwd: __dirname, encoding: 'utf-8', timeout: 15000 });
  } catch (e) {
    console.error(`[git] ${cmd} → ${e.message.split('\n')[0]}`);
    return null;
  }
}

function commitFile(filename, message) {
  gitExec(`git add ${filename}`);
  const status = gitExec('git diff --cached --stat');
  if (!status || status.trim() === '') return;
  const safe = message.replace(/"/g, '\\"');
  const result = gitExec(`git commit -m "${safe}"`);
  if (result) {
    console.log(`[git] Committed: ${message}`);
    gitPushAsync();
  }
}

function commitData(message) {
  commitFile('data.json', message);
}

function hasRemote() {
  const r = gitExec('git remote -v');
  return r && r.includes('pages');
}

let pushPending = false;
function gitPushAsync() {
  if (!hasRemote()) return;
  if (pushPending) return;
  pushPending = true;
  exec('git push pages main', { cwd: __dirname, timeout: 30000 }, (err) => {
    pushPending = false;
    if (err) {
      console.log(`[git] Push failed (will retry on next save)`);
    } else {
      console.log(`[git] Pushed to GitHub`);
    }
  });
}

// ========== API ==========
app.get('/', (req, res) => res.sendFile(EDITOR_FILE));
app.get('/viz', (req, res) => res.sendFile(path.join(__dirname, 'why_I_run_viz.html')));

app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      res.json({ ok: true, data: JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) });
    } else {
      res.json({ ok: true, data: null });
    }
  } catch (e) {
    res.json({ ok: true, data: null });
  }
});

app.post('/api/save', (req, res) => {
  try {
    const { reasons, message } = req.body;
    if (!reasons || !Array.isArray(reasons)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(reasons, null, 2), 'utf-8');
    commitData(message || `Update: ${new Date().toLocaleString()}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/version', (req, res) => {
  try {
    const { reasons, label } = req.body;
    if (!reasons || !Array.isArray(reasons)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(reasons, null, 2), 'utf-8');
    commitData(label ? `Version: ${label}` : `Version: ${new Date().toLocaleString()}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/pace', (req, res) => {
  const FIT_FILE = path.join(__dirname, 'run.fit');
  if (!fs.existsSync(FIT_FILE)) return res.json({ ok: false, error: 'No run.fit' });
  try {
    const FitParser = require('fit-file-parser').default || require('fit-file-parser');
    const fitParser = new FitParser({ speedUnit: 'km/h' });
    const buffer = fs.readFileSync(FIT_FILE);
    fitParser.parse(buffer, (err, data) => {
      if (err) return res.json({ ok: false, error: err.message });
      const records = data.records || [];
      const speeds = records
        .filter(r => r.enhanced_speed != null)
        .map(r => r.enhanced_speed);
      res.json({ ok: true, speeds: speeds, count: speeds.length });
    });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get('/api/essays', (req, res) => {
  try {
    if (fs.existsSync(ESSAYS_FILE)) {
      res.json({ ok: true, data: JSON.parse(fs.readFileSync(ESSAYS_FILE, 'utf-8')) });
    } else {
      res.json({ ok: true, data: [] });
    }
  } catch (e) {
    res.json({ ok: true, data: [] });
  }
});

app.post('/api/essays/save', (req, res) => {
  try {
    const { essays, message } = req.body;
    if (!essays || !Array.isArray(essays)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    fs.writeFileSync(ESSAYS_FILE, JSON.stringify(essays, null, 2), 'utf-8');
    commitFile('essays.json', message || `Essay update: ${new Date().toLocaleString()}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  const log = gitExec('git log --oneline -20') || '';
  const commits = log.trim().split('\n').filter(Boolean).map(line => {
    const i = line.indexOf(' ');
    return { hash: line.substring(0, i), message: line.substring(i + 1) };
  });
  res.json({ ok: true, hasRemote: hasRemote(), commits: commits });
});

app.use(express.static(__dirname));

// ========== START ==========
app.listen(PORT, () => {
  console.log(`  ✦ Editor running at http://localhost:${PORT}`);
});
