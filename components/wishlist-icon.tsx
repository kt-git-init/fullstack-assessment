'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/wishlist-context';
import { useRouter } from 'next/navigation';

export function WishlistIcon() {
  const { items } = useWishlist();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={() => router.push('/wishlist')}
      aria-label={`Wishlist with ${items.length} items`}
    >
      <Heart className={`h-4 w-4 ${items.length > 0 ? 'fill-current' : ''}`} />
      {items.length > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
          {items.length > 9 ? '9+' : items.length}
        </span>
      )}
    </Button>
  );
}

