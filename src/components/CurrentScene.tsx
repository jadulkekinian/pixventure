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

interface WordToken {
    text: string;
    start: number;
    end: number;
    isGap: boolean;
}

interface Paragraph {
    tokens: WordToken[];
}

export function CurrentScene({ currentScene: propScene, isTyping: propIsTyping, translations: propTranslations }: CurrentSceneProps) {
    const { currentScene: storeScene, isTyping: storeIsTyping, language } = useGameStore();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('narrator');
    const [currentCharIndex, setCurrentCharIndex] = useState(-1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeWordRef = useRef<HTMLSpanElement>(null);

    const currentScene = propScene !== undefined ? propScene : storeScene;
    const isTyping = propIsTyping !== undefined ? propIsTyping : storeIsTyping;
    const t = propTranslations || allTranslations[language];

    // Robust Multi-language Tokenization using Intl.Segmenter
    const paragraphs = useMemo((): Paragraph[] => {
        if (!currentScene) return [];

        // Split by paragraphs first
        const paraStrings = currentScene.split(/\n\s*\n/);
        let globalIndex = 0;

        // Determine locale for segmenter
        const locale = language === 'id' ? 'id-ID' : language === 'ja' ? 'ja-JP' : 'en-US';

        // Firefox might not support Intl.Segmenter yet, so we have a fallback
        const segmenter = typeof Intl.Segmenter !== 'undefined'
            ? new Intl.Segmenter(locale, { granularity: 'word' })
            : null;

        return paraStrings.map((paraStr, pIdx) => {
            // We need to keep track of the exact string with its trailing paragraph breaks for global index mapping
            const actualParaStr = paraStr + (pIdx < paraStrings.length - 1 ? '\n\n' : '');
            const tokens: WordToken[] = [];

            if (segmenter) {
                const segments = segmenter.segment(actualParaStr);
                for (const { segment, index, isWordLike } of segments) {
                    tokens.push({
                        text: segment,
                        start: globalIndex + index,
                        end: globalIndex + index + segment.length,
                        isGap: !isWordLike
                    });
                }
            } else {
                // Fallback for older browsers: split by space but this is poor for Japanese
                const parts = actualParaStr.split(/(\s+)/);
                let localIdx = 0;
                parts.forEach(part => {
                    if (!part) return;
                    tokens.push({
                        text: part,
                        start: globalIndex + localIdx,
                        end: globalIndex + localIdx + part.length,
                        isGap: /^\s+$/.test(part)
                    });
                    localIdx += part.length;
                });
            }

            globalIndex += actualParaStr.length;
            return { tokens };
        });
    }, [currentScene, language]);

    // Proactive Auto-scroll Logic (Scroll 2.0)
    useEffect(() => {
        if (isSpeaking && activeWordRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeWord = activeWordRef.current;

            // Calculate positions
            const containerRect = container.getBoundingClientRect();
            const wordRect = activeWord.getBoundingClientRect();

            // Relative position within container
            const relativeTop = wordRect.top - containerRect.top;
            const relativeBottom = wordRect.bottom - containerRect.top;

            // Threshold: If the word is in the bottom 40% of the visible area, scroll it up
            const threshold = containerRect.height * 0.6;

            if (relativeBottom > threshold) {
                // Scroll so the word is roughly in the middle-top
                const scrollAmount = relativeTop - (containerRect.height * 0.2);
                container.scrollBy({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentCharIndex, isSpeaking]);

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

        // Mapping internal language code to TTS locale
        if (language === 'id') utterance.lang = 'id-ID';
        else if (language === 'ja') utterance.lang = 'ja-JP';
        else utterance.lang = 'en-US';

        if (voiceStyle === 'narrator') {
            utterance.rate = 0.85; // Slightly slower for gravity
            utterance.pitch = 0.8;
        } else {
            utterance.rate = 1.05;
            utterance.pitch = 1.1;
        }

        // Capture all boundary events for wider browser/engine support
        utterance.onboundary = (event) => {
            // For some languages/engines, 'word' boundaries are more reliable
            // We update the index regardless of name if it's progress
            setCurrentCharIndex(event.charIndex);
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
        };
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
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
        <Card className="border-2 border-purple-400/40 bg-black/95 shadow-[0_0_40px_rgba(168,85,247,0.25)] overflow-hidden transition-all duration-500">
            {/* Header with Glassmorphism Controls */}
            <div className="bg-gradient-to-r from-purple-900/60 via-purple-600/30 to-pink-900/60 p-3 border-b-2 border-purple-400/40 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-purple-400 rounded-full blur-sm"
                        />
                    </div>
                    <h2 className="text-purple-200 font-bold tracking-[0.2em] font-pixel text-[10px] md:text-xs uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                        {t.currentScene}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {currentScene && !isTyping && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleVoiceStyle}
                                className={`h-8 w-8 p-0 rounded-full border-purple-500/40 bg-purple-900/30 hover:bg-purple-800/50 transition-all ${voiceStyle === 'hero' ? 'text-yellow-400 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-purple-300'}`}
                            >
                                {voiceStyle === 'narrator' ? <Mic2 className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSpeak}
                                className={`h-8 gap-2 bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 border border-purple-400/40 px-4 transition-all ${isSpeaking ? 'bg-pink-900/40 text-pink-300 border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.4)]' : ''}`}
                            >
                                {isSpeaking ? (
                                    <>
                                        <Square className="w-3 h-3 fill-current animate-pulse" />
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

            {/* Story Text Area - Optimized for Readability and Auto-Scroll */}
            <div
                ref={scrollContainerRef}
                className="p-8 md:p-12 min-h-[180px] max-h-[500px] overflow-y-auto custom-scrollbar relative scroll-smooth bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"
            >
                {isTyping ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-8">
                        <div className="flex items-center gap-4">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.8, 1],
                                        opacity: [0.2, 1, 0.2],
                                        y: [0, -10, 0]
                                    }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                                    className="w-4 h-4 bg-purple-400 rounded-full shadow-[0_0_15px_#a855f7]"
                                />
                            ))}
                        </div>
                        <span className="text-purple-300 font-pixel text-xs tracking-[0.4em] uppercase animate-pulse">
                            {t.generatingStory}
                        </span>
                    </div>
                ) : paragraphs.length > 0 ? (
                    <div className="relative z-10 space-y-16 pb-40">
                        {paragraphs.map((p, pIdx) => (
                            <div key={pIdx} className="flex flex-wrap items-baseline gap-x-[0.2em] gap-y-3">
                                {p.tokens.map((token, tIdx) => {
                                    // Robust character index check: if the current index has passed this token's start
                                    const isActive = isSpeaking && currentCharIndex >= token.start && currentCharIndex < token.end;
                                    const isPast = isSpeaking && currentCharIndex >= token.end;

                                    if (token.isGap) {
                                        return <span key={tIdx} className="inline-block" style={{ width: token.text === '\n' ? '100%' : '0.4em' }} />;
                                    }

                                    return (
                                        <motion.span
                                            key={tIdx}
                                            ref={isActive ? activeWordRef : null}
                                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                                            transition={{ duration: 0.5, delay: Math.min((pIdx * 5 + tIdx) * 0.02, 1.5) }}
                                            className={`text-2xl md:text-4xl font-pixel transition-all duration-500 leading-[1.6]
                                                ${isActive
                                                    ? 'text-yellow-300 scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,1)] z-20 brightness-125'
                                                    : isPast
                                                        ? 'text-purple-200/40 brightness-75'
                                                        : 'text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
                                                }
                                            `}
                                        >
                                            {token.text}
                                        </motion.span>
                                    );
                                })}

                                {pIdx === paragraphs.length - 1 && (
                                    <motion.span
                                        animate={{ opacity: [1, 0], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="inline-block w-5 h-10 bg-purple-400 ml-3 shadow-[0_0_25px_#a855f7] align-middle opacity-80"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                        <div className="w-24 h-24 border-2 border-dashed border-purple-500/50 rounded-full flex items-center justify-center mb-8 animate-[spin_20s_linear_infinite]">
                            <Mic2 className="w-12 h-12 text-purple-400" />
                        </div>
                        <p className="text-purple-400 font-pixel text-xs uppercase tracking-[0.5em]">{t.waitingForCommand}</p>
                    </div>
                )}

                {/* Cyberpunk Decorative Underlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden select-none">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500 animate-[scanline_20s_linear_infinite] shadow-[0_0_10px_#a855f7]" />
                    <div className="grid grid-cols-6 gap-4 p-4 font-mono text-[8px] uppercase">
                        {Array(100).fill(0).map((_, i) => (
                            <span key={i} className="opacity-20">
                                0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
