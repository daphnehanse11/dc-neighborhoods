
# DC Neighborhood Mapping Project

A crowdsourced neighborhood boundary mapping tool for the DC metro area. Residents enter their address, name their neighborhood, and draw its boundaries. We aggregate responses to show "fuzzy" consensus boundaries—where people agree, where they disagree, and where identities overlap.

**Inspired by**: NYT's NYC neighborhood map, Bostonography's crowdsourced boundaries

**Target distribution**: Greater Greater Washington readers

**Stack**: Next.js (React + TypeScript + MapLibre) with API routes, deployed on Vercel; Neon Postgres + PostGIS (database)

**Live site**: https://dc-neighborhoods.vercel.app

## Quick Links

- [Project guide](agents/project-guide.md) - Full research and data source documentation
- Reference implementations:
  - https://github.com/DNAinfoData/Draw-Your-Neighborhood
  - https://github.com/enam/neighborhoods
  - https://bostonography.com/tag/neighborhoods/

## Agent Personas

This project uses specialized agent personas for different domains. Load the relevant file when working in that area:

| Domain | File | Use for |
|--------|------|---------|
| **PM / Oversight** | `agents/pm.md` | Planning, prioritization, scope decisions, breaking ties |
| **Research Design** | `agents/research-architect.md` | Survey methodology, data quality rules, analysis approach |
| **Data / GIS** | `agents/data-collector.md` | Database schema, GIS processing, aggregation algorithms |
| **Cartography** | `agents/map-maker.md` | Map styling, colors, visual hierarchy, legends |
| **Frontend / UX** | `agents/ui-expert.md` | React components, mobile UX, drawing interaction |

**To activate an agent**, say something like:
- "Put on your PM hat and help me prioritize"
- "As the UI Expert, how should we handle mobile polygon drawing?"
- "I need the Data Collector to set up the PostGIS schema"

**For cross-cutting work**, load multiple agents:
- "Read agents/pm.md and agents/ui-expert.md—I need to decide if address verification is worth the UX cost"

## Project Structure

```
dc-neighborhoods/
├── .claude/CLAUDE.md         ← You are here
├── agents/                    ← Agent personas + project-guide.md research doc
├── nextjs-app/                ← THE ACTIVE APP (Next.js, deployed on Vercel)
│   ├── src/
│   │   ├── app/               ← Pages + API routes (app/api/submissions)
│   │   ├── components/        ← Map, Form, etc.
│   │   └── lib/               ← db.ts (pg pool), schema.sql, types
│   └── package.json
├── frontend/                  ← LEGACY prototype (Vite React) — do not use
├── backend/                   ← LEGACY prototype (FastAPI) — do not use
└── data/                      ← Seed data, exports
```

**Important**: `frontend/` and `backend/` are superseded early prototypes. All work happens in `nextjs-app/`.

## Current Phase: MVP

### MVP Scope
- [x] Project setup and planning
- [x] Base map centered on DC metro (with metro lines/stations)
- [x] Address input with geocoding (Nominatim)
- [x] Neighborhood name autocomplete (custom names allowed)
- [x] Polygon drawing
- [x] Submit to PostGIS database (Neon — live and verified 2026-07-15)
- [ ] Basic results view (show overlapping polygons)

### NOT in MVP
- User accounts
- Hex-grid consensus visualization (just overlay polygons for now)
- Moderation UI (manually review in DB)
- Social sharing
- Analytics dashboard

### Key Decisions Made
- Mobile-first: if it doesn't work on phones, it doesn't ship
- No paid services for MVP (Nominatim geocoding, free map tiles, Neon/Vercel free tiers)
- Autocomplete allows custom neighborhood names (don't force from list)
- Hosting: Vercel (app, personal scope "daphne-hansells-projects") + Neon (Postgres + PostGIS)
- API rate limit: 10 submissions per IP per hour (enforced in the submissions route)

### Key Decisions Pending
- Minimum submissions before showing consensus (5? 10?)
- Whether to require address or just allow "use my location"
- Custom domain (dc-neighborhoods.vercel.app for now)

## Commands

```bash
cd nextjs-app
npm install
npm run dev          # localhost:3000
```

There is no separate backend to run — API routes live inside the Next.js app. The database is remote (Neon); there is no local database.

## Environment Variables

```bash
# nextjs-app/.env.local (gitignored — never commit)
DATABASE_URL=postgresql://...   # Neon connection string; also set in Vercel (Production + Preview)
```

The database schema lives in `nextjs-app/src/lib/schema.sql` and has already been applied to the Neon database (PostGIS enabled, `submissions` table with spatial indexes).

## Conventions

- **Coordinates**: Always WGS84 (EPSG:4326), [longitude, latitude] order (GeoJSON standard)
- **API**: REST, JSON, camelCase in request/response bodies, snake_case in the database
- **Components**: Functional React with hooks, TypeScript strict mode
- **CSS**: Tailwind utility classes, no custom CSS unless necessary
- **Git**: Conventional commits (feat:, fix:, docs:, etc.)

## Data Sources

| Jurisdiction | Source | URL |
|--------------|--------|-----|
| DC | Open Data DC | opendata.dc.gov |
| Arlington | Arlington GIS | gisdata-arlgis.opendata.arcgis.com |
| Alexandria | Alexandria Open Data | cityofalexandria-alexgis.opendata.arcgis.com |
| Montgomery Co | MoCo GIS | opendata-mcgov-gis.hub.arcgis.com |
| Prince George's | PG Planning | gisdata.pgplanning.org/opendata/ |
| Regional | BBBike OSM extract | download.bbbike.org/osm/bbbike/WashingtonDC/ |

## Getting Help

If you're stuck:
1. Check if an agent persona has guidance (load the relevant .md file)
2. Ask the PM agent to help prioritize or break down the problem
3. Check the project-guide.md for background research

If agents disagree, the PM agent has final say. When in doubt, ship something simple and iterate.
