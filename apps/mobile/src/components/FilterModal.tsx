import type { Category } from '@bitebolt/types';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterState {
  categoryId: string | null;
  isVeg: boolean | null;
  minRating: number | null;
}

export const EMPTY_FILTERS: FilterState = {
  categoryId: null,
  isVeg: null,
  minRating: null,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  categories: Category[];
  initialFilters: FilterState;
}

export function FilterModal({ visible, onClose, onApply, categories, initialFilters }: Props) {
  const [local, setLocal] = useState<FilterState>(initialFilters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLocal(initialFilters);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 320,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animateOut = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(cb);
  };

  const handleClose = () => animateOut(onClose);

  const handleApply = () => {
    onApply(local);
    animateOut(onClose);
  };

  const activeCount = [
    local.categoryId,
    local.isVeg !== null ? true : null,
    local.minRating,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Blurred backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={handleClose}>
          <BlurView intensity={22} tint="dark" style={{ flex: 1 }} />
        </Pressable>
      </Animated.View>

      {/* Glass panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />

        <View style={styles.content}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Filters {activeCount > 0 && <Text style={{ color: '#FA7938' }}>({activeCount})</Text>}
            </Text>
            <TouchableOpacity
              onPress={() => setLocal(EMPTY_FILTERS)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.resetLabel}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
          >
            {/* Categories */}
            {categories.length > 0 && (
              <Section title="Category">
                <View style={styles.chipRow}>
                  {categories.map((cat) => {
                    const sel = local.categoryId === cat.id;
                    return (
                      <Chip
                        key={cat.id}
                        label={cat.name}
                        selected={sel}
                        onPress={() => setLocal((f) => ({ ...f, categoryId: sel ? null : cat.id }))}
                      />
                    );
                  })}
                </View>
              </Section>
            )}

            {/* Dietary */}
            <Section title="Dietary">
              <View style={styles.chipRow}>
                <Chip
                  label="🌱 Veg"
                  selected={local.isVeg === true}
                  onPress={() => setLocal((f) => ({ ...f, isVeg: f.isVeg === true ? null : true }))}
                />
                <Chip
                  label="🍖 Non-Veg"
                  selected={local.isVeg === false}
                  onPress={() =>
                    setLocal((f) => ({ ...f, isVeg: f.isVeg === false ? null : false }))
                  }
                />
              </View>
            </Section>

            {/* Rating */}
            <Section title="Minimum Rating">
              <View style={styles.chipRow}>
                {[3, 3.5, 4, 4.5].map((r) => (
                  <Chip
                    key={r}
                    label={`★ ${r}+`}
                    selected={local.minRating === r}
                    onPress={() =>
                      setLocal((f) => ({ ...f, minRating: f.minRating === r ? null : r }))
                    }
                  />
                ))}
              </View>
            </Section>
          </ScrollView>
        </View>

        {/* Apply bar */}
        <View style={styles.applyBar}>
          <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyLabel}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ' Filters'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 22, marginBottom: 4 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.82,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(242,242,247,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 28,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(60,60,67,0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.18)',
  },
  title: {
    fontFamily: 'Urbanist-Bold',
    fontSize: 18,
    color: '#1C1C1E',
    flex: 1,
  },
  resetLabel: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 14,
    color: '#FA7938',
  },
  sectionTitle: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.15)',
  },
  chipSelected: {
    backgroundColor: '#FA7938',
    borderColor: '#FA7938',
  },
  chipLabel: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 13,
    color: '#3C3C43',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
  applyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.15)',
    overflow: 'hidden',
  },
  applyBtn: {
    backgroundColor: '#FA7938',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    shadowColor: '#FA7938',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  applyLabel: {
    fontFamily: 'Urbanist-SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
  },
});
