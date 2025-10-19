package handlers

import (
	"net/http"
	"strconv"

	"kahoot-game/internal/services"

	"github.com/gin-gonic/gin"
)

// GameHandler 遊戲處理器
type GameHandler struct {
	gameService *services.GameService
}

// NewGameHandler 創建遊戲處理器
func NewGameHandler(gameService *services.GameService) *GameHandler {
	return &GameHandler{
		gameService: gameService,
	}
}

// GetActiveGames 獲取活躍遊戲列表
func (h *GameHandler) GetActiveGames(c *gin.Context) {
	games, err := h.gameService.GetActiveGames()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "獲取活躍遊戲失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    games,
		"count":   len(games),
	})
}

// GetGameStats 獲取遊戲統計
func (h *GameHandler) GetGameStats(c *gin.Context) {
	gameIDStr := c.Param("gameId")
	gameID, err := strconv.Atoi(gameIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "無效的遊戲ID",
		})
		return
	}

	stats, err := h.gameService.GetGameStats(gameID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "獲取遊戲統計失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}