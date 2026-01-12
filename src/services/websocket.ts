import type { Track, User } from '../types'

interface WebSocketCallbacks {
  onQueueUpdate?: (tracks: Track[]) => void
  onTrackAdded?: (track: Track) => void
  onTrackRemoved?: (trackId: string) => void
  onVoteUpdate?: (trackId: string, votes: number) => void
  onParticipantJoined?: (user: User) => void
  onParticipantLeft?: (userId: string) => void
  onCurrentTrackChanged?: (track: Track | null) => void
  onPlaybackStateChanged?: (playing: boolean) => void
}

export function useWebSocket(roomId: string, callbacks: WebSocketCallbacks = {}) {
  const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
  const wsUrl = `${WS_BASE_URL}/ws/room/${roomId}`
  
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  function connect() {
    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttempts = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        ws = null
        attemptReconnect()
      }
    } catch (err) {
      console.error('Error connecting WebSocket:', err)
      attemptReconnect()
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
    
    reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
      connect()
    }, delay)
  }

  function handleMessage(data: any) {
    switch (data.type) {
      case 'queue_update':
        callbacks.onQueueUpdate?.(data.queue)
        break
      case 'track_added':
        callbacks.onTrackAdded?.(data.track)
        break
      case 'track_removed':
        callbacks.onTrackRemoved?.(data.trackId)
        break
      case 'vote_update':
        callbacks.onVoteUpdate?.(data.trackId, data.votes)
        break
      case 'participant_joined':
        callbacks.onParticipantJoined?.(data.user)
        break
      case 'participant_left':
        callbacks.onParticipantLeft?.(data.userId)
        break
      case 'current_track_changed':
        callbacks.onCurrentTrackChanged?.(data.track)
        break
      case 'playback_state_changed':
        callbacks.onPlaybackStateChanged?.(data.playing)
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  function send(message: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  // Инициализация подключения
  connect()

  return {
    send,
    disconnect,
    reconnect: connect,
    isConnected: () => ws?.readyState === WebSocket.OPEN
  }
}

