package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"kahoot-game/internal/config"

	_ "github.com/lib/pq"
)

// NewPostgresDB 創建新的 PostgreSQL 資料庫連線
func NewPostgresDB(cfg *config.Config) (*sql.DB, error) {
	dsn := cfg.GetDatabaseDSN()
	
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("無法打開資料庫連線: %w", err)
	}

	// 設置連線池配置
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// 測試連線
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("無法連接到資料庫: %w", err)
	}

	return db, nil
}

// CreateTables 創建資料庫表格
func CreateTables(db *sql.DB) error {
	// 讀取並執行 SQL schema
	schema := `
		-- 遊戲記錄表
		CREATE TABLE IF NOT EXISTS games (
			id SERIAL PRIMARY KEY,
			room_id VARCHAR(10) UNIQUE NOT NULL,
			host_name VARCHAR(50) NOT NULL,
			total_players INTEGER DEFAULT 0,
			total_questions INTEGER DEFAULT 10,
			question_time_limit INTEGER DEFAULT 30,
			winner_name VARCHAR(50),
			winner_score INTEGER,
			duration_seconds INTEGER,
			created_at TIMESTAMP DEFAULT NOW(),
			started_at TIMESTAMP,
			finished_at TIMESTAMP,
			status VARCHAR(20) DEFAULT 'waiting'
		);

		-- 玩家統計表
		CREATE TABLE IF NOT EXISTS player_stats (
			id SERIAL PRIMARY KEY,
			game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
			player_name VARCHAR(50) NOT NULL,
			final_score INTEGER DEFAULT 0,
			final_rank INTEGER,
			correct_answers INTEGER DEFAULT 0,
			total_answers INTEGER DEFAULT 0,
			accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
			avg_response_time DECIMAL(6,2) DEFAULT 0.00,
			times_as_host INTEGER DEFAULT 0,
			fastest_answer_time DECIMAL(6,2),
			slowest_answer_time DECIMAL(6,2),
			created_at TIMESTAMP DEFAULT NOW()
		);

		-- 題目資料庫
		CREATE TABLE IF NOT EXISTS questions (
			id SERIAL PRIMARY KEY,
			question_text TEXT NOT NULL,
			option_a VARCHAR(200) NOT NULL,
			option_b VARCHAR(200) NOT NULL,
			option_c VARCHAR(200) NOT NULL,
			option_d VARCHAR(200) NOT NULL,
			correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
			explanation TEXT,
			category VARCHAR(50) DEFAULT 'general',
			difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
			times_used INTEGER DEFAULT 0,
			correct_rate DECIMAL(5,2) DEFAULT 0.00,
			avg_answer_time DECIMAL(6,2) DEFAULT 0.00,
			is_active BOOLEAN DEFAULT true,
			created_by VARCHAR(50),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);

		-- 答題記錄表
		CREATE TABLE IF NOT EXISTS answer_logs (
			id SERIAL PRIMARY KEY,
			game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
			question_id INTEGER REFERENCES questions(id),
			player_name VARCHAR(50) NOT NULL,
			submitted_answer CHAR(1) CHECK (submitted_answer IN ('A', 'B', 'C', 'D')),
			is_correct BOOLEAN NOT NULL,
			response_time DECIMAL(6,2) NOT NULL,
			score_gained INTEGER DEFAULT 0,
			was_host BOOLEAN DEFAULT false,
			submitted_at TIMESTAMP DEFAULT NOW()
		);

		-- 房間活動日誌
		CREATE TABLE IF NOT EXISTS room_logs (
			id SERIAL PRIMARY KEY,
			room_id VARCHAR(10) NOT NULL,
			event_type VARCHAR(50) NOT NULL,
			player_name VARCHAR(50),
			event_data JSONB,
			created_at TIMESTAMP DEFAULT NOW()
		);

		-- 創建索引
		CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
		CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
		CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON player_stats(game_id);
		CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
		CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
		CREATE INDEX IF NOT EXISTS idx_answer_logs_game_id ON answer_logs(game_id);
		CREATE INDEX IF NOT EXISTS idx_answer_logs_question_id ON answer_logs(question_id);
		CREATE INDEX IF NOT EXISTS idx_room_logs_room_id ON room_logs(room_id);
	`

	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("創建表格失敗: %w", err)
	}

	return nil
}

