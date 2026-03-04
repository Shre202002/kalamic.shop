'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <Card className="group border-none bg-white rounded-[2.5rem] overflow-hidden premium-shadow h-full flex flex-col relative">
      {/* Image Skeleton */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F6F1E9]">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Content Skeleton */}
      <CardHeader className="p-8 pb-2 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-3/4 rounded-lg" />
      </CardHeader>

      <CardContent className="px-8 pb-6 flex-1">
        <Skeleton className="h-3 w-full rounded-md mb-2" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
      </CardContent>

      <CardFooter className="px-8 pb-10 flex flex-col gap-6 mt-auto">
        <div className="w-full flex items-baseline justify-between">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      </CardFooter>
    </Card>
  );
}
