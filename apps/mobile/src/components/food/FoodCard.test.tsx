import type { FoodItem } from '@bitebolt/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import Toast from 'react-native-toast-message';

import { mswServer } from '../../mocks/server';
import { FoodCard } from './FoodCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeFoodItem = (overrides = {}): FoodItem =>
  ({
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
  }) as unknown as FoodItem;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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

  it('renders the effective price', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.getByText(/₹250/)).toBeTruthy();
  });

  it('shows discounted price and strikes through the original when a discount applies', () => {
    const item = makeFoodItem({ price: '250', discountedPrice: '200' });
    render(<FoodCard item={item} onPress={onPress} />, { wrapper });

    expect(screen.getByText(/₹200/)).toBeTruthy();
    expect(screen.getByText(/₹250/)).toBeTruthy();
    expect(screen.getByText(/% OFF/)).toBeTruthy();
  });

  it('does not show a discount badge when there is no discount', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.queryByText(/% OFF/)).toBeNull();
  });

  it('calls onPress when the card is tapped', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    fireEvent.press(screen.getByText('Paneer Butter Masala'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the ADD button', () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    expect(screen.getByText('+ ADD')).toBeTruthy();
  });

  it('shows success toast after a successful add (MSW returns 200)', async () => {
    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    fireEvent.press(screen.getByText('+ ADD'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: 'Added to cart!', text2: 'Paneer Butter Masala' }),
      );
    });
  });

  it('shows error toast when the server returns an error', async () => {
    mswServer.use(
      http.post('http://localhost:3001/api/v1/cart/items', () =>
        HttpResponse.json({ message: 'Out of stock' }, { status: 500 }),
      ),
    );

    render(<FoodCard item={makeFoodItem()} onPress={onPress} />, { wrapper });

    fireEvent.press(screen.getByText('+ ADD'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: 'Could not add item' }),
      );
    });
  });
});
