import { Text, View } from 'react-native';

import { color, orderTone, space, text } from '@/theme';

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
        const tone = orderTone(item.status);
        const isLast = i === history.length - 1;

        return (
          <View key={item.id} style={{ flexDirection: 'row', paddingLeft: space[4] }}>
            {/* Timeline line + dot */}
            <View style={{ alignItems: 'center', width: space[6], marginRight: space[3] }}>
              <View
                style={{
                  width: space[3],
                  height: space[3],
                  borderRadius: space[1.5],
                  backgroundColor: tone.text,
                  marginTop: space[0.5] + 1,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: color.borderStrong,
                    marginVertical: space[1],
                  }}
                />
              )}
            </View>

            <View style={{ paddingBottom: isLast ? 0 : space[4], flex: 1 }}>
              <Text style={[text.label, { color: tone.text }]}>{tone.label}</Text>
              <Text style={[text.caption, { color: color.textSecondary, marginTop: 1 }]}>
                {formatTime(item.createdAt)}
              </Text>
              {item.notes && (
                <Text style={[text.caption, { color: color.textSecondary, marginTop: space[0.5] }]}>
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
