'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Skull, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/hooks/use-game-store';

export function EndingOverlay() {
    const { isGameOver, endingType, resetGame } = useGameStore();

    if (!isGameOver) return null;

    const isWin = endingType === 'win';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden"
            >
                {/* Cinematic Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    {isWin ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20" />
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="max-w-xl w-full mx-4 text-center p-12 relative"
                >
                    {isWin ? (
                        <>
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="inline-block mb-8"
                            >
                                <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
                            </motion.div>
                            <h2 className="text-5xl md:text-7xl font-pixel text-yellow-400 mb-6 tracking-tighter drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                                VICTORY
                            </h2>
                            <p className="text-xl md:text-2xl font-pixel text-yellow-100/60 mb-12 uppercase tracking-[0.3em]">
                                Your saga lives on
                            </p>
                        </>
                    ) : (
                        <>
                            <motion.div
                                animate={{ y: [0, -10, 0], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="inline-block mb-8"
                            >
                                <Skull className="w-24 h-24 text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,1)]" />
                            </motion.div>
                            <h2 className="text-5xl md:text-7xl font-pixel text-red-600 mb-6 tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                DEFEATED
                            </h2>
                            <p className="text-xl md:text-2xl font-pixel text-red-300/40 mb-12 uppercase tracking-[0.3em]">
                                A valient sacrifice
                            </p>
                        </>
                    )}

                    <div className="flex flex-col gap-4 max-w-xs mx-auto">
                        <Button
                            size="lg"
                            onClick={resetGame}
                            className={`py-8 text-lg font-pixel transition-all relative overflow-hidden group
                                ${isWin
                                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-[0_0_30px_rgba(250,204,21,0.3)]'
                                    : 'bg-red-900 border-2 border-red-600 text-red-100 hover:bg-red-800'
                                }`}
                        >
                            <RefreshCw className="mr-3 w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            NEW ADVENTURE
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
