import * as THREE from "three";
import type {RainSystem} from "../types.ts";

export default function createRain(): RainSystem {
    const RAIN_COUNT = 300;
    const AREA = 40;        // covers chunk + a margin
    const HEIGHT = 22;      // spawn height
    const STREAK_LEN = 0.5; // length of each raindrop streak

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(RAIN_COUNT * 6); // 2 verts × 3 coords per drop
    const velocities = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
        const x = (Math.random() - 0.5) * AREA;
        const y = Math.random() * HEIGHT;
        const z = (Math.random() - 0.5) * AREA;
        positions[i * 6 ] = x;
        positions[i * 6 + 1] = y + STREAK_LEN;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z;
        velocities[i] = 18 + Math.random() * 8; // m/s
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
        color: 0x9ad7ff,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const mesh = new THREE.LineSegments(geo, mat);
    mesh.frustumCulled = false; // particles move; don't let frustum cull the whole mesh

    return {
        mesh,
        update(dt: number) {
            const pos = geo.attributes.position.array as Float32Array;
            for (let i = 0; i < RAIN_COUNT; i++) {
                const v = velocities[i];
                pos[i * 6 + 1] -= v * dt;
                pos[i * 6 + 4] -= v * dt;
                if (pos[i * 6 + 4] < 0) {
                    // Wrap to top with new random x/z
                    const newY = HEIGHT;
                    pos[i * 6 + 1] = newY + STREAK_LEN;
                    pos[i * 6 + 4] = newY;
                    const x = (Math.random() - 0.5) * AREA;
                    const z = (Math.random() - 0.5) * AREA;
                    pos[i * 6 ] = x;
                    pos[i * 6 + 2] = z;
                    pos[i * 6 + 3] = x;
                    pos[i * 6 + 5] = z;
                }
            }
            geo.attributes.position.needsUpdate = true;
        },
    };
}
