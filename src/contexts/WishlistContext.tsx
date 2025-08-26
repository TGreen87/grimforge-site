import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storageKeys, getJSON, setJSON, migrateKey } from "@/src/lib/storage";

interface WishlistItem {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  getTotalItems: () => number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Migrate from legacy key then load
    migrateKey("blackplague_wishlist", storageKeys.wishlist);
    const storedItems = getJSON<WishlistItem[]>(storageKeys.wishlist, []);
    setItems(storedItems);
  }, []);

  const saveToStorage = (newItems: WishlistItem[]) => {
    // Only save to localStorage on client side
    if (typeof window !== 'undefined') {
      setJSON(storageKeys.wishlist, newItems);
    }
    setItems(newItems);
  };

  const addItem = (newItem: Omit<WishlistItem, "addedAt">) => {
    const existingItem = items.find(item => item.id === newItem.id);
    if (!existingItem) {
      const itemWithDate = {
        ...newItem,
        addedAt: new Date().toISOString()
      };
      const newItems = [...items, itemWithDate];
      saveToStorage(newItems);
    }
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveToStorage(newItems);
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const clearWishlist = () => {
    localStorage.removeItem(storageKeys.wishlist);
    setItems([]);
  };

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      isInWishlist,
      getTotalItems,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

