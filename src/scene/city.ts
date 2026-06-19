import * as THREE from 'three';
import { CITY_SIZE, WALL_HEIGHT } from '../config';
import {
    matBuilding,
    matBuildingDark,
    matNeonCyan,
    matNeonMagenta,
    NEON_MATERIALS,
    WINDOW_MATERIALS,
} from '../materials';

export interface CollisionBox {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

interface BuildingDef {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
}

// ─── Rejection-sampled placement ───

function generateBuildings(): {
    buildings: BuildingDef[];
    collisions: CollisionBox[];
} {
    const half = CITY_SIZE / 2;
    const buildings: BuildingDef[] = [];
    const collisions: CollisionBox[] = [];
    const gap = 1.2;

    // Billboard clear zone (north side) - increased for larger billboard
    const clearZone = {
        minX: -8,
        maxX: 8,
        minZ: -half,
        maxZ: -half + 14,
    };

    const roadHalf = 2.8;
    const wallMargin = 1.5;

    function forbidden(x: number, z: number, w: number, d: number): boolean {
        // Roads
        if (x + w / 2 > -roadHalf && x - w / 2 < roadHalf) return true;
        if (z + d / 2 > -roadHalf && z - d / 2 < roadHalf) return true;

        // Billboard clear zone
        if (
            x + w / 2 + gap > clearZone.minX &&
            x - w / 2 - gap < clearZone.maxX &&
            z + d / 2 + gap > clearZone.minZ &&
            z - d / 2 - gap < clearZone.maxZ
        )
            return true;

        // Walls
        if (x - w / 2 < -half + wallMargin || x + w / 2 > half - wallMargin)
            return true;
        if (z - d / 2 < -half + wallMargin || z + d / 2 > half - wallMargin)
            return true;

        return false;
    }

    function overlaps(x: number, z: number, w: number, d: number): boolean {
        for (const b of buildings) {
            if (
                x + w / 2 + gap > b.x - b.width / 2 &&
                x - w / 2 - gap < b.x + b.width / 2 &&
                z + d / 2 + gap > b.z - b.depth / 2 &&
                z - d / 2 - gap < b.z + b.depth / 2
            )
                return true;
        }
        return false;
    }

    const target = 22;
    let attempts = 0;

    while (buildings.length < target && attempts < 800) {
        attempts++;

        // Mix of large and medium
        const isLarge = Math.random() < 0.35;
        const w = isLarge ? 7 + Math.random() * 5 : 3 + Math.random() * 4;
        const d = isLarge ? 7 + Math.random() * 5 : 3 + Math.random() * 4;
        const h = isLarge ? 15 + Math.random() * 15 : 6 + Math.random() * 14;

        // Random position within bounds
        const x =
            (-half + wallMargin + w / 2) +
            Math.random() * (CITY_SIZE - 2 * wallMargin - w);
        const z =
            (-half + wallMargin + d / 2) +
            Math.random() * (CITY_SIZE - 2 * wallMargin - d);

        if (forbidden(x, z, w, d)) continue;
        if (overlaps(x, z, w, d)) continue;

        buildings.push({ x, z, width: w, depth: d, height: h });
        collisions.push({
            minX: x - w / 2,
            maxX: x + w / 2,
            minZ: z - d / 2,
            maxZ: z + d / 2,
        });
    }

    return { buildings, collisions };
}

// ─── Window grid on all 4 faces ───

function addWindows(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number
): void {
    const winGeo = new THREE.PlaneGeometry(0.35, 0.5);
    const spacing = 0.7;

    for (let y = 1.2; y < h - 0.6; y += spacing) {
        for (let x = -w / 2 + 0.5; x < w / 2 - 0.2; x += spacing) {
            const rand = Math.random();
            let mat;
            if (rand < 0.5) {
                mat = WINDOW_MATERIALS[Math.floor(Math.random() * (WINDOW_MATERIALS.length - 1)) + 1];
            } else {
                mat = WINDOW_MATERIALS[0];
            }

            const front = new THREE.Mesh(winGeo, mat);
            front.position.set(x, y - h / 2, d / 2 + 0.01);
            parent.add(front);

            const back = new THREE.Mesh(winGeo, mat);
            back.position.set(x, y - h / 2, -d / 2 - 0.01);
            back.rotation.y = Math.PI;
            parent.add(back);
        }

        for (let z = -d / 2 + 0.5; z < d / 2 - 0.2; z += spacing) {
            const rand = Math.random();
            let mat;
            if (rand < 0.5) {
                mat = WINDOW_MATERIALS[Math.floor(Math.random() * (WINDOW_MATERIALS.length - 1)) + 1];
            } else {
                mat = WINDOW_MATERIALS[0];
            }

            const right = new THREE.Mesh(winGeo, mat);
            right.position.set(w / 2 + 0.01, y - h / 2, z);
            right.rotation.y = Math.PI / 2;
            parent.add(right);

            const left = new THREE.Mesh(winGeo, mat);
            left.position.set(-w / 2 - 0.01, y - h / 2, z);
            left.rotation.y = -Math.PI / 2;
            parent.add(left);
        }
    }
}

// ─── Neon accents ───

function addNeonAccents(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number
): void {
    // Multiple horizontal strips on tall buildings
    const stripCount = h > 15 ? 2 + Math.floor(Math.random() * 2) : 1;

    for (let i = 0; i < stripCount; i++) {
        const mat =
            NEON_MATERIALS[Math.floor(Math.random() * NEON_MATERIALS.length)];
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.06, 0.08, d + 0.06),
            mat
        );
        const yNorm = (i + 1) / (stripCount + 1);
        strip.position.y = yNorm * h - h / 2;
        parent.add(strip);
    }

    // Vertical edge pillars
    if (Math.random() < 0.5) {
        const mat =
            NEON_MATERIALS[Math.floor(Math.random() * NEON_MATERIALS.length)];
        const edgeGeo = new THREE.BoxGeometry(0.08, h, 0.08);
        const corners = [
            [w / 2, d / 2],
            [-w / 2, d / 2],
            [w / 2, -d / 2],
        ];
        for (const [cx, cz] of corners) {
            const edge = new THREE.Mesh(edgeGeo, mat);
            edge.position.set(cx, 0, cz);
            parent.add(edge);
        }
    }
}

