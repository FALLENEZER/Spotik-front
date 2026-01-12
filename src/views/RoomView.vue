<template>
  <div class="room-container">
    <div class="room-header">
      <div class="room-info">
        <h1 class="room-title">{{ currentRoom?.name || 'Комната' }}</h1>
        <p class="room-subtitle">Участников: {{ participants.length }}</p>
      </div>
      <button @click="handleLogout" class="logout-button">Выйти</button>
    </div>

    <div class="room-content">
      <div class="main-section">
        <div class="player-section">
          <div class="current-track" v-if="currentTrack">
            <div class="track-info">
              <h3 class="track-title">{{ currentTrack.track.name }}</h3>
              <p class="track-artist">{{ currentTrack.track.artist }}</p>
            </div>
            <div class="playback-controls">
              <button @click="togglePlayback" class="play-button" :class="{ playing: isPlaying }">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
            </div>
          </div>
          <div class="no-track" v-else>
            <p>Нет активного трека</p>
          </div>
        </div>

        <AddTrackForm @track-added="handleTrackAdded" @manual-track-created="handleManualTrackCreated" />

        <div class="queue-section">
          <h2 class="section-title">Очередь треков</h2>
          <TrackQueue
            :items="queue"
            @remove-track="handleRemoveTrack"
            @vote-track="handleVoteTrack"
          />
        </div>
      </div>

      <div class="sidebar">
        <div class="participants-section">
          <h3 class="sidebar-title">Участники</h3>
          <div class="participants-list">
            <div v-for="participant in participants" :key="participant.id" class="participant-item">
              <div class="participant-avatar">
                {{ participantDisplayName(participant).charAt(0).toUpperCase() }}
              </div>
              <span class="participant-name">{{ participantDisplayName(participant) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRoomStore } from '../stores/room'
import AddTrackForm from '../components/AddTrackForm.vue'
import TrackQueue from '../components/TrackQueue.vue'

const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()

const currentRoom = computed(() => roomStore.currentRoom)
const queue = computed(() => roomStore.queue)
const participants = computed(() => roomStore.participants)
const currentTrack = computed(() => roomStore.currentTrack)
const isPlaying = computed(() => roomStore.isPlaying)

function participantDisplayName(user: { name?: string; username?: string; email?: string }) {
  return user.name || user.username || user.email || '—'
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Если комната не выбрана, показываем список комнат или создаем новую
  if (!currentRoom.value) {
    await loadOrCreateRoom()
  }
})

async function loadOrCreateRoom() {
  try {
    // Пытаемся получить список комнат
    const rooms = await roomStore.listRooms()
    if (rooms && rooms.length > 0) {
      // Присоединяемся к первой доступной комнате
      const result = await roomStore.joinRoom(rooms[0].id)
      if (!result.success) {
        // Если не удалось присоединиться, создаем новую комнату
        await createNewRoom()
      }
    } else {
      // Если комнат нет, создаем новую
      await createNewRoom()
    }
  } catch (error) {
    // Если не удалось получить список, создаем новую комнату
    console.warn('Не удалось получить список комнат, создаем новую:', error)
    await createNewRoom()
  }
}

async function createNewRoom() {
  const roomName = `Комната ${authStore.user?.name || 'Пользователя'}`
  try {
    const result = await roomStore.createRoom({ name: roomName, isPublic: true })
    if (result.success && result.room) {
      const joinResult = await roomStore.joinRoom(result.room.id)
      if (!joinResult.success) {
        alert(joinResult.error || 'Не удалось присоединиться к созданной комнате')
      }
    } else {
      alert(result.error || 'Не удалось создать комнату')
    }
  } catch (error) {
    console.error('Ошибка создания комнаты:', error)
    alert('Не удалось создать комнату. Попробуйте позже.')
  }
}

onUnmounted(() => {
  roomStore.leaveRoom()
})

function handleLogout() {
  authStore.logout()
  roomStore.leaveRoom()
  router.push('/login')
}

function togglePlayback() {
  // В MVP это заглушка, реальная логика будет на бэкенде
  console.log('Toggle playback')
}

async function handleTrackAdded(trackId: string) {
  const result = await roomStore.addTrack(trackId)
  if (!result.success) {
    alert(result.error || 'Ошибка добавления трека')
  }
}

async function handleManualTrackCreated(trackData: {
  path: string
  name: string
  artist?: string
  imageUrl?: string
  duration: number
}) {
  const result = await roomStore.createManualTrack(trackData)
  if (!result.success) {
    alert(result.error || 'Ошибка создания трека')
  } else {
    alert('Трек создан! Теперь его можно добавить в очередь по ID (если бэк поддерживает) или он появится в каталоге.')
  }
}

async function handleRemoveTrack(queueItemId: string) {
  const result = await roomStore.removeTrack(queueItemId)
  if (!result.success) {
    alert(result.error || 'Ошибка удаления трека')
  }
}

async function handleVoteTrack(queueItemId: string, vote: 'up' | 'down') {
  const result = await roomStore.voteTrack(queueItemId, vote)
  if (!result.success) {
    alert(result.error || 'Ошибка голосования')
  }
}
</script>

<style scoped>
.room-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 32px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.room-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.room-subtitle {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.logout-button {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-button:hover {
  background: #dc2626;
}

.room-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.main-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.player-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.current-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-info {
  flex: 1;
}

.track-title {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.track-artist {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.playback-controls {
  display: flex;
  gap: 12px;
}

.play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.play-button:hover {
  transform: scale(1.1);
}

.no-track {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
}

.queue-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.participants-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.participant-name {
  color: #374151;
  font-size: 0.875rem;
}

@media (max-width: 1024px) {
  .room-content {
    grid-template-columns: 1fr;
  }
}
</style>
