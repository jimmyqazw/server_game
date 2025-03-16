const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Railway 會提供 PORT 環境變數
const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 當有玩家連線時
wss.on('connection', (ws) => {
    console.log('✅ 玩家已連線');

    ws.on('message', (data) => {
        let message = JSON.parse(data);
        console.log('📩 收到訊息:', message);

        // 廣播給所有玩家
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'update', data: message }));
            }
        });
    });

    ws.on('close', () => {
        console.log('❌ 玩家斷線');
    });
});

// 讓 Railway 正常運行
server.listen(PORT, () => {
    console.log(`✅ WebSocket 伺服器運行在 PORT ${PORT}`);
});
