"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  variantId: string | null;
  productId: string;
  title: string;
  priceCents: number;
  image: string;
  quantity: number;
};

export type AddCartItemInput = {
  variantId?: string | null;
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity?: number;
};

export type CartContextValue = {
  items: CartItem[];
  addItem: (input: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const CartContext = createContext<CartContextValue | null>(null);

function resolveKey(variantId: string | null | undefined, productId: string) {
  return variantId ?? productId;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (input: AddCartItemInput) => {
    if (!input.productId) return;
    const quantity = Number.isFinite(input.quantity) ? Math.max(1, Math.floor(input.quantity ?? 1)) : 1;
    const priceCents = Number.isFinite(input.price) ? Math.max(0, Math.round(input.price * 100)) : 0;
    const variantId = input.variantId ?? null;
    const key = resolveKey(variantId, input.productId);

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => resolveKey(item.variantId, item.productId) === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          variantId: variantId ?? updated[existingIndex].variantId,
          priceCents: priceCents || updated[existingIndex].priceCents,
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          variantId,
          productId: input.productId,
          title: input.title,
          priceCents,
          image: input.image,
          quantity,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => resolveKey(item.variantId, item.productId) !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (resolveKey(item.variantId, item.productId) !== id) return item;
          if (quantity <= 0) {
            return null;
          }
          return { ...item, quantity: Math.floor(quantity) };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setItems([]);

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
