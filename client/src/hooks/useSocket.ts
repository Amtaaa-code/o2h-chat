'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, onSocket, offSocket, emitSocket } from '@/lib/socket';
import { useAppStore } from '@/lib/store';

export const useSocket = () => {
  const { user, addOnlineUser, removeOnlineUser, setTypingUser, addMessage } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    onSocket('user:online', ({ userId }: { userId: number }) => {
      addOnlineUser(userId);
    });

    onSocket('user:offline', ({ userId }: { userId: number }) => {
      removeOnlineUser(userId);
    });

    onSocket('message:new', (message: any) => {
      addMessage(message);
    });

    onSocket('message:typing', ({ userId: typingUserId, chatId }: { userId: number; chatId: string }) => {
      setTypingUser(chatId, typingUserId, true);
    });

    onSocket('message:stop-typing', ({ userId: typingUserId, chatId }: { userId: number; chatId: string }) => {
      setTypingUser(chatId, typingUserId, false);
    });

    return () => {
      offSocket('user:online');
      offSocket('user:offline');
      offSocket('message:new');
      offSocket('message:typing');
      offSocket('message:stop-typing');
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
