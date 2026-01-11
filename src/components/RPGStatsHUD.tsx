'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Package, Sun, Moon, Sunrise, Sunset, Clock3 } from 'lucide-react';
import { useGameStore } from '@/hooks/use-game-store';

export function RPGStatsHUD() {
    const { hp, maxHp, xp, inventory, lastHpChange, lastXpGain, day, timeOfDay, isSafeZone } = useGameStore();

    const getTimeIcon = () => {
        switch (timeOfDay) {
            case 'morning': return <Sunrise className="w-5 h-5 text-orange-300" />;
            case 'afternoon': return <Sun className="w-5 h-5 text-yellow-300" />;
            case 'evening': return <Sunset className="w-5 h-5 text-orange-400" />;
            case 'night': return <Moon className="w-5 h-5 text-blue-300" />;
            default: return <Sun className="w-5 h-5 text-yellow-300" />;
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-6 relative">
            {/* Safe Zone Indicator */}
            <AnimatePresence>
                {isSafeZone && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full w-fit mb-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                        </motion.div>
                        <span className="text-[10px] font-pixel text-emerald-400 uppercase tracking-widest">Safe Zone</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Indicators Container */}
            <div className="absolute -top-10 left-0 w-full flex justify-around pointer-events-none z-50">
                <AnimatePresence>
                    {lastHpChange !== null && (
                        <motion.span
                            initial={{ opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1.2 }}
                            exit={{ opacity: 0, y: -40, scale: 1.5 }}
                            className={`font-pixel text-lg ${lastHpChange < 0 ? 'text-red-500' : 'text-green-400'}`}
                        >
                            {lastHpChange < 0 ? lastHpChange : `+${lastHpChange}`} HP
                        </motion.span>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {lastXpGain !== null && lastXpGain > 0 && (
                        <motion.span
                            initial={{ opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1.2 }}
                            exit={{ opacity: 0, y: -40, scale: 1.5 }}
                            className="font-pixel text-lg text-yellow-400"
                        >
                            +{lastXpGain} XP
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                {/* HP Bar */}
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Heart className={`w-5 h-5 ${hp < 30 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
                            <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-widest">Health</span>
                        </div>
                        <span className="text-[10px] font-pixel text-red-200">{hp}/{maxHp}</span>
                    </div>
                    <div className="h-4 bg-slate-900 border-2 border-slate-800 rounded-sm relative overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(hp / maxHp) * 100}%` }}
                            className={`h-full transition-all duration-500 ${hp < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-emerald-400'
                                }`}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_2px]" />
                    </div>
                </div>

                {/* XP Bar */}
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400" />
                            <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-widest">Experience</span>
                        </div>
                        <span className="text-[10px] font-pixel text-yellow-200">{xp} XP</span>
                    </div>
                    <div className="h-4 bg-slate-900 border-2 border-slate-800 rounded-sm relative overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (xp % 100))}%` }}
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_2px]" />
                    </div>
                </div>

                {/* Chronosphere (Time) */}
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {getTimeIcon()}
                            <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-widest">Chronosphere</span>
                        </div>
                        <span className="text-[10px] font-pixel text-slate-300">Day {day} • {timeOfDay}</span>
                    </div>
                    <div className="h-4 bg-slate-900 border-2 border-slate-800 rounded-sm relative overflow-hidden">
                        <motion.div
                            animate={{
                                width: timeOfDay === 'morning' ? '25%' :
                                    timeOfDay === 'afternoon' ? '50%' :
                                        timeOfDay === 'evening' ? '75%' : '100%'
                            }}
                            className={`h-full transition-all duration-1000 ${timeOfDay === 'night' ? 'bg-indigo-900' : 'bg-orange-500'
                                }`}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_2px]" />
                    </div>
                </div>
            </div>

            {/* Inventory Quick View */}
            {inventory.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg overflow-x-auto custom-scrollbar">
                    <Package className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-pixel text-slate-500 uppercase tracking-widest mr-2">Pouch:</span>
                    <div className="flex gap-2">
                        {inventory.map((item, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="px-2 py-1 bg-purple-900/40 border border-purple-500/30 rounded text-[9px] text-purple-200 font-pixel whitespace-nowrap"
                            >
                                {item}
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
