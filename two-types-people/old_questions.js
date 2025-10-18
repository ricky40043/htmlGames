// 2種人遊戲題庫
const questionBank = [
    // 飲食習慣類 (40題)
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '魯肉飯要拌勻才吃',
        optionB: '魯肉飯分開一口飯一口肉'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '珍奶一定要去冰',
        optionB: '珍奶正常冰就好'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '火鍋先吃肉',
        optionB: '火鍋先吃菜'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '泡麵一定要加蛋',
        optionB: '泡麵原味就很好'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '薯條沾番茄醬',
        optionB: '薯條直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '西瓜要加鹽',
        optionB: '西瓜直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: 'pizza從尖端開始吃',
        optionB: 'pizza從邊緣開始吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃麵包會把邊邊撕掉',
        optionB: '吃麵包連邊邊一起吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯會發出聲音',
        optionB: '喝湯絕對安靜'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '咖啡一定要加糖',
        optionB: '咖啡喝黑的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃蘋果會削皮',
        optionB: '吃蘋果直接咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '麥當勞薯條要趁熱吃',
        optionB: '麥當勞薯條放涼也好吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '飯後一定要喝湯',
        optionB: '飯前先喝湯'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '香菜是美味',
        optionB: '香菜是惡魔'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃雞翅會啃骨頭',
        optionB: '吃雞翅只吃肉'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '牛排要全熟',
        optionB: '牛排要三分熟'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃壽司沾很多醬油',
        optionB: '吃壽司只沾一點醬油'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝飲料一定要插吸管',
        optionB: '喝飲料直接用杯口'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃蛋糕先吃奶油',
        optionB: '吃蛋糕先吃蛋糕體'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯配白飯',
        optionB: '喝湯不配飯'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃泡芙一口吃完',
        optionB: '吃泡芙分幾口慢慢吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃漢堡會壓扁再吃',
        optionB: '吃漢堡直接大口咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃關東煮會配白飯',
        optionB: '吃關東煮單吃就好'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃餅乾會沾牛奶',
        optionB: '吃餅乾直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝茶要加糖',
        optionB: '喝茶不加糖'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃粥要配鹹菜',
        optionB: '吃粥單純喝粥'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喜歡吃辣',
        optionB: '不敢吃辣'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃麵包一定要烤過',
        optionB: '吃麵包直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃魚會把刺挑乾淨',
        optionB: '吃魚邊吃邊挑刺'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃湯圓會咬破',
        optionB: '吃湯圓整顆吞'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃甜食',
        optionB: '不愛甜食'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃冰淇淋會舔',
        optionB: '吃冰淇淋直接咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃海鮮',
        optionB: '不吃海鮮'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃水果要削皮',
        optionB: '吃水果連皮吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喜歡吃重口味',
        optionB: '喜歡吃清淡'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃炸雞會剝皮',
        optionB: '吃炸雞連皮一起吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛喝氣泡水',
        optionB: '不愛氣泡感'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃麵條會咬斷',
        optionB: '吃麵條會吸進去'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝豆漿要加糖',
        optionB: '喝豆漿無糖'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃披薩會把起司撕下來',
        optionB: '吃披薩連起司一起吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃蔬菜',
        optionB: '討厭蔬菜'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃水餃沾醬油',
        optionB: '吃水餃沾醋'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃內臟',
        optionB: '不敢吃內臟'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯會吹涼',
        optionB: '喝湯等自然涼'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃火鍋愛吃鴨血',
        optionB: '吃火鍋不敢吃鴨血'
    },

    // 生活習慣類 (40題)
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '牙膏從中間擠',
        optionB: '牙膏從底部擠'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '捲筒衛生紙向內拉',
        optionB: '捲筒衛生紙向外拉'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺一定要關燈',
        optionB: '睡覺要開小夜燈'
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
        optionA: '起床立刻整理床鋪',
        optionB: '起床床鋪隨便丟著'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '手機充電一定要100%',
        optionB: '手機充電隨便充'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '走路很快',
        optionB: '走路很慢'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡開冷氣睡覺',
        optionB: '喜歡開窗自然風'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '出門前會檢查好幾次',
        optionB: '出門說走就走'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗完澡會立刻吹頭髮',
        optionB: '洗完澡讓頭髮自然乾'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '上廁所會帶手機',
        optionB: '上廁所不帶任何東西'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡洗很熱的水',
        optionB: '喜歡洗溫水'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺一定要抱枕頭',
        optionB: '睡覺不需要抱任何東西'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '衣服會按顏色分類收納',
        optionB: '衣服隨便摺隨便放'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '刷牙會刷很久',
        optionB: '刷牙很快就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡很早起床',
        optionB: '能睡多晚就睡多晚'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '東西用完會立刻歸位',
        optionB: '東西用完隨手放'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡開窗睡覺',
        optionB: '喜歡關窗睡覺'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '鞋子會整齊排好',
        optionB: '鞋子脫了就丟著'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '走路很大聲',
        optionB: '走路輕手輕腳'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡開車',
        optionB: '喜歡搭大眾運輸'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '桌面一定要很乾淨',
        optionB: '桌面有點亂沒關係'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺要蓋很厚的被子',
        optionB: '睡覺蓋薄被就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用紙本記事',
        optionB: '喜歡用手機記事'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '買東西會比價很久',
        optionB: '買東西很快決定'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡收集東西',
        optionB: '喜歡斷捨離'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '房間要很安靜才能睡',
        optionB: '有點聲音也能睡'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用現金',
        optionB: '喜歡用信用卡'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '出門一定要帶充電器',
        optionB: '出門很少帶充電器'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡邊走邊吃',
        optionB: '一定要坐下來吃'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '手機螢幕會貼保護貼',
        optionB: '手機螢幕不貼保護貼'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡戴帽子',
        optionB: '不喜歡戴帽子'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '包包裡東西很多',
        optionB: '包包裡東西很少'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡穿拖鞋',
        optionB: '喜歡穿包鞋'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '冬天洗澡要很久',
        optionB: '冬天洗澡也很快'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡開除濕機',
        optionB: '不太用除濕機'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '垃圾會分類很仔細',
        optionB: '垃圾隨便分類'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡存錢',
        optionB: '喜歡花錢'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '時間觀念很準時',
        optionB: '常常遲到'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡穿同色系衣服',
        optionB: '喜歡穿撞色衣服'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '電器用品會看說明書',
        optionB: '電器用品直接使用'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用濕紙巾',
        optionB: '喜歡用衛生紙'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '睡覺前會滑手機',
        optionB: '睡覺前不碰手機'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡開空氣清淨機',
        optionB: '覺得空氣清淨機沒用'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用香水',
        optionB: '不喜歡用香水'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '走路會看地面',
        optionB: '走路會看前方'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡穿襪子睡覺',
        optionB: '不穿襪子睡覺'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡硬枕頭',
        optionB: '喜歡軟枕頭'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '洗臉用毛巾',
        optionB: '洗臉用免洗巾'
    },

    // 個性偏好類 (40題)
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '早起鳥',
        optionB: '夜貓子'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '計劃型人格',
        optionB: '隨性型人格'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '內向安靜',
        optionB: '外向活潑'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '樂觀主義者',
        optionB: '現實主義者'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡嘗試新事物',
        optionB: '喜歡熟悉的事物'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '做事很有耐心',
        optionB: '做事急性子'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡獨處思考',
        optionB: '喜歡和人聊天'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '做決定很快',
        optionB: '做決定要考慮很久'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡競爭',
        optionB: '不喜歡競爭'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易感動',
        optionB: '理性冷靜'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡當領導者',
        optionB: '喜歡當追隨者'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很在意別人看法',
        optionB: '不太在意別人看法'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡冒險刺激',
        optionB: '喜歡安全穩定'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易相信別人',
        optionB: '對人保持警戒'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡幫助別人',
        optionB: '先照顧好自己'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很健忘',
        optionB: '記憶力很好'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易緊張',
        optionB: '很少緊張'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡完美主義',
        optionB: '差不多就好'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有創意',
        optionB: '比較務實'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡變化',
        optionB: '喜歡穩定'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易生氣',
        optionB: '脾氣很好'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡挑戰困難',
        optionB: '避免困難麻煩'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有野心',
        optionB: '容易滿足'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '注重細節',
        optionB: '看整體概念'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易害羞',
        optionB: '很大方自然'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡表現自己',
        optionB: '喜歡低調'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易焦慮',
        optionB: '心情很平靜'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡控制情況',
        optionB: '隨遇而安'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有同理心',
        optionB: '比較理性客觀'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡學習新知',
        optionB: '對學習沒興趣'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很固執',
        optionB: '很彈性'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易被感動',
        optionB: '不太有感覺'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡獨立',
        optionB: '喜歡依賴'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有責任感',
        optionB: '比較隨性'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易想太多',
        optionB: '想法很簡單'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被稱讚',
        optionB: '不需要稱讚'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有自信',
        optionB: '容易沒自信'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡規律生活',
        optionB: '喜歡自由生活'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易感到孤單',
        optionB: '很享受獨處'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡深度思考',
        optionB: '不喜歡想太深'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很有毅力',
        optionB: '容易放棄'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被需要的感覺',
        optionB: '不喜歡被依賴'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易衝動',
        optionB: '很謹慎小心'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被關注',
        optionB: '不喜歡被注意'
    },

    // 娛樂偏好類 (40題)
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '愛看電影',
        optionB: '愛追劇'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡室內活動',
        optionB: '喜歡戶外活動'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '聽音樂放鬆',
        optionB: '聽Podcast學習'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '愛讀書',
        optionB: '愛玩遊戲'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡熱鬧聚會',
        optionB: '喜歡安靜獨處'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看恐怖片',
        optionB: '不敢看恐怖片'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡唱KTV',
        optionB: '不喜歡唱歌'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看動漫',
        optionB: '對動漫沒興趣'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡夜店蹦迪',
        optionB: '喜歡咖啡廳聊天'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看體育比賽',
        optionB: '對運動沒興趣'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡玩手機遊戲',
        optionB: '不玩手機遊戲'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡聽演唱會',
        optionB: '在家聽音樂就好'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看藝術展',
        optionB: '看不懂藝術'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡釣魚',
        optionB: '覺得釣魚很無聊'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡逛夜市',
        optionB: '喜歡逛百貨公司'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看書學習',
        optionB: '喜歡看影片學習'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡拍照打卡',
        optionB: '不喜歡拍照'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡玩桌遊',
        optionB: '覺得桌遊麻煩'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看綜藝節目',
        optionB: '喜歡看紀錄片'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡跳舞',
        optionB: '不會跳舞'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡爬山健行',
        optionB: '喜歡在家休息'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡玩密室逃脫',
        optionB: '覺得密室逃脫很可怕'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看Youtube',
        optionB: '喜歡看Netflix'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡收集模型',
        optionB: '覺得收集很浪費'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡烹飪',
        optionB: '不喜歡下廚'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡旅遊拍照',
        optionB: '旅遊只想放鬆'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看直播',
        optionB: '不懂直播魅力'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡健身運動',
        optionB: '能不動就不動'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡園藝種花',
        optionB: '養什麼死什麼'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看小說',
        optionB: '只看漫畫'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡玩電動',
        optionB: '覺得電動浪費時間'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡泡溫泉',
        optionB: '不喜歡泡澡'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡做手工藝',
        optionB: '手很笨不會做'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看懸疑推理',
        optionB: '喜歡看愛情喜劇'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡逛書店',
        optionB: '都用網路買書'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡騎腳踏車',
        optionB: '喜歡搭車代步'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡打麻將',
        optionB: '不會打麻將'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡寫日記',
        optionB: '從不寫日記'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡彈樂器',
        optionB: '沒有音樂細胞'
    },

    // 社交行為類 (40題)
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '主動聯絡朋友',
        optionB: '被動等朋友聯絡'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '直接表達想法',
        optionB: '委婉暗示想法'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡群體活動',
        optionB: '喜歡一對一聚會'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '立刻回訊息',
        optionB: '想到再回訊息'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '容易相信別人',
        optionB: '習慣保持懷疑'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動打招呼',
        optionB: '等別人先打招呼'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡在群組聊天',
        optionB: '只私訊不群聊'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會記住朋友生日',
        optionB: '常忘記朋友生日'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '約會會準時到',
        optionB: '約會經常遲到'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡分享自己的事',
        optionB: '不愛說自己的事'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會安慰難過的朋友',
        optionB: '不知道怎麼安慰人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '朋友很多',
        optionB: '朋友很少但很深交'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動約朋友出來',
        optionB: '等朋友約自己'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '聊天會看著對方眼睛',
        optionB: '聊天不敢直視對方'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會為朋友保守秘密',
        optionB: '管不住嘴巴'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '吵架後會主動道歉',
        optionB: '吵架後等對方先道歉'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡給朋友建議',
        optionB: '只聽不給建議'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動介紹朋友認識',
        optionB: '不愛當中間人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '被拒絕會很受傷',
        optionB: '被拒絕沒什麼感覺'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動關心朋友',
        optionB: '很少主動關心別人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡團體活動',
        optionB: '喜歡小圈圈聚會'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會記住別人說的話',
        optionB: '常忘記別人說什麼'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡幫助別人',
        optionB: '覺得幫忙很麻煩'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動付帳',
        optionB: '習慣AA制'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '容易相信網友',
        optionB: '對網友很警戒'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會送朋友禮物',
        optionB: '不知道送什麼禮物'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡讚美別人',
        optionB: '很少稱讚別人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動加好友',
        optionB: '等別人加自己好友'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '聚會會主動拍照',
        optionB: '聚會不愛拍照'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動分享有趣的事',
        optionB: '不愛分享'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '容易害羞臉紅',
        optionB: '很少害羞'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動邀請別人',
        optionB: '等別人邀請自己'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡當聚會焦點',
        optionB: '喜歡在旁邊安靜聽'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動說再見',
        optionB: '默默離開不說再見'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '容易被朋友影響',
        optionB: '有自己的想法'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動化解尷尬',
        optionB: '遇到尷尬不知所措'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡和陌生人聊天',
        optionB: '不愛和陌生人說話'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動表達感謝',
        optionB: '覺得感謝放心裡就好'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡熱鬧的聚會',
        optionB: '喜歡安靜的聚會'
    },
    
    // 補充更多飲食類題目
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃鳳梨酥要配茶',
        optionB: '吃鳳梨酥直接吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喜歡吃臭豆腐',
        optionB: '受不了臭豆腐'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃榴槤',
        optionB: '討厭榴槤'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃粽子要甜的',
        optionB: '吃粽子要鹹的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '豆花要吃熱的',
        optionB: '豆花要吃冰的'
    },
    
    // 補充更多生活類題目
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用電子錶',
        optionB: '喜歡用機械錶'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡硬床墊',
        optionB: '喜歡軟床墊'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '冷氣要開很強',
        optionB: '冷氣開微涼就好'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用筆記本電腦',
        optionB: '喜歡用桌上型電腦'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會定期備份手機',
        optionB: '從不備份手機'
    },
    
    // 補充更多個性類題目
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡挑戰權威',
        optionB: '尊重權威'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易原諒別人',
        optionB: '記仇很久'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡當老師',
        optionB: '不喜歡教別人'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易哭',
        optionB: '很少哭'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡競爭比較',
        optionB: '不喜歡比較'
    },
    
    // 補充更多娛樂類題目
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看韓劇',
        optionB: '不看韓劇'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡聽古典音樂',
        optionB: '喜歡聽流行音樂'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看脫口秀',
        optionB: '不喜歡脫口秀'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡去海邊',
        optionB: '喜歡去山上'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看實境秀',
        optionB: '覺得實境秀很假'
    },
    
    // 補充更多社交類題目
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動握手',
        optionB: '等別人伸手'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡擁抱打招呼',
        optionB: '不喜歡身體接觸'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動介紹自己',
        optionB: '等別人問才說'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡在社群發文',
        optionB: '很少發社群動態'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動邀請陌生人',
        optionB: '只和熟人互動'
    },
    
    // 更多混合類題目
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃酸的',
        optionB: '不愛酸的'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃便當會分開吃',
        optionB: '吃便當會混著吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喜歡吃宵夜',
        optionB: '晚上不吃東西'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '一定要吃早餐',
        optionB: '常常不吃早餐'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '飯一定要配菜',
        optionB: '白飯就很好吃'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡收集發票',
        optionB: '發票拿了就丟'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會整理電腦桌面',
        optionB: '桌面檔案很亂'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會刪除手機照片',
        optionB: '手機照片存很多'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用現金付款',
        optionB: '喜歡用行動支付'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會看天氣預報',
        optionB: '出門才知道天氣'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡做白日夢',
        optionB: '很實際不亂想'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易被騙',
        optionB: '很精明'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被誇獎',
        optionB: '被誇獎會不好意思'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '做事會拖延',
        optionB: '做事很積極'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡routine生活',
        optionB: '喜歡spontaneous生活'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看漫畫',
        optionB: '只看文字書'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡去夜市',
        optionB: '喜歡去商場'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看運動比賽',
        optionB: '覺得運動比賽很無聊'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡玩角色扮演遊戲',
        optionB: '喜歡玩競技遊戲'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡聽podcast',
        optionB: '不聽podcast'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會記住每個人的名字',
        optionB: '常常忘記別人名字'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡當主持人',
        optionB: '不喜歡當主持人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動告白',
        optionB: '等別人先告白'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '喜歡當小老師',
        optionB: '不喜歡教別人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動借東西給別人',
        optionB: '不太借東西給別人'
    },
    
    // 最後補充34題達到300題
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃薯片會發出聲音',
        optionB: '吃薯片很安靜'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝可樂要加冰塊',
        optionB: '喝可樂不加冰'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃橘子會撕白絲',
        optionB: '吃橘子連白絲一起吃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃葡萄會吐籽',
        optionB: '吃葡萄連籽一起吞'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃蝦子會剝殼',
        optionB: '吃蝦子連殼一起咬'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '喝湯一定要配飯',
        optionB: '喝湯就是喝湯'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '吃芒果會切片',
        optionB: '吃芒果直接啃'
    },
    {
        category: 'food',
        question: '世界上只有兩種人',
        optionA: '愛吃甜豆花',
        optionB: '愛吃鹹豆花'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會整理書桌',
        optionB: '書桌永遠很亂'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會摺衣服',
        optionB: '衣服隨便丟'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用紙袋',
        optionB: '喜歡用塑膠袋'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會關注油價',
        optionB: '從不關心油價'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會收集點數',
        optionB: '點數都不用'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會計算CP值',
        optionB: '買東西憑感覺'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '喜歡用環保袋',
        optionB: '常忘記帶環保袋'
    },
    {
        category: 'life',
        question: '世界上只有兩種人',
        optionA: '會關燈節電',
        optionB: '燈開著沒關係'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被讚美',
        optionB: '被讚美會害羞'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易被感化',
        optionB: '很難改變想法'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡當決策者',
        optionB: '喜歡讓別人決定'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '容易心軟',
        optionB: '很理性冷酷'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '喜歡被依賴',
        optionB: '不喜歡負責任'
    },
    {
        category: 'personality',
        question: '世界上只有兩種人',
        optionA: '很重視承諾',
        optionB: '承諾可以改變'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看B級片',
        optionB: '只看大製作電影'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡重看經典',
        optionB: '喜歡追新作品'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看字幕',
        optionB: '喜歡看配音'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡收集周邊',
        optionB: '覺得周邊浪費錢'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡追星',
        optionB: '不理解追星'
    },
    {
        category: 'entertainment',
        question: '世界上只有兩種人',
        optionA: '喜歡看預告片',
        optionB: '不看預告避免雷'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動慶祝別人生日',
        optionB: '等別人提醒才記得'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動關心生病的朋友',
        optionB: '不知道怎麼關心別人'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動分享好康',
        optionB: '好康自己知道就好'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動解釋誤會',
        optionB: '誤會就算了懶得解釋'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動維持友誼',
        optionB: '覺得友誼順其自然'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動化解衝突',
        optionB: '避免處理衝突'
    },
    {
        category: 'social',
        question: '世界上只有兩種人',
        optionA: '會主動表達關心',
        optionB: '關心放在心裡'
    }
];