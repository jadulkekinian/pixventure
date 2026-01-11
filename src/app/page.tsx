'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/hooks/use-game-store';
import { useAdventureAPI } from '@/hooks/use-adventure-api';
import { useJDKUser } from '@/hooks/use-jdk-user';
import { useAdventurePersistence } from '@/hooks/use-adventure-persistence';
import { translations } from '@/lib/translations';
import { logger } from '@/lib/logger';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

// Modular Components
import { StartScreen } from '@/components/StartScreen';
import { AdventureLog } from '@/components/AdventureLog';
import { CurrentScene } from '@/components/CurrentScene';
import { CommandInput } from '@/components/CommandInput';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';


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

  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);

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
        currentScene: data.story,
        sceneImage: data.imageUrl,
        isTyping: false,
        isGeneratingImage: !!data.imageUrl
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
          sceneNumber: logs.length + 1,
          storyText: data.story,
          imageUrl: data.imageUrl || '',
          command
        });
      }

    } else {
      updateGameState({ isTyping: false, isGeneratingImage: false });
    }
  };

  const handleRetryImage = () => {
    if (sceneImage) {
      const newUrl = sceneImage.includes('&retry=')
        ? sceneImage.replace(/&retry=\d+/, `&retry=${Date.now()}`)
        : `${sceneImage}&retry=${Date.now()}`;

      updateGameState({ sceneImage: newUrl, isGeneratingImage: true });
      setImageError(false);
      setImageRetryCount(prev => prev + 1);
    }
  };

  // Helper to get raw Pollinations URL from proxy URL for direct fallback
  const getDirectImageUrl = () => {
    if (sceneImage && sceneImage.includes('/api/image-proxy')) {
      const params = new URLSearchParams(sceneImage.split('?')[1]);
      const prompt = params.get('prompt');
      const seed = params.get('seed');
      if (prompt) {
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${seed || '123'}&nologo=true`;
      }
    }
    return sceneImage;
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
                <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-yellow-400/20 bg-slate-900 shadow-2xl">
                  {sceneImage && !imageError ? (
                    <img
                      src={sceneImage}
                      alt="Current Scene"
                      className={`w-full h-full object-cover transition-opacity duration-1000 ${isGeneratingImage ? 'opacity-40' : 'opacity-100'}`}
                      onLoad={() => {
                        console.log('Image loaded successfully:', sceneImage);
                        updateGameState({ isGeneratingImage: false });
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', sceneImage, e);
                        setImageError(true);
                        updateGameState({ isGeneratingImage: false });
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                      {imageError ? (
                        <>
                          <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                          <p className="text-xs font-pixel tracking-widest uppercase text-red-400">Vision Loading Error</p>
                          <div className="flex flex-col gap-2 scale-75 md:scale-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRetryImage}
                              className="border-yellow-400/50 text-yellow-400"
                            >
                              <RefreshCw className="w-3 h-3 mr-2" /> RETRY INTERNAL PROXY
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-slate-400 text-[8px]"
                            >
                              <a href={getDirectImageUrl()} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 mr-2" /> OPEN DIRECT IMAGE LINK
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-6xl animate-pulse">🖼️</span>
                          <p className="text-xs font-pixel tracking-widest uppercase">Waiting for vision...</p>
                        </>
                      )}
                    </div>
                  )}

                  {isGeneratingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="text-4xl mb-4"
                        >
                          🌀
                        </motion.div>
                        <p className="text-[10px] font-pixel text-yellow-400 animate-pulse">GENERATING VISION...</p>
                      </div>
                    </div>
                  )}

                  {sceneImage && !isGeneratingImage && !imageError && (
                    <button
                      onClick={handleRetryImage}
                      className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 transition-colors"
                      title="Regenerate Vision"
                    >
                      <RefreshCw className="w-4 h-4 text-white/50" />
                    </button>
                  )}
                </div>
                <CurrentScene />
              </div>

              {/* Right Column: Adventure Log */}
              <div className="lg:col-span-4 min-h-0">
                <AdventureLog />
              </div>
            </main>

            {/* Fixed Footer: Command Input */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-50">
              <div className="max-w-4xl mx-auto">
                <CommandInput onSend={handleCommand} />
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
