'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if someone navigates to /product without a SKU
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to catalog...</p>
    </div>
  );
}
