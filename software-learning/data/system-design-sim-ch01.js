(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });

  window.SYSTEM_DESIGN_SIM['sd-book-01'] = {
    chapterId: 'sd-book-01',
    title: '電商網站生存戰：從一台主機到雙 11',
    subtitle: '你從一台單機架站的電商網站開始。12 個月內，同時上線人數會從 1,000 成長到超過百萬，中間會遇到促銷尖峰、熱門商品打爆資料庫、機房停電壞掉好幾台伺服器、登入被強制登出，最後在雙 11 迎來全年最大的一次考驗。',
    briefing: [
      '這不是要你寫負載平衡演算法或一致性雜湊，而是練習「先加哪個架構能力」的判斷——跟第 1 章討論的每一次擴展完全對應。',
      '每個月你可以開關任何架構能力；開著會持續消耗「營運效率」分數，但能在對應事件發生時保護「可用率」與「使用者體驗」。',
      '12 個月後會依可用率、使用者體驗、營運效率算出總評，並逐一列出每個事件「你當時有沒有準備」。'
    ],
    months: 12,
    uptimeLabel: '可用率 Uptime',
    qoeLabel: '使用者體驗 UX',
    viewersLabel: '目前尖峰同時上線人數估計',
    demoLabels: { watch: '▶ 模擬使用者瀏覽商品', upload: '🛒 模擬下單結帳' },
    viewersAtMonth: m => Math.round(1000 * Math.pow(1.85, m)),
    components: [
      {
        id: 'loadBalancer',
        name: 'Load Balancer ＋ 多台 App Server',
        shortName: '負載平衡',
        cost: 2,
        desc: '流量進來先經過健康檢查後的負載平衡器，可以加開多台 App Server 分攤流量，單台掛掉也能自動退出服務名單。',
        ...ref('sd1-s04-p01')
      },
      {
        id: 'dbReplica',
        name: '資料庫讀取複本',
        shortName: 'DB 讀取複本',
        cost: 2,
        desc: '把大量重複的讀取查詢分攤到 Replica，主資料庫只承擔寫入與少數即時性要求高的讀取。',
        ...ref('sd1-s05-p02')
      },
      {
        id: 'appCache',
        name: '應用快取層',
        shortName: '快取層',
        cost: 1,
        desc: '熱門商品頁、促銷資訊等高頻讀取資料先查快取，設定合理存留時間，大幅降低回源資料庫的次數。',
        ...ref('sd1-s06-p01')
      },
      {
        id: 'cdn',
        name: 'CDN 靜態內容加速',
        shortName: 'CDN',
        cost: 2,
        desc: '商品圖片、影片、前端靜態資源改從 CDN Edge 回應，不必每次都從 Origin 傳送，也保護了 Origin 頻寬。',
        ...ref('sd1-s07-p01')
      },
      {
        id: 'statelessSession',
        name: '無狀態 Web Tier',
        shortName: '無狀態設計',
        cost: 1,
        desc: '登入狀態與購物車存到共用的 Session Store，而不是綁在單一 App Server 的記憶體，任何健康節點都能接手使用者的請求。',
        ...ref('sd1-s08-p02')
      },
      {
        id: 'multiRegion',
        name: '跨機房備援',
        shortName: '跨機房備援',
        cost: 4,
        desc: '在另一個機房或區域維持可以隨時接手流量的備援環境，單一機房整個離線時還能繼續服務。',
        ...ref('sd1-s09-p01')
      }
    ],
    topology: {
      viewBox: '0 0 900 460',
      nodes: [
        { id: 'users', kind: 'user', label: '顧客', x: 80, y: 250 },
        { id: 'cdn', kind: 'component', componentId: 'cdn', label: 'CDN', x: 280, y: 110 },
        { id: 'loadBalancer', kind: 'component', componentId: 'loadBalancer', label: 'Load Balancer', x: 280, y: 250 },
        { id: 'multiRegion', kind: 'component', componentId: 'multiRegion', label: '備援機房', x: 280, y: 400, region: '備援區域' },
        { id: 'appServer', kind: 'fixed', label: 'App Server 群', x: 500, y: 250 },
        { id: 'appCache', kind: 'component', componentId: 'appCache', label: '應用快取', x: 500, y: 110 },
        { id: 'statelessSession', kind: 'component', componentId: 'statelessSession', label: '共用 Session Store', x: 500, y: 400 },
        { id: 'dbPrimary', kind: 'fixed', label: '主資料庫', x: 720, y: 250 },
        { id: 'dbReplica', kind: 'component', componentId: 'dbReplica', label: 'DB 讀取複本', x: 720, y: 110 }
      ],
      edges: [
        { from: 'users', to: 'cdn' },
        { from: 'cdn', to: 'loadBalancer' },
        { from: 'loadBalancer', to: 'appServer' },
        { from: 'loadBalancer', to: 'multiRegion', requiresComponent: 'multiRegion' },
        { from: 'appServer', to: 'appCache', kind: 'stub', requiresComponent: 'appCache' },
        { from: 'appServer', to: 'statelessSession', kind: 'stub', requiresComponent: 'statelessSession' },
        { from: 'appServer', to: 'dbPrimary' },
        { from: 'dbPrimary', to: 'dbReplica', requiresComponent: 'dbReplica' }
      ],
      computeFlow: (kind, active) => {
        if (kind === 'upload') return ['users', 'cdn', 'loadBalancer', 'appServer', 'dbPrimary'];
        if (active.has('appCache')) return ['users', 'cdn', 'loadBalancer', 'appServer'];
        return ['users', 'cdn', 'loadBalancer', 'appServer', 'dbPrimary', 'appServer'];
      }
    },
    events: [
      {
        month: 2,
        id: 'flashSale',
        title: '週年慶促銷開賣，流量瞬間暴增',
        relevantComponents: ['loadBalancer'],
        demoFlow: ['users', 'cdn', 'loadBalancer', 'appServer'],
        narrative: '促銷一開賣，同時湧入的使用者是平常的 10 倍，全部打在同一台 App Server 上。',
        resolve: active => {
          if (active.has('loadBalancer')) {
            return { uptime: 0, qoe: -1, log: '流量被分配到多台健康的 App Server，尖峰只讓回應稍微變慢，沒有人連不上網站。', ok: true };
          }
          return { uptime: -12, qoe: -14, log: '單一伺服器被打爆，大量使用者連結逾時或直接看到錯誤頁，促銷開賣的黃金 10 分鐘幾乎沒能成交。', ok: false };
        }
      },
      {
        month: 4,
        id: 'hotProduct',
        title: '爆款商品頁被瘋狂重複查詢',
        relevantComponents: ['appCache', 'dbReplica'],
        demoFlow: ['users', 'cdn', 'loadBalancer', 'appServer', 'appCache'],
        narrative: '一支影片帶貨讓同一個商品頁被數十萬次重複查詢，資料庫的讀取壓力瞬間暴增。',
        resolve: active => {
          const hasReplica = active.has('dbReplica');
          const hasCache = active.has('appCache');
          if (hasCache) {
            return { uptime: 0, qoe: 0, log: '重複查詢幾乎都被快取擋下，資料庫幾乎沒感覺到這波流量。', ok: true };
          }
          if (hasReplica) {
            return { uptime: -2, qoe: -5, log: '沒有快取，但讀取複本分攤了大部分查詢，主資料庫仍撐得住，只是回應變慢。', ok: false };
          }
          return { uptime: -8, qoe: -16, log: '所有查詢都打在唯一一台資料庫上，商品頁大量逾時，連帶拖慢了結帳流程。', ok: false };
        }
      },
      {
        month: 6,
        id: 'powerOutage',
        title: '機房電力設施故障，壞了 3 台伺服器',
        relevantComponents: ['multiRegion', 'loadBalancer'],
        demoFlow: ['users', 'loadBalancer', 'multiRegion'],
        narrative: '機房的電力設施半夜故障，同時有 3 台 App Server 直接離線，且在天亮前都無法修復。',
        resolve: active => {
          const hasLB = active.has('loadBalancer');
          const hasRegion = active.has('multiRegion');
          if (hasRegion) {
            return { uptime: -1, qoe: 0, log: '流量被切到另一個機房，壞掉的 3 台伺服器完全沒有影響到對外服務。', ok: true };
          }
          if (hasLB) {
            return { uptime: -6, qoe: -4, log: '健康檢查很快把壞掉的 3 台移出服務名單，剩下的伺服器撐住了流量，只是尖峰時段明顯變慢。', ok: false };
          }
          return { uptime: -24, qoe: -10, log: '沒有備援機制可以繞開壞掉的伺服器，整個晚上網站時好時壞，天亮前幾乎等於停擺。', ok: false };
        }
      },
      {
        month: 8,
        id: 'sessionDrop',
        title: '擴容時使用者被強制登出',
        relevantComponents: ['statelessSession'],
        demoFlow: ['users', 'loadBalancer', 'appServer', 'statelessSession'],
        narrative: '為了應付成長中的流量而加開新的 App Server 並重新調整部署，過程中有伺服器被替換掉。',
        resolve: active => {
          if (active.has('statelessSession')) {
            return { qoe: 0, uptime: 0, log: '登入狀態與購物車都存在共用的 Session Store，換到哪一台伺服器使用者完全無感。', ok: true };
          }
          return { qoe: -12, uptime: -1, log: '登入狀態綁在被替換掉的那台伺服器記憶體裡，大量使用者被強制登出，購物車也跟著清空，社群上開始出現抱怨。', ok: false };
        }
      },
      {
        month: 10,
        id: 'bandwidthSpike',
        title: '行銷活動帶來大量圖片與影片流量',
        relevantComponents: ['cdn'],
        demoFlow: ['users', 'cdn'],
        narrative: '新一波行銷活動大量使用商品影片與高解析圖片，Origin 的頻寬帳單與延遲同時飆高。',
        resolve: active => {
          if (active.has('cdn')) {
            return { qoe: 0, uptime: 0, log: '圖片與影片幾乎都從離使用者最近的 CDN Edge 回應，Origin 幾乎沒感覺到這波流量。', ok: true };
          }
          return { qoe: -7, uptime: 0, log: 'Origin 頻寬被大量圖片影片流量占滿，頁面載入明顯變慢，尤其是行動網路的使用者感受最明顯。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '雙 11：促銷、直播帶貨、機房電力不穩三重疊加',
        relevantComponents: ['loadBalancer', 'dbReplica', 'cdn'],
        demoFlow: ['users', 'cdn', 'loadBalancer', 'appServer', 'dbReplica'],
        narrative: '全年最大檔期：促銷流量、直播帶貨的商品頁查詢、加上機房電力還沒完全修好，三個壓力同時出現在同一個晚上。',
        resolve: active => {
          const shields = ['loadBalancer', 'dbReplica', 'cdn'].filter(id => active.has(id)).length;
          const table = {
            3: { uptime: 1, qoe: 1, log: '三道防線都到位：負載平衡吸收下單尖峰、讀取複本扛住商品頁查詢、CDN 擋住圖片影片流量。全站平穩撐過雙 11 當晚。', ok: true },
            2: { uptime: -7, qoe: -7, log: '大部分流量被擋住，但缺的那一環仍造成明顯降級，結帳或頁面載入其中一項變得很慢。', ok: false },
            1: { uptime: -18, qoe: -16, log: '只有一道防線，撐不住三個壓力疊加，晚上尖峰時段多次出現明顯降級與間歇性錯誤。', ok: false },
            0: { uptime: -32, qoe: -28, log: '完全沒有防線，網站在全年流量最高的雙 11 當晚直接被打垮，錯過了最重要的一次業績機會。', ok: false }
          };
          return table[shields];
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你在成本、可用率與使用者體驗之間做出了非常成熟的取捨，從單機一路撐到雙 11 都沒有出過大事故。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '網站撐過了這一年，但至少有一次事件造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，網站撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件中直接被打垮，回教材重新想一次每個能力真正解決的問題，再挑戰一次。' };
    }
  };
})();
