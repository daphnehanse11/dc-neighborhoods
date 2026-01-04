-- Run this in your Neon database console to set up the schema
-- Make sure PostGIS extension is enabled first

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  address_text VARCHAR(500),
  address_point GEOMETRY(POINT, 4326),
  neighborhood_name VARCHAR(255),
  neighborhood_name_normalized VARCHAR(255),
  boundary GEOMETRY(POLYGON, 4326),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash VARCHAR(64),
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(255)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_neighborhood ON submissions(neighborhood_name_normalized);
CREATE INDEX IF NOT EXISTS idx_submissions_boundary ON submissions USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_submissions_flagged ON submissions(is_flagged);
