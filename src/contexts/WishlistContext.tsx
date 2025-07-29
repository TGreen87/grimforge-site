import { createContext, useContext, useState, ReactNode } from "react";

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
    // Load from localStorage on init
    const saved = localStorage.getItem("blackplague_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const saveToStorage = (newItems: WishlistItem[]) => {
    localStorage.setItem("blackplague_wishlist", JSON.stringify(newItems));
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
    localStorage.removeItem("blackplague_wishlist");
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

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};