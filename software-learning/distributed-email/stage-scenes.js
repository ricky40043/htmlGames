'use strict';

/*
 * 第 2 冊第 8 章「分散式 Email 服務」專屬舞台動畫模組（仿照第 7 章飯店預訂系統做法）。
 *
 * 所有架構圖均忠實還原《System Design Interview Vol. 2》第 8 章原書圖示（圖 8.3–8.12）
 * 與核心概念演繹，隨旁白步驟逐步展開節點、高亮、封包傳輸與狀態轉換，不再使用統一九宮格模板。
 *
 * 介面約定：
 *   window.EMAIL_CUSTOM_SCENES[sceneId] = {
 *     steps: [ (S) => void, ... ]   // 對應 entry.steps[0..k]
 *   }
 * 切換場景或跳步驟時，播放器會像第 7 章一樣以 instant 模式重放 0..k-1，再以正常動畫執行第 k 步。
 */
(() => {
  const CSS_CUSTOM = `
    .em-grp{border:1.8px dashed #355068;border-radius:12px;background:rgba(12,20,30,.58)}
    .em-grp .gl{position:absolute;top:-12px;left:16px;background:#0c141e;padding:0 10px;font-size:13.5px;color:#9fb0c0;font-weight:600;letter-spacing:.4px}
    .em-grp.core{border-color:rgba(34,211,238,.6);background:rgba(12,32,44,.42)}
    .em-grp.core .gl{color:#22d3ee}
    .em-grp.warn{border-color:rgba(251,191,36,.6);background:rgba(38,28,10,.35)}
    .em-grp.warn .gl{color:#fbbf24}
    .em-grp.bad{border-color:rgba(248,113,113,.65);background:rgba(46,14,16,.38)}
    .em-grp.bad .gl{color:#f87171}
    .em-q{border:1.6px solid #2b6b80;border-radius:26px;background:linear-gradient(90deg,#112434,#0e1b28);display:flex;align-items:center;justify-content:space-between;padding:0 14px;gap:6px}
    .em-q .qt{font-size:14.5px;font-weight:700;color:#e6edf3;white-space:nowrap}
    .em-q .qenvs{display:flex;gap:5px}
    .em-q .qe{width:24px;height:17px;border:1.4px solid #22d3ee;border-radius:3px;position:relative;background:#0a1520}
    .em-q .qe::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent 46%,#22d3ee 48%,#22d3ee 52%,transparent 54%),linear-gradient(225deg,transparent 46%,#22d3ee 48%,#22d3ee 52%,transparent 54%)}
    .em-q.warn{border-color:#fbbf24}.em-q.warn .qe{border-color:#fbbf24}.em-q.warn .qe::after{background:linear-gradient(135deg,transparent 46%,#fbbf24 48%,#fbbf24 52%,transparent 54%),linear-gradient(225deg,transparent 46%,#fbbf24 48%,#fbbf24 52%,transparent 54%)}
    .em-q.bad{border-color:#f87171}.em-q.bad .qe{border-color:#f87171}.em-q.bad .qe::after{background:linear-gradient(135deg,transparent 46%,#f87171 48%,#f87171 52%,transparent 54%),linear-gradient(225deg,transparent 46%,#f87171 48%,#f87171 52%,transparent 54%)}
    .em-q.vi{border-color:#a78bfa}.em-q.vi .qe{border-color:#a78bfa}.em-q.vi .qe::after{background:linear-gradient(135deg,transparent 46%,#a78bfa 48%,#a78bfa 52%,transparent 54%),linear-gradient(225deg,transparent 46%,#a78bfa 48%,#a78bfa 52%,transparent 54%)}
    .em-dir{border:1.6px solid #2d4a63;border-radius:8px;background:#122232;display:flex;align-items:center;gap:8px;padding:6px 12px;font-family:var(--mono);font-size:14px;font-weight:700;color:#e6edf3}
    .em-dir.hi{border-color:#22d3ee;background:#123044;color:#fff}
    .em-dir.am{border-color:#fbbf24;background:#2e240e;color:#fde68a}
    .em-dir.gr{border-color:#34d399;background:#113125;color:#a7f3d0}
    .em-ent{border:1.5px solid #2d4a63;border-radius:9px;background:rgba(10,17,25,.96);font-family:var(--mono);font-size:13px;overflow:hidden}
    .em-ent .eh{background:#13283a;color:#e6edf3;font-weight:700;text-align:center;padding:5px 8px;border-bottom:1px solid #2d4a63;font-size:14px}
    .em-ent .ef{padding:3px 10px;display:flex;align-items:center;gap:6px;color:#cbd5e1;border-bottom:1px solid #152230}
    .em-ent .ef:last-child{border-bottom:0}
    .em-ent .ef i{margin-left:auto;font-style:normal;font-size:11px;color:#fbbf24;font-weight:600}
    .em-ent .ef.hl{background:rgba(34,211,238,.18);color:#fff}
    .em-ent .ef.ok{background:rgba(52,211,153,.18);color:#a7f3d0}
    .em-ent .ef.bad{background:rgba(248,113,113,.2);color:#fecaca;text-decoration:line-through}
    .em-banner{border:1.5px solid #22d3ee;border-radius:10px;background:rgba(12,28,40,.92);padding:10px 18px;font-size:16px;line-height:1.5;text-align:center;color:#e6edf3}
    .em-banner.warn{border-color:#fbbf24;background:rgba(44,32,10,.9)}
    .em-banner.ok{border-color:#34d399;background:rgba(12,44,32,.9)}
    .em-lsm-row{border:1.5px solid #2d4a63;border-radius:9px;background:rgba(13,22,32,.92);display:flex;align-items:center;padding:0 14px;gap:14px}
    .em-lsm-row.mem{border-color:#f87171;background:rgba(125,24,32,.55)}
    .em-lsm-lbl{width:136px;flex:0 0 auto;font-size:14px;font-weight:700;color:#e6edf3;line-height:1.3}
    .em-lsm-lbl small{display:block;font-size:12px;color:#9fb0c0;font-weight:500}
    .em-lsm-row.mem .em-lsm-lbl small{color:#fecaca}
    .em-lsm-blocks{flex:1;display:flex;align-items:center;justify-content:space-evenly;gap:8px}
    .em-cyl{height:36px;border:1.6px solid #60a5fa;border-radius:8px/5px;background:linear-gradient(180deg,#1a334d,#102030);position:relative;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;color:#cbd5e1}
    .em-lsm-row.mem .em-cyl{border-color:#fca5a5;background:linear-gradient(180deg,#7f1d1d,#450a0a);color:#fff}
    .em-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#0e7490;border:1.5px solid #22d3ee;color:#fff;font-family:var(--mono);font-size:12.5px;font-weight:700}
    .em-hdr-card{border:1.5px solid #2d4a63;border-radius:10px;background:#0a1118;overflow:hidden;font-family:var(--mono);font-size:14px}
    .em-hdr-card .hh{background:#132030;padding:8px 14px;font-family:var(--sans);font-weight:700;color:#22d3ee;border-bottom:1px solid #22303f;display:flex;justify-content:space-between}
    .em-hdr-card .hr{display:grid;grid-template-columns:130px 1fr;padding:7px 14px;border-bottom:1px solid #16222f;transition:background .35s}
    .em-hdr-card .hr:last-child{border-bottom:0}
    .em-hdr-card .hr .hk{color:#9fb0c0;font-weight:600}
    .em-hdr-card .hr.hl{background:rgba(34,211,238,.16)}
    .em-hdr-card .hr.ok{background:rgba(52,211,153,.14)}
    .em-pass{display:inline-block;padding:1px 8px;border-radius:12px;background:#123a2c;border:1px solid #34d399;color:#34d399;font-weight:700;font-size:12px;margin-right:8px}
    .em-barw{background:#121e2b;border:1px solid #22303f;border-radius:8px;padding:10px 14px}
    .em-barw .bt{display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px}
    .em-barw .tr{height:16px;background:#091018;border-radius:8px;overflow:hidden}
    .em-barw .tr i{display:block;height:100%;border-radius:8px;transition:width .9s ease}
  `;

  if (!document.getElementById('emailCustomSceneCss')) {
    const st = document.createElement('style');
    st.id = 'emailCustomSceneCss';
    st.textContent = CSS_CUSTOM;
    document.head.appendChild(st);
  }

  // 共用小幫手
  function grp(S, id, x, y, w, h, label, cls = '') {
    return S.el(id, x, y, w, h, label ? `<div class="gl">${label}</div>` : '', 'em-grp ' + cls);
  }
  function queueBox(S, id, x, y, w, h, label, cls = '') {
    return S.el(id, x, y, w, h,
      `<span class="qt">${label}</span><span class="qenvs"><span class="qe"></span><span class="qe"></span><span class="qe"></span></span>`,
      'em-q ' + cls);
  }
  function banner(S, id, x, y, w, html, cls = '') {
    return S.el(id, x, y, w, null, html, 'em-banner ' + cls);
  }
  function entity(S, id, x, y, w, title, fields) {
    const rows = fields.map((f, i) => {
      const [name, tag] = Array.isArray(f) ? f : [f, ''];
      return `<div class="ef" data-f="${i}"><span>${name}</span>${tag ? `<i>${tag}</i>` : ''}</div>`;
    }).join('');
    return S.el(id, x, y, w, null, `<div class="eh">${title}</div>${rows}`, 'em-ent');
  }
  function entHl(S, id, indices, cls = 'hl') {
    const el = S.$(id);
    if (!el) return;
    el.querySelectorAll('.ef').forEach(r => {
      r.classList.remove('hl', 'ok', 'bad');
      if ([].concat(indices).includes(+r.dataset.f)) r.classList.add(cls);
    });
  }
  function drawStorageLayer(S, x, y, w, h, prefix = 'st') {
    grp(S, prefix + '_grp', x, y, w, h, '儲存層', '');
    const items = [
      [prefix + '_meta', '詮釋資料', 'Metadata 資料庫', 'db'],
      [prefix + '_search', '搜尋儲存資料', '全文反向索引', 'db'],
      [prefix + '_obj', '附件', '物件儲存系統', 'card'],
      [prefix + '_cache', '最新 Email', '分散式快取', 'cache']
    ];
    const gap = 16;
    const bw = Math.floor((w - 28 - gap * 3) / 4);
    items.forEach(([id, t, s, icon], i) => {
      S.box(id, x + 14 + i * (bw + gap), y + 20, bw, h - 30, { icon, t, s, k: icon === 'cache' ? 'cache' : 'db' });
    });
  }

  window.EMAIL_CUSTOM_SCENES = {
    /* ==================== 第 1 章：面試問答（對話泡泡） ==================== */
    requirements: {
      steps: [
        S => {
          S.chat('ch', 60, 118, 690, 490);
          S.bub('ch', 'c', '應試者', '請問這個 Email 服務預計有多少使用者？登入驗證需要一起設計嗎？');
          S.after(450, () => S.bub('ch', 'i', '面試官', '大約 <b>10 億個活躍帳號</b>。身份驗證沿用既有服務，設計時先聚焦郵件本身。'));
          S.box('s1', 800, 128, 420, 92, { icon: 'users', t: '規模：10 億個帳號', s: '登入交給既有服務，請求帶驗證後身份', row: 1, k: 'core' });
        },
        S => {
          S.bub('ch', 'c', '應試者', '核心需要支援哪些操作？例如寄信、收信、資料夾與已讀／未讀狀態？');
          S.after(400, () => S.bub('ch', 'i', '面試官', '都要！包含寄信、收信、列出資料夾與郵件、開信，以及已讀／未讀篩選。'));
          S.box('s2', 800, 236, 420, 92, { icon: 'folder', t: '收發、資料夾與狀態', s: '寄信／收信／列表／已讀未讀／跨裝置', row: 1, k: 'svc' });
        },
        S => {
          S.bub('ch', 'c', '應試者', '需要支援全文搜尋、附件、反垃圾郵件與防毒掃描嗎？');
          S.after(400, () => S.bub('ch', 'i', '面試官', '需要：依主旨／寄件者／正文搜尋，支援附件與垃圾信／病毒保護。'));
          S.box('s3', 800, 344, 420, 92, { icon: 'vpn', t: '搜尋、附件與郵件保護', s: '各自有獨立處理路徑，不卡住主流程', row: 1, k: 'vi' });
        },
        S => {
          S.bub('ch', 'c', '應試者', '主要客戶端是 Webmail 嗎？跨網域投遞還是走 SMTP？');
          S.after(400, () => S.bub('ch', 'i', '面試官', '對，前端以 Webmail（HTTPS）為主；跨網域伺服器交接沿用 SMTP。'));
          S.box('s4', 800, 452, 420, 92, { icon: 'cloud', t: 'Webmail (HTTPS) + SMTP', s: '瀏覽器走 REST API，伺服器間走 SMTP', row: 1, k: 'ok' });
        },
        S => {
          S.glow(['s1', 's2', 's3', 's4'], 'glow');
          banner(S, 'bn', 60, 565, 1160, '💡 先把「列最新信、開單封、搜舊信、大附件」的頻率與延遲分開，後面才不會全部硬塞同一張表。', 'ok');
        }
      ]
    },

    /* ==================== 第 1 章：容量試算（動態計算條） ==================== */
    estimate: {
      steps: [
        S => {
          S.box('u', 70, 125, 290, 95, { icon: 'users', t: '10 億活躍帳號', s: '每人每日寄 10 封／收 40 封', row: 1, k: 'core' });
          S.el('b1', 410, 125, 800, 95,
            `<div class="bt"><span>📤 寄件 QPS ＝ 10 億 × 10 ÷ 86,400 秒</span><b class="cy mono" id="c_qps">0 / 秒</b></div>
             <div class="tr"><i style="width:72%;background:linear-gradient(90deg,#0e7490,#22d3ee)"></i></div>
             <div style="font-size:13px;color:#9fb0c0;margin-top:6px">書中粗估以 10⁵ 秒計 ≈ 100,000 QPS；精算為 115,741 QPS（同一量級）</div>`, 'em-barw');
          S.count('c_qps', 115741, { post: ' / 秒' });
        },
        S => {
          S.el('b2', 70, 245, 1140, 95,
            `<div class="bt"><span>✉️ 年度非附件資料（主旨／標頭／正文）＝ 10 億 × 40 × 365 × 50 KB</span><b class="am mono" id="c_body">0 PB / 年</b></div>
             <div class="tr"><i style="width:50%;background:linear-gradient(90deg,#b45309,#fbbf24)"></i></div>
             <div style="font-size:13px;color:#9fb0c0;margin-top:6px">每年 14.6 兆封入站郵件 × 平均 50 KB ＝ 730 PB（十進位單位）</div>`, 'em-barw');
          S.count('c_body', 730, { post: ' PB / 年' });
        },
        S => {
          S.el('b3', 70, 360, 1140, 95,
            `<div class="bt"><span>📎 年度附件資料（20% 含附件）＝ 10 億 × 40 × 365 × 20% × 500 KB</span><b class="rd mono" id="c_att">0 PB / 年</b></div>
             <div class="tr"><i style="width:98%;background:linear-gradient(90deg,#b91c1c,#f87171)"></i></div>
             <div style="font-size:13px;color:#9fb0c0;margin-top:6px">附件體積是非附件資料的 <b>2 倍</b> → 必須把附件拆到物件儲存（S3），不能塞進郵件 DB！</div>`, 'em-barw');
          S.count('c_att', 1460, { post: ' PB / 年' });
        },
        S => {
          S.box('k1', 70, 480, 270, 88, { icon: 'db', t: '多副本 × 3', s: '高可用與容災倍增容量', row: 1, k: 'db' });
          S.box('k2', 360, 480, 270, 88, { icon: 'key', t: '全文索引與快取', s: '額外衍生儲存空間', row: 1, k: 'vi' });
          S.box('k3', 650, 480, 270, 88, { icon: 'clock', t: '尖峰係數校正', s: '不能用平均 QPS 估硬體', row: 1, k: 'warn' });
          S.box('k4', 940, 480, 270, 88, { icon: 'gear', t: '壓縮與去重', s: '後續第 9 章可省下大量空間', row: 1, k: 'ok' });
        },
        S => {
          S.glow(['b2', 'b3'], 'glow-a');
          banner(S, 'bn', 70, 582, 1140, '🧪 點下方「開啟操作台」改改保留期（90 天 vs 1 年）與副本數，觀察 QPS 不變但儲存量如何暴增。', 'warn');
        }
      ]
    },

    /* ==================== 第 2 章：DNS MX 查詢（圖 8.2） ==================== */
    mx: {
      steps: [
        S => {
          S.box('snd', 60, 145, 220, 96, { icon: 'server', t: '寄件 SMTP 伺服器', s: '取出 @example.net', k: 'core' });
          S.box('dns', 350, 145, 200, 96, { icon: 'key', t: 'DNS 伺服器', s: '查詢 MX 紀錄', k: 'vi' });
          S.arrow('a_dns', 'snd@r', 'dns@l', { label: 'set q=mx', color: 'cy' });
          S.pkt('snd', 'dns', { via: 'a_dns', color: 'cy' });
          S.code('cmd', 60, 290, 500,
`$ nslookup
> set q=mx
> example.net
example.net  MX  5   mx1.example.net.
example.net  MX  10  mx2.example.net.
example.net  MX  20  mx3.example.net.
example.net  MX  30  mx4.example.net.
example.net  MX  40  mx5.example.net.`, { title: '圖 8.2｜DNS MX 查詢結果（偏好值越小越優先）', size: 15 });
          S.lines('cmd', [0, 1, 2]);
        },
        S => {
          S.lines('cmd', [3], 'ok');
          S.box('mx1', 660, 130, 250, 72, { icon: 'cloud', t: 'mx1.example.net', s: '偏好值 5（最高優先）', row: 1, k: 'ok' });
          S.box('mx2', 660, 220, 250, 72, { icon: 'server', t: 'mx2.example.net', s: '偏好值 10（第 1 備援）', row: 1, k: 'svc' });
          S.box('mx3', 660, 310, 250, 72, { icon: 'server', t: 'mx3–mx5', s: '偏好值 20 / 30 / 40', row: 1, k: 'note' });
          S.arrow('a_m1', 'dns@r', 'mx1@l', { label: '① 先連偏好值 5', color: 'gr' });
          S.pkt('dns', 'mx1', { via: 'a_m1', color: 'gr' });
        },
        S => {
          S.add('mx1', 'k-bad');
          S.stamp('st1', 935, 145, '連線失敗 ✗', 'rd');
          S.lines('cmd', [4], 'hl');
          S.arrow('a_m2', 'dns@r', 'mx2@l', { label: '② 自動改試偏好值 10', color: 'am' });
          S.pkt('dns', 'mx2', { via: 'a_m2', color: 'am', done: () => S.glow('mx2', 'glow-g') });
        },
        S => {
          S.add('mx2', 'k-bad');
          S.add('mx3', 'k-bad');
          queueBox(S, 'rq', 660, 440, 520, 68, '耐久重試佇列（指數退避）', 'warn');
          S.arrow('a_rq', 'mx3@b', 'rq@t', { label: '全部暫時不可達 → 排程重試', color: 'am' });
          S.pkt('mx3', 'rq', { via: 'a_rq', color: 'am' });
        },
        S => {
          banner(S, 'bn', 60, 555, 1140, '⚠️ 區分「網路暫時連不上（換下一個 MX / 重試）」與「對方明確回覆 550 地址不存在（永久失敗，不要重試）」。', 'warn');
        }
      ]
    },

    /* ==================== 第 2 章：MIME 結構 ==================== */
    mime: {
      steps: [
        S => {
          grp(S, 'env', 60, 125, 560, 440, 'MIME 複合郵件封包（multipart/mixed）', 'core');
          S.box('p_hdr', 90, 165, 500, 66, { icon: 'msg', t: '標頭：boundary="mail-part"', s: '宣告內容型別與各段落分隔邊界', row: 1, k: 'svc' });
          S.box('p_txt', 90, 250, 500, 88, { icon: 'msg', t: '段落 1：text/plain; charset=UTF-8', s: '「附上本期合約，請查收。」', row: 1, k: 'ok' });
          S.box('p_att', 90, 358, 500, 88, { icon: 'card', t: '段落 2：application/pdf（二進位附件）', s: 'PDF、相片或文件原始位元組', row: 1, k: 'warn' });
        },
        S => {
          S.box('b64', 690, 180, 520, 125, { icon: 'gear', t: 'Base64 編碼轉換', s: '每 3 個原始位元組 → 變成 4 個 ASCII 字元（體積膨脹約 +33%）', row: 1, k: 'vi' });
          S.arrow('a_b64', 'p_att@r', 'b64@l', { label: '編碼為純文字傳輸', color: 'am' });
          S.pkt('p_att', 'b64', { via: 'a_b64', color: 'am' });
        },
        S => {
          S.code('mc', 690, 330, 520,
`Content-Type: multipart/mixed; boundary="mail-part"
--mail-part
Content-Type: text/plain; charset=UTF-8
附上本期合約，請查收。
--mail-part
Content-Type: application/pdf
Content-Transfer-Encoding: base64
JVBERi0xLjQK...
--mail-part--`, { title: '實際傳輸的 MIME 內容', size: 13.5 });
          S.lines('mc', [0, 1, 4, 8]);
        },
        S => {
          S.box('lim', 90, 466, 500, 76, { icon: 'lock', t: '附件大小上限（可配置規則）', s: '書中歷史例：Outlook 20 MB / Gmail 25 MB', row: 1, k: 'warn' });
          S.glow('lim', 'glow-a');
        },
        S => {
          banner(S, 'bn', 60, 588, 1150, '📌 寄件入口先檢查大小 → 大附件存物件儲存保留引用 → 跨站送出時再依 MIME 結構組裝輸出。', 'ok');
        }
      ]
    },

    /* ==================== 第 2 章：圖 8.3 傳統郵件伺服器（100% 照原書） ==================== */
    'classic-flow': {
      steps: [
        S => {
          // 完全照原書圖 8.3 左右對稱結構
          S.box('alice', 210, 110, 210, 62, { icon: 'user', t: '使用者 Alice', s: 'alice@outlook.com', row: 1, k: 'user' });
          S.box('c_out', 210, 200, 210, 64, { icon: 'msg', t: 'Outlook 客戶端', s: 'SMTP 提交', row: 1, k: 'core' });
          S.arrow('a_ac', 'alice@b', 'c_out@t', { color: 'cy' });

          grp(S, 'g_out', 70, 320, 440, 275, 'outlook.com 郵件伺服器', '');
          S.box('out_imap', 95, 355, 175, 76, { icon: 'folder', t: 'IMAP/POP', s: '伺服器', k: 'svc' });
          S.box('out_smtp', 310, 355, 175, 76, { icon: 'server', t: 'SMTP', s: '伺服器', k: 'core' });
          S.box('out_db', 195, 490, 190, 78, { icon: 'db', t: '儲存系統', s: '本機信箱', row: 1, k: 'db' });
          S.arrow('a_o_get', 'out_imap@b', 'out_db@t:0.3', { label: '取得', color: 'gy', dash: 1 });
          S.arrow('a_o_sav', 'out_smtp@b', 'out_db@t:0.7', { label: '保存', color: 'gy', dash: 1 });

          S.arrow('a_s1', 'c_out@b:0.7', 'out_smtp@t', { label: '① 發送 (SMTP)', color: 'cy' });
          S.pkt('c_out', 'out_smtp', { via: 'a_s1', color: 'cy' });
        },
        S => {
          // 右側 Gmail 群組與中間 DNS（書中註記：圖中未顯示，以虛線輔助框呈現）
          S.box('dns', 560, 210, 160, 70, { icon: 'key', t: 'DNS (MX)', s: '查 gmail.com', k: 'note' });
          S.arrow('a_dns', 'out_smtp@t:0.8', 'dns@b', { label: '查詢 MX', color: 'am', dash: 1 });
          S.pkt('out_smtp', 'dns', { via: 'a_dns', color: 'am' });

          grp(S, 'g_gm', 770, 320, 440, 275, 'gmail.com 郵件伺服器', '');
          S.box('gm_smtp', 795, 355, 175, 76, { icon: 'server', t: 'SMTP', s: '伺服器', k: 'core' });
          S.box('gm_imap', 1010, 355, 175, 76, { icon: 'folder', t: 'IMAP/POP', s: '伺服器', k: 'svc' });
          S.box('gm_db', 895, 490, 190, 78, { icon: 'db', t: '儲存系統', s: '本機信箱', row: 1, k: 'db' });
        },
        S => {
          S.arrow('a_s2', 'out_smtp@r', 'gm_smtp@l', { label: '② 發送 (SMTP)', color: 'cy' });
          S.pkt('out_smtp', 'gm_smtp', { via: 'a_s2', color: 'cy', done: () => S.glow('gm_smtp', 'glow') });
          S.loop(['a_s2'], { color: 'cy', every: 2400, delay: 1400 });
        },
        S => {
          S.arrow('a_s3', 'gm_smtp@b', 'gm_db@t:0.3', { label: '③ 保存', color: 'gr' });
          S.pkt('gm_smtp', 'gm_db', { via: 'a_s3', color: 'gr', done: () => S.glow('gm_db', 'glow-g') });
        },
        S => {
          S.box('bob', 860, 110, 210, 62, { icon: 'user', t: '使用者 Bob', s: 'bob@gmail.com', row: 1, k: 'user' });
          S.box('c_gm', 860, 200, 210, 64, { icon: 'msg', t: 'Gmail 客戶端', s: 'IMAP / POP 取信', row: 1, k: 'ok' });
          S.arrow('a_g_get', 'gm_db@t:0.7', 'gm_imap@b', { label: '取得', color: 'gr' });
          S.arrow('a_s4', 'gm_imap@t', 'c_gm@b:0.7', { label: '④ 取得 (IMAP/POP)', color: 'gr' });
          S.arrow('a_cb', 'c_gm@t', 'bob@b', { color: 'gr' });
          S.pkt('gm_db', 'gm_imap', { via: 'a_g_get', color: 'gr', done: () => S.pkt('gm_imap', 'c_gm', { via: 'a_s4', color: 'gr' }) });
        }
      ]
    },

    /* ==================== 第 2 章：圖 8.4 Maildir 郵件目錄（100% 照原書樹狀結構） ==================== */
    maildir: {
      steps: [
        S => {
          // 照原書圖 8.4 階層樹：home → home → user1/user2 → Maildir → cur/new/tmp
          S.el('d_root', 90, 125, 115, 42, '📁 home', 'em-dir');
          S.el('d_home', 225, 175, 115, 42, '📁 home', 'em-dir');
          S.el('d_u1', 375, 225, 125, 42, '📁 user1', 'em-dir hi');
          S.el('d_m1', 530, 275, 130, 42, '📁 Maildir', 'em-dir hi');
          S.el('d_u2', 375, 425, 125, 42, '📁 user2', 'em-dir');
          S.el('d_m2', 530, 475, 130, 42, '📁 Maildir', 'em-dir');

          S.arrow('e_rh', 'd_root@b:0.35', 'd_home@l', { elbow: 'vh', color: 'gy', noHead: 1 });
          S.arrow('e_hu1', 'd_home@b:0.35', 'd_u1@l', { elbow: 'vh', color: 'cy', noHead: 1 });
          S.arrow('e_hu2', 'd_home@b:0.35', 'd_u2@l', { elbow: 'vh', color: 'gy', noHead: 1 });
          S.arrow('e_u1m', 'd_u1@b:0.35', 'd_m1@l', { elbow: 'vh', color: 'cy', noHead: 1 });
          S.arrow('e_u2m', 'd_u2@b:0.35', 'd_m2@l', { elbow: 'vh', color: 'gy', noHead: 1 });
        },
        S => {
          S.el('d1_cur', 710, 225, 145, 40, '📁 cur（已處理）', 'em-dir gr');
          S.el('d1_new', 710, 277, 145, 40, '📁 new（新信）', 'em-dir hi');
          S.el('d1_tmp', 710, 329, 145, 40, '📁 tmp（暫存）', 'em-dir am');

          S.el('d2_cur', 710, 425, 110, 38, '📁 cur', 'em-dir');
          S.el('d2_new', 710, 475, 110, 38, '📁 new', 'em-dir');
          S.el('d2_tmp', 710, 525, 110, 38, '📁 tmp', 'em-dir');

          ['d1_cur', 'd1_new', 'd1_tmp'].forEach((id, i) => S.arrow('e1_' + i, 'd_m1@b:0.35', id + '@l', { elbow: 'vh', color: 'cy', noHead: 1 }));
          ['d2_cur', 'd2_new', 'd2_tmp'].forEach((id, i) => S.arrow('e2_' + i, 'd_m2@b:0.35', id + '@l', { elbow: 'vh', color: 'gy', noHead: 1 }));

          // 右側演繹 tmp → new → cur 檔案搬移
          S.box('mv', 910, 225, 310, 144, { icon: 'msg', t: '單封郵件生命週期', s: '1. 先寫入 <b>tmp</b>（避免讀到半成品）<br>2. 寫完搬進 <b>new</b><br>3. 客戶端讀取後移至 <b>cur</b>', k: 'core' });
          S.arrow('a_tn', 'd1_tmp@r', 'd1_new@r', { curve: 26, color: 'am' });
          S.arrow('a_nc', 'd1_new@r', 'd1_cur@r', { curve: 26, color: 'gr' });
          S.pkt('d1_tmp', 'd1_new', { via: 'a_tn', color: 'am', done: () => S.pkt('d1_new', 'd1_cur', { via: 'a_nc', color: 'gr' }) });
        },
        S => {
          S.box('lim', 910, 400, 310, 165, { icon: 'warn', t: '單機 Maildir 極限', s: '• 數十億小檔案 → 磁碟 I/O 瓶頸<br>• 檢索與備份極度困難<br>• 單機磁碟損毀即掉信（無高可用）', k: 'bad' });
          S.glow('lim', 'glow-r');
        },
        S => {
          S.box('evo', 70, 588, 1150, 56, { t: '從純文字發展到多媒體、對話串、標籤與全文搜尋 → 傳統單機架構已無法支撐十億級規模', k: 'warn' });
        },
        S => {
          S.hide('evo');
          banner(S, 'bn', 70, 582, 1150, '✅ 演進策略：保留清楚的責任邊界，將信箱、附件、索引與快取移往可分片、可複寫的<b>分散式儲存層</b>。', 'ok');
        }
      ]
    },

    /* ==================== 第 4 章：圖 8.5 高階設計（100% 照原書三層結構） ==================== */
    overview: {
      steps: [
        S => {
          // 頂層 Webmail + 中層雙伺服器
          S.box('webmail', 500, 118, 280, 74, { icon: 'cloud', t: 'Webmail', s: '瀏覽器客戶端（Edge / Chrome / Safari）', row: 1, k: 'core' });
          S.box('web_srv', 310, 268, 240, 74, { icon: 'server', t: 'Web 伺服器', s: '請求／回應（API）', row: 1, k: 'svc' });
          S.box('rt_srv', 730, 268, 240, 74, { icon: 'coord', t: '即時伺服器', s: '有狀態長連線推送', row: 1, k: 'vi' });

          S.arrow('a_https', 'webmail@b:0.32', 'web_srv@t', { label: 'https', color: 'cy' });
          S.arrow('a_ws', 'webmail@b:0.68', 'rt_srv@t', { label: 'WebSocket', color: 'vi' });
          S.pkt('webmail', 'web_srv', { via: 'a_https', color: 'cy' });
          S.pkt('webmail', 'rt_srv', { via: 'a_ws', color: 'vi', delay: 250 });
        },
        S => {
          // 下方完整儲存層（照原書圖 8.5 順序：詮釋資料、附件儲存系統、分散式快取、搜尋儲存系統）
          grp(S, 'st_grp', 140, 415, 1000, 165, '儲存層', '');
          S.box('st_meta', 165, 445, 220, 112, { icon: 'db', t: '詮釋資料資料庫', s: 'Metadata / 正文 / 標頭', k: 'db' });
          S.box('st_att', 405, 445, 220, 112, { icon: 'card', t: '附件儲存系統', s: 'S3 類物件儲存', k: 'db' });
          S.box('st_cache', 645, 445, 220, 112, { icon: 'cache', t: '分散式快取', s: '近期／最新郵件', k: 'cache' });
          S.box('st_search', 885, 445, 230, 112, { icon: 'key', t: '搜尋儲存系統', s: '全文反向索引', k: 'vi' });

          S.arrow('a_ws_st', 'web_srv@b', 'st_grp@t:0.35', { color: 'cy' });
          S.arrow('a_rt_st', 'rt_srv@b', 'st_grp@t:0.65', { color: 'vi' });
          S.glow(['web_srv', 'st_meta'], 'glow');
          S.pkt('web_srv', 'st_grp', { via: 'a_ws_st', color: 'cy' });
        },
        S => {
          S.unglow(['web_srv', 'st_meta']);
          S.glow(['st_meta', 'st_att'], 'glow');
          banner(S, 'bn', 140, 598, 1000, '📦 <b>資料分離</b>：郵件資料庫只存詮釋資料與正文；大附件存在物件儲存（S3），列表頁不必搬運大檔。');
        },
        S => {
          S.unglow(['st_meta', 'st_att']);
          S.glow(['st_cache', 'st_search'], 'glow-a');
          S.set('bn', '⚡ <b>衍生資料</b>：快取加速近期郵件，搜尋儲存用反向索引查關鍵字；兩者都必須能由主資料重建。');
        },
        S => {
          S.unglow(['st_cache', 'st_search']);
          S.loop(['a_https', 'a_ws_st'], { color: 'cy', every: 2400 });
          S.loop(['a_ws', 'a_rt_st'], { color: 'vi', every: 2600, delay: 900 });
          S.set('bn', '✅ Web 層、即時推送層、SMTP 與四大儲存層解耦後，可各自獨立量測與水平擴容。');
        }
      ]
    },

    /* ==================== 第 5 章：圖 8.6 郵件發送流程（100% 照原書編號 ①~⑦） ==================== */
    'send-flow': {
      steps: [
        S => {
          S.box('wm', 50, 110, 185, 62, { icon: 'cloud', t: 'Webmail', s: '按下發送', row: 1, k: 'core' });
          S.box('lb', 50, 212, 185, 60, { icon: 'gate', t: '負載平衡器', s: '限流與導流', row: 1, k: 'svc' });
          S.box('ws', 50, 316, 185, 66, { icon: 'server', t: 'Web 伺服器', s: '基本驗證', row: 1, k: 'vi' });

          S.arrow('e1', 'wm@b', 'lb@t', { label: '① HTTPS', color: 'cy' });
          S.arrow('e2', 'lb@b', 'ws@t', { label: '②', color: 'cy' });
          S.pkt('wm', 'lb', { via: 'e1', color: 'cy', done: () => S.pkt('lb', 'ws', { via: 'e2', color: 'cy' }) });
        },
        S => {
          queueBox(S, 'q_err', 370, 232, 230, 54, '錯誤佇列', 'bad');
          S.arrow('e4b', 'ws@r:0.28', 'q_err@l', { label: '④b 驗證失敗', color: 'rd' });
          S.pkt('ws', 'q_err', { via: 'e4b', color: 'rd', done: () => S.glow('q_err', 'glow-r') });

          drawStorageLayer(S, 50, 470, 880, 145, 's6');
          S.arrow('e3', 'ws@b', 's6_grp@t:0.3', { label: '③ 同域直寫 / 查資料', color: 'cy' });
        },
        S => {
          S.unglow('q_err');
          queueBox(S, 'q_out', 370, 322, 230, 54, '傳出佇列', '');
          grp(S, 'g_wrk', 710, 110, 250, 286, 'SMTP 傳出工作程序', 'core');
          S.box('w_spam', 735, 134, 200, 48, { icon: 'vpn', t: '檢查垃圾郵件', row: 1, k: 'warn' });
          S.box('w_vir', 735, 194, 200, 48, { icon: 'lock', t: '檢查病毒', row: 1, k: 'warn' });
          S.box('w_ret', 735, 254, 200, 48, { icon: 'clock', t: '重試（退避）', row: 1, k: 'svc' });
          S.box('w_smtp', 735, 322, 200, 56, { icon: 'server', t: 'SMTP 傳出', row: 1, k: 'vi' });

          S.arrow('e4a', 'ws@r:0.65', 'q_out@l', { label: '④a 通過驗證', color: 'cy' });
          S.arrow('e5', 'q_out@r', 'w_smtp@l', { label: '⑤ 拉取工作', color: 'cy' });
          S.pkt('ws', 'q_out', { via: 'e4a', color: 'cy', done: () => S.pkt('q_out', 'w_smtp', { via: 'e5', color: 'cy' }) });
        },
        S => {
          S.box('inet', 1055, 315, 175, 70, { icon: 'cloud', t: '網際網路', s: '收件方 SMTP', row: 1, k: 'ok' });
          S.arrow('e6', 'w_smtp@b', 's6_grp@t:0.78', { label: '⑥ 寫入 Sent', color: 'gr' });
          S.arrow('e7', 'w_smtp@r', 'inet@l', { label: '⑦ 對外投遞', color: 'gr' });
          S.pkt('w_smtp', 's6_grp', { via: 'e6', color: 'gr' });
          S.pkt('w_smtp', 'inet', { via: 'e7', color: 'gr', delay: 250 });
        },
        S => {
          S.glow(['q_out', 'g_wrk'], 'glow');
          S.loop(['e1', 'e2', 'e4a', 'e5', 'e7'], { color: 'cy', every: 3200 });
          banner(S, 'bn', 955, 485, 275, '⚡ <b>傳出佇列解耦</b><br>HTTP 入口快速回應，SMTP Worker 獨立水平擴容！', 'ok');
        }
      ]
    },

    /* ==================== 第 5 章：圖 8.7 郵件接收流程上半（步驟 ①~④） ==================== */
    'receive-entry': {
      steps: [
        S => {
          S.box('in_mail', 55, 118, 150, 62, { icon: 'msg', t: '外站 Email', s: 'SMTP 送入', row: 1, k: 'core' });
          S.box('lb', 55, 286, 150, 62, { icon: 'gate', t: '負載平衡器', s: 'SMTP 分流', row: 1, k: 'svc' });
          grp(S, 'g_smtp', 275, 176, 200, 190, 'SMTP 接收入口', 'core');
          S.box('pol', 293, 206, 164, 54, { icon: 'vpn', t: 'Email 接受策略', k: 'warn' });
          S.box('smtp', 293, 286, 164, 62, { icon: 'server', t: 'SMTP 伺服器', k: 'vi' });

          S.arrow('r1', 'in_mail@b', 'lb@t', { label: '①', color: 'cy' });
          S.arrow('r2', 'lb@r', 'smtp@l', { label: '②', color: 'cy' });
          S.arrow('rp', 'smtp@t', 'pol@b', { both: 1, color: 'am', dash: 1 });
          S.pkt('in_mail', 'lb', { via: 'r1', color: 'cy', done: () => S.pkt('lb', 'smtp', { via: 'r2', color: 'cy' }) });
        },
        S => {
          drawStorageLayer(S, 140, 455, 920, 145, 's7a');
          S.arrow('r3', 'smtp@b', 's7a_obj@t', { label: '③ 大附件先存物件儲存（回傳引用）', color: 'am' });
          S.pkt('smtp', 's7a_obj', { via: 'r3', color: 'am', done: () => S.glow('s7a_obj', 'glow-a') });
        },
        S => {
          S.unglow('s7a_obj');
          queueBox(S, 'q_in', 575, 286, 250, 62, 'Email 傳入佇列', '');
          S.arrow('r4', 'smtp@r', 'q_in@l', { label: '④ 寫入耐久佇列', color: 'cy' });
          S.pkt('smtp', 'q_in', { via: 'r4', color: 'cy', done: () => S.glow('q_in', 'glow') });
        },
        S => {
          S.box('ack', 920, 278, 290, 78, { icon: 'check', t: '回覆遠端 250 OK', s: '確認佇列與附件皆已持久化才交接成功', row: 1, k: 'ok' });
          S.arrow('r_ack', 'q_in@r', 'ack@l', { label: '耐久確認', color: 'gr' });
          S.pkt('q_in', 'ack', { via: 'r_ack', color: 'gr' });
        },
        S => {
          banner(S, 'bn', 140, 615, 920, '⚠️ 順序約束：先確認物件儲存持久保存 → 再寫入傳入佇列 → 最後才回 250 OK；重送必須冪等去重。', 'warn');
        }
      ]
    },

    /* ==================== 第 5 章：圖 8.7 郵件接收流程下半（步驟 ⑤~⑩） ==================== */
    'receive-delivery': {
      steps: [
        S => {
          queueBox(S, 'q_in', 45, 296, 210, 60, 'Email 傳入佇列', '');
          grp(S, 'g_proc', 325, 118, 230, 256, '郵件處理工作程序', 'core');
          S.box('p_spam', 345, 146, 190, 50, { icon: 'vpn', t: '檢查垃圾郵件', row: 1, k: 'warn' });
          S.box('p_vir', 345, 212, 190, 50, { icon: 'lock', t: '檢查病毒', row: 1, k: 'warn' });
          S.box('proc', 345, 294, 190, 62, { icon: 'gear', t: '郵件處理', row: 1, k: 'vi' });

          S.arrow('r5', 'q_in@r', 'proc@l', { label: '⑤ 拉取工作', color: 'cy' });
          S.pkt('q_in', 'proc', { via: 'r5', color: 'cy', done: () => S.glow('g_proc', 'glow') });
        },
        S => {
          S.unglow('g_proc');
          drawStorageLayer(S, 140, 455, 940, 145, 's7b');
          S.arrow('r6', 'proc@b', 's7b_grp@t:0.35', { label: '⑥ 寫入信箱、快取與附件', color: 'gr' });
          S.pkt('proc', 's7b_grp', { via: 'r6', color: 'gr', done: () => S.glow('s7b_meta', 'glow-g') });
        },
        S => {
          S.unglow('s7b_meta');
          S.box('rt', 660, 294, 190, 62, { icon: 'coord', t: '即時伺服器', s: '檢查在線狀態', row: 1, k: 'vi' });
          S.box('wm', 845, 118, 260, 68, { icon: 'cloud', t: 'Webmail', s: '收件者瀏覽器', row: 1, k: 'core' });

          S.arrow('r7', 'proc@r', 'rt@l', { label: '⑦ 在線推送', color: 'vi' });
          S.arrow('r8', 'rt@t', 'wm@b:0.3', { label: '⑧ WebSocket', color: 'vi' });
          S.pkt('proc', 'rt', { via: 'r7', color: 'vi', done: () => S.pkt('rt', 'wm', { via: 'r8', color: 'vi' }) });
        },
        S => {
          S.box('web', 1015, 294, 210, 62, { icon: 'server', t: 'Web 伺服器', s: '離線補抓入口', row: 1, k: 'svc' });
          S.arrow('r9', 'wm@b:0.75', 'web@t', { label: '⑨ HTTPS (重連後)', color: 'cy' });
          S.arrow('r10', 'web@b', 's7b_grp@t:0.85', { label: '⑩ 讀取新郵件', color: 'cy', both: 1 });
          S.pkt('wm', 'web', { via: 'r9', color: 'cy', done: () => S.pkt('web', 's7b_grp', { via: 'r10', color: 'cy' }) });
        },
        S => {
          S.loop(['r5', 'r7', 'r8'], { color: 'vi', every: 2800 });
          S.loop(['r9', 'r10'], { color: 'cy', every: 3100, delay: 900 });
          banner(S, 'bn', 140, 615, 940, '✅ 通知與保存分離：即時推送掉線不怕漏信，重連後永遠能靠 ⑨→⑩ 從主儲存補齊差異。', 'ok');
        }
      ]
    },

    /* ==================== 第 6 章：表 8.1 / 8.2 分區鍵與集群鍵 ==================== */
    partition: {
      steps: [
        S => {
          entity(S, 't1', 70, 145, 360, 'folders_by_user（表 8.1）', [
            ['user_id', 'PK 分區鍵'],
            ['folder_id', 'CK 集群鍵'],
            ['folder_name', 'text']
          ]);
          entHl(S, 't1', [0, 1], 'hl');
          S.box('n1', 70, 320, 360, 88, { icon: 'folder', t: '單一分區讀取', s: '用 user_id 直接定位該帳號的所有資料夾', row: 1, k: 'ok' });
        },
        S => {
          entity(S, 't2', 480, 145, 420, 'emails_by_folder（表 8.2）', [
            ['(user_id, folder_id)', '複合 PK 分區鍵'],
            ['email_id (TIMEUUID)', 'CK 集群鍵 DESC ↓'],
            ['from / subject / preview', '列表摘要欄位'],
            ['is_read', 'boolean']
          ]);
          entHl(S, 't2', [0], 'hl');
        },
        S => {
          entHl(S, 't2', [1], 'ok');
          S.box('n2', 945, 145, 285, 130, { icon: 'clock', t: 'TIMEUUID 降冪排序', s: '最新郵件天然排在分區最前面，且同毫秒也能唯一區分', k: 'core' });
        },
        S => {
          entHl(S, 't2', [2, 3], 'hl');
          S.table('sample', 480, 360, {
            title: '同一個 (user_id, Inbox) 分區內的排序結果（只含摘要，不含大正文）',
            w: 750, size: 14,
            cols: ['email_id (DESC)', 'from', 'subject', 'is_read'],
            rows: [
              ['t3 (10:05)', 'hr@corp.com', '合約審核完成', 'false'],
              ['t2 (09:40)', 'bank@ex.net', '本月帳單通知', 'true'],
              ['t1 (昨天)', 'bob@gmail.com', '週會簡報', 'true']
            ]
          });
          S.rowcls('sample', 0, 'hl');
        },
        S => {
          banner(S, 'bn', 70, 565, 1160, '⚖️ 熱門信箱保護：若單一分區累積過大，可加上「時間桶（如年月）」當分區鍵，避免單分區過熱。', 'warn');
        }
      ]
    },

    /* ==================== 第 6 章：表 8.4 已讀與未讀雙投影搬移動畫 ==================== */
    'read-model': {
      steps: [
        S => {
          S.box('sql', 70, 145, 380, 120, { icon: 'db', t: '關聯式做法', s: 'WHERE user_id=? AND folder_id=?<br>AND is_read = false ORDER BY time DESC', k: 'svc' });
          S.box('wide', 500, 145, 720, 120, { icon: 'warn', t: '寬欄 NoSQL 的挑戰', s: 'is_read 只是一般欄位，若把整個資料夾撈進 App 再過濾會浪費大量讀取 → 改維護<b>未讀／已讀兩張投影表</b>！', row: 1, k: 'warn' });
        },
        S => {
          S.table('tb_un', 70, 305, {
            title: 'unread_emails（未讀投影）', w: 500, size: 14,
            cols: ['email_id', 'from', 'subject'],
            rows: [['#902', 'alice@ex', '合約急件'], ['#901', 'bob@ex', '週報確認']]
          });
          S.table('tb_rd', 710, 305, {
            title: 'read_emails（已讀投影）', w: 510, size: 14,
            cols: ['email_id', 'from', 'subject'],
            rows: [['#899', 'hr@ex', '休假通知']]
          });
          S.glow(['tb_un', 'tb_rd'], 'glow');
        },
        S => {
          S.unglow(['tb_un', 'tb_rd']);
          S.rowcls('tb_un', 0, 'hl');
          S.rowcls('tb_rd', 0, 'ok');
        },
        S => {
          // 動態演繹「標為已讀」：從 unread 移除 → 寫入 read
          S.rowcls('tb_un', 0, 'bad', true);
          S.arrow('mv_rd', 'tb_un@r', 'tb_rd@l', { label: '標為已讀：刪 unread → 寫 read', color: 'gr' });
          S.pkt('tb_un', 'tb_rd', {
            via: 'mv_rd', color: 'gr',
            done: () => {
              S.addRow('tb_rd', ['#902', 'alice@ex', '合約急件']);
              S.rowcls('tb_rd', 1, 'ok');
            }
          });
        },
        S => {
          banner(S, 'bn', 70, 565, 1150, '⚖️ 去正規化取捨：用<b>額外寫入成本</b>換取極速讀取；搭配版本號與可重放事件，故障後可由主資料重建投影。', 'ok');
        }
      ]
    },

    /* ==================== 第 6 章：表 8.5 對話串樹狀重建 ==================== */
    'thread-headers': {
      steps: [
        S => {
          S.box('ma', 90, 175, 280, 102, { icon: 'msg', t: '原信 A', s: 'Message-ID: &lt;a@ex&gt;', row: 1, k: 'core' });
          S.box('mb', 485, 175, 310, 102, { icon: 'msg', t: '回覆 B', s: 'Message-ID: &lt;b@ex&gt;<br>In-Reply-To: <b>&lt;a@ex&gt;</b>', row: 1, k: 'svc' });
          S.arrow('ab', 'mb@l', 'ma@r', { label: 'In-Reply-To', color: 'cy' });
          S.pkt('mb', 'ma', { via: 'ab', color: 'cy' });
        },
        S => {
          S.box('mc', 895, 175, 325, 112, { icon: 'msg', t: '回覆 C', s: 'Message-ID: &lt;c@ex&gt;<br>In-Reply-To: <b>&lt;b@ex&gt;</b><br>References: &lt;a&gt; &lt;b&gt;', row: 1, k: 'ok' });
          S.arrow('bc', 'mc@l', 'mb@r', { label: 'In-Reply-To', color: 'gr' });
          S.arrow('ac', 'mc@t', 'ma@t', { label: 'References: <a> <b>', color: 'am', curve: -46, dash: 1 });
          S.pkt('mc', 'mb', { via: 'bc', color: 'gr' });
        },
        S => {
          grp(S, 'tree_g', 90, 340, 540, 235, 'JWZ 對話串重建結果', 'core');
          S.el('tr_a', 130, 380, 210, 42, '✉️ A（根郵件）', 'em-dir hi');
          S.el('tr_b', 220, 442, 230, 42, '↳ ✉️ B（回覆 A）', 'em-dir');
          S.el('tr_c', 310, 504, 260, 42, '↳ ✉️ C（回覆 B）', 'em-dir gr');
          S.arrow('t_ab', 'tr_a@b:0.25', 'tr_b@l', { elbow: 'vh', color: 'cy', noHead: 1 });
          S.arrow('t_bc', 'tr_b@b:0.25', 'tr_c@l', { elbow: 'vh', color: 'gr', noHead: 1 });
        },
        S => {
          grp(S, 'miss_g', 680, 340, 540, 235, '若 C 比 B 先同步到達（亂序）', 'warn');
          S.el('ms_a', 720, 380, 200, 42, '✉️ A（已到達）', 'em-dir hi');
          S.el('ms_b', 810, 442, 270, 42, '⏳ B（暫時空容器佔位）', 'em-dir am');
          S.el('ms_c', 900, 504, 250, 42, '↳ ✉️ C（先掛在 B 下）', 'em-dir gr');
          S.arrow('m_ab', 'ms_a@b:0.25', 'ms_b@l', { elbow: 'vh', color: 'am', dash: 1, noHead: 1 });
          S.arrow('m_bc', 'ms_b@b:0.25', 'ms_c@l', { elbow: 'vh', color: 'gr', noHead: 1 });
        },
        S => {
          banner(S, 'bn', 90, 595, 1130, '🔒 每個信箱的已讀、標籤與刪除狀態各自獨立；對話串只顯示目前登入者有權存取的郵件。', 'ok');
        }
      ]
    },

    /* ==================== 第 7 章：圖 8.8 處理回饋意見往來的循環（100% 照原書） ==================== */
    feedback: {
      steps: [
        S => {
          S.box('isp', 70, 285, 220, 100, { icon: 'cloud', t: 'ISP', s: '網路服務供應商', k: 'core' });
          S.box('proc', 460, 290, 240, 90, { icon: 'gear', t: '回饋意見處理', s: '依事件類型分流', row: 1, k: 'vi' });
          queueBox(S, 'q_soft', 895, 145, 295, 68, '軟退回（Soft bounce）', 'warn');

          S.arrow('f_in', 'isp@r', 'proc@l', { label: '退回與投訴', color: 'cy' });
          S.arrow('f_soft', 'proc@t:0.6', 'q_soft@l', { curve: -36, color: 'am', label: '暫時忙碌 → 退避重試' });
          S.pkt('isp', 'proc', { via: 'f_in', color: 'cy', done: () => S.pkt('proc', 'q_soft', { via: 'f_soft', color: 'am' }) });
        },
        S => {
          queueBox(S, 'q_hard', 895, 300, 295, 68, '硬退回（Hard bounce）', 'bad');
          S.arrow('f_hard', 'proc@r', 'q_hard@l', { color: 'rd', label: '地址無效 → 永久停送' });
          S.pkt('proc', 'q_hard', { via: 'f_hard', color: 'rd', done: () => S.glow('q_hard', 'glow-r') });
        },
        S => {
          S.unglow('q_hard');
          queueBox(S, 'q_comp', 895, 455, 295, 68, '投訴（Complaint）', 'vi');
          S.arrow('f_comp', 'proc@b:0.6', 'q_comp@l', { curve: 36, color: 'vi', label: '回報垃圾信 → 停訂／查濫用' });
          S.pkt('proc', 'q_comp', { via: 'f_comp', color: 'vi', done: () => S.glow('q_comp', 'glow') });
        },
        S => {
          S.unglow('q_comp');
          S.glow('q_soft', 'glow-a');
          banner(S, 'bn', 70, 565, 1120, '⏱️ 軟退回重試必須設上限，超過門檻移進待調查失敗佇列；按目的網域分組監控，避免單一 ISP 塞爆全部 Worker。', 'warn');
        },
        S => {
          S.unglow('q_soft');
          S.loop(['f_in', 'f_soft'], { color: 'am', every: 2600 });
          S.loop(['f_in', 'f_hard'], { color: 'rd', every: 3000, delay: 700 });
          S.loop(['f_in', 'f_comp'], { color: 'vi', every: 3400, delay: 1400 });
          S.set('bn', '✅ 一封多收件者的信可能同時命中三種結果，因此必須以「每個收件人」為粒度各自追蹤並回饋信譽系統。');
        }
      ]
    },

    /* ==================== 第 7 章：圖 8.9 郵件身分驗證標頭（SPF / DKIM / DMARC） ==================== */
    authentication: {
      steps: [
        S => {
          S.el('hdr_card', 70, 125, 690, 425,
            `<div class="hh"><span>圖 8.9｜原始郵件驗證標頭（去識別化示例）</span><span>Gmail 驗證檢視</span></div>
             <div class="hr" data-r="0"><span class="hk">Message-ID</span><span>&lt;notice-202611@bank.example&gt;</span></div>
             <div class="hr" data-r="1"><span class="hk">From</span><span>alerts@<b>bank.example</b>（使用者可見）</span></div>
             <div class="hr" data-r="2"><span class="hk">To</span><span>bob@gmail.com</span></div>
             <div class="hr" data-r="3"><span class="hk">Subject</span><span>帳戶安全提醒</span></div>
             <div class="hr hl" data-r="4"><span class="hk">SPF</span><span><span class="em-pass">PASS</span>smtp.mailfrom=bank.example（發信 IP 獲授權）</span></div>
             <div class="hr" data-r="5"><span class="hk">DKIM</span><span><span class="em-pass">PASS</span>header.d=bank.example（簽章與內文完整）</span></div>
             <div class="hr" data-r="6"><span class="hk">DMARC</span><span><span class="em-pass">PASS</span>header.from=bank.example（與 From 對齊）</span></div>`, 'em-hdr-card');
          S.box('c_spf', 810, 130, 410, 125, { icon: 'vpn', t: '① SPF 檢查發信 IP', s: '查詢 DNS TXT 紀錄，確認這台送信主機的 IP 是否在 bank.example 授權清單內', row: 1, k: 'core' });
        },
        S => {
          const el = S.$('hdr_card');
          el.querySelectorAll('.hr').forEach(r => r.classList.remove('hl', 'ok'));
          el.querySelector('[data-r="5"]').classList.add('hl');
          S.box('c_dkim', 810, 275, 410, 125, { icon: 'key', t: '② DKIM 檢查網域簽章', s: '以公鑰驗證簽章與內文未被竄改；即使郵件經轉寄 IP 改變，簽章仍有效', row: 1, k: 'vi' });
        },
        S => {
          const el = S.$('hdr_card');
          el.querySelectorAll('.hr').forEach(r => r.classList.remove('hl', 'ok'));
          el.querySelector('[data-r="1"]').classList.add('hl');
          el.querySelector('[data-r="6"]').classList.add('ok');
          S.box('c_dmarc', 810, 420, 410, 125, { icon: 'lock', t: '③ DMARC 對齊可見 From', s: '要求 SPF 或 DKIM 至少一項通過且網域與 From 對齊，並定義未通過的處置政策', row: 1, k: 'ok' });
        },
        S => {
          const el = S.$('hdr_card');
          el.querySelectorAll('.hr').forEach(r => r.classList.remove('hl'));
          ['4', '5', '6'].forEach(i => el.querySelector(`[data-r="${i}"]`).classList.add('ok'));
          S.glow(['c_spf', 'c_dkim', 'c_dmarc'], 'glow-g');
        },
        S => {
          banner(S, 'bn', 70, 575, 1150, '🛡️ 網域驗證（SPF/DKIM/DMARC）降低假冒風險；實務還需搭配釣魚偵測、惡意連結掃描與使用者警告。', 'ok');
        }
      ]
    },

    /* ==================== 第 8 章：圖 8.10 Elasticsearch（100% 照原書：同步讀 vs 非同步寫） ==================== */
    elastic: {
      steps: [
        S => {
          // 完全照原書圖 8.10 由上而下配置
          S.box('q_s', 225, 118, 180, 58, { icon: 'key', t: '搜尋', row: 1, k: 'core' });
          S.box('q_api', 540, 412, 230, 58, { icon: 'gate', t: 'RESTful API', row: 1, k: 'svc' });
          grp(S, 'es_grp', 420, 506, 470, 118, 'Elasticsearch 集群（依 user_id 分區）', 'core');
          S.box('es1', 445, 534, 125, 74, { icon: 'db', t: '節點 1', k: 'db' });
          S.box('es2', 592, 534, 125, 74, { icon: 'db', t: '節點 2', k: 'db' });
          S.box('es3', 739, 534, 125, 74, { icon: 'db', t: '節點 3', k: 'db' });

          S.arrow('a_sync', 'q_s@b', 'q_api@l', { label: '同步（使用者等待結果）', color: 'cy', curve: 45 });
          S.arrow('a_es', 'q_api@b', 'es_grp@t', { color: 'cy' });
          S.pkt('q_s', 'q_api', { via: 'a_sync', color: 'cy', done: () => S.pkt('q_api', 'es_grp', { via: 'a_es', color: 'cy' }) });
        },
        S => {
          S.box('ev1', 455, 118, 175, 58, { icon: 'msg', t: '發送郵件', row: 1, k: 'svc' });
          S.box('ev2', 655, 118, 175, 58, { icon: 'msg', t: '接收郵件', row: 1, k: 'svc' });
          S.box('ev3', 855, 118, 175, 58, { icon: 'warn', t: '刪除郵件', row: 1, k: 'warn' });
          queueBox(S, 'kafka', 545, 224, 220, 56, 'Kafka', 'vi');

          S.arrow('k1', 'ev1@b', 'kafka@t:0.25', { label: '非同步', color: 'am' });
          S.arrow('k2', 'ev2@b', 'kafka@t:0.5', { label: '非同步', color: 'am' });
          S.arrow('k3', 'ev3@b', 'kafka@t:0.75', { label: '非同步', color: 'am' });
          S.pkt('ev1', 'kafka', { via: 'k1', color: 'am' });
          S.pkt('ev2', 'kafka', { via: 'k2', color: 'am', delay: 200 });
          S.pkt('ev3', 'kafka', { via: 'k3', color: 'am', delay: 400 });
        },
        S => {
          S.box('cons', 540, 318, 230, 58, { icon: 'gear', t: 'Kafka 消費者', row: 1, k: 'vi' });
          S.arrow('kc', 'kafka@b', 'cons@t', { color: 'am' });
          S.arrow('ca', 'cons@b', 'q_api@t', { label: '寫入／版本更新', color: 'am' });
          S.pkt('kafka', 'cons', { via: 'kc', color: 'am', done: () => S.pkt('cons', 'q_api', { via: 'ca', color: 'am' }) });
        },
        S => {
          S.box('sync_note', 935, 315, 305, 165, { icon: 'warn', t: '最大挑戰：雙系統同步', s: '• 傳出事件前斷線<br>• 事件亂序或積壓<br>• 需靠版本號、核對與全量重建兜底', k: 'warn' });
          S.glow('sync_note', 'glow-a');
        },
        S => {
          S.unglow('sync_note');
          S.loop(['a_sync', 'a_es'], { color: 'cy', every: 2400 });
          S.loop(['k2', 'kc', 'ca', 'a_es'], { color: 'am', every: 3000, delay: 800 });
          S.box('tip', 60, 465, 325, 115, { icon: 'check', t: '🧪 實驗觀察重點', s: '剛收到信／剛刪掉信時，信箱主資料與搜尋結果是否同步？', k: 'ok' });
        }
      ]
    },

    /* ==================== 第 8 章：圖 8.11 LSM 樹狀結構（100% 照原書 5 層由下而上） ==================== */
    lsm: {
      steps: [
        S => {
          S.box('prob', 120, 130, 1040, 82, { icon: 'warn', t: '自製搜尋引擎的核心瓶頸：磁碟隨機 I/O', s: '每天 PB 級新郵件與大量狀態變更（單一帳號可達 50 萬封+）→ 改用只做循序寫入的 <b>LSM 樹</b>！', row: 1, k: 'warn' });
        },
        S => {
          S.hide('prob');
          // 時間軸（左側由下往上箭頭，完全照原書圖 8.11）
          S.arrow('t_axis', [85, 575], [85, 135], { color: 'cy', w: 2.5 });
          S.text('t_lbl', 56, 585, '時間 ↑', { size: 15, color: '#22d3ee', weight: 700 });

          // 第 0 層（記憶體，紅色多塊）
          const l0Blocks = Array.from({ length: 12 }, (_, i) => `<div class="em-cyl" style="width:52px">${i + 1}</div>`).join('');
          S.el('l0', 135, 505, 1070, 74,
            `<div class="em-lsm-lbl">第 0 層<small>記憶體（MemTable）</small></div><div class="em-lsm-blocks">${l0Blocks}</div>`, 'em-lsm-row mem');
          S.glow('l0', 'glow-r');
        },
        S => {
          S.unglow('l0');
          const mkRow = (id, y, title, sub, n, w) => {
            const blks = Array.from({ length: n }, () => `<div class="em-cyl" style="width:${w}px">SST</div>`).join('');
            S.el(id, 135, y, 1070, 72, `<div class="em-lsm-lbl">${title}<small>${sub}</small></div><div class="em-lsm-blocks">${blks}</div>`, 'em-lsm-row');
          };
          mkRow('l1', 415, '第一層', '磁碟（排序檔）', 8, 72);
          mkRow('l2', 325, '第二層', '磁碟（較大排序檔）', 4, 128);
          mkRow('l3', 235, '第三層', '磁碟（合併後）', 2, 210);
          mkRow('l4', 145, '第四層', '磁碟（最大排序檔）', 1, 310);

          S.arrow('m01', 'l0@t', 'l1@b', { color: 'am' });
          S.arrow('m12', 'l1@t', 'l2@b', { color: 'cy' });
          S.arrow('m23', 'l2@t', 'l3@b', { color: 'cy' });
          S.arrow('m34', 'l3@t', 'l4@b', { color: 'cy' });
          S.pkt('l0', 'l1', { via: 'm01', color: 'am', done: () => S.pkt('l1', 'l2', { via: 'm12', color: 'cy', done: () => S.pkt('l2', 'l3', { via: 'm23', color: 'cy' }) }) });
        },
        S => {
          S.glow(['l1', 'l2', 'l3', 'l4'], 'glow');
          banner(S, 'bn', 135, 595, 1070, '⚖️ 合併（Compaction）把隨機小寫入變成循序批次，代價是寫放大與空間成本（參考 Bigtable / Cassandra / RocksDB）。', 'warn');
        },
        S => {
          S.unglow(['l1', 'l2', 'l3', 'l4']);
          S.set('bn', '💡 <b>動靜分離</b>：不常變的「郵件正文索引」與常變的「資料夾／已讀狀態」分開儲存，移資料夾時不必重寫全文！');
        }
      ]
    },

    /* ==================== 第 9 章：圖 8.12 多資料中心的設定方式（100% 照原書上下對照） ==================== */
    regions: {
      steps: [
        S => {
          // 上半：正常路徑
          grp(S, 'ok_wrap', 60, 114, 1160, 232, '① 正常路徑：就近連線至本地資料中心', 'ok');
          S.box('u_ok', 95, 200, 195, 68, { icon: 'user', t: '來自美國的使用者', row: 1, k: 'user' });

          grp(S, 'us1', 420, 134, 760, 92, '美國資料中心', 'core');
          S.box('us1_s', 475, 152, 220, 58, { icon: 'server', t: '伺服器', row: 1, k: 'svc' });
          S.box('us1_d', 865, 152, 220, 58, { icon: 'db', t: '資料庫', row: 1, k: 'db' });

          S.arrow('u1_s', 'u_ok@r', 'us1_s@l', { color: 'gr' });
          S.arrow('u1_d', 'us1_s@r', 'us1_d@l', { color: 'gr' });
          S.pkt('u_ok', 'us1_s', { via: 'u1_s', color: 'gr', done: () => S.pkt('us1_s', 'us1_d', { via: 'u1_d', color: 'gr' }) });
        },
        S => {
          grp(S, 'eu1', 420, 244, 760, 92, '歐洲資料中心', '');
          S.box('eu1_s', 475, 262, 220, 58, { icon: 'server', t: '伺服器', row: 1, k: 'svc' });
          S.box('eu1_d', 865, 262, 220, 58, { icon: 'db', t: '資料庫', row: 1, k: 'db' });
          S.arrow('e1_d', 'eu1_s@r', 'eu1_d@l', { color: 'gy', dash: 1 });
          S.arrow('rep1', 'us1_d@b', 'eu1_d@t', { label: '副本複製', color: 'cy', both: 1 });
          S.pkt('us1_d', 'eu1_d', { via: 'rep1', color: 'cy' });
        },
        S => {
          // 下半：故障分支（照原書圖 8.12 下半：美國連線打紅 X，改連歐洲資料中心）
          grp(S, 'fl_wrap', 60, 366, 1160, 238, '② 網路分區／區域故障：切換至歐洲資料中心', 'bad');
          S.box('u_fl', 95, 456, 195, 68, { icon: 'user', t: '來自美國的使用者', row: 1, k: 'user' });

          grp(S, 'us2', 420, 386, 760, 92, '美國資料中心（故障／分區）', 'bad');
          S.box('us2_s', 475, 404, 220, 58, { icon: 'server', t: '伺服器', row: 1, k: 'bad' });
          S.box('us2_d', 865, 404, 220, 58, { icon: 'db', t: '資料庫', row: 1, k: 'bad' });

          grp(S, 'eu2', 420, 498, 760, 92, '歐洲資料中心（接手服務）', 'core');
          S.box('eu2_s', 475, 516, 220, 58, { icon: 'server', t: '伺服器', row: 1, k: 'ok' });
          S.box('eu2_d', 865, 516, 220, 58, { icon: 'db', t: '資料庫', row: 1, k: 'ok' });

          S.arrow('u2_bad', 'u_fl@r:0.35', 'us2_s@l', { label: '✕ 中斷', color: 'rd', dash: 1 });
          S.arrow('u2_ok', 'u_fl@r:0.65', 'eu2_s@l', { label: '改導向歐洲', color: 'am' });
          S.arrow('e2_d', 'eu2_s@r', 'eu2_d@l', { color: 'gr' });
          S.arrow('rep2', 'us2_d@b', 'eu2_d@t', { label: '副本複製', color: 'gy', dash: 1, both: 1 });
          S.pkt('u_fl', 'eu2_s', { via: 'u2_ok', color: 'am', done: () => S.pkt('eu2_s', 'eu2_d', { via: 'e2_d', color: 'gr' }) });
        },
        S => {
          S.glow('eu2', 'glow-a');
          S.stamp('fence', 1020, 398, '撤銷舊主寫入資格', 'rd');
        },
        S => {
          S.unglow('eu2');
          banner(S, 'bn', 60, 616, 1160, '✅ 安全切換兩條件：① 核對複寫進度（RPO） ② 隔離舊主寫入（Fencing），才能恢復寫入。', 'ok');
        }
      ]
    }
  };
})();
