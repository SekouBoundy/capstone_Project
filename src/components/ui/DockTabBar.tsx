import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, radii, spacing, shadow, tabBarMetrics } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Route name -> icon per focus state. Keyed by the screen name declared
 * in `(tabs)/_layout.tsx`; a route missing here renders an empty slot
 * rather than crashing.
 */
const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  housing: { active: 'home-variant', inactive: 'home-variant-outline' },
  marketplace: { active: 'storefront', inactive: 'storefront-outline' },
  messages: { active: 'message-text', inactive: 'message-text-outline' },
  account: { active: 'account-circle', inactive: 'account-circle-outline' },
};

/**
 * Floating dock tab bar with a raised centre action.
 *
 * Replaces the default React Navigation bar via the `tabBar` prop. Using
 * a custom bar rather than `expo-router/ui` is deliberate: `ui` is still
 * labelled experimental, and the styled `Tabs` navigator already handles
 * the things that are easy to get wrong by hand — state, descriptors,
 * safe-area, and press handling.
 *
 * The centre button is a real flex slot, not an absolutely positioned
 * overlay. A 4-slot bar cannot fit it: at 358pt wide the neighbouring
 * icon circles sit 22pt from the bar centre while a 60pt button needs
 * 30pt, so they overlap by 8pt. As a 5th slot the icons clear it by
 * 16pt. It is also an action rather than a destination, which is why it
 * opens `/create` instead of navigating within the tab navigator.
 */
export function DockTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const routes = state.routes;
  // Centre the action between the two middle tabs.
  const left = routes.slice(0, Math.floor(routes.length / 2));
  const right = routes.slice(Math.floor(routes.length / 2));

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const focused = state.routes[state.index].key === route.key;

    const label =
      typeof options.tabBarAccessibilityLabel === 'string'
        ? options.tabBarAccessibilityLabel
        : typeof options.title === 'string'
          ? options.title
          : route.name;

    const icon = ICONS[route.name];
    const badge = options.tabBarBadge;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
          {icon ? (
            <MaterialCommunityIcons
              name={focused ? icon.active : icon.inactive}
              size={tabBarMetrics.iconSize}
              color={focused ? colors.text : 'rgba(255,255,255,0.62)'}
            />
          ) : null}
        </View>

        {badge != null && badge !== '' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {typeof badge === 'number' && badge > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + tabBarMetrics.marginBottom }]}>
      <View style={[styles.bar, shadow.raised]}>
        {left.map(renderTab)}

        {/* Raised centre action. `marginTop` pulls the whole button up so
            the black disc breaks the bar's top edge; both it and the bar
            are the same fill, so the union reads as one bumped shape. */}
        <View style={styles.item}>
          <Pressable
            onPress={() => router.push('/create')}
            accessibilityRole="button"
            accessibilityLabel={t('create.title')}
            style={({ pressed }) => [
              styles.fabTouch,
              shadow.raised,
              pressed && styles.fabPressed,
            ]}
          >
            <View style={styles.fabOuter}>
              <View style={styles.fabInner}>
                <MaterialCommunityIcons name="plus" size={26} color={colors.text} />
              </View>
            </View>
          </Pressable>
        </View>

        {right.map((route, i) => renderTab(route, i + left.length + 1))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: tabBarMetrics.marginHorizontal,
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tabBarMetrics.barHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },

  iconWrap: {
    width: tabBarMetrics.activeSize,
    height: tabBarMetrics.activeSize,
    borderRadius: tabBarMetrics.activeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.surface },

  fabTouch: {
    width: tabBarMetrics.fabSize,
    height: tabBarMetrics.fabSize,
    borderRadius: tabBarMetrics.fabSize / 2,
    marginTop: -tabBarMetrics.notchRise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: { opacity: 0.85 },
  fabOuter: {
    width: tabBarMetrics.fabSize,
    height: tabBarMetrics.fabSize,
    borderRadius: tabBarMetrics.fabSize / 2,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabInner: {
    width: tabBarMetrics.fabInnerSize,
    height: tabBarMetrics.fabInnerSize,
    borderRadius: tabBarMetrics.fabInnerSize / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: '50%',
    marginRight: -20,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '700' },
});
