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
        let message = JSON.parse(data);
        console.log('📩 收到訊息:', message);

        const { roomId, playerId } = message;

        // 確保房號和玩家 ID 有效
        if (!roomId || !playerId || roomId.length !== 6 || isNaN(roomId)) {
            ws.send(JSON.stringify({ type: 'error', msg: '無效的房號或玩家ID' }));
            return;
        }

        // 加入房間（避免重複加入）
        if (message.type === 'join' && !playerRooms[playerId]) {
            roomManager.addPlayerToRoom(roomId, playerId);
            playerSockets[playerId] = ws; // 記錄玩家 WebSocket 連線
            playerRooms[playerId] = roomId; // 記錄玩家所在房間
            console.log(`🎮 玩家 ${playerId} 加入房間 ${roomId}`);

            // 通知房間內其他人有新玩家加入
            broadcastToRoom(roomId, {
                type: 'system',
                message: `🎉 ${playerId} 加入了房間 ${roomId}`
            });
        }

        // 處理聊天訊息
        if (message.type === 'sendtext') {
            const chatMessage = {
                type: 'chat',
                roomId,
                sender: playerId,
                text: message.text
            };

            console.log(`💬 [房間 ${roomId}] ${playerId}: ${message.text}`);

            // 廣播給相同房間的所有玩家
            broadcastToRoom(roomId, chatMessage);
        }
    });

    ws.on('close', () => {
        console.log('❌ 玩家斷線');

        // 找出哪個玩家斷線
        const playerId = Object.keys(playerSockets).find((id) => playerSockets[id] === ws);
        if (playerId) {
            const roomId = playerRooms[playerId];
            roomManager.removePlayerFromRoom(roomId, playerId);
            delete playerSockets[playerId];
            delete playerRooms[playerId];
            console.log(`🗑️ 玩家 ${playerId} 退出房間 ${roomId}`);

            // 通知房間內其他人該玩家離開
            broadcastToRoom(roomId, {
                type: 'system',
                message: `🚪 ${playerId} 離開了房間 ${roomId}`
            });
        }
    });
});

// 廣播訊息給同一個房號內的所有玩家
function broadcastToRoom(roomId, message) {
    Object.keys(playerSockets).forEach((id) => {
        if (playerRooms[id] === roomId) {
            playerSockets[id].send(JSON.stringify(message));
        }
    });
}

server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器運行在 PORT ${PORT}`);
});
