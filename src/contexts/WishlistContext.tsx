import { createContext, useContext, useState, ReactNode } from "react";
import { storageKeys, getJSON, setJSON, migrateKey } from "@/lib/storage";

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

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    // Migrate from legacy key then load
    migrateKey("blackplague_wishlist", storageKeys.wishlist);
    return getJSON<WishlistItem[]>(storageKeys.wishlist, []);
  });

  const saveToStorage = (newItems: WishlistItem[]) => {
    setJSON(storageKeys.wishlist, newItems);
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

