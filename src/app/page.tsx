'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/hooks/use-game-store';
import { useAdventureAPI } from '@/hooks/use-adventure-api';
import { useJDKUser } from '@/hooks/use-jdk-user';
import { useAdventurePersistence } from '@/hooks/use-adventure-persistence';
import { translations } from '@/lib/translations';
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
    language
  } = useGameStore();

  const { startAdventure, sendCommand, isLoading: isApiLoading } = useAdventureAPI();
  const { user, isAuthenticated } = useJDKUser();
  const { saveAdventure, saveScene, loadAdventure, isLoading: isDbLoading } = useAdventurePersistence();
  const { playSfx } = useAudio();

  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const t = translations[language];

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
          const lastScene = existingAdventure.adventure_scenes.sort((a, b) => b.scene_number - a.scene_number)[0];

          setAdventureId(existingAdventure.id);
          setLanguage(existingAdventure.language as any);

          updateGameState({
            currentScene: lastScene.story_text,
            sceneImage: lastScene.image_url || '',
            logs: existingAdventure.adventure_scenes.map(s => ({
              type: s.command ? 'command' as const : 'story' as const,
              content: s.command ? `> ${s.command}` : s.story_text,
              timestamp: new Date(s.created_at)
            })),
            isTyping: false,
            isGeneratingImage: false,
            isGameStarted: true
          });
        }
      }
    }

    resumeSession();
  }, [isAuthenticated, user, loadAdventure, updateGameState, setLanguage, setIsGameStarted]);

  const handleStart = async () => {
    playSfx('click');
    updateGameState({ isTyping: true, isGeneratingImage: true });
    setImageError(false);

    const data = await startAdventure(language);

    if (data) {
      updateGameState({
        currentScene: data.story,
        sceneImage: data.imageUrl,
        isTyping: false,
        isGeneratingImage: !!data.imageUrl
      });

      addLog({
        type: 'system',
        content: t.adventureStarted,
        timestamp: new Date()
      });

      setIsGameStarted(true);
      playSfx('reveal');

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
    if (!command.trim()) return;

    playSfx('submit');

    addLog({
      type: 'command',
      content: `> ${command}`,
      timestamp: new Date()
    });

    updateGameState({ isTyping: true, isGeneratingImage: true });
    setImageError(false);

    const data = await sendCommand(command, currentScene || '', language);

    if (data) {
      updateGameState({
        currentScene: data.story || '',
        sceneImage: data.imageUrl || '',
        isTyping: false,
        isGeneratingImage: !!data.imageUrl
      });

      addLog({
        type: 'story',
        content: data.story || '',
        timestamp: new Date()
      });

      // Save scene to Supabase if we have an active adventure
      if (adventureId) {
        await saveScene({
          adventureId,
          sceneNumber: logs.length + 1,
          storyText: data.story || '',
          imageUrl: data.imageUrl || '',
          command
        });
      }

    } else {
      updateGameState({ isTyping: false, isGeneratingImage: false });
    }
  };

  const regenerateVision = useCallback(() => {
    // Re-trigger the start or last action to get a new image
    if (logs.length <= 1) {
      handleStart();
    } else {
      // Find the last command sent
      const lastCommandLog = [...logs].reverse().find(l => l.type === 'command');
      if (lastCommandLog) {
        handleCommand(lastCommandLog.content.replace('> ', ''));
      } else {
        handleStart();
      }
    }
  }, [logs, currentScene, language]);

  const handleRetryImage = () => {
    updateGameState({ isGeneratingImage: true });
    setImageError(false);
    // Short delay to reset state and attempt re-render
    setTimeout(() => updateGameState({ isGeneratingImage: false }), 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-pixel selection:bg-yellow-400 selection:text-black">
      <AnimatePresence mode="wait">
        {!isGameStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
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
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-6">
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

            {/* Main Content Area */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 mb-32 md:mb-48 pb-10">
              {/* Left Column: Visuals & Story */}
              <div className="lg:col-span-8 flex flex-col gap-10 min-h-0">
                <div className="flex-shrink-0 relative aspect-video rounded-xl overflow-hidden border-4 border-yellow-400/20 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {sceneImage && !imageError ? (
                    <>
                      <img
                        key={sceneImage}
                        src={sceneImage}
                        alt="Current Scene"
                        className={`w-full h-full object-cover transition-opacity duration-[2000ms] ${isGeneratingImage ? 'opacity-40' : 'opacity-100'}`}
                        onLoad={() => {
                          console.log('Image Vision Loaded:', typeof sceneImage === 'string' ? sceneImage.substring(0, 50) + '...' : 'Data');
                          updateGameState({ isGeneratingImage: false });
                        }}
                        onError={(e) => {
                          console.error('Image Vision Error');
                          setImageError(true);
                          updateGameState({ isGeneratingImage: false });
                        }}
                      />
                      {/* Action buttons on image */}
                      {!isGeneratingImage && (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRetryImage}
                            className="bg-black/60 hover:bg-black/80 text-white/70 h-8 w-8 p-0 rounded-full border border-white/10"
                            title="Flash Refresh"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-6 min-h-[250px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
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

                  {/* Overlay for generation */}
                  {isGeneratingImage && sceneImage && !imageError && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <p className="font-pixel text-[10px] text-yellow-400 tracking-widest animate-pulse">UPDATING VISION...</p>
                    </div>
                  )}
                </div>

                {/* Story Display */}
                <div className="flex flex-col gap-6">
                  <CurrentScene />
                </div>
              </div>

              {/* Right Column: Adventure Log */}
              <div className="lg:col-span-4 flex flex-col min-h-[300px] lg:min-h-0">
                <AdventureLog />
              </div>
            </main>

            {/* Fixed Footer: Command Input */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-50">
              <div className="max-w-4xl mx-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <CommandInput onSend={handleCommand} isDisabled={isTyping} />
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
          background: rgba(250, 204, 21, 0.03);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          pointer-events: none;
          animation: scanline 12s linear infinite;
        }
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
      <div className="scanline" />
    </div>
  );
}
