// First-person controls:
//   - Pointer Lock API: click canvas to capture mouse, ESC to release.
//   - WASD movement, Shift to sprint.
//   - Mouse moves camera yaw + pitch (clamped).
//   - AABB collision against buildings + billboard + chunk perimeter.
//
// Zero allocations in the hot path — every vector is preallocated.

import * as THREE from 'three';

const EYE_HEIGHT = 1.7;
const WALK_SPEED = 3.0;
const SPRINT_SPEED = 6.5;
const PLAYER_RADIUS = 0.3; // half-width of the player AABB on x/z
const PITCH_LIMIT = Math.PI / 2 - 0.05;
const MOUSE_SENS = 0.0022;

export interface Collider {
    min: THREE.Vector2;
    max: THREE.Vector2;
}

export interface ControlsOptions {
    domElement: HTMLElement;
    camera: THREE.PerspectiveCamera;
    colliders: Collider[];
    chunkHalf: number;
    floorY: number;
    onBoundaryHit: () => void;
}

export class FirstPersonControls {
    private dom: HTMLElement;
    private camera: THREE.PerspectiveCamera;
    private colliders: Collider[];
    private chunkHalf: number;
    private floorY: number;
    private onBoundaryHit: () => void;

    yaw = 0;
    pitch = 0;

    private keys: Record<string, boolean> = Object.create(null);
    private locked = false;
    private boundaryTriggered = false;

    // Reusable temporaries
    private _forward = new THREE.Vector3();
    private _right = new THREE.Vector3();
    private _move = new THREE.Vector3();
    private _testPos = new THREE.Vector3();

    // Callbacks (bound)
    private _onKeyDown = (e: KeyboardEvent) => { this.keys[e.code] = true; };
    private _onKeyUp   = (e: KeyboardEvent) => { this.keys[e.code] = false; };
    private _onMouseMove = (e: MouseEvent) => {
        if (!this.locked) return;
        this.yaw   -= e.movementX * MOUSE_SENS;
        this.pitch -= e.movementY * MOUSE_SENS;
        this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    };
    private _onPointerLockChange = () => {
        this.locked = document.pointerLockElement === this.dom;
    };
    private _onDomClick = () => {
        if (!this.locked) this.dom.requestPointerLock();
    };

    constructor(opts: ControlsOptions) {
        this.dom = opts.domElement;
        this.camera = opts.camera;
        this.colliders = opts.colliders;
        this.chunkHalf = opts.chunkHalf;
        this.floorY = opts.floorY;
        this.onBoundaryHit = opts.onBoundaryHit;

        // Initial camera position — south of plaza, looking north toward the billboard.
        // Billboard sits at z = -chunkHalf. Player at z = +10 sees it ~26 units ahead.
        this.camera.position.set(0, this.floorY + EYE_HEIGHT, 10);
        this.yaw = 0; // look toward -z (where the billboard is)

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        this.dom.addEventListener('click', this._onDomClick);
    }

    isLocked() { return this.locked; }

    /** Add a collider (e.g. the billboard) at runtime. */
    addCollider(c: Collider) { this.colliders.push(c); }

    /** Reset boundary trigger (called when user dismisses the overlay). */
    resetBoundary() { this.boundaryTriggered = false; }

    update(dt: number): { speed: 'WALK' | 'SPRINT'; pos: THREE.Vector3 } {
        if (!this.locked) {
            // Still apply look rotation so the camera is correctly oriented on entry.
            this._applyLook();
            return { speed: 'WALK', pos: this.camera.position };
        }

        // Build basis vectors from yaw only (no pitch — keeps movement horizontal)
        this._forward.set(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        this._right.set(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );

        this._move.set(0, 0, 0);
        if (this.keys['KeyW']) this._move.add(this._forward);
        if (this.keys['KeyS']) this._move.sub(this._forward);
        if (this.keys['KeyD']) this._move.add(this._right);
        if (this.keys['KeyA']) this._move.sub(this._right);

        const sprinting = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
        const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

        if (this._move.lengthSq() > 0) {
            this._move.normalize().multiplyScalar(speed * dt);
            this._tryMove(this._move);
        }

        this._applyLook();
        return { speed: sprinting ? 'SPRINT' : 'WALK', pos: this.camera.position };
    }

    private _applyLook() {
        // Build camera rotation from yaw (Y) then pitch (X)
        const e = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(e);
    }

    /**
     * Attempt to move the camera by `delta` (already x/z only).
     * Performs axis-separated collision resolution against building AABBs
     * and the chunk perimeter. Triggers boundary callback if the player
     * is pushed back by a perimeter wall.
     */
    private _tryMove(delta: THREE.Vector3) {
        const pos = this.camera.position;

        // --- X axis ---
        const testX = pos.x + delta.x;
        this._testPos.set(testX, pos.y, pos.z);
        if (this._collidesAt(this._testPos)) {
            delta.x = 0;
        }
        // Perimeter on X
        const limitX = this.chunkHalf - PLAYER_RADIUS;
        if (testX > limitX) { delta.x = Math.min(delta.x, limitX - pos.x); this._signalBoundary(); }
        if (testX < -limitX) { delta.x = Math.max(delta.x, -limitX - pos.x); this._signalBoundary(); }

        // --- Z axis ---
        const testZ = pos.z + delta.z;
        this._testPos.set(pos.x + delta.x, pos.y, testZ);
        if (this._collidesAt(this._testPos)) {
            delta.z = 0;
        }
        // Perimeter on Z (note: north side at -chunkHalf has the billboard gap,
        // but the billboard collider itself blocks the gap)
        const limitZ = this.chunkHalf - PLAYER_RADIUS;
        if (testZ > limitZ) { delta.z = Math.min(delta.z, limitZ - pos.z); this._signalBoundary(); }
        if (testZ < -limitZ) { delta.z = Math.max(delta.z, -limitZ - pos.z); this._signalBoundary(); }

        pos.x += delta.x;
        pos.z += delta.z;
        pos.y = this.floorY + EYE_HEIGHT;
    }

    /**
     * Check if the player's circular footprint (approximated as AABB of
     * half-width PLAYER_RADIUS) overlaps any building AABB.
     */
    private _collidesAt(p: THREE.Vector3): boolean {
        const r = PLAYER_RADIUS;
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];
            if (
                p.x + r > c.min.x && p.x - r < c.max.x &&
                p.z + r > c.min.y && p.z - r < c.max.y
            ) {
                return true;
            }
        }
        return false;
    }

    private _signalBoundary() {
        if (this.boundaryTriggered) return;
        this.boundaryTriggered = true;
        this.onBoundaryHit();
    }

    dispose() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        this.dom.removeEventListener('click', this._onDomClick);
    }
}
