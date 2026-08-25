import React from 'react';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';

export default function StatsCard({ stats, isLoading }) {
  const {
    totalGuests = 0,
    totalPeople = 0,
    checkedInGuests = 0,
    checkedInPeople = 0,
    remainingGuests = 0,
    remainingPeople = 0,
  } = stats || {};

  const cards = [
    {
      title: 'TOTAL TAMU',
      subtitle: `${totalPeople} Total Orang`,
      value: totalGuests,
      icon: Users,
      bgColor: 'bg-[#F7F3E9]',
      borderColor: 'border-[#C5A880]/40',
      textColor: 'text-[#4A3E3D]',
      iconColor: 'text-[#C5A880]',
    },
    {
      title: 'TOTAL ORANG',
      subtitle: 'Pax Terdaftar',
      value: totalPeople,
      icon: Users,
      bgColor: 'bg-[#F7F3E9]',
      borderColor: 'border-[#C5A880]/40',
      textColor: 'text-[#4A3E3D]',
      iconColor: 'text-[#8C7A6B]',
    },
    {
      title: 'SUDAH CHECK-IN',
      subtitle: `${checkedInPeople} Orang Masuk`,
      value: checkedInGuests,
      icon: UserCheck,
      bgColor: 'bg-[#2D5A47]/10',
      borderColor: 'border-[#2D5A47]/40',
      textColor: 'text-[#2D5A47]',
      iconColor: 'text-[#2D5A47]',
    },
    {
      title: 'BELUM CHECK-IN',
      subtitle: `${remainingPeople} Orang Dinanti`,
      value: remainingGuests,
      icon: UserX,
      bgColor: 'bg-[#8C7A6B]/10',
      borderColor: 'border-[#8C7A6B]/40',
      textColor: 'text-[#8C7A6B]',
      iconColor: 'text-[#8C7A6B]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className={`p-4 rounded-xl border ${item.borderColor} ${item.bgColor} shadow-xs luxury-card-hover flex flex-col justify-between transition-all`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C7A6B]">
                {item.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-white/80 ${item.iconColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-bold font-serif-luxury ${item.textColor}`}>
                {isLoading ? '...' : item.value}
              </span>
              <span className="text-xs text-[#8C7A6B] font-medium">
                {item.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
