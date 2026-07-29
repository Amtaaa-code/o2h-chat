import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contactRoutes from './routes/contact.routes';
import messageRoutes from './routes/message.routes';
import groupRoutes from './routes/group.routes';
import callRoutes from './routes/call.routes';
import statusRoutes from './routes/status.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import settingsRoutes from './routes/settings.routes';
import searchRoutes from './routes/search.routes';
import seedRoutes from './routes/seed.routes';
import { setupSocket } from './socket';

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://o2h-chat.vercel.app',
  'http://localhost:3000',
].filter(Boolean) as string[];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/seed', seedRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Setup Socket.IO
setupSocket(io);

// Auto-seed admin user on startup
async function seedAdmin() {
  try {
    const bcrypt = await import('bcryptjs');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const email = 'admin@o2h.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.default.hash('admin123', 12);
      await prisma.user.create({
        data: {
          email,
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN',
          profile: { create: { fullName: 'Admin' } },
        },
      });
      console.log('✅ Admin user seeded: admin@o2h.com / admin123');
    } else {
      // Ensure password is correct
      const valid = await bcrypt.default.compare('admin123', existing.password);
      if (!valid) {
        const hashedPassword = await bcrypt.default.hash('admin123', 12);
        await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
        console.log('✅ Admin password updated');
      } else {
        console.log('ℹ️ Admin user already exists and password is valid');
      }
    }
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('⚠️ Seed error:', error.message);
  }
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 O2H Server running on port ${PORT}`);
  await seedAdmin();
});

export { io };
