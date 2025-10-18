// 誰是臥底詞彙庫 - 平民詞 vs 臥底詞配對
const wordPairs = {
    // 食物類
    food: [
        { civilian: '蘋果', spy: '梨子', difficulty: 'medium' },
        { civilian: '牛肉麵', spy: '羊肉麵', difficulty: 'easy' },
        { civilian: '珍珠奶茶', spy: '布丁奶茶', difficulty: 'medium' },
        { civilian: '小籠包', spy: '煎餃', difficulty: 'medium' },
        { civilian: '臭豆腐', spy: '麻辣豆腐', difficulty: 'easy' },
        { civilian: '雞排', spy: '豬排', difficulty: 'easy' },
        { civilian: '火鍋', spy: '麻辣燙', difficulty: 'medium' },
        { civilian: '壽司', spy: '生魚片', difficulty: 'medium' },
        { civilian: '漢堡', spy: '三明治', difficulty: 'easy' },
        { civilian: '拉麵', spy: '烏龍麵', difficulty: 'medium' },
        { civilian: '炸雞', spy: '烤雞', difficulty: 'easy' },
        { civilian: '蛋糕', spy: '馬卡龍', difficulty: 'medium' },
        { civilian: '咖啡', spy: '奶茶', difficulty: 'easy' },
        { civilian: '水餃', spy: '餛飩', difficulty: 'medium' },
        { civilian: 'pizza', spy: '可頌', difficulty: 'hard' },
        { civilian: '冰淇淋', spy: '剉冰', difficulty: 'medium' },
        { civilian: '泡麵', spy: '米粉', difficulty: 'medium' },
        { civilian: '肉圓', spy: '碗粿', difficulty: 'medium' },
        { civilian: '豆漿', spy: '米漿', difficulty: 'easy' },
        { civilian: '蔥抓餅', spy: '手抓餅', difficulty: 'hard' },
        { civilian: '滷肉飯', spy: '焢肉飯', difficulty: 'medium' },
        { civilian: '麻糬', spy: '湯圓', difficulty: 'medium' },
        { civilian: '春捲', spy: '潤餅', difficulty: 'hard' },
        { civilian: '雞蛋糕', spy: '紅豆餅', difficulty: 'medium' },
        { civilian: '豆花', spy: '仙草', difficulty: 'easy' }
    ],

    // 動物類
    animal: [
        { civilian: '獅子', spy: '老虎', difficulty: 'medium' },
        { civilian: '貓', spy: '狗', difficulty: 'easy' },
        { civilian: '企鵝', spy: '海豹', difficulty: 'medium' },
        { civilian: '蝴蝶', spy: '蜻蜓', difficulty: 'medium' },
        { civilian: '鯨魚', spy: '海豚', difficulty: 'medium' },
        { civilian: '熊貓', spy: '無尾熊', difficulty: 'medium' },
        { civilian: '長頸鹿', spy: '駱駝', difficulty: 'easy' },
        { civilian: '兔子', spy: '松鼠', difficulty: 'medium' },
        { civilian: '老鷹', spy: '老鷹', difficulty: 'easy' },
        { civilian: '青蛙', spy: '蟾蜍', difficulty: 'hard' },
        { civilian: '螞蟻', spy: '蜜蜂', difficulty: 'medium' },
        { civilian: '鸚鵡', spy: '金絲雀', difficulty: 'medium' },
        { civilian: '大象', spy: '犀牛', difficulty: 'easy' },
        { civilian: '猴子', spy: '猩猩', difficulty: 'medium' },
        { civilian: '斑馬', spy: '馬', difficulty: 'easy' },
        { civilian: '袋鼠', spy: '樹懶', difficulty: 'easy' },
        { civilian: '金魚', spy: '熱帶魚', difficulty: 'medium' },
        { civilian: '烏龜', spy: '鱉', difficulty: 'medium' },
        { civilian: '蜘蛛', spy: '蠍子', difficulty: 'medium' },
        { civilian: '蝸牛', spy: '蛞蝓', difficulty: 'hard' },
        { civilian: '孔雀', spy: '火雞', difficulty: 'easy' },
        { civilian: '蛇', spy: '蜥蜴', difficulty: 'medium' },
        { civilian: '鯊魚', spy: '鯨魚', difficulty: 'medium' },
        { civilian: '蟑螂', spy: '甲蟲', difficulty: 'medium' },
        { civilian: '天鵝', spy: '鴨子', difficulty: 'easy' }
    ],

    // 物品類
    object: [
        { civilian: '手機', spy: '平板', difficulty: 'easy' },
        { civilian: '筆記型電腦', spy: '桌上型電腦', difficulty: 'easy' },
        { civilian: '雨傘', spy: '陽傘', difficulty: 'medium' },
        { civilian: '眼鏡', spy: '太陽眼鏡', difficulty: 'easy' },
        { civilian: '鉛筆', spy: '原子筆', difficulty: 'easy' },
        { civilian: '書包', spy: '公事包', difficulty: 'easy' },
        { civilian: '拖鞋', spy: '涼鞋', difficulty: 'medium' },
        { civilian: '毛巾', spy: '浴巾', difficulty: 'easy' },
        { civilian: '枕頭', spy: '抱枕', difficulty: 'medium' },
        { civilian: '檯燈', spy: '手電筒', difficulty: 'medium' },
        { civilian: '時鐘', spy: '手錶', difficulty: 'easy' },
        { civilian: '冰箱', spy: '冷凍庫', difficulty: 'medium' },
        { civilian: '洗衣機', spy: '脫水機', difficulty: 'medium' },
        { civilian: '電視', spy: '投影機', difficulty: 'medium' },
        { civilian: '沙發', spy: '躺椅', difficulty: 'medium' },
        { civilian: '餐桌', spy: '茶几', difficulty: 'easy' },
        { civilian: '衣櫃', spy: '書櫃', difficulty: 'easy' },
        { civilian: '吹風機', spy: '捲髮器', difficulty: 'medium' },
        { civilian: '牙刷', spy: '電動牙刷', difficulty: 'medium' },
        { civilian: '垃圾桶', spy: '回收桶', difficulty: 'easy' },
        { civilian: '花瓶', spy: '水杯', difficulty: 'easy' },
        { civilian: '鏡子', spy: '相框', difficulty: 'medium' },
        { civilian: '鍵盤', spy: '滑鼠', difficulty: 'easy' },
        { civilian: '充電器', spy: '延長線', difficulty: 'medium' },
        { civilian: '購物袋', spy: '垃圾袋', difficulty: 'medium' }
    ],

    // 地點類
    place: [
        { civilian: '圖書館', spy: '書店', difficulty: 'medium' },
        { civilian: '醫院', spy: '診所', difficulty: 'easy' },
        { civilian: '銀行', spy: 'ATM', difficulty: 'medium' },
        { civilian: '學校', spy: '補習班', difficulty: 'easy' },
        { civilian: '電影院', spy: 'KTV', difficulty: 'easy' },
        { civilian: '百貨公司', spy: '大賣場', difficulty: 'medium' },
        { civilian: '咖啡廳', spy: '茶館', difficulty: 'medium' },
        { civilian: '夜市', spy: '市場', difficulty: 'medium' },
        { civilian: '公園', spy: '廣場', difficulty: 'easy' },
        { civilian: '游泳池', spy: '海灘', difficulty: 'easy' },
        { civilian: '健身房', spy: '運動場', difficulty: 'medium' },
        { civilian: '美術館', spy: '博物館', difficulty: 'medium' },
        { civilian: '餐廳', spy: '小吃店', difficulty: 'easy' },
        { civilian: '飯店', spy: '民宿', difficulty: 'medium' },
        { civilian: '機場', spy: '火車站', difficulty: 'easy' },
        { civilian: '便利商店', spy: '雜貨店', difficulty: 'medium' },
        { civilian: '藥局', spy: '藥妝店', difficulty: 'medium' },
        { civilian: '髮廊', spy: '美容院', difficulty: 'medium' },
        { civilian: '郵局', spy: '宅配店', difficulty: 'medium' },
        { civilian: '加油站', spy: '停車場', difficulty: 'easy' },
        { civilian: '寺廟', spy: '教堂', difficulty: 'easy' },
        { civilian: '動物園', spy: '水族館', difficulty: 'easy' },
        { civilian: '遊樂園', spy: '兒童樂園', difficulty: 'medium' },
        { civilian: '山頂', spy: '海邊', difficulty: 'easy' },
        { civilian: '辦公室', spy: '會議室', difficulty: 'medium' }
    ],

    // 活動類
    activity: [
        { civilian: '跑步', spy: '散步', difficulty: 'easy' },
        { civilian: '游泳', spy: '潛水', difficulty: 'medium' },
        { civilian: '唱歌', spy: '說話', difficulty: 'medium' },
        { civilian: '跳舞', spy: '做操', difficulty: 'medium' },
        { civilian: '讀書', spy: '寫字', difficulty: 'easy' },
        { civilian: '畫畫', spy: '寫字', difficulty: 'easy' },
        { civilian: '煮飯', spy: '烤肉', difficulty: 'easy' },
        { civilian: '打球', spy: '踢球', difficulty: 'easy' },
        { civilian: '爬山', spy: '健行', difficulty: 'medium' },
        { civilian: '釣魚', spy: '抓魚', difficulty: 'medium' },
        { civilian: '購物', spy: '逛街', difficulty: 'hard' },
        { civilian: '睡覺', spy: '休息', difficulty: 'easy' },
        { civilian: '吃飯', spy: '用餐', difficulty: 'hard' },
        { civilian: '洗澡', spy: '淋浴', difficulty: 'medium' },
        { civilian: '看電影', spy: '看電視', difficulty: 'easy' },
        { civilian: '打電動', spy: '玩手機', difficulty: 'medium' },
        { civilian: '聽音樂', spy: '唱歌', difficulty: 'medium' },
        { civilian: '上班', spy: '工作', difficulty: 'hard' },
        { civilian: '約會', spy: '聚餐', difficulty: 'medium' },
        { civilian: '旅行', spy: '出差', difficulty: 'medium' },
        { civilian: '開車', spy: '騎車', difficulty: 'easy' },
        { civilian: '拍照', spy: '錄影', difficulty: 'easy' },
        { civilian: '化妝', spy: '保養', difficulty: 'medium' },
        { civilian: '運動', spy: '健身', difficulty: 'medium' },
        { civilian: '打掃', spy: '整理', difficulty: 'medium' }
    ]
};

