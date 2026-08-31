import React from "react";

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 12 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 flex flex-col gap-3 shadow-sm animate-pulse"
        >
          {/* Tag placeholder */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-12 bg-slate-200 rounded-full" />
            <div className="h-4 w-6 bg-slate-100 rounded-full" />
          </div>

          {/* Image placeholder */}
          <div className="aspect-square w-full rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>

          {/* Brand placeholder */}
          <div className="h-3 w-1/3 bg-slate-200 rounded mt-1" />

          {/* Title placeholder */}
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>

          {/* Price placeholder */}
          <div className="space-y-1 mt-auto pt-2">
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
            <div className="h-5 w-2/3 bg-emerald-100 rounded" />
          </div>

          {/* Button placeholder */}
          <div className="h-9 w-full bg-emerald-600/10 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
