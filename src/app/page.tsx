'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Scroll, Sparkles, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type Language = 'en' | 'id' | 'ja';

const translations = {
  en: {
    title: 'PIXEL QUEST',
    subtitle: 'AI-Generated Text & Image Adventure',
    feature1: 'AI-powered storytelling',
    feature2: 'Dynamically generated pixel art scenes',
    feature3: 'Type commands to explore',
    feature4: 'Unlimited adventure possibilities',
    startButton: 'START ADVENTURE',
    startHint: 'Press START to begin your journey',
    adventureLog: 'ADVENTURE LOG',
    noAdventures: 'No adventures yet...',
    currentScene: 'CURRENT SCENE',
    generatingStory: 'Generating story...',
    waitingForCommand: 'Waiting for your command...',
    sceneWillAppearHere: 'Scene will appear here',
    inputPlaceholder: "Enter command (e.g., 'look around', 'go north', 'examine sword')",
    exampleCommands: "Example commands: look, search, examine [item], go [direction], use [item], talk to [character]",
    adventureStarted: '🎮 Adventure Started! Type commands to explore.',
    selectLanguage: 'Select Language',
  },
  id: {
    title: 'PIXEL QUEST',
    subtitle: 'Petualangan Teks & Gambar AI',
    feature1: 'Cerita bertenaga AI',
    feature2: 'Sene pixel art yang dihasilkan secara dinamis',
    feature3: 'Ketik perintah untuk menjelajahi',
    feature4: 'Kemungkinan petualangan tak terbatas',
    startButton: 'MULAI PETUALANGAN',
    startHint: 'Tekan MULAI untuk memulai perjalanan Anda',
    adventureLog: 'LOG PETUALANGAN',
    noAdventures: 'Belum ada petualangan...',
    currentScene: 'SAAT INI',
    generatingStory: 'Membuat cerita...',
    waitingForCommand: 'Menunggu perintah Anda...',
    sceneWillAppearHere: 'Adegan akan muncul di sini',
    inputPlaceholder: "Masukkan perintah (contoh: 'lihat sekitar', 'pergi utara', 'periksa pedang')",
    exampleCommands: "Contoh perintah: lihat, cari, periksa [item], pergi [arah], gunakan [item], bicara dengan [karakter]",
    adventureStarted: '🎮 Petualangan Dimulai! Ketik perintah untuk menjelajahi.',
    selectLanguage: 'Pilih Bahasa',
  },
  ja: {
    title: 'PIXEL QUEST',
    subtitle: 'AI生成テキスト＆イメージアドベンチャー',
    feature1: 'AI搭載ストーリーテリング',
    feature2: '動的に生成されるピクセルアートシーン',
    feature3: 'コマンドを入力して探索',
    feature4: '無限の冒険の可能性',
    startButton: '冒険を始める',
    startHint: '開始を押して旅を始めましょう',
    adventureLog: '冒険ログ',
    noAdventures: 'まだ冒険がありません...',
    currentScene: '現在のシーン',
    generatingStory: 'ストーリーを生成中...',
    waitingForCommand: 'コマンドを待っています...',
    sceneWillAppearHere: 'シーンがここに表示されます',
    inputPlaceholder: "コマンドを入力（例：'周りを見る', '北へ行く', '剣を調べる'）",
    exampleCommands: "例コマンド: 見る, 探す, 調べる [アイテム], [方向]へ行く, 使う [アイテム], [キャラクター]と話す",
    adventureStarted: '🎮 冒険が始まりました！コマンドを入力して探索してください。',
    selectLanguage: '言語を選択',
  },
};

interface LogEntry {
  type: 'story' | 'command' | 'system';
  content: string;
  timestamp: Date;
}

interface GameState {
  currentScene: string;
  sceneImage: string;
  logs: LogEntry[];
  isTyping: boolean;
  isGeneratingImage: boolean;
}

