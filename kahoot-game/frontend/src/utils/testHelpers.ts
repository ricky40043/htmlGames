// 測試輔助工具

export interface TestPlayer {
  id: string
  name: string
  isHost: boolean
}

export interface TestRoom {
  id: string
  hostName: string
  players: TestPlayer[]
}

// 生成測試房間代碼
export function generateTestRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成測試玩家名稱
export function generateTestPlayerName(index?: number): string {
  const names = [
    '測試玩家1', '測試玩家2', '測試玩家3', '測試玩家4', '測試玩家5',
    '小明', '小華', '小美', '小強', '小王',
    'Alice', 'Bob', 'Charlie', 'David', 'Eva'
  ]
  
  if (index !== undefined && index < names.length) {
    return names[index]
  }
  
  return names[Math.floor(Math.random() * names.length)]
}

// 模擬 WebSocket 訊息
export function createMockWebSocketMessage(type: string, data: any) {
  return {
    type,
    data,
    timestamp: new Date().toISOString()
  }
}

// 測試用題目
export function getTestQuestions() {
  return [
    {
      id: 1,
      questionText: '測試題目：台灣最高的山是？',
      optionA: '玉山',
      optionB: '雪山',
      optionC: '大霸尖山',
      optionD: '合歡山',
      correctAnswer: 'A',
      explanation: '玉山海拔3952公尺，是台灣最高峰',
      category: '地理',
      difficulty: 1
    },
    {
      id: 2,
      questionText: '測試題目：一年有幾個季節？',
      optionA: '2個',
      optionB: '3個',
      optionC: '4個',
      optionD: '5個',
      correctAnswer: 'C',
      explanation: '春夏秋冬四個季節',
      category: '常識',
      difficulty: 1
    },
    {
      id: 3,
      questionText: '測試題目：以下哪個不是程式語言？',
      optionA: 'Python',
      optionB: 'Java',
      optionC: 'HTML',
      optionD: 'JavaScript',
      correctAnswer: 'C',
      explanation: 'HTML是標記語言，不是程式語言',
      category: '資訊',
      difficulty: 2
    }
  ]
}

// 模擬 API 延遲
export function mockApiDelay(min = 500, max = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

// 測試用分數計算
export function calculateTestScore(
  isCorrect: boolean, 
  timeLeft: number, 
  isHost: boolean = false
): number {
  const baseScore = isCorrect ? 100 : 0
  const speedBonus = isCorrect ? Math.round(timeLeft * 2) : 0
  const hostBonus = (isHost && isCorrect) ? 50 : 0
  return baseScore + speedBonus + hostBonus
}

// 驗證房間代碼格式
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomId)
}

// 驗證玩家名稱
export function isValidPlayerName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 20
}

// 模擬網路錯誤
export function simulateNetworkError(probability = 0.1): boolean {
  return Math.random() < probability
}

// 效能測試輔助
export class PerformanceTestHelper {
  private startTime: number = 0
  private measurements: { [key: string]: number } = {}

  start(label: string = 'default') {
    this.startTime = performance.now()
    this.measurements[label + '_start'] = this.startTime
  }

  end(label: string = 'default'): number {
    const endTime = performance.now()
    const duration = endTime - (this.measurements[label + '_start'] || this.startTime)
    this.measurements[label + '_duration'] = duration
    return duration
  }

  getReport(): { [key: string]: number } {
    return { ...this.measurements }
  }

  clear() {
    this.measurements = {}
    this.startTime = 0
  }
}

// 本地儲存測試輔助
export class LocalStorageTestHelper {
  static save(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('LocalStorage save failed:', error)
      return false
    }
  }

  static load(key: string) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('LocalStorage load failed:', error)
      return null
    }
  }

  static clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('LocalStorage clear failed:', error)
      return false
    }
  }
}

// 測試報告生成器
export class TestReporter {
  private results: Array<{
    name: string
    status: 'pass' | 'fail' | 'skip'
    message?: string
    duration?: number
  }> = []

  addResult(name: string, status: 'pass' | 'fail' | 'skip', message?: string, duration?: number) {
    this.results.push({ name, status, message, duration })
  }

  generateReport(): string {
    const total = this.results.length
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length

    let report = `\n📊 測試報告\n`
    report += `=================\n`
    report += `總計: ${total} | 通過: ${passed} | 失敗: ${failed} | 跳過: ${skipped}\n`
    report += `成功率: ${total > 0 ? Math.round((passed / total) * 100) : 0}%\n\n`

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
      report += `${icon} ${result.name}`
      if (result.duration) {
        report += ` (${result.duration.toFixed(2)}ms)`
      }
      if (result.message) {
        report += ` - ${result.message}`
      }
      report += '\n'
    })

    return report
  }

  clear() {
    this.results = []
  }
}

// 匯出全域測試實例
export const testReporter = new TestReporter()
export const performanceHelper = new PerformanceTestHelper()