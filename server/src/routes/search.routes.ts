import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query required' });

    const query = q as string;

    if (type === 'users' || !type) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
            { email: { contains: query } },
            { profile: { fullName: { contains: query } } },
          ],
          id: { not: req.userId },
        },
        select: { id: true, username: true, email: true, avatar: true, profile: true },
        take: 20,
      });
      return res.json({ success: true, data: users });
    }

    if (type === 'messages') {
      const messages = await prisma.message.findMany({
        where: { content: { contains: query }, senderId: req.userId },
        include: { sender: { select: { id: true, username: true, avatar: true } } },
        take: 50,
      });
      return res.json({ success: true, data: messages });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;