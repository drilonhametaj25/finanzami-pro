import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function PatrimonioLayout() {
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
          title: 'Patrimonio',
        }}
      />
      <Stack.Screen
        name="add-investment"
        options={{
          title: 'Nuovo Investimento',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-account"
        options={{
          title: 'Nuovo Conto',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-debt"
        options={{
          title: 'Nuovo Debito',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
