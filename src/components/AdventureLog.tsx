'use client';

import { motion } from 'framer-motion';
import { Scroll } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AdventureLogProps } from '@/lib/types';
import { useRef, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { translations as allTranslations } from '@/lib/translations';

export function AdventureLog({ logs: propLogs, translations: propTranslations }: AdventureLogProps) {
    const { logs: storeLogs, language } = useGameStore();
    const logEndRef = useRef<HTMLDivElement>(null);

    const logs = propLogs !== undefined ? propLogs : storeLogs;
    const t = propTranslations || allTranslations[language];

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <Card className="lg:col-span-1 border-2 border-yellow-400/30 bg-black/80 overflow-hidden flex flex-col max-h-[500px] lg:max-h-[600px]">
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 p-3 border-b-2 border-yellow-400/30 flex items-center gap-2">
                <Scroll className="w-5 h-5 text-yellow-400" />
                <h2 className="text-yellow-400 font-bold tracking-wider font-pixel text-xs md:text-sm">
                    {t.adventureLog}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {logs.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm italic font-pixel">
                        {t.noAdventures}
                    </p>
                ) : (
                    logs.map((log, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg border-2 ${log.type === 'command'
                                ? 'bg-blue-400/10 border-blue-400/30'
                                : log.type === 'system'
                                    ? 'bg-green-400/10 border-green-400/30'
                                    : 'bg-purple-400/10 border-purple-400/30'
                                }`}
                        >
                            <p
                                className={`text-xs ${log.type === 'command'
                                    ? 'text-blue-300'
                                    : log.type === 'system'
                                        ? 'text-green-300'
                                        : 'text-purple-300'
                                    } font-pixel leading-relaxed`}
                            >
                                {log.content}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 font-pixel">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                        </motion.div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </Card>
    );
}
