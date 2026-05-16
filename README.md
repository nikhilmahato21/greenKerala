# Namaste Nomads — Travel Website + Admin Panel

A complete Next.js travel website with admin panel for managing tour packages.

## Routes
| URL | Description |
|-----|-------------|
| `/` | Customer homepage — hero slider, destinations, packages |
| `/packages/[id]` | Package detail page with day-wise itinerary |
| `/admin` | Admin login |
| `/admin/dashboard` | Admin dashboard — add / edit / delete packages |

## Admin Credentials (change before going live)
- **Email:** admin@namastenomads.in
- **Password:** namaste123

To change, edit `/app/admin/page.js` lines:
```js
const ADMIN_EMAIL = 'admin@namastenomads.in'
const ADMIN_PASSWORD = 'namaste123'
```

## Local Development
```bash
npm install
npm run dev
# → http://localhost:3000      (customer site)
# → http://localhost:3000/admin (admin panel)
```

## Deploy to Vercel (Free)

### Option 1 — Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts — select Next.js framework automatically
```

### Option 2 — Vercel Dashboard
1. Push this folder to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Vercel auto-detects Next.js — click Deploy
4. Your site is live in ~60 seconds

## Customise
- **Phone / WhatsApp number:** Search for `+919999999999` and replace with your real number
- **Email:** Search for `namastenomads.in` and replace
- **Logo:** Replace `/public/logo.jpeg` with your logo file
- **Packages:** Edit via Admin panel at `/admin` — changes persist in localStorage
- **Seed data:** Edit `/lib/packages.js` to change default packages

## Data Persistence
Packages are stored in **browser localStorage**. This means:
- Changes made in admin panel persist in that browser
- For production with a real database, replace the `usePackages` hook with Supabase/Firebase calls

## Color Theme (from logo)
- Saffron / Orange: `#e8520a`
- Navy Blue: `#2e3da8`
- Cream: `#f0ebe1`
