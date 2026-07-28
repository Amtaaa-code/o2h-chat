import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const calls = await prisma.call.findMany({
      where: { OR: [{ callerId: req.userId }, { targetId: req.userId }] },
      include: {
        caller: { select: { id: true, username: true, avatar: true, profile: true } },
        target: { select: { id: true, username: true, avatar: true, profile: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;