(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_09;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd9-s05',order:5,title:'Robots.txt、Politeness 與 Crawl Policy',duration:'34–48 分鐘',summary:'依 RFC 9309 理解 Robots Exclusion Protocol，並把 robots 規則與 host-level pacing 合併成可執行 policy。',
 research:[
  {label:'RFC 9309 — Robots Exclusion Protocol',url:'https://www.rfc-editor.org/rfc/rfc9309.html'},
  {label:'Google Crawling Infrastructure',url:'https://developers.google.com/crawling/docs/about-crawling'}
 ],
 pages:[
  {id:'sd9-s05-p01',title:'robots.txt 是標準協議，不是「SEO 建議」',blocks:[
   {type:'lead',text:'Robots Exclusion Protocol 讓網站發布 crawler access rules。Crawler 在抓站點內容前應先取得與解析 robots.txt，並依 user-agent group 判斷 path 是否允許。'},
   {type:'callout',title:'安全邊界',text:'robots.txt 不是 authentication/authorization。被 Disallow 的 URL 仍可能公開可存取；它只是 crawler 行為協議。'}
  ]},
  {id:'sd9-s05-p02',title:'Robots Policy 要 Cache，但不能永遠不更新',blocks:[
   {type:'stepper',steps:[['Fetch policy','先取得 /robots.txt。'],['Parse','依 user-agent 與 allow/disallow 規則建立 policy。'],['Cache','避免每抓一頁都重抓 robots。'],['Refresh','依 TTL/錯誤政策更新，避免永久使用過期規則。']]},
   {type:'p',text:'若每個 URL 都先同步抓一次 robots.txt，會把網站負載與 crawler latency 都放大。正確做法是 per-host policy cache + refresh。'}
  ]},
  {id:'sd9-s05-p03',title:'Politeness 不只有 robots',blocks:[
   {type:'bullets',items:['Per-host concurrency limit：同站同時抓幾條 connection。','Minimum delay / next-allowed-time：同 host request 間隔。','Adaptive backoff：遇 429、503、timeout 時降低抓取速率。','Host health：連續失敗可暫停排程。']},
   {type:'callout',title:'重點',text:'即使 robots.txt 沒有限制，也不代表你可以無限並行。Politeness 是 scheduler responsibility。'}
  ]}],
 quiz:[
  MC('sd9-s05-q1','robots.txt 的正確定位？','sd9-s05-p01','它是 crawler access policy 協議，不是網站真正的權限控制。','網站用來告知 crawler 哪些路徑可/不可抓的協議。',[["Authentication 機制","Disallow 不會阻止一般 client 直接存取。"],["TLS replacement","完全不同層。"],["資料庫 ACL","不是。"]]),
  MC('sd9-s05-q2','為什麼 robots policy 適合 cache？','sd9-s05-p02','避免對同 host 每個 URL 都重新抓 robots，降低額外 latency 與負載。','同一 host 大量 URL 可共用 policy，減少重複 fetch。',[["因為 robots 永遠不會改","它可能更新。"],["因為 crawler 不需 refresh","長期使用過期 policy 不安全。"],["因為 DNS 會代替 robots","不同功能。"]]),
  MC('sd9-s05-q3','網站 robots 允許抓取，crawler 是否可瞬間 1000 並發打同 host？','sd9-s05-p03','不應；politeness 還需 host-level pacing 與 adaptive backoff。','不應，仍要遵守自己的 host concurrency / request pacing。',[["可以，Allow 等於無限速率","把 path permission 誤解成容量授權。"],["一定只能每小時一頁","也沒有固定萬用數字。"],["只看 global QPS 即可","會忽略單站負載。"]]),
  MC('sd9-s05-q4','連續收到 429/503，最成熟的 crawler 行為？','sd9-s05-p03','應降低該 host crawl rate 並 backoff，而不是持續重試放大壓力。','對該 host 做 exponential/backoff 或延後 next-allowed-time。',[["立即提高並行度","會加劇壓力。"],["刪除所有 frontier","過度。"],["忽略 status code","會失去 robustness/politeness。"]])
 ]
},
{
 id:'sd9-s06',order:6,title:'HTML Downloader：DNS、Timeout、Redirect 與 Freshness',duration:'38–52 分鐘',summary:'把 Downloader 當成高風險 network subsystem，加入 DNS cache、timeout、redirect limit、conditional recrawl 與 freshness scheduler。',
 research:[
  {label:'ByteByteGo — HTML Downloader / Freshness',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'},
  {label:'RFC 9110 — HTTP Semantics / Validators & Conditional Requests',url:'https://www.rfc-editor.org/rfc/rfc9110.html'}
 ],
 pages:[
  {id:'sd9-s06-p01',title:'Downloader 的工作比 GET 複雜',blocks:[
   {type:'bullets',items:['DNS resolution + cache。','TCP/TLS/HTTP timeout。','Redirect limit，避免 loop。','Max response size / content-type 驗證。','Status code policy：2xx、3xx、4xx、5xx。','Connection pooling 與 per-host concurrency。']},
   {type:'callout',title:'Failure Isolation',text:'任何單一慢站或惡意 response 都不應長時間占住 worker。Timeout 與 size limit 是 crawler 的資源保護。'}
  ]},
  {id:'sd9-s06-p02',title:'Freshness：不是所有頁面都同頻率 Recrawl',blocks:[
   {type:'compare',items:[['High-change page','新聞首頁、行情頁：更新頻率高，recrawl interval 短。'],['Stable page','歷史文件：很少改，interval 可拉長。'],['High-value page','重要度高，即使更新不頻繁也可能優先。']]},
   {type:'p',text:'Freshness scheduler 可以用歷史 update frequency、importance、last-modified/etag、過去變更率估計下一次抓取時間。'}
  ]},
  {id:'sd9-s06-p03',title:'Conditional Request：沒變就別重傳整頁',blocks:[
   {type:'code',text:'GET /article HTTP/1.1\nIf-None-Match: "abc123"\n\nHTTP/1.1 304 Not Modified'},
   {type:'p',text:'ETag / Last-Modified 等 validators 可讓 crawler 在 recrawl 時確認內容是否改變；若 server 回 304，就不用重新下載完整 body。'},
   {type:'callout',title:'不要過度依賴',text:'不是所有站都正確提供 validators；crawler 還需要自己的 content hash 與 recrawl policy。'}
  ]}],
 quiz:[
  MC('sd9-s06-q1','Downloader 為什麼要設定 response size limit？','sd9-s06-p01','避免巨大/惡意 payload 占滿 bandwidth、memory 與 worker。','保護 crawler 資源，避免單一 response 造成 memory/network exhaustion。',[["因為 HTTP body 不能超過 1KB","沒有這種規則。"],["因為 DNS 只能解析小檔案","無關。"],["因為 size limit 會自動 dedup","不是。"]]),
  MC('sd9-s06-q2','所有頁面固定每 1 小時 recrawl 的主要缺陷？','sd9-s06-p02','浪費 stable page 資源且可能讓快速更新頁 freshness 不夠。','沒有依頁面變更率與重要度分配 crawl budget。',[["會讓 URL 變短","無關。"],["會讓 DNS 永遠失效","不是。"],["只要 QPS 足夠就完全沒問題","仍有網站負載與成本。"]]),
  MC('sd9-s06-q3','收到 304 Not Modified 對 crawler 的價值？','sd9-s06-p03','代表可避免重傳完整 body，節省頻寬與處理。','確認資源未變，通常不需重新下載整個內容。',[["代表 URL 不存在","那常見是 404。"],["代表 robots 禁止","不是。"],["代表一定刪除舊內容","相反。"]]),
  MC('sd9-s06-q4','Redirect 沒有限制可能造成什麼？','sd9-s06-p01','惡意或錯誤站點可形成 redirect loop，耗盡 worker。','Crawler 可能卡在 redirect loop，持續消耗 request budget。',[["一定提高 SEO","不是 crawler correctness。"],["會讓 hash 變 O(n²)","不是。"],["會自動變 BFS","無關。"]])
 ]
},
{
 id:'sd9-s07',order:7,title:'Robustness：Spider Trap、Bad Content 與 Retry Storm',duration:'34–48 分鐘',summary:'大型 crawler 一定會遇到惡意、錯誤與無限結構；學會 bounded work、validation、retry policy 與 quarantine。',
 research:[{label:'ByteByteGo — Robustness / Problematic Content',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}],
 pages:[
  {id:'sd9-s07-p01',title:'Spider Trap：有限資源遇到無限 URL 空間',blocks:[
   {type:'code',text:'/calendar/2026/08/16/next/next/next/...\n/search?page=1&page=2&page=3...\n/session/<random-id>/...'},
   {type:'p',text:'Spider trap 會製造近乎無限的新 URL。防禦可以包含 URL 長度/深度 limit、pattern detection、per-site discovered-URL budget、manual blocklist。'},
   {type:'callout',title:'沒有單一完美規則',text:'過度嚴格的 depth/parameter filter 也可能漏掉合法內容，所以通常是多層 heuristic + site-specific policy。'}
  ]},
  {id:'sd9-s07-p02',title:'Retry 要有上限、Backoff 與 Jitter',blocks:[
   {type:'stepper',steps:[['Timeout/5xx','標記 transient failure。'],['Backoff','延長下一次重試時間。'],['Jitter','避免大量 workers 同時重試。'],['Retry budget','超過次數後暫停/進 failure queue。']]},
   {type:'p',text:'如果 10 萬 URL 同時因 provider outage 失敗，立即 retry 會把 outage 放大成 retry storm。'}
  ]},
  {id:'sd9-s07-p03',title:'Bad Content 要隔離，不要讓 Parser Crash 全線',blocks:[
   {type:'bullets',items:['Malformed HTML：使用容錯 parser，記錄 parse failure。','Decompression bomb / huge body：在 Downloader 先做 size/ratio limit。','Unsupported MIME：交給 extension module 或 skip。','Repeated parser crash：把 URL/content quarantine，避免 poison pill 無限重跑。']},
   {type:'callout',title:'Poison Pill 思維',text:'任何一筆輸入都不應讓整個 pipeline 反覆崩潰；對異常項目要能隔離、觀測與人工分析。'}
  ]}],
 quiz:[
  MC('sd9-s07-q1','Spider trap 的核心風險？','sd9-s07-p01','有限 crawler budget 被無限/爆炸式 URL pattern 吃掉。','Crawler 在單一站點產生大量無價值 URL，消耗 frontier 與 fetch 資源。',[["只會讓 DNS 變快","相反無關。"],["只影響 CSS","不是。"],["一定是合法 sitemap","不是。"]]),
  MC('sd9-s07-q2','Retry 為什麼要加 jitter？','sd9-s07-p02','避免大量 worker 在相同時間點同步重試形成 thundering herd。','打散 retry 時間，降低同步重試尖峰。',[["讓所有 retry 同時發生","剛好相反。"],["讓 HTTP 變 UDP","無關。"],["用來內容去重","不是。"]]),
  MC('sd9-s07-q3','某 URL 每次都讓 parser crash，最佳處理？','sd9-s07-p03','應 bounded retry 後 quarantine/skip 並記錄，不讓 poison pill 反覆拖垮 pipeline。','隔離該內容並記錄 failure，避免無限重試。',[["永遠立即重試","會形成 poison loop。"],["重啟所有 crawler servers","成本高且 root cause 未解。"],["刪除 URL Frontier","過度破壞。"]]),
  MC('sd9-s07-q4','對 spider trap 設定全站固定 depth=3 的 trade-off？','sd9-s07-p01','可能擋住 trap，也可能漏合法深層內容。','能限制爆炸，但可能犧牲 coverage，需要 heuristic/例外。',[["完全沒有 trade-off","任何 heuristic 都有誤判。"],["會自動提高 freshness","無直接關係。"],["會使 Bloom Filter exact","無關。"]])
 ]
},
{
 id:'sd9-s08',order:8,title:'Distributed Crawl：Partition、Worker Scaling 與 Crawl State',duration:'38–54 分鐘',summary:'把單機 frontier/downloader 擴成多 worker、多 region，並確保 crash 後可恢復。',
 research:[{label:'ByteByteGo — Distributed Crawl / Robustness',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}],
 pages:[
  {id:'sd9-s08-p01',title:'Downloader 可以水平擴展，但要穩定 Partition',blocks:[
   {type:'p',text:'URL/host 可以依 hash 分配到 downloader groups。重點是同 host 的 politeness state 最好由穩定 ownership 管理，避免多 worker 各自以為自己可抓。'},
   {type:'callout',title:'Chapter 5 連結',text:'Consistent Hashing 可降低 worker add/remove 時大量 host ownership 重新分配，但仍需 membership 與 state transfer。'}
  ]},
  {id:'sd9-s08-p02',title:'Crawl State 必須 Durable',blocks:[
   {type:'compare',items:[['只在 RAM','快，但 worker crash 會忘記 frontier/last crawl/politeness state。'],['Durable frontier + checkpoint','可從持久化 cursor/state 恢復；成本是 storage I/O 與 consistency。']]},
   {type:'p',text:'大 crawler 是長時間運行系統。Restart 應該是正常事件，而不是重新從 seed 全部再來一次。'}
  ]},
  {id:'sd9-s08-p03',title:'Backpressure：Parser/Storage 跟不上時 Downloader 也要慢下來',blocks:[
   {type:'diagram',nodes:[['Frontier','待抓'],['Downloader','快速產生 HTML'],['Parser Queue','可能堆積'],['Parser','CPU'],['Storage','I/O']],caption:'若 downstream throughput 低於 fetch throughput，buffer 會無限成長。'},
   {type:'callout',title:'核心',text:'控制 in-flight jobs、queue depth、oldest age，讓上游依下游能力調整。Horizontal scale 不是無限 enqueue。'}
  ]}],
 quiz:[
  MC('sd9-s08-q1','同一 host 被不同 downloader groups 同時抓，最可能破壞什麼？','sd9-s08-p01','各自看不到共享 host pacing，可能超過 politeness limit。','Per-host politeness / concurrency policy。',[["HTML syntax","不是。"],["Base62","無關。"],["UUID uniqueness","無關。"]]),
  MC('sd9-s08-q2','為什麼 Frontier 不能只放 RAM？','sd9-s08-p02','大型 crawl 長時間運行，crash/redeploy 不應丟失數億 URL 的排程狀態。','需要 durable state 才能在故障後恢復而不是重抓一切。',[["RAM 不能存 URL","可以，只是不 durable。"],["Disk 一定更快","不是。"],["因為 HTTP 要求","HTTP 沒有此要求。"]]),
  MC('sd9-s08-q3','Downloader 產生 2000 pages/s、Parser 只能處理 800/s，長期會發生？','sd9-s08-p03','若沒有 backpressure，parser queue/backlog 每秒淨增加約 1200。','Backlog 持續增加，最終耗盡資源。',[["Queue 自動變 0","service rate 不足。"],["Parser 自動升到 2000/s","除非額外 scale。"],["DNS 會幫忙解析 backlog","無關。"]]),
  MC('sd9-s08-q4','Consistent hashing 用在 crawl workers 主要解什麼？','sd9-s08-p01','降低 worker membership change 時 host/key ownership 的大規模 remap。','讓新增/移除 worker 時只搬相對少量 partition ownership。',[["自動解析 robots","不是。"],["自動做 content dedup","不是。"],["保證每 host 一定成功","不是。"]])
 ]
},
{
 id:'sd9-s09',order:9,title:'Storage、Extensibility 與 Observability',duration:'34–48 分鐘',summary:'內容、URL metadata、frontier 與 metrics 需要不同 storage；pipeline 也要能加入新 parser/renderer。',
 research:[
  {label:'ByteByteGo — Storage / Extensibility',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'},
  {label:'OpenTelemetry — Observability Primer',url:'https://opentelemetry.io/docs/concepts/observability-primer/'}
 ],
 pages:[
  {id:'sd9-s09-p01',title:'不同資料不要硬塞同一種 Storage',blocks:[
   {type:'compare',items:[['Raw HTML/Object','大、append/read mostly → object/blob storage。'],['URL Metadata','status、last crawl、etag、priority、next crawl → KV/DB。'],['Frontier','ordered scheduling + durability → queue/log/disk-backed scheduler。'],['Seen Index','membership-heavy → hash/bloom + durable backing。']]},
   {type:'p',text:'Storage 選擇應跟 access pattern 對齊，而不是因為「Crawler 很大所以全部 NoSQL」。'}
  ]},
  {id:'sd9-s09-p02',title:'Extensibility：把 Content Handler 當 Plugin',blocks:[
   {type:'diagram',nodes:[['Downloader','HTTP response'],['Content Router','MIME/type'],['HTML Parser','links/meta'],['PDF Parser','text/meta'],['Image Handler','hash/meta'],['Monitor Module','change detect']],caption:'Core crawl scheduling 不需要知道每種內容細節。'},
   {type:'callout',title:'Browser Rendering',text:'若未來要執行 JavaScript，可新增昂貴 rendering tier，而不是讓所有 HTML 都預設跑 headless browser。'}
  ]},
  {id:'sd9-s09-p03',title:'Crawler 要監控哪些指標？',blocks:[
   {type:'bullets',items:['Fetch QPS / success rate / status code distribution。','P50/P95/P99 fetch latency、DNS latency。','Frontier depth、oldest URL age、priority starvation。','Per-host throttle / 429 / 503 / timeout。','Dedup rate、new URL discovery rate。','Parser errors、poison items、storage lag。','Freshness：重要頁面距離上次成功 crawl 的時間。']},
   {type:'callout',title:'不要只看總 QPS',text:'Crawler 可能 QPS 很高但一直重抓 duplicate、429 或同一批站點；真正 KPI 要看 useful fresh content。'}
  ]}],
 quiz:[
  MC('sd9-s09-q1','Raw HTML 30PB 最適合優先考慮哪類 storage？','sd9-s09-p01','大 blob、主要 append/read、成本敏感，Object Storage 通常合理。','Object/Blob Storage。',[["只放 process heap","容量與 durability 不可行。"],["只放 DNS cache","用途不同。"],["只放 browser localStorage","完全不合適。"]]),
  MC('sd9-s09-q2','為什麼不是所有頁面都直接用 headless browser render？','sd9-s09-p02','Rendering 成本高，應按需要走專門 tier。','會顯著增加 CPU/memory/latency，應對需要 JS 的頁面選擇性使用。',[["Browser 不能解析 HTML","可以。"],["JS 頁面不存在","現代 Web 很常見。"],["robots 不允許任何 browser","不是。"]]),
  MC('sd9-s09-q3','Crawler QPS 很高但 useful new content 很低，代表？','sd9-s09-p03','可能大量 duplicate、retry、無效 URL 或低價值抓取；QPS 不是成功指標。','需要檢查 dedup rate、discovery quality、status/error 與 freshness，而不是只看 throughput。',[["一定要再加 worker","可能讓浪費更大。"],["QPS 高就代表品質好","錯。"],["立刻刪除 metrics","相反。"]]),
  MC('sd9-s09-q4','Content Router/Plugin 架構最主要支援？','sd9-s09-p02','新增 PDF/Image/JS rendering 等 handler 不需改 core frontier。','Extensibility。',[["Strong consistency only","不是。"],["Rate limiting","不同 concern。"],["DNS authority","不同。"]])
 ]
},
{
 id:'sd9-s10',order:10,title:'完整 Crawler Architecture：從 Seed 到 Fresh Index',duration:'42–58 分鐘',summary:'把前九節組成一個可解釋的 production design，並練習 bottleneck 與 failure 推導。',
 research:[
  {label:'ByteByteGo — Design A Web Crawler / Wrap Up',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'},
  {label:'RFC 9309 — Robots Exclusion Protocol',url:'https://www.rfc-editor.org/rfc/rfc9309.html'}
 ],
 pages:[
  {id:'sd9-s10-p01',title:'完整 Data Flow',blocks:[
   {type:'stepper',steps:[['Seed/Recrawl Scheduler','產生初始 URL 與到期 URL。'],['URL Normalize + Seen','避免重複排程。'],['Priority + Host Frontier','同時控制重要度與 politeness。'],['Downloader','robots policy、DNS、HTTP、timeout/redirect。'],['Parser + Content Dedup','驗證、fingerprint、extract links。'],['Storage + Index Pipeline','保存 raw content/metadata 並送後續 indexing。'],['Checkpoint/Metrics','持久化 crawl state 並觀測 freshness/failure。']]}
  ]},
  {id:'sd9-s10-p02',title:'三個典型 Bottleneck 怎麼推導',blocks:[
   {type:'compare',items:[['Frontier backlog 高','Downloader capacity 不足，或 politeness/host diversity 限制。'],['Parser queue 高','Parser CPU/complex content 跟不上 downloader。'],['429/503 高','不是「再加 downloader」，而是 host pacing 太激進或對方故障。']]},
   {type:'callout',title:'System Design 核心',text:'同一個 symptom「抓得慢」可能是完全不同 bottleneck；先看 metrics 再加 capacity。'}
  ]},
  {id:'sd9-s10-p03',title:'面試 Checklist',blocks:[
   {type:'code',text:'□ Scope + pages/month + retention\n□ Seed + URL Frontier\n□ URL normalization / URL Seen / Content Seen\n□ Priority + Politeness\n□ robots.txt / host pacing\n□ Downloader timeout / DNS / redirect\n□ Freshness / recrawl\n□ Spider trap / retry / poison content\n□ Durable state / distributed workers / backpressure\n□ Storage + observability'},
   {type:'callout',title:'完成標準',text:'你要能說出每個元件解哪個 failure/bottleneck，而不是只背 crawler architecture 圖。'}
  ]}],
 quiz:[
  MC('sd9-s10-q1','看到大量 429，第一個合理動作？','sd9-s10-p02','這是對方明確的 rate pressure signal，應調整該 host pacing/backoff。','降低該 host 抓取速率並檢查 politeness policy。',[["增加 downloader 轟更多 request","會更糟。"],["刪除 Content Seen","無關。"],["關閉 metrics","失去訊號。"]]),
  MC('sd9-s10-q2','Parser queue 持續成長但 fetch latency 正常，最可能瓶頸？','sd9-s10-p02','Downloader 產出速度超過 parser throughput。','Parser/CPU stage 跟不上，需要 scale/優化或 backpressure。',[["一定是 DNS","fetch latency 正常且 queue 在 parser 前。"],["一定是 robots","不符合位置。"],["一定是 object storage 空間過大","需看 storage lag，不是直接推論。"]]),
  MC('sd9-s10-q3','完整 crawler 為何需要 checkpoint？','sd9-s10-p01','長時間 pipeline 中 crash/redeploy 要能恢復 frontier 與 crawl state。','避免失敗後從 seed 全量重來。',[["讓 HTTP 變 stateful","不是。"],["讓 URL 自動縮短","無關。"],["取代 dedup","不同責任。"]]),
  MC('sd9-s10-q4','Crawler 的核心設計思維最完整的是？','sd9-s10-p03','同時平衡 coverage、freshness、throughput、politeness、robustness 與成本。','以可持久化 scheduling 管理巨大 URL graph，同時尊重站點並容忍外部失敗。',[["只把 BFS 跑得最快","太狹窄。"],["只增加 worker 數量","忽略 politeness/failure。"],["只做 URL hash","缺整個 pipeline。"]])
 ]
}
);
})();