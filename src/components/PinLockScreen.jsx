import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';
import { JavaDivider, JavaCornerAccent } from './JavaOrnament';

export default function PinLockScreen({ onUnlockSuccess, isReadOnly }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!pin.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        onUnlockSuccess();
      } else {
        setErrorMsg(data.message || 'PIN Akses Salah. Coba lagi.');
        setPin('');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Gagal terhubung ke server.');
    }
  };

  const handleKeyClick = (num) => {
    if (pin.length < 10) {
      setPin((prev) => prev + num);
    }
  };

  const handleDeleteKey = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#4A3E3D] text-[#FDFBF7] flex items-center justify-center p-4 selection:bg-[#C5A880]/30 relative overflow-hidden">
      
      {/* Background Decorative Motifs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#C5A880]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#C5A880]/5 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#FDFBF7] text-[#2C2625] rounded-3xl border-2 border-[#C5A880] shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Corner Accents */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <JavaCornerAccent className="w-6 h-6 text-[#C5A880]" />
        </div>
        <div className="absolute top-3 right-3 rotate-90 pointer-events-none">
          <JavaCornerAccent className="w-6 h-6 text-[#C5A880]" />
        </div>
        <div className="absolute bottom-3 left-3 -rotate-90 pointer-events-none">
          <JavaCornerAccent className="w-6 h-6 text-[#C5A880]" />
        </div>
        <div className="absolute bottom-3 right-3 rotate-180 pointer-events-none">
          <JavaCornerAccent className="w-6 h-6 text-[#C5A880]" />
        </div>

        {/* Top Lock Icon Badge */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#4A3E3D] text-[#C5A880] flex items-center justify-center mx-auto mb-3 shadow-md border border-[#C5A880]">
            <Lock className="w-7 h-7" />
          </div>

          <span className="text-[11px] uppercase tracking-widest text-[#8C7A6B] font-medium block mb-0.5">
            Website QR Check-in Panitia
          </span>

          <h2 className="text-2xl font-serif-luxury font-bold text-[#4A3E3D]">
            Shahnazia & Damarjati
          </h2>

          <p className="text-xs text-[#8C7A6B] mt-1 font-light">
            Masukkan PIN Panitia untuk Membuka Akses Scanner
          </p>

          {isReadOnly && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#C5A880]/20 text-[#4A3E3D] border border-[#C5A880]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Server Mode: Read-Only</span>
            </div>
          )}
        </div>

        <JavaDivider className="w-36 mx-auto mb-6 text-[#C5A880]" />

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN Akses..."
              maxLength={10}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#F7F3E9] border-2 border-[#C5A880]/50 text-center font-mono text-lg font-bold text-[#4A3E3D] tracking-widest focus:outline-none focus:border-[#B99A63] shadow-inner"
              autoFocus
            />
            <KeyRound className="w-5 h-5 text-[#C5A880] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#4A3E3D]"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs text-center font-medium animate-bounce">
              {errorMsg}
            </div>
          )}

          {/* On-Screen Keypad for Mobile / Tablet touch Convenience */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeyClick(n)}
                className="py-3 rounded-xl bg-[#F7F3E9] hover:bg-[#EAE3D2] border border-[#C5A880]/30 font-bold text-base text-[#4A3E3D] transition-all active:scale-95 shadow-xs"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDeleteKey}
              className="py-3 rounded-xl bg-[#F7F3E9] hover:bg-[#EAE3D2] border border-[#C5A880]/30 font-medium text-xs text-[#8C7A6B] transition-all active:scale-95"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="py-3 rounded-xl bg-[#F7F3E9] hover:bg-[#EAE3D2] border border-[#C5A880]/30 font-bold text-base text-[#4A3E3D] transition-all active:scale-95 shadow-xs"
            >
              0
            </button>
            <button
              type="submit"
              disabled={!pin || isSubmitting}
              className="py-3 rounded-xl bg-[#2D5A47] hover:bg-[#234738] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              <span>Masuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-[10px] text-[#8C7A6B]">
          Tanyakan PIN kepada Panitia.
        </div>
      </div>
    </div>
  );
}
