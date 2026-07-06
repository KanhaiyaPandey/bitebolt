import { View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

interface DaySale {
  date: string;
  orderCount: number;
  revenue: number;
}

interface SalesChartProps {
  data: DaySale[];
}

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
}

function formatRevenue(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

const CHART_HEIGHT = 140;
const BAR_WIDTH = 28;
const BAR_RADIUS = 6;
const BAR_SPACING = 16;

export function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const chartWidth = data.length * (BAR_WIDTH + BAR_SPACING) + BAR_SPACING;

  return (
    <View>
      <Svg width={chartWidth} height={CHART_HEIGHT + 36}>
        {data.map((item, i) => {
          const barH = Math.max((item.revenue / max) * CHART_HEIGHT, 4);
          const x = BAR_SPACING / 2 + i * (BAR_WIDTH + BAR_SPACING);
          const y = CHART_HEIGHT - barH;
          const isToday = i === data.length - 1;

          return (
            <G key={item.date}>
              <Rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barH}
                rx={BAR_RADIUS}
                fill={isToday ? '#FA7938' : '#FA793826'}
              />
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 16}
                textAnchor="middle"
                fontSize={10}
                fontFamily="Urbanist"
                fill="#9098B1"
              >
                {formatDay(item.date)}
              </SvgText>
              {item.revenue > 0 && (
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="Urbanist-SemiBold"
                  fill={isToday ? '#FA7938' : '#9098B1'}
                >
                  {formatRevenue(item.revenue)}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
