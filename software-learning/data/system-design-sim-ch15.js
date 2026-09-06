(() => {
  window.SYSTEM_DESIGN_SIM = window.SYSTEM_DESIGN_SIM || {};

  const ref = pageId => ({ pageId, sectionId: pageId.replace(/-p\d+$/, '') });
  const OFF_ALWAYS = label => ({ id: 'off', label, cost: 0 });
  const MB = 1024 * 1024, GB = 1024 * MB;

  window.SYSTEM_DESIGN_SIM['sd-book-15'] = {
    chapterId: 'sd-book-15',
    title: '雲端硬碟保衛戰：一個位元組都不能掉',
    subtitle: '你接手一個雲端硬碟服務。這一題的請求數其實很小（上傳 API 峰值只有 480 QPS），真正的難點是每個請求後面帶著的位元組，以及那句寫在第一條的非功能需求——資料丟失是不可接受的。12 個月內，你會遇到大檔案上傳中斷、區塊伺服器當機、儲存區域故障、metadata 主庫掛掉、兩台裝置看到不同版本、儲存帳單暴增、通知服務重連風暴。',
    briefing: [
      '**先玩下面的「上傳可視化實驗室」**。它把課本圖 15-14 那張時序圖整個演出來：客戶端串流讀取檔案並切成 4 MB 區塊，再逐塊送往區塊伺服器驗證、壓縮、加密，最後寫進雲端儲存；同一時間另一條路先把 metadata 寫成 **pending**。你可以在傳到一半時把任何一台伺服器打掛，親眼看到哪些區塊是安全的、哪些當場丟失、以及檔案狀態會怎樣。',
      '**三台伺服器掛掉的後果完全不同**：區塊伺服器掛 → 正在處理的區塊中斷，已寫入的安全；雲端儲存掛 → 新區塊落不了地；**API 伺服器掛 → 位元組照樣安全寫進去，但「上傳完成」的回調沒人收，檔案永遠卡在 pending，別的裝置看得到卻不能下載**。這三種是不一樣的故障，救法也不一樣。',
      '**斷點續傳決定重來的代價**：有它，恢復後從中斷的地方接著傳；沒有它，剛才寫進去的全部白費、整份從頭來。實驗室右下角會直接算給你看浪費了多少。',
      '**差異同步決定第二次上傳的代價**：上傳完成後按「改幾個區塊後再傳一次」，有差異同步時只有變動的格子會重跑，其餘全部跳過；沒有的話整份重來。10 GB 的檔案改兩個區塊，差別是 8 MB 對 10 GB。',
      '**看球色就知道正在傳什麼**：青色小球是檔案區塊、紫色是 Metadata、黃色是 API 請求、橘色是變更通知。按一般上傳會看到客戶端先切出多個區塊，再分別送往區塊伺服器。',
      '**節點上的符號**：✓ 有做保護 · ⚠ 元件照跑但沒備援 · ✕ 這個東西你還沒建（例如還沒建離線備份佇列），流量不會經過它。點節點上方有底線的策略文字可以換做法。',
      '這一章的容量不是瓶頸，所以沒有負載率——記分的是**可用率**與**資料完整度**。每個月初決定各項能力要用哪一種做法，事件發生時不能再改變主意。'
    ],
    months: 12,
    qoeLabel: '資料完整度 Integrity',
    viewersLabel: '目前同步中的裝置數估計',
    addUsersLabel: '＋100 裝置',
    demoLabels: {
      watch: '⬇ 模擬裝置下載變更',
      upload: '⬆ 模擬上傳一個檔案',
      search: '🔔 模擬一次變更通知'
    },
    viewersAtMonth: m => Math.round(2000 * Math.pow(1.55, m)),
    draggableTopology: true,
    // The diagram, inspector and blank simulator all speak this same store/request model. These
    // are not decorative labels: each demo upload writes real rows that remain visible for the
    // rest of the run.
    dataModel: {
      stores: [
        {
          id: 'driveMetadata', nodeId: 'metadataDB', kind: 'relational database',
          label: 'Google Drive Metadata 資料庫',
          description: '只保存檔案結構、版本、區塊索引與上傳狀態；真正的檔案位元組在雲端物件儲存。',
          tables: [
            { id: 'user', label: 'user', key: 'user_id', schema: [
              { name: 'user_id', type: 'uuid', note: '使用者唯一 ID' },
              { name: 'user_name', type: 'varchar', note: '顯示名稱' },
              { name: 'created_at', type: 'timestamp', note: '建立時間' }
            ], seed: [{ user_id: 'usr-demo', user_name: '示範使用者', created_at: '2026-09-05' }] },
            { id: 'device', label: 'device', key: 'device_id', schema: [
              { name: 'device_id', type: 'uuid', note: '裝置 ID' }, { name: 'user_id', type: 'uuid FK', note: '所屬使用者' },
              { name: 'last_logged_in_at', type: 'timestamp', note: '最後連線時間' }
            ], seed: [{ device_id: 'dev-web', user_id: 'usr-demo', last_logged_in_at: '現在' }, { device_id: 'dev-phone', user_id: 'usr-demo', last_logged_in_at: '現在' }] },
            { id: 'workspace', label: 'workspace', key: 'workspace_id', schema: [
              { name: 'workspace_id', type: 'uuid', note: '根目錄／共享空間 ID' }, { name: 'owner_id', type: 'uuid FK', note: '擁有者' },
              { name: 'is_shared', type: 'boolean', note: '是否共享' }, { name: 'created_at', type: 'timestamp', note: '建立時間' }
            ], seed: [{ workspace_id: 'ws-demo', owner_id: 'usr-demo', is_shared: true, created_at: '2026-09-05' }] },
            { id: 'file', label: 'file', key: 'file_id', schema: [
              { name: 'file_id', type: 'uuid', note: '檔案唯一 ID' }, { name: 'file_name', type: 'varchar', note: '檔名' },
              { name: 'relative_path', type: 'varchar', note: '名稱空間內路徑' }, { name: 'workspace_id', type: 'uuid FK', note: '所屬工作區' },
              { name: 'latest_version', type: 'int', note: '最新版本號' }, { name: 'upload_status', type: 'enum', note: 'pending / uploaded / interrupted' },
              { name: 'checksum', type: 'sha256', note: '完整檔案校驗值' }, { name: 'last_modified', type: 'timestamp', note: '最後更新' }
            ] },
            { id: 'file_version', label: 'file_version（append-only）', key: 'version_id', schema: [
              { name: 'version_id', type: 'uuid', note: '不可變版本 ID' }, { name: 'file_id', type: 'uuid FK', note: '所屬檔案' },
              { name: 'device_id', type: 'uuid FK', note: '來源裝置' }, { name: 'version_number', type: 'int', note: '版本序號' },
              { name: 'size_bytes', type: 'bigint', note: '邏輯大小' }, { name: 'created_at', type: 'timestamp', note: '建立時間' }
            ] },
            { id: 'block', label: 'block index', key: 'block_id', schema: [
              { name: 'block_id', type: 'uuid / sha256', note: '區塊 ID；啟用去重時可直接採內容雜湊' },
              { name: 'content_hash', type: 'sha256', note: '用來驗證內容並比對重複區塊' }, { name: 'object_key', type: 'varchar', note: '物件儲存位置' },
              { name: 'size_bytes', type: 'int', note: '區塊大小' }, { name: 'replicas', type: 'int', note: '耐久性副本數' }
            ] },
            { id: 'file_version_block', label: 'file_version_block', schema: [
              { name: 'version_id', type: 'uuid FK', note: '檔案版本' }, { name: 'block_id', type: 'sha256 FK', note: '實際區塊' },
              { name: 'block_order', type: 'int', note: '重建檔案時的順序' }
            ] },
            { id: 'upload_session', label: 'upload_session', key: 'session_id', schema: [
              { name: 'session_id', type: 'uuid', note: '斷點續傳工作階段' }, { name: 'file_id', type: 'uuid FK', note: '上傳中的檔案' },
              { name: 'received_blocks', type: 'int', note: '已確實落地的區塊' }, { name: 'status', type: 'enum', note: 'active / completed / interrupted' }
            ] }
          ]
        },
        {
          id: 'driveObjects', nodeId: 'cloudStorage', kind: 'object storage', label: '雲端儲存系統',
          description: '保存加密後的檔案區塊。Metadata DB 只持有 object_key，不把大型位元組塞進資料列。',
          tables: [{ id: 'objects', label: 'encrypted block objects', key: 'object_key', schema: [
            { name: 'object_key', type: 'varchar', note: 'bucket 內的物件鍵' }, { name: 'file_id', type: 'uuid', note: '來源檔案' },
            { name: 'block_id', type: 'uuid / sha256', note: '對應 metadata block index' },
            { name: 'content_hash', type: 'sha256', note: '解密後內容的校驗值' }, { name: 'bytes', type: 'int', note: '這個區塊的實際位元組' },
            { name: 'encrypted', type: 'boolean', note: '寫入前已加密' }, { name: 'replication', type: 'varchar', note: '單區／跨區複製' }
          ] }]
        },
        {
          id: 'driveCache', nodeId: 'metadataCache', kind: 'cache', label: 'Metadata 快取',
          description: '快速提供檔案清單；資料庫更新時應立即失效，避免另一台裝置看到舊版本。',
          tables: [{ id: 'entries', label: 'cache entries', key: 'cache_key', schema: [
            { name: 'cache_key', type: 'varchar', note: 'workspace/file 查詢鍵' }, { name: 'version', type: 'int', note: '快取版本' },
            { name: 'state', type: 'enum', note: 'valid / invalidated' }
          ] }]
        },
        {
          id: 'driveNotifications', nodeId: 'notifyService', kind: 'event stream', label: '通知服務',
          description: '只傳「哪個檔案變了」的輕量事件，客戶端收到後再去抓 metadata 與區塊。',
          tables: [{ id: 'messages', label: 'change notifications', key: 'event_id', schema: [
            { name: 'event_id', type: 'uuid', note: '事件 ID' }, { name: 'file_id', type: 'uuid', note: '變動檔案' },
            { name: 'event', type: 'enum', note: 'pending / uploaded / changed' }, { name: 'device_id', type: 'uuid', note: '接收裝置' }
          ] }]
        },
        {
          id: 'driveOfflineQueue', nodeId: 'offlineQueueNode', kind: 'durable queue', label: '離線備份佇列',
          description: '裝置離線時保存變動事件，重連後依序補送。',
          tables: [{ id: 'pending_changes', label: 'pending changes', key: 'event_id', schema: [
            { name: 'event_id', type: 'uuid', note: '待補送事件' }, { name: 'device_id', type: 'uuid', note: '離線裝置' },
            { name: 'file_id', type: 'uuid', note: '變動檔案' }, { name: 'status', type: 'enum', note: 'queued / delivered' }
          ] }]
        }
      ]
    },
    operationFactory: (kind, seq, ctx) => {
      const pad = String(seq).padStart(3, '0');
      const fileId = ctx.payload?.file_id || `file-${pad}`;
      const name = ctx.payload?.file_name || `demo_upload_${pad}.bin`;
      const bytes = Number(ctx.payload?.size_bytes) || (24 + seq * 4) * MB;
      const blockCount = Math.ceil(bytes / (4 * MB));
      const at = `第 ${ctx.month} 月 / #${seq}`;
      if (kind === 'upload') {
        const versionNumber = Math.max(1, Number(ctx.payload?.version_number) || 1);
        const versionId = `${fileId}-v${versionNumber}`;
        const previousBlocks = Array.isArray(ctx.payload?.previous_blocks) ? ctx.payload.previous_blocks : [];
        const changedBlocks = new Set(ctx.payload?.changed_blocks || []);
        const deltaEnabled = Boolean(ctx.payload?.delta_enabled);
        const resumable = ctx.choices.has('resumableUpload');
        const dedupe = ctx.choices.has('blockDedupe');
        const replication = ctx.choices.get('storageReplication');
        const replicaCount = replication === 'off' ? 1 : 2;
        const blockRefs = [];
        const blockWrites = Array.from({ length: blockCount }, (_, index) => {
          const order = index + 1;
          const blockPad = String(order).padStart(4, '0');
          const previous = previousBlocks[index];
          const unchanged = Boolean(previous) && !changedBlocks.has(order);
          // Unchanged blocks retain their content hash across versions. Delta sync reuses their
          // old block reference without uploading; server-side dedupe can do the same even when
          // the client sent the bytes again. Changed blocks receive a new immutable hash.
          const hashStem = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'file';
          const contentHash = unchanged ? previous.contentHash : `sha256-${hashStem}-v${versionNumber}-${blockPad}`;
          const reusesExisting = unchanged && (deltaEnabled || dedupe);
          const blockId = reusesExisting ? previous.blockId : dedupe ? contentHash : `block-${pad}-${blockPad}`;
          const objectKey = `blocks/${blockId}`;
          const blockBytes = Math.min(4 * MB, bytes - index * 4 * MB);
          blockRefs.push({ blockId, contentHash, objectKey, sizeBytes: blockBytes });
          const writes = [
            { storeId: 'driveMetadata', tableId: 'block', key: 'block_id', row: { block_id: blockId, content_hash: contentHash, object_key: objectKey, size_bytes: blockBytes, replicas: replicaCount } },
            { storeId: 'driveMetadata', tableId: 'file_version_block', row: { version_id: versionId, block_id: blockId, block_order: order } }
          ];
          if (!reusesExisting) writes.push(
            { storeId: 'driveObjects', tableId: 'objects', key: 'object_key', row: { object_key: objectKey, file_id: fileId, block_id: blockId, content_hash: contentHash, bytes: blockBytes, encrypted: true, replication } }
          );
          return writes;
        }).flat();
        const existingVersion = versionNumber > 1;
        const pendingFile = existingVersion
          ? { file_id: fileId, upload_status: 'pending', last_modified: at }
          : { file_id: fileId, file_name: name, relative_path: `/demo/${name}`, workspace_id: 'ws-demo', latest_version: 0, upload_status: 'pending', checksum: `sha256-${pad}`, last_modified: at };
        return {
          label: `上傳 ${name}${existingVersion ? ` v${versionNumber}` : ''}`,
          payload: { file_id: fileId, file_name: name, version_number: versionNumber, size_bytes: bytes, block_count: blockCount, upload_type: resumable ? 'resumable' : 'simple' },
          blockRefs,
          writesOnHop: [
            { nodeId: 'metadataDB', storeId: 'driveMetadata', tableId: 'file', key: 'file_id', row: pendingFile },
            ...(resumable ? [{ nodeId: 'metadataDB', storeId: 'driveMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, file_id: fileId, received_blocks: 0, status: 'active' } }] : []),
            { nodeId: 'notifyService', storeId: 'driveNotifications', tableId: 'messages', key: 'event_id', row: { event_id: `pending-${pad}`, file_id: fileId, event: 'pending', device_id: 'dev-phone' } }
          ],
          writesOnComplete: [
            { storeId: 'driveMetadata', tableId: 'file', key: 'file_id', row: { file_id: fileId, latest_version: versionNumber, upload_status: 'uploaded', checksum: `sha256-${pad}-v${versionNumber}`, last_modified: at } },
            { storeId: 'driveMetadata', tableId: 'file_version', key: 'version_id', row: { version_id: versionId, file_id: fileId, device_id: 'dev-web', version_number: versionNumber, size_bytes: bytes, created_at: at } },
            ...blockWrites,
            ...(resumable ? [{ storeId: 'driveMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, file_id: fileId, received_blocks: blockCount, status: 'completed' } }] : []),
            { storeId: 'driveCache', tableId: 'entries', key: 'cache_key', row: { cache_key: `file:${fileId}`, version: versionNumber, state: ctx.choices.get('cacheConsistency') === 'invalidate' ? 'invalidated' : 'valid（可能暫時過期）' } },
            { storeId: 'driveNotifications', tableId: 'messages', key: 'event_id', row: { event_id: `uploaded-${pad}`, file_id: fileId, event: 'uploaded', device_id: 'dev-phone' } }
          ],
          writesOnFail: [
            { storeId: 'driveMetadata', tableId: 'file', key: 'file_id', row: { file_id: fileId, upload_status: 'interrupted', last_modified: at } },
            ...(resumable ? [{ storeId: 'driveMetadata', tableId: 'upload_session', key: 'session_id', row: { session_id: `upload-${pad}`, file_id: fileId, status: 'interrupted' } }] : [])
          ]
        };
      }
      if (kind === 'search') return {
        label: `通知檔案變更 #${pad}`,
        payload: { event_id: `change-${pad}`, file_id: fileId, target_device: 'dev-phone' },
        writesOnComplete: [{ storeId: 'driveNotifications', tableId: 'messages', key: 'event_id', row: { event_id: `change-${pad}`, file_id: fileId, event: 'changed', device_id: 'dev-phone' } }]
      };
      return { label: `下載變更 #${pad}`, payload: { file_id: `file-${String(Math.max(1, seq)).padStart(3, '0')}`, device_id: 'dev-phone', operation: 'download_changed_blocks' } };
    },
    lexicon: {
      viewer: '裝置',
      testViewer: '測試裝置',
      item: '檔案',
      segment: '區塊',
      quality: '同步狀態',
      edgeNode: '本機快取',
      originNode: '區塊伺服器',
      regionParts: '區塊伺服器、API 伺服器與 metadata 服務',
      watchVerb: '同步',
      concurrentNoun: '同一個檔案',
      edgeShort: '本機快取',
      client: '同步用戶端',
      itemMeasure: '個',
      overloadSymptom: '同步變慢',
      qoeMetric: '資料完整度'
    },
    // ---------------------------------------------------------------------------------------
    // The centrepiece: a full visualisation of the upload path from 圖 15-14, including the
    // three different ways it can break.
    // ---------------------------------------------------------------------------------------
    uploadLab: {
      label: '上傳可視化實驗室：大檔案是怎麼上去的，掛掉時又會怎樣',
      desc: '選一個檔案按「開始上傳」。每一格是一批 4 MB 的區塊，顏色代表它現在走到管線的哪一步：切分 → 壓縮 → 加密 → 傳輸中 → 已確實寫入雲端儲存。綠色的格子是安全的，紅色是傳到一半丟掉的。上面三台伺服器都可以隨時打掛再復原——注意 API 伺服器掛掉時，位元組其實都安全落地了，但檔案狀態會卡在 pending，這正是本章 pending 這個中間狀態存在的理由。',
      blockBytes: 4 * MB,
      maxCells: 96,
      parallel: 4,
      stageMs: 120,
      resumeComponentId: 'resumableUpload',
      deltaComponentId: 'blockSync',
      dedupeComponentId: 'blockDedupe',
      nodes: { blockServer: 'blockServer', storage: 'cloudStorage', api: 'apiServer' },
      files: [
        { id: 'doc', name: 'proposal.docx', bytes: 40 * MB },
        { id: 'photos', name: 'holiday_photos.zip', bytes: 320 * MB },
        { id: 'video', name: 'wedding_4k.mov', bytes: 2 * GB },
        { id: 'max', name: 'archive.iso（本題上限）', bytes: 10 * GB }
      ]
    },
    components: [
      {
        id: 'resumableUpload',
        name: '斷點續傳（Resumable Upload）',
        shortName: '斷點續傳',
        presence: 'optional',
        desc: '檔案比較大、而且網路中斷的可能性很高時，就需要這個。三個步驟：發送初始請求取得可續傳網址、上傳資料並監控狀態、被打斷時從斷點繼續。沒有它的話，系統根本沒有地方記錄「傳到哪裡」，中斷就只能整份重來。',
        ...ref('sd15-s03-p03'),
        options: [
          { id: 'off', label: '只有簡單上傳（中斷就整份重傳）', cost: 0 },
          { id: 'on', label: '啟用斷點續傳', cost: 1, desc: '維護 upload session 狀態需要一點成本，換來大檔案斷線不必整份重傳。' }
        ]
      },
      {
        id: 'blockSync',
        name: '差異同步（Delta Sync）',
        shortName: '差異同步',
        presence: 'always',
        desc: '對定期更新的大型檔案來說，每次變動都重新發送整個檔案會佔用大量頻寬。差異同步只同步真正變動過的區塊——一個 10 GB 的檔案改了兩個 4 MB 區塊，傳 8 MB 就夠了。',
        ...ref('sd15-s07-p03'),
        options: [
          OFF_ALWAYS('每次變動都重傳整個檔案'),
          { id: 'basic', label: '固定大小區塊比對雜湊', cost: 1, desc: '用固定大小切區塊比對雜湊，實作簡單，多數情況能省下大部分重複資料。' },
          { id: 'adaptive', label: '自適應區塊邊界（rolling hash）', cost: 2, desc: '區塊邊界會跟著內容調整，即使在檔案中間插入資料也抓得到重複部分，去重效果更好但更耗運算。' }
        ]
      },
      {
        id: 'blockDedupe',
        name: '區塊去重',
        shortName: '區塊去重',
        presence: 'optional',
        desc: '如果兩個區塊具有相同的雜湊值，就代表是相同的區塊，可以只存一份。在帳號這個層級上消除冗餘區塊，是一種可節省空間的簡便方法。',
        ...ref('sd15-s11-p02'),
        options: [
          { id: 'off', label: '不做去重（相同內容存很多份）', cost: 2 },
          { id: 'on', label: '啟用區塊去重', cost: -2, desc: '雜湊相同的區塊只存一份，儲存帳單明顯下降。' }
        ]
      },
      {
        // 區塊伺服器與 API 伺服器是兩台完全不同的機器，故障語意也不同，所以是兩個獨立的決定：
        // 綁在同一個元件上會逼出「各一台」這種標籤，而且你永遠配不出「區塊 3 台、API 1 台」。
        id: 'blockServerRedundancy',
        name: '區塊伺服器備援（有狀態，掛掉要有人接手上傳工作）',
        shortName: '區塊伺服器備援',
        presence: 'always',
        desc: '區塊伺服器是這條路上最麻煩的一台：它身上有「正在切分、壓縮、加密、上傳到一半」的工作。它故障時，其他伺服器必須接手那些未完成或待處理的工作，否則使用者的上傳就會永遠卡住。這跟無狀態的 API 伺服器是兩回事，要分開決定。',
        ...ref('sd15-s12-p01'),
        options: [
          { ...OFF_ALWAYS('只有一台，掛掉沒有人接手未完成的上傳'), instances: 1 },
          { id: 'pair', label: '兩台，可接手未完成的上傳工作', cost: 2, instances: 2, desc: '一台掛掉時另一台接手待處理的上傳，正在傳的檔案不會永遠卡住。' },
          { id: 'pool', label: '三台＋心跳偵測，快速接手', cost: 4, instances: 3, desc: '用 heartbeat 相互監視，偵測與接手都更快，尖峰時的中斷幾乎無感。' }
        ]
      },
      {
        id: 'apiRedundancy',
        name: 'API 伺服器備援（無狀態，負載平衡器轉走就好）',
        shortName: 'API 備援',
        presence: 'always',
        desc: 'API 伺服器提供的是一種無狀態的服務——它不持有任何上傳中的工作。故障時流量會被負載平衡器直接重定向到其他 API 伺服器，所以它需要的只是「還有別台可以轉」。便宜很多，但完全不能取代區塊伺服器的備援。',
        ...ref('sd15-s12-p01'),
        options: [
          { ...OFF_ALWAYS('只有一台，掛掉就沒有地方可以轉'), instances: 1 },
          { id: 'pair', label: '兩台，負載平衡器可轉走', cost: 1, instances: 2, desc: '一台掛掉時流量立刻被轉到另一台，使用者幾乎無感。' },
          { id: 'pool', label: '三台，尖峰也有餘裕', cost: 2, instances: 3, desc: '除了故障轉移，也讓尖峰時段的 metadata 請求有足夠餘裕。' }
        ]
      },
      {
        id: 'storageReplication',
        name: '雲端儲存的複製方式',
        shortName: '儲存複製',
        presence: 'always',
        desc: '分片解決的是容量，不是耐久性——單一儲存伺服器壞掉還是會丟資料。S3 儲存桶可以在同區域內複製，也可以跨區域複製；檔案存在多個區域中才能提供真正的冗餘。',
        ...ref('sd15-s04-p02'),
        options: [
          OFF_ALWAYS('單一區域、單一副本'),
          { id: 'sameRegion', label: '同區域多副本', cost: 1, desc: '防止單機故障，但整個區域出事就沒轍。' },
          { id: 'crossRegion', label: '跨區域複製到兩個地理區域', cost: 3, desc: '連整個區域無法使用時，還是可以從其他區域取得檔案。' }
        ]
      },
      {
        id: 'metadataReplication',
        name: 'metadata 資料庫 Master／Slave',
        shortName: 'DB 主從',
        presence: 'always',
        desc: 'Master 出問題時，就把其中一個 slave 提升為新的 master，並啟動另一個新的 slave 節點。資料庫本身一直都在，這裡選的是它壞掉時有沒有人接手、以及多快。',
        ...ref('sd15-s12-p02'),
        options: [
          OFF_ALWAYS('單一 Master，沒有複本'),
          { id: 'manual', label: '人工提升 Slave（約 5 分鐘）', cost: 1, desc: '需要人工確認，恢復較慢但更可控。' },
          { id: 'auto', label: '自動偵測並提升 Slave（約 30 秒）', cost: 2, desc: '偵測到 master 無回應後自動選舉，中斷時間短。' }
        ]
      },
      {
        id: 'cacheConsistency',
        name: 'metadata 快取的一致性策略',
        shortName: '快取一致性',
        presence: 'always',
        desc: '不同客戶端同時顯示同一個檔案時，內容不一致是不可接受的。但記憶體快取預設是終究一致性模型，不同副本可能有不同資料。要達到高度一致性，就必須在寫入資料庫時讓快取內容失效。',
        ...ref('sd15-s08-p01'),
        options: [
          OFF_ALWAYS('終究一致（可能讀到舊版本）'),
          { id: 'ttl', label: '短 TTL 過期', cost: 1, desc: '不一致的窗口變短，但仍然存在。' },
          { id: 'invalidate', label: '寫入資料庫時立即讓快取失效', cost: 2, desc: '確保快取與資料庫保有相同的值，達到高度一致性。' }
        ]
      },
      {
        id: 'notificationMode',
        name: '通知服務的做法',
        shortName: '通知做法',
        presence: 'always',
        desc: '檔案在本地執行過的任何變動，都必須通知其他客戶端以避免衝突。通知服務只需要單向通訊、頻率不高也不突發——所以這一題選長輪詢就夠了，而且更簡單。',
        ...ref('sd15-s10-p03'),
        options: [
          OFF_ALWAYS('客戶端定期重新整理整份清單'),
          { id: 'longPolling', label: '長輪詢（Long Polling）', cost: 1, desc: '每個客戶端維持一條長輪詢連結，偵測到變動就關閉連結去抓最新變動，再重新建立。' },
          { id: 'webSocket', label: 'WebSocket 雙向連線', cost: 3, desc: '持續性的雙向連接，很適合聊天這類場景；對這一題來說是過度設計，成本也更高。' }
        ]
      },
      {
        id: 'offlineQueue',
        name: '離線備份佇列',
        shortName: '離線佇列',
        presence: 'optional',
        desc: '客戶端處於離線狀態而無法下載最新變動時，離線備份佇列會先把相關資訊儲存起來，隨後客戶端再度連線時，這些變動就會進行同步。沒有它的話，離線期間的變動通知就消失了。',
        ...ref('sd15-s06-p03'),
        options: [
          { id: 'off', label: '不建佇列（離線期間的變動通知會消失）', cost: 0 },
          { id: 'on', label: '建立離線備份佇列（多副本）', cost: 1, desc: '佇列會被複製很多次；某個佇列出問題時，使用者重新訂閱其他備份佇列即可。' }
        ]
      },
      {
        id: 'versionPolicy',
        name: '版本保存策略',
        shortName: '版本策略',
        presence: 'always',
        desc: '為了支援版本歷史又要跨資料中心複製，儲存空間很快就會被塞爆——版本數還要再乘上複本數。可以對版本數量設限，也可以把冷資料移到 glacier 這類冷儲存系統。',
        ...ref('sd15-s11-p02'),
        options: [
          OFF_ALWAYS('保留每一個版本，永遠不刪'),
          { id: 'cap', label: '設定版本數量上限', cost: -1, desc: '超過限制時最老的版本會被新版本替換掉。' },
          { id: 'capCold', label: '版本上限＋冷版本移到冷儲存', cost: -3, desc: '好幾個月沒被存取的舊版本移到 glacier，價格比 S3 便宜很多。' }
        ]
      },
      {
        id: 'conflictResolution',
        name: '同步衝突的處理',
        shortName: '衝突處理',
        presence: 'always',
        desc: '兩個使用者同時修改同一個檔案時，先處理到的版本為準，晚到的會收到衝突通知。問題是：那個晚到的人的修改要怎麼辦？',
        ...ref('sd15-s05-p02'),
        options: [
          OFF_ALWAYS('後到的直接覆蓋先到的'),
          { id: 'keepBoth', label: '偵測衝突，兩份都保留', cost: 1, desc: '把本機副本與伺服器最新版本都顯示出來，讓使用者自己決定。' },
          { id: 'mergeAttempt', label: '偵測衝突，先嘗試自動合併', cost: 3, desc: '先嘗試自動合併，失敗才退回保留兩份，體驗更好但實作更複雜。' }
        ]
      }
    ],
    topology: {
      viewBox: '0 0 1180 700',
      crossRegionWeight: 2.6,
      nodes: [
        { id: 'users', kind: 'user', label: '使用者（瀏覽器／App）', region: '客戶端', x: 90, y: 330, arriveLabel: '裝置收到同步結果' },
        { id: 'clientChunker', kind: 'fixed', label: '客戶端分塊器', region: '客戶端', x: 90, y: 150, size: 'small', arriveLabel: '串流讀取檔案，切成 4 MB 區塊並建立每塊 checksum' },
        { id: 'resumableBadge', kind: 'component', componentId: 'resumableUpload', label: '斷點續傳', region: '客戶端', x: 90, y: 500, size: 'small', arriveLabel: '查詢已成功寫入的位元組位置' },

        { id: 'blockServer', kind: 'component', componentId: 'blockServerRedundancy', label: '區塊伺服器', region: '服務層', x: 320, y: 150, pool: true, extraInstanceCost: 2, arriveLabel: '逐塊驗證 checksum、壓縮與加密' },
        { id: 'deltaBadge', kind: 'component', componentId: 'blockSync', label: '差異同步', region: '服務層', x: 320, y: 40, size: 'small', arriveLabel: '比對雜湊，只挑出真正變動的區塊' },
        { id: 'loadBalancer', kind: 'fixed', label: 'Load Balancer', region: '服務層', x: 320, y: 330, arriveLabel: '在 API 伺服器之間平均分配請求' },
        { id: 'apiServer', kind: 'component', componentId: 'apiRedundancy', label: 'API 伺服器', region: '服務層', x: 540, y: 330, pool: true, extraInstanceCost: 1, arriveLabel: '驗證身份、更新檔案的 metadata' },
        { id: 'conflictBadge', kind: 'component', componentId: 'conflictResolution', label: '衝突偵測', region: '服務層', x: 540, y: 200, size: 'small', arriveLabel: '比對版本，偵測是否有並行修改' },

        { id: 'cloudStorage', kind: 'component', componentId: 'storageReplication', label: '雲端儲存系統', region: '儲存層', zone: '儲存層', x: 560, y: 40, arriveLabel: '把加密後的區塊寫入儲存桶' },
        { id: 'dedupeBadge', kind: 'component', componentId: 'blockDedupe', label: '區塊去重', region: '儲存層', zone: '儲存層', x: 790, y: 40, size: 'small', arriveLabel: '雜湊相同的區塊只存一份' },
        { id: 'coldStorage', kind: 'component', componentId: 'versionPolicy', label: '冷儲存系統', region: '儲存層', zone: '儲存層', x: 790, y: 150, arriveLabel: '把好幾個月沒被存取的舊版本移過來' },

        { id: 'metadataCache', kind: 'component', componentId: 'cacheConsistency', label: 'Metadata 快取', region: '資料層', zone: '資料層', x: 790, y: 330, arriveLabel: '從快取讀取 metadata' },
        { id: 'metadataDB', kind: 'component', componentId: 'metadataReplication', label: 'Metadata 資料庫', region: '資料層', zone: '資料層', x: 1010, y: 330, arriveLabel: '寫入或讀取檔案狀態與版本' },

        { id: 'notifyService', kind: 'component', componentId: 'notificationMode', label: '通知服務', region: '通知層', zone: '通知層', x: 560, y: 560, arriveLabel: '通報相關客戶端檔案有變動' },
        { id: 'offlineQueueNode', kind: 'component', componentId: 'offlineQueue', label: '離線備份佇列', region: '通知層', zone: '通知層', x: 800, y: 560, arriveLabel: '客戶端離線時先把變動存起來' }
      ],
      edges: [
        { from: 'users', to: 'clientChunker' },
        { from: 'clientChunker', to: 'blockServer' },
        { from: 'users', to: 'loadBalancer' },
        { from: 'users', to: 'notifyService' },
        { from: 'users', to: 'resumableBadge', kind: 'stub', requiresComponent: 'resumableUpload' },
        { from: 'blockServer', to: 'deltaBadge', kind: 'stub' },
        { from: 'blockServer', to: 'cloudStorage' },
        { from: 'loadBalancer', to: 'apiServer' },
        { from: 'apiServer', to: 'conflictBadge', kind: 'stub' },
        { from: 'apiServer', to: 'metadataCache' },
        { from: 'apiServer', to: 'metadataDB' },
        { from: 'apiServer', to: 'notifyService' },
        { from: 'cloudStorage', to: 'apiServer' },
        { from: 'cloudStorage', to: 'dedupeBadge', kind: 'stub', requiresComponent: 'blockDedupe' },
        { from: 'cloudStorage', to: 'coldStorage' },
        { from: 'notifyService', to: 'offlineQueueNode', kind: 'stub', requiresComponent: 'offlineQueue' },
        { from: 'offlineQueueNode', to: 'users', kind: 'stub', requiresComponent: 'offlineQueue' }
      ],
      // Three genuinely different paths, matching 圖 15-14 and 圖 15-15.
      //   upload → 位元組走區塊伺服器，metadata 走 API 伺服器，最後回調把狀態翻成 uploaded
      //   watch  → 另一台裝置收到通知後，先抓 metadata，再抓變動過的區塊
      //   search → 一次純粹的變更通知
      computeFlows: (kind) => {
        if (kind !== 'upload') return null;
        return [
          {
            id: 'metadata',
            label: 'Metadata：先寫入 pending，立刻通知其他裝置',
            payloadType: 'metadata',
            nodes: ['users', 'loadBalancer', 'apiServer', 'metadataDB', 'apiServer', 'notifyService', 'users']
          },
          {
            id: 'bytes',
            label: '檔案區塊：客戶端切分 → 逐塊壓縮／加密／落地 → callback',
            payloadType: 'file',
            packetCount: 7,
            packetLabel: '檔案',
            nodes: ['users', 'clientChunker', 'blockServer', 'cloudStorage', 'apiServer', 'metadataDB', 'apiServer', 'notifyService', 'users']
          }
        ];
      },
      computeFlow: (kind, ctx) => {
        if (kind === 'upload') {
          return ['users', 'clientChunker', 'blockServer', 'cloudStorage', 'apiServer', 'metadataDB', 'apiServer', 'notifyService', 'users'];
        }
        if (kind === 'search') {
          return ctx.has('offlineQueue')
            ? ['users', 'loadBalancer', 'apiServer', 'notifyService', 'offlineQueueNode', 'users']
            : ['users', 'loadBalancer', 'apiServer', 'notifyService', 'users'];
        }
        return ['notifyService', 'users', 'loadBalancer', 'apiServer', 'metadataDB', 'apiServer', 'loadBalancer', 'users',
                'blockServer', 'cloudStorage', 'blockServer', 'users'];
      }
    },
    events: [
      {
        month: 2,
        id: 'bigUploadDrop',
        title: '有人上傳 8 GB 的專案封存檔，傳到 70% 網路斷了',
        relevantComponents: ['resumableUpload'],
        demoFlow: ['users', 'blockServer', 'cloudStorage'],
        narrative: '一位使用者在咖啡廳上傳 8 GB 的封存檔，傳到七成時 Wi-Fi 斷線。他重新連上網路，然後盯著進度條。',
        resolve: ctx => {
          if (ctx.has('resumableUpload')) return { uptime: 0, qoe: 1, log: '有斷點續傳：系統記得已經確實寫入的區塊，恢復後從斷點接著傳，剩下的三成幾分鐘就傳完了。使用者根本沒發現斷過線。', ok: true };
          return { uptime: -6, qoe: -9, log: '沒有斷點續傳：已經寫進去的 5.6 GB 全部作廢，整份從頭重來。使用者傳了三次都沒成功，最後放棄並在論壇抱怨。', ok: false };
        }
      },
      {
        month: 3,
        id: 'blockServerCrash',
        title: '區塊伺服器在尖峰時段當機，上百個檔案正在上傳中',
        relevantComponents: ['blockServerRedundancy', 'resumableUpload'],
        demoFlow: ['users', 'blockServer', 'cloudStorage', 'apiServer'],
        narrative: '一台區塊伺服器硬體故障離線，當下有上百個檔案正在被它切分、壓縮、加密與上傳。注意：這一台是有狀態的，多買 API 伺服器對它一點幫助都沒有。',
        resolve: ctx => {
          const red = ctx.get('blockServerRedundancy');
          const resumable = ctx.has('resumableUpload');
          if (red === 'pool' && resumable) return { uptime: -1, qoe: 1, log: '心跳很快偵測到故障，其他區塊伺服器接手了那些未完成與待處理的工作；已經確實寫入雲端儲存的區塊完全不受影響，續傳從斷點接上。使用者只看到進度條停頓了幾秒。', ok: true };
          if (red !== 'off' && resumable) return { uptime: -3, qoe: -2, log: '有另一台可以接手，但偵測慢了一些；部分上傳中斷後從斷點恢復，少數使用者看到失敗訊息並手動重試。', ok: true };
          if (red !== 'off') return { uptime: -6, qoe: -7, log: '有伺服器接手，但沒有斷點續傳——那上百個傳到一半的檔案全部要從頭重來。已經寫進儲存系統的位元組沒有丟，但沒有人記得它們屬於哪一次上傳。', ok: false };
          return { uptime: -18, qoe: -16, log: '只有一台區塊伺服器，沒有人接手未完成的工作。所有進行中的上傳直接卡死，使用者的檔案停在「上傳中」的狀態好幾個小時。', ok: false };
        }
      },
      {
        month: 4,
        id: 'storageRegionDown',
        title: '主要儲存區域整個無法使用',
        relevantComponents: ['storageReplication'],
        demoFlow: ['users', 'blockServer', 'cloudStorage'],
        narrative: '雲端供應商的一個地理區域發生大規模故障，你的主要儲存桶完全無法讀寫。',
        resolve: ctx => {
          const id = ctx.get('storageReplication');
          if (id === 'crossRegion') return { uptime: -2, qoe: 0, log: '檔案在兩個地理區域都有一份，讀取自動切到另一個區域。使用者感覺到稍微變慢，但沒有任何一個檔案讀不到。', ok: true };
          if (id === 'sameRegion') return { uptime: -14, qoe: -12, log: '同區域內有多副本，但整個區域一起出事——所有副本都在那裡。檔案在故障期間完全讀不到，寫入也全部失敗。', ok: false };
          return { uptime: -26, qoe: -24, log: '單一區域、單一副本。這次不只是讀不到——區域恢復後發現部分儲存節點的資料沒能救回來，有使用者永久失去了檔案。這正是第一條非功能需求說「不可接受」的那件事。', ok: false };
        }
      },
      {
        month: 5,
        id: 'apiServerCrash',
        title: '一台 API 伺服器當機（跟上次那台完全不同的問題）',
        relevantComponents: ['apiRedundancy'],
        demoFlow: ['users', 'loadBalancer', 'apiServer', 'metadataDB'],
        narrative: '一台 API 伺服器離線。它不持有任何上傳中的工作——它只負責驗證身份、讀寫 metadata。所以這一次要問的不是「誰接手未完成的工作」，而是「還有沒有別台可以轉」。',
        resolve: ctx => {
          const id = ctx.get('apiRedundancy');
          if (id !== 'off') return { uptime: 0, qoe: 0, log: 'API 伺服器是無狀態的，負載平衡器立刻把流量轉到其他台，沒有任何請求失敗。這種故障便宜得多——正因為它身上沒有狀態。', ok: true };
          return { uptime: -11, qoe: -6, log: '只有一台 API 伺服器，沒有地方可以轉。所有 metadata 操作全部失敗：檔案清單載不出來、上傳完成的檔案也翻不成 uploaded。位元組其實都在，但整個服務看起來像掛了。', ok: false };
        }
      },
      {
        month: 6,
        id: 'metadataMasterDown',
        title: 'metadata 資料庫的 Master 節點當機',
        relevantComponents: ['metadataReplication'],
        demoFlow: ['users', 'loadBalancer', 'apiServer', 'metadataDB'],
        narrative: '負責寫入的 metadata Master 突然離線。所有需要更新檔案狀態的操作——包括把上傳完的檔案從 pending 翻成 uploaded——都指向它。',
        resolve: ctx => {
          const id = ctx.get('metadataReplication');
          if (id === 'auto') return { uptime: -1, qoe: 0, log: '約 30 秒內自動把一個 slave 提升為新的 master，並啟動新的 slave。寫入幾乎無縫恢復，卡在 pending 的檔案很快就翻成 uploaded。', ok: true };
          if (id === 'manual') return { uptime: -6, qoe: -3, log: '需要人工確認才提升 slave，大約 5 分鐘的寫入空窗。這段期間傳完的檔案全部卡在 pending，使用者看得到卻不能下載。', ok: true };
          return { uptime: -22, qoe: -18, log: '沒有複本可以提升。所有 metadata 寫入停擺，已經上傳完成的檔案永遠翻不成 uploaded——位元組明明都在雲端儲存裡，使用者卻一個都拿不到。', ok: false };
        }
      },
      {
        month: 7,
        id: 'staleRead',
        title: '同一個人的筆電和手機顯示同一個檔案的不同版本',
        relevantComponents: ['cacheConsistency'],
        demoFlow: ['users', 'loadBalancer', 'apiServer', 'metadataCache'],
        narrative: '使用者在筆電上改完檔案存檔，切到手機卻還是舊的內容；重新整理幾次，兩邊時好時壞地在兩個版本之間跳。',
        resolve: ctx => {
          const id = ctx.get('cacheConsistency');
          if (id === 'invalidate') return { uptime: 0, qoe: 1, log: '寫入資料庫的同時快取立刻失效，下一次讀取一定回到 master 拿到最新值。兩台裝置永遠顯示同一個版本。', ok: true };
          if (id === 'ttl') return { uptime: -2, qoe: -5, log: '短 TTL 讓不一致的窗口縮到幾秒，但窗口仍然存在——剛好在窗口內切換裝置的使用者還是看到了舊版本，並且回報成 bug。', ok: false };
          return { uptime: -5, qoe: -14, log: '終究一致性模型下，不同快取副本各自持有不同的資料。使用者在兩台裝置上看到兩個版本，甚至基於舊版本又改了一次，製造出一個本來可以避免的衝突。', ok: false };
        }
      },
      {
        month: 9,
        id: 'storageBill',
        title: '儲存帳單三個月內翻了四倍',
        relevantComponents: ['versionPolicy', 'blockDedupe'],
        demoFlow: ['cloudStorage', 'coldStorage'],
        narrative: '財務部門發現儲存成本失控。你調查後發現：一份被頻繁編輯的設計檔在一週內產生了 900 個版本，而且每個版本都在兩個區域各存了一份完整副本。',
        resolve: ctx => {
          const ver = ctx.get('versionPolicy');
          const dedupe = ctx.has('blockDedupe');
          if (ver === 'capCold' && dedupe) return { uptime: 0, qoe: 1, log: '區塊去重讓沒變動的內容只存一份，版本上限擋住了 900 個版本的暴衝，冷版本移到 glacier 之後成本再降一階。帳單回到合理範圍，而且沒有丟掉任何一個使用者真的想要的版本。', ok: true };
          if (ver !== 'off' && dedupe) return { uptime: 0, qoe: 0, log: '去重加版本上限把成長壓住了，但舊版本還全部躺在熱儲存上，帳單仍然偏高。', ok: true };
          if (ver !== 'off' || dedupe) return { uptime: -2, qoe: -2, log: '只做了一半：不是版本無限成長，就是相同內容存了很多份。成本降下來一些，但趨勢沒有真的被止住。', ok: false };
          return { uptime: -4, qoe: -6, log: '版本全部保留、相同區塊也沒有去重，再乘上跨區複製的倍數。為了控制成本，團隊倉促刪掉了一批舊版本，結果誤刪了使用者還需要的修訂記錄。', ok: false };
        }
      },
      {
        month: 10,
        id: 'notifyOutage',
        title: '通知服務整台當掉，上百萬條長輪詢連線同時斷開',
        relevantComponents: ['notificationMode', 'offlineQueue'],
        demoFlow: ['users', 'loadBalancer', 'apiServer', 'notifyService', 'offlineQueueNode'],
        narrative: '一台通知伺服器故障。它身上掛著超過一百萬條長輪詢連線，全部在同一秒斷開，然後同時嘗試重連。',
        resolve: ctx => {
          const mode = ctx.get('notificationMode');
          const queue = ctx.has('offlineQueue');
          if (mode !== 'off' && queue) return { uptime: -3, qoe: 0, log: '重連確實花了幾分鐘——一台機器上百萬條連線本來就很難立刻全部接回來。但斷線期間的變動都進了離線備份佇列，客戶端重連後一筆不漏地補完，沒有任何裝置漏掉更新。', ok: true };
          if (mode !== 'off') return { uptime: -8, qoe: -10, log: '連線陸續重建，但沒有離線備份佇列——斷線那幾分鐘內發生的變動通知直接消失了。有些裝置一直沒發現檔案被改過，直到使用者手動重新整理。', ok: false };
          if (queue) return { uptime: -6, qoe: -6, log: '沒有推播機制，客戶端靠定期重新整理整份清單。佇列保住了變動，但同步延遲長達好幾分鐘，使用者一直在問「為什麼還沒同步」。', ok: false };
          return { uptime: -14, qoe: -15, log: '既沒有推播也沒有佇列。裝置只能靠自己定期重掃，斷線期間的變動全部遺漏，多台裝置的狀態開始各自漂移。', ok: false };
        }
      },
      {
        month: 11,
        id: 'finale',
        title: '年度大遷徙：全公司同時把本機檔案搬上雲端',
        relevantComponents: ['resumableUpload', 'blockServerRedundancy', 'storageReplication', 'conflictResolution'],
        demoFlow: ['users', 'blockServer', 'cloudStorage', 'apiServer', 'metadataDB', 'apiServer', 'notifyService'],
        narrative: '一個大企業客戶決定在同一週把所有部門的檔案全部搬上來：幾十萬個檔案、大量超過 1 GB 的大檔、還有很多人同時編輯同一批共享資料夾。',
        resolve: ctx => {
          const shields = ['resumableUpload', 'blockServerRedundancy', 'storageReplication', 'conflictResolution'].filter(id => ctx.has(id)).length;
          const table = {
            4: { uptime: 1, qoe: 2, log: '四道防線都到位：斷點續傳讓大檔案不怕中斷、備援伺服器接住尖峰、跨區複製保住耐久性、衝突偵測把同時編輯的檔案兩份都留下來。整週遷徙沒有丟失任何一個檔案。', ok: true },
            3: { uptime: -4, qoe: -4, log: '大部分都撐住了，但缺的那一環在尖峰時被放大——有一批檔案需要人工介入才救回來。', ok: false },
            2: { uptime: -12, qoe: -12, log: '只有一半的防線，大檔案重傳與衝突覆蓋同時發生，客戶開始質疑這個服務能不能託付重要資料。', ok: false },
            1: { uptime: -22, qoe: -22, log: '幾乎沒有保護，遷徙變成災難：上傳反覆失敗，共享資料夾裡有人的修改被直接覆蓋掉。', ok: false },
            0: { uptime: -34, qoe: -32, log: '完全沒有防線。這一週遺失與覆蓋的檔案數量無法估計，客戶要求全額退款並終止合約。', ok: false }
          };
          return table[shields];
        }
      }
    ],
    grade: score => {
      if (score >= 90) return { letter: 'S', text: '你把「資料丟失是不可接受的」這條需求貫徹到了每一個元件：位元組永遠有第二份、狀態機永遠不會把半個檔案當成完成、衝突永遠留兩份。這一年沒有任何一個使用者失去他的檔案。' };
      if (score >= 78) return { letter: 'A', text: '大部分關鍵時刻都準備到位，只有少數事件讓使用者感覺到明顯的影響，但資料本身沒有真的丟失。' };
      if (score >= 62) return { letter: 'B', text: '服務撐過了這一年，但至少有一次事件造成了不小的傷害，值得回頭檢討當時的判斷。' };
      if (score >= 45) return { letter: 'C', text: '多次事件都造成明顯損害，過程相當狼狽，而且有使用者真的感受到了資料的不完整。' };
      return { letter: 'F', text: '這套架構在多次故障中把使用者的檔案弄丟了——對一個儲存服務來說，這是最不能發生的事。回教材重新想一次 pending 狀態、跨區複製與斷點續傳各自在擋什麼，再挑戰一次。' };
    }
  };
})();
