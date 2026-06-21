// Entry point. Sets up renderer, scene, controls, animation loop.
// Wires: scene + billboard + notice boards + rain + lamp flicker +
//        holographic ads + distant skyline + skill pillars + contact kiosk +
//        minimap + audio. Zero-alloc in the hot loop.

import './style.css';
import * as THREE from 'three';
import { buildScene } from './scene/buildScene.ts';
import { buildBillboard, type BillboardInfo } from './scene/billboard';
import { FirstPersonControls } from './controls/fpsControls.ts';
import createLampFlicker from "./effects/createLampFlicker.ts" ;
import createRain from './effects/createRain.ts';
import createHologramAds from './effects/createHologramAds.ts';
import { buildPortfolio, createProximityChecker } from './features/portfolio';
import { Minimap } from './features/minimap';
import { AudioEngine } from './effects/audio';
import createDistantSkyline from "./effects/createDistantSkyline.ts";
// All DOM elements are now in index.html, no need to create them programmatically

const PROFILE: BillboardInfo = {
    name: 'ARJUN1K',
    age: 19,
    college: 'COEP Tech',
    role: 'Gamer',
    github: 'arjun1k-dev',
};

interface DOMRefs {
    app: HTMLDivElement;
    intro: HTMLDivElement;
    loader: HTMLDivElement;
    crosshair: HTMLDivElement;
    hud: HTMLDivElement;
    hudPos: HTMLSpanElement;
    hudSpd: HTMLSpanElement;
    hudFps: HTMLSpanElement;
    boundary: HTMLDivElement;
    dismissBoundary: HTMLSpanElement;
    audioBtn: HTMLButtonElement;
}

function getDOMRefs(): DOMRefs {
    const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
    return {
        app: $<HTMLDivElement>('app'),
        intro: $<HTMLDivElement>('intro'),
        loader: $<HTMLDivElement>('loader'),
        crosshair: $<HTMLDivElement>('crosshair'),
        hud: $<HTMLDivElement>('hud'),
        hudPos: $<HTMLSpanElement>('hud-pos'),
        hudSpd: $<HTMLSpanElement>('hud-spd'),
        hudFps: $<HTMLSpanElement>('hud-fps'),
        boundary: $<HTMLDivElement>('boundary'),
        dismissBoundary: $<HTMLSpanElement>('dismiss-boundary'),
        audioBtn: $<HTMLButtonElement>('audio-btn'),
    };
}

