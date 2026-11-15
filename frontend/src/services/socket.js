import { io } from "socket.io-client";

let socket;

export function connectSocket(userId) {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
  }
  if (userId) socket.emit("join-user-room", userId);
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
