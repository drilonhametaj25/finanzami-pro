import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function OnboardingLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="income" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
