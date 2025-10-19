package services

import (
	"database/sql"
	"fmt"
	"math/rand"
	"time"

	"kahoot-game/internal/models"

	"github.com/go-redis/redis/v8"
)

// GameService 遊戲服務
type GameService struct {
	db          *sql.DB
	redisClient *redis.Client
}

// NewGameService 創建遊戲服務
func NewGameService(db *sql.DB, redisClient *redis.Client) *GameService {
	return &GameService{
		db:          db,
		redisClient: redisClient,
	}
}

// CreateGame 創建遊戲記錄
func (s *GameService) CreateGame(roomID, hostName string, totalQuestions, questionTimeLimit int) (*models.Game, error) {
	query := `
		INSERT INTO games (room_id, host_name, total_questions, question_time_limit, status)
		VALUES ($1, $2, $3, $4, 'waiting')
		RETURNING id, created_at
	`
	
	var game models.Game
	err := s.db.QueryRow(query, roomID, hostName, totalQuestions, questionTimeLimit).
		Scan(&game.ID, &game.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("創建遊戲記錄失敗: %w", err)
	}
	
	game.RoomID = roomID
	game.HostName = hostName
	game.TotalQuestions = totalQuestions
	game.QuestionTimeLimit = questionTimeLimit
	game.Status = "waiting"
	
	return &game, nil
}

