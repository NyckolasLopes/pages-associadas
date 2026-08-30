import React from "react";

export function MotorcycleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Baú de Entrega / Delivery Box */}
      <rect x="1.5" y="6" width="5.5" height="5.5" rx="1" strokeWidth="1.8" />
      <line x1="4.25" y1="8" x2="4.25" y2="10" strokeWidth="1.5" />

      {/* Roda Traseira */}
      <circle cx="5" cy="17" r="3" strokeWidth="2" />
      <circle cx="5" cy="17" r="0.8" fill="currentColor" />

      {/* Roda Dianteira */}
      <circle cx="19" cy="17" r="3" strokeWidth="2" />
      <circle cx="19" cy="17" r="0.8" fill="currentColor" />

      {/* Para-lamas */}
      <path d="M2.5 14.5a3 3 0 0 1 5 0" strokeWidth="1.5" />
      <path d="M16.5 14.5a3 3 0 0 1 5 0" strokeWidth="1.5" />

      {/* Chassi, Apoio e Banco */}
      <path d="M7 11.5h4.5l2.5 5.5" strokeWidth="2" />
      <path d="M7 11.5c1-1 3.2-1 4.5 0" strokeWidth="2" />
      <path d="M5 11.5v2.5" strokeWidth="1.8" />

      {/* Garfo Dianteiro, Guidão e Farol */}
      <path d="M19 17l-3.5-9h-2.5" strokeWidth="2" />
      <path d="M15 8h2.5" strokeWidth="2" />
      <path d="M16.8 5.5l1.5 2.5" strokeWidth="1.8" />
    </svg>
  );
}
