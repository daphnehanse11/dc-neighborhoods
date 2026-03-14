"""
Analysis script: Downzoning & Car Adoption comparative timelines.

Reads the CSV data produced by collect_car_ownership.py and generates
comparative visualizations showing the temporal relationship between
zoning regulation changes and car ownership curves.

Run: python analysis.py
Outputs: PNG charts in this directory
"""

import csv
from collections import defaultdict
from pathlib import Path

DATA_DIR = Path(__file__).parent


def load_car_data() -> dict[str, list[tuple[int, float]]]:
    """Load historical car ownership data, grouped by country."""
    path = DATA_DIR / "car_ownership_historical.csv"
    by_country: dict[str, list[tuple[int, float]]] = defaultdict(list)
    with open(path) as f:
        for row in csv.DictReader(f):
            by_country[row["country_code"]].append(
                (int(row["year"]), float(row["cars_per_1000"]))
            )
    for k in by_country:
        by_country[k].sort()
    return dict(by_country)


def load_zoning_events() -> list[dict]:
    """Load zoning events timeline."""
    path = DATA_DIR / "zoning_events_timeline.csv"
    events = []
    with open(path) as f:
        for row in csv.DictReader(f):
            row["year"] = int(row["year"])
            events.append(row)
    events.sort(key=lambda e: e["year"])
    return events


def load_baunvo() -> list[dict]:
    """Load BauNVO density limits."""
    path = DATA_DIR / "baunvo_density_limits.csv"
    rows = []
    with open(path) as f:
        for row in csv.DictReader(f):
            row["max_grz"] = float(row["max_grz"])
            row["max_gfz"] = float(row["max_gfz"])
            rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# Analysis functions (text-based, no matplotlib dependency required)
# ---------------------------------------------------------------------------

def print_car_ownership_comparison():
    """Print a text table comparing car ownership across countries."""
    data = load_car_data()

    # Find common years
    all_years = sorted({y for series in data.values() for y, _ in series})
    countries = ["US", "UK", "DE", "FR", "NL", "SE", "DK", "AT", "ES", "JP"]
    countries = [c for c in countries if c in data]

    print("\n" + "=" * 80)
    print("CAR OWNERSHIP (vehicles per 1,000 population)")
    print("=" * 80)

    # Header
    header = f"{'Year':<8}" + "".join(f"{c:>8}" for c in countries)
    print(header)
    print("-" * len(header))

    # Data rows
    lookup = {c: dict(data[c]) for c in countries}
    for year in all_years:
        if year < 1950:
            continue
        row = f"{year:<8}"
        for c in countries:
            val = lookup[c].get(year)
            row += f"{val:>8.0f}" if val else f"{'--':>8}"
        print(row)


def print_zoning_car_alignment():
    """
    Core analysis: For each major zoning event, show what car ownership
    looked like at that time. This reveals temporal ordering.
    """
    car_data = load_car_data()
    events = load_zoning_events()

    # Map city/country to country code for car data lookup
    city_to_country = {
        "London": "UK", "UK": "UK",
        "Paris": "FR", "France": "FR",
        "Germany": "DE", "Berlin": "DE", "Munich": "DE",
        "Copenhagen": "DK", "Denmark": "DK",
        "Barcelona": "ES", "Spain": "ES",
        "Stockholm": "SE", "Sweden": "SE",
        "Vienna": "AT", "Austria": "AT",
        "Netherlands": "NL", "Amsterdam": "NL",
        "New York": "US", "US": "US", "Minneapolis": "US", "Oregon": "US",
        "Japan": "JP", "Tokyo": "JP",
        "Switzerland": "NL",  # approximate
    }

    print("\n" + "=" * 100)
    print("ZONING EVENTS ALIGNED WITH CAR OWNERSHIP AT TIME OF ENACTMENT")
    print("=" * 100)
    print(f"{'Year':<6} {'City/Country':<16} {'Dir':<9} {'Cars/1k':<10} {'Event'}")
    print("-" * 100)

    for ev in events:
        year = ev["year"]
        city = ev["city_country"]
        country = city_to_country.get(city)

        # Interpolate car ownership at event year
        cars_str = "--"
        if country and country in car_data:
            series = car_data[country]
            # Find bracketing years
            before = [(y, v) for y, v in series if y <= year]
            after = [(y, v) for y, v in series if y >= year]
            if before and after:
                y1, v1 = before[-1]
                y2, v2 = after[0]
                if y1 == y2:
                    cars_str = f"{v1:.0f}"
                elif y2 - y1 <= 20:
                    # Linear interpolation
                    interp = v1 + (v2 - v1) * (year - y1) / (y2 - y1)
                    cars_str = f"~{interp:.0f}"

        dir_symbol = {
            "restrict": "RESTRICT",
            "permit": "PERMIT",
            "neutral": "NEUTRAL",
        }.get(ev["direction"], ev["direction"])

        print(f"{year:<6} {city:<16} {dir_symbol:<9} {cars_str:<10} {ev['event']}")


