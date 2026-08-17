(() => {
  const CORE_TERMS = [
    {id:'web-server',zh:'網頁伺服器',en:'Web Server',aliases:['Web Server','web server'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server',note:'接收網路請求並回傳網站內容或執行後端程式的伺服器。'},
    {id:'server',zh:'伺服器',en:'Server',aliases:['Server','server'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server',note:'提供網站、API 或其他網路服務的電腦或程式。'},
    {id:'browser',zh:'瀏覽器',en:'Browser',aliases:['Browser','browser'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works',note:'使用者用來瀏覽網站並送出網路請求的用戶端程式。'},
    {id:'mobile-app',zh:'手機應用程式',en:'Mobile App',aliases:['Mobile App','mobile app'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP',note:'安裝在手機上的應用程式，可直接呼叫後端 API。'},
    {id:'client',zh:'用戶端',en:'Client',aliases:['Client','client'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP',note:'主動向伺服器送出請求的一端，例如瀏覽器或手機 App。'},
    {id:'failure-domain',zh:'故障範圍',en:'Failure Domain',aliases:['failure domain','Failure Domain'],url:'https://learn.microsoft.com/zh-tw/azure/well-architected/reliability/failure-mode-analysis',note:'某個故障可能同時影響的一組資源或服務範圍。'},
    {id:'dns',zh:'網域名稱系統',en:'Domain Name System',abbr:'DNS',aliases:['DNS'],url:'https://www.cloudflare.com/zh-tw/learning/dns/what-is-dns/',note:'把網域名稱解析成可連線的 IP 位址或服務入口。'},
    {id:'http',zh:'超文字傳輸協定',en:'Hypertext Transfer Protocol',abbr:'HTTP',aliases:['HTTP'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP',note:'用戶端與伺服器交換請求與回應的應用層協定。'},
    {id:'https',zh:'加密的超文字傳輸協定',en:'HTTPS',aliases:['HTTPS'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/HTTPS',note:'透過 TLS 加密與驗證身分的 HTTP 連線。'},
    {id:'tls',zh:'傳輸層安全協定',en:'Transport Layer Security',abbr:'TLS',aliases:['TLS'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/TLS',note:'用來加密網路連線並驗證通訊對象身分的安全協定。'},
    {id:'request',zh:'請求',en:'Request',aliases:['Request','request'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages',note:'用戶端送給伺服器，要求取得資料或執行動作的訊息。'},
    {id:'response',zh:'回應',en:'Response',aliases:['Response','response'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages',note:'伺服器處理請求後回傳給用戶端的結果。'},
    {id:'backend',zh:'後端服務',en:'Backend',aliases:['Backend','backend'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Introduction',note:'在伺服器端執行驗證、商業邏輯與資料存取的程式。'},
    {id:'api-gateway',zh:'API 閘道',en:'API Gateway',aliases:['API gateway','API Gateway'],url:'https://learn.microsoft.com/zh-tw/azure/architecture/microservices/design/gateway',note:'位在用戶端與多個後端服務之間的統一 API 入口。'},
    {id:'bff',zh:'前端專用後端',en:'Backend for Frontend',abbr:'BFF',aliases:['BFF'],url:'https://learn.microsoft.com/zh-tw/azure/architecture/patterns/backends-for-frontends',note:'針對特定前端類型設計的後端介面層，例如 Web 與 Mobile 各有不同 BFF。'},
    {id:'api',zh:'應用程式介面',en:'Application Programming Interface',abbr:'API',aliases:['API'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/API',note:'不同程式或服務之間約定好的操作與資料交換介面。'},
    {id:'payload',zh:'資料內容',en:'Payload',aliases:['payload','Payload'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages',note:'請求或訊息真正攜帶的資料內容。'},
    {id:'json',zh:'JSON 資料格式',en:'JavaScript Object Notation',abbr:'JSON',aliases:['JSON'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Core/Scripting/JSON',note:'常用於 API 傳輸結構化資料的文字格式。'},
    {id:'method',zh:'請求方法',en:'HTTP Method',aliases:['method','Method'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Methods',note:'描述 HTTP 請求想執行的動作，例如 GET、POST。'},
    {id:'headers',zh:'標頭',en:'Headers',aliases:['headers','Headers'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Headers',note:'HTTP 訊息中描述內容格式、驗證、快取等附加資訊的欄位。'},
    {id:'body',zh:'訊息本文',en:'Body',aliases:['body','Body'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages',note:'HTTP 請求或回應中實際承載資料的主要內容。'},
    {id:'routing',zh:'路由分派',en:'Routing',aliases:['routing','Routing'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes',note:'依網址與請求方法把請求交給正確的程式處理。'},
    {id:'session',zh:'登入工作階段',en:'Session',aliases:['Session','session'],url:'https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Cookies',note:'用來保存使用者登入或互動狀態的一段應用層資料。'},
    {id:'stateless',zh:'無狀態',en:'Stateless',aliases:['stateless','Stateless'],url:'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html',note:'處理目前請求時，不依賴某台伺服器本機保存的前一次請求狀態。'},
    {id:'protocol',zh:'通訊協定',en:'Protocol',aliases:['protocol','Protocol'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/Protocol',note:'通訊雙方共同遵守的資料交換規則。'},
    {id:'latency',zh:'延遲',en:'Latency',aliases:['Latency','latency'],url:'https://www.cloudflare.com/zh-tw/learning/performance/glossary/what-is-latency/',note:'從送出請求到收到結果所花的時間。'},
    {id:'p95-p99',zh:'第 95／99 百分位延遲',en:'P95/P99 Latency',aliases:['P95/P99 latency','P95/P99 Latency','P95 latency','P99 latency'],url:'https://sre.google/sre-book/monitoring-distributed-systems/',note:'用來觀察較慢那一群請求的延遲，比單看平均值更能反映尾端效能。'},
    {id:'request-rate',zh:'請求速率',en:'Request Rate',aliases:['Request Rate','request rate'],url:'https://sre.google/sre-book/monitoring-distributed-systems/',note:'系統每秒收到多少請求的流量指標。'},
    {id:'qps',zh:'每秒查詢數',en:'Queries Per Second',abbr:'QPS',aliases:['QPS'],url:'https://sre.google/sre-book/monitoring-distributed-systems/',note:'系統每秒需要處理多少次查詢或請求。'},
    {id:'memory',zh:'記憶體',en:'Memory',aliases:['memory','Memory','RAM'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/RAM',note:'程式執行時暫時保存資料的高速記憶空間。'},
    {id:'disk',zh:'磁碟儲存',en:'Disk',aliases:['Disk','disk'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Extensions/Server-side/First_steps/Website_security',note:'用來持久保存資料的儲存裝置。'},
    {id:'network',zh:'網路',en:'Network',aliases:['Network','network'],url:'https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work',note:'讓不同電腦彼此傳送資料的通訊環境。'},
    {id:'connection-pool',zh:'連線池',en:'Connection Pool',aliases:['connection pool','Connection Pool'],url:'https://learn.microsoft.com/zh-tw/dotnet/framework/data/adonet/sql-server-connection-pooling',note:'重複利用既有連線，避免每次請求都重新建立昂貴的資料庫或網路連線。'},
    {id:'endpoint',zh:'API 端點',en:'Endpoint',aliases:['endpoint','Endpoint'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/API',note:'API 對外提供某項操作的具體網址與介面。'},
    {id:'scale-up',zh:'垂直擴充',en:'Scale Up',aliases:['Scale Up','scale up'],url:'https://learn.microsoft.com/zh-tw/azure/architecture/framework/scalability/design-scale',note:'提升單一機器的 CPU、記憶體或其他硬體能力。'},
    {id:'scale-out',zh:'水平擴充',en:'Scale Out',aliases:['Scale Out','scale out'],url:'https://learn.microsoft.com/zh-tw/azure/architecture/framework/scalability/design-scale',note:'增加更多機器或服務實例來共同分擔流量。'},
    {id:'query',zh:'查詢',en:'Query',aliases:['query','Query'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/SQL',note:'向資料來源提出條件並取得所需資料的操作。'},
    {id:'lock',zh:'鎖定機制',en:'Lock',aliases:['lock','Lock'],url:'https://learn.microsoft.com/zh-tw/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide',note:'為避免多個操作同時修改共享資料而造成衝突的同步機制。'},
    {id:'baseline',zh:'基準狀態',en:'Baseline',aliases:['baseline','Baseline'],url:'https://sre.google/sre-book/monitoring-distributed-systems/',note:'系統在目前規模下的正常效能與容量基準，用來比較之後的變化。'},
    {id:'database',zh:'資料庫',en:'Database',aliases:['Database','database','DB'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/Database',note:'持久保存並查詢應用程式資料的系統。'},
    {id:'load-balancer',zh:'負載平衡器',en:'Load Balancer',aliases:['Load Balancer','load balancer'],url:'https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/',note:'把流量分配到多台伺服器，避免單一伺服器過載。'},
    {id:'health-check',zh:'健康檢查',en:'Health Check',aliases:['Health Check','health check'],url:'https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/',note:'定期確認後端伺服器是否仍能正常提供服務。'},
    {id:'failover',zh:'容錯移轉',en:'Failover',aliases:['Failover','failover'],url:'https://www.cloudflare.com/zh-tw/learning/performance/what-is-load-balancing/',note:'主要服務故障時，把流量切換到健康的備援服務。'},
    {id:'replication',zh:'資料複寫',en:'Replication',aliases:['Replication','replication'],url:'https://dev.mysql.com/doc/refman/8.4/en/replication.html',note:'把資料變更複製到其他資料庫節點，提高讀取能力或可靠性。'},
    {id:'cache-aside',zh:'旁路快取模式',en:'Cache-Aside',aliases:['Cache-Aside','cache-aside'],url:'https://learn.microsoft.com/zh-tw/azure/architecture/patterns/cache-aside',note:'先查快取；未命中時再查資料來源並把結果回填快取。'},
    {id:'cache',zh:'快取',en:'Cache',aliases:['Cache','cache'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/what-is-caching/',note:'暫時保存常用資料副本，讓後續請求更快取得結果。'},
    {id:'ttl',zh:'存留時間',en:'Time To Live',abbr:'TTL',aliases:['TTL'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/glossary/time-to-live-ttl/',note:'資料在快取、DNS 或網路中被視為有效並保留多久。'},
    {id:'hit-rate',zh:'快取命中率',en:'Cache Hit Rate',aliases:['Hit Rate','hit rate','Cache Hit Rate'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/what-is-caching/',note:'請求能直接從快取取得資料的比例。'},
    {id:'eviction',zh:'快取淘汰',en:'Eviction',aliases:['Eviction','eviction'],url:'https://redis.io/docs/latest/develop/reference/eviction/',note:'快取空間不足時，依策略移除部分資料。'},
    {id:'cold-start',zh:'冷啟動',en:'Cold Start',aliases:['Cold Start','cold start'],url:'https://aws.amazon.com/builders-library/caching-challenges-and-strategies/',note:'新節點或空快取啟動時，尚未累積常用資料的狀態。'},
    {id:'stale',zh:'過期但可用的舊資料',en:'Stale Data',aliases:['stale content','stale asset','stale','Stale'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/what-is-caching/',note:'資料仍可讀取，但已經不是最新版本。'},
    {id:'cdn',zh:'內容傳遞網路',en:'Content Delivery Network',abbr:'CDN',aliases:['CDN'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/',note:'利用分散在各地的節點，把內容從更靠近使用者的位置送出。'},
    {id:'edge',zh:'邊緣節點',en:'Edge',aliases:['Edge','edge'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/glossary/edge-server/',note:'靠近終端使用者的 CDN 或網路節點。'},
    {id:'origin',zh:'原始伺服器',en:'Origin',aliases:['Origin','origin'],url:'https://www.cloudflare.com/zh-tw/learning/cdn/glossary/origin-server/',note:'保存原始內容或真正處理請求的來源伺服器。'},
    {id:'sticky-session',zh:'黏性工作階段',en:'Sticky Session',aliases:['Sticky Session','sticky session'],url:'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html#sticky-sessions',note:'讓同一使用者的請求固定送到同一台伺服器。'},
    {id:'auto-scaling',zh:'自動擴縮',en:'Auto Scaling',aliases:['Auto Scaling','auto scaling'],url:'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html',note:'依負載自動增加或減少服務實例。'},
    {id:'message-queue',zh:'訊息佇列',en:'Message Queue',aliases:['Message Queue','message queue','Queue'],url:'https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',note:'在生產者與消費者之間暫存工作或訊息，讓兩側能非同步處理。'},
    {id:'producer',zh:'生產者',en:'Producer',aliases:['Producer','producer'],url:'https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',note:'把工作或訊息送入佇列的一方。'},
    {id:'consumer',zh:'消費者',en:'Consumer',aliases:['Consumer','consumer'],url:'https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',note:'從佇列取出訊息並執行工作的服務。'},
    {id:'backlog',zh:'待處理工作堆積',en:'Backlog',aliases:['Backlog','backlog'],url:'https://docs.aws.amazon.com/zh_tw/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',note:'尚未被處理完成、仍留在系統中的工作量。'},
    {id:'idempotency',zh:'冪等性',en:'Idempotency',aliases:['Idempotency','idempotent','Idempotent'],url:'https://developer.mozilla.org/zh-TW/docs/Glossary/Idempotent',note:'同一操作重複執行多次，最終副作用仍與執行一次相同。'},
    {id:'observability',zh:'可觀測性',en:'Observability',aliases:['Observability','observability'],url:'https://opentelemetry.io/docs/concepts/observability-primer/',note:'利用日誌、指標與追蹤資料推理系統內部狀態的能力。'},
    {id:'sharding',zh:'資料分片',en:'Sharding',aliases:['Sharding','sharding'],url:'https://www.mongodb.com/docs/manual/sharding/',note:'把大型資料集與流量拆分到多個資料節點。'},
    {id:'shard-key',zh:'分片鍵',en:'Shard Key',aliases:['Shard Key','shard key'],url:'https://www.mongodb.com/docs/manual/core/sharding-shard-key/',note:'決定某筆資料應該被分配到哪個資料分片的欄位。'},
    {id:'hotspot',zh:'熱點問題',en:'Hotspot',aliases:['Hotspot','hotspot','hot key','Hot Key'],url:'https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/',note:'流量過度集中在少數資料、分片或機器上的不均衡問題。'}
  ];

  const external = Array.isArray(window.SYSTEM_DESIGN_GLOSSARY) ? window.SYSTEM_DESIGN_GLOSSARY : [];
  const byId = new Map();
  [...CORE_TERMS, ...external].forEach(term => byId.set(term.id, term));
  const glossary = [...byId.values()];

  const entries = glossary.flatMap(term => (term.aliases || []).map(alias => ({ term, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const isWordChar = ch => !!ch && /[A-Za-z0-9_]/.test(ch);
  const boundaryOk = (text, start, len) => {
    const before = text[start - 1], after = text[start + len];
    const first = text[start], last = text[start + len - 1];
    if (isWordChar(first) && isWordChar(before)) return false;
    if (isWordChar(last) && isWordChar(after)) return false;
    return true;
  };

  const label = term => term.abbr ? `${term.zh}（${term.en}, ${term.abbr}）` : `${term.zh}（${term.en}）`;

  function findNext(text, from) {
    let best = null;
    for (const entry of entries) {
      let idx = text.indexOf(entry.alias, from);
      while (idx >= 0 && !boundaryOk(text, idx, entry.alias.length)) idx = text.indexOf(entry.alias, idx + 1);
      if (idx < 0) continue;
      if (!best || idx < best.index || (idx === best.index && entry.alias.length > best.entry.alias.length)) best = { index: idx, entry };
    }
    return best;
  }

  function transformTextNode(node, context) {
    const text = node.nodeValue || '';
    if (!text.trim()) return;
    let cursor = 0, hit = false;
    const frag = document.createDocumentFragment();

    while (cursor < text.length) {
      const found = findNext(text, cursor);
      if (!found) break;
      hit = true;
      if (found.index > cursor) frag.append(document.createTextNode(text.slice(cursor, found.index)));
      const { term, alias } = found.entry;
      const first = !context.seen.has(term.id);
      if (first) context.seen.add(term.id);

      if (context.allowLinks && first && term.url) {
        const a = document.createElement('a');
        a.className = 'book-term-link';
        a.href = term.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = label(term);
        a.title = `${term.note || ''}（開啟外部說明）`;
        const mark = document.createElement('sup');
        mark.textContent = '↗';
        a.append(mark);
        frag.append(a);
      } else {
        const span = document.createElement('span');
        span.className = 'book-term-plain';
        span.textContent = first ? label(term) : term.zh;
        span.title = `${label(term)}：${term.note || ''}`;
        frag.append(span);
      }
      cursor = found.index + alias.length;
    }

    if (!hit) return;
    if (cursor < text.length) frag.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(frag);
  }

  function processRoot(root, { allowLinks = false, seen = new Set() } = {}) {
    if (!root) return seen;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script,style,pre,code,a,.book-term-link,.book-term-plain,.book-term-legend')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => transformTextNode(node, { allowLinks, seen }));
    return seen;
  }

  function addLegend(page) {
    if (!page || page.querySelector('.book-term-legend')) return;
    const legend = document.createElement('div');
    legend.className = 'book-term-legend';
    legend.innerHTML = '<strong>📘 專有名詞閱讀方式</strong><span>第一次出現會顯示「中文（English／縮寫）」；看到 <b>↗</b> 可直接開啟外部說明。後面重複出現時以中文為主。</span>';
    page.insertBefore(legend, page.children[1] || null);
  }

  function run() {
    const page = document.querySelector('.book-page');
    if (page) {
      addLegend(page);
      processRoot(page, { allowLinks: true, seen: new Set() });
    }
    [document.querySelector('.book-course-header'), document.querySelector('.book-section-header'), document.querySelector('.book-section-nav'), document.querySelector('.book-section-quiz'), document.querySelector('#bookExamRoot')]
      .forEach(root => processRoot(root, { allowLinks: false, seen: new Set() }));
  }

  // book renderer 目前是同步建立內容；立即執行，再補一個下一個 frame 的保險。
  run();
  requestAnimationFrame(run);
})();