export default function PixelAdventureGame() {
  const [inputValue, setInputValue] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentScene: '',
    sceneImage: '',
    logs: [],
    isTyping: false,
    isGeneratingImage: false,
  });
  const [displayedText, setDisplayedText] = useState('');
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Only run animation-related code after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // Typewriter effect for current scene
  useEffect(() => {
    // Cancel any existing typewriter timeout
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }

    if (gameState.currentScene && !gameState.isTyping) {
      // Show full text immediately without typewriter for now
      setDisplayedText(gameState.currentScene);
    }

    // Cleanup function
    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [gameState.currentScene, gameState.isTyping]);

  const handleStartGame = () => {
    setGameStarted(true);
    setShowStartScreen(false);
    initializeGame();
  };

  const initializeGame = async () => {
    setGameState((prev) => ({ ...prev, isTyping: true }));

    try {
      const response = await fetch('/api/adventure/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const data = await response.json();

      setGameState((prev) => ({
        ...prev,
        currentScene: data.story,
        sceneImage: data.imageUrl,
        logs: [
          {
            type: 'system',
            content: translations[language].adventureStarted,
            timestamp: new Date(),
          },
        ],
        isTyping: false,
      }));
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState((prev) => ({
        ...prev,
        isTyping: false,
      }));
    }
  };

  const handleCommand = async () => {
    const command = inputValue.trim();
    if (!command || gameState.isTyping || gameState.isGeneratingImage) return;

    // Add command to logs
    setGameState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          type: 'command',
          content: `> ${command}`,
          timestamp: new Date(),
        },
      ],
    }));
    setInputValue('');

    try {
      setGameState((prev) => ({ ...prev, isTyping: true, isGeneratingImage: true }));

      const response = await fetch('/api/adventure/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          previousScene: gameState.currentScene,
          language,
        }),
      });

      const data = await response.json();

      setGameState((prev) => ({
        ...prev,
        currentScene: data.story,
        sceneImage: data.imageUrl,
        logs: [
          ...prev.logs,
          {
            type: 'story',
            content: data.story,
            timestamp: new Date(),
          },
        ],
        isTyping: false,
        isGeneratingImage: false,
      }));
    } catch (error) {
      console.error('Failed to process command:', error);
      setGameState((prev) => ({
        ...prev,
        isTyping: false,
        isGeneratingImage: false,
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommand();
    }
  };

  const t = translations[language];

  // Start Screen
  if (showStartScreen) {
    // Don't render animations until mounted
    if (!mounted) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
          <Card className="relative z-10 p-8 max-w-2xl w-full mx-4 border-4 border-yellow-400 border-double shadow-2xl bg-black/90">
            <div className="text-center">
              <div className="text-8xl mb-6">⚔️</div>
              <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 tracking-wider font-pixel">
                {t.title}
              </h1>
              <p className="text-xl text-gray-300 mb-8 font-pixel leading-relaxed">{t.subtitle}</p>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
        {/* Animated Background */}
        {mounted && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: Math.random(),
                }}
                animate={{
                  y: [null, -1000],
                  opacity: [Math.random(), 0],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: Math.random() * 10,
                }}
              />
            ))}
          </div>
        )}

        {/* Start Screen Content */}
        <Card className="relative z-10 p-8 max-w-2xl w-full mx-4 border-4 border-yellow-400 border-double shadow-2xl bg-black/90">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="inline-block text-8xl mb-6"
            >
              ⚔️
            </motion.div>

            <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 tracking-wider font-pixel">
              {t.title}
            </h1>

            <p className="text-xl text-gray-300 mb-8 font-pixel leading-relaxed">
              {t.subtitle}
            </p>

            {/* Language Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-400">
                <Languages className="w-4 h-4" />
                <span className="font-bold font-pixel">{t.selectLanguage}</span>
              </div>
              <div className="flex justify-center gap-2">
                {(['en', 'id', 'ja'] as Language[]).map((lang) => (
                  <Button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    variant={language === lang ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      language === lang
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-2 border-yellow-300'
                        : 'bg-black/60 border-2 border-gray-600 text-gray-300 hover:border-yellow-400'
                    } px-3 py-2 text-xs font-bold font-pixel`}
                  >
                    {lang === 'en' ? '🇬🇧 English' : lang === 'id' ? '🇮🇩 Indonesia' : '🇯🇵 日本語'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8 text-left text-sm text-gray-400 font-pixel border-2 border-yellow-400/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-pixel">{t.feature1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-pixel">{t.feature2}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-pixel">{t.feature3}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-pixel">{t.feature4}</span>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              size="lg"
              className="text-xl px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold tracking-widest border-4 border-yellow-300 font-pixel"
            >
              {t.startButton}
            </Button>

            <p className="mt-6 text-xs text-gray-500 font-pixel">
              {t.startHint}
            </p>
          </motion.div>
        </Card>
      </div>
    );
  }

  // Main Game UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-indigo-950 relative overflow-hidden font-pixel">
      {/* Dynamic Animated Background */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400/30 rounded-sm"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random(),
              }}
              animate={{
                y: [null, -800],
                rotate: [null, 360],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: Math.random() * 15 + 15,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 15,
              }}
            />
          ))}

          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-pink-400/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, -600],
                x: [null, (Math.random() - 0.5) * 200],
              }}
              transition={{
                duration: Math.random() * 20 + 20,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 20,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Game Container */}
      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <motion.h1
            animate={{ textShadow: ['0 0 10px #facc15', '0 0 20px #facc15', '0 0 10px #facc15'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-wider mb-2 font-pixel"
          >
            ⚔️ {t.title} ⚔️
          </motion.h1>
          <p className="text-gray-400 text-sm font-pixel">{t.selectLanguage}</p>

          {/* Language Selector */}
          <div className="flex justify-center gap-2 mt-3">
            {(['en', 'id', 'ja'] as Language[]).map((lang) => (
              <Button
                key={lang}
                onClick={() => setLanguage(lang)}
                variant={language === lang ? 'default' : 'outline'}
                size="sm"
                className={`${
                  language === lang
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-2 border-yellow-300'
                    : 'bg-black/60 border-2 border-gray-600 text-gray-300 hover:border-yellow-400'
                } px-2 py-1 text-xs font-bold font-pixel`}
              >
                {lang === 'en' ? '🇬🇧 EN' : lang === 'id' ? '🇮🇩 ID' : '🇯🇵 JA'}
              </Button>
            ))}
          </div>
        </header>

        {/* Main Content - Three Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
          {/* Left Column - Adventure Log */}
          <Card className="lg:col-span-1 border-2 border-yellow-400/30 bg-black/80 overflow-hidden flex flex-col max-h-[500px] lg:max-h-[600px]">
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 p-3 border-b-2 border-yellow-400/30 flex items-center gap-2">
              <Scroll className="w-5 h-5 text-yellow-400" />
              <h2 className="text-yellow-400 font-bold tracking-wider font-pixel text-xs md:text-sm">
                {t.adventureLog}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {gameState.logs.length === 0 ? (
                <p className="text-gray-500 text-center text-sm italic font-pixel">{t.noAdventures}</p>
              ) : (
                gameState.logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border-2 ${
                      log.type === 'command'
                        ? 'bg-blue-400/10 border-blue-400/30'
                        : log.type === 'system'
                        ? 'bg-green-400/10 border-green-400/30'
                        : 'bg-purple-400/10 border-purple-400/30'
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        log.type === 'command'
                          ? 'text-blue-300'
                          : log.type === 'system'
                          ? 'text-green-300'
                          : 'text-purple-300'
                      } font-pixel leading-relaxed`}
                    >
                      {log.content}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-pixel">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </Card>

          {/* Middle Column - Scene Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scene Image */}
            <Card className="border-2 border-yellow-400/30 bg-black/80 overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
                <AnimatePresence mode="wait">
                  {gameState.sceneImage ? (
                    <motion.div
                      key={gameState.sceneImage}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={gameState.sceneImage}
                        alt="Game Scene"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {gameState.isGeneratingImage ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-16 h-16 text-yellow-400/50" />
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          <Info className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm font-pixel">{t.sceneWillAppearHere}</p>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Current Scene Text */}
            <Card className="border-2 border-purple-400/30 bg-black/80">
              <div className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 p-3 border-b-2 border-purple-400/30 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-purple-400 font-bold tracking-wider font-pixel text-xs md:text-sm">
                  {t.currentScene}
                </h2>
              </div>
              <div className="p-6 min-h-[150px]">
                {gameState.isTyping ? (
                  <div className="flex items-center gap-2 text-purple-300 font-pixel">
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <span className="ml-2">{t.generatingStory}</span>
                  </div>
                ) : displayedText ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm md:text-base text-gray-200 leading-relaxed font-pixel"
                  >
                    {displayedText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-5 bg-purple-400 ml-1"
                    />
                  </motion.p>
                ) : (
                  <p className="text-gray-500 italic font-pixel text-sm">{t.waitingForCommand}</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Command Input - Fixed at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-yellow-400/30 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-sm p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.inputPlaceholder}
                disabled={gameState.isTyping || gameState.isGeneratingImage}
                className="flex-1 bg-black/60 border-2 border-yellow-400/40 text-yellow-100 placeholder:text-gray-600 focus:border-yellow-400 font-pixel text-sm h-14 px-4"
              />
              <Button
                onClick={handleCommand}
                disabled={gameState.isTyping || gameState.isGeneratingImage || !inputValue.trim()}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold tracking-wider border-2 border-yellow-400 px-8 h-14 font-pixel"
              >
                {gameState.isTyping || gameState.isGeneratingImage ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                    <Loader2 className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2 font-pixel leading-relaxed">
              {t.exampleCommands}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </div>
  );
}
