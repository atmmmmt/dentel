import React from 'react';

/** Fixed Dentovi SaaS identity. Clinic-specific logos remain configurable separately. */
export default function BrandLogo({ light = false, compact = false, className = '' }) {
  return (
    <span className={['inline-flex items-center gap-2.5 select-none', className].filter(Boolean).join(' ')} dir="ltr" aria-label="Dentovi — Dental Clinic Management">
      <img src="/dentovi-mark.svg" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 transition-transform duration-300 motion-safe:group-hover:scale-105" />
      {!compact && (
        <span className="flex min-w-0 flex-col justify-center leading-tight text-left">
          <span className={['font-english text-[20px] font-extrabold tracking-[-.035em]', light ? 'text-white' : 'text-[#0B2D4A]'].join(' ')}>
            Dentov<span className="text-[#0FB5A7]">i</span>
          </span>
          <span className={['font-english whitespace-nowrap text-[9px] font-medium tracking-[.01em]', light ? 'text-white/75' : 'text-[#728197]'].join(' ')}>
            Dental Clinic Management
          </span>
        </span>
      )}
    </span>
  );
}
