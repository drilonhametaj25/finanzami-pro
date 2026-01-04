import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function HubLayout() {
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          title: 'Badge e Traguardi',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Calendario Cash Flow',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="simulator"
        options={{
          title: 'Simulatore What If',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
