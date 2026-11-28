'use strict';

/*
 * 第 2 冊第 8 章專屬舞台動畫（Part 3：第 6 章 ～ 第 11 章剩餘 15 個場景）
 * 補足 100% 場景專屬舞台，完全告別九宮格圓點模板。
 */
(() => {
  const SC = (window.EMAIL_CUSTOM_SCENES = window.EMAIL_CUSTOM_SCENES || {});
  const grp = (S, id, x, y, w, h, label, cls = '') =>
    S.el(id, x, y, w, h, label ? `<div class="gl">${label}</div>` : '', 'em-grp ' + cls);
  const banner = (S, id, x, y, w, html, cls = '') =>
    S.el(id, x, y, w, null, html, 'em-banner ' + cls);
  const entity = (S, id, x, y, w, title, fields) => {
    const rows = fields.map((f, i) => {
      const [name, tag] = Array.isArray(f) ? f : [f, ''];
      return `<div class="ef" data-f="${i}"><span>${name}</span>${tag ? `<i>${tag}</i>` : ''}</div>`;
    }).join('');
    return S.el(id, x, y, w, null, `<div class="eh">${title}</div>${rows}`, 'em-ent');
  };
  const entHl = (S, id, indices, cls = 'hl') => {
    const el = S.$(id);
    if (!el) return;
    el.querySelectorAll('.ef').forEach(r => {
      r.classList.remove('hl', 'ok', 'bad');
      if ([].concat(indices).includes(+r.dataset.f)) r.classList.add(cls);
    });
  };

  Object.assign(SC, {
    /* ==================== 第 6 章：存取形狀與 IOPS ==================== */
    workload: {
      steps: [
        S => {
          S.box('hd', 70, 135, 530, 125, { icon: 'msg', t: '標頭與摘要（小、高頻讀取）', s: '每次開收件匣都讀寄件者、主旨、預覽與已讀狀態', row: 1, k: 'core' });
          S.box('bd', 660, 135, 550, 125, { icon: 'card', t: '正文與附件（大、通常只讀幾次）', s: '大小不一，不應在刷新列表時一併載入', row: 1, k: 'warn' });
        },
        S => {
          S.el('bar82', 70, 290, 1140, 102,
            `<div class="bt"><span>📊 郵箱存取時間分布（教材引述 QQ 郵箱效能研究）</span><b class="cy mono">82% 讀取落在最近 16 天內</b></div>
             <div class="tr"><i style="width:82%;background:linear-gradient(90deg,#0e7490,#22d3ee)"></i></div>
             <div style="font-size:13.5px;color:#9fb0c0;margin-top:6px">絕大多數操作皆侷限在「單一使用者」信箱內 → 非常適合依 user_id 分片與快取近期信件</div>`, 'em-barw');
        },
        S => {
          S.box('io', 70, 425, 540, 115, { icon: 'db', t: '磁碟 IOPS 瓶頸', s: '隨機讀寫大量零碎區塊會快速耗盡 IOPS → 需要順序寫入、快取與冷熱分層', row: 1, k: 'bad' });
          S.glow('io', 'glow-r');
        },
        S => {
          S.unglow('io');
          S.box('rec', 660, 425, 550, 115, { icon: 'check', t: '可靠性與營運需求', s: '除了快，還必須兼顧：多副本高可用、一致性、低 I/O 與容易驗證的增量備份', row: 1, k: 'ok' });
          S.glow('rec', 'glow-g');
        },
        S => {
          S.unglow('rec');
          banner(S, 'bn', 70, 565, 1140, '💡 50 萬封信的長期用戶：平時只開最近幾天（熱快取），偶爾搜三年前帳單（搜尋索引）→ 資料模型必須先反映查詢形狀！');
        }
      ]
    },

    /* ==================== 第 6 章：儲存選型權衡 ==================== */
    'choose-storage': {
      steps: [
        S => {
          S.table('cmp', 70, 130, {
            title: '四種儲存方案比較', w: 1140, size: 15,
            cols: ['儲存類型', '代表技術', '強項', '郵件場景痛點'],
            rows: [
              ['關聯式資料庫', 'MySQL / PostgreSQL', '欄位索引、成熟交易', '大量大列、全文索引與水平切分成本高'],
              ['物件儲存', 'Amazon S3', '大檔、原始郵件、備份', '無法直接做已讀篩選、對話串或關鍵字查'],
              ['寬欄 NoSQL', 'Bigtable / Cassandra', '按查詢建模、依 user 分片', '需維護多投影表與最終一致修復'],
              ['自製鍵值儲存', '特化引擎', '針對郵件 IOPS 與容量最佳化', '開發與長期維運成本極高']
            ]
          });
          S.rowcls('cmp', 0, 'hl');
        },
        S => { S.rowcls('cmp', 1, 'hl', true); },
        S => { S.rowcls('cmp', 2, 'ok', true); },
        S => { S.rowcls('cmp', 3, 'hl', true); },
        S => {
          S.rowcls('cmp', [1, 2], 'ok', true);
          banner(S, 'bn', 70, 495, 1140, '✅ <b>混合架構結論</b>：可分片主 DB（寬欄或分片關聯式）存郵件記錄 ＋ <b>物件儲存</b>存大附件 ＋ <b>Redis</b> 快取近期 ＋ <b>搜尋索引</b>！', 'ok');
        }
      ]
    },

    /* ==================== 第 6 章：表 8.3 正文與附件明細表 ==================== */
    'detail-table': {
      steps: [
        S => {
          S.box('lst', 60, 165, 250, 96, { icon: 'folder', t: '點擊列表某封信', s: '帶著 user_id ＋ email_id', row: 1, k: 'core' });
          S.box('auth', 380, 165, 250, 96, { icon: 'lock', t: '權限與分區定位', s: '必帶 user_id 並驗登入身分', row: 1, k: 'warn' });
          S.arrow('a1', 'lst@r', 'auth@l', { label: '查單封明細', color: 'cy' });
          S.pkt('lst', 'auth', { via: 'a1', color: 'cy' });
        },
        S => {
          entity(S, 'e_usr', 700, 125, 510, 'emails_by_user（表 8.3）', [
            ['(user_id, email_id)', 'PK 分區＋集群鍵'],
            ['from / to / cc', '寄件與收件者列表'],
            ['subject / body', '主旨與完整正文'],
            ['attachments', '檔名與大小清單']
          ]);
          entHl(S, 'e_usr', [0, 1, 2], 'hl');
          S.arrow('a2', 'auth@r', 'e_usr@l', { color: 'cy' });
          S.pkt('auth', 'e_usr', { via: 'a2', color: 'cy' });
        },
        S => {
          entity(S, 'e_att', 60, 355, 510, 'attachments（附件索引表）', [
            ['email_id', 'PK 分區鍵'],
            ['filename（實務補 attachment_id）', 'CK 集群鍵'],
            ['url', '物件儲存參照（下載須驗權限）']
          ]);
          entHl(S, 'e_att', [0, 1, 2], 'ok');
          S.arrow('a3', 'e_usr@b:0.25', 'e_att@t:0.75', { label: '查附件清單', color: 'gr' });
        },
        S => {
          S.box('s3', 700, 385, 510, 120, { icon: 'card', t: '物件儲存（S3）', s: '驗證使用者對該郵件有權限後才核發限時下載 URL；共用物件時授權仍以各信箱引用獨立判定', row: 1, k: 'db' });
          S.arrow('a4', 'e_att@r', 's3@l', { label: '驗權後取檔', color: 'am' });
          S.pkt('e_att', 's3', { via: 'a4', color: 'am' });
        },
        S => {
          banner(S, 'bn', 60, 560, 1150, '🔄 建立與刪除：寫入主明細表後，發送事件更新列表投影、快取與搜尋索引；明細表作為核對與修復的真實來源。', 'ok');
        }
      ]
    },

    /* ==================== 第 6 章：一個信箱一個主節點 ==================== */
    primary: {
      steps: [
        S => {
          S.box('u1', 60, 175, 220, 76, { icon: 'phone', t: '手機：標為已讀', row: 1, k: 'user' });
          S.box('u2', 60, 295, 220, 76, { icon: 'cloud', t: '電腦：刪除信件', row: 1, k: 'user' });
          S.box('pri', 410, 225, 280, 110, { icon: 'server', t: '主信箱節點（Primary）', s: '同時間只有單一寫入者<br>保證操作順序明確', row: 1, k: 'core' });
          S.arrow('w1', 'u1@r', 'pri@l:0.35', { color: 'cy' });
          S.arrow('w2', 'u2@r', 'pri@l:0.65', { color: 'cy' });
          S.pkt('u1', 'pri', { via: 'w1', color: 'cy' });
          S.pkt('u2', 'pri', { via: 'w2', color: 'cy', delay: 250 });
        },
        S => {
          S.box('rep1', 840, 145, 340, 96, { icon: 'db', t: '副本節點 1（Replica）', s: '接收複寫，故障時可接手', row: 1, k: 'db' });
          S.box('rep2', 840, 295, 340, 96, { icon: 'db', t: '副本節點 2（Replica）', s: '異地備援／唯讀分流', row: 1, k: 'db' });
          S.arrow('r1', 'pri@r:0.35', 'rep1@l', { label: '複寫', color: 'gr' });
          S.arrow('r2', 'pri@r:0.65', 'rep2@l', { label: '複寫', color: 'gr' });
          S.pkt('pri', 'rep1', { via: 'r1', color: 'gr' });
          S.pkt('pri', 'rep2', { via: 'r2', color: 'gr', delay: 200 });
        },
        S => {
          S.add('pri', 'k-bad');
          S.stamp('netp', 475, 150, '網路分區！', 'rd');
          S.box('deg', 60, 445, 530, 110, { icon: 'warn', t: '切換期間：暫停寫入（或有限唯讀）', s: '教材策略優先保住一致性，避免兩端同時寫入造成信箱分歧', row: 1, k: 'warn' });
        },
        S => {
          S.box('fen', 640, 445, 540, 110, { icon: 'lock', t: '舊主隔離（Fencing / 租約世代）', s: '必須撤銷舊主寫入資格並讓儲存層拒絕舊世代寫入，不能只看備援在線就直接升主！', row: 1, k: 'bad' });
          S.glow('fen', 'glow-r');
        },
        S => {
          S.unglow('fen');
          S.add('rep1', 'k-ok');
          S.glow('rep1', 'glow-g');
          banner(S, 'bn', 60, 580, 1120, '✅ 安全升主順序：核對複寫進度 → 撤銷舊主寫入資格 → 提升新主恢復寫入 → 舊主回來後追平並降為副本。', 'ok');
        }
      ]
    },

    /* ==================== 第 7 章：交接成功、進收件匣與寄件信譽 ==================== */
    reputation: {
      steps: [
        S => {
          S.box('s1', 60, 165, 260, 95, { icon: 'check', t: 'SMTP 回覆 250 OK', s: '只代表對方伺服器「接手」', row: 1, k: 'core' });
          S.box('s2', 410, 165, 290, 95, { icon: 'vpn', t: '收件方信譽與內容分類', s: '決定進哪一個匣', row: 1, k: 'vi' });
          S.box('b_in', 830, 115, 360, 58, { icon: 'folder', t: '📥 收件匣（Inbox）', row: 1, k: 'ok' });
          S.box('b_sp', 830, 190, 360, 58, { icon: 'warn', t: '🗑️ 垃圾郵件匣（Spam）', row: 1, k: 'warn' });
          S.box('b_qu', 830, 265, 360, 58, { icon: 'lock', t: '🚫 隔離／直接拒收', row: 1, k: 'bad' });

          S.arrow('a0', 's1@r', 's2@l', { color: 'cy' });
          S.arrow('a1', 's2@r:0.25', 'b_in@l', { color: 'gr' });
          S.arrow('a2', 's2@r:0.5', 'b_sp@l', { color: 'am' });
          S.arrow('a3', 's2@r:0.75', 'b_qu@l', { color: 'rd' });
          S.pkt('s1', 's2', { via: 'a0', color: 'cy', done: () => S.pkt('s2', 'b_in', { via: 'a1', color: 'gr' }) });
        },
        S => {
          S.box('ip', 60, 355, 360, 120, { icon: 'cloud', t: '專用 IP 與信譽養成', s: '新 IP 沒有歷史紀錄（AWS SES 參考約 2–6 週暖機）<br>用專用 IP 隔離不同寄件風險', k: 'svc' });
          S.glow('ip', 'glow');
        },
        S => {
          S.unglow('ip');
          S.box('t1', 460, 355, 340, 120, { icon: 'key', t: 'IP 群組 A：交易通知', s: '登入驗證碼、付款通知<br>獨立佇列與 IP，不被促銷信拖累', k: 'ok' });
          S.box('t2', 840, 355, 350, 120, { icon: 'msg', t: 'IP 群組 B：訂閱行銷', s: '電子報、促銷活動<br>單獨監控退訂與投訴率', k: 'warn' });
        },
        S => {
          S.glow(['t1', 't2'], 'glow-a');
          banner(S, 'bn', 60, 515, 1130, '🛡️ 維持信譽關鍵：嚴守使用者同意與退訂機制、快速封鎖濫用帳號、遇大量無效地址提早介入。', 'warn');
        },
        S => {
          S.unglow(['t1', 't2']);
          S.set('bn', '📊 觀測儀表板：將<b>拒收率、投訴率、佇列延遲</b>依「目的網域（Gmail/Outlook/Yahoo）」拆開追蹤，精準定位問題根源。');
        }
      ]
    },

    /* ==================== 第 8 章：表 8.6 郵件搜尋與網路搜尋 ==================== */
    'search-workload': {
      steps: [
        S => {
          S.box('q', 70, 130, 1140, 76, { icon: 'key', t: '郵件搜尋條件：關鍵字（主旨／正文）＋ 寄件者 ＋ 未讀 ＋ 附件 ＋ 嚴格限定「目前使用者自己的信箱」', row: 1, k: 'core' });
        },
        S => {
          S.table('t86', 70, 235, {
            title: '表 8.6｜郵件搜尋 vs 一般網路搜尋（Google 搜尋）', w: 1140, size: 15,
            cols: ['比較維度', '一般網路搜尋', '郵件搜尋'],
            rows: [
              ['搜尋範圍', '全網公開網頁', '僅限單一登入使用者有權存取的信箱'],
              ['排序方式', '以相關性（Relevance）為主', '常依時間、未讀、附件等屬性排序'],
              ['寫入 vs 查詢', '爬取批次更新、查詢極多', '每封收／發／刪都寫索引（大量小寫入、較少查詢）'],
              ['新鮮度與隱私', '允許延遲數小時～數天', '近乎即時，且絕不能搜到已刪或無權讀的信']
            ]
          });
          S.rowcls('t86', [0, 1], 'hl');
        },
        S => { S.rowcls('t86', 2, 'bad', true); },
        S => { S.rowcls('t86', 3, 'ok', true); },
        S => {
          banner(S, 'bn', 70, 535, 1140, '⏱️ 觀測指標必須拆開：<b>索引延遲（主資料變更 → 可搜到）</b> vs <b>查詢延遲（按搜尋 → 看到結果）</b>。', 'ok');
        }
      ]
    },

    /* ==================== 第 8 章：反向索引：詞如何找到郵件 ==================== */
    inverted: {
      steps: [
        S => {
          S.box('m1', 60, 155, 280, 96, { icon: 'msg', t: '郵件 A', s: '主旨：<b>租約</b>續約通知', row: 1, k: 'core' });
          S.box('m2', 60, 305, 280, 96, { icon: 'msg', t: '郵件 B', s: '正文：附上<b>租約</b> PDF 附件', row: 1, k: 'svc' });
          S.box('tok', 420, 225, 210, 105, { icon: 'gear', t: '分詞與欄位抽取', s: '主旨／正文／寄件者', row: 1, k: 'vi' });
          S.arrow('i1', 'm1@r', 'tok@l:0.35', { color: 'cy' });
          S.arrow('i2', 'm2@r', 'tok@l:0.65', { color: 'cy' });
          S.pkt('m1', 'tok', { via: 'i1', color: 'cy' });
          S.pkt('m2', 'tok', { via: 'i2', color: 'cy', delay: 200 });
        },
        S => {
          S.table('inv', 700, 145, {
            title: '反向索引（Inverted Index）', w: 520, size: 14.5,
            cols: ['詞彙（Term）', '命中的郵件 ID 與欄位'],
            rows: [
              ['租約', '郵件 A（主旨）、郵件 B（正文）'],
              ['續約', '郵件 A（主旨）'],
              ['附件', '郵件 B（正文、has_attach=true）']
            ]
          });
          S.arrow('i3', 'tok@r', 'inv@l', { label: '寫入倒排表', color: 'gr' });
          S.rowcls('inv', 0, 'ok');
          S.pkt('tok', 'inv', { via: 'i3', color: 'gr' });
        },
        S => {
          S.box('acl', 700, 395, 520, 105, { icon: 'lock', t: '帳號範圍路由 ＋ 存取權限驗證', s: '先限定 user_id，回傳前再核對是否已刪除或無權讀取', row: 1, k: 'warn' });
          S.arrow('i4', 'inv@b', 'acl@t', { label: '查「租約」→ [A, B]', color: 'am' });
          S.pkt('inv', 'acl', { via: 'i4', color: 'am' });
        },
        S => {
          S.box('res', 60, 445, 570, 110, { icon: 'folder', t: '最終搜尋結果：租約 ＋ 未讀 ＋ 有附件 → 只回傳 [郵件 B]', s: '每個帳號即使輸入相同關鍵字，也只會看到自己有權存取且符合條件的結果', row: 1, k: 'ok' });
          S.arrow('i5', 'acl@l', 'res@r', { label: '排序＋分頁', color: 'gr' });
          S.pkt('acl', 'res', { via: 'i5', color: 'gr' });
        }
      ]
    },

    /* ==================== 第 8 章：表 8.7 Elasticsearch vs 自製搜尋引擎 ==================== */
    'search-choice': {
      steps: [
        S => {
          S.table('t87', 70, 130, {
            title: '表 8.7｜Elasticsearch vs 自定義搜尋引擎（照原書五項維度）', w: 1140, size: 14.5,
            cols: ['特性', 'Elasticsearch', '自定義搜尋引擎（儲存原生整合）'],
            rows: [
              ['可擴展性', '某種程度上可擴展（獨立叢集）', '更容易針對郵件存取模式深度最佳化'],
              ['系統複雜度', '需維護兩套系統（主 DB ＋ ES）', '只有一套整合系統'],
              ['資料一致性', '兩份資料副本，持續同步困難', '只有一份主資料，同步點大幅減少'],
              ['資料遺失風險', '無（故障可由主儲存重建索引）', '無（取決於主儲存耐久性與備份）'],
              ['開發難度', '容易整合；超大規模需專責 ES 團隊', '自行開發門檻極高，工程投入巨大']
            ]
          });
          S.rowcls('t87', [0, 1], 'hl');
        },
        S => { S.rowcls('t87', 2, 'bad', true); },
        S => { S.rowcls('t87', 3, 'ok', true); },
        S => {
          S.rowcls('t87', 4, 'hl', true);
          S.box('c1', 70, 500, 540, 105, { icon: 'server', t: '中小規模 → 選 Elasticsearch', s: '快速上線、功能完整，無需重造輪子', row: 1, k: 'core' });
        },
        S => {
          S.box('c2', 670, 500, 540, 105, { icon: 'gear', t: 'Gmail / Outlook 超大規模 → 儲存原生搜尋', s: '避免維護第二份 PB 級索引副本，但需證明瓶頸與團隊能力', row: 1, k: 'vi' });
          S.glow(['c1', 'c2'], 'glow');
        }
      ]
    },

    /* ==================== 第 9 章：故障案例總整理 ==================== */
    'failure-coverage': {
      steps: [
        S => {
          S.box('f1', 70, 140, 350, 175, { icon: 'server', t: '① 節點故障', s: '• Web 伺服器：其他副本接手<br>• Worker：逾時後重新出列<br>• DB 主節點：隔離舊主再升主', k: 'bad' });
          S.glow('f1', 'glow-r');
        },
        S => {
          S.unglow('f1');
          S.box('f2', 465, 140, 350, 175, { icon: 'cloud', t: '② 網路故障', s: '• 外站不可達：指數退避重試<br>• 客戶端斷線：重連補抓差異<br>• 跨區分區：防雙主並降級', k: 'warn' });
          S.glow('f2', 'glow-a');
        },
        S => {
          S.unglow('f2');
          S.box('f3', 860, 140, 350, 175, { icon: 'queue', t: '③ 事件延遲', s: '• 通知／搜尋／快取落後<br>• 主資料獨立可讀<br>• 靠事件重放＋冪等去重追平', k: 'vi' });
          S.glow('f3', 'glow');
        },
        S => {
          S.unglow('f3');
          S.box('src', 170, 395, 940, 110, { icon: 'db', t: '復原的唯一憑據：耐久佇列 ＋ 主資料庫 ＋ 可重放事件流', s: '面試檢核四指標：遺失數 ＝ 0、重複率、恢復時間（RTO）、佇列積壓深度', row: 1, k: 'ok' });
          S.arrow('af1', 'f1@b', 'src@t:0.2', { color: 'gr' });
          S.arrow('af2', 'f2@b', 'src@t:0.5', { color: 'gr' });
          S.arrow('af3', 'f3@b', 'src@t:0.8', { color: 'gr' });
        }
      ]
    },

    /* ==================== 第 9 章：法規、隱私與郵件安全 ==================== */
    'privacy-security': {
      steps: [
        S => {
          grp(S, 'g_law', 60, 130, 560, 385, '📜 法規與資料治理', 'warn');
          S.box('r1', 90, 175, 500, 115, { icon: 'cloud', t: '資料落地與 PII 盤點', s: '主旨、正文、地址、附件皆含個人可識別資訊（PII）<br>需明確規範儲存地區、保留期與刪除範圍', row: 1, k: 'warn' });
        },
        S => {
          S.box('r2', 90, 325, 500, 155, { icon: 'lock', t: 'GDPR 與合法調取（Lawful Interception）', s: '支援資料匯出、被遺忘權刪除、跨司法管轄審核流程；由法務定義務、工程提供可控機制', row: 1, k: 'svc' });
        },
        S => {
          grp(S, 'g_sec', 660, 130, 560, 385, '🛡️ 郵件與帳號安全防線', 'core');
          S.box('s1', 690, 175, 500, 115, { icon: 'vpn', t: '釣魚防護、安全瀏覽與機密模式', s: '惡意連結掃描、主動警告橫幅、端點與帳戶異常保護', row: 1, k: 'core' });
        },
        S => {
          S.box('s2', 690, 325, 500, 155, { icon: 'key', t: '加密、最小權限與稽核留痕', s: '傳輸 TLS ＋ 靜態加密與金鑰管理；管理員敏感操作全程稽核；快取／搜尋／備份套用同等權限', row: 1, k: 'ok' });
          banner(S, 'bn', 60, 545, 1160, '✅ 安全與隱私不是事後外掛：主儲存、搜尋索引、快取與備份必須一致遵守授權與刪除政策。', 'ok');
        }
      ]
    },

    /* ==================== 第 9 章：附件去重（內容指紋 + 引用計數） ==================== */
    dedup: {
      steps: [
        S => {
          S.box('m_all', 60, 195, 250, 110, { icon: 'msg', t: '群發同一份合約', s: '寄給 1,000 位員工<br>附件 contract.pdf (5 MB)', row: 1, k: 'core' });
          S.box('hash', 385, 195, 240, 110, { icon: 'key', t: '計算內容指紋', s: 'SHA-256:<br><code>9f86d081...</code>', row: 1, k: 'vi' });
          S.arrow('d1', 'm_all@r', 'hash@l', { label: '先查是否已存在', color: 'cy' });
          S.pkt('m_all', 'hash', { via: 'd1', color: 'cy' });
        },
        S => {
          S.box('obj', 710, 195, 480, 110, { icon: 'card', t: '物件儲存只存 1 份實體（5 MB）', s: '原本 1,000 × 5 MB ＝ 5 GB → 去重後省下 <b>99.9%</b> 空間！', row: 1, k: 'ok' });
          S.arrow('d2', 'hash@r', 'obj@l', { label: '已存在 → 共用物件', color: 'gr' });
          S.pkt('hash', 'obj', { via: 'd2', color: 'gr', done: () => S.glow('obj', 'glow-g') });
        },
        S => {
          S.unglow('obj');
          S.box('ref1', 120, 385, 290, 96, { icon: 'lock', t: 'Alice 信箱引用', s: '驗證 Alice 權限 → 指向 9f86d0', row: 1, k: 'svc' });
          S.box('ref2', 495, 385, 290, 96, { icon: 'lock', t: 'Bob 信箱引用', s: '驗證 Bob 權限 → 指向 9f86d0', row: 1, k: 'svc' });
          S.box('ref3', 870, 385, 290, 96, { icon: 'warn', t: '陌生人拿指紋直連', s: '無信箱引用 → 403 拒絕存取！', row: 1, k: 'bad' });
          S.arrow('r_a', 'ref1@t', 'obj@b:0.25', { color: 'gr' });
          S.arrow('r_b', 'ref2@t', 'obj@b:0.5', { color: 'gr' });
          S.arrow('r_x', 'ref3@t', 'obj@b:0.8', { label: '✕ 拒絕', color: 'rd', dash: 1 });
        },
        S => {
          S.add('ref1', 'k-dim');
          banner(S, 'bn', 60, 525, 1130, '♻️ <b>安全回收</b>：Alice 刪信時只移除她的引用（ref_count 減 1）；等<b>所有有效引用歸零</b>且通過保留期後，才真正刪除底層物件。', 'ok');
        }
      ]
    },

    /* ==================== 第 9 章：四步心智圖總結 ==================== */
    recap: {
      steps: [
        S => {
          S.box('root', 40, 315, 175, 76, { icon: 'msg', t: '分散式 Email', k: 'core' });
          S.box('s1', 275, 130, 175, 58, { t: '① 需求與估算', k: 'svc' });
          S.el('i1', 485, 126, 725, 66, '10 億帳號 · 寄件 ~10 萬 QPS · 730 PB 正文 ＋ 1,460 PB 附件 · 可靠性／可用性／擴展性', 'em-dir hi');
          S.box('s2', 275, 240, 175, 58, { t: '② 高階設計', k: 'svc' });
          S.el('i2', 485, 236, 725, 66, 'SMTP / POP / IMAP / HTTPS · Webmail 4 支 API · 傳出／傳入佇列解耦（圖 8.5–8.7）', 'em-dir hi');
          S.arrow('c1', 'root@r', 's1@l', { color: 'cy', curve: 20 });
          S.arrow('c2', 'root@r', 's2@l', { color: 'cy', curve: 10 });
          S.arrow('c1b', 's1@r', 'i1@l', { color: 'cy', noHead: 1 });
          S.arrow('c2b', 's2@r', 'i2@l', { color: 'cy', noHead: 1 });
        },
        S => {
          S.box('s3', 275, 355, 175, 58, { t: '③ 深入設計', k: 'core' });
          S.el('i3', 485, 348, 725, 72, '寬欄分區與已讀／未讀雙投影 · 對話串標頭 · 送達率／SPF／DKIM／DMARC · ES vs LSM · 跨區容錯', 'em-dir gr');
          S.arrow('c3', 'root@r', 's3@l', { color: 'gr', curve: -10 });
          S.arrow('c3b', 's3@r', 'i3@l', { color: 'gr', noHead: 1 });
        },
        S => {
          S.box('s4', 275, 470, 175, 58, { t: '④ 總結與延伸', k: 'vi' });
          S.el('i4', 485, 466, 725, 66, '三類故障演練（節點／網路／延遲）· GDPR 與郵件安全 · 附件內容指紋去重', 'em-dir am');
          S.arrow('c4', 'root@r', 's4@l', { color: 'am', curve: -20 });
          S.arrow('c4b', 's4@r', 'i4@l', { color: 'am', noHead: 1 });
        },
        S => {
          banner(S, 'bn', 40, 560, 1170, '📚 原章末整理了 <b>30 個官方 RFC 與工程參考資料</b>，皆已收錄於右側說明紀錄與「完整講稿」供隨時查閱。');
        },
        S => {
          S.set('bn', '🚀 接下來進入實戰：<b>第 10 章期末考與模擬沙盒</b> → <b>第 11 章值班模擬挑戰</b>！');
        }
      ]
    },

    /* ==================== 第 10 章：期末考導覽 ==================== */
    exam: {
      steps: [
        S => {
          S.box('e1', 80, 165, 340, 155, { icon: 'msg', t: '12 題章末實戰測驗', s: '涵蓋容量計算、協定邊界、資料模型、送達率、搜尋與跨區容錯', k: 'core' });
          S.box('e2', 470, 165, 340, 155, { icon: 'gear', t: '辨識瓶頸與責任邊界', s: '先區分目標是吞吐量、持久化、新鮮度還是高可用', k: 'svc' });
          S.box('e3', 860, 165, 340, 155, { icon: 'check', t: '即時解說 ＋ 跳回複習', s: '答錯會定位原因並可一鍵跳回對應章節重看', k: 'ok' });
          S.arrow('ea1', 'e1@r', 'e2@l', { color: 'cy' });
          S.arrow('ea2', 'e2@r', 'e3@l', { color: 'gr' });
        },
        S => { S.glow('e2', 'glow'); },
        S => {
          S.unglow('e2'); S.glow('e3', 'glow-g');
          banner(S, 'bn', 80, 390, 1120, '🧪 旁白結束後點擊下方「<b>開啟操作台｜期末考</b>」開始作答（80 分通過，成績自動同步至課程總進度）！', 'ok');
        }
      ]
    },

    /* ==================== 第 10 章：模擬沙盒導覽 ==================== */
    sandbox: {
      steps: [
        S => {
          S.box('sb1', 70, 155, 350, 170, { icon: 'queue', t: '① 流量與投遞佇列', s: '調整寄件流量、Worker 數量與外站接收容量，分辨瓶頸在自己還是對方', k: 'core' });
          S.box('sb2', 465, 155, 350, 170, { icon: 'key', t: '② 搜尋索引追趕', s: '對照主信箱提交與搜尋索引落差，驗證刪除與可見性檢查', k: 'vi' });
          S.box('sb3', 860, 155, 350, 170, { icon: 'server', t: '③ 跨區故障演練', s: '調整複寫延遲與舊主隔離條件，觀察切換是否安全', k: 'warn' });
        },
        S => {
          S.glow(['sb1', 'sb2', 'sb3'], 'glow');
        },
        S => {
          S.unglow(['sb1', 'sb2', 'sb3']);
          banner(S, 'bn', 70, 395, 1140, '🧪 點擊下方「<b>開啟操作台｜系統模擬沙盒</b>」，一次改一個參數觀察指標因果變化！', 'warn');
        }
      ]
    },

    /* ==================== 第 11 章：最後一關值班模擬導覽 ==================== */
    operations: {
      steps: [
        S => {
          S.box('op1', 65, 155, 265, 165, { icon: 'queue', t: '班次 1：寄件尖峰', s: '調配 Worker、退避策略與硬退信分流', k: 'core' });
          S.glow('op1', 'glow');
        },
        S => {
          S.unglow('op1');
          S.box('op2', 360, 155, 265, 165, { icon: 'vpn', t: '班次 2：收件重啟', s: '驗證耐久化順序與搜尋索引事件追平', k: 'vi' });
          S.arrow('oa1', 'op1@r', 'op2@l', { color: 'cy' });
          S.glow('op2', 'glow');
        },
        S => {
          S.unglow('op2');
          S.box('op3', 655, 155, 265, 165, { icon: 'cloud', t: '班次 3：主區故障', s: '先降級、核對複寫、隔離舊主再接寫', k: 'warn' });
          S.arrow('oa2', 'op2@r', 'op3@l', { color: 'am' });
          S.glow('op3', 'glow-a');
        },
        S => {
          S.unglow('op3');
          S.box('op4', 950, 155, 265, 165, { icon: 'check', t: '營運總結與紀錄', s: '零遺失、控積壓、達標即完成全章實戰', k: 'ok' });
          S.arrow('oa3', 'op3@r', 'op4@l', { color: 'gr' });
          banner(S, 'bn', 65, 395, 1150, '🚀 點擊下方「<b>開啟操作台｜值班模擬</b>」接管十億級分散式 Email 服務！', 'ok');
        }
      ]
    }
  });
})();
