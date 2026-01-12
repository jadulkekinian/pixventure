/**
 * Image Panel Component
 * Displays scene image
 */

import { useGameStore } from '@/hooks/use-game-store';
import Image from 'next/image';

export function ImagePanel() {
    const { sceneImage, isGeneratingImage } = useGameStore();

    return (
        <div className="panel image-panel">
            <div className="image-container">
                {isGeneratingImage && (
                    <div className="image-loading">
                        <div className="loading-spinner"></div>
                        <div>Generating image...</div>
                    </div>
                )}

                {!sceneImage && !isGeneratingImage && (
                    <div className="image-placeholder">No image yet</div>
                )}

                {sceneImage && !isGeneratingImage && (
                    <Image
                        src={sceneImage}
                        alt="Scene"
                        fill
                        className="scene-image"
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                )}
            </div>
        </div>
    );
}
