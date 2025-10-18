// 更貼近日常生活的「2種人」題庫 - 有趣爭議話題
const questionBank = [
    // 飲食爭議類
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '魯肉飯一定要拌勻',
        optionB: '魯肉飯要分層吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: 'Pizza可以加鳳梨',
        optionB: 'Pizza加鳳梨是邪教'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '臭豆腐要吃炸的',
        optionB: '臭豆腐要吃滷的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '麵食主義者',
        optionB: '米食主義者'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '義大利麵用叉子',
        optionB: '義大利麵用筷子'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '珍奶一定要去冰',
        optionB: '珍奶正常冰才對'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '火鍋蛋餃要咬破',
        optionB: '火鍋蛋餃整顆吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃泡麵一定要加蛋',
        optionB: '泡麵原味最純正'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '薯條一定要沾醬',
        optionB: '薯條原味最香'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '西瓜要加鹽提味',
        optionB: '西瓜加鹽太奇怪'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '香菜是神聖配菜',
        optionB: '香菜是惡魔植物'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '包子要沾醬油',
        optionB: '包子直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '豆花要吃甜的',
        optionB: '豆花要吃鹹的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '粽子北部粽派',
        optionB: '粽子南部粽派'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '牛肉麵要清燉',
        optionB: '牛肉麵要紅燒'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '鳳梨酥要吃土鳳梨',
        optionB: '鳳梨酥冬瓜餡也行'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '雞排要切塊',
        optionB: '雞排整片拿著吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '鹹酥雞要加九層塔',
        optionB: '鹹酥雞不要九層塔'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '滷味要現場選',
        optionB: '滷味叫外送就好'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '蛋餅皮要酥脆',
        optionB: '蛋餅皮要軟嫩'
    },

    // 生活習慣爭議類
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '牙膏從中間擠',
        optionB: '牙膏從底部往上擠'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '衛生紙撕掛在前面',
        optionB: '衛生紙撕掛在後面'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗澡先洗頭',
        optionB: '洗澡先洗身體'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '起床馬上整理床鋪',
        optionB: '床鋪晚上再整理'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '手機充電要100%',
        optionB: '手機隨便充就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '走路很快很急',
        optionB: '走路慢慢來'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '冷氣開16度',
        optionB: '冷氣開26度'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '上廁所一定帶手機',
        optionB: '上廁所不帶任何東西'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺要完全關燈',
        optionB: '睡覺要留小夜燈'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗碗先洗碗再洗筷',
        optionB: '洗碗筷子碗一起洗'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '鞋子整齊排好',
        optionB: '鞋子脫了就放'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '衣服按顏色分類',
        optionB: '衣服隨便摺隨便放'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '桌面一定要乾淨',
        optionB: '桌面亂一點沒關係'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '出門檢查三遍',
        optionB: '出門說走就走'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '垃圾分類很仔細',
        optionB: '垃圾隨便分就好'
    },

    // 日常選擇爭議類
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '電梯按鈕用手指',
        optionB: '電梯按鈕用關節'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '搭手扶梯站右邊',
        optionB: '搭手扶梯站左邊'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '排隊一定排最短的',
        optionB: '排隊選熟悉的店員'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '停車一定要倒車入庫',
        optionB: '停車直接開進去'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '搭公車坐前面',
        optionB: '搭公車坐後面'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '買東西比價很久',
        optionB: '買東西馬上決定'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '下雨撐傘',
        optionB: '下雨用跑的'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '約會提早10分鐘到',
        optionB: '約會準時到就好'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '看電影坐中間',
        optionB: '看電影坐邊邊'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '聊天看著對方眼睛',
        optionB: '聊天看別的地方'
    },

    // 使用習慣爭議類
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '訊息秒回',
        optionB: '訊息想到再回'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機螢幕貼保護貼',
        optionB: '手機螢幕裸奔'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '用現金付錢',
        optionB: '用手機行動支付'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '音量一定要偶數',
        optionB: '音量調到舒服就好'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '電腦桌面很整齊',
        optionB: '電腦桌面檔案一堆'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '看說明書再操作',
        optionB: '直接摸索怎麼用'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機APP按資料夾分類',
        optionB: '手機APP散落各處'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '網購看很多評價',
        optionB: '網購看圖片就買'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '密碼設得很複雜',
        optionB: '密碼簡單好記就好'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '社群媒體常發文',
        optionB: '社群媒體只看不發'
    },

    // 更多食物爭議話題
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '蛋糕用叉子吃',
        optionB: '蛋糕用湯匙吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '咖啡加糖加奶',
        optionB: '咖啡黑咖啡原味'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃蘋果要削皮',
        optionB: '吃蘋果連皮吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '橘子白絲一定要撕掉',
        optionB: '橘子白絲一起吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯會發出聲音',
        optionB: '喝湯一定要安靜'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃冰淇淋用舔的',
        optionB: '吃冰淇淋直接咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '漢堡壓扁再吃',
        optionB: '漢堡張大嘴咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: 'Pizza從尖端開始吃',
        optionB: 'Pizza從邊邊開始吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '泡芙一口咬破',
        optionB: '泡芙小口慢慢吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '湯圓咬破吃',
        optionB: '湯圓整顆吞'
    },

    // 更多生活爭議
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗澡水開超熱',
        optionB: '洗澡水溫溫的就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '穿襪子睡覺',
        optionB: '光腳睡覺'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '枕頭要很硬',
        optionB: '枕頭要軟軟的'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '被子蓋很厚',
        optionB: '被子薄薄一層'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺要抱東西',
        optionB: '睡覺不抱任何東西'
    },

    // 更多日常選擇
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '進電梯按關門鍵',
        optionB: '進電梯等自動關'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '塑膠袋重複使用',
        optionB: '塑膠袋用完就丟'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '廁所衛生紙丟馬桶',
        optionB: '廁所衛生紙丟垃圾桶'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '坐馬桶蓋馬桶蓋',
        optionB: '坐馬桶不蓋馬桶蓋'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '拖鞋整齊放好',
        optionB: '拖鞋脫了就放'
    },

    // 數位使用習慣
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機充電充整夜',
        optionB: '手機充飽就拔掉'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '照片拍很多張選最好的',
        optionB: '照片拍一張就好'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '影片開1.25倍速看',
        optionB: '影片正常速度看'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '群組訊息會爬文',
        optionB: '群組訊息直接問'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '打字用注音',
        optionB: '打字用倉頡'
    },

    // 購物習慣
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '超市推車會歸位',
        optionB: '超市推車隨便放'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '收據會收好',
        optionB: '收據拿了就丟'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '發票會對獎',
        optionB: '發票從不對獎'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '逛街有目標',
        optionB: '逛街隨便看看'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買東西看成分',
        optionB: '買東西憑感覺'
    },

    // 交通習慣
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '開車聽音樂',
        optionB: '開車保持安靜'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '捷運上會讓座',
        optionB: '捷運上假裝沒看到'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '搭電梯會按樓層',
        optionB: '搭電梯等別人按'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '走路會讓路',
        optionB: '走路直直走'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '紅綠燈會等',
        optionB: '沒車就直接過'
    },

    // 娛樂爭議
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '看電影會買爆米花',
        optionB: '看電影不買任何東西'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '電視劇一次追完',
        optionB: '電視劇慢慢看'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '遊戲要破關',
        optionB: '遊戲玩爽就好'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '書要看完才換',
        optionB: '同時看好幾本書'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '音樂用耳機',
        optionB: '音樂開外放'
    },

    // 繼續擴充飲食爭議 (目標50題)
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃雞排要去骨',
        optionB: '吃雞排啃骨頭'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '鹹酥雞要九層塔',
        optionB: '鹹酥雞不要九層塔'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '滷蛋要溏心',
        optionB: '滷蛋要全熟'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '牛肉麵要粗麵',
        optionB: '牛肉麵要細麵'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '陽春麵要加蛋',
        optionB: '陽春麵就陽春'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '水餃沾醬油',
        optionB: '水餃沾醋'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '小籠包咬破吸湯',
        optionB: '小籠包整顆放嘴裡'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '蔥抓餅要加蛋',
        optionB: '蔥抓餅原味就好'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '胡椒餅要趁熱吃',
        optionB: '胡椒餅放涼吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '肉圓要淋醬',
        optionB: '肉圓原味'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '蚵仔煎要加辣',
        optionB: '蚵仔煎不加辣'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '大腸麵線要切大腸',
        optionB: '大腸麵線大腸整條'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '刨冰要煉乳',
        optionB: '刨冰不要煉乳'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '豆漿配燒餅',
        optionB: '豆漿配油條'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '咖啡要趁熱喝',
        optionB: '咖啡喝冰的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '粥要配鹹菜',
        optionB: '粥要配肉鬆'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '便當菜要分開吃',
        optionB: '便當全部拌一起'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '泡茶要洗茶',
        optionB: '泡茶直接喝'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃麵包撕邊邊',
        optionB: '吃麵包整片吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '燒肉要配生菜',
        optionB: '燒肉直接吃'
    },

    // 繼續擴充生活習慣 (目標40題)
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗澡先洗臉',
        optionB: '洗澡最後洗臉'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '刷牙刷2分鐘',
        optionB: '刷牙隨便刷刷'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗完頭立刻吹乾',
        optionB: '洗完頭自然風乾'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '衣服當天就洗',
        optionB: '衣服累積再洗'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '晾衣服要抖過',
        optionB: '晾衣服直接掛'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '棉被要曬太陽',
        optionB: '棉被室內晾就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '毛巾要分臉跟身體',
        optionB: '毛巾一條用到底'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '房間要開除濕機',
        optionB: '房間開電扇就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡前要上廁所',
        optionB: '睡前不用上廁所'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '起床要喝溫開水',
        optionB: '起床直接刷牙'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '床單一週洗一次',
        optionB: '床單一個月洗一次'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗衣機要清洗劑',
        optionB: '洗衣機用清水就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '內衣褲要手洗',
        optionB: '內衣褲丟洗衣機'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '襪子要配對收',
        optionB: '襪子隨便丟抽屜'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '垃圾袋要綁緊',
        optionB: '垃圾袋隨便丟'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '冰箱要定期清',
        optionB: '冰箱塞滿沒關係'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '廚房用完就清',
        optionB: '廚房用完再說'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '馬桶要定期刷',
        optionB: '馬桶髒了再刷'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '地板天天拖',
        optionB: '地板週末再拖'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '窗戶要常開通風',
        optionB: '窗戶關著開冷氣'
    },

    // 繼續擴充日常選擇 (目標30題)
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '搭電梯按樓層後退開',
        optionB: '搭電梯按樓層站前面'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '等電梯會一直按',
        optionB: '等電梯按一次就好'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '搭捷運會往中間走',
        optionB: '搭捷運站門口就好'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '過馬路會快步走',
        optionB: '過馬路正常步調'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '排隊會準備好錢',
        optionB: '排隊到了才找錢'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '坐椅子會坐滿',
        optionB: '坐椅子只坐邊邊'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '開門會看後面有沒有人',
        optionB: '開門過去就關'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '走路會靠右邊',
        optionB: '走路隨便走'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '上樓梯會扶扶手',
        optionB: '上樓梯不碰扶手'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '進房間會關門',
        optionB: '進房間門開著'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '坐下會調整椅子',
        optionB: '坐下就直接坐'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '等人會一直看時間',
        optionB: '等人就放空等'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '看電影選中間座位',
        optionB: '看電影選走道座位'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '餐廳會選靠窗位子',
        optionB: '餐廳選角落位子'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '停車會停很正',
        optionB: '停車停進去就好'
    },

    // 擴充使用習慣 (目標25題)
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機鈴聲很大聲',
        optionB: '手機調震動'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機APP按功能分資料夾',
        optionB: '手機APP按使用頻率排'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '電腦密碼很複雜',
        optionB: '電腦密碼簡單好記'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: 'wifi會選訊號最強的',
        optionB: 'wifi選第一個能連的'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '看影片會開字幕',
        optionB: '看影片不開字幕'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '聽音樂會單曲循環',
        optionB: '聽音樂會整張專輯聽'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '拍照會拍很多張',
        optionB: '拍照覺得ok就好'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '電子郵件會分類',
        optionB: '電子郵件全部放收件匣'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '瀏覽器會開很多分頁',
        optionB: '瀏覽器用完就關分頁'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機會定期重開機',
        optionB: '手機從不關機'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '軟體有更新立刻更新',
        optionB: '軟體更新能拖就拖'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '雲端會整理資料夾',
        optionB: '雲端檔案亂丟一堆'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '網購會看評價再買',
        optionB: '網購看商品照片就買'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '社群會按讚留言',
        optionB: '社群只看不互動'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '群組訊息會全部看完',
        optionB: '群組訊息看最新的就好'
    },

    // 擴充購物習慣 (目標20題)
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買菜會挑很久',
        optionB: '買菜隨便拿就好'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '超商結帳會排整齊',
        optionB: '超商結帳東西堆著'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '試穿衣服會買',
        optionB: '試穿衣服純試穿'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買東西會要發票',
        optionB: '買東西不要發票'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '逛街會列清單',
        optionB: '逛街想到什麼買什麼'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買水果會挑選',
        optionB: '買水果拿了就走'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '結帳會準備零錢',
        optionB: '結帳都用大鈔'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '購物車會推到定位',
        optionB: '購物車用完就放'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買衣服會摸材質',
        optionB: '買衣服看外觀就好'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '網購會等特價',
        optionB: '網購想買就買'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '退換貨會保留包裝',
        optionB: '退換貨包裝拆了丟'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '集點活動會參加',
        optionB: '集點活動懶得弄'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '會員卡會帶',
        optionB: '會員卡常忘記帶'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '特價商品會多買',
        optionB: '特價商品買需要的就好'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '保固書會收好',
        optionB: '保固書買完就丟'
    },

    // 擴充交通習慣 (目標15題)
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '開車會讓行人',
        optionB: '開車行人自己小心'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '騎機車戴全罩安全帽',
        optionB: '騎機車戴半罩安全帽'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '搭公車會往後走',
        optionB: '搭公車站前面就好'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '開車會打方向燈',
        optionB: '開車臨時變換車道'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '等紅燈會關引擎',
        optionB: '等紅燈引擎繼續開'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '上車會繫安全帶',
        optionB: '上車看狀況繫安全帶'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '走路會走斑馬線',
        optionB: '走路抄近路'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '搭計程車會聊天',
        optionB: '搭計程車保持安靜'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '騎車會戴手套',
        optionB: '騎車不戴手套'
    },
    {
        category: 'transport',
        question: '世界上只有兩種人',
        optionA: '開車會聽廣播',
        optionB: '開車聽自己的音樂'
    },

    // 最後10題達到200題
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '看電影要買爆米花',
        optionB: '看電影什麼都不買'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '追劇會一次看完',
        optionB: '追劇每天看一點'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '聽歌會跟著唱',
        optionB: '聽歌只是聽'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃蛋糕先吃最喜歡的部分',
        optionB: '吃蛋糕把最喜歡的留到最後'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯要配白飯',
        optionB: '喝湯就只喝湯'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '下雨會撐傘慢慢走',
        optionB: '下雨會快步跑過去'
    },
    {
        category: 'usage',
        question: '世界上只有兩種人',
        optionA: '手機桌布會常換',
        optionB: '手機桌布用預設的'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺前會檢查門鎖',
        optionB: '睡覺前不會特別檢查'
    },
    {
        category: 'shopping',
        question: '世界上只有兩種人',
        optionA: '買東西會比較三家',
        optionB: '買東西第一家就決定'
    },
    {
        category: 'daily',
        question: '世界上只有兩種人',
        optionA: '等紅燈會按按鈕',
        optionB: '等紅燈就直接等'
    }
];