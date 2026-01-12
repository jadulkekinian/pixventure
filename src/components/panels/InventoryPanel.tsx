/**
 * Inventory Panel Component
 * Displays player's collected items
 */

import { useGameStore } from '@/hooks/use-game-store';

export function InventoryPanel() {
    const { inventory } = useGameStore();

    return (
        <div className="panel inventory-panel">
            <div className="panel-title">INVENTORY</div>

            <div className="inventory-grid">
                {inventory.length === 0 && (
                    <div className="empty-inventory">Empty</div>
                )}

                {inventory.map((item, index) => (
                    <div key={index} className="inventory-item" title={item}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
