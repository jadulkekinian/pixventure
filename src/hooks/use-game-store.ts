/**
 * Custom hook for managing game state with Zustand
 */

import { create } from 'zustand';
import { GameState, LogEntry } from '@/lib/types';
import { Language } from '@/lib/translations';

interface AdventureStore extends GameState {
    language: Language;
    isGameStarted: boolean; // Managed via GameState but explicitly included here for clarity if needed
    showStartScreen: boolean;
    inputValue: string;

    // Actions
    setLanguage: (language: Language) => void;
    setIsGameStarted: (started: boolean) => void;
    setShowStartScreen: (show: boolean) => void;
    setInputValue: (value: string) => void;
    setCurrentScene: (scene: string) => void;
    setSceneImage: (url: string) => void;
    addLog: (log: LogEntry) => void;
    setTyping: (isTyping: boolean) => void;
    setGeneratingImage: (isGenerating: boolean) => void;
    updateGameState: (state: Partial<GameState>) => void;
    resetGame: () => void;
}


const initialState: GameState = {
    currentScene: '',
    sceneImage: '',
    logs: [],
    isTyping: false,
    isGeneratingImage: false,
    isGameStarted: false,
    hp: 100,
    maxHp: 100,
    xp: 0,
    inventory: [],
    suggestedActions: [],
    isGameOver: false,
    endingType: null,
    lastHpChange: null,
    lastXpGain: null,
    day: 1,
    timeOfDay: 'morning',
    isSafeZone: false,
    activeEnemy: null,
};


export const useGameStore = create<AdventureStore>((set) => ({
    // Initial state
    ...initialState,
    language: 'en',
    showStartScreen: true,
    inputValue: '',

    // Actions
    setLanguage: (language) => set({ language }),
    setIsGameStarted: (started) => set({ isGameStarted: started }),
    setShowStartScreen: (show) => set({ showStartScreen: show }),
    setInputValue: (value) => set({ inputValue: value }),
    setCurrentScene: (scene) => set({ currentScene: scene }),
    setSceneImage: (url) => set({ sceneImage: url }),

    addLog: (log) =>
        set((state) => ({
            logs: [...state.logs, log],
        })),

    setTyping: (isTyping) => set({ isTyping }),
    setGeneratingImage: (isGenerating) => set({ isGeneratingImage: isGenerating }),

    updateGameState: (newState) =>
        set((state) => ({
            ...state,
            ...newState,
        })),

    resetGame: () =>
        set({
            ...initialState,
            showStartScreen: true,
            inputValue: '',
        }),

}));
