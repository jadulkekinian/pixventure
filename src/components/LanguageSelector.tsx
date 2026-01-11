'use client';

import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { LanguageSelectorProps } from '@/lib/types';

const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export function LanguageSelector({ language, onLanguageChange, variant = 'default' }: LanguageSelectorProps) {
    const t = translations[language];
    const isCompact = variant === 'compact';

    return (
        <div className={isCompact ? '' : 'mb-8'}>
            {!isCompact && (
                <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-400">
                    <Languages className="w-4 h-4" />
                    <span className="font-bold font-pixel">{t.selectLanguage}</span>
                </div>
            )}
            <div className="flex justify-center gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                    <Button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        variant={language === lang.code ? 'default' : 'outline'}
                        size="sm"
                        className={`${language === lang.code
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-2 border-yellow-300'
                                : 'bg-black/60 border-2 border-gray-600 text-gray-300 hover:border-yellow-400'
                            } ${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-xs'} font-bold font-pixel`}
                    >
                        {lang.flag} {isCompact ? lang.code.toUpperCase() : lang.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
