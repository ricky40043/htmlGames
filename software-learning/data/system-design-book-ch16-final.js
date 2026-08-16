(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_16;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const F=(id,difficulty,question,page,explanation,correct,wrong)=>({id,difficulty,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.finalExam.push(
F('sd16-ex-e01','easy','陌生 System Design 題第一步？','sd16-s02-p01','先釐清 scope/requirements。','釐清需求與假設。',[["先選 Redis","太早。"],["先畫 20 services","太早。"],["先講 Kubernetes","不一定需要。"]]),
F('sd16-ex-e02','easy','Back-of-envelope 估算的目的？','sd16-s03-p03','支撐 architecture priority。','找量級與 bottleneck。',[["追求小數點精準","不是。"],["取代 HLD","不能。"],["只為面試加分","實務也重要。"]]),
F('sd16-ex-e03','easy','Queue 最核心的 pattern？','sd16-s01-p01','Async decoupling/buffering。','Producer/consumer 解耦。',[["Strong consistency DB","不是。"],["Client rendering","不是。"],["DNS cache","不是。"]]),
F('sd16-ex-e04','easy','Source of truth 為何要標？','sd16-s04-p01','決定 recovery/correctness。','知道 cache/index 掛掉從哪重建。',[["所有 cache 都是 source of truth","錯。"],["只為畫圖","不是。"],["只影響命名","不是。"]]),
F('sd16-ex-e05','easy','Idempotency 解什麼？','sd16-s01-p01','Retry/duplicate 不造成重複 side effect。','Duplicate-safe processing。',[["讓 network 不斷","不會。"],["取代 authentication","不是。"],["讓 queue 無限容量","不是。"]]),
F('sd16-ex-e06','easy','Hot key 是什麼？','sd16-s05-p01','單一 key 承受不成比例 traffic。','Skewed load hotspot。',[["Hash function 一定壞掉","不一定。"],["所有 keys 都一樣熱","相反。"],["只有 cache 才有","DB/shard也可有。"]]),
F('sd16-ex-e07','easy','P99 latency 屬於？','sd16-s06-p01','Latency SLI。','Tail latency metric。',[["Storage durability","不是。"],["Traffic count","不是。"],["ACL role","不是。"]]),
F('sd16-ex-e08','easy','Canary deployment 的主要目的？','sd16-s06-p03','限制壞版本 blast radius。','小流量驗證再放大。',[["讓 rollback 不需要","仍需要。"],["取消測試","不是。"],["保證零 bug","不能。"]]),
F('sd16-ex-e09','easy','讀架構文章最重要問？','sd16-s07-p01','它解了什麼 constraint/bottleneck與trade-off。','抽出設計原理。',[["公司用了什麼 logo","沒價值。"],["文章有幾張圖","不重要。"],["能否完全照抄","通常不能。"]]),
F('sd16-ex-e10','easy','全書完成的真正標準？','sd16-s08-p04','能從陌生 constraints 推 design。','Reasoning process 可重複。',[["背完16張架構圖","不夠。"],["記住所有答案位置","不是目的。"],["會最多名詞","不等於會設計。"]]),

F('sd16-ex-m01','medium','某題 read 100k QPS、write 100 QPS，Deep Dive 優先？','sd16-s03-p03','Read path 是量級 bottleneck。','Cache/CDN/replica/hot read path。',[["只談 write sharding","量級不支持優先。"],["忽略估算","浪費。"],["只談 UI","無關。"]]),
F('sd16-ex-m02','medium','一個 service 拆出來但沒有獨立 scale/failure/ownership，風險？','sd16-s04-p02','增加 network/ops complexity 而沒邊界價值。','Distributed monolith。',[["一定更乾淨","不一定。"],["一定更快","通常不。"],["沒有任何成本","錯。"]]),
F('sd16-ex-m03','medium','Dependency outage 後 client 無限 retry，會？','sd16-s05-p02','Retry storm/failure amplification。','用 backoff/jitter/budget。',[["自動修好下游","不會。"],["降低 load","相反。"],["只影響 client","會打 backend。"]]),
F('sd16-ex-m04','medium','Queue arrival 2k/s、consumer 1k/s 長期會？','sd16-s05-p03','Backlog 每秒淨增約1k。','Queue 只延後 overload。',[["自動歸零","錯。"],["Queue 會提升 consumer speed","不會自動。"],["所有 jobs 丟失","不一定。"]]),
F('sd16-ex-m05','medium','Chat sender success ack 在 memory write 後、durable write 前，風險？','sd16-s04-p03','Crash 可能丟已告知成功 message。','Ack boundary 太早。',[["只影響 UI icon","不是。"],["WebSocket 自動保 durable","不會。"],["增加 timeout 就解","不解。"]]),
F('sd16-ex-m06','medium','Autocomplete cache 掛掉造成 DB/Trie shard traffic 10倍，是？','sd16-s05-p02','Cache failure amplification/stampede。','需要 coalescing、stale、capacity headroom。',[["正常 scale-out","不是。"],["只要 TTL 更短","可能更糟。"],["只看 CPU 不需處理","錯。"]]),
F('sd16-ex-m07','medium','Drive sync latency正常但 conflict rate暴增，應看？','sd16-s06-p02','Revision/base-version與client retry semantics。','產品 SLI 揭示 correctness 問題，不是 latency 問題。',[["只加 bandwidth","不解。"],["只加 CDN","不解。"],["關掉 conflict metric","更糟。"]]),
F('sd16-ex-m08','medium','YouTube CPU正常但 rebuffer ratio上升，應看？','sd16-s06-p02','CDN/throughput/segment/ABR/edge path。','User QoE SLI 比 CPU 更直接。',[["CPU正常代表沒問題","錯。"],["只看 upload QPS","不是 playback root cause。"],["只提高 source bitrate","可能更糟。"]]),
F('sd16-ex-m09','medium','面試官改 requirement 從 eventual consistency 到 strong consistency，應？','sd16-s02-p01','重新評估 data path/replication/latency/availability。','Design 要跟 requirement 變。',[["堅持原方案不變","僵化。"],["只改 service 名稱","沒有。"],["說兩者完全一樣","錯。"]]),
F('sd16-ex-m10','medium','45分鐘剩5分鐘，還有3個次要 Deep Dive，最佳？','sd16-s08-p01','收斂 failure/ops/recap，指出若有時間再談。','控制時間並 wrap-up。',[["每個再講10分鐘","不可能。"],["跳過 recap","少掉重要訊號。"],["重新從需求開始","失控。"]]),

F('sd16-ex-h01','hard','Global cache/DB方案 P99 很好，但 single region，需求要求 99.99%且region failure可用，缺什麼？','sd16-s02-p01','Availability requirement未被架構滿足。','需要 multi-region/failover/data replication並定RPO/RTO。',[["只加本region更多CPU","無法抗region failure。"],["只延長cache TTL","不夠。"],["只加read replica同AZ","failure domain仍不夠。"]]),
F('sd16-ex-h02','hard','你看到Netflix用某DB就直接套在金融ledger，最大問題？','sd16-s07-p01','Cargo cult，workload/invariant不同。','先比較 consistency、transaction、audit、failure requirements。',[["大公司技術一定通用","錯。"],["只要scale大就相同","不一定。"],["品牌比invariant重要","錯。"]]),
F('sd16-ex-h03','hard','Rate limiter store timeout 2s、API P99 SLO 300ms，設計問題？','sd16-s05-p01','Dependency timeout 已超整體 latency budget。','Limiter 要短 timeout/fail policy/local budget。',[["2s很短所以沒事","相對SLO太長。"],["只加retry","更糟。"],["SLO不影響dependency timeout","錯。"]]),
F('sd16-ex-h04','hard','News Feed hybrid fanout切策略時同post同時在push cache與pull候選，應？','sd16-s05-p01','需要 dedup/migration semantics。','Cross-path idempotent merge。',[["允許重複即可","UX/correctness差。"],["只靠timestamp","可能仍重複。"],["刪除所有cache","過度。"]]),
F('sd16-ex-h05','hard','Crawler global QPS安全但單一小站被打掛，哪個 requirement漏？','sd16-s02-p01','Per-host politeness/capacity。','Global capacity不等於external dependency fairness。',[["只需更大global limiter","更糟。"],["只看robots allow","permission不等於capacity。"],["只加workers","更糟。"]]),
F('sd16-ex-h06','hard','Drive push通知exactly-once假設導致漏訊息永久不同步，哪個通用原理？','sd16-s04-p01','Best-effort signal不能當source of truth。','用 durable log/cursor重建；notification只優化freshness。',[["所有push都exactly once","不能假設。"],["只加webhook replicas","仍可能漏。"],["只增加payload","不解。"]]),
F('sd16-ex-h07','hard','Payment retry造成雙扣，哪兩個通用 building blocks最關鍵？','sd16-s01-p01','Idempotency + durable transaction/ledger state。','Stable request identity與atomic state transition。',[["CDN+thumbnail","無關。"],["WebSocket+presence","無關。"],["Trie+FST","無關。"]]),
F('sd16-ex-h08','hard','系統低流量正常、尖峰時所有cache key同時失效，哪個design smell？','sd16-s05-p02','Synchronized expiry/cache avalanche。','TTL jitter、refresh-ahead、stale serve、origin protection。',[["只需要更精準TTL同步","更糟。"],["刪cache","可能讓origin更糟。"],["只加logging","能觀察但不解。"]]),
F('sd16-ex-h09','hard','設計有所有熱門元件卻說不出每個元件解什麼，面試評價可能？','sd16-s04-p02','Over-engineering/cargo cult，缺乏decision reasoning。','每個box應有責任、state、scale/failure理由。',[["元件越多一定越senior","錯。"],["只要畫得漂亮就好","不是。"],["技術名詞數量就是設計品質","不是。"]]),
F('sd16-ex-h10','hard','Lead級System Design回答最重要的差異？','sd16-s08-p04','能管理ambiguity、量級、trade-off、failure、operability與演進，而非只畫happy path。','從需求到failure/operations的可解釋決策鏈。',[["背更多產品答案","不足。"],["只講implementation細節","太窄。"],["只會scale up/down名詞","不足。"]])
);
})();