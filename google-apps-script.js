/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR WEDDING INVITATION & QR CHECK-IN SYSTEM
 * ============================================================================
 * Spreadsheet ID: 1wAe06qhJB6JIFcvSbtLLof7kMU5Ddbxtakj7l7su0e0
 * Worksheets: 'RSVP' & 'Wishes'
 *
 * CARA DEPLOY / UPDATE:
 * 1. Buka Google Sheets: https://docs.google.com/spreadsheets/d/1wAe06qhJB6JIFcvSbtLLof7kMU5Ddbxtakj7l7su0e0
 * 2. Klik Extensions (Ekstensi) > Apps Script.
 * 3. Hapus seluruh kode lama, lalu paste SELURUH isi file ini.
 * 4. Klik Deploy > Manage deployments (atau New deployment).
 * 5. Pilih versi "New version", Execute as: Me, Who has access: Anyone.
 * 6. Klik Deploy dan salin "Web app URL".
 * ============================================================================
 */

const SPREADSHEET_ID = "1wAe06qhJB6JIFcvSbtLLof7kMU5Ddbxtakj7l7su0e0";

/**
 * Handle HTTP POST requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse(false, "Payload request tidak ditemukan.");
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return createJsonResponse(false, "Format JSON tidak valid.");
    }

    var type = data.type;
    if (type === "rsvp") {
      return handleRsvp(data);
    } else if (type === "wishes") {
      return handleWishes(data);
    } else if (type === "checkin") {
      return handleCheckIn(data);
    } else if (type === "syncAllCheckIns") {
      return handleSyncAllCheckIns(data);
    } else {
      return createJsonResponse(false, "Tipe request tidak dikenal.");
    }
  } catch (error) {
    return createJsonResponse(false, "Server error: " + error.toString());
  }
}

/**
 * Handle HTTP GET requests
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && (e.parameter.action || e.parameter.type)) || "getWishes";

    if (action === "ping") {
      return createJsonResponse(true, "Google Apps Script Web App Wedding API is Running.");
    } else if (action === "getGuests" || action === "guests") {
      return getGuests();
    }

    // Default action for GET is to fetch wishes list
    return getWishes();
  } catch (error) {
    return createJsonResponse(false, "Server error: " + error.toString());
  }
}

/**
 * Fetch Wishes Book Data from Google Sheet
 */
function getWishes() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Wishes");

    if (!sheet) {
      return createJsonResponse(true, "Sheet Wishes belum ada.", []);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createJsonResponse(true, "Belum ada data ucapan.", []);
    }

    var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var wishes = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rawTimestamp = row[0];
      var sender = row[1];
      var text = row[2];

      if (sender && text) {
        var formattedTime = "";
        if (rawTimestamp instanceof Date) {
          formattedTime = Utilities.formatDate(rawTimestamp, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        } else {
          formattedTime = String(rawTimestamp || "");
        }

        wishes.push({
          sender: String(sender).trim(),
          text: String(text).trim(),
          time: formattedTime
        });
      }
    }

    wishes.reverse();
    return createJsonResponse(true, "Berhasil mengambil data ucapan.", wishes);
  } catch (error) {
    return createJsonResponse(false, "Gagal mengambil data ucapan: " + error.toString());
  }
}

/**
 * Fetch All Guest RSVP records (for QR Scanner Sync)
 */
function getGuests() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("RSVP");

    if (!sheet) {
      return createJsonResponse(true, "Sheet RSVP belum ada.", []);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createJsonResponse(true, "Belum ada data tamu di RSVP.", []);
    }

    ensureHeadersExist(sheet);

    var lastCol = Math.max(sheet.getLastColumn(), 7);
    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var guests = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var waktu = row[0];
      var namaTamu = row[1];
      var status = row[2];
      var jumlahTamu = row[3];
      var pesan = row[4];
      var qrCodeId = row[5];
      var checkIn = row[6];

      if (namaTamu || qrCodeId) {
        var formattedWaktu = waktu instanceof Date 
          ? Utilities.formatDate(waktu, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
          : String(waktu || "");

        var formattedCheckIn = checkIn instanceof Date
          ? Utilities.formatDate(checkIn, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
          : String(checkIn || "");

        guests.push({
          waktu: formattedWaktu,
          namaTamu: String(namaTamu || "").trim(),
          status: String(status || "Hadir").trim(),
          jumlahTamu: parseInt(jumlahTamu || "1", 10) || 1,
          pesan: String(pesan || "").trim(),
          qrCodeId: String(qrCodeId || "").trim(),
          checkIn: formattedCheckIn.trim()
        });
      }
    }

    return createJsonResponse(true, "Berhasil mengambil data tamu.", guests);
  } catch (error) {
    return createJsonResponse(false, "Gagal mengambil data tamu: " + error.toString());
  }
}

/**
 * Handle RSVP Form Data Insertion (from Invitation Website)
 */
