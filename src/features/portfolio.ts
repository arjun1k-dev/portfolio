// Portfolio features:
//   - 4 skill pillars around the central plaza (interactive — show overlay when approached)
//   - 1 contact kiosk on the path to the billboard (interactive)
//   - Proximity checker (zero-alloc per-frame)
//
// All overlay text is populated from SKILL_PILLARS and CONTACT_INFO constants
// at the top of this file — edit those to swap in your real data.

import * as THREE from 'three';

// =========================================================================
// DATA — edit these to plug in your real info
// =========================================================================

export interface SkillPillarData {
    title: string;
    color: string;
    skills: string[];
}

export const SKILL_PILLARS: SkillPillarData[] = [
    { title: 'CODE',  color: '#00f0ff', skills: ['C++', 'JavaScript', 'TypeScript', 'Python', 'Java'] },
    { title: 'GAME',  color: '#ff2bd6', skills: ['Minecraft', 'Free Fire', 'Chess', 'Taekwondo', 'exploration'] },
    { title: 'TECH',  color: '#ffe600', skills: ['Git', 'Linux', 'Docker', 'Next.Js', 'Postgres'] },
    { title: 'BUILD', color: '#39ff14', skills: ['Vibe Code', 'Software', 'Tools', 'Demos', 'Portfolios'] },
];

export interface ContactInfo {
    name: string;
    age: number;
    college: string;
    role: string;
    github: string;
    email: string;
    linkedin: string;
}

export const CONTACT_INFO: ContactInfo = {
    name: 'ARJUN1K',
    age: 19,
    college: 'COEP Technological University',
    role: 'Gamer',
    github: 'https://github.com/arjun1k-dev',
    email: 'arjun1k.dev@gmail.com',
    linkedin: 'https://www.linkedin.com/in/arjun142235351',
};

// =========================================================================
// Types
// =========================================================================

export interface InteractivePoint {
    position: THREE.Vector3;
    triggerRadius: number;
    id: string;
    onEnter: () => void;
    onExit: () => void;
}

export interface PortfolioResult {
    group: THREE.Group;
    points: InteractivePoint[];
    /** POIs in minimap format (world x/z + color). */
    minimapPOIs: Array<{ x: number; z: number; color: string; label: string }>;
}

// =========================================================================
// Helpers
// =========================================================================

function makeTextTexture(text: string, color: string, fontSize = 56): THREE.CanvasTexture {
    const w = 256, h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.font = `bold ${fontSize}px "Orbitron", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
}

// =========================================================================
// Skill pillar
// =========================================================================

function makeSkillPillar(data: SkillPillarData, x: number, z: number): {
    mesh: THREE.Group;
    point: InteractivePoint;
} {
    const group = new THREE.Group();
    const colorHex = parseInt(data.color.slice(1), 16);

    // Pillar body (dark)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 4, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x100422 })
    );
    body.position.y = 2;
    group.add(body);

    // Neon strips
    for (let i = 0; i < 4; i++) {
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.64, 0.1, 0.64),
            new THREE.MeshBasicMaterial({ color: colorHex })
        );
        strip.position.y = 0.5 + i * 1.0;
        group.add(strip);
    }

    // Top cap (glowing)
    const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.2, 0.7),
        new THREE.MeshBasicMaterial({ color: colorHex })
    );
    cap.position.y = 4.1;
    group.add(cap);

    // Title text — 4 planes, one per side, so it's readable from any angle
    const titleTex = makeTextTexture(data.title, data.color, 56);
    const sides = [
        { pos: [0, 3, 0.32],  rot: 0 },
        { pos: [0, 3, -0.32], rot: Math.PI },
        { pos: [0.32, 3, 0],  rot: Math.PI / 2 },
        { pos: [-0.32, 3, 0], rot: -Math.PI / 2 },
    ];
    for (const s of sides) {
        const title = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.4),
            new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, side: THREE.DoubleSide })
        );
        title.position.set(s.pos[0], s.pos[1], s.pos[2]);
        title.rotation.y = s.rot;
        group.add(title);
    }

    // Ground glow disc
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d')!;
    const r = parseInt(data.color.slice(1, 3), 16);
    const g = parseInt(data.color.slice(3, 5), 16);
    const b = parseInt(data.color.slice(5, 7), 16);
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0,   `rgba(${r},${g},${b},0.6)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    glowTex.colorSpace = THREE.SRGBColorSpace;
    const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2),
        new THREE.MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.04;
    group.add(glow);

    group.position.set(x, 0, z);

    return {
        mesh: group,
        point: {
            position: new THREE.Vector3(x, 0, z),
            triggerRadius: 2.5,
            id: `skill_${data.title}`,
            onEnter: () => {
                const overlay = document.getElementById('skill-overlay');
                if (!overlay) return;
                const titleEl = overlay.querySelector('.skill-title') as HTMLElement;
                const listEl = overlay.querySelector('.skill-list') as HTMLElement;
                titleEl.textContent = data.title;
                titleEl.style.color = data.color;
                titleEl.style.textShadow = `0 0 14px ${data.color}`;
                listEl.innerHTML = data.skills.map(s => `<li>${s}</li>`).join('');
                overlay.classList.add('visible');
            },
            onExit: () => {
                const overlay = document.getElementById('skill-overlay');
                if (overlay) overlay.classList.remove('visible');
            },
        },
    };
}

