import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Update online status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    // Join personal room
    socket.join(`user:${userId}`);

    // Broadcast online status
    io.emit('user:online', { userId });

    // Handle chat events
    socket.on('message:send', async (data) => {
      try {
        const { chatType, chatId, content, type, replyToId, attachments } = data;

        const message = await prisma.message.create({
          data: {
            senderId: userId,
            chatType,
            chatId,
            content: content || null,
            type: type || 'TEXT',
            replyToId,
            ...(attachments && attachments.length > 0
              ? {
                  attachments: {
                    create: attachments.map((a: any) => ({
                      filename: a.filename,
                      originalName: a.originalName,
                      mimeType: a.mimeType,
                      size: a.size,
                      url: a.url,
                    })),
                  },
                }
              : {}),
          },
          include: {
            sender: { include: { profile: true } },
            attachments: true,
            reactions: { include: { user: { select: { id: true, username: true } } } },
          },
        });

        if (chatType === 'PRIVATE') {
          io.to(`user:${chatId}`).emit('message:new', message);
          if (String(chatId) !== String(userId)) {
            io.to(`user:${userId}`).emit('message:new', message);
          }
        } else {
          io.to(`group:${chatId}`).emit('message:new', message);
        }
      } catch (error) {
        console.error('Message send error:', error);
      }
    });

    socket.on('message:delivered', (data) => {
      try {
        const { chatType, chatId } = data;
        if (chatType === 'PRIVATE') {
          const targetUserId = parseInt(chatId);
          if (targetUserId !== userId) {
            io.to(`user:${targetUserId}`).emit('message:new', data);
          }
        } else if (chatType === 'GROUP') {
          io.to(`group:${chatId}`).emit('message:new', data);
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
        io.to(`group:${chatId}`).emit('message:typing', { userId, chatId });
      }
    });

    socket.on('message:stop-typing', (data) => {
      const { chatType, chatId } = data;
      if (chatType === 'PRIVATE') {
        io.to(`user:${chatId}`).emit('message:stop-typing', { userId, chatId });
      } else {
        io.to(`group:${chatId}`).emit('message:stop-typing', { userId, chatId });
      }
    });

    socket.on('message:read', async (data) => {
      const { messageIds, chatId, chatType } = data;

      for (const messageId of messageIds) {
        await prisma.messageRead.upsert({
          where: { messageId_userId: { messageId, userId } },
          create: { messageId, userId },
          update: { readAt: new Date() },
        });
      }

      if (chatType === 'PRIVATE') {
        io.to(`user:${chatId}`).emit('message:read', { userId, messageIds });
      } else {
        io.to(`group:${chatId}`).emit('message:read', { userId, messageIds });
      }
    });

    socket.on('message:reaction', async (data) => {
      const { messageId, emoji } = data;

      const existing = await prisma.reaction.findUnique({
        where: { messageId_userId: { messageId, userId } },
      });

      if (existing) {
        if (existing.emoji === emoji) {
          await prisma.reaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.reaction.update({
            where: { id: existing.id },
            data: { emoji },
          });
        }
      } else {
        await prisma.reaction.create({
          data: { messageId, userId, emoji },
        });
      }

      io.emit('message:reaction', { messageId, userId, emoji });
    });

    socket.on('call:initiate', async (data) => {
      const { targetId, type } = data;

      const call = await prisma.call.create({
        data: {
          callerId: userId,
          targetId,
          type,
          status: 'OUTGOING',
        },
      });

      io.to(`user:${targetId}`).emit('call:incoming', {
        call,
        caller: await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        }),
      });
    });

    socket.on('call:accept', async (data) => {
      const { callId } = data;

      await prisma.call.update({
        where: { id: callId },
        data: { status: 'ACCEPTED' },
      });

      io.emit('call:accepted', { callId });
    });

    socket.on('call:reject', async (data) => {
      const { callId } = data;

      await prisma.call.update({
        where: { id: callId },
        data: { status: 'REJECTED', endedAt: new Date() },
      });

      io.emit('call:rejected', { callId });
    });

    socket.on('call:end', async (data) => {
      const { callId } = data;

      await prisma.call.update({
        where: { id: callId },
        data: { status: 'ENDED', endedAt: new Date() },
      });

      io.emit('call:ended', { callId });
    });

    socket.on('call:signal', (data) => {
      const { targetId, signal } = data;
      io.to(`user:${targetId}`).emit('call:signal', { userId, signal });
    });

    socket.on('group:join', (data) => {
      const { groupId } = data;
      socket.join(`group:${groupId}`);
    });

    socket.on('group:leave', (data) => {
      const { groupId } = data;
      socket.leave(`group:${groupId}`);
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
