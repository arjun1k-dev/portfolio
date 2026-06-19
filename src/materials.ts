import * as THREE from 'three';

export const matFloor = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 });
export const matPavement = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.8 });
export const matPavementLine = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.8 });
export const matBuilding = new THREE.MeshStandardMaterial({ color: 0x12121e, roughness: 0.7, metalness: 0.3 });
export const matBuildingDark = new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.8, metalness: 0.2 });
export const matNeonCyan = new THREE.MeshBasicMaterial({ color: 0x00ffff });
export const matNeonMagenta = new THREE.MeshBasicMaterial({ color: 0xff00ff });
export const matNeonPink = new THREE.MeshBasicMaterial({ color: 0xff1493 });
export const matNeonBlue = new THREE.MeshBasicMaterial({ color: 0x4466ff });
export const matNeonGreen = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
export const matNeonOrange = new THREE.MeshBasicMaterial({ color: 0xff8800 });
export const matNeonYellow = new THREE.MeshBasicMaterial({ color: 0xffff00 });
export const matWindow = new THREE.MeshStandardMaterial({ color: 0x112244, roughness: 0.3, metalness: 0.5 });
export const matWindowLit = new THREE.MeshStandardMaterial({ color: 0x4488cc, emissive: 0x224466, emissiveIntensity: 0.5 });
export const matWindowWarm = new THREE.MeshStandardMaterial({ color: 0xff8844, emissive: 0xff4422, emissiveIntensity: 0.6 });
export const matWindowCool = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488ff, emissiveIntensity: 0.5 });
export const matWindowPurple = new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: 0x6622cc, emissiveIntensity: 0.5 });
export const matWindowGreen = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22cc44, emissiveIntensity: 0.5 });
export const matBillboardFrame = new THREE.MeshBasicMaterial({ color: 0x222233 });
export const matBillboardBack = new THREE.MeshBasicMaterial({ color: 0x0a0a15 });

export const NEON_MATERIALS = [
    matNeonCyan,
    matNeonMagenta,
    matNeonPink,
    matNeonBlue,
    matNeonGreen,
    matNeonOrange,
] as const;

export const WINDOW_MATERIALS = [
    matWindow,
    matWindowLit,
    matWindowWarm,
    matWindowCool,
    matWindowPurple,
    matWindowGreen,
] as const;