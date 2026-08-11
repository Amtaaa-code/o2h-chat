import { Router } from 'express';

const router = Router();

// Seed route removed - admin is auto-seeded on server startup in index.ts
router.post('/', (_req, res) => {
  res.status(410).json({ success: false, message: 'This endpoint has been removed for security reasons' });
});

export default router;
