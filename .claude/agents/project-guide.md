---
name: project-guide
description: Background research and reference documentation. Consult for methodology details, data sources, reference implementations, and neighborhood seed lists.
tools: Read, Grep, Glob, WebFetch, WebSearch
---

# Recreating NYT's crowdsourced neighborhood mapping for the DC metro area

The New York Times neighborhood mapping project can be replicated using **open source tools and freely available geographic data**, with the core technical challenge being polygon aggregation to show "fuzzy" consensus boundaries. The Bostonography hexagonal grid methodology and the `enam/neighborhoods` GitHub repository provide the clearest implementation blueprints, while DC's Open Data portal offers **131 official neighborhood names** with boundaries as a foundation.

## How the NYT project actually works

The NYT's "Extremely Detailed Map of New York City Neighborhoods" (October 2023) collected **over 40,000 user submissions** to map 350+ distinct neighborhoods. Users entered their address, typed their neighborhood name, and drew polygon boundaries on an interactive map. The resulting visualization shows both sharp boundaries (typically following physical features like highways or waterways) and fuzzy boundaries (areas of disagreement or transition).

The clearest public methodology comes from **Bostonography**, which pioneered this approach in 2012. Their algorithm overlays a hexagonal grid (~75m cells) across the study area, then for each cell counts how many user-drawn polygons intersect it. The result produces graduated boundaries showing **>25% agreement** (notable minority), **>50%** (majority), and **>75%** (strong consensus). This approach elegantly visualizes both the core of neighborhoods where everyone agrees and the disputed border zones.

DNAinfo's open source release at `github.com/DNAinfoData/Draw-Your-Neighborhood` contains **39,000+ individual polygon drawings** in GeoJSON format covering NYC and Chicago—invaluable reference data for understanding what user submissions look like. The NYT team (Larry Buchanan, Josh Katz, Rumsey Taylor, Eve Washington) has not published their specific aggregation code, but the underlying approach mirrors Bostonography's methodology.

## Geographic data sources for the DC metro region

The DC area has excellent geographic data availability across multiple jurisdictions:

### DC Proper

**Open Data DC** provides the most structured official source with **131 neighborhood labels** (centroid points for placement), **46 neighborhood clusters** (aggregated polygons), Advisory Neighborhood Commission boundaries, and DC Wards. All are downloadable as GeoJSON, Shapefile, or via API with Creative Commons Attribution licensing. The neighborhood cluster dataset at `opendata.dc.gov` groups neighborhoods for statistical analysis while individual neighborhood labels preserve the granular names residents actually use.

### Census Data

**Census TIGER/Line files** offer block groups and tracts as the finest-grained statistical geography, available from `census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html`. These provide the demographic foundation if you want to correlate crowdsourced boundaries with population characteristics.

### OpenStreetMap

**BBBike's Washington DC extract** at `download.bbbike.org/osm/bbbike/WashingtonDC/` delivers pre-built OpenStreetMap data in multiple formats including a **46MB PBF file**, GeoJSON, and shapefiles—covering street networks, points of interest, and any neighborhood boundaries that OSM mappers have contributed. For custom extracts, `extract.bbbike.org` allows drawing arbitrary polygons.

### Virginia

Virginia jurisdictions maintain separate portals:

- **Arlington's GIS** (`gisdata-arlgis.opendata.arcgis.com`) includes civic association boundaries covering 57 distinct neighborhoods
- **Alexandria's Open Data** (`cityofalexandria-alexgis.opendata.arcgis.com`) has community association polygons
- **Fairfax County** (`data-fairfaxcountygis.opendata.arcgis.com`) offers 170+ layers

### Maryland

Maryland data sources span state and county levels:

- **Maryland iMAP** (`data.imap.maryland.gov`) is the state's central GIS data catalog with statewide layers including municipal boundaries, census geographies, and transportation networks

