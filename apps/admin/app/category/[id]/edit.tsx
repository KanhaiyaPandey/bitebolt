import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { z } from 'zod';

import { categoriesApi } from '@/api';
import { ImagePicker } from '@/components/menu/ImagePicker';
import {
  FieldError,
  FieldLabel,
  FormInput,
  PrimaryButton,
  ToggleRow,
} from '@/components/ui/FormControls';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { color, elevation, layout, radius, space } from '@/theme';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: catData, isLoading } = useQuery({
    queryKey: ['admin-category', id],
    queryFn: () => categoriesApi.getById(id!),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat: any = Array.isArray(catData) ? catData[0] : catData;
    if (!cat) return;
    reset({
      name: cat.name,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      sortOrder: cat.sortOrder != null ? String(cat.sortOrder) : '',
      isActive: cat.isActive,
    });
  }, [catData, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      console.debug('[AdminMenu] Edit category', { id, name: data.name });
      return categoriesApi.update(id!, {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || undefined,
        sortOrder: data.sortOrder ? parseInt(data.sortOrder, 10) : undefined,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      router.back();
    },
    onError: (err) => console.error('[AdminMenu] Edit category failed', err),
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ScreenHeader title="Edit Category" showBack />
        <SkeletonCard height={200} />
        <SkeletonCard height={100} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScreenHeader title="Edit Category" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: layout.screenX, paddingBottom: space[12] }}>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <ImagePicker value={field.value} onChange={field.onChange} label="Category Image" />
            )}
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
                  placeholder="e.g. Starters"
                  error={errors.name?.message}
                />
              )}
            />
            <FieldError message={errors.name?.message} />
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
                  placeholder="Brief description…"
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          <View style={{ marginBottom: space[4] }}>
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

          <View
            style={[
              {
                backgroundColor: color.surface,
                borderRadius: radius.card,
                padding: space[4],
                marginBottom: space[4],
              },
              elevation.sm,
            ]}
          >
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <ToggleRow label="Active" value={field.value} onValueChange={field.onChange} />
              )}
            />
          </View>

          <PrimaryButton
            label="Save Changes"
            onPress={handleSubmit((data) => mutation.mutate(data))}
            loading={mutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
