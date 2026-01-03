from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.neighborhood_seed import NeighborhoodSeed
from ..schemas.neighborhood import NeighborhoodSeedResponse

router = APIRouter(prefix="/neighborhoods", tags=["neighborhoods"])


@router.get("/seeds", response_model=List[NeighborhoodSeedResponse])
async def get_neighborhood_seeds(db: Session = Depends(get_db)):
    seeds = db.query(NeighborhoodSeed).order_by(NeighborhoodSeed.name).all()
    return [
        NeighborhoodSeedResponse(
            id=s.id,
            name=s.name,
            alternate_names=s.alternate_names or [],
            jurisdiction=s.jurisdiction,
        )
        for s in seeds
    ]
