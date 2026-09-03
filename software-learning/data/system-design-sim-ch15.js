(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });

  window.SYSTEM_DESIGN_SIM['sd-book-15'] = {
    chapterId: 'sd-book-15',
    title: '雲端硬碟同步戰：讓每台裝置永遠對得上帳',
    subtitle: '你接手一個雲端硬碟服務。12 個月內，同步中的裝置數會從 2,000 成長到二十幾萬台，中間會發生上傳尖峰、儲存帳單暴增、推播中斷、離線衝突、分享外洩與區域故障。你在每個月初決定要不要投資哪些同步能力——事件發生時不能再改變主意。',
    briefing: [
      '這不是要你寫出真正的 diff／merge 演算法，而是練習「先投資哪個同步能力」的判斷——跟第 15 章討論的取捨完全對應。',
      '每個月你可以開關任何架構能力；開著會持續消耗「營運效率」分數，但能在對應事件發生時保護「可用率」與「資料完整度」。',
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
        cost: 1,
        desc: '大檔上傳可從斷點繼續，不必因為網路抖動整份重傳。',
        ...ref('sd15-s04-p01')
      },
      {
        id: 'blockSync',
        name: 'Block Sync ＋ Content Hash',
        shortName: '區塊同步',
        cost: -1,
        desc: '只傳有變動的區塊，改 1MB 不必重傳整個 10GB 檔案，長期頻寬與儲存成本大幅下降。',
        ...ref('sd15-s05-p01')
      },
      {
        id: 'changeCursor',
        name: 'Change Log Cursor',
        shortName: '變更游標',
        cost: 2,
        desc: '裝置只需要抓「游標之後」的變更；推播失效時可以用游標追回，不必整個資料夾重新掃描。',
        ...ref('sd15-s07-p01')
      },
      {
        id: 'conflictResolution',
        name: 'Base Revision 衝突偵測',
        shortName: '衝突偵測',
        cost: 1,
        desc: '離線編輯用 base revision 偵測是否有人同時改了同一份檔案，衝突時保留兩份，而不是誰後寫誰贏。',
        ...ref('sd15-s09-p03')
      },
      {
        id: 'aclEnforcement',
        name: '存取控制與連結撤銷',
        shortName: '權限強制檢查',
        cost: 2,
        desc: '下載一律先查目前權限，快取鍵值也帶授權情境；連結被撤銷或權限被收回時，立刻生效，不會被快取繞過。',
        ...ref('sd15-s10-p03')
      },
      {
        id: 'multiRegionDurable',
        name: '跨區複寫與備份',
        shortName: '跨區備援',
        cost: 4,
        desc: 'Metadata 與物件分別有自己的複寫與備份策略，單一區域故障時，資料不會遺失也能接手服務。',
        ...ref('sd15-s12-p01')
      }
    ],
    topology: {
      viewBox: '0 0 900 500',
      nodes: [
        { id: 'users', kind: 'user', label: '裝置', x: 80, y: 270 },
        { id: 'uploadGateway', kind: 'component', componentId: 'resumableUpload', label: '上傳閘道', x: 280, y: 150 },
        { id: 'blockSyncBadge', kind: 'component', componentId: 'blockSync', label: '區塊同步', x: 280, y: 400, size: 'small' },
        { id: 'syncEngine', kind: 'fixed', label: '同步服務', x: 500, y: 270 },
        { id: 'changeCursorBadge', kind: 'component', componentId: 'changeCursor', label: '變更游標', x: 500, y: 120, size: 'small' },
        { id: 'aclBadge', kind: 'component', componentId: 'aclEnforcement', label: '權限強制檢查', x: 500, y: 420, size: 'small' },
        { id: 'metadataStore', kind: 'fixed', label: 'Metadata Store', x: 720, y: 270 },
        { id: 'conflictBadge', kind: 'component', componentId: 'conflictResolution', label: '衝突偵測', x: 720, y: 120, size: 'small' },
        { id: 'regionB', kind: 'component', componentId: 'multiRegionDurable', label: '備援機房', x: 720, y: 420, region: '備援區域' }
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
      computeFlow: (kind, active) => {
        if (kind === 'upload') return ['users', 'uploadGateway', 'syncEngine', 'metadataStore'];
        if (active.has('changeCursor')) return ['users', 'syncEngine', 'users'];
        return ['users', 'syncEngine', 'metadataStore', 'syncEngine', 'users'];
      }
    },
    events: [
      {
        month: 2,
        id: 'uploadRush',
        title: '學期報告與工作截止日同時湧入',
        relevantComponents: ['resumableUpload'],
        demoFlow: ['users', 'uploadGateway', 'syncEngine'],
        narrative: '大量使用者在同一週上傳大型簡報與影片檔，行動網路環境下斷線頻繁。',
        resolve: active => {
          if (active.has('resumableUpload')) {
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
        resolve: active => {
          if (active.has('blockSync')) {
            return { qoe: 0, uptime: 0, log: '只有真正變動的區塊被重新上傳與儲存，帳單成長速度符合預期。', ok: true };
          }
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
        resolve: active => {
          if (active.has('changeCursor')) {
            return { uptime: -1, qoe: -1, log: '裝置改用定期輪詢配合已保存的游標，只抓真正錯過的變更，服務有感但可控地降級。', ok: true };
          }
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
        resolve: active => {
          if (active.has('conflictResolution')) {
            return { qoe: 1, uptime: 0, log: '系統偵測到雙方都基於同一個 base revision 修改，保留兩份版本讓使用者自己決定，沒有人的修改被默默蓋掉。', ok: true };
          }
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
        resolve: active => {
          if (active.has('aclEnforcement')) {
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
        resolve: active => {
          const hasRegion = active.has('multiRegionDurable');
          const hasCursor = active.has('changeCursor');
          if (hasRegion && hasCursor) {
            return { uptime: 0, qoe: 1, log: '流量切到備援區域，裝置各自用保存的游標追回進度，重連潮被平順吸收，使用者幾乎無感。', ok: true };
          }
          if (hasRegion && !hasCursor) {
            return { uptime: -5, qoe: -10, log: '服務有備援區域可以接手，但沒有游標的裝置只能整個重新掃描，metadata 服務在重連潮中被打得很重。', ok: false };
          }
          if (!hasRegion && hasCursor) {
            return { uptime: -22, qoe: -6, log: '沒有備援區域，這個區域直接停擺；游標機制讓服務恢復後裝置能快速追回，但停機期間完全無法使用。', ok: false };
          }
          return { uptime: -30, qoe: -22, log: '沒有備援、也沒有游標：服務長時間停擺，恢復後又被数萬台裝置的全量重新掃描二次打垮，形成連環故障。', ok: false };
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
