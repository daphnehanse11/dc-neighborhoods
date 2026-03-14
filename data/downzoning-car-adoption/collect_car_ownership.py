"""
Data collection scripts for car ownership time series.

Sources:
- UK: DfT VEH0103 (1909-present)
- Netherlands: CBS StatLine (1927-present)
- Germany: KBA (1950s-present)
- EU-wide: Eurostat road_eqs_carhab (1990-present)
- OECD: ITF transport data (1970s-present)

Run: python collect_car_ownership.py
Outputs: car_ownership_*.csv in this directory
"""

import csv
import json
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Any

OUTPUT_DIR = Path(__file__).parent


# ---------------------------------------------------------------------------
# 1. Eurostat: Cars per 1,000 inhabitants (EU countries, 1990-present)
# ---------------------------------------------------------------------------

def fetch_eurostat_cars_per_capita() -> list[dict[str, Any]]:
    """
    Fetch Eurostat road_eqs_carhab dataset via JSON API.
    Returns cars per 1,000 inhabitants by country and year.
    """
    # Eurostat JSON API endpoint
    base_url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
    dataset = "road_eqs_carhab"

    # Filter for key countries
    countries = ["DE", "FR", "UK", "NL", "AT", "SE", "DK", "ES", "IT", "BE", "CH"]
    geo_filter = "&".join(f"geo={c}" for c in countries)

    url = f"{base_url}/{dataset}?{geo_filter}&unit=NR"

    print(f"Fetching Eurostat data from: {url}")

    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())

        # Parse Eurostat JSON format
        rows = []
        dims = data.get("dimension", {})
        time_labels = dims.get("time", {}).get("category", {}).get("label", {})
        geo_labels = dims.get("geo", {}).get("category", {}).get("label", {})
        values = data.get("value", {})

        geo_index = dims.get("geo", {}).get("category", {}).get("index", {})
        time_index = dims.get("time", {}).get("category", {}).get("index", {})

        n_time = len(time_index)

        for geo_code, geo_idx in geo_index.items():
            for time_code, time_idx in time_index.items():
                flat_idx = str(geo_idx * n_time + time_idx)
                if flat_idx in values:
                    rows.append({
                        "country_code": geo_code,
                        "country": geo_labels.get(geo_code, geo_code),
                        "year": int(time_code),
                        "cars_per_1000": values[flat_idx],
                        "source": "Eurostat road_eqs_carhab",
                    })

        return rows

    except Exception as e:
        print(f"  Warning: Eurostat fetch failed: {e}")
        return []


# ---------------------------------------------------------------------------
# 2. Historical car ownership data (manually compiled from literature)
# ---------------------------------------------------------------------------

# Sources:
# - UK: DfT VEH0103, Mitchell (1988) British Historical Statistics
# - Netherlands: CBS Statline historical tables
# - Germany: KBA Statistik, Merki (2002) "Der holprige Siegeszug des Automobils"
# - France: INSEE, Comité des Constructeurs Français d'Automobiles
# - US: FHWA Highway Statistics, Ward's Automotive

