import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { cartApi, settingsApi } from '../../src/api';
import { useCartStore } from '../../src/store/cart.store';
import { useAuthStore } from '../../src/store/auth.store';
import { useGuestCartStore } from '../../src/store/guest-cart.store';
import type { Cart } from '@bitebolt/types';

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Delivery fee from server settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
    staleTime: 1000 * 60 * 5,
  });
  const deliveryFeeAmount = settings?.delivery_fee ? Number(settings.delivery_fee) : 40;

  // Guest cart
  const guestItems = useGuestCartStore((s) => s.items);
  const updateGuestQty = useGuestCartStore((s) => s.updateQuantity);
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);

  // Server cart (only when authenticated)
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = (await cartApi.getCart()) as Cart;
      setCart(data);
      return data;
    },
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.updateItem(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update cart' }),
  });

  // ── Guest cart view ──────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    if (guestItems.length === 0) {
      return (
        <SafeAreaView
          style={{ flex: 1, backgroundColor: '#EEEEF5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
          edges={['top']}
        >
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FA793820', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="cart-outline" size={46} color="#FA7938" />
          </View>
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', marginBottom: 8 }}>
            Your cart is empty
          </Text>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', textAlign: 'center', marginBottom: 28 }}>
            Add some delicious items to get started!
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ backgroundColor: '#FA7938', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}>
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#fff', fontSize: 15 }}>Browse Menu</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    const guestSubtotal = guestItems.reduce((sum, i) => {
      const price = i.discountedPrice ?? i.price;
      return sum + price * i.quantity;
    }, 0);
    const guestDelivery = guestSubtotal > 0 ? deliveryFeeAmount : 0;
    const guestTax = Math.round(guestSubtotal * 0.05);
    const guestTotal = guestSubtotal + guestDelivery + guestTax;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
        >
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>My Cart</Text>
        </Animated.View>

        {/* Sign-in banner */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={{ marginHorizontal: 20, marginBottom: 14, backgroundColor: '#FFF8F5', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FA793830' }}
        >
          <Ionicons name="information-circle-outline" size={22} color="#FA7938" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}>Sign in to place your order</Text>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginTop: 2 }}>Your cart will be saved when you log in.</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/phone')}
            style={{ backgroundColor: '#FA7938', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#FFFFFF' }}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Items */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ paddingHorizontal: 20, gap: 12 }}>
            {guestItems.map((item, idx) => {
              const price = item.discountedPrice ?? item.price;
              return (
                <Animated.View
                  key={item.foodItemId}
                  entering={FadeInDown.delay(Math.min(idx * 70, 350)).duration(400)}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <Image
                    source={{ uri: item.imageUrl ?? 'https://placehold.co/64x64/EEEEF5/9098B1?text=Food' }}
                    style={{ width: 64, height: 64, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>{item.name}</Text>
                    <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158', marginTop: 4 }}>
                      ₹{(price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEEEF5', borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => updateGuestQty(item.foodItemId, item.quantity - 1)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FA7938', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 14, color: '#414158', minWidth: 16, textAlign: 'center' }}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateGuestQty(item.foodItemId, item.quantity + 1)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FA7938', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Bill summary */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
          >
            <BillRow label="Subtotal" value={`₹${guestSubtotal.toFixed(2)}`} />
            <BillRow label="Delivery" value={`₹${guestDelivery.toFixed(2)}`} />
            <BillRow label="Tax (5%)" value={`₹${guestTax.toFixed(2)}`} />
            <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 10 }} />
            <BillRow label="Total" value={`₹${guestTotal.toFixed(2)}`} bold valueColor="#FA7938" />
          </Animated.View>
        </ScrollView>

        {/* Checkout bar — redirects to login */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10, flexDirection: 'row', alignItems: 'center', gap: 16 }}
        >
          <View>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Total</Text>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>₹{guestTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/phone')}
            style={{ flex: 1, backgroundColor: '#FA7938', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: '#FA7938', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>Sign In to Checkout</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Authenticated loading ────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEEF5' }}>
        <ActivityIndicator size="large" color="#FA7938" />
      </View>
    );
  }

  // ── Authenticated empty cart ─────────────────────────────────
  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#EEEEF5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        edges={['top']}
      >
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FA793820', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Ionicons name="cart-outline" size={46} color="#FA7938" />
        </View>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', marginBottom: 8 }}>Your cart is empty</Text>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', textAlign: 'center', marginBottom: 28 }}>
          Add some delicious items to get started!
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ backgroundColor: '#FA7938', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#fff', fontSize: 15 }}>Browse Menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Authenticated cart ───────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#414158" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>My Cart</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cart items */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ paddingHorizontal: 20, gap: 12 }}>
          {cart.items.map((item, idx) => {
            const food = item.foodItem!;
            const price = food.discountedPrice ? Number(food.discountedPrice) : Number(food.price);
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(idx * 70, 350)).duration(400)}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <Image
                  source={{ uri: food.imageUrl ?? 'https://placehold.co/64x64/EEEEF5/9098B1?text=Food' }}
                  style={{ width: 64, height: 64, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text numberOfLines={1} style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>{food.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 12, color: '#9098B1', marginLeft: 3 }}>{food.rating ?? '4.5'}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158', marginTop: 4 }}>
                    ₹{(price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEEEF5', borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4, gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FA7938', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="remove" size={16} color="#fff" />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 14, color: '#414158', minWidth: 16, textAlign: 'center' }}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FA7938', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Voucher */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEEEF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="settings-outline" size={18} color="#9098B1" />
            </View>
            <TextInput
              placeholder="Enter your voucher code"
              placeholderTextColor="#C4C9D4"
              style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 14, color: '#414158' }}
            />
          </View>
        </Animated.View>

        {/* Bill summary */}
        <Animated.View
          entering={FadeInDown.delay(280).duration(400)}
          style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <BillRow label="Subtotal" value={`₹${Number(cart.subtotal).toFixed(2)}`} />
          <BillRow label="Delivery" value={`₹${Number(cart.deliveryFee).toFixed(2)}`} />
          <BillRow label="Tax (5%)" value={`₹${Number(cart.taxes).toFixed(2)}`} />
          <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 10 }} />
          <BillRow label="Total" value={`₹${Number(cart.total).toFixed(2)}`} bold valueColor="#FA7938" />
        </Animated.View>
      </ScrollView>

      {/* Checkout bar */}
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10, flexDirection: 'row', alignItems: 'center', gap: 16 }}
      >
        <View>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Total</Text>
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>₹{Number(cart.total).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/checkout')}
          style={{ flex: 1, backgroundColor: '#FA7938', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#FA7938', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>Checkout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontFamily: bold ? 'Urbanist-SemiBold' : 'Urbanist', fontSize: 14, color: bold ? '#414158' : '#9098B1' }}>{label}</Text>
      <Text style={{ fontFamily: bold ? 'Urbanist-Bold' : 'Urbanist-Medium', fontSize: 14, color: valueColor ?? (bold ? '#414158' : '#9098B1') }}>{value}</Text>
    </View>
  );
}
