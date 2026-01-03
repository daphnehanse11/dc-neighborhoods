import json
from pathlib import Path
from sqlalchemy.orm import Session
from ..models.neighborhood_seed import NeighborhoodSeed


def load_neighborhood_seeds(db: Session, seed_file: Path | None = None):
    """Load neighborhood seeds from JSON file into database"""
    if seed_file is None:
        seed_file = Path(__file__).parent.parent.parent.parent / "data" / "neighborhood-seeds" / "dc-metro-neighborhoods.json"

    if not seed_file.exists():
        print(f"Seed file not found: {seed_file}")
        return 0

    with open(seed_file) as f:
        seeds = json.load(f)

    # Clear existing seeds
    db.query(NeighborhoodSeed).delete()

    # Insert new seeds
    for seed in seeds:
        db_seed = NeighborhoodSeed(
            name=seed["name"],
            alternate_names=seed.get("alternate_names", []),
            jurisdiction=seed["jurisdiction"],
            source="dc-metro-neighborhoods.json",
        )
        db.add(db_seed)

    db.commit()
    return len(seeds)


if __name__ == "__main__":
    from ..database import SessionLocal
    db = SessionLocal()
    count = load_neighborhood_seeds(db)
    print(f"Loaded {count} neighborhood seeds")
    db.close()
