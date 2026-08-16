(() => {
const chapter = window.SYSTEM_DESIGN_CHAPTER_09 = {
  id:'sd-book-09',order:9,title:'設計網路爬蟲',
  subtitle:'把「下載網頁」升級成可擴展、禮貌、可恢復、可重複抓取的分散式 Web Crawler。',
  objective:'完成後，你應能從需求與容量估算開始，設計 URL Frontier、Downloader、Dedup、Politeness、Freshness 與 Failure Recovery。',
  sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd9-s01',order:1,title:'需求、規模與好 Crawler 的四個特性',duration:'28–38 分鐘',summary:'先鎖定目的、資料量、內容型態與保存時間，再從 scalability、robustness、politeness、extensibility 推導設計。',
 research:[
  {label:'ByteByteGo — Design A Web Crawler / Step 1',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'},
  {label:'Google Crawling Infrastructure — About Crawling',url:'https://developers.google.com/crawling/docs/about-crawling'}
 ],
 pages:[
  {id:'sd9-s01-p01',title:'Crawler 題第一句不是「我用 BFS」',blocks:[
   {type:'lead',text:'Web Crawler 的演算法很簡單：下載 URL、抽連結、把新 URL 加回待抓集合；真正難的是規模、外部網站的不確定性與長時間運行。'},
   {type:'stepper',steps:[['Purpose','搜尋索引、archive、monitoring、data mining，會決定 freshness 與資料格式。'],['Scale','pages/month、peak fetch QPS、平均頁面大小、保存年限。'],['Scope','HTML only？PDF/image？是否處理 JavaScript rendering？'],['Semantics','要不要抓更新頁？重複內容怎麼辦？']]},
   {type:'callout',title:'面試訊號',text:'先問目的與規模，因為 100 萬頁內部 crawler 與每月 10 億頁搜尋 crawler 的 frontier、storage、politeness 與 failure recovery 完全不同。'}
  ]},
  {id:'sd9-s01-p02',title:'用 Chapter 2 做 Back-of-the-envelope',blocks:[
   {type:'code',text:'假設 1B pages / month\nAverage fetch QPS ≈ 1,000,000,000 / (30×24×3600) ≈ 386\nPeak ≈ 2× → 約 800 QPS\n500 KB/page → 約 500 TB/month\n保存 5 年 → 約 30 PB raw content'},
   {type:'p',text:'這些不是精確容量規劃，而是確認系統量級。30 PB 代表 HTML content 不可能全放 RAM；800 peak fetch/s 也告訴你 Downloader 可以水平擴展，但不能因為能擴就對單一 host 打 800 QPS。'},
   {type:'callout',title:'跨章連結',text:'Chapter 2 的估算在這裡直接決定 Storage、Frontier 持久化、Downloader 數量與網路出口。'}
  ]},
  {id:'sd9-s01-p03',title:'好 Crawler 的四個品質屬性',blocks:[
   {type:'compare',items:[['Scalability','URL 與內容量巨大，要靠 partition + parallel workers。'],['Robustness','壞 HTML、timeout、redirect loop、惡意頁面、worker crash 都不能拖垮整體。'],['Politeness','不能在短時間轟炸同一 host；要尊重 robots 與 host-level pacing。'],['Extensibility','未來加 PDF、image、rendering、monitoring module 不應重寫整個 pipeline。']]},
   {type:'p',text:'Crawler 的特殊點是 downstream 是「別人的網站」。你不能假設它可靠、快速，也不能把自己的 throughput 目標凌駕於對方站點負載。'}
  ]}],
 quiz:[
  MC('sd9-s01-q1','每月抓 10 億頁、平均 500KB，為什麼估算很重要？','sd9-s01-p02','估算用來確認 throughput 與 storage 量級，支撐後續 architecture。','它能告訴你系統大約需要處理多少 fetch QPS 與多少儲存容量。',[["因為估算後就不需要壓測","粗估不能取代實測。"],["因為所有網站大小都固定 500KB","500KB 只是 assumption。"],["因為可以直接決定資料庫品牌","量級只能縮小選項，不能單獨決定產品。"]]),
  MC('sd9-s01-q2','Crawler 的 politeness 最接近哪個意思？','sd9-s01-p03','Politeness 是避免短時間對同一網站發送過量請求，並遵守站點規則。','限制對單一 host 的抓取頻率，避免造成壓力。',[["優先抓排名最高頁面","這是 priority，不是 politeness。"],["把所有內容加密","與抓取節奏無關。"],["只抓 HTTPS","HTTPS 與 politeness 是不同概念。"]]),
  MC('sd9-s01-q3','Crawler 要未來支援 PDF、Image，最對應哪個設計品質？','sd9-s01-p03','Extensibility 要讓新 parser/downloader 以模組加入，而非推翻 pipeline。','Extensibility。',[["Consistency","這不是核心語意。"],["Linearizability","不是新增內容型態的主要問題。"],["Strong ordering","與插件式 parser 無直接關係。"]]),
  MC('sd9-s01-q4','如果只知道「設計 crawler」就直接畫 100 台 downloader，最大問題？','sd9-s01-p01','沒有先鎖 scope、scale 與保存需求，無法判斷 100 台是否必要。','沒有先釐清需求與容量，可能 over-engineer 或 under-design。',[["Downloader 永遠只能一台","可以水平擴展。"],["Crawler 不能用多執行緒","可以。"],["一定要先選 SQL","資料庫不是第一個問題。"]])
 ]
},
{
 id:'sd9-s02',order:2,title:'High-Level Design：Seed → Frontier → Downloader → Parser → Dedup',duration:'32–45 分鐘',summary:'建立完整資料流，清楚分出 URL state、content state 與 processing stages。',
 research:[{label:'ByteByteGo — Web Crawler High-Level Design',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}],
 pages:[
  {id:'sd9-s02-p01',title:'整條 Crawl Pipeline',blocks:[
   {type:'diagram',nodes:[['Seed URLs','起點'],['URL Frontier','待抓 URL'],['Downloader','HTTP fetch'],['Parser','驗證/解析'],['Content Seen','內容去重'],['Link Extractor','抽取 links'],['URL Seen','URL 去重'],['Frontier','回到待抓']],caption:'Crawler 是持續循環的 pipeline，不是一次性 batch script。'},
   {type:'p',text:'URL Seen 與 Content Seen 是兩種不同 dedup：同一 URL 不應反覆排隊；不同 URL 也可能回傳相同內容。'}
  ]},
  {id:'sd9-s02-p02',title:'Seed URLs 決定你看得到哪一塊 Web',blocks:[
   {type:'p',text:'Seed 是 crawl graph 的起點。搜尋型 crawler 常需要多樣 seed：按地域、主題、已知高品質站點、sitemap 或歷史 frontier。單一 seed 會讓 crawler 視野受限。'},
   {type:'callout',title:'不是越多越好',text:'Seed 太多但沒有 dedup/priority 只會快速膨脹 frontier；重點是 coverage 與 discovery quality。'}
  ]},
  {id:'sd9-s02-p03',title:'為什麼 Parser 與 Downloader 分開？',blocks:[
   {type:'compare',items:[['Downloader','I/O-bound：DNS、TCP/TLS、HTTP、timeout、redirect、content limit。'],['Parser','CPU/validation：HTML parse、link extraction、normalization、metadata。'],['Storage/Dedup','stateful：visited URL、content fingerprint、raw content、crawl metadata。']]},
   {type:'p',text:'拆開後可以獨立 scale、隔離 malformed content，並避免 parser CPU 把 network fetch threads 卡死。'}
  ]}],
 quiz:[
  MC('sd9-s02-q1','為什麼需要同時有 URL Seen 與 Content Seen？','sd9-s02-p01','URL identity 與 content identity 是不同層次。','URL Seen 防重複排程；Content Seen 防不同 URL 儲存相同內容。',[["因為一個給 HTTP、一個給 DNS","不是這種分工。"],["兩者功能完全相同","會漏掉 duplicate content。"],["Content Seen 只負責 robots","無關。"]]),
  MC('sd9-s02-q2','Parser 與 Downloader 分開最合理的理由？','sd9-s02-p03','兩者資源型態與 failure mode 不同，可獨立擴縮。','Downloader 偏 network I/O，Parser 偏 CPU/validation，拆開便於隔離與擴縮。',[["HTML 不能在 Downloader process 中解析","可以，但大規模時不一定好。"],["Parser 一定要用 SQL","無關。"],["Downloader 不能多執行緒","錯。"]]),
  MC('sd9-s02-q3','Seed URL 的主要角色？','sd9-s02-p02','Seed 是 graph traversal 的初始入口。','提供 crawler 開始探索 Web graph 的初始 URL。',[["永久阻止新 URL","相反。"],["取代 URL Frontier","Seed 只負責初始入口。"],["負責內容去重","不是。"]]),
  MC('sd9-s02-q4','Crawler pipeline 為什麼是循環？','sd9-s02-p01','新頁面會抽出新 links，再進 frontier。','解析頁面後發現的新 URL 會重新加入 Frontier，持續探索。',[["因為每個頁面都要下載兩次","不是。"],["因為 DNS 一定失敗一次","不是。"],["因為 Parser 會刪除所有內容","不是。"]])
 ]
},
{
 id:'sd9-s03',order:3,title:'URL Normalization、URL Seen 與 Content Dedup',duration:'34–48 分鐘',summary:'同一資源可能有多種 URL 表示；學會 canonicalization、fingerprint 與 Bloom Filter 的 trade-off。',
 research:[
  {label:'Google Search Central — Crawling & Canonicalization',url:'https://developers.google.com/search/docs/crawling-indexing'},
  {label:'ByteByteGo — URL Seen / Content Seen',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}
 ],
 pages:[
  {id:'sd9-s03-p01',title:'URL 相等比字串相等複雜',blocks:[
   {type:'bullets',items:['scheme/host 大小寫與 default port。','relative URL 要 resolve 成 absolute URL。','fragment 通常不影響 server-side resource fetch。','query parameter 順序與 tracking params 可能造成重複。','redirect/canonical metadata 可能揭示代表 URL。']},
   {type:'callout',title:'Canonicalization 需保守',text:'不能隨便刪 query params；某些參數真的改變內容。錯誤 normalization 會把不同資源合併。'}
  ]},
  {id:'sd9-s03-p02',title:'URL Seen：Hash Set vs Bloom Filter',blocks:[
   {type:'compare',items:[['Hash Set','Exact membership，但記憶體成本高。'],['Bloom Filter','空間省、查詢快；可有 false positive，但沒有 false negative（標準設定下）。']]},
   {type:'p',text:'Crawler 的 URL Seen 很適合 Bloom Filter，因為偶爾 false positive 代表少抓某個新 URL；能否接受要看產品目標。Archive/c compliance crawler 可能不能接受。'}
  ]},
  {id:'sd9-s03-p03',title:'Content Dedup：Fingerprint 而不是逐字比較',blocks:[
   {type:'p',text:'不同 URL 可能服務完全相同 HTML。對大規模資料逐字 compare 不實際，通常先計算 hash/fingerprint，再以 hash index 判斷重複。'},
   {type:'callout',title:'Hash Collision',text:'若 dedup correctness 很重要，可用強 hash、content length、secondary verification 降低 collision 風險；hash 相同不是數學上絕對保證內容相同。'}
  ]}],
 quiz:[
  MC('sd9-s03-q1','為什麼 URL normalization 不能直接刪掉所有 query string？','sd9-s03-p01','Query 參數可能真的是資源 identity 的一部分。','某些 query parameter 會改變頁面內容，亂刪會把不同資源錯誤合併。',[["因為 query 永遠只用於 tracking","這個假設不成立。"],["因為 URL 不能含 ?","可以。"],["因為 DNS 需要 query string","DNS 不看 HTTP path/query。"]]),
  MC('sd9-s03-q2','Bloom Filter 用於 URL Seen 的主要 trade-off？','sd9-s03-p02','它省空間但可能 false positive。','可能把尚未抓過的 URL 誤判成看過，造成漏抓。',[["會有 false negative 但不會 false positive","說反了。"],["一定比 Hash Set 更耗 RAM","通常相反。"],["只能存 HTML 內容","它是 membership structure。"]]),
  MC('sd9-s03-q3','Content hash 相同時為何高 correctness 系統仍可能做 secondary verify？','sd9-s03-p03','Hash collision 雖低但非零。','避免極低機率 collision 導致不同內容被誤判相同。',[["因為 hash 每次都隨機變","正常 hash 對同輸入是 deterministic。"],["因為 URL Seen 不存在","無關。"],["因為 HTML 不能 hash","可以。"]]),
  MC('sd9-s03-q4','不同 URL 回傳相同 HTML，應優先由哪個元件發現？','sd9-s03-p03','這是 content-level duplicate。','Content Seen / content fingerprint。',[["DNS Resolver","DNS 只解析名稱。"],["Seed Selector","不是。"],["Rate Limiter","不是 dedup。"]])
 ]
},
{
 id:'sd9-s04',order:4,title:'BFS、Priority 與 URL Frontier',duration:'38–52 分鐘',summary:'標準 BFS 不夠；Frontier 同時要解 priority、politeness、freshness 與 durable scheduling。',
 research:[{label:'ByteByteGo — URL Frontier Deep Dive',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}],
 pages:[
  {id:'sd9-s04-p01',title:'為什麼通常不選 DFS？',blocks:[
   {type:'compare',items:[['DFS','可能一路鑽入深層或無限結構，coverage 差，易碰 spider trap。'],['BFS','較均勻擴展 graph coverage，但純 FIFO 仍會造成 host flood 與無 priority。']]},
   {type:'p',text:'所以 production crawler 不是「一個 FIFO queue」；URL Frontier 是 scheduler。'}
  ]},
  {id:'sd9-s04-p02',title:'Front Queue：解 Priority',blocks:[
   {type:'stepper',steps:[['Score','依重要度、更新頻率、PageRank-like signal、業務 priority 打分。'],['Front queues','不同 priority 放不同 queue。'],['Selector','高 priority queue 被選中的機率更高。']]},
   {type:'p',text:'Priority 不是永遠只抓熱門頁。若 scheduler 沒有 aging/fairness，低 priority URL 可能 starvation。'}
  ]},
  {id:'sd9-s04-p03',title:'Back Queue：解 Politeness',blocks:[
   {type:'diagram',nodes:[['Prioritizer','前端 priority queues'],['Back Queue Router','host → queue'],['Host Queues','每 host 排隊'],['Worker Selector','可抓 host'],['Downloader','依 next-allowed-time 抓取']],caption:'Front queues 管「先抓誰」，Back queues 管「對哪個 host 何時可抓」。'},
   {type:'callout',title:'核心抽象',text:'URL Frontier 不是普通 MQ；它同時是 priority scheduler + host politeness scheduler + durable crawl state。'}
  ]}],
 quiz:[
  MC('sd9-s04-q1','Crawler 為什麼純 DFS 常不適合？','sd9-s04-p01','Web graph 可非常深甚至無限，DFS 容易失去 breadth coverage。','可能深陷單一路徑或 spider trap，導致 coverage 很差。',[["DFS 不能遍歷 graph","可以。"],["DFS 一定比 BFS 慢 O(n²)","複雜度不是核心問題。"],["DFS 無法使用 stack","本來就可用 stack。"]]),
  MC('sd9-s04-q2','URL Frontier 的 Front Queue 主要解什麼？','sd9-s04-p02','Front queue 做 priority scheduling。','依重要度/更新頻率等選擇更值得先抓的 URL。',[["Host politeness only","那比較像 back queues。"],["DNS cache","不同元件。"],["Content dedup","不同元件。"]]),
  MC('sd9-s04-q3','Back Queue Router 最重要的 key 通常是？','sd9-s04-p03','要控制同 host 的抓取節奏。','Hostname / site identity。',[["頁面字體","無關。"],["HTTP body hash","那是 content dedup。"],["User login token","不是 public crawl scheduler 的主要 key。"]]),
  MC('sd9-s04-q4','Priority scheduler 沒有 fairness/aging，最可能發生？','sd9-s04-p02','低優先 URL 可能永遠得不到服務。','Starvation。',[["所有 URL 變 duplicate","不是。"],["DNS poisoning","不是由 priority 導致。"],["HTML parser 失效","無直接關係。"]])
 ]
}
);
})();