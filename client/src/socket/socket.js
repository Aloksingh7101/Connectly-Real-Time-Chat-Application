import { io } from 'socket.io-client';

let socket = null;

// A single shared socket instance for the whole app — created once on
// login, destroyed on logout. Avoids the classic bug of a new socket
// connection (and duplicate listeners) being created on every component render.
export function createSocket(token) {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    withCredentials: true,
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function destroySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
