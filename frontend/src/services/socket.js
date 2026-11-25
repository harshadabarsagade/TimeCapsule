import { io } from "socket.io-client";

let socket;

export function connectSocket(userId) {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "https://timecapsule-uwaq.onrender.com");
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
