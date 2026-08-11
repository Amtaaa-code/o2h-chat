import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const statuses = await prisma.status.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: { select: { id: true, username: true, avatar: true, profile: true } },
        views: { select: { userId: true, viewedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped: Record<number, any> = {};
    for (const status of statuses) {
      if (!grouped[status.userId]) {
        grouped[status.userId] = {
          user: status.user,
          stories: [],
          hasUnviewed: false,
          latestCreatedAt: status.createdAt,
        };
      }
      grouped[status.userId].stories.push(status);
      const hasViewed = status.views.some((v) => v.userId === req.userId);
      if (!hasViewed) grouped[status.userId].hasUnviewed = true;
    }

    const groupedArray = Object.values(grouped).sort(
      (a: any, b: any) => {
        if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
        return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
      }
    );

    res.json({ success: true, data: groupedArray });
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { content, mediaUrl, mediaType, caption } = req.body;
    const status = await prisma.status.create({
      data: {
        userId: req.userId,
        content: content || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        caption: caption || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, profile: true } },
        views: { select: { userId: true } },
      },
    });
    res.status(201).json({ success: true, data: status });
  } catch (error) {
    console.error('Create status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/view', authMiddleware, async (req: any, res) => {
  try {
    await prisma.statusView.upsert({
      where: { statusId_userId: { statusId: parseInt(req.params.id), userId: req.userId } },
      create: { statusId: parseInt(req.params.id), userId: req.userId },
      update: { viewedAt: new Date() },
    });
    res.json({ success: true, message: 'Status viewed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.status.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    res.json({ success: true, message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
