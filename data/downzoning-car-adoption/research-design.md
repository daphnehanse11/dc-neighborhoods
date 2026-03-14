# Downzoning & Car Adoption: A Comparative Historical Analysis

## Research Question

**Did downzoning (reducing allowed density) follow mass car adoption, or did zoning restrictions precede and shape car dependence?**

Sub-questions:
1. What is the temporal relationship between key zoning/density regulations and car ownership milestones in European and American cities?
2. Did cities that restricted density earlier experience faster car adoption growth?
3. Did cities that maintained higher allowed densities (or upzoned) see slower car adoption or earlier plateaus?
4. What role did parking minimums play as a mediating mechanism?

## Hypothesis

The dominant narrative assumes car adoption drove suburbanization and low-density zoning followed demand. We hypothesize a more bidirectional relationship: early zoning restrictions (height limits, density caps, green belts, single-family zoning) constrained urban housing supply, pushed development outward, and *accelerated* car dependence—which then created political constituencies for further downzoning.

## Case Study Selection

### Primary Cases (best data availability)

| City/Country | Why Selected | Zoning Data Quality | Car Data Quality |
|---|---|---|---|
| **Germany (national)** | BauNVO 1962-2017 with exact GRZ/GFZ values across 7 amendments | Excellent | Excellent (KBA from 1950s) |
| **UK (London focus)** | Green Belt (1938/1955), density matrices, NPPF reforms | Good | Excellent (VEH0103 from 1909) |
| **Netherlands** | Compact city policy that reversed sprawl despite high car ownership | Good | Excellent (CBS from 1927) |
| **Paris** | Well-documented height limits from 1667; 1977 downzoning; 2023 re-downzoning | Good | Good (INSEE from ~1960s) |

### Secondary Cases (for pattern validation)

| City/Country | Why Selected | Key Feature |
|---|---|---|
| **Copenhagen** | 1947 Finger Plan—transit-oriented before mass car ownership | Proactive density shaping |
| **Barcelona** | 1976 PGM downzoning after decades of over-building | Reactive downzoning |
| **Stockholm** | 1952 ABC plan—satellite cities on rail lines | Transit-density co-planning |
| **Vienna** | Never zoned for single-family exclusivity; 1893 Bauzonenplan | Continuous density allowance |
| **Zurich** | RPG 1980; must un-zone land exceeding 15-year growth | Active density management |
| **US cities (DC, Houston, Minneapolis)** | Baseline comparison for Euclidean zoning + car dependence | Control group |

### Counterfactual Cases

| City | Why Selected |
|---|---|
| **Tokyo/Japan** | National zoning with permissive density; high transit + low car use in core |
| **Houston** | No traditional zoning; high car dependence anyway (deed restrictions) |
| **Minneapolis** | Recent upzoning (2040 plan); early data on car ownership effects |

## Analytical Framework

### Timeline Construction

For each case city, construct a dual timeline:

```
REGULATORY TRACK                    MOBILITY TRACK
├─ Height limits enacted            ├─ Cars per 1000 residents
├─ Density maximums set/changed     ├─ Transit ridership
├─ Green belt/UGB established       ├─ Mode share data
├─ Parking minimums introduced      ├─ VMT/VKT per capita
├─ Parking minimums reformed        ├─ Licensed drivers %
├─ Upzoning events                  ├─ Fuel consumption
└─ Current allowed density          └─ Current car ownership
```

### Key Metrics

**Zoning/Density Metrics:**
- Maximum allowed floor area ratio (FAR/GFZ) by zone type
- Maximum allowed building height (meters/stories)
- Minimum lot size requirements
- Parking minimum requirements (spaces per dwelling unit)
- Share of land zoned single-family exclusive
- Protected land area (green belt, agricultural reserve)

**Car Adoption Metrics:**
- Registered vehicles per 1,000 population
- Licensed drivers as % of driving-age population
- Vehicle-kilometers traveled per capita
- Car mode share for commuting
- Household car ownership rates (0, 1, 2+ cars)

**Control Variables:**
- GDP per capita (PPP)
- Population and population growth rate
- Transit investment (km of rail, bus frequency)
- Fuel prices and taxes
- Urban area extent (sq km)
- Topography constraints

### Causal Mechanisms to Test

```
[Density restriction] → [Housing pushed to periphery] → [Car needed for commute]
                                                       → [Parking built at destination]
                                                       → [Political constituency for roads]
                                                       → [More density restriction]

vs.

[Car adoption] → [Demand for suburban living] → [Zoning reflects preferences]
              → [Road building] → [Sprawl] → [Zoning codifies sprawl]
```

