package services

import (
	"database/sql"
	"time"

	"kahoot-game/internal/models"
)

// QuestionService 題目服務
type QuestionService struct {
	db *sql.DB
}

// NewQuestionService 創建題目服務
func NewQuestionService(db *sql.DB) *QuestionService {
	return &QuestionService{
		db: db,
	}
}

// GetRandomQuestions 獲取隨機題目 (已廢棄，使用 two_types_questions.go)
func (s *QuestionService) GetRandomQuestions(count int) ([]models.Question, error) {
	// 現在使用內建的「2種人」題庫，此方法已廢棄
	return GetRandomQuestions(count), nil
}

// GetQuestions 獲取題目列表 (已廢棄，使用 two_types_questions.go)
func (s *QuestionService) GetQuestions(category string, difficulty int, limit int) ([]models.Question, error) {
	// 現在使用內建的「2種人」題庫，此方法已廢棄
	allQuestions := GetRandomQuestions(50) // 取得所有題目
	
	// 簡單的分類過濾
	var filteredQuestions []models.Question
	for _, q := range allQuestions {
		if category == "" || q.Category == category {
			filteredQuestions = append(filteredQuestions, q)
		}
	}
	
	// 限制數量
	if limit > 0 && len(filteredQuestions) > limit {
		filteredQuestions = filteredQuestions[:limit]
	}
	
	return filteredQuestions, nil
}

// CreateQuestion 創建新題目 (適用於「2種人」遊戲)
func (s *QuestionService) CreateQuestion(req *models.CreateQuestionRequest) (*models.Question, error) {
	// 由於我們現在使用內建題庫，這個方法簡化為記憶體操作
	// 如果需要持久化存儲，可以後續擴展
	
	question := &models.Question{
		ID:           0, // 新題目暫時設為0
		QuestionText: req.QuestionText,
		OptionA:      req.OptionA,
		OptionB:      req.OptionB,
		Category:     req.Category,
		TimesUsed:    0,
		IsActive:     true,
		CreatedAt:    time.Now(),
	}
	
	return question, nil
}