HISTORICAL_CAR_OWNERSHIP = [
    # Format: (country, year, cars_per_1000, source_note)

    # United Kingdom
    ("UK", 1909, 2, "DfT VEH0103 / Mitchell"),
    ("UK", 1920, 8, "DfT VEH0103"),
    ("UK", 1930, 30, "DfT VEH0103"),
    ("UK", 1938, 42, "DfT VEH0103"),
    ("UK", 1950, 45, "DfT VEH0103"),
    ("UK", 1955, 67, "DfT VEH0103"),
    ("UK", 1960, 108, "DfT VEH0103"),
    ("UK", 1965, 157, "DfT VEH0103"),
    ("UK", 1970, 213, "DfT VEH0103"),
    ("UK", 1975, 248, "DfT VEH0103"),
    ("UK", 1980, 277, "DfT VEH0103"),
    ("UK", 1985, 307, "DfT VEH0103"),
    ("UK", 1990, 361, "DfT VEH0103"),
    ("UK", 1995, 380, "DfT VEH0103"),
    ("UK", 2000, 410, "DfT VEH0103"),
    ("UK", 2005, 455, "DfT VEH0103"),
    ("UK", 2010, 460, "DfT VEH0103"),
    ("UK", 2015, 471, "DfT VEH0103"),
    ("UK", 2020, 473, "DfT VEH0103"),

    # Netherlands
    ("NL", 1927, 5, "CBS StatLine historical"),
    ("NL", 1935, 8, "CBS StatLine historical"),
    ("NL", 1950, 15, "CBS StatLine"),
    ("NL", 1955, 25, "CBS StatLine"),
    ("NL", 1960, 45, "CBS StatLine"),
    ("NL", 1965, 100, "CBS StatLine"),
    ("NL", 1970, 175, "CBS StatLine"),
    ("NL", 1975, 250, "CBS StatLine"),
    ("NL", 1980, 310, "CBS StatLine"),
    ("NL", 1985, 340, "CBS StatLine"),
    ("NL", 1990, 370, "CBS StatLine"),
    ("NL", 1995, 385, "CBS StatLine"),
    ("NL", 2000, 410, "CBS StatLine"),
    ("NL", 2005, 430, "CBS StatLine"),
    ("NL", 2010, 455, "CBS StatLine"),
    ("NL", 2015, 470, "CBS StatLine"),
    ("NL", 2020, 490, "CBS StatLine"),

    # Germany (West Germany pre-1990, unified after)
    ("DE", 1950, 10, "KBA / Merki"),
    ("DE", 1955, 30, "KBA"),
    ("DE", 1960, 80, "KBA"),
    ("DE", 1965, 150, "KBA"),
    ("DE", 1970, 230, "KBA"),
    ("DE", 1975, 300, "KBA"),
    ("DE", 1980, 380, "KBA"),
    ("DE", 1985, 420, "KBA"),
    ("DE", 1990, 460, "KBA"),
    ("DE", 1995, 500, "KBA (unified)"),
    ("DE", 2000, 530, "KBA"),
    ("DE", 2005, 550, "KBA"),
    ("DE", 2010, 510, "KBA"),
    ("DE", 2015, 540, "KBA"),
    ("DE", 2020, 570, "KBA"),

    # France
    ("FR", 1950, 10, "INSEE / CCFA"),
    ("FR", 1955, 30, "INSEE"),
    ("FR", 1960, 80, "INSEE"),
    ("FR", 1965, 150, "INSEE"),
    ("FR", 1970, 240, "INSEE"),
    ("FR", 1975, 300, "INSEE"),
    ("FR", 1980, 350, "INSEE"),
    ("FR", 1985, 390, "INSEE"),
    ("FR", 1990, 415, "INSEE"),
    ("FR", 1995, 440, "INSEE"),
    ("FR", 2000, 470, "INSEE"),
    ("FR", 2005, 495, "INSEE"),
    ("FR", 2010, 500, "INSEE"),
    ("FR", 2015, 480, "INSEE"),
    ("FR", 2020, 480, "INSEE"),

    # United States (for comparison)
    ("US", 1910, 5, "FHWA"),
    ("US", 1920, 50, "FHWA"),
    ("US", 1930, 170, "FHWA"),
    ("US", 1940, 175, "FHWA"),
    ("US", 1950, 240, "FHWA"),
    ("US", 1960, 340, "FHWA"),
    ("US", 1970, 430, "FHWA"),
    ("US", 1980, 535, "FHWA"),
    ("US", 1990, 600, "FHWA"),
    ("US", 2000, 680, "FHWA / Ward's"),
    ("US", 2010, 670, "FHWA"),
    ("US", 2020, 800, "FHWA"),

    # Denmark
    ("DK", 1950, 25, "Statistics Denmark"),
    ("DK", 1960, 70, "Statistics Denmark"),
    ("DK", 1970, 210, "Statistics Denmark"),
    ("DK", 1980, 280, "Statistics Denmark"),
    ("DK", 1990, 310, "Statistics Denmark"),
    ("DK", 2000, 345, "Statistics Denmark"),
    ("DK", 2010, 390, "Statistics Denmark"),
    ("DK", 2020, 440, "Statistics Denmark"),

    # Sweden
    ("SE", 1950, 25, "SCB"),
    ("SE", 1960, 100, "SCB"),
    ("SE", 1970, 280, "SCB"),
    ("SE", 1980, 345, "SCB"),
    ("SE", 1990, 400, "SCB"),
    ("SE", 2000, 450, "SCB"),
    ("SE", 2010, 460, "SCB"),
    ("SE", 2020, 475, "SCB"),

    # Austria
    ("AT", 1950, 10, "Statistik Austria"),
    ("AT", 1960, 60, "Statistik Austria"),
    ("AT", 1970, 170, "Statistik Austria"),
    ("AT", 1980, 300, "Statistik Austria"),
    ("AT", 1990, 390, "Statistik Austria"),
    ("AT", 2000, 500, "Statistik Austria"),
    ("AT", 2010, 530, "Statistik Austria"),
    ("AT", 2020, 560, "Statistik Austria"),

    # Spain
    ("ES", 1960, 10, "DGT"),
    ("ES", 1970, 60, "DGT"),
    ("ES", 1980, 180, "DGT"),
    ("ES", 1990, 310, "DGT"),
    ("ES", 2000, 430, "DGT"),
    ("ES", 2010, 480, "DGT"),
    ("ES", 2020, 520, "DGT"),

    # Japan (counterfactual: permissive density + high transit)
    ("JP", 1960, 10, "JAMA"),
    ("JP", 1970, 85, "JAMA"),
    ("JP", 1980, 200, "JAMA"),
    ("JP", 1990, 280, "JAMA"),
    ("JP", 2000, 390, "JAMA"),
    ("JP", 2010, 455, "JAMA"),
    ("JP", 2020, 490, "JAMA"),
]


