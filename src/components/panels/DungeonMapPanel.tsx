/**
 * Dungeon Map Component with Fog of War
 * Displays procedural dungeon with explored/unexplored rooms
 */

import { useGameStore } from '@/hooks/use-game-store';
import { Room } from '@/lib/dungeon-generator';

export function DungeonMapPanel() {
    const { dungeonMap } = useGameStore();

    if (!dungeonMap) {
        return (
            <div className="panel map-panel">
                <div className="panel-title">MAP</div>
                <div className="map-empty">No dungeon generated</div>
            </div>
        );
    }

    const gridSize = dungeonMap.width;
    const cellSize = 30;
    const viewBoxSize = gridSize * cellSize;

    return (
        <div className="panel map-panel">
            <div className="panel-title">MAP</div>

            <div className="map-container">
                <svg
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    className="dungeon-svg"
                >
                    {/* Grid background */}
                    <defs>
                        <pattern
                            id="grid"
                            width={cellSize}
                            height={cellSize}
                            patternUnits="userSpaceOnUse"
                        >
                            <rect
                                width={cellSize}
                                height={cellSize}
                                fill="none"
                                stroke="#222"
                                strokeWidth="0.5"
                            />
                        </pattern>
                    </defs>

                    <rect
                        width={viewBoxSize}
                        height={viewBoxSize}
                        fill="url(#grid)"
                    />

                    {/* Rooms */}
                    {dungeonMap.rooms.map((room) => (
                        <RoomComponent
                            key={room.id}
                            room={room}
                            isCurrent={room.id === dungeonMap.currentRoomId}
                            cellSize={cellSize}
                        />
                    ))}

                    {/* Connections between visited rooms */}
                    {dungeonMap.rooms.map((room) => {
                        if (!room.visited) return null;

                        return room.connections.map((connId) => {
                            const connectedRoom = dungeonMap.rooms.find(
                                (r) => r.id === connId
                            );
                            if (!connectedRoom || !connectedRoom.visited)
                                return null;

                            // Draw line between room centers
                            const x1 =
                                (room.x + room.width / 2) * cellSize;
                            const y1 =
                                (room.y + room.height / 2) * cellSize;
                            const x2 =
                                (connectedRoom.x + connectedRoom.width / 2) *
                                cellSize;
                            const y2 =
                                (connectedRoom.y + connectedRoom.height / 2) *
                                cellSize;

                            return (
                                <line
                                    key={`${room.id}-${connId}`}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="#555"
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                />
                            );
                        });
                    })}
                </svg>

                {/* Legend */}
                <div className="map-legend">
                    <div className="legend-item">
                        <div className="legend-color entrance"></div>
                        <span>Entrance</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color boss"></div>
                        <span>Boss</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color treasure"></div>
                        <span>Treasure</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color unexplored"></div>
                        <span>Unexplored</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface RoomComponentProps {
    room: Room;
    isCurrent: boolean;
    cellSize: number;
}

function RoomComponent({ room, isCurrent, cellSize }: RoomComponentProps) {
    const x = room.x * cellSize;
    const y = room.y * cellSize;
    const width = room.width * cellSize;
    const height = room.height * cellSize;

    // Fog of war - hide unvisited rooms
    if (!room.visited) {
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#000"
                    stroke="#111"
                    strokeWidth="1"
                    className="room-fog"
                />
            </g>
        );
    }

    // Room type colors
    const roomColors: Record<Room['type'], string> = {
        entrance: '#4ade80',
        boss: '#ef4444',
        treasure: '#fbbf24',
        rest: '#60a5fa',
        shop: '#a78bfa',
        event: '#f472b6',
        corridor: '#6b7280',
    };

    const fillColor = roomColors[room.type] || '#6b7280';

    return (
        <g className={`room-group ${isCurrent ? 'current-room' : ''}`}>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fillColor}
                stroke={isCurrent ? '#fff' : '#999'}
                strokeWidth={isCurrent ? '3' : '1.5'}
                className="room-rect"
                opacity={0.8}
            />

            {/* Current room indicator */}
            {isCurrent && (
                <circle
                    cx={x + width / 2}
                    cy={y + height / 2}
                    r={cellSize / 3}
                    fill="#fff"
                    className="current-indicator"
                >
                    <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </circle>
            )}

            {/* Room type icon/text */}
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={cellSize / 3}
                fontWeight="bold"
                className="room-label"
            >
                {getRoomIcon(room.type)}
            </text>
        </g>
    );
}

function getRoomIcon(type: Room['type']): string {
    const icons: Record<Room['type'], string> = {
        entrance: '↓',
        boss: '☠',
        treasure: '💎',
        rest: '⛺',
        shop: '🏪',
        event: '⚡',
        corridor: '·',
    };

    return icons[type] || '?';
}
