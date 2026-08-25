import { readGuestsCSV, writeGuestsCSV } from './csvService.js';

/**
 * Fetch remote guests from Google Apps Script Web App URL
 * Synchronizes local CSV to accurately reflect Google Sheets (adds new guests, updates check-ins, purges deleted un-checked-in guests)
 */
export async function pullFromGoogleSheets(webAppUrl) {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum diatur.',
    };
  }

  try {
    const cleanUrl = webAppUrl.trim();
    const fetchUrl = cleanUrl.includes('?') 
      ? `${cleanUrl}&action=getGuests` 
      : `${cleanUrl}?action=getGuests`;

    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Gagal terhubung ke Google Sheets (HTTP ${res.status}).`,
      };
    }

    const data = await res.json();
    if (!data || !data.success) {
      return {
        success: false,
        message: data.message || 'Gagal mengambil data dari Google Sheets.',
      };
    }

    const remoteGuests = data.guests || data.data || [];
    if (!Array.isArray(remoteGuests)) {
      return {
        success: false,
        message: 'Format data dari Google Sheets tidak valid.',
      };
    }

    const localGuests = readGuestsCSV();
    const localMap = new Map();
    localGuests.forEach((g) => {
      if (g.qrCodeId) {
        localMap.set(g.qrCodeId.trim(), g);
      }
    });

    const remoteQrSet = new Set();
    const finalGuests = [];
    let addedCount = 0;
    let updatedCount = 0;

    // 1. Process all active remote guests from Google Sheets
    remoteGuests.forEach((rg) => {
      const qr = (rg.qrCodeId || '').trim();
      if (!qr || qr === 'none') return;

      remoteQrSet.add(qr);
      const cleanPesan = String(rg.pesan || '').replace(/[\r\n]+/g, ' ').trim();

      if (localMap.has(qr)) {
        const local = localMap.get(qr);
        // Merge checkIn timestamp: prefer local checkIn if available, otherwise remote checkIn
        const checkIn = (local.checkIn && local.checkIn.trim()) 
          ? local.checkIn.trim() 
          : (rg.checkIn ? String(rg.checkIn).trim() : '');

        if ((!local.checkIn || !local.checkIn.trim()) && (rg.checkIn && String(rg.checkIn).trim())) {
          updatedCount++;
        }

        finalGuests.push({
          waktu: String(rg.waktu || local.waktu || '').trim(),
          namaTamu: String(rg.namaTamu || local.namaTamu || '').trim(),
          status: String(rg.status || local.status || 'Hadir').trim(),
          jumlahTamu: parseInt(rg.jumlahTamu || local.jumlahTamu || 1, 10) || 1,
          pesan: cleanPesan || local.pesan || '',
          qrCodeId: qr,
          checkIn: checkIn,
        });
      } else {
        // New guest added in Google Sheets
        finalGuests.push({
          waktu: String(rg.waktu || '').trim(),
          namaTamu: String(rg.namaTamu || '').trim(),
          status: String(rg.status || 'Hadir').trim(),
          jumlahTamu: parseInt(rg.jumlahTamu || 1, 10) || 1,
          pesan: cleanPesan,
          qrCodeId: qr,
          checkIn: String(rg.checkIn || '').trim(),
        });
        addedCount++;
      }
    });

    // 2. Retain local guests that were ALREADY checked-in even if removed from sheet (fail-safe audit)
    localGuests.forEach((g) => {
      const qr = (g.qrCodeId || '').trim();
      if (qr && !remoteQrSet.has(qr) && g.checkIn && g.checkIn.trim()) {
        finalGuests.push(g);
      }
    });

    const deletedPurgedCount = localGuests.length + addedCount - finalGuests.length;

    // Persist clean merged list back to CSV
    await writeGuestsCSV(finalGuests);

    let resultMsg = `Pull Selesai! Data disinkronkan (${finalGuests.length} tamu).`;
    if (deletedPurgedCount > 0) {
      resultMsg += ` ${deletedPurgedCount} data terhapus dibersihkan.`;
    }

    return {
      success: true,
      message: resultMsg,
      addedCount,
      updatedCount,
      purgedCount: deletedPurgedCount,
      totalGuests: finalGuests.length,
    };
  } catch (err) {
    console.error('Error in pullFromGoogleSheets:', err);
    return {
      success: false,
      message: `Error koneksi internet/Google Sheets: ${err.message}`,
    };
  }
}

/**
 * Push local check-ins to Google Apps Script Web App URL
 */
export async function pushToGoogleSheets(webAppUrl) {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum diatur.',
    };
  }

  try {
    const localGuests = readGuestsCSV();
    const checkedInItems = localGuests
      .filter((g) => g.qrCodeId && g.checkIn && g.checkIn.trim() !== '')
      .map((g) => ({
        qrCodeId: g.qrCodeId.trim(),
        checkIn: g.checkIn.trim(),
      }));

    if (checkedInItems.length === 0) {
      return {
        success: true,
        message: 'Tidak ada data check-in lokal yang perlu di-push.',
        pushedCount: 0,
      };
    }

    const payload = {
      type: 'syncAllCheckIns',
      items: checkedInItems,
    };

    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Gagal mengirim data ke Google Sheets (HTTP ${res.status}).`,
      };
    }

    const data = await res.json();
    return {
      success: data.success,
      message: data.message || `Push Berhasil! ${checkedInItems.length} data check-in ter-sync ke Google Sheets.`,
      pushedCount: checkedInItems.length,
    };
  } catch (err) {
    console.error('Error in pushToGoogleSheets:', err);
    return {
      success: false,
      message: `Error koneksi internet/Google Sheets: ${err.message}`,
    };
  }
}

/**
 * Perform Bidirectional Full Sync (Pull + Push)
 */
export async function fullSyncGoogleSheets(webAppUrl) {
  const pullRes = await pullFromGoogleSheets(webAppUrl);
  if (!pullRes.success) {
    return pullRes;
  }

  const pushRes = await pushToGoogleSheets(webAppUrl);
  return {
    success: pushRes.success,
    message: `Full Sync Selesai! (Total Tamu: ${pullRes.totalGuests}, Push: ${pushRes.pushedCount || 0} check-in).`,
    pull: pullRes,
    push: pushRes,
  };
}
