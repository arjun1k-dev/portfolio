// Builds the billboard: a tall plane mounted at the north edge of the chunk.
// The texture is composed on a 2D canvas (pfp image + Devanagari shloka + name + info),
// then driven through a custom glitch shader material.

import * as THREE from 'three';
import { glitchVertex, glitchFragment } from '../effects/glitch';

const SHLOKA_LINE1 = 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः ।';
const SHLOKA_LINE2 = 'तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम ॥';

export interface BillboardInfo {
  name: string;
  age: number;
  college: string;
  role: string;
  github: string;
}

interface BuildResult {
  group: THREE.Group;
  material: THREE.ShaderMaterial;
  texture: THREE.CanvasTexture;
  /** AABB in world space used for collision. */
  collider: { min: THREE.Vector2; max: THREE.Vector2 };
}

const TEX_W = 1024;
const TEX_H = 1536; // portrait 2:3 — tall enough to hold image + shloka + info

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function buildBillboard(info: BillboardInfo): Promise<BuildResult> {
  // Wait for fonts so Devanagari renders correctly on the canvas.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }

  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;

  // --- Background ---
  const bg = ctx.createLinearGradient(0, 0, 0, TEX_H);
  bg.addColorStop(0, '#0a0218');
  bg.addColorStop(0.5, '#1a0432');
  bg.addColorStop(1, '#0a0218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Subtle grid background
  ctx.strokeStyle = 'rgba(255,43,214,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= TEX_W; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_H); ctx.stroke();
  }
  for (let y = 0; y <= TEX_H; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_W, y); ctx.stroke();
  }

  // Outer neon border
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.strokeRect(12, 12, TEX_W - 24, TEX_H - 24);
  ctx.shadowBlur = 0;

  // Corner accent marks
  ctx.strokeStyle = '#ff2bd6';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 12;
  const cornerLen = 80;
  // top-left
  ctx.beginPath(); ctx.moveTo(30, 30 + cornerLen); ctx.lineTo(30, 30); ctx.lineTo(30 + cornerLen, 30); ctx.stroke();
  // top-right
  ctx.beginPath(); ctx.moveTo(TEX_W - 30 - cornerLen, 30); ctx.lineTo(TEX_W - 30, 30); ctx.lineTo(TEX_W - 30, 30 + cornerLen); ctx.stroke();
  // bottom-left
  ctx.beginPath(); ctx.moveTo(30, TEX_H - 30 - cornerLen); ctx.lineTo(30, TEX_H - 30); ctx.lineTo(30 + cornerLen, TEX_H - 30); ctx.stroke();
  // bottom-right
  ctx.beginPath(); ctx.moveTo(TEX_W - 30 - cornerLen, TEX_H - 30); ctx.lineTo(TEX_W - 30, TEX_H - 30); ctx.lineTo(TEX_W - 30, TEX_H - 30 - cornerLen); ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Profile image (loaded async) ---
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = '/pfp.webp';
  await new Promise<void>((res) => {
    img.onload = () => res();
    img.onerror = () => res();
  });

  const imgSize = 620;
  const imgX = (TEX_W - imgSize) / 2;
  const imgY = 80;

  // Image glow background
  const imgGrad = ctx.createRadialGradient(
      TEX_W / 2, imgY + imgSize / 2, imgSize * 0.3,
      TEX_W / 2, imgY + imgSize / 2, imgSize * 0.75
  );
  imgGrad.addColorStop(0, 'rgba(255,43,214,0.35)');
  imgGrad.addColorStop(1, 'rgba(255,43,214,0)');
  ctx.fillStyle = imgGrad;
  ctx.fillRect(imgX - 80, imgY - 80, imgSize + 160, imgSize + 160);

  // Image frame
  ctx.save();
  drawRoundedRect(ctx, imgX - 8, imgY - 8, imgSize + 16, imgSize + 16, 16);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.clip();

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
  } else {
    // Fallback: placeholder block
    ctx.fillStyle = '#1a0432';
    ctx.fillRect(imgX, imgY, imgSize, imgSize);
    ctx.fillStyle = '#ff2bd6';
    ctx.font = 'bold 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO SIGNAL', TEX_W / 2, imgY + imgSize / 2);
  }
  ctx.restore();

  // Image border
  ctx.strokeStyle = '#ff2bd6';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 18;
  drawRoundedRect(ctx, imgX - 8, imgY - 8, imgSize + 16, imgSize + 16, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Devanagari shloka (below image) ---
  let y = imgY + imgSize + 60;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff4d0';
  ctx.shadowColor = '#ffb84d';
  ctx.shadowBlur = 8;
  ctx.font = '700 42px "Noto Sans Devanagari", serif';
  ctx.fillText(SHLOKA_LINE1, TEX_W / 2, y);
  y += 56;
  ctx.fillText(SHLOKA_LINE2, TEX_W / 2, y);
  ctx.shadowBlur = 0;
  y += 70;

  // Divider
  ctx.strokeStyle = 'rgba(0,240,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TEX_W * 0.2, y); ctx.lineTo(TEX_W * 0.8, y);
  ctx.stroke();
  y += 60;

  // --- Name (huge, neon) ---
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 25;
  ctx.font = '900 110px Orbitron, sans-serif';
  ctx.fillText(info.name, TEX_W / 2, y + 30);
  ctx.shadowBlur = 0;
  // Pink offset shadow for chromatic effect
  ctx.fillStyle = 'rgba(255,43,214,0.6)';
  ctx.fillText(info.name, TEX_W / 2 + 3, y + 30);
  ctx.fillStyle = '#00f0ff';
  ctx.fillText(info.name, TEX_W / 2, y + 30);
  y += 160;

  // --- Info rows (monospace) ---
  const rows: Array<[string, string]> = [
    ['AGE',     String(info.age)],
    ['COLLEGE', info.college],
    ['ROLE',    info.role.toUpperCase()],
    ['GITHUB',  info.github],
  ];

  ctx.font = '34px "Share Tech Mono", monospace';
  const rowH = 56;
  const labelX = TEX_W * 0.18;
  const valX   = TEX_W * 0.40;

  for (const [label, val] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff2bd6';
    ctx.fillText(label, labelX, y);
    ctx.fillStyle = '#9ad7ff';
    // Truncate long values
    const maxValWidth = TEX_W * 0.42;
    let displayVal = val;
    while (ctx.measureText(displayVal).width > maxValWidth && displayVal.length > 1) {
      displayVal = displayVal.slice(0, -1);
    }
    if (displayVal !== val) displayVal = displayVal.slice(0, -1) + '…';
    ctx.fillText(displayVal, valX, y);
    y += rowH;
  }

  // --- Bottom decorative bar ---
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.font = '28px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('// END OF TRANSMISSION //', TEX_W / 2, TEX_H - 50);
  ctx.shadowBlur = 0;

  // --- Top header strip ---
  ctx.fillStyle = 'rgba(255,43,214,0.9)';
  ctx.fillRect(40, 40, 200, 4);
  ctx.fillRect(TEX_W - 240, 40, 200, 4);
  ctx.fillStyle = '#ff2bd6';
  ctx.font = '24px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PROFILE.dat', TEX_W / 2, 50);

  // --- Three.js setup ---
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    vertexShader: glitchVertex,
    fragmentShader: glitchFragment,
    transparent: true,
    uniforms: {
      uTexture:       { value: texture },
      uTime:          { value: 0 },
      uResolution:    { value: new THREE.Vector2(TEX_W, TEX_H) },
      uGlitchStrength:{ value: 0.55 },
    },
  });

  // World dimensions. The billboard sits on the north edge of the chunk.
  // Aspect 2:3, height = 12 units (taller than most buildings, but shorter
  // than the surrounding skyscrapers which average 14-18).
  const height = 12;
  const width  = height * (TEX_W / TEX_H); // ~8 units wide
  const group = new THREE.Group();

  const planeGeo = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(planeGeo, material);
  plane.position.set(0, height / 2 + 0.05, 0); // sit just above the floor
  group.add(plane);

  // Backing panel (so the billboard has a solid frame from behind)
  const backingGeo = new THREE.BoxGeometry(width + 0.4, height + 0.4, 0.2);
  const backingMat = new THREE.MeshBasicMaterial({ color: 0x08010f });
  const backing = new THREE.Mesh(backingGeo, backingMat);
  backing.position.set(0, height / 2 + 0.05, -0.15);
  group.add(backing);

  // Support struts (two thin vertical posts going up from ground)
  const strutMat = new THREE.MeshBasicMaterial({ color: 0x2a1040 });
  const strutGeo = new THREE.BoxGeometry(0.15, height + 0.1, 0.15);
  const strutL = new THREE.Mesh(strutGeo, strutMat);
  strutL.position.set(-width / 2 + 0.3, (height + 0.1) / 2, -0.2);
  group.add(strutL);
  const strutR = new THREE.Mesh(strutGeo, strutMat);
  strutR.position.set(width / 2 - 0.3, (height + 0.1) / 2, -0.2);
  group.add(strutR);

  // The collider is the backing panel footprint (x/z range) so the player
  // can't walk through the billboard.
  const collider = {
    min: new THREE.Vector2(-width / 2 - 0.2, -0.3),
    max: new THREE.Vector2( width / 2 + 0.2,  0.3),
  };

  return { group, material, texture, collider };
}
