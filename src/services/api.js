const API_BASE = '/api';

export async function fetchGuestByQrId(qrCodeId) {
  try {
    const res = await fetch(`${API_BASE}/guest/${encodeURIComponent(qrCodeId.trim())}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error fetchGuestByQrId:', error);
    return {
      success: false,
      message: 'Server check-in tidak dapat dihubungi. Pastikan server Node.js berjalan.',
    };
  }
}

export async function submitCheckIn(qrCodeId) {
  try {
    const res = await fetch(`${API_BASE}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrCodeId: qrCodeId.trim() }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error submitCheckIn:', error);
    return {
      success: false,
      message: 'Server check-in tidak dapat dihubungi saat memproses check-in.',
    };
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error fetchStats:', error);
    return {
      success: false,
      stats: {
        totalGuests: 0,
        totalPeople: 0,
        checkedInGuests: 0,
        checkedInPeople: 0,
        remainingGuests: 0,
        remainingPeople: 0,
      },
    };
  }
}

export async function fetchGuestsList(query = '') {
  try {
    const url = query ? `${API_BASE}/guests?query=${encodeURIComponent(query)}` : `${API_BASE}/guests`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error fetchGuestsList:', error);
    return {
      success: false,
      guests: [],
    };
  }
}

export async function syncPullGoogleSheets(webAppUrl) {
  try {
    const res = await fetch(`${API_BASE}/sync/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error syncPullGoogleSheets:', error);
    return {
      success: false,
      message: 'Koneksi ke server gagal saat melakukan pull Google Sheets.',
    };
  }
}

export async function syncPushGoogleSheets(webAppUrl) {
  try {
    const res = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error syncPushGoogleSheets:', error);
    return {
      success: false,
      message: 'Koneksi ke server gagal saat melakukan push Google Sheets.',
    };
  }
}

export async function syncFullGoogleSheets(webAppUrl) {
  try {
    const res = await fetch(`${API_BASE}/sync/full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error syncFullGoogleSheets:', error);
    return {
      success: false,
      message: 'Koneksi ke server gagal saat melakukan full sync Google Sheets.',
    };
  }
}
