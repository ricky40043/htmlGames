const questionBank = (() => {
    const questions = [];
    let idCounter = 1;
    const usedTexts = new Set();

    const normalize = (value) => (typeof value === 'number' ? value.toString() : value);

    function insertQuestion(category, difficulty, question, correct, wrongOptions) {
        const normalizedCorrect = normalize(correct);
        if (usedTexts.has(question)) {
            throw new Error(`題目重複: ${question}`);
        }
        const uniqueWrongs = [];
        wrongOptions.forEach(option => {
            const candidate = normalize(option);
            if (candidate && candidate !== normalizedCorrect && !uniqueWrongs.includes(candidate)) {
                uniqueWrongs.push(candidate);
            }
        });
        if (uniqueWrongs.length < 3) {
            throw new Error(`選項不足: ${question}`);
        }
        const options = [...uniqueWrongs];
        const insertIndex = idCounter % 4;
        options.splice(insertIndex, 0, normalizedCorrect);
        questions.push({
            id: idCounter++,
            category,
            difficulty,
            question,
            options,
            correct: normalizedCorrect
        });
        usedTexts.add(question);
    }

    function pickAlternatives(data, correctIndex, key, count) {
        const alternatives = [];
        let offset = 1;
        while (alternatives.length < count && offset <= data.length + count) {
            const candidate = normalize(data[(correctIndex + offset) % data.length][key]);
            const correctValue = normalize(data[correctIndex][key]);
            if (candidate !== correctValue && !alternatives.includes(candidate)) {
                alternatives.push(candidate);
            }
            offset++;
        }
        return alternatives;
    }

    function pickContinents(correct) {
        const continents = ['非洲', '亞洲', '歐洲', '北美洲', '南美洲', '大洋洲', '南極洲'];
        const wrongs = [];
        let index = continents.indexOf(correct);
        if (index === -1) {
            index = 0;
        }
        let offset = 1;
        while (wrongs.length < 3) {
            const candidate = continents[(index + offset) % continents.length];
            if (candidate !== correct) {
                wrongs.push(candidate);
            }
            offset++;
        }
        return wrongs;
    }

    function buildNumberChoices(correct, deltas) {
        const values = [];
        deltas.forEach(delta => {
            const candidate = correct + delta;
            if (candidate > 0 && candidate !== correct && !values.includes(candidate)) {
                values.push(candidate);
            }
        });
        let adjust = 1;
        while (values.length < 3) {
            const candidate = correct + (adjust % 2 === 0 ? -adjust - 1 : adjust + 2);
            if (candidate > 0 && candidate !== correct && !values.includes(candidate)) {
                values.push(candidate);
            }
            adjust++;
        }
        return values;
    }

    // === 地理題庫 ===
    const geographyData = `
法國|巴黎|歐洲
德國|柏林|歐洲
義大利|羅馬|歐洲
西班牙|馬德里|歐洲
葡萄牙|里斯本|歐洲
英國|倫敦|歐洲
愛爾蘭|都柏林|歐洲
荷蘭|阿姆斯特丹|歐洲
比利時|布魯塞爾|歐洲
瑞士|伯恩|歐洲
奧地利|維也納|歐洲
瑞典|斯德哥爾摩|歐洲
挪威|奧斯陸|歐洲
芬蘭|赫爾辛基|歐洲
丹麥|哥本哈根|歐洲
冰島|雷克雅未克|歐洲
波蘭|華沙|歐洲
捷克|布拉格|歐洲
斯洛伐克|布拉提斯拉瓦|歐洲
匈牙利|布達佩斯|歐洲
希臘|雅典|歐洲
土耳其|安卡拉|亞洲
俄羅斯|莫斯科|歐洲
烏克蘭|基輔|歐洲
羅馬尼亞|布加勒斯特|歐洲
保加利亞|索菲亞|歐洲
塞爾維亞|貝爾格勒|歐洲
克羅埃西亞|薩格勒布|歐洲
斯洛維尼亞|盧布爾雅那|歐洲
波士尼亞與赫塞哥維納|薩拉熱窩|歐洲
北馬其頓|史高比耶|歐洲
阿爾巴尼亞|地拉那|歐洲
愛沙尼亞|塔林|歐洲
拉脫維亞|里加|歐洲
立陶宛|維爾紐斯|歐洲
白俄羅斯|明斯克|歐洲
摩爾多瓦|基希納烏|歐洲
亞美尼亞|葉里溫|亞洲
喬治亞|第比利斯|亞洲
阿塞拜然|巴庫|亞洲
伊朗|德黑蘭|亞洲
伊拉克|巴格達|亞洲
敘利亞|大馬士革|亞洲
黎巴嫩|貝魯特|亞洲
約旦|安曼|亞洲
以色列|耶路撒冷|亞洲
沙烏地阿拉伯|利雅德|亞洲
阿拉伯聯合大公國|阿布達比|亞洲
卡達|杜哈|亞洲
科威特|科威特城|亞洲
巴林|麥納瑪|亞洲
阿曼|馬斯喀特|亞洲
葉門|薩那|亞洲
印度|新德里|亞洲
巴基斯坦|伊斯蘭馬巴德|亞洲
孟加拉|達卡|亞洲
斯里蘭卡|可倫坡|亞洲
尼泊爾|加德滿都|亞洲
不丹|廷布|亞洲
中國|北京|亞洲
日本|東京|亞洲
韓國|首爾|亞洲
蒙古|烏蘭巴托|亞洲
越南|河內|亞洲
泰國|曼谷|亞洲
柬埔寨|金邊|亞洲
寮國|永珍|亞洲
緬甸|內比都|亞洲
馬來西亞|吉隆坡|亞洲
新加坡|新加坡|亞洲
印尼|雅加達|亞洲
菲律賓|馬尼拉|亞洲
汶萊|斯里巴加灣市|亞洲
東帝汶|帝力|亞洲
澳洲|坎培拉|大洋洲
紐西蘭|威靈頓|大洋洲
巴布亞紐幾內亞|莫士比港|大洋洲
斐濟|蘇瓦|大洋洲
萬那杜|維拉港|大洋洲
薩摩亞|阿皮亞|大洋洲
東加|努瓜婁法|大洋洲
所羅門群島|霍尼亞拉|大洋洲
加拿大|渥太華|北美洲
美國|華盛頓特區|北美洲
墨西哥|墨西哥城|北美洲
古巴|哈瓦那|北美洲
牙買加|金斯敦|北美洲
巴拿馬|巴拿馬城|北美洲
哥斯大黎加|聖荷西|北美洲
尼加拉瓜|馬那瓜|北美洲
宏都拉斯|德古西加巴|北美洲
薩爾瓦多|聖薩爾瓦多|北美洲
瓜地馬拉|瓜地馬拉市|北美洲
伯利茲|貝爾墨邦|北美洲
巴哈馬|拿索|北美洲
多明尼加|聖多明哥|北美洲
海地|太子港|北美洲
特立尼達和托巴哥|西班牙港|北美洲
巴貝多|布里奇頓|北美洲
格瑞那達|聖喬治|北美洲
聖露西亞|卡斯翠|北美洲
聖文森與格瑞那丁|金斯敦|北美洲
安地卡及巴布達|聖約翰|北美洲
多米尼克|羅索|北美洲
聖基茨和尼維斯|巴士地|北美洲
巴西|巴西利亞|南美洲
阿根廷|布宜諾斯艾利斯|南美洲
智利|聖地牙哥|南美洲
秘魯|利馬|南美洲
哥倫比亞|波哥大|南美洲
委內瑞拉|卡拉卡斯|南美洲
厄瓜多|基多|南美洲
玻利維亞|拉巴斯|南美洲
巴拉圭|亞松森|南美洲
烏拉圭|蒙特維多|南美洲
蓋亞那|喬治敦|南美洲
蘇利南|帕拉馬里博|南美洲
南非|比勒陀利亞|非洲
埃及|開羅|非洲
奈及利亞|阿布加|非洲
肯亞|奈洛比|非洲
衣索比亞|亞的斯亞貝巴|非洲
坦尚尼亞|多多馬|非洲
摩洛哥|拉巴特|非洲
阿爾及利亞|阿爾及爾|非洲
突尼西亞|突尼斯|非洲
利比亞|的黎波里|非洲
蘇丹|喀土穆|非洲
南蘇丹|朱巴|非洲
納米比亞|溫得和克|非洲
波札那|嘉柏隆里|非洲
尚比亞|盧薩卡|非洲
辛巴威|哈拉雷|非洲
莫三比克|馬普托|非洲
馬達加斯加|安塔那那利佛|非洲
安哥拉|羅安達|非洲
剛果民主共和國|金夏沙|非洲
剛果共和國|布拉薩|非洲
喀麥隆|雅溫得|非洲
賴比瑞亞|蒙羅維亞|非洲
迦納|阿克拉|非洲
科特迪瓦|亞穆蘇克羅|非洲
塞內加爾|達喀爾|非洲
幾內亞|柯納克里|非洲
幾內亞比索|比索|非洲
塞拉利昂|自由城|非洲
多哥|洛美|非洲
貝南|波多諾伏|非洲
布吉納法索|瓦加杜古|非洲
尼日|尼阿美|非洲
加彭|利伯維爾|非洲
赤道幾內亞|馬拉博|非洲
聖多美和普林西比|聖多美|非洲
厄利垂亞|阿斯馬拉|非洲
吉布地|吉布地市|非洲
索馬利亞|摩加迪休|非洲
`;

    const geographyList = geographyData.trim().split('\n').map(line => {
        const [country, capital, continent] = line.split('|').map(part => part.trim());
        return { country, capital, continent };
    });

    for (let i = 0; i < 100; i++) {
        const item = geographyList[i];
        const wrongCaps = pickAlternatives(geographyList, i, 'capital', 3);
        const difficulty = i < 40 ? 'easy' : i < 75 ? 'medium' : 'hard';
        insertQuestion('geography', difficulty, `哪一個城市是${item.country}的首都？`, item.capital, wrongCaps);
    }

    for (let i = 20; i < 80; i++) {
        const item = geographyList[i];
        const wrongCountries = pickAlternatives(geographyList, i, 'country', 3);
        const difficulty = i < 50 ? 'medium' : 'hard';
        insertQuestion('geography', difficulty, `${item.capital}是下列哪一個國家的首都？`, item.country, wrongCountries);
    }

    for (let i = 30; i < 90; i++) {
        const item = geographyList[i];
        const wrongContinents = pickContinents(item.continent);
        insertQuestion('geography', i < 60 ? 'easy' : 'medium', `${item.country}位於哪一個洲？`, item.continent, wrongContinents);
    }

    const landmarkData = `
自由女神像|美國|紐約
艾菲爾鐵塔|法國|巴黎
大笨鐘|英國|倫敦
羅馬競技場|義大利|羅馬
馬丘比丘|祕魯|庫斯科
吉薩金字塔|埃及|吉薩
泰姬瑪哈陵|印度|阿格拉
萬里長城|中國|北京
故宮|中國|北京
富士山|日本|靜岡
東京晴空塔|日本|東京
悉尼歌劇院|澳洲|雪梨
哈利法塔|阿拉伯聯合大公國|杜拜
救世基督像|巴西|里約熱內盧
佩特拉古城|約旦|佩特拉
吳哥窟|柬埔寨|暹粒
聖家堂|西班牙|巴塞隆納
比薩斜塔|義大利|比薩
雅典衛城|希臘|雅典
新天鵝堡|德國|巴伐利亞
凱旋門|法國|巴黎
金門大橋|美國|舊金山
帝國大廈|美國|紐約
奇琴伊察|墨西哥|猶加敦
布達拉宮|中國|拉薩
倫敦塔橋|英國|倫敦
克里姆林宮|俄羅斯|莫斯科
凡爾賽宮|法國|凡爾賽
巨石陣|英國|威爾特郡
聖索菲亞大教堂|土耳其|伊斯坦堡
阿布辛貝神殿|埃及|阿斯旺
烏魯魯巨岩|澳洲|北領地
珠穆朗瑪峰|尼泊爾|喜馬拉雅
維多利亞瀑布|尚比亞|利文斯通
塞倫蓋蒂國家公園|坦尚尼亞|阿魯沙
班夫國家公園|加拿大|亞伯達
優勝美地國家公園|美國|加州
阿爾漢布拉宮|西班牙|格拉納達
查理大橋|捷克|布拉格
布宜諾斯艾利斯方尖碑|阿根廷|布宜諾斯艾利斯
`;

    const landmarkList = landmarkData.trim().split('\n').map(line => {
        const [name, country, city] = line.split('|').map(part => part.trim());
        return { name, country, city };
    });

    landmarkList.forEach((item, index) => {
        const wrongCountries = pickAlternatives(landmarkList, index, 'country', 3);
        insertQuestion('geography', index < 20 ? 'medium' : 'hard', `${item.name}位於哪一個國家？`, item.country, wrongCountries);
    });

    // === 數學題庫 ===
    function generateAdditionQuestions() {
        const pairs = [];
        for (let a = 3; a <= 42 && pairs.length < 60; a++) {
            for (let b = 2; b <= 18 && pairs.length < 60; b++) {
                pairs.push([a, b]);
            }
        }
        pairs.forEach(([a, b]) => {
            const result = a + b;
            const difficulty = result <= 20 ? 'easy' : result <= 40 ? 'medium' : 'hard';
            const wrong = buildNumberChoices(result, [-2, 1, 3, 4]);
            insertQuestion('math', difficulty, `${a} + ${b} 等於多少？`, result, wrong);
        });
    }

    function generateSubtractionQuestions() {
        const pairs = [];
        for (let a = 8; a <= 48 && pairs.length < 60; a++) {
            for (let b = 2; b <= 18 && pairs.length < 60; b++) {
                if (a > b) {
                    pairs.push([a, b]);
                }
            }
        }
        pairs.forEach(([a, b]) => {
            const result = a - b;
            const difficulty = result <= 12 ? 'easy' : result <= 25 ? 'medium' : 'hard';
            const wrong = buildNumberChoices(result, [-3, 2, 4, -5]);
            insertQuestion('math', difficulty, `${a} - ${b} 等於多少？`, result, wrong);
        });
    }

    function generateMultiplicationQuestions() {
        const pairs = [];
        for (let a = 2; a <= 12 && pairs.length < 60; a++) {
            for (let b = 2; b <= 12 && pairs.length < 60; b++) {
                pairs.push([a, b]);
            }
        }
        pairs.forEach(([a, b]) => {
            const result = a * b;
            const difficulty = result <= 40 ? 'easy' : result <= 81 ? 'medium' : 'hard';
            const wrong = buildNumberChoices(result, [a, -b, a + b, b * 2]);
            insertQuestion('math', difficulty, `${a} × ${b} 等於多少？`, result, wrong);
        });
    }

    function generateDivisionQuestions() {
        const entries = [];
        for (let a = 2; a <= 12; a++) {
            for (let b = 2; b <= 12 && entries.length < 60; b++) {
                const dividend = a * b;
                entries.push([dividend, a, b]);
            }
        }
        entries.forEach(([dividend, divisor, quotient], idx) => {
            const difficulty = quotient <= 5 ? 'easy' : quotient <= 9 ? 'medium' : 'hard';
            const wrong = buildNumberChoices(quotient, [-2, 2, 3, -3]);
            insertQuestion('math', idx < 30 ? 'medium' : 'hard', `${dividend} ÷ ${divisor} 等於多少？`, quotient, wrong);
        });
    }

    generateAdditionQuestions();
    generateSubtractionQuestions();
    generateMultiplicationQuestions();
    generateDivisionQuestions();

    // === 科學題庫 ===
    const scienceRaw = `
easy|人體最大的器官是哪一個？|皮膚|腦|心臟|肺
easy|植物進行光合作用時吸收哪一種氣體？|二氧化碳|氮氣|二氧化硫|甲烷
easy|水的化學式是什麼？|H2O|CO2|NaCl|O2
easy|地球繞著什麼天體運行？|太陽|月亮|火星|金星
easy|人體主要的呼吸器官是什麼？|肺|腎臟|胃|肝臟
easy|哪一種動物是哺乳類？|海豚|海龜|麻雀|青蛙
easy|地球上含量最多的氣體是哪一種？|氮氣|氧氣|二氧化碳|氬氣
easy|水從液體變成氣體的過程稱為？|蒸發|凝結|升華|凝固
easy|下列哪一顆行星距離太陽最近？|水星|火星|木星|海王星
easy|人體的骨骼主要由哪種礦物組成？|鈣|鐵|銅|鋅
easy|哪一種動物會變色以保護自己？|變色龍|大象|長頸鹿|獅子
easy|哪一種能量來自風的力量？|風能|太陽能|地熱能|潮汐能
easy|紅血球的主要功能是什麼？|運送氧氣|對抗感染|製造激素|分解毒素
easy|下列哪一種是爬蟲類動物？|鱷魚|企鵝|海獺|海豚
easy|冰從固體變成液體稱為什麼？|融化|蒸發|升華|冷凝
easy|植物的哪一部分負責吸收水分？|根|葉|花|果實
easy|地球上最大的洋是哪一個？|太平洋|大西洋|印度洋|北冰洋
easy|我們用哪一種儀器測量氣溫？|溫度計|壓力計|電表|秤
easy|哪一個星體是地球的天然衛星？|月球|金星|火星|木星
easy|藍鯨屬於哪一類動物？|哺乳類|魚類|爬蟲類|兩棲類
easy|讓鐵生鏽的主要因素是什麼？|水和氧氣|陽光|寒冷|震動
easy|哪一種能源是不可再生的？|石油|太陽能|風能|潮汐能
easy|人體需要哪一種維生素來預防壞血病？|維生素C|維生素A|維生素D|維生素K
easy|哪一種血管把血液從心臟送出？|動脈|靜脈|毛細血管|淋巴管
easy|下列哪一種材料是良好的導電體？|銅|木頭|玻璃|塑膠
medium|光合作用主要發生在植物的哪個結構？|葉綠體|細胞核|線粒體|液泡
medium|地球的外層被稱為什麼？|地殼|地核|地函|岩漿
medium|人類第一顆人造衛星是由哪個國家發射？|蘇聯|美國|中國|法國
medium|哪一種粒子帶負電？|電子|質子|中子|阿爾法粒子
medium|聲音在什麼介質中傳播最快？|固體|液體|氣體|真空
medium|人體的平衡感主要由哪個器官控制？|內耳|眼睛|舌頭|脾臟
medium|海水中含量最高的鹽是哪一種？|氯化鈉|硫酸鎂|碳酸鈣|氯化鉀
medium|DNA的基本組成單位稱為什麼？|核苷酸|胺基酸|脂肪酸|單醣
medium|歐亞板塊和印度板塊碰撞形成哪一座山脈？|喜馬拉雅山|阿爾卑斯山|洛磯山|安地斯山
medium|哪一種天氣現象是由冷暖氣團交會造成的？|鋒面|季風|海風|焚風
medium|聲音的高低取決於什麼？|頻率|振幅|波長|速度
medium|人體哪個腺體分泌胰島素？|胰臟|肝臟|腎上腺|甲狀腺
medium|在攝氏溫標下，水的冰點是多少度？|0度|100度|32度|4度
medium|地球自轉一圈約需要多長時間？|24小時|12小時|48小時|7小時
medium|哪一種生物屬於軟體動物門？|章魚|蝗蟲|水螅|蜈蚣
medium|電流的單位是什麼？|安培|伏特|瓦特|歐姆
medium|植物的氣孔主要位於哪個部位？|葉片|根部|莖|花瓣
medium|熱帶氣旋在大西洋被稱為什麼？|颶風|颱風|氣旋|季風
medium|人體的紅血球缺乏哪一種細胞器？|細胞核|線粒體|內質網|高基氏體
medium|臭氧層主要存在於大氣的哪一層？|平流層|對流層|中氣層|散逸層
medium|哪一種生物是藻類？|海帶|海膽|珊瑚|章魚
medium|磁鐵的兩端稱為什麼？|磁極|磁帶|磁圈|磁面
medium|人類呼吸系統中的氣體交換發生在什麼部位？|肺泡|支氣管|聲帶|氣管
medium|細胞分裂時複製DNA的過程稱為？|複製|轉錄|翻譯|發酵
medium|火成岩是由什麼形成的？|岩漿冷卻|沉積壓縮|高壓變質|風化作用
medium|哪一種力使行星保持在軌道上？|重力|電磁力|摩擦力|張力
medium|牛頓第三運動定律的內容是什麼？|作用力與反作用力|慣性定律|動量守恆|能量守恆
medium|人體含量最多的金屬元素是什麼？|鈣|鐵|鉀|鈉
medium|哪一種植物是重要的豆科作物？|大豆|小麥|水稻|玉米
medium|哪一種細胞負責免疫防禦？|白血球|紅血球|血小板|脂肪細胞
medium|太陽活動會影響地球的哪一種通訊？|無線電|電話|光纖|有線電視
medium|哪一種電磁波具有最短波長？|伽瑪射線|紅外線|微波|無線電波
medium|血壓計量測的是什麼血管的壓力？|動脈|靜脈|毛細血管|淋巴管
medium|地球的磁場主要源自哪一層的運動？|外地核|地殼|內地核|地函
medium|人類使用抗生素主要是用來對付什麼？|細菌|病毒|寄生蟲|真菌
medium|哪一種飲食營養素提供最大的能量？|脂肪|蛋白質|醣類|纖維
medium|熱水比冷水體積大是因為什麼？|熱膨脹|冷縮|密度減小|壓力增加
medium|哪一種光學儀器用於觀察極小物體？|顯微鏡|望遠鏡|光譜儀|攝影機
medium|地震波中破壞力最大的是哪一種？|面波|P波|S波|縱波
medium|哪一種能源利用溫差發電？|地熱能|潮汐能|燃煤|核能
hard|愛因斯坦提出的質能方程式是哪一個？|E=mc^2|F=ma|V=IR|pV=nRT
hard|哪一種細胞分裂會產生與母細胞染色體數減半的子細胞？|減數分裂|有絲分裂|二分裂|出芽生殖
hard|哪一種天文現象通常由緻密中子星合併造成？|伽瑪射線暴|日偏食|行星凌日|流星雨
hard|哪一位科學家發現行星運動三定律？|克卜勒|伽利略|哥白尼|第谷
hard|控制呼吸節律的腦部結構是什麼？|延腦|小腦|海馬體|額葉
hard|胺基酸之間的鍵結稱為什麼？|肽鍵|氫鍵|金屬鍵|共價鍵
hard|哪一種放射線帶正電？|α射線|β射線|γ射線|X射線
hard|地球上大部分的淡水儲存在何處？|冰川與冰帽|地下含水層|湖泊|大氣
hard|哪一種可見光顏色具有最高能量？|紫光|紅光|黃光|綠光
hard|細胞中的ATP主要在哪個細胞器中產生？|線粒體|核糖體|溶體|中心粒
hard|哪一種化學物質是破壞臭氧層的主要來源？|氯氟碳化物|二氧化碳|甲烷|一氧化碳
hard|在放射性衰變中，哪一種過程會放出電子？|β負衰變|α衰變|γ衰變|中子釋放
hard|醫學上常用哪一種電磁波進行X光攝影？|X射線|紅外線|紫外線|微波
hard|磁通密度的國際單位是什麼？|特斯拉|韋伯|帕斯卡|庫倫
hard|洋中脊屬於哪一種板塊邊界？|張裂型|聚合型|碰撞型|轉形型
hard|人體代謝酒精主要依靠哪種酵素？|酒精脫氫酶|脂肪酶|乳糖酶|蔗糖酶
hard|誰發現了電磁感應定律？|法拉第|安培|歐姆|庫侖
hard|氮氣固定成氨主要使用哪一種工業過程？|哈柏法|沃爾法|接觸法|電解法
hard|哪一種天體接近太陽時會形成明顯的尾巴？|彗星|小行星|衛星|星團
hard|地球內核主要由哪兩種元素組成？|鐵與鎳|氧與矽|鋁與鎂|碳與氮
hard|細胞呼吸的電子傳遞鏈發生在細胞的哪個部位？|線粒體內膜|細胞核|高基氏體|液泡
hard|莫氏震度是根據什麼評估地震強度？|觀察到的破壞|震源深度|震波速度|餘震次數
hard|哪一種植物激素負責促進果實成熟？|乙烯|生長素|細胞分裂素|脫落酸
hard|普朗克常數常用哪個符號表示？|h|k|c|G
hard|強作用力由哪一種粒子傳遞？|膠子|光子|重子|中微子
hard|用於偵測系外行星的凌日法主要觀測什麼變化？|恆星亮度|恆星位置|電磁波頻率|恆星質量
hard|波義耳定律描述氣體壓力與哪一個量的關係？|體積|溫度|質量|速度
hard|地球磁場極性反轉平均間隔約為多久？|數十萬年|每十年|每千年|每百年
hard|哪一種岩石是在高壓高溫下由其他岩石變質而成？|變質岩|火成岩|沉積岩|砂岩
hard|用來量測地震釋放能量的尺度是什麼？|芮氏規模|蒲福風級|分貝|赫茲
hard|鐵以後的重元素主要在什麼天文事件中形成？|超新星爆炸|主序星燃燒|小行星碰撞|彗星碎裂
hard|彩虹的形成主要涉及哪兩種光學現象？|折射與反射|衍射與偏振|干涉與衍射|散射與吸收
hard|自然選擇理論由哪位科學家提出？|達爾文|孟德爾|林奈|巴斯德
hard|描述電子雲形狀的量子數是哪一個？|角量子數|主量子數|磁量子數|自旋量子數
hard|哪一種儀器用來測量空氣的濕度？|濕度計|風速計|壓力計|雨量計
`;

    const scienceList = scienceRaw.trim().split('\n').map(line => {
        const [difficulty, question, correct, wrong1, wrong2, wrong3] = line.split('|');
        return { difficulty, question, correct, wrongOptions: [wrong1, wrong2, wrong3] };
    });

    scienceList.forEach(item => {
        insertQuestion('science', item.difficulty, item.question, item.correct, item.wrongOptions);
    });

    // === 歷史題庫 ===
    const historyRaw = `
easy|第一個登上月球的人是誰？|尼爾・阿姆斯壯|尤里・加加林|巴茲・艾德林|約翰・格倫
easy|中國的長城主要是為了抵禦哪一個民族？|北方遊牧民族|羅馬帝國|倭寇|波斯人
easy|美國的獨立紀念日是幾月幾號？|7月4日|1月1日|4月15日|12月25日
easy|古埃及金字塔是為了什麼用途而建？|法老陵墓|軍事堡壘|市場|神殿
easy|誰統一了日本戰國時代？|德川家康|織田信長|豐臣秀吉|足利義滿
easy|法國大革命開始於哪一年？|1789年|1776年|1812年|1848年
easy|哪一位是印度的非暴力獨立運動領袖？|甘地|尼赫魯|曼德拉|林肯
easy|二次世界大戰結束於哪一年？|1945年|1939年|1953年|1961年
easy|文藝復興時期發源於哪個國家？|義大利|法國|德國|西班牙
easy|巴黎的巴士底監獄被攻陷象徵哪個事件？|法國大革命|美國獨立|工業革命|十字軍東征
easy|哪一位航海家發現了新航路繞過好望角？|達伽馬|哥倫布|麥哲倫|庫克船長
easy|秦始皇的本名是什麼？|嬴政|劉邦|項羽|劉徹
easy|成吉思汗建立的帝國主要位於哪個地區？|蒙古高原|歐洲|北非|東南亞
easy|美國內戰的主要原因是什麼？|奴隸制度|領土爭端|宗教差異|語言問題
easy|哪個文明建造了馬丘比丘？|印加文明|阿茲特克文明|瑪雅文明|奧爾梅克文明
easy|莎士比亞生活在哪個時期？|伊麗莎白時代|明治時代|中世紀早期|文藝復興初期
easy|俄國十月革命的領導人是誰？|列寧|史達林|托洛斯基|赫魯雪夫
easy|哪個帝國建造了羅馬浴場和道路網絡？|羅馬帝國|奧斯曼帝國|波斯帝國|拜占庭帝國
easy|第一位女性諾貝爾獎得主是誰？|瑪麗・居禮|羅莎・帕克斯|梅伊・傑米森|英迪拉・甘地
easy|《獨立宣言》的主要起草者是誰？|湯瑪斯・傑佛遜|喬治・華盛頓|詹姆斯・麥迪遜|班傑明・富蘭克林
easy|中國哪一個朝代修建了大運河？|隋朝|唐朝|宋朝|元朝
easy|亞歷山大大帝來自今天的哪個國家？|北馬其頓|阿爾巴尼亞|希臘|土耳其
easy|哪個國家建造了巴黎的凱旋門？|法國|德國|義大利|比利時
easy|明朝著名航海家鄭和航行於哪一片海域？|印度洋|地中海|波羅的海|黑海
easy|南非反種族隔離運動領袖是誰？|納爾遜・曼德拉|德斯蒙德・圖圖|羅伯特・穆加比|雅各布・祖馬
easy|《漢摩拉比法典》屬於哪個古代文明？|巴比倫|埃及|希臘|中國
easy|第一次世界大戰的導火線是哪個事件？|薩拉熱窩事件|珍珠港事件|波士頓茶會|閃電戰
easy|中世紀歐洲的黑死病主要由哪種疾病造成？|鼠疫|霍亂|天花|麻疹
easy|在大航海時代，哪個國家首先殖民巴西？|葡萄牙|西班牙|荷蘭|英國
easy|北美洲最早的永久英國殖民地位於哪裡？|詹姆斯鎮|波士頓|紐約|費城
medium|馬丁路德於1517年發表什麼文件挑戰天主教會？|九十五條論綱|社會契約論|共產黨宣言|大憲章
medium|哪一個條約結束了第一次世界大戰？|凡爾賽條約|威斯特伐利亞條約|托爾德西利亞斯條約|布列斯特條約
medium|鄂圖曼帝國於1453年攻陷哪座城市，標誌著中世紀結束？|君士坦丁堡|羅馬|威尼斯|雅典
medium|明朝與清朝交替發生於哪一年？|1644年|1368年|1911年|1840年
medium|日本明治維新開始於哪一年？|1868年|1853年|1894年|1905年
medium|巴黎和會上美國總統威爾遜提出什麼構想？|十四點和平原則|四大自由|大東亞共榮圈|馬歇爾計畫
medium|哪場戰役被認為是拿破崙帝國的最後敗仗？|滑鐵盧戰役|阿金庫爾戰役|特拉法加海戰|萊比錫戰役
medium|中國辛亥革命推翻了哪個朝代？|清朝|明朝|元朝|唐朝
medium|瑪雅文明主要位於今天的哪個地區？|中美洲|南歐|北非|西亞
medium|蘇伊士運河連結哪兩個海洋？|地中海與紅海|黑海與里海|北海與波羅的海|大西洋與太平洋
medium|誰是《社會契約論》的作者？|盧梭|洛克|霍布斯|孟德斯鳩
medium|波士頓茶會事件主要是抗議哪一國家？|英國|法國|西班牙|荷蘭
medium|印尼獨立後的首任總統是誰？|蘇卡諾|蘇哈托|維多多|哈比比
medium|十字軍東征的主要目的是奪回哪座城市？|耶路撒冷|羅馬|大馬士革|伊斯坦堡
medium|鄭成功於1662年從荷蘭人手中收復哪個地區？|台灣|澎湖|呂宋|琉球
medium|歷史上的絲綢之路連結中國與哪個地區？|地中海沿岸|撒哈拉|北歐|印度洋群島
medium|黑船事件迫使日本開國的國家是哪一個？|美國|俄國|葡萄牙|荷蘭
medium|清末的戊戌變法由哪兩人領導？|康有為與梁啟超|孫中山與黃興|李鴻章與袁世凱|曾國藩與左宗棠
medium|哪個戰爭導致朝鮮半島在三八線分裂？|韓戰|中日戰爭|越戰|甲午戰爭
medium|亞伯拉罕・林肯頒布的解放黑人宣言於哪一年生效？|1863年|1776年|1914年|1896年
medium|克里米亞戰爭主要是哪兩個國家對戰？|俄羅斯與奧斯曼帝國|法國與普魯士|英國與荷蘭|西班牙與葡萄牙
medium|古希臘的雅典政治體制被稱為？|民主制|君主制|寡頭制|神權制
medium|羅馬帝國分裂為東西羅馬帝國是在誰統治時？|狄奧多西一世|君士坦丁|奧古斯都|尼祿
medium|瑪麗安東尼皇后最終在什麼裝置上被處決？|斷頭台|火刑柱|絞刑架|子彈
medium|哪位探險家完成了首次環球航行？|麥哲倫的船隊|哥倫布|庫克|達伽馬
medium|柏林圍牆在哪一年倒下？|1989年|1975年|1995年|1991年
medium|羅馬共和國的兩位最高官職被稱為什麼？|執政官|護民官|法務官|法王
medium|《解放奴隸宣言》頒布後，美國憲法哪一修正案正式廢除奴隸制度？|第十三修正案|第十修正案|第一修正案|第十五修正案
medium|哪個東南亞古王國以吳哥窟聞名？|高棉帝國|室利佛逝|蘇門答臘王國|千乘帝國
medium|冷戰時期的不結盟運動首次會議在哪個城市召開？|貝爾格勒|日內瓦|雅加達|內羅畢
hard|古巴飛彈危機發生於哪一年？|1962年|1959年|1968年|1973年
hard|魏瑪共和國於哪一年成立？|1919年|1901年|1933年|1945年
hard|馬歇爾計畫的主要目的是什麼？|重建歐洲經濟|擴大殖民地|扶植軍政府|建立北約
hard|《西班牙憲法》於1978年確立哪種政體？|憲政君主制|共和制|聯邦制|社會主義國家
hard|南美洲的解放者西蒙・玻利瓦爾出生於哪個城市？|卡拉卡斯|波哥大|利馬|基多
hard|《南京條約》是在哪一年簽訂？|1842年|1858年|1895年|1901年
hard|拿破崙於哪座島嶼被永久流放？|聖赫勒拿島|厄爾巴島|科西嘉島|馬達加斯加
hard|哪一場戰役確立了英國在印度的主導地位？|普拉西戰役|滑鐵盧戰役|西班牙無敵艦隊之戰|特拉法加海戰
hard|「鐵幕」一詞最早由誰使用來形容冷戰局勢？|邱吉爾|史達林|杜魯門|羅斯福
hard|古代波斯帝國的首都波斯波利斯位於今日哪個國家？|伊朗|伊拉克|土耳其|敘利亞
hard|《威斯特伐利亞和約》締結於哪一年？|1648年|1492年|1707年|1815年
hard|拜占庭帝國使用的主要語言是什麼？|希臘語|拉丁語|阿拉伯語|科普特語
hard|日本鎌倉幕府的第一任將軍是誰？|源賴朝|平清盛|足利尊氏|織田信長
hard|《大憲章》簽署於哪一年？|1215年|1066年|1453年|1666年
hard|蒙古帝國分裂後，金帳汗國統治哪個地區？|東歐草原|中亞沙漠|中東|南亞
hard|葛底斯堡戰役發生於哪一年？|1863年|1861年|1864年|1865年
hard|義大利王國於哪一年宣布成立？|1861年|1848年|1870年|1901年
hard|二戰期間的諾曼第登陸代號為何？|霸王行動|火炬行動|市場花園|海獅行動
hard|《明治憲法》於哪一年頒布？|1889年|1868年|1905年|1912年
hard|阿茲特克帝國的首都特諾奇提特蘭位於今日哪座城市？|墨西哥城|庫斯科|基多|特古西加巴
`;

    const historyList = historyRaw.trim().split('\n').map(line => {
        const [difficulty, question, correct, wrong1, wrong2, wrong3] = line.split('|');
        return { difficulty, question, correct, wrongOptions: [wrong1, wrong2, wrong3] };
    });

    historyList.forEach(item => {
        insertQuestion('history', item.difficulty, item.question, item.correct, item.wrongOptions);
    });

    // === 體育題庫 ===
    const sportsRaw = `
easy|足球比賽每隊上場球員人數是多少？|11人|9人|10人|12人
easy|NBA是一個屬於哪種運動的聯盟？|籃球|棒球|足球|冰球
easy|網球大滿貫比賽共有幾個？|4個|3個|5個|6個
easy|奧運會每隔幾年舉辦一次？|4年|2年|6年|8年
easy|棒球比賽一次上壘的最高分稱為什麼？|全壘打|三壘打|二壘打|保送
easy|馬拉松的標準距離是多少公里？|42.195公里|21.0975公里|10公里|50公里
easy|羽毛球比賽每局多少分為勝？|21分|11分|15分|25分
easy|FIFA世界盃足球賽多久舉行一次？|4年|2年|3年|5年
easy|桌球發球時球至少要彈幾次？|兩次|一次|三次|四次
easy|一場籃球比賽分成幾節？|4節|2節|3節|5節
easy|世界杯板球賽主要在哪些國家流行？|英聯邦國家|阿拉伯國家|北歐|東歐
easy|奧運五環的顏色代表什麼？|五大洲|五種運動|五位創辦人|五種精神
easy|足球場上負責守門的是哪個位置？|守門員|後衛|中場|前鋒
easy|冰上曲棍球使用的不是球而是什麼？|冰球|羽毛球|飛盤|圓盤
easy|網球賽事排名積分制度稱為什麼？|ATP/WTA積分|FIFA排名|ELO分|UEFA積分
easy|在高爾夫球中，低於標準桿一桿稱為？|小鳥|老鷹|柏忌|信天翁
easy|田徑中的100公尺短跑起跑台稱為什麼？|起跑器|踏板|助跑器|引擎
easy|柔道起源於哪個國家？|日本|韓國|中國|蒙古
easy|乒乓球又叫什麼？|桌球|手球|藤球|壘球
easy|冰球比賽場地稱為？|冰場|球場|賽道|泳池
medium|世界盃足球賽首屆於哪一年舉辦？|1930年|1928年|1942年|1950年
medium|NBA球隊洛杉磯湖人的主場館是？|加密網體育館|聯合中心|花園球場|豐田中心
medium|在棒球中，投手投出三振需幾個好球？|3個|2個|4個|5個
medium|花式滑冰自由滑最高時長是多少？|4分|2分|5分|6分
medium|哪一項運動起源於蘇格蘭，是用石頭滑向目標區？|冰壺|草地滾球|手球|擊球
medium|男子網球大滿貫史上最長比賽持續多長時間？|超過11小時|5小時|8小時|9小時
medium|世界羽球聯盟的英文縮寫是什麼？|BWF|FIVB|FIFA|IAAF
medium|在足球中，被稱為「手球」的犯規是指球碰到？|手臂|頭部|腳部|肩膀
medium|冬季奧運會的官方語言不包括哪一種？|西班牙語|法語|英語|主辦國語言
medium|棒球中內野由幾個壘包組成？|4個|3個|5個|6個
medium|英國的頂級足球聯賽叫做什麼？|英超聯賽|西甲聯賽|德甲聯賽|義甲聯賽
medium|籃球三分線距離NBA約是幾公尺？|7.24公尺|6.75公尺|8.25公尺|5.8公尺
medium|在網球計分中，「40-40」被稱為什麼？|平分|賽末點|破發|優勢
medium|世界田徑錦標賽由哪個機構主辦？|世界田徑總會|國際足總|國際奧會|國際泳總
medium|哪個國家贏得2019年橄欖球世界盃？|南非|紐西蘭|英國|澳洲
medium|在F1賽車中，年度冠軍稱為？|世界冠軍|挑戰者|桿位王|總司令
medium|美式足球達陣可得幾分？|6分|3分|4分|1分
medium|世界游泳錦標賽50公尺自由式男子世界紀錄保持者是哪國人？|巴西|美國|法國|中國
medium|大聯盟MLB世界大賽採最佳幾戰？|七戰四勝|五戰三勝|九戰五勝|三戰兩勝
medium|羽球的球速紀錄曾突破多少公里每小時？|超過490公里|300公里|350公里|420公里
hard|世界盃足球賽歷史上第一顆進球由誰踢進？|呂西安・洛朗|貝利|馬拉度納|尤西比奧
hard|網球職業生涯金滿貫指的是奪得四大滿貫與哪項賽事冠軍？|奧運金牌|ATP年終總決賽|戴維斯盃|世界團體盃
hard|在棒球統計中，OPS是什麼的縮寫？|上壘率加長打率|投球成功率|外野防守評分|得分效率
hard|第一位在夏季與冬季奧運都獲得金牌的運動員是誰？|艾迪・伊根|邁克爾・菲爾普斯|史提芬・雷德格雷夫|艾瑞克・海登
hard|哪個國家在FIFA女子世界盃獲得最多冠軍？|美國|德國|挪威|日本
hard|在板球比賽中，一輪包含幾個球？|6球|4球|8球|10球
hard|世界上最古老的高爾夫球場位於哪裡？|聖安德魯斯|奧古斯塔|松樹崗|皇家墨爾本
hard|NBA歷史上單場得分最高的是誰？|威爾特・張伯倫|科比・布萊恩|麥可・喬丹|勒布朗・詹姆斯
hard|國際象棋競賽中，FIDE代表什麼？|國際棋聯|國際足球總會|射箭聯合會|擊劍聯盟
hard|第一屆橄欖球世界盃的主辦國是哪裡？|紐西蘭與澳洲|英格蘭|法國|南非
hard|自行車賽環法賽的黃衫代表什麼？|總排名領先|爬坡王|衝刺王|最佳年輕車手
hard|在田徑十項全能中，最後一個項目是什麼？|1500公尺跑|標槍|400公尺跑|110公尺欄
hard|第一位在男子100公尺跑出9.80秒以下成績的選手是誰？|莫里斯・格林|尤塞恩・博爾特|阿薩法・鮑威爾|提姆・蒙哥馬利
hard|棒球名人堂位於哪座城市？|庫柏鎮|波士頓|聖路易|克里夫蘭
hard|在F1賽車中，安全車首次使用於哪一年？|1973年|1965年|1981年|1994年
hard|世界游泳錦標賽由哪個城市在1973年首次舉辦？|貝爾格勒|羅馬|東京|蒙特婁
hard|男子高爾夫四大滿貫之一的英國公開賽最早於哪一年舉行？|1860年|1890年|1905年|1920年
hard|1997年與IBM超級電腦「深藍」對戰的世界棋王是誰？|蓋瑞・卡斯帕羅夫|阿納托利・卡爾波夫|馬格努斯・卡爾森|維斯瓦納坦・阿南德
hard|史上第一位在四大網球公開賽同年稱霸的男子選手是誰？|唐・布吉|羅德・拉沃|羅傑・費德勒|諾瓦克・喬科維奇
hard|哪一個國家主辦了2011年世界大學運動會？|中國深圳|韓國光州|土耳其伊茲密爾|俄羅斯喀山
`;

    const sportsList = sportsRaw.trim().split('\n').map(line => {
        const [difficulty, question, correct, wrong1, wrong2, wrong3] = line.split('|');
        return { difficulty, question, correct, wrongOptions: [wrong1, wrong2, wrong3] };
    });

    sportsList.forEach(item => {
        insertQuestion('sports', item.difficulty, item.question, item.correct, item.wrongOptions);
    });

    // === 文化與娛樂題庫 ===
    const cultureRaw = `
easy|法國馬卡龍主要使用哪種堅果？|杏仁|核桃|花生|榛果
easy|印度的排燈節是慶祝什麼？|光明戰勝黑暗|豐收|新年|雨季來臨
easy|日本的新年傳統食物是什麼？|年越蕎麥麵|壽司|烤鰻魚|味噌湯
easy|西班牙番茄節在哪個城鎮舉行？|布尼奧爾|巴塞隆納|馬德里|瓦倫西亞
easy|義大利的比薩餅起源於哪座城市？|拿坡里|羅馬|米蘭|威尼斯
easy|巴西嘉年華最著名的舞蹈是什麼？|森巴|探戈|芭蕾|弗拉門戈
easy|韓國的泡菜主要以什麼蔬菜醃製？|大白菜|黃瓜|蘿蔔|茄子
easy|埃及的文字系統稱為什麼？|象形文字|楔形文字|梵文|羅馬字母
easy|中國端午節傳統食物是？|粽子|湯圓|月餅|年糕
easy|墨西哥的亡靈節主要紀念誰？|逝去的親人|國家英雄|歷史人物|藝術家
easy|法國里昂著名的燈光節是在什麼季節舉行？|冬季|夏季|春季|秋季
easy|土耳其的咖啡文化以什麼飲品著稱？|土耳其咖啡|奶茶|抹茶|奶昔
easy|泰國的潑水節又稱為什麼？|宋干節|水燈節|水稻節|火把節
easy|美國紐奧良著名的狂歡節稱為？|瑪爾迪格拉|復活節|感恩節|世界嘉年華
easy|瑞士哪座城市以鐘錶業聞名？|日內瓦|洛桑|巴塞爾|盧加諾
easy|拉丁美洲常見的舞蹈探戈起源於哪個國家？|阿根廷|智利|巴西|秘魯
easy|希臘神話中主神宙斯居住在什麼地方？|奧林帕斯山|亞特蘭提斯|克里特島|特洛伊
easy|義大利麵食通常使用哪種穀物製成？|小麥|大米|玉米|燕麥
easy|法國香水之都是哪座城市？|格拉斯|尼斯|里昂|馬賽
easy|韓國傳統服飾叫什麼？|韓服|和服|旗袍|長衫
medium|西洋歌劇《卡門》作曲家是誰？|比才|莫札特|威爾第|羅西尼
medium|《哈利波特》系列作者是哪一位？|J.K.羅琳|J.R.R.托爾金|蘇珊・柯林斯|史蒂芬・金
medium|泰國著名的水上市場位於哪個城市附近？|曼谷|清邁|普吉|合艾
medium|西班牙弗拉門戈舞伴隨哪種樂器？|吉他|鋼琴|小提琴|長笛
medium|巴西料理中的黑豆燉菜稱為？|費喬亞達|帕尼尼|海鮮飯|串燒
medium|《星夜》是誰的畫作？|梵谷|畢卡索|雷諾瓦|馬蒂斯
medium|南非的公用語之一除祖魯語外還包括？|南非荷蘭語|法語|阿拉伯語|葡萄牙語
medium|中東地區常見的樂器烏德屬於哪一類？|彈撥樂器|打擊樂器|管樂器|鍵盤樂器
medium|義大利發明的濃縮咖啡在當地被稱為？|Espresso|Latte|Americano|Cappuccino
medium|巴基斯坦的國菜「香飯」傳統使用哪種米？|巴斯馬蒂米|糯米|長米|紅米
medium|「納瓦霍」是北美哪個族群？|原住民部族|移民社區|殖民者|奴隸後裔
medium|韓國音樂產業K-pop中的「K」代表什麼？|Korea|King|Kids|Kinetic
medium|冰島的傳統史詩被稱為？|薩迦|神曲|源氏物語|吉爾伽美什
medium|摩洛哥著名的藍色城鎮是哪裡？|舍夫沙萬|馬拉喀什|卡薩布蘭卡|拉巴特
medium|俄羅斯傳統的三馬車舞蹈稱為什麼？|特羅伊卡|胡塔|弗拉門戈|恰恰
medium|希臘傳統料理「慕沙卡」主要食材是？|茄子|馬鈴薯|玉米|麵包
medium|中國的「四大名著」不包括哪一本？|《聊齋志異》|《紅樓夢》|《西遊記》|《水滸傳》
medium|《海上鋼琴師》原作者亞歷山德羅・巴里科是哪國人？|義大利|西班牙|葡萄牙|希臘
medium|波蘭蕭邦音樂節主要紀念哪位作曲家？|蕭邦|李斯特|布拉姆斯|舒曼
medium|墨西哥玉米餅塔可常搭配哪種辣醬？|莎莎醬|味噌|咖哩|芥末
hard|世界遺產吳哥窟屬於哪個宗教建築？|印度教與佛教|伊斯蘭教|基督教|祆教
hard|日本茶道「和敬清寂」的核心思想由哪位茶師整理？|千利休|織田信長|西鄉隆盛|細川忠興
hard|摩洛哥傳統幾何馬賽克稱為？|澤里格|藍晒|曼陀羅|藤編
hard|波斯古典詩人魯米使用的主要語言是？|波斯語|阿拉伯語|土耳其語|庫爾德語
hard|西藏宗教藝術中的唐卡主要使用哪種材料繪製？|礦物顏料|油彩|炭筆|粉蠟筆
hard|中世紀歐洲吟遊詩人的愛情詩被稱為什麼？|騎士抒情詩|讚美詩|頌歌|挽歌
hard|瑪雅長紀曆的一個Baktun相當於多少天？|144000天|7200天|260天|1825天
hard|聖索菲亞大教堂建於哪位拜占庭皇帝時期？|查士丁尼一世|君士坦丁十一世|查理曼|巴西爾二世
hard|印度古典舞蹈婆羅多舞主要起源於哪個地區？|泰米爾納德邦|喀拉拉邦|旁遮普邦|中央邦
hard|《追憶似水年華》作者普魯斯特使用哪種敘述手法聞名？|意識流|寫實主義|魔幻寫實|極簡主義
hard|西班牙建築家高第設計的公園古埃爾位於哪座城市？|巴塞隆納|馬德里|塞維亞|瓦倫西亞
hard|非洲加納阿散蒂王國的金凳象徵著什麼？|民族精神|軍事力量|財富來源|王室婚姻
hard|波斯詩人哈菲茲的作品主要屬於哪種詩體？|加札勒抒情詩|史詩|俳句|十四行詩
hard|法國米其林指南中，三星評價代表什麼？|值得專程造訪|值得順路造訪|價格親民|獨特飲品
hard|巴西音樂風格波薩諾瓦融合了桑巴與哪種音樂？|爵士|搖滾|古典|雷鬼
hard|伊斯蘭書法中的庫法體最早流行於哪個世紀？|7世紀|10世紀|14世紀|16世紀
hard|歌劇《尼伯龍根的指環》共有幾部作品？|4部|3部|5部|6部
hard|中國四大菜系不包括以下哪一個？|滬菜|川菜|魯菜|粵菜
hard|英國作家維吉尼亞・吳爾芙屬於哪個文學流派？|意識流|自然主義|超現實|浪漫主義
hard|北歐神話中，彩虹橋通往哪個世界？|阿斯加德|米德加爾特|尼福爾海姆|約頓海姆
`;

    const cultureList = cultureRaw.trim().split('\n').map(line => {
        const [difficulty, question, correct, wrong1, wrong2, wrong3] = line.split('|');
        return { difficulty, question, correct, wrongOptions: [wrong1, wrong2, wrong3] };
    });

    cultureList.forEach(item => {
        insertQuestion('culture', item.difficulty, item.question, item.correct, item.wrongOptions);
    });

    const EXPECTED_TOTAL = 800;
    if (questions.length !== EXPECTED_TOTAL) {
        console.warn(`題庫目前共有 ${questions.length} 題，預期為 ${EXPECTED_TOTAL} 題`);
    }

    return questions;
})();

