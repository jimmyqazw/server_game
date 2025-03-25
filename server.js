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

        // 玩家加入
        if (type === 'join' && playerId) {
            playerSockets[playerId] = ws;
            console.log(`🎮 玩家已加入: ${playerId}`);

            // 廣播新玩家加入訊息給其他玩家（不含自己）
            const newPlayerMessage = {
                event: "new_player_joined",
                playerId: playerId
            };

            Object.entries(playerSockets).forEach(([id, client]) => {
                if (id !== playerId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newPlayerMessage));
                }
            });

            // 傳送舊玩家 ID 給這位新玩家
            const otherPlayerIds = Object.keys(playerSockets).filter(id => id !== playerId);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    event: "existing_players",
                    players: otherPlayerIds
                }));
            }
        }

        // 處理動作指令
        const broadcastCommand = (cmd) => {
            const msg = { command: cmd, playerId };
            Object.values(playerSockets).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(msg));
                }
            });
        };

        if (command === 'left') {
            console.log(`↩️ 玩家 ${playerId} 發送 command: left`);
            broadcastCommand('left');
        }

        if (command === 'left_release') {
            console.log(`↩️ 玩家 ${playerId} 發送 command: left_release`);
            broadcastCommand('left_release');
        }

        if (command === 'right') {
            console.log(`↩️ 玩家 ${playerId} 發送 command: right`);
            broadcastCommand('right');
        }

        if (command === 'right_release') {
            console.log(`↩️ 玩家 ${playerId} 發送 command: right_release`);
            broadcastCommand('right_release');
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
