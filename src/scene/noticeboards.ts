// Notice board system — small neon text boards on building walls.
// Each board holds a 2-line phrase from NOTICE_PHRASES, with auto-fit text.

import * as THREE from 'three';

// 2-line phrases cycled across all buildings.
// Edit freely — keep each line short enough to fit (text auto-shrinks if too wide).
export const NOTICE_PHRASES = [
    'NEON DREAMS\nNEVER SLEEP',
    'WELCOME TO\nSECTOR 7',
    'SYSTEM ONLINE\nALL CLEAR',
    'WATCH YOUR\nSTEP',
    'CYBER HAZARD\nSTAY ALERT',
    'DATA CORRUPTED\nREBOOT PENDING',
    'ACCESS DENIED\nAUTHORIZED ONLY',
    'GHOST PROTOCOL\nACTIVE NOW',
    'EMP ZONE\nDEVICES AT RISK',
    'SIGNAL LOST\nRECONNECTING',
    'AREA 51\nNO TRESPASSING',
    '404 NOT FOUND\nTRY LATER',
    'REBOOT REQUIRED\nSTAND BY',
    'MIND THE GAP\nWATCH STEP',
    'POWER SURGE\nGRID UNSTABLE',
    'WET FLOOR\nPROCEED CAREFULLY',
];

const BOARD_TEX_W = 512;
const BOARD_TEX_H = 256;

function makeNoticeBoardTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = BOARD_TEX_W;
    canvas.height = BOARD_TEX_H;
    const ctx = canvas.getContext('2d')!;

    // Outer dark BG
    ctx.fillStyle = '#08010f';
    ctx.fillRect(0, 0, BOARD_TEX_W, BOARD_TEX_H);

    // Inner panel
    ctx.fillStyle = '#15042a';
    ctx.fillRect(12, 12, BOARD_TEX_W - 24, BOARD_TEX_H - 24);

    // Neon border (cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(12, 12, BOARD_TEX_W - 24, BOARD_TEX_H - 24);
    ctx.shadowBlur = 0;

    // Top accent strip (pink)
    ctx.fillStyle = '#ff2bd6';
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 8;
    ctx.fillRect(12, 12, BOARD_TEX_W - 24, 7);
    ctx.shadowBlur = 0;

    // Side decorative ticks
    ctx.fillStyle = '#ff2bd6';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(22, 40 + i * 36, 10, 3);
        ctx.fillRect(BOARD_TEX_W - 32, 40 + i * 36, 10, 3);
    }

    // Text — auto-fit to width
    const lines = text.split('\n');
    let fontSize = 64;
    ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    while (fontSize > 28) {
        let tooWide = false;
        ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
        for (const line of lines) {
            if (ctx.measureText(line).width > BOARD_TEX_W - 80) {
                tooWide = true;
                break;
            }
        }
        if (!tooWide) break;
        fontSize -= 4;
    }

    const lineHeight = fontSize * 1.05;
    const totalH = lineHeight * lines.length;
    const startY = BOARD_TEX_H / 2 - totalH / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        // Pink offset shadow (chromatic aberration look)
        ctx.fillStyle = 'rgba(255,43,214,0.75)';
        ctx.fillText(line, BOARD_TEX_W / 2 + 3, y + 4);
        // Main cyan text
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillText(line, BOARD_TEX_W / 2, y + 4);
        ctx.shadowBlur = 0;
    });

    // Bottom-right serial number (decorative)
    ctx.fillStyle = 'rgba(0,240,255,0.5)';
    ctx.font = '18px "Share Tech Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('#' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'), BOARD_TEX_W - 22, BOARD_TEX_H - 22);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
}

export interface NoticeBoard {
    mesh: THREE.Mesh;
}

export function makeNoticeBoard(
    text: string,
    boardPos: THREE.Vector3,
    rotY: number
): NoticeBoard {
    const tex = makeNoticeBoardTexture(text);
    const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
    });
    // Bigger plane: 2.6 × 1.3 (was 1.0 × 0.6)
    const geo = new THREE.PlaneGeometry(2.6, 1.3);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(boardPos);
    mesh.rotation.y = rotY;
    return { mesh };
}

export function getNoticePhrase(index: number): string {
    return NOTICE_PHRASES[index % NOTICE_PHRASES.length];
}

/**
 * Determine which side of a building faces the nearest pavement spoke,
 * and return the world position of the board + the Y rotation needed
 * so the plane faces outward (away from the building).
 */
export function getStreetFacingSide(
    px: number, pz: number, bw: number, bd: number
): { boardPos: THREE.Vector3; boardRotY: number } {
    const y = 1.8; // chest-to-head height, easy to read when walking past

    if (Math.abs(px) > Math.abs(pz)) {
        // Closer to east-west spoke (along x-axis at z=0)
        if (pz > 0) {
            return {
                boardPos: new THREE.Vector3(px, y, pz - bd / 2 - 0.06),
                boardRotY: Math.PI,        // plane normal → -z
            };
        } else {
            return {
                boardPos: new THREE.Vector3(px, y, pz + bd / 2 + 0.06),
                boardRotY: 0,              // plane normal → +z
            };
        }
    } else {
        // Closer to north-south spoke (along z-axis at x=0)
        if (px > 0) {
            return {
                boardPos: new THREE.Vector3(px - bw / 2 - 0.06, y, pz),
                boardRotY: -Math.PI / 2,   // plane normal → -x
            };
        } else {
            return {
                boardPos: new THREE.Vector3(px + bw / 2 + 0.06, y, pz),
                boardRotY: Math.PI / 2,    // plane normal → +x
            };
        }
    }
}
