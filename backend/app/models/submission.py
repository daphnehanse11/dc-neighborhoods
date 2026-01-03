from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from geoalchemy2 import Geometry
from ..database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100))
    address_text = Column(String(500))
    address_point = Column(Geometry("POINT", srid=4326))
    neighborhood_name = Column(String(255), index=True)
    neighborhood_name_normalized = Column(String(255), index=True)
    boundary = Column(Geometry("POLYGON", srid=4326))
    submitted_at = Column(DateTime, server_default=func.now())
    ip_hash = Column(String(64))
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(255))
