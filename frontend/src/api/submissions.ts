import { api } from './client'
import type { Submission, SubmissionPayload } from '../types'

export async function createSubmission(payload: SubmissionPayload): Promise<Submission> {
  return api.post<Submission>('/submissions', payload)
}

export async function getSubmissionsByNeighborhood(name: string): Promise<Submission[]> {
  return api.get<Submission[]>(`/submissions?neighborhood=${encodeURIComponent(name)}`)
}

export async function getAllSubmissions(): Promise<Submission[]> {
  return api.get<Submission[]>('/submissions')
}
