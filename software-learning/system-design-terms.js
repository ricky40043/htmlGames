(() => {
  'use strict';

  const BUILTIN_TERMS = [
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
    ['hotspot','熱點問題','Hotspot',['Hotspot','hotspot','hot key'],'少數資料或節點承受過多流量的失衡現象。','https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/'],
    ['read','讀取','Read',['Read','read','reads'],'從系統取得資料的操作。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Methods/GET'],
    ['write','寫入','Write',['Write','write','writes'],'把資料新增或修改到系統的操作。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Methods/POST'],
    ['update','更新','Update',['Update','update','updates'],'把既有資料改成新狀態的操作。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Methods/PUT'],
    ['invalidate','使失效','Invalidate',['Invalidate','invalidate','Invalidation','invalidation'],'讓原本可使用的快取或資料版本不再被採用。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control'],
    ['race-condition','競爭條件','Race Condition',['Race Condition','race condition'],'多個操作的先後順序不同，造成結果不一致的問題。','https://en.wikipedia.org/wiki/Race_condition'],
    ['failure-mode','故障模式','Failure Mode',['Failure Mode','failure mode'],'系統可能發生的一種故障方式與它造成的影響。','https://learn.microsoft.com/zh-tw/azure/well-architected/reliability/failure-mode-analysis'],
    ['deployment','部署','Deployment',['Deployment','deployment'],'把程式與設定發布到可以提供服務的環境。','https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_model_deployment.html'],
    ['iac','基礎設施即程式碼','Infrastructure as Code (IaC)',['IaC','Infrastructure as Code','infrastructure as code'],'用可審查、可重複執行的程式碼描述環境與基礎設施。','https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html'],
    ['infrastructure','基礎設施','Infrastructure',['Infrastructure','infrastructure'],'提供服務執行所需的主機、網路、儲存與相關資源。','https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html'],
    ['source-of-truth','唯一可信來源','Source of Truth',['source of truth','Source of Truth'],'在資料衝突時，應以哪個系統保存的結果為準。','https://martinfowler.com/eaaDev/DistributionPattern.html'],
    ['data-consistency','資料一致性','Data Consistency',['data consistency','Data Consistency','consistency'],'不同副本或不同讀取者看到的資料，是否符合系統承諾的規則。','https://jepsen.io/consistency'],
    ['region','區域','Region',['Region','region'],'雲端服務或資料中心所在的地理區域。','https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html'],
    ['active-active','雙活部署','Active-Active',['Active-Active','active-active'],'多個區域同時接收流量並提供服務的部署方式。','https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_multiaz_regions.html'],
    ['geo-routing','地理位置路由','Geo Routing',['Geo Routing','geo routing'],'依使用者位置或區域把請求導向適合的服務入口。','https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html'],
    ['cold-start','冷啟動','Cold Start',['Cold Start','cold start'],'快取或工作者剛啟動、尚未累積資料時的初始狀態。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['stale','過期但仍存在','Stale',['stale','Stale'],'資料還存在，但已超過可接受的新鮮期限。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['traffic-distribution','流量分布','Traffic Distribution',['traffic distribution','Traffic Distribution'],'請求在不同使用者、路徑、節點或區域之間的分配情況。','https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_multiaz_regions.html'],
    ['warm-up','預熱','Warm-up',['warm-up','warm up','Warm-up'],'在正式承接大量流量前，先建立快取或逐步增加工作量。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['coalescing','請求合併','Coalescing',['coalescing','request coalescing'],'讓同一筆尚未完成的工作由多個請求共同等待，避免重複打下游。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['rate-limiting','限速','Rate Limiting',['rate limiting','Rate Limiting'],'限制一段時間內可以通過的請求數量。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/'],
    ['load-shedding','負載丟棄','Load Shedding',['load shedding','Load Shedding'],'系統過載時主動拒絕低優先級工作，保住核心功能。','https://sre.google/sre-book/handling-overload/'],
    ['downstream','下游服務','Downstream',['downstream','Downstream'],'目前服務呼叫的下一層服務或資料來源。','https://sre.google/sre-book/handling-overload/'],
    ['cache-miss','快取未命中','Cache Miss',['Cache Miss','cache miss','cache misses'],'快取找不到可直接使用的資料，必須回到來源查詢。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['cache-hit','快取命中','Cache Hit',['Cache Hit','cache hit','cache hits'],'快取已有可直接回傳的資料。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['hit-rate','命中率','Hit Rate',['Hit Rate','hit rate'],'所有查詢中可以直接由快取回覆的比例。','https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    ['fleet','服務叢集','Fleet',['Fleet','fleet'],'一組共同提供同一服務的機器或服務實例。','https://sre.google/sre-book/handling-overload/'],
    ['cascading-failure','連鎖故障','Cascading Failure',['Cascading Failure','cascading failure'],'一個元件變慢或故障，壓力沿著依賴鏈擴散，最後拖垮更多元件。','https://sre.google/sre-book/handling-overload/'],
    ['deployment-region','部署區域','Deployment Region',['Deployment Region','deployment region'],'程式或基礎設施實際發布與運作的地理區域。','https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html'],
    ['data','資料','Data',['Data','data'],'系統要保存、讀取或傳送的資訊。','https://developer.mozilla.org/zh-TW/docs/Glossary/Data'],
    ['user','使用者','User',['User','user','users'],'使用產品或觸發請求的人。','https://developer.mozilla.org/zh-TW/docs/Glossary/User_agent'],
    ['network-partition','網路分割','Network Partition',['Network Partition','network partition'],'系統節點彼此暫時無法通訊，但各自可能仍在運作。','https://en.wikipedia.org/wiki/Network_partition'],
    ['eventual-consistency','最終一致性','Eventual Consistency',['eventual consistency','Eventual Consistency'],'停止更新並等待同步後，不同副本最終會收斂到同一結果。','https://jepsen.io/consistency/models/eventual-consistency'],
    ['deployment-automation','部署自動化','Deployment Automation',['Deployment Automation','deployment automation'],'用固定流程自動建立、更新與驗證服務環境。','https://sre.google/sre-book/release-engineering/'],
    ['write-amplification','寫入放大','Write Amplification',['write amplification','Write Amplification'],'一次邏輯寫入因複寫、索引或粉絲分發而變成多次實體寫入。','https://martinfowler.com/bliki/WriteAmplification.html'],
    ['read-heavy','讀取為主','Read-heavy',['read-heavy','read heavy','Read-heavy'],'讀取量明顯高於寫入量的工作負載。','https://aws.amazon.com/tw/caching/'],
    ['read-write','讀寫','Read/Write',['Read/Write','read/write','read-write'],'同時包含讀取與寫入的操作或流量。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Methods'],
    ['full-text-search','全文搜尋','Full-text Search',['Full-text Search','full-text search'],'在文件內容中尋找相關文字，而不是只比對前綴。','https://developer.mozilla.org/en-US/docs/Web/API/Window/find'],
    ['autocomplete','自動補全','Autocomplete',['Autocomplete','autocomplete'],'使用者輸入一部分文字時，立即提供可能的完整建議。','https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist'],
    ['deployment-iac','部署與基礎設施程式碼','Deployment / IaC',['Deployment / IaC','deployment / iac'],'以自動化部署與程式碼化基礎設施降低手動設定差異。','https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html'],
    ['write-source','寫入來源','Write Source',['Write Source','write source'],'負責接收並保存原始資料變更的服務。','https://sre.google/sre-book/handling-overload/']
    ,['web','網頁','Web',['Web','web'],'透過網路提供的頁面或服務。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works']
    ,['mobile','行動裝置','Mobile',['Mobile','mobile'],'可攜式的手機或平板裝置。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP']
    ,['network','網路','Network',['Network','network'],'讓不同裝置或服務互相傳送資料的連線系統。','https://developer.mozilla.org/zh-TW/docs/Glossary/Network']
    ,['url','網址','URL',['URL','url'],'用來定位網路資源的地址。','https://developer.mozilla.org/zh-TW/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL']
    ,['html','HTML 標記語言','HTML',['HTML','html'],'描述網頁結構的標記語言。','https://developer.mozilla.org/zh-TW/docs/Web/HTML']
    ,['css','CSS 樣式語言','CSS',['CSS','css'],'描述網頁外觀與版面的樣式語言。','https://developer.mozilla.org/zh-TW/docs/Web/CSS']
    ,['javascript','JavaScript 程式語言','JavaScript',['JavaScript','javascript'],'在瀏覽器或伺服器執行互動與邏輯的程式語言。','https://developer.mozilla.org/zh-TW/docs/Web/JavaScript']
    ,['kubernetes','容器編排平台','Kubernetes',['Kubernetes','K8s'],'管理與部署容器化服務的平台。','https://kubernetes.io/docs/concepts/overview/']
    ,['cpu','處理器','CPU',['CPU','cpu'],'執行程式指令與計算工作的硬體資源。','https://developer.mozilla.org/en-US/docs/Glossary/CPU']
    ,['ram','記憶體','RAM',['RAM','ram'],'暫時保存正在執行的程式與資料的記憶體。','https://developer.mozilla.org/en-US/docs/Glossary/RAM']
    ,['disk','磁碟','Disk',['Disk','disk'],'保存檔案與持久資料的儲存裝置。','https://developer.mozilla.org/en-US/docs/Glossary/Hard_drive']
    ,['rate-limiter','限速器','Rate Limiter',['Rate Limiter','rate limiter','Limiter','limiter'],'依規則判斷請求要放行、延後或拒絕的元件。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['rate-limit-rule','限速規則','Rate Limit',['Rate Limit','rate limit','rate-limit'],'描述一段時間內最多允許多少請求的規則。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['limit','限制','Limit',['Limit','limit'],'系統允許的數量或速度上限。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['counter','計數器','Counter',['Counter','counter'],'累計某個使用者、位址或資源已使用次數的資料。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['identity','身分','Identity',['Identity','identity'],'用來辨認請求來源的使用者、IP、API 金鑰或租戶。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['dimension','限制維度','Dimension',['Dimension','dimension'],'決定限速要依哪個欄位分組計算。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['identity-dimension','身分與限制維度','Identity / Dimension',['Identity / Dimension','identity / dimension'],'先決定要辨認誰，以及限速要依什麼欄位分組。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['non-functional','非功能需求','Non-functional',['Non-functional','non-functional','Non-functional Requirements','non-functional requirements'],'描述延遲、可用性、容量、成本與安全等品質要求。','https://aws.amazon.com/tw/architecture/well-architected/']
    ,['failure-policy','故障策略','Failure Policy',['failure policy','Failure Policy'],'元件故障時，事先決定要放行、拒絕、降級或暫停工作的行為。','https://sre.google/sre-book/handling-overload/']
    ,['distributed','分散式','Distributed',['Distributed','distributed'],'工作或資料分布在多台機器或多個服務上。','https://sre.google/sre-book/']
    ,['actor','請求發起者','Actor',['Actor','actor'],'在系統中發起操作的使用者、服務或其他主體。','https://developer.mozilla.org/zh-TW/docs/Glossary/Actor']
    ,['resource','資源','Resource',['Resource','resource'],'會被請求消耗或占用的能力，例如 CPU、資料庫連線或供應商額度。','https://sre.google/sre-book/handling-overload/']
    ,['tenant','租戶','Tenant',['Tenant','tenant'],'共用平台中的一個客戶、組織或隔離使用者群組。','https://learn.microsoft.com/zh-tw/azure/architecture/guide/multitenant/overview']
    ,['shared','共用','Shared',['Shared','shared'],'由多個使用者、服務或工作共同使用的資源。','https://sre.google/sre-book/handling-overload/']
    ,['key','鍵','Key',['key','Key','keys'],'用來定位資料或限速狀態的識別值。','https://redis.io/docs/latest/develop/data-types/']
    ,['quota','配額','Quota',['Quota','quota'],'某個使用者、租戶或服務在一段時間內可使用的上限。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['fairness','公平性','Fairness',['Fairness','fairness'],'避免單一使用者占滿共用能力，讓不同使用者依規則取得資源。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['cost-guardrail','成本防線','Cost Guardrail',['Cost guardrail','cost guardrail'],'限制按次計費或昂貴外部服務的使用量，避免成本失控。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['overload-protection','過載保護','Overload Protection',['Overload protection','overload protection'],'系統接近容量上限時先拒絕部分工作，避免整體失效。','https://sre.google/sre-book/handling-overload/']
    ,['application-level','應用層','Application-level',['Application-level','application-level'],'在應用程式邏輯內執行的規則，而不是網路設備層的規則。','https://redis.io/docs/latest/develop/use-cases/rate-limiter/']
    ,['volumetric','流量型','Volumetric',['volumetric','Volumetric'],'以大量網路流量為主的攻擊或負載型態。','https://www.cloudflare.com/zh-tw/learning/ddos/what-is-a-ddos-attack/']
    ,['waf','網頁應用程式防火牆','Web Application Firewall (WAF)',['WAF','Web Application Firewall','web application firewall'],'在請求進入應用程式前，依規則攔截可疑網路流量的防護層。','https://www.cloudflare.com/zh-tw/learning/ddos/glossary/web-application-firewall-waf/']
    ,['ddos','分散式阻斷服務攻擊','Distributed Denial of Service (DDoS)',['DDoS','ddos'],'由大量來源同時送出流量，消耗服務容量的攻擊。','https://www.cloudflare.com/zh-tw/learning/ddos/what-is-a-ddos-attack/']
    ,['dos','阻斷服務攻擊','Denial of Service (DoS)',['DoS','dos'],'透過大量或特殊請求讓服務無法正常提供服務的攻擊。','https://www.cloudflare.com/zh-tw/learning/ddos/glossary/denial-of-service/']
    ,['llm','大型語言模型','Large Language Model (LLM)',['LLM','llm'],'能處理與產生文字的機器學習模型服務。','https://platform.openai.com/docs/overview']
    ,['step','步驟','Step',['Step','step'],'學習或流程中的一個階段。','https://sre.google/sre-book/']
    ,['policy','策略','Policy',['Policy','policy'],'在不同情況下決定系統行為的規則。','https://sre.google/sre-book/handling-overload/']
    ,['capacity','容量','Capacity',['Capacity','capacity'],'系統在符合服務目標下能承受的工作量上限。','https://sre.google/sre-book/handling-overload/']
    ,['requirement','需求','Requirement',['Requirement','requirement','Requirements','requirements'],'系統必須提供的功能或品質條件。','https://aws.amazon.com/tw/architecture/well-architected/']
    ,['flow','流程','Flow',['Flow','flow'],'從輸入到輸出的完整處理路徑。','https://sre.google/sre-book/']
    ,['source','來源','Source',['Source','source'],'資料或請求最初產生的地方。','https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Messages']
  ].map(([id, zh, en, aliases, note, url]) => ({ id, zh, en, aliases, note, url }));

  // 教材中的流程圖與題目常用短英文標籤；它們不是新概念，直接換成白話中文。
  const PLAIN_ENGLISH_TERMS = [
    ['url','網址',['URL','url']], ['token','令牌',['token','Token','tokens','Tokens']],
    ['state','狀態',['state','State']], ['rate','速率',['rate','Rate']],
    ['metadata','中繼資料',['metadata','Metadata']], ['path','路徑',['path','Path']],
    ['durable','持久的',['durable','Durable']], ['retry','重試',['retry','Retry','retries','Retries']],
    ['node','節點',['node','Node','nodes','Nodes']], ['post','貼文',['post','Post','posts','Posts']],
    ['code','程式碼',['code','Code']], ['hash','雜湊',['hash','Hash']],
    ['range','範圍',['range','Range','ranges','Ranges']], ['local','本機的',['local','Local']],
    ['content','內容',['content','Content']], ['worker','工作者',['worker','Worker','workers','Workers']],
    ['hot','熱門的',['hot','Hot']], ['count','數量',['count','Count']],
    ['provider','供應商',['provider','Provider','providers','Providers']],
    ['redirect','重新導向',['redirect','Redirect','redirects','Redirects']],
    ['bytes','位元組',['bytes','Bytes']], ['version','版本',['version','Version','versions','Versions']],
    ['event','事件',['event','Event','events','Events']], ['sequence','序列',['sequence','Sequence']],
    ['budget','預算',['budget','Budget']], ['mapping','映射',['mapping','Mapping']],
    ['peak','尖峰',['peak','Peak']], ['fanout','分發',['fanout','Fanout']],
    ['ownership','負責歸屬',['ownership','Ownership']], ['ids','識別碼',['IDs','ids']],
    ['service','服務',['service','Service','services','Services']], ['global','全域的',['global','Global']],
    ['partition','分區',['partition','Partition','partitions','Partitions']],
    ['replicas','副本',['replicas','Replicas']], ['shard','分片',['shard','Shard','shards','Shards']],
    ['index','索引',['index','Index','indexes','Indexes']], ['lag','落後量',['lag','Lag']],
    ['size','大小',['size','Size']], ['scope','範圍',['scope','Scope']],
    ['window','窗口',['window','Window','windows','Windows']], ['crash','崩潰',['crash','Crash']],
    ['coordination','協調',['coordination','Coordination']], ['availability','可用性',['availability','Availability']],
    ['file','檔案',['file','File','files','Files']], ['raw','原始的',['raw','Raw']],
    ['collision','碰撞',['collision','Collision']], ['clock','時鐘',['clock','Clock']],
    ['sync','同步',['sync','Sync']], ['push','推送',['push','Push']],
    ['buffer','緩衝區',['buffer','Buffer']], ['order','順序',['order','Order']],
    ['host','主機',['host','Host','hosts','Hosts']], ['conflict','衝突',['conflict','Conflict']],
    ['amplification','放大',['amplification','Amplification']], ['device','裝置',['device','Device','devices','Devices']],
    ['dependency','依賴',['dependency','Dependency','dependencies','Dependencies']],
    ['age','年齡',['age','Age']], ['store','儲存區',['store','Store']],
    ['dau','每日活躍使用者',['DAU']], ['model','模型',['model','Model']],
    ['priority','優先級',['priority','Priority']], ['analytics','分析資料',['analytics','Analytics']],
    ['timeline','時間線',['timeline','Timeline']], ['throughput','吞吐量',['throughput','Throughput']],
    ['delivery','送達',['delivery','Delivery']], ['error','錯誤',['error','Error','errors','Errors']],
    ['egress','輸出流量',['egress','Egress']], ['offline','離線',['offline','Offline']],
    ['burst','突發流量',['burst','Burst']], ['hashing','雜湊處理',['hashing','Hashing']],
    ['follower','追蹤者',['follower','Follower','followers','Followers']],
    ['revision','修訂版本',['revision','Revision']], ['status','狀態',['status','Status']],
    ['pool','資源池',['pool','Pool']], ['durability','持久性',['durability','Durability']],
    ['outage','服務中斷',['outage','Outage']], ['constraint','限制條件',['constraint','Constraint','constraints','Constraints']],
    ['pattern','模式',['pattern','Pattern']], ['ownership-model','負責方式',['ownership model','Ownership Model']],
    ['access','存取',['access','Access']], ['message','訊息',['message','Message','messages','Messages']],
    ['query-log','查詢紀錄',['Query Log','query log']], ['frequency','頻率',['frequency','Frequency']],
    ['prefix','前綴',['prefix','Prefix']], ['ranking','排名',['ranking','Ranking']],
    ['object-storage','物件儲存',['Object Storage','object storage']], ['upload','上傳',['upload','Upload']],
    ['download','下載',['download','Download']], ['playback','播放',['playback','Playback']],
    ['streaming','串流播放',['streaming','Streaming']], ['quality','品質',['quality','Quality']],
    ['folder','資料夾',['folder','Folder','folders','Folders']], ['share','分享',['share','Share']],
    ['permission','權限',['permission','Permission','permissions','Permissions']],
    ['polling','輪詢',['polling','Polling']], ['websocket','WebSocket 連線',['WebSocket','websocket']],
    ['presence','在線狀態',['presence','Presence']], ['history','歷史紀錄',['history','History']],
    ['short','短的',['short','Short']], ['long','長的',['long','Long']],
    ['failure','故障',['failure','Failure','failures','Failures']], ['success','成功',['success','Success']],
    ['load','負載',['load','Load']], ['scale','擴充',['scale','Scale']],
    ['storage','儲存空間',['storage','Storage']], ['memory','記憶體',['memory','Memory']],
    ['queue','佇列',['queue','Queue','queues','Queues']], ['cache-word','快取',['cache','Cache']],
    ['consistency','一致性',['consistency','Consistency']], ['replication-word','複寫',['replication','Replication']],
    ['request-word','請求',['request','Request','requests','Requests']], ['response-word','回應',['response','Response','responses','Responses']],
    ['client-word','用戶端',['client','Client','clients','Clients']], ['server-word','伺服器',['server','Server','servers','Servers']],
    ['user-word','使用者',['user','User','users','Users']], ['query-word','查詢',['query','Query','queries','Queries']],
    ['read-word','讀取',['read','Read','reads','Reads']], ['write-word','寫入',['write','Write','writes','Writes']],
    ['update-word','更新',['update','Update','updates','Updates']], ['stateful','有狀態的',['stateful','Stateful']],
    ['stateless-word','無狀態的',['stateless','Stateless']], ['durable-word','持久的',['durable','Durable']],
    ['endpoint-word','端點',['endpoint','Endpoint','endpoints','Endpoints']], ['global-word','全域的',['global','Global']],
    ['local-word','本機的',['local','Local']], ['origin-word','來源',['origin','Origin']],
    ['edge-word','邊緣節點',['edge','Edge']], ['store-word','儲存區',['store','Store']],
    ['request-method','請求方法',['HTTP Method','Request Method']], ['method-word','方法',['method','Method']],
    ['headers-word','標頭',['headers','Headers']], ['body-word','本文',['body','Body']],
    ['region-word','區域',['region','Region','regions','Regions']], ['multi-region','多區域',['multi-region','Multi-region','multi region','Multi Region']],
    ['multi-device','多裝置',['multi-device','Multi-device','multi device','Multi Device']],
    ['full-text','全文',['full-text','Full-text']], ['search','搜尋',['search','Search']],
    ['channel','通道',['channel','Channel','channels','Channels']], ['notification','通知',['notification','Notification','notifications','Notifications']],
    ['id-word','識別碼',['ID','id']], ['ip-address','IP 位址',['IP']],
    ['payment','付款',['Payment','payment']], ['fail-closed','故障時拒絕',['fail-closed','Fail-closed']],
    ['fail-open','故障時放行',['fail-open','Fail-open']], ['conservative-fallback','保守降級',['conservative fallback','Conservative fallback']],
    ['authentication','身分驗證',['authentication','Authentication']], ['auth','身分驗證',['Auth','auth']],
    ['login','登入',['Login','login']], ['instance','服務實例',['instance','Instance','instances','Instances']],
    ['table','資料表',['table','Table','tables','Tables']], ['name','名稱',['name','Name']],
    ['css-class','樣式類別',['CSS class','css class']], ['ui','使用者介面',['UI','ui']],
    ['lb','負載平衡器',['LB']], ['async','非同步',['async','Async']],
    ['limit-key','限制鍵',['limit key','Limit key']], ['shared-state','共用狀態',['shared state','Shared state']],
    ['fallback','降級方案',['fallback','Fallback']], ['conservative','保守的',['conservative','Conservative']],
    ['instance-state','實例狀態',['instance state','Instance state']]
  ].map(([id, zh, aliases]) => ({ id, zh, en: aliases[0], aliases, note: '', url: '' }));

  const glossaryTerms = (window.SYSTEM_DESIGN_GLOSSARY || []).map(term => ({
    ...term,
    en: term.abbr ? `${term.en}／${term.abbr}` : term.en,
    aliases: [...new Set([...(term.aliases || []), term.en, term.abbr].filter(Boolean))]
  }));
  const termsById = new Map();
  [...glossaryTerms, ...BUILTIN_TERMS, ...PLAIN_ENGLISH_TERMS].forEach(term => {
    if (!termsById.has(term.id)) termsById.set(term.id, term);
  });
  const TERMS = [...termsById.values()];

  const entries = TERMS.flatMap(term => term.aliases.map(alias => ({ term, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const isWord = ch => !!ch && /[A-Za-z0-9_]/.test(ch);
  const boundaryOk = (text, start, len) => {
    const first = text[start], last = text[start + len - 1];
    if (isWord(first) && isWord(text[start - 1])) return false;
    if (isWord(last) && isWord(text[start + len])) return false;
    return true;
  };

  // Editorial content may already contain a deliberate form such as
  // 「存留時間（TTL）」 or 「資料庫（Database）」。Do not wrap that alias again.
  const alreadyLocalized = (text, index, term) => {
    const before = text.slice(0, index).replace(/\s+$/, '');
    return before.endsWith(`${term.zh}（`) || before.endsWith(`${term.zh}(`);
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

  function replaceTextNode(node, seen, showEnglish) {
    const text = node.nodeValue || '';
    if (!text.trim()) return;
    const frag = document.createDocumentFragment();
    let cursor = 0, changed = false;

    while (cursor < text.length) {
      const found = nextMatch(text, cursor);
      if (!found) break;
      const { term, alias } = found.entry;
      if (alreadyLocalized(text, found.index, term)) {
        if (found.index > cursor) frag.append(document.createTextNode(text.slice(cursor, found.index)));
        frag.append(document.createTextNode(text.slice(found.index, found.index + alias.length)));
        cursor = found.index + alias.length;
        continue;
      }
      changed = true;
      if (found.index > cursor) frag.append(document.createTextNode(text.slice(cursor, found.index)));
      const first = !seen.has(term.id);
      seen.add(term.id);
      const label = `${term.zh}（${term.en}）`;
      const span = document.createElement('span');
      span.className = 'book-term-plain';
      span.textContent = showEnglish && first ? label : term.zh;
      frag.appendChild(span);
      cursor = found.index + alias.length;
    }

    if (!changed) return;
    if (cursor < text.length) frag.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(frag);
  }

  function process(root, seen, showEnglish, skipQuiz = false) {
    if (!root) return;
    const skipAnchors = !root.classList?.contains('book-section-nav') && !root.classList?.contains('book-page-controls') && !root.classList?.contains('book-roadmap-list');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el || el.closest(`script,style,pre,code${skipAnchors ? ',a' : ''}`) || (skipQuiz && el.closest('.book-section-quiz'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => replaceTextNode(node, seen, showEnglish));
  }

  function run() {
    const page = document.querySelector('.book-page');
    const exam = document.querySelector('.book-exam-shell');
    if (!page && !exam) return;

    const seen = new Set();
    const panel = document.querySelector('.book-content-panel') || exam || page;
    // 教材正文以中文為主；英文只保留在程式碼、公式或必要的原始縮寫裡。
    process(panel, seen, false, true);
    document.querySelectorAll('.book-section-quiz').forEach(quiz => process(quiz, new Set(), false));
    document.querySelectorAll('.book-roadmap-list').forEach(roadmap => process(roadmap, new Set(), false));
    process(document.querySelector('.book-section-nav'), new Set(), false);
    document.querySelectorAll('.book-page-controls').forEach(control => process(control, new Set(), false));
    process(document.querySelector('.book-course-header'), new Set(), false);
  }

  window.refreshBookTerms = run;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
