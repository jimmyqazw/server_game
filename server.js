const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const roomManager = require('./game/roomManager');

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 記錄玩家 WebSocket 連線
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

        // 加入房間
        if (message.type === 'join') {
            roomManager.addPlayerToRoom(roomId, playerId);
            playerSockets[playerId] = ws; // 記錄玩家的 WebSocket 連線
            playerRooms[playerId] = roomId; // 記錄玩家所在房間
        }

        // 移動玩家
        if (message.type === 'move') {
            roomManager.updatePlayerInRoom(roomId, playerId, message.x, message.y);
        }

        // 發送聊天訊息
        if (message.type === 'sendtext') {
            const chatMessage = {
                type: 'chat',
                roomId,
                sender: playerId,
                text: message.text
            };

            console.log(`💬 [房間 ${roomId}] ${playerId}: ${message.text}`);

            // 廣播給相同 `roomId` 的所有玩家
            Object.keys(playerSockets).forEach((id) => {
                if (playerRooms[id] === roomId) { // 只傳送給相同房間的玩家
                    playerSockets[id].send(JSON.stringify(chatMessage));
                }
            });
        }

        // 廣播最新狀態，只傳給該房間的玩家
        const playersInRoom = roomManager.getPlayersInRoom(roomId);
        Object.keys(playerSockets).forEach((id) => {
            if (playerRooms[id] === roomId) {
                playerSockets[id].send(JSON.stringify({ type: 'update', roomId, players: playersInRoom }));
            }
        });
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
        }
    });
});

server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器運行在 PORT ${PORT}`);
});
