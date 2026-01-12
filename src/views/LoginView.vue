<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Spotik</h1>
      <p class="subtitle">Совместное управление музыкой</p>

      <div class="tabs">
        <button :class="['tab', { active: isLogin }]" @click="isLogin = true">Вход</button>
        <button :class="['tab', { active: !isLogin }]" @click="isLogin = false">Регистрация</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <!-- Для входа запрашиваем email, для регистрации — имя пользователя -->
        <div class="form-group" v-if="isLogin">
          <label for="email-login">Email</label>
          <input
            id="email-login"
            type="email"
            placeholder="Введите email"
            v-model="email"
            required
          />
        </div>

        <div class="form-group" v-else>
          <label for="username">Имя пользователя</label>
          <input
            id="username"
            type="text"
            placeholder="Введите имя пользователя"
            v-model="username"
            required
          />
        </div>

        <!-- В регистрации дополнительно запрашиваем email -->
        <div class="form-group" v-if="!isLogin">
          <label for="email-register">Email</label>
          <input
            id="email-register"
            type="email"
            placeholder="Введите email"
            v-model="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            type="password"
            placeholder="Введите пароль"
            v-model="password"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          <span v-if="isLoading">Загрузка...</span>
          <span v-else>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')

const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

async function handleSubmit() {
  authStore.error = null

  let result
  if (isLogin.value) {
    // Для логина отправляем email + пароль
    result = await authStore.login(email.value, password.value)
  } else {
    result = await authStore.register(username.value, email.value, password.value)
  }

  if (result.success) {
    if (isLogin.value) {
      // После логина переходим на страницу выбора/создания комнаты
      router.push('/room')
    } else {
      // После регистрации очищаем форму и переключаемся на вкладку входа
      username.value = ''
      email.value = ''
      password.value = ''
      isLogin.value = true
      // Показываем сообщение об успешной регистрации
      alert('Регистрация успешна! Теперь вы можете войти.')
      // Принудительно обновляем роутер, чтобы убедиться, что мы на странице логина
      await router.push('/login')
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 32px 0;
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab:hover {
  color: #667eea;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  padding: 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
}

.submit-button {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  margin-top: 8px;
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
