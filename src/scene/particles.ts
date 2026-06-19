import * as THREE from 'three';
import { CITY_SIZE } from '../config';

export function createParticles(scene: THREE.Scene): THREE.Points {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * CITY_SIZE;
        positions[i * 3 + 1] = Math.random() * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * CITY_SIZE;

        const c = new THREE.Color().setHSL(0.5 + Math.random() * 0.3, 1, 0.5);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
        })
    );

    scene.add(points);
    return points;
}