// 用於追蹤已使用的題目，避免重複
let usedQuestionIds = new Set();

// 重置已使用題目列表
function resetUsedQuestions() {
    usedQuestionIds.clear();
}

function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function collectAvailableQuestions(difficulty, category) {
    let filtered = [...questionBank];
    if (difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    if (category !== 'all') {
        filtered = filtered.filter(q => q.category === category);
    }
    return filtered.filter(q => !usedQuestionIds.has(q.id));
}

// 根據難度和類別獲取題目
function getQuestionsByFilter(difficulty = 'all', category = 'all', count = 20) {
    let available = collectAvailableQuestions(difficulty, category);

    if (available.length < count) {
        resetUsedQuestions();
        available = collectAvailableQuestions(difficulty, category);
    }

    if (available.length === 0) {
        return [];
    }

    let selected = [];

    if (category === 'all') {
        const categoryMap = new Map();
        available.forEach(question => {
            if (!categoryMap.has(question.category)) {
                categoryMap.set(question.category, []);
            }
            categoryMap.get(question.category).push(question);
        });

        const categoryQueues = shuffleArray(Array.from(categoryMap.keys())).map(key => ({
            key,
            questions: shuffleArray(categoryMap.get(key))
        }));

        let totalAvailable = categoryQueues.reduce((sum, entry) => sum + entry.questions.length, 0);
        let pointer = 0;

        while (selected.length < count && totalAvailable > 0) {
            const queue = categoryQueues[pointer % categoryQueues.length];
            if (queue.questions.length > 0) {
                selected.push(queue.questions.shift());
                totalAvailable--;
            }
            pointer++;

            if (pointer > categoryQueues.length * count * 2) {
                break;
            }
        }
    } else {
        selected = shuffleArray(available).slice(0, count);
    }

    if (selected.length < count) {
        const fallbackPool = available.filter(q => !selected.includes(q));
        const needed = count - selected.length;
        selected = selected.concat(shuffleArray(fallbackPool).slice(0, needed));
    }

    selected = shuffleArray(selected).slice(0, Math.min(count, selected.length));
    selected.forEach(q => usedQuestionIds.add(q.id));
    return selected;
}

if (typeof module !== 'undefined') {
    module.exports = {
        questionBank,
        resetUsedQuestions,
        getQuestionsByFilter
    };
}
