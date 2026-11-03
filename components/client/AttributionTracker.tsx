'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { initAttribution } from '@/lib/attribution';

function TrackerInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams) {
      initAttribution(searchParams, pathname);
    }
  }, [searchParams, pathname]);

  return null;
}

export default function AttributionTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}

