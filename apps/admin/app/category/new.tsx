import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { categoriesApi } from '@/api';
import { ImagePicker } from '@/components/menu/ImagePicker';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean(),
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

export default function NewCategoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      console.debug('[AdminMenu] Add category', { name: data.name, isActive: data.isActive });
      return categoriesApi.create({
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder ? parseInt(data.sortOrder, 10) : undefined,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      router.back();
    },
    onError: (err) => console.error('[AdminMenu] Add category failed', err),
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <ScreenHeader title="Add Category" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <ImagePicker value={field.value} onChange={field.onChange} label="Category Image" />
            )}
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
                  placeholder="e.g. Starters"
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
              Description
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <StyledInput
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

          <View style={{ marginBottom: 16 }}>
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

          <View
            style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{ flex: 1, fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
              >
                Active
              </Text>
              <Controller
                control={control}
                name="isActive"
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
                Add Category
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