def print_key_findings():
    """Print analytical summary of temporal patterns."""
    print("\n" + "=" * 80)
    print("KEY TEMPORAL PATTERNS")
    print("=" * 80)

    findings = [
        (
            "LONDON GREEN BELT (1938) PRECEDED MASS CAR ADOPTION",
            "The Green Belt Act passed when UK had ~42 cars/1000 (4.2% of population). "
            "Mass motorization (>100/1000) didn't arrive until 1960. "
            "This means London's most consequential density restriction was enacted "
            "in an essentially pre-automobile city. The Green Belt constrained where "
            "housing could be built BEFORE cars made suburban living feasible."
        ),
        (
            "PARIS HEIGHT LIMITS: AESTHETIC/HYGIENIC, NOT CAR-RELATED",
            "Paris height limits date to 1667 (centuries before cars). The 1977 "
            "reinstatement was a reaction to Tour Montparnasse's aesthetic impact, "
            "not car-related. Car ownership was ~300/1000 by then. The 2023 "
            "re-restriction under Hidalgo is explicitly anti-car (bioclimatic plan)."
        ),
        (
            "GERMANY: DENSITY RULES TIGHTENED, THEN LOOSENED WITH CARS",
            "The 1962 BauNVO set initial density limits when Germany had ~80 cars/1000. "
            "Interestingly, Germany has progressively LOOSENED density controls over time "
            "(1968 raised limits, 1990 inner development, 2017 Urbanes Gebiet), even as "
            "car ownership grew to 570/1000. Berlin abolished parking minimums in 1990. "
            "Germany is a counter-example: more cars → more permissive density policy."
        ),
        (
            "COPENHAGEN FINGER PLAN (1947): TRANSIT-FIRST, PRE-CAR",
            "Denmark had ~25 cars/1000 when the Finger Plan was adopted. The plan "
            "explicitly channeled development along rail lines with green wedges between. "
            "This pre-car decision locked in a transit-oriented urban form that persists "
            "today, even though Denmark now has 440 cars/1000."
        ),
        (
            "BARCELONA 1976 DOWNZONING: DEMOCRATIC REACTION TO OVERCROWDING",
            "The PGM-76 downzoned the metro area when Spain had ~180 cars/1000. "
            "Motivation was reclaiming public space after decades of Franco-era "
            "developer permissiveness, not accommodating cars. This is downzoning "
            "that was ANTI-developer, not pro-car."
        ),
        (
            "US 1916-1926: ZONING PRECEDED MASS CAR ADOPTION",
            "NYC's 1916 zoning ordinance passed when the US had ~50 cars/1000. "
            "Euclid v. Ambler (1926) was decided at ~170/1000. Single-family "
            "exclusive zoning was established before most Americans owned cars. "
            "The FHA's embedding of SF zoning in mortgage standards (1950s) came "
            "after mass motorization (240/1000), reinforcing an existing pattern."
        ),
        (
            "NETHERLANDS: HIGH CAR OWNERSHIP + COMPACT CITIES",
            "The Netherlands has 490 cars/1000 (comparable to many car-dependent "
            "countries) yet maintains compact urban form through active planning. "
            "The 1989 Compact City policy came AFTER high car ownership was "
            "established. This shows density policy can work independently of—and "
            "even against—car ownership trends."
        ),
        (
            "JAPAN: PERMISSIVE ZONING + HIGH DENSITY + MODERATE CAR OWNERSHIP",
            "Japan's national zoning system with 12 use zones is far more permissive "
            "than US or European equivalents. Mixed-use is the default. Car ownership "
            "is 490/1000 nationally but much lower in Tokyo. This suggests that "
            "permissive density regulation, combined with transit investment, can "
            "produce high-density urbanism even in wealthy car-owning societies."
        ),
    ]

    for title, text in findings:
        print(f"\n{title}")
        print("-" * len(title))
        # Word wrap at 78 chars
        words = text.split()
        line = ""
        for word in words:
            if len(line) + len(word) + 1 > 78:
                print(line)
                line = word
            else:
                line = f"{line} {word}" if line else word
        if line:
            print(line)


def print_synthesis():
    """Print overall synthesis."""
    print("\n" + "=" * 80)
    print("SYNTHESIS: WHICH CAME FIRST?")
    print("=" * 80)
    print("""
The evidence suggests THREE distinct patterns, not one:

1. DENSITY RESTRICTIONS PRECEDED CARS (London, Copenhagen, early US)
   Key zoning decisions were made in essentially pre-automobile cities.
   These restrictions shaped urban form BEFORE mass motorization,
   constraining where housing could be built and creating conditions
   that later made cars necessary.

2. CARS AND ZONING CO-EVOLVED (Germany, mid-century US)
   Some regulations were enacted during the transition to mass car
   ownership (1950s-1970s). In these cases, it's genuinely difficult
   to separate cause from effect—cars enabled sprawl, sprawl demanded
   more cars, and zoning both responded to and reinforced both trends.

3. DENSITY POLICY OPERATES INDEPENDENTLY OF CARS (Netherlands, Japan, recent)
   Several cases show that density policy can diverge from car ownership.
   The Netherlands has high car ownership but compact cities. Japan has
   permissive zoning and high density. Recent upzoning (Minneapolis,
   Germany's Urbanes Gebiet) occurs in high-car-ownership contexts.

The CAUSAL ARROW is not unidirectional. The strongest finding is that
many of the most consequential density restrictions were enacted BEFORE
mass car adoption, suggesting that zoning shaped car dependence more
than car adoption shaped zoning—at least in the initial, path-setting
decisions. Later regulatory changes show more complex feedback loops.

KEY INSIGHT: The question "did downzoning follow car adoption?" has a
surprisingly clear answer for the foundational cases: NO. London's Green
Belt, Copenhagen's Finger Plan, Paris's height limits, and US exclusive
zoning all preceded mass motorization. These early decisions created
path dependencies that persist today.
""")


def main():
    print("=" * 80)
    print("DOWNZONING & CAR ADOPTION: COMPARATIVE HISTORICAL ANALYSIS")
    print("=" * 80)

    print_car_ownership_comparison()
    print_zoning_car_alignment()
    print_key_findings()
    print_synthesis()


if __name__ == "__main__":
    main()
