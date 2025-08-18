import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer((req, res) => {
})
const io = new Server(server, {
  cors: true
})
const groupMap = {}
io.on('connection', (socket) => {
  socket.on('join', ({ name, room }) => {
    socket.join(room);
    if (groupMap[room]) {
      groupMap[room].push({ name, room, id: socket.id });
    } else {
      groupMap[room] = [{ name, room, id: socket.id }];
    }

    socket.emit('groupMap', groupMap);
    socket.broadcast.emit('groupMap', groupMap);
    io.to(room).emit('message', {
      name: '管理员',
      message: `欢迎 ${name} 加入 ${room}号聊天室`
    });
  })
  socket.on('message', ({ name, room, message }) => {
    socket.broadcast.to(room).emit('message', {
      name,
      message
    })
  })
  socket.on('disconnect', () => {
    for (const room in groupMap) {
      const info = groupMap[room].find(user => user.id === socket.id);
      groupMap[room] = groupMap[room].filter(user => user.id !== socket.id);
      // 如果房间没人了，可以选择删除这个房间
      if (groupMap[room].length === 0) {
        delete groupMap[room];
      } else {
        if (info) {
          io.to(room).emit('message', {
            name: '管理员',
            message: `${info.name}离开了房间`
          })
        }
      }
    }
    // 通知所有人分组信息更新
    io.emit('groupMap', groupMap);
  })
})
server.listen(3000, () => {
})