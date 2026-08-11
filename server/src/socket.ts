import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

export const setupSocket = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: number };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    socket.join(`user:${userId}`);

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    for (const m of memberships) {
      socket.join(`group:${m.groupId}`);
    }

    io.emit('user:online', { userId });

    const onlineUsers = await prisma.user.findMany({
      where: { isOnline: true },
      select: { id: true },
    });
    socket.emit('users:online', { userIds: onlineUsers.map(u => u.id) });

    socket.on('message:delivered', async (data) => {
      try {
        const message = data;
        const { chatType, chatId } = message;
        if (chatType === 'PRIVATE') {
          const targetUserId = parseInt(chatId);
          if (targetUserId !== userId) {
            io.to(`user:${targetUserId}`).emit('message:new', message);
          }
          try {
            const sender = await prisma.user.findUnique({
              where: { id: userId },
              include: { profile: true },
            });
            await prisma.notification.create({
              data: {
                userId: targetUserId,
                title: sender?.profile?.fullName || sender?.username || 'New Message',
                body: message.content || 'Attachment',
                type: 'MESSAGE',
                data: JSON.stringify({ chatType, chatId: String(userId), messageId: message.id }),
              },
            });
            io.to(`user:${targetUserId}`).emit('notification:new', {
              title: sender?.profile?.fullName || sender?.username,
              body: message.content || 'Attachment',
              type: 'MESSAGE',
            });
          } catch (e) { /* ignore */ }
        } else if (chatType === 'GROUP') {
          io.to(`group:${chatId}`).emit('message:new', message);
        }
      } catch (error) {
        console.error('Message deliver error:', error);
      }
    });

    socket.on('message:typing', (data) => {
      const { chatType, chatId } = data;
      if (chatType === 'PRIVATE') {
        io.to(`user:${chatId}`).emit('message:typing', { userId, chatId });
      } else {
        socket.to(`group:${chatId}`).emit('message:typing', { userId, chatId });
      }
    });

    socket.on('message:stop-typing', (data) => {
      const { chatType, chatId } = data;
      if (chatType === 'PRIVATE') {
        io.to(`user:${chatId}`).emit('message:stop-typing', { userId, chatId });
      } else {
        socket.to(`group:${chatId}`).emit('message:stop-typing', { userId, chatId });
      }
    });

    socket.on('message:read', async (data) => {
      try {
        const { messageIds, chatId, chatType } = data;
        if (!messageIds || !Array.isArray(messageIds)) return;
        for (const messageId of messageIds) {
          await prisma.messageRead.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId },
            update: { readAt: new Date() },
          });
        }
        if (chatType === 'PRIVATE') {
          io.to(`user:${chatId}`).emit('message:read', { userId, messageIds, readBy: userId });
        } else {
          io.to(`group:${chatId}`).emit('message:read', { userId, messageIds, readBy: userId });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    socket.on('message:reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const existing = await prisma.reaction.findUnique({
          where: { messageId_userId: { messageId, userId } },
        });
        if (existing) {
          if (existing.emoji === emoji) {
            await prisma.reaction.delete({ where: { id: existing.id } });
          } else {
            await prisma.reaction.update({ where: { id: existing.id }, data: { emoji } });
          }
        } else {
          await prisma.reaction.create({ data: { messageId, userId, emoji } });
        }
        const reactions = await prisma.reaction.findMany({
          where: { messageId },
          include: { user: { select: { id: true, username: true } } },
        });
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { chatType: true, chatId: true },
        });
        if (message) {
          const payload = { messageId, reactions };
          if (message.chatType === 'PRIVATE') {
            io.to(`user:${message.chatId}`).emit('message:reaction', payload);
          } else {
            io.to(`group:${message.chatId}`).emit('message:reaction', payload);
          }
        }
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { chatType: true, chatId: true, senderId: true },
        });
        if (message && message.senderId === userId) {
          await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: null },
          });
          const payload = { messageId, chatType: message.chatType, chatId: message.chatId };
          if (message.chatType === 'PRIVATE') {
            io.to(`user:${message.chatId}`).emit('message:deleted', payload);
          } else {
            io.to(`group:${message.chatId}`).emit('message:deleted', payload);
          }
        }
      } catch (error) {
        console.error('Message delete error:', error);
      }
    });

    socket.on('call:initiate', async (data) => {
      const { targetId, type } = data;
      const call = await prisma.call.create({
        data: { callerId: userId, targetId, type, status: 'OUTGOING' },
      });
      const caller = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      io.to(`user:${targetId}`).emit('call:incoming', { call, caller });
    });

    socket.on('call:accept', async (data) => {
      const { callId } = data;
      await prisma.call.update({ where: { id: callId }, data: { status: 'ACCEPTED' } });
      io.emit('call:accepted', { callId });
    });

    socket.on('call:reject', async (data) => {
      const { callId } = data;
      await prisma.call.update({ where: { id: callId }, data: { status: 'REJECTED', endedAt: new Date() } });
      io.emit('call:rejected', { callId });
    });

    socket.on('call:end', async (data) => {
      const { callId } = data;
      await prisma.call.update({ where: { id: callId }, data: { status: 'ENDED', endedAt: new Date() } });
      io.emit('call:ended', { callId });
    });

    socket.on('call:signal', (data) => {
      const { targetId, signal } = data;
      io.to(`user:${targetId}`).emit('call:signal', { userId, signal });
    });

    socket.on('group:join', (data) => {
      socket.join(`group:${data.groupId}`);
    });

    socket.on('group:leave', (data) => {
      socket.leave(`group:${data.groupId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      });
      io.emit('user:offline', { userId, lastSeenAt: new Date() });
    });
  });
};
