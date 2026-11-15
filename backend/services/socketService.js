let ioInstance;

function initializeSocket(io) {
  ioInstance = io;
  io.on("connection", (socket) => {
    socket.on("join-user-room", (userId) => {
      if (typeof userId === "string") socket.join(`user:${userId}`);
    });
  });
}

function emitToUser(userId, event, payload) {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initializeSocket, emitToUser };
