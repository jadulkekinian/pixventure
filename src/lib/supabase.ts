/**
 * Supabase client configuration for PixVenture
 * Connects to JDK's Supabase instance
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database types
export interface Adventure {
    id: string;
    member_id: string;
    username: string;
    language: string;
    started_at: string;
    last_played_at: string;
    is_active: boolean;
    hp?: number;
    xp?: number;
    inventory?: string[];
    day?: number;
    time_of_day?: string;
    is_safe_zone?: boolean;
    active_enemy?: any;
}

export interface AdventureScene {
    id: string;
    adventure_id: string;
    scene_number: number;
    story_text: string;
    image_url: string | null;
    command: string | null;
    created_at: string;
}
