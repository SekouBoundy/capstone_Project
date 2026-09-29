import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ColorValue, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={focused ? 25 : 23}
      color={color}
      style={{ marginBottom: -2 }}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // iOS needs extra height to clear the home indicator. Android
          // draws its nav bar outside the tab bar, so it is shorter.
          ...Platform.select({
            ios: { height: 84, paddingTop: spacing.sm },
            android: { height: 62, paddingTop: spacing.xs },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: radii.md,
          paddingVertical: 2,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="housing"
        options={{
          title: t('nav.housing'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home-variant' : 'home-variant-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: t('nav.marketplace'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'storefront' : 'storefront-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('nav.messages'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'message-text' : 'message-text-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'account-circle' : 'account-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
