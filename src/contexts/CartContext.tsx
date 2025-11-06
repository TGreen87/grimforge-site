"use client";

import { ReactNode, createContext, useContext } from "react";

export interface CartItem {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
}

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  clearCart: () => void;
};

const noop = () => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Cart interactions are disabled in headless mode.");
  }
};

const defaultCartContext: CartContextType = {
  items: [],
  addItem: noop,
  removeItem: noop,
  updateQuantity: noop,
  getTotalItems: () => 0,
  getTotalPrice: () => 0,
  clearCart: noop,
};

export const CartContext = createContext<CartContextType>(defaultCartContext);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => (
  <CartContext.Provider value={defaultCartContext}>{children}</CartContext.Provider>
);
