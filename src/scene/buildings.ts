// Building generation for the cyberpunk city scene.
// Creates 16 tall buildings with neon windows, rooftop accents, and notice boards.

import * as THREE from 'three';
import { makeFacadeTexture } from './textures';
import { makeNoticeBoard, getStreetFacingSide, getNoticePhrase } from './noticeboards';

const NEON_COLORS = [
    '#ff2bd6', // pink
    '#00f0ff', // cyan
    '#ffe600', // yellow
    '#9d4dff', // purple
    '#ff6a00', // orange
    '#39ff14', // green
];

export interface BuildingCollider {
    min: THREE.Vector2;
    max: THREE.Vector2;
}

export interface BuildingGenerationResult {
    colliders: BuildingCollider[];
}

export interface QuadrantConfig {
    sx: number;
    ex: number;
    sz: number;
    ez: number;
}

/**
 * Generates 16 buildings (4 per quadrant) with facades, rooftop accents, and notice boards.
 */
export function generateBuildings(
    group: THREE.Group,
    chunkHalf: number,
    paveWidth: number
): BuildingGenerationResult {
    const colliders: BuildingCollider[] = [];

    const halfInner = chunkHalf;
    const quadrantInner = halfInner - 1;
    const paveHalf = paveWidth / 2;
    const quadrantStart = paveHalf + 1.0;

    const buildingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const quadrants: QuadrantConfig[] = [
        { sx:  quadrantStart, ex:  quadrantInner, sz:  quadrantStart, ez:  quadrantInner }, // SE (+x,+z)
        { sx: -quadrantInner,  ex: -quadrantStart, sz:  quadrantStart, ez:  quadrantInner }, // SW (-x,+z)
        { sx:  quadrantStart, ex:  quadrantInner, sz: -quadrantInner,  ez: -quadrantStart }, // NE (+x,-z)
        { sx: -quadrantInner,  ex: -quadrantStart, sz: -quadrantInner,  ez: -quadrantStart }, // NW (-x,-z)
    ];

    let buildingSeed = 1;
    let noticeIndex = 0;

    for (const q of quadrants) {
        const qw = q.ex - q.sx;
        const qh = q.ez - q.sz;
        // 2×2 grid of buildings per quadrant
        const cellsAlongX = 2;
        const cellsAlongZ = 2;
        const cellW = qw / cellsAlongX;
        const cellH = qh / cellsAlongZ;

        for (let cx = 0; cx < cellsAlongX; cx++) {
            for (let cz = 0; cz < cellsAlongZ; cz++) {
                const cellSx = q.sx + cx * cellW;
                const cellSz = q.sz + cz * cellH;
                // Building fills 70-85% of cell, capped at 5 units
                const fill = 0.7 + Math.random() * 0.15;
                const bw = Math.max(2.0, Math.min(cellW * fill, 5.0));
                const bd = Math.max(2.0, Math.min(cellH * fill, 5.0));
                const bh = 9 + Math.random() * 9; // 9-18 units tall (taller than billboard's 12)

                const px = cellSx + cellW / 2;
                const pz = cellSz + cellH / 2;

                // Facade
                const tex = makeFacadeTexture(buildingSeed++, bw, bh);
                tex.repeat.set(1, 1);
                const mat = buildingMat.clone();
                mat.map = tex;

                const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
                mesh.position.set(px, bh / 2, pz);
                group.add(mesh);

                // Rooftop accent
                const accentColor = new THREE.Color(
                    NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
                );
                const accent = new THREE.Mesh(
                    new THREE.BoxGeometry(bw * 0.6, 0.2, bd * 0.6),
                    new THREE.MeshBasicMaterial({ color: accentColor })
                );
                accent.position.set(px, bh + 0.15, pz);
                group.add(accent);

                // Notice board on street-facing side
                const side = getStreetFacingSide(px, pz, bw, bd);
                const noticeText = getNoticePhrase(noticeIndex);
                noticeIndex++;
                const board = makeNoticeBoard(noticeText, side.boardPos, side.boardRotY);
                group.add(board.mesh);

                // Collider (building AABB)
                colliders.push({
                    min: new THREE.Vector2(px - bw / 2, pz - bd / 2),
                    max: new THREE.Vector2(px + bw / 2, pz + bd / 2),
                });
            }
        }
    }

    return { colliders };
}