'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface QuickActionsProps {
    actions: string[];
    isLoading: boolean;
    onAction: (action: string) => void;
    isSafeZone?: boolean;
    disabled?: boolean;
}

export function QuickActions({ actions, isLoading, onAction, isSafeZone, disabled }: QuickActionsProps) {
    if (!actions || actions.length === 0) return null;

    const isInteractionDisabled = isLoading || disabled;

    // Filter "Rest" action if not in safe zone
    const displayActions = isSafeZone ? actions : actions.filter(a => a.toLowerCase() !== 'rest');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <AnimatePresence mode="popLayout">
                {displayActions.map((action, index) => (
                    <motion.button
                        key={action}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.1 } }}
                        onClick={() => onAction(action)}
                        disabled={isInteractionDisabled}
                        whileHover={isInteractionDisabled ? {} : {
                            scale: 1.02,
                            y: -2,
                            backgroundColor: "rgba(30, 41, 59, 0.8)",
                            borderColor: "rgba(234, 179, 8, 0.5)",
                            boxShadow: "0 0 20px rgba(234, 179, 8, 0.2)"
                        }}
                        whileTap={isInteractionDisabled ? {} : { scale: 0.98 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-pixel text-slate-300 hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <Sparkles className="w-3 h-3 text-yellow-500/50 group-hover:text-yellow-400 transition-colors" />
                        {action}
                        <motion.div
                            className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={false}
                        />
                    </motion.button>
                ))}
            </AnimatePresence>
        </div>
    );
}
