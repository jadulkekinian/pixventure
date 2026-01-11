'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { translations } from '@/lib/translations';
import { StartScreenProps } from '@/lib/types';

export function StartScreen({ language, onLanguageChange, onStartGame, mounted }: StartScreenProps) {
    const t = translations[language];

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
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
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
                            delay: Math.random() * 10,
                        }}
                    />
                ))}
            </div>

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

                    <p className="text-xl text-gray-300 mb-8 font-pixel leading-relaxed">{t.subtitle}</p>

                    {/* Language Selector */}
                    <LanguageSelector language={language} onLanguageChange={onLanguageChange} />

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
                        onClick={onStartGame}
                        size="lg"
                        className="text-xl px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold tracking-widest border-4 border-yellow-300 font-pixel"
                    >
                        {t.startButton}
                    </Button>

                    <p className="mt-6 text-xs text-gray-500 font-pixel">{t.startHint}</p>
                </motion.div>
            </Card>
        </div>
    );
}
