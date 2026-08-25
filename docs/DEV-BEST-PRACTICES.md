Dev Best Practices — wedding-qr-checkin-v2
========================================

Ringkasan singkat
- Gunakan protokol yang konsisten (HTTP atau HTTPS) antara frontend dev server dan backend API.
- Untuk development dengan HTTPS lokal, pakai sertifikat trusted (mkcert) atau Vite/Node self-signed + proxy `secure: false` (dev-only).
- Set `VITE_API_URL` di env untuk memisahkan target API antara dev/production.

Quick fixes untuk error "Parse Error: Expected HTTP/..."
1. Pastikan backend berjalan di protokol yang sama yang dipakai proxy. Jika backend HTTPS, ubah `proxy.target` menjadi `https://localhost:3000`.
2. Untuk self-signed cert selama development, tetap `secure: false` di `vite.config.js`.
3. Alternatif cepat: jalankan backend HTTP selama dev (hapus/move `cert/`) sehingga `http://localhost:3000` valid.

Praktik yang disarankan
- Development
  - Gunakan env vars dan fallbacks: buat `.env` / `.env.local` dengan `VITE_API_URL=https://localhost:3000`.
  - Di `vite.config.js` gunakan env var untuk proxy target:

    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false, // dev only for self-signed
      }
    }

  - Untuk HTTPS lokal yang tidak memicu peringatan browser, pasang mkcert (recommended) dan gunakan sertifikat yang trusted.

- Production
  - Build frontend (`vite build`) dan serve statis dari backend (satu origin) atau terminate TLS di reverse proxy (nginx) sehingga frontend dan API berbagi origin.
  - Jangan gunakan `secure: false` di produksi.

Security & deployment notes
- `secure: false` hanya untuk development dengan self-signed cert.
- Jika perlu test dari perangkat lain di LAN, gunakan cert yang trusted atau tambahkan exception secara manual — mkcert memudahkan ini.

Commands & tips
- Generate local cert (project includes a script):

```bash
npm run generate-cert
```

- Start dev (runs both):

```bash
npm run dev
```

- If you prefer simple dev without HTTPS, remove or rename `cert/` then restart `npm run dev` so server runs HTTP and proxy `http://localhost:3000` works.

Want me to add a sample `.env` and update `vite.config.js` to read `VITE_API_URL`? Reply `ya` and saya lakukan.
