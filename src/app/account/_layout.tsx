import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="listings" />
      <Stack.Screen name="products" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
