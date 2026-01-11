/**
 * Custom hook for managing game state with Zustand
 */

import { create } from 'zustand';
import { GameState, LogEntry } from '@/lib/types';
import { Language } from '@/lib/translations';

interface AdventureStore extends GameState {
    language: Language;
    gameStarted: boolean;
    showStartScreen: boolean;
    inputValue: string;

    // Actions
    setLanguage: (language: Language) => void;
    setGameStarted: (started: boolean) => void;
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
};


export const useGameStore = create<AdventureStore>((set) => ({
    // Initial state
    ...initialState,
    language: 'en',
    gameStarted: false,
    showStartScreen: true,
    inputValue: '',

    // Actions
    setLanguage: (language) => set({ language }),
    setGameStarted: (started) => set({ gameStarted: started }),
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
            gameStarted: false,
            showStartScreen: true,
            inputValue: '',
        }),

}));
