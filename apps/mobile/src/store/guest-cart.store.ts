import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'bitebolt_guest_cart';

export interface GuestCartItem {
  foodItemId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  discountedPrice: number | null;
  isVeg: boolean;
  quantity: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addItem: (item: Omit<GuestCartItem, 'quantity'>) => Promise<void>;
  updateQuantity: (foodItemId: string, quantity: number) => Promise<void>;
  removeItem: (foodItemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useGuestCartStore = create<GuestCartState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const items: GuestCartItem[] = raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
      set({ items, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addItem: async (itemData) => {
    const current = get().items;
    const idx = current.findIndex((i) => i.foodItemId === itemData.foodItemId);
    const items =
      idx >= 0
        ? current.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + 1 } : i))
        : [...current, { ...itemData, quantity: 1 }];
    set({ items });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  updateQuantity: async (foodItemId, quantity) => {
    const items =
      quantity <= 0
        ? get().items.filter((i) => i.foodItemId !== foodItemId)
        : get().items.map((i) => (i.foodItemId === foodItemId ? { ...i, quantity } : i));
    set({ items });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  removeItem: async (foodItemId) => {
    const items = get().items.filter((i) => i.foodItemId !== foodItemId);
    set({ items });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  clear: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
