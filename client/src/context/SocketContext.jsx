import { createContext, useContext, useEffect, useState } from 'react';
import { createSocket, destroySocket } from '../socket/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      destroySocket();
      setSocket(null);
      return;
    }

    // No token needed here — the socket handshake carries the browser's
    // httpOnly auth cookie automatically (withCredentials: true), and
    // socketAuth.js on the server falls back to reading it from there.
    const s = createSocket();
    setSocket(s);

    return () => {
      // Only tear down when the user actually logs out (handled by the
      // `if (!user)` branch above) — not on every re-render, which is
      // why `user` (not `socket`) is the effect's dependency.
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
