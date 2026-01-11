/**
 * TypeScript types for the Pix Adventure game
 */

import { Language } from './translations';

// Log entry types
export type LogType = 'story' | 'command' | 'system';

export interface LogEntry {
    type: LogType;
    content: string;
    timestamp: Date;
}

// Game state
export interface GameState {
    currentScene: string;
    sceneImage: string;
    logs: LogEntry[];
    isTyping: boolean;
    isGeneratingImage: boolean;
    isGameStarted: boolean;
}


// API Response types
export interface AdventureAPIResponse {
    success: boolean;
    story?: string;
    imageUrl?: string;
    error?: string;
    code?: string;
}

export interface StartAdventureRequest {
    language: Language;
}

export interface ActionRequest {
    command: string;
    previousScene: string;
    language: Language;
}

// Component prop types
export interface LanguageSelectorProps {
    language?: Language;
    onLanguageChange?: (language: Language) => void;
    variant?: 'default' | 'compact';
}

export interface AdventureLogProps {
    logs?: LogEntry[];
    translations?: {
        adventureLog: string;
        noAdventures: string;
    };
}

export interface SceneDisplayProps {
    sceneImage?: string;
    isGeneratingImage?: boolean;
    translations?: {
        sceneWillAppearHere: string;
    };
}

export interface CurrentSceneProps {
    currentScene?: string;
    displayedText?: string;
    isTyping?: boolean;
    translations?: {
        currentScene: string;
        generatingStory: string;
        waitingForCommand: string;
    };
}

export interface CommandInputProps {
    onSend?: (command: string) => void;
    isDisabled?: boolean;
    isLoading?: boolean;
    placeholder?: string;
}

export interface StartScreenProps {
    language: Language;
    onLanguageChange?: (language: Language) => void;
    onStartGame: () => void;
    mounted: boolean;
    username?: string;
    isLoading?: boolean;
}