// 取得隨機詞彙配對
function getRandomWordPair(category = 'all', difficulty = 'all') {
    let availablePairs = [];
    
    if (category === 'all') {
        // 合併所有類別
        Object.values(wordPairs).forEach(categoryPairs => {
            availablePairs = availablePairs.concat(categoryPairs);
        });
    } else {
        availablePairs = wordPairs[category] || [];
    }
    
    // 根據難度篩選
    if (difficulty !== 'all') {
        availablePairs = availablePairs.filter(pair => pair.difficulty === difficulty);
    }
    
    if (availablePairs.length === 0) {
        // 如果沒有符合條件的，回傳預設值
        return { civilian: '蘋果', spy: '梨子', difficulty: 'medium' };
    }
    
    // 隨機選擇一對
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    return availablePairs[randomIndex];
}

// 取得類別顯示名稱
function getCategoryDisplayName(category) {
    const categoryNames = {
        'all': '隨機類別',
        'food': '食物類',
        'animal': '動物類', 
        'object': '物品類',
        'place': '地點類',
        'activity': '活動類'
    };
    return categoryNames[category] || category;
}

// 取得難度顯示名稱
function getDifficultyDisplayName(difficulty) {
    const difficultyNames = {
        'easy': '簡單 (差異明顯)',
        'medium': '中等 (有些相似)',
        'hard': '困難 (非常相似)'
    };
    return difficultyNames[difficulty] || difficulty;
}