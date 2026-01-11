/**
 * Custom hook for adventure persistence with Supabase
 * Handles saving and loading game progress
 */

import { useState, useCallback } from 'react';
import { supabase, Adventure, AdventureScene } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Language } from '@/lib/translations';

interface SaveAdventureParams {
    memberId: string;
    username: string;
    language: Language;
}

interface SaveSceneParams {
    adventureId: string;
    sceneNumber: number;
    storyText: string;
    imageUrl: string;
    command?: string;
}

export function useAdventurePersistence() {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Create or update an adventure
     */
    const saveAdventure = useCallback(async (params: SaveAdventureParams): Promise<string | null> => {
        setIsSaving(true);

        try {
            const { data, error } = await supabase
                .from('adventures')
                .upsert(
                    {
                        member_id: params.memberId,
                        username: params.username,
                        language: params.language,
                        last_played_at: new Date().toISOString(),
                        is_active: true,
                    },
                    {
                        onConflict: 'member_id,is_active',
                    }
                )
                .select()
                .single();

            if (error) {
                logger.error('Failed to save adventure', { error: error.message });
                return null;
            }

            logger.info('Adventure saved', { adventureId: data.id });
            return data.id;
        } catch (err) {
            logger.error('Error saving adventure', { error: err });
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    /**
     * Save a scene to an adventure
     */
    const saveScene = useCallback(async (params: SaveSceneParams): Promise<boolean> => {
        setIsSaving(true);

        try {
            const { error } = await supabase.from('adventure_scenes').insert({
                adventure_id: params.adventureId,
                scene_number: params.sceneNumber,
                story_text: params.storyText,
                image_url: params.imageUrl,
                command: params.command || null,
            });

            if (error) {
                logger.error('Failed to save scene', { error: error.message });
                return false;
            }

            logger.info('Scene saved', {
                adventureId: params.adventureId,
                sceneNumber: params.sceneNumber,
            });
            return true;
        } catch (err) {
            logger.error('Error saving scene', { error: err });
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    /**
     * Load the most recent active adventure for a member
     */
    const loadAdventure = useCallback(async (memberId: string) => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('adventures')
                .select(
                    `
          *,
          adventure_scenes (*)
        `
                )
                .eq('member_id', memberId)
                .eq('is_active', true)
                .order('last_played_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned - this is okay, user is starting fresh
                    logger.info('No previous adventure found for user');
                    return null;
                }
                logger.error('Failed to load adventure', { error: error.message });
                return null;
            }

            logger.info('Adventure loaded', {
                adventureId: data.id,
                sceneCount: (data as any).adventure_scenes?.length || 0,
            });
            return data as Adventure & { adventure_scenes: AdventureScene[] };
        } catch (err) {
            logger.error('Error loading adventure', { error: err });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Mark an adventure as inactive (end game)
     */
    const endAdventure = useCallback(async (adventureId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('adventures')
                .update({ is_active: false })
                .eq('id', adventureId);

            if (error) {
                logger.error('Failed to end adventure', { error: error.message });
                return false;
            }

            logger.info('Adventure ended', { adventureId });
            return true;
        } catch (err) {
            logger.error('Error ending adventure', { error: err });
            return false;
        }
    }, []);

    return {
        saveAdventure,
        saveScene,
        loadAdventure,
        endAdventure,
        isSaving,
        isLoading,
    };
}
