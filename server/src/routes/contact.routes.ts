import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const addContactSchema = z.object({
  targetId: z.number(),
  nickname: z.string().optional(),
});

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { ownerId: req.userId },
      include: {
        target: {
          select: { id: true, email: true, username: true, avatar: true, isOnline: true, lastSeenAt: true, profile: true },
        },
      },
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, validate(addContactSchema), async (req: any, res) => {
  try {
    const { targetId, nickname } = req.body;
    
    const existing = await prisma.contact.findFirst({
      where: { ownerId: req.userId, targetId },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Contact already exists' });
    }

    const contact = await prisma.contact.create({
      data: { ownerId: req.userId, targetId, nickname },
      include: {
        target: {
          select: { id: true, email: true, username: true, avatar: true, isOnline: true, lastSeenAt: true, profile: true },
        },
      },
    });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { nickname } = req.body;
    const contact = await prisma.contact.updateMany({
      where: { id: parseInt(req.params.id), ownerId: req.userId },
      data: { nickname },
    });
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.contact.deleteMany({
      where: { id: parseInt(req.params.id), ownerId: req.userId },
    });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/block', authMiddleware, async (req: any, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: parseInt(req.params.id), ownerId: req.userId },
    });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: { isBlocked: !contact.isBlocked },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/mute', authMiddleware, async (req: any, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: parseInt(req.params.id), ownerId: req.userId },
    });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: { isMuted: !contact.isMuted },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/pin', authMiddleware, async (req: any, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: parseInt(req.params.id), ownerId: req.userId },
    });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: { isPinned: !contact.isPinned },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;