import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types'
import { authApi } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Авторизован, если есть токен (user может быть null, если эндпоинт не работает)
  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const tokenString = await authApi.login(email, password)
      token.value = tokenString
      localStorage.setItem('token', tokenString)
      await fetchUser()
      return { success: true }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка входа'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      await authApi.register(username, email, password)
      // После регистрации не сохраняем токен - пользователь должен войти вручную
      // Очищаем токен на случай, если он был сохранен ранее
      token.value = null
      localStorage.removeItem('token')
      user.value = null
      return { success: true }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка регистрации'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      user.value = await authApi.getCurrentUser()
    } catch (err) {
      // Если не удалось получить пользователя (404, 400 и т.д.), 
      // не выходим автоматически - возможно, эндпоинт еще не реализован на бэкенде
      console.warn('Не удалось получить данные пользователя:', err)
      // Создаем временного пользователя на основе токена, если возможно
      // Или просто оставляем user = null, но не разлогиниваем
      // Не вызываем logout(), чтобы не разлогинивать пользователя
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  }
})
