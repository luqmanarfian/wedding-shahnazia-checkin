import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const CSV_FILE = path.join(DATA_DIR, 'guests.csv');
const MAX_BACKUPS = 10;

// Simple internal promise-based Mutex queue to prevent write race conditions
class SimpleMutex {
  constructor() {
    this._queue = Promise.resolve();
  }

  runExclusive(task) {
    const result = this._queue.then(() => task());
    this._queue = result.catch(() => {});
    return result;
  }
}

const csvMutex = new SimpleMutex();

// Ensure data directories exist
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

/**
 * Robust Quote-Aware Multiline CSV Parser
 * Handles multiline quoted fields, escaped quotes, and commas inside text
 */
function parseFullCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Format string field for CSV with proper quoting if contains commas or quotes
 */
function formatCSVField(val) {
  if (val === null || val === undefined) return '';
  // Clean multiline newlines inside single fields to ensure clean CSV structure
  const str = String(val).replace(/[\r\n]+/g, ' ').trim();
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Read and parse guests CSV with full multiline quote-aware support
 */
export function readGuestsCSV() {
  ensureDirectories();
  if (!fs.existsSync(CSV_FILE)) {
    return [];
  }

  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseFullCSV(content);

  if (rows.length < 2) return []; // Header only or empty

  const headers = rows[0];

  const guests = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const raw = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const qrCodeId = (raw['QR_Code_ID'] || raw['qrCodeId'] || '').trim();
    if (!qrCodeId) continue;

    guests.push({
      waktu: (raw['Waktu'] || raw['waktu'] || '').trim(),
      namaTamu: (raw['Nama Tamu'] || raw['namaTamu'] || '').trim(),
      status: (raw['status'] || raw['Status'] || 'Hadir').trim(),
      jumlahTamu: parseInt(raw['Jumlah Tamu'] || raw['jumlahTamu'] || '1', 10) || 1,
      pesan: (raw['Pesan singkat Tamu'] || raw['pesan'] || '').replace(/[\r\n]+/g, ' ').trim(),
      qrCodeId: qrCodeId,
      checkIn: (raw['check_in'] || raw['checkIn'] || '').trim(),
    });
  }

  return guests;
}

/**
 * Clean old backups beyond MAX_BACKUPS limit
 */
function pruneBackups() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const files = fs
      .readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith('guests-') && f.endsWith('.csv'))
      .sort();

    while (files.length > MAX_BACKUPS) {
      const oldest = files.shift();
      fs.unlinkSync(path.join(BACKUPS_DIR, oldest));
    }
  } catch (err) {
    console.error('Error pruning backups:', err.message);
  }
}

/**
 * Safely write guests to CSV using temp file, atomic replacement, and automated backup
 */
export function writeGuestsCSV(guests) {
  return csvMutex.runExclusive(() => {
    ensureDirectories();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0]; // YYYYMMDD-HHmmss

    // 1. Create Backup if primary CSV exists
    if (fs.existsSync(CSV_FILE)) {
      const backupPath = path.join(BACKUPS_DIR, `guests-${timestamp}.csv`);
      fs.copyFileSync(CSV_FILE, backupPath);
      pruneBackups();
    }

    // 2. Build CSV Content
    const header = ['Waktu', 'Nama Tamu', 'status', 'Jumlah Tamu', 'Pesan singkat Tamu', 'QR_Code_ID', 'check_in'];
    const lines = [header.join(',')];

    guests.forEach((g) => {
      const row = [
        formatCSVField(g.waktu),
        formatCSVField(g.namaTamu),
        formatCSVField(g.status),
        formatCSVField(g.jumlahTamu),
        formatCSVField(g.pesan),
        formatCSVField(g.qrCodeId),
        formatCSVField(g.checkIn),
      ];
      lines.push(row.join(','));
    });

    const csvData = lines.join('\n') + '\n';
    const tempFile = path.join(DATA_DIR, `guests.csv.tmp.${Date.now()}`);

    // 3. Write to temporary file
    fs.writeFileSync(tempFile, csvData, 'utf-8');

    // 4. Atomic Rename to replace main CSV file safely
    fs.renameSync(tempFile, CSV_FILE);

    return true;
  });
}

/**
 * Search guest by QR Code ID
 */
export function findGuestByQrId(qrCodeId) {
  if (!qrCodeId) return null;
  const cleanId = String(qrCodeId).trim();
  const guests = readGuestsCSV();
  return guests.find((g) => g.qrCodeId === cleanId) || null;
}

/**
 * Format timestamp for check-in: YYYY-MM-DD HH:mm:ss
 */
function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

/**
 * Check-in guest by QR_Code_ID
 */
export async function performCheckIn(qrCodeId) {
  if (!qrCodeId || !String(qrCodeId).trim()) {
    return {
      success: false,
      message: 'QR Code ID tidak boleh kosong',
    };
  }

  const cleanId = String(qrCodeId).trim();
  const guests = readGuestsCSV();
  const guestIndex = guests.findIndex((g) => g.qrCodeId === cleanId);

  if (guestIndex === -1) {
    return {
      success: false,
      message: 'Tamu tidak ditemukan',
    };
  }

  const guest = guests[guestIndex];

  // Check if already checked in
  if (guest.checkIn && guest.checkIn.trim() !== '') {
    return {
      success: false,
      alreadyCheckedIn: true,
      message: 'Tamu sudah melakukan check-in',
      guest: {
        namaTamu: guest.namaTamu,
        jumlahTamu: guest.jumlahTamu,
        qrCodeId: guest.qrCodeId,
        checkIn: guest.checkIn,
        status: guest.status,
        pesan: guest.pesan,
        waktu: guest.waktu,
      },
    };
  }

  // Record check-in timestamp
  const checkInTimestamp = getFormattedTimestamp();
  guests[guestIndex].checkIn = checkInTimestamp;

  // Persist atomically to CSV
  await writeGuestsCSV(guests);

  return {
    success: true,
    message: 'Check-in berhasil',
    guest: {
      namaTamu: guests[guestIndex].namaTamu,
      jumlahTamu: guests[guestIndex].jumlahTamu,
      qrCodeId: guests[guestIndex].qrCodeId,
      checkIn: checkInTimestamp,
      status: guests[guestIndex].status,
      pesan: guests[guestIndex].pesan,
      waktu: guests[guestIndex].waktu,
    },
  };
}

/**
 * Get aggregated statistics
 */
export function getStats() {
  const guests = readGuestsCSV();

  let totalGuests = 0;
  let totalPeople = 0;
  let checkedInGuests = 0;
  let checkedInPeople = 0;

  guests.forEach((g) => {
    totalGuests += 1;
    const count = parseInt(g.jumlahTamu, 10) || 1;
    totalPeople += count;

    if (g.checkIn && g.checkIn.trim() !== '') {
      checkedInGuests += 1;
      checkedInPeople += count;
    }
  });

  return {
    totalGuests,
    totalPeople,
    checkedInGuests,
    checkedInPeople,
    remainingGuests: totalGuests - checkedInGuests,
    remainingPeople: totalPeople - checkedInPeople,
  };
}
