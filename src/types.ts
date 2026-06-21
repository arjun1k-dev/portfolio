import * as THREE from 'three';

export interface BuildingCollider {
    min: THREE.Vector2;
    max: THREE.Vector2;
}

export interface SceneBuildResult {
    group: THREE.Group;
    colliders: BuildingCollider[];
    /** Half-extent of the walkable chunk on each axis. */
    chunkHalf: number;
    /** Y coordinate of the floor surface. */
    floorY: number;
    fog: THREE.FogExp2;
    /** Lamp head meshes — passed to the flicker system. */
    lampHeads: THREE.Mesh[];
    /** Billboard world position (for minimap POI). */
    billboardPos: { x: number; z: number };
}

// =========================================================================
// LAMP FLICKER
// Each lamp's head material has its color modulated per-frame to simulate
// flickering neon — random dips plus subtle micro-flicker for liveliness.
// =========================================================================
export interface LampFlickerSystem {
    update(t: number): void;
}

// =========================================================================
// RAIN
// LineSegments of falling streaks. 300 particles, recycled when they hit
// the ground. Reuses the positions array, only mutates in place.
// =========================================================================
export interface RainSystem {
    mesh: THREE.LineSegments;
    update(dt: number): void;
}