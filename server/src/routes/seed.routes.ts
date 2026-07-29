import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (_req, res) => {
  try {
    const email = 'admin@o2h.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        email,
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        profile: {
          create: {
            fullName: 'Admin',
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Admin user seeded successfully',
      data: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
