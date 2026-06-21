import * as THREE from "three";

// =========================================================================
// HOLOGRAPHIC ADS
// 4 small floating planes with neon text, slowly rotating + bobbing.
// Additive blending for a glow effect against the dark scene.
// =========================================================================
export interface HologramAdSystem {
    group: THREE.Group;
    update(t: number): void;
}

function makeHologramTexture(text: string, color: string): THREE.CanvasTexture {
    const w = 256, h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 38px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
}

export default function createHologramAds(): HologramAdSystem {
    const group = new THREE.Group();
    const ads = [
        { text: 'NIGHT CITY', color: '#ff2bd6', pos: [-7, 5.5, 4] },
        { text: 'CYBER 2077', color: '#00f0ff', pos: [6, 6.5, -3] },
        { text: 'NOMAD',      color: '#ffe600', pos: [-5, 4.8, -6] },
        { text: 'NETRUN',     color: '#39ff14', pos: [7, 5.8, 5] },
    ];
    const meshes: Array<{ mesh: THREE.Mesh; bobSeed: number; baseY: number }> = [];

    for (const ad of ads) {
        const tex = makeHologramTexture(ad.text, ad.color);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.85,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), mat);
        mesh.position.set(ad.pos[0], ad.pos[1], ad.pos[2]);
        group.add(mesh);
        meshes.push({ mesh, bobSeed: Math.random() * 10, baseY: ad.pos[1] });
    }

    return {
        group,
        update(t: number) {
            for (const m of meshes) {
                m.mesh.rotation.y = t * 0.5;
                m.mesh.position.y = m.baseY + Math.sin(t * 1.2 + m.bobSeed) * 0.3;
            }
        },
    };
}