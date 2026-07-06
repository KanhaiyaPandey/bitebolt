import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

import { categoriesApi, foodsApi } from '@/api';
import { ImagePicker } from '@/components/menu/ImagePicker';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.string().min(1, 'Price is required'),
  discountedPrice: z.string().optional(),
  imageUrl: z.string().optional(),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  preparationTime: z.string().min(1, 'Prep time is required'),
  sortOrder: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function StyledInput({
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={{
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: error ? '#EF4444' : focused ? '#FA7938' : '#D3D6DE',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: 'Urbanist',
        fontSize: 14,
        color: '#414158',
        ...((props.style as object) ?? {}),
      }}
      placeholderTextColor="#C4C9D4"
    />
  );
}

export default function EditFoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: foodData, isLoading } = useQuery({
    queryKey: ['admin-food', id],
    queryFn: () => foodsApi.getById(id!),
    enabled: !!id,
  });

  const { data: catData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.getAll,
    staleTime: 60_000,
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isVeg: true, isAvailable: true, preparationTime: '15' },
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const food: any = Array.isArray(foodData) ? foodData[0] : foodData;
    if (!food) return;
    reset({
      name: food.name,
      description: food.description ?? '',
      categoryId: food.categoryId,
      price: String(food.price),
      discountedPrice: food.discountedPrice ? String(food.discountedPrice) : '',
      imageUrl: food.imageUrl ?? '',
      isVeg: food.isVeg,
      isAvailable: food.isAvailable,
      preparationTime: String(food.preparationTime),
      sortOrder: food.sortOrder != null ? String(food.sortOrder) : '',
    });
  }, [foodData, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      console.debug('[AdminMenu] Edit food item', { id, name: data.name });
      return foodsApi.update(id!, {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        price: Number(data.price),
        discountedPrice: data.discountedPrice ? Number(data.discountedPrice) : null,
        imageUrl: data.imageUrl || undefined,
        isVeg: data.isVeg,
        isAvailable: data.isAvailable,
        preparationTime: parseInt(data.preparationTime, 10),
        sortOrder: data.sortOrder ? parseInt(data.sortOrder, 10) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-foods'] });
      router.back();
    },
    onError: (err) => console.error('[AdminMenu] Edit food failed', err),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = Array.isArray(catData) ? catData : ((catData as any)?.items ?? []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
        <ScreenHeader title="Edit Food Item" showBack />
        <SkeletonCard height={200} />
        <SkeletonCard height={100} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <ScreenHeader title="Edit Food Item" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />}
          />

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 13,
                color: '#9098B1',
                marginBottom: 6,
              }}
            >
              Name *
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <StyledInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Name"
                  error={errors.name?.message}
                />
              )}
            />
            {errors.name && (
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#EF4444', marginTop: 4 }}
              >
                {errors.name.message}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 13,
                color: '#9098B1',
                marginBottom: 6,
              }}
            >
              Category *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {categories.map((c: { id: string; name: string }) => {
                const selected = watch('categoryId') === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setValue('categoryId', c.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: selected ? '#FA7938' : '#F5F5FA',
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Urbanist-SemiBold',
                        fontSize: 13,
                        color: selected ? '#FFF' : '#9098B1',
                      }}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 13,
                color: '#9098B1',
                marginBottom: 6,
              }}
            >
              Description
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <StyledInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Description…"
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 6,
                }}
              >
                Price (₹) *
              </Text>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <StyledInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="0"
                    keyboardType="numeric"
                    error={errors.price?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 6,
                }}
              >
                Discounted Price
              </Text>
              <Controller
                control={control}
                name="discountedPrice"
                render={({ field }) => (
                  <StyledInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 6,
                }}
              >
                Prep Time (min) *
              </Text>
              <Controller
                control={control}
                name="preparationTime"
                render={({ field }) => (
                  <StyledInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="15"
                    keyboardType="numeric"
                    error={errors.preparationTime?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 6,
                }}
              >
                Sort Order
              </Text>
              <Controller
                control={control}
                name="sortOrder"
                render={({ field }) => (
                  <StyledInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{ flex: 1, fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
              >
                Vegetarian
              </Text>
              <Controller
                control={control}
                name="isVeg"
                render={({ field }) => (
                  <Switch
                    value={field.value}
                    onValueChange={field.onChange}
                    trackColor={{ false: '#E0E0EA', true: '#10B981' }}
                    thumbColor="#FFF"
                  />
                )}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{ flex: 1, fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
              >
                Available
              </Text>
              <Controller
                control={control}
                name="isAvailable"
                render={({ field }) => (
                  <Switch
                    value={field.value}
                    onValueChange={field.onChange}
                    trackColor={{ false: '#E0E0EA', true: '#FA7938' }}
                    thumbColor="#FFF"
                  />
                )}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#FA7938',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#FA7938',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#FFF' }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
