const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const playerSockets = {}; // { playerId: ws }

wss.on('connection', (ws) => {
    console.log('✅ 新玩家已連線');

    ws.on('message', (data) => {
        let message;
        try {
            message = JSON.parse(data);
        } catch (err) {
            console.log('❌ 無法解析 JSON:', err);
            return;
        }

        const { type, playerId, command } = message;

        // 記錄新連線的玩家 ID
        if (type === 'join' && playerId) {
            playerSockets[playerId] = ws;
            console.log(`🎮 玩家已加入: ${playerId}`);
        }

        // 處理 "left" 指令並廣播給所有人
        if (command === 'left' && playerId) {
            const leftCommand = {
                command: "left",
                playerId: playerId
            };
            console.log(`↩️ 玩家 ${playerId} 發送 command: left`);

            // 廣播給所有連線玩家
            Object.values(playerSockets).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(leftCommand));
                }
            });
        }
        // 處理 "left_release" 指令並廣播給所有人
        if (command === 'left_release' && playerId) {
            const leftCommand = {
                command: "left_release",
                playerId: playerId
            };
            console.log(`↩️ 玩家 ${playerId} 發送 command: left_release`);

            // 廣播給所有連線玩家
            Object.values(playerSockets).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(leftCommand));
                }
            });
        }
    });

    ws.on('close', () => {
        // 從 playerSockets 移除這個玩家
        const playerId = Object.keys(playerSockets).find(id => playerSockets[id] === ws);
        if (playerId) {
            delete playerSockets[playerId];
            console.log(`❌ 玩家已離線: ${playerId}`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器正在 PORT ${PORT} 運行`);
});
