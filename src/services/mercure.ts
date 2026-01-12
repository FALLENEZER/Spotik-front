import type { Track, User } from '../types'

interface MercureCallbacks {
  onQueueUpdate?: (tracks: Track[]) => void
  onTrackAdded?: (track: Track) => void
  onTrackRemoved?: (trackId: string) => void
  onVoteUpdate?: (trackId: string, votes: number) => void
  onParticipantJoined?: (user: User) => void
  onParticipantLeft?: (userId: string) => void
  onCurrentTrackChanged?: (track: Track | null) => void
  onPlaybackStateChanged?: (playing: boolean) => void
}

export function useMercure(roomId: string, callbacks: MercureCallbacks = {}) {
  const MERCURE_URL = import.meta.env.VITE_MERCURE_URL || 'http://localhost:3000/.well-known/mercure'
  const topic = `rooms/${roomId}`
  const url = `${MERCURE_URL}?topic=${encodeURIComponent(topic)}`

  let es: EventSource | null = null

  function connect() {
    if (es) return
    try {
      es = new EventSource(url, { withCredentials: true })

      es.onopen = () => {
        console.log('Mercure connected')
      }

      es.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (err) {
          console.error('Error parsing Mercure message:', err)
        }
      }

      es.onerror = (error) => {
        // EventSource will auto-reconnect; log for visibility
        console.error('Mercure error:', error)
      }
    } catch (err) {
      console.error('Error connecting Mercure:', err)
    }
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
        console.log('Unknown Mercure message type:', data.type)
    }
  }

  function disconnect() {
    if (es) {
      es.close()
      es = null
    }
  }

  // Initialize connection immediately to mirror existing behavior
  connect()

  return {
    disconnect,
    reconnect: connect,
    isConnected: () => es?.readyState === EventSource.OPEN,
  }
}
