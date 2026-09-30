import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/authStore';
import { useMyListings } from '@/hooks/useProperties';
import { useMyProducts } from '@/hooks/useProducts';
import { useFavoriteCount } from '@/hooks/useFavorites';
import { useMyVerification } from '@/hooks/useVerification';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { colors, spacing, radii, typography, shadow, tabBarMetrics } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Row {
  label: string;
  route: string;
  icon: IconName;
  /** Optional right-hand value, e.g. a count or a status. */
  value?: string;
}

interface Section {
  title: string;
  rows: Row[];
}

function formatMemberSince(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, user, signOut } = useAuthStore();

  const { data: listings } = useMyListings();
  const { data: products } = useMyProducts();
  const { data: favorites } = useFavoriteCount();
  const { data: verification } = useMyVerification(user?.id);

  // Verification is not a column on `profiles`; it is the status of the
  // latest row in `verification_requests`.
  const isVerified = verification?.status === 'approved';

  const verificationLabel = !verification
    ? t('account.verificationNone')
    : verification.status === 'approved'
      ? t('common.approved')
      : verification.status === 'rejected'
        ? t('common.rejected')
        : t('common.pending');

  const stats = [
    { label: t('account.listingsShort'), value: listings?.length ?? 0, route: '/account/listings' },
    { label: t('account.productsShort'), value: products?.length ?? 0, route: '/account/products' },
    { label: t('account.favoritesShort'), value: favorites ?? 0, route: '/account/favorites' },
  ];

  const sections: Section[] = [
    {
      title: t('account.sectionAccount'),
      rows: [
        // `account-outline` rather than `account-edit-outline`: the latter
        // packs a figure and a pencil into a 20px box and the strokes
        // collapse into a smudge. The row label already says "Edit".
        { label: t('account.editProfile'), route: '/account/edit', icon: 'account-outline' },
        {
          label: t('account.verification'),
          route: '/account/verification',
          icon: 'shield-check-outline',
          value: verificationLabel,
        },
        { label: t('account.settings'), route: '/account/settings', icon: 'cog-outline' },
      ],
    },
    {
      title: t('account.sectionActivity'),
      rows: [
        // `home-outline`, not `home-city-outline`: the building's window
        // grid is unreadable at 20px and reads as "office block" rather
        // than "a place someone lives".
        { label: t('account.listings'), route: '/account/listings', icon: 'home-outline' },
        { label: t('account.products'), route: '/account/products', icon: 'tag-outline' },
        { label: t('account.favorites'), route: '/account/favorites', icon: 'heart-outline' },
      ],
    },
  ];

  const memberSince = formatMemberSince(profile?.created_at);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* No large "My Account" title: the identity block below is the
          heading on this screen, so the name reads once, at the top. The
          status bar inset is still reserved so the avatar never tucks
          under the notch. */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.md,
            // The dock floats over the scroll view, so the last row (Log
            // out) needs to clear it or it ends up half-hidden behind the
            // bar.
            paddingBottom: tabBarMetrics.totalHeight + insets.bottom + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity hero, centered */}
        <View style={styles.hero}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.full_name || t('account.name')}
            </Text>
            {user?.email ? (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            {profile?.university || isVerified ? (
              <View style={styles.tagRow}>
                {profile?.university ? (
                  <Text style={styles.tag} numberOfLines={1}>
                    {profile.university}
                  </Text>
                ) : null}
                {isVerified ? <VerifiedBadge /> : null}
              </View>
            ) : null}
            {memberSince ? (
              <Text style={styles.memberSince}>
                {t('account.memberSince')} {memberSince}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stat strip */}
        <View style={styles.statRow}>
          {stats.map((stat) => (
            <Pressable
              key={stat.route}
              onPress={() => router.push(stat.route as never)}
              accessibilityRole="button"
              accessibilityLabel={`${stat.value} ${stat.label}`}
              style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Grouped settings, iOS Settings style */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.group}>
              {section.rows.map((row, index) => (
                <Pressable
                  key={row.route}
                  onPress={() => router.push(row.route as never)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.row,
                    index < section.rows.length - 1 && styles.rowDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={row.icon}
                    size={20}
                    color={colors.textSecondary}
                    style={styles.rowIcon}
                  />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {profile?.role === 'admin' ? (
          <View style={styles.section}>
            <View style={styles.group}>
              <Pressable
                onPress={() => router.push('/admin')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons
                  name="shield-crown-outline"
                  size={20}
                  color={colors.text}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowLabel}>{t('admin.dashboard')}</Text>
                <View style={styles.adminPill}>
                  <Text style={styles.adminPillText}>ADMIN</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },

  // Hero: stacked and centered. Avatar on top, then a centered block of
  // name / email / university / member-since. `alignItems: 'center'` on
  // the column plus `alignSelf: 'stretch'` on the text so long university
  // names can ellipsize instead of stretching the layout.
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '600', color: colors.text },
  identity: {
    alignItems: 'center',
    marginTop: spacing.md,
    // Reserve the full width so centered text is centred on the screen,
    // not on the width of its longest line.
    alignSelf: 'stretch',
  },
  name: { ...typography.title, fontSize: 21, textAlign: 'center' },
  email: { ...typography.caption, marginTop: 2, textAlign: 'center' },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tag: { ...typography.captionMuted, flexShrink: 1, textAlign: 'center' },
  memberSince: {
    ...typography.captionMuted,
    marginTop: spacing.xs,
    fontSize: 12,
    textAlign: 'center',
  },

  // Stats
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  stat: {
    flex: 1,
    ...shadow.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { marginRight: spacing.lg },
  rowLabel: { ...typography.body, flex: 1 },
  rowValue: { ...typography.caption, marginRight: spacing.xs },
  adminPill: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
  },
  adminPillText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Logout: plain text, no chrome. A bordered red box pulls far too much
  // attention for a secondary destructive action.
  logout: { alignItems: 'center', paddingVertical: spacing.lg },
  logoutText: { ...typography.body, color: colors.danger, fontWeight: '500' },

  pressed: { opacity: 0.55 },
});
