export interface Submission {
  id: number
  sessionId: string
  addressText: string
  addressPoint: [number, number]
  neighborhoodName: string
  boundary: GeoJSON.Polygon
  submittedAt: string
}

export interface SubmissionPayload {
  addressText: string
  addressPoint: [number, number]
  neighborhoodName: string
  boundary: GeoJSON.Polygon
}

export interface Address {
  text: string
  point: [number, number]
}
