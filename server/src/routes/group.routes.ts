import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.number().int().positive()).optional(),
});

const addMembersSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1),
});

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, username: true, avatar: true, isOnline: true } } } },
      },
    });

    const groupsWithMeta = await Promise.all(groups.map(async (group) => {
      const lastMsg = await prisma.groupMessage.findFirst({
        where: { groupId: group.id },
        include: { sender: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return {
        ...group,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt.toISOString(), sender: { username: lastMsg.sender.username } } : null,
        unreadCount: 0,
      };
    }));

    res.json({ success: true, data: groupsWithMeta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, validate(createGroupSchema), async (req: any, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const group = await prisma.group.create({
      data: {
        name,
        description,
        creatorId: req.userId,
        members: {
          create: [
            { userId: req.userId, role: 'ADMIN' },
            ...memberIds.map((id: number) => ({ userId: id, role: 'MEMBER' as const })),
          ],
        },
      },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, username: true, avatar: true } } } },
      },
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, username: true, avatar: true, isOnline: true } } } },
      },
    });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!membership) return res.status(403).json({ success: false, message: 'Only admin or owner can edit group' });

    const { name, description, avatar } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (avatar !== undefined) updateData.avatar = avatar;

    const group = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
    });

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/members', authMiddleware, validate(addMembersSchema), async (req: any, res) => {
  try {
    const { userIds } = req.body;
    const groupId = parseInt(req.params.id);
    
    const adminCheck = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId, role: { in: ['ADMIN', 'OWNER'] } },
    });
    if (!adminCheck) return res.status(403).json({ success: false, message: 'Only admins can add members' });
    
    const members = await Promise.all(
      userIds.map((userId: number) =>
        prisma.groupMember.create({
          data: { groupId, userId, role: 'MEMBER' },
          include: { user: { select: { id: true, username: true, avatar: true } } },
        })
      )
    );
    res.status(201).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id/members/:memberId', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    
    const adminCheck = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId, role: { in: ['ADMIN', 'OWNER'] } },
    });
    if (!adminCheck) return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    
    await prisma.groupMember.deleteMany({
      where: { groupId, userId: memberId },
    });
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/leave', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (!membership) return res.status(404).json({ success: false, message: 'Not a member of this group' });
    if (membership.role === 'OWNER') return res.status(400).json({ success: false, message: 'Owner cannot leave group. Transfer ownership first.' });

    await prisma.groupMember.delete({ where: { id: membership.id } });
    res.json({ success: true, message: 'Left group' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/kick', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { userId: targetUserId } = req.body;

    const caller = await prisma.groupMember.findFirst({ where: { groupId, userId: req.userId } });
    if (!caller || (caller.role !== 'OWNER' && caller.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can kick members' });
    }

    const target = await prisma.groupMember.findFirst({ where: { groupId, userId: targetUserId } });
    if (!target) return res.status(404).json({ success: false, message: 'User not in group' });
    if (target.role === 'OWNER') return res.status(403).json({ success: false, message: 'Cannot kick the owner' });

    await prisma.groupMember.delete({ where: { id: target.id } });
    res.json({ success: true, message: 'Member kicked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/promote', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { userId: targetUserId } = req.body;

    const caller = await prisma.groupMember.findFirst({ where: { groupId, userId: req.userId } });
    if (!caller || caller.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only owner can promote members' });
    }

    const target = await prisma.groupMember.findFirst({ where: { groupId, userId: targetUserId } });
    if (!target) return res.status(404).json({ success: false, message: 'User not in group' });

    await prisma.groupMember.update({
      where: { id: target.id },
      data: { role: target.role === 'ADMIN' ? 'MEMBER' : 'ADMIN' },
    });

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.group.deleteMany({
      where: { id: parseInt(req.params.id), creatorId: req.userId },
    });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id/invite', authMiddleware, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member' });
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admin or owner can generate invite links' });
    }

    const inviteToken = `group_${groupId}_${Date.now()}`;
    res.json({ success: true, data: { inviteLink: `/chat/join/${inviteToken}`, token: inviteToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/join/:token', authMiddleware, async (req: any, res) => {
  try {
    const token = req.params.token;
    const groupId = parseInt(token.split('_')[1]);
    if (!groupId) return res.status(400).json({ success: false, message: 'Invalid invite token' });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const existing = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (existing) return res.json({ success: true, message: 'Already a member' });

    await prisma.groupMember.create({
      data: { groupId, userId: req.userId, role: 'MEMBER' },
    });

    res.json({ success: true, message: 'Joined group', data: { groupId, name: group.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;