/**
 * Environment variable validation using Zod
 * This ensures all required environment variables are present and valid
 */

import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // Add Z.ai API key if it's required
    // Z_AI_API_KEY: z.string().min(1, 'Z_AI_API_KEY is required'),
});

// Validate environment variables
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:');
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            throw new Error('Environment validation failed');
        }
        throw error;
    }
}

export const env = validateEnv();

// Export type for use in the app
export type Env = z.infer<typeof envSchema>;
