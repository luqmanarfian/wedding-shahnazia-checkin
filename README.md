# 🌸 Website QR Check-in Undangan Pernikahan Offline (HTTPS Ready)
### Pernikahan Shahnazia & Damarjati

Sistem **QR Check-in Tamu Undangan Offline-First** berbasis **React + Vite** (Frontend) dan **Node.js + Express** (Backend). Dirancang khusus untuk panitia penerima tamu acara pernikahan dengan tema visual **Jawa Modern Luxury & **.

---

## 📋 1. Project Overview

Website ini digunakan oleh panitia saat hari acara untuk:
1. Melakukan scan QR Code dari fisik/digital undangan tamu menggunakan kamera HP/laptop/tablet.
2. Membaca `QR_Code_ID` dan mencari data tamu secara *real-time* dari file CSV backend lokal.
3. Menampilkan nama tamu, status RSVP, jumlah pax (jumlah tamu), dan pesan tamu.
4. Melakukan konfirmasi check-in.
5. Memperbarui kolom `check_in` pada file `data/guests.csv` secara otomatis dengan timestamp server.
6. Menjamin persistensi data meskipun browser ditutup, HP direstart, atau laptop mati.
7. Berjalan **100% Offline tanpa koneksi internet** pada jaringan lokal LAN/Wi-Fi acara.
8. **Pengamanan PIN Panitia & Mode Server Read-Only**: Melindungi akses scanner dengan PIN serta opsi menonaktifkan perubahan CSV saat website dipublikasikan ke server cloud/preview.

---

## ⚙️ 2. Konfigurasi Environment (`.env`)

Konfigurasi aplikasi diatur secara terpusat melalui file `.env`:

```env
# Set true jika dipublikasikan ke server publik (hanya bisa lihat/search, check-in ditolak)
# Set false saat dijalankan di laptop acara lokal (akses penuh Read/Write)
READ_ONLY_MODE=false

# PIN Akses Panitia untuk membuka layar scanner & dashboard
APP_PIN=1234

# Default URL Google Apps Script Web App (pilihan bawaan untuk sinkronisasi Google Sheets)
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbw-sample-wedding/exec
```

---

## 🏛️ 3. Architecture

```text
wedding-qr-checkin-v2/
├── .env                      # Konfigurasi Read-Only, PIN, & Google Script URL
├── .env.example
├── cert/                     # File sertifikat SSL (HTTPS local)
│   ├── localhost-key.pem
│   └── localhost.pem
├── data/                     # Sumber Data Utama (CSV & Backups)
│   ├── guests.csv            # Primary source of truth CSV
│   └── backups/              # Backup otomatis timestamped (Maksimal 10 backup)
├── scripts/                  # Script helper otomatisasi
│   ├── generate-cert.js      # Pembuat sertifikat SSL HTTPS lokal
│   └── seed-csv.js           # Reset/Seed data tamu CSV contoh
├── server/                   # Backend Server (Node.js + Express)
│   ├── index.js              # Entry point HTTPS server & listener IP LAN
│   ├── app.js                # Express app middleware & static router
│   ├── services/
│   │   ├── csvService.js     # Safe atomic write CSV, mutex lock & backup manager
│   │   ├── googleSyncService.js # Service Pull & Push Google Sheets
│   │   └── statsService.js   # Kalkulasi statistik dashboard
│   ├── routes/
│   │   └── guestRoutes.js    # API endpoints (/api/guest/:id, /api/checkin, /api/auth, /api/sync)
│   └── tests/
│       └── backend.test.js   # Testing otomatis logika CSV & check-in
├── src/                      # Frontend UI (React 19 + Vite)
│   ├── components/
│   │   ├── Header.jsx        # Header mewah Jawa Modern, status HTTPS & Read-Only badge
│   │   ├── PinLockScreen.jsx # Layar Kunci PIN Akses Panitia
│   │   ├── GoogleSyncModal.jsx # Modal Pull/Push/Full Sync Google Sheets
│   │   ├── StatsCard.jsx     # Card statistik realtime check-in
│   │   ├── QRScanner.jsx     # Scanner kamera HP dengan ganti kamera & cooldown
│   │   ├── CheckInModal.jsx  # Modal konfirmasi & badge "SUDAH CHECK-IN"
│   │   ├── GuestList.jsx     # Pencarian manual nama/QR ID fallback
│   │   └── JavaOrnament.jsx  # Ornamen Jawa SVG (Gunungan/Stupa)
│   ├── services/
│   │   └── api.js            # Fetch client ke Express backend
│   ├── styles/
│   │   └── globals.css       # Tailwind v4 & Jawa luxury color palette
│   ├── App.jsx               # Main container
│   └── main.jsx
├── index.html
├── package.json              # Unified npm scripts & dependencies
├── vite.config.js            # Konfigurasi Vite & Proxy API
└── README.md                 # Dokumentasi lengkap
```