// ─── Ground-level neon signs ───

function addGroundSign(
    parent: THREE.Object3D,
    w: number,
    d: number
): void {
    if (Math.random() > 0.45) return;

    const mat = NEON_MATERIALS[Math.floor(Math.random() * NEON_MATERIALS.length)];
    const signW = 1 + Math.random() * Math.min(3, w * 0.6);
    const signH = 0.4 + Math.random() * 0.4;

    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(signW, signH),
        mat
    );

    const side = Math.floor(Math.random() * 4);
    const y = 1.2;

    switch (side) {
        case 0:
            sign.position.set(0, y - parent.position.y, d / 2 + 0.01);
            break;
        case 1:
            sign.position.set(0, y - parent.position.y, -d / 2 - 0.01);
            sign.rotation.y = Math.PI;
            break;
        case 2:
            sign.position.set(w / 2 + 0.01, y - parent.position.y, 0);
            sign.rotation.y = Math.PI / 2;
            break;
        case 3:
            sign.position.set(-w / 2 - 0.01, y - parent.position.y, 0);
            sign.rotation.y = -Math.PI / 2;
            break;
    }

    parent.add(sign);
}

// ─── Perimeter walls ───

function createPerimeterWalls(scene: THREE.Scene): void {
    const half = CITY_SIZE / 2;

    const wallNS = new THREE.Mesh(
        new THREE.BoxGeometry(CITY_SIZE, WALL_HEIGHT, 0.5),
        matBuildingDark
    );
    wallNS.position.set(0, WALL_HEIGHT / 2, -half - 0.25);
    scene.add(wallNS);

    const wallNS2 = wallNS.clone();
    wallNS2.position.z = half + 0.25;
    scene.add(wallNS2);

    const wallEW = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, WALL_HEIGHT, CITY_SIZE),
        matBuildingDark
    );
    wallEW.position.set(half + 0.25, WALL_HEIGHT / 2, 0);
    scene.add(wallEW);

    const wallEW2 = wallEW.clone();
    wallEW2.position.x = -half - 0.25;
    scene.add(wallEW2);

    // Neon trim top
    const trimH = new THREE.Mesh(
        new THREE.BoxGeometry(CITY_SIZE + 0.1, 0.12, 0.12),
        matNeonCyan
    );
    trimH.position.set(0, WALL_HEIGHT, -half);
    scene.add(trimH);
    const trimH2 = trimH.clone();
    trimH2.position.z = half;
    scene.add(trimH2);

    const trimV = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, CITY_SIZE + 0.1),
        matNeonMagenta
    );
    trimV.position.set(half, WALL_HEIGHT, 0);
    scene.add(trimV);
    const trimV2 = trimV.clone();
    trimV2.position.x = -half;
    scene.add(trimV2);
}

// ─── Public entry point ───

export function createCity(scene: THREE.Scene): CollisionBox[] {
    const { buildings, collisions } = generateBuildings();

    for (const b of buildings) {
        const geo = new THREE.BoxGeometry(b.width, b.height, b.depth);
        const mat = Math.random() > 0.5 ? matBuilding : matBuildingDark;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x, b.height / 2, b.z);
        scene.add(mesh);

        addWindows(mesh, b.width, b.height, b.depth);
        addNeonAccents(mesh, b.width, b.height, b.depth);
        addGroundSign(mesh, b.width, b.depth);
    }

    createPerimeterWalls(scene);

    return collisions;
}