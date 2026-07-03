# MUK Financial Operations — Full-Stack CMS

A complete Node.js + Express content management system for the MUK Financial website.
Edit every section of your site from the admin panel — no code required.

---

## Quick Start (Local)

```bash
# 1. Install dependencies (only needed once)
npm install

# 2. Start the server
npm start

# 3. Open in browser
# Site:  http://localhost:3000  (multi-page: /services /pricing /contact ...)
# Admin: http://localhost:3000/admin
```

**Default login:**
- Username: `admin`
- Password: `Admin@MUK2026`
- ⚠️ Change your password immediately after first login (Admin panel → Change Password)

---

## What You Can Edit in the Admin Panel

| Section | What you can change |
|---|---|
| **Site Settings** | Company name, email, phone, LinkedIn URL, Formspree ID |
| **Hero Section** | Headline, subheadline, CTA buttons, stat bar (4 items) |
| **Six Pillars** | Title, description, tags for each service card |
| **Industries** | Add/edit/delete industry cards (icon + name) |
| **Case Studies** | Full edit: tag, title, body, 2 stats, image upload |
| **Pricing** | Plan name, price, period, features list, CTA button |
| **Process Steps** | Step label, title, description |
| **Tech Stack** | Add/edit/delete tools (name + brand color) |
| **Image Library** | Upload images (JPG/PNG/WebP/SVG, max 5MB), copy URLs, delete |
| **Change Password** | Update admin login password |

---

## Setting Up the Contact Form (Formspree)

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form — Formspree gives you a Form ID (looks like `xrgvkpqz`)
3. In Admin → **Site Settings**, paste that ID into the "Formspree Form ID" field
4. Click Save — the contact form on your site is now live and sends to your email

---

## Adding Images to Case Studies

1. Admin → **Image Library** → upload your image
2. Hover over the uploaded image → click **Copy URL**
3. Admin → **Case Studies** → edit the case → paste URL into "Image URL" field
4. Save — the image now appears on the case study card

---

## Deployment

### Option A — Railway (Recommended, free tier available)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

Set this environment variable in Railway dashboard:
```
JWT_SECRET=your-random-secret-string-here
```

### Option B — Render.com

1. Push project to a GitHub repo
2. Create new Web Service on render.com → connect your repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable: `JWT_SECRET=your-secret`

### Option C — VPS / DigitalOcean

```bash
# On your server:
git clone <your-repo>
cd muk-financial-cms
npm install
JWT_SECRET=your-secret node server.js

# Keep running with PM2:
npm install -g pm2
pm2 start server.js --name muk-cms
pm2 save
pm2 startup
```

---

## Project Structure

```
muk-financial-cms/
├── server.js          ← Express server + all API routes
├── package.json
├── data/
│   ├── content.json   ← ALL site content (edit via admin or directly)
│   └── admin.json     ← Hashed admin credentials
├── public/
│   ├── index.html         ← Home
│   ├── services.html      ← /services
│   ├── industries.html    ← /industries
│   ├── case-studies.html  ← /case-studies
│   ├── pricing.html       ← /pricing
│   ├── about.html         ← /about
│   ├── contact.html       ← /contact
│   └── assets/
│       ├── style.css      ← Shared stylesheet
│       └── site.js        ← Shared renderer (nav, footer, page content)
├── admin/
│   └── index.html     ← Admin panel UI
└── uploads/           ← Uploaded images (auto-created)
```

---

## Security Notes

- Change the default password immediately after first login
- Set a strong `JWT_SECRET` environment variable in production (not the default)
- Admin routes (`/admin`, `/api/content` mutations) require authentication
- Uploaded files are stored locally — back up the `uploads/` folder regularly
- The `data/content.json` file is your database — include it in your backups

---

## API Reference (for developers)

```
GET    /api/content                  Public — returns full content JSON
PATCH  /api/content/:section         Update a section (auth required)
PATCH  /api/content/:section/:id     Update one item (auth required)
POST   /api/content/:section         Add item (auth required)
DELETE /api/content/:section/:id     Delete item (auth required)
POST   /api/upload                   Upload image (auth required)
GET    /api/uploads                  List uploads (auth required)
DELETE /api/uploads/:filename        Delete upload (auth required)
POST   /api/auth/login               Login → sets HttpOnly cookie
POST   /api/auth/logout              Clear session cookie
GET    /api/auth/check               Check if session is valid
POST   /api/auth/change-password     Update password (auth required)
```
