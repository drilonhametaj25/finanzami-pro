import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Surface, Chip, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { useGamificationStore } from '../../stores/gamificationStore';
import { ACHIEVEMENTS, Achievement } from '../../constants/gamification';
import { spacing, brandColors } from '../../constants/theme';

type AchievementCategory = 'savings' | 'goals' | 'streaks' | 'transactions' | 'special';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  savings: 'Risparmio',
  goals: 'Obiettivi',
  streaks: 'Costanza',
  transactions: 'Transazioni',
  special: 'Speciali',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  savings: 'piggy-bank',
  goals: 'target',
  streaks: 'fire',
  transactions: 'receipt',
  special: 'star',
};

export default function AchievementsScreen() {
  const theme = useTheme();
  const { unlockedAchievements, getStats } = useGamificationStore();
  const stats = getStats();

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const achievementsByCategory = useMemo(() => {
    const categories: Record<AchievementCategory, Achievement[]> = {
      savings: [],
      goals: [],
      streaks: [],
      transactions: [],
      special: [],
    };

    ACHIEVEMENTS.forEach((achievement) => {
      categories[achievement.category].push(achievement);
    });

    return categories;
  }, []);

  const getUnlockedDate = (id: string) => {
    const unlocked = unlockedAchievements.find((a) => a.id === id);
    if (!unlocked) return null;
    return format(new Date(unlocked.unlockedAt), 'd MMM yyyy', { locale: it });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Progress Overview */}
      <Card style={styles.overviewCard} mode="elevated">
        <Card.Content>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <MaterialCommunityIcons name="medal" size={40} color={brandColors.warning} />
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                {stats.unlockedBadges}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Sbloccati
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <MaterialCommunityIcons name="lock-open" size={40} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                {stats.totalBadges - stats.unlockedBadges}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Da sbloccare
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <MaterialCommunityIcons name="percent" size={40} color={brandColors.success} />
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                {Math.round((stats.unlockedBadges / stats.totalBadges) * 100)}%
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Completato
              </Text>
            </View>
          </View>

          <ProgressBar
            progress={stats.unlockedBadges / stats.totalBadges}
            color={brandColors.success}
            style={{ height: 8, borderRadius: 4, marginTop: spacing.md }}
          />
        </Card.Content>
      </Card>

      {/* Achievements by Category */}
      {(Object.keys(achievementsByCategory) as AchievementCategory[]).map((category) => {
        const achievements = achievementsByCategory[category];
        const unlockedCount = achievements.filter((a) => unlockedIds.has(a.id)).length;

        return (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <MaterialCommunityIcons
                name={CATEGORY_ICONS[category] as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={{ marginLeft: 8, fontWeight: 'bold' }}>
                {CATEGORY_LABELS[category]}
              </Text>
              <Chip compact style={{ marginLeft: 'auto' }}>
                {unlockedCount}/{achievements.length}
              </Chip>
            </View>

            <View style={styles.achievementGrid}>
              {achievements.map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                const unlockedDate = getUnlockedDate(achievement.id);

                return (
                  <Surface
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      !isUnlocked && styles.lockedCard,
                    ]}
                    elevation={isUnlocked ? 2 : 0}
                  >
                    <View
                      style={[
                        styles.achievementIcon,
                        {
                          backgroundColor: isUnlocked
                            ? achievement.color + '20'
                            : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          isUnlocked
                            ? (achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap)
                            : 'lock'
                        }
                        size={32}
                        color={isUnlocked ? achievement.color : theme.colors.onSurfaceVariant}
                      />
                    </View>

                    <Text
                      variant="labelLarge"
                      style={[
                        styles.achievementName,
                        !isUnlocked && { color: theme.colors.onSurfaceVariant },
                      ]}
                      numberOfLines={2}
                    >
                      {achievement.name}
                    </Text>

                    <Text
                      variant="bodySmall"
                      style={[
                        styles.achievementDesc,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                      numberOfLines={2}
                    >
                      {achievement.description}
                    </Text>

                    <View style={styles.achievementFooter}>
                      {isUnlocked ? (
                        <Chip
                          compact
                          icon="check"
                          style={{ backgroundColor: brandColors.success + '20' }}
                          textStyle={{ color: brandColors.success, fontSize: 10 }}
                        >
                          {unlockedDate}
                        </Chip>
                      ) : (
                        <Chip
                          compact
                          icon="star"
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                          textStyle={{ fontSize: 10 }}
                        >
                          +{achievement.xpReward} XP
                        </Chip>
                      )}
                    </View>
                  </Surface>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  overviewCard: {
    marginBottom: spacing.lg,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    gap: 4,
  },
  overviewDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  lockedCard: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: 32,
  },
  achievementFooter: {
    marginTop: 'auto',
  },
});