- **Montgomery County** has two main portals:
  - **Montgomery County GIS Open Data** (`opendata-mcgov-gis.hub.arcgis.com`) for county government datasets
  - **Montgomery Planning Data Catalog** (`data-mcplanning.hub.arcgis.com`) for planning-specific data including parcels, zoning, and development pipeline
  - **MCAtlas** (`mcatlas.org`) is the interactive map viewer

- **Prince George's County** offers:
  - **PGAtlas** (`pgplanning.org/data-tools/maps/`) as the main map viewer with property, zoning, and imagery layers
  - **GIS Open Data Portal** (`gisdata.pgplanning.org/opendata/`) with 200+ downloadable datasets in geodatabase, shapefile, and DXF formats—all free under Creative Commons Attribution
  - **OpenPGC** (`data.princegeorgescountymd.gov`) for operational county data

### Commercial/Hybrid Sources

The **Zillow neighborhood boundaries** dataset, now accessible via EPA's ArcGIS server at `gispub.epa.gov/arcgis/rest/services/OEI/Zillow_Neighborhoods/MapServer`, covers ~17,000 US neighborhoods including DC. This provides perception-based boundaries from real estate usage, useful for comparison against crowdsourced results.

## Building the technical stack with React and Python

**For the mapping frontend**, MapLibre GL JS with `@mapbox/mapbox-gl-draw` provides the best combination of capability and cost. MapLibre is an open-source fork of Mapbox GL JS that works with the same drawing plugin but eliminates per-map-load fees. The key configuration for mobile usability:

```javascript
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: { polygon: true, trash: true },
  touchBuffer: 25,  // Critical for mobile touch targets
  clickBuffer: 2
});
```

For React integration, `react-map-gl-draw` from Uber's Vis.gl provides declarative components with `DrawPolygonMode` and `EditingMode`. The critical mobile UX insight: **increase touch targets to 12-25px**, provide an explicit "Finish Drawing" button rather than relying on double-tap, and consider freehand drawing mode (via `Leaflet.FreeDraw`) for touchscreens where point-by-point polygon creation is frustrating.

**PostGIS stores the polygon data** with proper spatial indexing:

```sql
CREATE TABLE neighborhood_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    neighborhood_name VARCHAR(255),
    geom GEOMETRY(Polygon, 4326),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_geom ON neighborhood_submissions USING GIST(geom);
```

**Python aggregation uses Shapely and GeoPandas** for the consensus calculation. The most scalable approach is Paul Ramsey's PostGIS technique: extract all polygon boundaries, node them at intersections using `ST_Union(ST_ExteriorRing())`, polygonize the result, then count how many original submissions contain each resulting atomic polygon. For smaller datasets, the NYPL "Polygon Consensus" algorithm (published at ACM SIGSPATIAL 2016) rasterizes submissions to a fine grid, sums pixel values, applies a threshold (e.g., >50% agreement), and vectorizes the result back to polygons.

Shapely's `simplify()` function with Douglas-Peucker algorithm cleans up user-drawn polygons before storage, while `make_valid()` handles self-intersecting shapes from sloppy freehand drawing.

## Reference implementations and open source starting points

The **`enam/neighborhoods`** repository at `github.com/enam/neighborhoods` is the closest open-source implementation to what you need. It uses Leaflet with Leaflet.draw for polygon collection, CartoDB/CARTO as the backend database, and immediately displays submitted boundaries. The repo has 41 stars and 34 forks with clear setup instructions—though it requires PHP and is somewhat dated (2014-2015 vintage).

**Bostonography's live tool** at `bostonography.com/hoods/` demonstrates the complete user experience and provides downloadable shapefiles of all submissions. Their detailed methodology posts at `bostonography.com/tag/neighborhoods/` explain the hexagonal grid consensus calculation, minimum submission thresholds (5+ responses per neighborhood), and data quality challenges (users submitting "other long, tipped objects" that need moderation).

