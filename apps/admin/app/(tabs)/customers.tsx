import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { customersApi } from '@/api';
import { CustomerRow } from '@/components/customers/CustomerRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useDebounce } from '@/hooks/useDebounce';
import { color, layout, space, text, ui } from '@/theme';

export default function CustomersScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin-customers', { search: debouncedSearch }],
    queryFn: () => {
      console.debug('[AdminCustomers] Fetching customers', { search: debouncedSearch });
      return customersApi.getAll({ search: debouncedSearch || undefined, page: 1, limit: 50 });
    },
    staleTime: 30_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers: any[] = Array.isArray(data) ? data : ((data as any)?.customers ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: color.surface,
          paddingTop: insets.top + space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.borderSubtle,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: layout.screenX,
            marginBottom: space[3],
          }}
        >
          <Ionicons
            name="people-outline"
            size={22}
            color={color.brand}
            style={{ marginRight: space[2] }}
          />
          <Text style={[text.h2, { color: color.textPrimary }]}>Customers</Text>
          {customers.length > 0 && (
            <View style={[ui.badge(color.brandSubtle), { marginLeft: space[2] }]}>
              <Text style={[text.captionStrong, { color: color.brand }]}>{customers.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ paddingTop: space[3] }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone…" />
      </View>

      {isLoading ? (
        <View>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} height={72} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load customers"
          subtitle="Check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <CustomerRow item={item} index={index} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: space[1], paddingBottom: layout.listBottomInset }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No customers found"
              subtitle={
                search
                  ? 'Try a different search term'
                  : 'Customers will appear here once they sign up'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={color.brand}
              colors={[color.brand]}
            />
          }
        />
      )}
    </View>
  );
}
