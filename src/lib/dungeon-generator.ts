/**
 * Dungeon Map Generator with Procedural Generation
 * Uses Binary Space Partitioning (BSP) algorithm
 */

export interface Room {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'entrance' | 'corridor' | 'treasure' | 'boss' | 'rest' | 'event' | 'shop';
    connections: string[];
    visited: boolean;
    description?: string;
}

export interface DungeonMap {
    width: number;
    height: number;
    rooms: Room[];
    currentRoomId: string;
    seed: number;
}

interface Partition {
    x: number;
    y: number;
    width: number;
    height: number;
    leftChild?: Partition;
    rightChild?: Partition;
    room?: Room;
}

const ROOM_TYPES: Room['type'][] = ['entrance', 'corridor', 'treasure', 'boss', 'rest', 'event', 'shop'];

/**
 * Generate a procedural dungeon map
 */
export function generateDungeon(seed: number = Date.now(), mapSize: number = 10): DungeonMap {
    const random = seededRandom(seed);
    const gridSize = mapSize;

    // Create root partition
    const root: Partition = {
        x: 0,
        y: 0,
        width: gridSize,
        height: gridSize,
    };

    // Split recursively to create rooms
    splitPartition(root, 0, 4, random);

    // Create rooms from partitions
    const rooms: Room[] = [];
    let roomIdCounter = 0;

    function createRoomsFromPartition(partition: Partition) {
        if (partition.leftChild && partition.rightChild) {
            createRoomsFromPartition(partition.leftChild);
            createRoomsFromPartition(partition.rightChild);
        } else {
            // Leaf node - create a room
            const padding = 1;
            const roomWidth = Math.max(2, partition.width - padding * 2);
            const roomHeight = Math.max(2, partition.height - padding * 2);

            const room: Room = {
                id: `room_${roomIdCounter++}`,
                x: partition.x + padding,
                y: partition.y + padding,
                width: roomWidth,
                height: roomHeight,
                type: 'corridor',
                connections: [],
                visited: false,
            };

            partition.room = room;
            rooms.push(room);
        }
    }

    createRoomsFromPartition(root);

    // Connect neighboring rooms
    connectRooms(rooms, gridSize);

    // Assign room types
    assignRoomTypes(rooms, random);

    // Set entrance as visited
    if (rooms.length > 0) {
        rooms[0].visited = true;
    }

    return {
        width: gridSize,
        height: gridSize,
        rooms,
        currentRoomId: rooms[0]?.id || '',
        seed,
    };
}

/**
 * Recursively split partition using BSP
 */
function splitPartition(partition: Partition, depth: number, maxDepth: number, random: () => number): void {
    if (depth >= maxDepth || partition.width < 4 || partition.height < 4) {
        return;
    }

    // Decide split direction
    const splitHorizontally = random() > 0.5;

    if (splitHorizontally && partition.height >= 4) {
        // Horizontal split
        const splitY = Math.floor(partition.height / 2) + Math.floor((random() - 0.5) * 2);

        partition.leftChild = {
            x: partition.x,
            y: partition.y,
            width: partition.width,
            height: splitY,
        };

        partition.rightChild = {
            x: partition.x,
            y: partition.y + splitY,
            width: partition.width,
            height: partition.height - splitY,
        };
    } else if (!splitHorizontally && partition.width >= 4) {
        // Vertical split
        const splitX = Math.floor(partition.width / 2) + Math.floor((random() - 0.5) * 2);

        partition.leftChild = {
            x: partition.x,
            y: partition.y,
            width: splitX,
            height: partition.height,
        };

        partition.rightChild = {
            x: partition.x + splitX,
            y: partition.y,
            width: partition.width - splitX,
            height: partition.height,
        };
    }

    if (partition.leftChild && partition.rightChild) {
        splitPartition(partition.leftChild, depth + 1, maxDepth, random);
        splitPartition(partition.rightChild, depth + 1, maxDepth, random);
    }
}

/**
 * Connect neighboring rooms
 */
function connectRooms(rooms: Room[], gridSize: number): void {
    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];

        // Find adjacent rooms
        for (let j = 0; j < rooms.length; j++) {
            if (i === j) continue;

            const other = rooms[j];

            // Check if rooms are adjacent
            const isAdjacent =
                (Math.abs(room.x - (other.x + other.width)) <= 1 && overlapsY(room, other)) ||
                (Math.abs((room.x + room.width) - other.x) <= 1 && overlapsY(room, other)) ||
                (Math.abs(room.y - (other.y + other.height)) <= 1 && overlapsX(room, other)) ||
                (Math.abs((room.y + room.height) - other.y) <= 1 && overlapsX(room, other));

            if (isAdjacent && !room.connections.includes(other.id)) {
                room.connections.push(other.id);
            }
        }
    }
}

function overlapsX(a: Room, b: Room): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x;
}

function overlapsY(a: Room, b: Room): boolean {
    return a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Assign special room types
 */
function assignRoomTypes(rooms: Room[], random: () => number): void {
    if (rooms.length === 0) return;

    // First room is always entrance
    rooms[0].type = 'entrance';

    // Last room is boss
    if (rooms.length > 1) {
        rooms[rooms.length - 1].type = 'boss';
    }

    // Assign other special rooms
    const specialRoomCount = Math.min(Math.floor(rooms.length * 0.3), 5);
    const availableRooms = rooms.slice(1, -1); // Exclude entrance and boss

    for (let i = 0; i < specialRoomCount && i < availableRooms.length; i++) {
        const roomIndex = Math.floor(random() * availableRooms.length);
        const roomTypes: Room['type'][] = ['treasure', 'rest', 'shop', 'event'];
        availableRooms[roomIndex].type = roomTypes[Math.floor(random() * roomTypes.length)];
    }
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
    let x = Math.sin(seed++) * 10000;
    return () => {
        x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

/**
 * Get room by ID
 */
export function getRoomById(map: DungeonMap, roomId: string): Room | undefined {
    return map.rooms.find(r => r.id === roomId);
}

/**
 * Get neighboring rooms
 */
export function getConnectedRooms(map: DungeonMap, roomId: string): Room[] {
    const room = getRoomById(map, roomId);
    if (!room) return [];

    return room.connections
        .map(id => getRoomById(map, id))
        .filter((r): r is Room => r !== undefined);
}
