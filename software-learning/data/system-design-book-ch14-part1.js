(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_14={
 id:'sd-book-14',order:14,title:'設計 YouTube',
 subtitle:'從大型影片上傳、Object Storage、Transcoding Pipeline、Adaptive Streaming、CDN、成本控制到版權與故障恢復，設計全球影片平台。',
 objective:'完成後，你能把 Upload 與 Playback 兩條 flow 分開，說清楚 resumable upload、transcoding DAG、rendition、CDN/Origin、metadata、queue、retry、cost 與 multi-region。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd14-s01',order:1,title:'第一步驟：了解問題並確立設計的範圍',duration:'36–52 分鐘',summary:'先跟面試官釐清這題只鎖定上傳與觀看兩件事，再用書裡實際給的數字估算儲存空間與 CDN 成本。',
 research:[{label:'YouTube by the numbers（用數字來看 YouTube）',url:'https://www.omnicoreagency.com/youtube-statistics/'},{label:'2019 YouTube Demographics',url:'https://blog.hubspot.com/marketing/youtube-demographics'}],
 pages:[
  {id:'sd14-s01-p01',title:'先問清楚：這題到底要做多大',blocks:[
   {type:'p',text:'YouTube 佔了所有行動網路流量的 37%，可以在 80 種不同的語言環境下使用，確實是很龐大、很賺錢的全球性公司。從這些統計數字我們可以知道，YouTube 除了可以觀看影片之外，還有很多其他事情可以做，像是給影片留言、分享影片、訂閱頻道等等。這麼多功能不可能都在 45 到 60 分鐘的面試過程中處理完，因此第一步驟要做的，就是提出適當的問題，縮小設計的範圍。'},
   {type:'stepper',steps:[['哪些功能特別重要？','面試官：要能夠上傳影片、觀看影片。'],['必須支援哪些使用者？','面試官：行動 App、Web 瀏覽器與智慧型電視（smart TV）。'],['規模有多大？','面試官：500 萬活躍使用者，每人每天平均觀看 5 支影片。'],['檔案大小有限制嗎？','面試官：最大為 1GB。'],['可以用現成的雲端服務嗎？','面試官：可以，這題聚焦在系統設計本身，不必從零打造儲存或串流基礎架構。']]},
   {type:'callout',title:'跟教材其他章節的差異',text:'這一題面試官明確表示可以直接採用 Amazon、Google 或 Microsoft 這類平台提供的 BLOB 儲存系統與 CDN，不必自己重新發明——這代表面試重點會放在「怎麼把這些現成元件組合成正確的架構」，而不是重新造輪子。'}
  ]},
  {id:'sd14-s01-p02',title:'設計目標',blocks:[
   {type:'bullets',items:['能夠快速上傳影片。','流暢的影片串流。','能夠改變影片申流品質，以符合使用者的網路狀況。','低廉的基礎架構建置成本。','高可用性、可擴展性與可靠性的要求。']},
   {type:'p',text:'這些就是本章重點想設計出具有以上功能的影片申流服務——面試官給的「可以善用現有雲端服務」這個提示，直接決定了後面高階設計要以既有的 BLOB 儲存系統與 CDN 為基礎，而不是自己重新構建。'}
  ]},
  {id:'sd14-s01-p03',title:'粗略的估算',blocks:[
   {type:'bullets',items:['假設這個產品每天有 500 萬名活躍使用者（DAU）。','使用者每天平均觀看 5 支影片。','假設有 10% 的使用者每天會上傳 1 支影片。','假設影片的平均大小為 300MB。']},
   {type:'code',text:'每天所需的總儲存空間：\n500 萬 * 10% * 300MB = 150TB'},
   {type:'p',text:'CDN 成本也要跟著算：如果使用雲端 CDN 來提供影片服務，就必須根據流量支付費用。假設用 Amazon CloudFront，且 100% 的流量都是從美國提供服務，每 GB 的平均成本約為 0.02 美元。500 萬 * 5 支影片 * 0.3GB * 0.02 美元 = 每天 150,000 美元。實際的 CDN 定價會依國家/地區大幅浮動（同樣是每月前 10TB，美國約 0.085 美元／GB，印度可能到 0.17 美元／GB），這也是後面「節省成本」小節要處理的問題。'}
  ]}],
 quiz:[
  MC('sd14-s01-q1','面試官在這一題明確給了哪個限制，直接影響了高階設計的方向？','sd14-s01-p01','面試官表示可以直接採用現成的 BLOB 儲存系統與 CDN。','可以善用現有雲端服務，不必從零打造儲存/串流基礎架構。',[["只能用開源軟體","題目沒有這個限制。"],["不能使用 CDN","相反，題目建議可以用。"],["必須支援直播","這題範圍鎖定在上傳與觀看。"]]),
  MC('sd14-s01-q2','這一題的核心範圍鎖定在哪兩件事？','sd14-s01-p01','面試官明確表示要能上傳與觀看影片。','上傳影片、觀看影片。',[["留言與分享","面試官沒有把這些列為必須功能。"],["訂閱與推薦","同上，不是本題鎖定的核心。"],["登入與付費","題目沒有提到。"]]),
  MC('sd14-s01-q3','根據書裡的估算，500 萬 DAU、10% 上傳率、平均 300MB 影片，每天需要多少儲存空間？','sd14-s01-p03','500 萬 * 10% * 300MB = 150TB。','約 150TB。',[["150GB","少算了三個數量級。"],["1.5PB","算式沒有這麼大。"],["15TB","少算了一個數量級。"]]),
  MC('sd14-s01-q4','CDN 成本估算時，為什麼不同國家/地區每 GB 價格差很多？','sd14-s01-p03','書裡的 CDN 定價表顯示美國跟印度等地區價格明顯不同。','雲端 CDN 定價本來就依區域浮動，這也是後續成本優化要處理的變數。',[["因為影片格式不同","跟格式無關，是計費地區不同。"],["因為儲存系統不同","儲存與 CDN 傳輸是分開計費的。"],["這只是巧合，設計不必考慮","恰好相反，這正是成本工程要考慮的重點。"]])
 ]
},
{
 id:'sd14-s02',order:2,title:'第二步驟：提出高階設計並取得認可',duration:'36–52 分鐘',summary:'先看三個最基本的構成元素（客戶端／CDN／API 伺服器），再展開成完整的上傳與 metadata 更新流程圖。',
 research:[{label:'Cloudfront 定價（CDN 成本估算依據）',url:'https://aws.amazon.com/cloudfront/pricing/'},{label:'Netflix on AWS（自建 vs 委外 CDN 的參考案例）',url:'https://aws.amazon.com/solutions/case-studies/netflix/'},{label:'Akamai 首頁（Netflix 採用的 CDN 供應商）',url:'https://www.akamai.com/'}],
 pages:[
  {id:'sd14-s02-p01',title:'先看三個最基本的元素',blocks:[
   {type:'diagram',nodes:[['客戶端','電腦／行動手機／智慧型電視'],['CDN','儲存並串流影片'],['API 伺服器','除了影片串流以外的其他所有事情']],caption:'圖 14-3：客戶端透過串流影片走 CDN，其他所有請求都走 API 伺服器。'},
   {type:'p',text:'CDN：影片全都儲存在 CDN，客戶端串流影片時，就會從 CDN 以串流方式傳輸影片。API 伺服器：除了影片申流以外，其他所有服務都是由 API 伺服器來提供，包括生成影片上傳網址、更新 metadata 資料庫、使用者註冊與登入等等。'},
   {type:'callout',title:'系統設計面試並不是要你從頭打造所有的東西',text:'在有限的時間內，選擇正確的技術來正確完成工作比較重要——比詳細解釋技術的原理更為重要。舉例來說，只要提到會採用 BLOB 儲存系統來做為原始儲存系統就已經足夠了；Netflix 採用 Akamai 的 CDN，Facebook 則自己構建出具有可擴展性的 BLOB 儲存系統與 CDN，過程非常複雜而且成本很高——這是規模與成本的取捨，兩種做法都合理，重點是你能不能說出取捨在哪裡。'}
  ]},
  {id:'sd14-s02-p02',title:'影片上傳的高階設計',blocks:[
   {type:'diagram',nodes:[['使用者','電腦／手機／智慧型電視'],['負載平衡器','平均分配請求'],['API 伺服器','除了影片申流以外的任務都在這裡處理'],['Metadata 資料庫','分片＋複寫'],['Metadata 快取','快取熱門物件']],caption:'圖 14-4（上半部）：使用者請求先經過負載平衡器分配到 API 伺服器，metadata 讀寫則走資料庫與快取。'},
   {type:'bullets',items:['負載平衡器：負載平衡器會在使用者請求之間平均分配請求，由 API 伺服器進行處理。','API 伺服器：除了影片申流的任務之外，其他所有的使用者請求都是由 API 伺服器進行處理。','Metadata 資料庫：影片的 metadata（詮釋資料）全都保存在 metadata 資料庫。這些資料會進行分片（sharded）與複寫（replicated），以滿足效能與高可用性的要求。','Metadata 快取：為了獲得更好的效能表現，影片的 metadata 詮釋資料與使用者物件都會進行快取。']},
   {type:'diagram',nodes:[['使用者','上傳影片'],['原始儲存系統','BLOB 儲存原始影片'],['轉碼伺服器','把影片轉碼成 MPEG／HLS 等格式'],['已轉碼儲存系統','BLOB 儲存已轉碼影片'],['完成事件訊息佇列','轉碼完成事件排隊'],['完成事件處理程序','更新 metadata＋通知 CDN']],caption:'圖 14-4（下半部）：原始影片走另一條路徑，轉碼完成後才進 CDN。'},
   {type:'bullets',items:['原始儲存系統：BLOB（Binary Large Object；二進位大型物件）指的是資料庫系統中，用單一實體來儲存的一大包二進位資料——我們用這種 BLOB 儲存系統來保存尚未轉碼的原始影片。','轉碼伺服器：影片轉碼（transcoding）也稱為編碼（encoding），就是把影片格式轉換成另一種格式（如 MPEG、HLS 等等）的程序，目的是針對不同設備的頻寬與處理能力，提供最佳的 YouTube 影片申流體驗。','已轉碼儲存系統（transcoded storage）：這也是一種 BLOB 儲存系統，可用來存放已轉碼的影片檔案，供 CDN 提取。','完成事件訊息佇列（completion queue）：一個訊息佇列，用來存放「影片轉碼完成」的事件訊息。','完成事件處理程序（completion handler）：從完成事件訊息佇列中不斷提取出事件訊息，然後對 metadata 資料庫與快取做出更新。']}
  ]},
  {id:'sd14-s02-p03',title:'流程 A／B：上傳實際的影片、更新 metadata 詮釋資料',blocks:[
   {type:'p',text:'圖 14-5 顯示的就是影片上傳的高階設計，這個設計包含以下幾個元素：'},
   {type:'stepper',steps:[['1. 上傳實際的影片','影片被上傳到原始儲存系統。'],['2. 開始轉碼','轉碼伺服器從原始儲存系統取得影片並開始進行轉碼。'],['3a. 分派到 CDN','轉碼完成後，已轉碼的影片會被分配到已轉碼儲存系統，接著就傳送到 CDN。'],['3b. 更新 metadata','轉碼完成事件會進入完成事件訊息佇列排隊等候處理；完成事件處理程序會不斷從佇列提取出事件資料，與 metadata 資料庫做出更新，metadata 資料庫與 metadata 快取都會更新。'],['4. 通知客戶端','API 伺服器會通知客戶端影片已成功上傳，並已做好準備隨時可進行申流傳輸。']]},
   {type:'callout',title:'流程 B：更新 metadata 詮釋資料',text:'把檔案上傳到原始儲存系統的同時，客戶端也會以平行的方式發送請求，以更新影片的 metadata 詮釋資料，其中包括檔案名稱、大小、格式等等。API 伺服器會用這些資料來更新 metadata 快取與 metadata 資料庫。'}
  ]}],
 quiz:[
  MC('sd14-s02-q1','高階設計的最基本三個構成元素是什麼？','sd14-s02-p01','圖 14-3 只有三個元素：客戶端、CDN、API 伺服器。','客戶端、CDN、API 伺服器。',[["客戶端、負載平衡器、資料庫","這些是進一步展開後才出現的元素。"],["CDN、轉碼伺服器、佇列","轉碼伺服器是後面才展開的細節。"],["API 伺服器、快取、儲存系統","最基本的三元素裡沒有快取。"]]),
  MC('sd14-s02-q2','為什麼影片申流走 CDN，而不是走 API 伺服器？','sd14-s02-p01','圖 14-3 明確把「影片申流」畫成客戶端直接對 CDN，其他事情才走 API 伺服器。','影片申流是 CDN 的職責，其他所有事情由 API 伺服器負責。',[["因為 API 伺服器不能傳輸大檔案","書中沒有這樣說，是職責分工的設計選擇。"],["因為 CDN 比較便宜","書中談的是職責分工，不是成本比較。"],["因為 CDN 才能做使用者驗證","使用者驗證等其他事情是 API 伺服器的職責。"]]),
  MC('sd14-s02-q3','轉碼完成後，圖 14-5 的步驟 3 平行做了哪兩件事？','sd14-s02-p03','3a 把已轉碼影片送到已轉碼儲存系統再送到 CDN；3b 把完成事件放進佇列讓處理程序更新 metadata。','已轉碼影片送到 CDN；轉碼完成事件更新 metadata 資料庫與快取。',[["只更新 metadata，不碰 CDN","3a 明確會把影片送到 CDN。"],["只送到 CDN，不更新 metadata","3b 明確會更新 metadata 資料庫與快取。"],["重新驗證使用者身分","跟這個步驟無關。"]]),
  MC('sd14-s02-q4','完成事件訊息佇列與完成事件處理程序的用途是什麼？','sd14-s02-p02','佇列存放「轉碼完成」事件，處理程序不斷從佇列提取事件並更新 metadata。','讓轉碼完成的通知非同步排隊，再由處理程序更新 metadata 資料庫與快取。',[["取代 metadata 資料庫","佇列與處理程序是更新資料庫的機制，不是取代。"],["直接把影片送給使用者","那是 CDN 的職責。"],["驗證影片版權","書中沒有把這個職責放在這裡。"]])
 ]
},
{
 id:'sd14-s03',order:3,title:'Resumable Upload：大檔與不穩網路的必要設計',duration:'38–55 分鐘',summary:'使用 upload session、byte range/chunk、checksum、retry 與 direct-to-storage，避免 1GB 影片因最後 1% 斷線全部重傳。',
 research:[{label:'YouTube Data API — Resumable Uploads',url:'https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol'}],
 pages:[
  {id:'sd14-s03-p01',title:'Upload Session',blocks:[
   {type:'stepper',steps:[['Create session','API 驗權限/metadata，回 upload URL。'],['Upload bytes','Client 對 session URL 傳 binary。'],['Checkpoint','Server 記錄已成功 range。'],['Resume','斷線後查 offset，從下一 byte 繼續。'],['Finalize','checksum/size 完整後標記 UPLOADED。']]}
  ]},
  {id:'sd14-s03-p02',title:'不要假設最後一個 Request 全收或全沒收',blocks:[
   {type:'p',text:'網路斷線時 client 可能不知道 server 已寫到哪。YouTube 官方 resumable protocol 可查 upload status，308 response Range 告訴已成功 byte offset，再續傳剩餘部分。'},
   {type:'callout',title:'Ambiguous Outcome',text:'Distributed upload 最危險的是 client timeout 後盲目重傳造成重複/覆寫；session + range state 解這個問題。'}
  ]},
  {id:'sd14-s03-p03',title:'Chunk Size Trade-off',blocks:[
   {type:'compare',items:[['大 Chunk','request overhead 少，但失敗重傳單位大。'],['小 Chunk','恢復細、progress 好，但 request/metadata overhead 高。'],['Parallel Chunks','更快但需排序/commit/checksum 與上限控制。']]}
  ]}],
 quiz:[
  MC('sd14-s03-q1','Resumable upload 最大價值？','sd14-s03-p01','斷線不必從 0 重傳大檔。','從已成功 offset 恢復。',[["讓 transcoding 不需要","無關。"],["讓影片永遠變小","不是。"],["讓 CDN 自動 encode","不是。"]]),
  MC('sd14-s03-q2','Client timeout 後為何先查 upload offset？','sd14-s03-p02','Server 可能已收到部分 bytes，結果具有 ambiguity。','避免盲目重傳或漏傳。',[["因為 HTTP 不支援 retry","支援。"],["因為 DB 一定掉線","不一定。"],["只為顯示進度條","不只。"]]),
  MC('sd14-s03-q3','Chunk 越小的代價？','sd14-s03-p03','更多 requests、headers、metadata/coordination。','Recovery granularity 換 request overhead。',[["一定更慢且不可用","不是絕對。"],["會讓 checksum 失效","不會。"],["會取消 resume","相反。"]]),
  MC('sd14-s03-q4','Upload finalize 前最應驗證？','sd14-s03-p01','預期 size/checksum/ranges 完整性。','確認 bytes 完整且未重疊/缺段。',[["只看 filename","不足。"],["只看 user agent","無關。"],["只看 thumbnail","太晚/無關。"]])
 ]
},
{
 id:'sd14-s04',order:4,title:'Metadata Flow 與 Publish Boundary',duration:'32–45 分鐘',summary:'Video bytes 與 metadata 可平行上傳，但只有 processing 完成且 policy 通過後才對觀看者 publish。',
 research:[{label:'YouTube Data API — Videos resource',url:'https://developers.google.com/youtube/v3/docs/videos'}],
 pages:[
  {id:'sd14-s04-p01',title:'Metadata 可以先寫，但 Public Read 要看 State',blocks:[
   {type:'p',text:'Title/description/privacy 可以在 upload session 前後更新；但 watch API 應檢查 video state=READY 且 visibility/ACL 通過。'}
  ]},
  {id:'sd14-s04-p02',title:'Publish Event 應在 Durable State 後',blocks:[
   {type:'diagram',nodes:[['Transcode Complete','all required outputs'],['Metadata Tx','READY + manifest version'],['Event','VideoReady'],['Cache/CDN','warm/invalidate'],['Viewer','discover/play']],caption:'不要先發 VideoReady 再發現 metadata transaction 失敗。'}
  ]},
  {id:'sd14-s04-p03',title:'Idempotent Completion Handler',blocks:[
   {type:'p',text:'Queue 可能重送 transcoding-complete event；handler 以 video_id + pipeline_version 去重，重複處理不能重複發布、重複計費或覆蓋新版本。'}
  ]}],
 quiz:[
  MC('sd14-s04-q1','Upload bytes 完成是否代表 viewer 一定可播放？','sd14-s04-p01','還可能需 transcoding/moderation/publish。','不一定，要等 READY。',[["一定可以","錯。"],["永遠不可以","也錯。"],["只看 title 是否存在","不足。"]]),
  MC('sd14-s04-q2','VideoReady event 最安全何時發？','sd14-s04-p02','READY/manifest durable commit 之後。','先 commit source of truth，再發事件。',[["Upload 開始就發","太早。"],["Client 打字 title 時","無關。"],["CDN miss 時才發","不是。"]]),
  MC('sd14-s04-q3','Completion handler 為何要 idempotent？','sd14-s04-p03','Queue/retry 可能重複 event。','避免重複 publish/side effect。',[["因為 event 永遠 exactly once","不能假設。"],["只為省 DB row","不只。"],["因為 CDN 不支援 retry","無關。"]]),
  MC('sd14-s04-q4','Manifest version 應跟什麼綁定？','sd14-s04-p02','一組可播放 renditions 的一致版本。','Pipeline/output version，避免混用半舊半新 segments。',[["User password version","無關。"],["Browser tab id","無關。"],["DNS TTL only","不是。"]])
 ]
},
{
 id:'sd14-s05',order:5,title:'第三步驟：深入設計——影片轉碼的 DAG 架構',duration:'42–60 分鐘',summary:'轉碼計算成本很高、不同創作者又需要不同處理步驟，所以書裡用「有向非循環圖」把整個轉碼流程拆成可平行、可分段執行的任務。',
 research:[{label:'SVE：Facebook 規模的分散式影片處理（DAG 模型的參考案例）',url:'https://www.cs.princeton.edu/~wlloyd/papers/sve-sosp17.pdf'},{label:'Weibo video processing architecture（微博視頻轉碼系統架構演進）',url:'https://www.upyun.com/opentalk/399.html'}],
 pages:[
  {id:'sd14-s05-p01',title:'為什麼需要有向非循環圖（DAG）',blocks:[
   {type:'p',text:'編碼解碼器（Codecs）：也就是壓縮與解壓縮的演算法，目的是縮小影片檔案大小，同時維持住影片的品質。最常用的影片 codecs 就是 H.264、VP9 與 HEVC。'},
   {type:'p',text:'對影片進行轉碼，是一種計算成本很高又很費時的工作。此外，不同的內容創作者需要處理的影片也有不同要求：舉例來說，有些人會自行在影片中添加浮水印，有些人則不會這麼做。為了支援不同的影片處理流程，並維持比較高的平行性（parallelism），書中用 DAG（Directed Acyclic Graph；有向非循環圖）程式設計模型，來實現所需要執行任務的方式。'},
   {type:'diagram',nodes:[['原始影片','分成三條並行路徑'],['影片','檢查／轉碼／略縮圖／浮水印'],['聲音','聲音編碼'],['詮釋資料','Metadata'],['組合','最終輸出']],caption:'圖 14-8：原始影片被切分成影片、聲音、詮釋資料三個部分，各自平行處理後再組合。'},
   {type:'bullets',items:['檢查：確保影片品質良好且沒有格式錯誤。','影片編碼：對影片進行轉換，以支援不同的解析度、編碼解碼器等等。','略縮圖：可以由使用者上傳，也可以由系統自動生成。','浮水印：浮在影片上面的圖片疊加層，其中可包含影片相關的標識資訊。']}
  ]},
  {id:'sd14-s05-p02',title:'影片轉碼架構的六個核心元件',blocks:[
   {type:'diagram',nodes:[['預處理器','preprocessor'],['DAG 排程器','拆成階段'],['資源管理工具','任務／工作程序配對'],['任務工作程序','worker 實際執行任務'],['臨時儲存空間','暫存 GOP 與 metadata'],['已編碼影片','最終輸出']],caption:'圖 14-10：影片轉碼架構的六個主要構成元素。'},
   {type:'p',text:'預處理器（preprocessor）有四項職責：'},
   {type:'stepper',steps:[['1. 影片分割','影片串流會被分割，或是進一步拆分成更小的 GOP（Group of Pictures；圖片群組）對齊方式。GOP 指的是照特定順序排列的一群畫面（frames），每一組畫面都是可獨立播放的單元，長度通常為幾秒鐘。'],['2. 相容舊裝置','有些比較老舊的行動裝置或瀏覽器，可能並不支援影片分割，預處理器會針對比較老舊的客戶端來正確完成工作。'],['3. DAG 生成','預處理器會根據 DAG 排程器設計師所編寫的設定檔案，生成相應的 DAG；最簡單的 DAG 範例只有 2 個節點（node）與 1 條連線（edge）：下載 → 轉碼。'],['4. 快取資料','為了提高可靠性，預處理器同時也會把對已分割影片的 GOP 與 metadata 詮釋資料進行快取，存放在臨時儲存空間中。如果影片編碼失敗，系統就可以用之前保存的資料來進行重試操作。']]}
  ]},
  {id:'sd14-s05-p03',title:'排程、資源管理與執行任務',blocks:[
   {type:'p',text:'DAG 排程器（DAG scheduler）會把 DAG 圖再劃分成好幾個階段的任務，然後放入資源管理工具的任務佇列中——例如第一階段先把原始影片拆分成影片、聲音、詮釋資料三個任務；第二階段才進行影片編碼、略縮圖、聲音編碼等等。'},
   {type:'p',text:'資源管理工具（resource management tool）負責管理資源分配的效率，內部包含三個佇列：'},
   {type:'compare',items:[['任務（Task）佇列','這是一個優先權佇列：包含目前所要執行的任務。'],['工作程序（Worker）佇列','這也是一個優先權佇列：包含工作程序（worker）目前的利用狀況相關資訊。'],['執行（Running）佇列','其中包含目前正在執行的任務／工作程序（task/worker）相關訊息。']]},
   {type:'stepper',steps:[['取得優先權最高的任務','任務排程器會從任務佇列中，取出具有最高優先權的任務（task）。'],['取得最佳工作程序','任務排程器再從工作程序佇列中，取出最適合執行任務的工作程序（worker）。'],['綁定並放入執行佇列','任務排程器會指派所選定的工作程序去執行任務（task），然後把任務與工作程序的資訊綁定起來，放入執行佇列中。'],['完成後移除','工作完成之後，任務排程器就會把執行佇列裡的這個工作移除掉。']]},
   {type:'p',text:'任務工作程序（task worker）則是實際執行 DAG 所定義任務的地方——不同工作程序可執行不同的任務，例如編碼、略縮圖、浮水印、合併程序。臨時儲存空間會運用到多種儲存系統，選擇哪一種取決於資料類型、大小、存取頻率、資料壽命等因素：舉例來說，metadata 詮釋資料快取的是一個不錯的主意，而這類資料的大小通常都不大，適合放入記憶體中；影片資料大小則變得比較大，適合放入 BLOB 儲存系統。相應的影片處理完成之後，就會釋放掉暫存空間裡的資料。'}
  ]}],
 quiz:[
  MC('sd14-s05-q1','為什麼影片轉碼架構要用 DAG（有向非循環圖）來設計？','sd14-s05-p01','轉碼計算成本高，不同創作者又需要不同處理步驟（例如是否加浮水印），DAG 可以表達依賴關係並維持平行性。','支援不同處理流程，同時維持較高的平行性。',[["因為影片檔案本身就是圖形資料","不是，DAG 描述的是任務流程，不是影片格式。"],["因為 API 伺服器無法處理影片","跟這個無關，是任務編排的設計選擇。"],["只是為了畫圖方便","DAG 有實際的執行順序與平行性意義。"]]),
  MC('sd14-s05-q2','預處理器（preprocessor）的四項職責不包含以下何者？','sd14-s05-p02','預處理器的職責是影片分割、相容舊裝置、生成 DAG、快取資料，不包含直接把影片編碼。','實際執行影片編碼工作。',[["把影片串流依 GOP 對齊方式分割","這是預處理器的職責之一。"],["根據設定檔案生成 DAG","這也是預處理器的職責之一。"],["把 GOP 與 metadata 快取到臨時儲存空間","這同樣是預處理器的職責之一。"]]),
  MC('sd14-s05-q3','資源管理工具內部的三個佇列分別是什麼？','sd14-s05-p03','任務佇列、工作程序佇列、執行佇列，各自扮演不同角色。','任務（Task）佇列、工作程序（Worker）佇列、執行（Running）佇列。',[["上傳佇列、下載佇列、快取佇列","書中沒有這樣的分類。"],["只有一個統一的任務佇列","實際上分成三個各司其職的佇列。"],["Master 佇列與 Slave 佇列","這是資料庫複寫的概念，跟資源管理工具無關。"]]),
  MC('sd14-s05-q4','GOP（Group of Pictures）指的是什麼？','sd14-s05-p02','GOP 是照特定順序排列的一群畫面，每一組都是可獨立播放的單元。','照特定順序排列、可獨立播放的一組畫面（frames），長度通常為幾秒鐘。',[["影片的音軌分段","GOP 描述的是畫面，不是聲音。"],["CDN 節點的分組方式","GOP 是轉碼前處理的概念，跟 CDN 節點分組無關。"],["Metadata 資料庫的分片單位","分片是資料庫概念，GOP 是影片畫面群組。"]])
 ]
},
{
 id:'sd14-s06',order:6,title:'影片串流：從「下載」到「串流」，以及常見的串流協定',duration:'42–58 分鐘',summary:'串流讓觀眾邊下載邊播放，不必等整部影片載完；書裡也點名了幾個常見的串流協定，以及位元速率、容器等基本概念。',
 research:[{label:"Here's What You Need to Know About Streaming Protocols",url:'https://www.dacast.com/blog/streaming-protocols/'}],
 pages:[
  {id:'sd14-s06-p01',title:'下載 vs 串流',blocks:[
   {type:'compare',items:[['下載（downloading）','必須等整部影片下載完畢，才能開始播放。'],['串流（streaming）','把原始影片先複製一份到你的設備中，一邊接收影片串流一邊播放，觀眾端只需要載入最前面一小段資料，就能以連續方式播放影片，不必等整部影片下載完成。']]},
   {type:'p',text:'當你在 YouTube 觀看影片時，通常馬上就能開始申流播放，而不必等整部影片下載完畢（圖 14-7）。影片會直接從離你最近的 CDN edge 伺服器進行串流，因此不會有太大的延遲；客戶端並不需要了解 CDN 進行申流的內部設計細節。'}
  ]},
  {id:'sd14-s06-p02',title:'幾種受歡迎的串流協定',blocks:[
   {type:'p',text:'在討論影片申流的流程之前，我們先來看一個重要的概念：串流協定（streaming protocol）。這是一種控制影片申流資料傳輸的標準化方法。最受歡迎的幾種串流協定如下：'},
   {type:'compare',items:[['MPEG-DASH','MPEG 代表「Moving Picture Experts Group」（動態圖像專家群組），DASH 則代表「Dynamic Adaptive Streaming over HTTP」（透過 HTTP 進行的動態自適應申流）。'],['Apple 的 HLS','HLS 代表「HTTP Live Streaming」（HTTP 即時申流）。'],['Microsoft 的 Smooth Streaming','平順申流。'],['Adobe 的 HDS','HDS 代表「HTTP Dynamic Streaming」（HTTP 動態申流）。']]},
   {type:'callout',title:'不需要完全理解底層細節',text:'你並不需要完全理解這些申流協定的名稱，甚至不需要記住這些申流協定的名稱，是特定領域專業知識的底層細節。在設計影片申流服務時，我們該知道的是：各自支援不同的影片編碼與回放器，以支援不同的播放協定，必須選擇正確的協定設計，才不會有太大的延遲。'}
  ]},
  {id:'sd14-s06-p03',title:'位元速率（bitrate）與容器（container）',blocks:[
   {type:'p',text:'當你在錄製影片時，錄影設備（通常是手機或攝影設備）會製作出特定格式的影片。如果想讓影片在其他設備上播放，就必須把影片檔案轉成相容的格式。位元速率（bitrate）指的是在一定時間內處理位元（bit）資料的速度——比特率越高，通常也就代表申流的影片品質越高，同時越需要更快的網路速度。'},
   {type:'bullets',items:['原始影片會佔用大量的儲存空間：以每秒 60 幀（frame；畫面）的速度錄製影片時，可能就會佔用掉好幾百 GB 的空間。','許多設備與瀏覽器都只支援特定類型的影片格式，因此把影片編碼成不同格式是一件很重要的事。','為了確保使用者在觀看影片時能同時保持播放的流暢性，一種好做法是：只給網路頻寬較低的使用者提供較低解析度的影片，網路頻寬較高的使用者則提供較高解析度的影片。','網路的狀況有可能隨時改變，我們可以自動或以人工方式切換影片畫質，這對於提供使用者體驗較好、較流暢的播放而言是很重要的事。']},
   {type:'p',text:'容器（container）：這就像一個籃子，把影片、聲音與 metadata 詮釋資料全都放在裡面。有很多種類型的編碼格式可供使用，不過大多包含其中兩個部分，你可以藉由檔案的副檔名（例如 .avi、.mov 或 .mp4）來區分容器的格式。'}
  ]}],
 quiz:[
  MC('sd14-s06-q1','串流（streaming）跟下載（downloading）最主要的差別是什麼？','sd14-s06-p01','下載要等整部影片載完才能播放；串流則是邊接收邊播放。','串流不必等整部影片下載完成，只要載入前面一小段就能開始連續播放。',[["串流不需要網路連線","串流仍然需要持續的網路連線。"],["下載的畫質一定比較差","畫質跟下載/串流無關，是另一個變因。"],["串流只能用在直播","隨選影片（VOD）一樣可以用串流方式播放。"]]),
  MC('sd14-s06-q2','書中提到的四種常見串流協定是？','sd14-s06-p02','MPEG-DASH、Apple 的 HLS、Microsoft 的 Smooth Streaming、Adobe 的 HDS，各自是不同公司推出的標準。','MPEG-DASH、HLS、Smooth Streaming、HDS。',[["TCP、UDP、HTTP、FTP","這些是通用網路協定，不是影片申流專用協定。"],["H.264、VP9、HEVC、AV1","這些是編碼解碼器（codec），不是串流協定。"],["360p、480p、720p、1080p","這些是解析度，不是串流協定。"]]),
  MC('sd14-s06-q3','面試時對串流協定該有的態度是？','sd14-s06-p02','書中明確說不需要完全理解或記住協定名稱的底層細節，重點是知道要選對協定。','知道這些協定存在、且選擇正確協定很重要即可，不必深入底層細節。',[["必須背出每個協定的封包格式","書中明確說不需要到這種程度。"],["完全不需要知道有這些協定","至少要知道存在，才能在設計時考慮進去。"],["只要選最新出的協定就好","協定選擇要看裝置支援度等因素，不是比新舊。"]]),
  MC('sd14-s06-q4','為什麼同一支影片要提供多種畫質版本？','sd14-s06-p03','讓網路頻寬較低的使用者也能取得能流暢播放的較低解析度版本。','讓不同網路頻寬的使用者都能得到流暢的播放體驗。',[["只是為了增加儲存成本","這是必要的權衡代價，不是目的本身。"],["因為 CDN 只能傳一種畫質","CDN 可以傳送多種畫質版本。"],["因為容器格式規定一定要有多個版本","容器只是包裝影片/聲音/metadata 的格式，跟畫質數量無關。"]])
 ]
}
);
})();