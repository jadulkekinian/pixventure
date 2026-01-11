/**
 * Custom hook for managing adventure API calls
 */

import { useState, useCallback } from 'react';
import { AdventureAPIResponse, ActionRequest, StartAdventureRequest } from '@/lib/types';
import { Language } from '@/lib/translations';
import { logger } from '@/lib/logger';

export function useAdventureAPI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseRPGMetadata = (story: string): { story: string; rpgData: any } => {
        const rpgRegex = /\[\[RPG:([\s\S]*?)\]\]/;
        const match = story.match(rpgRegex);

        if (match) {
            try {
                const jsonStr = match[1].trim();
                const rpgData = JSON.parse(jsonStr);
                const cleanStory = story.replace(rpgRegex, '').trim();
                return { story: cleanStory, rpgData };
            } catch (e) {
                logger.error('Failed to parse RPG metadata', { error: e, raw: match[1] });
            }
        }
        return { story, rpgData: null };
    };

    const startAdventure = useCallback(async (language: Language): Promise<AdventureAPIResponse | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/adventure/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language } as StartAdventureRequest),
            });

            const data: AdventureAPIResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to start adventure');
            }

            if (data.story) {
                const { story, rpgData } = parseRPGMetadata(data.story);
                data.story = story;
                if (rpgData) {
                    data.hpChange = rpgData.hpChange || 0;
                    data.xpGain = rpgData.xpGain || 0;
                    data.newItem = rpgData.item;
                    data.suggestedActions = rpgData.actions;
                    data.isEnding = rpgData.end;
                    data.day = rpgData.day;
                    data.timeOfDay = rpgData.time;
                    data.isSafeZone = !!rpgData.safe;
                    data.activeEnemy = rpgData.enemy || null;
                    // For start, AI might set absolute values
                    if (rpgData.hp !== undefined) data.hpChange = rpgData.hp;
                }
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            logger.error('Failed to start adventure', { error: errorMessage });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendCommand = useCallback(
        async (
            command: string,
            previousScene: string,
            language: Language
        ): Promise<AdventureAPIResponse | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/adventure/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, previousScene, language } as ActionRequest),
                });

                const data: AdventureAPIResponse = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to process command');
                }

                if (data.story) {
                    const { story, rpgData } = parseRPGMetadata(data.story);
                    data.story = story;
                    if (rpgData) {
                        data.hpChange = rpgData.hpChange || 0;
                        data.xpGain = rpgData.xpGain || 0;
                        data.newItem = rpgData.item;
                        data.suggestedActions = rpgData.actions;
                        data.isEnding = rpgData.end;
                        data.day = rpgData.day;
                        data.timeOfDay = rpgData.time;
                        data.isSafeZone = !!rpgData.safe;
                        data.activeEnemy = rpgData.enemy || null;
                    }
                }

                return data;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(errorMessage);
                logger.error('Failed to send command', { error: errorMessage, command });
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        startAdventure,
        sendCommand,
        isLoading,
        error,
    };
}
