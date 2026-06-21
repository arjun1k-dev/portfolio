// Pavement and plaza creation for the cyberpunk city scene.
// Creates "+" shaped pavement strips with central circular plaza and neon accents.

import * as THREE from 'three';
import { makePavementTexture } from './textures';

/**
 * Creates the "+" shaped pavement system with central circular plaza.
 * @param group - The scene group to add pavement to
 * @param chunkHalf - Half-extent of the walkable chunk
 */
export function createPavementSystem(group: THREE.Group, chunkHalf: number): void {
    const paveTex = makePavementTexture();
    const paveWidth = 3;
    const plazaRadius = 3;

    // Plaza (central circle, on top of spokes)
    const plazaTex = paveTex.clone();
    plazaTex.needsUpdate = true;
    plazaTex.repeat.set(2, 2);
    const plaza = new THREE.Mesh(
        new THREE.CircleGeometry(plazaRadius, 32),
        new THREE.MeshBasicMaterial({ map: plazaTex })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    group.add(plaza);

    // Plaza neon ring
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(plazaRadius - 0.15, plazaRadius, 64),
        new THREE.MeshBasicMaterial({
            color: 0xff2bd6, side: THREE.DoubleSide, transparent: true, opacity: 0.9,
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    group.add(ring);

    // 4 spokes extending EDGE TO EDGE (length = CHUNK_HALF * 2)
    const spokeLen = chunkHalf; // half-length; full spoke = spokeLen * 2
    const spokeGeoH = new THREE.PlaneGeometry(paveWidth, spokeLen * 2);
    const spokeGeoV = new THREE.PlaneGeometry(spokeLen * 2, paveWidth);

    const makeSpoke = (geo: THREE.PlaneGeometry) => {
        const t = paveTex.clone();
        t.needsUpdate = true;
        t.repeat.set(geo.parameters.width / 2, geo.parameters.height / 2);
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.015;
        group.add(mesh);
    };

    makeSpoke(spokeGeoV); // E-W spoke
    makeSpoke(spokeGeoH); // N-S spoke

    // Edge neon strips along the pavement spokes
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const stripOffset = paveWidth / 2 - 0.05;
    const stripThickness = 0.08;

    const makeStrip = (w: number, h: number, x: number, z: number) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), stripMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.025, z);
        group.add(m);
    };

    // E-W spoke strips
    makeStrip(spokeLen * 2, stripThickness, 0,  stripOffset);
    makeStrip(spokeLen * 2, stripThickness, 0, -stripOffset);
    // N-S spoke strips
    makeStrip(stripThickness, spokeLen * 2,  stripOffset, 0);
    makeStrip(stripThickness, spokeLen * 2, -stripOffset, 0);
}