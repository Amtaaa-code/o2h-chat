import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/:chatType/:chatId', authMiddleware, async (req: any, res) => {
  try {
    const { chatType, chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: { chatType: chatType as any, chatId },
      include: {
        sender: { select: { id: true, username: true, avatar: true, profile: true } },
        attachments: true,
        replies: {
          include: { sender: { select: { id: true, username: true, avatar: true } } },
        },
        reactions: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        reads: { include: { user: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { chatType, chatId, content, type, replyToId, attachments } = req.body;
    const message = await prisma.message.create({
      data: {
        senderId: req.userId,
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
        sender: { select: { id: true, username: true, avatar: true, profile: true } },
        attachments: true,
      },
    });
    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    console.error('Create message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { content } = req.body;
    const message = await prisma.message.update({
      where: { id: parseInt(req.params.id), senderId: req.userId },
      data: { content, isEdited: true },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
      },
    });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.message.update({
      where: { id: parseInt(req.params.id) },
      data: { isDeleted: true, content: null },
    });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/pin', authMiddleware, async (req: any, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { isPinned: !message.isPinned },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;