def write_historical_car_data():
    """Write the manually compiled historical car ownership data."""
    outpath = OUTPUT_DIR / "car_ownership_historical.csv"
    with open(outpath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "country_code", "year", "cars_per_1000", "source_note",
        ])
        writer.writeheader()
        for country, year, cars, source in HISTORICAL_CAR_OWNERSHIP:
            writer.writerow({
                "country_code": country,
                "year": year,
                "cars_per_1000": cars,
                "source_note": source,
            })
    print(f"Wrote {len(HISTORICAL_CAR_OWNERSHIP)} rows to {outpath}")


# ---------------------------------------------------------------------------
# 3. Zoning regulation timeline (manually compiled)
# ---------------------------------------------------------------------------

ZONING_EVENTS = [
    # Format: (city/country, year, event, direction, source)
    # direction: "restrict" = downzoning/density reduction
    #            "permit"   = upzoning/density increase
    #            "neutral"  = framework change

    # UK / London
    ("London", 1580, "Elizabeth I bans new building in 3-mile belt", "restrict", "Historical"),
    ("London", 1935, "Green Belt formally proposed", "restrict", "GLRPC"),
    ("London", 1938, "Green Belt Act", "restrict", "Parliament"),
    ("London", 1944, "Abercrombie Plan: 4 density rings", "restrict", "GLC"),
    ("London", 1947, "Town and Country Planning Act", "neutral", "Parliament"),
    ("UK", 1955, "Ministry circular: Green Belt around all cities", "restrict", "MHCLG"),
    ("London", 2004, "London Plan Density Matrix introduced", "neutral", "GLA"),
    ("London", 2021, "New London Plan: design-led (removes matrix)", "permit", "GLA"),
    ("UK", 2024, "Labour Grey Belt reforms in NPPF", "permit", "DLUHC"),

    # Paris
    ("Paris", 1667, "First building height ordinance", "restrict", "City of Paris"),
    ("Paris", 1783, "Height tied to street width (hygiene)", "restrict", "Royal declaration"),
    ("Paris", 1853, "Haussmann uniform facades 17.55-20m", "neutral", "Prefect of Seine"),
    ("Paris", 1977, "Height limit reinstated (31m center, 37m periphery)", "restrict", "PLU"),
    ("Paris", 2010, "Height limits relaxed (50m residential, 180m commercial)", "permit", "Delanoë"),
    ("Paris", 2023, "Bioclimatic PLU reinstates 1977-era limits", "restrict", "Hidalgo"),

    # Germany
    ("Germany", 1962, "BauNVO: original density controls (GRZ/GFZ)", "neutral", "Federal"),
    ("Germany", 1968, "BauNVO: upper density limits raised", "permit", "Federal"),
    ("Germany", 1977, "BauNVO: special residential area; urban renewal", "neutral", "Federal"),
    ("Germany", 1990, "BauNVO: major inner development revision", "permit", "Federal"),
    ("Germany", 2017, "BauNVO: Urbanes Gebiet (GRZ 0.8, GFZ 3.0)", "permit", "Federal"),
    ("Berlin", 1990, "Parking minimums abolished", "permit", "City"),

    # Copenhagen
    ("Copenhagen", 1947, "Finger Plan: 5 corridors + green wedges", "restrict", "National"),
    ("Copenhagen", 1949, "New construction in land zones forbidden", "restrict", "Planning law"),
    ("Copenhagen", 2007, "Finger Plan issued as binding national directive", "neutral", "National"),

    # Barcelona
    ("Barcelona", 1859, "Cerdà Plan: 50% block coverage intended", "neutral", "Royal approval"),
    ("Barcelona", 1872, "Systematic bylaw violations begin (4.4x density)", "permit", "De facto"),
    ("Barcelona", 1953, "Plan Comarcal: first general plan since Cerdà", "neutral", "National"),
    ("Barcelona", 1976, "PGM-76: downzoned metro area, reclaimed park land", "restrict", "Metropolitan"),

    # Stockholm
    ("Stockholm", 1874, "National code raises max from 4 to 5 stories", "permit", "National"),
    ("Stockholm", 1952, "Markelius General Plan: ABC suburbs on rail", "neutral", "City"),
    ("Stockholm", 1999, "CityPlan 99: Build the City Inwards", "permit", "City"),

    # Vienna
    ("Vienna", 1893, "First Bauzonenplan: height/density rules", "neutral", "City"),
    ("Vienna", 1920, "Red Vienna: social housing, no SF-exclusive zoning", "permit", "City"),
    ("Vienna", 2018, "Subsidised Housing zoning category added", "permit", "Building Code"),

    # Netherlands
    ("Netherlands", 1901, "Housing Act (Woningwet): minimum quality standards", "neutral", "National"),
    ("Netherlands", 1989, "Eastern Docklands: Compact City policy", "permit", "Amsterdam"),

    # Switzerland
    ("Switzerland", 1980, "Spatial Planning Act (RPG)", "neutral", "National"),
    ("Switzerland", 2014, "RPG revision: must un-zone excess building zones", "restrict", "National"),

    # US (comparison)
    ("New York", 1916, "First comprehensive zoning ordinance", "restrict", "City"),
    ("US", 1926, "Euclid v. Ambler: zoning is constitutional", "neutral", "Supreme Court"),
    ("US", 1950, "FHA/VA mortgage standards embed SF zoning", "restrict", "Federal"),
    ("Minneapolis", 2018, "Minneapolis 2040: eliminates SF-exclusive zoning", "permit", "City"),
    ("Oregon", 2019, "HB 2001: bans SF-exclusive zoning statewide", "permit", "State"),

    # Japan (counterfactual)
    ("Japan", 1968, "City Planning Act: 12 national use zones", "neutral", "National"),
    ("Japan", 2002, "Urban Renaissance: relaxed FAR in special zones", "permit", "National"),
]


