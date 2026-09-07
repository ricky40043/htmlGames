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
  const MB = 1024 * 1024;

  // ---------------------------------------------------------------------------------------
  // ONE recipe for a region's stack. The three starting regions are built from it, and so is
  // any region the player invents mid-run via the architecture editor — which is the whole
  // point: the architecture is generated from a blueprint, not hard-coded three times.
  // `regionKey` on the pool nodes is what ties a machine to its region for load accounting.
  // ---------------------------------------------------------------------------------------
  const regionNode = (r, label, yUpper, yCenter, yLower) => [
    { id: `users_${r}`, kind: 'user', label: `觀眾（${label}）`, region: label, regionKey: r, x: 90, y: yCenter, arriveLabel: '使用者裝置收到回應' },
    { id: `clientChunker_${r}`, kind: 'fixed', label: `上傳分塊器（${label}）`, region: label, regionKey: r, x: 280, y: yLower, size: 'small', arriveLabel: '瀏覽器串流讀取原始影片，切成可重試的小封包並計算 checksum' },
    { id: `cdn_${r}`, kind: 'component', componentId: 'cdnTier', label: `CDN（${label}）`, region: label, regionKey: r, x: 280, y: yUpper, arriveLabel: '檢查這部影片有沒有在這個地區的邊緣節點命中' },
    { id: `loadBalancer_${r}`, kind: 'fixed', label: `Load Balancer（${label}）`, region: label, regionKey: r, x: 480, y: yCenter, arriveLabel: '健康檢查後依路徑把請求導向 API 或串流伺服器群組' },
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
    { from: `users_${r}`, to: `clientChunker_${r}` },
    { from: `clientChunker_${r}`, to: `loadBalancer_${r}` },
    { from: `loadBalancer_${r}`, to: `apiServer_${r}` },
    // Both CDN legs are gated on the CDN actually existing: with 不建 CDN selected there is
    // no edge node in this region at all, so these two wires go dashed and computeFlow
    // routes watch traffic straight through the load balancer to the origin instead.
    { from: `users_${r}`, to: `cdn_${r}`, requiresComponent: 'cdnTier' },
    { from: `cdn_${r}`, to: `loadBalancer_${r}`, requiresComponent: 'cdnTier' },
    { from: `loadBalancer_${r}`, to: `streamServer_${r}` },
    { from: `streamServer_${r}`, to: 'transcodedStorage' },
    { from: `apiServer_${r}`, to: 'storage' },
    { from: `apiServer_${r}`, to: 'metadataCache' },
    { from: `apiServer_${r}`, to: 'metadataDB', kind: 'stub' },
    { from: `clientChunker_${r}`, to: 'preSignedBadge', kind: 'stub', requiresComponent: 'preSignedUpload' }
  ];

  window.SYSTEM_DESIGN_SIM['sd-book-14'] = {
    chapterId: 'sd-book-14',
    title: 'YouTube 生存戰：撐過爆紅的第一年',
    subtitle: '你接手一個剛起步的影片平台。12 個月內，尖峰同時觀看人數會從 5,000 成長到超過一百五十萬，中間會發生書裡「錯誤處理」一節列出的那些真實故障：資料庫 Master 當機、API 伺服器掛掉、轉檔工作程序卡死、快取節點失效。你在每個月初決定每個能力要用哪一種做法、每個地區要開幾台機器——事件發生時不能再改變主意，只能承擔當下選擇的後果。',
    briefing: [
      '**每一台機器都是獨立的**：伺服器群組裡的每一台都有自己的編號（#1、#2…）。**點某一台就可以把它拔掉**模擬當機——負載平衡器會立刻改導到還活著的機器，而「正在傳給那一台的請求」會當場中斷，你會看到封包在半路變紅消失。再點一次就把它插回去。一般能力節點直接點圓球即可切換；伺服器群組要換備援策略則點上方有底線的文字。',
      '**節點上的符號**：✓ 有做保護 · ⚠ 機器照跑但沒備援，壞一台就有事 · ✕ 這個東西你還沒建（例如還沒買 CDN），流量不會經過它，連線也是虛線。伺服器不會因為你沒開備援就消失。',
      '**架構是你自己蓋的**：下面的「架構編輯」可以**新增／移除地區**（新地區會照同一份藍圖生出自己的 CDN、LB、串流與 API 伺服器），節點旁的 **＋／－** 可以加開或收掉機器，「＋100 人」會在你選的地區生出一個**獨立的使用者群組節點**，還能直接拖到別的地區——拖過去，那一區的負載就跟著變。',
      '**容量是真的在算的**：地區觀眾數 ÷ 那一區的機器容量 = 負載率，超過 100% 變紅色，每推進一個月會扣播放品質分數。總觀眾人數是固定的，多開一個地區就是把同一群人分散開來。',
      '**CDN 決定流量從哪裡出來**：沒建 CDN 時每一次觀看都要回源到你自己的串流伺服器；建了之後大多數觀看在地區 CDN 就直接回覆，根本不碰後面的機器——封包動畫會直接顯示這個差別。',
      '**直接比較觀眾的播放感受**：播放器比較器會先放入一段 5 秒影片，再同時下載下一段。從台灣 CDN 抓 720p 能一直維持播放；跨海回美國抓同一段會先把緩衝耗光、出現轉圈圈，接著 ABR 自動改抓球更小、下載更快的低解析度版本。',
      '**影片不是一整顆送出去**：瀏覽器會先用上傳分塊器串流讀取原始影片，切成可獨立重試的小封包並計算 checksum。模擬上傳時會看到一列粉紅色影片封包依序送出；紫色是 Metadata，黃色才是一般 API 請求。',
      '**100 人隨機操作模式**：啟動後會自動混合觀看影片、搜尋與上傳，100 個操作各自走真實路由、分配到不同伺服器，並留下 Request 與資料寫入紀錄；可隨時按停止。',
      '**測試觀眾（🙋）**：他站在哪個地區的框裡就由那一區服務，可以拖到別區，也可以按「讓觀眾隨機走動」讓他自己亂走。訊號不良區可以拖、也可以拉右下角縮放。注意畫質**不會馬上變**——正在傳的那一段會照原畫質播完，要等下一段收到之後才會降或升，跟真實播放器一樣。',
      '拓樸圖上每個地區各有自己獨立的 CDN、Load Balancer——後面又分成兩條路：搜尋／上架影片打「API 伺服器」，觀看影片走「串流伺服器」，兩者是分開的伺服器群組，不會互相影響。後端則完整保留教材的原始儲存、轉碼、已轉碼儲存、完成事件佇列／處理器、Metadata DB／快取；跨海過去在動畫上會明顯變慢。'
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
    // regionWeight is a WEIGHT, not a fixed percentage: the same total audience is split across
    // however many regions currently exist, so adding a region genuinely relieves the others
    // instead of conjuring new viewers out of nowhere.
    capacity: {
      regionWeight: { tw: 1, us: 2, jp: 1 },
      apiRatio: 0.2,
      offloadFrom: 'cdnTier'
    },
    // The topology is a STARTING architecture the player edits at runtime, not a fixed picture:
    // regions, machines and user groups are all added and removed during the run. See
    // `regionBlueprint` below for how a region the player invents actually gets built.
    mutableTopology: true,
    draggableTopology: true,
    dataModel: {
      stores: [
        {
          id: 'youtubeMetadata', nodeId: 'metadataDB', kind: 'database', label: 'YouTube Metadata 資料庫',
          description: '保存影片、上傳 session、轉碼任務、rendition 與觀看事件；大型影音位元組另存在 Object Storage。',
          tables: [
            { id: 'video', label: 'videos', key: 'video_id', schema: [
              { name: 'video_id', type: 'uuid', note: '影片 ID' }, { name: 'title', type: 'varchar', note: '影片標題' },
              { name: 'owner_id', type: 'uuid', note: '上傳者' }, { name: 'status', type: 'enum', note: 'uploading / processing / ready' },
              { name: 'size_bytes', type: 'bigint', note: '原始檔大小' }, { name: 'created_at', type: 'timestamp', note: '建立時間' }
            ] },
            { id: 'upload_session', label: 'upload_sessions', key: 'session_id', schema: [
              { name: 'session_id', type: 'uuid', note: '可續傳 session' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
              { name: 'status', type: 'enum', note: 'active / completed / interrupted' }, { name: 'uploaded_bytes', type: 'bigint', note: '已耐久寫入位元組' }
            ] },
            { id: 'transcode_job', label: 'transcode_jobs', key: 'job_id', schema: [
              { name: 'job_id', type: 'uuid', note: 'DAG 工作 ID' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
              { name: 'status', type: 'enum', note: 'queued / running / completed' }, { name: 'worker', type: 'varchar', note: '執行的 worker' }
            ] },
            { id: 'rendition', label: 'renditions', key: 'rendition_id', schema: [
              { name: 'rendition_id', type: 'uuid', note: '轉碼輸出 ID' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
              { name: 'profile', type: 'varchar', note: '360p / 480p / 720p' }, { name: 'object_key', type: 'varchar', note: '物件儲存鍵' }
            ] },
            { id: 'view_event', label: 'view_events', schema: [
              { name: 'event_id', type: 'uuid', note: '觀看事件' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
              { name: 'region', type: 'varchar', note: '來源地區' }, { name: 'delivery', type: 'varchar', note: 'CDN hit / origin' }
            ] },
            { id: 'search_query', label: 'search_queries', schema: [
              { name: 'query_id', type: 'uuid', note: '查詢事件' }, { name: 'query', type: 'varchar', note: '搜尋字串' }, { name: 'region', type: 'varchar', note: '來源地區' }
            ] }
          ]
        },
        {
          id: 'youtubeObjects', nodeId: 'storage', kind: 'object storage', label: '原始影片儲存系統',
          description: '保存創作者剛上傳、尚未轉碼的原始影片；轉碼工作程序從這裡讀取輸入。',
          tables: [{ id: 'objects', label: 'raw video objects', key: 'object_key', schema: [
            { name: 'object_key', type: 'varchar', note: '物件鍵' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
            { name: 'kind', type: 'enum', note: 'raw' }, { name: 'bytes', type: 'bigint', note: '物件大小' }
          ] }]
        },
        {
          id: 'youtubeRenditions', nodeId: 'transcodedStorage', kind: 'object storage', label: '已轉碼影片儲存系統',
          description: '保存轉碼完成的各解析度影片；串流伺服器與 CDN 從這裡取得可播放內容。',
          tables: [{ id: 'objects', label: 'rendition objects', key: 'object_key', schema: [
            { name: 'object_key', type: 'varchar', note: '各畫質輸出物件鍵' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
            { name: 'profile', type: 'varchar', note: '360p / 480p / 720p' }, { name: 'bytes', type: 'bigint', note: '轉碼後物件大小' }
          ] }]
        },
        {
          id: 'youtubeCompletionQueue', nodeId: 'completionQueue', kind: 'durable queue', label: '完成事件訊息佇列',
          description: '轉碼輸出確實落地後才加入完成事件；處理器可重試，不必讓轉碼工作同步等待資料庫。',
          tables: [{ id: 'messages', label: 'completion events', key: 'event_id', schema: [
            { name: 'event_id', type: 'uuid', note: '完成事件 ID' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
            { name: 'event', type: 'enum', note: 'transcode.completed' }, { name: 'status', type: 'enum', note: 'queued / handled' }
          ] }]
        },
        {
          id: 'youtubeCache', nodeId: 'metadataCache', kind: 'cache', label: '影片 Metadata 快取',
          description: '提供熱門影片資料；上架完成時寫入最新 ready 狀態。',
          tables: [{ id: 'entries', label: 'cache entries', key: 'cache_key', schema: [
            { name: 'cache_key', type: 'varchar', note: 'video:{id}' }, { name: 'video_id', type: 'uuid', note: '影片 ID' },
            { name: 'status', type: 'enum', note: 'ready / invalidated' }
          ] }]
        }
      ]
    },
    operationFactory: (kind, seq, ctx) => {
      const pad = String(seq).padStart(3, '0');
      const videoId = `video-${pad}`;
      const region = ctx.regionId || 'us';
      const at = `第 ${ctx.month} 月 / #${seq}`;
      if (kind === 'upload') {
        const title = ctx.payload?.title || `教學影片 ${pad}`;
        const bytes = Number(ctx.payload?.size_bytes) || (260 + seq * 20) * MB;
        return {
          label: `上傳「${title}」`,
          payload: { video_id: videoId, title, size_bytes: bytes, region, upload_mode: ctx.choices.has('preSignedUpload') ? 'pre-signed direct' : 'via API' },
          writesOnHop: [
            { nodeId: 'metadataDB', storeId: 'youtubeMetadata', tableId: 'video', key: 'video_id', row: { video_id: videoId, title, owner_id: 'creator-demo', status: 'uploading', size_bytes: bytes, created_at: at } },
            { nodeId: 'metadataDB', storeId: 'youtubeMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, video_id: videoId, status: 'active', uploaded_bytes: 0 } }
          ],
          writesOnComplete: [
            { storeId: 'youtubeMetadata', tableId: 'video', key: 'video_id', row: { video_id: videoId, status: 'ready' } },
            { storeId: 'youtubeMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, video_id: videoId, status: 'completed', uploaded_bytes: bytes } },
            { storeId: 'youtubeMetadata', tableId: 'transcode_job', key: 'job_id', row: { job_id: `job-${pad}`, video_id: videoId, status: 'completed', worker: `worker-${(seq - 1) % 3 + 1}` } },
            { storeId: 'youtubeMetadata', tableId: 'rendition', key: 'rendition_id', row: { rendition_id: `rendition-${pad}-720p`, video_id: videoId, profile: '720p', object_key: `renditions/${videoId}/720p.m3u8` } },
            { storeId: 'youtubeObjects', tableId: 'objects', key: 'object_key', row: { object_key: `raw/${videoId}`, video_id: videoId, kind: 'raw', bytes } },
            { storeId: 'youtubeRenditions', tableId: 'objects', key: 'object_key', row: { object_key: `renditions/${videoId}/720p.m3u8`, video_id: videoId, profile: '720p', bytes: Math.round(bytes * 0.58) } },
            { storeId: 'youtubeCompletionQueue', tableId: 'messages', key: 'event_id', row: { event_id: `complete-${pad}`, video_id: videoId, event: 'transcode.completed', status: 'handled' } },
            { storeId: 'youtubeCache', tableId: 'entries', key: 'cache_key', row: { cache_key: `video:${videoId}`, video_id: videoId, status: 'ready' } }
          ],
          writesOnFail: [{ storeId: 'youtubeMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, video_id: videoId, status: 'interrupted' } }]
        };
      }
      if (kind === 'search') return {
        label: `搜尋影片 #${pad}`,
        payload: { query: `system design ${pad}`, region },
        writesOnComplete: [{ storeId: 'youtubeMetadata', tableId: 'search_query', row: { query_id: `query-${pad}`, query: `system design ${pad}`, region } }]
      };
      return {
        label: `觀看影片 #${pad}`,
        payload: { video_id: `video-${String(Math.max(1, seq)).padStart(3, '0')}`, region },
        writesOnComplete: [{ storeId: 'youtubeMetadata', tableId: 'view_event', row: { event_id: `view-${pad}`, video_id: `video-${String(Math.max(1, seq)).padStart(3, '0')}`, region, delivery: ctx.choices.has('cdnTier') ? 'CDN / origin 依命中率' : 'origin' } }]
      };
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
        ...ref('sd14-s09-p04'),
        options: [
          { ...OFF_ALWAYS('無備援（壞掉沒有人接手）'), instances: 1 },
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
          { ...OFF_ALWAYS('無備援（壞掉沒有人接手）'), instances: 1 },
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
        ...ref('sd14-s09-p04'),
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
        ...ref('sd14-s09-p05'),
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
        ...ref('sd14-s09-p05'),
        options: [
          { ...OFF_ALWAYS('沒有容錯（當掉就卡死）'), instances: 1 },
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
        ...ref('sd14-s03-p02'),
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
    // How the architecture editor builds a region the player adds at runtime: the exact same
    // blueprint the three starting regions came from, laid out on a fresh row below them.
    regionBlueprint: {
      maxRegions: 6,
      rowGap: 200,
      defaultWeight: 1,
      nodes: (key, name, baseY) => regionNode(key, name, baseY, baseY + 60, baseY + 120),
      edges: key => regionEdges(key)
    },
    topology: (() => {
      return {
        viewBox: '0 0 1450 950',
        regionIds: ['tw', 'us', 'jp'],
        regionLabel: { tw: '台灣', us: '美國', jp: '日本' },
        crossRegionWeight: 3.4,
        nodes: [
          ...regionNode('tw', '台灣', 80, 140, 200),
          ...regionNode('us', '美國', 400, 460, 520),
          {
            id: 'transcodeArch', kind: 'component', componentId: 'transcodeResilience', label: '轉碼架構',
            region: '美國', zone: '美國主機房（後端）', x: 1080, y: 340, pool: true, extraInstanceCost: 2,
            arriveLabel: 'DAG 排程器指派任務給某一台工作程序'
          },
          { id: 'storage', kind: 'fixed', label: '原始影片儲存', region: '美國', zone: '美國主機房（後端）', x: 880, y: 340, arriveLabel: '耐久保存尚未轉碼的原始影片' },
          { id: 'transcodedStorage', kind: 'fixed', label: '已轉碼影片儲存', region: '美國', zone: '美國主機房（後端）', x: 1280, y: 340, arriveLabel: '保存各解析度輸出，供 CDN 與串流伺服器取得' },
          { id: 'completionQueue', kind: 'fixed', label: '完成事件佇列', region: '美國', zone: '美國主機房（後端）', x: 1280, y: 500, arriveLabel: '排入 transcode.completed 事件' },
          { id: 'completionHandler', kind: 'fixed', label: '完成事件處理器', region: '美國', zone: '美國主機房（後端）', x: 1080, y: 500, arriveLabel: '取出事件，可靠地更新 Metadata' },
          { id: 'metadataCache', kind: 'component', componentId: 'cacheReplica', label: 'Metadata 快取', region: '美國', zone: '美國主機房（後端）', x: 980, y: 650, arriveLabel: '更新或取得影片 Metadata 快取' },
          { id: 'metadataDB', kind: 'component', componentId: 'dbMasterSlave', label: 'Metadata 資料庫', region: '美國', zone: '美國主機房（後端）', x: 1210, y: 650, size: 'small', arriveLabel: '讀取或寫入影片狀態與轉碼結果' },
          ...regionNode('jp', '日本', 720, 780, 840),
          { id: 'uploadBadge', kind: 'component', componentId: 'resumableUpload', label: '斷點續傳', x: 880, y: 500, size: 'small', arriveLabel: '檢查已成功的位元組位置' },
          { id: 'preSignedBadge', kind: 'component', componentId: 'preSignedUpload', label: '預簽名直傳', x: 880, y: 210, size: 'small', arriveLabel: '取得授權後直接把原始影片上傳到物件儲存' }
        ],
        edges: [
          ...regionEdges('tw'), ...regionEdges('us'), ...regionEdges('jp'),
          { from: 'storage', to: 'transcodeArch' },
          { from: 'transcodeArch', to: 'transcodedStorage' },
          { from: 'transcodedStorage', to: 'completionQueue' },
          { from: 'completionQueue', to: 'completionHandler' },
          { from: 'completionHandler', to: 'metadataDB' },
          { from: 'completionHandler', to: 'metadataCache' },
          { from: 'storage', to: 'uploadBadge', kind: 'stub' },
          { from: 'preSignedBadge', to: 'storage', requiresComponent: 'preSignedUpload' }
        ],
        // `regionId` picks which region's edge stack the request enters through. Watching a
        // video (`watch`) never visits `apiServer_*` — it's routed entirely through the region's
        // own `streamServer_*` pool instead, which is the whole point of separating the two
        // tiers. The backend origin it eventually reaches is always the same centralized
        // cluster, so a Taiwan/Japan request's last leg into that cluster is the one
        // crossRegionWeight makes visibly slower; a US request's isn't.
        computeFlows: (kind, ctx, regionId = 'us') => {
          if (kind !== 'upload') return null;
          const r = regionId;
          const metadata = {
            id: 'metadata',
            label: 'Metadata：先建立影片與 upload session，再更新快取',
            payloadType: 'metadata',
            nodes: [`users_${r}`, `clientChunker_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'metadataDB', `apiServer_${r}`, 'metadataCache', `apiServer_${r}`, `loadBalancer_${r}`, `users_${r}`]
          };
          const bytes = ctx.has('preSignedUpload')
            ? {
                id: 'bytes',
                label: '影片封包：客戶端切分 → 預簽直傳 → 轉碼 → 完成事件',
                payloadType: 'video',
                packetCount: 6,
                packetLabel: '原始影片',
                chunkBytes: 4 * MB,
                nodes: [`users_${r}`, `clientChunker_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, `loadBalancer_${r}`, `clientChunker_${r}`, 'preSignedBadge', 'storage', 'transcodeArch', 'transcodedStorage', 'completionQueue', 'completionHandler', 'metadataDB', 'completionHandler', 'metadataCache']
              }
            : {
                id: 'bytes',
                label: '影片封包：客戶端切分 → API 中轉 → 轉碼 → 完成事件',
                payloadType: 'video',
                packetCount: 6,
                packetLabel: '原始影片',
                chunkBytes: 4 * MB,
                nodes: [`users_${r}`, `clientChunker_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'storage', 'transcodeArch', 'transcodedStorage', 'completionQueue', 'completionHandler', 'metadataDB', 'completionHandler', 'metadataCache']
              };
          return [metadata, bytes];
        },
        computeFlow: (kind, ctx, regionId = 'us') => {
          const r = regionId;
          if (kind === 'upload') {
            return ctx.has('preSignedUpload')
              ? [`users_${r}`, `clientChunker_${r}`, 'preSignedBadge', 'storage', 'transcodeArch', 'transcodedStorage', 'completionQueue', 'completionHandler', 'metadataDB']
              : [`users_${r}`, `clientChunker_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'storage', 'transcodeArch', 'transcodedStorage', 'completionQueue', 'completionHandler', 'metadataDB'];
          }
          if (kind === 'search') {
            return [`users_${r}`, `loadBalancer_${r}`, `apiServer_${r}`, 'metadataCache', `apiServer_${r}`, `loadBalancer_${r}`, `users_${r}`];
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
            return [`users_${r}`, `loadBalancer_${r}`, `streamServer_${r}`, 'transcodedStorage', `streamServer_${r}`, `loadBalancer_${r}`, `users_${r}`];
          }
          if (Math.random() < (cdn.hitRate || 0)) return [`users_${r}`, `cdn_${r}`, `users_${r}`];
          return [`users_${r}`, `cdn_${r}`, `loadBalancer_${r}`, `streamServer_${r}`, 'transcodedStorage', `streamServer_${r}`, `loadBalancer_${r}`, `cdn_${r}`, `users_${r}`];
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
      label: 'CDN vs 美國來源站：真實播放器體驗',
      desc: '進入模擬後，這部 1 小時影片會立刻開始加速播放；它被切成 720 個、每個 5 秒的片段。第一段已預先載入，所以前五秒正常播放；同時下載第二段。台灣 CDN 的 720p 片段能在緩衝用完前抵達，美國來源站的同一顆 720p 球因為位元組較大又跨海，會下載超過五秒，播放器先轉圈，再由 ABR 改抓更小、更快的低解析度片段。上方 CDN 節點開啟或關閉時，播放器也會保留進度並自動切換來源。',
      segments: 720,
      segmentSec: 5,
      simSecondMs: 50,
      maxBufferSec: 15,
      sources: {
        cdn: { label: '台灣 CDN 命中', short: '台灣 CDN', throughput: 18, latency: 0.08 },
        origin: { label: '美國來源站（跨海回源）', short: '美國回源', throughput: 2.8, latency: 1.6 }
      },
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
        demoFlow: ['users_us', 'loadBalancer_us', 'apiServer_us', 'storage', 'transcodeArch', 'transcodedStorage', 'completionQueue', 'completionHandler', 'metadataCache'],
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
