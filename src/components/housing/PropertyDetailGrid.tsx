import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface DetailItem {
  icon: IconName;
  value: string;
  label: string;
}

interface PropertyDetailGridProps {
  items: DetailItem[];
}

/**
 * Icon + value + label grid for a listing's key facts.
 *
 * Three columns regardless of item count, so the row of facts keeps the
 * same rhythm whether a place has four facts or seven. The label is
 * `numberOfLines={2}` because translated labels ("Available from") are
 * longer than the English source and would otherwise clip.
 */
export function PropertyDetailGrid({ items }: PropertyDetailGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <MaterialCommunityIcons name={item.icon} size={20} color={colors.textSecondary} />
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  item: {
    // `width: '33.33%'` with no gap: the gap is carried by the item's own
    // horizontal padding, so three items always fit three-up at any
    // screen width without a `gap`-then-wrap interaction.
    width: '33.33%',
    alignItems: 'flex-start',
    paddingRight: spacing.sm,
  },
  value: { ...typography.bodyStrong, marginTop: spacing.xs },
  label: { ...typography.label, color: colors.textMuted, marginTop: 1 },
});
