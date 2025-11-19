'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { useRouter } from 'next/navigation';

export function CartIcon() {
  const { getTotalItems } = useCart();
  const router = useRouter();
  const totalItems = getTotalItems();

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={() => router.push('/cart')}
      aria-label={`Shopping cart with ${totalItems} items`}
    >
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Button>
  );
}

