'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Volume2, Square, Wand2, Mic2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurrentSceneProps } from '@/lib/types';
import { Button } from '@/components/ui/button';

import { useGameStore } from '@/hooks/use-game-store';
import { useAudio } from '@/components/AudioSystem';
import { translations as allTranslations } from '@/lib/translations';

type VoiceStyle = 'narrator' | 'hero';

interface WordToken {
    text: string;
    start: number;
    end: number;
    isWord: boolean;
}

interface Paragraph {
    tokens: WordToken[];
}

export function CurrentScene({ currentScene: propScene, isTyping: propIsTyping, translations: propTranslations }: CurrentSceneProps) {
    const { currentScene: storeScene, isTyping: storeIsTyping, language } = useGameStore();
    const { playSfx } = useAudio();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('narrator');
    const [currentCharIndex, setCurrentCharIndex] = useState(-1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeWordRef = useRef<HTMLSpanElement>(null);
    const lastScrollLineRef = useRef<number>(0);

    const currentScene = propScene !== undefined ? propScene : storeScene;
    const isTyping = propIsTyping !== undefined ? propIsTyping : storeIsTyping;
    const t = propTranslations || allTranslations[language];

    // Robust Multi-language Tokenization
    const paragraphs = useMemo((): Paragraph[] => {
        if (!currentScene) return [];

        const paraStrings = currentScene.split(/\n\s*\n/);
        let globalIndex = 0;
        const locale = language === 'id' ? 'id-ID' : language === 'ja' ? 'ja-JP' : 'en-US';

        const segmenter = typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter !== 'undefined'
            ? new (Intl as any).Segmenter(locale, { granularity: 'word' })
            : null;

        return paraStrings.map((paraStr, pIdx) => {
            const actualParaStr = paraStr + (pIdx < paraStrings.length - 1 ? '\n\n' : '');
            const tokens: WordToken[] = [];

            if (segmenter) {
                const segments = segmenter.segment(actualParaStr);
                for (const { segment, index, isWordLike } of segments) {
                    tokens.push({
                        text: segment,
                        start: globalIndex + index,
                        end: globalIndex + index + segment.length,
                        isWord: !!isWordLike
                    });
                }
            } else {
                const parts = actualParaStr.split(/(\s+)/);
                let localIdx = 0;
                parts.forEach(part => {
                    if (!part) return;
                    tokens.push({
                        text: part,
                        start: globalIndex + localIdx,
                        end: globalIndex + localIdx + part.length,
                        isWord: !/^\s+$/.test(part)
                    });
                    localIdx += part.length;
                });
            }

            globalIndex += actualParaStr.length;
            return { tokens };
        });
    }, [currentScene, language]);

    // Proactive Auto-scroll Logic (2-line step)
    useEffect(() => {
        if (isSpeaking && activeWordRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeWord = activeWordRef.current;

            const containerRect = container.getBoundingClientRect();
            const wordRect = activeWord.getBoundingClientRect();

            const relativeTop = wordRect.top - containerRect.top;
            const lineHeight = 32; // Approximate line height for text-2xl
            const lineIndex = Math.floor(relativeTop / lineHeight);

            // If we've moved down by 2 lines since last scroll
            if (lineIndex >= 2 && lineIndex > lastScrollLineRef.current) {
                container.scrollBy({
                    top: lineHeight,
                    behavior: 'smooth'
                });
                lastScrollLineRef.current = lineIndex;
            }
        }
        if (!isSpeaking) {
            lastScrollLineRef.current = 0;
        }
    }, [currentCharIndex, isSpeaking]);

    // Clear speech when component mounts or unmounts
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []); // Only on mount/unmount

    // Also cancel when scene changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
        }
    }, [currentScene]);

    const handleSpeak = () => {
        if (!currentScene || !window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
            return;
        }

        playSfx('narrate');
        const utterance = new SpeechSynthesisUtterance(currentScene);
        utteranceRef.current = utterance;

        const langMap: Record<string, string> = { 'id': 'id-ID', 'ja': 'ja-JP', 'en': 'en-US' };
        utterance.lang = langMap[language] || 'en-US';

        if (voiceStyle === 'narrator') {
            utterance.rate = 0.85;
            utterance.pitch = 0.9;
        } else {
            utterance.rate = 1.1;
            utterance.pitch = 1.2;
        }

        // Robust progress tracking
        let lastCharIndex = -1;
        const fallbackTimer = setInterval(() => {
            if (!isSpeaking) {
                clearInterval(fallbackTimer);
                return;
            }
            // If the browser doesn't fire onboundary, we can't do much but we keep checking
        }, 100);

        utterance.onboundary = (event) => {
            setCurrentCharIndex(event.charIndex);
            lastCharIndex = event.charIndex;
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
            clearInterval(fallbackTimer);
        };
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setIsSpeaking(false);
            setCurrentCharIndex(-1);
            clearInterval(fallbackTimer);
        };

        // Try to find a better voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith(language) && v.localService);
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    };

    const toggleVoiceStyle = () => {
        playSfx('click');
        const nextStyle = voiceStyle === 'narrator' ? 'hero' : 'narrator';
        setVoiceStyle(nextStyle);
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            handleSpeak();
        }
    };

    return (
        <Card className="border-2 border-purple-500/40 bg-black/95 shadow-[0_0_40px_rgba(168,85,247,0.3)] overflow-hidden transition-all duration-500 rounded-none relative">
            {/* Retro Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            </div>

            {/* Header controls */}
            <div className="bg-purple-900/40 p-2 border-b-2 border-purple-500/30 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2 pl-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <h2 className="text-purple-300 font-bold tracking-[0.2em] font-pixel text-[9px] uppercase">
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
                                className={`h-7 w-7 p-0 rounded-none border-purple-500/40 bg-purple-900/40 hover:bg-purple-800/60 transition-all ${voiceStyle === 'hero' ? 'text-yellow-400 border-yellow-500/60' : 'text-purple-300'}`}
                            >
                                {voiceStyle === 'narrator' ? <Mic2 className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSpeak}
                                className={`h-7 gap-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 px-3 rounded-none transition-all ${isSpeaking ? 'bg-pink-900/40 text-pink-300 border-pink-500/60' : ''}`}
                            >
                                {isSpeaking ? (
                                    <Square className="w-3 h-3 fill-current" />
                                ) : (
                                    <Volume2 className="w-3 h-3" />
                                )}
                                <span className="text-[8px] uppercase font-pixel tracking-tighter">{isSpeaking ? t.stopNarration : t.narrate}</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Story text container */}
            <div
                ref={scrollContainerRef}
                className="p-6 md:p-8 min-h-[160px] max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth selection:bg-purple-500 selection:text-white"
            >
                {isTyping ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-10 h-10 border-2 border-t-purple-400 border-r-transparent border-b-purple-400 border-l-transparent rounded-full"
                        />
                        <span className="text-purple-400 font-pixel text-[10px] tracking-[0.3em] uppercase animate-pulse">
                            {t.generatingStory}
                        </span>
                    </div>
                ) : paragraphs.length > 0 ? (
                    <div className="relative z-10 space-y-10 pb-32">
                        {paragraphs.map((p, pIdx) => (
                            <div key={pIdx} className="flex flex-wrap items-baseline gap-x-[0.15em] gap-y-2">
                                {p.tokens.map((token, tIdx) => {
                                    const isActive = isSpeaking && currentCharIndex >= token.start && currentCharIndex < token.end;
                                    const isPast = isSpeaking && currentCharIndex >= token.end;

                                    if (!token.isWord) {
                                        return (
                                            <span key={tIdx} className="inline-block" style={{ whiteSpace: 'pre-wrap' }}>{token.text}</span>
                                        );
                                    }

                                    return (
                                        <motion.span
                                            key={tIdx}
                                            ref={isActive ? activeWordRef : null}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`text-2xl font-pixel transition-all duration-300 leading-relaxed inline-block
                                                ${isActive
                                                    ? 'text-yellow-400 scale-105 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-20'
                                                    : isPast
                                                        ? 'text-purple-200/40'
                                                        : 'text-slate-100'
                                                }
                                            `}
                                        >
                                            {token.text}
                                        </motion.span>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Cursor indicator */}
                        <motion.div
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-2.5 h-6 bg-purple-400 ml-2 shadow-[0_0_10px_#a855f7]"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Mic2 className="w-12 h-12 text-purple-400 mb-4" />
                        <p className="text-purple-400 font-pixel text-[10px] uppercase tracking-[0.4em]">{t.waitingForCommand}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
