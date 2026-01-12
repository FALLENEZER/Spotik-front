<template>
  <div class="add-track-form">
    <h3 class="form-title">Добавить трек</h3>
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="track-id">Track ID (iTunes)</label>
        <input
          id="track-id"
          type="text"
          placeholder="Например: 123456789"
          v-model="trackId"
          required
        />
      </div>
      <button type="submit" class="submit-button" :disabled="isSubmitting">
        {{ isSubmitting ? 'Добавление...' : 'Добавить в очередь' }}
      </button>
    </form>

    <div class="divider">или</div>

    <h3 class="form-title">Загрузить свой MP3</h3>
    <form @submit.prevent="handleManualSubmit" class="form">
      <div class="form-group">
        <label for="path">Путь к файлу</label>
        <input id="path" type="text" v-model="manualTrack.path" placeholder="storage/music/song.mp3" required />
      </div>
      <div class="form-group">
        <label for="name">Название</label>
        <input id="name" type="text" v-model="manualTrack.name" placeholder="Название трека" required />
      </div>
      <div class="form-group">
        <label for="artist">Исполнитель</label>
        <input id="artist" type="text" v-model="manualTrack.artist" placeholder="Исполнитель" />
      </div>
      <div class="form-group">
        <label for="duration">Длительность (мс)</label>
        <input id="duration" type="number" v-model.number="manualTrack.duration" placeholder="300000" required />
      </div>
      <div class="form-group">
        <label for="imageUrl">URL обложки</label>
        <input id="imageUrl" type="text" v-model="manualTrack.imageUrl" placeholder="https://..." />
      </div>
      <button type="submit" class="submit-button secondary" :disabled="isSubmitting">
        Создать трек
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emit = defineEmits<{
  trackAdded: [trackId: string]
  manualTrackCreated: [trackData: {
    path: string
    name: string
    artist?: string
    imageUrl?: string
    duration: number
  }]
}>()

const trackId = ref('')
const isSubmitting = ref(false)

const manualTrack = reactive({
  path: '',
  name: '',
  artist: '',
  imageUrl: '',
  duration: 0
})

function handleSubmit() {
  if (!trackId.value) return

  isSubmitting.value = true
  emit('trackAdded', trackId.value)
  trackId.value = ''
  isSubmitting.value = false
}

function handleManualSubmit() {
  if (!manualTrack.path || !manualTrack.name || !manualTrack.duration) return

  isSubmitting.value = true
  emit('manualTrackCreated', { ...manualTrack })

  // Сброс
  manualTrack.path = ''
  manualTrack.name = ''
  manualTrack.artist = ''
  manualTrack.imageUrl = ''
  manualTrack.duration = 0
  isSubmitting.value = false
}
</script>

<style scoped>
.add-track-form {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-title {
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.divider {
  text-align: center;
  margin: 24px 0;
  color: #9ca3af;
  position: relative;
}

.divider::before, .divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e5e7eb;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.submit-button {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 4px;
}

.submit-button.secondary {
  background: #1f2937;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>


