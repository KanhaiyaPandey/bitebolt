import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { customersApi } from '@/api';
import { CustomerRow } from '@/components/customers/CustomerRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useDebounce } from '@/hooks/useDebounce';

export default function CustomersScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
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
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 12,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F8',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Ionicons name="people-outline" size={22} color="#FA7938" style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
            Customers
          </Text>
          {customers.length > 0 && (
            <View
              style={{
                marginLeft: 8,
                backgroundColor: '#FFF4EE',
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: '#FA7938' }}>
                {customers.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ paddingTop: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone…" />
      </View>

      {isLoading ? (
        <View>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} height={72} />
          ))}
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <CustomerRow item={item} index={index} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
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
              tintColor="#FA7938"
              colors={['#FA7938']}
            />
          }
        />
      )}
    </View>
  );
}
