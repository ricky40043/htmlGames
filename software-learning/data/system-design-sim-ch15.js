(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });
  const OFF = { id: 'off', label: '關閉', cost: 0 };

  window.SYSTEM_DESIGN_SIM['sd-book-15'] = {
    chapterId: 'sd-book-15',
    title: '雲端硬碟同步戰：讓每台裝置永遠對得上帳',
    subtitle: '你接手一個雲端硬碟服務。12 個月內，同步中的裝置數會從 2,000 成長到二十幾萬台，中間會發生上傳尖峰、儲存帳單暴增、推播中斷、離線衝突、分享外洩與區域故障。你在每個月初決定每個同步能力要用哪一種做法——事件發生時不能再改變主意。',
    briefing: [
      '每個能力不是只有開／關：點節點會循環切換不同做法，例如同步衝突處理可以選「保留兩份」或「嘗試自動合併」——做法不同，資料完整度與成本都不一樣。',
      '這些做法都對應第 15 章討論的實際取捨，不是憑空發明的。',
      '「資料完整度」對雲端硬碟比「播放品質」更關鍵——它代表使用者的檔案有沒有被默默覆蓋或外洩，比卡頓嚴重得多。'
    ],
    months: 12,
    qoeLabel: '資料完整度 Integrity',
    viewersLabel: '目前同步中的裝置數估計',
    demoLabels: { watch: '▶ 模擬裝置同步變更', upload: '⬆ 模擬上傳一個檔案' },
    viewersAtMonth: m => Math.round(2000 * Math.pow(1.55, m)),
    components: [
      {
        id: 'resumableUpload',
        name: 'Resumable Upload Session',
        shortName: '斷點續傳',
        desc: '大檔上傳可從斷點繼續，不必因為網路抖動整份重傳。',
        ...ref('sd15-s04-p01'),
        options: [OFF, { id: 'on', label: '啟用斷點續傳', cost: 1, desc: '維護 upload session 狀態需要一點成本，換來大檔案斷線不必整份重傳。' }]
      },
      {
        id: 'blockSync',
        name: 'Block Sync ＋ Content Hash',
        shortName: '區塊同步',
        desc: '只傳有變動的區塊，不必整份重傳——差別在於區塊怎麼切。',
        ...ref('sd15-s05-p01'),
        options: [
          OFF,
          { id: 'basic', label: '固定大小區塊比對', cost: 2, desc: '用固定大小切區塊比對雜湊，實作簡單，多數情況能省下大部分重複資料。' },
          { id: 'adaptive', label: '自適應區塊邊界（rolling hash）', cost: 3, desc: '區塊邊界會跟著內容調整，即使檔案中間插入資料也抓得到重複部分，去重效果更好但更耗運算。' }
        ]
      },
      {
        id: 'changeCursor',
        name: 'Change Log Cursor',
        shortName: '變更游標',
        desc: '裝置只需要抓「游標之後」的變更——差別在於平常靠推播還是定期輪詢來觸發同步。',
        ...ref('sd15-s07-p01'),
        options: [
          OFF,
          { id: 'pollingCursor', label: '定期輪詢＋游標', cost: 1, desc: '裝置固定間隔用游標查詢新變更，簡單可靠，但不是即時的。' },
          { id: 'pushWithCursorFallback', label: '推播喚醒＋游標備援', cost: 3, desc: '平常靠推播即時喚醒同步，推播失效時自動退回游標輪詢，兼顧速度與穩定性。' }
        ]
      },
      {
        id: 'conflictResolution',
        name: 'Base Revision 衝突偵測',
        shortName: '衝突偵測',
        desc: '離線編輯用 base revision 偵測是否有人同時改了同一份檔案——差別在於偵測到衝突後怎麼處理。',
        ...ref('sd15-s09-p03'),
        options: [
          OFF,
          { id: 'keepBoth', label: '偵測衝突，保留兩份', cost: 2, desc: '雙方的修改都保留成不同版本，讓使用者自己決定，簡單可靠。' },
          { id: 'mergeAttempt', label: '偵測衝突，嘗試自動合併', cost: 4, desc: '先嘗試自動合併雙方的修改（例如逐行合併文字檔），失敗才退回保留兩份，體驗更好但實作更複雜。' }
        ]
      },
      {
        id: 'aclEnforcement',
        name: '存取控制與連結撤銷',
        shortName: '權限強制檢查',
        desc: '下載一律先查目前權限，快取鍵值也帶授權情境；連結被撤銷或權限被收回時，立刻生效，不會被快取繞過。',
        ...ref('sd15-s10-p03'),
        options: [OFF, { id: 'on', label: '啟用即時權限檢查', cost: 2, desc: '每次下載都重新驗證授權，撤銷後立即生效。' }]
      },
      {
        id: 'multiRegionDurable',
        name: '跨區複寫與備份',
        shortName: '跨區備援',
        desc: 'Metadata 與物件的複寫，可以用非同步（便宜、有短暫遺失窗口）或同步（更貴、更安全）。',
        ...ref('sd15-s12-p01'),
        options: [
          OFF,
          { id: 'asyncReplica', label: '非同步跨區複寫', cost: 2, desc: '不必等待備援區域確認就回應使用者，成本較低，但故障當下可能有極短的資料遺失窗口。' },
          { id: 'syncReplica', label: '同步跨區複寫', cost: 4, desc: '等待備援區域確認寫入成功才回應，幾乎不會遺失資料，但延遲較高、成本也較高。' }
        ]
      }
    ],
    topology: {
      viewBox: '0 0 900 500',
      nodes: [
        { id: 'users', kind: 'user', label: '裝置', x: 80, y: 270, arriveLabel: '裝置收到同步結果' },
        { id: 'uploadGateway', kind: 'component', componentId: 'resumableUpload', label: '上傳閘道', x: 280, y: 150, arriveLabel: '建立或恢復 upload session' },
        { id: 'blockSyncBadge', kind: 'component', componentId: 'blockSync', label: '區塊同步', x: 280, y: 400, size: 'small', arriveLabel: '比對區塊雜湊，只傳真正變動的部分' },
        { id: 'syncEngine', kind: 'fixed', label: '同步服務', x: 500, y: 270, arriveLabel: '協調 metadata 與變更事件' },
        { id: 'changeCursorBadge', kind: 'component', componentId: 'changeCursor', label: '變更游標', x: 500, y: 120, size: 'small', arriveLabel: '用已保存的游標定位上次同步到哪' },
        { id: 'aclBadge', kind: 'component', componentId: 'aclEnforcement', label: '權限強制檢查', x: 500, y: 420, size: 'small', arriveLabel: '重新檢查目前授權，不信任快取' },
        { id: 'metadataStore', kind: 'fixed', label: 'Metadata Store', x: 720, y: 270, arriveLabel: '讀取或提交 metadata' },
        { id: 'conflictBadge', kind: 'component', componentId: 'conflictResolution', label: '衝突偵測', x: 720, y: 120, size: 'small', arriveLabel: '比對 base revision，偵測是否有並行修改' },
        { id: 'regionB', kind: 'component', componentId: 'multiRegionDurable', label: '備援機房', x: 720, y: 420, region: '備援區域', arriveLabel: '切換到備援區域的複本' }
      ],
      edges: [
        { from: 'users', to: 'uploadGateway' },
        { from: 'uploadGateway', to: 'blockSyncBadge', kind: 'stub', requiresComponent: 'blockSync' },
        { from: 'uploadGateway', to: 'syncEngine' },
        { from: 'syncEngine', to: 'changeCursorBadge', kind: 'stub', requiresComponent: 'changeCursor' },
        { from: 'syncEngine', to: 'aclBadge', kind: 'stub', requiresComponent: 'aclEnforcement' },
        { from: 'syncEngine', to: 'metadataStore' },
        { from: 'metadataStore', to: 'conflictBadge', kind: 'stub', requiresComponent: 'conflictResolution' },
        { from: 'metadataStore', to: 'regionB', requiresComponent: 'multiRegionDurable' }
      ],
      computeFlow: (kind, ctx) => {
        if (kind === 'upload') return ['users', 'uploadGateway', 'syncEngine', 'metadataStore'];
        if (ctx.has('changeCursor')) return ['users', 'syncEngine', 'users'];
        return ['users', 'syncEngine', 'metadataStore', 'syncEngine', 'users'];
      }
    },
    chunkSim: {
      total: 6,
      resumeComponentId: 'resumableUpload',
      crashNodeId: 'uploadGateway',
      label: '一個 4GB 的影片專案檔',
      startLabel: '開始上傳這個檔案'
    },
    events: [
      {
        month: 2,
        id: 'uploadRush',
        title: '學期報告與工作截止日同時湧入',
        relevantComponents: ['resumableUpload'],
        demoFlow: ['users', 'uploadGateway', 'syncEngine'],
        narrative: '大量使用者在同一週上傳大型簡報與影片檔，行動網路環境下斷線頻繁。',
        resolve: ctx => {
          if (ctx.has('resumableUpload')) {
            return { uptime: 0, qoe: -1, log: '斷線的上傳都能從中斷點繼續，只有極少數使用者感覺上傳變慢。', ok: true };
          }
          return { uptime: -2, qoe: -14, log: '每次斷線都要整份重傳，行動網路使用者大檔幾乎傳不完，客訴集中在「上傳一直失敗」。', ok: false };
        }
      },
      {
        month: 4,
        id: 'storageBill',
        title: '儲存與頻寬帳單暴增',
        relevantComponents: ['blockSync'],
        severity: 'cost',
        narrative: '設計師與工程團隊習慣對同一個大檔案做小幅修改後儲存，例如編輯 8GB 的影片專案檔。',
        resolve: ctx => {
          const choice = ctx.get('blockSync');
          if (choice === 'adaptive') return { qoe: 0, uptime: 0, log: '自適應區塊邊界把重複資料壓到最低，這次修改只重傳真正變動的一小段，帳單完全符合預期。', ok: true };
          if (choice === 'basic') return { qoe: -1, uptime: 0, log: '固定大小的區塊比對還是抓到大部分重複資料，帳單略高於預期但可以接受。', ok: true };
          return { qoe: -6, uptime: 0, log: '每次小修改都整份重傳整份儲存，頻寬與儲存成本遠超預期，也拖慢了這些使用者的同步速度。', ok: false };
        }
      },
      {
        month: 6,
        id: 'pushOutage',
        title: '推播通知服務中斷 6 小時',
        relevantComponents: ['changeCursor'],
        demoFlow: ['users', 'syncEngine', 'changeCursorBadge'],
        narrative: '第三方推播服務大規模中斷，裝置收不到「有新變更」的訊號。',
        resolve: ctx => {
          const choice = ctx.get('changeCursor');
          if (choice === 'pushWithCursorFallback') return { uptime: 0, qoe: 0, log: '推播失效後自動改用游標輪詢，只抓真正錯過的變更，使用者幾乎無感。', ok: true };
          if (choice === 'pollingCursor') return { uptime: -2, qoe: -2, log: '本來就是定期輪詢配合游標，推播中斷完全不影響同步，只是本來就有的輪詢延遲稍微明顯。', ok: true };
          return { uptime: -16, qoe: -8, log: '沒有游標可以定位「上次同步到哪」，大量裝置只好整個帳戶重新掃描，metadata 服務被灌爆，全站同步嚴重延遲。', ok: false };
        }
      },
      {
        month: 8,
        id: 'offlineConflict',
        title: '兩位主管離線同時修改同一份合約',
        relevantComponents: ['conflictResolution'],
        demoFlow: ['users', 'syncEngine', 'metadataStore', 'conflictBadge'],
        narrative: '業務與法務各自在飛機上離線編輯同一份重要合約，落地後同時恢復連線同步。',
        resolve: ctx => {
          const choice = ctx.get('conflictResolution');
          if (choice === 'mergeAttempt') return { qoe: 2, uptime: 0, log: '系統嘗試自動合併雙方的修改，這份合約的變更剛好落在不同段落，自動合併成功，沒有人需要手動處理。', ok: true };
          if (choice === 'keepBoth') return { qoe: 1, uptime: 0, log: '系統偵測到雙方都基於同一個 base revision 修改，保留兩份版本讓使用者自己決定，沒有人的修改被默默蓋掉。', ok: true };
          return { qoe: -20, uptime: 0, log: 'Last-write-wins 讓其中一人的修改被靜靜覆蓋，直到對方發現合約內容「消失」才驚覺資料遺失，對產品信任造成嚴重傷害。', ok: false };
        }
      },
      {
        month: 10,
        id: 'linkLeak',
        title: '離職員工的分享連結沒有立即失效',
        relevantComponents: ['aclEnforcement'],
        demoFlow: ['users', 'syncEngine', 'aclBadge'],
        narrative: '一名離職員工的個人資料夾分享連結被意外轉發，管理員在事後才嘗試撤銷權限。',
        resolve: ctx => {
          if (ctx.has('aclEnforcement')) {
            return { uptime: 0, qoe: 0, log: '撤銷權限立即生效，下載請求與快取都會重新檢查授權，連結轉發後很快就失效了。', ok: true };
          }
          return { uptime: -4, qoe: -10, log: 'CDN／快取層仍持有舊的授權判斷，撤銷後一段時間內連結依然可以下載到私人檔案，形成一次資料外洩事件。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '區域機房故障＋數萬台裝置同時重新連線',
        relevantComponents: ['multiRegionDurable', 'changeCursor'],
        demoFlow: ['users', 'syncEngine', 'regionB', 'changeCursorBadge'],
        narrative: '主要區域機房因網路設施故障離線，數萬台原本連線中的裝置同時嘗試重新連線並要求同步最新狀態。',
        resolve: ctx => {
          const hasRegion = ctx.has('multiRegionDurable');
          const hasCursor = ctx.has('changeCursor');
          if (hasRegion && hasCursor) {
            return { uptime: 0, qoe: 1, log: '流量切到備援區域，裝置各自用保存的游標追回進度，重連潮被平順吸收，使用者幾乎無感。', ok: true };
          }
          if (hasRegion && !hasCursor) {
            return { uptime: -5, qoe: -10, log: '服務有備援區域可以接手，但沒有游標的裝置只能整個重新掃描，metadata 服務在重連潮中被打得很重。', ok: false };
          }
          if (!hasRegion && hasCursor) {
            return { uptime: -22, qoe: -6, log: '沒有備援區域，這個區域直接停擺；游標機制讓服務恢復後裝置能快速追回，但停機期間完全無法使用。', ok: false };
          }
          return { uptime: -30, qoe: -22, log: '沒有備援、也沒有游標：服務長時間停擺，恢復後又被數萬台裝置的全量重新掃描二次打垮，形成連環故障。', ok: false };
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你在成本、可用率與資料完整度之間做出了非常成熟的取捨，這年沒有任何使用者的檔案被默默弄丟或外洩。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '服務撐過了這一年，但至少有一次事件造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，這套架構撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件中直接被打垮，回教材重新想一次每個能力真正解決的問題，再挑戰一次。' };
    }
  };
})();
