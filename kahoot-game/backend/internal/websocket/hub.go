package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"kahoot-game/internal/services"
)

// Hub WebSocket 連線管理中心
type Hub struct {
	// 註冊的客戶端連線
	clients map[*Client]bool
	
	// 按房間分組的客戶端
	rooms map[string]map[*Client]bool
	
	// 客戶端註冊通道
	register chan *Client
	
	// 客戶端註銷通道
	unregister chan *Client
	
	// 廣播訊息通道
	broadcast chan []byte
	
	// 房間廣播通道
	roomBroadcast chan *RoomMessage
	
	// 服務層依賴
	roomService *services.RoomService
	gameService *services.GameService
	
	// 互斥鎖
	mutex sync.RWMutex
}

// RoomMessage 房間訊息結構
type RoomMessage struct {
	RoomID  string `json:"roomId"`
	Message []byte `json:"message"`
}

// NewHub 創建新的 Hub
func NewHub(roomService *services.RoomService, gameService *services.GameService) *Hub {
	return &Hub{
		clients:       make(map[*Client]bool),
		rooms:         make(map[string]map[*Client]bool),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan []byte),
		roomBroadcast: make(chan *RoomMessage),
		roomService:   roomService,
		gameService:   gameService,
	}
}

// Run 啟動 Hub
func (h *Hub) Run() {
	log.Println("🚀 WebSocket Hub 已啟動")
	
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)
			
		case client := <-h.unregister:
			h.unregisterClient(client)
			
		case message := <-h.broadcast:
			h.broadcastToAll(message)
			
		case roomMsg := <-h.roomBroadcast:
			h.broadcastToRoom(roomMsg.RoomID, roomMsg.Message)
		}
	}
}

// registerClient 註冊客戶端
func (h *Hub) registerClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	h.clients[client] = true
	
	log.Printf("✅ 客戶端已註冊: %s (總計: %d)", client.ID, len(h.clients))
	
	// 發送歡迎訊息
	welcomeMsg := Message{
		Type: "CONNECTED",
		Data: map[string]interface{}{
			"clientId": client.ID,
			"message":  "歡迎來到 Kahoot 遊戲！",
		},
	}
	
	if msgBytes, err := json.Marshal(welcomeMsg); err == nil {
		client.send <- msgBytes
	}
}

// unregisterClient 註銷客戶端
func (h *Hub) unregisterClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if _, ok := h.clients[client]; ok {
		// 從全域客戶端列表移除
		delete(h.clients, client)
		close(client.send)
		
		// 從所有房間移除
		for roomID := range h.rooms {
			h.removeClientFromRoom(client, roomID)
		}
		
		// 如果客戶端在房間中，處理離開邏輯
		if client.RoomID != "" {
			h.handlePlayerLeave(client)
		}
		
		log.Printf("❌ 客戶端已註銷: %s (剩餘: %d)", client.ID, len(h.clients))
	}
}

// addClientToRoom 將客戶端加入房間
func (h *Hub) AddClientToRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	
	h.rooms[roomID][client] = true
	client.RoomID = roomID
	
	log.Printf("🏠 客戶端 %s 加入房間 %s", client.ID, roomID)
}

// removeClientFromRoom 從房間移除客戶端
func (h *Hub) removeClientFromRoom(client *Client, roomID string) {
	if h.rooms[roomID] != nil {
		delete(h.rooms[roomID], client)
		
		// 如果房間沒有客戶端了，刪除房間
		if len(h.rooms[roomID]) == 0 {
			delete(h.rooms, roomID)
			log.Printf("🗑️ 房間 %s 已清空並移除", roomID)
		}
	}
}

// broadcastToAll 廣播給所有客戶端
func (h *Hub) broadcastToAll(message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	for client := range h.clients {
		select {
		case client.send <- message:
		default:
			delete(h.clients, client)
			close(client.send)
		}
	}
}

// BroadcastToRoom 廣播給特定房間
func (h *Hub) BroadcastToRoom(roomID string, message []byte) {
	h.roomBroadcast <- &RoomMessage{
		RoomID:  roomID,
		Message: message,
	}
}

// broadcastToRoom 內部廣播給房間
func (h *Hub) broadcastToRoom(roomID string, message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	if roomClients, exists := h.rooms[roomID]; exists {
		for client := range roomClients {
			select {
			case client.send <- message:
			default:
				delete(roomClients, client)
				close(client.send)
			}
		}
	}
}

// handlePlayerLeave 處理玩家離開
func (h *Hub) handlePlayerLeave(client *Client) {
	if client.RoomID == "" || client.PlayerName == "" {
		return
	}
	
	// 從房間服務中移除玩家
	err := h.roomService.RemovePlayer(client.RoomID, client.ID)
	if err != nil {
		log.Printf("❌ 移除玩家失敗: %v", err)
		return
	}
	
	// 獲取更新後的房間資訊
	room, err := h.roomService.GetRoom(client.RoomID)
	if err != nil {
		log.Printf("❌ 獲取房間資訊失敗: %v", err)
		return
	}
	
	// 廣播玩家離開訊息
	leaveMsg := Message{
		Type: "PLAYER_LEFT",
		Data: map[string]interface{}{
			"playerId":     client.ID,
			"playerName":   client.PlayerName,
			"totalPlayers": room.GetPlayerCount(),
			"players":      room.GetPlayerList(),
		},
	}
	
	if msgBytes, err := json.Marshal(leaveMsg); err == nil {
		h.BroadcastToRoom(client.RoomID, msgBytes)
	}
	
	log.Printf("👋 玩家 %s 離開房間 %s", client.PlayerName, client.RoomID)
}

// GetRoomClients 獲取房間客戶端列表
func (h *Hub) GetRoomClients(roomID string) []*Client {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	var clients []*Client
	if roomClients, exists := h.rooms[roomID]; exists {
		for client := range roomClients {
			clients = append(clients, client)
		}
	}
	
	return clients
}

// GetRoomClientCount 獲取房間客戶端數量
func (h *Hub) GetRoomClientCount(roomID string) int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	if roomClients, exists := h.rooms[roomID]; exists {
		return len(roomClients)
	}
	
	return 0
}

// GetTotalClients 獲取總客戶端數量
func (h *Hub) GetTotalClients() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	return len(h.clients)
}

// GetTotalRooms 獲取總房間數量
func (h *Hub) GetTotalRooms() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	return len(h.rooms)
}

// SendToClient 發送訊息給特定客戶端
func (h *Hub) SendToClient(clientID string, message []byte) error {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	for client := range h.clients {
		if client.ID == clientID {
			select {
			case client.send <- message:
				return nil
			default:
				return fmt.Errorf("客戶端 %s 發送通道已滿", clientID)
			}
		}
	}
	
	return fmt.Errorf("找不到客戶端 %s", clientID)
}

// GetStats 獲取 Hub 統計資訊
func (h *Hub) GetStats() map[string]interface{} {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	roomStats := make(map[string]int)
	for roomID, clients := range h.rooms {
		roomStats[roomID] = len(clients)
	}
	
	return map[string]interface{}{
		"totalClients": len(h.clients),
		"totalRooms":   len(h.rooms),
		"roomStats":    roomStats,
	}
}