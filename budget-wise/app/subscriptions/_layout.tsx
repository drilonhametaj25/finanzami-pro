import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function SubscriptionsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Abbonamenti',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Nuovo Abbonamento',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
