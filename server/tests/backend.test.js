import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  readGuestsCSV,
  writeGuestsCSV,
  findGuestByQrId,
  performCheckIn,
  getStats,
} from '../services/csvService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const CSV_FILE = path.join(DATA_DIR, 'guests.csv');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

const sampleTestCSV = `Waktu,Nama Tamu,status,Jumlah Tamu,Pesan singkat Tamu,QR_Code_ID,check_in
2026-08-07 18:34:12,Tamu Test 1,Hadir,1,Pesan Test 1,TEST-QR-001,
2026-08-07 19:00:00,Tamu Test 2,Hadir,2,Pesan Test 2,TEST-QR-002,2026-08-20 10:00:00
`;

test('Backend Logic & CSV Persistence Tests', async (t) => {
  // Setup: Backup existing CSV if any
  let originalCSV = null;
  if (fs.existsSync(CSV_FILE)) {
    originalCSV = fs.readFileSync(CSV_FILE, 'utf-8');
  }

  // Seed test data
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CSV_FILE, sampleTestCSV, 'utf-8');

  t.after(() => {
    // Restore original CSV after test complete
    if (originalCSV !== null) {
      fs.writeFileSync(CSV_FILE, originalCSV, 'utf-8');
    }
  });

  await t.test('1. QR Code ditemukan', () => {
    const guest = findGuestByQrId('TEST-QR-001');
    assert.notEqual(guest, null);
    assert.equal(guest.namaTamu, 'Tamu Test 1');
    assert.equal(guest.jumlahTamu, 1);
  });

  await t.test('2. QR Code tidak ditemukan / invalid QR ditolak', () => {
    const guest = findGuestByQrId('INVALID-QR-999');
    assert.equal(guest, null);
  });

  await t.test('3. Check-in pertama berhasil & CSV diperbarui & backup dibuat', async () => {
    const result = await performCheckIn('TEST-QR-001');
    assert.equal(result.success, true);
    assert.equal(result.guest.namaTamu, 'Tamu Test 1');
    assert.ok(result.guest.checkIn);

    // Verify CSV file content on disk was actually updated
    const updatedGuests = readGuestsCSV();
    const checkedInGuest = updatedGuests.find((g) => g.qrCodeId === 'TEST-QR-001');
    assert.notEqual(checkedInGuest.checkIn, '');

    // Verify backup file created
    const backupFiles = fs.readdirSync(BACKUPS_DIR);
    assert.ok(backupFiles.length > 0, 'Backup file should exist in backups folder');
  });

  await t.test('4. Check-in kedua ditolak', async () => {
    const result = await performCheckIn('TEST-QR-001');
    assert.equal(result.success, false);
    assert.equal(result.alreadyCheckedIn, true);
    assert.equal(result.message, 'Tamu sudah melakukan check-in');
  });

  await t.test('5. Check-in pada tamu yang sudah terisi di awal ditolak', async () => {
    const result = await performCheckIn('TEST-QR-002');
    assert.equal(result.success, false);
    assert.equal(result.alreadyCheckedIn, true);
  });

  await t.test('6. Dashboard statistics calculation', () => {
    const stats = getStats();
    assert.equal(stats.totalGuests, 2);
    assert.equal(stats.totalPeople, 3);
    assert.equal(stats.checkedInGuests, 2);
    assert.equal(stats.checkedInPeople, 3);
    assert.equal(stats.remainingGuests, 0);
  });
});
