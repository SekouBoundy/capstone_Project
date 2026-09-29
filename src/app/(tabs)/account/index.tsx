import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/authStore';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, radii, typography, shadow } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, user, signOut } = useAuthStore();

  const isAdmin = profile?.role === 'admin';

  const menuItems: { label: string; route: string; icon: IconName }[] = [
    { label: t('account.editProfile'), route: '/account/edit', icon: 'account-edit-outline' },
    { label: t('account.listings'), route: '/account/listings', icon: 'home-city-outline' },
    { label: t('account.products'), route: '/account/products', icon: 'tag-outline' },
    { label: t('account.favorites'), route: '/account/favorites', icon: 'heart-outline' },
    { label: t('account.verification'), route: '/account/verification', icon: 'shield-check-outline' },
    { label: t('account.settings'), route: '/account/settings', icon: 'cog-outline' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('account.title')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.identity}>
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

            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.full_name || t('account.name')}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
              {profile?.university ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {profile.university}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/account/edit')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editButtonText}>{t('account.editProfile')}</Text>
          </Pressable>
        </View>

        <View style={styles.group}>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as never)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name={item.icon} size={19} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        {isAdmin ? (
          <Pressable
            onPress={() => router.push('/admin')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.adminRow, pressed && styles.pressed]}
          >
            <View style={[styles.menuIcon, styles.adminIcon]}>
              <MaterialCommunityIcons name="shield-crown-outline" size={19} color={colors.warning} />
            </View>
            <Text style={styles.menuLabel}>{t('admin.dashboard')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl },

  card: {
    ...shadow.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  identity: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: colors.primary },
  identityText: { flex: 1 },
  name: { ...typography.title, fontSize: 19 },
  email: { ...typography.caption, marginTop: 2 },
  meta: { ...typography.captionMuted, marginTop: 2 },
  editButton: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editButtonText: { ...typography.bodyStrong, color: colors.primary },

  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: { ...typography.body, flex: 1 },

  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminIcon: { backgroundColor: colors.warningBg },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  logoutText: { ...typography.bodyStrong, color: colors.danger },
  pressed: { opacity: 0.6 },
});
