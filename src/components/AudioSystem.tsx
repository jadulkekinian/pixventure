'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSfx: (type: 'click' | 'submit' | 'narrate' | 'reveal') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(true); // Default muted to comply with browser policies
    const bgmRef = useRef<HTMLAudioElement | null>(null);

    // Audio URLs (Royalty-free retro assets)
    const BGM_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_0bac13659c.mp3"; // Retro casual game loop
    const SFX_MAP = {
        click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", // Interface click
        submit: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", // Sword clang / submit
        narrate: "https://assets.mixkit.co/active_storage/sfx/131/131-preview.mp3", // Magic chime
        reveal: "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3" // Level up / Reveal
    };

    useEffect(() => {
        const audio = new Audio(BGM_URL);
        audio.loop = true;
        audio.volume = 0.3;
        bgmRef.current = audio;

        return () => {
            audio.pause();
            bgmRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!bgmRef.current) return;
        if (!isMuted) {
            bgmRef.current.play().catch(err => console.log("BGM Play prevented:", err));
        } else {
            bgmRef.current.pause();
        }
    }, [isMuted]);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    const playSfx = (type: keyof typeof SFX_MAP) => {
        if (isMuted) return;
        const sfx = new Audio(SFX_MAP[type]);
        sfx.volume = 0.5;
        sfx.play().catch(err => console.log("SFX Play prevented:", err));
    };

    return (
        <AudioContext.Provider value={{ isMuted, toggleMute, playSfx }}>
            {children}
            {/* Global Mute Toggle UI */}
            <div className="fixed top-4 right-4 z-[100]">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                    className={`h-10 w-10 p-0 rounded-full border-2 transition-all ${!isMuted ? 'border-purple-400 bg-purple-900/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-600 bg-gray-900/40 text-gray-500'}`}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
                </Button>
            </div>
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
