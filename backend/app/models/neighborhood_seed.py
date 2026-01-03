from sqlalchemy import Column, Integer, String, ARRAY
from geoalchemy2 import Geometry
from ..database import Base


class NeighborhoodSeed(Base):
    __tablename__ = "neighborhood_seeds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    alternate_names = Column(ARRAY(String))
    jurisdiction = Column(String(50))
    source = Column(String(100))
    centroid = Column(Geometry("POINT", srid=4326))