### Analytical Methods

1. **Event Study / Difference-in-Differences**: Compare car ownership trajectories before and after major zoning changes (e.g., Germany BauNVO 1990 densification vs. London Green Belt 1955)

2. **Granger Causality Tests**: For countries with long time series (UK from 1909, Netherlands from 1927), test whether zoning changes predict subsequent car adoption changes or vice versa

3. **Cross-Sectional Regression**: Across European cities at a point in time, regress car ownership on allowed density, controlling for income, transit, geography

4. **Narrative Process Tracing**: For each case, identify the stated *motivation* for zoning changes from legislative records—was car accommodation cited? Or were motivations aesthetic, hygienic, political?

## Data Sources

### Car Ownership Data

| Country | Source | Coverage | URL |
|---|---|---|---|
| UK | DfT VEH0103 | 1909-present | https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-tables |
| Netherlands | CBS StatLine | 1927-present | https://opendata.cbs.nl/statline/ |
| Germany | KBA | 1950s-present | https://www.kba.de/DE/Statistik/statistik_node.html |
| France | INSEE / SDES | 1960s-present | https://www.statistiques.developpement-durable.gouv.fr/ |
| EU-wide | Eurostat (road_eqs_carhab) | 1990-present | https://ec.europa.eu/eurostat/databrowser/view/road_eqs_carhab/default/table |
| OECD | OECD.Stat | 1970s-present | https://data-explorer.oecd.org/ |
| World | OICA | 2005-present | https://www.oica.net/category/vehicles-in-use/ |
| Historical | Melosi (2010) | 1900-2005 | See bibliography |

### Zoning/Density Regulation Data

| City/Country | Source | Coverage | URL |
|---|---|---|---|
| Germany (BauNVO) | stadtgrenze.de | 1962-2017 all versions | https://www.stadtgrenze.de/s/baunvo/anwendung.htm |
| Germany (current) | Official PDF | Current text | https://www.gesetze-im-internet.de/baunvo/BauNVO.pdf |
| Munich | City GIS | BauNVO 1968/1977 application | https://stadt.muenchen.de/dam/jcr:6cf58fde-b95f-4aee-8ec5-a0da02ff23ae/BauNVO_1968_1977_2021.pdf |
| UK (Green Belt) | Planning Data | GIS boundaries | https://www.planning.data.gov.uk/dataset/green-belt |
| London | GLA | Density standards | https://www.london.gov.uk/sites/default/files/project_1_defining_measuring_and_implementing_density_standards_in_london.pdf |
| Paris | City regulations | Height limits history | https://fr.wikipedia.org/wiki/R%C3%A8glements_d'urbanisme_de_Paris |
| Barcelona (PGM) | City Council | 1976 plan regulations | https://ajuntament.barcelona.cat/ecologiaurbana/en/services/the-city-works/urban-planning-and-management/urban-information/general-metropolitan-plan-regulations |
| EU (30 countries) | Saakjans et al. 2025 | Expert survey snapshot | https://www.sciencedirect.com/science/article/pii/S0264837725004508 |

### Observed Density (Actual Built Environment)

| Dataset | Coverage | Resolution | URL |
|---|---|---|---|
| Copernicus Urban Atlas | 870 EU cities, 2006/2012/2018/2021 | Vector, 0.25 ha | https://land.copernicus.eu/en/products/urban-atlas |
| Urban Atlas Building Height | 870 EU cities, 2012 | 10m raster | https://land.copernicus.eu/en/products/urban-atlas/building-height-2012 |
| CORINE Land Cover | EU, 1990/2000/2006/2012/2018 | 25 ha MMU | https://land.copernicus.eu/en/products/corine-land-cover |
| GHS-BUILT-H | Global, multitemporal | 100m raster | https://human-settlement.emergency.copernicus.eu/ghs_buH2023.php |
| OECD FUA Density | OECD countries | City/FUA level | https://data-explorer.oecd.org/ |

### Parking Regulation Data

| Source | Coverage | URL |
|---|---|---|
| ITDP "Europe's Parking U-Turn" (2011) | EU cities review | https://itdp.org/2011/01/18/europes-parking-u-turn-from-accommodation-to-regulation/ |
| Mingardo et al. (2015) | 3-phase model | https://www.sciencedirect.com/science/article/abs/pii/S0965856415000221 |
| ETRR (2024) | 12 cities DE/NL/CH | https://etrr.springeropen.com/articles/10.1186/s12544-024-00682-w |
| McAslan & Sprei (2023) | 56 Swedish municipalities | https://www.sciencedirect.com/science/article/pii/S0967070X23000574 |
| PARK4SUMP | EU guidance | https://park4sump.eu/fields-activities/standards |

