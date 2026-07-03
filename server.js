const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'muk-fin-secret-change-in-prod-2026';

// â”€â”€â”€ Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DATA_FILE   = path.join(__dirname, 'data', 'content.json');
const ADMIN_FILE  = path.join(__dirname, 'data', 'admin.json');
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');
const PUBLIC_DIR  = path.join(__dirname, 'public');
const ADMIN_DIR   = path.join(__dirname, 'admin');

// Seed data files into the (possibly empty) mounted volume on first boot
const SEED_DIR = path.join(__dirname, 'seed');
if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
if (!fs.existsSync(DATA_FILE)  && fs.existsSync(path.join(SEED_DIR, 'content.json'))) fs.copyFileSync(path.join(SEED_DIR, 'content.json'), DATA_FILE);
if (!fs.existsSync(ADMIN_FILE) && fs.existsSync(path.join(SEED_DIR, 'admin.json')))  fs.copyFileSync(path.join(SEED_DIR, 'admin.json'),  ADMIN_FILE);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const readContent = ()     => JSON.parse(fs.readFileSync(DATA_FILE,  'utf8'));
const saveContent = (d)    => fs.writeFileSync(DATA_FILE,  JSON.stringify(d, null, 2));
const readAdmin   = ()     => JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
const saveAdmin   = (d)    => fs.writeFileSync(ADMIN_FILE, JSON.stringify(d, null, 2));

// â”€â”€â”€ Multer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename:    (_, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Images only'));
  }
});

// â”€â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

// â”€â”€â”€ Auth middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function requireAuth(req, res, next) {
  const token = req.cookies.admin_token ||
                (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired session' }); }
}

// â”€â”€â”€ Site pages (multi-page, content JSON injected into each) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PAGES = {
  '/':             'index.html',
  '/services':     'services.html',
  '/industries':   'industries.html',
  '/case-studies': 'case-studies.html',
  '/pricing':      'pricing.html',
  '/about':        'about.html',
  '/contact':      'contact.html'
};

function servePage(file) {
  return (_, res) => {
    const html    = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
    const content = readContent();
    res.send(html.replace(
      '<!-- __CONTENT_INJECT__ -->',
      `<script>window.__SITE_CONTENT__ = ${JSON.stringify(content)};</script>`
    ));
  };
}

for (const [route, file] of Object.entries(PAGES)) {
  app.get(route, servePage(file));
  if (route !== '/') app.get(`${route}.html`, servePage(file)); // /contact.html also works
}

// Static assets (CSS, JS, fonts â€” HTML pages go through template injection above)
app.use(express.static(PUBLIC_DIR, { index: false, extensions: false }));

// â”€â”€â”€ Admin panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/admin', (_, res) => res.sendFile(path.join(ADMIN_DIR, 'index.html')));
app.get('/admin/{*path}', (_, res) => res.sendFile(path.join(ADMIN_DIR, 'index.html')));
app.use('/admin-static', express.static(ADMIN_DIR));

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUTH ROUTES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const admin = readAdmin();
  if (username !== admin.username || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('admin_token', token, { httpOnly: true, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ success: true });
});

app.post('/api/auth/logout', (_, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

app.get('/api/auth/check', requireAuth, (_, res) => res.json({ ok: true }));

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { current, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Min 8 characters required' });
  const admin = readAdmin();
  if (!bcrypt.compareSync(current, admin.password_hash))
    return res.status(400).json({ error: 'Current password is incorrect' });
  admin.password_hash = bcrypt.hashSync(newPassword, 10);
  saveAdmin(admin);
  res.json({ success: true });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTENT API
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ Content version (site polls this to detect changes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let contentVersion = Date.now();
function bumpVersion() { contentVersion = Date.now(); }

// Public â€“ site reads this on every page load
app.get('/api/content', (_, res) => res.json(readContent()));

// Public â€“ lightweight version check (site polls every 5s)
app.get('/api/content/version', (_, res) => res.json({ version: contentVersion }));

// PATCH /api/content/:section  â€“ update a scalar section (site, hero)
app.patch('/api/content/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  const content = readContent();
  if (!(section in content)) return res.status(404).json({ error: 'Section not found' });
  content[section] = Array.isArray(content[section])
    ? req.body
    : { ...content[section], ...req.body };
  saveContent(content);
  bumpVersion();
  res.json({ success: true, data: content[section] });
});

// PATCH /api/content/:section/:id  â€“ update one item in an array section
app.patch('/api/content/:section/:id', requireAuth, (req, res) => {
  const { section, id } = req.params;
  const content = readContent();
  if (!Array.isArray(content[section]))
    return res.status(400).json({ error: 'Not a list section' });
  const idx = content[section].findIndex(i => String(i.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  content[section][idx] = { ...content[section][idx], ...req.body };
  saveContent(content);
  bumpVersion();
  res.json({ success: true, data: content[section][idx] });
});

// POST /api/content/:section  â€“ add item
app.post('/api/content/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  const content = readContent();
  if (!Array.isArray(content[section]))
    return res.status(400).json({ error: 'Not a list section' });
  const maxId = content[section].reduce((m, i) => Math.max(m, i.id || 0), 0);
  const item  = { id: maxId + 1, ...req.body };
  content[section].push(item);
  saveContent(content);
  bumpVersion();
  res.json({ success: true, data: item });
});

// DELETE /api/content/:section/:id
app.delete('/api/content/:section/:id', requireAuth, (req, res) => {
  const { section, id } = req.params;
  const content = readContent();
  if (!Array.isArray(content[section]))
    return res.status(400).json({ error: 'Not a list section' });
  const before = content[section].length;
  content[section] = content[section].filter(i => String(i.id) !== id);
  if (content[section].length === before)
    return res.status(404).json({ error: 'Item not found' });
  saveContent(content);
  bumpVersion();
  res.json({ success: true });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// IMAGE UPLOAD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ success: true, url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.get('/api/uploads', requireAuth, (_, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/uploads/${f}`,
        size: fs.statSync(path.join(UPLOADS_DIR, f)).size
      }))
      .sort((a, b) => b.size - a.size);
    res.json(files);
  } catch { res.json([]); }
});

app.delete('/api/uploads/:filename', requireAuth, (req, res) => {
  const file = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(file);
  res.json({ success: true });
});

// â”€â”€â”€ Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.listen(PORT, () => {
  console.log(`\nâœ…  MUK Financial CMS`);
  console.log(`    Site:  http://localhost:${PORT}`);
  console.log(`    Admin: http://localhost:${PORT}/admin`);
  console.log(`    Login: admin / Admin@MUK2026\n`);
});

