'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/hooks/use-game-store';
import { useAdventureAPI } from '@/hooks/use-adventure-api';
import { useJDKUser } from '@/hooks/use-jdk-user';
import { useAdventurePersistence } from '@/hooks/use-adventure-persistence';
import { translations } from '@/lib/translations';
import { logger } from '@/lib/logger';

// Modular Components
import StartScreen from '@/components/StartScreen';
import AdventureLog from '@/components/AdventureLog';
import SceneDisplay from '@/components/SceneDisplay';
import CurrentScene from '@/components/CurrentScene';
import CommandInput from '@/components/CommandInput';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function PixVentureGame() {
  const {
    gameState,
    setGameState,
    addLog,
    setLanguage,
    setGameStarted,
    resetGame,
    language
  } = useGameStore();

  const { startAdventure, processAction, isLoading: isApiLoading } = useAdventureAPI();
  const { user, isAuthenticated, isInIframe } = useJDKUser();
  const { saveAdventure, saveScene, loadAdventure, isLoading: isDbLoading } = useAdventurePersistence();

  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  const t = translations[language];

  // Try to resume existing adventure when user is identified
  useEffect(() => {
    async function resumeSession() {
      if (isAuthenticated && user?.memberId) {
        logger.info('Checking for existing adventure for user', { memberId: user.memberId });
        const existingAdventure = await loadAdventure(user.memberId);

        if (existingAdventure && existingAdventure.adventure_scenes.length > 0) {
          logger.info('Found existing adventure, prompting to resume');
          // For now, let's just auto-resume if it's the same language or just auto-resume anyway
          const lastScene = existingAdventure.adventure_scenes.sort((a, b) => b.scene_number - a.scene_number)[0];

          setAdventureId(existingAdventure.id);
          setLanguage(existingAdventure.language as any);

          setGameState({
            currentScene: lastScene.story_text,
            sceneImage: lastScene.image_url || '',
            logs: existingAdventure.adventure_scenes.map(s => ({
              type: s.command ? 'command' as const : 'story' as const,
              content: s.command ? `> ${s.command}` : s.story_text,
              timestamp: new Date(s.created_at)
            })),
            isTyping: false,
            isGeneratingImage: false
          });

          setGameStarted(true);
        }
      }
    }

    resumeSession();
  }, [isAuthenticated, user, loadAdventure, setGameState, setLanguage, setGameStarted]);

  const handleStart = async () => {
    setGameState({ isTyping: true });

    const data = await startAdventure(language);

    if (data) {
      setGameState({
        currentScene: data.story,
        sceneImage: data.imageUrl,
        isTyping: false
      });

      addLog({
        type: 'system',
        content: t.adventureStarted,
        timestamp: new Date()
      });

      setGameStarted(true);

      // Save to Supabase if user is logged in
      if (isAuthenticated && user) {
        const newAdventureId = await saveAdventure({
          memberId: user.memberId,
          username: user.username,
          language
        });

        if (newAdventureId) {
          setAdventureId(newAdventureId);
          await saveScene({
            adventureId: newAdventureId,
            sceneNumber: 1,
            storyText: data.story,
            imageUrl: data.imageUrl
          });
        }
      }
    }
  };

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    addLog({
      type: 'command',
      content: `> ${command}`,
      timestamp: new Date()
    });

    setGameState({ isTyping: true, isGeneratingImage: true });

    const data = await processAction(command, gameState.currentScene, language);

    if (data) {
      setGameState({
        currentScene: data.story,
        sceneImage: data.imageUrl,
        isTyping: false,
        isGeneratingImage: false
      });

      addLog({
        type: 'story',
        content: data.story,
        timestamp: new Date()
      });

      // Save scene to Supabase if we have an active adventure
      if (adventureId) {
        await saveScene({
          adventureId,
          sceneNumber: gameState.logs.length + 1,
          storyText: data.story,
          imageUrl: data.imageUrl,
          command
        });
      }
    } else {
      setGameState({ isTyping: false, isGeneratingImage: false });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-pixel selection:bg-yellow-400 selection:text-black">
      <AnimatePresence mode="wait">
        {!gameState.isGameStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <StartScreen
              onStart={handleStart}
              isLoading={isApiLoading || isDbLoading}
              username={user?.username}
            />
          </motion.div>
        ) : (
          <motion.div
            key="game-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-screen max-w-7xl mx-auto p-4 md:p-6"
          >
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl">⚔️</span>
                <h1 className="text-2xl md:text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                  PixVenture
                </h1>
              </div>

              <div className="flex items-center gap-4">
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
                  className="bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-900/40 text-[10px]"
                >
                  QUIT
                </Button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 mb-20 md:mb-24">
              {/* Left Column: Visuals & Story */}
              <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
                <SceneDisplay
                  imageUrl={gameState.sceneImage}
                  isLoading={gameState.isGeneratingImage}
                />
                <CurrentScene
                  text={gameState.currentScene}
                  isLoading={gameState.isTyping}
                />
              </div>

              {/* Right Column: Adventure Log */}
              <div className="lg:col-span-4 min-h-0">
                <AdventureLog logs={gameState.logs} />
              </div>
            </main>

            {/* Fixed Footer: Command Input */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-50">
              <div className="max-w-4xl mx-auto">
                <CommandInput
                  onSend={handleCommand}
                  isDisabled={gameState.isTyping || gameState.isGeneratingImage}
                  isLoading={gameState.isTyping}
                />
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanline {
          width: 100%;
          height: 2px;
          background: rgba(250, 204, 21, 0.05);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          pointer-events: none;
          animation: scanline 8s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.4);
        }
      `}</style>
      <div className="scanline" />
    </div>
  );
}
