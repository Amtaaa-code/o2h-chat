import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/read', authMiddleware, async (req: any, res) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (notification.userId !== req.userId) return res.status(403).json({ success: false, message: 'Not authorized' });
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/read-all', authMiddleware, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;