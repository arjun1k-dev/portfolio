// 2D canvas minimap in the top-right corner.
// Shows player position + direction + POIs (skill pillars, kiosk, billboard).
// Zero allocations per frame.

import * as THREE from 'three';

export interface MinimapPOI {
    x: number;
    z: number;
    color: string;
    label?: string;
}

export class Minimap {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pois: MinimapPOI[];
    private chunkHalf: number;
    private size = 180;

    constructor(chunkHalf: number, pois: MinimapPOI[]) {
        this.chunkHalf = chunkHalf;
        this.pois = pois;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = this.size;
        this.canvas.id = 'minimap';
        this.canvas.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      width: 180px;
      height: 180px;
      border: 2px solid #00f0ff;
      box-shadow: 0 0 15px rgba(0,240,255,0.5), inset 0 0 8px rgba(0,240,255,0.1);
      background: rgba(10,0,20,0.85);
      z-index: 60;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      border-radius: 4px;
    `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d')!;
    }

    show() { this.canvas.style.opacity = '0.95'; }
    hide() { this.canvas.style.opacity = '0'; }

    update(playerPos: THREE.Vector3, playerYaw: number) {
        const ctx = this.ctx;
        const size = this.size;
        const half = size / 2;
        const scale = half / (this.chunkHalf + 2); // small margin

        // Clear with bg
        ctx.fillStyle = 'rgba(10,0,20,0.95)';
        ctx.fillRect(0, 0, size, size);

        // Grid
        ctx.strokeStyle = 'rgba(0,240,255,0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const p = (i / 4) * size;
            ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
        }

        // "+" pavement shape
        ctx.strokeStyle = 'rgba(255,43,214,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(half, 0); ctx.lineTo(half, size);
        ctx.moveTo(0, half); ctx.lineTo(size, half);
        ctx.stroke();

        // Central plaza circle
        ctx.strokeStyle = 'rgba(255,43,214,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(half, half, 3 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // POIs
        for (const poi of this.pois) {
            const x = half + poi.x * scale;
            const z = half + poi.z * scale;
            ctx.fillStyle = poi.color;
            ctx.shadowColor = poi.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(x - 4, z - 4, 8, 8);
            ctx.shadowBlur = 0;
        }

        // Player (triangle pointing in look direction)
        const px = half + playerPos.x * scale;
        const pz = half + playerPos.z * scale;
        const dx = -Math.sin(playerYaw);
        const dz = -Math.cos(playerYaw);

        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(px + dx * 9, pz + dz * 9);
        ctx.lineTo(px - dx * 4 - dz * 5, pz - dz * 4 + dx * 5);
        ctx.lineTo(px - dx * 4 + dz * 5, pz - dz * 4 - dx * 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer border
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);

        // Label
        ctx.fillStyle = '#9ad7ff';
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SECTOR 7', 8, 14);
        ctx.textAlign = 'right';
        ctx.fillText(`${playerPos.x.toFixed(1)}, ${playerPos.z.toFixed(1)}`, size - 8, size - 8);
    }

    dispose() {
        this.canvas.remove();
    }
}
