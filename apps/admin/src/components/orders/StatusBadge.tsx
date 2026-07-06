import { Text, View } from 'react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  ACCEPTED: { bg: '#DBEAFE', text: '#1E3A5F', label: 'Accepted' },
  PREPARING: { bg: '#EDE9FE', text: '#4C1D95', label: 'Preparing' },
  OUT_FOR_DELIVERY: { bg: '#FFEDD5', text: '#9A3412', label: 'Out for Delivery' },
  DELIVERED: { bg: '#D1FAE5', text: '#065F46', label: 'Delivered' },
  REJECTED: { bg: '#FEE2E2', text: '#7F1D1D', label: 'Rejected' },
  CANCELLED: { bg: '#F3F4F6', text: '#374151', label: 'Cancelled' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: '#F3F4F6', text: '#374151', label: status };

  return (
    <View
      style={{
        backgroundColor: style.bg,
        borderRadius: 999,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        paddingVertical: size === 'sm' ? 3 : 5,
      }}
    >
      <Text
        style={{
          fontFamily: 'Urbanist-SemiBold',
          fontSize: size === 'sm' ? 11 : 12,
          color: style.text,
        }}
      >
        {style.label}
      </Text>
    </View>
  );
}

export { STATUS_STYLES };
