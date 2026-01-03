
# DC Neighborhood Mapping Project

A crowdsourced neighborhood boundary mapping tool for the DC metro area. Residents enter their address, name their neighborhood, and draw its boundaries. We aggregate responses to show "fuzzy" consensus boundaries—where people agree, where they disagree, and where identities overlap.

**Inspired by**: NYT's NYC neighborhood map, Bostonography's crowdsourced boundaries

**Target distribution**: Greater Greater Washington readers

**Stack**: React + TypeScript + MapLibre (frontend), Python + FastAPI (backend), PostgreSQL + PostGIS (database)

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
├── CLAUDE.md                 ← You are here
├── agents/
│   ├── pm.md
│   ├── research-architect.md
│   ├── data-collector.md
│   ├── map-maker.md
│   ├── ui-expert.md
│   └── project-guide.md      ← Background research doc
├── frontend/                  ← React app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── pages/
│   └── package.json
├── backend/                   ← FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── requirements.txt
└── data/                      ← Seed data, exports
    └── neighborhood-seeds/
```

## Current Phase: MVP (Weeks 1-2)

### MVP Scope
- [x] Project setup and planning
- [ ] Base map centered on DC metro
- [ ] Address input with geocoding
- [ ] Neighborhood name autocomplete (from seed list)
- [ ] Polygon drawing that works on mobile
- [ ] Submit to PostGIS database
- [ ] Basic results view (show overlapping polygons)

### NOT in MVP
- User accounts
- Hex-grid consensus visualization (just overlay polygons for now)
- Moderation UI (manually review in DB)
- Social sharing
- Analytics dashboard

### Key Decisions Made
- Mobile-first: if it doesn't work on phones, it doesn't ship
- No paid services for MVP (use Nominatim for geocoding, free map tiles)
- Autocomplete allows custom neighborhood names (don't force from list)

### Key Decisions Pending
- Minimum submissions before showing consensus (5? 10?)
- Whether to require address or just allow "use my location"
- Exact hosting setup (leaning Vercel + Railway)

## Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # localhost:5173

# Backend  
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # localhost:8000

# Database (local)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis
```

## Environment Variables

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_MAPLIBRE_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neighborhoods
```

## Conventions

- **Coordinates**: Always WGS84 (EPSG:4326), [longitude, latitude] order (GeoJSON standard)
- **API**: REST, JSON, snake_case for Python, camelCase for JS
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
