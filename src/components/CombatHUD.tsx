'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Heart } from 'lucide-react';
import { useGameStore } from '@/hooks/use-game-store';

export function CombatHUD() {
    const { activeEnemy } = useGameStore();

    if (!activeEnemy) return null;

    const hpPercentage = (activeEnemy.hp / activeEnemy.maxHp) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] z-40"
        >
            <div className="bg-slate-900/90 border-2 border-red-900/50 backdrop-blur-md rounded-xl p-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <Swords className="w-4 h-4 text-red-500" />
                        </motion.div>
                        <span className="text-[10px] font-pixel text-red-400 uppercase tracking-[0.2em]">Enemy: {activeEnemy.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-red-500 fill-red-500/20" />
                        <span className="text-[10px] font-pixel text-red-200">{activeEnemy.hp}/{activeEnemy.maxHp}</span>
                    </div>
                </div>

                <div className="h-3 bg-slate-950 border border-slate-800 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${hpPercentage}%` }}
                        className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                        transition={{ duration: 0.5 }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_2px]" />
                </div>
            </div>
        </motion.div>
    );
}
