from pydantic import BaseModel, ConfigDict, field_validator
from typing import List
from datetime import datetime


def to_camel(string: str) -> str:
    parts = string.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])


class Coordinates(BaseModel):
    """A [longitude, latitude] pair"""
    coordinates: List[float]

    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError('Coordinates must be [longitude, latitude]')
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        if not (-90 <= lat <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v


class PolygonGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v != "Polygon":
            raise ValueError('Geometry type must be Polygon')
        return v

    @field_validator('coordinates')
    @classmethod
    def validate_polygon(cls, v):
        if len(v) < 1:
            raise ValueError('Polygon must have at least one ring')
        ring = v[0]
        if len(ring) < 4:
            raise ValueError('Polygon ring must have at least 4 coordinates')
        if ring[0] != ring[-1]:
            raise ValueError('Polygon ring must be closed (first == last)')
        return v


class SubmissionCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    address_text: str
    address_point: List[float]
    neighborhood_name: str
    boundary: PolygonGeometry

    @field_validator('address_point')
    @classmethod
    def validate_point(cls, v):
        if len(v) != 2:
            raise ValueError('Address point must be [longitude, latitude]')
        return v

    @field_validator('neighborhood_name')
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Neighborhood name cannot be empty')
        if len(v) > 255:
            raise ValueError('Neighborhood name too long')
        return v


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: int
    session_id: str | None
    address_text: str
    address_point: List[float]
    neighborhood_name: str
    boundary: PolygonGeometry
    submitted_at: datetime
