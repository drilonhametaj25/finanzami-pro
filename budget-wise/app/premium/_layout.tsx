import { Stack } from 'expo-router';

export default function PremiumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
