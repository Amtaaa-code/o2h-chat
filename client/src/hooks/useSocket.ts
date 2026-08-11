'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket, onSocket, offSocket, emitSocket } from '@/lib/socket';
import { useAppStore } from '@/lib/store';

export const useSocket = () => {
  const { user, addOnlineUser, removeOnlineUser, setTypingUser, addMessage, updateMessage, setOnlineUsers } = useAppStore();
  const typingTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleOnline = ({ userId }: { userId: number }) => {
      addOnlineUser(userId);
    };

    const handleOffline = ({ userId }: { userId: number }) => {
      removeOnlineUser(userId);
    };

    const handleUsersOnline = ({ userIds }: { userIds: number[] }) => {
      setOnlineUsers(userIds);
    };

    const handleMessageNew = (message: any) => {
      addMessage(message);
    };

    const handleTyping = ({ userId: typingUserId, chatId }: { userId: number; chatId: string }) => {
      setTypingUser(chatId, typingUserId, true);
      // Auto-clear typing after 5 seconds
      const key = `${chatId}:${typingUserId}`;
      if (typingTimersRef.current[key]) clearTimeout(typingTimersRef.current[key]);
      typingTimersRef.current[key] = setTimeout(() => {
        setTypingUser(chatId, typingUserId, false);
      }, 5000);
    };

    const handleStopTyping = ({ userId: typingUserId, chatId }: { userId: number; chatId: string }) => {
      setTypingUser(chatId, typingUserId, false);
      const key = `${chatId}:${typingUserId}`;
      if (typingTimersRef.current[key]) {
        clearTimeout(typingTimersRef.current[key]);
        delete typingTimersRef.current[key];
      }
    };

    const handleRead = ({ messageIds, readBy }: { messageIds: number[]; readBy: number }) => {
      for (const messageId of messageIds) {
        updateMessage(messageId, {
          reads: [{ userId: readBy, readAt: new Date().toISOString() }],
        });
      }
    };

    const handleReaction = ({ messageId, reactions }: { messageId: number; reactions: any[] }) => {
      updateMessage(messageId, { reactions });
    };

    const handleDeleted = ({ messageId }: { messageId: number }) => {
      updateMessage(messageId, { isDeleted: true, content: null });
    };

    onSocket('user:online', handleOnline);
    onSocket('user:offline', handleOffline);
    onSocket('users:online', handleUsersOnline);
    onSocket('message:new', handleMessageNew);
    onSocket('message:typing', handleTyping);
    onSocket('message:stop-typing', handleStopTyping);
    onSocket('message:read', handleRead);
    onSocket('message:reaction', handleReaction);
    onSocket('message:deleted', handleDeleted);

    return () => {
      offSocket('user:online', handleOnline);
      offSocket('user:offline', handleOffline);
      offSocket('users:online', handleUsersOnline);
      offSocket('message:new', handleMessageNew);
      offSocket('message:typing', handleTyping);
      offSocket('message:stop-typing', handleStopTyping);
      offSocket('message:read', handleRead);
      offSocket('message:reaction', handleReaction);
      offSocket('message:deleted', handleDeleted);
      // Clear all typing timers
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      typingTimersRef.current = {};
    };
  }, [user]);

  const sendMessage = useCallback((data: any) => {
    emitSocket('message:send', data);
  }, []);

  const startTyping = useCallback((chatType: string, chatId: string) => {
    emitSocket('message:typing', { chatType, chatId });
  }, []);

  const stopTyping = useCallback((chatType: string, chatId: string) => {
    emitSocket('message:stop-typing', { chatType, chatId });
  }, []);

  const markAsRead = useCallback((messageIds: number[], chatId: string, chatType: string) => {
    emitSocket('message:read', { messageIds, chatId, chatType });
  }, []);

  return { sendMessage, startTyping, stopTyping, markAsRead, emitSocket };
};
