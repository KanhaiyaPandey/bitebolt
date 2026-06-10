import type { CartItem, FoodItem } from '@bitebolt/types';

import { useCartStore } from '../../store/cart.store';

const makeCartItem = (id: string): CartItem =>
  ({
    id,
    userId: 'user-1',
    foodItemId: 'food-1',
    quantity: 2,
    specialInstructions: null,
    foodItem: {
      id: 'food-1',
      name: 'Paneer Butter Masala',
      price: '250',
      discountedPrice: null,
    } as unknown as FoodItem,
  }) as unknown as CartItem;

const fullCart = {
  items: [makeCartItem('cart-1'), makeCartItem('cart-2')],
  itemCount: 4,
  subtotal: 1000,
  deliveryFee: 40,
  taxes: 50,
  total: 1090,
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      taxes: 0,
      total: 0,
    });
  });

  it('starts with an empty cart and zero totals', () => {
    const state = useCartStore.getState();

    expect(state.items).toHaveLength(0);
    expect(state.itemCount).toBe(0);
    expect(state.total).toBe(0);
  });

  describe('setCart', () => {
    it('replaces state with the provided cart data', () => {
      useCartStore.getState().setCart(fullCart);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.itemCount).toBe(4);
      expect(state.subtotal).toBe(1000);
      expect(state.deliveryFee).toBe(40);
      expect(state.taxes).toBe(50);
      expect(state.total).toBe(1090);
    });
  });

  describe('clearLocalCart', () => {
    it('resets all cart fields to zero / empty', () => {
      useCartStore.getState().setCart(fullCart);
      useCartStore.getState().clearLocalCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.itemCount).toBe(0);
      expect(state.subtotal).toBe(0);
      expect(state.deliveryFee).toBe(0);
      expect(state.taxes).toBe(0);
      expect(state.total).toBe(0);
    });
  });
});
