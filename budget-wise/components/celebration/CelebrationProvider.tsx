import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CelebrationModal, CelebrationData, CelebrationType } from './CelebrationModal';
import { Achievement } from '../../constants/gamification';
import { Goal } from '../../types/database';
import { brandColors } from '../../constants/theme';

interface CelebrationContextType {
  showAchievement: (achievement: Achievement) => void;
  showGoalComplete: (goal: Goal) => void;
  showLevelUp: (newLevel: number) => void;
  showCelebration: (data: CelebrationData) => void;
  isShowing: boolean;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: React.ReactNode;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [currentData, setCurrentData] = useState<CelebrationData | null>(null);
  const queueRef = useRef<CelebrationData[]>([]);
  const isShowingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (queueRef.current.length > 0 && !isShowingRef.current) {
      const nextCelebration = queueRef.current.shift();
      if (nextCelebration) {
        isShowingRef.current = true;
        setCurrentData(nextCelebration);
        setVisible(true);
      }
    }
  }, []);

  const showCelebration = useCallback((data: CelebrationData) => {
    queueRef.current.push(data);
    processQueue();
  }, [processQueue]);

  const showAchievement = useCallback((achievement: Achievement) => {
    showCelebration({
      type: 'achievement',
      title: 'Complimenti!',
      subtitle: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      iconColor: achievement.color,
      xpReward: achievement.xpReward,
    });
  }, [showCelebration]);

  const showGoalComplete = useCallback((goal: Goal) => {
    showCelebration({
      type: 'goal',
      title: 'Obiettivo Raggiunto!',
      subtitle: goal.name,
      description: `Hai risparmiato ${goal.target_amount.toLocaleString('it-IT')} ${goal.target_amount >= 1000 ? '!' : ''}`,
      icon: goal.icon || 'target',
      iconColor: brandColors.success,
    });
  }, [showCelebration]);

  const showLevelUp = useCallback((newLevel: number) => {
    const levelNames: Record<number, string> = {
      1: 'Principiante',
      2: 'Apprendista',
      3: 'Risparmiatore',
      4: 'Esperto',
      5: 'Maestro',
      6: 'Guru',
      7: 'Leggenda',
      8: 'Campione',
    };

    showCelebration({
      type: 'levelup',
      title: 'Livello Aumentato!',
      subtitle: levelNames[newLevel] || `Livello ${newLevel}`,
      description: 'Continua cosi per sbloccare nuovi traguardi!',
      icon: 'shield-star',
      iconColor: brandColors.primary,
      newLevel,
    });
  }, [showCelebration]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    isShowingRef.current = false;

    // Process next celebration in queue after a short delay
    setTimeout(() => {
      processQueue();
    }, 300);
  }, [processQueue]);

  return (
    <CelebrationContext.Provider
      value={{
        showAchievement,
        showGoalComplete,
        showLevelUp,
        showCelebration,
        isShowing: visible,
      }}
    >
      {children}
      <CelebrationModal
        visible={visible}
        data={currentData}
        onDismiss={handleDismiss}
      />
    </CelebrationContext.Provider>
  );
};

export default CelebrationProvider;
