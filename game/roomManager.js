const rooms = {}; // 存放所有房間

// 玩家加入房間
function addPlayerToRoom(roomId, playerId) {
    if (!/^\d{6}$/.test(roomId)) {
        console.log(`❌ 房號 ${roomId} 無效`);
        return;
    }

    if (!rooms[roomId]) {
        rooms[roomId] = {}; // 如果房間不存在，則建立
    }
    rooms[roomId][playerId] = { x: 0, y: 0, score: 0 };
    console.log(`🎮 玩家 ${playerId} 加入房間 ${roomId}`);
}

// 玩家移動
function updatePlayerInRoom(roomId, playerId, x, y) {
    if (rooms[roomId] && rooms[roomId][playerId]) {
        rooms[roomId][playerId].x += x;
        rooms[roomId][playerId].y += y;
    }
}

// 移除玩家
function removePlayerFromRoom(roomId, playerId) {
    if (rooms[roomId]) {
        delete rooms[roomId][playerId];
        console.log(`🚪 玩家 ${playerId} 離開房間 ${roomId}`);

        // 如果房間內沒有玩家，則刪除房間
        if (Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
            console.log(`🗑️ 房間 ${roomId} 已刪除`);
        }
    }
}

// 取得房間內的所有玩家
function getPlayersInRoom(roomId) {
    return rooms[roomId] || {};
}

module.exports = {
    addPlayerToRoom,
    updatePlayerInRoom,
    removePlayerFromRoom,
    getPlayersInRoom
};
