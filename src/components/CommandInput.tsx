'use client';

import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommandInputProps } from '@/lib/types';
import { useRef, KeyboardEvent } from 'react';

import { useRef, useState, KeyboardEvent } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { translations as allTranslations } from '@/lib/translations';

export function CommandInput({
    onSend,
    isDisabled: propDisabled,
    placeholder: propPlaceholder,
    translations: propTranslations,
}: CommandInputProps) {
    const [inputValue, setInputValue] = useState('');
    const { language, isTyping, isGeneratingImage } = useGameStore();
    const t = propTranslations || allTranslations[language];
    const isDisabled = propDisabled !== undefined ? propDisabled : (isTyping || isGeneratingImage);

    const handleSubmit = () => {
        if (!inputValue.trim() || isDisabled) return;
        if (onSend) onSend(inputValue.trim());
        setInputValue('');
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex gap-2">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={propPlaceholder || t.inputPlaceholder}
                disabled={isDisabled}
                className="flex-1 bg-black/60 border-2 border-yellow-400/40 text-yellow-100 placeholder:text-gray-600 focus:border-yellow-400 font-pixel text-sm h-14 px-4"
            />
            <Button
                onClick={handleSubmit}
                disabled={isDisabled || !inputValue.trim()}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold tracking-wider border-2 border-yellow-400 px-8 h-14 font-pixel"
            >
                {isDisabled ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        <Loader2 className="w-6 h-6" />
                    </motion.div>
                ) : (
                    <Send className="w-6 h-6" />
                )}
            </Button>
        </div>
    );
}
