import { Suspense } from 'react';
import MapPageClient from './MapPageClient';

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapPageClient />
    </Suspense>
  );
}
