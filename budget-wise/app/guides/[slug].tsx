import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, IconButton, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GUIDES } from '../../constants/guides';
import { spacing, brandColors } from '../../constants/theme';

export default function GuideDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const guide = GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="titleLarge">Guida non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Headers
      if (trimmedLine.startsWith('### ')) {
        return (
          <Text
            key={index}
            variant="titleMedium"
            style={[styles.h3, { color: theme.colors.primary }]}
          >
            {trimmedLine.replace('### ', '')}
          </Text>
        );
      }
      if (trimmedLine.startsWith('## ')) {
        return (
          <Text key={index} variant="titleLarge" style={styles.h2}>
            {trimmedLine.replace('## ', '')}
          </Text>
        );
      }
      if (trimmedLine.startsWith('# ')) {
        return null; // Skip main title, we show it in header
      }

      // Lists
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return (
          <View key={index} style={styles.listItem}>
            <Text variant="bodyLarge" style={styles.bullet}>
              •
            </Text>
            <Text variant="bodyLarge" style={styles.listText}>
              {trimmedLine.replace(/^[-*] /, '')}
            </Text>
          </View>
        );
      }

      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\. (.+)/);
      if (numberedMatch) {
        return (
          <View key={index} style={styles.listItem}>
            <Text variant="bodyLarge" style={styles.number}>
              {numberedMatch[1]}.
            </Text>
            <Text variant="bodyLarge" style={styles.listText}>
              {numberedMatch[2]}
            </Text>
          </View>
        );
      }

      // Checkmarks
      if (trimmedLine.startsWith('✅') || trimmedLine.startsWith('❌')) {
        return (
          <Text key={index} variant="bodyLarge" style={styles.paragraph}>
            {trimmedLine}
          </Text>
        );
      }

      // Bold text (simple version)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <Text key={index} variant="bodyLarge" style={styles.bold}>
            {trimmedLine.replace(/\*\*/g, '')}
          </Text>
        );
      }

      // Regular paragraph
      if (trimmedLine) {
        return (
          <Text key={index} variant="bodyLarge" style={styles.paragraph}>
            {trimmedLine}
          </Text>
        );
      }

      // Empty line
      return <View key={index} style={styles.spacer} />;
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <View style={styles.headerInfo}>
          <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
            {guide.title}
          </Text>
          <Chip compact icon="clock-outline">
            {guide.readingTime} min di lettura
          </Chip>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <Card style={styles.heroCard} mode="elevated">
          <Card.Content style={styles.heroContent}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={guide.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={40}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              {guide.title}
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.heroDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              {guide.description}
            </Text>
          </Card.Content>
        </Card>

        {/* Content */}
        <Card style={styles.contentCard} mode="elevated">
          <Card.Content>{renderContent(guide.content)}</Card.Content>
        </Card>

        {/* Tips */}
        {guide.tips && guide.tips.length > 0 && (
          <Card style={styles.tipsCard} mode="elevated">
            <Card.Content>
              <View style={styles.tipsHeader}>
                <MaterialCommunityIcons
                  name="lightbulb"
                  size={24}
                  color={brandColors.warning}
                />
                <Text variant="titleMedium" style={styles.tipsTitle}>
                  Consigli pratici
                </Text>
              </View>
              {guide.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={brandColors.success}
                  />
                  <Text variant="bodyMedium" style={styles.tipText}>
                    {tip}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroDescription: {
    textAlign: 'center',
  },
  contentCard: {
    marginBottom: spacing.md,
  },
  h2: {
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  h3: {
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  bullet: {
    width: 20,
  },
  number: {
    width: 24,
  },
  listText: {
    flex: 1,
    lineHeight: 24,
  },
  spacer: {
    height: spacing.sm,
  },
  tipsCard: {
    backgroundColor: '#FFF8E1',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    fontWeight: 'bold',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
});
