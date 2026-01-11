'use client';

import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommandInputProps } from '@/lib/types';
import { useRef, KeyboardEvent } from 'react';

export function CommandInput({
    inputValue,
    onInputChange,
    onSubmit,
    isDisabled,
    translations,
}: CommandInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-yellow-400/30 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-sm p-4 z-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={translations.inputPlaceholder}
                        disabled={isDisabled}
                        className="flex-1 bg-black/60 border-2 border-yellow-400/40 text-yellow-100 placeholder:text-gray-600 focus:border-yellow-400 font-pixel text-sm h-14 px-4"
                    />
                    <Button
                        onClick={onSubmit}
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
                <p className="text-center text-xs text-gray-600 mt-2 font-pixel leading-relaxed">
                    {translations.exampleCommands}
                </p>
            </div>
        </div>
    );
}
