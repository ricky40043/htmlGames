(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_14;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd14-s07',order:7,title:'CDN、Origin 與 Hot Video',duration:'38–55 分鐘',summary:'把 viewer traffic 從 origin 移到 edge；理解 cache hit、origin shield、popular video、cold miss 與 signed delivery。',
 research:[{label:'Understanding the characteristics of internet short video sharing（影片受歡迎程度與存取模式的實測研究）',url:'https://arxiv.org/pdf/0707.3670.pdf'}],
 pages:[
  {id:'sd14-s07-p01',title:'Playback Bytes 主要走 CDN',blocks:[
   {type:'diagram',nodes:[['Viewer','manifest/segment'],['Edge CDN','hot chunks'],['Origin Shield','optional'],['Object Storage','source of truth']],caption:'API server 不承擔大部分 video egress。'}
  ]},
  {id:'sd14-s07-p02',title:'Hot Video 是 CDN 的甜蜜點',blocks:[
   {type:'p',text:'同一 segment 被大量 viewers 重複讀，edge hit ratio 高；origin bandwidth 大幅下降。新影片/長尾影片則更可能 cold miss。'},
   {type:'callout',title:'Cache Key',text:'video_id + rendition + segment/version，不能因 token/query noise 讓同一 segment 形成大量 cache variants。'}
  ]},
  {id:'sd14-s07-p03',title:'Origin 失敗要有 Degraded Strategy',blocks:[
   {type:'bullets',items:['edge stale serve where safe','multi-origin / replicated object storage','short retry budget','manifest fallback to available rendition','prewarm predictable premieres']}
  ]}],
 quiz:[
  MC('sd14-s07-q1','CDN 對影片系統最直接的價值？','sd14-s07-p01','把重複 playback bytes 從靠近使用者的 edge 提供。','降低 origin egress 與 latency。',[["取代 metadata DB","不是。"],["負責所有 transcoding","不是。"],["保證影片內容合法","不是。"]]),
  MC('sd14-s07-q2','Hot video 為何 CDN hit 高？','sd14-s07-p02','大量 viewers 讀相同 segments。','高重用讓 edge cache 有效。',[["因為影片一定更短","無關。"],["因為 hot video 不需 storage","錯。"],["因為每 user 都拿不同 bytes","相反。"]]),
  MC('sd14-s07-q3','Cache key 帶大量無關 query token 可能？','sd14-s07-p02','造成同一 segment 被分成很多 cache objects，hit ratio 下降。','Cache fragmentation。',[["提高 hit ratio","相反。"],["自動縮影片","不會。"],["解決 auth","不一定。"]]),
  MC('sd14-s07-q4','Origin 暫時失敗時哪個策略較成熟？','sd14-s07-p03','使用 edge cached/stale content、replicated origin、有限 retry。','Fail-soft，不要讓所有 viewers 同時打爆 origin。',[["所有 client 無限 retry","會放大故障。"],["刪 CDN cache","更糟。"],["重建全部影片","不合理。"]])
 ]
},
{
 id:'sd14-s08',order:8,title:'Playback Flow：Manifest、Segments、ABR 與 Startup Latency',duration:'38–54 分鐘',summary:'從點擊 Play 到第一個 frame，拆 manifest、auth、edge lookup、segment download、buffer 與 quality switch。',
 research:[{label:'YouTube scalability talk by early YouTube employee（YouTube 早期員工的擴展性演講）',url:'https://www.youtube.com/watch?v=w5WVu624fY8'}],
 pages:[
  {id:'sd14-s08-p01',title:'Startup Path 要短',blocks:[
   {type:'stepper',steps:[['Get metadata','visibility + manifest URL'],['Fetch manifest','renditions'],['Choose initial bitrate','保守起播'],['Fetch first segment','prefer nearby edge'],['Decode','first frame'],['Adapt','subsequent segments']]}
  ]},
  {id:'sd14-s08-p02',title:'第一段不一定選最高畫質',blocks:[
   {type:'p',text:'為縮短 startup time，player 常保守選一個可快速取得的 rendition；累積 throughput/buffer evidence 後再升。'}
  ]},
  {id:'sd14-s08-p03',title:'Client Buffer 是重要 State',blocks:[
   {type:'bullets',items:['buffer seconds 過低 → 降 bitrate','buffer 健康 → 可嘗試升 bitrate','seek → 新 range/segments','playback speed 改變 consumption rate']}
  ]}],
 quiz:[
  MC('sd14-s08-q1','播放第一步為何不是直接拉 1GB 檔？','sd14-s08-p01','Streaming 以 manifest + segments 支援快速起播與 adaptive quality。','分段下載可快速開始播放。',[["因為 HTTP 不能傳大檔","可以。"],["因為 object storage 不能讀","可以。"],["只為縮短 URL","不是。"]]),
  MC('sd14-s08-q2','Initial bitrate 為何常保守？','sd14-s08-p02','先減少 startup/rebuffer 風險，再根據實測升畫質。','Startup latency 優先。',[["因為高畫質永久禁止","不是。"],["因為 CDN 沒高畫質","不一定。"],["因為 metadata 只支援 360p","不是。"]]),
  MC('sd14-s08-q3','ABR 為何看 buffer seconds？','sd14-s08-p03','Buffer 是抵抗網路抖動的安全墊。','決定能否承受更高 bitrate。',[["只為算 storage","不是。"],["因為 buffer 是 DB cache","不是。"],["因為 throughput 不重要","兩者都重要。"]]),
  MC('sd14-s08-q4','Seek 到影片尾端時典型行為？','sd14-s08-p03','請求新的 segments/range，不需下載前面全部內容。','Random access 到目標 segments。',[["必須從第 0 byte 重播","不必要。"],["重新 transcoding","不需要。"],["重新 upload","無關。"]])
 ]
},
{
 id:'sd14-s09',order:9,title:'Failure Recovery：Retry、Checkpoint、DLQ 與 Partial Success',duration:'40–56 分鐘',summary:'處理 upload 中斷、worker crash、部分 rendition 失敗、queue redelivery、CDN/origin outage 與 publish race。',
 research:[{label:'YouTube Data API — Resumable upload recovery',url:'https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol'}],
 pages:[
  {id:'sd14-s09-p01',title:'每一階段都要定義 Durable Boundary',blocks:[
   {type:'compare',items:[['Upload','range/checksum state durable。'],['Transcode','job state + deterministic output。'],['Publish','metadata READY transaction durable。'],['Playback','CDN edge 可從 replicated origin 恢復。']]}
  ]},
  {id:'sd14-s09-p02',title:'Partial Rendition Failure',blocks:[
   {type:'p',text:'1080p encode 失敗但 360/720p 成功，產品可以選擇先 READY 低畫質再補高畫質，或要求 minimum rendition set 完整後才 READY。'},
   {type:'callout',title:'這是產品 Requirement',text:'不要把「所有 rendition 都要成功」當成天然真理。'}
  ]},
  {id:'sd14-s09-p03',title:'Retry 要避免 Failure Amplification',blocks:[
   {type:'bullets',items:['exponential backoff + jitter','retry budget','per-stage circuit breaker','DLQ/manual inspection','poison file detection','worker lease/visibility timeout']}
  ]},
  {id:'sd14-s09-p04',title:'API 伺服器與 Metadata 資料庫：無狀態的可以直接換，有狀態的要看角色',blocks:[
   {type:'p',text:'API 伺服器本身不保存任何跟特定使用者綁定的 state，一台當機，Load Balancer 健康檢查失敗後直接把流量導到其他伺服器，不需要任何資料搬遷。Metadata 資料庫就不一樣：它保存的是系統的 source of truth，故障處理要看掛掉的是哪個角色。'},
   {type:'compare',items:[['API 伺服器（stateless）','當機＝少一台可用容量；只要備援容量足夠，切換幾乎無感。'],['Metadata 資料庫 Master','當機＝寫入路徑斷了，必須有 Slave 可以被提升為新 Master。'],['Metadata 資料庫 Slave','當機＝讀取容量下降；啟動新 Slave 並從 Master 同步資料補上。']]},
   {type:'callout',title:'面試判斷',text:'看到「某個角色的節點掛了」，先問這個角色是不是 stateless、是不是唯一寫入點；這決定了復原是「換一台就好」還是需要 promotion／resync 流程。'}
  ]},
  {id:'sd14-s09-p05',title:'複寫的快取與有副本的佇列：不要只設計一個「唯一」節點',blocks:[
   {type:'p',text:'Metadata 快取如果只有單一節點，一旦當機，所有查詢會直接打到資料庫，資料庫負擔瞬間暴增，形成第二次故障。因此快取資料通常會複寫到多個節點：任一節點掛掉，其他節點還能繼續服務，再把有問題的節點替換掉。'},
   {type:'stepper',steps:[['偵測','監控發現某個快取或佇列節點沒有回應。'],['旁路','讀取／寫入改走其他還健康的節點或副本。'],['替換','啟動新節點加入叢集，恢復原本的容量與備援程度。'],['驗證','確認新節點資料已同步，才視為完全恢復。']]},
   {type:'bullets',items:['資源管理工具的任務佇列、工作程序佇列、執行佇列，也適用同樣的道理：佇列節點壞了，切到副本佇列，不讓整個轉碼管線因為單一節點而全部停擺。','任務工作程序（worker）當機時，任務排程器會偵測到沒有回應，把它手上未完成的任務重新指派給其他工作程序執行。']},
   {type:'callout',title:'共同模式',text:'API 伺服器、Metadata 快取、資源管理工具的佇列、任務工作程序——這些角色的共同設計原則都是「不能只有一個必要節點」，故障時才有東西可以頂替。'}
  ]}],
 quiz:[
  MC('sd14-s09-q1','為何每 stage 要有 durable boundary？','sd14-s09-p01','Crash 後能知道從哪裡安全重做。','支援 recovery 與 exactly-once-like side effects。',[["讓所有 worker 無 state","不是。"],["取消 retry","相反。"],["只為 logging","不只。"]]),
  MC('sd14-s09-q2','1080p 失敗是否一定阻擋 READY？','sd14-s09-p02','取決於 minimum playable set / product requirement。','可以定義 degraded publish。',[["一定阻擋","不一定。"],["一定忽略","也不一定。"],["只看 thumbnail","不足。"]]),
  MC('sd14-s09-q3','Worker 失敗後所有 job 立即無限重試，風險？','sd14-s09-p03','Retry storm 放大依賴故障與成本。','Backoff/jitter/budget。',[["會自動修復 root cause","不會。"],["一定降低 backlog","不一定。"],["不影響下游","錯。"]]),
  MC('sd14-s09-q4','Poison video 指什麼？','sd14-s09-p03','某輸入每次都 deterministic 觸發 transcoder crash/failure。','需要隔離/DLQ，不應無限重試。',[["熱門影片","不是。"],["被 cache 的影片","不是。"],["只有 metadata 缺 title","不一定。"]]),
  MC('sd14-s09-q5','API 伺服器當機時，為什麼可以直接換一台而不用搬遷任何資料？','sd14-s09-p04','API 伺服器是 stateless 的，沒有跟特定使用者綁定的狀態需要搬遷。','負載平衡器把流量導到其他健康伺服器即可。',[["因為它會自動備份使用者密碼","與此無關。"],["因為 DNS TTL 很短","不是主因。"],["因為它跟 CDN 是同一台機器","架構上不是同一層。"]]),
  MC('sd14-s09-q6','Metadata 資料庫的 Master 節點當機，最直接的復原方式是？','sd14-s09-p04','需要有 Slave 可以被提升為新的 Master，才能恢復寫入能力。','把一個 Slave 提升為新 Master。',[["直接把所有請求導到 CDN","CDN 不處理資料庫寫入。"],["重開 API 伺服器就好","API 伺服器本身沒有寫入能力問題。"],["等待使用者重新整理頁面","無法解決寫入路徑斷裂。"]])
 ]
},
{
 id:'sd14-s10',order:10,title:'節省成本的最佳化做法',duration:'40–56 分鐘',summary:'CDN 是很重要但成本很高的一環，書裡給了四個實際降低成本的做法，其中第一個就是模擬關卡「CDN 只服務熱門內容」的原型。',
 research:[{label:'Content Popularity for Open Connect（Netflix 內容受歡迎程度研究）',url:'https://netflixtechblog.com/content-popularity-for-open-connect-b86d56f613b'}],
 pages:[
  {id:'sd14-s10-p01',title:'CDN 是我們計算中一個很重要的構成元素',blocks:[
   {type:'p',text:'CDN 可以確保影片在全球範圍內快速傳遞到使用者的設備中，達到低延遲的播放效果，不過 CDN 的成本很昂貴。影片庫裡有一小部分影片非常受歡迎，同時卻也有大量影片幾乎沒什麼人在看。基於這樣的觀察，我們可以只針對真正受歡迎的內容使用 CDN：'},
   {type:'diagram',nodes:[['使用者','觀眾'],['CDN','只提供最受歡迎的影片'],['自家 Video 伺服器','提供其他所有影片']],caption:'圖 14-27：只在 CDN 提供最受歡迎的影片，其他影片則由我們自己的高容量影片伺服器來提供服務。'}
  ]},
  {id:'sd14-s10-p02',title:'針對長尾內容的做法',blocks:[
   {type:'bullets',items:['針對沒那麼受歡迎的內容，我們或許並不需要儲存很多不同編碼的影片版本，可以根據實際的觀看情況，決定要不要幫比較短的冷門影片進行編碼。','有些影片只在特定地區特別受歡迎，這些影片就不必分配到其他地區了。']}
  ]},
  {id:'sd14-s10-p03',title:'自建 CDN 並與 ISP 合作',blocks:[
   {type:'p',text:'建立自己的 CDN（例如 Netflix），並與 ISP（網路服務提供商）合作。打造自己的 CDN 將是一個龐大的專案，不過這對於媒體公司來說，或許是有意義的做法：可以跟 Comcast、AT&T、Verizon 這類 ISP 合作，這裡所說的 ISP 有可能是世界各地都有據點的網路供應商，而且都與使用者很接近。只要與 ISP 合作，就可以改善觀看體驗，並減少頻寬費用。'}
  ]}],
 quiz:[
  MC('sd14-s10-q1','書中提出的第一個節省成本做法是什麼？','sd14-s10-p01','只在 CDN 提供最受歡迎的影片，其他影片則由自己的高容量影片伺服器提供服務。','CDN 只服務最受歡迎的內容，冷門內容改由自己的伺服器提供。',[["把所有影片都放進 CDN","這正是成本過高的做法，書中建議反過來做。"],["完全不使用 CDN","CDN 對熱門內容仍然很有價值，只是不該用在冷門內容上。"],["把所有影片都刪除只留熱門的","書中沒有建議刪除內容，只是改變提供服務的位置。"]]),
  MC('sd14-s10-q2','針對長尾（冷門）影片，書中建議的做法是什麼？','sd14-s10-p02','可以根據實際觀看情況，決定要不要幫比較短的冷門影片編碼，不必先產生所有版本。','依實際觀看情況決定是否編碼，不必一律預先產生多種畫質版本。',[["一律產生所有畫質版本","這樣會浪費計算與儲存資源，正是要避免的。"],["一律拒絕上傳冷門影片","書中沒有這樣的限制。"],["把冷門影片畫質都調成最低","書中談的是「要不要編碼」，不是強制降畫質。"]]),
  MC('sd14-s10-q3','為什麼「只在特定地區受歡迎的影片」不必分配到其他地區？','sd14-s10-p02','那些地區的使用者根本不會去看，分配過去只是浪費頻寬與儲存成本。','其他地區的使用者不會觀看，分配過去沒有效益，只會增加成本。',[["因為版權法律禁止跨區","書中談的是成本考量，不是法律限制。"],["因為影片格式不相容","跟格式無關，是使用地區的問題。"],["因為 CDN 節點數量有限","書中的重點是效益，不是節點數量限制。"]]),
  MC('sd14-s10-q4','自建 CDN 並與 ISP 合作的做法，主要適合什麼情境？','sd14-s10-p03','書中提到這對媒體公司來說可能是有意義的大型專案，例如 Netflix 就是這樣做的。','規模夠大、值得投入龐大專案成本的媒體公司（例如 Netflix 這樣的案例）。',[["適合所有規模的新創公司","書中明確說這是「龐大的專案」，不是任何規模都划算。"],["這樣做完全不需要跟 ISP 談合作","恰好相反，重點就是要跟 ISP 合作。"],["這個做法會讓延遲變高","目的是讓 CDN 節點更接近使用者，藉此降低延遲。"]])
 ]
},
{
 id:'sd14-s11',order:11,title:'安全性最佳化：預簽名上傳網址與保護你的影片',duration:'38–54 分鐘',summary:'安全性是任何產品最重要的一個面向——先看客戶端怎麼安全地把影片直接傳到儲存系統，再看已發布的影片如何防止被任意盜版。',
 research:[{label:'Delegate access with a shared access signature（Microsoft 對預簽名網址的官方說明）',url:'https://docs.microsoft.com/en-us/rest/api/storageservices/delegate-access-with-shared-access-signature'}],
 pages:[
  {id:'sd14-s11-p01',title:'上傳端不能什麼都信任',blocks:[
   {type:'p',text:'上傳流程收到的是使用者提供的檔案，屬於不受信任的輸入來源，一般會做以下這些檢查：'},
   {type:'bullets',items:['檔案格式／容器格式驗證，避免收到偽裝成影片的其他檔案。','限制單次上傳的資源用量，避免異常檔案拖垮處理程序。','掃描惡意內容。','比對版權資料庫，偵測可能侵權的內容。','審核色情或其他違法內容。']}
  ]},
  {id:'sd14-s11-p02',title:'安全性最佳化：預簽名上傳網址',blocks:[
   {type:'p',text:'安全性是任何產品最重要的其中一個面向。為了確保只有經過授權的使用者可以把影片上傳到正確的位置，我們導入所謂的預簽名網址（pre-signed URL）。'},
   {type:'diagram',nodes:[['使用者','客戶端'],['API 伺服器','驗證並簽發網址'],['原始儲存系統','接收實際的影片檔案']],caption:'圖 14-26：上傳流程改成先跟 API 伺服器要一個「通行證」，再拿著它直接把影片送到儲存系統。'},
   {type:'stepper',steps:[['1. 請求上傳','客戶端向 API 伺服器發出 HTTP 請求，以取得預簽名網址。'],['2. 取得預簽名網址','API 伺服器把存取權限提供給指定的物件，這個說法「預簽名網址」裡所說的物件，其實是把存取權限授予檔案上傳到 Amazon S3 時會用到的一個術語。其他雲端服務供應商可能會採用其他的名稱，例如 Microsoft Azure BLOB 儲存系統也支援相同的功能，稱其名稱為「共享存取簽章」（Shared Access Signature）。'],['3. 上傳影片','客戶端一收到預簽名網址，就用這個預簽名網址來上傳影片，直接送到原始儲存系統，不必再經過 API 伺服器中轉。']]}
  ]},
  {id:'sd14-s11-p03',title:'保護你的影片',blocks:[
   {type:'p',text:'許多內容創作者並不願意自己在網路上發佈的原始影片被任意盜版。為了保護那些受版權保護的影片，我們有以下三種安全性選項可供選擇：'},
   {type:'compare',items:[['DRM（Digital Rights Management；數位版權管理）系統','目前三個主要的 DRM 系統分別是 Apple FairPlay、Google Widevine、Microsoft PlayReady。你可以對影片進行加密，並設定授權策略。'],['AES 加密','你可以對影片進行加密，只有已授權使用者才能觀看到加密過的影片。'],['視覺浮水印','這是在影片的畫面疊加一層圖片（可以是你的公司 logo 或名稱），來做為浮水印標識資訊。']]}
  ]}],
 quiz:[
  MC('sd14-s11-q1','上傳端為什麼要對使用者上傳的檔案做資源限制與格式驗證？','sd14-s11-p01','使用者提供的檔案屬於不受信任的輸入來源，需要驗證與限制才能避免被異常/惡意內容拖垮。','使用者上傳的內容是不受信任的輸入，需要驗證與限制資源用量。',[["只是為了縮短檔案名稱","跟檔案名稱無關。"],["因為 CDN 硬性要求","這是上傳端本身該做的安全把關，不是 CDN 的要求。"],["只影響熱門影片","跟影片是否熱門無關，任何上傳都要檢查。"]]),
  MC('sd14-s11-q2','預簽名網址（pre-signed URL）流程的三個步驟依序是？','sd14-s11-p02','客戶端請求上傳→API 伺服器回傳預簽名網址→客戶端用這個網址直接上傳到原始儲存系統。','請求上傳、取得預簽名網址、直接上傳影片。',[["直接上傳、事後驗證、事後刪除","預簽名網址是「先驗證再上傳」，不是先上傳後驗證。"],["註冊帳號、登入、上傳","這題談的是上傳授權機制，不是帳號註冊流程。"],["上傳、轉碼、發佈","這是後續的處理流程，不是預簽名網址本身的三步驟。"]]),
  MC('sd14-s11-q3','Microsoft Azure BLOB 儲存系統把「預簽名網址」這個概念稱為什麼？','sd14-s11-p02','書中提到 Azure 用「共享存取簽章」（Shared Access Signature）稱呼相同概念的功能。','共享存取簽章（Shared Access Signature）。',[["Signed Cookie","這是書中沒有提到的另一種機制名稱。"],["OAuth Token","OAuth 是另一套授權標準，不是書中提到的 Azure 對應名稱。"],["CDN Token","書中提到的是儲存系統層級的授權機制，不是 CDN token。"]]),
  MC('sd14-s11-q4','書中提到保護已發布影片的三種安全性選項是？','sd14-s11-p03','DRM 系統、AES 加密、視覺浮水印，各自的保護方式不同。','DRM 系統、AES 加密、視覺浮水印。',[["防火牆、VPN、密碼","這些是一般網路安全機制，不是書中談影片保護的三個選項。"],["備份、複寫、快照","這些是資料可靠性做法，跟版權保護是不同的問題。"],["負載平衡、自動擴縮容、監控","這些是可用性/擴展性做法，不是版權保護做法。"]])
 ]
},
{
 id:'sd14-s12',order:12,title:'Multi-Region、Observability 與 Live Streaming 邊界',duration:'42–58 分鐘',summary:'完成全球 upload/playback routing、replicated metadata、CDN、transcode locality、DR 與 QoE telemetry；最後區分 VOD 與 Live。',
 research:[],
 pages:[
  {id:'sd14-s12-p01',title:'Region 不是每個 Component 都 Active-Active',blocks:[
   {type:'bullets',items:['Playback CDN 全球 edge。','Upload 可就近 ingress，再跨 region durable replicate。','Metadata 可 home-region + replica 或 globally distributed DB。','Transcode jobs 優先靠近 source/storage/GPU pool。']}
  ]},
  {id:'sd14-s12-p02',title:'QoE Metrics 比 CPU 更接近產品',blocks:[
   {type:'compare',items:[['Upload','success/resume rate、time-to-upload。'],['Processing','queue age、transcode time、failure by codec。'],['Playback','startup、rebuffer、quality switches、CDN hit、video start failure。'],['Cost','egress/video-minute、transcode-minute、storage/video。']]}
  ]},
  {id:'sd14-s12-p03',title:'Live Streaming 為何是另一題',blocks:[
   {type:'p',text:'Live 也有 ingest/encode/CDN，但不能等待完整檔案、latency 更敏感、segment 很短、producer 還在持續產生內容，故 recovery/ordering 與 delay trade-off 不同。'}
  ]},
  {id:'sd14-s12-p04',title:'完整 YouTube Interview Checklist',blocks:[
   {type:'code',text:'□ scope + video bytes estimate\n□ direct/resumable upload\n□ metadata + state machine\n□ transcode DAG + renditions\n□ object storage + CDN\n□ manifest/ABR playback\n□ retry/idempotency/DLQ\n□ cost + security/takedown\n□ multi-region + QoE metrics'}
  ]}],
 quiz:[
  MC('sd14-s12-q1','為什麼 transcoding worker 不一定全球 active-active 同一 job？','sd14-s12-p01','需要避免重複昂貴工作，通常有 job ownership/lease。','可多 region capacity，但單 job 要有明確 ownership/idempotency。',[["因為 GPU 不能跨 region","不是。"],["因為 queue 不能 replicate","可以。"],["因為影片只能一個 region 看","錯。"]]),
  MC('sd14-s12-q2','Playback 最重要 observability 之一？','sd14-s12-p02','startup/rebuffer 直接反映 viewer QoE。','Startup latency / rebuffer ratio。',[["只看 API CPU","不足。"],["只看 title update rate","不是。"],["只看 repository commits","無關。"]]),
  MC('sd14-s12-q3','Live 與 VOD 最大流程差異之一？','sd14-s12-p03','內容仍在生成，無法先完成全檔 transcoding再 publish。','低 latency continuous ingest/encode/delivery。',[["Live 不需要 CDN","仍常需要。"],["Live 不需要 encode","仍需要。"],["VOD 一定比 live 更即時","相反。"]]),
  MC('sd14-s12-q4','完整 YouTube 題最核心 cost drivers？','sd14-s12-p04','Storage、transcode compute、CDN/egress。','Media bytes 與 processing cost。',[["只有 metadata DB connections","太局部。"],["只有 login QPS","不是。"],["只有 DNS lookup","不是。"]])
 ]
}
);
})();