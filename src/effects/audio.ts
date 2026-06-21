// WebAudio ambient: low drone + high pad + filtered rain noise.
// No external assets — everything is synthesized. Default off; toggle via UI.

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private nodes: AudioNode[] = [];
    enabled = false;

    private ensureContext() {
        if (this.ctx) return;
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.18;
        this.masterGain.connect(this.ctx.destination);
    }

    toggle(): boolean {
        if (this.enabled) this.stop();
        else this.start();
        return this.enabled;
    }

    start() {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const ctx = this.ctx;

        // --- Low drone (two sine oscillators) ---
        const drone1 = ctx.createOscillator();
        drone1.type = 'sine';
        drone1.frequency.value = 55; // A1
        const drone2 = ctx.createOscillator();
        drone2.type = 'sine';
        drone2.frequency.value = 82.41; // E2
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.35;
        drone1.connect(droneGain);
        drone2.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone1.start();
        drone2.start();
        this.nodes.push(drone1, drone2, droneGain);

        // --- Higher pad (triangle + LFO) ---
        const pad = ctx.createOscillator();
        pad.type = 'triangle';
        pad.frequency.value = 220; // A3
        const padGain = ctx.createGain();
        padGain.gain.value = 0.06;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.18;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.035;
        lfo.connect(lfoGain);
        lfoGain.connect(padGain.gain);
        pad.connect(padGain);
        padGain.connect(this.masterGain);
        pad.start();
        lfo.start();
        this.nodes.push(pad, padGain, lfo, lfoGain);

        // --- Rain noise (filtered white noise, looped) ---
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const out = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1100;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.09;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();
        this.nodes.push(noise, noiseFilter, noiseGain);

        this.enabled = true;
    }

    stop() {
        for (const n of this.nodes) {
            try {
                if ((n as any).stop) (n as any).stop();
                n.disconnect();
            } catch { /* ignore */ }
        }
        this.nodes = [];
        this.enabled = false;
    }
}
