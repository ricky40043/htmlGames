import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 載入狀態
  const isLoading = ref(false)
  const loadingText = ref('載入中...')

  // 消息提示
  const errorMessage = ref('')
  const successMessage = ref('')
  const infoMessage = ref('')

  // 自動清除計時器
  let errorTimer: NodeJS.Timeout | null = null
  let successTimer: NodeJS.Timeout | null = null
  let infoTimer: NodeJS.Timeout | null = null

  // 設置載入狀態
  const setLoading = (loading: boolean, text = '載入中...') => {
    isLoading.value = loading
    loadingText.value = text
  }

  // 顯示錯誤消息
  const showError = (message: string, duration = 5000) => {
    errorMessage.value = message
    
    if (errorTimer) {
      clearTimeout(errorTimer)
    }
    
    if (duration > 0) {
      errorTimer = setTimeout(() => {
        errorMessage.value = ''
      }, duration)
    }
  }

  // 顯示成功消息
  const showSuccess = (message: string, duration = 3000) => {
    successMessage.value = message
    
    if (successTimer) {
      clearTimeout(successTimer)
    }
    
    if (duration > 0) {
      successTimer = setTimeout(() => {
        successMessage.value = ''
      }, duration)
    }
  }

  // 顯示信息消息
  const showInfo = (message: string, duration = 3000) => {
    infoMessage.value = message
    
    if (infoTimer) {
      clearTimeout(infoTimer)
    }
    
    if (duration > 0) {
      infoTimer = setTimeout(() => {
        infoMessage.value = ''
      }, duration)
    }
  }

  // 顯示警告消息
  const showWarning = (message: string, duration = 4000) => {
    errorMessage.value = message
    
    if (errorTimer) {
      clearTimeout(errorTimer)
    }
    
    if (duration > 0) {
      errorTimer = setTimeout(() => {
        errorMessage.value = ''
      }, duration)
    }
  }

  // 清除錯誤消息
  const clearError = () => {
    errorMessage.value = ''
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }
  }

  // 清除成功消息
  const clearSuccess = () => {
    successMessage.value = ''
    if (successTimer) {
      clearTimeout(successTimer)
      successTimer = null
    }
  }

  // 清除信息消息
  const clearInfo = () => {
    infoMessage.value = ''
    if (infoTimer) {
      clearTimeout(infoTimer)
      infoTimer = null
    }
  }

  // 清除所有消息
  const clearAllMessages = () => {
    clearError()
    clearSuccess()
    clearInfo()
  }

  return {
    // 狀態
    isLoading,
    loadingText,
    errorMessage,
    successMessage,
    infoMessage,

    // 動作
    setLoading,
    showError,
    showSuccess,
    showInfo,
    showWarning,
    clearError,
    clearSuccess,
    clearInfo,
    clearAllMessages
  }
})