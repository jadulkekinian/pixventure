'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Volume2, Square, Wand2, Mic2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurrentSceneProps } from '@/lib/types';
import { Button } from '@/components/ui/button';

import { useGameStore } from '@/hooks/use-game-store';
import { translations as allTranslations } from '@/lib/translations';

type VoiceStyle = 'narrator' | 'hero';

interface WordBoundary {
    word: string;
    start: number;
    end: number;
}

interface Paragraph {
    words: WordBoundary[];
}

export function CurrentScene({ currentScene: propScene, isTyping: propIsTyping, translations: propTranslations }: CurrentSceneProps) {
    const { currentScene: storeScene, isTyping: storeIsTyping, language } = useGameStore();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('narrator');
    const [currentCharIndex, setCurrentCharIndex] = useState(-1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const currentScene = propScene !== undefined ? propScene : storeScene;
    const isTyping = propIsTyping !== undefined ? propIsTyping : storeIsTyping;
    const t = propTranslations || allTranslations[language];

    // Group words into paragraphs while tracking global character indices
    const paragraphs = useMemo((): Paragraph[] => {
        if (!currentScene) return [];

        const paraStrings = currentScene.split(/\n\s*\n/);
        let globalIndex = 0;

        return paraStrings.map((paraStr, pIdx) => {
            // Include trailing newlines in index tracking except for the last para
            const actualParaStr = paraStr + (pIdx < paraStrings.length - 1 ? '\n\n' : '');
            const regex = /(\s+)/;
            const parts = actualParaStr.split(regex);

            const words: WordBoundary[] = [];
            parts.forEach(part => {
                if (!part) return;
                words.push({
                    word: part,
                    start: globalIndex,
                    end: globalIndex + part.length
                });
                globalIndex += part.length;
            });

            return { words };
        });
    }, [currentScene]);

    useEffect(() => {
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
            setCurrentCharIndex(-1);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(currentScene);
        utteranceRef.current = utterance;

        // Match language
        if (language === 'id') utterance.lang = 'id-ID';
        else if (language === 'ja') utterance.lang = 'ja-JP';
        else utterance.lang = 'en-US';

        if (voiceStyle === 'narrator') {
            utterance.rate = 0.9;
            utterance.pitch = 0.8;
        } else {
            utterance.rate = 1.1;
            utterance.pitch = 1.2;
        }

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                setCurrentCharIndex(event.charIndex);
            }
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
        };

        window.speechSynthesis.speak(utterance);
    };

    const toggleVoiceStyle = () => {
        const nextStyle = voiceStyle === 'narrator' ? 'hero' : 'narrator';
        setVoiceStyle(nextStyle);
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            handleSpeak();
        }
    };

    return (
        <Card className="border-2 border-purple-400/40 bg-black/95 shadow-[0_0_30px_rgba(168,85,247,0.2)] overflow-hidden transition-all duration-500">
            {/* Header with Controls */}
            <div className="bg-gradient-to-r from-purple-900/40 via-purple-600/20 to-pink-900/40 p-3 border-b-2 border-purple-400/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h2 className="text-purple-300 font-bold tracking-[0.2em] font-pixel text-[10px] md:text-sm uppercase text-shadow-glow">
                        {t.currentScene}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {currentScene && !isTyping && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleVoiceStyle}
                                className={`h-8 w-8 p-0 rounded-full border-purple-500/30 bg-purple-900/20 hover:bg-purple-800/40 transition-all ${voiceStyle === 'hero' ? 'text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'text-purple-400'}`}
                            >
                                {voiceStyle === 'narrator' ? <Mic2 className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSpeak}
                                className={`h-8 gap-2 bg-purple-900/20 hover:bg-purple-800/40 text-purple-300 border border-purple-400/30 px-3 ${isSpeaking ? 'bg-pink-900/30 text-pink-400 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : ''}`}
                            >
                                {isSpeaking ? (
                                    <>
                                        <Square className="w-3 h-3 fill-current" />
                                        <span className="text-[9px] uppercase font-pixel tracking-tighter">{t.stopNarration}</span>
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-3 h-3" />
                                        <span className="text-[9px] uppercase font-pixel tracking-tighter">{t.narrate}</span>
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Story Text Area */}
            <div className="p-6 md:p-10 min-h-[120px] relative">
                {isTyping ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-6">
                        <div className="flex items-center gap-3">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3],
                                        boxShadow: ["0 0 0px #a855f7", "0 0 15px #a855f7", "0 0 0px #a855f7"]
                                    }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-3 h-3 bg-purple-400 rounded-full"
                                />
                            ))}
                        </div>
                        <span className="text-purple-300 font-pixel text-xs tracking-[0.3em] uppercase animate-pulse">
                            {t.generatingStory}
                        </span>
                    </div>
                ) : paragraphs.length > 0 ? (
                    <div className="relative z-10 space-y-8">
                        {paragraphs.map((p, pIdx) => (
                            <div key={pIdx} className="flex flex-wrap items-baseline gap-x-[0.3em] gap-y-1">
                                {p.words.map((item, wIdx) => {
                                    const isHighlighted = isSpeaking && currentCharIndex >= item.start && currentCharIndex < item.end;
                                    const isSpoken = isSpeaking && currentCharIndex > item.end;

                                    if (item.word.trim() === '') {
                                        return <span key={wIdx} className="inline-block w-[0.2em]" />;
                                    }

                                    return (
                                        <motion.span
                                            key={wIdx}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min((pIdx * 10 + wIdx) * 0.01, 1) }}
                                            className={`text-lg md:text-2xl font-pixel transition-all duration-300 leading-relaxed
                                                ${isHighlighted
                                                    ? 'text-yellow-400 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] z-20'
                                                    : isSpoken
                                                        ? 'text-purple-200/60'
                                                        : 'text-gray-100'
                                                }
                                            `}
                                        >
                                            {item.word}
                                        </motion.span>
                                    );
                                })}

                                {pIdx === paragraphs.length - 1 && (
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block w-3 h-7 bg-purple-400 ml-1 shadow-[0_0_15px_#a855f7] align-middle"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <div className="w-20 h-20 border-2 border-dashed border-purple-500 rounded-full flex items-center justify-center mb-6">
                            <Mic2 className="w-10 h-10 text-purple-400" />
                        </div>
                        <p className="text-gray-400 font-pixel text-[10px] uppercase tracking-[0.4em]">{t.waitingForCommand}</p>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-purple-400 animate-[scanline_15s_linear_infinite]" />
                    <pre className="font-mono text-[10px] leading-tight p-4 select-none">
                        {Array(30).fill("SYSTEM_NARRATIVE_STREAM_0x" + Math.random().toString(16).substring(2, 8)).join("\n")}
                    </pre>
                </div>
            </div>
        </Card>
    );
}
