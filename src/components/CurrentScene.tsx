'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Volume2, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurrentSceneProps } from '@/lib/types';
import { Button } from '@/components/ui/button';

import { useGameStore } from '@/hooks/use-game-store';
import { translations as allTranslations } from '@/lib/translations';

export function CurrentScene({ currentScene: propScene, isTyping: propIsTyping, translations: propTranslations }: CurrentSceneProps) {
    const { currentScene: storeScene, isTyping: storeIsTyping, language } = useGameStore();
    const [isSpeaking, setIsSpeaking] = useState(false);

    const currentScene = propScene !== undefined ? propScene : storeScene;
    const isTyping = propIsTyping !== undefined ? propIsTyping : storeIsTyping;
    const t = propTranslations || allTranslations[language];

    // Split text into paragraphs
    const paragraphs = currentScene ? currentScene.split(/\n\s*\n/).filter(p => p.trim()) : [];

    useEffect(() => {
        // Stop speech if scene changes or component unmounts
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [currentScene]);

    const handleSpeak = () => {
        if (!currentScene || !window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(currentScene);

        // Match language
        if (language === 'id') utterance.lang = 'id-ID';
        else if (language === 'ja') utterance.lang = 'ja-JP';
        else utterance.lang = 'en-US';

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <Card className="border-2 border-purple-400/30 bg-black/80 shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 p-3 border-b-2 border-purple-400/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-purple-400 font-bold tracking-wider font-pixel text-xs md:text-sm">
                        {t.currentScene}
                    </h2>
                </div>

                {currentScene && !isTyping && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSpeak}
                        className={`h-8 gap-2 bg-purple-900/20 hover:bg-purple-800/40 text-purple-400 border border-purple-400/30 ${isSpeaking ? 'animate-pulse text-pink-400 border-pink-400/50' : ''}`}
                    >
                        {isSpeaking ? (
                            <>
                                <Square className="w-3 h-3 fill-current" />
                                <span className="text-[10px] uppercase font-pixel tracking-tighter">{t.stopNarration}</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-3 h-3" />
                                <span className="text-[10px] uppercase font-pixel tracking-tighter">{t.narrate}</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="p-6 md:p-8 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar">
                {isTyping ? (
                    <div className="flex items-center gap-2 text-purple-300 font-pixel">
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_5px_#a855f7]"
                        />
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_5px_#a855f7]"
                        />
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_5px_#a855f7]"
                        />
                        <span className="ml-2 text-xs uppercase tracking-widest animate-pulse">{t.generatingStory}</span>
                    </div>
                ) : paragraphs.length > 0 ? (
                    <div className="space-y-4">
                        {paragraphs.map((p, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-sm md:text-lg text-gray-200 leading-relaxed font-pixel selection:bg-purple-500/50"
                            >
                                {p}
                                {i === paragraphs.length - 1 && (
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block w-2 h-5 bg-purple-400 ml-2 shadow-[0_0_8px_#a855f7]"
                                    />
                                )}
                            </motion.p>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <span className="text-4xl mb-4">📜</span>
                        <p className="text-gray-500 italic font-pixel text-sm uppercase tracking-widest">{t.waitingForCommand}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
