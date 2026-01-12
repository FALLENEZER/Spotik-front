import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Room, User, QueueItem } from '@/types'
import { roomApi, trackApi } from '../services/api'
import { useMercure } from '../services/mercure'
import { useAuthStore } from './auth'

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref<Room | null>(null)
  const queue = ref<QueueItem[]>([])
  const participants = ref<User[]>([])
  const currentTrack = ref<QueueItem | null>(null)
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let rt: ReturnType<typeof useMercure> | null = null

  function connectWebSocket(roomId: string) {
    if (rt) {
      rt.disconnect()
    }
    rt = useMercure(roomId, {
      onQueueUpdate: (items: QueueItem[]) => {
        queue.value = items
      },
      onTrackAdded: (item: QueueItem) => {
        queue.value.push(item)
      },
      onTrackRemoved: (queueItemId: string) => {
        queue.value = queue.value.filter((t) => t.id !== queueItemId)
      },
      onVoteUpdate: (queueItemId: string, votes: number) => {
        const item = queue.value.find((t) => t.id === queueItemId)
        if (item) {
          item.votes = votes
        }
      },
      onParticipantJoined: (user: User) => {
        if (!participants.value.find((p) => p.id === user.id)) {
          participants.value.push(user)
        }
      },
      onParticipantLeft: (userId: string) => {
        participants.value = participants.value.filter((p) => p.id !== userId)
      },
      onCurrentTrackChanged: (item: QueueItem | null) => {
        currentTrack.value = item
      },
      onPlaybackStateChanged: (playing: boolean) => {
        isPlaying.value = playing
      },
    })
  }

  function disconnectWebSocket() {
    if (rt) {
      rt.disconnect()
      rt = null
    }
  }

  function normalizeRoom(room: any): Room {
    const normalizedQueue: QueueItem[] = room.queue ?? room.tracks ?? []
    const normalizedParticipants: User[] = room.participants ?? room.users ?? room.members ?? []

    return {
      ...room,
      queue: normalizedQueue,
      participants: normalizedParticipants,
      currentTrack: room.currentTrack ?? room.current_track ?? null,
    } as Room
  }

  async function listRooms(): Promise<Room[]> {
    try {
      const rooms = await roomApi.listRooms()
      return rooms.map(normalizeRoom)
    } catch (err: unknown) {
      console.error('Ошибка получения списка комнат:', err)
      return []
    }
  }

  async function createRoom(roomData: { name: string; isPublic?: boolean }): Promise<{ success: boolean; room?: Room; error?: string }> {
    isLoading.value = true
    error.value = null
    try {
      const rawRoom = await roomApi.createRoom(roomData)
      const room = normalizeRoom(rawRoom)
      return { success: true, room }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания комнаты'
      error.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  async function joinRoom(roomId: string) {
    isLoading.value = true
    error.value = null
    try {
      const rawRoom = await roomApi.joinRoom(roomId)
      const room = normalizeRoom(rawRoom)
      currentRoom.value = room
      queue.value = room.queue || []
      // Убеждаемся, что участники загружены
      participants.value = room.participants || []
      // Если участников нет в ответе, но есть owner, добавляем его
      if (participants.value.length === 0 && room.owner) {
        participants.value = [room.owner]
      }
      // Добавляем текущего пользователя, если его еще нет
      const authStore = useAuthStore()
      if (authStore.user && !participants.value.find(p => p.id === authStore.user?.id)) {
        participants.value.push(authStore.user)
      }
      currentTrack.value = room.currentTrack || null
      connectWebSocket(roomId)
      return { success: true }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка подключения к комнате'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function addTrack(trackId: string) {
    if (!currentRoom.value) return { success: false, error: 'Нет активной комнаты' }
    try {
      const queueItem = await roomApi.addTrack(currentRoom.value.id, trackId)
      // WebSocket обновит очередь автоматически
      return { success: true, queueItem }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка добавления трека'
      return { success: false, error: message }
    }
  }

  async function createManualTrack(trackData: {
    path: string
    name: string
    artist?: string
    imageUrl?: string
    duration: number
  }) {
    try {
      const track = await trackApi.createTrack(trackData)
      return { success: true, track }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания трека'
      return { success: false, error: message }
    }
  }

  async function removeTrack(queueItemId: string) {
    if (!currentRoom.value) return { success: false, error: 'Нет активной комнаты' }
    try {
      await roomApi.removeTrack(currentRoom.value.id, queueItemId)
      // WebSocket обновит очередь автоматически
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления трека'
      return { success: false, error: message }
    }
  }

  async function voteTrack(queueItemId: string, vote: 'up' | 'down') {
    if (!currentRoom.value) return { success: false, error: 'Нет активной комнаты' }
    try {
      await roomApi.voteTrack(currentRoom.value.id, queueItemId, vote)
      // WebSocket обновит голоса автоматически
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка голосования'
      return { success: false, error: message }
    }
  }

  async function leaveRoom() {
    if (currentRoom.value) {
      try {
        await roomApi.leaveRoom(currentRoom.value.id)
      } catch (err: unknown) {
        // Log error but continue with cleanup
        console.error('Error leaving room:', err)
      }
    }
    disconnectWebSocket()
    currentRoom.value = null
    queue.value = []
    participants.value = []
    currentTrack.value = null
    isPlaying.value = false
  }

  return {
    currentRoom,
    queue,
    participants,
    currentTrack,
    isPlaying,
    isLoading,
    error,
    listRooms,
    createRoom,
    joinRoom,
    addTrack,
    removeTrack,
    voteTrack,
    leaveRoom,
    createManualTrack,
  }
})
