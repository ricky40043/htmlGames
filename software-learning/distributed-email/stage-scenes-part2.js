'use strict';

/*
 * 第 2 冊第 8 章專屬舞台動畫（Part 2：序章 ～ 第 5 章剩餘 8 個場景）
 * 每個步驟皆隨旁白即時進場、發光、傳送封包或展示真實 API／協定／佇列拓樸。
 */
(() => {
  const SC = (window.EMAIL_CUSTOM_SCENES = window.EMAIL_CUSTOM_SCENES || {});
  const grp = (S, id, x, y, w, h, label, cls = '') =>
    S.el(id, x, y, w, h, label ? `<div class="gl">${label}</div>` : '', 'em-grp ' + cls);
  const queueBox = (S, id, x, y, w, h, label, cls = '') =>
    S.el(id, x, y, w, h,
      `<span class="qt">${label}</span><span class="qenvs"><span class="qe"></span><span class="qe"></span><span class="qe"></span></span>`,
      'em-q ' + cls);
  const banner = (S, id, x, y, w, html, cls = '') =>
    S.el(id, x, y, w, null, html, 'em-banner ' + cls);

  Object.assign(SC, {
    /* ==================== 序章：這堂課要設計什麼？ ==================== */
    brief: {
      steps: [
        S => {
          S.box('w', 65, 195, 210, 95, { icon: 'user', t: '寄件者', s: '按下「寄送」附合約', row: 1, k: 'core' });
          S.box('svc', 415, 185, 310, 115, { icon: 'cloud', t: '分散式郵件服務', s: '先耐久保存 → 立即回應成功', row: 1, k: 'vi' });
          S.box('r', 895, 195, 290, 95, { icon: 'phone', t: '收件者／外站主機', s: '此時可能離線或暫時無回應', row: 1, k: 'warn' });
          S.arrow('a1', 'w@r', 'svc@l', { label: '提交合約信', color: 'cy' });
          S.arrow('a2', 'svc@r', 'r@l', { label: '非同步可靠交接', color: 'am', dash: 1 });
          S.pkt('w', 'svc', { via: 'a1', color: 'cy', done: () => S.glow('svc', 'glow') });
          S.stamp('off', 1020, 130, '暫時離線', 'am');
        },
        S => {
          S.unglow('svc');
          S.table('t_p', 120, 355, {
            title: '圖 8.1｜書中引述的大型郵件供應商歷史規模', w: 1040, size: 15,
            cols: ['郵件服務', '核心場景', '書中歷史參考規模'],
            rows: [
              ['Gmail', '十億級 Webmail、多裝置同步、全文搜尋', '逾 18 億活躍使用者（2020 年例）'],
              ['Outlook.com', '企業與個人信箱、ActiveSync 同步', '逾 4 億活躍使用者'],
              ['Yahoo Mail', '大型雲端郵件服務', '圖 8.1 第三個代表範例']
            ]
          });
          S.rowcls('t_p', [0, 1, 2], 'hl');
        },
        S => {
          S.hide('t_p'); S.hide('off');
          const steps = [
            ['① 釐清需求與估算', '10 億帳號、10 萬 QPS、PB 級容量'],
            ['② 高階設計', '協定、API、寄件／收件資料流'],
            ['③ 深入設計', '資料模型、送達率、搜尋、跨區'],
            ['④ 總結與演練', '故障案例、法規安全、附件去重']
          ];
          steps.forEach(([t, s], i) => {
            S.box('st' + i, 65 + i * 295, 375, 265, 112, { t, s, k: i === 2 ? 'core' : 'svc' });
            if (i > 0) S.arrow('sa' + i, 'st' + (i - 1) + '@r', 'st' + i + '@l', { color: 'cy' });
          });
          S.pkt('st0', 'st1', { via: 'sa1', color: 'cy', done: () => S.pkt('st1', 'st2', { via: 'sa2', color: 'cy', done: () => S.pkt('st2', 'st3', { via: 'sa3', color: 'cy' }) }) });
        },
        S => {
          banner(S, 'bn', 65, 535, 1150, '🎯 課程包含 <b>5 個互動實驗 ＋ 12 題期末考 ＋ 沙盒 ＋ 值班模擬</b>，用同一封信走完所有故障與取捨！', 'ok');
        }
      ]
    },

    /* ==================== 第 1 章：非功能性需求（四支柱 + 故障驗證） ==================== */
    nonfunctional: {
      steps: [
        S => {
          S.box('nf1', 65, 145, 270, 195, { icon: 'check', t: '① 可靠性', s: '回覆「已接收」之前<br>必須先<b>持久化落盤</b><br>重啟絕不遺失郵件', k: 'ok' });
          S.glow('nf1', 'glow-g');
        },
        S => {
          S.unglow('nf1');
          S.box('nf2', 360, 145, 270, 195, { icon: 'db', t: '② 可用性', s: '多節點複寫容錯<br>主信箱切換時寧可短暫唯讀<br>避免雙主腦裂', k: 'core' });
          S.glow('nf2', 'glow');
        },
        S => {
          S.unglow('nf2');
          S.box('nf3', 655, 145, 270, 195, { icon: 'server', t: '③ 擴展性', s: '帳號各自獨立 → 依 user 分片<br>寄件／附件／索引瓶頸不同<br>各層獨立水平擴容', k: 'svc' });
          S.glow('nf3', 'glow');
        },
        S => {
          S.unglow('nf3');
          S.box('nf4', 950, 145, 270, 195, { icon: 'gear', t: '④ 可擴充性', s: '新功能（分類／通知／搜尋）<br>以事件消費者掛接<br>不需改動主寄收路徑', k: 'vi' });
          S.glow('nf4', 'glow');
        },
        S => {
          S.unglow('nf4');
          grp(S, 'g_test', 65, 395, 1155, 195, '將四項非功能需求對齊到具體可驗證的故障測試', 'warn');
          const tests = [
            ['t1', '殺掉收件程序', '檢查已回 250 的信是否遺失'],
            ['t2', '關掉一台主庫', '觀察降級與切換是否保一致'],
            ['t3', '流量突然加倍', '看哪個佇列開始排隊'],
            ['t4', '新增索引消費者', '確認主路徑不需重寫']
          ];
          tests.forEach(([id, t, s], i) => {
            S.box(id, 90 + i * 282, 442, 256, 118, { icon: 'warn', t, s, k: 'warn' });
            S.arrow('at' + i, 'nf' + (i + 1) + '@b', id + '@t', { color: 'am', dash: 1 });
          });
        }
      ]
    },

    /* ==================== 第 2 章：SMTP、POP、IMAP 和 HTTPS 各管哪一段？ ==================== */
    'protocol-roles': {
      steps: [
        S => {
          grp(S, 'g_push', 60, 130, 1160, 130, '📤 寄信與跨站傳輸：SMTP（Push 推送）', 'core');
          S.box('s_cli', 95, 162, 220, 74, { icon: 'user', t: '寄件客戶端', s: '撰寫並提交郵件', row: 1, k: 'user' });
          S.box('s_a', 475, 162, 270, 74, { icon: 'server', t: '寄件方郵件伺服器', s: 'SMTP 接收與轉送', row: 1, k: 'core' });
          S.box('s_b', 905, 162, 280, 74, { icon: 'cloud', t: '收件方郵件伺服器', s: '跨網域 SMTP 交接', row: 1, k: 'svc' });
          S.arrow('p_s1', 's_cli@r', 's_a@l', { label: 'SMTP 提交', color: 'cy' });
          S.arrow('p_s2', 's_a@r', 's_b@l', { label: 'SMTP 跨站轉送', color: 'cy' });
          S.pkt('s_cli', 's_a', { via: 'p_s1', color: 'cy', done: () => S.pkt('s_a', 's_b', { via: 'p_s2', color: 'cy' }) });
        },
        S => {
          grp(S, 'g_pull', 60, 290, 1160, 305, '📥 收信與客戶端同步：依客戶端型態選擇協定', '');
          S.box('pop', 90, 330, 340, 115, { icon: 'phone', t: 'POP3（下載到本機）', s: '整封（含大附件）抓回單機<br>若刪除伺服器副本 → 其他裝置看不到', k: 'warn' });
          S.glow('pop', 'glow-a');
        },
        S => {
          S.unglow('pop');
          S.box('imap', 460, 330, 360, 115, { icon: 'folder', t: 'IMAP（伺服器為主）', s: '先載入標頭摘要，開信才抓正文／附件<br>多裝置共用資料夾與已讀狀態', k: 'ok' });
          S.arrow('cmp', 'pop@r', 'imap@l', { label: '演進', color: 'gr' });
          S.glow('imap', 'glow-g');
        },
        S => {
          S.unglow('imap');
          S.box('https', 850, 330, 340, 115, { icon: 'cloud', t: 'HTTPS Webmail', s: '瀏覽器直連 Web 伺服器 REST API<br>支援豐富標籤與搜尋（跨站仍走 SMTP）', k: 'core' });
          S.glow('https', 'glow');
        },
        S => {
          S.unglow('https');
          S.box('sync', 90, 475, 1100, 96, { icon: 'gear', t: '供應商專屬同步協定（例：Outlook + ActiveSync over HTTPS）', s: '產品設計時先確認要支援哪些客戶端（原生 App／瀏覽器／企業同步），再決定支援的協定邊界。', row: 1, k: 'vi' });
        }
      ]
    },

    /* ==================== 第 3 章：哪一層提供哪一種郵件 API？ ==================== */
    'api-context': {
      steps: [
        S => {
          S.box('c_nat', 70, 150, 290, 95, { icon: 'phone', t: '① 原生郵件客戶端', s: 'Apple Mail / Outlook / Thunderbird', row: 1, k: 'svc' });
          S.box('c_web', 70, 300, 290, 95, { icon: 'cloud', t: '② Webmail 瀏覽器', s: '互動式網頁信箱（本章重點）', row: 1, k: 'core' });
          S.box('c_rem', 70, 450, 290, 95, { icon: 'server', t: '③ 外部郵件伺服器', s: 'Gmail / Yahoo 等跨網域交接', row: 1, k: 'vi' });

          S.box('gw_m', 530, 150, 280, 95, { icon: 'server', t: 'SMTP / POP / IMAP 層', s: '標準郵件協定介面', row: 1, k: 'svc' });
          S.box('gw_w', 530, 300, 280, 95, { icon: 'gate', t: 'Web 伺服器（REST API）', s: 'HTTPS 請求／回應＋身分授權', row: 1, k: 'core' });
          S.box('gw_s', 530, 450, 280, 95, { icon: 'server', t: 'SMTP 進出閘道', s: '伺服器間郵件交換', row: 1, k: 'vi' });

          S.arrow('l1', 'c_nat@r', 'gw_m@l', { label: 'SMTP/POP/IMAP', color: 'gy' });
          S.arrow('l2', 'c_web@r', 'gw_w@l', { label: 'HTTPS REST', color: 'cy' });
          S.arrow('l3', 'c_rem@r', 'gw_s@l', { label: 'SMTP', color: 'vi' });
          S.pkt('c_web', 'gw_w', { via: 'l2', color: 'cy' });
        },
        S => {
          S.box('db_m', 940, 260, 270, 175, { icon: 'lock', t: '信箱資料層', s: '強制以登入身分驗證權限<br>絕不信任客戶端傳來的 user_id', k: 'db' });
          S.arrow('l_db', 'gw_w@r', 'db_m@l', { label: '授權檢查後存取', color: 'gr' });
          S.glow(['gw_w', 'db_m'], 'glow-g');
        },
        S => {
          S.unglow(['gw_w', 'db_m']);
          S.arrow('l_ws', 'gw_w@b', 'gw_s@t', { label: '耐久保存 → 立即回已受理', color: 'am' });
          S.pkt('gw_w', 'gw_s', { via: 'l_ws', color: 'am' });
        },
        S => {
          banner(S, 'bn', 70, 575, 1140, '📋 接下來四支核心 Webmail API：<b>POST /messages</b>（寄信）、<b>GET /folders</b>（資料夾）、<b>GET /folders/{id}/messages</b>（列表）、<b>GET /messages/{id}</b>（明細）。', 'ok');
        }
      ]
    },

    /* ==================== 第 3 章：建立郵件與列出資料夾 ==================== */
    'write-and-folders': {
      steps: [
        S => {
          S.box('req1', 60, 130, 310, 88, { icon: 'msg', t: 'POST /v1/messages', s: '撰寫表單送出寄信請求', row: 1, k: 'core' });
          S.code('c1', 420, 125, 800,
`POST /v1/messages
{
  "to": ["bob@gmail.com"],
  "cc": ["team@corp.com"],
  "bcc": ["audit@corp.com"],    // 寄出前須從其他收件者複本移除！
  "subject": "合約確認", "body": "...", "attachments": ["att_01"]
}`, { title: '端點 1：建立寄件工作', size: 14 });
          S.arrow('a_r1', 'req1@r', 'c1@l', { color: 'cy' });
          S.lines('c1', [0, 2, 3, 4]);
        },
        S => {
          S.lines('c1', [4], 'bad');
          S.box('q1', 60, 240, 310, 92, { icon: 'queue', t: '冪等寄件工作', s: '每個收件人獨立追蹤狀態<br>同請求 ID 重送不重複寄出', row: 1, k: 'vi' });
          S.arrow('a_rq', 'req1@b', 'q1@t', { color: 'vi' });
        },
        S => {
          S.box('req2', 60, 385, 310, 88, { icon: 'folder', t: 'GET /v1/folders', s: '取得登入帳號的所有資料夾', row: 1, k: 'ok' });
          S.code('c2', 420, 365, 800,
`GET /v1/folders
[
  { "id": "f_01", "name": "Inbox",   "user_id": "u_42" },
  { "id": "f_02", "name": "Sent",    "user_id": "u_42" },
  { "id": "f_03", "name": "Archive", "user_id": "u_42" }
]`, { title: '端點 2：列出資料夾（內部以 id 定位，顯示名稱可翻譯／修改）', size: 14 });
          S.arrow('a_r2', 'req2@r', 'c2@l', { color: 'gr' });
          S.lines('c2', [2, 3, 4], 'ok');
        },
        S => {
          banner(S, 'bn', 60, 560, 1160, '🏷️ RFC 6154 特殊用途信箱：<b>All、Archive、Drafts、Flagged、Junk、Sent、Trash</b>（外加 Inbox 與自訂資料夾），應以語意標記而非字面名稱辨識。');
        },
        S => {
          S.glow(['q1', 'req2'], 'glow');
          S.set('bn', '✅ 拿到 <code>folder_id</code> 後，下一個請求才用來拉取該資料夾內的郵件摘要列表。');
        }
      ]
    },

    /* ==================== 第 3 章：郵件列表、分頁與單封明細 ==================== */
    'list-and-detail': {
      steps: [
        S => {
          S.code('c_list', 60, 125, 650,
`GET /v1/folders/{folder_id}/messages?limit=50&cursor=t_50
→ 回傳 50 封輕量摘要：
  { id, from, subject, preview, is_read, timestamp }`, { title: '端點 3：列出資料夾郵件（只含摘要，秒開頁面）', size: 14.5 });
          S.table('pg', 750, 125, {
            title: '游標分頁 vs Offset 偏移量', w: 470, size: 14,
            cols: ['封數範圍', '游標位置', '新信插入時'],
            rows: [['第 1–50 封', 'cursor = t_50', '穩定不移位 ✓'], ['第 51–100 封', 'cursor = t_100', '穩定不移位 ✓'], ['第 73–87 封', '檢查點／索引', '支援指定跳頁']]
          });
          S.rowcls('pg', 0, 'hl');
        },
        S => {
          S.rowcls('pg', [0, 1], 'ok', true);
          S.glow('pg', 'glow-g');
        },
        S => {
          S.unglow('pg');
          S.rowcls('pg', 2, 'hl', true);
        },
        S => {
          S.code('c_det', 60, 345, 730,
`GET /v1/messages/{message_id}
{
  "user_id": "u_42",
  "from": { "name": "Alice", "email": "alice@ex.com" },
  "to":   [{ "name": "Bob",  "email": "bob@gmail.com" }],
  "subject": "合約確認", "body": "...", "is_read": true,
  "attachments": [{ "name": "contract.pdf", "size": 524288, "url": "https://..." }]
}`, { title: '端點 4：取得單封郵件完整明細', size: 14 });
          S.lines('c_det', [2, 3, 4, 5], 'hl');
        },
        S => {
          S.lines('c_det', [6], 'ok');
          S.box('att', 845, 395, 375, 130, { icon: 'card', t: '大附件走獨立物件服務', s: '列表中不搬附件；開信時只給經授權的下載 URL，點擊才串流傳輸', row: 1, k: 'ok' });
          S.arrow('a_att', 'c_det@r:0.78', 'att@l', { label: '授權 URL', color: 'gr' });
          S.pkt('c_det', 'att', { via: 'a_att', color: 'gr' });
        }
      ]
    },

    /* ==================== 第 4 章：連線推送、附件、快取與索引 ==================== */
    'push-and-store': {
      steps: [
        S => {
          grp(S, 'g_rt', 60, 130, 560, 215, '即時推送層（有狀態）', 'core');
          S.box('ws', 85, 172, 240, 145, { icon: 'coord', t: 'WebSocket 長連線', s: '雙向即時推送新信<br>伺服器需記住連線對照', k: 'core' });
          S.box('lp', 355, 172, 240, 145, { icon: 'clock', t: '長輪詢（備援）', s: '瀏覽器／網路不支援時退回<br>掉線後皆需支援補抓', k: 'warn' });
          S.arrow('fb', 'ws@r', 'lp@l', { label: '降級備援', color: 'am', dash: 1 });
        },
        S => {
          S.box('jm', 670, 155, 550, 165, { icon: 'server', t: '實例：Apache James / JMAP over WebSocket', s: '真實開源郵件伺服器範例：在 WebSocket 長連線上直接承載應用層郵件請求與狀態同步事件。', row: 1, k: 'vi' });
          S.arrow('a_jm', 'g_rt@r', 'jm@l', { color: 'vi' });
        },
        S => {
          grp(S, 'g_st', 60, 380, 1160, 200, '三大特化儲存與加速層', '');
          S.box('s3', 90, 420, 340, 130, { icon: 'card', t: '物件儲存（Amazon S3 類）', s: '存放大型附件<br>避開寬欄 DB blob 實務約 1 MB 限制與記憶體擠壓', k: 'db' });
          S.glow('s3', 'glow');
        },
        S => {
          S.unglow('s3');
          S.box('rd', 470, 420, 340, 130, { icon: 'cache', t: 'Redis 快取近期列表', s: '只快取近期信箱摘要（不放正文／附件）<br>快取失效可安全回主資料補齊', k: 'cache' });
          S.glow('rd', 'glow-a');
        },
        S => {
          S.unglow('rd');
          S.box('sr', 850, 420, 340, 130, { icon: 'key', t: '全文反向索引', s: '關鍵字 → 候選郵件 ID → 依帳號與已讀過濾<br>與主資料非同步追趕', k: 'vi' });
          S.glow('sr', 'glow');
        }
      ]
    },

    /* ==================== 第 5 章：同域寄送、退避與佇列觀測 ==================== */
    'in-domain': {
      steps: [
        S => {
          S.box('web', 60, 260, 200, 96, { icon: 'server', t: 'Web 入口', s: '比對寄件與收件網域', row: 1, k: 'core' });
          grp(S, 'g_loc', 350, 125, 860, 145, '✅ 同網域路徑（例：alice@ex.com → bob@ex.com）', 'ok');
          S.box('l_chk', 385, 162, 230, 82, { icon: 'vpn', t: '垃圾信與病毒檢查', row: 1, k: 'warn' });
          S.box('l_db', 675, 162, 240, 82, { icon: 'folder', t: '直寫 Sent ＋ Inbox', row: 1, k: 'ok' });
          S.box('l_api', 970, 162, 210, 82, { icon: 'cloud', t: 'REST API 取信', s: '省去外站 SMTP', row: 1, k: 'ok' });

          S.arrow('al0', 'web@t:0.6', 'l_chk@l', { label: '同網域', color: 'gr' });
          S.arrow('al1', 'l_chk@r', 'l_db@l', { color: 'gr' });
          S.arrow('al2', 'l_db@r', 'l_api@l', { color: 'gr' });
          S.pkt('web', 'l_chk', { via: 'al0', color: 'gr', done: () => S.pkt('l_chk', 'l_db', { via: 'al1', color: 'gr', done: () => S.pkt('l_db', 'l_api', { via: 'al2', color: 'gr' }) }) });
        },
        S => {
          grp(S, 'g_ext', 350, 305, 860, 165, '🌐 跨網域路徑：指數退避重試（Exponential Backoff + Jitter）', 'warn');
          S.box('ex_s', 385, 352, 200, 82, { icon: 'cloud', t: '外站暫時拒收', s: '4xx / 連線逾時', row: 1, k: 'warn' });
          S.el('bk', 630, 355, 340, 76,
            `<div style="font-size:13.5px;color:#fbbf24;font-weight:700;margin-bottom:4px">⏳ 退避間隔逐步拉長（＋隨機抖動）</div>
             <div class="mono" style="font-size:15px;color:#e6edf3">1m → 2m → 4m → 8m → 16m</div>`, 'em-barw');
          S.arrow('ae0', 'web@b:0.6', 'ex_s@l', { label: '跨網域', color: 'am' });
          S.arrow('ae1', 'ex_s@r', 'bk@l', { color: 'am' });
          S.pkt('web', 'ex_s', { via: 'ae0', color: 'am', done: () => S.pkt('ex_s', 'bk', { via: 'ae1', color: 'am' }) });
        },
        S => {
          queueBox(S, 'dlq', 1000, 360, 190, 66, '失敗佇列 DLQ', 'bad');
          S.arrow('adlq', 'bk@r', 'dlq@l', { label: '逾上限／永久錯', color: 'rd' });
          S.pkt('bk', 'dlq', { via: 'adlq', color: 'rd' });
          S.table('rec3', 60, 495, {
            title: '一封寄給 3 人：按收件人獨立追蹤，只重試 Bob！', w: 640, size: 13.5,
            cols: ['收件人', '結果', '後續動作'],
            rows: [['Alice', '250 OK ✓', '已完成'], ['Bob', '421 忙碌 ⏳', '指數退避重試'], ['Invalid', '550 不存在 ✗', '停送並回報']]
          });
          S.rowcls('rec3', 0, 'ok'); S.rowcls('rec3', 1, 'hl'); S.rowcls('rec3', 2, 'bad');
        },
        S => {
          S.box('met', 735, 495, 475, 118, { icon: 'gear', t: '📊 傳出佇列觀測（按目的網域分組）', s: '• 單一供應商延遲 → 對方塞車（加 Worker 沒用！）<br>• 全部網域都積壓 → 自己消費力不足（才水平加 Worker）', k: 'core' });
          S.glow('met', 'glow');
        },
        S => {
          S.unglow('met');
          S.glow('bk', 'glow-a');
        }
      ]
    }
  });
})();
