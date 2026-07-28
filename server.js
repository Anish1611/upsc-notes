const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || 'changeme';
const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 100);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'files.json');

// Make sure the folders/files we need exist before the server starts handling requests
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = nanoid(10);
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple password gate for anything only the admin should do (upload, delete)
function checkPassword(req, res, next) {
  const pw = req.headers['x-upload-password'] || req.body.password || req.query.password;
  if (pw !== UPLOAD_PASSWORD) return res.status(401).json({ error: 'Wrong admin access code.' });
  next();
}

// --- Admin-only actions (password required) ---

app.post('/api/upload', upload.single('file'), (req, res, next) => {
  const pw = req.headers['x-upload-password'] || req.body.password || req.query.password;
  if (pw !== UPLOAD_PASSWORD) {
    if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
    return res.status(401).json({ error: 'Wrong admin access code.' });
  }
  next();
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file was sent.' });
  const db = readDb();
  const id = path.parse(req.file.filename).name;
  const entry = {
    id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    category: (req.body.category || 'General').trim() || 'General',
    note: (req.body.note || '').trim(),
    uploadedAt: new Date().toISOString()
  };
  db.unshift(entry);
  writeDb(db);
  res.json({ success: true, id, link: `/d/${id}` });
});

app.delete('/api/files/:id', checkPassword, (req, res) => {
  const db = readDb();
  const idx = db.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  const [entry] = db.splice(idx, 1);
  writeDb(db);
  const filePath = path.join(UPLOAD_DIR, entry.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

// --- Public actions (no password — anyone can browse & download what admin uploaded) ---

// Public library listing: every visitor can see every file the admin has uploaded,
// and files stay listed until the admin explicitly deletes them.
app.get('/api/files', (req, res) => {
  const db = readDb();
  res.json(db);
});

app.get('/api/meta/:id', (req, res) => {
  const entry = readDb().find((f) => f.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'This link is invalid or the file was removed by the admin.' });
  res.json({
    originalName: entry.originalName,
    size: entry.size,
    category: entry.category || 'General',
    note: entry.note || '',
    uploadedAt: entry.uploadedAt
  });
});

app.get('/api/download/:id', (req, res) => {
  const entry = readDb().find((f) => f.id === req.params.id);
  if (!entry) return res.status(404).send('This link is invalid or the file was removed by the admin.');
  const filePath = path.join(UPLOAD_DIR, entry.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).send('File missing on server.');
  res.download(filePath, entry.originalName);
});

app.get('/d/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.listen(PORT, () => console.log(`Current Affairs & UPSC Notes (FileLink) running on port ${PORT}`));
