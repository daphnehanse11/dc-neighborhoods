from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.functions import ST_AsGeoJSON, ST_GeomFromGeoJSON, ST_MakePoint
from typing import List
import json
import hashlib
import uuid

from ..database import get_db
from ..models.submission import Submission
from ..schemas.submission import SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/submissions", tags=["submissions"])


def normalize_name(name: str) -> str:
    """Normalize neighborhood name for matching"""
    return name.lower().strip()


@router.post("", response_model=SubmissionResponse)
async def create_submission(
    submission: SubmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Generate session ID and hash IP
    session_id = str(uuid.uuid4())
    ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()

    # Convert GeoJSON to PostGIS geometry
    boundary_geojson = json.dumps(submission.boundary.model_dump())
    point_geojson = json.dumps({
        "type": "Point",
        "coordinates": submission.address_point
    })

    db_submission = Submission(
        session_id=session_id,
        address_text=submission.address_text,
        address_point=func.ST_GeomFromGeoJSON(point_geojson),
        neighborhood_name=submission.neighborhood_name,
        neighborhood_name_normalized=normalize_name(submission.neighborhood_name),
        boundary=func.ST_GeomFromGeoJSON(boundary_geojson),
        ip_hash=ip_hash,
    )

    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Return formatted response
    return SubmissionResponse(
        id=db_submission.id,
        session_id=db_submission.session_id,
        address_text=db_submission.address_text,
        address_point=submission.address_point,
        neighborhood_name=db_submission.neighborhood_name,
        boundary=submission.boundary,
        submitted_at=db_submission.submitted_at,
    )


@router.get("", response_model=List[SubmissionResponse])
async def get_submissions(
    neighborhood: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Submission.id,
        Submission.session_id,
        Submission.address_text,
        Submission.neighborhood_name,
        Submission.submitted_at,
        ST_AsGeoJSON(Submission.address_point).label("address_point_geojson"),
        ST_AsGeoJSON(Submission.boundary).label("boundary_geojson"),
    ).filter(Submission.is_flagged == False)

    if neighborhood:
        query = query.filter(
            Submission.neighborhood_name_normalized == normalize_name(neighborhood)
        )

    results = query.all()

    return [
        SubmissionResponse(
            id=r.id,
            session_id=r.session_id,
            address_text=r.address_text,
            address_point=json.loads(r.address_point_geojson)["coordinates"],
            neighborhood_name=r.neighborhood_name,
            boundary=json.loads(r.boundary_geojson),
            submitted_at=r.submitted_at,
        )
        for r in results
    ]
