'use client';

import { useWishlist } from '@/contexts/wishlist-context';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { CartIcon } from '@/components/cart-icon';
import { WishlistIcon } from '@/components/wishlist-icon';

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b shadow-sm sticky top-0 bg-background z-10">
          <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
            <div className="flex items-center justify-between">
              <Link href="/">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity text-foreground dark:bg-gradient-to-r dark:from-primary dark:to-primary/60 dark:bg-clip-text dark:text-transparent">
                  StackShop
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                <WishlistIcon />
                <CartIcon />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Link href="/">
            <Button variant="ghost" className="mb-6 hover:bg-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <Card className="p-8 md:p-12 shadow-sm">
            <div className="text-center space-y-4">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Your wishlist is empty</h2>
              <p className="text-muted-foreground">
                Save items you love to your wishlist for later.
              </p>
              <Link href="/">
                <Button className="mt-4">
                  Explore Products
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b shadow-sm sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer">
                StackShop
              </h1>
            </Link>
            <div className="flex items-center gap-2">
              <WishlistIcon />
              <CartIcon />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 hover:bg-accent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Wishlist</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearWishlist}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <Card
              key={item.stacklineSku}
              className="h-full hover:shadow-lg transition-all flex flex-col shadow-sm relative group"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFromWishlist(item.stacklineSku)}
                aria-label="Remove from wishlist"
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader
                className="p-3 md:p-4 cursor-pointer"
                onClick={() => router.push(`/product/${item.stacklineSku}`)}
              >
                <div className="relative h-36 md:h-40 w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-3 md:pt-4 flex-1 flex flex-col px-3 md:px-6">
                <h3
                  className="text-sm md:text-base font-semibold line-clamp-2 mb-2 cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/product/${item.stacklineSku}`)}
                >
                  {item.title}
                </h3>
                <div className="flex gap-1.5 md:gap-2 flex-wrap mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.categoryName}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.subCategoryName}
                  </Badge>
                </div>
                {item.retailPrice && (
                  <p className="text-base md:text-lg font-bold text-primary mt-auto mb-2">
                    ${item.retailPrice.toFixed(2)}
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-0 mt-auto px-3 md:px-6 pb-3 md:pb-6 gap-2">
                {item.retailPrice && (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      addToCart({
                        stacklineSku: item.stacklineSku,
                        title: item.title,
                        retailPrice: item.retailPrice!,
                        imageUrl: item.imageUrl,
                        categoryName: item.categoryName,
                      });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

