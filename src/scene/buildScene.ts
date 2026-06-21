// Main scene builder for the cyberpunk city portfolio.
// Orchestrates the creation of all scene elements: floor, pavement, buildings,
// street lamps, perimeter walls, and atmospheric effects.

import * as THREE from 'three';
import {
    makeFloorTexture,
    makeSkyTexture,
} from './textures';
import { placeStreetLamps } from './streetLamps';
import { generateBuildings } from './buildings';
import { createPavementSystem } from './pavement';
import { createPerimeterWall } from './perimeterWall';

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

const CHUNK_HALF = 16;   // walkable area is 32×32 units
const FLOOR_Y = 0;

/**
 * Builds the complete cyberpunk city scene.
 * Returns a group with all elements, collision data, and scene configuration.
 */
export function buildScene(): SceneBuildResult {
    const group = new THREE.Group();
    const colliders: BuildingCollider[] = [];
    const lampHeads: THREE.Mesh[] = [];

    // --- Sky dome ---
    const skyTex = makeSkyTexture();
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(80, 24, 16),
        new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    group.add(sky);

    // --- Fog ---
    const fog = new THREE.FogExp2(new THREE.Color(0x1a0433), 0.022);

    // --- Floor ---
    const floorTex = makeFloorTexture();
    floorTex.repeat.set(CHUNK_HALF, CHUNK_HALF);
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(CHUNK_HALF * 2, CHUNK_HALF * 2),
        new THREE.MeshBasicMaterial({ map: floorTex })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    group.add(floor);

    // --- "+" shaped pavement with central plaza ---
    createPavementSystem(group, CHUNK_HALF);

    // --- Buildings (16 total, 4 per quadrant) ---
    const paveWidth = 3; // Same value used in createPavementSystem
    const buildingResult = generateBuildings(group, CHUNK_HALF, paveWidth);
    colliders.push(...buildingResult.colliders);

    // --- 16 Street lamps along the 4 pavement spokes ---
    const plazaRadius = 3; // Same value used in createPavementSystem
    const lampResult = placeStreetLamps(group, paveWidth, plazaRadius, CHUNK_HALF);
    lampHeads.push(...lampResult.lampHeads);
    colliders.push(...lampResult.colliders);

    // --- Perimeter wall with neon strips and billboard gap ---
    createPerimeterWall(group, CHUNK_HALF);

    // --- Ground haze plane (extends beyond chunk to soften horizon) ---
    const haze = new THREE.Mesh(
        new THREE.PlaneGeometry(180, 180),
        new THREE.MeshBasicMaterial({
            color: 0x0a0118, transparent: true, opacity: 0.6, fog: true,
        })
    );
    haze.rotation.x = -Math.PI / 2;
    haze.position.y = -0.5;
    group.add(haze);

    return {
        group,
        colliders,
        chunkHalf: CHUNK_HALF,
        floorY: FLOOR_Y,
        fog,
        lampHeads,
        billboardPos: { x: 0, z: -CHUNK_HALF - 0.4 },
    };
}