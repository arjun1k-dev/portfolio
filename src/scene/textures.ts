// Texture generation utilities for the cyberpunk city scene.
// Generates procedural textures for buildings, ground, pavement, sky, and lighting effects.

import * as THREE from 'three';

const NEON_COLORS = [
    '#ff2bd6', // pink
    '#00f0ff', // cyan
    '#ffe600', // yellow
    '#9d4dff', // purple
    '#ff6a00', // orange
    '#39ff14', // green
];

// Texture caches to avoid duplicate texture creation
const facadeCache = new Map<string, THREE.CanvasTexture>();
const glowTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a building facade texture with windows and neon accents.
 * @param seed - Random seed for window patterns
 * @param wUnits - Building width in world units
 * @param hUnits - Building height in world units
 */
export function makeFacadeTexture(seed: number, wUnits: number, hUnits: number): THREE.CanvasTexture {
    const key = `${seed}_${wUnits.toFixed(2)}_${hUnits.toFixed(2)}`;
    const cached = facadeCache.get(key);
    if (cached) return cached;

    const texW = 256;
    const texH = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext('2d')!;

    // Building wall base color (dark gradient)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, texH);
    wallGrad.addColorStop(0, '#0d0218');
    wallGrad.addColorStop(1, '#150529');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, texW, texH);

    // Vertical concrete seams
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= texW; x += texW / 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, texH); ctx.stroke();
    }

    // Windows grid with random lighting patterns
    const cols = 4;
    const rows = Math.max(6, Math.floor(hUnits * 2));
    const padX = 16;
    const padY = 12;
    const cellW = (texW - padX * 2) / cols;
    const cellH = (texH - padY * 2) / rows;
    const winW = cellW * 0.6;
    const winH = cellH * 0.55;

    // Deterministic PRNG from seed
    let s = seed * 9301 + 49297;
    const rand = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = padX + c * cellW + (cellW - winW) / 2;
            const y = padY + r * cellH + (cellH - winH) / 2;
            const lit = rand();
            if (lit < 0.45) {
                // Dark window
                ctx.fillStyle = '#020108';
                ctx.fillRect(x, y, winW, winH);
            } else if (lit < 0.85) {
                // Dim cyan-ish
                ctx.fillStyle = '#0a1a26';
                ctx.fillRect(x, y, winW, winH);
                ctx.fillStyle = 'rgba(0,240,255,0.15)';
                ctx.fillRect(x, y, winW, winH);
            } else {
                // Neon-lit window (~15%)
                const color = NEON_COLORS[Math.floor(rand() * NEON_COLORS.length)];
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fillRect(x, y, winW, winH);
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(x + 2, y + 2, winW - 4, 2);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, winW, winH);
        }
    }

    // Top neon strip (signage)
    if (rand() < 0.7) {
        const stripColor = NEON_COLORS[Math.floor(rand() * NEON_COLORS.length)];
        ctx.fillStyle = stripColor;
        ctx.shadowColor = stripColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(0, 8, texW, 4);
        ctx.shadowBlur = 0;
    }

    // Bottom strip
    ctx.fillStyle = 'rgba(255,43,214,0.6)';
    ctx.fillRect(0, texH - 6, texW, 4);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    facadeCache.set(key, tex);
    return tex;
}

/**
 * Creates a tiled pavement texture with neon cracks.
 */
export function makePavementTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(0, 0, size, size);

    // Tile grid
    const tile = 32;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += tile) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Subtle neon cracks
    const colors = ['#ff2bd6', '#00f0ff', '#9d4dff'];
    for (let i = 0; i < 12; i++) {
        const c = colors[i % colors.length];
        ctx.strokeStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

/**
 * Creates a dark asphalt floor texture with noise speckle.
 */
export function makeFloorTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#050208';
    ctx.fillRect(0, 0, size, size);

    // Noise speckle
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
        const n = Math.random() * 18;
        img.data[i]     = n;
        img.data[i + 1] = n * 0.3;
        img.data[i + 2] = n * 0.6;
        img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    // Faint grid
    ctx.strokeStyle = 'rgba(60,20,80,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

/**
 * Creates a sky gradient texture (dark purple → magenta horizon).
 */
export function makeSkyTexture(): THREE.Texture {
    const w = 16;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0118');
    grad.addColorStop(0.5, '#1a0433');
    grad.addColorStop(0.8, '#3a0a52');
    grad.addColorStop(1, '#5a1066');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
}

/**
 * Creates a radial glow texture for street lamps.
 * @param color - Hex color string for the glow
 */
export function makeGlowTexture(color: string): THREE.CanvasTexture {
    const cached = glowTextureCache.get(color);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0,   `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    glowTextureCache.set(color, tex);
    return tex;
}