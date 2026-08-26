import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import QRScanner from './components/QRScanner';
import GuestList from './components/GuestList';
import CheckInModal from './components/CheckInModal';
import GoogleSyncModal from './components/GoogleSyncModal';
import PinLockScreen from './components/PinLockScreen';
import {
  fetchGuestByQrId,
  submitCheckIn,
  fetchStats,
  fetchGuestsList,
  syncPullGoogleSheets,
} from './services/api';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('wedding_qr_unlocked') === 'true';
  });

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalPeople: 0,
    checkedInGuests: 0,
    checkedInPeople: 0,
    remainingGuests: 0,
    remainingPeople: 0,
  });

  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModalGuest, setActiveModalGuest] = useState(null);
  const [activeModalError, setActiveModalError] = useState(null);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [autoPullEnabled, setAutoPullEnabled] = useState(false);

  // Load server config (Read-Only Mode, PIN Status & Auto Pull Config)
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsReadOnly(!!data.isReadOnly);
          setAutoPullEnabled(!!data.autoPullEnabled);
        }
      })
      .catch((err) => console.warn('Failed to load server config:', err));
  }, []);

  // Load stats and guests list (with optional online pull)
  const loadData = async (triggerPull = false, showToast = false) => {
    if (!isUnlocked) return;
    setIsLoading(true);
    try {
      // If manually triggered via Refresh button, attempt Google Sheets Pull sync first if online
      if (triggerPull) {
        try {
          const savedUrl = localStorage.getItem('wedding_google_webapp_url') || '';
          const pullRes = await syncPullGoogleSheets(savedUrl);
          if (pullRes.success && showToast) {
            showNotification(pullRes.message || 'Berhasil sinkronisasi dengan Google Sheets!', 'success');
          }
        } catch (e) {
          // If offline, fail gracefully
        }
      }

      const [statsRes, guestsRes] = await Promise.all([
        fetchStats(),
        fetchGuestsList(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (guestsRes.success && guestsRes.guests) {
        setGuests(guestsRes.guests);
      }

      if (triggerPull && showToast) {
        showNotification('Daftar & statistik tamu berhasil diperbarui!', 'success');
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData(false, false);
      const interval = setInterval(() => {
        // Run pull logic every 3s if enabled by env, otherwise just local reload
        loadData(autoPullEnabled, false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked, autoPullEnabled]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleUnlockSuccess = () => {
    sessionStorage.setItem('wedding_qr_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLockApp = () => {
    sessionStorage.removeItem('wedding_qr_unlocked');
    setIsUnlocked(false);
  };

  // Handle scanned QR Code string
  const handleQRScanSuccess = async (qrCodeId) => {
    if (!qrCodeId) return;
    const cleanId = qrCodeId.trim();

    const res = await fetchGuestByQrId(cleanId);
    if (res.success && res.guest) {
      setActiveModalGuest(res.guest);
      setActiveModalError(null);
    } else {
      setActiveModalGuest(null);
      setActiveModalError(res.message || 'QR Code tidak terdaftar.');
    }
  };

  // Handle Check-in Confirmation Button inside Modal
  const handleConfirmCheckIn = async (qrCodeId) => {
    if (isReadOnly) {
      showNotification('Server dalam mode Read-Only. Check-in ditolak.', 'error');
      return false;
    }

    const res = await submitCheckIn(qrCodeId);

    if (res.success) {
      showNotification(`Check-in Berhasil untuk: ${res.guest.namaTamu}`, 'success');
      setActiveModalGuest(res.guest); // Update modal view to already checked in state
      loadData(false, false); // Refresh list and stats
      return true;
    } else {
      showNotification(res.message || 'Gagal melakukan check-in', 'error');
      if (res.alreadyCheckedIn && res.guest) {
        setActiveModalGuest(res.guest);
      }
      return false;
    }
  };

  // Quick Check-in directly from table list
  const handleQuickCheckIn = (guest) => {
    setActiveModalGuest(guest);
    setActiveModalError(null);
  };

  // If locked, render PIN Lock Screen
  if (!isUnlocked) {
    return (
      <PinLockScreen
        onUnlockSuccess={handleUnlockSuccess}
        isReadOnly={isReadOnly}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2625] flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold transition-all animate-bounce flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-[#2D5A47] text-white border-[#2D5A47]'
              : 'bg-[#4A3E3D] text-white border-[#C5A880]'
          }`}
        >
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onRefreshStats={() => loadData(true, true)}
        isRefreshing={isLoading}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        isReadOnly={isReadOnly}
        onLockApp={handleLockApp}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Statistics Dashboard Banner */}
        <StatsCard stats={stats} isLoading={isLoading} />

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: QR Scanner */}
          <div className="lg:col-span-5">
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onOpenManualSearch={() => {
                const element = document.getElementById('search-input-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* Right Column: Searchable Guest Table */}
          <div id="search-input-section" className="lg:col-span-7">
            <GuestList
              guests={guests}
              onSelectGuest={(guest) => {
                setActiveModalGuest(guest);
                setActiveModalError(null);
              }}
              onQuickCheckIn={handleQuickCheckIn}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#C5A880]/30 text-center text-xs text-[#8C7A6B] bg-[#F7F3E9]/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Wedding Check-in System • Shahnazia & Damarjati</span>
          <span className="font-mono text-[10px] text-[#C5A880]">
            {isReadOnly ? 'Read-Only Mode Active' : 'Offline-First Read/Write Mode'}
          </span>
        </div>
      </footer>

      {/* Scanned Guest Result Modal */}
      <CheckInModal
        guest={activeModalGuest}
        error={activeModalError}
        onClose={() => {
          setActiveModalGuest(null);
          setActiveModalError(null);
        }}
        onConfirmCheckIn={handleConfirmCheckIn}
        isReadOnly={isReadOnly}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        onSyncComplete={() => loadData(false)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
