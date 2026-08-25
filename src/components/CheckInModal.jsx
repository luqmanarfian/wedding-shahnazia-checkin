import React, { useState } from 'react';
import { UserCheck, Clock, X, AlertTriangle, CheckCircle2, User, MessageSquare, Hash, Users, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JavaDivider, JavaCornerAccent } from './JavaOrnament';

export default function CheckInModal({ guest, error, onClose, onConfirmCheckIn, isReadOnly }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!guest && !error) return null;

  const isAlreadyCheckedIn = guest && guest.checkIn && guest.checkIn.trim() !== '';

  const handleCheckInSubmit = async () => {
    if (!guest || isAlreadyCheckedIn || isSubmitting || isReadOnly) return;

    setIsSubmitting(true);
    const success = await onConfirmCheckIn(guest.qrCodeId);
    setIsSubmitting(false);

    if (success) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A880', '#B99A63', '#2D5A47', '#4A3E3D'],
        });
      } catch (e) {
        // Confetti fail-safe
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FDFBF7] rounded-2xl border-2 border-[#C5A880] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Decorative corner accent */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
        </div>
        <div className="absolute top-2 right-2 rotate-90 pointer-events-none">
          <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#4A3E3D] text-[#FDFBF7] flex items-center justify-between border-b border-[#C5A880]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#D8C4B6]">
              Informasi Tamu Undangan
            </span>
            <h3 className="text-xl font-serif-luxury font-bold">
              {error ? 'Pemberitahuan Scan' : 'Hasil Scan QR'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#D8C4B6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error ? (
            /* Error State View */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#8C7A6B]/15 text-[#8C7A6B] flex items-center justify-center mx-auto mb-4 border border-[#8C7A6B]/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#4A3E3D] mb-2 font-serif-luxury">
                QR Code Tidak Valid / Tidak Ditemukan
              </h4>
              <p className="text-sm text-[#8C7A6B] leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
              <JavaDivider className="w-32 mx-auto my-4 text-[#C5A880]" />
            </div>
          ) : (
            /* Guest Found View */
            <>
              {/* Read Only Warning Banner */}
              {isReadOnly && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-900 text-xs font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Server Mode Read-Only: Fitur check-in dinonaktifkan di server publik ini.</span>
                </div>
              )}

              {/* Already Checked-in Alert Banner */}
              {isAlreadyCheckedIn ? (
                <div className="p-4 rounded-xl bg-[#8C7A6B]/15 border-2 border-[#8C7A6B]/40 text-[#4A3E3D] flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#8C7A6B] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold tracking-wide uppercase text-[#8C7A6B]">
                      SUDAH CHECK-IN
                    </h4>
                    <p className="text-xs text-[#4A3E3D] mt-1">
                      Tamu telah melakukan check-in pada timestamp:
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-md mt-1.5 border border-[#8C7A6B]/30">
                      <Clock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                      {guest.checkIn}
                    </div>
                  </div>
                </div>
              ) : (
                /* Ready for Check-in Badge */
                !isReadOnly && (
                  <div className="p-3 rounded-xl bg-[#2D5A47]/10 border border-[#2D5A47]/30 text-[#2D5A47] text-xs font-medium flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#2D5A47]" />
                    <span>Tamu terdaftar dan Siap Check-in</span>
                  </div>
                )
              )}

              {/* Guest Detail Card */}
              <div className="bg-[#F7F3E9] p-5 rounded-xl border border-[#C5A880]/30 space-y-4">
                {/* Guest Name */}
                <div>
                  <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block mb-1">
                    Nama Tamu
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#C5A880]" />
                    <span className="text-xl font-bold font-serif-luxury text-[#4A3E3D]">
                      {guest.namaTamu}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#C5A880]/20">
                  {/* RSVP Status */}
                  <div>
                    <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block mb-1">
                      Status RSVP
                    </span>
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[#C5A880]/20 text-[#4A3E3D] border border-[#C5A880]/40">
                      {guest.status || 'Hadir'}
                    </span>
                  </div>

                  {/* Jumlah Tamu */}
                  <div>
                    <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block mb-1">
                      Jumlah Tamu
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#4A3E3D]">
                      <Users className="w-4 h-4 text-[#C5A880]" />
                      <span>{guest.jumlahTamu} Orang</span>
                    </div>
                  </div>
                </div>

                {/* Guest Message */}
                {guest.pesan && (
                  <div className="pt-2 border-t border-[#C5A880]/20">
                    <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block mb-1">
                      Pesan Tamu
                    </span>
                    <div className="p-3 rounded-lg bg-white/70 text-xs italic text-[#4A3E3D] border border-[#C5A880]/20 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                      <span>"{guest.pesan}"</span>
                    </div>
                  </div>
                )}

                {/* QR Code ID */}
                <div className="pt-2 border-t border-[#C5A880]/20">
                  <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block mb-1">
                    QR Code ID
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#8C7A6B]">
                    <Hash className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{guest.qrCodeId}</span>
                  </div>
                </div>
              </div>

              {!isAlreadyCheckedIn && !isReadOnly && (
                <div className="p-3 rounded-lg bg-[#F7F3E9] text-[11px] text-[#8C7A6B] border border-[#C5A880]/30 text-center">
                  ⚠️ Pastikan data tamu sudah benar sebelum melakukan check-in.
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F7F3E9] border-t border-[#C5A880]/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C7A6B] hover:bg-[#EAE3D2] transition-colors"
          >
            Tutup
          </button>

          {guest && !isAlreadyCheckedIn && (
            <button
              onClick={handleCheckInSubmit}
              disabled={isSubmitting || isReadOnly}
              className="px-6 py-2.5 rounded-xl bg-[#2D5A47] hover:bg-[#234738] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : isReadOnly ? 'READ ONLY' : 'CHECK-IN TAMU'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
