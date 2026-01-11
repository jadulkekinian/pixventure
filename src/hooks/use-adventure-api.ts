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
