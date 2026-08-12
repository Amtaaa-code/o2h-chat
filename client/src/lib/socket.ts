import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'https://o2h-chat-production.up.railway.app', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    socket.on('reconnect', (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server forced disconnect, try reconnecting
        setTimeout(() => {
          const token = localStorage.getItem('accessToken');
          if (token && socket) {
            socket.auth = { token };
            socket.connect();
          }
        }, 2000);
      }
    });
  }
  return socket;
};

export const updateSocketToken = (newToken: string) => {
  if (socket) {
    socket.auth = { token: newToken };
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const emitSocket = (event: string, data?: any) => {
  if (socket?.connected) {
    socket.emit(event, data);
  }
};

export const onSocket = (event: string, callback: (...args: any[]) => void) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const offSocket = (event: string, callback?: (...args: any[]) => void) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};
