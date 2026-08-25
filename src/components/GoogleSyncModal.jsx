import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, RefreshCw, X, CheckCircle, AlertCircle, Link2, Wifi, ShieldCheck } from 'lucide-react';
import { JavaCornerAccent, JavaDivider } from './JavaOrnament';
import { syncPullGoogleSheets, syncPushGoogleSheets, syncFullGoogleSheets } from '../services/api';

export default function GoogleSyncModal({ isOpen, onClose, onSyncComplete, isReadOnly }) {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState(null); // 'pull', 'push', 'full'
  const [statusMessage, setStatusMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Load saved Web App URL from localStorage
    const savedUrl = localStorage.getItem('wedding_google_webapp_url') || '';
    setWebAppUrl(savedUrl);
  }, []);

  if (!isOpen) return null;

  const handleSaveUrl = (url) => {
    setWebAppUrl(url);
    localStorage.setItem('wedding_google_webapp_url', url);
  };

  const executeSync = async (type, syncFn) => {
    if (isSyncing) return;
    if ((type === 'push' || type === 'full') && isReadOnly) {
      setIsError(true);
      setStatusMessage('Server dalam Mode Read-Only: Pengiriman (Push) perubahan ke Google Sheets ditolak.');
      return;
    }

    setIsSyncing(true);
    setSyncType(type);
    setStatusMessage('Menghubungkan ke Google Sheets...');
    setIsError(false);

    handleSaveUrl(webAppUrl);

    try {
      const res = await syncFn(webAppUrl);
      setIsSyncing(false);
      setSyncType(null);

      if (res.success) {
        setIsError(false);
        setStatusMessage(res.message || 'Sinkronisasi berhasil!');
        if (onSyncComplete) onSyncComplete();
      } else {
        setIsError(true);
        setStatusMessage(res.message || 'Gagal melakukan sinkronisasi dengan Google Sheets.');
      }
    } catch (err) {
      setIsSyncing(false);
      setSyncType(null);
      setIsError(true);
      setStatusMessage(`Terjadi kesalahan: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-2xl border-2 border-[#C5A880] shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Corner Accents */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
        </div>
        <div className="absolute top-2 right-2 rotate-90 pointer-events-none">
          <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#4A3E3D] text-[#FDFBF7] flex items-center justify-between border-b border-[#C5A880]">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#C5A880]" />
            <h3 className="text-lg font-serif-luxury font-bold">
              Google Sheets Sync
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#D8C4B6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Read Only Warning Banner inside Modal */}
          {isReadOnly && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-900 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Server Mode Read-Only: Hanya fitur <b>PULL</b> yang aktif. Fitur Push/Full Sync ditutup.</span>
            </div>
          )}

          <p className="text-xs text-[#8C7A6B] leading-relaxed">
            Sinkronkan data RSVP online dari Google Sheets ke penyimpanan CSV lokal atau kirimkan data check-in lokal kembali ke Google Sheets secara manual saat ada internet.
          </p>

          {/* Web App URL Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => handleSaveUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F3E9] border border-[#C5A880]/40 text-xs text-[#4A3E3D] placeholder-[#8C7A6B] focus:outline-none focus:border-[#B99A63]"
              />
            </div>
            <span className="text-[10px] text-[#8C7A6B] block italic">
              *Kosongkan untuk menggunakan URL default bawaan server.
            </span>
          </div>

          {/* Status Alert Box */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                isError
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-[#2D5A47]/10 text-[#2D5A47] border-[#2D5A47]/30'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#2D5A47] shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{statusMessage}</span>
            </div>
          )}

          <JavaDivider className="w-32 mx-auto my-2 text-[#C5A880]" />

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            
            {/* Pull Button - Always Enabled */}
            <button
              onClick={() => executeSync('pull', syncPullGoogleSheets)}
              disabled={isSyncing}
              className="p-3 rounded-xl bg-[#F7F3E9] hover:bg-[#EAE3D2] border border-[#C5A880]/40 text-[#4A3E3D] transition-all flex flex-col items-center justify-center gap-1.5 text-center disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Download className={`w-5 h-5 text-[#C5A880] ${isSyncing && syncType === 'pull' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold">PULL</span>
              <span className="text-[9px] text-[#8C7A6B]">Tarik RSVP Baru</span>
            </button>

            {/* Push Button - Disabled in Read-Only Mode */}
            <button
              onClick={() => executeSync('push', syncPushGoogleSheets)}
              disabled={isSyncing || isReadOnly}
              title={isReadOnly ? 'Fitur Push dinonaktifkan di Server Mode Read-Only' : 'Kirim data check-in ke Google Sheets'}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                isReadOnly 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' 
                  : 'bg-[#F7F3E9] hover:bg-[#EAE3D2] border-[#C5A880]/40 text-[#4A3E3D] active:scale-95'
              }`}
            >
              <Upload className={`w-5 h-5 ${isReadOnly ? 'text-gray-400' : 'text-[#8C7A6B]'} ${isSyncing && syncType === 'push' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold">PUSH</span>
              <span className="text-[9px]">{isReadOnly ? 'Disabled' : 'Kirim Check-in'}</span>
            </button>

            {/* Full Sync Button - Disabled in Read-Only Mode */}
            <button
              onClick={() => executeSync('full', syncFullGoogleSheets)}
              disabled={isSyncing || isReadOnly}
              title={isReadOnly ? 'Fitur Full Sync dinonaktifkan di Server Mode Read-Only' : 'Tarik & Kirim sekaligus'}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                isReadOnly
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-[#2D5A47] hover:bg-[#234738] text-white shadow-xs active:scale-95'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isReadOnly ? 'text-gray-400' : 'text-white'} ${isSyncing && syncType === 'full' ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold">FULL SYNC</span>
              <span className="text-[9px]">{isReadOnly ? 'Disabled' : 'Tarik & Kirim'}</span>
            </button>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F7F3E9] border-t border-[#C5A880]/30 flex items-center justify-between text-xs text-[#8C7A6B]">
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-[#C5A880]" />
            Hanya jika terhubung internet
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#4A3E3D] text-[#FDFBF7] font-bold text-xs hover:bg-[#3F3328] transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
