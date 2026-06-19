import * as THREE from 'three';
import { CITY_SIZE } from '../config';
import {
    matFloor,
    matPavement,
    matPavementLine,
    matNeonCyan,
    matNeonMagenta,
    matNeonYellow,
} from '../materials';

export function createFloor(scene: THREE.Scene): void {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE),
        matFloor
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const roadWidth = 4;
    const roadLength = CITY_SIZE / 2;
    const y = 0.005;

    // North road
    const roadN = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength), matPavement);
    roadN.rotation.x = -Math.PI / 2;
    roadN.position.set(0, y, -roadLength / 2);
    scene.add(roadN);

    // South road
    const roadS = roadN.clone();
    roadS.position.set(0, y, roadLength / 2);
    scene.add(roadS);

    // East road
    const roadE = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), matPavement);
    roadE.rotation.x = -Math.PI / 2;
    roadE.position.set(roadLength / 2, y, 0);
    scene.add(roadE);

    // West road
    const roadW = roadE.clone();
    roadW.position.set(-roadLength / 2, y, 0);
    scene.add(roadW);

    // Center intersection
    const intersection = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadWidth), matPavement);
    intersection.rotation.x = -Math.PI / 2;
    intersection.position.y = y;
    scene.add(intersection);

    // ─── Road borders (magenta) ───

    const borderHeight = 0.03;
    const borderWidth = 0.12;

    // North-South borders
    const nsBorderGeo = new THREE.BoxGeometry(borderWidth, borderHeight, roadLength);
    const nsBorderL = new THREE.Mesh(nsBorderGeo, matNeonMagenta);
    nsBorderL.position.set(-roadWidth / 2 - borderWidth / 2, borderHeight / 2, 0);
    scene.add(nsBorderL);

    const nsBorderR = nsBorderL.clone();
    nsBorderR.position.x = roadWidth / 2 + borderWidth / 2;
    scene.add(nsBorderR);

    // East-West borders
    const ewBorderGeo = new THREE.BoxGeometry(roadLength, borderHeight, borderWidth);
    const ewBorderL = new THREE.Mesh(ewBorderGeo, matNeonMagenta);
    ewBorderL.position.set(0, borderHeight / 2, -roadWidth / 2 - borderWidth / 2);
    scene.add(ewBorderL);

    const ewBorderR = ewBorderL.clone();
    ewBorderR.position.z = roadWidth / 2 + borderWidth / 2;
    scene.add(ewBorderR);

    // ─── Zebra crossings (yellow, at intersections) ───

    const zebraStripeWidth = 0.25;
    const zebraStripeGeoNS = new THREE.BoxGeometry(zebraStripeWidth, borderHeight + 0.01, roadWidth);
    const zebraStripeGeoEW = new THREE.BoxGeometry(roadWidth, borderHeight + 0.01, zebraStripeWidth);

    // North zebra crossing
    for (let i = -roadWidth / 2 + 0.3; i < roadWidth / 2 - 0.2; i += 0.6) {
        const stripe = new THREE.Mesh(zebraStripeGeoNS, matNeonYellow);
        stripe.position.set(i, borderHeight / 2 + 0.01, -roadLength / 2 + 1);
        scene.add(stripe);
    }

    // South zebra crossing
    for (let i = -roadWidth / 2 + 0.3; i < roadWidth / 2 - 0.2; i += 0.6) {
        const stripe = new THREE.Mesh(zebraStripeGeoNS, matNeonYellow);
        stripe.position.set(i, borderHeight / 2 + 0.01, roadLength / 2 - 1);
        scene.add(stripe);
    }

    // East zebra crossing
    for (let i = -roadWidth / 2 + 0.3; i < roadWidth / 2 - 0.2; i += 0.6) {
        const stripe = new THREE.Mesh(zebraStripeGeoEW, matNeonYellow);
        stripe.position.set(roadLength / 2 - 1, borderHeight / 2 + 0.01, i);
        scene.add(stripe);
    }

    // West zebra crossing
    for (let i = -roadWidth / 2 + 0.3; i < roadWidth / 2 - 0.2; i += 0.6) {
        const stripe = new THREE.Mesh(zebraStripeGeoEW, matNeonYellow);
        stripe.position.set(-roadLength / 2 + 1, borderHeight / 2 + 0.01, i);
        scene.add(stripe);
    }

    // ─── Highway markings (cyan, periodic white lines) ───

    const markingLength = 2;
    const markingGap = 2.5;
    const markingWidth = 0.12;
    const markingGeoNS = new THREE.BoxGeometry(markingWidth, borderHeight + 0.01, markingLength);
    const markingGeoEW = new THREE.BoxGeometry(markingLength, borderHeight + 0.01, markingWidth);

    // Markings along each road arm (skip zebra crossing areas)
    const startOffset = roadLength / 2 - 2; // Start after zebra crossing

    // North road markings
    for (let z = startOffset; z > -startOffset; z -= (markingLength + markingGap)) {
        // Skip center area
        if (Math.abs(z) < 2) continue;

        const leftMarking = new THREE.Mesh(markingGeoNS, matNeonCyan);
        leftMarking.position.set(-1, borderHeight / 2 + 0.01, -z);
        scene.add(leftMarking);

        const rightMarking = new THREE.Mesh(markingGeoNS, matNeonCyan);
        rightMarking.position.set(1, borderHeight / 2 + 0.01, -z);
        scene.add(rightMarking);
    }

    // South road markings
    for (let z = startOffset; z > -startOffset; z -= (markingLength + markingGap)) {
        if (Math.abs(z) < 2) continue;

        const leftMarking = new THREE.Mesh(markingGeoNS, matNeonCyan);
        leftMarking.position.set(-1, borderHeight / 2 + 0.01, z);
        scene.add(leftMarking);

        const rightMarking = new THREE.Mesh(markingGeoNS, matNeonCyan);
        rightMarking.position.set(1, borderHeight / 2 + 0.01, z);
        scene.add(rightMarking);
    }

    // East road markings
    for (let x = startOffset; x > -startOffset; x -= (markingLength + markingGap)) {
        if (Math.abs(x) < 2) continue;

        const leftMarking = new THREE.Mesh(markingGeoEW, matNeonCyan);
        leftMarking.position.set(x, borderHeight / 2 + 0.01, -1);
        scene.add(leftMarking);

        const rightMarking = new THREE.Mesh(markingGeoEW, matNeonCyan);
        rightMarking.position.set(x, borderHeight / 2 + 0.01, 1);
        scene.add(rightMarking);
    }

    // West road markings
    for (let x = startOffset; x > -startOffset; x -= (markingLength + markingGap)) {
        if (Math.abs(x) < 2) continue;

        const leftMarking = new THREE.Mesh(markingGeoEW, matNeonCyan);
        leftMarking.position.set(-x, borderHeight / 2 + 0.01, -1);
        scene.add(leftMarking);

        const rightMarking = new THREE.Mesh(markingGeoEW, matNeonCyan);
        rightMarking.position.set(-x, borderHeight / 2 + 0.01, 1);
        scene.add(rightMarking);
    }

    // ─── Original dashed center lines (keep these as subtle detail) ───

    const dashGeoNS = new THREE.PlaneGeometry(0.1, 0.8);
    const dashGeoEW = new THREE.PlaneGeometry(0.8, 0.1);

    for (let i = -roadLength / 2 + 1; i < roadLength / 2; i += 2) {
        // North-South lane lines
        for (const xOffset of [-1, 1]) {
            const dash = new THREE.Mesh(dashGeoNS, matPavementLine);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(xOffset, 0.01, i);
            scene.add(dash);
        }

        // East-West lane lines
        for (const zOffset of [-1, 1]) {
            const dash = new THREE.Mesh(dashGeoEW, matPavementLine);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(i, 0.01, zOffset);
            scene.add(dash);
        }
    }
}
