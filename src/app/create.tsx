import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, radii, typography } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Destination for the dock's raised centre button.
 *
 * The button cannot be a tab — it is an action, not a destination — and
 * the app has two equally-weighted things to create. So it lands here and
 * asks, rather than guessing one and burying the other.
 *
 * The labels deliberately name *what* is being listed, not the action.
 * `housing.createListing` / `marketplace.createListing` read as
 * near-synonyms side by side here — "Create Listing" against "Sell an
 * Item" — which says nothing about where the result lands. These keys say
 * "a place" vs "an item", and keep the word *sell* on one card only.
 */
export default function CreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const options: { title: string; description: string; icon: IconName; href: string }[] = [
    {
      title: t('create.housingTitle'),
      description: t('create.housingDesc'),
      icon: 'home-plus-outline',
      href: '/housing/new',
    },
    {
      title: t('create.marketTitle'),
      description: t('create.marketDesc'),
      icon: 'tag-plus-outline',
      href: '/marketplace/new',
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('create.title')}
        subtitle={t('create.subtitle')}
        onBack={() => router.back()}
      />

      <View style={styles.list}>
        {options.map((option) => (
          <Pressable
            key={option.href}
            onPress={() => router.replace(option.href as never)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={option.icon} size={24} color={colors.text} />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{option.title}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.cancel,
          { marginBottom: insets.bottom + spacing.xl },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.cancelText}>{t('create.close')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  text: { flex: 1 },
  title: { ...typography.heading },
  description: { ...typography.caption, marginTop: 2 },
  cancel: { alignItems: 'center', marginTop: 'auto', paddingVertical: spacing.lg },
  cancelText: { ...typography.body, color: colors.textSecondary },
  pressed: { opacity: 0.6 },
});
