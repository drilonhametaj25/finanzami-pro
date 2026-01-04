import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GUIDES } from '../../constants/guides';
import { spacing } from '../../constants/theme';

export default function GuidesScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Guide Finanziarie
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Impara a gestire meglio i tuoi soldi
          </Text>
        </View>

        {/* Guide List */}
        {GUIDES.map((guide) => (
          <Card
            key={guide.slug}
            style={styles.guideCard}
            mode="elevated"
            onPress={() => router.push(`/guides/${guide.slug}`)}
          >
            <Card.Content style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name={guide.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.guideInfo}>
                <Text variant="titleMedium" numberOfLines={1}>
                  {guide.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  numberOfLines={2}
                >
                  {guide.description}
                </Text>
                <Chip compact style={styles.readingTime}>
                  {guide.readingTime} min
                </Chip>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  guideCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  readingTime: {
    alignSelf: 'flex-start',
    height: 24,
  },
});
