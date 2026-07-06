import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

import { categoriesApi, foodsApi } from '@/api';
import { ImagePicker } from '@/components/menu/ImagePicker';
import {
  FieldError,
  FieldLabel,
  FormInput,
  PrimaryButton,
  ToggleRow,
} from '@/components/ui/FormControls';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { color, elevation, layout, press, radius, space, text, ui } from '@/theme';

const DECIMAL_RE = /^\d+(\.\d{1,2})?$/;
const INT_RE = /^\d+$/;

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.string().min(1, 'Price is required').regex(DECIMAL_RE, 'Enter a valid price'),
  discountedPrice: z
    .string()
    .optional()
    .refine((v) => !v || DECIMAL_RE.test(v), 'Enter a valid price'),
  imageUrl: z.string().optional(),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  preparationTime: z
    .string()
    .min(1, 'Prep time is required')
    .regex(INT_RE, 'Enter a valid time in minutes'),
  sortOrder: z
    .string()
    .optional()
    .refine((v) => !v || INT_RE.test(v), 'Enter a valid number'),
});

type FormData = z.infer<typeof schema>;

export default function NewFoodScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isVeg: true, isAvailable: true, preparationTime: '15' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      console.debug('[AdminMenu] Add food item', { name: data.name, categoryId: data.categoryId });
      return foodsApi.create({
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        price: Number(data.price),
        discountedPrice: data.discountedPrice ? Number(data.discountedPrice) : undefined,
        imageUrl: data.imageUrl,
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
    onError: (err) => console.error('[AdminMenu] Add food failed', err),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = Array.isArray(catData) ? catData : ((catData as any)?.items ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScreenHeader title="Add Food Item" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: layout.screenX, paddingBottom: space[12] }}>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />}
          />

          <View style={{ marginBottom: space[4] }}>
            <FieldLabel>Name *</FieldLabel>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="e.g. Paneer Butter Masala"
                  error={errors.name?.message}
                />
              )}
            />
            <FieldError message={errors.name?.message} />
          </View>

          <View style={{ marginBottom: space[4] }}>
            <FieldLabel>Category *</FieldLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: space[2], paddingVertical: space[1] }}
            >
              {categories.map((c: { id: string; name: string }) => {
                const selected = watch('categoryId') === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setValue('categoryId', c.id)}
                    activeOpacity={press.secondary}
                    style={ui.chip(selected)}
                  >
                    <Text
                      style={[
                        text.label,
                        { color: selected ? color.onBrand : color.textSecondary },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <FieldError message={errors.categoryId?.message} />
          </View>

          <View style={{ marginBottom: space[4] }}>
            <FieldLabel>Description</FieldLabel>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <FormInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Short description…"
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={{ flex: 1, marginBottom: space[4] }}>
              <FieldLabel>Price (₹) *</FieldLabel>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <FormInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="0"
                    keyboardType="numeric"
                    error={errors.price?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, marginBottom: space[4] }}>
              <FieldLabel>Discounted Price</FieldLabel>
              <Controller
                control={control}
                name="discountedPrice"
                render={({ field }) => (
                  <FormInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={{ flex: 1, marginBottom: space[4] }}>
              <FieldLabel>Prep Time (min) *</FieldLabel>
              <Controller
                control={control}
                name="preparationTime"
                render={({ field }) => (
                  <FormInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="15"
                    keyboardType="numeric"
                    error={errors.preparationTime?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, marginBottom: space[4] }}>
              <FieldLabel>Sort Order</FieldLabel>
              <Controller
                control={control}
                name="sortOrder"
                render={({ field }) => (
                  <FormInput
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
            style={[
              {
                backgroundColor: color.surface,
                borderRadius: radius.card,
                padding: space[4],
                marginBottom: space[4],
                gap: space[3.5],
              },
              elevation.sm,
            ]}
          >
            <Controller
              control={control}
              name="isVeg"
              render={({ field }) => (
                <ToggleRow
                  label="Vegetarian"
                  value={field.value}
                  onValueChange={field.onChange}
                  tone={color.success}
                />
              )}
            />
            <Controller
              control={control}
              name="isAvailable"
              render={({ field }) => (
                <ToggleRow label="Available" value={field.value} onValueChange={field.onChange} />
              )}
            />
          </View>

          <PrimaryButton
            label="Add Food Item"
            onPress={handleSubmit((data) => mutation.mutate(data))}
            loading={mutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
