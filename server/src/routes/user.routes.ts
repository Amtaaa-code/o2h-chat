import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

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

router.put('/me/password', authMiddleware, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    await prisma.session.deleteMany({ where: { userId: req.userId } });
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/me', authMiddleware, async (req: any, res) => {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }
    await prisma.session.deleteMany({ where: { userId: req.userId } });
    await prisma.notification.deleteMany({ where: { userId: req.userId } });
    await prisma.reaction.deleteMany({ where: { user: { id: req.userId } } });
    await prisma.messageRead.deleteMany({ where: { userId: req.userId } });
    await prisma.statusView.deleteMany({ where: { userId: req.userId } });
    await prisma.status.deleteMany({ where: { userId: req.userId } });
    await prisma.contact.deleteMany({ where: { OR: [{ ownerId: req.userId }, { targetId: req.userId }] } });
    await prisma.groupMember.deleteMany({ where: { userId: req.userId } });
    await prisma.profile.deleteMany({ where: { userId: req.userId } });
    await prisma.userSettings.deleteMany({ where: { userId: req.userId } });
    await prisma.message.updateMany({ where: { senderId: req.userId }, data: { isDeleted: true, content: null } });
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