For the drawing component specifically, **Leaflet.FreeDraw** (`github.com/Wildhoney/Leaflet.FreeDraw`) enables freehand shape drawing that may feel more natural to users than click-to-place vertices—similar to how Zoopla's property search works.

Academic validation comes from the University of Chicago's "Comparisons of Chicago Neighborhood Boundaries from Crowdsourced Resident Drawings" (COSIT 2024) which documents collecting 5,000+ responses using Leaflet.draw and provides methodology for analyzing perception-based versus administrative boundaries.

## Seeding autocomplete with DC-area neighborhood names

For autocomplete suggestions, combine multiple sources to reach approximately **400-500 unique neighborhood names** across the metro area:

### DC Proper (~150 names)
- Open Data DC's 131 official neighborhood labels
- Emerging/colloquial names: NoMa, Navy Yard, The Wharf, H Street corridor, Atlas District, Capitol Riverfront

### Virginia (~130 names)
- **Arlington**: 57 civic association names from `civfed.org/about-us/member-organizations/`
- **Alexandria**: ~50 neighborhoods from Wikipedia's structured table including Old Town, Del Ray, Arlandria, Carlyle
- **Fairfax**: 20-30 major communities

### Maryland (~150-200 names)
- **Montgomery County**: Bethesda, Chevy Chase, Silver Spring, Takoma Park, Rockville, Potomac, Kensington, Garrett Park, Glen Echo, Cabin John, North Bethesda, Wheaton as major centers—plus dozens of subdivisions within each (e.g., Woodside Park, Forest Glen, Lyttonsville in Silver Spring)
- **Prince George's County**: College Park, Hyattsville, Greenbelt, Bowie, Laurel, Riverdale Park, Mount Rainier, Langley Park, Adelphi, New Carrollton, Capitol Heights

Include alternate names users might search for: "Van Ness" for Forest Hills, "National Landing" for the Arlington/Alexandria Amazon HQ2 area, "Downtown Silver Spring" vs just "Silver Spring." Wikipedia's "Neighborhoods in Washington, D.C." page provides the most complete structured table organized by ward.

## Practical implementation recommendations

Start with Open Data DC's neighborhood clusters as **display boundaries for orientation**, but allow users to draw freely without being constrained to official shapes—the whole point is capturing perceived boundaries that may differ from administrative ones.

Require a **minimum of 5-10 submissions** per neighborhood name before displaying aggregated results. Implement a **moderation flag** for inappropriate submissions. Store raw GeoJSON with full coordinate precision, then simplify for display using tolerance ~0.0001 degrees (roughly 10 meters).

For visualization, the gradient/transparency approach showing percentage agreement works better than hard boundary lines. Color-code by agreement level: **strong agreement (>75%)** in solid color, **majority agreement (50-75%)** in medium transparency, **minority agreement (25-50%)** in light transparency. Areas where no neighborhood claims majority become visible "no-man's lands" that often represent genuine boundary disputes.

The total development effort for a minimal viable implementation is approximately **2-4 weeks** using existing libraries, scaling to 2-3 months for a polished product with moderation tools, user accounts, and sophisticated aggregation visualization.

## Key links

| Resource | URL |
|----------|-----|
| DNAinfo Draw Your Neighborhood (open source) | `github.com/DNAinfoData/Draw-Your-Neighborhood` |
| enam/neighborhoods repo | `github.com/enam/neighborhoods` |
| Bostonography methodology | `bostonography.com/tag/neighborhoods/` |
| Leaflet.FreeDraw | `github.com/Wildhoney/Leaflet.FreeDraw` |
| Open Data DC | `opendata.dc.gov` |
| Montgomery County GIS | `opendata-mcgov-gis.hub.arcgis.com` |
| Prince George's GIS | `gisdata.pgplanning.org/opendata/` |
| Arlington GIS | `gisdata-arlgis.opendata.arcgis.com` |
| Maryland iMAP | `data.imap.maryland.gov` |
| BBBike DC extract | `download.bbbike.org/osm/bbbike/WashingtonDC/` |
