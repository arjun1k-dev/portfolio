// Perimeter wall creation for the cyberpunk city scene.
// Creates surrounding walls with neon strips and a gap for the billboard.

import * as THREE from 'three';

/**
 * Creates the perimeter wall system with neon strips and billboard gap.
 * @param group - The scene group to add walls to
 * @param chunkHalf - Half-extent of the walkable chunk
 */
export function createPerimeterWall(group: THREE.Group, chunkHalf: number): void {
    const wallHeight = 1.2;
    const wallThickness = 0.3;
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x140428 });

    const wallGeoNS = new THREE.BoxGeometry(chunkHalf * 2 + wallThickness, wallHeight, wallThickness);
    const wallGeoEW = new THREE.BoxGeometry(wallThickness, wallHeight, chunkHalf * 2 + wallThickness);

    // South wall (full)
    const southWall = new THREE.Mesh(wallGeoNS, wallMat);
    southWall.position.set(0, wallHeight / 2, -chunkHalf - wallThickness / 2);
    group.add(southWall);

    // East wall (full)
    const eastWall = new THREE.Mesh(wallGeoEW, wallMat);
    eastWall.position.set(chunkHalf + wallThickness / 2, wallHeight / 2, 0);
    group.add(eastWall);

    // West wall (full)
    const westWall = new THREE.Mesh(wallGeoEW, wallMat);
    westWall.position.set(-chunkHalf - wallThickness / 2, wallHeight / 2, 0);
    group.add(westWall);

    // North wall: split with a gap for the billboard (gap = 9, billboard = 8)
    const gapHalf = 4.5;
    const segLen = (chunkHalf * 2 - gapHalf * 2) / 2;
    const segGeo = new THREE.BoxGeometry(segLen, wallHeight, wallThickness);

    const northL = new THREE.Mesh(segGeo, wallMat);
    northL.position.set(-(gapHalf + segLen / 2), wallHeight / 2, -chunkHalf - wallThickness / 2);
    group.add(northL);

    const northR = new THREE.Mesh(segGeo, wallMat);
    northR.position.set( (gapHalf + segLen / 2), wallHeight / 2, -chunkHalf - wallThickness / 2);
    group.add(northR);

    // Neon strip on top of each wall segment
    const neonStripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const makeWallNeon = (w: number, h: number, x: number, z: number) => {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, wallThickness * 1.1),
            neonStripMat
        );
        m.position.set(x, wallHeight + 0.04, z);
        group.add(m);
    };

    makeWallNeon(chunkHalf * 2, 0.08, 0, -chunkHalf - wallThickness / 2); // south
    makeWallNeon(wallThickness * 1.1, 0.08, chunkHalf + wallThickness / 2, 0); // east
    makeWallNeon(wallThickness * 1.1, 0.08, -chunkHalf - wallThickness / 2, 0); // west
    makeWallNeon(segLen, 0.08, -(gapHalf + segLen / 2), -chunkHalf - wallThickness / 2);
    makeWallNeon(segLen, 0.08,  (gapHalf + segLen / 2), -chunkHalf - wallThickness / 2);
}