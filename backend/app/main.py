from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import submissions, neighborhoods
from .database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DC Neighborhoods API",
    description="Crowdsourced neighborhood boundary mapping for the DC metro area",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(submissions.router)
app.include_router(neighborhoods.router)


@app.get("/")
async def root():
    return {
        "message": "DC Neighborhoods API",
        "docs": "/docs",
        "version": "0.1.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
