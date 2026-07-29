import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'https://o2h-chat-64de.onbelmo.uk', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
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
