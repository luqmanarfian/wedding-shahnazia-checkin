import React from 'react';
import { JavaDivider } from './JavaOrnament';
import { ShieldCheck, QrCode, WifiOff, RefreshCw, Cloud, Lock, AlertTriangle } from 'lucide-react';

export default function Header({ onRefreshStats, isRefreshing, onOpenGoogleSync, isReadOnly, onLockApp }) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <header className="relative bg-[#4A3E3D] text-[#FDFBF7] border-b-2 border-[#C5A880] shadow-md">
      {/* Decorative top strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#8C7A6B] via-[#C5A880] to-[#8C7A6B]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Event Title */}
          <div className="text-center md:text-left relative">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="p-1.5 rounded-full bg-[#C5A880]/20 text-[#C5A880]">
                <QrCode className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase tracking-widest text-[#D8C4B6] font-medium">
                Website QR Check-in Panitia
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#FDFBF7] tracking-wide">
              Shahnazia & Damarjati
            </h1>

            <p className="text-xs text-[#D8C4B6] mt-0.5 font-light tracking-wider">
              Offline-First Event Management System • 
            </p>
          </div>

          {/* Center Jawa Motif for larger screens */}
          <div className="hidden lg:block text-center">
            <JavaDivider className="w-40 text-[#C5A880]" />
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
            
            {/* Read-Only Badge Warning if active */}
            {isReadOnly && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Mode Server Read-Only: Check-in ditolak">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Read-Only Mode</span>
              </div>
            )}

            {/* HTTPS Status Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isHttps 
                ? 'bg-[#2D5A47]/30 text-[#A3E635] border-[#2D5A47]' 
                : 'bg-[#C5A880]/20 text-[#FDFBF7] border-[#C5A880]/40'
            }`}>
              <ShieldCheck className="w-4 h-4" />
              <span>{isHttps ? 'HTTPS Secure' : 'HTTP Local'}</span>
            </div>

            {/* Offline Ready Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#8C7A6B]/30 text-[#EAE3D2] border border-[#8C7A6B]/50">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Ready</span>
            </div>

            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenGoogleSync}
              className="px-3 py-1.5 rounded-full bg-[#C5A880]/20 hover:bg-[#C5A880]/40 text-[#FDFBF7] transition-all duration-200 border border-[#C5A880]/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
              title="Google Sheets Sync"
            >
              <Cloud className="w-4 h-4 text-[#C5A880]" />
              <span>Sheets Sync</span>
            </button>

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={onRefreshStats}
              disabled={isRefreshing}
              title="Refresh Data & Stats"
              className="p-2 rounded-full bg-[#C5A880]/20 hover:bg-[#C5A880]/40 text-[#FDFBF7] transition-all duration-200 border border-[#C5A880]/40 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Lock App Session Button */}
            <button
              onClick={onLockApp}
              title="Kunci Aplikasi (Keluar Sesi)"
              className="p-2 rounded-full bg-[#8C7A6B]/30 hover:bg-[#8C7A6B]/50 text-[#FDFBF7] transition-all border border-[#8C7A6B]/50 active:scale-95"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