async function main() {
    const dom = getDOMRefs();

    // Wait for fonts before any canvas drawing (notice boards, billboard, pillars)
    if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
    }

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'low-power',
        stencil: false,
        depth: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    dom.app.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    // --- Scene ---
    const sceneResult = buildScene();
    const scene = new THREE.Scene();
    scene.add(sceneResult.group);
    scene.fog = sceneResult.fog;
    scene.background = new THREE.Color(0x1a0433);

    // --- Distant skyline (far ring of dark buildings for depth) ---
    scene.add(createDistantSkyline());

    // --- Rain ---
    const rain = createRain();
    scene.add(rain.mesh);

    // --- Holographic ads (floating rotating neon signs) ---
    const holoAds = createHologramAds();
    scene.add(holoAds.group);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
        72,
        window.innerWidth / window.innerHeight,
        0.05,
        200
    );

    // --- Billboard ---
    const billboard = await buildBillboard(PROFILE);
    const billboardZ = -sceneResult.chunkHalf - 0.4;
    billboard.group.position.set(0, 0, billboardZ);
    scene.add(billboard.group);

    // --- Portfolio elements (skill pillars + contact kiosk) ---
    const portfolio = buildPortfolio();
    scene.add(portfolio.group);

    // --- Controls ---
    const controls = new FirstPersonControls({
        domElement: renderer.domElement,
        camera,
        colliders: sceneResult.colliders,
        chunkHalf: sceneResult.chunkHalf,
        floorY: sceneResult.floorY,
        onBoundaryHit: () => {
            dom.boundary.classList.add('visible');
            if (document.pointerLockElement) document.exitPointerLock();
        },
    });

    // Billboard collider (in world space)
    const bCollider = {
        min: new THREE.Vector2(
            billboard.collider.min.x,
            billboard.collider.min.y + billboardZ
        ),
        max: new THREE.Vector2(
            billboard.collider.max.x,
            billboard.collider.max.y + billboardZ
        ),
    };
    controls.addCollider(bCollider);

    // --- Lamp flicker system ---
    const lampFlicker = createLampFlicker(sceneResult.lampHeads);

    // --- Proximity checker (skill pillars + contact kiosk) ---
    const proximity = createProximityChecker(portfolio.points);

    // --- Minimap ---
    const minimapPOIs = [
        ...portfolio.minimapPOIs,
        { x: 0, z: billboardZ, color: '#ff2bd6', label: 'BILLBOARD' },
    ];
    const minimap = new Minimap(sceneResult.chunkHalf, minimapPOIs);

    // --- Audio engine ---
    const audio = new AudioEngine();

    // --- Resize ---
    const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // --- UI wiring ---
    dom.intro.addEventListener('click', () => {
        dom.intro.classList.add('hidden');
        dom.crosshair.classList.add('visible');
        dom.hud.classList.add('visible');
        dom.audioBtn.classList.add('visible');
        minimap.show();
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement) {
            if (!dom.boundary.classList.contains('visible')) {
                dom.intro.classList.remove('hidden');
                dom.crosshair.classList.remove('visible');
                dom.hud.classList.remove('visible');
                dom.audioBtn.classList.remove('visible');
                minimap.hide();
            }
        }
    });

    dom.dismissBoundary.addEventListener('click', () => {
        dom.boundary.classList.remove('visible');
        controls.resetBoundary();
        renderer.domElement.requestPointerLock();
    });

    // Audio toggle
    dom.audioBtn.addEventListener('click', () => {
        const enabled = audio.toggle();
        dom.audioBtn.textContent = enabled ? 'AUDIO: ON' : 'AUDIO: OFF';
        dom.audioBtn.classList.toggle('on', enabled);
    });

    // Hide loader
    dom.loader.classList.add('hidden');

    // --- Animation loop ---
    const clock = new THREE.Clock();
    let last = 0;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let fpsLast = 0;

    const tick = () => {
        const t = clock.getElapsedTime();
        const dt = Math.min(0.05, t - last);
        last = t;

        // Controls (movement + look)
        const state = controls.update(dt);

        // Effects
        rain.update(dt);
        lampFlicker.update(t);
        holoAds.update(t);

        // Proximity triggers (skill pillars + contact kiosk)
        proximity.update(state.pos);

        // Minimap
        minimap.update(state.pos, controls.yaw);

        // Billboard glitch shader
        billboard.material.uniforms.uTime.value = t;
        const glitchBase = 0.45;
        const glitchPulse = 0.2 * (0.5 + 0.5 * Math.sin(t * 0.7));
        billboard.material.uniforms.uGlitchStrength.value = glitchBase + glitchPulse;

        // HUD (every ~100ms)
        fpsAccum += dt;
        fpsFrames++;
        if (t - fpsLast > 0.1) {
            const fps = fpsFrames / fpsAccum;
            dom.hudFps.textContent = fps.toFixed(0);
            dom.hudPos.textContent = `${state.pos.x.toFixed(1)},${state.pos.z.toFixed(1)}`;
            dom.hudSpd.textContent = state.speed;
            fpsAccum = 0;
            fpsFrames = 0;
            fpsLast = t;
        }

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

main().catch((err) => {
    console.error('Failed to initialize:', err);
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `<div style="color:#ff2bd6;font-family:monospace;padding:2rem;">FATAL: ${String(err)}</div>`;
    }
});