def write_zoning_timeline():
    """Write the zoning regulation timeline."""
    outpath = OUTPUT_DIR / "zoning_events_timeline.csv"
    with open(outpath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "city_country", "year", "event", "direction", "source",
        ])
        writer.writeheader()
        for city, year, event, direction, source in ZONING_EVENTS:
            writer.writerow({
                "city_country": city,
                "year": year,
                "event": event,
                "direction": direction,
                "source": source,
            })
    print(f"Wrote {len(ZONING_EVENTS)} events to {outpath}")


# ---------------------------------------------------------------------------
# 4. German BauNVO density limits over time
# ---------------------------------------------------------------------------

# GRZ = Grundflächenzahl (site coverage ratio)
# GFZ = Geschossflächenzahl (floor area ratio)
# Source: https://www.stadtgrenze.de/s/baunvo/anwendung.htm

BAUNVO_DENSITY_LIMITS = [
    # Format: (version_year, zone_type, zone_description, max_grz, max_gfz)

    # 1962 original
    ("1962", "WS", "Kleinsiedlungsgebiet (smallholder settlement)", 0.2, 0.4),
    ("1962", "WR", "Reines Wohngebiet (pure residential)", 0.4, 1.2),
    ("1962", "WA", "Allgemeines Wohngebiet (general residential)", 0.4, 1.2),
    ("1962", "MI", "Mischgebiet (mixed-use)", 0.6, 1.2),
    ("1962", "MK", "Kerngebiet (core/commercial)", 1.0, 3.0),
    ("1962", "GE", "Gewerbegebiet (commercial/light industrial)", 0.8, 2.4),
    ("1962", "GI", "Industriegebiet (industrial)", 0.8, 2.4),

    # 1968 amendment (raised limits)
    ("1968", "WS", "Kleinsiedlungsgebiet", 0.2, 0.4),
    ("1968", "WR", "Reines Wohngebiet", 0.4, 1.2),
    ("1968", "WA", "Allgemeines Wohngebiet", 0.4, 1.2),
    ("1968", "MI", "Mischgebiet", 0.6, 1.6),
    ("1968", "MK", "Kerngebiet", 1.0, 3.0),
    ("1968", "GE", "Gewerbegebiet", 0.8, 2.4),
    ("1968", "GI", "Industriegebiet", 0.8, 2.4),

    # 1990 revision (inner development focus)
    ("1990", "WS", "Kleinsiedlungsgebiet", 0.2, 0.4),
    ("1990", "WR", "Reines Wohngebiet", 0.4, 1.2),
    ("1990", "WA", "Allgemeines Wohngebiet", 0.4, 1.2),
    ("1990", "MI", "Mischgebiet", 0.6, 1.2),
    ("1990", "MK", "Kerngebiet", 1.0, 3.0),
    ("1990", "GE", "Gewerbegebiet", 0.8, 2.4),
    ("1990", "GI", "Industriegebiet", 0.8, 2.4),

    # 2017 amendment (new Urbanes Gebiet)
    ("2017", "WS", "Kleinsiedlungsgebiet", 0.2, 0.4),
    ("2017", "WR", "Reines Wohngebiet", 0.4, 1.2),
    ("2017", "WA", "Allgemeines Wohngebiet", 0.4, 1.2),
    ("2017", "MU", "Urbanes Gebiet (NEW)", 0.8, 3.0),
    ("2017", "MI", "Mischgebiet", 0.6, 1.2),
    ("2017", "MK", "Kerngebiet", 1.0, 3.0),
    ("2017", "GE", "Gewerbegebiet", 0.8, 2.4),
    ("2017", "GI", "Industriegebiet", 0.8, 2.4),
]


