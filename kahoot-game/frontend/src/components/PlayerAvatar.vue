<template>
  <div 
    class="player-avatar"
    :class="[
      sizeClass,
      {
        'ring-2 ring-green-400': isOnline,
        'ring-2 ring-red-400': !isOnline,
        'ring-4 ring-yellow-400': isHost
      }
    ]"
  >
    <div 
      class="avatar-background"
      :style="{ background: avatarGradient }"
    >
      <span class="avatar-text" :class="textSizeClass">
        {{ displayText }}
      </span>
    </div>
    
    <!-- 狀態指示器 -->
    <div 
      v-if="showStatus"
      class="status-indicator"
      :class="[
        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
        isOnline ? 'bg-green-400' : 'bg-red-400'
      ]"
    ></div>
    
    <!-- 主持人徽章 -->
    <div 
      v-if="isHost"
      class="host-badge absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
    >
      👑
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  isOnline?: boolean
  isHost?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  customColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOnline: true,
  isHost: false,
  size: 'md',
  showStatus: true
})

// 計算屬性
const displayText = computed(() => {
  return props.name.charAt(0).toUpperCase()
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const textSizeClass = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  }
  return sizes[props.size]
})

const avatarGradient = computed(() => {
  if (props.customColor) {
    return props.customColor
  }
  
  // 根據名字生成一致的顏色
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ]
  
  const nameHash = props.name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  return colors[nameHash % colors.length]
})
</script>

<style scoped>
.player-avatar {
  @apply relative inline-block rounded-full;
}

.avatar-background {
  @apply w-full h-full rounded-full flex items-center justify-center;
}

.avatar-text {
  @apply text-white font-bold;
}

.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .7;
  }
}
</style>