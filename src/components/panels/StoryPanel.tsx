/**
 * Story Panel Component
 * Displays current scene story text
 */

import { useGameStore } from '@/hooks/use-game-store';

export function StoryPanel() {
    const { currentScene, isTyping } = useGameStore();

    return (
        <div className="panel story-panel">
            <div className="panel-title">STORY</div>

            <div className="story-content">
                {isTyping && <div className="typing-indicator">...</div>}

                {!currentScene && !isTyping && (
                    <div className="empty-story">Start your adventure...</div>
                )}

                {currentScene && (
                    <div className="story-text">{currentScene}</div>
                )}
            </div>
        </div>
    );
}
