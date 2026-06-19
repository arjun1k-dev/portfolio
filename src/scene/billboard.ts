import * as THREE from 'three';
import { matBuilding, matBillboardFrame, matBillboardBack } from '../materials';
import { CITY_SIZE } from '../config';

const BILLBOARD_WIDTH = 10;
const BILLBOARD_HEIGHT = 18;
const PFP_SECTION_HEIGHT = 9.5;
const INFO_SECTION_HEIGHT = 7.5;

// ─── Shared glitch shader ───

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uGlitchIntensity;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    // Random glitch trigger
    float glitchTrigger = step(0.95, random(vec2(uTime * 2.0, floor(uTime * 15.0))));
    float glitchStrength = glitchTrigger * uGlitchIntensity;

    // RGB split
    float split = 0.005 + glitchStrength * 0.03;
    float r = texture2D(uTexture, uv + vec2(split, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(split, 0.0)).b;

    // Scanline effect
    float scanline = sin(uv.y * 400.0 + uTime * 3.0) * 0.08;

    // Horizontal glitch bands
    float band = step(0.99, random(vec2(floor(uv.y * 60.0), uTime * 2.0)));
    uv.x += band * glitchStrength * (random(vec2(uTime, uv.y)) - 0.5) * 0.15;

    // Noise
    float noise = step(0.998, random(vec2(uTime * 5.0, uv.x + uv.y)));

    // Color shift on glitch
    vec3 color = vec3(r, g, b);
    if (glitchTrigger > 0.5) {
      color.g += 0.1;
      color.b += 0.2;
    }

    color += scanline;
    color += noise * 0.5;

    // Vignette
    float dist = distance(uv, vec2(0.5));
    color *= 1.0 - dist * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface BillboardRefs {
  pfpMaterial: THREE.ShaderMaterial;
  infoMaterial: THREE.ShaderMaterial;
}

export function createBillboard(scene: THREE.Scene): BillboardRefs {
  const billX = 0;
  const billZ = -CITY_SIZE / 2 + 4;

  // ─── Support structure ───

  const poleGeo = new THREE.BoxGeometry(0.4, BILLBOARD_HEIGHT + 2, 0.4);
  const poleL = new THREE.Mesh(poleGeo, matBuilding);
  poleL.position.set(billX - BILLBOARD_WIDTH / 2 + 0.4, (BILLBOARD_HEIGHT + 2) / 2, billZ);
  scene.add(poleL);

  const poleR = poleL.clone();
  poleR.position.x = billX + BILLBOARD_WIDTH / 2 - 0.4;
  scene.add(poleR);

  // Main frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(BILLBOARD_WIDTH + 0.5, BILLBOARD_HEIGHT + 0.5, 0.2),
    matBillboardFrame
  );
  frame.position.set(billX, BILLBOARD_HEIGHT / 2 + 0.8, billZ);
  scene.add(frame);

  // Back panel
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(BILLBOARD_WIDTH, BILLBOARD_HEIGHT),
    matBillboardBack
  );
  back.position.set(billX, BILLBOARD_HEIGHT / 2 + 0.8, billZ - 0.1);
  scene.add(back);

  // ─── PFP Section (top) ───

  const textureLoader = new THREE.TextureLoader();
  const pfpTexture = textureLoader.load('/pfp.webp', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  const pfpShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: pfpTexture },
      uTime: { value: 0 },
      uGlitchIntensity: { value: 0.6 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  // PFP is square (1024x1024), so fit it within the section
  const pfpSize = PFP_SECTION_HEIGHT - 0.1;
  const pfpSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(pfpSize, pfpSize),
    pfpShaderMat
  );
  pfpSurface.position.set(billX, BILLBOARD_HEIGHT - PFP_SECTION_HEIGHT / 2 + 0.65, billZ + 0.1);
  scene.add(pfpSurface);

  // ─── Info Section (bottom) ───

  const infoCanvas = createInfoCanvas();
  const infoTexture = new THREE.CanvasTexture(infoCanvas);
  infoTexture.minFilter = THREE.LinearFilter;
  infoTexture.magFilter = THREE.LinearFilter;

  const infoShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: infoTexture },
      uTime: { value: 0 },
      uGlitchIntensity: { value: 0.4 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  const infoSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(BILLBOARD_WIDTH - 0.5, INFO_SECTION_HEIGHT),
    infoShaderMat
  );
  infoSurface.position.set(billX, INFO_SECTION_HEIGHT / 2, billZ + 0.1);
  scene.add(infoSurface);

  // ─── Neon border (entire billboard) ───

  const borderPts = [
    new THREE.Vector3(-BILLBOARD_WIDTH / 2, -BILLBOARD_HEIGHT / 2, 0),
    new THREE.Vector3(BILLBOARD_WIDTH / 2, -BILLBOARD_HEIGHT / 2, 0),
    new THREE.Vector3(BILLBOARD_WIDTH / 2, BILLBOARD_HEIGHT / 2, 0),
    new THREE.Vector3(-BILLBOARD_WIDTH / 2, BILLBOARD_HEIGHT / 2, 0),
    new THREE.Vector3(-BILLBOARD_WIDTH / 2, -BILLBOARD_HEIGHT / 2, 0),
  ];
  const border = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(borderPts),
    new THREE.LineBasicMaterial({ color: 0x00ffff })
  );
  border.position.set(billX, BILLBOARD_HEIGHT / 2 + 0.8, billZ + 0.12);
  scene.add(border);

  // Section divider line
  const dividerPts = [
    new THREE.Vector3(-BILLBOARD_WIDTH / 2 + 0.25, 0, 0),
    new THREE.Vector3(BILLBOARD_WIDTH / 2 - 0.25, 0, 0),
  ];
  const divider = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(dividerPts),
    new THREE.LineBasicMaterial({ color: 0xff00ff })
  );
  divider.position.set(billX, BILLBOARD_HEIGHT - PFP_SECTION_HEIGHT + 0.4, billZ + 0.13);
  scene.add(divider);

  return { pfpMaterial: pfpShaderMat, infoMaterial: infoShaderMat };
}

