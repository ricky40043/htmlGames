addChapter('mailflow', '第 5 章', '第 2 步：寄件與收件資料流', [
    scene('send-flow', '寄件流程：從按下寄送到外站接手（圖 8.6）', '281–282', 'client~Webmail~撰寫後以 HTTPS 送出~phone;lb~負載平衡器~入口限流及導流~gate;web~Web 伺服器~格式、大小與網域驗證~server;out~傳出佇列~耐久保存郵件資料~queue;error~錯誤佇列~基本驗證失敗及後續處理~warn;worker~SMTP 傳出 Worker~垃圾信、病毒、重試~gear;store~已寄件與儲存~寄件者 Sent 和追蹤狀態~db;remote~收件方 SMTP~跨網域交接~cloud', 'client>lb lb>web web>out web>error out>worker worker>store worker>remote', [
        ['client|lb|web', '寄件從 Webmail 的按鈕開始。請求先到負載平衡器，入口檢查是否超過限流，再將工作分配給 Web 伺服器。透過這一段先吸收無效尖峰，可以保護後面的郵件 Worker。'],
        ['web|error', 'Web 伺服器執行基本檢查，例如地址格式、內容或附件是否超過大小限制。教材圖將無法通過的資料導向錯誤佇列。有些可立刻判定的錯誤也會由 Web 端回覆，讓使用者知道哪裡要改。'],
        ['web|out|worker', '需要跨網域的郵件放入傳出佇列。佇列保存足夠重建寄件的詮釋資料及大型附件引用。SMTP Worker 從佇列拉出工作，檢查垃圾郵件與病毒，再準備連線投遞。'],
        ['worker|store|remote', '寄件者的已寄件資料夾會保留郵件。Worker 再按收件者網域連到外部 SMTP 主機。收到遠端成功回覆，也只表示對方接手；對方如何分類及最終收件狀態仍要分開記錄。'],
        ['out|worker', '佇列把面對使用者的 HTTP 入口和可能很慢的 SMTP 任務分開。因此外站暫時故障時，已受理的工作仍然保存。也可以只增加 SMTP 消費者數量，無需跟所有 Web 伺服器一起擴容。']
    ]),
    scene('in-domain', '同域寄送、退避與佇列觀測', '281–282、291', 'web~Web 入口~比較寄件及收件網域~server;local~同網域路徑~先檢查，再寫入兩側資料夾~folder;external~跨網域路徑~等 SMTP 回應~cloud;defer~退避重試~暫時失敗，逐步延長~clock;dlq~失敗處理~到期與永久失敗~warn;metrics~監控~深度、最老工作、消費速率~gear', 'web>local web>external external>defer defer>external defer>dlq defer>metrics', [
        ['web|local', '如果寄收件者同網域，可以在先檢查垃圾信和惡意內容後，直接寫寄件端的已寄件和收件端的收件匣。收件者透過 REST API 得到信件。這條路徑不用經過外站 SMTP，因此省去一次網路交接。'],
        ['external|defer', '跨網域若收到暫時錯誤，就安排以指數退避拉長間隔。例如一分鐘、兩分鐘、四分鐘，再加少量隨機抖動避免同時重試。若已確定某個收件人永久失敗，應停送該地址並回報。'],
        ['defer|dlq', '寄給三個人時，記錄三份結果。Alice 已成功，Bob 的伺服器暫時拒收，第三個地址無效。重試時只處理 Bob。超過上限或運營人員需要處理的工作，移進失敗佇列並發出通知。'],
        ['metrics', '傳出佇列變長時先查看最老工作等待多久，再依目的網域分組。只有某個供應商延遲，可能是對方暫時無法接手。所有網域都積壓，才比較像是自己消費能力不足。'],
        ['defer|metrics', '實驗會調整入站工作速率、Worker 數和外站容量。如果瓶頸在外站，增加自己的 Worker 也無法提高交接速率。要先區別積壓的原因，再選重試、限流或水平擴展。']
    ], 'queue'),
    scene('receive-entry', '收件流程上半：負載平衡、接受策略與佇列（圖 8.7）', '282–283', 'remote~外站寄件者~對本網域建立 SMTP 連線~cloud;lb~SMTP 負載平衡器~把連線分散給多台伺服器~gate;receive~SMTP 接收入口~判斷接受政策與收件人~server;obj~附件物件層~存大型資料，回傳引用~card;queue~傳入佇列~保存工作，承受流量尖峰~queue;ack~接手回應~確認耐久後再回成功~check', 'remote>lb lb>receive receive>obj obj>queue receive>queue queue>ack', [
        ['remote|lb|receive', '圖八點七的第一步，外站 SMTP 進到負載平衡器。第二步，負載平衡器把連線分配給 SMTP 伺服器。入口可以套用收件策略，像是明確不存在的本地收件者，可以在送進後端前回覆。'],
        ['receive|obj', '第三步，如果附件太大，就先放入物件儲存，傳入工作保留引用。設計時要約束引用寫入順序：確定物件已持久保存，再讓工作可見，避免 Worker 取到指向不存在檔案的工作。'],
        ['receive|queue', '第四步，將郵件或可重建郵件的資料寫入耐久佇列。佇列把 SMTP 入口與背景收件 Worker 解耦，可以作為突發郵件量的緩衝。兩者的機器數量能分別調整。'],
        ['queue|ack', '只有確認已能保留郵件後，才向寄件端回覆成功。若入口尚未保存就故障，讓對方收到暫時錯誤或找不到成功回覆，對方才能按協定保留工作再試。雙方對責任的交接由這個回覆界定。'],
        ['obj|queue|ack', '思考一個時序問題。物件已上傳，但寫入佇列時失敗，會留下無引用物件。可用生命週期清理與事件重放修復，同時避免過早刪掉還在重試的物件。重試時，也要能處理同一封信再次到達。']
    ]),
    scene('receive-delivery', '收件流程下半：掃描、寫入、推送及離線補抓', '283–284', 'queue~收件工作~出列後可重跑~queue;worker~收件 Worker~垃圾信、病毒、分類與去重~gear;store~儲存層~信箱、快取、附件~db;rt~即時伺服器~WebSocket 推送~coord;client~線上 Webmail~收到變更後刷新信箱~phone;offline~離線 Webmail~重連後 HTTPS API 補抓~cloud', 'queue>worker worker>store store>rt rt>client store>offline', [
        ['queue|worker', '第五步由收件 Worker 取出工作，做垃圾郵件分類、病毒和惡意附件掃描。通過檢查後才能繼續畫出成功路徑。若工作程序中途斷線，重送同一事件時應能辨識已處理的內容。'],
        ['worker|store', '第六步是寫入郵件儲存系統、快取和附件層。資料庫提交後更新衍生資料。搜尋和即時事件應能從可持久重放的記錄重建，即使其中一個消費者不能即時更新，郵件本身仍在。'],
        ['store|rt|client', '第七步，確認收件者目前在線，則把更新交給即時伺服器。第八步由 WebSocket 將變更推給客戶端。推送可以只帶新狀態或游標，避免讓通知同時承擔信箱資料配送的工作。'],
        ['store|offline', '第九步，離線時保留信件，等使用者重新上線走 HTTPS 和 REST API。第十步，Web 伺服器從儲存層讀取新郵件，再回傳給 Webmail。客戶端可以用最後讀到的序號補齊差異。'],
        ['rt|client|offline', '假設手機 Wi-Fi 斷掉五分鐘。這段期間即使所有即時通知都送不到，信箱仍保存每封信；登入後客戶端讀取主資料，畫面就能追上。這就是將通知和郵件保存分開的好處。']
    ])
]);
