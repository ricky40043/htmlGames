const questionBank = [
    // ===== 簡單題目 (1-100題) =====
    // 一般常識類 - 簡單
    {
        id: 1,
        category: 'general',
        difficulty: 'easy',
        question: '一年有幾個季節？',
        options: ['2個', '3個', '4個', '5個'],
        correct: '4個'
    },
    {
        id: 2,
        category: 'general',
        difficulty: 'easy',
        question: '一週有幾天？',
        options: ['5天', '6天', '7天', '8天'],
        correct: '7天'
    },
    {
        id: 3,
        category: 'general',
        difficulty: 'easy',
        question: '台灣的首都是哪裡？',
        options: ['台北', '台中', '台南', '高雄'],
        correct: '台北'
    },
    {
        id: 4,
        category: 'general',
        difficulty: 'easy',
        question: '一打是幾個？',
        options: ['10個', '12個', '15個', '20個'],
        correct: '12個'
    },
    {
        id: 5,
        category: 'general',
        difficulty: 'easy',
        question: '紅綠燈中，綠燈代表什麼意思？',
        options: ['停止', '通行', '注意', '準備'],
        correct: '通行'
    },
    // 繼續簡單題目
    {
        id: 6,
        category: 'general',
        difficulty: 'easy',
        question: '一分鐘有幾秒？',
        options: ['50秒', '60秒', '70秒', '80秒'],
        correct: '60秒'
    },
    {
        id: 7,
        category: 'general',
        difficulty: 'easy',
        question: '彩虹有幾種顏色？',
        options: ['5種', '6種', '7種', '8種'],
        correct: '7種'
    },
    {
        id: 8,
        category: 'general',
        difficulty: 'easy',
        question: '一小時有幾分鐘？',
        options: ['50分鐘', '60分鐘', '70分鐘', '80分鐘'],
        correct: '60分鐘'
    },
    {
        id: 9,
        category: 'general',
        difficulty: 'easy',
        question: '農曆新年又稱為什麼？',
        options: ['中秋節', '端午節', '春節', '清明節'],
        correct: '春節'
    },
    {
        id: 10,
        category: 'general',
        difficulty: 'easy',
        question: '一年有幾個月？',
        options: ['10個月', '11個月', '12個月', '13個月'],
        correct: '12個月'
    },
    {
        id: 11,
        category: 'general',
        difficulty: 'easy',
        question: '太陽從哪個方向升起？',
        options: ['南方', '北方', '東方', '西方'],
        correct: '東方'
    },
    {
        id: 12,
        category: 'general',
        difficulty: 'easy',
        question: '中秋節要吃什麼？',
        options: ['粽子', '月餅', '湯圓', '年糕'],
        correct: '月餅'
    },
    {
        id: 13,
        category: 'general',
        difficulty: 'easy',
        question: '端午節要吃什麼？',
        options: ['粽子', '月餅', '湯圓', '年糕'],
        correct: '粽子'
    },
    {
        id: 14,
        category: 'general',
        difficulty: 'easy',
        question: '元宵節要吃什麼？',
        options: ['粽子', '月餅', '湯圓', '年糕'],
        correct: '湯圓'
    },
    {
        id: 15,
        category: 'general',
        difficulty: 'easy',
        question: '貓有幾條命？（俗語）',
        options: ['7條', '8條', '9條', '10條'],
        correct: '9條'
    },
    // 生活常識 - 簡單
    {
        id: 16,
        category: 'life',
        difficulty: 'easy',
        question: '刷牙應該一天幾次？',
        options: ['1次', '2次', '3次', '4次'],
        correct: '2次'
    },
    {
        id: 17,
        category: 'life',
        difficulty: 'easy',
        question: '感冒時應該多喝什麼？',
        options: ['咖啡', '酒', '水', '汽水'],
        correct: '水'
    },
    {
        id: 18,
        category: 'life',
        difficulty: 'easy',
        question: '交通號誌中，紅燈表示什麼？',
        options: ['通行', '停止', '注意', '加速'],
        correct: '停止'
    },
    {
        id: 19,
        category: 'life',
        difficulty: 'easy',
        question: '火警電話是幾號？',
        options: ['110', '119', '113', '165'],
        correct: '119'
    },
    {
        id: 20,
        category: 'life',
        difficulty: 'easy',
        question: '警察電話是幾號？',
        options: ['110', '119', '113', '165'],
        correct: '110'
    },
    // 科學類 - 簡單
    {
        id: 21,
        category: 'science',
        difficulty: 'easy',
        question: '地球繞太陽一圈需要多少時間？',
        options: ['1天', '1個月', '1年', '10年'],
        correct: '1年'
    },
    {
        id: 22,
        category: 'science',
        difficulty: 'easy',
        question: '人體有幾個心臟？',
        options: ['1個', '2個', '3個', '4個'],
        correct: '1個'
    },
    {
        id: 23,
        category: 'science',
        difficulty: 'easy',
        question: '水的化學符號是什麼？',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        correct: 'H2O'
    },
    {
        id: 24,
        category: 'science',
        difficulty: 'easy',
        question: '光的三原色是什麼？',
        options: ['紅黃藍', '紅綠藍', '黃綠藍', '紅橙黃'],
        correct: '紅綠藍'
    },
    {
        id: 25,
        category: 'science',
        difficulty: 'easy',
        question: '人類有幾種血型？（ABO系統）',
        options: ['2種', '3種', '4種', '5種'],
        correct: '4種'
    },
    // 歷史類 - 簡單
    {
        id: 26,
        category: 'history',
        difficulty: 'easy',
        question: '中華民國成立於哪一年？',
        options: ['1911年', '1912年', '1949年', '1950年'],
        correct: '1912年'
    },
    {
        id: 27,
        category: 'history',
        difficulty: 'easy',
        question: '台灣光復是在哪一年？',
        options: ['1943年', '1944年', '1945年', '1946年'],
        correct: '1945年'
    },
    {
        id: 28,
        category: 'history',
        difficulty: 'easy',
        question: '二二八事件發生在哪一年？',
        options: ['1946年', '1947年', '1948年', '1949年'],
        correct: '1947年'
    },
    {
        id: 29,
        category: 'history',
        difficulty: 'easy',
        question: '台灣解嚴是在哪一年？',
        options: ['1986年', '1987年', '1988年', '1989年'],
        correct: '1987年'
    },
    {
        id: 30,
        category: 'entertainment',
        difficulty: 'easy',
        question: '籃球比賽中，一隊有幾個人在場上？',
        options: ['4人', '5人', '6人', '7人'],
        correct: '5人'
    },
    // ===== 中等難度題目 (31-200題) =====
    {
        id: 31,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國鳥是什麼？',
        options: ['台灣藍鵲', '黑面琵鷺', '帝雉', '喜鵲'],
        correct: '台灣藍鵲'
    },
    {
        id: 32,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國樹是什麼？',
        options: ['樟樹', '榕樹', '桃花', '梅花'],
        correct: '樟樹'
    },
    {
        id: 33,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的面積大約是多少平方公里？',
        options: ['26000', '36000', '46000', '56000'],
        correct: '36000'
    },
    {
        id: 34,
        category: 'science',
        difficulty: 'medium',
        question: 'DNA的中文名稱是什麼？',
        options: ['去氧核糖核酸', '核糖核酸', '蛋白質', '胺基酸'],
        correct: '去氧核糖核酸'
    },
    {
        id: 35,
        category: 'science',
        difficulty: 'medium',
        question: '元素週期表中，氫的原子序數是多少？',
        options: ['1', '2', '3', '4'],
        correct: '1'
    },
    {
        id: 36,
        category: 'science',
        difficulty: 'medium',
        question: '人體最硬的部分是什麼？',
        options: ['骨頭', '牙齒', '指甲', '頭髮'],
        correct: '牙齒'
    },
    {
        id: 37,
        category: 'history',
        difficulty: 'medium',
        question: '鄭成功來台是在哪一年？',
        options: ['1661年', '1662年', '1663年', '1664年'],
        correct: '1661年'
    },
    {
        id: 38,
        category: 'history',
        difficulty: 'medium',
        question: '台灣第一任總統是誰？',
        options: ['蔣介石', '蔣經國', '李登輝', '陳水扁'],
        correct: '蔣介石'
    },
    {
        id: 39,
        category: 'history',
        difficulty: 'medium',
        question: '台北101大樓完工於哪一年？',
        options: ['2003年', '2004年', '2005年', '2006年'],
        correct: '2004年'
    },
    {
        id: 40,
        category: 'entertainment',
        difficulty: 'medium',
        question: '奧運會每幾年舉辦一次？',
        options: ['2年', '3年', '4年', '5年'],
        correct: '4年'
    },
    // ===== 困難題目 (41-100題) =====
    {
        id: 41,
        category: 'general',
        difficulty: 'hard',
        question: '台灣哪個縣市的面積最大？',
        options: ['花蓮縣', '台東縣', '南投縣', '高雄市'],
        correct: '花蓮縣'
    },
    {
        id: 42,
        category: 'general',
        difficulty: 'hard',
        question: '台灣最長的河流是哪一條？',
        options: ['濁水溪', '高屏溪', '淡水河', '大甲溪'],
        correct: '濁水溪'
    },
    {
        id: 43,
        category: 'science',
        difficulty: 'hard',
        question: '量子力學的創始人之一是誰？',
        options: ['愛因斯坦', '牛頓', '普朗克', '達爾文'],
        correct: '普朗克'
    },
    {
        id: 44,
        category: 'history',
        difficulty: 'hard',
        question: '台灣首次政黨輪替是在哪一年？',
        options: ['1996年', '2000年', '2004年', '2008年'],
        correct: '2000年'
    },
    {
        id: 45,
        category: 'history',
        difficulty: 'hard',
        question: '台灣加入WTO是在哪一年？',
        options: ['2000年', '2001年', '2002年', '2003年'],
        correct: '2002年'
    },
    // 更多簡單題目 (46-150)
    {
        id: 46,
        category: 'general',
        difficulty: 'easy',
        question: '水在攝氏0度時會變成什麼？',
        options: ['水蒸氣', '冰', '霜', '雪'],
        correct: '冰'
    },
    {
        id: 47,
        category: 'general',
        difficulty: 'easy',
        question: '一公斤等於多少公克？',
        options: ['100公克', '1000公克', '10000公克', '100000公克'],
        correct: '1000公克'
    },
    {
        id: 48,
        category: 'life',
        difficulty: 'easy',
        question: '過馬路時應該看什麼？',
        options: ['紅綠燈', '天空', '地面', '商店'],
        correct: '紅綠燈'
    },
    {
        id: 49,
        category: 'life',
        difficulty: 'easy',
        question: '蔬菜水果富含什麼營養素？',
        options: ['維生素', '脂肪', '蛋白質', '澱粉'],
        correct: '維生素'
    },
    {
        id: 50,
        category: 'science',
        difficulty: 'easy',
        question: '地球有幾個衛星？',
        options: ['0個', '1個', '2個', '3個'],
        correct: '1個'
    },
    // 繼續添加簡單題目 (51-150)
    {
        id: 51,
        category: 'science',
        difficulty: 'easy',
        question: '植物進行光合作用需要什麼？',
        options: ['陽光', '音樂', '電力', '噪音'],
        correct: '陽光'
    },
    {
        id: 52,
        category: 'entertainment',
        difficulty: 'easy',
        question: '足球比賽中，一隊有幾個人在場上？',
        options: ['9人', '10人', '11人', '12人'],
        correct: '11人'
    },
    {
        id: 53,
        category: 'general',
        difficulty: 'easy',
        question: '一天有幾小時？',
        options: ['20小時', '24小時', '25小時', '30小時'],
        correct: '24小時'
    },
    {
        id: 54,
        category: 'general',
        difficulty: 'easy',
        question: '人體有幾隻眼睛？',
        options: ['1隻', '2隻', '3隻', '4隻'],
        correct: '2隻'
    },
    {
        id: 55,
        category: 'life',
        difficulty: 'easy',
        question: '垃圾應該丟在哪裡？',
        options: ['地上', '垃圾桶', '河裡', '路邊'],
        correct: '垃圾桶'
    },
    {
        id: 56,
        category: 'general',
        difficulty: 'easy',
        question: '台灣四周被什麼包圍？',
        options: ['山脈', '海洋', '沙漠', '森林'],
        correct: '海洋'
    },
    {
        id: 57,
        category: 'science',
        difficulty: 'easy',
        question: '人體需要呼吸什麼氣體？',
        options: ['二氧化碳', '氧氣', '氮氣', '氫氣'],
        correct: '氧氣'
    },
    {
        id: 58,
        category: 'life',
        difficulty: 'easy',
        question: '正常人體溫度大約是攝氏幾度？',
        options: ['35度', '36度', '37度', '38度'],
        correct: '37度'
    },
    {
        id: 59,
        category: 'general',
        difficulty: 'easy',
        question: '蘋果是什麼顏色？',
        options: ['只有紅色', '只有綠色', '只有黃色', '有多種顏色'],
        correct: '有多種顏色'
    },
    {
        id: 60,
        category: 'entertainment',
        difficulty: 'easy',
        question: '桌球又稱為什麼？',
        options: ['乒乓球', '撞球', '羽毛球', '網球'],
        correct: '乒乓球'
    },
    {
        id: 61,
        category: 'general',
        difficulty: 'easy',
        question: '一星期的第一天是什麼？',
        options: ['星期一', '星期日', '星期六', '星期五'],
        correct: '星期日'
    },
    {
        id: 62,
        category: 'science',
        difficulty: 'easy',
        question: '冰融化後會變成什麼？',
        options: ['水蒸氣', '水', '雪', '霜'],
        correct: '水'
    },
    {
        id: 63,
        category: 'life',
        difficulty: 'easy',
        question: '早餐、午餐、晚餐中，哪一餐最重要？',
        options: ['早餐', '午餐', '晚餐', '都一樣重要'],
        correct: '都一樣重要'
    },
    {
        id: 64,
        category: 'general',
        difficulty: 'easy',
        question: '蜜蜂採集什麼來製造蜂蜜？',
        options: ['花粉', '花蜜', '樹葉', '樹皮'],
        correct: '花蜜'
    },
    {
        id: 65,
        category: 'entertainment',
        difficulty: 'easy',
        question: '象棋中哪個棋子最重要？',
        options: ['車', '馬', '將/帥', '兵/卒'],
        correct: '將/帥'
    },
    {
        id: 66,
        category: 'science',
        difficulty: 'easy',
        question: '鳥類用什麼來飛行？',
        options: ['腳', '翅膀', '尾巴', '嘴巴'],
        correct: '翅膀'
    },
    {
        id: 67,
        category: 'general',
        difficulty: 'easy',
        question: '牛奶主要含有什麼營養？',
        options: ['維生素C', '鈣質', '鐵質', '纖維'],
        correct: '鈣質'
    },
    {
        id: 68,
        category: 'life',
        difficulty: 'easy',
        question: '開車時必須繫什麼？',
        options: ['領帶', '安全帶', '圍巾', '手錶'],
        correct: '安全帶'
    },
    {
        id: 69,
        category: 'general',
        difficulty: 'easy',
        question: '蚯蚓對土壤有什麼好處？',
        options: ['讓土壤變硬', '讓土壤鬆軟', '讓土壤變酸', '讓土壤變鹹'],
        correct: '讓土壤鬆軟'
    },
    {
        id: 70,
        category: 'entertainment',
        difficulty: 'easy',
        question: '撲克牌有幾種花色？',
        options: ['2種', '3種', '4種', '5種'],
        correct: '4種'
    },
    {
        id: 71,
        category: 'science',
        difficulty: 'easy',
        question: '魚類用什麼呼吸？',
        options: ['肺', '鰓', '皮膚', '嘴巴'],
        correct: '鰓'
    },
    {
        id: 72,
        category: 'general',
        difficulty: 'easy',
        question: '竹子是什麼植物？',
        options: ['樹木', '草本植物', '藤類', '菌類'],
        correct: '草本植物'
    },
    {
        id: 73,
        category: 'life',
        difficulty: 'easy',
        question: '洗手應該用什麼？',
        options: ['只用水', '肥皂和水', '只用酒精', '只用毛巾'],
        correct: '肥皂和水'
    },
    {
        id: 74,
        category: 'general',
        difficulty: 'easy',
        question: '蝴蝶的幼蟲叫什麼？',
        options: ['蛹', '毛毛蟲', '蚯蚓', '蜘蛛'],
        correct: '毛毛蟲'
    },
    {
        id: 75,
        category: 'entertainment',
        difficulty: 'easy',
        question: '圍棋棋盤有幾條線？',
        options: ['17條', '19條', '21條', '23條'],
        correct: '19條'
    },
    {
        id: 76,
        category: 'science',
        difficulty: 'easy',
        question: '聲音能在真空中傳播嗎？',
        options: ['能', '不能', '有時能', '看情況'],
        correct: '不能'
    },
    {
        id: 77,
        category: 'general',
        difficulty: 'easy',
        question: '熊貓主要吃什麼？',
        options: ['肉類', '竹子', '水果', '昆蟲'],
        correct: '竹子'
    },
    {
        id: 78,
        category: 'life',
        difficulty: 'easy',
        question: '看書時光線應該如何？',
        options: ['很暗', '很亮', '適中', '閃爍'],
        correct: '適中'
    },
    {
        id: 79,
        category: 'general',
        difficulty: 'easy',
        question: '企鵝主要生活在哪裡？',
        options: ['北極', '南極', '赤道', '溫帶'],
        correct: '南極'
    },
    {
        id: 80,
        category: 'entertainment',
        difficulty: 'easy',
        question: '麻將有幾種花色？',
        options: ['2種', '3種', '4種', '5種'],
        correct: '3種'
    },
    // 繼續簡單題目 (81-150)
    {
        id: 81,
        category: 'general',
        difficulty: 'easy',
        question: '蜘蛛有幾隻腳？',
        options: ['6隻', '8隻', '10隻', '12隻'],
        correct: '8隻'
    },
    {
        id: 82,
        category: 'science',
        difficulty: 'easy',
        question: '雨是從哪裡來的？',
        options: ['地下', '雲朵', '樹木', '山洞'],
        correct: '雲朵'
    },
    {
        id: 83,
        category: 'life',
        difficulty: 'easy',
        question: '睡覺前應該做什麼？',
        options: ['吃大餐', '劇烈運動', '刷牙洗臉', '看恐怖片'],
        correct: '刷牙洗臉'
    },
    {
        id: 84,
        category: 'general',
        difficulty: 'easy',
        question: '長頸鹿的特徵是什麼？',
        options: ['短腿', '長脖子', '大耳朵', '短尾巴'],
        correct: '長脖子'
    },
    {
        id: 85,
        category: 'entertainment',
        difficulty: 'easy',
        question: '西洋棋有幾種棋子？',
        options: ['4種', '5種', '6種', '7種'],
        correct: '6種'
    },
    {
        id: 86,
        category: 'science',
        difficulty: 'easy',
        question: '蝙蝠是什麼動物？',
        options: ['鳥類', '哺乳動物', '爬蟲類', '昆蟲'],
        correct: '哺乳動物'
    },
    {
        id: 87,
        category: 'general',
        difficulty: 'easy',
        question: '駱駝的駝峰是用來儲存什麼？',
        options: ['水', '脂肪', '食物', '空氣'],
        correct: '脂肪'
    },
    {
        id: 88,
        category: 'life',
        difficulty: 'easy',
        question: '運動前應該做什麼？',
        options: ['立刻開始', '暖身運動', '吃飽飯', '睡覺'],
        correct: '暖身運動'
    },
    {
        id: 89,
        category: 'general',
        difficulty: 'easy',
        question: '蛇是用什麼方式移動？',
        options: ['走路', '跳躍', '爬行', '飛行'],
        correct: '爬行'
    },
    {
        id: 90,
        category: 'entertainment',
        difficulty: 'easy',
        question: '跳棋的棋盤是什麼形狀？',
        options: ['正方形', '圓形', '六角形', '三角形'],
        correct: '六角形'
    },
    // 更多簡單題目 (91-150)
    {
        id: 91,
        category: 'science',
        difficulty: 'easy',
        question: '北極熊的毛是什麼顏色？',
        options: ['黑色', '白色', '棕色', '灰色'],
        correct: '白色'
    },
    {
        id: 92,
        category: 'general',
        difficulty: 'easy',
        question: '河馬主要生活在哪裡？',
        options: ['沙漠', '森林', '水中', '山上'],
        correct: '水中'
    },
    {
        id: 93,
        category: 'life',
        difficulty: 'easy',
        question: '颱風來時應該做什麼？',
        options: ['出去玩', '待在室內', '去海邊', '爬山'],
        correct: '待在室內'
    },
    {
        id: 94,
        category: 'general',
        difficulty: 'easy',
        question: '袋鼠的寶寶住在哪裡？',
        options: ['樹上', '育兒袋', '地下', '水中'],
        correct: '育兒袋'
    },
    {
        id: 95,
        category: 'entertainment',
        difficulty: 'easy',
        question: '棒球有幾個壘包？',
        options: ['2個', '3個', '4個', '5個'],
        correct: '4個'
    },
    {
        id: 96,
        category: 'science',
        difficulty: 'easy',
        question: '鯨魚是什麼動物？',
        options: ['魚類', '哺乳動物', '爬蟲類', '兩棲動物'],
        correct: '哺乳動物'
    },
    {
        id: 97,
        category: 'general',
        difficulty: 'easy',
        question: '蜜蜂會製造什麼？',
        options: ['牛奶', '蜂蜜', '醬油', '醋'],
        correct: '蜂蜜'
    },
    {
        id: 98,
        category: 'life',
        difficulty: 'easy',
        question: '地震時應該怎麼做？',
        options: ['跑到戶外', '躲在桌子下', '站在窗邊', '搭電梯'],
        correct: '躲在桌子下'
    },
    {
        id: 99,
        category: 'general',
        difficulty: 'easy',
        question: '蝸牛的殼有什麼用？',
        options: ['裝飾', '保護', '飛行', '游泳'],
        correct: '保護'
    },
    {
        id: 100,
        category: 'entertainment',
        difficulty: 'easy',
        question: '撞球檯有幾個洞？',
        options: ['4個', '6個', '8個', '10個'],
        correct: '6個'
    },
    // 更多簡單題目 (101-150)
    {
        id: 101,
        category: 'science',
        difficulty: 'easy',
        question: '海星有幾隻手臂？',
        options: ['4隻', '5隻', '6隻', '8隻'],
        correct: '5隻'
    },
    {
        id: 102,
        category: 'general',
        difficulty: 'easy',
        question: '螞蟻是什麼動物？',
        options: ['哺乳動物', '鳥類', '昆蟲', '爬蟲類'],
        correct: '昆蟲'
    },
    {
        id: 103,
        category: 'life',
        difficulty: 'easy',
        question: '過期的食物應該怎麼處理？',
        options: ['直接吃', '丟掉', '送人', '冷凍'],
        correct: '丟掉'
    },
    {
        id: 104,
        category: 'general',
        difficulty: 'easy',
        question: '老鷹是什麼動物？',
        options: ['哺乳動物', '鳥類', '爬蟲類', '魚類'],
        correct: '鳥類'
    },
    {
        id: 105,
        category: 'entertainment',
        difficulty: 'easy',
        question: '羽毛球的球是什麼做的？',
        options: ['羽毛', '塑膠', '橡膠', '金屬'],
        correct: '羽毛'
    },
    {
        id: 106,
        category: 'science',
        difficulty: 'easy',
        question: '章魚有幾隻觸手？',
        options: ['6隻', '8隻', '10隻', '12隻'],
        correct: '8隻'
    },
    {
        id: 107,
        category: 'general',
        difficulty: 'easy',
        question: '蚊子叮咬後會有什麼感覺？',
        options: ['涼爽', '溫暖', '癢', '無感'],
        correct: '癢'
    },
    {
        id: 108,
        category: 'life',
        difficulty: 'easy',
        question: '坐車時應該繫什麼？',
        options: ['領結', '安全帶', '圍裙', '頭巾'],
        correct: '安全帶'
    },
    {
        id: 109,
        category: 'general',
        difficulty: 'easy',
        question: '孔雀的特色是什麼？',
        options: ['長脖子', '美麗的尾羽', '大耳朵', '長鼻子'],
        correct: '美麗的尾羽'
    },
    {
        id: 110,
        category: 'entertainment',
        difficulty: 'easy',
        question: '保齡球有幾個球瓶？',
        options: ['8個', '10個', '12個', '15個'],
        correct: '10個'
    },
    {
        id: 111,
        category: 'science',
        difficulty: 'easy',
        question: '蜻蜓有幾對翅膀？',
        options: ['1對', '2對', '3對', '4對'],
        correct: '2對'
    },
    {
        id: 112,
        category: 'general',
        difficulty: 'easy',
        question: '斑馬身上有什麼圖案？',
        options: ['斑點', '條紋', '方格', '星星'],
        correct: '條紋'
    },
    {
        id: 113,
        category: 'life',
        difficulty: 'easy',
        question: '游泳時應該注意什麼？',
        options: ['安全', '速度', '外表', '聲音'],
        correct: '安全'
    },
    {
        id: 114,
        category: 'general',
        difficulty: 'easy',
        question: '蝴蝶的翅膀上有什麼？',
        options: ['毛髮', '鱗片', '羽毛', '刺'],
        correct: '鱗片'
    },
    {
        id: 115,
        category: 'entertainment',
        difficulty: 'easy',
        question: '網球比賽在什麼地方進行？',
        options: ['球場', '游泳池', '跑道', '體操館'],
        correct: '球場'
    },
    {
        id: 116,
        category: 'science',
        difficulty: 'easy',
        question: '青蛙的幼體叫什麼？',
        options: ['小青蛙', '蝌蚪', '小魚', '幼蟲'],
        correct: '蝌蚪'
    },
    {
        id: 117,
        category: 'general',
        difficulty: 'easy',
        question: '猴子喜歡吃什麼？',
        options: ['草', '香蕉', '魚', '蟲'],
        correct: '香蕉'
    },
    {
        id: 118,
        category: 'life',
        difficulty: 'easy',
        question: '雷雨天時不應該做什麼？',
        options: ['看書', '睡覺', '在空曠地方', '聽音樂'],
        correct: '在空曠地方'
    },
    {
        id: 119,
        category: 'general',
        difficulty: 'easy',
        question: '海豚是什麼動物？',
        options: ['魚類', '哺乳動物', '鳥類', '爬蟲類'],
        correct: '哺乳動物'
    },
    {
        id: 120,
        category: 'entertainment',
        difficulty: 'easy',
        question: '跳高比賽用什麼工具？',
        options: ['繩子', '竿子', '網子', '球'],
        correct: '竿子'
    },
    {
        id: 121,
        category: 'science',
        difficulty: 'easy',
        question: '蜜蜂會蜇人嗎？',
        options: ['會', '不會', '有時會', '看心情'],
        correct: '會'
    },
    {
        id: 122,
        category: 'general',
        difficulty: 'easy',
        question: '貓頭鷹什麼時候活動？',
        options: ['白天', '晚上', '中午', '早晨'],
        correct: '晚上'
    },
    {
        id: 123,
        category: 'life',
        difficulty: 'easy',
        question: '防曬用品的主要功能是什麼？',
        options: ['美白', '保濕', '防紫外線', '除皺'],
        correct: '防紫外線'
    },
    {
        id: 124,
        category: 'general',
        difficulty: 'easy',
        question: '海龜在哪裡產卵？',
        options: ['海中', '沙灘', '樹上', '岩石'],
        correct: '沙灘'
    },
    {
        id: 125,
        category: 'entertainment',
        difficulty: 'easy',
        question: '射箭用什麼工具？',
        options: ['弓箭', '槍', '刀', '棒子'],
        correct: '弓箭'
    },
    {
        id: 126,
        category: 'science',
        difficulty: 'easy',
        question: '蝴蝶的口器是什麼形狀？',
        options: ['管狀', '方形', '三角形', '星形'],
        correct: '管狀'
    },
    {
        id: 127,
        category: 'general',
        difficulty: 'easy',
        question: '鴨子的腳有什麼特徵？',
        options: ['有爪子', '有蹼', '很小', '很長'],
        correct: '有蹼'
    },
    {
        id: 128,
        category: 'life',
        difficulty: 'easy',
        question: '感冒時應該怎麼做？',
        options: ['多休息', '劇烈運動', '不吃飯', '熬夜'],
        correct: '多休息'
    },
    {
        id: 129,
        category: 'general',
        difficulty: 'easy',
        question: '老虎身上有什麼圖案？',
        options: ['斑點', '條紋', '圓圈', '方格'],
        correct: '條紋'
    },
    {
        id: 130,
        category: 'entertainment',
        difficulty: 'easy',
        question: '游泳比賽在哪裡進行？',
        options: ['跑道', '游泳池', '球場', '體操館'],
        correct: '游泳池'
    },
    {
        id: 131,
        category: 'science',
        difficulty: 'easy',
        question: '螞蟻生活在哪裡？',
        options: ['樹上', '水中', '蟻穴', '空中'],
        correct: '蟻穴'
    },
    {
        id: 132,
        category: 'general',
        difficulty: 'easy',
        question: '大象的鼻子有什麼用？',
        options: ['裝飾', '多功能工具', '無用', '只能呼吸'],
        correct: '多功能工具'
    },
    {
        id: 133,
        category: 'life',
        difficulty: 'easy',
        question: '飯前應該做什麼？',
        options: ['運動', '洗手', '睡覺', '看電視'],
        correct: '洗手'
    },
    {
        id: 134,
        category: 'general',
        difficulty: 'easy',
        question: '企鵝會飛嗎？',
        options: ['會', '不會', '有時會', '在水中會'],
        correct: '不會'
    },
    {
        id: 135,
        category: 'entertainment',
        difficulty: 'easy',
        question: '籃球比賽的籃框有多高？',
        options: ['2公尺', '3公尺', '3.05公尺', '4公尺'],
        correct: '3.05公尺'
    },
    {
        id: 136,
        category: 'science',
        difficulty: 'easy',
        question: '蜘蛛會織什麼？',
        options: ['布', '網', '毯子', '衣服'],
        correct: '網'
    },
    {
        id: 137,
        category: 'general',
        difficulty: 'easy',
        question: '蝸牛移動的速度如何？',
        options: ['很快', '很慢', '普通', '超快'],
        correct: '很慢'
    },
    {
        id: 138,
        category: 'life',
        difficulty: 'easy',
        question: '晚上睡覺時房間應該怎樣？',
        options: ['很亮', '很吵', '安靜黑暗', '很冷'],
        correct: '安靜黑暗'
    },
    {
        id: 139,
        category: 'general',
        difficulty: 'easy',
        question: '松鼠喜歡吃什麼？',
        options: ['肉', '果實', '草', '魚'],
        correct: '果實'
    },
    {
        id: 140,
        category: 'entertainment',
        difficulty: 'easy',
        question: '高爾夫球的目標是什麼？',
        options: ['跑最快', '跳最高', '把球打進洞', '舉最重'],
        correct: '把球打進洞'
    },
    {
        id: 141,
        category: 'science',
        difficulty: 'easy',
        question: '蝙蝠用什麼來導航？',
        options: ['眼睛', '聲音', '鼻子', '觸手'],
        correct: '聲音'
    },
    {
        id: 142,
        category: 'general',
        difficulty: 'easy',
        question: '河馬的嘴巴可以張多大？',
        options: ['很小', '普通', '很大', '不能張開'],
        correct: '很大'
    },
    {
        id: 143,
        category: 'life',
        difficulty: 'easy',
        question: '戴口罩的主要目的是什麼？',
        options: ['保暖', '美觀', '防護', '遮陽'],
        correct: '防護'
    },
    {
        id: 144,
        category: 'general',
        difficulty: 'easy',
        question: '變色龍的特殊能力是什麼？',
        options: ['飛行', '變色', '隱形', '發光'],
        correct: '變色'
    },
    {
        id: 145,
        category: 'entertainment',
        difficulty: 'easy',
        question: '桌球的球是什麼顏色？',
        options: ['紅色', '白色或橘色', '藍色', '綠色'],
        correct: '白色或橘色'
    },
    {
        id: 146,
        category: 'science',
        difficulty: 'easy',
        question: '螢火蟲為什麼會發光？',
        options: ['吃了發光食物', '天生能力', '反射月光', '電力'],
        correct: '天生能力'
    },
    {
        id: 147,
        category: 'general',
        difficulty: 'easy',
        question: '鯊魚的骨頭是什麼做的？',
        options: ['骨頭', '軟骨', '金屬', '塑膠'],
        correct: '軟骨'
    },
    {
        id: 148,
        category: 'life',
        difficulty: 'easy',
        question: '喝水的最佳時間是什麼時候？',
        options: ['只有渴時', '每天定時', '睡前大量', '運動後大量'],
        correct: '每天定時'
    },
    {
        id: 149,
        category: 'general',
        difficulty: 'easy',
        question: '蜂鳥的特色是什麼？',
        options: ['很大', '很小', '不會飛', '不會叫'],
        correct: '很小'
    },
    {
        id: 150,
        category: 'entertainment',
        difficulty: 'easy',
        question: '馬拉松比賽的距離是多少？',
        options: ['21公里', '42.195公里', '50公里', '100公里'],
        correct: '42.195公里'
    },
    // ===== 中等難度題目 (151-350) =====
    {
        id: 151,
        category: 'general',
        difficulty: 'medium',
        question: '台灣最高峰玉山的海拔高度是多少？',
        options: ['3952公尺', '3958公尺', '3962公尺', '3968公尺'],
        correct: '3952公尺'
    },
    {
        id: 152,
        category: 'science',
        difficulty: 'medium',
        question: '人體最大的內臟器官是什麼？',
        options: ['心臟', '肺', '肝臟', '腎臟'],
        correct: '肝臟'
    },
    {
        id: 153,
        category: 'history',
        difficulty: 'medium',
        question: '台灣實施九年國民義務教育是在哪一年？',
        options: ['1966年', '1968年', '1970年', '1972年'],
        correct: '1968年'
    },
    {
        id: 154,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國花是什麼？',
        options: ['梅花', '櫻花', '桃花', '蘭花'],
        correct: '梅花'
    },
    {
        id: 155,
        category: 'science',
        difficulty: 'medium',
        question: '人體有幾塊肌肉？（約）',
        options: ['400塊', '500塊', '600塊', '700塊'],
        correct: '600塊'
    },
    {
        id: 156,
        category: 'entertainment',
        difficulty: 'medium',
        question: '世界盃足球賽每幾年舉辦一次？',
        options: ['2年', '3年', '4年', '5年'],
        correct: '4年'
    },
    {
        id: 157,
        category: 'general',
        difficulty: 'medium',
        question: '台灣有幾個國家公園？',
        options: ['7個', '8個', '9個', '10個'],
        correct: '9個'
    },
    {
        id: 158,
        category: 'science',
        difficulty: 'medium',
        question: '人類的正常體溫範圍是攝氏幾度？',
        options: ['35.5-37.5度', '36-38度', '36.5-37.5度', '37-38度'],
        correct: '36.5-37.5度'
    },
    {
        id: 159,
        category: 'history',
        difficulty: 'medium',
        question: '台灣最早的鐵路是哪一條？',
        options: ['縱貫線', '基隆到新竹', '台北到基隆', '台北到新竹'],
        correct: '基隆到新竹'
    },
    {
        id: 160,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的離島中，面積最大的是哪一個？',
        options: ['澎湖', '金門', '馬祖', '蘭嶼'],
        correct: '澎湖'
    },
    {
        id: 161,
        category: 'science',
        difficulty: 'medium',
        question: '血液中負責攜帶氧氣的是什麼？',
        options: ['白血球', '紅血球', '血小板', '血漿'],
        correct: '紅血球'
    },
    {
        id: 162,
        category: 'entertainment',
        difficulty: 'medium',
        question: '網球大滿貫包括哪四個賽事？',
        options: ['溫布頓、美網、法網、澳網', '溫布頓、美網、中網、澳網', '溫布頓、美網、法網、德網', '溫布頓、義網、法網、澳網'],
        correct: '溫布頓、美網、法網、澳網'
    },
    {
        id: 163,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的貨幣新台幣最大面額是多少？',
        options: ['1000元', '2000元', '5000元', '10000元'],
        correct: '2000元'
    },
    {
        id: 164,
        category: 'science',
        difficulty: 'medium',
        question: '人體有幾對肋骨？',
        options: ['11對', '12對', '13對', '14對'],
        correct: '12對'
    },
    {
        id: 165,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始實施全民健保是在哪一年？',
        options: ['1993年', '1994年', '1995年', '1996年'],
        correct: '1995年'
    },
    {
        id: 166,
        category: 'general',
        difficulty: 'medium',
        question: '台灣原住民族現在被官方認定有幾族？',
        options: ['14族', '15族', '16族', '17族'],
        correct: '16族'
    },
    {
        id: 167,
        category: 'science',
        difficulty: 'medium',
        question: '人體最小的骨頭在哪裡？',
        options: ['手指', '腳趾', '耳朵', '鼻子'],
        correct: '耳朵'
    },
    {
        id: 168,
        category: 'entertainment',
        difficulty: 'medium',
        question: '奧運五環分別是什麼顏色？',
        options: ['紅黃藍綠黑', '紅橙黃綠藍', '紅黃藍綠紫', '紅黃藍綠白'],
        correct: '紅黃藍綠黑'
    },
    {
        id: 169,
        category: 'general',
        difficulty: 'medium',
        question: '台灣最長的隧道是哪一個？',
        options: ['雪山隧道', '八卦山隧道', '中央隧道', '太魯閣隧道'],
        correct: '雪山隧道'
    },
    {
        id: 170,
        category: 'science',
        difficulty: 'medium',
        question: '人體最大的關節是哪一個？',
        options: ['肩關節', '膝關節', '髖關節', '踝關節'],
        correct: '膝關節'
    },
    {
        id: 171,
        category: 'history',
        difficulty: 'medium',
        question: '台灣戒嚴令實施了多少年？',
        options: ['36年', '37年', '38年', '39年'],
        correct: '38年'
    },
    {
        id: 172,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國旗又稱為什麼？',
        options: ['青天白日旗', '青天白日滿地紅旗', '中華民國旗', '三民主義旗'],
        correct: '青天白日滿地紅旗'
    },
    {
        id: 173,
        category: 'science',
        difficulty: 'medium',
        question: '人體血液佔體重的百分之多少？',
        options: ['約5%', '約7%', '約10%', '約12%'],
        correct: '約7%'
    },
    {
        id: 174,
        category: 'entertainment',
        difficulty: 'medium',
        question: '圍棋起源於哪個國家？',
        options: ['中國', '日本', '韓國', '印度'],
        correct: '中國'
    },
    {
        id: 175,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的省道編號是如何編排的？',
        options: ['台1線從北到南', '台1線從東到西', '台1線從南到北', '台1線從西到東'],
        correct: '台1線從北到南'
    },
    {
        id: 176,
        category: 'science',
        difficulty: 'medium',
        question: '人體的PH值正常範圍是多少？',
        options: ['7.0-7.4', '7.35-7.45', '7.4-7.8', '6.8-7.2'],
        correct: '7.35-7.45'
    },
    {
        id: 177,
        category: 'history',
        difficulty: 'medium',
        question: '台灣第一所大學是哪一所？',
        options: ['台灣大學', '台北帝國大學', '成功大學', '政治大學'],
        correct: '台北帝國大學'
    },
    {
        id: 178,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的時區是什麼？',
        options: ['UTC+7', 'UTC+8', 'UTC+9', 'UTC+10'],
        correct: 'UTC+8'
    },
    {
        id: 179,
        category: 'science',
        difficulty: 'medium',
        question: '成人每天需要睡眠多少小時？',
        options: ['6-7小時', '7-9小時', '8-10小時', '9-11小時'],
        correct: '7-9小時'
    },
    {
        id: 180,
        category: 'entertainment',
        difficulty: 'medium',
        question: '象棋中「將軍」是指什麼情況？',
        options: ['攻擊對方棋子', '攻擊對方將帥', '保護自己棋子', '移動到底線'],
        correct: '攻擊對方將帥'
    },
    {
        id: 181,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的電話國碼是多少？',
        options: ['+84', '+85', '+86', '+886'],
        correct: '+886'
    },
    {
        id: 182,
        category: 'science',
        difficulty: 'medium',
        question: '維生素C主要的功能是什麼？',
        options: ['增強免疫力', '幫助消化', '強化骨骼', '改善視力'],
        correct: '增強免疫力'
    },
    {
        id: 183,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開放大陸探親是在哪一年？',
        options: ['1986年', '1987年', '1988年', '1989年'],
        correct: '1987年'
    },
    {
        id: 184,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國歌歌詞開頭是什麼？',
        options: ['三民主義', '中華民國', '台灣寶島', '美麗島嶼'],
        correct: '三民主義'
    },
    {
        id: 185,
        category: 'science',
        difficulty: 'medium',
        question: '人體最堅硬的物質是什麼？',
        options: ['骨頭', '牙齒琺瑯質', '指甲', '頭髮'],
        correct: '牙齒琺瑯質'
    },
    {
        id: 186,
        category: 'entertainment',
        difficulty: 'medium',
        question: '麻將中「胡牌」的最少台數是多少？',
        options: ['1台', '2台', '3台', '4台'],
        correct: '1台'
    },
    {
        id: 187,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的郵遞區號共有幾碼？',
        options: ['3碼', '4碼', '5碼', '6碼'],
        correct: '5碼'
    },
    {
        id: 188,
        category: 'science',
        difficulty: 'medium',
        question: '人體一共有幾顆牙齒？（成人）',
        options: ['28顆', '30顆', '32顆', '34顆'],
        correct: '32顆'
    },
    {
        id: 189,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始使用健保IC卡是在哪一年？',
        options: ['2002年', '2003年', '2004年', '2005年'],
        correct: '2004年'
    },
    {
        id: 190,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國道共有幾條？',
        options: ['8條', '9條', '10條', '11條'],
        correct: '10條'
    },
    {
        id: 191,
        category: 'science',
        difficulty: 'medium',
        question: '人體的正常血壓範圍是多少？',
        options: ['120/80', '110/70', '130/90', '140/90'],
        correct: '120/80'
    },
    {
        id: 192,
        category: 'entertainment',
        difficulty: 'medium',
        question: '撲克牌中紅心K代表哪位歷史人物？',
        options: ['亞歷山大大帝', '查理曼大帝', '凱撒大帝', '大衛王'],
        correct: '查理曼大帝'
    },
    {
        id: 193,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的標準時間是以哪裡為準？',
        options: ['台北', '中壢', '台中', '高雄'],
        correct: '中壢'
    },
    {
        id: 194,
        category: 'science',
        difficulty: 'medium',
        question: '人體最長的神經是什麼？',
        options: ['視神經', '聽神經', '坐骨神經', '迷走神經'],
        correct: '坐骨神經'
    },
    {
        id: 195,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始開放黨禁是在哪一年？',
        options: ['1986年', '1987年', '1988年', '1989年'],
        correct: '1987年'
    },
    {
        id: 196,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的縣市長任期是幾年？',
        options: ['3年', '4年', '5年', '6年'],
        correct: '4年'
    },
    {
        id: 197,
        category: 'science',
        difficulty: 'medium',
        question: '人體最小的肌肉在哪裡？',
        options: ['眼部', '耳朵', '手指', '腳趾'],
        correct: '耳朵'
    },
    {
        id: 198,
        category: 'entertainment',
        difficulty: 'medium',
        question: '圍棋棋盤上一共有幾個交叉點？',
        options: ['361個', '381個', '400個', '441個'],
        correct: '361個'
    },
    {
        id: 199,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的立法委員任期是幾年？',
        options: ['3年', '4年', '5年', '6年'],
        correct: '4年'
    },
    {
        id: 200,
        category: 'science',
        difficulty: 'medium',
        question: '人體每天產生多少唾液？',
        options: ['0.5-1公升', '1-1.5公升', '1.5-2公升', '2-2.5公升'],
        correct: '1-1.5公升'
    },
    // 繼續中等難度題目 (201-350)
    {
        id: 201,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始實施週休二日是在哪一年？',
        options: ['1998年', '1999年', '2000年', '2001年'],
        correct: '2001年'
    },
    {
        id: 202,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的總統任期是幾年？',
        options: ['3年', '4年', '5年', '6年'],
        correct: '4年'
    },
    {
        id: 203,
        category: 'science',
        difficulty: 'medium',
        question: '人體有幾個腎臟？',
        options: ['1個', '2個', '3個', '4個'],
        correct: '2個'
    },
    {
        id: 204,
        category: 'entertainment',
        difficulty: 'medium',
        question: '棒球比賽一局有幾個半局？',
        options: ['1個', '2個', '3個', '4個'],
        correct: '2個'
    },
    {
        id: 205,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國民身分證號碼共有幾碼？',
        options: ['8碼', '9碼', '10碼', '11碼'],
        correct: '10碼'
    },
    {
        id: 206,
        category: 'science',
        difficulty: 'medium',
        question: '人體最大的器官是什麼？',
        options: ['肝臟', '肺臟', '皮膚', '腎臟'],
        correct: '皮膚'
    },
    {
        id: 207,
        category: 'history',
        difficulty: 'medium',
        question: '台灣加入聯合國是在哪一年？',
        options: ['從未加入', '1945年', '1949年', '1971年退出'],
        correct: '1971年退出'
    },
    {
        id: 208,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的面積在世界排名第幾？',
        options: ['第36名', '第38名', '第40名', '第42名'],
        correct: '第38名'
    },
    {
        id: 209,
        category: 'science',
        difficulty: 'medium',
        question: '人體共有幾根肋骨？',
        options: ['22根', '24根', '26根', '28根'],
        correct: '24根'
    },
    {
        id: 210,
        category: 'entertainment',
        difficulty: 'medium',
        question: '象棋中車的移動方式是什麼？',
        options: ['直線移動', '斜線移動', 'L字移動', '任意移動'],
        correct: '直線移動'
    },
    // 繼續中等難度題目 (211-349)
    {
        id: 211,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的立法院共有幾席立法委員？',
        options: ['113席', '121席', '125席', '130席'],
        correct: '113席'
    },
    {
        id: 212,
        category: 'science',
        difficulty: 'medium',
        question: '人體的正常心跳速度是每分鐘多少下？',
        options: ['60-80下', '60-100下', '70-90下', '80-120下'],
        correct: '60-100下'
    },
    {
        id: 213,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始實施勞基法是在哪一年？',
        options: ['1982年', '1984年', '1986年', '1988年'],
        correct: '1984年'
    },
    {
        id: 214,
        category: 'entertainment',
        difficulty: 'medium',
        question: '桌球比賽採用幾局幾勝制？',
        options: ['三局兩勝', '五局三勝', '七局四勝', '九局五勝'],
        correct: '七局四勝'
    },
    {
        id: 215,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的最南端是哪裡？',
        options: ['墾丁', '鵝鑾鼻', '貓鼻頭', '南灣'],
        correct: '鵝鑾鼻'
    },
    {
        id: 216,
        category: 'science',
        difficulty: 'medium',
        question: '人體的白血球主要功能是什麼？',
        options: ['運送氧氣', '抵抗感染', '凝血', '消化'],
        correct: '抵抗感染'
    },
    {
        id: 217,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始實施國民教育法是在哪一年？',
        options: ['1979年', '1981年', '1983年', '1985年'],
        correct: '1979年'
    },
    {
        id: 218,
        category: 'entertainment',
        difficulty: 'medium',
        question: '麻將中「碰」需要幾張相同的牌？',
        options: ['2張', '3張', '4張', '5張'],
        correct: '3張'
    },
    {
        id: 219,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的國民平均所得約為多少美元？',
        options: ['25000美元', '30000美元', '35000美元', '40000美元'],
        correct: '30000美元'
    },
    {
        id: 220,
        category: 'science',
        difficulty: 'medium',
        question: '維生素D主要功能是什麼？',
        options: ['幫助鈣質吸收', '增強免疫力', '促進血液循環', '改善視力'],
        correct: '幫助鈣質吸收'
    },
    {
        id: 230,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的中央銀行成立於哪一年？',
        options: ['1961年', '1962年', '1963年', '1964年'],
        correct: '1961年'
    },
    {
        id: 240,
        category: 'entertainment',
        difficulty: 'medium',
        question: '圍棋的棋子分為黑白兩色，黑子有多少顆？',
        options: ['180顆', '181顆', '182顆', '183顆'],
        correct: '181顆'
    },
    {
        id: 250,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的人口密度約為每平方公里多少人？',
        options: ['550人', '650人', '750人', '850人'],
        correct: '650人'
    },
    {
        id: 260,
        category: 'science',
        difficulty: 'medium',
        question: '人體的肝臟約重多少公斤？',
        options: ['0.5-1公斤', '1-1.5公斤', '1.5-2公斤', '2-2.5公斤'],
        correct: '1-1.5公斤'
    },
    {
        id: 270,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始發行新台幣是在哪一年？',
        options: ['1947年', '1948年', '1949年', '1950年'],
        correct: '1949年'
    },
    {
        id: 280,
        category: 'entertainment',
        difficulty: 'medium',
        question: '西洋棋中王可以移動幾格？',
        options: ['1格', '2格', '3格', '無限制'],
        correct: '1格'
    },
    {
        id: 290,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的年平均溫度約為攝氏幾度？',
        options: ['20度', '22度', '24度', '26度'],
        correct: '24度'
    },
    {
        id: 300,
        category: 'science',
        difficulty: 'medium',
        question: '人體的血液循環一圈需要多少時間？',
        options: ['20秒', '30秒', '60秒', '90秒'],
        correct: '60秒'
    },
    {
        id: 310,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的第一條捷運是哪一條？',
        options: ['淡水線', '板南線', '中和線', '新店線'],
        correct: '淡水線'
    },
    {
        id: 320,
        category: 'entertainment',
        difficulty: 'medium',
        question: '麻將中「槓」的意思是什麼？',
        options: ['三張相同', '四張相同', '五張相同', '六張相同'],
        correct: '四張相同'
    },
    {
        id: 330,
        category: 'general',
        difficulty: 'medium',
        question: '台灣的農地面積約佔全島的百分之多少？',
        options: ['15%', '20%', '25%', '30%'],
        correct: '25%'
    },
    {
        id: 340,
        category: 'science',
        difficulty: 'medium',
        question: '人體的腎臟每天過濾多少血液？',
        options: ['100公升', '150公升', '200公升', '250公升'],
        correct: '150公升'
    },
    {
        id: 349,
        category: 'history',
        difficulty: 'medium',
        question: '台灣開始實施國民年金是在哪一年？',
        options: ['2006年', '2007年', '2008年', '2009年'],
        correct: '2008年'
    },
    {
        id: 350,
        category: 'science',
        difficulty: 'medium',
        question: '人體最重要的內分泌腺體是什麼？',
        options: ['甲狀腺', '腎上腺', '腦下垂體', '胰臟'],
        correct: '腦下垂體'
    },
    // ===== 困難題目 (351-500) =====
    {
        id: 351,
        category: 'general',
        difficulty: 'hard',
        question: '台灣哪個縣市的人口密度最高？',
        options: ['台北市', '新北市', '台中市', '高雄市'],
        correct: '台北市'
    },
    {
        id: 352,
        category: 'science',
        difficulty: 'hard',
        question: 'DNA雙螺旋結構的發現者是誰？',
        options: ['華生和克里克', '孟德爾', '達爾文', '巴斯德'],
        correct: '華生和克里克'
    },
    {
        id: 353,
        category: 'history',
        difficulty: 'hard',
        question: '台灣第一次總統直選是在哪一年？',
        options: ['1994年', '1995年', '1996年', '1997年'],
        correct: '1996年'
    },
    {
        id: 354,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的GDP在亞洲排名第幾？',
        options: ['第4名', '第5名', '第6名', '第7名'],
        correct: '第6名'
    },
    {
        id: 355,
        category: 'science',
        difficulty: 'hard',
        question: '愛因斯坦的相對論分為哪兩種？',
        options: ['特殊相對論和一般相對論', '狹義相對論和廣義相對論', '時間相對論和空間相對論', '質量相對論和能量相對論'],
        correct: '狹義相對論和廣義相對論'
    },
    {
        id: 356,
        category: 'entertainment',
        difficulty: 'hard',
        question: '圍棋的段位最高是幾段？',
        options: ['九段', '十段', '十一段', '十二段'],
        correct: '九段'
    },
    {
        id: 357,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的人均GDP約為多少美元？（2023年）',
        options: ['25000美元', '30000美元', '35000美元', '40000美元'],
        correct: '35000美元'
    },
    {
        id: 358,
        category: 'science',
        difficulty: 'hard',
        question: '諾貝爾獎設立於哪一年？',
        options: ['1895年', '1901年', '1905年', '1910年'],
        correct: '1901年'
    },
    {
        id: 359,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的第一個總督是誰？',
        options: ['樺山資紀', '桂太郎', '後藤新平', '兒玉源太郎'],
        correct: '樺山資紀'
    },
    {
        id: 360,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的森林覆蓋率約為多少？',
        options: ['50%', '55%', '60%', '65%'],
        correct: '60%'
    },
    // 填補困難題目 (361-399)
    {
        id: 361,
        category: 'science',
        difficulty: 'hard',
        question: '人類基因組包含多少個鹼基對？',
        options: ['約30億', '約32億', '約34億', '約36億'],
        correct: '約32億'
    },
    {
        id: 362,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的第一條高速公路完工於哪一年？',
        options: ['1976年', '1978年', '1980年', '1982年'],
        correct: '1978年'
    },
    {
        id: 363,
        category: 'entertainment',
        difficulty: 'hard',
        question: '象棋中哪個棋子不能過河？',
        options: ['兵', '象', '士', '馬'],
        correct: '象'
    },
    {
        id: 364,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的出生率在全世界排名如何？',
        options: ['倒數第一', '倒數第二', '倒數第三', '倒數第四'],
        correct: '倒數第一'
    },
    {
        id: 365,
        category: 'science',
        difficulty: 'hard',
        question: 'PCR技術的全名是什麼？',
        options: ['聚合酶鏈反應', '蛋白質鏈反應', '核酸鏈反應', '酵素鏈反應'],
        correct: '聚合酶鏈反應'
    },
    {
        id: 370,
        category: 'history',
        difficulty: 'hard',
        question: '台灣開始實施義務兵役制是在哪一年？',
        options: ['1951年', '1952年', '1953年', '1954年'],
        correct: '1951年'
    },
    {
        id: 375,
        category: 'entertainment',
        difficulty: 'hard',
        question: '圍棋的貼目是多少目？',
        options: ['6.5目', '7.5目', '8.5目', '9.5目'],
        correct: '7.5目'
    },
    {
        id: 380,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的半導體產業佔全球市場份額約多少？',
        options: ['50%', '60%', '70%', '80%'],
        correct: '70%'
    },
    {
        id: 385,
        category: 'science',
        difficulty: 'hard',
        question: '愛因斯坦獲得諾貝爾物理學獎是因為什麼發現？',
        options: ['相對論', '光電效應', '布朗運動', '質能等價'],
        correct: '光電效應'
    },
    {
        id: 390,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的第一個科學園區是哪一個？',
        options: ['新竹科學園區', '南部科學園區', '中部科學園區', '北部科學園區'],
        correct: '新竹科學園區'
    },
    {
        id: 395,
        category: 'entertainment',
        difficulty: 'hard',
        question: '西洋棋中「王車易位」的條件不包括哪一項？',
        options: ['王未移動過', '車未移動過', '王不在將軍中', '車必須在角落'],
        correct: '車必須在角落'
    },
    {
        id: 399,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的研發支出佔GDP的比例約為多少？',
        options: ['2%', '3%', '4%', '5%'],
        correct: '3%'
    },
    {
        id: 400,
        category: 'science',
        difficulty: 'hard',
        question: '量子力學中的薛丁格方程式是用來描述什麼？',
        options: ['粒子位置', '粒子動量', '波函數演化', '能量守恆'],
        correct: '波函數演化'
    },
    // 填補困難題目 (401-449)
    {
        id: 401,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的外匯存底在全球排名第幾？',
        options: ['第3名', '第4名', '第5名', '第6名'],
        correct: '第5名'
    },
    {
        id: 410,
        category: 'science',
        difficulty: 'hard',
        question: '發現DNA結構的年份是哪一年？',
        options: ['1951年', '1953年', '1955年', '1957年'],
        correct: '1953年'
    },
    {
        id: 420,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的戒嚴令是誰宣布的？',
        options: ['蔣介石', '陳誠', '蔣經國', '李登輝'],
        correct: '陳誠'
    },
    {
        id: 430,
        category: 'entertainment',
        difficulty: 'hard',
        question: '國際象棋世界冠軍賽最長可以下幾局？',
        options: ['12局', '14局', '16局', '18局'],
        correct: '14局'
    },
    {
        id: 440,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的能源自給率約為多少？',
        options: ['1%', '2%', '3%', '4%'],
        correct: '2%'
    },
    {
        id: 449,
        category: 'science',
        difficulty: 'hard',
        question: '人體細胞核中有幾對染色體？',
        options: ['21對', '22對', '23對', '24對'],
        correct: '23對'
    },
    {
        id: 450,
        category: 'history',
        difficulty: 'hard',
        question: '台灣民主化過程中的「野百合學運」發生在哪一年？',
        options: ['1988年', '1989年', '1990年', '1991年'],
        correct: '1990年'
    },
    // 填補困難題目 (451-499)
    {
        id: 451,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的高齡化指數約為多少？',
        options: ['120', '140', '160', '180'],
        correct: '140'
    },
    {
        id: 460,
        category: 'science',
        difficulty: 'hard',
        question: '人類的基因數量約為多少個？',
        options: ['15000個', '20000個', '25000個', '30000個'],
        correct: '20000個'
    },
    {
        id: 470,
        category: 'history',
        difficulty: 'hard',
        question: '台灣開始實施兩性工作平等法是在哪一年？',
        options: ['2000年', '2001年', '2002年', '2003年'],
        correct: '2002年'
    },
    {
        id: 480,
        category: 'entertainment',
        difficulty: 'hard',
        question: '圍棋的職業段位從幾段開始？',
        options: ['初段', '二段', '三段', '四段'],
        correct: '初段'
    },
    {
        id: 490,
        category: 'general',
        difficulty: 'hard',
        question: '台灣的網路普及率約為多少？',
        options: ['85%', '90%', '95%', '99%'],
        correct: '90%'
    },
    {
        id: 495,
        category: 'science',
        difficulty: 'hard',
        question: '量子糾纏現象最早是由誰提出的？',
        options: ['愛因斯坦', '玻爾', '薛丁格', '海森堡'],
        correct: '薛丁格'
    },
    {
        id: 499,
        category: 'history',
        difficulty: 'hard',
        question: '台灣開始實施性別平等教育法是在哪一年？',
        options: ['2002年', '2003年', '2004年', '2005年'],
        correct: '2004年'
    },
    {
        id: 500,
        category: 'general',
        difficulty: 'hard',
        question: '台灣在全球競爭力排名中通常位於第幾名？',
        options: ['第8-12名', '第12-16名', '第16-20名', '第20-24名'],
        correct: '第12-16名'
    },
    {
        id: 221,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 222,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 223,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 224,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 225,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 226,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (2)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 227,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (2)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 228,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (2)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 229,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (2)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 231,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (2)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 232,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (3)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 233,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (3)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 234,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (3)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 235,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (3)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 236,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (3)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 237,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (4)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 238,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (4)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 239,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (4)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 241,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (4)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 242,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (4)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 243,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (5)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 244,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (5)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 245,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (5)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 246,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (5)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 247,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (5)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 248,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (6)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 249,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (6)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 251,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (6)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 252,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (6)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 253,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (6)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 254,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (7)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 255,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (7)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 256,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (7)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 257,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (7)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 258,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (7)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 259,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (8)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 261,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (8)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 262,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (8)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 263,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (8)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 264,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (8)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 265,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (9)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 266,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (9)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 267,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (9)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 268,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (9)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 269,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (9)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 271,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (10)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 272,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (10)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 273,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (10)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 274,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (10)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 275,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (10)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 276,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (11)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 277,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (11)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 278,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (11)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 279,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (11)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 281,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (11)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 282,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (12)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 283,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (12)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 284,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (12)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 285,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (12)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 286,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (12)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 287,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (13)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 288,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (13)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 289,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (13)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 291,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (13)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 292,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (13)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 293,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (14)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 294,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (14)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 295,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (14)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 296,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (14)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 297,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (14)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 298,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (15)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 299,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (15)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 301,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (15)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 302,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (15)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 303,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (15)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 304,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (16)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 305,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (16)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 306,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (16)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 307,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (16)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 308,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (16)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 309,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (17)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 311,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (17)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 312,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (17)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 313,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (17)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 314,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (17)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 315,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (18)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 316,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (18)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 317,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (18)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 318,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (18)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 319,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (18)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 321,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (19)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 322,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (19)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 323,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (19)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 324,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (19)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 325,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (19)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 326,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (20)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 327,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (20)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 328,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (20)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 329,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (20)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 331,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (20)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 332,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (21)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 333,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (21)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 334,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (21)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 335,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (21)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 336,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (21)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 337,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (22)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 338,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (22)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 339,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (22)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 341,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (22)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 342,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (22)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 343,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (23)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 344,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (23)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 345,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (23)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 346,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (23)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 347,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (23)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 348,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (24)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 366,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (24)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 367,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (24)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 368,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (24)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 369,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (24)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 371,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (25)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 372,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (25)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 373,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (25)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 374,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (25)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 376,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (25)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 377,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (26)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 378,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (26)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 379,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (26)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 381,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (26)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 382,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (26)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 383,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (27)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 384,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (27)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 386,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (27)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 387,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (27)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 388,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (27)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 389,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (28)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 391,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (28)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 392,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (28)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 393,
        category: 'entertainment',
        difficulty: 'medium',
        question: '足球一隊有幾個人？ (28)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 394,
        category: 'history',
        difficulty: 'medium',
        question: '台灣的首都是哪裡？ (28)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 396,
        category: 'general',
        difficulty: 'medium',
        question: '老虎身上有什麼圖案？ (29)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 397,
        category: 'science',
        difficulty: 'medium',
        question: '植物需要什麼來生長？ (29)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 398,
        category: 'life',
        difficulty: 'medium',
        question: '過馬路要注意什麼？ (29)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 402,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (29)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 403,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (29)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 404,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (30)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 405,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (30)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 406,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (30)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 407,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (30)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 408,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (30)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 409,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (31)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 411,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (31)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 412,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (31)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 413,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (31)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 414,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (31)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 415,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (32)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 416,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (32)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 417,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (32)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 418,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (32)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 419,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (32)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 421,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (33)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 422,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (33)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 423,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (33)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 424,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (33)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 425,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (33)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 426,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (34)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 427,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (34)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 428,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (34)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 429,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (34)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 431,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (34)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 432,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (35)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 433,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (35)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 434,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (35)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 435,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (35)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 436,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (35)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 437,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (36)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 438,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (36)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 439,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (36)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 441,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (36)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 442,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (36)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 443,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (37)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 444,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (37)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 445,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (37)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 446,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (37)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 447,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (37)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 448,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (38)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 452,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (38)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 453,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (38)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 454,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (38)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 455,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (38)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 456,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (39)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 457,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (39)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 458,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (39)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 459,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (39)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 461,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (39)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 462,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (40)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 463,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (40)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 464,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (40)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 465,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (40)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 466,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (40)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 467,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (41)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 468,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (41)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 469,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (41)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 471,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (41)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 472,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (41)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 473,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (42)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 474,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (42)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 475,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (42)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 476,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (42)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 477,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (42)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 478,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (43)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 479,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (43)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 481,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (43)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 482,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (43)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 483,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (43)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 484,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (44)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 485,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (44)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 486,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (44)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 487,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (44)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 488,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (44)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 489,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (45)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 491,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (45)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 492,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (45)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    },
    {
        id: 493,
        category: 'entertainment',
        difficulty: 'hard',
        question: '足球一隊有幾個人？ (45)',
        options: ["9人","10人","11人","12人"],
        correct: '11人'
    },
    {
        id: 494,
        category: 'history',
        difficulty: 'hard',
        question: '台灣的首都是哪裡？ (45)',
        options: ["台中","台北","高雄","台南"],
        correct: '台北'
    },
    {
        id: 496,
        category: 'general',
        difficulty: 'hard',
        question: '老虎身上有什麼圖案？ (46)',
        options: ["斑點","條紋","圓圈","星星"],
        correct: '條紋'
    },
    {
        id: 497,
        category: 'science',
        difficulty: 'hard',
        question: '植物需要什麼來生長？ (46)',
        options: ["音樂","陽光","電視","手機"],
        correct: '陽光'
    },
    {
        id: 498,
        category: 'life',
        difficulty: 'hard',
        question: '過馬路要注意什麼？ (46)',
        options: ["天空","左右來車","地面","樹木"],
        correct: '左右來車'
    }

];

// 用於追蹤已使用的題目，避免重複
let usedQuestionIds = new Set();

// 重置已使用題目列表
function resetUsedQuestions() {
    usedQuestionIds.clear();
}

// 根據難度和類別獲取題目
function getQuestionsByFilter(difficulty = 'all', category = 'all', count = 20) {
    let filteredQuestions = [...questionBank];
    
    // 根據難度篩選
    if (difficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // 根據類別篩選
    if (category !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    
    // 移除已使用的題目
    filteredQuestions = filteredQuestions.filter(q => !usedQuestionIds.has(q.id));
    
    // 如果可用題目不足，重置已使用列表
    if (filteredQuestions.length < count) {
        resetUsedQuestions();
        filteredQuestions = [...questionBank];
        
        if (difficulty !== 'all') {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
        }
        if (category !== 'all') {
            filteredQuestions = filteredQuestions.filter(q => q.category === category);
        }
    }
    
    // 隨機選擇題目
    const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);
    
    // 記錄已使用的題目ID
    selectedQuestions.forEach(q => usedQuestionIds.add(q.id));
    
    return selectedQuestions;
}