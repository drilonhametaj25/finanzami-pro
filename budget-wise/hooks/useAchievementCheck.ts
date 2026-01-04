import { useCallback, useRef } from 'react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useCelebration } from '../components/celebration';
import { AchievementStats, Achievement } from '../constants/gamification';

export const useAchievementCheck = () => {
  const { checkAchievements, getStats, level } = useGamificationStore();
  const { showAchievement, showLevelUp } = useCelebration();
  const previousLevelRef = useRef(level);

  const checkAndCelebrate = useCallback((stats: AchievementStats) => {
    // Check the current level before checking achievements
    const levelBefore = previousLevelRef.current;

    // Check for new achievements
    const newAchievements = checkAchievements(stats);

    // Show celebration for each new achievement
    newAchievements.forEach((achievement) => {
      showAchievement(achievement);
    });

    // Check if level changed (after XP was added from achievements)
    const currentStats = getStats();
    if (currentStats.level > levelBefore) {
      showLevelUp(currentStats.level);
      previousLevelRef.current = currentStats.level;
    }

    return newAchievements;
  }, [checkAchievements, getStats, showAchievement, showLevelUp]);

  // Sync the ref when level changes externally
  const syncLevel = useCallback(() => {
    previousLevelRef.current = level;
  }, [level]);

  return {
    checkAndCelebrate,
    syncLevel,
  };
};

export default useAchievementCheck;
