import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: req.userId } });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/', authMiddleware, async (req: any, res) => {
  try {
    const { theme, language, notifications, soundEnabled, wallpaper, fontSize } = req.body;
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, theme, language, notifications, soundEnabled, wallpaper, fontSize },
      update: { theme, language, notifications, soundEnabled, wallpaper, fontSize },
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;