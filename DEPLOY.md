# Deploy O2H Chat ke Railway

## Langkah 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

## Langkah 2: Login ke Railway
```bash
railway login
```

## Langkah 3: Buat Project Baru
```bash
railway init
```
Pilih "Empty Project" → beri nama `o2h-chat`

## Langkah 4: Set Environment Variables
```bash
railway variables set DATABASE_URL="postgresql://neondb_owner:..." 
railway variables set JWT_SECRET="your-secret-key"
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
railway variables set CORS_ORIGIN="https://o2h-chat.vercel.app"
```

## Langkah 5: Deploy
```bash
railway up
```

## Langkah 6: Dapatkan URL
```bash
railway domain
```
URL akan seperti: `https://o2h-chat-production.up.railway.app`

## Langkah 7: Update Vercel Env Variables
Buka Vercel Dashboard → o2h-chat → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://o2h-chat-production.up.railway.app/api
NEXT_PUBLIC_WS_URL=https://o2h-chat-production.up.railway.app
```

## Langkah 8: Redeploy Vercel
```bash
cd client && vercel --prod
```

---

## Alternatif: Deploy via GitHub (tanpa CLI)

1. Push code ke GitHub (sudah done)
2. Buka https://railway.app
3. Login dengan GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Pilih repo `Amtaa-code/o2h-chat`
6. Railway akan auto-detect Dockerfile
7. Set environment variables di dashboard Railway
8. Deploy otomatis

---

## Environment Variables yang Dibutuhkan:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host/db |
| JWT_SECRET | Secret key untuk JWT | your-super-secret-key |
| NODE_ENV | Environment | production |
| PORT | Server port | 5000 |
| CORS_ORIGIN | Frontend URL | https://o2h-chat.vercel.app |

---

## Troubleshooting

### Build gagal?
- Pastikan `DATABASE_URL` valid
- Pastikan Prisma schema benar

### Tidak bisa connect?
- Pastikan CORS_ORIGIN = URL Vercel
- Pastikan WebSocket URL benar

### Upload gambar gagal?
- Railway menggunakan `/tmp` untuk uploads
- File akan hilang saat restart (normal untuk hobby plan)
