(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_15;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const F=(id,difficulty,question,page,explanation,correct,wrong)=>({id,difficulty,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.finalExam.push(
F('sd15-ex-e01','easy','Drive 與純 object storage 最大差異？','sd15-s01-p01','Drive 還要 metadata/sync/version/share/offline。','多裝置同步與 namespace/version/ACL。',[["Drive 不存 bytes","錯。"],["Object storage 沒 durability","不一定。"],["只差 UI","不是。"]]),
F('sd15-ex-e02','easy','File bytes 主要放？','sd15-s03-p01','大型 binary 適合 object storage。','Object Storage。',[["只放 API RAM","不 durable。"],["只放 metadata DB","大規模不理想。"],["只放 webhook","不是 storage。"]]),
F('sd15-ex-e03','easy','Rename 10GB file 是否應重傳 bytes？','sd15-s02-p02','Rename 是 metadata change。','不應。',[["一定要重傳","浪費。"],["Drive 不支援 rename","錯。"],["只需重新 hash 所有 bytes 並 upload","不必要。"]]),
F('sd15-ex-e04','easy','Resumable upload 解什麼？','sd15-s04-p01','斷線後續傳大型檔案。','Resume from prior progress。',[["取代 ACL","不是。"],["取消 checksum","相反。"],["讓 conflict 消失","不會。"]]),
F('sd15-ex-e05','easy','Block sync 主要節省？','sd15-s05-p01','小改動時只傳變更 chunks。','Bandwidth/time。',[["Metadata schema","不直接。"],["ACL checks","不直接。"],["所有 storage","不一定。"]]),
F('sd15-ex-e06','easy','file_id 與 version_id 關係？','sd15-s06-p01','file_id 穩定，content update 產生新 version。','Logical identity 固定、版本變。',[["每次更新都換 file_id","不理想。"],["version 永遠固定","錯。"],["兩者都只是 filename","不是。"]]),
F('sd15-ex-e07','easy','Change token 用途？','sd15-s07-p01','只抓上次之後 changes。','Incremental sync cursor。',[["取代 object key","不是。"],["代表 user password","不是。"],["取代 checksum","不是。"]]),
F('sd15-ex-e08','easy','Push notification 最安全角色？','sd15-s08-p01','喚醒 client，再拉 change list。','Signal。',[["唯一 source of truth","不可靠。"],["直接存 file bytes","不適合。"],["取代 metadata DB","不是。"]]),
F('sd15-ex-e09','easy','Offline conflict 最重要偵測？','sd15-s09-p01','比較 base revision vs current revision。','Revision precondition。',[["只看 filename","不足。"],["只看 client clock","不可靠。"],["只看 file size","不能判 concurrency。"]]),
F('sd15-ex-e10','easy','Private file download 前？','sd15-s10-p02','驗 ACL，再發短效 signed URL/token。','Authorization first。',[["知道 object key 即可","不安全。"],["只靠難猜 URL","不是 ACL。"],["只看 CDN hit","不代表有權。"]]),

F('sd15-ex-m01','medium','Client 上傳 10GB 到 80% 斷線，怎麼辦？','sd15-s04-p01','用 session 恢復未完成 bytes。','Resume upload。',[["從 0 開始","浪費。"],["直接 commit version","缺資料。"],["只重送 filename","不夠。"]]),
F('sd15-ex-m02','medium','新 version 一半 chunks 上傳完就切 current_version，會？','sd15-s04-p02','讀者可能看到 incomplete version。','Finalize 全部 chunks 後 atomic switch。',[["一定沒問題","錯。"],["只影響 thumbnail","不是。"],["CDN 自動補 chunks","不會。"]]),
F('sd15-ex-m03','medium','Push 漏一則，如何補？','sd15-s08-p03','用 cursor 從 durable change log catch-up。','Reconnect/periodic changes.list。',[["永久漏資料","設計不應如此。"],["清空 local DB","過度。"],["重新建立 account","不需要。"]]),
F('sd15-ex-m04','medium','先保存新 cursor 再 apply changes，crash 後風險？','sd15-s07-p03','可能永久跳過未 apply changes。','Apply first, then durable cursor advance。',[["只會重複 apply","相反是漏。"],["沒有風險","錯。"],["只影響 UI","可能資料不一致。"]]),
F('sd15-ex-m05','medium','手機與電腦都基於 revision 10 修改，電腦先 commit 11，手機回線應？','sd15-s09-p01','偵測 base revision stale，進 conflict flow。','不要 blind overwrite revision 11。',[["直接以手機 clock 蓋掉","可能丟資料。"],["永遠丟手機版本","也不安全。"],["換 file_id","不是根本。"]]),
F('sd15-ex-m06','medium','Move file 後 object storage bytes 是否一定搬？','sd15-s03-p03','不一定；path 在 metadata，blob ID 可不變。','只更新 namespace metadata。',[["一定搬整個 blob","不必要。"],["不能 move","錯。"],["只更新 client UI","其他裝置不會知道。"]]),
F('sd15-ex-m07','medium','Cross-user dedup 最大額外 concern？','sd15-s05-p03','可能暴露某內容是否存在。','Privacy/existence oracle。',[["只增加 storage","相反可能省。"],["沒有任何風險","不一定。"],["只影響 filename","不是。"]]),
F('sd15-ex-m08','medium','ACL cache 只用 file_id 作 key，可能？','sd15-s10-p03','不同 user auth decision 污染。','Authorization cache leak。',[["只降低 hit rate","可能更嚴重。"],["只增加 storage","不是。"],["自動更安全","相反。"]]),
F('sd15-ex-m09','medium','Client local watcher連續發 20 個 save events，怎麼降低重複 sync？','sd15-s11-p02','Debounce/coalesce。','短時間合併 filesystem noise。',[["20 次都完整 upload","浪費。"],["關閉 watcher 永久","不成熟。"],["只增加 server timeout","不解。"]]),
F('sd15-ex-m10','medium','大量裝置同時重連後 sync backlog 暴增，應看？','sd15-s12-p02','Change backlog age / propagation latency / read capacity。','Sync service與change log catch-up capacity。',[["只看 object size","不足。"],["只看 login CSS","無關。"],["只看 DB table count","不夠。"]]),

F('sd15-ex-h01','hard','Push notification payload 被當唯一 change history，provider 漏訊息後永久不同步，root cause？','sd15-s08-p03','把 best-effort signal 當 durable log。','Notification 只 wake；durable change log + cursor 保 correctness。',[["只需更多 webhook servers","仍可能漏。"],["只需大 payload","不是。"],["只需長 TTL","不解 durability。"]]),
F('sd15-ex-h02','hard','Server current rev=20，client base=18，但 client timestamp 比 server 晚 3 小時，應直接 LWW 嗎？','sd15-s09-p03','不應；client clock skew 不代表修改應覆蓋。','依 revision 偵測 conflict，再 merge/keep both。',[["應，時間晚一定最新","錯。"],["只需改 timezone","不解 concurrent branch。"],["把 server rev 改 18","會倒退。"]]),
F('sd15-ex-h03','hard','Chunk GC 只看 30 天沒下載就刪，舊版本 rollback 失敗，問題？','sd15-s05-p03','GC 沒做 reference reachability。','仍被 history version 引用的 chunks 不能刪。',[["只需提高 CDN TTL","不解 origin bytes。"],["只需重建 metadata","bytes 已丟。"],["old version 不應存在","本題要求 history。"]]),
F('sd15-ex-h04','hard','Signed URL 24h，user 1 分鐘後被 revoke，怎麼縮短 exposure？','sd15-s10-p02','短 TTL、revocable auth layer/token version、proxy check depending cost。','減少 token lifetime或提供 revocation semantics。',[["延長 TTL","更糟。"],["只改 filename","無效。"],["只清 browser cache","持 token 仍可用。"]]),
F('sd15-ex-h05','hard','兩 region active-active 都可對同 file 建 revision 21，可能？','sd15-s12-p01','Revision authority/ordering conflict。','需要 home shard/global sequence/conditional write 或可合併 version scheme。',[["Region 名稱會自動排序","不夠。"],["只靠 client timestamp","clock skew。"],["兩個 21 一定相同內容","不一定。"]]),
F('sd15-ex-h06','hard','Download 新版直接覆寫原檔，寫到 60% App crash，怎麼防？','sd15-s11-p03','先 temp+checksum，再 atomic replace。','本地兩階段 replace。',[["提高 download timeout","不保證。"],["先 delete old file","更危險。"],["只靠 OS cache","不夠。"]]),
F('sd15-ex-h07','hard','Change log retention 只 1 天，但 device 可 offline 90 天，問題？','sd15-s07-p02','舊 cursor 可能無法 catch up。','需更長 retention或 snapshot/rebootstrap fallback。',[["Device 永遠不該 offline","不符合需求。"],["Push 會補 90 天全部細節","不應依賴。"],["只加 CDN","無關。"]]),
F('sd15-ex-h08','hard','全檔 hash 相同但 chunk map 不同，dedup 是否可直接認同檔？','sd15-s05-p02','若使用可信強 hash + size 可做內容 identity，但 chunk map/version semantics仍需驗證；不能混淆 transport chunks與logical file。','區分 whole-file content identity 與 chunk layout/version metadata。',[["任何 hash 一樣都100%安全","需強 hash/驗證。"],["chunk map 一定要完全相同才同內容","不同 chunking 也可同 bytes。"],["hash 完全沒用","錯。"]]),
F('sd15-ex-h09','hard','ACL revoked event 先到 device，但 CDN signed token 尚有效，哪層仍有 exposure？','sd15-s10-p02','Data plane token 有獨立有效期。','Authorization state與issued token lifetime要一起設計。',[["只改 local UI 就安全","不是。"],["Push 到了就自動撤所有 token","不一定。"],["Object storage 不需 auth","錯。"]]),
F('sd15-ex-h10','hard','完整 Drive 題最高價值的 trade-off？','sd15-s12-p04','Reliable large-file transfer、efficient delta sync、durable change log、offline conflict、ACL/durability。','Bytes/metadata/version/change cursor 的一致性與 bandwidth/availability trade-off。',[["只選 SQL vs NoSQL","太局部。"],["只做 signed URL","漏 sync。"],["只做 object storage","不是 Drive。"]])
);
})();