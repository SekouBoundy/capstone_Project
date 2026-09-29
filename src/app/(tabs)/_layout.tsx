import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DockTabBar } from '@/components/ui/DockTabBar';
import { useConversations } from '@/hooks/useConversations';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();

  // Shares react-query's cache with the messages screen, so this is not
  // a second request — it just surfaces the unread total on the tab.
  const { data: conversations } = useConversations();
  const unread = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unread_count ?? 0),
    0
  );

  return (
    <Tabs
      // Floating dock. Labels live in the icons now; the DockTabBar sets
      // an accessibility label per trigger so this is not a loss.
      tabBar={(props) => <DockTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="housing"
        options={{
          title: t('nav.housing'),
          tabBarAccessibilityLabel: t('nav.housing'),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: t('nav.marketplace'),
          tabBarAccessibilityLabel: t('nav.marketplace'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('nav.messages'),
          tabBarAccessibilityLabel: t('nav.messages'),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account'),
          tabBarAccessibilityLabel: t('nav.account'),
        }}
      />
    </Tabs>
  );
}
