const test = require('node:test');
const assert = require('node:assert/strict');
const ioClient = require('socket.io-client');
process.env.NODE_ENV = 'test';
const { server } = require('../server.js');

let testPort = 4057;
let serverUrl = `http://localhost:${testPort}`;

test.before(async () => {
  await new Promise((resolve) => server.listen(testPort, resolve));
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. 單人 (N=1) 開局與流程測試', async () => {
  await new Promise((resolve, reject) => {
    const client = ioClient(serverUrl);

    client.on('connect', () => {
      client.emit('create_room', { playerName: 'SoloPlayer' });
    });

    client.on('room_created', ({ roomId, player, roomState }) => {
      assert.equal(roomState.players.length, 1);
      assert.equal(player.name, 'SoloPlayer');
      assert.equal(player.isHost, true);

      client.emit('start_game', { roomId });
    });

    client.on('start_setting_answers', ({ durationSec, roomState }) => {
      assert.equal(roomState.state, 'SETTING_ANSWERS');
      assert.equal(durationSec, 60);

      client.emit('submit_answer', { roomId: roomState.roomId, answer: '1234' });
    });

    client.on('start_round', ({ round, durationSec, roomState }) => {
      assert.equal(round, 1);
      assert.equal(durationSec, 60);
      assert.equal(roomState.players[0].targetName, '🤖 系統 AI');
      client.disconnect();
      resolve();
    });

    setTimeout(() => {
      client.disconnect();
      reject(new Error('Test timeout'));
    }, 3000);
  });
});

test('2. 超過 6 人 (如 N=8 人) 無上限加入同房測試', async () => {
  await new Promise((resolve, reject) => {
    const host = ioClient(serverUrl);
    const clients = [];
    const totalPlayers = 8;
    let targetRoomId = null;

    host.on('connect', () => {
      host.emit('create_room', { playerName: 'HostPlayer' });
    });

    host.on('room_created', ({ roomId }) => {
      targetRoomId = roomId;

      for (let i = 2; i <= totalPlayers; i++) {
        const c = ioClient(serverUrl);
        clients.push(c);
        c.on('connect', () => {
          c.emit('join_room', { roomId: targetRoomId, playerName: `Player_${i}` });
        });
      }
    });

    host.on('room_updated', (roomState) => {
      if (roomState.players.length === totalPlayers) {
        assert.equal(roomState.players.length, 8);
        host.disconnect();
        clients.forEach(c => c.disconnect());
        resolve();
      }
    });

    setTimeout(() => {
      host.disconnect();
      clients.forEach(c => c.disconnect());
      reject(new Error('Multiplayer join timeout'));
    }, 4000);
  });
});

test('3. 三人答對即提早結束遊戲規則 (3 Players Completed -> Early Game Over)', async () => {
  await new Promise((resolve, reject) => {
    const host = ioClient(serverUrl);
    const clients = [];
    const totalPlayers = 5;
    let targetRoomId = null;

    host.on('connect', () => {
      host.emit('create_room', { playerName: 'Player_1' });
    });

    host.on('room_created', ({ roomId }) => {
      targetRoomId = roomId;

      for (let i = 2; i <= totalPlayers; i++) {
        const c = ioClient(serverUrl);
        clients.push(c);
        c.on('connect', () => {
          c.emit('join_room', { roomId: targetRoomId, playerName: `Player_${i}` });
        });
      }
    });

    host.on('room_updated', (roomState) => {
      if (roomState.players.length === totalPlayers && roomState.state === 'LOBBY') {
        host.emit('start_game', { roomId: targetRoomId });
      }
    });

    host.on('start_setting_answers', () => {
      host.emit('submit_answer', { roomId: targetRoomId, answer: '1234' });
      clients.forEach(c => {
        c.emit('submit_answer', { roomId: targetRoomId, answer: '1234' });
      });
    });

    host.on('start_round', () => {
      host.emit('submit_guess', { roomId: targetRoomId, guess: '1234' });
      clients[0].emit('submit_guess', { roomId: targetRoomId, guess: '1234' });
      clients[1].emit('submit_guess', { roomId: targetRoomId, guess: '1234' });
    });

    host.on('game_over', ({ leaderboard, championName, roomState }) => {
      assert.equal(roomState.state, 'ENDED');
      const completedCount = leaderboard.filter(p => p.completed).length;
      assert.equal(completedCount, 3);
      
      leaderboard.forEach(p => {
        assert.ok(p.targetAnswer);
      });

      host.disconnect();
      clients.forEach(c => c.disconnect());
      resolve();
    });

    setTimeout(() => {
      host.disconnect();
      clients.forEach(c => c.disconnect());
      reject(new Error('3-winner early game over test timeout'));
    }, 5000);
  });
});
