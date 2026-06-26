import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { notificationsApi } from '../src/api';
import { formatDateTime } from '@bitebolt/utils';
import { NotificationType } from '@bitebolt/types';
import type { Notification } from '@bitebolt/types';

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }
> = {
  [NotificationType.ORDER_UPDATE]: { icon: 'receipt-outline', color: '#FA7938' },
  [NotificationType.PAYMENT]: { icon: 'card-outline', color: '#10B981' },
  [NotificationType.PROMOTIONAL]: { icon: 'pricetag-outline', color: '#8B5CF6' },
  [NotificationType.SYSTEM]: { icon: 'information-circle-outline', color: '#3B82F6' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationsApi.getNotifications({ page: 1, limit: 50 }) as unknown as Promise<{
        notifications: Notification[];
      }>,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handlePress = (item: Notification) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.type === NotificationType.ORDER_UPDATE && item.data?.orderId) {
      router.push(`/order/${item.data.orderId as string}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            shadowColor: '#1A1A2E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#414158" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>
          Notifications
        </Text>
        {hasUnread && (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#FA7938' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {isLoading ? (
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color="#FA7938" />
        </Animated.View>
      ) : notifications.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FA793820',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="notifications-outline" size={36} color="#FA7938" />
          </View>
          <Text
            style={{
              fontFamily: 'Urbanist-Bold',
              fontSize: 20,
              color: '#414158',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            No notifications yet
          </Text>
          <Text
            style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', textAlign: 'center' }}
          >
            We'll notify you about your orders and offers here.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const config = TYPE_CONFIG[item.type] ?? {
              icon: 'notifications-outline',
              color: '#9098B1',
            };
            return (
              <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(400)}>
                <TouchableOpacity
                  onPress={() => handlePress(item)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: item.isRead ? '#FFFFFF' : '#FFF8F5',
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    shadowColor: '#1A1A2E',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderWidth: item.isRead ? 0 : 1,
                    borderColor: '#FA793825',
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: config.color + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons name={config.icon} size={20} color={config.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: item.isRead ? 'Urbanist-Medium' : 'Urbanist-Bold',
                          fontSize: 14,
                          color: '#414158',
                          flex: 1,
                          marginRight: 8,
                        }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {!item.isRead && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#FA7938',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Urbanist',
                        fontSize: 13,
                        color: '#9098B1',
                        lineHeight: 18,
                        marginBottom: 6,
                      }}
                      numberOfLines={2}
                    >
                      {item.body}
                    </Text>
                    <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#C4C9D4' }}>
                      {formatDateTime(item.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}

      {/* ── "Mark all read" bottom nudge when list is long ── */}
      {hasUnread && notifications.length > 5 && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 14,
            paddingBottom: 28,
            shadowColor: '#1A1A2E',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.07,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            style={{
              backgroundColor: '#FA7938',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 15 }}>
              Mark All as Read
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
