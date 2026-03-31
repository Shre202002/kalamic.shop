import React from 'react';

/**
 * @fileOverview Performance-optimised skeleton loader for the product grid.
 * Ensures layout stability (CLS) while content hydrates.
 */

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="aspect-square rounded-[2rem] bg-muted animate-pulse" />
          <div className="space-y-2 px-2">
            <div className="h-4 bg-muted animate-pulse rounded-full w-3/4" />
            <div className="h-3 bg-muted animate-pulse rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
