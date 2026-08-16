(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_13;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const F=(id,difficulty,question,page,explanation,correct,wrong)=>({id,difficulty,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.finalExam.push(
F('sd13-ex-e01','easy','Autocomplete 題最核心輸出？','sd13-s01-p01','根據 prefix 回 top suggestions。','Prefix 對應的 top suggestions。',[["完整 document search results","那是全文搜尋。"],["只有拼字校正","不是唯一功能。"],["DNS records","無關。"]]),
F('sd13-ex-e02','easy','Trie 查 prefix 的第一步？','sd13-s03-p01','沿 prefix 字元走到對應 node。','沿 prefix characters traversal。',[["掃完整 corpus","不必要。"],["先排序所有 query","太貴。"],["先清 cache","無關。"]]),
F('sd13-ex-e03','easy','為何每個 Trie node 預存 top-k？','sd13-s03-p02','避免每次 DFS 整個 subtree。','降低 query-time candidate traversal。',[["為了讓更新免費","不是。"],["為了消除 memory","反而增加。"],["為了取消 ranking","仍需要。"]]),
F('sd13-ex-e04','easy','Autocomplete 通常是 read-heavy 還是 write-heavy？','sd13-s01-p02','每 keystroke 都可能查詢，讀遠多於 index build。','Read-heavy。',[["純 write-heavy","錯。"],["完全沒有 write","有 aggregation/build。"],["只靠 client 無 backend","不合理。"]]),
F('sd13-ex-e05','easy','Trending ranking 最需要哪類訊號？','sd13-s02-p03','短時間 query velocity/recency。','近期增長與 recency。',[["只看歷史總量","反應慢。"],["只看字串長度","無關。"],["只看 hostname","無關。"]]),
F('sd13-ex-e06','easy','Immutable snapshot 最大優點？','sd13-s04-p03','可 version、warm、atomic swap、rollback。','版本化切換與回滾容易。',[["永遠不需更新","錯。"],["不占 memory","仍占。"],["保證零延遲","不能保證。"]]),
F('sd13-ex-e07','easy','Raw query logs 為何要做 normalization？','sd13-s02-p02','把可安全合併的大小寫/空白/Unicode 形式一致化。','減少重複表示，但需保留語意。',[["把所有 query 合成一個","錯。"],["只為壓縮網路","不是主因。"],["因為 Trie 不支援 Unicode","不一定。"]]),
F('sd13-ex-e08','easy','Completion index 常放哪裡服務？','sd13-s04-p01','低延遲需求通常放 memory/optimized index。','In-memory / memory-optimized serving structure。',[["只能 tape storage","太慢。"],["只放 cold archive","不適合 hot path。"],["每次從 analytics lake 掃","太慢。"]]),
F('sd13-ex-e09','easy','熱門短 prefix 最適合哪個優化？','sd13-s07-p03','重複率高，適合 cache。','Cache hot prefixes。',[["每次重建 index","浪費。"],["禁止 query","不是。"],["只改 DNS","無關。"]]),
F('sd13-ex-e10','easy','低頻個人 query 為何不一定可曝光？','sd13-s08-p01','可能含 PII/敏感資訊且缺乏群體證據。','Privacy / safety risk。',[["因為字太短","不一定。"],["因為不能 hash","可以。"],["因為 HTTP 不支援","無關。"]]),

F('sd13-ex-m01','medium','找到 prefix node 後 subtree 有 5M queries，怎麼降 latency？','sd13-s03-p02','預存 top-k 或使用 completion index。','在 node/index 中預計算 top-k。',[["每次 DFS 5M 再 sort","太慢。"],["把 timeout 拉長","不解根因。"],["改用 offset pagination","無關。"]]),
F('sd13-ex-m02','medium','新熱詞要 2 分鐘內出現，但 full rebuild 30 分鐘，怎麼做？','sd13-s06-p02','Base snapshot + realtime delta merge。','穩定 snapshot 加近即時 delta。',[["每 event full rebuild","成本高。"],["忽略 freshness requirement","不符合。"],["把 cache TTL 設一天","更慢。"]]),
F('sd13-ex-m03','medium','按首字母 sharding 後 s shard 10 倍流量，問題？','sd13-s07-p01','Prefix distribution skew。','需要 dynamic split/更細 partition 或 cache。',[["Hash collision","不是主要問題。"],["CAP violation","不是。"],["所有 shard 都會一樣熱","錯。"]]),
F('sd13-ex-m04','medium','Hash sharding completion index 的代價？','sd13-s07-p02','同 prefix candidates 散在多 shard，需 fan-out merge。','Query fan-out / top-k merge。',[["資料不能寫","可以。"],["prefix 無法表示","可以。"],["不需要 replication","仍可能需要。"]]),
F('sd13-ex-m05','medium','搜尋事件中把 s/sy/sys 全算 submitted query，會怎樣？','sd13-s05-p02','Typing prefixes 污染 popularity。','Frequency table 被中間字串扭曲。',[["提高 correctness","相反。"],["Trie 自動修正","不會。"],["只影響 UI 色彩","不是。"]]),
F('sd13-ex-m06','medium','Aggregator 掛 20 分鐘但 snapshot 正常，服務應？','sd13-s09-p03','繼續服務舊 suggestions，標記 freshness degradation。','Serve previous snapshot，freshness SLI 告警。',[["全站 500","沒必要。"],["刪舊 index","更糟。"],["關閉 cache","不合理。"]]),
F('sd13-ex-m07','medium','同 prefix global cache 回到另一 user 的 personalized suggestion，root cause？','sd13-s07-p03','Cache key 沒包含 personalization context。','Cache isolation/key design 錯誤。',[["Trie 深度不夠","不是。"],["DNS stale","不是。"],["snapshot 太新","不是核心。"]]),
F('sd13-ex-m08','medium','Bot 在 1 分鐘灌 1M 次垃圾 query，怎麼避免上榜？','sd13-s08-p02','不能只看 raw count；加入 unique user/reputation/anomaly。','Anti-abuse ranking signals + thresholds。',[["把 trend weight 再提高","更糟。"],["全部 query 永久封鎖","過度。"],["只加更多 RAM","不解 manipulation。"]]),
F('sd13-ex-m09','medium','新 snapshot heap 比舊版大 4 倍，應在何時攔？','sd13-s06-p03','Publish 前做 size/memory benchmark gate。','Build validation / canary 前攔截。',[["OOM 後再 rollback","太晚。"],["只看 click rate","不足。"],["只看文件數","memory 才是直接風險。"]]),
F('sd13-ex-m10','medium','autocomplete P99 慢但 cache hit 很高，下一步看？','sd13-s09-p03','拆 query service、merge/rank、policy、serialization、GC 等 latency。','Trace serving path 而非只怪 cache。',[["Hit 高就一定快","錯。"],["只加 cache size","未定位。"],["刪 metrics","相反。"]]),

F('sd13-ex-h01','hard','要求 30ms P99 且每 query 都即時跨 20 shard merge，最大風險？','sd13-s07-p02','Fan-out tail latency 會放大，P99 難守。','需要更少 shard fan-out、precompute/cache/locality。',[["20 shard 一定更快","不一定。"],["P99 等於平均值","不是。"],["只加 timeout 就解","會更慢。"]]),
F('sd13-ex-h02','hard','安全團隊移除敏感 suggestion，但下一版又出現，根因？','sd13-s08-p01','Policy override 沒進 build pipeline。','Safety rule 必須是 source-of-truth build input。',[["只需清 browser cache","治標。"],["Trie 不支援 delete","可重建。"],["HTTP 301 cache","無關。"]]),
F('sd13-ex-h03','hard','Trend score 使用 lifetime count 99% + recent 1%，新事件永遠上不來，問題？','sd13-s05-p03','Weight 設計讓 long-term popularity 壓死 recency。','Ranking objective 與權重不符合 trending requirement。',[["需要更多 shards","無關。"],["需要更大字元集","無關。"],["只需延長 TTL","更差。"]]),
F('sd13-ex-h04','hard','Snapshot A/B 同時存在，cache key 不含版本，可能？','sd13-s07-p03','新舊 ranking 結果互相污染，回滾也不可控。','Cache key/namespace 要帶 snapshot version。',[["一定 data loss","不必然。"],["只影響 storage cost","也影響 correctness。"],["TTL=0 就最好","會失去 cache。"]]),
F('sd13-ex-h05','hard','Autocomplete index 只保 top 10/節點，想做 locale-specific rerank 時缺候選，怎麼改？','sd13-s03-p03','預存更大的 candidate pool 或 context-specific top-k。','保留 top-N candidates > response K，再 rerank。',[["只 rerank 10 個就永遠足夠","可能丟掉 locale 候選。"],["取消 ranking","不符合需求。"],["把 prefix 變長","不是通用解。"]]),
F('sd13-ex-h06','hard','個人化 query history 被 global analytics snapshot 收錄，最大 concern？','sd13-s08-p03','Privacy boundary 破壞，可能把私人行為公開成 suggestion。','資料蒐集 pipeline 必須標記/排除 private context。',[["只會增加 memory","不只。"],["只需 encryption at rest","仍可能被產品曝光。"],["只要 count 高就可公開","不一定。"]]),
F('sd13-ex-h07','hard','單一熱門 prefix cache miss 後 10k requests 同時打 completion shard，叫什麼？','sd13-s07-p03','Cache stampede/thundering herd。','Request coalescing、stale-while-revalidate、jitter/prewarm。',[["Hash collision only","不是。"],["Replication lag only","不是。"],["正常線性流量","瞬時放大。"]]),
F('sd13-ex-h08','hard','要求任何 query update 立即全世界可見，對本章架構最大影響？','sd13-s06-p01','從 eventual snapshot 轉向低延遲 global update，成本/consistency/fanout 明顯增加。','需重新評估 freshness requirement，不能沿用 batch assumptions。',[["完全沒有影響","錯。"],["只改 UI","不是。"],["只提高 cache TTL","相反。"]]),
F('sd13-ex-h09','hard','Query index shard fail，產品寧可少幾條 suggestions 也不能超時，策略？','sd13-s09-p03','短 timeout、replica/cache fallback、partial results。','Fail-soft：快速降級而非等待完整 fan-out。',[["等待 30 秒完整結果","違反 latency SLO。"],["全站停止搜尋","過度。"],["無限 retry shard","會放大故障。"]]),
F('sd13-ex-h10','hard','完整 Autocomplete 設計最重要的核心 trade-off？','sd13-s09-p04','預計算/記憶體/更新成本換極低 query latency與可接受 freshness。','Read latency vs memory/build/freshness。',[["只選 Trie 或 SQL","太局部。"],["只算 DAU","沒有設計。"],["只談 UI debounce","不足。"]])
);
})();