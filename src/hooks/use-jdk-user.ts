/**
 * Custom hook for JDK user integration
 * Receives user data from parent window via iframe bridge
 */

import { useState, useEffect } from 'react';
import { iframeBridge, UserData } from '@/lib/iframe-bridge';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface UseJDKUserReturn {
    user: UserData | null;
    isLoading: boolean;
    isInIframe: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

export function useJDKUser(): UseJDKUserReturn {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInIframe] = useState(() => iframeBridge.isInIframe());

    useEffect(() => {
        // Initialize iframe bridge
        iframeBridge.init();

        // Subscribe to user data updates
        const unsubscribe = iframeBridge.onUserDataReceived(async (userData) => {
            try {
                setIsLoading(true);

                // Attempt to set Supabase session with provided token
                if (userData.session) {
                    const { error: authError } = await supabase.auth.setSession({
                        access_token: userData.session,
                        refresh_token: '', // Will be managed by JDK web
                    });

                    if (authError) {
                        logger.warn('Failed to set Supabase session', { error: authError.message });
                        // Continue anyway - we still have user data
                    } else {
                        logger.info('Supabase session established');
                    }
                }

                setUser(userData);
                setError(null);
                logger.info('JDK user authenticated', { username: userData.username });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
                setError(errorMessage);
                logger.error('Error processing user data', { error: errorMessage });
            } finally {
                setIsLoading(false);
            }
        });

        // If not in iframe, we won't get user data
        if (!isInIframe) {
            setIsLoading(false);
            logger.info('Not running in iframe, standalone mode');
        }

        // Notify parent that we're ready
        iframeBridge.notifyReady();

        // Cleanup
        return () => {
            unsubscribe();
        };
    }, [isInIframe]);

    return {
        user,
        isLoading,
        isInIframe,
        error,
        isAuthenticated: user !== null,
    };
}
