from pydantic import BaseModel
from typing import List


class NeighborhoodSeedResponse(BaseModel):
    id: int
    name: str
    alternate_names: List[str]
    jurisdiction: str

    class Config:
        from_attributes = True