---

## 💻 4. Requirements

* **Node.js**: v18.0.0 LTS atau versi lebih baru (v20+ disarankan).
* **NPM**: v9.0.0 atau lebih baru.
* **Perangkat Server**: Laptop / Mini PC (Windows, macOS, atau Linux) yang terhubung ke Router Wi-Fi lokal acara.
* **Perangkat Panitia**: HP Android, iPhone, iPad, atau Laptop panitia (memiliki kamera & browser Chrome/Safari).

---

## 🚀 5. Installation

```bash
# 1. Masuk ke direktori project
cd wedding-qr-checkin-v2

# 2. Install seluruh dependency offline
npm install
```

---

## 🔑 6. Layar Kunci PIN & Pengamanan Akses

1. Saat pertama kali mengakses website, pengguna akan disambut oleh **Layar Kunci PIN Akses Panitia**.
2. Masukkan PIN yang terdaftar di `.env` (Default: `1234`).
3. Sesi login tersimpan pada `sessionStorage` browser HP panitia.
4. Panitia dapat mengunci kembali aplikasi kapan saja dengan menekan icon **Gembok / Kunci** di kanan atas Header.

---

## 📄 7. Mode Server Read-Only vs Read/Write

Sistem mendukung **Mode Read-Only Server** yang paling efisien menggunakan variabel environment `.env`:

* **Saat Dideploy di Cloud / Public Preview Server**:
  Atur `READ_ONLY_MODE=true` di `.env`. Website akan dapat diakses publik untuk pencarian nama/QR ID, namun tombol check-in dan Push ke Google Sheets ditolak dengan pesan yang ramah.
* **Saat Dijalankan di Laptop Acara Lokal (Hari H)**:
  Atur `READ_ONLY_MODE=false` di `.env`. Semua fungsi check-in lokal dan sinkronisasi berjalan penuh.

---

## 🌐 8. Sinkronisasi Google Sheets (Hybrid Mode)

Aplikasi dapat menyinkronkan data tamu antara Google Sheets dan CSV lokal:

1. Buka Google Sheet: `https://docs.google.com/spreadsheets/d/1wAe06qhJB6JIFcvSbtLLof7kMU5Ddbxtakj7l7su0e0`
2. Pasang/Update [google-apps-script.js](file:///c:/myfolder/gabut/wedding-react-pslamet/wedding-qr-checkin-v2/google-apps-script.js) pada Google Apps Script.
3. Di website scanner, klik tombol **Sheets Sync** pada Header.
4. Pilih tindakan:
   - **PULL**: Mengambil RSVP terbaru dari Google Sheets ke CSV lokal.
   - **PUSH**: Mengirimkan data check-in lokal ke Google Sheets.
   - **FULL SYNC**: Melakukan Pull + Push sekaligus.

---

## 📊 9. Struktur CSV

File data tamu disimpan di `data/guests.csv`:

```csv
Waktu,Nama Tamu,status,Jumlah Tamu,Pesan singkat Tamu,QR_Code_ID,check_in
2026-08-07 18:34:12,Tamu Undangan Fisik,Hadir,1,Untuk Tamu dengan undangan fisik,WEDDING-1786102448594-1048,
2026-08-20 19:24:10,luqman,Hadir,1,Selamat yaaa,WEDDING-1787228648694-4738,2026-08-20 19:25:35
```

---

## 🔒 10. Certificate HTTPS Lokal

```bash
npm run generate-cert
```

Akan menghasilkan `cert/localhost-key.pem` dan `cert/localhost.pem` untuk akses HTTPS via LAN IP.

---

## 🛠️ 11. Cara Menjalankan

### Development Mode:
```bash
npm run dev
```

### Production / Hari H Acara:
```bash
npm run build
npm run start
```

---

## 📱 12. Akses via Wi-Fi/LAN HP Panitia

Buka browser HP dan akses IP server lokal yang muncul saat `npm run start`, contoh:
```text
https://192.168.1.10:3000
```

---

*Selamat Atas Pernikahan **Shahnazia & Damarjati**! Semoga Acara Berjalan Lancar & Khidmat.* 🌸
