/**
 * Main Dungeon Layout Component
 * Grid-based layout matching the classic dungeon crawler template
 */

'use client';

import { StatsPanel } from './panels/StatsPanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { LogPanel } from './panels/LogPanel';
import { ImagePanel } from './panels/ImagePanel';
import { StoryPanel } from './panels/StoryPanel';
import { DungeonMapPanel } from './panels/DungeonMapPanel';
import './DungeonLayout.css';

export function DungeonLayout() {
    return (
        <div className="dungeon-layout">
            <div className="dungeon-grid">
                {/* Top Row */}
                <div className="grid-area stats">
                    <StatsPanel />
                </div>

                <div className="grid-area inventory">
                    <InventoryPanel />
                </div>

                <div className="grid-area log">
                    <LogPanel />
                </div>

                {/* Middle Row */}
                <div className="grid-area image">
                    <ImagePanel />
                </div>

                <div className="grid-area map">
                    <DungeonMapPanel />
                </div>

                {/* Bottom Row */}
                <div className="grid-area story">
                    <StoryPanel />
                </div>
            </div>
        </div>
    );
}
