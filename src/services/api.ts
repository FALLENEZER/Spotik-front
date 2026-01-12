import type { User, Track, Room, AuthResponse, QueueItem } from '@/types'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()
  const token = authStore.token

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (e: unknown) {
    // Network/CORS or server unreachable
    let message = 'Ошибка сети'
    if (e instanceof Error) {
      const errorMsg = e.message.toLowerCase()
      if (errorMsg.includes('failed to fetch') || errorMsg.includes('connection refused')) {
        message = `Не удалось подключиться к серверу. Убедитесь, что backend запущен на ${API_BASE_URL}`
      } else if (errorMsg.includes('network')) {
        message = 'Ошибка сети. Проверьте подключение к интернету'
      }
    }
    throw new Error(message)
  }

  if (!response.ok) {
    let errorMessage = 'Ошибка запроса'
    try {
      const errorData = await response.json()
      // Symfony API Platform может возвращать ошибки в разных форматах
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData['hydra:description']) {
        errorMessage = errorData['hydra:description']
      } else if (errorData['hydra:title']) {
        errorMessage = errorData['hydra:title']
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      }
    } catch {
      // Если не удалось распарсить JSON, используем стандартное сообщение
      errorMessage = `HTTP error! status: ${response.status}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: username, email, password }),
    })
  },

  async getCurrentUser(): Promise<User> {
    // Note: Backend doesn't have /auth/me endpoint
    // This might need to be implemented or use /users/{id} with user ID from token
    // For now, keeping this structure but it may need adjustment based on backend implementation
    return request<User>('/users/me')
  },
}

export const roomApi = {
  async listRooms(): Promise<Room[]> {
    return request<Room[]>('/rooms/rooms')
  },

  async createRoom(roomData: { name: string; isPublic?: boolean }): Promise<Room> {
    return request<Room>('/rooms/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    })
  },

  async getRoom(roomId: string): Promise<Room> {
    return request<Room>(`/rooms/rooms/${roomId}`)
  },

  async joinRoom(roomId: string): Promise<Room> {
    return request<Room>(`/rooms/rooms/${roomId}/join`, {
      method: 'POST',
    })
  },

  async leaveRoom(roomId: string): Promise<void> {
    return request<void>(`/rooms/rooms/${roomId}/leave`, {
      method: 'POST',
    })
  },

  async deleteRoom(roomId: string): Promise<void> {
    return request<void>(`/rooms/rooms/${roomId}`, {
      method: 'DELETE',
    })
  },

  async getQueue(roomId: string): Promise<QueueItem[]> {
    return request<QueueItem[]>(`/rooms/${roomId}/queue`)
  },

  async addTrack(roomId: string, trackId: string): Promise<QueueItem> {
    return request<QueueItem>(`/rooms/${roomId}/queue`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    })
  },

  async removeTrack(roomId: string, queueItemId: string): Promise<void> {
    return request<void>(`/rooms/${roomId}/queue/${queueItemId}`, {
      method: 'DELETE',
    })
  },

  async voteTrack(roomId: string, queueItemId: string, vote: 'up' | 'down'): Promise<void> {
    return request<void>(`/rooms/${roomId}/queue/${queueItemId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    })
  },
}

export const trackApi = {
  async search(query: string): Promise<Track[]> {
    return request<Track[]>(`/tracks/search?query=${encodeURIComponent(query)}`)
  },

  async getTrack(trackId: string): Promise<Track> {
    return request<Track>(`/tracks/${trackId}`)
  },

  async createTrack(trackData: {
    path: string
    name: string
    artist?: string
    imageUrl?: string
    duration: number
  }): Promise<Track> {
    return request<Track>('/tracks/', {
      method: 'POST',
      body: JSON.stringify(trackData),
    })
  },
}

export const soundcloudApi = {
  async search(query: string): Promise<any> {
    return request<any>(`/soundcloud/search?query=${encodeURIComponent(query)}`)
  },

  async getTrack(trackId: string): Promise<any> {
    return request<any>(`/soundcloud/tracks/${trackId}`)
  },
}
