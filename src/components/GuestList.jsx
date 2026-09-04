import React, { useState } from 'react';
import { Search, UserCheck, Clock, Filter, Users, Hash } from 'lucide-react';

export default function GuestList({ guests, onSelectGuest, onQuickCheckIn }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'checkedIn', 'pending'

  const filteredGuests = guests.filter((g) => {
    // 1. VIP Tab Filter (If VIP tab selected, only keep VIP guests)
    const isVip = (g.namaTamu && g.namaTamu.includes('(VIP)')) || (g.pesan && g.pesan.includes('(Tamu VIP'));
    if (filterTab === 'vip' && !isVip) return false;

    // 2. Text Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      g.namaTamu.toLowerCase().includes(query) ||
      g.qrCodeId.toLowerCase().includes(query) ||
      g.pesan.toLowerCase().includes(query);

    // 3. Status Tab Filter
    const isCheckedIn = g.checkIn && g.checkIn.trim() !== '';
    if (filterTab === 'checkedIn' && !isCheckedIn) return false;
    if (filterTab === 'pending' && isCheckedIn) return false;

    return matchesQuery;
  });

  return (
    <div className="rounded-2xl bg-[#FDFBF7] border-2 border-[#C5A880]/40 shadow-lg p-4 sm:p-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#C5A880]/20">
        <div>
          <h2 className="text-lg font-serif-luxury font-bold text-[#4A3E3D] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C5A880]" />
            Daftar Tamu Undangan
          </h2>
          <p className="text-xs text-[#8C7A6B]">
            Pencarian manual & status kehadiran tamu
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F7F3E9] p-1 rounded-xl border border-[#C5A880]/30 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'all'
                ? 'bg-[#4A3E3D] text-[#FDFBF7] shadow-xs'
                : 'text-[#8C7A6B] hover:text-[#4A3E3D]'
            }`}
          >
            Semua ({guests.length})
          </button>

          <button
            onClick={() => setFilterTab('vip')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'vip'
                ? 'bg-[#B99A63] text-white shadow-xs'
                : 'text-[#8C7A6B] hover:text-[#4A3E3D]'
            }`}
          >
            VIP ({guests.filter(g => (g.namaTamu && g.namaTamu.includes('(VIP)')) || (g.pesan && g.pesan.includes('(Tamu VIP'))).length})
          </button>

          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'pending'
                ? 'bg-[#4A3E3D] text-[#FDFBF7] shadow-xs'
                : 'text-[#8C7A6B] hover:text-[#4A3E3D]'
            }`}
          >
            Belum
          </button>

          <button
            onClick={() => setFilterTab('checkedIn')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'checkedIn'
                ? 'bg-[#2D5A47] text-white shadow-xs'
                : 'text-[#8C7A6B] hover:text-[#4A3E3D]'
            }`}
          >
            Sudah
          </button>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-[#C5A880] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Nama Tamu / QR Code ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F3E9] border border-[#C5A880]/40 text-xs text-[#4A3E3D] placeholder-[#8C7A6B] focus:outline-none focus:border-[#B99A63] focus:ring-1 focus:ring-[#B99A63] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7A6B] hover:text-[#4A3E3D]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Guest Table List View */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-[#C5A880]/30 rounded-xl">
          <p className="text-xs text-[#8C7A6B]">Tidak ada data tamu yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredGuests.map((g) => {
            const isCheckedIn = g.checkIn && g.checkIn.trim() !== '';

            return (
              <div
                key={g.qrCodeId}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCheckedIn
                    ? 'bg-[#2D5A47]/5 border-[#2D5A47]/30'
                    : 'bg-[#F7F3E9]/60 border-[#C5A880]/30 hover:border-[#B99A63]'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-1 cursor-pointer" onClick={() => onSelectGuest(g)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#4A3E3D] font-serif-luxury">
                      {g.namaTamu}
                    </span>
                    {((g.namaTamu && g.namaTamu.includes('(VIP)')) || (g.pesan && g.pesan.includes('(Tamu VIP'))) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#B99A63] text-white shadow-2xs">
                        VIP
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#C5A880]/20 text-[#4A3E3D]">
                      {g.jumlahTamu} Pax
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8C7A6B]">
                    <span className="flex items-center gap-1 font-mono">
                      <Hash className="w-3 h-3 text-[#C5A880]" />
                      {g.qrCodeId}
                    </span>

                    {g.pesan && (
                      <span className="truncate max-w-[200px] italic">
                        "{g.pesan}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Status / Action */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#C5A880]/20">
                  {isCheckedIn ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#2D5A47] bg-[#2D5A47]/10 px-2.5 py-1 rounded-lg border border-[#2D5A47]/30">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{g.checkIn}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onQuickCheckIn(g)}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#2D5A47] hover:bg-[#234738] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check-in</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
