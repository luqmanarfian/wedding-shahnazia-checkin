import express from 'express';
import {
  findGuestByQrId,
  performCheckIn,
  getStats,
  readGuestsCSV,
} from '../services/csvService.js';
import {
  pullFromGoogleSheets,
  pushToGoogleSheets,
  fullSyncGoogleSheets,
} from '../services/googleSyncService.js';

const router = express.Router();

// Helper to check read-only mode from environment
function isReadOnlyMode() {
  return process.env.READ_ONLY_MODE === 'true';
}

// Helper to get configured PIN
function getAppPin() {
  return process.env.APP_PIN || '1234';
}

// Helper to get default Google Script Web App URL
function getDefaultGoogleUrl() {
  return process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw-sample-wedding/exec';
}

// GET /api/config
router.get('/config', (req, res) => {
  return res.json({
    success: true,
    isReadOnly: isReadOnlyMode(),
    pinRequired: true,
    defaultGoogleUrl: getDefaultGoogleUrl(),
  });
});

// POST /api/auth/verify-pin
router.post('/auth/verify-pin', (req, res) => {
  try {
    const { pin } = req.body || {};
    const validPin = getAppPin();

    if (String(pin).trim() === String(validPin).trim()) {
      return res.json({
        success: true,
        message: 'PIN Akses Benar',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'PIN Akses Salah. Silakan coba lagi.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi PIN.',
    });
  }
});

// GET /api/guest/:qrCodeId
router.get('/guest/:qrCodeId', (req, res) => {
  try {
    const { qrCodeId } = req.params;
    if (!qrCodeId || !qrCodeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'QR Code ID tidak valid',
      });
    }

    const guest = findGuestByQrId(qrCodeId);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Tamu tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error('Error in GET /api/guest/:qrCodeId:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
});

// POST /api/checkin
router.post('/checkin', async (req, res) => {
  try {
    // Read-Only Enforcement
    if (isReadOnlyMode()) {
      return res.status(403).json({
        success: false,
        isReadOnly: true,
        message: 'Server dalam mode Read-Only. Perubahan check-in ditolak di server ini.',
      });
    }

    const { qrCodeId } = req.body || {};

    if (!qrCodeId || typeof qrCodeId !== 'string' || !qrCodeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'QR Code ID wajib diisi',
      });
    }

    const result = await performCheckIn(qrCodeId);

    if (!result.success) {
      if (result.alreadyCheckedIn) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /api/checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan check-in',
    });
  }
});

// GET /api/stats
router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data statistik',
    });
  }
});

// GET /api/guests (with optional ?query= search)
router.get('/guests', (req, res) => {
  try {
    const { query } = req.query;
    let guests = readGuestsCSV();

    if (query && typeof query === 'string' && query.trim() !== '') {
      const q = query.trim().toLowerCase();
      guests = guests.filter(
        (g) =>
          g.namaTamu.toLowerCase().includes(q) ||
          g.qrCodeId.toLowerCase().includes(q) ||
          g.pesan.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: guests.length,
      guests,
    });
  } catch (error) {
    console.error('Error in GET /api/guests:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar tamu',
    });
  }
});

// POST /api/sync/pull (Pull RSVPs from Google Sheets to local CSV)
router.post('/sync/pull', async (req, res) => {
  try {
    const webAppUrl = req.body?.webAppUrl || getDefaultGoogleUrl();
    const result = await pullFromGoogleSheets(webAppUrl);
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/sync/pull:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan pull dari Google Sheets.',
    });
  }
});

// POST /api/sync/push (Push local CSV check-ins to Google Sheets)
router.post('/sync/push', async (req, res) => {
  try {
    if (isReadOnlyMode()) {
      return res.status(403).json({
        success: false,
        isReadOnly: true,
        message: 'Mode Read-Only aktif. Push ke Google Sheets ditolak.',
      });
    }

    const webAppUrl = req.body?.webAppUrl || getDefaultGoogleUrl();
    const result = await pushToGoogleSheets(webAppUrl);
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/sync/push:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan push ke Google Sheets.',
    });
  }
});

// POST /api/sync/full (Bidirectional Sync)
router.post('/sync/full', async (req, res) => {
  try {
    const webAppUrl = req.body?.webAppUrl || getDefaultGoogleUrl();
    const result = await fullSyncGoogleSheets(webAppUrl);
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/sync/full:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan full sync Google Sheets.',
    });
  }
});

export default router;
