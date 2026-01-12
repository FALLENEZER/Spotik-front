<template>
  <div class="track-queue">
    <div v-if="items.length === 0" class="empty-queue">
      <p>Очередь пуста. Добавьте первый трек!</p>
    </div>
    <div v-else class="tracks-list">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="track-item"
        :class="{ 'current': index === 0 }"
      >
        <div class="track-number">{{ index + 1 }}</div>
        <div class="track-details">
          <div class="track-name">{{ item.track.name }}</div>
          <div class="track-meta">
            <span class="track-artist">{{ item.track.artist }}</span>
            <span class="track-added-by" v-if="item.addedBy">Добавил: {{ item.addedBy.name }}</span>
          </div>
        </div>
        <div class="track-actions">
          <div class="votes">
            <button
              @click="handleVote(item.id, 'up')"
              class="vote-button up"
              title="Голосовать за"
            >
              ▲
            </button>
            <span class="vote-count">{{ item.votes }}</span>
            <button
              @click="handleVote(item.id, 'down')"
              class="vote-button down"
              title="Голосовать против"
            >
              ▼
            </button>
          </div>
          <button
            @click="handleRemove(item.id)"
            class="remove-button"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QueueItem } from '../types'

defineProps<{
  items: QueueItem[]
}>()

const emit = defineEmits<{
  removeTrack: [queueItemId: string]
  voteTrack: [queueItemId: string, vote: 'up' | 'down']
}>()

function handleRemove(queueItemId: string) {
  if (confirm('Удалить трек из очереди?')) {
    emit('removeTrack', queueItemId)
  }
}

function handleVote(queueItemId: string, vote: 'up' | 'down') {
  emit('voteTrack', queueItemId, vote)
}
</script>

<style scoped>
.track-queue {
  width: 100%;
}

.empty-queue {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s;
}

.track-item:hover {
  background: #f3f4f6;
}

.track-item.current {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 2px solid #667eea;
}

.track-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  flex-shrink: 0;
}

.track-item.current .track-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.track-details {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 0.9375rem;
}

.track-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #6b7280;
}

.track-artist {
  font-weight: 500;
}

.track-added-by {
  color: #9ca3af;
}

.track-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.votes {
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.vote-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #6b7280;
  padding: 2px 4px;
  transition: color 0.2s;
  line-height: 1;
}

.vote-button:hover {
  color: #667eea;
}

.vote-button.up:hover {
  color: #10b981;
}

.vote-button.down:hover {
  color: #ef4444;
}

.vote-count {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  min-width: 20px;
  text-align: center;
}

.remove-button {
  width: 32px;
  height: 32px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.remove-button:hover {
  background: #fecaca;
}
</style>