// SeedQuestions 插入示例題目
func SeedQuestions(db *sql.DB) error {
	// 檢查是否已有題目
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM questions").Scan(&count)
	if err != nil {
		return fmt.Errorf("檢查題目數量失敗: %w", err)
	}

	// 如果已有題目，跳過插入
	if count > 0 {
		return nil
	}

	questions := []struct {
		text, optA, optB, optC, optD, correct, explanation, category string
		difficulty int
	}{
		{"台灣最高的山是？", "玉山", "雪山", "大霸尖山", "合歡山", "A", "玉山海拔3952公尺，是台灣最高峰", "地理", 1},
		{"以下哪個不是程式語言？", "Python", "Java", "HTML", "JavaScript", "C", "HTML是標記語言，不是程式語言", "資訊", 2},
		{"一年有幾個季節？", "2個", "3個", "4個", "5個", "C", "春夏秋冬四個季節", "常識", 1},
		{"JavaScript 是由哪家公司開發的？", "Microsoft", "Google", "Netscape", "Apple", "C", "JavaScript最初由Netscape公司開發", "資訊", 3},
		{"世界上最大的海洋是？", "大西洋", "太平洋", "印度洋", "北冰洋", "B", "太平洋是世界上面積最大的海洋", "地理", 1},
		{"以下哪種動物是哺乳動物？", "鯨魚", "鯊魚", "金魚", "章魚", "A", "鯨魚是海洋哺乳動物", "生物", 2},
		{"一個正方形有幾個邊？", "3個", "4個", "5個", "6個", "B", "正方形有四個相等的邊", "數學", 1},
		{"CPU 的中文全名是？", "中央處理器", "記憶體", "硬碟", "主機板", "A", "CPU是Central Processing Unit的縮寫", "資訊", 2},
		{"彩虹有幾種顏色？", "5種", "6種", "7種", "8種", "C", "彩虹有紅橙黃綠藍靛紫七種顏色", "常識", 2},
		{"以下哪個是 NoSQL 資料庫？", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "C", "MongoDB是著名的NoSQL文檔型資料庫", "資訊", 3},
		{"台灣的首都是？", "台北", "高雄", "台中", "台南", "A", "台北是中華民國首都", "地理", 1},
		{"HTTP 的預設連接埠是？", "80", "443", "21", "22", "A", "HTTP協議的預設連接埠是80", "資訊", 2},
		{"一打等於幾個？", "10個", "12個", "20個", "24個", "B", "一打(dozen)等於12個", "常識", 1},
		{"以下哪個是物件導向程式語言？", "C", "JavaScript", "Assembly", "SQL", "B", "JavaScript支援物件導向程式設計", "資訊", 2},
		{"地球繞太陽一圈需要多久？", "1個月", "3個月", "1年", "2年", "C", "地球繞太陽公轉一圈約365.25天，即一年", "科學", 1},
	}

	stmt, err := db.Prepare(`
		INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, 
			correct_answer, explanation, category, difficulty, created_by) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'system')
	`)
	if err != nil {
		return fmt.Errorf("準備插入語句失敗: %w", err)
	}
	defer stmt.Close()

	for _, q := range questions {
		_, err := stmt.Exec(q.text, q.optA, q.optB, q.optC, q.optD, 
			q.correct, q.explanation, q.category, q.difficulty)
		if err != nil {
			return fmt.Errorf("插入題目失敗: %w", err)
		}
	}

	return nil
}