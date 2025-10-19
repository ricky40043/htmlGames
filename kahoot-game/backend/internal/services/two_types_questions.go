package services

import (
	"kahoot-game/internal/models"
	"math/rand"
	"time"
)

// TwoTypesQuestion 2種人題目結構
type TwoTypesQuestion struct {
	Category string `json:"category"`
	Question string `json:"question"`
	OptionA  string `json:"optionA"`
	OptionB  string `json:"optionB"`
}

// GetTwoTypesQuestions 獲取「2種人」題庫
func GetTwoTypesQuestions() []TwoTypesQuestion {
	return []TwoTypesQuestion{
		// 飲食爭議類
		{Category: "food", Question: "世界上只有兩種人", OptionA: "魯肉飯一定要拌勻", OptionB: "魯肉飯要分層吃"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "Pizza可以加鳳梨", OptionB: "Pizza加鳳梨是邪教"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "臭豆腐要吃炸的", OptionB: "臭豆腐要吃滷的"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "麵食主義者", OptionB: "米食主義者"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "義大利麵用叉子", OptionB: "義大利麵用筷子"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "珍奶一定要去冰", OptionB: "珍奶正常冰才對"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "火鍋蛋餃要咬破", OptionB: "火鍋蛋餃整顆吃"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "吃泡麵一定要加蛋", OptionB: "泡麵原味最純正"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "湯圓要鹹的", OptionB: "湯圓要甜的"},
		{Category: "food", Question: "世界上只有兩種人", OptionA: "粽子一定要甜粽", OptionB: "粽子就是要鹹粽"},
		
		// 生活習慣類
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "牙膏從底部擠", OptionB: "牙膏從中間擠"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "洗澡先洗頭", OptionB: "洗澡先洗身體"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "睡覺一定要關燈", OptionB: "睡覺要留小夜燈"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "起床立刻摺棉被", OptionB: "棉被隨便鋪就好"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "衣服要摺得整齊", OptionB: "衣服掛著就好"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "馬桶蓋一定要蓋", OptionB: "馬桶蓋開著無所謂"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "鞋子進門要排好", OptionB: "鞋子脫了就算了"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "冷氣要開到很冷", OptionB: "冷氣適中就好"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "手機電量低於50%就充", OptionB: "手機用到10%以下才充"},
		{Category: "habit", Question: "世界上只有兩種人", OptionA: "桌面一定要整齊", OptionB: "桌面亂一點沒關係"},
		
		// 個性偏好類
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "喜歡計劃一切", OptionB: "喜歡隨機應變"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "早起的鳥兒", OptionB: "夜貓子類型"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "內向安靜型", OptionB: "外向活潑型"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "完美主義者", OptionB: "差不多就好派"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "喜歡獨處", OptionB: "喜歡熱鬧"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "理性思考派", OptionB: "感性直覺派"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "謹慎保守型", OptionB: "冒險創新型"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "喜歡競爭", OptionB: "喜歡合作"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "重視過程", OptionB: "重視結果"},
		{Category: "personality", Question: "世界上只有兩種人", OptionA: "樂觀正向派", OptionB: "現實謹慎派"},
		
		// 科技使用類
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "iPhone派", OptionB: "Android派"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "Mac用戶", OptionB: "PC用戶"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "Chrome瀏覽器", OptionB: "Safari瀏覽器"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "社群媒體重度用戶", OptionB: "社群媒體輕度用戶"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "喜歡最新科技", OptionB: "喜歡穩定舊版"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "線上購物派", OptionB: "實體店面派"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "數位支付派", OptionB: "現金支付派"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "雲端存檔派", OptionB: "本機存檔派"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "自動更新派", OptionB: "手動更新派"},
		{Category: "tech", Question: "世界上只有兩種人", OptionA: "深色模式愛好者", OptionB: "淺色模式愛好者"},
		
		// 娛樂休閒類
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "電影院派", OptionB: "在家看片派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "書籍閱讀派", OptionB: "影片觀看派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "戶外活動派", OptionB: "室內活動派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "音樂派", OptionB: "Podcast派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "遊戲玩家", OptionB: "非遊戲玩家"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "旅遊冒險派", OptionB: "居家休息派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "運動健身派", OptionB: "靜態休閒派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "追劇狂熱派", OptionB: "偶爾看片派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "聚會社交派", OptionB: "宅在家派"},
		{Category: "entertainment", Question: "世界上只有兩種人", OptionA: "早睡早起派", OptionB: "熬夜晚睡派"},
	}
}

// ConvertToGameQuestions 將2種人題目轉換為遊戲題目格式
func ConvertToGameQuestions(twoTypesQuestions []TwoTypesQuestion) []models.Question {
	questions := make([]models.Question, len(twoTypesQuestions))
	
	for i, q := range twoTypesQuestions {
		questions[i] = models.Question{
			ID:           i + 1,
			QuestionText: q.Question,
			OptionA:      q.OptionA,
			OptionB:      q.OptionB,
			Category:     q.Category,
			TimesUsed:    0,
			IsActive:     true,
			CreatedAt:    time.Now(),
		}
	}
	
	return questions
}

// GetRandomQuestions 隨機選取指定數量的題目
func GetRandomQuestions(count int) []models.Question {
	allQuestions := ConvertToGameQuestions(GetTwoTypesQuestions())
	
	if count >= len(allQuestions) {
		return allQuestions
	}
	
	// 隨機打亂題目順序
	rand.Seed(time.Now().UnixNano())
	for i := len(allQuestions) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		allQuestions[i], allQuestions[j] = allQuestions[j], allQuestions[i]
	}
	
	return allQuestions[:count]
}