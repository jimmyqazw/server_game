const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const roomManager = require('./game/roomManager');

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 記錄玩家 WebSocket 連線 & 房間資訊
const playerSockets = {}; // { playerId: ws }
const playerRooms = {}; // { playerId: roomId }

wss.on('connection', (ws) => {
    console.log('✅ 玩家已連線');

    ws.on('message', (data) => {
        console.log(`📩 收到原始訊息: ${data}`);  // 這裡應該要顯示訊息

        let message;
        try {
            message = JSON.parse(data);
        } catch (error) {
            console.log("❌ JSON 解析失敗:", error);
            return;
        }

        const { roomId, playerId, type, text } = message;

        // 確保房號和玩家 ID 有效
        if (!roomId || !playerId || roomId.length !== 6 || isNaN(roomId)) {
            ws.send(JSON.stringify({ type: 'error', msg: '無效的房號或玩家ID' }));
            return;
        }

        // 加入房間
        if (type === 'join') {
            roomManager.addPlayerToRoom(roomId, playerId);
            playerSockets[playerId] = ws; // 記錄玩家的 WebSocket 連線
            playerRooms[playerId] = roomId; // 記錄玩家所在房間
            console.log(`🎮 玩家 ${playerId} 加入房間 ${roomId}`);
        }

        // 發送聊天訊息
        if (type === 'sendtext') {
            console.log(`💬 [房間 ${roomId}] ${playerId}: ${text}`);

            const chatMessage = {
                type: 'chat',
                roomId,
                sender: playerId,
                text: text
            };

            // **確保 server.js 廣播訊息**
            broadcastToRoom(roomId, chatMessage);
        }
    });

    ws.on('close', () => {
        console.log('❌ 玩家斷線');
    });
});

// **確保 `broadcastToRoom()` 真的發送訊息**
function broadcastToRoom(roomId, message) {
    console.log(`📡 廣播到房間 ${roomId}: ${JSON.stringify(message)}`);

    Object.keys(playerSockets).forEach((id) => {
        if (playerRooms[id] === roomId) {
            try {
                playerSockets[id].send(JSON.stringify(message));
                console.log(`✅ 已發送訊息給 ${id}`);
            } catch (error) {
                console.log(`❌ 無法發送訊息給 ${id}: ${error}`);
            }
        }
    });
}

server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器運行在 PORT ${PORT}`);
});