// ─── Info Canvas Creation ───

function createInfoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 1024 * dpr;
  canvas.height = 750 * dpr;
  const ctx = canvas.getContext('2d')!;

  // Scale context for retina displays
  ctx.scale(dpr, dpr);

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, 750);
  gradient.addColorStop(0, '#0a0a15');
  gradient.addColorStop(1, '#151025');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 750);

  // Grid pattern overlay
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1024; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 750);
    ctx.stroke();
  }
  for (let i = 0; i < 750; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Name - ARJUN1K (much larger)
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 120px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow effect for name
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.fillText('ARJUN1K', 512, 190);
  ctx.shadowBlur = 0;

  // Decorative lines
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(240, 240);
  ctx.lineTo(410, 240);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(614, 240);
  ctx.lineTo(784, 240);
  ctx.stroke();

  // Age (much larger)
  ctx.fillStyle = '#ff00ff';
  ctx.font = 'bold 62px "Courier New", monospace';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 15;
  ctx.fillText('AGE: 19', 512, 310);
  ctx.shadowBlur = 0;

  // College (much larger)
  ctx.fillStyle = '#00ff88';
  ctx.font = '48px "Courier New", monospace';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 12;

  const collegeText = 'COEP Technological University';
  ctx.fillText(collegeText, 512, 390);
  ctx.shadowBlur = 0;

  // Sanskrit Shloka (MUCH LARGER for readability)
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 40px "Courier New", monospace';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 10;
  
  const shloka = 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः।';
  const shloka2 = 'तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम॥';
  
  ctx.fillText(shloka, 512, 470);
  ctx.fillText(shloka2, 512, 530);
  ctx.shadowBlur = 0;

  // Decorative corner brackets
  ctx.strokeStyle = '#4466ff';
  ctx.lineWidth = 3;
  const cornerSize = 20;
  const margin = 30;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(1024 - margin - cornerSize, margin);
  ctx.lineTo(1024 - margin, margin);
  ctx.lineTo(1024 - margin, margin + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(margin, 750 - margin - cornerSize);
  ctx.lineTo(margin, 750 - margin);
  ctx.lineTo(margin + cornerSize, 750 - margin);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(1024 - margin - cornerSize, 750 - margin);
  ctx.lineTo(1024 - margin, 750 - margin);
  ctx.lineTo(1024 - margin, 750 - margin - cornerSize);
  ctx.stroke();

  return canvas;
}
