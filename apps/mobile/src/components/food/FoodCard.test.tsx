import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { FoodCard } from './FoodCard';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../api', () => ({
  cartApi: {
    addItem: jest.fn().mockResolvedValue({}),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeFoodItem = (overrides = {}) => ({
  id: 'food-1',
  name: 'Paneer Butter Masala',
  description: 'Rich and creamy paneer curry',
  price: '250',
  discountedPrice: null,
  imageUrl: null,
  isVeg: true,
  isAvailable: true,
  categoryId: 'cat-1',
  ...overrides,
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FoodCard', () => {
  const onPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the food name and description', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.getByText('Paneer Butter Masala')).toBeTruthy();
    expect(screen.getByText('Rich and creamy paneer curry')).toBeTruthy();
  });

  it('renders the price', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.getByText(/₹250/)).toBeTruthy();
  });

  it('shows discounted price and strikes through original price when a discount applies', () => {
    const item = makeFoodItem({ price: '250', discountedPrice: '200' });
    render(<FoodCard item={item} onPress={onPress} />, { wrapper });

    expect(screen.getByText(/₹200/)).toBeTruthy();
    expect(screen.getByText(/₹250/)).toBeTruthy();
    expect(screen.getByText(/% OFF/)).toBeTruthy();
  });

  it('does not show discount badge when there is no discount', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.queryByText(/% OFF/)).toBeNull();
  });

  it('calls onPress when the card is tapped', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    fireEvent.press(screen.getByText('Paneer Butter Masala'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the ADD button', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.getByText('+ ADD')).toBeTruthy();
  });
});