def write_baunvo_data():
    """Write BauNVO density limits across versions."""
    outpath = OUTPUT_DIR / "baunvo_density_limits.csv"
    with open(outpath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "version_year", "zone_code", "zone_description", "max_grz", "max_gfz",
        ])
        writer.writeheader()
        for version, zone, desc, grz, gfz in BAUNVO_DENSITY_LIMITS:
            writer.writerow({
                "version_year": version,
                "zone_code": zone,
                "zone_description": desc,
                "max_grz": grz,
                "max_gfz": gfz,
            })
    print(f"Wrote {len(BAUNVO_DENSITY_LIMITS)} rows to {outpath}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Downzoning & Car Adoption Data Collection ===\n")

    print("1. Writing historical car ownership data...")
    write_historical_car_data()

    print("\n2. Writing zoning events timeline...")
    write_zoning_timeline()

    print("\n3. Writing BauNVO density limits...")
    write_baunvo_data()

    print("\n4. Fetching Eurostat car ownership data...")
    eurostat_rows = fetch_eurostat_cars_per_capita()
    if eurostat_rows:
        outpath = OUTPUT_DIR / "car_ownership_eurostat.csv"
        with open(outpath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "country_code", "country", "year", "cars_per_1000", "source",
            ])
            writer.writeheader()
            writer.writerows(eurostat_rows)
        print(f"  Wrote {len(eurostat_rows)} rows to {outpath}")

    print("\n=== Done! ===")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
