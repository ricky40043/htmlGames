(() => {
  'use strict';

  const TERMS = [
    ['web-app-tier','網站／應用程式層','Web / App Tier',['Web/App Tier','Web / App Tier','Web Tier','App Tier'],'負責接收請求、執行商業邏輯並存取資料。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Introduction'],
    ['database-tier','資料庫層','Database Tier',['Database Tier','Data Tier'],'負責持久保存、查詢與更新應用程式資料。','https://developer.mozilla.org/zh-TW/docs/Glossary/Database'],
    ['web-server','網頁伺服器','Web Server',['Web Server'],'接收網路請求並回傳內容或執行後端程式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server'],
    ['server','伺服器','Server',['Server','server'],'提供網站、API 或其他網路服務的電腦或程式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server'],
    ['client','用戶端','Client',['Client','client'],'主動向伺服器送出請求的一端，例如瀏覽器或手機 App。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP'],
    ['browser','瀏覽器','Browser',['Browser','browser'],'使用者瀏覽網站並送出網路請求的程式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works'],
    ['mobile-app','手機應用程式','Mobile App',['Mobile App','mobile app'],'安裝在手機上的應用程式。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP'],
    ['database','資料庫','Database',['Database','database','DB'],'持久保存並查詢應用程式資料的系統。','https://developer.mozilla.org/zh-TW/docs/Glossary/Database'],
    ['app','應用程式','App',['App'],'執行產品功能與商業邏輯的程式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Introduction'],
    ['dns','網域名稱系統','Domain Name System (DNS)',['DNS'],'把網域名稱解析成可連線的位址。','https://www.cloudflare.com/zh-tw/learning/dns/what-is-dns/'],
    ['https','加密的超文字傳輸協定','HTTPS',['HTTPS'],'使用 TLS 加密的 HTTP 連線。','https://developer.mozilla.org/zh-TW/docs/Glossary/HTTPS'],
    ['http','超文字傳輸協定','HTTP',['HTTP'],'用戶端與伺服器交換請求與回應的應用層協定。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP'],
    ['tls','傳輸層安全協定','Transport Layer Security (TLS)',['TLS'],'加密網路連線並驗證通訊對象身分。','https://developer.mozilla.org/zh-TW/docs/Glossary/TLS'],
    ['request','請求','Request',['Request','request'],'用戶端送給伺服器，要求取得資料或執行動作的訊息。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages'],
    ['response','回應','Response',['Response','response'],'伺服器處理請求後回傳的結果。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages'],
    ['backend','後端服務','Backend',['Backend','backend'],'在伺服器端執行驗證、商業邏輯與資料存取的程式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Introduction'],
    ['api-gateway','API 閘道','API Gateway',['API gateway','API Gateway'],'位於用戶端與後端服務之間的統一 API 入口。','https://learn.microsoft.com/zh-tw/azure/architecture/microservices/design/gateway'],
    ['bff','前端專用後端','Backend for Frontend (BFF)',['BFF'],'針對特定前端型態設計的後端介面層。','https://learn.microsoft.com/zh-tw/azure/architecture/patterns/backends-for-frontends'],
    ['api','應用程式介面','Application Programming Interface (API)',['API'],'不同程式或服務之間約定好的操作與資料交換介面。','https://developer.mozilla.org/zh-TW/docs/Glossary/API'],
    ['payload','資料內容','Payload',['payload','Payload'],'請求或訊息真正攜帶的資料內容。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages'],
    ['json','JSON 資料格式','JavaScript Object Notation (JSON)',['JSON'],'常用於 API 傳輸結構化資料的文字格式。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Core/Scripting/JSON'],
    ['failure-domain','故障範圍','Failure Domain',['failure domain','Failure Domain'],'某個故障可能同時影響的一組資源或服務範圍。','https://learn.microsoft.com/zh-tw/azure/well-architected/reliability/failure-mode-analysis'],
    ['latency','延遲','Latency',['latency','Latency'],'從送出請求到收到結果所花的時間。','https://www.cloudflare.com/zh-tw/learning/performance/glossary/what-is-latency/'],
    ['request-rate','請求速率','Request Rate',['Request Rate','request rate'],'系統每秒收到多少請求的流量指標。','https://sre.google/sre-book/monitoring-distributed-systems/'],
    ['p95p99','第 95／99 百分位延遲','P95/P99 Latency',['P95/P99 latency','P95/P99 Latency'],'觀察較慢那群請求的尾端延遲。','https://sre.google/sre-book/monitoring-distributed-systems/'],
    ['qps','每秒查詢數','Queries Per Second (QPS)',['QPS'],'系統每秒處理的查詢或請求數。','https://sre.google/sre-book/monitoring-distributed-systems/'],
    ['scale-out','水平擴充','Scale Out',['Scale Out','scale out'],'增加更多機器或服務實例共同分擔流量。','https://learn.microsoft.com/zh-tw/azure/architecture/framework/scalability/design-scale'],
    ['scale-up','垂直擴充','Scale Up',['Scale Up','scale up'],'提升單一機器的 CPU、記憶體等硬體能力。','https://learn.microsoft.com/zh-tw/azure/architecture/framework/scalability/design-scale'],
    ['endpoint','API 端點','Endpoint',['endpoint','Endpoint'],'API 對外提供某項操作的具體網址與介面。','https://developer.mozilla.org/zh-TW/docs/Glossary/API'],
    ['query','查詢','Query',['query','Query'],'向資料來源提出條件並取得所需資料的操作。','https://developer.mozilla.org/zh-TW/docs/Glossary/SQL'],
    ['lock','鎖定機制','Lock',['lock','Lock'],'避免多個操作同時修改共享資料造成衝突的同步機制。','https://learn.microsoft.com/zh-tw/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide'],
    ['baseline','基準狀態','Baseline',['baseline','Baseline'],'目前規模下的正常效能與容量基準。','https://sre.google/sre-book/monitoring-distributed-systems/'],
    ['method','請求方法','HTTP Method',['method','Method'],'描述 HTTP 請求要執行的動作，例如 GET、POST。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Methods'],
    ['headers','標頭','Headers',['headers','Headers'],'HTTP 訊息中描述格式、驗證、快取等附加資訊。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Headers'],
    ['body','訊息本文','Body',['body','Body'],'HTTP 請求或回應中實際承載資料的內容。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages'],
    ['routing','路由分派','Routing',['routing','Routing'],'依網址與方法把請求交給正確程式處理。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes'],
    ['session','登入工作階段','Session',['Session','session'],'保存使用者登入或互動狀態的一段應用層資料。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Cookies'],
    ['stateless','無狀態','Stateless',['stateless','Stateless'],'處理目前請求時不依賴特定伺服器保存的前一次狀態。','https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html'],
    ['protocol','通訊協定','Protocol',['protocol','Protocol'],'通訊雙方共同遵守的資料交換規則。','https://developer.mozilla.org/zh-TW/docs/Glossary/Protocol'],
    ['business-logic','商業邏輯','Business Logic',['business logic','Business Logic'],'產品真正的規則與處理流程。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Introduction'],
    ['durable-data','持久化資料','Durable Data',['durable data','Durable Data'],'程式或主機重啟後仍能保留下來的資料。','https://developer.mozilla.org/zh-TW/docs/Glossary/Database'],
    ['transaction','交易','Transaction',['transaction','Transaction'],'一組資料操作必須共同成功或共同失敗的處理單位。','https://learn.microsoft.com/zh-tw/sql/t-sql/language-elements/transactions-transact-sql'],
    ['connection','連線','Connection',['connections','connection','Connection'],'用戶端、服務或資料庫之間建立的通訊通道。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP'],
    ['sql','關聯式資料庫查詢語言','SQL',['SQL'],'關聯式資料庫常用的資料定義與查詢語言。','https://developer.mozilla.org/zh-TW/docs/Glossary/SQL'],
    ['nosql','非關聯式資料庫','NoSQL',['NoSQL'],'不以傳統關聯式表格模型為唯一核心的資料庫類型。','https://aws.amazon.com/tw/nosql/'],
    ['schema','資料結構規則','Schema',['schema','Schema'],'描述資料欄位、型別、關係與限制的結構定義。','https://developer.mozilla.org/zh-TW/docs/Glossary/Database'],
    ['join','資料表連接','Join',['join','JOIN'],'依關聯條件把多個資料表的資料組合起來。','https://developer.mozilla.org/zh-TW/docs/Glossary/SQL'],
    ['access-pattern','存取模式','Access Pattern',['access pattern','Access Pattern'],'系統最常用什麼條件讀寫資料的方式。','https://aws.amazon.com/tw/nosql/'],
    ['load-balancer','負載平衡器','Load Balancer',['Load Balancer','load balancer'],'把流量分配到多台伺服器。','https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/'],
    ['health-check','健康檢查','Health Check',['Health Check','health check'],'定期確認後端伺服器是否正常。','https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/'],
    ['failover','容錯移轉','Failover',['Failover','failover'],'主要服務故障時切換到健康備援。','https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/'],
    ['replication','資料複寫','Replication',['Replication','replication'],'把資料變更複製到其他資料庫節點。','https://dev.mysql.com/doc/refman/8.4/en/replication.html'],
    ['cache-aside','旁路快取模式','Cache-Aside',['Cache-Aside','cache-aside'],'先查快取；未命中時查資料來源並回填快取。','https://learn.microsoft.com/zh-tw/azure/architecture/patterns/cache-aside'],
    ['cache','快取','Cache',['Cache','cache'],'暫時保存常用資料副本，加速後續讀取。','https://www.cloudflare.com/zh-tw/learning/cdn/what-is-caching/'],
    ['ttl','存留時間','Time To Live (TTL)',['TTL'],'資料在快取、DNS 等系統中保持有效的時間。','https://www.cloudflare.com/zh-tw/learning/cdn/glossary/time-to-live-ttl/'],
    ['cdn','內容傳遞網路','Content Delivery Network (CDN)',['CDN'],'從靠近使用者的邊緣節點傳送內容。','https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/'],
    ['edge','邊緣節點','Edge',['Edge','edge'],'靠近終端使用者的 CDN 或網路節點。','https://www.cloudflare.com/zh-tw/learning/cdn/glossary/edge-server/'],
    ['origin','原始伺服器','Origin',['Origin','origin'],'保存原始內容或真正處理請求的來源伺服器。','https://www.cloudflare.com/zh-tw/learning/cdn/glossary/origin-server/'],
    ['message-queue','訊息佇列','Message Queue',['Message Queue','message queue'],'在生產者與消費者間暫存工作或訊息。','https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html'],
    ['producer','生產者','Producer',['Producer','producer'],'把工作或訊息送進佇列的一方。','https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html'],
    ['consumer','消費者','Consumer',['Consumer','consumer'],'從佇列取出訊息並執行工作的一方。','https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html'],
    ['backlog','待處理工作堆積','Backlog',['Backlog','backlog'],'仍等待處理的工作量。','https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html'],
    ['idempotency','冪等性','Idempotency',['Idempotency','idempotent'],'相同操作重複執行時，不會產生額外重複副作用。','https://developer.mozilla.org/zh-TW/docs/Glossary/Idempotent'],
    ['observability','可觀測性','Observability',['Observability','observability'],'透過指標、日誌與追蹤推理系統內部狀態的能力。','https://opentelemetry.io/docs/concepts/observability-primer/'],
    ['sharding','資料分片','Sharding',['Sharding','sharding'],'把大型資料集拆到多個資料庫節點。','https://www.mongodb.com/docs/manual/sharding/'],
    ['shard-key','分片鍵','Shard Key',['Shard Key','shard key'],'決定一筆資料應該放到哪個分片的欄位或規則。','https://www.mongodb.com/docs/manual/core/sharding-shard-key/'],
    ['hotspot','熱點問題','Hotspot',['Hotspot','hotspot','hot key'],'少數資料或節點承受過多流量的失衡現象。','https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/']
  ].map(([id, zh, en, aliases, note, url]) => ({ id, zh, en, aliases, note, url }));

  const entries = TERMS.flatMap(term => term.aliases.map(alias => ({ term, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const isWord = ch => !!ch && /[A-Za-z0-9_]/.test(ch);
  const boundaryOk = (text, start, len) => {
    const first = text[start], last = text[start + len - 1];
    if (isWord(first) && isWord(text[start - 1])) return false;
    if (isWord(last) && isWord(text[start + len])) return false;
    return true;
  };

  function nextMatch(text, from) {
    let best = null;
    for (const entry of entries) {
      let idx = text.indexOf(entry.alias, from);
      while (idx >= 0 && !boundaryOk(text, idx, entry.alias.length)) idx = text.indexOf(entry.alias, idx + 1);
      if (idx < 0) continue;
      if (!best || idx < best.index || (idx === best.index && entry.alias.length > best.entry.alias.length)) best = { index: idx, entry };
    }
    return best;
  }

  function replaceTextNode(node, seen, allowLinks) {
    const text = node.nodeValue || '';
    if (!text.trim()) return;
    const frag = document.createDocumentFragment();
    let cursor = 0, changed = false;

    while (cursor < text.length) {
      const found = nextMatch(text, cursor);
      if (!found) break;
      changed = true;
      if (found.index > cursor) frag.append(document.createTextNode(text.slice(cursor, found.index)));
      const { term, alias } = found.entry;
      const first = !seen.has(term.id);
      seen.add(term.id);
      const label = `${term.zh}（${term.en}）`;
      if (first && allowLinks) {
        const a = document.createElement('a');
        a.className = 'book-term-link';
        a.href = term.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = label;
        a.title = `${term.note}｜點擊開啟外部說明`;
        const sup = document.createElement('sup');
        sup.textContent = '↗';
        a.appendChild(sup);
        frag.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.className = 'book-term-plain';
        span.textContent = first ? label : term.zh;
        span.title = `${label}：${term.note}`;
        frag.appendChild(span);
      }
      cursor = found.index + alias.length;
    }

    if (!changed) return;
    if (cursor < text.length) frag.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(frag);
  }

  function process(root, seen, allowLinks) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el || el.closest('script,style,pre,code,a,.book-term-link')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => replaceTextNode(node, seen, allowLinks));
  }

  function run() {
    const page = document.querySelector('.book-page');
    if (!page) return;

    if (!document.querySelector('.book-term-legend')) {
      const legend = document.createElement('div');
      legend.className = 'book-term-legend';
      legend.innerHTML = '<strong>📘 專有名詞閱讀方式</strong><span>第一次出現會顯示「中文（English／縮寫）」；看到 <b>↗</b> 可開啟外部說明。之後重複出現時以中文為主。</span>';
      page.insertBefore(legend, page.firstElementChild ? page.firstElementChild.nextSibling : null);
    }

    const seen = new Set();
    const panel = document.querySelector('.book-content-panel') || page;
    process(panel, seen, true);
    process(document.querySelector('.book-section-nav'), new Set(), false);
    process(document.querySelector('.book-course-header'), new Set(), false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
