(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });

  window.SYSTEM_DESIGN_SIM['sd-book-14'] = {
    chapterId: 'sd-book-14',
    title: 'YouTube 生存戰：撐過爆紅的第一年',
    subtitle: '你接手一個剛起步的影片平台。12 個月內，使用者會從 5,000 成長到數百萬，中間會發生上傳尖峰、影片爆紅、機房斷線與帳務事故。你在每個月初決定要不要投資哪些架構能力——事件發生時不能再改變主意，只能承擔當下架構的後果。',
    briefing: [
      '這不是要你寫出轉檔演算法或一致性雜湊的程式碼，而是練習「先投資哪個架構能力」的判斷——跟第 14 章教材裡討論的取捨完全對應。',
      '每個月你可以開關任何架構能力；開著會持續消耗「營運效率」分數，但能在對應事件發生時保護「可用率」與「播放品質」。',
      '12 個月後會依可用率、播放品質、營運效率算出總評，並逐一列出每個事件「你當時有沒有準備」。'
    ],
    months: 12,
    viewersLabel: '目前尖峰同時觀看人數估計',
    viewersAtMonth: m => Math.round(5000 * Math.pow(1.62, m)),
    components: [
      {
        id: 'cdnShield',
        name: 'CDN ＋ Origin Shield',
        shortName: 'CDN／源站防護',
        cost: 3,
        desc: '熱門影片從 Edge 直接回應，Origin 不會被瞬間流量打爆。',
        ...ref('sd14-s07-p03')
      },
      {
        id: 'elasticTranscode',
        name: '彈性轉檔 Worker Pool',
        shortName: '彈性轉檔',
        cost: 2,
        desc: '上傳尖峰時 Queue 可以吸收，Worker 依佇列深度自動擴縮。',
        ...ref('sd14-s05-p02')
      },
      {
        id: 'retryBudget',
        name: '重試預算 ＋ DLQ',
        shortName: '重試紀律',
        cost: 1,
        desc: '失敗有 retry 上限，超過就進死信佇列，不會無限重試放大故障。',
        ...ref('sd14-s09-p03')
      },
      {
        id: 'hotColdTier',
        name: 'Hot／Cold 儲存分層',
        shortName: '冷熱分層',
        cost: -2,
        desc: '冷門影片自動降到便宜儲存層，長期儲存成本不會隨影片庫線性暴增。',
        ...ref('sd14-s10-p03')
      },
      {
        id: 'multiRegion',
        name: '跨區域備援',
        shortName: '跨區備援',
        cost: 4,
        desc: 'Metadata 與 CDN 節點分散在多個區域，單一機房斷線不會讓那個地區完全看不到影片。',
        ...ref('sd14-s12-p01')
      },
      {
        id: 'idempotentPublish',
        name: '冪等發布處理',
        shortName: '冪等發布',
        cost: 1,
        desc: '轉檔完成事件被佇列重送時，不會重複發布或重複觸發計費。',
        ...ref('sd14-s04-p03')
      }
    ],
    events: [
      {
        month: 2,
        id: 'uploadSpike',
        title: '開學／連假上傳潮',
        relevantComponents: ['elasticTranscode'],
        narrative: '大量使用者同時上傳影片，轉檔佇列瞬間堆了平常 8 倍的工作。',
        resolve: active => {
          if (active.has('elasticTranscode')) {
            return { uptime: 0, qoe: -2, log: '彈性 Worker Pool 依佇列深度自動加開，積壓在 6 小時內清完，只有少數使用者感覺轉檔變慢。', ok: true };
          }
          return { uptime: -3, qoe: -14, log: '固定數量的轉檔 Worker 完全吃不消，積壓超過 2 天，大量影片「上傳成功」卻遲遲無法播放，客訴大量湧入。', ok: false };
        }
      },
      {
        month: 4,
        id: 'viralHit',
        title: '一支影片被大帳號轉發',
        relevantComponents: ['cdnShield', 'retryBudget'],
        narrative: '一支平常一天幾百次觀看的影片，一小時內被轉發到瞬間 60 倍流量。',
        resolve: active => {
          if (active.has('cdnShield')) {
            return { uptime: 0, qoe: -1, log: '熱門影片幾乎全部從 Edge Cache 命中，Origin 只承受一次性回源，平台完全沒感覺到這次爆紅。', ok: true };
          }
          const amplified = !active.has('retryBudget');
          return {
            uptime: amplified ? -18 : -9,
            qoe: -16,
            log: amplified
              ? 'Origin 被直接打爆，逾時的 Client 瘋狂自動重試，形成 retry storm，故障範圍從這支影片擴大到整個播放服務。'
              : 'Origin 被打爆造成明顯降級，但重試預算擋住了 retry storm，沒有擴大成全站故障。',
            ok: false
          };
        }
      },
      {
        month: 6,
        id: 'regionOutage',
        title: '機房停電 30 分鐘',
        relevantComponents: ['multiRegion'],
        narrative: '其中一個資料中心因電力設施故障離線，所有服務瞬間中斷。',
        resolve: active => {
          if (active.has('multiRegion')) {
            return { uptime: -1, qoe: 0, log: '流量與 metadata 讀取切換到其他區域，只有極少數寫入請求短暫失敗，多數使用者沒有察覺。', ok: true };
          }
          return { uptime: -20, qoe: -6, log: '這個區域的所有使用者完全無法上傳或觀看，直到電力復原才恢復，形成一次明顯的區域性大當機。', ok: false };
        }
      },
      {
        month: 8,
        id: 'costAudit',
        title: '投資人要求砍 20% 儲存成本',
        relevantComponents: ['hotColdTier'],
        narrative: '影片庫已經累積大量早期熱門、現在幾乎沒人看的舊影片，儲存帳單越來越高。',
        resolve: active => {
          if (active.has('hotColdTier')) {
            return { qoe: 0, uptime: 0, log: '冷門 rendition 早已降到便宜儲存層，這次稽核只是照既有機制回報數字，不必臨時砍任何東西。', ok: true };
          }
          return { qoe: -5, uptime: 0, log: '沒有分層機制，只能臨時手動刪除部分冷門 rendition 應急，砍掉了一些使用者仍會用到的畫質選項。', ok: false };
        }
      },
      {
        month: 10,
        id: 'duplicateEvent',
        title: '佇列重送轉檔完成事件',
        relevantComponents: ['idempotentPublish'],
        narrative: '訊息佇列在網路抖動後重送了一批「轉檔完成」事件。',
        resolve: active => {
          if (active.has('idempotentPublish')) {
            return { uptime: 0, qoe: 0, log: 'Completion handler 以 video_id + pipeline_version 去重，重送的事件被安全忽略。', ok: true };
          }
          return { uptime: -2, qoe: -3, log: '同一支影片被重複發布，部分使用者看到通知被重複推播，也有影片被誤判成重新上傳而暫時下架。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '跨年直播倒數＋上傳尖峰同時發生',
        relevantComponents: ['cdnShield', 'elasticTranscode', 'multiRegion'],
        narrative: '跨年夜：全站最大流量的直播式觀看，加上大量使用者同時上傳跨年影片，任何一個環節撐不住都會被放大。',
        resolve: active => {
          const shields = ['cdnShield', 'elasticTranscode', 'multiRegion'].filter(id => active.has(id)).length;
          const table = {
            3: { uptime: 1, qoe: 1, log: '三道防線都到位：CDN 吸收觀看尖峰、彈性 Worker 吸收上傳尖峰、跨區備援分攤壓力。全站平穩撐過今年流量最高的一夜。', ok: true },
            2: { uptime: -6, qoe: -6, log: '大部分流量被擋住，但缺的那一環仍造成明顯降級，多數使用者感覺得到卡頓或上傳變慢。', ok: false },
            1: { uptime: -16, qoe: -14, log: '只有一道防線，撐不住三個尖峰疊加，多個地區同時出現明顯降級與間歇性中斷。', ok: false },
            0: { uptime: -30, qoe: -25, log: '完全沒有防線，平台在今年流量最高的一晚整個被打垮。', ok: false }
          };
          return table[shields];
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你在成本、可用率與播放品質之間做出了非常成熟的取捨，這年撐過了每一次尖峰與故障。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '架構撐過了這一年，但至少有一次事件造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，這套架構撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件中直接被打垮，回教材重新想一次每個能力真正解決的問題，再挑戰一次。' };
    }
  };
})();
