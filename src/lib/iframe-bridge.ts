/**
 * Iframe bridge for communication between JDK web and PixVenture game
 * Handles postMessage communication and user data synchronization
 */

import { logger } from './logger';

export interface UserData {
    memberId: string;
    username: string;
    session: string;
    email?: string;
}

export interface PostMessageData {
    type: 'USER_DATA' | 'REQUEST_USER_DATA' | 'GAME_READY';
    payload?: UserData;
}

class IframeBridge {
    private static instance: IframeBridge;
    private userData: UserData | null = null;
    private listeners: ((data: UserData) => void)[] = [];
    private parentOrigin: string = process.env.NEXT_PUBLIC_JDK_ORIGIN || '*';
    private isReady = false;

    private constructor() { }

    static getInstance(): IframeBridge {
        if (!IframeBridge.instance) {
            IframeBridge.instance = new IframeBridge();
        }
        return IframeBridge.instance;
    }

    /**
     * Initialize the iframe bridge
     * Sets up message listener and requests user data from parent
     */
    init(): void {
        if (this.isReady) return;

        // Only run in browser
        if (typeof window === 'undefined') return;

        window.addEventListener('message', this.handleMessage.bind(this));
        this.isReady = true;

        logger.info('Iframe bridge initialized');

        // Request user data from parent window
        this.requestUserData();
    }

    /**
     * Handle incoming postMessage events
     */
    private handleMessage(event: MessageEvent<PostMessageData>): void {
        // Validate origin for security
        if (this.parentOrigin !== '*' && event.origin !== this.parentOrigin) {
            logger.warn('Rejected message from unauthorized origin', { origin: event.origin });
            return;
        }

        const { type, payload } = event.data;

        switch (type) {
            case 'USER_DATA':
                if (payload) {
                    this.handleUserData(payload);
                }
                break;

            default:
                logger.debug('Unknown message type received', { type });
        }
    }

    /**
     * Handle received user data
     */
    private handleUserData(data: UserData): void {
        this.userData = data;
        logger.info('User data received from parent', { username: data.username });
        this.notifyListeners(data);
    }

    /**
     * Request user data from parent window
     */
    requestUserData(): void {
        if (typeof window === 'undefined') return;

        // Check if we're in an iframe
        if (window.self === window.top) {
            logger.info('Not running in iframe, skipping user data request');
            return;
        }

        const message: PostMessageData = {
            type: 'REQUEST_USER_DATA',
        };

        window.parent.postMessage(message, this.parentOrigin);
        logger.info('Requested user data from parent');
    }

    /**
     * Notify parent that game is ready
     */
    notifyReady(): void {
        if (typeof window === 'undefined') return;
        if (window.self === window.top) return;

        const message: PostMessageData = {
            type: 'GAME_READY',
        };

        window.parent.postMessage(message, this.parentOrigin);
        logger.info('Notified parent that game is ready');
    }

    /**
     * Subscribe to user data updates
     */
    onUserDataReceived(callback: (data: UserData) => void): () => void {
        this.listeners.push(callback);

        // If we already have user data, call the callback immediately
        if (this.userData) {
            callback(this.userData);
        }

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
        };
    }

    /**
     * Get current user data
     */
    getUserData(): UserData | null {
        return this.userData;
    }

    /**
     * Check if running in iframe
     */
    isInIframe(): boolean {
        if (typeof window === 'undefined') return false;
        return window.self !== window.top;
    }

    /**
     * Notify all listeners of user data update
     */
    private notifyListeners(data: UserData): void {
        this.listeners.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                logger.error('Error in user data listener', { error });
            }
        });
    }

    /**
     * Clear user data (for logout)
     */
    clearUserData(): void {
        this.userData = null;
        logger.info('User data cleared');
    }
}

// Export singleton instance
export const iframeBridge = IframeBridge.getInstance();