function handleRsvp(data) {
  var name = sanitizeInput(data.name, 100);
  var status = sanitizeInput(data.status, 20);
  var count = sanitizeInput(data.count, 10);
  var message = sanitizeInput(data.message, 1000);
  var qrCodeId = sanitizeInput(data.qrCodeId || data.qrCode || (status === "Absen" ? "none" : ""), 200);

  if (!name) {
    return createJsonResponse(false, "Nama lengkap wajib diisi.");
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("RSVP");
  if (!sheet) {
    sheet = ss.insertSheet("RSVP");
  }

  ensureHeadersExist(sheet);

  var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([timestamp, name, status || "Hadir", count || "1", message || "-", qrCodeId || "none", ""]);

  return createJsonResponse(true, "Data RSVP berhasil disimpan.");
}

/**
 * Handle Single Guest Check-In from QR Scanner
 */
function handleCheckIn(data) {
  var qrCodeId = sanitizeInput(data.qrCodeId, 200);
  var timestamp = data.checkIn || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  if (!qrCodeId) {
    return createJsonResponse(false, "QR_Code_ID wajib diisi.");
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("RSVP");
  if (!sheet) {
    return createJsonResponse(false, "Sheet RSVP tidak ditemukan.");
  }

  ensureHeadersExist(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse(false, "Data tamu di Google Sheet masih kosong.");
  }

  var values = sheet.getRange(2, 6, lastRow - 1, 1).getValues(); // Column 6 = QR_Code_ID
  for (var i = 0; i < values.length; i++) {
    var existingQr = String(values[i][0] || "").trim();
    if (existingQr === qrCodeId) {
      var rowIndex = i + 2;
      sheet.getRange(rowIndex, 7).setValue(timestamp); // Column 7 = Check_In
      return createJsonResponse(true, "Check-in berhasil diperbarui di Google Sheet.", {
        qrCodeId: qrCodeId,
        checkIn: timestamp
      });
    }
  }

  return createJsonResponse(false, "QR Code ID tidak ditemukan di Google Sheet.");
}

/**
 * Handle Bulk Check-Ins Sync from Local Scanner
 */
function handleSyncAllCheckIns(data) {
  var items = data.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return createJsonResponse(false, "Daftar check-in kosong.");
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("RSVP");
  if (!sheet) {
    return createJsonResponse(false, "Sheet RSVP tidak ditemukan.");
  }

  ensureHeadersExist(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse(false, "Data tamu di Google Sheet masih kosong.");
  }

  var qrValues = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  var checkInValues = sheet.getRange(2, 7, lastRow - 1, 1).getValues();

  var updatedCount = 0;
  var itemsMap = {};
  for (var k = 0; k < items.length; k++) {
    if (items[k].qrCodeId && items[k].checkIn) {
      itemsMap[String(items[k].qrCodeId).trim()] = items[k].checkIn;
    }
  }

  for (var i = 0; i < qrValues.length; i++) {
    var qr = String(qrValues[i][0] || "").trim();
    if (qr && itemsMap[qr]) {
      var currentCheckIn = String(checkInValues[i][0] || "").trim();
      if (!currentCheckIn) {
        checkInValues[i][0] = itemsMap[qr];
        updatedCount++;
      }
    }
  }

  if (updatedCount > 0) {
    sheet.getRange(2, 7, lastRow - 1, 1).setValues(checkInValues);
  }

  return createJsonResponse(true, "Berhasil menyinkronkan " + updatedCount + " data check-in ke Google Sheet.");
}

/**
 * Handle Wishes Book Data Insertion
 */
function handleWishes(data) {
  var sender = sanitizeInput(data.sender, 100);
  var text = sanitizeInput(data.text, 1000);

  if (!sender || !text) {
    return createJsonResponse(false, "Nama pengirim dan ucapan wajib diisi.");
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Wishes");
  if (!sheet) {
    sheet = ss.insertSheet("Wishes");
    sheet.appendRow(["Timestamp", "Nama Pengirim", "Ucapan"]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
  }

  var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([timestamp, sender, text]);

  return createJsonResponse(true, "Data ucapan berhasil disimpan.");
}

/**
 * Ensure RSVP Sheet Headers exist (including Check_In in column 7)
 */
function ensureHeadersExist(sheet) {
  var headers = ["Timestamp", "Nama", "Status Kehadiran", "Jumlah Tamu", "Pesan", "QR_Code_ID", "Check_In"];
  var currentCols = sheet.getLastColumn();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(currentCols, 7)).getValues()[0];
    if (!existingHeaders[6] || String(existingHeaders[6]).trim() === "") {
      sheet.getRange(1, 7).setValue("Check_In").setFontWeight("bold");
    }
  }
}

/**
 * Sanitasi & Validasi Input Teks
 */
function sanitizeInput(str, maxLength) {
  if (typeof str !== "string") {
    str = str ? String(str) : "";
  }
  str = str.replace(/<[^>]*>?/gm, "").trim();
  if (maxLength && str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  return str;
}

/**
 * Helper untuk mengembalikan Response JSON
 */
function createJsonResponse(success, message, data) {
  var responseObj = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) {
    responseObj.data = data;
    responseObj.guests = data;
    responseObj.wishes = data;
  }
  var output = JSON.stringify(responseObj);
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
}
