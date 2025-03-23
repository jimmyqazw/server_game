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

        // 處理玩家加入
        if (type === 'join' && playerId) {
            playerSockets[playerId] = ws;
            console.log(`🎮 玩家已加入: ${playerId}`);

            // 廣播新玩家加入訊息給「其他」玩家（不含自己）
            const newPlayerMessage = {
                event: "new_player_joined",
                playerId: playerId
            };

            Object.entries(playerSockets).forEach(([id, client]) => {
                if (id !== playerId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newPlayerMessage));
                }
            });
        }

        // 處理 "left" 指令
        if (command === 'left' && playerId) {
            const leftCommand = {
                command: "left",
                playerId: playerId
            };
            console.log(`↩️ 玩家 ${playerId} 發送 command: left`);

            Object.values(playerSockets).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(leftCommand));
                }
            });
        }

        // 處理 "left_release" 指令
        if (command === 'left_release' && playerId) {
            const leftReleaseCommand = {
                command: "left_release",
                playerId: playerId
            };
            console.log(`↩️ 玩家 ${playerId} 發送 command: left_release`);

            Object.values(playerSockets).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(leftReleaseCommand));
                }
            });
        }
    });

    ws.on('close', () => {
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