// GetActiveGames 獲取活躍遊戲列表
func (s *GameService) GetActiveGames() ([]models.Game, error) {
	query := `
		SELECT id, room_id, host_name, total_players, total_questions, 
			   question_time_limit, status, created_at
		FROM games 
		WHERE status IN ('waiting', 'playing')
		ORDER BY created_at DESC
		LIMIT 50
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("查詢活躍遊戲失敗: %w", err)
	}
	defer rows.Close()
	
	var games []models.Game
	for rows.Next() {
		var game models.Game
		err := rows.Scan(
			&game.ID, &game.RoomID, &game.HostName, &game.TotalPlayers,
			&game.TotalQuestions, &game.QuestionTimeLimit,
			&game.Status, &game.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("掃描遊戲資料失敗: %w", err)
		}
		games = append(games, game)
	}
	
	return games, nil
}

// GetGameStats 獲取遊戲統計
func (s *GameService) GetGameStats(gameID int) (*models.GameStatistics, error) {
	query := `
		SELECT g.room_id, g.host_name, g.total_players, g.total_questions,
			   g.duration_seconds, g.winner_name, g.winner_score, g.created_at,
			   COALESCE(AVG(ps.accuracy_percentage), 0) as avg_accuracy,
			   COALESCE(AVG(ps.avg_response_time), 0) as avg_response_time
		FROM games g
		LEFT JOIN player_stats ps ON g.id = ps.game_id
		WHERE g.id = $1
		GROUP BY g.id, g.room_id, g.host_name, g.total_players, g.total_questions,
				 g.duration_seconds, g.winner_name, g.winner_score, g.created_at
	`
	
	var stats models.GameStatistics
	var winnerName sql.NullString
	var winnerScore sql.NullInt32
	var durationSeconds sql.NullInt32
	
	err := s.db.QueryRow(query, gameID).Scan(
		&stats.RoomID, &stats.HostName, &stats.TotalPlayers, &stats.TotalQuestions,
		&durationSeconds, &winnerName, &winnerScore, &stats.CreatedAt,
		&stats.AvgAccuracy, &stats.AvgResponseTime,
	)
	if err != nil {
		return nil, fmt.Errorf("查詢遊戲統計失敗: %w", err)
	}
	
	if winnerName.Valid {
		stats.WinnerName = winnerName.String
	}
	if winnerScore.Valid {
		stats.WinnerScore = int(winnerScore.Int32)
	}
	if durationSeconds.Valid {
		stats.DurationSeconds = int(durationSeconds.Int32)
	}
	
	return &stats, nil
}

// StartTwoTypesGame 開始「2種人」遊戲
func (s *GameService) StartTwoTypesGame(room *models.Room) error {
	if len(room.Players) < 2 {
		return fmt.Errorf("至少需要2個玩家才能開始遊戲")
	}
	
	// 設定第一題的主角
	room.CurrentHost = s.selectNextHost(room, "")
	room.Status = models.RoomStatusQuestionDisplay
	room.CurrentQuestion = 1
	
	return nil
}

// selectNextHost 選擇下一個主角（輪流）
func (s *GameService) selectNextHost(room *models.Room, currentHost string) string {
	players := room.GetPlayerList()
	if len(players) == 0 {
		return ""
	}
	
	// 如果是第一題，隨機選擇
	if currentHost == "" {
		rand.Seed(time.Now().UnixNano())
		return players[rand.Intn(len(players))].ID
	}
	
	// 找到當前主角的位置，選擇下一個
	for i, player := range players {
		if player.ID == currentHost {
			nextIndex := (i + 1) % len(players)
			return players[nextIndex].ID
		}
	}
	
	// 如果找不到當前主角，隨機選擇
	return players[rand.Intn(len(players))].ID
}

// SubmitTwoTypesAnswer 提交「2種人」答案
func (s *GameService) SubmitTwoTypesAnswer(room *models.Room, playerID, answer string, timeUsed float64) (*models.Answer, error) {
	currentQuestion := room.Questions[room.CurrentQuestion-1]
	
	// 檢查答案是否有效
	if answer != "A" && answer != "B" {
		return nil, fmt.Errorf("無效的答案選項")
	}
	
	// 檢查玩家是否存在
	_, exists := room.GetPlayer(playerID)
	if !exists {
		return nil, fmt.Errorf("玩家不存在")
	}
	
	// 創建答案記錄
	answerRecord := &models.Answer{
		PlayerID:     playerID,
		QuestionID:   currentQuestion.ID,
		Answer:       answer,
		ResponseTime: timeUsed,
		WasHost:      playerID == room.CurrentHost,
		SubmittedAt:  time.Now(),
	}
	
	// 如果是主角，記錄主角答案
	if playerID == room.CurrentHost {
		answerRecord.HostAnswer = answer
		answerRecord.IsCorrect = true // 主角答案永遠是"正確"的
	}
	
	return answerRecord, nil
}

// CalculateTwoTypesScores 計算「2種人」遊戲分數
func (s *GameService) CalculateTwoTypesScores(room *models.Room, answers map[string]*models.Answer) []models.ScoreInfo {
	// 找到主角的答案
	var hostAnswer string
	for playerID, answer := range answers {
		if playerID == room.CurrentHost {
			hostAnswer = answer.Answer
			break
		}
	}
	
	scores := make([]models.ScoreInfo, 0, len(room.Players))
	
	for playerID, player := range room.Players {
		answer, hasAnswered := answers[playerID]
		scoreGained := 0
		
		if hasAnswered {
			if playerID == room.CurrentHost {
				// 主角得分邏輯：有答題就得基礎分
				scoreGained = 50
			} else if answer.Answer == hostAnswer {
				// 其他玩家：猜對主角答案得分，越快越高分
				baseScore := 100
				timeBonus := int((float64(room.QuestionTimeLimit) - answer.ResponseTime) * 2)
				if timeBonus < 0 {
					timeBonus = 0
				}
				scoreGained = baseScore + timeBonus
			}
			// 如果猜錯主角答案，得0分
		}
		
		// 更新玩家總分
		player.Score += scoreGained
		
		scores = append(scores, models.ScoreInfo{
			PlayerID:    playerID,
			PlayerName:  player.Name,
			Score:       player.Score,
			ScoreGained: scoreGained,
		})
		
		// 更新答案記錄
		if hasAnswered {
			answer.ScoreGained = scoreGained
			if playerID != room.CurrentHost {
				answer.IsCorrect = (answer.Answer == hostAnswer)
			}
		}
	}
	
	// 按總分排序
	for i := 0; i < len(scores); i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[j].Score > scores[i].Score {
				scores[i], scores[j] = scores[j], scores[i]
			}
		}
	}
	
	// 設置排名
	for i := range scores {
		scores[i].Rank = i + 1
	}
	
	return scores
}

// NextTwoTypesQuestion 進入下一題
func (s *GameService) NextTwoTypesQuestion(room *models.Room) {
	// 選擇下一個主角
	room.CurrentHost = s.selectNextHost(room, room.CurrentHost)
	
	// 增加題目編號
	room.CurrentQuestion++
	
	// 檢查是否遊戲結束
	if room.CurrentQuestion > room.TotalQuestions {
		room.Status = models.RoomStatusFinished
	} else {
		room.Status = models.RoomStatusQuestionDisplay
	}
}

// GetFinalRanking 獲取最終排名
func (s *GameService) GetFinalRanking(room *models.Room) []models.ScoreInfo {
	return room.GetSortedPlayersByScore()
}