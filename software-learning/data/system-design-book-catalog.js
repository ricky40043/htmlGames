window.SYSTEM_DESIGN_BOOK = {
  id: 'system-design-book-v1',
  title: '系統設計面試指南｜逐章互動課程',
  sourceNote: '第 1 冊 1–16 章的章節架構依 Alex Xu / ByteByteGo Volume 1；第 2 冊的章節沿用該冊自己的編號（例如 2-3）；教材內容以公開官方技術文件重新研究、整理與教學化，不逐字重製書籍內容。',
  chapters: [
    { id: 'sd-book-01', order: 1, title: '使用者人數——從零到百萬規模', status: 'ready', dataFiles: ['system-design-book-ch01-part1.js','system-design-book-ch01-part2.js','system-design-book-ch01-part3.js'], simulator: 'system-design-simulator.html?chapter=sd-book-01' },
    { id: 'sd-book-02', order: 2, title: '粗略的估算', status: 'ready', dataFiles: ['system-design-book-ch02-part1.js','system-design-book-ch02-part2.js','system-design-book-ch02-part3.js'] },
    { id: 'sd-book-03', order: 3, title: '系統設計面試的框架', status: 'ready', dataFiles: ['system-design-book-ch03-part1.js','system-design-book-ch03-part2.js','system-design-book-ch03-part3.js'] },
    { id: 'sd-book-04', order: 4, title: '設計網路限速器', status: 'ready', dataFiles: ['system-design-book-ch04-part1.js','system-design-book-ch04-part2.js','system-design-book-ch04-part3.js'] },
    { id: 'sd-book-05', order: 5, title: '設計具有一致性的雜湊做法', status: 'ready', dataFiles: ['system-design-book-ch05-part1.js','system-design-book-ch05-part2.js'] },
    { id: 'sd-book-06', order: 6, title: '設計鍵值儲存系統', status: 'ready', dataFiles: ['system-design-book-ch06-part1.js','system-design-book-ch06-part2.js','system-design-book-ch06-part3.js','system-design-book-ch06-part4.js','system-design-book-ch06-part5.js','system-design-book-ch06-part6.js'] },
    { id: 'sd-book-07', order: 7, title: '設計可用於分散式系統的唯一 ID 生成器', status: 'ready', dataFiles: ['system-design-book-ch07-part1.js','system-design-book-ch07-part2.js','system-design-book-ch07-part3.js','system-design-book-ch07-final.js'] },
    { id: 'sd-book-08', order: 8, title: '設計短網址生成器', status: 'ready', dataFiles: ['system-design-book-ch08-part1.js','system-design-book-ch08-part2.js','system-design-book-ch08-part3.js','system-design-book-ch08-final.js'] },
    { id: 'sd-book-09', order: 9, title: '設計網路爬蟲', status: 'ready', dataFiles: ['system-design-book-ch09-part1.js','system-design-book-ch09-part2.js','system-design-book-ch09-final.js'] },
    { id: 'sd-book-10', order: 10, title: '設計通知系統', status: 'ready', dataFiles: ['system-design-book-ch10-part1.js','system-design-book-ch10-part2.js','system-design-book-ch10-final.js'] },
    { id: 'sd-book-11', order: 11, title: '設計動態訊息系統', status: 'ready', dataFiles: ['system-design-book-ch11-part1.js','system-design-book-ch11-part2.js','system-design-book-ch11-final.js'] },
    { id: 'sd-book-12', order: 12, title: '設計聊天系統', status: 'ready', dataFiles: ['system-design-book-ch12-part1.js','system-design-book-ch12-part2.js','system-design-book-ch12-final.js'] },
    { id: 'sd-book-13', order: 13, title: '設計搜尋文字自動補全系統', status: 'ready', dataFiles: ['system-design-book-ch13-part1.js','system-design-book-ch13-part2.js','system-design-book-ch13-final.js'] },
    { id: 'sd-book-14', order: 14, title: '設計 YouTube', status: 'ready', dataFiles: ['system-design-book-ch14-part1.js','system-design-book-ch14-part2.js','system-design-book-ch14-final.js'], simulator: 'system-design-simulator.html?chapter=sd-book-14' },
    { id: 'sd-book-15', order: 15, title: '設計 Google Drive', status: 'ready', dataFiles: ['system-design-book-ch15-part1.js','system-design-book-ch15-part2.js','system-design-book-ch15-final.js'], simulator: 'system-design-simulator.html?chapter=sd-book-15' },
    { id: 'sd-book-16', order: 16, title: '持續學習：System Design Interview Playbook', status: 'ready', dataFiles: ['system-design-book-ch16-part1.js','system-design-book-ch16-part2.js','system-design-book-ch16-final.js'] },
    // order 只用來排序與前後章導覽；這一章來自第 2 冊，畫面上依它自己的冊別編號顯示為「第 2 冊第 3 章」。
    { id: 'sd-book-17', order: 17, volume: 2, chapterNo: 3, title: '設計 Google 地圖', status: 'ready', dataFiles: ['system-design-book-ch17-part1.js','system-design-book-ch17-part2.js','system-design-book-ch17-final.js'], simulator: 'system-design-simulator.html?chapter=sd-book-17' }
  ]
};