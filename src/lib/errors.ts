/**
 * Custom error classes for better error handling
 */

export class AdventureAPIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = 'AdventureAPIError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ValidationError extends AdventureAPIError {
    constructor(message: string, public details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class RateLimitError extends AdventureAPIError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

export class AIGenerationError extends AdventureAPIError {
    constructor(message: string = 'Failed to generate content') {
        super(message, 500, 'AI_GENERATION_ERROR');
        this.name = 'AIGenerationError';
    }
}
