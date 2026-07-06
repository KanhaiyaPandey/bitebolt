import { Text, View } from 'react-native';

import { STATUS_STYLES } from './StatusBadge';

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: string | Date;
}

interface StatusTimelineProps {
  history: StatusHistoryItem[];
}

function formatTime(dt: string | Date) {
  const d = new Date(dt);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  return (
    <View>
      {history.map((item, i) => {
        const style = STATUS_STYLES[item.status] ?? {
          bg: '#F3F4F6',
          text: '#374151',
          label: item.status,
        };
        const isLast = i === history.length - 1;

        return (
          <View key={item.id} style={{ flexDirection: 'row', paddingLeft: 16 }}>
            {/* Timeline line + dot */}
            <View style={{ alignItems: 'center', width: 24, marginRight: 12 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: style.text,
                  marginTop: 3,
                }}
              />
              {!isLast && (
                <View
                  style={{ width: 2, flex: 1, backgroundColor: '#E0E0EA', marginVertical: 4 }}
                />
              )}
            </View>

            <View style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: style.text }}>
                {style.label}
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginTop: 1 }}
              >
                {formatTime(item.createdAt)}
              </Text>
              {item.notes && (
                <Text
                  style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#6B7280', marginTop: 2 }}
                >
                  {item.notes}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
