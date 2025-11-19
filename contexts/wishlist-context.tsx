'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WishlistItem {
  stacklineSku: string;
  title: string;
  retailPrice?: number;
  imageUrl: string;
  categoryName: string;
  subCategoryName: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (sku: string) => void;
  isInWishlist: (sku: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Failed to load wishlist from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToWishlist = (item: WishlistItem) => {
    setItems((prevItems) => {
      const exists = prevItems.find((i) => i.stacklineSku === item.stacklineSku);
      if (exists) {
        return prevItems;
      }
      return [...prevItems, item];
    });
  };

  const removeFromWishlist = (sku: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.stacklineSku !== sku));
  };

  const isInWishlist = (sku: string) => {
    return items.some((item) => item.stacklineSku === sku);
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

