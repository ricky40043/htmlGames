package handlers

import (
	"net/http"
	"strconv"

	"kahoot-game/internal/models"
	"kahoot-game/internal/services"

	"github.com/gin-gonic/gin"
)

// QuestionHandler 題目處理器
type QuestionHandler struct {
	questionService *services.QuestionService
}

// NewQuestionHandler 創建題目處理器
func NewQuestionHandler(questionService *services.QuestionService) *QuestionHandler {
	return &QuestionHandler{
		questionService: questionService,
	}
}

// GetQuestions 獲取題目列表
func (h *QuestionHandler) GetQuestions(c *gin.Context) {
	category := c.Query("category")
	difficultyStr := c.Query("difficulty")
	limitStr := c.Query("limit")
	
	var difficulty, limit int
	var err error
	
	if difficultyStr != "" {
		difficulty, err = strconv.Atoi(difficultyStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "無效的難度參數",
			})
			return
		}
	}
	
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "無效的限制參數",
			})
			return
		}
	} else {
		limit = 50 // 預設限制
	}

	questions, err := h.questionService.GetQuestions(category, difficulty, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "獲取題目失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    questions,
		"count":   len(questions),
	})
}

// GetRandomQuestions 獲取隨機題目
func (h *QuestionHandler) GetRandomQuestions(c *gin.Context) {
	countStr := c.Param("count")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 || count > 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "無效的數量參數 (1-50)",
		})
		return
	}

	questions, err := h.questionService.GetRandomQuestions(count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "獲取隨機題目失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    questions,
		"count":   len(questions),
	})
}

// CreateQuestion 創建新題目
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "請求資料格式錯誤",
			"details": err.Error(),
		})
		return
	}

	question, err := h.questionService.CreateQuestion(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "創建題目失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    question,
		"message": "題目創建成功",
	})
}