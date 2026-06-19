import * as THREE from 'three';
import {
    CITY_SIZE,
    BOUNDARY_MARGIN,
    PLAYER_RADIUS,
} from './config';
import { createFloor } from './scene/floor';
import { createCity, type CollisionBox } from './scene/city';
import { createBillboard, type BillboardRefs } from './scene/billboard';
import { createParticles } from './scene/particles';
import { FPSControls } from './controls/fpsControls';

// ─── DOM overlays (programmatic, no HTML needed) ───

function injectStyles(): void {
    const s = document.createElement('style');
    s.textContent = `
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    canvas { display: block; }
  `;
    document.head.appendChild(s);
}

function createBlocker(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
    <div style="
      text-align:center; color:#0ff; text-transform:uppercase;
      letter-spacing:4px; font-family:'Courier New',monospace;
    ">
      <h1 style="
        font-size:2rem; margin-bottom:1rem;
        text-shadow:0 0 20px #0ff, 0 0 40px #f0f;
      ">[ SYSTEM ONLINE ]</h1>
      <p style="
        font-size:0.9rem; color:#888;
        animation:flicker 2s infinite;
      ">Click to jack in</p>
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '100', cursor: 'pointer',
    });
    document.body.appendChild(el);
    return el;
}

function createCrosshair(): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '20px', height: '20px',
        zIndex: '50', pointerEvents: 'none', display: 'none',
    });
    const h = document.createElement('div');
    Object.assign(h.style, {
        position: 'absolute', width: '2px', height: '100%',
        left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,255,255,0.5)',
    });
    const v = document.createElement('div');
    Object.assign(v.style, {
        position: 'absolute', height: '2px', width: '100%',
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,255,255,0.5)',
    });
    el.appendChild(h);
    el.appendChild(v);
    document.body.appendChild(el);
    return el;
}

function createBoundaryOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
    <div style="
      border:1px solid #f0f; padding:3rem; text-align:center;
      max-width:500px; background:rgba(20,0,30,0.9);
      font-family:'Courier New',monospace;
    ">
      <h2 style="
        color:#f0f; font-size:1.2rem; margin-bottom:1rem;
        text-shadow:0 0 10px #f0f;
      ">⚠ BOUNDARY REACHED</h2>
      <p style="
        color:#aaa; margin-bottom:1.5rem; line-height:1.6;
        font-size:0.85rem;
      ">To explore the full environment with dynamic lighting and infinite terrain, execute the native client.</p>
      <a href="#" style="
        color:#0ff; text-decoration:none; border:1px solid #0ff;
        padding:0.5rem 1.5rem; display:inline-block; transition:all 0.3s;
      ">Download Native Build →</a>
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,20,0.9)',
        display: 'none', alignItems: 'center', justifyContent: 'center',
        zIndex: '200',
    });
    document.body.appendChild(el);
    return el;
}

// ─── Build DOM ───
injectStyles();
const blocker = createBlocker();
const crosshair = createCrosshair();
const boundaryOverlay = createBoundaryOverlay();

// ─── Renderer ───
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ─── Scene ───
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0012);
scene.fog = new THREE.FogExp2(0x0a0012, 0.02);

// ─── Lighting ───
// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.4);
scene.add(ambientLight);

// Main directional light (moonlight effect)
const moonLight = new THREE.DirectionalLight(0x6688cc, 0.5);
moonLight.position.set(50, 80, 50);
moonLight.castShadow = true;
scene.add(moonLight);

// Point lights for neon glow effect
const cyanLight = new THREE.PointLight(0x00ffff, 2, 30);
cyanLight.position.set(5, 10, -5);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 2, 30);
magentaLight.position.set(-5, 10, 5);
scene.add(magentaLight);

// Subtle orange urban glow
const urbanLight = new THREE.PointLight(0xff8800, 1.5, 40);
urbanLight.position.set(0, 5, 0);
scene.add(urbanLight);

// ─── Camera ───
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    120
);
camera.position.set(0, 1.7, 5);
camera.userData.canvas = renderer.domElement;

// ─── Controls ───
const controls = new FPSControls(camera);

controls.onLock = () => {
    blocker.style.display = 'none';
    crosshair.style.display = 'block';
};
controls.onUnlock = () => {
    blocker.style.display = 'flex';
    crosshair.style.display = 'none';
};

document.addEventListener('click', () => {
    if (!controls.isLocked) controls.requestLock();
});

boundaryOverlay.addEventListener('click', (e) => {
    if (e.target === boundaryOverlay) {
        boundaryOverlay.style.display = 'none';
        boundaryShown = false;
    }
});

// ─── Build world ───
createFloor(scene);
const collisionBoxes: CollisionBox[] = createCity(scene);
const billboard: BillboardRefs = createBillboard(scene);
const particles = createParticles(scene);

// ─── Collision helper ───
function collides(px: number, pz: number): boolean {
    const r = PLAYER_RADIUS;
    for (let i = 0; i < collisionBoxes.length; i++) {
        const b = collisionBoxes[i];
        if (
            px + r > b.minX &&
            px - r < b.maxX &&
            pz + r > b.minZ &&
            pz - r < b.maxZ
        ) {
            return true;
        }
    }
    return false;
}

// ─── Loop ───
const clock = new THREE.Clock();
let boundaryShown = false;

function animate(): void {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    // Billboard glitch time
    billboard.pfpMaterial.uniforms.uTime.value = elapsed;
    billboard.infoMaterial.uniforms.uTime.value = elapsed;

    // Particle drift
    const pArr = particles.geometry.attributes.position
        .array as Float32Array;
    for (let i = 1; i < pArr.length; i += 3) {
        pArr[i] += Math.sin(elapsed + i) * 0.002;
        if (pArr[i] > 15) pArr[i] = 0;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // ─── Movement with collision ───
    const prevX = camera.position.x;
    const prevZ = camera.position.z;

    controls.update(delta);

    // Boundary clamp first
    const half = CITY_SIZE / 2 - BOUNDARY_MARGIN;
    camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -half,
        half
    );
    camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -half,
        half
    );

    // Wall-sliding collision: try full, then X-only, then Z-only
    if (collides(camera.position.x, camera.position.z)) {
        // Try X only
        camera.position.z = prevZ;
        if (collides(camera.position.x, camera.position.z)) {
            // Try Z only
            camera.position.x = prevX;
            if (collides(camera.position.x, camera.position.z)) {
                // Stuck – revert both
                camera.position.x = prevX;
                camera.position.z = prevZ;
            }
        }
    }

    camera.position.y = 1.7;

    // ─── Boundary overlay trigger ───
    const atWall =
        Math.abs(camera.position.x) >= half - 0.1 ||
        Math.abs(camera.position.z) >= half - 0.1;

    if (atWall && !boundaryShown) {
        boundaryShown = true;
        setTimeout(() => {
            if (boundaryShown) {
                boundaryOverlay.style.display = 'flex';
                document.exitPointerLock();
            }
        }, 600);
    }
    if (!atWall && boundaryShown) {
        boundaryShown = false;
        boundaryOverlay.style.display = 'none';
    }

    renderer.render(scene, camera);
}

animate();

// ─── Resize ───
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});