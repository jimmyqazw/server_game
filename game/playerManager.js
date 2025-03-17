const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const roomManager = require('./game/roomManager');

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 記錄玩家 WebSocket 連線
const playerSockets = {};

wss.on('connection', (ws) => {
    console.log('✅ 玩家已連線');

    ws.on('message', (data) => {
        let message = JSON.parse(data);
        console.log('📩 收到訊息:', message);

        const { roomId, playerId } = message;

        // 檢查是否有 roomId 和 playerId
        if (!roomId || !playerId || roomId.length !== 6 || isNaN(roomId)) {
            ws.send(JSON.stringify({ type: 'error', msg: '無效的房號或玩家ID' }));
            return;
        }

        // 加入房間（如果房號不存在，則自動建立）
        if (message.type === 'join') {
            roomManager.addPlayerToRoom(roomId, playerId);
            playerSockets[playerId] = ws; // 記錄玩家的 WebSocket 連線
        }

        // 移動玩家
        if (message.type === 'move') {
            roomManager.updatePlayerInRoom(roomId, playerId, message.x, message.y);
        }

        // 廣播最新狀態，只傳給該房間的玩家
        const playersInRoom = roomManager.getPlayersInRoom(roomId);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && Object.values(playerSockets).includes(client)) {
                client.send(JSON.stringify({ type: 'update', roomId, players: playersInRoom }));
            }
        });
    });

    ws.on('close', () => {
        console.log('❌ 玩家斷線');

        // 找出哪個玩家斷線
        const playerId = Object.keys(playerSockets).find((id) => playerSockets[id] === ws);
        if (playerId) {
            // 找出該玩家在哪個房間，然後移除
            Object.keys(roomManager.getPlayersInRoom()).forEach((roomId) => {
                roomManager.removePlayerFromRoom(roomId, playerId);
            });
            delete playerSockets[playerId];
        }
    });
});

server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器運行在 PORT ${PORT}`);
});
