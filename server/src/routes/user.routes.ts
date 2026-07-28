import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, username: true, avatar: true, role: true, isOnline: true, lastSeenAt: true, createdAt: true, profile: true, settings: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Get /me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/me', authMiddleware, async (req: any, res) => {
  try {
    const { fullName, phoneNumber, bio, address, avatar, gender, dateOfBirth } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(avatar !== undefined && { avatar }),
        profile: {
          upsert: {
            create: { fullName: fullName || '', phoneNumber, bio, address, gender, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined },
            update: {
              ...(fullName !== undefined && { fullName }),
              ...(phoneNumber !== undefined && { phoneNumber }),
              ...(bio !== undefined && { bio }),
              ...(address !== undefined && { address }),
              ...(gender !== undefined && { gender }),
              ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
            },
          },
        },
      },
      select: { id: true, email: true, username: true, avatar: true, role: true, isOnline: true, lastSeenAt: true, createdAt: true, profile: true, settings: true },
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Update /me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.userId } },
      select: { id: true, email: true, username: true, avatar: true, isOnline: true, lastSeenAt: true, profile: true },
      take: 50,
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, email: true, username: true, avatar: true, isOnline: true, lastSeenAt: true, createdAt: true, profile: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
