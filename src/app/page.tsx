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
    suggestedActions
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

    const data = await sendCommand(command, currentScene || '', language);

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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-pixel selection:bg-yellow-400 selection:text-black overflow-x-hidden">
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
            className="flex flex-col min-h-screen max-w-7xl mx-auto p-4 md:p-6"
          >
            <EndingOverlay />

            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-6 shrink-0">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl md:text-5xl"
                >
                  ⚔️
                </motion.span>
                <h1 className="text-2xl md:text-5xl font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] tracking-tighter">
                  PixVenture
                </h1>
              </div>

              <div className="flex items-center gap-6">
                {user && (
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Player</span>
                    <span className="text-sm text-yellow-200">{user.username}</span>
                  </div>
                )}
                <LanguageSelector variant="compact" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetGame}
                  className="bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-800/40 text-[10px] font-pixel"
                >
                  QUIT
                </Button>
              </div>
            </header>

            {/* Main Content Area - Wireframe Layout */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
                {/* Top Row: Stats + Inventory */}
                <RPGStatsHUD />

                {/* Image Panel */}
                <motion.div
                  animate={lastHpChange !== null && lastHpChange < 0 ? {
                    x: [0, -10, 10, -10, 10, 0],
                  } : {}}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-900/60 border-2 border-slate-800 overflow-hidden backdrop-blur-md shadow-2xl relative shrink-0"
                >
                  {/* Combat Overlay */}
                  <AnimatePresence>
                    {activeEnemy && <CombatHUD />}
                  </AnimatePresence>

                  {/* Image Display */}
                  <div className="aspect-[16/9] w-full bg-slate-950 relative overflow-hidden group">
                    <AnimatePresence mode="wait">
                      {sceneImage && !isGeneratingImage ? (
                        <motion.div
                          key={sceneImage}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 1 }}
                          className="w-full h-full"
                        >
                          <img
                            src={sceneImage}
                            alt="Adventure vision"
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                          {/* Time-based Tinting Overlay */}
                          <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${timeOfDay === 'morning' ? 'bg-orange-500/5' :
                            timeOfDay === 'afternoon' ? 'bg-transparent' :
                              timeOfDay === 'evening' ? 'bg-orange-700/10' :
                                'bg-indigo-950/20'
                            }`} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        </motion.div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {imageError ? (
                            <div className="flex flex-col items-center text-center p-6">
                              <AlertCircle className="w-16 h-16 text-red-500/50 mb-4 animate-pulse" />
                              <p className="font-pixel text-sm text-red-400/80 mb-6 uppercase tracking-widest">Vision Faded</p>
                              <Button
                                onClick={regenerateVision}
                                className="bg-red-900/30 hover:bg-red-800/50 text-red-200 border border-red-500/30 font-pixel text-xs py-5 px-8"
                              >
                                REGENERATE VISION
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-6">
                              <div className="relative w-20 h-20">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 border-t-2 border-yellow-500/40 rounded-full"
                                />
                                <motion.div
                                  animate={{ rotate: -360 }}
                                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-2 border-b-2 border-purple-500/30 rounded-full"
                                />
                                <RefreshCw className="absolute inset-0 m-auto w-8 h-8 text-yellow-500/50 animate-pulse" />
                              </div>
                              <p className="font-pixel text-[10px] tracking-[0.5em] text-yellow-500/50 animate-pulse uppercase">Weaving Visuals...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Story Panel */}
                <div className="bg-slate-900/60 border-2 border-slate-800 overflow-hidden backdrop-blur-md">
                  <CurrentScene currentScene={currentScene} isTyping={isApiLoading} />
                </div>

                {/* Quick Actions & Input Section */}
                <div className="w-full pb-4">
                  <QuickActions
                    actions={suggestedActions || []}
                    onAction={handleCommand}
                    disabled={isApiLoading || isTyping}
                    isLoading={isApiLoading}
                    isSafeZone={isSafeZone}
                  />
                  <CommandInput onSend={handleCommand} isDisabled={isApiLoading} />
                </div>
              </div>

              {/* Right Column: Log + Map */}
              <div className="lg:col-span-5 flex flex-col gap-4 min-h-[300px] lg:min-h-0 mb-10">
                {/* Log Panel */}
                <div className="flex-1 min-h-[200px]">
                  <AdventureLog />
                </div>

                {/* Map Panel */}
                <div className="flex-1 min-h-[200px]">
                  <MiniMap />
                </div>
              </div>
            </main>
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
