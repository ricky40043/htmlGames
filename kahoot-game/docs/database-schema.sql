-- Kahoot風格遊戲資料庫 Schema

-- 遊戲記錄表
CREATE TABLE games (
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
    status VARCHAR(20) DEFAULT 'waiting' -- waiting, playing, finished
);

-- 玩家統計表
CREATE TABLE player_stats (
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
CREATE TABLE questions (
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
CREATE TABLE answer_logs (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id),
    player_name VARCHAR(50) NOT NULL,
    submitted_answer CHAR(1) CHECK (submitted_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    response_time DECIMAL(6,2) NOT NULL, -- 秒數
    score_gained INTEGER DEFAULT 0,
    was_host BOOLEAN DEFAULT false, -- 該題是否為主角
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- 房間活動日誌
CREATE TABLE room_logs (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(10) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- created, player_joined, player_left, game_started, game_finished
    player_name VARCHAR(50),
    event_data JSONB, -- 額外的事件資料
    created_at TIMESTAMP DEFAULT NOW()
);

-- 創建索引提升查詢效能
CREATE INDEX idx_games_room_id ON games(room_id);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_player_stats_game_id ON player_stats(game_id);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_answer_logs_game_id ON answer_logs(game_id);
CREATE INDEX idx_answer_logs_question_id ON answer_logs(question_id);
CREATE INDEX idx_room_logs_room_id ON room_logs(room_id);

-- 插入一些示例題目
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty) VALUES
('台灣最高的山是？', '玉山', '雪山', '大霸尖山', '合歡山', 'A', '玉山海拔3952公尺，是台灣最高峰', '地理', 1),
('以下哪個不是程式語言？', 'Python', 'Java', 'HTML', 'JavaScript', 'C', 'HTML是標記語言，不是程式語言', '資訊', 2),
('一年有幾個季節？', '2個', '3個', '4個', '5個', 'C', '春夏秋冬四個季節', '常識', 1),
('JavaScript 是由哪家公司開發的？', 'Microsoft', 'Google', 'Netscape', 'Apple', 'C', 'JavaScript最初由Netscape公司開發', '資訊', 3),
('世界上最大的海洋是？', '大西洋', '太平洋', '印度洋', '北冰洋', 'B', '太平洋是世界上面積最大的海洋', '地理', 1),
('以下哪種動物是哺乳動物？', '鯨魚', '鯊魚', '金魚', '章魚', 'A', '鯨魚是海洋哺乳動物', '生物', 2),
('一個正方形有幾個邊？', '3個', '4個', '5個', '6個', 'B', '正方形有四個相等的邊', '數學', 1),
('CPU 的中文全名是？', '中央處理器', '記憶體', '硬碟', '主機板', 'A', 'CPU是Central Processing Unit的縮寫', '資訊', 2),
('彩虹有幾種顏色？', '5種', '6種', '7種', '8種', 'C', '彩虹有紅橙黃綠藍靛紫七種顏色', '常識', 2),
('以下哪個是 NoSQL 資料庫？', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'C', 'MongoDB是著名的NoSQL文檔型資料庫', '資訊', 3);

-- 更新題目統計的觸發器
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE questions 
    SET 
        times_used = times_used + 1,
        correct_rate = (
            SELECT COALESCE(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 0)
            FROM answer_logs 
            WHERE question_id = NEW.question_id
        ),
        avg_answer_time = (
            SELECT COALESCE(AVG(response_time), 0)
            FROM answer_logs 
            WHERE question_id = NEW.question_id
        ),
        updated_at = NOW()
    WHERE id = NEW.question_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_stats
    AFTER INSERT ON answer_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_question_stats();

-- 查詢視圖：遊戲統計
CREATE VIEW game_statistics AS
SELECT 
    g.room_id,
    g.host_name,
    g.total_players,
    g.total_questions,
    g.duration_seconds,
    g.winner_name,
    g.winner_score,
    g.created_at,
    COALESCE(AVG(ps.accuracy_percentage), 0) as avg_accuracy,
    COALESCE(AVG(ps.avg_response_time), 0) as avg_response_time
FROM games g
LEFT JOIN player_stats ps ON g.id = ps.game_id
WHERE g.status = 'finished'
GROUP BY g.id, g.room_id, g.host_name, g.total_players, g.total_questions, 
         g.duration_seconds, g.winner_name, g.winner_score, g.created_at;

-- 查詢視圖：熱門題目
CREATE VIEW popular_questions AS
SELECT 
    q.id,
    q.question_text,
    q.category,
    q.difficulty,
    q.times_used,
    q.correct_rate,
    q.avg_answer_time
FROM questions q
WHERE q.is_active = true
ORDER BY q.times_used DESC, q.correct_rate ASC;