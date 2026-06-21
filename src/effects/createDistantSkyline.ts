import * as THREE from 'three';

// =========================================================================
// DISTANT SKYLINE
// 50 dark box meshes arranged in a wide ring far outside the chunk.
// Fog hides their tops, giving the illusion of an endless city beyond.
// =========================================================================
export default function createDistantSkyline(): THREE.Group {
    const group = new THREE.Group();
    const colors = [0x08010f, 0x0a0218, 0x100422, 0x140428];
    const BUILDING_COUNT = 55;
    const neonStripColors = [0xff2bd6, 0x00f0ff, 0xffe600, 0x9d4dff, 0x39ff14];

    for (let i = 0; i < BUILDING_COUNT; i++) {
        const angle = (i / BUILDING_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        const radius = 45 + Math.random() * 25;
        const w = 3 + Math.random() * 5;
        const h = 8 + Math.random() * 28;
        const d = 3 + Math.random() * 5;

        const mat = new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            fog: true,
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(
            Math.cos(angle) * radius,
            h / 2,
            Math.sin(angle) * radius
        );
        group.add(mesh);

        // ~40% get a neon strip
        if (Math.random() < 0.4) {
            const stripMat = new THREE.MeshBasicMaterial({
                color: neonStripColors[Math.floor(Math.random() * neonStripColors.length)],
                fog: true,
            });
            const strip = new THREE.Mesh(
                new THREE.BoxGeometry(w * 1.02, 0.4, d * 1.02),
                stripMat
            );
            strip.position.set(mesh.position.x, h * (0.55 + Math.random() * 0.3), mesh.position.z);
            group.add(strip);
        }
    }

    return group;
}