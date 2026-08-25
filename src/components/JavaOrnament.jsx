import React from 'react';

/**
 * Subtle Jawa Modern SVG Ornament (Gunungan / Borobudur Stupa Accent)
 */
export function JavaDivider({ className = "w-32 h-6 my-2 text-[#C5A880]" }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#C5A880]"></span>
      <svg viewBox="0 0 40 24" fill="none" className="w-6 h-6 text-[#B99A63] opacity-90" xmlns="http://www.w3.org/2000/svg">
        {/* Stupa / Gunungan motif */}
        <path d="M20 2L24 8L20 7L16 8L20 2Z" fill="currentColor" />
        <path d="M20 7L27 15H13L20 7Z" fill="currentColor" opacity="0.8" />
        <path d="M20 12L30 21H10L20 12Z" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="3" r="1.5" fill="#4A3E3D" />
      </svg>
      <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#C5A880]"></span>
    </div>
  );
}

export function JavaCornerAccent({ className = "w-6 h-6 text-[#C5A880]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2H10M2 2V10M2 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}
