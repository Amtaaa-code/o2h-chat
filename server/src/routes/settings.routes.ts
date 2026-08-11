import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

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
    const { theme, language, notifications, soundEnabled, showPreview, lastSeen, profilePhoto, readReceipts, groupInvite, wallpaper, fontSize } = req.body;
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        theme, language, notifications, soundEnabled,
        showPreview, lastSeen, profilePhoto, readReceipts, groupInvite,
        wallpaper, fontSize,
      },
      update: {
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(notifications !== undefined && { notifications }),
        ...(soundEnabled !== undefined && { soundEnabled }),
        ...(showPreview !== undefined && { showPreview }),
        ...(lastSeen !== undefined && { lastSeen }),
        ...(profilePhoto !== undefined && { profilePhoto }),
        ...(readReceipts !== undefined && { readReceipts }),
        ...(groupInvite !== undefined && { groupInvite }),
        ...(wallpaper !== undefined && { wallpaper }),
        ...(fontSize !== undefined && { fontSize }),
      },
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;