// =========================================================================
// Contact kiosk
// =========================================================================

function makeContactKiosk(x: number, z: number): {
    mesh: THREE.Group;
    point: InteractivePoint;
} {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.2, 1.2),
        new THREE.MeshBasicMaterial({ color: 0x100422 })
    );
    base.position.y = 0.1;
    group.add(base);

    // Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 2.0, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x0a0218 })
    );
    body.position.y = 1.2;
    group.add(body);

    // Screen (cyan glowing plane)
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.4),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    screen.position.set(0, 1.3, 0.31);
    group.add(screen);

    // Screen text "CONTACT"
    const screenTex = makeTextTexture('CONTACT', '#00f0ff', 48);
    const screenText = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.35),
        new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, side: THREE.DoubleSide })
    );
    screenText.position.set(0, 2.0, 0.32);
    group.add(screenText);

    // Top accent (pink)
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.1, 0.7),
        new THREE.MeshBasicMaterial({ color: 0xff2bd6 })
    );
    top.position.y = 2.25;
    group.add(top);

    // Ground glow
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d')!;
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0,   'rgba(0,240,255,0.5)');
    grad.addColorStop(0.5, 'rgba(0,240,255,0.15)');
    grad.addColorStop(1,   'rgba(0,240,255,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    glowTex.colorSpace = THREE.SRGBColorSpace;
    const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 2.5),
        new THREE.MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.04;
    group.add(glow);

    group.position.set(x, 0, z);

    return {
        mesh: group,
        point: {
            position: new THREE.Vector3(x, 0, z),
            triggerRadius: 3.0,
            id: 'contact_kiosk',
            onEnter: () => {
                const overlay = document.getElementById('contact-overlay');
                if (!overlay) return;
                (overlay.querySelector('.contact-name') as HTMLElement)!.textContent = CONTACT_INFO.name;
                (overlay.querySelector('.contact-age') as HTMLElement)!.textContent = String(CONTACT_INFO.age);
                (overlay.querySelector('.contact-college') as HTMLElement)!.textContent = CONTACT_INFO.college;
                (overlay.querySelector('.contact-role') as HTMLElement)!.textContent = CONTACT_INFO.role;
                const gh = overlay.querySelector('.contact-github') as HTMLAnchorElement;
                gh.href = CONTACT_INFO.github;
                gh.textContent = CONTACT_INFO.github;
                const em = overlay.querySelector('.contact-email') as HTMLAnchorElement;
                em.href = `mailto:${CONTACT_INFO.email}`;
                em.textContent = CONTACT_INFO.email;
                const li = overlay.querySelector('.contact-linkedin') as HTMLAnchorElement;
                li.href = CONTACT_INFO.linkedin;
                li.textContent = CONTACT_INFO.linkedin;
                overlay.classList.add('visible');
            },
            onExit: () => {
                const overlay = document.getElementById('contact-overlay');
                if (overlay) overlay.classList.remove('visible');
            },
        },
    };
}

// =========================================================================
// Build all portfolio elements + return proximity points + minimap POIs
// =========================================================================

export function buildPortfolio(): PortfolioResult {
    const group = new THREE.Group();
    const points: InteractivePoint[] = [];
    const minimapPOIs: Array<{ x: number; z: number; color: string; label: string }> = [];

    // 4 skill pillars at intercardinal positions around the plaza
    const pillarR = 4.5;
    const positions: Array<[number, number]> = [
        [ pillarR * 0.7,  pillarR * 0.7],   // SE
        [-pillarR * 0.7,  pillarR * 0.7],   // SW
        [ pillarR * 0.7, -pillarR * 0.7],   // NE
        [-pillarR * 0.7, -pillarR * 0.7],   // NW
    ];

    SKILL_PILLARS.forEach((data, i) => {
        const [x, z] = positions[i];
        const pillar = makeSkillPillar(data, x, z);
        group.add(pillar.mesh);
        points.push(pillar.point);
        minimapPOIs.push({ x, z, color: data.color, label: data.title });
    });

    // Contact kiosk on the path from plaza to billboard (north side)
    const kioskX = 0;
    const kioskZ = -6;
    const kiosk = makeContactKiosk(kioskX, kioskZ);
    group.add(kiosk.mesh);
    points.push(kiosk.point);
    minimapPOIs.push({ x: kioskX, z: kioskZ, color: '#00f0ff', label: 'CONTACT' });

    return { group, points, minimapPOIs };
}

// =========================================================================
// Proximity checker — zero allocations per frame
// =========================================================================

export function createProximityChecker(points: InteractivePoint[]) {
    const inside = new Array<boolean>(points.length).fill(false);
    const _tmp = new THREE.Vector3();
    return {
        update(playerPos: THREE.Vector3) {
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                _tmp.copy(playerPos).sub(p.position);
                _tmp.y = 0;
                const isInside = _tmp.length() < p.triggerRadius;
                if (isInside && !inside[i]) p.onEnter();
                else if (!isInside && inside[i]) p.onExit();
                inside[i] = isInside;
            }
        },
    };
}
