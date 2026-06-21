// Street lamp creation and placement for the cyberpunk city scene.
// Creates lampposts with glowing heads and ground effects.

import * as THREE from 'three';
import { makeGlowTexture } from './textures';

const LAMP_COLORS = [
    '#39ff14', // green
    '#00f0ff', // cyan
    '#ffe600', // yellow
    '#9d4dff', // purple
];

export interface LampPlacementResult {
    lamps: THREE.Group[];
    lampHeads: THREE.Mesh[];
    colliders: BuildingCollider[];
}

export interface BuildingCollider {
    min: THREE.Vector2;
    max: THREE.Vector2;
}

/**
 * Creates a single street lamp with pole, base, housing, glowing head, and ground glow.
 * @param pos - World position for the lamp
 * @param color - Hex color string for the lamp glow
 */
function makeStreetLamp(pos: THREE.Vector3, color: string): THREE.Group {
    const group = new THREE.Group();

    // Pole (dark)
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x1a0a2a });
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.07, 3, 8),
        poleMat
    );
    pole.position.y = 1.5;
    group.add(pole);

    // Base plate (slightly wider at ground)
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.1, 12),
        poleMat
    );
    base.position.y = 0.05;
    group.add(base);

    // Lamp housing (small dark box at top)
    const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.28),
        new THREE.MeshBasicMaterial({ color: 0x080108 })
    );
    housing.position.y = 3.05;
    group.add(housing);

    // Lamp glow sphere (bright neon)
    const lampColor = new THREE.Color(color);
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 8),
        new THREE.MeshBasicMaterial({ color: lampColor })
    );
    head.position.y = 2.92;
    group.add(head);

    // Ground glow disc (additive-blended radial gradient)
    const glowMat = new THREE.MeshBasicMaterial({
        map: makeGlowTexture(color),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.04;
    group.add(glow);

    group.position.copy(pos);
    return group;
}

/**
 * Places 16 street lamps along the 4 pavement spokes.
 * 4 lamps per spoke (2 on each side), at 25% and 75% of the spoke length.
 */
export function placeStreetLamps(
    group: THREE.Group,
    paveWidth: number,
    plazaRadius: number,
    chunkHalf: number
): LampPlacementResult {
    const lamps: THREE.Group[] = [];
    const lampHeads: THREE.Mesh[] = [];
    const colliders: BuildingCollider[] = [];

    const lampSideOffset = paveWidth / 2 + 0.4; // just outside the pavement
    const lampStartD = plazaRadius + 1.0;        // 1 unit past plaza edge
    const lampEndD = chunkHalf - 1.0;            // 1 unit before perimeter wall
    const lampSpan = lampEndD - lampStartD;
    const d1 = lampStartD + lampSpan * 0.25;
    const d2 = lampStartD + lampSpan * 0.75;
    const lampDistances = [d1, d2];

    let lampIndex = 0;
    const addLamp = (x: number, z: number) => {
        const color = LAMP_COLORS[lampIndex % LAMP_COLORS.length];
        lampIndex++;
        const lamp = makeStreetLamp(new THREE.Vector3(x, 0, z), color);
        group.add(lamp);
        lamps.push(lamp);

        // Collect the head mesh for the flicker system (4th child = head sphere)
        const head = lamp.children[3] as THREE.Mesh;
        if (head) lampHeads.push(head);

        // Collider for the pole (thin AABB)
        colliders.push({
            min: new THREE.Vector2(x - 0.1, z - 0.1),
            max: new THREE.Vector2(x + 0.1, z + 0.1),
        });
    };

    // +x spoke (east) — lamps on +z and -z sides
    for (const d of lampDistances) {
        addLamp(d,  lampSideOffset);
        addLamp(d, -lampSideOffset);
    }
    // -x spoke (west)
    for (const d of lampDistances) {
        addLamp(-d,  lampSideOffset);
        addLamp(-d, -lampSideOffset);
    }
    // +z spoke (south)
    for (const d of lampDistances) {
        addLamp( lampSideOffset, d);
        addLamp(-lampSideOffset, d);
    }
    // -z spoke (north, toward billboard)
    for (const d of lampDistances) {
        addLamp( lampSideOffset, -d);
        addLamp(-lampSideOffset, -d);
    }
    // Total: 4 spokes × 2 distances × 2 sides = 16 lamps ✓

    return { lamps, lampHeads, colliders };
}