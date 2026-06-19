import * as THREE from 'three';
import {PLAYER_HEIGHT, MOUSE_SENSITIVITY, PLAYER_SPEED} from '../config';

interface KeyState {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
}

export class FPSControls {
    private camera: THREE.Camera;
    private keys: KeyState = { w: false, a: false, s: false, d: false };
    private euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private _forward = new THREE.Vector3();
    private _right = new THREE.Vector3();
    private _moveDir = new THREE.Vector3();
    private _up = new THREE.Vector3(0, 1, 0);

    public isLocked = false;

    // Callbacks
    public onLock: (() => void) | null = null;
    public onUnlock: (() => void) | null = null;

    constructor(camera: THREE.Camera) {
        this.camera = camera;

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
    }

    requestLock(): void {
        const canvas = this.camera.userData.canvas as HTMLCanvasElement | undefined;
        const el = canvas ?? document.body;
        el.requestPointerLock();
    }

    update(delta: number): void {
        if (!this.isLocked) return;

        this.camera.getWorldDirection(this._forward);
        this._forward.y = 0;
        this._forward.normalize();

        this._right.crossVectors(this._forward, this._up).normalize();

        this._moveDir.set(0, 0, 0);
        if (this.keys.w) this._moveDir.add(this._forward);
        if (this.keys.s) this._moveDir.sub(this._forward);
        if (this.keys.d) this._moveDir.add(this._right);
        if (this.keys.a) this._moveDir.sub(this._right);

        if (this._moveDir.lengthSq() > 0) {
            this._moveDir.normalize().multiplyScalar(PLAYER_SPEED * delta);
            this.camera.position.add(this._moveDir);
        }

        this.camera.position.y = PLAYER_HEIGHT;
    }

    resetKeys(): void {
        this.keys.w = false;
        this.keys.a = false;
        this.keys.s = false;
        this.keys.d = false;
    }

    dispose(): void {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    }

    private onMouseMove = (e: MouseEvent): void => {
        if (!this.isLocked) return;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= e.movementX * MOUSE_SENSITIVITY;
        this.euler.x -= e.movementY * MOUSE_SENSITIVITY;
        this.euler.x = THREE.MathUtils.clamp(
            this.euler.x,
            -Math.PI / 2 + 0.1,
            Math.PI / 2 - 0.1
        );
        this.camera.quaternion.setFromEuler(this.euler);
    };

    private onKeyDown = (e: KeyboardEvent): void => {
        const key = e.key.toLowerCase();
        if (key in this.keys) this.keys[key as keyof KeyState] = true;
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        const key = e.key.toLowerCase();
        if (key in this.keys) this.keys[key as keyof KeyState] = false;
    };

    private onPointerLockChange = (): void => {
        const el = this.camera.userData.canvas as HTMLCanvasElement | undefined;
        this.isLocked = document.pointerLockElement === (el ?? document.body);

        if (this.isLocked) {
            this.onLock?.();
        } else {
            this.resetKeys();
            this.onUnlock?.();
        }
    };
}