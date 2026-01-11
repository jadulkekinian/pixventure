/**
 * API validation schemas using Zod
 */

import { z } from 'zod';

// Language validation
export const languageSchema = z.enum(['en', 'id', 'ja']);

// Start adventure request schema
export const startAdventureSchema = z.object({
    language: languageSchema.default('en'),
});

// Action/command request schema
export const actionRequestSchema = z.object({
    command: z.string().min(1, 'Command cannot be empty').max(500, 'Command too long'),
    previousScene: z.string(),
    language: languageSchema.default('en'),
});

// Export types
export type Language = z.infer<typeof languageSchema>;
export type StartAdventureRequest = z.infer<typeof startAdventureSchema>;
export type ActionRequest = z.infer<typeof actionRequestSchema>;