### Transit Data

| Source | Coverage | URL |
|---|---|---|
| UITP | Global transit statistics | https://www.uitp.org/publications/ |
| EU Transport in Figures | EU modal split | https://transport.ec.europa.eu/transport-themes/mobility-strategy/transport-figures-pocketbook_en |

## Bibliography

### Comparative Zoning

- Hirt, S. (2014). *Zoned in the USA*. Cornell University Press. https://muse.jhu.edu/book/57669/
- Hirt, S. (2013). "Home, Sweet Home." *JPER*. https://journals.sagepub.com/doi/10.1177/0739456X13494242
- Hirt, S. (2007). "The Devil Is in the Definitions." *JAPA*.
- Talen, E. (2012). "Zoning and Diversity in Historical Perspective." *JPH*. https://journals.sagepub.com/doi/10.1177/1538513212444566

### Building Height & Density Economics

- Jedwab, R., Barr, J., & Brueckner, J.K. (2022). "Cities Without Skylines." *J. Urban Economics*, 132. https://www.sciencedirect.com/science/article/abs/pii/S0094119022000833
- Bertaud, A. & Brueckner, J.K. (2005). "Analyzing Building Height Restrictions." *Regional Science & Urban Economics*, 35(2). https://papers.ssrn.com/sol3/papers.cfm?abstract_id=610334
- Saakjans et al. (2025). "Scrutinising European Land-Use Planning." *Land Use Policy*. https://www.sciencedirect.com/science/article/pii/S0264837725004508

### City Histories

- Hall, P. (2014). *Cities of Tomorrow* (4th ed.). Wiley-Blackwell.
- Brandl, A. (2020). "Vienna's Planning History." *Planning Perspectives*. https://www.tandfonline.com/doi/full/10.1080/02665433.2020.1862700
- Aibar, E. & Bijker, W. (1997). "Constructing a City: The Cerdà Plan for Barcelona." *Science, Technology & Human Values*, 22(1).

### Car Adoption & Urban Form

- Newman, P. & Kenworthy, J. (2015). *The End of Automobile Dependence*. Island Press.
- Giuliano, G. & Dargay, J. (2006). "Car Ownership, Travel and Land Use." *Transportation Research Part A*, 40(6).
- Nolan, A. (2010). "A Dynamic Analysis of Household Car Ownership." *Transportation Research Part A*, 44(6).
- Dargay, J. & Gately, D. (1999). "Income's Effect on Car and Vehicle Ownership, Worldwide." *Transportation Research Part A*, 33(2).

### Density Change Studies

- Ferrante, A. et al. (2018). "Compact or Spread?" *PLOS ONE*. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0192326
- Næss, P. et al. (2020). "Urban Density in Oslo and Helsinki." *European Planning Studies*. https://www.tandfonline.com/doi/full/10.1080/09654313.2020.1817865
- Green Belt welfare effects (2024). *Economic Journal*. https://academic.oup.com/ej/article/134/657/363/7276598

### Parking

- Shoup, D. (2005, updated 2011). *The High Cost of Free Parking*. APA Planners Press.
- Kodransky, M. & Hermann, G. (2011). "Europe's Parking U-Turn." ITDP.

## Deliverables

1. **Timeline visualization**: Interactive or static dual-track timeline for each case city showing regulatory events alongside car ownership curves
2. **Cross-city comparison table**: Standardized metrics at key dates (1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020)
3. **Statistical analysis**: Granger causality and event study results
4. **Narrative synthesis**: 3,000-5,000 word analysis of findings
5. **Data notebook**: Reproducible Jupyter/Python notebook with all data collection and analysis code

## Project Timeline

| Phase | Tasks | Duration |
|---|---|---|
| 1. Data Collection | Download car ownership time series; digitize zoning regulation timelines | 2 weeks |
| 2. Timeline Construction | Build dual-track timelines for 4 primary + 5 secondary cases | 1 week |
| 3. Statistical Analysis | Granger causality, event studies, cross-sectional regression | 2 weeks |
| 4. Narrative Analysis | Process tracing of legislative motivations | 1 week |
| 5. Synthesis & Visualization | Write up findings, create figures | 1 week |
