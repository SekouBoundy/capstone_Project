import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '@/theme';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function EmptyState({ icon = 'magnify', title, description, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <Text
          accessibilityRole="button"
          onPress={action.onPress}
          style={styles.action}
        >
          {action.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl * 1.5,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, textAlign: 'center' },
  description: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  action: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.lg,
  },
});
