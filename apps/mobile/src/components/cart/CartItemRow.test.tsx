import type { CartItem } from '@bitebolt/types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CartItemRow } from './CartItemRow';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeCartItem = (overrides = {}): CartItem =>
  ({
    id: 'cart-1',
    quantity: 2,
    specialInstructions: null,
    foodItem: {
      id: 'food-1',
      name: 'Masala Dosa',
      price: 120,
      discountedPrice: null,
      imageUrl: null,
    },
    ...overrides,
  }) as unknown as CartItem;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CartItemRow', () => {
  const onIncrement = jest.fn();
  const onDecrement = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the food name', () => {
    render(
      <CartItemRow item={makeCartItem()} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );

    expect(screen.getByText('Masala Dosa')).toBeTruthy();
  });

  it('renders the total price (price × quantity)', () => {
    render(
      <CartItemRow item={makeCartItem()} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );

    // 120 * 2 = 240
    expect(screen.getByText(/₹240/)).toBeTruthy();
  });

  it('renders the current quantity', () => {
    render(
      <CartItemRow
        item={makeCartItem({ quantity: 3 })}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />,
    );

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('calls onIncrement when + is pressed', () => {
    render(
      <CartItemRow item={makeCartItem()} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );

    fireEvent.press(screen.getByText('+'));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('calls onDecrement when − is pressed', () => {
    render(
      <CartItemRow item={makeCartItem()} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );

    fireEvent.press(screen.getByText('−'));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('shows special instructions when present', () => {
    const item = makeCartItem({ specialInstructions: 'Extra spicy please' });
    render(<CartItemRow item={item} onIncrement={onIncrement} onDecrement={onDecrement} />);

    expect(screen.getByText(/Extra spicy please/)).toBeTruthy();
  });

  it('uses discounted price for the total when available', () => {
    const item = makeCartItem({
      quantity: 2,
      foodItem: {
        id: 'food-1',
        name: 'Masala Dosa',
        price: 120,
        discountedPrice: 100,
        imageUrl: null,
      },
    });
    render(<CartItemRow item={item} onIncrement={onIncrement} onDecrement={onDecrement} />);

    // 100 * 2 = 200
    expect(screen.getByText(/₹200/)).toBeTruthy();
  });
});
