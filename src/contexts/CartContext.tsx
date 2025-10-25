"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storageKeys, getJSON, setJSON } from "@/src/lib/storage";

export interface CartItem {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string; // for multi-item checkout
  priceId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Initialize from localStorage on client side
    const storedItems = getJSON<CartItem[]>(storageKeys.cart, []);
    const sanitized = Array.isArray(storedItems)
      ? storedItems.filter((item) => (Boolean(item.variantId) || Boolean(item.priceId)) && item.quantity > 0)
      : [];
    if (sanitized.length !== storedItems.length) {
      setJSON(storageKeys.cart, sanitized);
    }
    setItems(sanitized);
  }, []);

  useEffect(() => {
    // Only save to localStorage on client side
    if (typeof window === 'undefined') return;
    
    setJSON(storageKeys.cart, items);
  }, [items]);
  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                priceId: item.priceId ?? newItem.priceId,
                variantId: item.variantId ?? newItem.variantId,
              }
            : item
        );
      }
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      getTotalItems,
      getTotalPrice,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
