'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { translations } from '@/lib/translations';
import { StartScreenProps } from '@/lib/types';

import { useGameStore } from '@/hooks/use-game-store';

export function StartScreen({ onStartGame, mounted, username, isLoading }: StartScreenProps) {
    const { language, setLanguage } = useGameStore();
    const t = translations[language];

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Card className="p-8 max-w-2xl w-full mx-4 border-4 border-yellow-400/50 bg-black/90">
                    <div className="text-center">
                        <div className="text-8xl mb-6">⚔️</div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-yellow-400 font-pixel">
                            {t.title}
                        </h1>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
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
                        }}
                    />
                ))}
            </div>

            {/* Start Screen Content */}
            <Card className="relative z-10 p-8 max-w-2xl w-full mx-4 border-4 border-yellow-400/50 bg-black/90 shadow-[0_0_50px_rgba(250,204,21,0.1)]">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-block text-7xl md:text-8xl mb-6"
                    >
                        ⚔️
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 tracking-tighter font-pixel">
                        {t.title}
                    </h1>

                    <p className="text-lg md:text-xl text-yellow-100/60 mb-8 font-pixel tracking-wide uppercase">
                        {t.subtitle}
                    </p>

                    {username && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg inline-block"
                        >
                            <p className="text-xs text-yellow-400/80 font-pixel uppercase tracking-widest mb-1">Welcome back, Hero</p>
                            <p className="text-lg text-yellow-200 font-pixel">{username}</p>
                        </motion.div>
                    )}

                    {/* Language Selector */}
                    <div className="mb-10">
                        <LanguageSelector language={language} onLanguageChange={setLanguage} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                        {[t.feature1, t.feature2, t.feature3, t.feature4].map((feature, i) => (
                            <div key={i} className="flex items-start gap-2 group">
                                <Sparkles className="w-4 h-4 text-yellow-500 mt-1 shrink-0 group-hover:scale-125 transition-transform" />
                                <span className="text-[10px] md:text-xs text-slate-400 font-pixel leading-tight group-hover:text-yellow-200/70 transition-colors uppercase tracking-tight">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={onStartGame}
                        disabled={isLoading}
                        size="lg"
                        className="w-full text-xl py-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold tracking-[0.2em] border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all font-pixel uppercase shadow-lg shadow-yellow-900/20"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                                    ⚔️
                                </motion.div>
                                LOADING...
                            </div>
                        ) : t.startButton}
                    </Button>

                    <p className="mt-8 text-[10px] text-slate-500 font-pixel uppercase tracking-widest animate-pulse">
                        {t.startHint}
                    </p>
                </motion.div>
            </Card>
        </div>
    );
}

