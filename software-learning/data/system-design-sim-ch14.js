(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });

  // Two genuinely different meanings of "off" live in this chapter, and conflating them was the
  // single most confusing thing about the earlier version of this scenario:
  //
  //   presence:'always'   — the machine is ALWAYS physically there and always serves traffic.
  //                         The option only decides how well it survives failure / how much
  //                         spare capacity it has. "off" here means「只有一台、沒有備援」,
  //                         NOT「這台伺服器掛了」. These nodes must never be drawn with a ✕.
  //   presence:'optional' — the thing genuinely does not exist until you build it (a CDN you
  //                         haven't bought, a pre-signed-URL upload path you haven't enabled).
  //                         "off" here really does mean it is not in the picture, traffic does
  //                         not flow through it, and its edges are dashed.
  //
  // Every "off" label below therefore says what off actually means for that specific component,
  // instead of the single generic「關閉」that made a live-but-unredundant server read as dead.
  const OFF_ALWAYS = label => ({ id: 'off', label, cost: 0 });

  window.SYSTEM_DESIGN_SIM['sd-book-14'] = {
    chapterId: 'sd-book-14',
    title: 'YouTube 生存戰：撐過爆紅的第一年',
    subtitle: '你接手一個剛起步的影片平台。12 個月內，尖峰同時觀看人數會從 5,000 成長到超過一百五十萬，中間會發生書裡「錯誤處理」一節列出的那些真實故障：資料庫 Master 當機、API 伺服器掛掉、轉檔工作程序卡死、快取節點失效。你在每個月初決定每個能力要用哪一種做法、每個地區要開幾台機器——事件發生時不能再改變主意，只能承擔當下選擇的後果。',
    briefing: [
      '**節點上的符號代表什麼**：✓ 代表這個能力目前有做保護；⚠ 代表機器還在跑、流量照走，但沒有備援，壞一台就有事；✕ 代表這個東西你根本還沒建（例如還沒買 CDN），流量不會經過它，連線也會變成虛線。伺服器不會因為你沒開備援就消失。',
      '**你可以自己加機器**：串流伺服器、API 伺服器、轉碼工作程序旁邊有 ＋／－ 按鈕，可以在備援策略的基本台數之上自己加開機器。每台都要錢，但能實際擋住超載。',
      '**容量是真的會算的**：每個地區分到的觀看人數 ÷ 你在那個地區開的機器容量 = 負載率。超過 100% 就會顯示紅色超載，每推進一個月會扣播放品質分數——這不是裝飾，是真的在算。',
      '**CDN 決定流量從哪裡出來**：沒建 CDN 時，每一次觀看都要一路回源到你自己的串流伺服器；建了 CDN 之後，大多數觀看在地區的 CDN 邊緣節點就直接回覆，根本不會碰到後面的機器——拓樸圖上的封包會直接顯示這個差別。',
      '**測試觀眾（🙋）有自己的地區**：他站在哪個地區的框裡，就由那個地區的節點服務他；把他拖到別的地區框裡，服務他的節點就會跟著換。訊號不良區（紅色虛線框）本身也可以拖著移動，想測哪一區就把它拖過去。',
      '拓樸圖上台灣、美國、日本各有自己獨立的 CDN、Load Balancer——後面又分成兩條路：搜尋／上架影片打「API 伺服器」，觀看影片走「串流伺服器」，兩者是分開的伺服器群組，不會互相影響。後端的儲存與轉碼系統則集中在美國主機房，從台灣或日本過去要跨海，動畫上會明顯變慢。'
    ],
    months: 12,
    viewersLabel: '目前尖峰同時觀看人數估計',
    demoLabels: { watch: '▶ 模擬觀眾看一部影片', upload: '⬆ 模擬上傳一部影片', search: '🔍 模擬搜尋影片' },
    concurrentViewersLabel: '👥 模擬 10 人同時觀看同一部影片',
    viewersAtMonth: m => Math.round(5000 * Math.pow(1.62, m)),
    // How the headline concurrent-viewer number turns into per-node load. This is what makes
    // "我自己加一台伺服器" mean something instead of being decoration: every pool node declares
    // how many concurrent viewers ONE instance can carry, and the topology draws the resulting
    // load ratio live. `offloadFrom` names the component whose current option decides what
    // fraction of watch traffic never reaches the origin at all (the CDN edge absorbs it).
    capacity: {
      regionShare: { tw: 0.25, us: 0.5, jp: 0.25 },
      apiRatio: 0.2,
      offloadFrom: 'cdnTier'
    },
    components: [
      {
        id: 'cdnTier',
        name: 'CDN（內容傳遞網路）',
        shortName: 'CDN',
        presence: 'optional',
        desc: '沒有 CDN 時，每一次觀看都得從你自己的串流伺服器把整段影片送出去；有了 CDN，影片會被複製到各地區的邊緣節點，大部分觀看在邊緣就直接回覆。注意「不建 CDN」不代表不用錢——所有流量都改從你自己的機房出去，源站頻寬帳單反而更貴，而且串流伺服器的負載會是原本的好幾倍。',
        ...ref('sd14-s10-p01'),
        options: [
          { id: 'off', label: '不建 CDN（每次觀看都回源）', cost: 1, hitRate: 0, offload: 0, desc: '完全不使用 CDN。所有影片位元組都從自己的串流伺服器出去，源站頻寬貴、負載也最高。' },
          { id: 'all', label: '所有影片都放進 CDN', cost: 4, hitRate: 0.97, offload: 0.97, desc: '幾乎每次觀看都在邊緣命中，串流伺服器幾乎沒負載——但你也在幫幾乎沒人看的長尾舊片付 CDN 費用。' },
          { id: 'popularOnly', label: '只有熱門影片進 CDN', cost: -2, hitRate: 0.85, offload: 0.85, desc: '長尾冷門影片留在自己的伺服器提供服務，只有真正受歡迎的內容進 CDN，命中率仍然很高但帳單明顯較低。' }
        ]
      },
      {
        id: 'apiRedundancy',
        name: 'API 伺服器備援容量（搜尋／上架）',
        shortName: 'API 備援',
        presence: 'always',
        desc: '伺服器是無狀態的，單台當機時負載平衡器能把流量導到其他伺服器——差別在於備援容量是「隨時待命」還是「當下才開」。這裡只管搜尋／上架影片這條線；觀看影片走的是另一組完全獨立的「串流伺服器」，備援策略要另外決定，兩邊不會互相牽動。',
        ...ref('sd14-s02-p01'),
        options: [
          { ...OFF_ALWAYS('無備援（只有 1 台在跑）'), instances: 1 },
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, instances: 2, desc: '負載升高時自動開新機器，成本較低，但生效前這幾分鐘容量會偏緊。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, instances: 3, desc: '隨時有備援容量可以立即接手，幾乎無感，但平常就要多付這些機器的錢。' }
        ]
      },
      {
        id: 'streamRedundancy',
        name: '串流伺服器備援容量（觀看影片）',
        shortName: '串流備援',
        presence: 'always',
        desc: '串流伺服器只負責把影片位元組送到觀眾裝置，跟處理搜尋／上架的 API 伺服器是完全分開的一組機器、分開計費、分開故障——這裡的選擇不會影響 API 伺服器，反過來也一樣。',
        ...ref('sd14-s02-p01'),
        options: [
          { ...OFF_ALWAYS('無備援（只有 1 台在跑）'), instances: 1 },
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, instances: 2, desc: '負載升高時自動開新機器，成本較低，但生效前這幾分鐘容量會偏緊。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, instances: 3, desc: '隨時有備援容量可以立即接手，幾乎無感，但平常就要多付這些機器的錢。' }
        ]
      },
      {
        id: 'dbMasterSlave',
        name: 'Metadata 資料庫 Master／Slave 複寫',
        shortName: 'DB 主從複寫',
        presence: 'always',
        desc: 'Master 當機時需要有東西頂替——差別在於用自動選舉還是人工確認來完成這次切換。資料庫本身一直都在，這裡選的是「它壞掉的時候有沒有人接手」。',
        ...ref('sd14-s04-p01'),
        options: [
          OFF_ALWAYS('沒有複本（單一 Master，壞了就停擺）'),
          { id: 'manual', label: '人工手動切換（約 5 分鐘，但更可控）', cost: 1, desc: '需要人工確認才切換，恢復較慢，但避免自動系統誤判造成的腦裂風險。' },
          { id: 'auto', label: '自動故障轉移（偵測＋選舉，約 30 秒）', cost: 3, desc: '監控系統偵測 Master 無回應後自動選舉新 Master，中斷時間短，但需要額外的協調機制成本。' }
        ]
      },
      {
        id: 'cacheReplica',
        name: 'Metadata 快取多節點複寫',
        shortName: '快取複寫',
        presence: 'always',
        desc: '快取資料複寫的節點數決定了能同時扛住幾個節點掛掉，也決定了成本。快取本身一直都在，這裡選的是它有幾份複本。',
        ...ref('sd14-s02-p02'),
        options: [
          OFF_ALWAYS('單一節點，沒有複本'),
          { id: 'replica2', label: '兩節點複寫', cost: 2, desc: '其中一個掛掉，另一個立刻頂上，多數情況夠用。' },
          { id: 'replica3Quorum', label: '三節點＋Quorum 讀寫', cost: 4, desc: '能同時扛住兩個節點掛掉，讀寫一致性也更好，但成本更高、協調也更複雜。' }
        ]
      },
      {
        id: 'transcodeResilience',
        name: '轉碼管線容錯',
        shortName: '轉碼容錯',
        presence: 'always',
        desc: '任務工作程序當機時，任務排程器可以把工作重新指派給其他工作程序——差別在於重派後是「從頭重轉」還是「接著中斷點繼續」。轉碼管線本身一直在跑，這裡選的是它出事時怎麼救。',
        ...ref('sd14-s09-p01'),
        options: [
          { ...OFF_ALWAYS('沒有容錯（工作程序當掉就卡死）'), instances: 1 },
          { id: 'reassign', label: '偵測＋重新指派（從頭重轉）', cost: 2, instances: 2, desc: '換一個工作程序處理，但沒有進度紀錄，只能整個任務重來。' },
          { id: 'checkpointResume', label: '重新指派＋定期 Checkpoint', cost: 4, instances: 3, desc: '額外維護處理進度快照，換人接手後可以從中斷點繼續，幾乎不浪費已完成的工作。' }
        ]
      },
      {
        id: 'preSignedUpload',
        name: '預簽名網址直傳',
        shortName: '預簽名直傳',
        presence: 'optional',
        desc: '客戶端拿到預簽名網址後直接上傳到原始儲存系統，不必經過 API 伺服器中轉大檔案位元組，同時也更安全——只有授權使用者可以上傳。沒啟用時這條直傳路徑根本不存在。',
        ...ref('sd14-s11-p02'),
        options: [
          { id: 'off', label: '不啟用（大檔案都經 API 伺服器中轉）', cost: 0 },
          { id: 'on', label: '啟用直傳', cost: -1, desc: '省下 API 伺服器中轉大檔案的頻寬與運算成本。' }
        ]
      },
      {
        id: 'resumableUpload',
        name: '斷點續傳 Upload Session',
        shortName: '斷點續傳',
        presence: 'optional',
        desc: '上傳中斷後能從已成功的位元組繼續，不必整份重傳一次 GB 等級的原始檔。沒啟用時，系統根本沒有記錄「傳到哪裡」的地方。',
        ...ref('sd14-s03-p01'),
        options: [
          { id: 'off', label: '不啟用（中斷就整份重傳）', cost: 0 },
          { id: 'on', label: '啟用斷點續傳', cost: 1, desc: '維護 upload session 狀態需要一點額外成本，但能大幅減少大檔案重傳的浪費。' }
        ]
      }
    ],
    // Three regions, each with its own genuinely independent edge stack — and, critically, TWO
    // separate backend tiers, not one shared "API server" for everything: search and upload
    // orchestration hit the (metadata) API server; watching a video never touches that server at
    // all and instead flows through its own Streaming server pool, matching how a real
    // video platform actually separates its control plane from its video-serving data plane
    // (different scaling characteristics, different failure blast radius). The backend origin
    // (object storage, transcode pipeline, the Metadata DB and its cache) stays centralized in
    // the home region (USA), matching what the book itself actually diagrams — it describes
    // Master/Slave failover for *availability*, not a geo-distributed database, so this doesn't
    // invent content beyond what's grounded. A request from Taiwan or Japan has to cross an
    // ocean to reach that origin; a request from the US region doesn't — see crossRegionWeight.
    topology: (() => {
      const regionNode = (r, label, yUpper, yCenter, yLower) => [
        { id: `users_${r}`, kind: 'user', label: `觀眾（${label}）`, region: label, x: 90, y: yCenter, arriveLabel: '使用者裝置收到回應' },
        { id: `cdn_${r}`, kind: 'component', componentId: 'cdnTier', label: `CDN（${label}）`, region: label, x: 280, y: yUpper, arriveLabel: '檢查這部影片有沒有在這個地區的邊緣節點命中' },
        { id: `loadBalancer_${r}`, kind: 'fixed', label: `Load Balancer（${label}）`, region: label, x: 480, y: yCenter, arriveLabel: '健康檢查後依路徑把請求導向 API 或串流伺服器群組' },
        {
          id: `streamServer_${r}`, kind: 'component', componentId: 'streamRedundancy',
          label: `串流伺服器（${label}）`, region: label, x: 680, y: yUpper, pool: true,
          regionKey: r, loadKind: 'stream', capacityPerInstance: 45000, extraInstanceCost: 2,
          arriveLabel: '從原始儲存系統取得影片內容區塊並送給觀眾'
        },
        {
          id: `apiServer_${r}`, kind: 'component', componentId: 'apiRedundancy',
          label: `API 伺服器（${label}）`, region: label, x: 680, y: yLower, pool: true,
          regionKey: r, loadKind: 'api', capacityPerInstance: 60000, extraInstanceCost: 1,
          arriveLabel: '驗證請求並決定下一步路由'
        }
      ];
      const regionEdges = r => [
        { from: `users_${r}`, to: `loadBalancer_${r}` },
        { from: `loadBalancer_${r}`, to: `apiServer_${r}` },
        // Both CDN legs are gated on the CDN actually existing: with 不建 CDN selected there is
        // no edge node in this region at all, so these two wires go dashed and computeFlow
        // routes watch traffic straight through the load balancer to the origin instead.
        { from: `users_${r}`, to: `cdn_${r}`, requiresComponent: 'cdnTier' },
        { from: `cdn_${r}`, to: `loadBalancer_${r}`, requiresComponent: 'cdnTier' },
        { from: `loadBalancer_${r}`, to: `streamServer_${r}` },
        { from: `streamServer_${r}`, to: 'storage' },
        { from: `apiServer_${r}`, to: 'storage' },
        { from: `apiServer_${r}`, to: 'metadataCache' },
        { from: `apiServer_${r}`, to: 'metadataDB', kind: 'stub' },
        { from: `users_${r}`, to: 'preSignedBadge', kind: 'stub', requiresComponent: 'preSignedUpload' }
      ];
      return {
        viewBox: '0 0 1300 950',
        regionIds: ['tw', 'us', 'jp'],
        regionLabel: { tw: '台灣', us: '美國', jp: '日本' },
        crossRegionWeight: 3.4,
        nodes: [
          ...regionNode('tw', '台灣', 80, 140, 200),
          ...regionNode('us', '美國', 400, 460, 520),
          {
            id: 'transcodeArch', kind: 'component', componentId: 'transcodeResilience', label: '轉碼架構',
            region: '美國', zone: '美國主機房（後端）', x: 1050, y: 380, pool: true, extraInstanceCost: 2,
            arriveLabel: 'DAG 排程器指派任務給某一台工作程序'
          },
          { id: 'storage', kind: 'fixed', label: '儲存系統', region: '美國', zone: '美國主機房（後端）', x: 1050, y: 460, arriveLabel: '寫入或讀取原始／已轉碼影片' },
          { id: 'metadataCache', kind: 'component', componentId: 'cacheReplica', label: 'Metadata 快取', region: '美國', zone: '美國主機房（後端）', x: 1050, y: 540, arriveLabel: '從 Metadata 快取節點取得資料' },
          { id: 'metadataDB', kind: 'component', componentId: 'dbMasterSlave', label: 'Metadata 資料庫', region: '美國', zone: '美國主機房（後端）', x: 1050, y: 645, size: 'small', arriveLabel: '讀取或寫入 Metadata 資料庫' },
          ...regionNode('jp', '日本', 720, 780, 840),
          { id: 'uploadBadge', kind: 'component', componentId: 'resumableUpload', label: '斷點續傳', x: 1050, y: 220, size: 'small', arriveLabel: '檢查已成功的位元組位置' },
          { id: 'preSignedBadge', kind: 'component', componentId: 'preSignedUpload', label: '預簽名直傳', x: 860, y: 880, size: 'small', arriveLabel: '直接對原始儲存系統上傳，略過 API 伺服器' }
        ],
        edges: [
          ...regionEdges('tw'), ...regionEdges('us'), ...regionEdges('jp'),
          { from: 'storage', to: 'transcodeArch' },
          { from: 'storage', to: 'uploadBadge', kind: 'stub' }
        ],
        // `regionId` picks which region's edge stack the request enters through. Watching a
        // video (`watch`) never visits `apiServer_*` — it's routed entirely through the region's
        // own `streamServer_*` pool instead, which is the whole point of separating the two
        // tiers. The backend origin it eventually reaches is always the same centralized
        // cluster, so a Taiwan/Japan request's last leg into that cluster is the one
        // crossRegionWeight makes visibly slower; a US request's isn't.
        computeFlow: (kind, ctx, regionId = 'us') => {
          const r = regionId;
          if (kind === 'upload') {
            return ctx.has('preSignedUpload')
              ? [`users_${r}`, 'storage', 'transcodeArch', 'storage']
              : [`users_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'storage', 'transcodeArch', 'storage'];
          }
          if (kind === 'search') {
            return [`users_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'metadataCache', `apiServer_${r}`, `users_${r}`];
          }
          // Where the video bytes physically come from, which is exactly what the CDN decision
          // buys you and the one thing the picture has to tell the truth about:
          //   不建 CDN  → there is no edge node, so every single view walks the full path to
          //               this region's own streaming servers and back. The CDN node is never
          //               visited, because it does not exist.
          //   有 CDN    → most views are answered by the region's edge node and stop there
          //               (users → cdn → users, a real cache hit); the remaining misses still
          //               have to go all the way to the origin and back out through the edge.
          const cdn = ctx.option('cdnTier');
          if (cdn.id === 'off') {
            return [`users_${r}`, `loadBalancer_${r}`, `streamServer_${r}`, 'storage', `streamServer_${r}`, `loadBalancer_${r}`, `users_${r}`];
          }
          if (Math.random() < (cdn.hitRate || 0)) return [`users_${r}`, `cdn_${r}`, `users_${r}`];
          return [`users_${r}`, `cdn_${r}`, `loadBalancer_${r}`, `streamServer_${r}`, 'storage', `streamServer_${r}`, `loadBalancer_${r}`, `cdn_${r}`, `users_${r}`];
        }
      };
    })(),
    chunkSim: {
      total: 6,
      resumeComponentId: 'resumableUpload',
      crashNodeId: 'storage',
      label: '一部 2GB 的影片原始檔',
      startLabel: '開始上傳這部影片'
    },
    // Adaptive bitrate playback: standard throughput-based ABR behaviour every real DASH/HLS
    // client uses (not gated behind any of the on/off capabilities above) — the player measures
    // achieved bandwidth for the segment it just fetched and picks the next segment's quality
    // from that, stepping down fast (to protect the buffer) but climbing back up only one tier
    // at a time.
    abrSim: {
      label: '自適應畫質播放實驗室',
      desc: '模擬播放一部影片，畫面切成一個個 5 秒片段：每段要用什麼畫質，由播放器當下量測到的頻寬決定——網路變差時下一段就會自動降到較低畫質以保護緩衝區，避免播放卡頓；網路恢復後畫質會逐步爬升回去，不會一次跳滿格。',
      segments: 16,
      segmentSec: 5,
      tickMs: 650,
      maxBufferSec: 15,
      poorMbpsRange: [0.4, 1.6],
      goodMbpsRange: [4.0, 7.5],
      ladder: [
        { id: '360p', label: '360p', mbps: 1.0 },
        { id: '480p', label: '480p', mbps: 2.5 },
        { id: '720p', label: '720p', mbps: 5.0 }
      ]
    },
    // A draggable avatar that lives INSIDE a region box — it starts in Taiwan, so Taiwan's stack
    // serves it, and dragging it into another region's box genuinely hands it over to that
    // region's nodes. Its video segments travel the same computeFlow path everything else uses,
    // so when the CDN is on and the segment hits the edge, the packet visibly leaves the CDN
    // node; when it misses (or there is no CDN at all) it comes all the way from the streaming
    // servers. The bad-signal zone is a separate draggable object, so you can park it over
    // whichever region you want to test.
    dragViewerSim: {
      homeRegionId: 'tw',
      start: { x: 190, y: 66 },
      zone: { x: 550, y: 260, width: 300, height: 80, label: '📶 訊號不良區（可拖曳移動）' }
    },
    events: [
      {
        month: 2,
        id: 'dbMasterDown',
        title: 'Metadata 主資料庫（Master）當機',
        relevantComponents: ['dbMasterSlave'],
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us', 'metadataDB'],
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
        title: '一台 API（搜尋／上架）伺服器當機',
        relevantComponents: ['apiRedundancy'],
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us'],
        narrative: '負責搜尋與上架的其中一台 API 伺服器硬體故障離線，這台伺服器原本承擔的請求全部需要別人接手（觀看影片走的是另一組完全獨立的串流伺服器，備援策略也是分開決定的，這次事件不受影響）。',
        resolve: ctx => {
          const choice = ctx.get('apiRedundancy');
          if (choice === 'warmStandby') return { uptime: 0, qoe: 0, log: '熱備援伺服器立即接手，容量足夠吸收這些流量，幾乎沒人感覺得到。', ok: true };
          if (choice === 'autoScale') return { uptime: -3, qoe: -3, log: 'Auto scaling 觸發後幾分鐘內開出新伺服器，這段等待期間容量偏緊，部分請求回應變慢。', ok: true };
          return { uptime: -9, qoe: -8, log: '只有一台在跑又沒有備援容量，它一掛整條搜尋／上架的路就斷了，請求大量逾時失敗。', ok: false };
        }
      },
      {
        month: 5,
        id: 'streamServerDown',
        title: '一台串流伺服器當機',
        relevantComponents: ['streamRedundancy'],
        demoFlow: ['users_us', 'loadBalancer_us', 'streamServer_us'],
        narrative: '負責影片播放的其中一台串流伺服器硬體故障離線——這組伺服器跟處理搜尋／上架的 API 伺服器是完全分開的機器，備援策略也要另外準備，不能靠 API 那邊的設定。',
        resolve: ctx => {
          const choice = ctx.get('streamRedundancy');
          if (choice === 'warmStandby') return { uptime: 0, qoe: 0, log: '熱備援伺服器立即接手，容量足夠吸收這些流量，觀眾幾乎沒有感覺。', ok: true };
          if (choice === 'autoScale') return { uptime: -2, qoe: -4, log: 'Auto scaling 觸發後幾分鐘內開出新伺服器，這段等待期間不少人畫面卡頓或緩衝變久。', ok: true };
          return { uptime: -4, qoe: -12, log: '只有一台在跑又沒有備援容量，它一掛，所有沒有在 CDN 命中的觀看請求直接失敗，大量觀眾影片卡死。', ok: false };
        }
      },
      {
        month: 6,
        id: 'workerStuck',
        title: '轉碼工作程序當機，任務卡死',
        relevantComponents: ['transcodeResilience'],
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us', 'storage', 'transcodeArch'],
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
        title: '內容團隊要求檢視 CDN 與頻寬費用',
        relevantComponents: ['cdnTier'],
        severity: 'cost',
        narrative: '影片庫累積了大量早期熱門、現在幾乎沒人看的舊影片，財務部門要求說明這個月的內容傳遞費用到底花在哪裡。',
        resolve: ctx => {
          const choice = ctx.get('cdnTier');
          if (choice === 'popularOnly') {
            return { qoe: 0, uptime: 0, log: '長尾內容早就只留在自己的伺服器提供服務，只有真正有人看的影片佔用 CDN，費用一直符合預期，這次檢視很快就結束了。', ok: true };
          }
          if (choice === 'all') {
            return { qoe: -3, uptime: 0, log: '不管冷門熱門全部都進 CDN，其中一大部分容量其實在服務幾乎沒人看的舊影片，帳單明顯偏高，團隊被要求緊急檢討分層策略。', ok: false };
          }
          return { qoe: -6, uptime: -2, log: '完全沒有 CDN，所有影片位元組都從自己的機房出去——源站頻寬帳單比 CDN 方案還貴，串流伺服器也長期在高負載邊緣，遠端地區的觀眾緩衝時間明顯偏長。', ok: false };
        }
      },
      {
        month: 10,
        id: 'cacheNodeDown',
        title: 'Metadata 快取節點當機',
        relevantComponents: ['cacheReplica'],
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us', 'metadataCache'],
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
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us', 'metadataCache', 'storage', 'transcodeArch'],
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
      if (score >= 90) return { letter: 'S', text: '你在成本、可用率與播放品質之間做出了非常成熟的取捨，這年撐過了書裡列出的每一種真實故障，容量也一路跟上了成長。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件或某幾個月的容量吃緊讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '架構撐過了這一年，但至少有一次事件或一段時間的超載造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，這套架構撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件與長期超載中直接被打垮，回教材重新想一次每個能力真正解決的問題，再挑戰一次。' };
    }
  };
})();
