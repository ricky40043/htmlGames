(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });
  const OFF_ALWAYS = label => ({ id: 'off', label, cost: 0 });

  // ---------------------------------------------------------------------------------------
  // One recipe for a service region. The three starting regions are built from it, and so is
  // any region the player adds mid-run — the whole point of the architecture editor is that
  // "開一個新的服務地區" runs the same blueprint rather than hitting a hard-coded third case.
  //
  // Three separate machine pools per region, because this chapter's entire argument is that
  // the three kinds of traffic have completely different shapes:
  //   tile     — huge, read-only, identical for everyone → an edge cache can absorb almost all
  //   nav      — moderate, compute-heavy, per-request
  //   location — enormous write rate, but only if you refuse to batch it
  // ---------------------------------------------------------------------------------------
  const regionNode = (r, label, base) => [
    { id: `pop_${r}`, kind: 'component', componentId: 'tileDelivery', label: `存放點 POP（${label}）`, region: label, regionKey: r, x: 275, y: base, arriveLabel: '檢查這一批圖塊有沒有在這個地區的存放點命中' },
    {
      // Deliberately NOT tied to `tileDelivery`: the origin tile servers exist whether or not
      // you have built any edge POPs. Wiring them to the optional component would draw them
      // with a ✕ while traffic still visibly flowed through them — the exact "why is a dead
      // server still transmitting" contradiction this engine already had to be fixed for once.
      id: `tileServer_${r}`, kind: 'component', componentId: 'tileRedundancy',
      label: `圖塊伺服器（${label}）`, region: label, x: 680, y: base, pool: true,
      regionKey: r, loadKind: 'tile', capacityPerInstance: 90000, extraInstanceCost: 2,
      arriveLabel: '從原始圖片儲存取出圖塊送回去'
    },
    { id: `users_${r}`, kind: 'user', label: `使用者（${label}）`, region: label, regionKey: r, x: 90, y: base + 120, arriveLabel: '手機上的地圖 App 收到回應' },
    { id: `loadBalancer_${r}`, kind: 'fixed', label: `Load Balancer（${label}）`, region: label, regionKey: r, x: 470, y: base + 120, arriveLabel: '依請求種類導向圖塊、導航或位置服務' },
    {
      id: `navServer_${r}`, kind: 'component', componentId: 'navRedundancy',
      label: `導航伺服器（${label}）`, region: label, x: 680, y: base + 120, pool: true,
      regionKey: r, loadKind: 'nav', capacityPerInstance: 60000, extraInstanceCost: 2,
      arriveLabel: '把起訖點地理編碼後，載入路線圖塊算出路線'
    },
    { id: `tileUrlSvc_${r}`, kind: 'component', componentId: 'tileUrlSource', label: `圖塊服務（${label}）`, region: label, regionKey: r, x: 275, y: base + 240, size: 'small', arriveLabel: '用經緯度與縮放等級組出 9 個圖塊 URL' },
    {
      id: `locationServer_${r}`, kind: 'component', componentId: 'locationRedundancy',
      label: `位置服務（${label}）`, region: label, x: 680, y: base + 240, pool: true,
      regionKey: r, loadKind: 'location', capacityPerInstance: 60000, extraInstanceCost: 1,
      arriveLabel: '收下這一批座標並寫入位置資料庫'
    }
  ];

  const regionEdges = r => [
    { from: `users_${r}`, to: `loadBalancer_${r}` },
    // Both edge-cache legs are gated on a POP actually existing: with 不建存放點 selected there
    // is no edge node in this region at all, so these wires go dashed and every tile request
    // walks the full path to the origin instead.
    { from: `users_${r}`, to: `pop_${r}`, requiresComponent: 'tileDelivery' },
    { from: `pop_${r}`, to: `loadBalancer_${r}`, requiresComponent: 'tileDelivery' },
    { from: `loadBalancer_${r}`, to: `tileServer_${r}` },
    { from: `loadBalancer_${r}`, to: `navServer_${r}` },
    { from: `loadBalancer_${r}`, to: `locationServer_${r}` },
    { from: `loadBalancer_${r}`, to: `tileUrlSvc_${r}`, requiresComponent: 'tileUrlSource' },
    { from: `tileServer_${r}`, to: 'tileOrigin' },
    { from: `navServer_${r}`, to: 'geocodeDB' },
    { from: `navServer_${r}`, to: 'routingTiles' },
    { from: `locationServer_${r}`, to: 'locationDB' },
    { from: `locationServer_${r}`, to: 'streamBus', kind: 'stub', requiresComponent: 'locationStream' },
    // The batching decision lives on the client, so it gets its own badge node every region's
    // users wire up to — without a node on the diagram there would be nothing to click, and the
    // single biggest lever in this scenario would be invisible.
    { from: `users_${r}`, to: 'batchBadge', kind: 'stub' }
  ];

  window.SYSTEM_DESIGN_SIM['sd-book-17'] = {
    chapterId: 'sd-book-17',
    title: 'Google 地圖生存戰：讓十億人同時導航',
    subtitle: '你接手一個剛推出的地圖與導航服務。12 個月內，尖峰同時導航人數會從 8,000 成長到超過一百五十萬。同一群使用者會同時產生三種形狀完全不同的流量：唯讀而且巨量的地圖圖塊、運算很重的路線規劃、以及每一秒都在冒出來的位置回報。你在每個月初決定每個能力要用哪一種做法、每個地區要開幾台機器——事件發生時不能再改變主意。',
    briefing: [
      '**三條路徑是分開的**：載入地圖圖塊走「圖塊伺服器」、規劃路線走「導航伺服器」、回報位置走「位置服務」。三組機器分開計費、分開故障，備援策略也各自決定——這正是本章第 2 步高階設計的核心。',
      '**存放點決定圖塊從哪裡出來**：沒建存放點時，每一次載圖都要跨海回到原始伺服器；建了而且用**預先生成的靜態圖塊**時，絕大多數請求在本地存放點就直接回覆。**但如果你選「即時生成」，存放點會照樣蓋在那裡卻幾乎沒有命中**——因為位置與縮放的組合是無限的，快取根本沒有東西可以重複利用。封包動畫會直接演給你看這個差別。',
      '**位置回報的頻率就是你的寫入量**：每秒回報一次，位置服務要吃下全部的人；改成每 15 秒批次送出，寫入量直接少一個數量級。你可以在節點上看到負載率當場改變。',
      '**每一台機器都是獨立的**：點某一台（#1、#2…）就把它拔掉模擬當機，正在傳給它的請求會當場中斷變紅。再點一次插回去。點節點上方有底線的策略文字可以換做法，**＋／−** 加開或收掉機器。',
      '**節點上的符號**：✓ 有做保護 · ⚠ 機器照跑但沒備援 · ✕ 這個東西你還沒建（例如還沒設存放點、還沒加圖塊服務），流量不會經過它，連線是虛線。',
      '**架構是你自己蓋的**：「架構編輯」可以新增／移除服務地區（新地區會照同一份藍圖長出自己的存放點、Load Balancer、圖塊、導航與位置服務），也可以在指定地區生出獨立的使用者群組並拖到別區。總人數固定，多開一個地區就是把同一群人分散開。',
      '**測試駕駛（🙋）**：他站在哪個地區的框裡就由那一區服務，可以拖到別區，也可以讓他沿路移動。收訊死角可以拖、也可以拉右下角縮放。注意圖塊細節**不會馬上變**——正在傳的那一批照原細節送完，要等下一批收到之後才會降或升。'
    ],
    months: 12,
    viewersLabel: '目前尖峰同時導航人數估計',
    addUsersLabel: '＋100 使用者',
    demoLabels: {
      watch: '🗺️ 模擬載入一批地圖圖塊',
      upload: '📍 模擬回報一次位置',
      search: '🧭 模擬規劃一次導航路線'
    },
    concurrentViewersLabel: '👥 模擬 10 人同時載入同一區的地圖',
    viewersAtMonth: m => Math.round(8000 * Math.pow(1.55, m)),
    // Everything the engine says out loud, in this scenario's own words. Without this the
    // running commentary would call a driver「觀眾」and a map tile「影片」.
    lexicon: {
      viewer: '使用者',
      testViewer: '測試駕駛',
      item: '圖塊',
      segment: '圖塊',
      quality: '圖塊細節',
      edgeNode: '存放點（POP）',
      originNode: '圖塊伺服器',
      regionParts: '存放點、Load Balancer、圖塊伺服器、導航伺服器與位置服務',
      watchVerb: '載入',
      concurrentNoun: '同一區的地圖圖塊',
      wanderIdle: '🚗 讓駕駛沿路移動',
      wanderActive: '🚗 移動中（點一下停止）',
      zoneName: '收訊死角',
      edgeShort: '存放點',
      client: '地圖 App',
      itemMeasure: '批',
      overloadSymptom: '地圖載入變慢'
    },
    // How the headline concurrent-navigation number turns into per-node load. Three tiers, and
    // only one of them is absorbed by the edge cache. The location tier's ratio is a FUNCTION of
    // the player's batching choice, because that is precisely the lever the book uses to take
    // 300 萬 QPS down to 20 萬 — the diagram has to show that lever working.
    capacity: {
      regionWeight: { tw: 1, us: 2, eu: 1 },
      offloadKind: 'tile',
      offloadFrom: 'tileDelivery',
      loadRatio: {
        nav: 0.22,
        location: ctx => {
          const id = ctx.get('locationBatch');
          if (id === 'batch15') return 1 / 15;
          if (id === 'adaptive') return 1 / 20;
          return 1;               // 每秒回報一次：位置服務要吃下每一個人，每一秒
        }
      }
    },
    mutableTopology: true,
    components: [
      {
        id: 'tileDelivery',
        name: '地圖圖塊的供應方式',
        shortName: '圖塊供應',
        presence: 'optional',
        desc: '這是本章最重要的一個決定。位置與縮放等級的組合是無限的，所以「即時生成圖塊」不只運算貴，快取還幾乎完全失效——你會付存放點的錢卻拿不到命中率。改成用固定格線預先生成靜態圖塊、以地理雜湊命名之後，每一張圖塊都是可以被快取的檔案，絕大多數請求在最靠近使用者的存放點就結束了。',
        ...ref('sd17-s11-p03'),
        options: [
          { id: 'off', label: '不建存放點（每次載圖都回原始伺服器）', cost: 3, hitRate: 0, offload: 0, desc: '所有圖塊位元組都從中央的原始伺服器跨海送出，延遲是 300 毫秒等級，圖塊伺服器要扛下全部的人。' },
          { id: 'dynamic', label: '建了存放點，但圖塊即時生成', cost: 6, hitRate: 0.18, offload: 0.18, desc: '存放點蓋好了，但因為每個請求的位置與縮放組合幾乎都不一樣，快取命中率極低——你同時付了存放點與大量即時運算的錢。' },
          { id: 'static', label: '預先生成靜態圖塊，放進存放點', cost: 1, hitRate: 0.96, offload: 0.96, desc: '固定格線、地理雜湊命名的靜態 PNG，可以被完整快取。幾乎每一次載圖都在最近的存放點命中，延遲降到 10 毫秒等級。' }
        ]
      },
      {
        id: 'tileRedundancy',
        name: '圖塊伺服器備援容量',
        shortName: '圖塊備援',
        presence: 'always',
        desc: '存放點沒命中的請求，最後都要落到這一組機器上。它們一直都在——這裡選的是壞掉一台時有沒有人接手。注意這一組的壓力幾乎完全由「圖塊供應方式」決定：命中率 96% 時它們幾乎閒著，沒有存放點時它們要扛下每一個人。',
        ...ref('sd17-s11-p02'),
        options: [
          { ...OFF_ALWAYS('無備援（壞掉沒有人接手）'), instances: 1 },
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, instances: 2, desc: '流量升高時自動開新機器，成本較低，但生效前這幾分鐘地圖會載很慢。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, instances: 3, desc: '隨時有備援容量可以立即接手，但平常就要付這些機器的錢。' }
        ]
      },
      {
        id: 'locationBatch',
        name: '位置回報的頻率',
        shortName: '位置批次',
        presence: 'always',
        desc: '客戶端本機每秒都會記錄一次座標，但不代表每秒都要送出去。批次送出同時解決兩件事：伺服器的寫入 QPS 少一個數量級，手機的行動資料與電量消耗也跟著下降——正好是第 1 步寫下的那條非功能需求。',
        ...ref('sd17-s07-p03'),
        options: [
          { ...OFF_ALWAYS('每秒回報一次（完全不批次）'), cost: 3 },
          { id: 'batch15', label: '每 15 秒批次送出一包', cost: -2, desc: '本機每秒記錄、每 15 秒送一批，寫入 QPS 變成十五分之一，軌跡精度完全沒有損失。' },
          { id: 'adaptive', label: '依移動速度自動調整（塞車時降頻）', cost: -3, desc: '走得慢或塞在車陣裡時再降低回報頻率，寫入量更低，代價是多一層客戶端邏輯要維護。' }
        ]
      },
      {
        id: 'locationStore',
        name: '使用者位置資料庫',
        shortName: '位置資料庫',
        presence: 'always',
        desc: '位置更新是這個系統寫入量最大的資料流。資料庫一直都在，這裡選的是它擋不擋得住這種寫入形狀。',
        ...ref('sd17-s09-p03'),
        options: [
          OFF_ALWAYS('單一關聯式資料庫（單點寫入）'),
          { id: 'sharded', label: '分片的關聯式資料庫', cost: 1, desc: '用使用者切片分散寫入壓力，能撐一段時間，但重新分片很痛。' },
          { id: 'wideColumn', label: 'Cassandra 叢集（為高寫入優化）', cost: 2, desc: '針對高寫入量與時間序列設計，水平擴展容易，代價是查詢彈性較低。' }
        ]
      },
      {
        id: 'locationStream',
        name: '位置資料串流管線',
        shortName: '串流管線',
        presence: 'optional',
        desc: '位置資料不只是寫進資料庫就沒事了——它是即時路況、道路變化偵測與 Adaptive ETA 的輸入。把事件送進 Kafka 這類串流引擎，下游服務各自消費，新增或壞掉都不會影響位置的寫入路徑。沒建的話，下游只能直接去打位置資料庫。',
        ...ref('sd17-s09-p03'),
        options: [
          { id: 'off', label: '不建串流管線（下游直接查資料庫）', cost: 0 },
          { id: 'on', label: '建立 Kafka 串流管線', cost: 2, desc: '儲存與消費解耦，路況與 ETA 可以近即時更新。' }
        ]
      },
      {
        id: 'navRedundancy',
        name: '導航伺服器備援容量',
        shortName: '導航備援',
        presence: 'always',
        desc: '導航伺服器是無狀態的，單台當機時負載平衡器能把流量導到其他機器——差別在於備援容量是隨時待命還是當下才開。這條線只管路線規劃；載入圖塊與回報位置走的是完全不同的兩組機器。',
        ...ref('sd17-s10-p01'),
        options: [
          { ...OFF_ALWAYS('無備援（壞掉沒有人接手）'), instances: 1 },
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, instances: 2, desc: '負載升高時自動開新機器，成本較低，但生效前這幾分鐘容量會偏緊。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, instances: 3, desc: '隨時有備援容量可以立即接手，但平常就要付這些機器的錢。' }
        ]
      },
      {
        id: 'locationRedundancy',
        name: '位置服務備援容量',
        shortName: '位置備援',
        presence: 'always',
        desc: '位置服務掉了不會讓地圖畫不出來，但會讓即時路況與 ETA 立刻失去輸入——而且斷線期間客戶端累積的座標，回來時會一次湧進來。',
        ...ref('sd17-s09-p01'),
        options: [
          { ...OFF_ALWAYS('無備援（壞掉沒有人接手）'), instances: 1 },
          { id: 'autoScale', label: '自動擴縮容（觸發後約 3–5 分鐘生效）', cost: 1, instances: 2, desc: '寫入尖峰時自動加機器，但生效前那幾分鐘會掉資料。' },
          { id: 'warmStandby', label: '熱備援（固定多開 2 台待命）', cost: 3, instances: 3, desc: '重連風暴來的時候有容量直接吃下，代價是平常的閒置成本。' }
        ]
      },
      {
        id: 'routingTileLod',
        name: '路線圖塊的細節等級',
        shortName: '路線圖塊',
        presence: 'always',
        desc: '路網一定要切成路線圖塊，否則單一全球圖譜放不進記憶體。真正的取捨是要準備幾種細節等級：只有街道級圖塊時，一條跨國路線要拼起來的圖譜會大到算不動；備妥主幹道與州際公路等級之後，長途路線可以用粗圖塊算，只在起訖點附近才拉出街道細節。',
        ...ref('sd17-s05-p03'),
        options: [
          { ...OFF_ALWAYS('只有街道級路線圖塊'), instances: 1 },
          { id: 'twoLevel', label: '兩級（街道＋地區主幹道）', cost: 1, instances: 2, desc: '城際路線快很多，但跨國長途仍然要拼很多塊。' },
          { id: 'hierarchical', label: '三級階層（街道／主幹道／州際公路）', cost: 2, instances: 3, desc: '長途路線用最粗的等級算，跨等級的連結在交流道處銜接，記憶體與時間都收斂。' }
        ]
      },
      {
        id: 'tileUrlSource',
        name: '圖塊 URL 由誰計算',
        shortName: '圖塊 URL',
        presence: 'optional',
        desc: '客戶端可以自己用經緯度與縮放等級算出地理雜湊、直接組出圖塊 URL，少一次往返而且很快——代價是這個演算法寫死在所有平台的所有 App 裡，哪天要換編碼方式，得等所有使用者更新。改由伺服器端的圖塊服務來組 URL，多一次往返，換到的是隨時可以改變編碼方式的彈性。',
        ...ref('sd17-s12-p03'),
        options: [
          { id: 'off', label: '客戶端寫死地理雜湊演算法', cost: 0 },
          { id: 'on', label: '加一個地圖圖塊服務來組 URL', cost: 1, desc: '多一次往返，但編碼方式之後可以隨時換，不必推送新版 App。' }
        ]
      }
    ],
    regionBlueprint: {
      maxRegions: 6,
      rowGap: 330,
      defaultWeight: 1,
      nodes: (key, name, baseY) => regionNode(key, name, baseY),
      edges: key => regionEdges(key)
    },
    topology: (() => {
      return {
        viewBox: '0 0 1320 1080',
        regionIds: ['tw', 'us', 'eu'],
        regionLabel: { tw: '台灣', us: '美國', eu: '歐洲' },
        crossRegionWeight: 3.4,
        nodes: [
          ...regionNode('tw', '台灣', 60),
          ...regionNode('us', '美國', 390),
          // The origin side stays centralized in the home region, exactly as the book diagrams
          // it: pre-computed tile images, the routing tiles in object storage, the geocoding
          // database, and the user-location database. A request from Taiwan or Europe has to
          // cross an ocean to reach it; a US request does not — see crossRegionWeight.
          { id: 'tileOrigin', kind: 'fixed', label: '預先計算好的地圖圖片', region: '美國', zone: '中央後端（美國）', x: 1080, y: 320, arriveLabel: '從原始圖片儲存讀出這一批圖塊' },
          {
            id: 'routingTiles', kind: 'component', componentId: 'routingTileLod', label: '路線圖塊',
            region: '美國', zone: '中央後端（美國）', x: 1080, y: 440, pool: true, extraInstanceCost: 2,
            arriveLabel: '載入這條路線需要的路線圖塊並縫合成圖譜'
          },
          { id: 'geocodeDB', kind: 'fixed', label: '地理編碼資料庫', region: '美國', zone: '中央後端（美國）', x: 1080, y: 560, arriveLabel: '把起訖點的地址轉換成經緯度' },
          { id: 'locationDB', kind: 'component', componentId: 'locationStore', label: '使用者位置資料庫', region: '美國', zone: '中央後端（美國）', x: 1080, y: 680, arriveLabel: '寫入這一批座標與時間戳' },
          { id: 'streamBus', kind: 'component', componentId: 'locationStream', label: '位置串流管線', region: '美國', zone: '中央後端（美國）', x: 1080, y: 790, size: 'small', arriveLabel: '把位置事件送進串流，讓路況與 ETA 消費' },
          ...regionNode('eu', '歐洲', 720),
          { id: 'batchBadge', kind: 'component', componentId: 'locationBatch', label: '位置批次上傳', x: 880, y: 150, size: 'small', arriveLabel: '客戶端把累積的座標打包成一批' }
        ],
        edges: [
          ...regionEdges('tw'), ...regionEdges('us'), ...regionEdges('eu'),
          { from: 'locationDB', to: 'streamBus', kind: 'stub', requiresComponent: 'locationStream' }
        ],
        // Three genuinely different paths, which is the whole lesson of this chapter.
        //   watch  → 載入地圖圖塊：the only path an edge cache can absorb
        //   search → 規劃導航路線：geocode, then load routing tiles, then compute
        //   upload → 回報位置：a pure write, and the one that batching shrinks
        computeFlow: (kind, ctx, regionId = 'us') => {
          const r = regionId;

          if (kind === 'search') {
            return [`users_${r}`, `loadBalancer_${r}`, `navServer_${r}`, 'geocodeDB', `navServer_${r}`,
                    'routingTiles', `navServer_${r}`, `loadBalancer_${r}`, `users_${r}`];
          }

          if (kind === 'upload') {
            const tail = ctx.has('locationStream') ? ['locationDB', 'streamBus'] : ['locationDB'];
            return [`users_${r}`, `loadBalancer_${r}`, `locationServer_${r}`, ...tail];
          }

          // Where the map image bytes physically come from — the one thing the picture has to
          // tell the truth about, because it is exactly what the tile-delivery decision buys:
          //   不建存放點 → no edge node exists, so every request walks the full path to the
          //                origin and back. The POP is never visited, because it isn't there.
          //   即時生成   → the POP exists, but almost every request misses (the position ×
          //                zoom keyspace is unbounded), so you watch it go to the origin anyway.
          //   預先生成   → almost every request is answered at the edge and stops there.
          // When the tile service is enabled, the client first pays a short round trip to ask
          // for the 9 tile URLs — that visible extra hop is precisely the cost of not hard-
          // coding the geohash algorithm into every app.
          const urlHop = ctx.has('tileUrlSource')
            ? [`users_${r}`, `loadBalancer_${r}`, `tileUrlSvc_${r}`, `loadBalancer_${r}`, `users_${r}`]
            : [];
          const tile = ctx.option('tileDelivery');
          if (tile.id === 'off') {
            return [...urlHop, `users_${r}`, `loadBalancer_${r}`, `tileServer_${r}`, 'tileOrigin',
                    `tileServer_${r}`, `loadBalancer_${r}`, `users_${r}`];
          }
          if (Math.random() < (tile.hitRate || 0)) return [...urlHop, `users_${r}`, `pop_${r}`, `users_${r}`];
          return [...urlHop, `users_${r}`, `pop_${r}`, `loadBalancer_${r}`, `tileServer_${r}`, 'tileOrigin',
                  `tileServer_${r}`, `loadBalancer_${r}`, `pop_${r}`, `users_${r}`];
        }
      };
    })(),
    // A draggable driver who lives inside a region box. His tiles travel the same computeFlow
    // path everything else uses, so with static tiles you watch the packet leave the local POP,
    // and with 即時生成 you watch it crawl all the way to the origin instead. The dead-signal
    // zone is a separate draggable, resizable object.
    dragViewerSim: {
      homeRegionId: 'tw',
      start: { x: 180, y: 70 },
      zone: { x: 545, y: 300, width: 300, height: 90, label: '📡 收訊死角（可拖曳移動）' },
      tickMs: 700,
      poorMbpsRange: [0.3, 1.4],
      goodMbpsRange: [4.0, 7.5],
      ladder: [
        { id: 'low', label: '低解析圖塊', mbps: 1.0 },
        { id: 'mid', label: '中解析圖塊', mbps: 2.5 },
        { id: 'high', label: '高解析圖塊', mbps: 5.0 }
      ]
    },
    events: [
      {
        month: 2,
        id: 'popOutage',
        title: '東京存放點整個斷線',
        relevantComponents: ['tileDelivery'],
        demoFlow: ['users_tw', 'loadBalancer_tw', 'tileServer_tw', 'tileOrigin'],
        narrative: '一次光纖事故讓亞洲的存放點整個離線，這一區所有的地圖圖塊請求都要另尋出路。',
        resolve: ctx => {
          const id = ctx.get('tileDelivery');
          if (id === 'static') return { uptime: -1, qoe: -1, log: '靜態圖塊在其他存放點也有一份，流量自動改由次近的存放點提供。使用者只感覺到地圖稍微慢了一點點，沒有人回報看不到圖。', ok: true };
          if (id === 'dynamic') return { uptime: -9, qoe: -8, log: '存放點本來就幾乎沒有命中，斷線後所有請求照樣打到即時生成的伺服器上——而那些機器早就在硬撐了。地圖大範圍出現灰色空白格。', ok: false };
          return { uptime: -7, qoe: -11, log: '你根本沒有存放點可以斷，但這也代表每一次載圖本來就要跨海回源。事故期間主幹壅塞，地圖載入時間飆到好幾秒，導航畫面幾乎是空白的。', ok: false };
        }
      },
      {
        month: 3,
        id: 'locationWriteFlood',
        title: '上班尖峰：位置更新寫入洪峰',
        relevantComponents: ['locationBatch', 'locationStore'],
        demoFlow: ['users_us', 'loadBalancer_us', 'locationServer_us', 'locationDB'],
        narrative: '週一早上，全球同時導航的人數衝到今年新高，每一支手機都在持續回報自己的座標。',
        resolve: ctx => {
          const batched = ctx.get('locationBatch') !== 'off';
          const store = ctx.get('locationStore');
          if (batched && store === 'wideColumn') return { uptime: 0, qoe: 1, log: '批次上傳先把寫入 QPS 壓掉一個數量級，剩下的量對為高寫入設計的叢集來說很輕鬆。尖峰整段期間寫入延遲平穩。', ok: true };
          if (batched && store === 'sharded') return { uptime: -2, qoe: -1, log: '批次讓寫入量降下來，分片資料庫勉強吃得下，但幾個熱門分片的寫入延遲明顯拉高，路況更新慢了幾十秒。', ok: true };
          if (batched) return { uptime: -8, qoe: -6, log: '批次幫了大忙，但單一資料庫的寫入還是排到滿——位置寫入開始逾時，即時路況停在十分鐘前的狀態。', ok: false };
          if (store === 'wideColumn') return { uptime: -6, qoe: -5, log: '叢集撐住了不批次帶來的三百萬級寫入，但代價是機器數量與帳單都很誇張，而且使用者的手機電量掉得非常快。', ok: false };
          return { uptime: -24, qoe: -18, log: '每秒回報一次 × 全部使用者，寫入直接把資料庫打垮。位置資料大量遺失，路況與 ETA 整個早上都是錯的。', ok: false };
        }
      },
      {
        month: 4,
        id: 'navServerDown',
        title: '一台導航伺服器當機',
        relevantComponents: ['navRedundancy'],
        demoFlow: ['users_us', 'loadBalancer_us', 'navServer_us', 'routingTiles'],
        narrative: '一台負責路線規劃的伺服器硬體故障離線，它原本承擔的請求需要有人接手（載入地圖圖塊與回報位置走的是另外兩組機器，這次不受影響）。',
        resolve: ctx => {
          const id = ctx.get('navRedundancy');
          if (id === 'warmStandby') return { uptime: 0, qoe: 0, log: '待命機器立刻接手，負載平衡器把流量導過去，沒有任何一次路線規劃失敗。', ok: true };
          if (id === 'autoScale') return { uptime: -4, qoe: -3, log: '自動擴縮容補上了新機器，但生效前那幾分鐘容量吃緊，部分使用者按下導航後轉圈圈或收到錯誤。', ok: true };
          return { uptime: -16, qoe: -12, log: '沒有任何備援容量，這台機器的請求全部落空——那段時間按導航的人直接看到失敗訊息，只能一直重試。', ok: false };
        }
      },
      {
        month: 6,
        id: 'roadClosure',
        title: '大型賽事臨時封路，數十萬人正卡在舊路線上',
        relevantComponents: ['locationStream', 'routingTileLod'],
        demoFlow: ['users_eu', 'loadBalancer_eu', 'navServer_eu', 'routingTiles'],
        narrative: '市中心突然封閉數條主要幹道。系統要先「發現」這件事，再為所有正在路上的人重新規劃路線——而且要快。',
        resolve: ctx => {
          const stream = ctx.has('locationStream');
          const lod = ctx.get('routingTileLod');
          const fastRoute = lod === 'hierarchical' || lod === 'twoLevel';
          if (stream && lod === 'hierarchical') return { uptime: 0, qoe: 2, log: '大量位置回報在串流管線裡立刻呈現為異常低速，系統幾分鐘內就判定封路；階層式路線圖塊讓數十萬條替代路線幾乎即時算完，多數人在到達路口前就被導開了。', ok: true };
          if (stream && fastRoute) return { uptime: -2, qoe: -1, log: '串流很快偵測到封路，但只有兩級路線圖塊，長距離替代路線算得比較慢，一部分人已經開到路口才收到改道指示。', ok: true };
          if (stream) return { uptime: -9, qoe: -8, log: '封路很快被偵測到，但只有街道級路線圖塊——重算數十萬條路線把導航伺服器塞爆，改道指示遲遲發不出去。', ok: false };
          if (fastRoute) return { uptime: -10, qoe: -9, log: '路線算得夠快，但沒有串流管線，系統要等下游批次查資料庫才發現封路，等發現時大批車輛已經卡死在路上。', ok: false };
          return { uptime: -20, qoe: -17, log: '既沒有串流可以及時發現封路，也沒有粗略等級的路線圖塊可以快速重算。使用者被導進一條封閉的道路，這是這一章非功能需求裡最不能犯的錯：給了錯誤的指示。', ok: false };
        }
      },
      {
        month: 8,
        id: 'tileCostReview',
        title: '財務部門盯上了圖塊供應的帳單',
        relevantComponents: ['tileDelivery'],
        demoFlow: ['users_eu', 'pop_eu', 'loadBalancer_eu', 'tileServer_eu', 'tileOrigin'],
        narrative: '每天要送出去的地圖資料量大約是 62.5 億 MB。財務部門要求你解釋這筆錢花在哪裡，以及有沒有更便宜的做法。',
        resolve: ctx => {
          const id = ctx.get('tileDelivery');
          if (id === 'static') return { uptime: 0, qoe: 1, log: '你把數字攤開來講：62,500 MB/秒分散到 200 個存放點，每個點只需要幾百 MB/秒。靜態圖塊命中率 96%，原始伺服器幾乎不出流量——這是三種做法裡最便宜也最快的。財務部門買單。', ok: true };
          if (id === 'dynamic') return { uptime: -3, qoe: -4, log: '你付了存放點的錢，卻因為圖塊是即時生成而幾乎沒有命中率，同時還要養一大批運算機器。這是三種做法裡最貴的一種，而且使用者體驗還不是最好的。財務部門要求你三個月內改掉。', ok: false };
          return { uptime: -4, qoe: -6, log: '沒有存放點不代表省錢——所有位元組都從中央機房出去，單一機房的出口頻寬既貴又逼近上限，使用者還要忍受 300 毫秒的延遲。這是把成本從 CDN 帳單搬到自己的骨幹上而已。', ok: false };
        }
      },
      {
        month: 9,
        id: 'geohashChange',
        title: '圖塊編碼方式必須更換',
        relevantComponents: ['tileUrlSource'],
        demoFlow: ['users_tw', 'loadBalancer_tw', 'tileUrlSvc_tw'],
        narrative: '新的圖塊供應商用不同的格線切法，你必須改變位置轉成圖塊 URL 的編碼方式。問題是：這段轉換邏輯現在寫在哪裡？',
        resolve: ctx => {
          if (ctx.has('tileUrlSource')) return { uptime: 0, qoe: 0, log: '轉換邏輯在伺服器端的圖塊服務裡，改一次部署就全部生效。當初多付的那一次往返，在今天換回了一個下午就完成的遷移。', ok: true };
          return { uptime: -12, qoe: -9, log: '演算法寫死在 iOS、Android 與網頁版的程式碼裡。你必須發三個平台的新版、等審核、再等使用者更新——舊版 App 在這期間組出來的 URL 全部指向不存在的圖塊，地圖一片空白。這個遷移拖了好幾個月。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '跨年夜：導航尖峰、位置洪峰與長途返鄉路線同時湧入',
        relevantComponents: ['navRedundancy', 'locationRedundancy', 'routingTileLod'],
        demoFlow: ['users_us', 'loadBalancer_us', 'navServer_us', 'routingTiles', 'locationDB'],
        narrative: '跨年夜：全年最高的同時導航人數、最密集的位置回報，加上大量跨城市的長途路線規劃，三種壓力同時到達。',
        resolve: ctx => {
          const shields = ['navRedundancy', 'locationRedundancy', 'routingTileLod'].filter(id => ctx.has(id)).length;
          const table = {
            3: { uptime: 1, qoe: 1, log: '三道防線都到位：導航備援吸收路線規劃尖峰、位置服務備援吃下寫入洪峰、階層式路線圖塊讓長途路線照樣算得動。全站平穩撐過今年最忙的一夜。', ok: true },
            2: { uptime: -7, qoe: -7, log: '大部分壓力被擋住，但缺的那一環造成明顯降級，很多人在最需要導航的那幾個小時感覺得到卡頓。', ok: false },
            1: { uptime: -17, qoe: -15, log: '只有一道防線，撐不住三種壓力疊加，路線規劃逾時與位置遺失同時發生。', ok: false },
            0: { uptime: -32, qoe: -26, log: '完全沒有防線，整個服務在一年裡最需要它的那一晚被打垮。', ok: false }
          };
          return table[shields];
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你把三種形狀完全不同的流量各自收斂到最合適的做法上，成本、可用率與使用者體驗都顧到了，這一年沒有任何一次事件真正傷到使用者。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件或某幾個月的容量吃緊讓使用者感覺到明顯的影響。' };
      if (score >= 62) return { letter: 'B', text: '服務撐過了這一年，但至少有一次事件或一段時間的超載造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，這套架構撐過了一年，但過程相當狼狽。' };
      return { letter: 'F', text: '這套架構在多次事件與長期超載中直接被打垮。回教材重新想一次「同一塊區域、三種資料、三條路徑」到底在解決什麼問題，再挑戰一次。' };
    }
  };
})();
