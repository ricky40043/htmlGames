(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });
  const OFF = { id: 'off', label: '關閉', cost: 0 };

  // Component list, topology and events below are grounded directly in the book's own
  // "設計 YouTube" chapter — specifically its 高階設計 component diagrams (圖 14-3~14-6) and its
  // 錯誤處理 section, which lists exactly these failure/recovery pairs: Metadata DB Master/Slave
  // failover, stateless API server redundancy, task-worker reassignment, replicated metadata
  // cache, and (from 節省成本的最佳化做法) CDN-for-popular-content-only cost tiering, plus
  // (from 安全性最佳化) pre-signed upload URLs. Each resilience capability offers more than one
  // real strategy (not just on/off) — e.g. automatic vs manual DB failover — each with its own
  // cost and recovery characteristics, matching how the book frames the trade-off.
  window.SYSTEM_DESIGN_SIM['sd-book-14'] = {
    chapterId: 'sd-book-14',
    title: 'YouTube 生存戰：撐過爆紅的第一年',
    subtitle: '你接手一個剛起步的影片平台。12 個月內，使用者會從 5,000 成長到數百萬，中間會發生書裡「錯誤處理」一節列出的那些真實故障：資料庫 Master 當機、API 伺服器掛掉、轉檔工作程序卡死、快取節點失效。你在每個月初決定每個能力要用哪一種做法——事件發生時不能再改變主意，只能承擔當下選擇的後果。',
    briefing: [
      '每個能力不是只有開／關：點節點會循環切換不同做法，例如 Metadata 資料庫故障切換可以選「自動偵測＋選舉」或「人工手動切換」——做法不同，成本、復原時間、風險都不一樣。',
      '這些做法都對應書裡「錯誤處理」一節實際列出的情境，不是憑空發明的。',
      '每個月選的做法會持續消耗「營運效率」分數，但能在對應事件發生時保護「可用率」與「播放品質」；12 個月後會逐一列出每個事件「你當時選了哪個做法」。'
    ],
    months: 12,
    viewersLabel: '目前尖峰同時觀看人數估計',
    demoLabels: { watch: '▶ 模擬觀眾看一部影片', upload: '⬆ 模擬上傳一部影片' },
    viewersAtMonth: m => Math.round(5000 * Math.pow(1.62, m)),
    components: [
      {
        id: 'apiRedundancy',
        name: 'API 伺服器備援容量',
        shortName: 'API 備援',
        desc: 'API 伺服器是無狀態的，單台當機時負載平衡器能把流量導到其他伺服器——差別在於備援容量是「隨時待命」還是「當下才開」。',
        ...ref('sd14-s02-p01'),
        options: [
          OFF,
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, desc: '負載升高時自動開新機器，成本較低，但生效前這幾分鐘容量會偏緊。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, desc: '隨時有備援容量可以立即接手，幾乎無感，但平常就要多付這些機器的錢。' }
        ]
      },
      {
        id: 'dbMasterSlave',
        name: 'Metadata 資料庫 Master／Slave 複寫',
        shortName: 'DB 主從複寫',
        desc: 'Master 當機時需要有東西頂替——差別在於用自動選舉還是人工確認來完成這次切換。',
        ...ref('sd14-s04-p01'),
        options: [
          OFF,
          { id: 'manual', label: '人工手動切換（約 5 分鐘，但更可控）', cost: 1, desc: '需要人工確認才切換，恢復較慢，但避免自動系統誤判造成的腦裂風險。' },
          { id: 'auto', label: '自動故障轉移（偵測＋選舉，約 30 秒）', cost: 3, desc: '監控系統偵測 Master 無回應後自動選舉新 Master，中斷時間短，但需要額外的協調機制成本。' }
        ]
      },
      {
        id: 'cacheReplica',
        name: 'Metadata 快取多節點複寫',
        shortName: '快取複寫',
        desc: '快取資料複寫的節點數決定了能同時扛住幾個節點掛掉，也決定了成本。',
        ...ref('sd14-s02-p02'),
        options: [
          OFF,
          { id: 'replica2', label: '兩節點複寫', cost: 2, desc: '其中一個掛掉，另一個立刻頂上，多數情況夠用。' },
          { id: 'replica3Quorum', label: '三節點＋Quorum 讀寫', cost: 4, desc: '能同時扛住兩個節點掛掉，讀寫一致性也更好，但成本更高、協調也更複雜。' }
        ]
      },
      {
        id: 'transcodeResilience',
        name: '轉碼管線容錯',
        shortName: '轉碼容錯',
        desc: '任務工作程序當機時，任務排程器可以把工作重新指派給其他工作程序——差別在於重派後是「從頭重轉」還是「接著中斷點繼續」。',
        ...ref('sd14-s09-p01'),
        options: [
          OFF,
          { id: 'reassign', label: '偵測＋重新指派（從頭重轉）', cost: 2, desc: '換一個工作程序處理，但沒有進度紀錄，只能整個任務重來。' },
          { id: 'checkpointResume', label: '重新指派＋定期 Checkpoint', cost: 4, desc: '額外維護處理進度快照，換人接手後可以從中斷點繼續，幾乎不浪費已完成的工作。' }
        ]
      },
      {
        id: 'cdnPopularOnly',
        name: 'CDN 只服務熱門內容',
        shortName: 'CDN 分層',
        desc: '長尾、冷門的影片留在自己的伺服器提供服務，只有真正受歡迎的內容才進 CDN，避免幫幾乎沒人看的舊影片付高額 CDN 費用。',
        ...ref('sd14-s10-p03'),
        options: [OFF, { id: 'on', label: '依熱門程度分層', cost: -3, desc: '冷門內容不進 CDN，長期帳單明顯較低。' }]
      },
      {
        id: 'preSignedUpload',
        name: '預簽名網址直傳',
        shortName: '預簽名直傳',
        desc: '客戶端拿到預簽名網址後直接上傳到原始儲存系統，不必經過 API 伺服器中轉大檔案位元組，同時也更安全——只有授權使用者可以上傳。',
        ...ref('sd14-s11-p02'),
        options: [OFF, { id: 'on', label: '啟用直傳', cost: -1, desc: '省下 API 伺服器中轉大檔案的頻寬與運算成本。' }]
      },
      {
        id: 'resumableUpload',
        name: '斷點續傳 Upload Session',
        shortName: '斷點續傳',
        desc: '上傳中斷後能從已成功的位元組繼續，不必整份重傳一次 GB 等級的原始檔。',
        ...ref('sd14-s03-p01'),
        options: [OFF, { id: 'on', label: '啟用斷點續傳', cost: 1, desc: '維護 upload session 狀態需要一點額外成本，但能大幅減少大檔案重傳的浪費。' }]
      }
    ],
    topology: {
      viewBox: '0 0 900 460',
      nodes: [
        { id: 'users', kind: 'user', label: '觀眾', x: 80, y: 250, arriveLabel: '使用者裝置收到回應' },
        { id: 'cdn', kind: 'component', componentId: 'cdnPopularOnly', label: 'CDN', x: 300, y: 120, arriveLabel: '檢查熱門內容是否命中 Edge 快取' },
        { id: 'apiServer', kind: 'component', componentId: 'apiRedundancy', label: 'API 伺服器', x: 300, y: 250, arriveLabel: '驗證請求並決定下一步路由' },
        { id: 'transcodeArch', kind: 'component', componentId: 'transcodeResilience', label: '轉碼架構', x: 520, y: 250, arriveLabel: 'DAG 排程器指派任務給工作程序' },
        { id: 'storage', kind: 'fixed', label: '儲存系統', x: 740, y: 250, arriveLabel: '寫入或讀取原始／已轉碼影片' },
        { id: 'metadataCache', kind: 'component', componentId: 'cacheReplica', label: 'Metadata 快取', x: 740, y: 120, arriveLabel: '從 Metadata 快取節點取得資料' },
        { id: 'preSignedBadge', kind: 'component', componentId: 'preSignedUpload', label: '預簽名直傳', x: 420, y: 400, size: 'small', arriveLabel: '直接對原始儲存系統上傳，略過 API 伺服器' },
        { id: 'metadataDB', kind: 'component', componentId: 'dbMasterSlave', label: 'Metadata 資料庫', x: 620, y: 400, size: 'small', arriveLabel: '讀取或寫入 Metadata 資料庫' },
        { id: 'uploadBadge', kind: 'component', componentId: 'resumableUpload', label: '斷點續傳', x: 800, y: 340, size: 'small', arriveLabel: '檢查已成功的位元組位置' }
      ],
      edges: [
        { from: 'users', to: 'cdn' },
        { from: 'cdn', to: 'apiServer' },
        { from: 'apiServer', to: 'transcodeArch' },
        { from: 'transcodeArch', to: 'storage' },
        { from: 'storage', to: 'cdn' },
        { from: 'apiServer', to: 'metadataCache' },
        { from: 'users', to: 'preSignedBadge', kind: 'stub', requiresComponent: 'preSignedUpload' },
        { from: 'apiServer', to: 'metadataDB', kind: 'stub' },
        { from: 'storage', to: 'uploadBadge', kind: 'stub' }
      ],
      computeFlow: (kind, ctx) => {
        if (kind === 'upload') {
          return ctx.has('preSignedUpload')
            ? ['users', 'storage', 'transcodeArch', 'storage']
            : ['users', 'apiServer', 'storage', 'transcodeArch', 'storage'];
        }
        return ['users', 'cdn', 'storage', 'cdn', 'users'];
      }
    },
    chunkSim: {
      total: 6,
      resumeComponentId: 'resumableUpload',
      crashNodeId: 'storage',
      label: '一部 2GB 的影片原始檔',
      startLabel: '開始上傳這部影片'
    },
    events: [
      {
        month: 2,
        id: 'dbMasterDown',
        title: 'Metadata 主資料庫（Master）當機',
        relevantComponents: ['dbMasterSlave'],
        demoFlow: ['users', 'apiServer', 'metadataDB'],
        narrative: '負責寫入的 Metadata 資料庫 Master 節點突然離線，所有需要更新資料的操作都指向它。',
        resolve: ctx => {
          const choice = ctx.get('dbMasterSlave');
          if (choice === 'auto') return { uptime: -1, qoe: 0, log: '監控系統在約 30 秒內偵測並選出新 Master，寫入服務幾乎無縫恢復，觀眾沒有察覺。', ok: true };
          if (choice === 'manual') return { uptime: -6, qoe: -1, log: '需要人工確認才切換，大約 5 分鐘的寫入空窗——新影片發布跟觀看數更新暫時卡住，但沒有腦裂風險。', ok: true };
          return { uptime: -22, qoe: -4, log: '沒有可頂替的複本，所有需要寫入 Metadata 的操作全部卡住——新影片發布不了、觀看數也不會更新，直到有人手動處理。', ok: false };
        }
      },
      {
        month: 4,
        id: 'apiServerDown',
        title: '一台 API 伺服器當機',
        relevantComponents: ['apiRedundancy'],
        demoFlow: ['users', 'apiServer'],
        narrative: '其中一台 API 伺服器硬體故障離線，這台伺服器原本承擔的請求全部需要別人接手。',
        resolve: ctx => {
          const choice = ctx.get('apiRedundancy');
          if (choice === 'warmStandby') return { uptime: 0, qoe: 0, log: '熱備援伺服器立即接手，容量足夠吸收這些流量，幾乎沒人感覺得到。', ok: true };
          if (choice === 'autoScale') return { uptime: -3, qoe: -3, log: 'Auto scaling 觸發後幾分鐘內開出新伺服器，這段等待期間容量偏緊，部分請求回應變慢。', ok: true };
          return { uptime: -9, qoe: -8, log: '沒有備援容量，剩餘伺服器瞬間過載，回應時間飆高，不少請求逾時失敗。', ok: false };
        }
      },
      {
        month: 6,
        id: 'workerStuck',
        title: '轉碼工作程序當機，任務卡死',
        relevantComponents: ['transcodeResilience'],
        demoFlow: ['users', 'apiServer', 'storage', 'transcodeArch'],
        narrative: '一批影片正在轉碼時，負責處理的任務工作程序當機，任務原本應該要有人接手。',
        resolve: ctx => {
          const choice = ctx.get('transcodeResilience');
          if (choice === 'checkpointResume') return { uptime: 0, qoe: 0, log: '任務排程器重派給其他工作程序，並從最近一次 checkpoint 繼續，幾乎沒有浪費已完成的進度。', ok: true };
          if (choice === 'reassign') return { uptime: -1, qoe: -4, log: '任務被重新指派給其他工作程序，但沒有進度快照，只能整個從頭重轉，這批影片延後了幾小時上架。', ok: true };
          return { uptime: -3, qoe: -18, log: '沒有偵測與重派機制，卡在當機工作程序上的轉碼工作永遠不會完成，這些影片的所有畫質版本都上不了架。', ok: false };
        }
      },
      {
        month: 8,
        id: 'cdnCostReview',
        title: '內容團隊要求檢視 CDN 費用',
        relevantComponents: ['cdnPopularOnly'],
        severity: 'cost',
        narrative: '影片庫累積了大量早期熱門、現在幾乎沒人看的舊影片，CDN 帳單卻沒有跟著降下來。',
        resolve: ctx => {
          if (ctx.has('cdnPopularOnly')) {
            return { qoe: 0, uptime: 0, log: '長尾內容早就只留在自己的伺服器提供服務，CDN 費用一直符合預期，這次檢視很快就結束了。', ok: true };
          }
          return { qoe: -3, uptime: 0, log: '不管冷門熱門全部都進 CDN，其中一大部分流量其實在服務幾乎沒人看的舊影片，帳單明顯偏高，團隊被要求緊急檢討。', ok: false };
        }
      },
      {
        month: 10,
        id: 'cacheNodeDown',
        title: 'Metadata 快取節點當機',
        relevantComponents: ['cacheReplica'],
        demoFlow: ['users', 'apiServer', 'metadataCache'],
        narrative: '其中一個 Metadata 快取節點硬體故障，這個節點原本保存的熱門資料瞬間消失。',
        resolve: ctx => {
          const choice = ctx.get('cacheReplica');
          if (choice === 'replica3Quorum') return { uptime: 0, qoe: 0, log: '三節點＋Quorum 架構下，單一節點掛掉幾乎無感，資料一致性也沒有受影響。', ok: true };
          if (choice === 'replica2') return { uptime: -1, qoe: -1, log: '另一個複本立刻頂上，只有極短暫的延遲上升，系統很快把有問題的節點換掉。', ok: true };
          return { uptime: -5, qoe: -6, log: '只有單一快取節點，掛掉之後所有 Metadata 查詢直接打到資料庫，資料庫負擔瞬間暴增，連帶拖慢其他請求。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '跨年夜：流量暴增＋快取不穩＋轉碼工作程序同時出狀況',
        relevantComponents: ['apiRedundancy', 'cacheReplica', 'transcodeResilience'],
        demoFlow: ['users', 'apiServer', 'metadataCache', 'storage', 'transcodeArch'],
        narrative: '跨年夜：全站最大流量同時考驗 API 容量、Metadata 快取穩定性與轉碼管線，任何一環撐不住都會被放大。',
        resolve: ctx => {
          const shields = ['apiRedundancy', 'cacheReplica', 'transcodeResilience'].filter(id => ctx.has(id)).length;
          const table = {
            3: { uptime: 1, qoe: 1, log: '三道防線都到位：API 備援吸收流量尖峰、快取複寫扛住熱門查詢、轉碼管線容錯撐住跨年影片處理。全站平穩撐過今年流量最高的一夜。', ok: true },
            2: { uptime: -7, qoe: -7, log: '大部分流量被擋住，但缺的那一環仍造成明顯降級，多數使用者感覺得到卡頓或功能異常。', ok: false },
            1: { uptime: -17, qoe: -15, log: '只有一道防線，撐不住三個壓力疊加，多個環節同時出現明顯降級與間歇性中斷。', ok: false },
            0: { uptime: -32, qoe: -26, log: '完全沒有防線，平台在今年流量最高的一晚整個被打垮。', ok: false }
          };
          return table[shields];
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你在成本、可用率與播放品質之間做出了非常成熟的取捨，這年撐過了書裡列出的每一種真實故障。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '架構撐過了這一年，但至少有一次事件造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，這套架構撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件中直接被打垮，回教材重新想一次每個能力真正解決的問題，再挑戰一次。' };
    }
  };
})();
