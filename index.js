const http = require("http");
const socketIO = require("socket.io");
const port = process.env.port || 5000;

//Setup http server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`<p>Server running on port ${port}</p>`);
});

server.listen(port, (req, res) => {
  console.log("Server running on port ", port);
});

//Setup socket.io
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connect: ", socket.id);

  socket.on("join", (user) => {
    const room = user.room;
    console.log(`user (${socket.id}) join room (${room})`);

    socket.join(room);

    socket.data = {
      id: socket.id,
      ...user,
    };

    updateRoom(room);
  });

  socket.on("message", (data) => {
    io.to(data.to).emit("message", data);
  });

  socket.on("leave", (room) => {
    socket.leave(room);
    updateRoom(room);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnect: ", socket.id);
  });

  function updateRoom(room) {
    io.in(room)
      .fetchSockets()
      .then((clients) => {
        const users = clients.map((client) => client.data);
        io.to(room).emit("room-updated", users);
      });
  }
});
