<template>
  <div class="not-found-view min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- 錯誤圖示 -->
      <div class="mb-8 fade-in">
        <div class="text-8xl mb-4">🎮</div>
        <div class="text-6xl font-bold text-white mb-4">404</div>
        <h1 class="text-2xl font-bold text-white mb-2">頁面走失了</h1>
        <p class="text-white/70 text-lg">
          看起來這個頁面去玩捉迷藏了...
        </p>
      </div>

      <!-- 動作按鈕 -->
      <div class="space-y-4 slide-in">
        <router-link to="/" class="block btn btn-primary text-lg py-4">
          <span class="flex items-center justify-center">
            <span class="text-xl mr-2">🏠</span>
            回到主頁
          </span>
        </router-link>

        <button 
          @click="goBack"
          class="block w-full btn btn-outline text-lg py-4"
        >
          <span class="flex items-center justify-center">
            <span class="text-xl mr-2">⬅️</span>
            返回上一頁
          </span>
        </button>
      </div>

      <!-- 建議 -->
      <div class="mt-8 fade-in" style="animation-delay: 0.5s">
        <div class="card card-body">
          <h3 class="text-white font-semibold mb-3">您可能想要：</h3>
          <div class="space-y-2 text-sm">
            <router-link 
              to="/create"
              class="block text-white/80 hover:text-white transition-colors p-2 rounded hover:bg-white/10"
            >
              🏠 創建新房間
            </router-link>
            <router-link 
              to="/join"
              class="block text-white/80 hover:text-white transition-colors p-2 rounded hover:bg-white/10"
            >
              🚪 加入遊戲房間
            </router-link>
            <router-link 
              to="/about"
              class="block text-white/80 hover:text-white transition-colors p-2 rounded hover:bg-white/10"
            >
              ℹ️ 了解遊戲規則
            </router-link>
          </div>
        </div>
      </div>

      <!-- 錯誤代碼 -->
      <div class="mt-6 text-center">
        <p class="text-white/50 text-sm">
          錯誤代碼: PAGE_NOT_FOUND
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

.slide-in {
  animation: slideIn 0.6s ease-out;
}
</style>