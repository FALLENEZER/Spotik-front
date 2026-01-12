export interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

export interface Track {
  id: string
  name: string
  artist: string
  imageUrl?: string
  duration: number
  spotifyId?: string | null
  releaseDate?: string
}

export interface QueueItem {
  id: string
  track: Track
  addedBy?: User
  votes: number
  addedAt: string
}

export interface Room {
  id: string
  name: string
  isPublic: boolean
  owner: User
  participants: User[]
  queue: QueueItem[]
  currentTrack?: QueueItem | null
  createdAt: string
}

export type AuthResponse = string
