import { api } from './client'
import type { NeighborhoodSeed } from '../types'

export async function getNeighborhoodSeeds(): Promise<NeighborhoodSeed[]> {
  return api.get<NeighborhoodSeed[]>('/neighborhoods/seeds')
}
