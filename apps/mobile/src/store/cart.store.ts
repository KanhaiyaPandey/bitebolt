import { create } from 'zustand';
import type { CartItem } from '@bitebolt/types';

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;

  setCart: (cart: {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    taxes: number;
    total: number;
  }) => void;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  itemCount: 0,
  subtotal: 0,
  deliveryFee: 0,
  taxes: 0,
  total: 0,

  setCart: (cart) => set(cart),

  clearLocalCart: () =>
    set({ items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, taxes: 0, total: 0 }),
}));
