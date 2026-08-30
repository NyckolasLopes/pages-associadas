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
      {/* Rodas da motinha */}
      <circle cx="5.5" cy="17.5" r="3" />
      <circle cx="18.5" cy="17.5" r="3" />
      {/* Quadro, banco e guidão */}
      <path d="M12 17.5h3.5l2.5-6.5h-3" />
      <path d="M5.5 17.5l3-6.5h4" />
      <path d="M9.5 11l2-5h3" />
      {/* Baú / entrega */}
      <path d="M4 11h3.5l.8 3" />
    </svg>
  );
}
