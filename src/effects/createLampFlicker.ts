import * as THREE from 'three';
import type {LampFlickerSystem} from "../types.ts";

export default function createLampFlicker(lampHeads: THREE.Mesh[]): LampFlickerSystem {
    // Pre-bake per-lamp data (one-time alloc, not per frame)
    const lampData = lampHeads.map((mesh, i) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const baseColor = mat.color.clone();
        return {
            mesh,
            baseColor,
            seed: i * 7.31 + 1.0,
            flickerChance: 0.015 + (i % 3) * 0.008,
        };
    });

    return {
        update(t: number) {
            for (const d of lampData) {
                const mat = d.mesh.material as THREE.MeshBasicMaterial;
                // Hash-based flicker trigger
                const hash = Math.sin(t * 19.0 + d.seed) * 43758.5453;
                const flick = hash - Math.floor(hash);
                if (flick < d.flickerChance) {
                    // Brief dim
                    mat.color.copy(d.baseColor).multiplyScalar(0.25);
                } else {
                    // Subtle micro-flicker
                    const micro = 0.88 + 0.12 * Math.sin(t * 33.0 + d.seed * 3.0);
                    mat.color.copy(d.baseColor).multiplyScalar(micro);
                }
            }
        },
    };
}