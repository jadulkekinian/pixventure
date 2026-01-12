'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/hooks/use-game-store';
import { useAdventureAPI } from '@/hooks/use-adventure-api';
import { useJDKUser } from '@/hooks/use-jdk-user';
import { useAdventurePersistence } from '@/hooks/use-adventure-persistence';
import { translations as allTranslations } from '@/lib/translations';
import { logger } from '@/lib/logger';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Modular Components
import { StartScreen } from '@/components/StartScreen';
import { AdventureLog } from '@/components/AdventureLog';
import { CurrentScene } from '@/components/CurrentScene';
import { CommandInput } from '@/components/CommandInput';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { useAudio } from "@/components/AudioSystem";
import { RPGStatsHUD } from '@/components/RPGStatsHUD';
import { QuickActions } from '@/components/QuickActions';
import { EndingOverlay } from '@/components/EndingOverlay';
import { CombatHUD } from '@/components/CombatHUD';
import { MiniMap } from '@/components/MiniMap';
import { DungeonLayout } from '@/components/DungeonLayout';

export default function PixVentureGame() {
  const {
    isGameStarted,
    currentScene,
    sceneImage,
    logs,
    isTyping,
    isGeneratingImage,
    updateGameState,
    addLog,
    setLanguage,
    setIsGameStarted,
    resetGame,
    language,
    hp,
    xp,
    inventory,
    lastHpChange,
    lastXpGain,
    day,
    timeOfDay,
    isSafeZone,
    activeEnemy,
    suggestedActions,
    dungeonMap,
    moveToRoom
  } = useGameStore();

  const { startAdventure, sendCommand, isLoading: isApiLoading } = useAdventureAPI();
  const { user, isAuthenticated } = useJDKUser();
  const { saveAdventure, saveScene, loadAdventure, endAdventure, isLoading: isDbLoading } = useAdventurePersistence();
  const { playSfx } = useAudio();

  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const t = allTranslations[language];

  // Reset image error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [sceneImage]);

  // Try to resume existing adventure when user is identified
  useEffect(() => {
    async function resumeSession() {
      if (isAuthenticated && user?.memberId) {
        logger.info('Checking for existing adventure for user', { memberId: user.memberId });
        const existingAdventure = await loadAdventure(user.memberId);

        if (existingAdventure && existingAdventure.adventure_scenes.length > 0) {
          logger.info('Found existing adventure, prompting to resume');
          const sortedScenes = [...existingAdventure.adventure_scenes].sort((a, b) => a.scene_number - b.scene_number);
          const lastScene = sortedScenes[sortedScenes.length - 1];

          setAdventureId(existingAdventure.id);
          setLanguage(existingAdventure.language as any);

          updateGameState({
            currentScene: lastScene.story_text,
            sceneImage: lastScene.image_url || '',
            logs: sortedScenes.map(s => ({
              type: s.command ? 'command' as const : 'story' as const,
              content: s.command ? `> ${s.command}` : s.story_text,
              timestamp: new Date(s.created_at)
            })),
            isTyping: false,
            isGeneratingImage: false,
            isGameStarted: true,
            hp: (existingAdventure as any).hp || 100,
            xp: (existingAdventure as any).xp || 0,
            inventory: (existingAdventure as any).inventory || [],
            day: (existingAdventure as any).day || 1,
            timeOfDay: (existingAdventure as any).time_of_day || 'morning',
            isSafeZone: !!(existingAdventure as any).is_safe_zone,
            activeEnemy: (existingAdventure as any).active_enemy || null
          });
        }
      }
    }

    resumeSession();
  }, [isAuthenticated, user, loadAdventure, updateGameState, setLanguage]);

  const handleStart = async () => {
    playSfx('click');
    updateGameState({ isTyping: true, isGeneratingImage: true, lastHpChange: null, lastXpGain: null });
    setImageError(false);

    const data = await startAdventure(language);

    if (data && data.success) {
      updateGameState({
        currentScene: data.story || '',
        sceneImage: data.imageUrl || '',
        isTyping: false,
        isGeneratingImage: false,
        suggestedActions: data.suggestedActions || [],
        hp: 100 + (data.hpChange || 0),
        xp: 0,
        inventory: [],
        isGameOver: !!data.isEnding,
        endingType: data.isEnding || null,
        lastHpChange: data.hpChange || null,
        lastXpGain: 0,
        day: data.day || 1,
        timeOfDay: data.timeOfDay || 'morning',
        isSafeZone: !!data.isSafeZone,
        activeEnemy: data.activeEnemy || null
      });

      // Clear indicators after animation
      setTimeout(() => updateGameState({ lastHpChange: null, lastXpGain: null }), 2000);

      playSfx('reveal');

      addLog({
        type: 'system',
        content: data.story ? t.adventureStarted : (data.error || 'Failed to start'),
        timestamp: new Date()
      });

      setIsGameStarted(true);

      if (isAuthenticated && user) {
        const newAdventureId = await saveAdventure({
          memberId: user.memberId,
          username: user.username,
          language,
          hp: 100 + (data.hpChange || 0),
          xp: 0,
          inventory: [],
          day: 1,
          timeOfDay: 'morning',
          isSafeZone: !!data.isSafeZone,
          activeEnemy: data.activeEnemy || null
        });

        if (newAdventureId) {
          setAdventureId(newAdventureId);
          await saveScene({
            adventureId: newAdventureId,
            sceneNumber: 1,
            storyText: data.story || '',
            imageUrl: data.imageUrl || ''
          });
        }
      }
    } else {
      updateGameState({ isTyping: false, isGeneratingImage: false });
    }
  };

  const handleCommand = async (command: string) => {
    if (!command.trim() || isApiLoading) return;

    playSfx('submit');

    addLog({
      type: 'command',
      content: `> ${command}`,
      timestamp: new Date()
    });

    updateGameState({ isTyping: true, isGeneratingImage: true, lastHpChange: null, lastXpGain: null });
    setImageError(false);

    // Get current room context
    const currentRoomId = dungeonMap?.currentRoomId;
    const roomConnections = dungeonMap?.rooms.find(r => r.id === currentRoomId)?.connections;

    const data = await sendCommand(command, currentScene || '', language, currentRoomId, roomConnections);

    if (data && data.success) {
      if (data.hpChange !== undefined && data.hpChange < 0) playSfx('submit');
      if (data.xpGain && data.xpGain > 0) playSfx('reveal');

      const currentHp = useGameStore.getState().hp || 100;
      const currentXp = useGameStore.getState().xp || 0;
      const newHp = Math.max(0, Math.min(100, currentHp + (data.hpChange || 0)));
      const newXp = currentXp + (data.xpGain || 0);
      const isDead = newHp <= 0;

      updateGameState({
        currentScene: data.story || '',
        sceneImage: data.imageUrl || '',
        isTyping: false,
        isGeneratingImage: false,
        suggestedActions: data.suggestedActions || [],
        hp: newHp,
        xp: newXp,
        inventory: data.newItem ? [...(useGameStore.getState().inventory || []), data.newItem] : useGameStore.getState().inventory,
        isGameOver: !!data.isEnding || isDead,
        endingType: data.isEnding || (isDead ? 'lose' : null),
        lastHpChange: data.hpChange || null,
        lastXpGain: data.xpGain || null,
        day: data.day || useGameStore.getState().day,
        timeOfDay: data.timeOfDay || useGameStore.getState().timeOfDay,
        isSafeZone: !!data.isSafeZone,
        activeEnemy: data.activeEnemy || null
      });

      // Handle room movement
      if (data.nextRoomId) {
        moveToRoom(data.nextRoomId);
        playSfx('reveal');
      }

      // Clear indicators after animation
      setTimeout(() => updateGameState({ lastHpChange: null, lastXpGain: null }), 2000);

      addLog({
        type: 'story',
        content: data.story || '',
        timestamp: new Date()
      });

      if (adventureId) {
        await saveScene({
          adventureId,
          sceneNumber: useGameStore.getState().logs.length,
          storyText: data.story || '',
          imageUrl: data.imageUrl || '',
          command
        });

        if (data.isEnding || isDead) {
          await endAdventure(adventureId);
        } else {
          // Update RPG stats in the adventure record
          await saveAdventure({
            memberId: user?.memberId || '',
            username: user?.username || '',
            language,
            hp: newHp,
            xp: newXp,
            inventory: data.newItem ? [...(useGameStore.getState().inventory || []), data.newItem] : useGameStore.getState().inventory,
            day: data.day || useGameStore.getState().day,
            timeOfDay: data.timeOfDay || useGameStore.getState().timeOfDay,
            isSafeZone: !!data.isSafeZone,
            activeEnemy: data.activeEnemy || null
          });
        }
      }
    } else {
      updateGameState({ isTyping: false, isGeneratingImage: false });
    }
  };

  const regenerateVision = useCallback(() => {
    if (logs.length <= 1) {
      handleStart();
    } else {
      const lastCommandLog = [...logs].reverse().find(l => l.type === 'command');
      if (lastCommandLog) {
        handleCommand(lastCommandLog.content.replace('> ', ''));
      } else {
        handleStart();
      }
    }
  }, [logs, currentScene, language]);

  return (
    <div className="min-h-screen bg-black text-slate-50 font-pixel selection:bg-yellow-400 selection:text-black overflow-hidden">
      <AnimatePresence mode="wait">
        {!isGameStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full"
          >
            <StartScreen
              onStartGame={handleStart}
              isLoading={isApiLoading || isDbLoading}
              username={user?.username || undefined}
              language={language}
              mounted={true}
            />
          </motion.div>
        ) : (
          <motion.div
            key="game-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-full flex flex-col"
          >
            <EndingOverlay />

            {/* Main Dungeon Layout */}
            <div className="flex-1 relative">
              <DungeonLayout />

              {/* Overlay Input for Game */}
              <div className="absolute bottom-4 left-0 right-0 px-4 z-50">
                <div className="max-w-4xl mx-auto">
                  <CommandInput onSend={handleCommand} isDisabled={isApiLoading} />
                </div>
              </div>
            </div>

            {/* Quick Actions Overlay - Optional, can be integrated into layout later */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <LanguageSelector variant="compact" />
              <Button
                variant="outline"
                size="sm"
                onClick={resetGame}
                className="bg-red-950/80 border-red-900/50 text-red-400 hover:bg-red-800/90 text-[10px] font-pixel backdrop-blur-sm"
              >
                QUIT
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </div>
  );
}
