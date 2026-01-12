'use client';

import { motion } from 'framer-motion';
import { Map, MapPin, Compass, Mountain, Trees, Building2, Skull } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useGameStore } from '@/hooks/use-game-store';
import { translations as allTranslations } from '@/lib/translations';

interface Location {
    id: string;
    name: string;
    type: 'town' | 'forest' | 'mountain' | 'dungeon' | 'unknown';
    visited: boolean;
    current: boolean;
    position: { x: number; y: number };
}

export function MiniMap() {
    const { language, day, timeOfDay, isSafeZone, activeEnemy } = useGameStore();
    const t = allTranslations[language];

    // Generate some placeholder locations based on game state
    const locations: Location[] = [
        { id: '1', name: 'Starting Village', type: 'town', visited: true, current: isSafeZone && !activeEnemy, position: { x: 50, y: 70 } },
        { id: '2', name: 'Dark Forest', type: 'forest', visited: day > 1, current: !isSafeZone && !activeEnemy, position: { x: 30, y: 45 } },
        { id: '3', name: 'Mountain Pass', type: 'mountain', visited: day > 2, current: false, position: { x: 70, y: 30 } },
        { id: '4', name: 'Ancient Dungeon', type: 'dungeon', visited: false, current: !!activeEnemy, position: { x: 45, y: 20 } },
    ];

    const getLocationIcon = (type: string, isCurrent: boolean) => {
        const size = isCurrent ? 'w-5 h-5' : 'w-4 h-4';
        switch (type) {
            case 'town': return <Building2 className={`${size} text-yellow-400`} />;
            case 'forest': return <Trees className={`${size} text-green-400`} />;
            case 'mountain': return <Mountain className={`${size} text-slate-400`} />;
            case 'dungeon': return <Skull className={`${size} text-red-400`} />;
            default: return <MapPin className={`${size} text-purple-400`} />;
        }
    };

    const getTimeColor = () => {
        switch (timeOfDay) {
            case 'morning': return 'from-orange-900/20 to-yellow-900/10';
            case 'afternoon': return 'from-blue-900/20 to-cyan-900/10';
            case 'evening': return 'from-orange-900/30 to-red-900/20';
            case 'night': return 'from-indigo-900/40 to-purple-900/30';
            default: return 'from-slate-900/20 to-slate-900/10';
        }
    };

    return (
        <Card className="border-2 border-emerald-500/30 bg-black/80 overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-400/20 to-teal-400/20 p-3 border-b-2 border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-emerald-400 font-bold tracking-wider font-pixel text-xs md:text-sm uppercase">
                        Map
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-300/60" />
                    <span className="text-[9px] font-pixel text-emerald-300/60 uppercase">
                        Day {day}
                    </span>
                </div>
            </div>

            {/* Map Display */}
            <div className={`flex-1 relative overflow-hidden bg-gradient-to-br ${getTimeColor()}`}>
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                        backgroundImage: `
                            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                {/* Terrain Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 10 80 Q 30 60 50 70 T 90 50" stroke="rgba(16, 185, 129, 0.5)" fill="none" strokeWidth="0.5" strokeDasharray="2,2" />
                    <path d="M 20 90 Q 40 50 60 60 T 80 30" stroke="rgba(16, 185, 129, 0.3)" fill="none" strokeWidth="0.3" strokeDasharray="1,1" />
                </svg>

                {/* Location Markers */}
                {locations.map((loc) => (
                    <motion.div
                        key={loc.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${loc.position.x}%`, top: `${loc.position.y}%` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: loc.current ? [1, 1.2, 1] : 1,
                            opacity: loc.visited ? 1 : 0.3
                        }}
                        transition={{
                            scale: { duration: 2, repeat: loc.current ? Infinity : 0 },
                            opacity: { duration: 0.5 }
                        }}
                    >
                        <div className={`relative flex flex-col items-center ${loc.current ? 'z-10' : ''}`}>
                            {/* Ping effect for current location */}
                            {loc.current && (
                                <motion.div
                                    className="absolute w-8 h-8 rounded-full border-2 border-yellow-400/50"
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}

                            {/* Icon */}
                            <div className={`p-1.5 rounded ${loc.current ? 'bg-yellow-500/20 border border-yellow-400/50' : 'bg-slate-900/50'}`}>
                                {getLocationIcon(loc.type, loc.current)}
                            </div>

                            {/* Label */}
                            {loc.visited && (
                                <span className={`mt-1 text-[7px] font-pixel whitespace-nowrap ${loc.current ? 'text-yellow-300' : 'text-emerald-300/60'}`}>
                                    {loc.name}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Fog of War Overlay for unvisited areas */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-slate-950/80 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-gradient-to-tr from-slate-950/60 to-transparent" />
                </div>

                {/* Safe Zone Indicator */}
                {isSafeZone && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-emerald-400"
                        />
                        <span className="text-[8px] font-pixel text-emerald-300 uppercase">Safe Zone</span>
                    </div>
                )}

                {/* Danger Indicator */}
                {activeEnemy && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-red-400"
                        />
                        <span className="text-[8px] font-pixel text-red-300 uppercase">Combat Zone</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
