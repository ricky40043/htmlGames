/*
 * 第 14 章「設計 YouTube」的互動層。
 *
 * 書上這一章有 27 張圖，其中最關鍵的幾張（14-3 三元素、14-4／14-5 上傳架構、
 * 14-6 流程 B、14-8 DAG、14-9 多畫質輸出、14-10～14-21 轉碼管線、14-17 資源管理、
 * 14-22／14-23 GOP 平行上傳、14-24／14-25 訊息佇列前後、14-26 預簽名網址、
 * 14-27 熱門與長尾分流）原本在教材裡是條列或單線節點鏈。這裡改用可點、可逐步
 * 播放的 arch 區塊重畫，並讓每一頁都有一題即時自我檢核。
 */
window.SYSTEM_DESIGN_INTERACTIVE_CH14 = {

  // ── 小節 1：瞭解問題並確立設計範圍 ──────────────────────────────
  'sd14-s01-p01': { append: [{
    type: 'probe',
    ask: '面試官把功能收斂成「上傳影片」與「觀看影片」兩件事。這個收斂對設計的直接影響是什麼？',
    options: [
      ['整章只要回答上傳與串流兩條路徑', true,
        '留言、按讚、播放清單、訂閱全都被排除，所以後面所有的深入設計都圍著這兩條路打轉。'],
      ['代表不需要 metadata 資料庫', false,
        '影片的網址、大小、解析度、格式、使用者資訊都要存，metadata 資料庫是必要的。'],
      ['代表可以不考慮全球使用者分佈', false,
        '面試官明講了「全球使用者佔了很大一部分」，這正是後面 CDN 成本那麼高的原因。']
    ],
    reveal: '45 到 60 分鐘不可能設計出所有功能，所以提出適當的問題把範圍縮小，是很重要的步驟。'
  }] },

  'sd14-s01-p02': { append: [{
    type: 'probe',
    ask: '面試官建議「善用現有的雲端服務，不要從頭打造所有東西」。這在面試裡代表什麼？',
    options: [
      ['說得出選型理由，比解釋原理重要', true,
        '提一句「用 BLOB 儲存系統存原始影片」就夠了；深入解釋 BLOB 的內部設計反而離題。'],
      ['代表這一題不必畫出架構圖', false,
        '架構圖還是要畫，只是圖上的某些方塊可以直接標成雲端服務。'],
      ['代表這題沒有深度，背名詞就好', false,
        '深度在轉碼架構、DAG、平行化與錯誤處理，不在重造 CDN。']
    ],
    reveal: '連 Netflix 都用 Amazon 的雲端服務、Facebook 用 Akamai 的 CDN——自建是規模到了之後的選擇，不是起手式。'
  }] },

  'sd14-s01-p03': { append: [{
    type: 'probe',
    ask: '每天 150 TB 的儲存需求是怎麼算出來的？',
    options: [
      ['500 萬 DAU × 10% 會上傳 × 每支 300 MB', true,
        '只有一成的使用者會上傳，每人一支、平均 300 MB，乘起來就是每天 150 TB。'],
      ['500 萬 DAU × 每人看 5 支 × 300 MB', false,
        '那是觀看產生的流量，不是要存下來的量——看影片不會讓儲存空間變大。'],
      ['500 萬 DAU × 每天 30 分鐘使用', false,
        '30 分鐘是平均使用時間，跟儲存空間沒有直接換算關係。']
    ],
    reveal: '上傳決定儲存成本，觀看決定 CDN 成本——這一頁的兩個數字各自餵給後面不同的問題。'
  }] },

  // ── 小節 2：高階設計 ──────────────────────────────────────────
  'sd14-s02-p01': {
    replace: { 0: {
      type: 'arch',
      title: '圖 14-3：從最高的層次看，只有三個構成元素',
      hint: '點任一個元件看它負責什麼；或播一次，看兩種請求怎麼分流。',
      intro: '整個 YouTube 在這個層次只有三塊：客戶端、CDN、API 伺服器。關鍵是那條分界線——影片串流走 CDN，其他所有事情走 API 伺服器。',
      nodes: [
        { id: 'client', label: '客戶端', hint: '電腦／手機／智慧型電視', kind: 'client', col: 2, row: 1,
          detail: '你可以在電腦、行動手機、智慧型電視上觀看 YouTube 影片。這三種裝置的頻寬與解碼能力差很多，也正是後面需要轉碼出多種畫質的原因。' },
        { id: 'cdn', label: 'CDN', hint: '影片從這裡串流', kind: 'cdn', col: 1, row: 2,
          detail: '影片全都儲存在 CDN。當你按下播放時，就會從 CDN 以串流的方式傳輸影片。離你最近的 edge 伺服器負責遞送內容，所以幾乎不會有什麼延遲。' },
        { id: 'api', label: 'API 伺服器', hint: '影片串流以外的所有事', kind: 'service', col: 3, row: 2,
          detail: '除了影片串流以外，其他所有服務都是由 API 伺服器提供：動態影片推薦、生成影片上傳網址、更新 metadata 資料庫與 metadata 快取、使用者註冊與登入等等。' }
      ],
      edges: [
        { from: 'client', to: 'cdn', label: '串流影片' },
        { from: 'client', to: 'api', label: '其他' }
      ],
      flows: [{
        label: '兩種請求走兩條路',
        steps: [
          { from: 'client', to: 'cdn', text: '按下播放：影片位元組直接從 CDN 串流過來，完全不經過 API 伺服器。這是量最大的那一條。' },
          { from: 'client', to: 'api', text: '除此之外的每一件事——登入、搜尋、推薦、取得上傳網址——都走 API 伺服器。這一條請求數多，但每個請求都很小。' }
        ]
      }],
      caption: '把「大量位元組」與「大量請求」分成兩條路，是這一整章的第一個、也是最重要的一個決定。'
    } },
    append: [{
      type: 'probe',
      ask: '為什麼影片串流刻意不經過 API 伺服器？',
      options: [
        ['影片位元組量太大，會壓垮自家機器的頻寬', true,
          '交給 CDN 之後，API 伺服器只需要處理小而多的請求，兩邊各自用最合適的方式擴展。'],
        ['因為 API 伺服器不支援傳輸二進位資料', false,
          '技術上當然支援，問題是成本與擴展方式完全不同。'],
        ['因為走 CDN 的安全性比較好', false,
          '安全性靠的是預簽名網址與 DRM，跟走不走 CDN 是兩件事。']
      ],
      reveal: '每天 500 萬人 × 5 支 × 0.3 GB 的流量，用自己的伺服器扛，跟用 CDN 扛，是兩個完全不同量級的問題。'
    }]
  },

  'sd14-s02-p02': {
    replace: {
      0: {
        type: 'arch',
        title: '圖 14-4：影片上傳的高階設計',
        hint: '點任一個元件看它負責什麼；或播「上傳一支影片」與「流程 B：更新 metadata」兩條流程。',
        intro: '左邊那一整條（原始儲存 → 轉碼 → 已轉碼儲存 → CDN）搬的是影片位元組；中間那一條（負載平衡器 → API 伺服器 → 快取／資料庫）搬的是關於影片的資訊。兩條是平行的。',
        nodes: [
          { id: 'raw', label: '原始儲存系統', hint: 'BLOB：保存尚未轉碼的原始影片', kind: 'store', col: 1, row: 1,
            detail: 'BLOB（Binary Large Object；二進位大型物件）指的是在資料庫管理系統中，用一個單一實體來儲存的一堆二進位資料。原始影片就先落在這裡，轉碼還沒開始。' },
          { id: 'user', label: '使用者', hint: 'TV／電腦／手機', kind: 'client', col: 2, row: 1, span: 2,
            detail: '使用者會在電腦、行動手機或智慧型電視等設備上觀看 YouTube。上傳時，它同時做兩件事：把影片送進原始儲存系統，以及送出一個更新 metadata 的請求。' },
          { id: 'transcode', label: '轉碼伺服器', hint: '產生多種畫質與格式', kind: 'service', col: 1, row: 2,
            detail: '影片轉碼（transcoding）也稱為編碼（encoding），就是把影片格式轉換成另一種格式（如 MPEG、HLS 等等）的程序。目的是針對不同設備與頻寬能力，提供最佳的影片串流品質。' },
          { id: 'lb', label: '負載平衡器', hint: '平均分配請求', kind: 'lb', col: 2, row: 2, span: 2,
            detail: '負載平衡器會在 API 伺服器之間平均分配請求。' },
          { id: 'encoded', label: '已轉碼儲存系統', hint: 'BLOB：存放轉碼後的影片', kind: 'store', col: 1, row: 3,
            detail: '這也是一種 BLOB 儲存系統，用來儲存已轉碼的影片檔案。它是 CDN 的來源。' },
          { id: 'api', label: 'API 伺服器', hint: '串流以外的所有請求', kind: 'service', col: 2, row: 3, span: 2,
            detail: '除了影片串流的任務之外，其他所有的使用者請求都由 API 伺服器處理。上傳完成之後，也是由它通知客戶端「影片已經可以串流了」。' },
          { id: 'handler', label: '完成事件處理程序', hint: '一大堆 worker', kind: 'service', col: 4, row: 3,
            detail: '這裡會有一大堆 worker 工作程序，不斷從完成事件訊息佇列中提取出事件訊息，然後對 metadata 快取與 metadata 資料庫做出更新。' },
          { id: 'cdn', label: 'CDN', hint: '影片的快取層', kind: 'cdn', col: 1, row: 4,
            detail: '用 CDN 來做為影片的快取。當你點擊播放按鈕時，就會從 CDN 以串流的方式傳輸影片。' },
          { id: 'cache', label: 'Metadata 快取', hint: '影片與使用者物件', kind: 'cache', col: 2, row: 4,
            detail: '為了獲得更好的效能表現，影片的 metadata 詮釋資料與使用者物件都會進行快取。' },
          { id: 'metadb', label: 'Metadata 資料庫', hint: '分片 + 複製', kind: 'store', col: 3, row: 4,
            detail: '影片的 metadata（網址、大小、解析度、格式、使用者資訊）全都保存在這裡。這些資料會進行分片（sharded）與複製（replicated），以滿足效能與高可用性的要求。' },
          { id: 'queue', label: '完成事件訊息佇列', hint: '存放轉碼完成事件', kind: 'queue', col: 4, row: 4,
            detail: '這是一個訊息佇列，用來存放影片轉碼完成事件的相關訊息。有了它，轉碼伺服器就不必等待下游把 metadata 更新完才能繼續做下一支影片。' }
        ],
        edges: [
          { from: 'user', to: 'raw', label: '① 上傳影片' },
          { from: 'raw', to: 'transcode', label: '②' },
          { from: 'transcode', to: 'encoded', label: '③a' },
          { from: 'encoded', to: 'cdn', label: '③a.1' },
          { from: 'transcode', to: 'queue', label: '③b 轉碼完成' },
          { from: 'queue', to: 'handler', label: '③b.1' },
          { from: 'handler', to: 'metadb', label: '③b.1.a' },
          { from: 'handler', to: 'cache', label: '③b.1.b' },
          { from: 'user', to: 'lb', label: '流程 B' },
          { from: 'lb', to: 'api' },
          { from: 'api', to: 'cache' },
          { from: 'api', to: 'metadb' }
        ],
        flows: [
          {
            label: '流程 A：上傳實際的影片',
            steps: [
              { from: 'user', to: 'raw', text: '第 1 步：影片被上傳到原始儲存系統。' },
              { from: 'raw', to: 'transcode', text: '第 2 步：轉碼伺服器從原始儲存系統取得影片，開始進行轉碼。' },
              { from: 'transcode', to: 'encoded', text: '第 3a 步：轉碼完成後，已轉碼的影片被送往已轉碼儲存系統。注意 3a 與 3b 是平行發生的。' },
              { from: 'encoded', to: 'cdn', text: '第 3a.1 步：已轉碼影片被分配到 CDN，從此觀眾就能就近串流。' },
              { from: 'transcode', to: 'queue', text: '第 3b 步：同時，轉碼完成事件進入完成事件訊息佇列排隊等候處理。' },
              { from: 'queue', to: 'handler', text: '第 3b.1 步：完成事件處理程序有一大堆 worker，會不斷從佇列提取出事件資料。' },
              { from: 'handler', to: 'metadb', text: '第 3b.1.a 步：更新 metadata 資料庫，把這支影片標記成可以播放了。' },
              { from: 'handler', to: 'cache', text: '第 3b.1.b 步：同時更新 metadata 快取，讓讀取路徑立刻看得到新狀態。' },
              { node: 'api', text: '第 4 步：API 伺服器通知客戶端，影片已成功上傳，並已做好準備隨時可進行串流傳輸。' }
            ]
          },
          {
            label: '流程 B：更新 metadata 詮釋資料',
            steps: [
              { from: 'user', to: 'lb', text: '把檔案上傳到原始儲存系統的同時，客戶端也以平行的方式發送一個請求，要更新影片的 metadata。' },
              { from: 'lb', to: 'api', text: '負載平衡器把這個請求分配給一台 API 伺服器。' },
              { from: 'api', to: 'cache', text: '這個請求帶著檔案名稱、大小、格式等資訊。API 伺服器用它們更新 metadata 快取……' },
              { from: 'api', to: 'metadb', text: '……以及 metadata 資料庫。整條流程 B 跟流程 A 是同時進行的，不是接在它後面。' }
            ]
          }
        ],
        caption: '第 4 步「通知客戶端可以串流了」在書上的圖 14-5 是 API 伺服器經負載平衡器回到使用者；這裡用點亮 API 伺服器來表示同一件事。'
      },
      2: {
        type: 'arch',
        title: '圖 14-9：轉碼的輸出是一整組畫質，不是一個檔案',
        hint: '點任一種輸出，看它是給誰用的。',
        intro: '一支影片轉碼之後會變成好幾個檔案。播放器會依照當下的網路狀況，決定要拉哪一個。',
        nodes: [
          { id: 'src', label: '影片轉碼', hint: '同一支原始影片', kind: 'service', col: 1, row: 3,
            detail: '轉碼很花計算成本，但它換到的是「每一種裝置與頻寬都有一個剛好合適的版本」。' },
          { id: 'p360', label: '360p.mp4', hint: '頻寬很差時', kind: 'store', col: 2, row: 1, detail: '網路很差、或在行動網路上省流量時用的版本。畫質低，但能連續播放。' },
          { id: 'p480', label: '480p.mp4', hint: '一般行動網路', kind: 'store', col: 2, row: 2, detail: '行動網路下最常落在這一檔。' },
          { id: 'p720', label: '720p.mp4', hint: '一般寬頻', kind: 'store', col: 2, row: 3, detail: '桌機寬頻的常見預設。' },
          { id: 'p1080', label: '1080p.mp4', hint: '頻寬充足', kind: 'store', col: 2, row: 4, detail: '頻寬與裝置解碼能力都夠時才會切上去。' },
          { id: 'p4k', label: '4k.mp4', hint: '大螢幕', kind: 'store', col: 2, row: 5, detail: '智慧型電視這類大螢幕才用得上。它也是最佔儲存空間的一個版本——所以冷門影片不必存這麼多版。' }
        ],
        edges: [
          { from: 'src', to: 'p360' },
          { from: 'src', to: 'p480' },
          { from: 'src', to: 'p720' },
          { from: 'src', to: 'p1080' },
          { from: 'src', to: 'p4k' }
        ],
        caption: '這也解釋了為什麼「節省成本」那一節會說：沒那麼受歡迎的影片，其實不需要儲存這麼多種編碼版本。'
      }
    },
    append: [{
      type: 'probe',
      ask: '在圖 14-4 裡，「完成事件訊息佇列」被放在轉碼伺服器與完成事件處理程序之間。它換到了什麼？',
      options: [
        ['轉碼伺服器不必等下游，就能做下一支', true,
          '佇列把兩邊解耦：上游只管把事件丟進去，下游用自己的步調消化。'],
        ['讓 metadata 一定會即時更新', false,
          '正好相反，佇列帶來的是非同步——更新會稍微延後，換到的是吞吐量。'],
        ['避免影片在轉碼時發生失敗', false,
          '轉碼失敗由重試機制處理，跟佇列不是同一件事。']
      ],
      reveal: '訊息佇列的價值幾乎永遠是同一句話：讓上游不必等下游。'
    }]
  },

  'sd14-s02-p03': {
    insertAfter: { 1: {
      type: 'arch',
      title: '圖 14-6：流程 B——更新 metadata 詮釋資料',
      hint: '播一次，看這條路有多短。',
      intro: '流程 B 只有短短一條路。把它跟流程 A 的九個步驟擺在一起看，就知道為什麼它們必須平行跑。',
      nodes: [
        { id: 'user', label: '使用者', hint: 'TV／電腦／手機', kind: 'client', col: 1, row: 1, span: 2,
          detail: '在把檔案送往原始儲存系統的同一時間，客戶端也平行地發出這個請求。' },
        { id: 'lb', label: '負載平衡器', kind: 'lb', col: 1, row: 2, span: 2,
          detail: '請求帶著影片的檔案名稱、大小、格式等資訊。' },
        { id: 'api', label: 'API 伺服器', kind: 'service', col: 1, row: 3, span: 2,
          detail: 'API 伺服器用這些資料更新 metadata 快取與 metadata 資料庫。' },
        { id: 'cache', label: 'Metadata 快取', kind: 'cache', col: 1, row: 4, detail: '先更新快取，讓後續讀取立刻看得到。' },
        { id: 'metadb', label: 'Metadata 資料庫', kind: 'store', col: 2, row: 4, detail: '更新持久的那一份。' }
      ],
      edges: [
        { from: 'user', to: 'lb', label: '更新 metadata' },
        { from: 'lb', to: 'api' },
        { from: 'api', to: 'cache' },
        { from: 'api', to: 'metadb' }
      ],
      flows: [{
        label: '流程 B 的四步',
        steps: [
          { from: 'user', to: 'lb', text: '客戶端送出一個帶著檔案名稱、大小、格式的 metadata 更新請求。' },
          { from: 'lb', to: 'api', text: '負載平衡器分配給一台 API 伺服器。' },
          { from: 'api', to: 'cache', text: 'API 伺服器更新 metadata 快取。' },
          { from: 'api', to: 'metadb', text: '同時更新 metadata 資料庫。整條路走完，影片位元組可能都還沒傳完——這正是它要獨立成一條流程的原因。' }
        ]
      }],
      caption: '流程 A 搬的是好幾百 MB 的位元組，流程 B 搬的是幾百個位元組的描述。把它們綁在同一個請求裡，只會讓兩邊互相拖累。'
    } },
    append: [{
      type: 'probe',
      ask: '流程 A 的第 4 步是「API 伺服器通知客戶端影片已成功上傳」。這個通知為什麼不能在第 1 步之後就發？',
      options: [
        ['原始影片剛落地，還沒轉碼也還沒進 CDN', true,
          '要等 3a.1 把已轉碼影片分配到 CDN、3b.1 把 metadata 更新完，影片才真的「準備好可以串流」。'],
        ['因為第 1 步的上傳有可能失敗', false,
          '失敗當然要處理，但這裡的重點是「就算成功，也還沒到可以播放的狀態」。'],
        ['因為客戶端還沒送 metadata', false,
          'metadata 是流程 B 平行送的，跟這個通知的時機沒有必然關係。']
      ],
      reveal: '「什麼時候可以宣稱完成」這個問題，答案取決於使用者期待的是什麼——這裡使用者期待的是「可以播了」。'
    }]
  },

  // ── 小節 3：加快上傳速度 ──────────────────────────────────────
  'sd14-s03-p01': {
    replace: { 1: {
      type: 'arch',
      title: '圖 14-22／14-23：依 GOP 切分，然後平行上傳',
      hint: '點任一個 GOP 看它為什麼可以獨立；或播一次平行上傳。',
      intro: 'GOP（Group of Pictures；圖片群組）是按照特定順序排列的一群畫面，每一組都是可以獨立播放的單元，長度通常是幾秒鐘。正因為可獨立，它才可以被單獨上傳、單獨重試。',
      nodes: [
        { id: 'src', label: '原始影片', hint: '客戶端上的檔案', kind: 'client', col: 1, row: 2,
          detail: '把整支影片當做一整個單位來上傳，是一種很沒效率的做法：慢，而且一斷線就要整支重來。' },
        { id: 'split', label: '依 GOP 對齊切分', hint: '可以在客戶端完成', kind: 'service', col: 2, row: 2,
          detail: '根據 GOP 來切分影片檔案的工作，可以由客戶端來實現，藉此提高上傳的速度。代價是舊版本的客戶端可能不支援——那時就把整支影片送到伺服器，改由伺服端切分。' },
        { id: 'g1', label: 'GOP 1', kind: 'queue', col: 3, row: 1, detail: '一個可獨立播放的畫面群組，所以它可以自己上傳、自己重試，不必管其他 GOP 走到哪。' },
        { id: 'g2', label: 'GOP 2', kind: 'queue', col: 3, row: 2, detail: '與 GOP 1 同時上傳。平行度就是這樣來的。' },
        { id: 'g3', label: 'GOP N', kind: 'queue', col: 3, row: 3, detail: '如果只有這一塊失敗，也只要重傳這一塊——這是切分帶來的第二個好處。' },
        { id: 'raw', label: '原始儲存系統', hint: '所有 GOP 在這裡會合', kind: 'store', col: 4, row: 2,
          detail: '全部 GOP 都落地之後，才算是一支完整的原始影片，轉碼伺服器才能開始工作。' }
      ],
      edges: [
        { from: 'src', to: 'split' },
        { from: 'split', to: 'g1' },
        { from: 'split', to: 'g2' },
        { from: 'split', to: 'g3' },
        { from: 'g1', to: 'raw', label: '平行上傳' },
        { from: 'g2', to: 'raw' },
        { from: 'g3', to: 'raw' }
      ],
      flows: [{
        label: '平行上傳，以及只重傳失敗的那一塊',
        steps: [
          { from: 'src', to: 'split', text: '客戶端先把影片依 GOP 對齊的方式切分成比較小的幾群。' },
          { from: 'split', to: 'g2', text: '每一個 GOP 都是可以獨立播放的單元，長度通常是幾秒鐘。' },
          { from: 'g1', to: 'raw', text: 'GOP 1 開始上傳。' },
          { from: 'g2', to: 'raw', text: 'GOP 2 同時上傳——它們不必排隊等前一個傳完。' },
          { from: 'g3', to: 'raw', text: '假設 GOP N 這一塊傳到一半斷線了：要重傳的只有這一塊，前面已經成功的完全不受影響。' }
        ]
      }],
      caption: '同一個切分動作換到兩件事：平行度（快）與細粒度的重試（穩）。'
    } },
    append: [{
      type: 'probe',
      ask: '依 GOP 切分之後，上傳到一半斷線了會怎樣？',
      options: [
        ['只要重傳失敗的那一個 GOP', true,
          '這是切分帶來的第二個好處：重試的粒度從「整支影片」縮小成「幾秒鐘」。'],
        ['整支影片都必須重新上傳一次', false,
          '那正是不切分時會發生的事，也是這個最佳化要解決的問題。'],
        ['伺服器會自己把缺的部分補起來', false,
          '伺服器沒有那些位元組，只能等客戶端重傳。']
      ],
      reveal: 'GOP 是「可獨立播放」的單元——正因為可獨立，它才可以被獨立上傳與獨立重試。'
    }]
  },

  'sd14-s03-p02': { append: [{
    type: 'probe',
    ask: '如果客戶端版本太舊，不支援依 GOP 切分影片，系統怎麼辦？',
    options: [
      ['把整支影片送到伺服器，改由伺服端切分', true,
        '書上的錯誤處理明確寫了這一條：影片分割的工作改在伺服端完成，不是直接拒絕上傳。'],
      ['拒絕這次上傳，要使用者更新 App', false,
        '那會直接趕走一部分使用者，代價太大。'],
      ['改用比較低的畫質重新上傳', false,
        '畫質跟能不能切分是兩件事。']
    ],
    reveal: '最佳化要有退路：新客戶端走快路，舊客戶端走慢路，但沒有人被擋在門外。'
  }] },

  'sd14-s03-p03': {
    replace: { 2: {
      type: 'arch',
      title: '圖 14-24／14-25：加入訊息佇列前後的差別',
      hint: '先播「沒有佇列時」，再播「加入佇列後」，比較編碼模組什麼時候才能開始工作。',
      intro: '原本每一個步驟的輸入都是前一個步驟的輸出，這種緊密的依賴讓平行性很難實現。加入訊息佇列之後，下游就不必再等上游。',
      nodes: [
        { id: 'raw', label: '原始儲存系統', hint: '原始分段影片', kind: 'store', col: 1, row: 2,
          detail: '所有原始的分段影片都在這裡。' },
        { id: 'q1', label: '訊息佇列', hint: '有新的分段可下載', kind: 'queue', col: 2, row: 1,
          detail: '事件先進佇列，下載模組自己來拿。上游丟完就走，不必等下游。' },
        { id: 'download', label: '下載模組', hint: '取得原始分段影片', kind: 'service', col: 2, row: 3,
          detail: '負責把原始的分段影片下載下來。' },
        { id: 'q2', label: '訊息佇列', hint: '有分段可以編碼', kind: 'queue', col: 3, row: 1,
          detail: '在引入訊息佇列之前，編碼模組必須等待下載模組的輸出；引入之後，只要佇列裡還有待處理的事件，編碼模組就可以用平行的方式執行這些工作。' },
        { id: 'encode', label: '編碼模組', hint: '轉碼', kind: 'service', col: 3, row: 3,
          detail: '實際做轉碼的地方。這是整條管線裡最耗時的一段，所以最需要平行化。' },
        { id: 'q3', label: '訊息佇列', hint: '有已編碼影片可上傳', kind: 'queue', col: 4, row: 1,
          detail: '編碼完成的事件也進佇列，讓上傳模組自己消化。' },
        { id: 'upload', label: '上傳模組', hint: '上傳已編碼影片', kind: 'service', col: 4, row: 3,
          detail: '把已編碼的影片送往已編碼儲存系統。' },
        { id: 'encoded', label: '已編碼儲存系統', kind: 'store', col: 5, row: 3,
          detail: '存放轉碼後的影片檔案。' },
        { id: 'cdn', label: 'CDN', kind: 'cdn', col: 6, row: 3,
          detail: '最後分發到 CDN，觀眾才能就近串流。' }
      ],
      edges: [
        { from: 'raw', to: 'download', label: '直接依賴' },
        { from: 'download', to: 'encode', label: '直接依賴' },
        { from: 'encode', to: 'upload', label: '直接依賴' },
        { from: 'raw', to: 'q1' },
        { from: 'q1', to: 'download' },
        { from: 'download', to: 'q2' },
        { from: 'q2', to: 'encode' },
        { from: 'encode', to: 'q3' },
        { from: 'q3', to: 'upload' },
        { from: 'upload', to: 'encoded' },
        { from: 'encoded', to: 'cdn' }
      ],
      flows: [
        {
          label: '沒有訊息佇列時（圖 14-24）',
          steps: [
            { from: 'raw', to: 'download', text: '下載模組直接向原始儲存系統要分段影片。' },
            { from: 'download', to: 'encode', text: '編碼模組必須等待下載模組的輸出——沒有輸出，它就只能閒著。' },
            { from: 'encode', to: 'upload', text: '上傳模組又得等編碼模組。每一個輸入都是前一個步驟的輸出，這樣的依賴關係讓平行性很難實現。' },
            { from: 'upload', to: 'encoded', text: '一路串到底。整條鏈的速度，等於最慢的那一段。' }
          ]
        },
        {
          label: '加入訊息佇列後（圖 14-25）',
          steps: [
            { from: 'raw', to: 'q1', text: '原始儲存系統把「有新的分段影片」這件事丟進訊息佇列就結束了。' },
            { from: 'q1', to: 'download', text: '下載模組從佇列自己拿事件。它想開幾個就開幾個。' },
            { from: 'download', to: 'q2', text: '下載完成同樣只是丟一個事件進佇列。' },
            { from: 'q2', to: 'encode', text: '編碼模組不再等待下載模組——只要佇列裡還有待處理的事件，它就可以用平行的方式一直做下去。' },
            { from: 'encode', to: 'q3', text: '編碼完成的事件再進下一個佇列。' },
            { from: 'q3', to: 'upload', text: '上傳模組同樣自己來拿。整條管線從「一串齒輪」變成「四個各自轉的輪子」。' },
            { from: 'upload', to: 'encoded', text: '最後才寫進已編碼儲存系統。' },
            { from: 'encoded', to: 'cdn', text: '再分發到 CDN。' }
          ]
        }
      ],
      caption: '同一組模組、同一個順序，差別只在中間有沒有佇列——但平行度完全不同。'
    } },
    append: [{
      type: 'probe',
      ask: '「在全球設立多個上傳中心」與「引入訊息佇列」，各自解決的是哪一種慢？',
      options: [
        ['一個解決網路距離，一個解決內部等待', true,
          '一個是網路延遲，一個是流程耦合。兩種慢的成因完全不同，所以解法也不一樣。'],
        ['兩者都是為了降低 CDN 的流量成本', false,
          '降低 CDN 成本是另一節的主題，靠的是熱門／長尾分流。'],
        ['兩者都是為了提高影片的播放畫質', false,
          '畫質由轉碼與自適應串流決定，跟這兩個最佳化無關。']
      ],
      reveal: '看到「慢」先問是哪一種慢：是路太遠，還是在排隊等人？'
    }]
  },

  // ── 小節 4：流程 B 再深入 ─────────────────────────────────────
  'sd14-s04-p01': { append: [{
    type: 'probe',
    ask: '流程 B 更新的 metadata 裡包含哪些東西？',
    options: [
      ['影片的網址、大小、解析度、格式與使用者資訊', true,
        '都是「關於影片」的描述，不是影片本身的位元組。'],
      ['影片每一個 GOP 的實際內容', false,
        'GOP 是影片位元組，走的是流程 A。'],
      ['CDN 各個 edge 節點的快取狀態', false,
        '那是 CDN 自己管的，不在 metadata 資料庫裡。']
    ],
    reveal: 'metadata 的共同特徵：小、結構化、要能被查詢——跟影片位元組正好相反。'
  }] },

  'sd14-s04-p02': { append: [{
    type: 'probe',
    ask: '把「上傳影片」與「更新 metadata」包成同一個請求，最直接的壞處是什麼？',
    options: [
      ['量級差太多，綁在一起會互相拖累', true,
        '兩者的大小、耗時與失敗方式差了好幾個數量級，綁在一起只會被最慢的那個拖住。'],
      ['會讓 metadata 資料庫壓力變大', false,
        '寫入的資料量沒有變，變的是什麼時候才寫得進去。'],
      ['會讓影片沒有辦法完成轉碼', false,
        '轉碼看的是原始儲存系統裡有沒有影片，跟請求怎麼包無關。']
    ],
    reveal: '一個請求只該承擔一種失敗模式。把量級差很多的兩件事綁在一起，兩邊都會變差。'
  }] },

  'sd14-s04-p03': { append: [{
    type: 'probe',
    ask: '如果 metadata 已經寫好，但影片位元組上傳失敗了，系統應該呈現什麼狀態？',
    options: [
      ['還不能播放，位元組還沒到齊', true,
        '所以才需要在 metadata 裡有一個「是否已就緒」的狀態，由完成事件處理程序在轉碼完成後才翻過去。'],
      ['直接把 metadata 刪掉', false,
        '刪掉就失去了「這次上傳失敗過」的線索，也讓續傳無從接起。'],
      ['照樣開放給觀眾播放', false,
        '觀眾會拿到一支播不出來的影片。']
    ],
    reveal: '兩條平行的路必然會有「一條走完、另一條還沒」的中間狀態——設計就是要誠實地描述它。'
  }] },

  // ── 小節 5：DAG 與轉碼架構 ────────────────────────────────────
  'sd14-s05-p01': {
    replace: { 2: {
      type: 'arch',
      title: '圖 14-8：影片轉碼的 DAG（有向非循環圖）',
      hint: '點任一個任務看它在做什麼；或播一次，看原始影片怎麼被拆開又組回來。',
      intro: '不同的內容創作者有不同的處理需求：有人要浮水印，有人自己提供縮圖。與其寫死一條固定流程，不如讓人用 DAG 描述「要做哪些任務、誰依賴誰」。',
      nodes: [
        { id: 'src', label: '原始影片', hint: 'DAG 的起點', kind: 'client', col: 1, row: 2,
          detail: '一支剛上傳完的原始影片。接下來它會被拆成影片、聲音與 metadata 三個部分。' },
        { id: 'video', label: '影片', hint: 'video track', kind: 'service', col: 2, row: 1,
          detail: '拆出來的影像軌。第二階段的幾個任務都是套在它上面的。' },
        { id: 'audio', label: '聲音', hint: 'audio track', kind: 'service', col: 2, row: 2,
          detail: '拆出來的聲音軌，接下來要做聲音編碼。' },
        { id: 'meta', label: '詮釋資料', hint: 'metadata', kind: 'store', col: 2, row: 3,
          detail: '影片本身帶的資訊。它不需要再被加工，直接進入最後的組合。' },
        { id: 'inspect', label: '檢查', kind: 'queue', col: 3, row: 1,
          detail: '確保影片品質良好，而且沒有格式錯誤。這是最先該做的——格式壞掉的影片，後面所有計算都是白費的。' },
        { id: 'encode', label: '影片轉碼', kind: 'queue', col: 4, row: 1,
          detail: '對影片進行轉換，以支援不同的解析度、編碼解碼器與比特率。它會輸出 360p 到 4k 那一整組檔案。' },
        { id: 'thumb', label: '略縮圖', kind: 'queue', col: 3, row: 2,
          detail: '略縮圖可以由使用者上傳，也可以由系統自動生成。' },
        { id: 'mark', label: '浮水印', kind: 'queue', col: 4, row: 2,
          detail: '浮在影片上面的圖片疊加層，其中可包含影片相關的標識資訊。不是每個創作者都需要——這正是要用 DAG 而不是固定流程的原因。' },
        { id: 'aenc', label: '聲音編碼', kind: 'queue', col: 3, row: 3,
          detail: '聲音軌自己的編碼任務。它跟影片那幾個任務是平行的。' },
        { id: 'merge', label: '組合', hint: '等所有分支完成', kind: 'service', col: 5, row: 2,
          detail: '把處理完的影片、聲音與 metadata 合併成最後的輸出。它必須等所有分支都完成——這就是 DAG 裡「依賴」的意思。' }
      ],
      edges: [
        { from: 'src', to: 'video' },
        { from: 'src', to: 'audio' },
        { from: 'src', to: 'meta' },
        { from: 'video', to: 'inspect' },
        { from: 'video', to: 'thumb' },
        { from: 'inspect', to: 'encode' },
        { from: 'thumb', to: 'mark' },
        { from: 'audio', to: 'aenc' },
        { from: 'encode', to: 'merge' },
        { from: 'mark', to: 'merge' },
        { from: 'aenc', to: 'merge' },
        { from: 'meta', to: 'merge' }
      ],
      flows: [{
        label: '一支影片走完整張 DAG',
        steps: [
          { from: 'src', to: 'video', text: '第一階段：原始影片先被拆分成影片（Video）……' },
          { from: 'src', to: 'audio', text: '……聲音（Audio）……' },
          { from: 'src', to: 'meta', text: '……以及 metadata 詮釋資料。這三件事互不相干，所以可以同時進行。' },
          { from: 'video', to: 'inspect', text: '第二階段開始。影片先做檢查：確保品質良好且沒有格式錯誤。' },
          { from: 'inspect', to: 'encode', text: '檢查過了才進行影片轉碼，輸出不同解析度與編碼的版本。' },
          { from: 'video', to: 'thumb', text: '同一時間，略縮圖任務也在跑——它不必等轉碼。' },
          { from: 'thumb', to: 'mark', text: '需要的話再加上浮水印。不需要浮水印的創作者，這個節點就不會出現在他的 DAG 裡。' },
          { from: 'audio', to: 'aenc', text: '聲音軌這一路只做聲音編碼，跟影片那一路完全平行。' },
          { from: 'encode', to: 'merge', text: '最後所有分支在「組合」會合。任何一個分支還沒完成，組合就不能開始——這就是 DAG 表達的依賴關係。' }
        ]
      }],
      caption: '有向（誰接在誰後面）、非循環（不會繞回自己）——所以排程器才能算出「哪些任務現在可以同時跑」。'
    } },
    append: [{
      type: 'probe',
      ask: '為什麼要用 DAG 來描述轉碼流程，而不是寫死一條固定的處理順序？',
      options: [
        ['需求各不相同，而且能表達平行關係', true,
          '有人要浮水印、有人自備縮圖。用 DAG 描述，就能同時拿到彈性與平行性。'],
        ['因為 DAG 執行起來比較省 CPU', false,
          '計算量沒變，變的是可以有多少任務同時進行。'],
        ['因為 DAG 可以處理迴圈依賴', false,
          '正好相反，DAG 的 A（Acyclic）就是「非循環」——它不允許繞回自己。']
      ],
      reveal: 'Facebook 的串流影片引擎也用了同樣的 DAG 程式設計模型：以分階段的方式定義任務，再循序或平行地執行。'
    }]
  },

  'sd14-s05-p02': {
    replace: { 0: {
      type: 'arch',
      title: '圖 14-10～14-21：影片轉碼架構的六個構成元素',
      hint: '書上用了六張圖，每張各自把一個元件塗黑。這裡點一下就等於看那一張圖。',
      intro: '這個架構有六個主要的構成元素：預處理器、DAG 排程器、資源管理工具、任務工作程序、臨時儲存空間，以及最後做為輸出的已編碼影片。',
      nodes: [
        { id: 'temp', label: '臨時儲存空間', hint: '暫存 GOP 與 metadata', kind: 'store', col: 3, row: 1, span: 2,
          detail: '（圖 14-20）這裡會運用到多種儲存系統，選哪一種取決於資料類型、大小、存取頻率與資料壽命。worker 經常存取的 metadata 很小，適合放記憶體快取；影片與聲音資料則放 BLOB 儲存系統。相應的影片處理完成之後，就會釋放掉臨時儲存空間裡的資料。' },
        { id: 'pre', label: '預處理器', hint: '切分、相容、生成 DAG、快取', kind: 'service', col: 1, row: 2,
          detail: '（圖 14-11）四項職責：① 影片分割成 GOP；② 針對不支援分割的舊客戶端，改在伺服端用 GOP 對齊的方式切分；③ 根據設定檔生成 DAG；④ 把 GOP 與 metadata 快取到臨時儲存空間，編碼失敗時可以用它重試。' },
        { id: 'dag', label: 'DAG 排程器', hint: '拆成階段，放進任務佇列', kind: 'service', col: 2, row: 2,
          detail: '（圖 14-14）把 DAG 圖再劃分成好幾個階段的任務，然後放入資源管理工具的任務佇列中。以圖 14-15 為例：第一階段把原始影片拆成影片、聲音、metadata；第二階段才做影片編碼、略縮圖與聲音編碼。' },
        { id: 'rm', label: '資源管理工具', hint: '三個佇列 + 一個任務排程器', kind: 'service', col: 3, row: 2,
          detail: '（圖 14-16）負責管理資源分配的效率。內部有任務佇列、工作程序佇列、執行佇列三個佇列，以及一個任務排程器負責把最佳的任務與最佳的工作程序配對起來。' },
        { id: 'worker', label: '任務工作程序', hint: '實際執行任務', kind: 'service', col: 4, row: 2,
          detail: '（圖 14-18／14-19）實際執行 DAG 所定義任務的地方。不同的工作程序可以執行不同的任務：浮水印、編碼、略縮圖、合併程序等等。' },
        { id: 'out', label: '已編碼影片', hint: '例如 funny_720p.mp4', kind: 'store', col: 5, row: 2,
          detail: '（圖 14-21）編碼流程最後的輸出。例如 funny_720p.mp4 就是輸出的一個例子。' }
      ],
      edges: [
        { from: 'pre', to: 'dag' },
        { from: 'dag', to: 'rm' },
        { from: 'rm', to: 'worker' },
        { from: 'worker', to: 'out' },
        { from: 'pre', to: 'temp', label: '快取 GOP' },
        { from: 'worker', to: 'temp', label: '中間結果' }
      ],
      flows: [{
        label: '一支影片走完整條轉碼管線',
        steps: [
          { from: 'pre', to: 'temp', text: '預處理器先把影片切成 GOP，並把 GOP 與 metadata 存進臨時儲存空間——這一步是為了提高可靠性：編碼失敗時可以用保存的資料重試。' },
          { from: 'pre', to: 'dag', text: '預處理器根據設定檔生成 DAG，交給 DAG 排程器。' },
          { from: 'dag', to: 'rm', text: 'DAG 排程器把 DAG 劃分成好幾個階段的任務，放進資源管理工具的任務佇列。' },
          { from: 'rm', to: 'worker', text: '資源管理工具挑出最高優先權的任務與最適合的工作程序，指派下去。' },
          { from: 'worker', to: 'temp', text: '工作程序執行任務，中間結果放在臨時儲存空間裡。' },
          { from: 'worker', to: 'out', text: '所有任務完成後，輸出已編碼影片，例如 funny_720p.mp4。處理完成後，臨時儲存空間裡的資料就會被釋放掉。' }
        ]
      }],
      caption: '書上圖 14-11、14-14、14-16、14-18、14-20、14-21 是同一張圖分別塗黑其中一個方塊——在這裡，塗黑就是點一下。'
    } },
    append: [{
      type: 'probe',
      ask: '預處理器把 GOP 與 metadata 存進臨時儲存空間，主要是為了什麼？',
      options: [
        ['提高可靠性：編碼失敗時可以直接重試', true,
          '不必從原始儲存系統重新下載、重新切分，重試的成本低很多。'],
        ['為了讓客戶端可以下載中間結果', false,
          '臨時儲存空間是系統內部用的，處理完就釋放掉了。'],
        ['為了節省 BLOB 儲存系統的空間', false,
          '它反而多佔了一份空間，換到的是重試時的速度與可靠性。']
      ],
      reveal: '快取中間結果是為了「失敗時便宜地再來一次」——這跟為了讀取速度而快取是不同的動機。'
    }]
  },

  'sd14-s05-p03': {
    insertAfter: { 1: {
      type: 'arch',
      title: '圖 14-17：資源管理工具的內部',
      hint: '點任一個佇列看它裝什麼；或播一次，看一個任務怎麼被配對到工作程序上。',
      intro: '資源管理工具裡有三個佇列與一個任務排程器。要看懂它，先分清楚三個佇列各自裝的是什麼。',
      nodes: [
        { id: 'taskq', label: '任務佇列', hint: '優先權佇列：待執行的任務', kind: 'queue', col: 1, row: 1,
          detail: '這是一個優先權佇列，其中包含所要執行的任務（task）。排程器永遠先取出優先權最高的那一個。' },
        { id: 'workerq', label: '工作程序佇列', hint: '優先權佇列：worker 的利用狀況', kind: 'queue', col: 1, row: 2,
          detail: '這也是一個優先權佇列，其中包含工作程序（worker）的利用狀況相關資訊。有了它，排程器才知道哪一台現在最閒、最適合接這個任務。' },
        { id: 'runq', label: '執行佇列', hint: '正在執行的 task / worker 配對', kind: 'queue', col: 1, row: 3,
          detail: '其中包含目前所要執行的任務，以及執行這些任務的相應工作程序訊息。工作完成之後，任務排程器就會把執行佇列裡的這個工作移除掉。' },
        { id: 'sched', label: '任務排程器', hint: '挑任務、挑 worker、綁起來', kind: 'service', col: 2, row: 2,
          detail: '它會選出最佳的任務／工作程序（task / worker）配對，並指派所選擇的工作程序去執行任務。整個資源管理工具的決策都在這裡。' },
        { id: 'workers', label: '任務工作程序', hint: '浮水印／編碼／略縮圖／合併', kind: 'service', col: 3, row: 2,
          detail: '實際執行任務的一群 worker。不同的工作程序可以執行不同的任務。' }
      ],
      edges: [
        { from: 'sched', to: 'taskq', label: '取得優先權最高的任務' },
        { from: 'sched', to: 'workerq', label: '取得最佳工作程序' },
        { from: 'sched', to: 'runq', label: '把配對放入佇列' },
        { from: 'sched', to: 'workers', label: '執行任務' }
      ],
      flows: [{
        label: '一個任務怎麼被指派出去',
        steps: [
          { from: 'sched', to: 'taskq', text: '任務排程器從任務佇列中，取出具有最高優先權的任務。' },
          { from: 'sched', to: 'workerq', text: '再從工作程序佇列中，取出最適合執行這個任務的工作程序。' },
          { from: 'sched', to: 'workers', text: '指派這個工作程序去執行任務。' },
          { from: 'sched', to: 'runq', text: '把任務與工作程序的資訊綁定起來，放入執行佇列。工作完成之後，排程器就會把它從執行佇列移除掉。' }
        ]
      }],
      caption: '三個佇列分別回答三個問題：還有什麼要做、誰有空、現在誰在做什麼。'
    } },
    append: [{
      type: 'probe',
      ask: '「執行佇列」存在的價值是什麼？',
      options: [
        ['它記錄現在誰在做什麼', true,
          '沒有這份記錄，掛掉的 worker 身上那些任務就會靜悄悄地消失。'],
        ['它用來決定任務的優先權順序', false,
          '那是任務佇列的職責。'],
        ['它用來存放已經完成的任務', false,
          '工作完成之後，排程器就會把它從執行佇列裡移除掉。']
      ],
      reveal: '錯誤處理裡那句「任務工作程序出問題：改用新的工作程序，重新嘗試執行任務」，靠的就是這份記錄。'
    }]
  },

  // ── 小節 6：串流與協定 ────────────────────────────────────────
  'sd14-s06-p01': { append: [{
    type: 'probe',
    ask: '「下載」與「串流」的根本差別是什麼？',
    options: [
      ['下載整部先複製，串流邊收邊播', true,
        '所以串流時客戶端一次只載入一點點資料，馬上就能連續播放，不必等整部影片下載完。'],
      ['下載的畫質通常比較高', false,
        '畫質由編碼決定，跟傳輸方式無關。'],
      ['串流播放時不需要網路', false,
        '串流反而需要持續的網路——這也是為什麼緩衝區那麼重要。']
    ],
    reveal: '「不必等整部影片下載完」這件事，決定了後面所有關於分段、緩衝與自適應畫質的設計。'
  }] },

  'sd14-s06-p02': { append: [{
    type: 'probe',
    ask: '關於 MPEG-DASH、HLS、Smooth Streaming、HDS 這幾種串流協定，面試裡真正該記住的是什麼？',
    options: [
      ['不同協定支援不同編碼與播放器', true,
        '協定名稱是特定領域的底層細節，重點是知道「為什麼要選」，而不是背全名。'],
      ['要能默寫出每一種協定的縮寫全稱', false,
        '書上明講了：你並不需要完全理解、甚至不需要記住這些名稱。'],
      ['一律選 HLS 是最安全的做法', false,
        '沒有一律正確的選擇，取決於要支援哪些裝置與播放器。']
    ],
    reveal: '知道「這是一類要做的選擇、以及選擇的依據是什麼」，比背名字有用得多。'
  }] },

  'sd14-s06-p03': { append: [{
    type: 'probe',
    ask: '比特率（bitrate）比較高，代表什麼？',
    options: [
      ['畫質通常比較好，但更吃頻寬與效能', true,
        '比特率指的是在一定時間內處理位元資料的速度。它同時決定了畫質與對頻寬的要求。'],
      ['代表影片的長度比較長', false,
        '長度跟比特率是兩件事，同一支影片可以有不同比特率的版本。'],
      ['代表使用的容器格式比較新', false,
        '容器（.mp4／.mov／.avi）決定的是怎麼打包，不是資料速率。']
    ],
    reveal: '容器像一個籃子，把影片、聲音與 metadata 裝在一起；編碼解碼器（H.264、VP9、HEVC）才是負責壓縮的那一層。'
  }] },

  // ── 小節 7：CDN 命中率 ────────────────────────────────────────
  'sd14-s07-p01': { append: [{
    type: 'probe',
    ask: '為什麼「熱門影片」特別適合放 CDN？',
    options: [
      ['同一份內容被大量重複請求', true,
        '快取的效益來自重複存取。重複得越多，同一份副本攤下來的成本越低。'],
      ['因為熱門影片的檔案通常比較小', false,
        '熱不熱門跟檔案大小沒有關係。'],
      ['因為熱門影片的畫質要求比較低', false,
        '熱門影片通常反而要提供更完整的畫質選項。']
    ],
    reveal: 'YouTube 的影片串流相當符合長尾分佈：少數影片被存取得特別頻繁，大量影片幾乎沒人看。'
  }] },

  'sd14-s07-p02': { append: [{
    type: 'probe',
    ask: '為什麼冷門影片放進 CDN 反而不划算？',
    options: [
      ['佔著空間與費用，卻幾乎沒人再請求', true,
        '所以書上的做法是：只在 CDN 提供最受歡迎的影片，其他影片由自己的高容量影片伺服器來服務。'],
      ['因為 CDN 無法儲存冷門影片', false,
        '技術上存得下，問題是划不划算。'],
      ['因為冷門影片的格式並不相容', false,
        '格式跟受歡迎程度沒有關係。']
    ],
    reveal: '有些影片只在特定地區特別受歡迎——這些影片也不必分配到其他地區去。'
  }] },

  'sd14-s07-p03': { append: [{
    type: 'probe',
    ask: '如果 CDN 沒有命中、而源頭（自家影片伺服器）也出問題，最該避免的是什麼？',
    options: [
      ['大量請求同時湧向源頭，把它一起壓垮', true,
        '這也是為什麼要有回源保護與分層快取——源頭是最後一道，不能讓它跟著倒。'],
      ['讓使用者暫時看到較低的畫質', false,
        '降畫質是可接受的降級，比完全播不出來好。'],
      ['讓 CDN 繼續服務舊的副本', false,
        '繼續服務舊副本反而是這時候最有用的行為。']
    ],
    reveal: '快取層失效時，真正的風險不是「變慢」，而是所有壓力瞬間轉嫁到後面那一層。'
  }] },

  // ── 小節 8：自適應串流 ────────────────────────────────────────
  'sd14-s08-p01': { append: [{
    type: 'probe',
    ask: '播放器為什麼是一段一段地要影片，而不是一次要整支？',
    options: [
      ['它可以在每一段之間改變畫質', true,
        '一段一段拿，才有機會在中途切換——這正是自適應串流的基礎。'],
      ['因為伺服器一次只能傳一段', false,
        '伺服器當然可以傳更多，是播放器選擇這樣要的。'],
      ['因為一次要整支會違反串流協定', false,
        '那樣做叫下載，不是協定不允許，而是體驗完全不同。']
    ],
    reveal: '「切分」在這一章出現了三次：GOP 切分為了平行上傳，DAG 切分為了平行處理，分段為了自適應播放。'
  }] },

  'sd14-s08-p02': { append: [{
    type: 'probe',
    ask: '播放器第一段通常不選最高畫質。為什麼？',
    options: [
      ['還不知道實際頻寬，先求快點播出來', true,
        '第一段用低畫質可以最快開始播放；播起來之後，再根據實際下載速度決定要不要往上切。'],
      ['因為最高畫質的第一段還沒轉碼完', false,
        '影片早就轉碼好了，這是播放時的決策。'],
      ['因為使用者通常看不出差別', false,
        '看得出來——這是為了縮短開始播放前的等待，不是因為畫質不重要。']
    ],
    reveal: '先播出來，再變好看：這個順序背後的假設是「等待比畫質更讓人不耐煩」。'
  }] },

  'sd14-s08-p03': { append: [{
    type: 'probe',
    ask: '播放器判斷「要不要切換畫質」時，最重要的依據是什麼？',
    options: [
      ['緩衝區還剩多少', true,
        '緩衝區快見底就往下降畫質保住連續播放；緩衝區很滿就可以試著往上切。'],
      ['使用者的裝置型號', false,
        '裝置決定畫質的上限，但不決定當下要不要切換。'],
      ['影片的總長度與大小', false,
        '長度跟當下的網路狀況無關。']
    ],
    reveal: '緩衝區是播放器唯一能直接觀察到的「未來」——所以所有決策都繞著它轉。'
  }] },

  // ── 小節 9：錯誤處理 ──────────────────────────────────────────
  'sd14-s09-p01': { append: [{
    type: 'probe',
    ask: '「可恢復的錯誤」與「不可恢復的錯誤」，處理方式的關鍵差別是什麼？',
    options: [
      ['可恢復的重試，不可恢復的停止', true,
        '例如某片段轉碼失敗是可恢復的；格式本身壞掉的影片則是不可恢復的，再重試幾次也一樣。'],
      ['可恢復的錯誤不必通知客戶端', false,
        '如果重試到最後仍然失敗，還是要送回適當的錯誤碼。'],
      ['不可恢復的錯誤要重試更多次', false,
        '正好相反——重試只是在浪費資源。']
    ],
    reveal: '先分類再處理。分錯類的代價是：該重試的放棄了，不該重試的卻一直重試。'
  }] },

  'sd14-s09-p02': { append: [{
    type: 'probe',
    ask: '「預處理器錯誤」的標準做法是什麼？',
    options: [
      ['重新生成 DAG 圖', true,
        '預處理器的核心產出就是 DAG，它出錯就重新生成一份。'],
      ['直接把影片退回給使用者', false,
        '這是系統內部可以自行恢復的錯誤。'],
      ['切換到另一個 CDN', false,
        'CDN 跟轉碼前的預處理完全是不同階段的事。']
    ],
    reveal: '每一種元件的錯誤處理，本質上都是在回答「這個元件的產出可不可以重做」。'
  }] },

  'sd14-s09-p03': { append: [{
    type: 'probe',
    ask: '為什麼「重試」不能無限重試下去？',
    options: [
      ['持續失敗會佔用資源，拖累其他工作', true,
        '所以系統要有一個判斷「已不可恢復」的界線，越過就回報錯誤碼給客戶端。'],
      ['因為重試會讓輸出的畫質變差', false,
        '重試不改變輸出的內容。'],
      ['因為客戶端並不允許重試', false,
        '重試是伺服端自己的決定。']
    ],
    reveal: '重試是有預算的。沒有上限的重試，會把一個局部故障變成全系統的資源耗盡。'
  }] },

  'sd14-s09-p04': { append: [{
    type: 'probe',
    ask: 'API 伺服器出問題時可以直接把請求導向另一台，metadata 資料庫卻要看角色。差別在哪裡？',
    options: [
      ['無狀態的可以直接換，有狀態的要看角色', true,
        'master 掛了要把一個 slave 提升為新的 master；slave 掛了則改用另一個 slave 讀取，再補一台回來。'],
      ['因為資料庫的成本比較昂貴', false,
        '成本不是這裡的考量，狀態才是。'],
      ['因為 API 伺服器根本不會故障', false,
        '它會壞，只是壞了之後換一台的代價很低。']
    ],
    reveal: '無狀態與有狀態，是決定「掛了怎麼辦」最重要的一條分界線。'
  }] },

  'sd14-s09-p05': { append: [{
    type: 'probe',
    ask: 'metadata 快取伺服器有一個節點出問題時，為什麼系統還能正常運作？',
    options: [
      ['資料被複製很多份，還能存取其他節點', true,
        '「不要只設計一個唯一節點」是這一頁的重點——資源管理工具的佇列出問題時，同樣是使用副本。'],
      ['因為快取的資料可以從客戶端補回來', false,
        '客戶端沒有那些資料。'],
      ['因為快取不重要，掛了也沒差', false,
        '快取掛了會讓資料庫壓力暴增，絕對有差。']
    ],
    reveal: '複寫的快取、有副本的佇列——同一個原則套在不同元件上。'
  }] },

  // ── 小節 10：節省成本 ─────────────────────────────────────────
  'sd14-s10-p01': {
    replace: { 1: {
      type: 'arch',
      title: '圖 14-27：熱門影片走 CDN，其他影片走自家伺服器',
      hint: '點任一條路，看什麼樣的內容會走它。',
      intro: '這不是「先經 CDN、沒命中再回源」的快取階層，而是一開始就依內容受歡迎程度分成兩條路。',
      nodes: [
        { id: 'user', label: '使用者', hint: 'TV／電腦／手機', kind: 'client', col: 1, row: 2,
          detail: '觀眾要看哪一支影片，決定了這個請求走哪一條路。' },
        { id: 'cdn', label: 'CDN', hint: '只放最受歡迎的影片', kind: 'cdn', col: 2, row: 1,
          detail: '只在 CDN 提供最受歡迎的影片。這些影片被重複請求的次數夠多，快取的效益才攤得回來。有些影片只在特定地區受歡迎，那就不必分配到其他地區。' },
        { id: 'video', label: 'Video 伺服器', hint: '自家高容量伺服器', kind: 'service', col: 2, row: 3,
          detail: '其他影片由我們自己的高容量影片伺服器來提供服務。這些是長尾內容：很少被存取，放在 CDN 上只會一直付錢卻沒有命中。' }
      ],
      edges: [
        { from: 'user', to: 'cdn', label: '最受歡迎的影片' },
        { from: 'user', to: 'video', label: '其他影片' }
      ],
      flows: [{
        label: '同一個觀眾，兩種不同的請求',
        steps: [
          { from: 'user', to: 'cdn', text: '點開一支正在爆紅的影片：走 CDN，由離觀眾最近的 edge 伺服器提供，幾乎沒有延遲。' },
          { from: 'user', to: 'video', text: '點開一支三年前、只有兩百次觀看的影片：走自家的高容量影片伺服器。慢一點，但省下的 CDN 費用很可觀。' }
        ]
      }],
      caption: '所有這些最佳化，都是以內容的受歡迎程度、使用者的存取模式與影片大小做為基礎——所以在動手之前，要先分析觀看模式的歷史資料。'
    } },
    append: [{
      type: 'probe',
      ask: '每天 15 萬美元的 CDN 成本是怎麼估出來的？',
      options: [
        ['500 萬 × 5 支 × 0.3 GB × 0.02 美元', true,
          '假設 100% 流量從美國提供、每 GB 平均成本 0.02 美元，只算影片串流的部分。'],
        ['每天 150 TB × 每 GB 0.02 美元', false,
          '150 TB 是每天要「存」的量，CDN 費用算的是每天「傳」的量。'],
        ['500 萬 DAU × 每天 30 分鐘 × 0.02 美元', false,
          'CDN 是依傳輸的資料量計費，不是依時間。']
      ],
      reveal: '就算雲端供應商願意為大客戶大幅降價，這項成本還是跑不掉——所以才需要後面那些最佳化。'
    }]
  },

  'sd14-s10-p02': { append: [{
    type: 'probe',
    ask: '針對沒那麼受歡迎的影片，書上提到的一個省錢做法是什麼？',
    options: [
      ['不必儲存那麼多種編碼版本', true,
        '與其先把每一種畫質都轉好放著，不如等真的有人要看再說。'],
      ['直接把冷門影片全部刪掉', false,
        '刪掉使用者的影片不是一個可接受的最佳化。'],
      ['只保留最高畫質的那個版本', false,
        '那反而最佔空間，而且低頻寬的觀眾會播不動。']
    ],
    reveal: '長尾內容的共同特徵是「可能永遠不會被用到」——所以任何預先做好的工作都可能是白做的。'
  }] },

  'sd14-s10-p03': { append: [{
    type: 'probe',
    ask: '「建立自己的 CDN 並與 ISP 合作」這個做法，什麼時候才划算？',
    options: [
      ['規模夠大的串流媒體公司才值得', true,
        'Netflix 就是這樣做的。世界各地都有當地的 ISP，而且都離使用者很近，合作可以改善觀看體驗並減少頻寬費用。'],
      ['任何有 CDN 成本的公司都應該立刻自建', false,
        '自建 CDN 是一個龐大的專案，小規模時完全不划算。'],
      ['只有在 CDN 供應商拒絕降價時', false,
        '這是規模與長期成本的決策，不是談判破裂的備案。']
    ],
    reveal: '同一個決定在不同規模下答案完全相反——說得出「在什麼規模下才成立」，比說出結論重要。'
  }] },

  // ── 小節 11：安全性 ──────────────────────────────────────────
  'sd14-s11-p01': { append: [{
    type: 'probe',
    ask: '上傳這一端最需要防的是什麼？',
    options: [
      ['未授權的人寫進來，或寫錯位置', true,
        '所以才需要預簽名網址：由 API 伺服器驗證身份之後，才發出一張指定物件的通行證。'],
      ['使用者上傳的影片檔案太大', false,
        '大小限制是另一回事（這一題上限是 1 GB），跟授權無關。'],
      ['使用者上傳了不受歡迎的內容', false,
        '那屬於影片下架的範圍，不是上傳授權的問題。']
    ],
    reveal: '「誰有資格寫進來」是任何儲存系統都要先回答的問題。'
  }] },

  'sd14-s11-p02': {
    replace: { 1: {
      type: 'arch',
      title: '圖 14-26：預簽名上傳網址',
      hint: '播一次，注意影片位元組完全沒有經過 API 伺服器。',
      intro: '客戶端不能直接寫進儲存系統，但也不該讓幾百 MB 的影片穿過 API 伺服器。預簽名網址同時解決了這兩件事。',
      nodes: [
        { id: 'raw', label: '原始儲存系統', hint: '接收實際的影片檔案', kind: 'store', col: 1, row: 1,
          detail: '影片位元組直接寫到這裡，完全不經過 API 伺服器中轉。' },
        { id: 'user', label: '使用者', hint: 'TV／電腦／手機', kind: 'client', col: 2, row: 1, span: 2,
          detail: '客戶端先跟 API 伺服器要一張通行證，再拿著它自己去上傳。' },
        { id: 'api', label: 'API 伺服器', hint: '驗證身份，簽發網址', kind: 'service', col: 2, row: 3, span: 2,
          detail: '驗證使用者身份之後，簽發一個預簽名網址（pre-signed URL），把存取權限授予網址內所指定的那一個物件。這是 Amazon S3 的術語；Microsoft Azure BLOB 儲存系統也支援相同功能，名稱是「共享存取簽章」（Shared Access Signature）。' }
      ],
      edges: [
        { from: 'user', to: 'api', label: '① 請求上傳' },
        { from: 'api', to: 'user', label: '② 預簽名網址' },
        { from: 'user', to: 'raw', label: '③ 上傳影片' }
      ],
      flows: [{
        label: '三步走完',
        steps: [
          { from: 'user', to: 'api', text: '第 1 步：客戶端向 API 伺服器發出 HTTP 請求，要取得一個預簽名網址。' },
          { from: 'api', to: 'user', text: '第 2 步：API 伺服器驗證身份後，用預簽名網址做為回應。這張通行證只對指定的物件有效。' },
          { from: 'user', to: 'raw', text: '第 3 步：客戶端一收到回應，就用這個預簽名網址直接上傳影片——位元組從頭到尾沒有經過 API 伺服器。' }
        ]
      }],
      caption: '控制權在 API 伺服器（誰可以寫、可以寫到哪），流量卻不經過它。'
    } },
    append: [{
      type: 'probe',
      ask: '預簽名網址同時解決了兩個問題，是哪兩個？',
      options: [
        ['授權留在 API 伺服器，流量不經過它', true,
          '授權判斷留在 API 伺服器，但幾百 MB 的傳輸直接走儲存系統。'],
        ['上傳時的加密與壓縮', false,
          '那是內容處理，跟授權方式無關。'],
        ['提高轉碼速度與降低 CDN 成本', false,
          '轉碼與 CDN 成本是另外兩節的主題。']
      ],
      reveal: '把「決定權」與「資料流」分開，是很常見的一招——它讓控制點不必變成流量瓶頸。'
    }]
  },

  'sd14-s11-p03': { append: [{
    type: 'probe',
    ask: '保護受版權保護的影片，書上給了三種選項。哪一個描述是正確的？',
    options: [
      ['AES 加密的影片，播放時才解密', true,
        '加密過的影片可以在播放時進行解密，這樣才能確保只有已授權的使用者看得到。另外兩種選項是 DRM 系統與視覺浮水印。'],
      ['DRM 的三大主流是 FairPlay、Widevine 與 HLS', false,
        'HLS 是串流協定，不是 DRM。三大主流是 Apple FairPlay、Google Widevine 與 Microsoft PlayReady。'],
      ['視覺浮水印可以有效防止影片被下載', false,
        '浮水印只是疊加一層標識資訊，它讓盜版可以被追溯，但擋不住下載。']
    ],
    reveal: '三種手段的強度與成本不同：DRM 最強也最複雜，浮水印最弱但幾乎沒有代價。'
  }] },

  // ── 小節 12：總結 ────────────────────────────────────────────
  'sd14-s12-p01': { append: [{
    type: 'probe',
    ask: '為什麼「擴展 API 層」比「擴展資料庫」單純得多？',
    options: [
      ['API 伺服器無狀態，加機器就好', true,
        '資料庫則要談複寫（replication）與分片（sharding），因為它有狀態。'],
      ['因為 API 伺服器的流量比較小', false,
        'API 伺服器承接的請求數其實很多，但每個請求都很輕。'],
      ['因為資料庫根本不需要擴展', false,
        '資料庫一樣需要擴展，只是手段比較複雜。']
    ],
    reveal: '無狀態的東西加機器就好；有狀態的東西，每加一台都要回答「資料放哪、誰是主」。'
  }] },

  'sd14-s12-p02': { append: [{
    type: 'probe',
    ask: '直播（live streaming）與隨選影片相比，最主要的差別是什麼？',
    options: [
      ['對延遲要求更高，對平行性要求較低', true,
        '因為只有一小部分資料需要即時處理。另外，直播的錯誤處理也不同：任何太花時間的處理方式都是不可接受的。'],
      ['直播完全不需要轉碼', false,
        '兩者都需要上傳、編碼與串流。'],
      ['直播可以完全沿用同一套錯誤處理', false,
        '直播需要不同的錯誤處理——太花時間的做法在直播裡沒有意義。']
    ],
    reveal: '同樣是「上傳、編碼、串流」三件事，但時間預算不同，整套取捨就跟著不同。'
  }] },

  'sd14-s12-p03': { append: [{
    type: 'probe',
    ask: '影片下架（takedown）的兩種觸發來源是什麼？',
    options: [
      ['系統自動發現，加上使用者檢舉', true,
        '侵犯版權、色情或其他非法行為的影片都應該被下架。'],
      ['全部由人工審查來決定', false,
        '有一些在上傳過程中就會被系統自動發現。'],
      ['全部由自動偵測來決定', false,
        '使用者檢舉仍然是重要的來源。']
    ],
    reveal: '自動偵測擋掉量，人工檢舉補上判斷——兩者是互補而不是替代。'
  }] },

  'sd14-s12-p04': { append: [{
    type: 'probe',
    ask: '回頭看整章：如果把「完成事件訊息佇列」從架構裡拿掉，最先壞掉的是什麼？',
    options: [
      ['轉碼伺服器必須等下游', true,
        '佇列的價值就是讓上游不必等下游。拿掉它，兩邊的速度就被綁死在一起了。'],
      ['影片會完全無法轉碼', false,
        '轉碼本身不依賴佇列，佇列傳的是「轉碼完成了」這個事件。'],
      ['CDN 會無法分發影片', false,
        '已轉碼影片走的是 3a 那一條路，跟佇列沒有關係。']
    ],
    reveal: '收尾時的好問題：每一個方塊如果不見了，系統會壞在哪裡？答得出來，就代表你知道它為什麼在那裡。'
  }] }
};
