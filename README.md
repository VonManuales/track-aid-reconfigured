# TrackAid

**The Philippine Resource Mobilization Tracker** — a Next.js dashboard for LGUs and NGOs to explore poverty-related funding, compare provincial coverage, and visualize gaps on an interactive map.

## Features

- Live and cached data from **IATI**, **PSA OpenStat**, and **DBM** sources (with offline fallbacks)
- **Predictability Dashboard** with five-tier funding coverage colors
- **Resource distribution heatmap** (Leaflet / react-leaflet)
- Clickable province names that fly the map to each location
- **LGU Funding Matcher** table for the highest-poverty provinces

## Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or newer
- npm (included with Node.js)

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/track-aid.git
cd track-aid
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `IATI_API_KEY` | No | IATI Datastore subscription key. The app runs without it but may hit rate limits. |
| `ENABLE_DEMO_COVERAGE` | No | Set to `false` to use only calculated coverage (no illustrative tier samples on the top 10 provinces). Default: enabled. |

Never commit `.env.local` or real API keys to GitHub.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Project structure

```
app/              # Next.js App Router (dashboard page)
lib/              # Data fetching, map, coverage tiers, demo helpers
public/           # Static assets
```

## Data sources

- [IATI Datastore](https://iatistandard.org/) — international poverty-related grants
- [PSA OpenStat](https://openstat.psa.gov.ph/) — provincial poverty incidence and NTA allocations

## Publishing to GitHub

From the project root (this folder):

```bash
git init
git add .
git status
```

Confirm that **`.env.local`**, **`node_modules`**, and **`.next`** are **not** listed. Then:

```bash
git commit -m "Initial commit: TrackAid predictability dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/track-aid.git
git push -u origin main
```

Replace `YOUR_USERNAME` and repository name with your GitHub account.

### Deploying (optional)

You can deploy on [Vercel](https://vercel.com) or similar. Add `IATI_API_KEY` in the host’s environment settings (not in the repo).

## Security

- API keys belong only in `.env.local` or your host’s secret store.
- Do not commit database passwords, tokens, or private URLs.
- See [SECURITY.md](./SECURITY.md) for reporting issues.

## Authors

TrackAid · Badana, Dadal, Manuales

## License

Add a `LICENSE` file if your course or group requires one (e.g. MIT).
