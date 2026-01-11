'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurrentSceneProps } from '@/lib/types';

export function CurrentScene({ currentScene, displayedText, isTyping, translations }: CurrentSceneProps) {
    return (
        <Card className="border-2 border-purple-400/30 bg-black/80">
            <div className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 p-3 border-b-2 border-purple-400/30 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-purple-400 font-bold tracking-wider font-pixel text-xs md:text-sm">
                    {translations.currentScene}
                </h2>
            </div>
            <div className="p-6 min-h-[150px]">
                {isTyping ? (
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
                        <span className="ml-2">{translations.generatingStory}</span>
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
                    <p className="text-gray-500 italic font-pixel text-sm">{translations.waitingForCommand}</p>
                )}
            </div>
        </Card>
    );
}
