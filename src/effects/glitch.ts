// Glitch shader for the billboard.
// RGB split + scanlines + horizontal jitter + occasional glitch bars.
// All driven by uTime so it animates without re-uploading textures.

export const glitchVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glitchFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform float     uTime;
  uniform vec2      uResolution;   // texture resolution in pixels
  uniform float     uGlitchStrength; // 0.0 = clean, 1.0 = full chaos

  // hash & noise
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 uv = vUv;

    // --- Horizontal jitter (subtle, continuous) ---
    float jitter = (hash21(vec2(floor(uv.y * 220.0), floor(uTime * 30.0))) - 0.5) * 0.0025;
    uv.x += jitter * uGlitchStrength;

    // --- Occasional glitch bars ---
    // A few horizontal slices shift more aggressively at random times.
    float barSeed = floor(uTime * 8.0);
    float barPos  = hash11(barSeed * 1.7);
    float barHeight = 0.04 + 0.06 * hash11(barSeed * 2.3);
    float inBar = step(barPos, uv.y) * step(uv.y, barPos + barHeight);
    float barShift = (hash11(barSeed * 3.1) - 0.5) * 0.15 * uGlitchStrength;
    uv.x += inBar * barShift;

    // --- Second smaller bar ---
    float barPos2  = hash11(barSeed * 4.5 + 1.0);
    float barHeight2 = 0.02 + 0.03 * hash11(barSeed * 5.7 + 1.0);
    float inBar2 = step(barPos2, uv.y) * step(uv.y, barPos2 + barHeight2);
    float barShift2 = (hash11(barSeed * 6.3 + 1.0) - 0.5) * 0.25 * uGlitchStrength;
    uv.x += inBar2 * barShift2;

    // --- RGB channel split ---
    // Amount scales with glitch strength + a slow breathing modulation.
    float breathe = 0.5 + 0.5 * sin(uTime * 1.7);
    float splitAmount = (0.002 + 0.004 * breathe) * (0.4 + 0.6 * uGlitchStrength);
    splitAmount *= uResolution.x > 0.0 ? 1.0 / uResolution.x : 0.0;
    splitAmount *= 1.5; // tune visible separation

    vec2 rUv = uv + vec2(splitAmount, 0.0);
    vec2 bUv = uv - vec2(splitAmount, 0.0);

    // Bars get even more RGB split
    rUv.x += inBar  * barShift  * 0.5;
    bUv.x -= inBar  * barShift  * 0.5;
    rUv.x += inBar2 * barShift2 * 0.5;
    bUv.x -= inBar2 * barShift2 * 0.5;

    float r = texture2D(uTexture, rUv).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, bUv).b;
    float a = texture2D(uTexture, uv).a;

    vec3 col = vec3(r, g, b);

    // --- Scanlines ---
    float scan = sin(uv.y * uResolution.y * 1.2 + uTime * 4.0) * 0.5 + 0.5;
    scan = mix(0.85, 1.0, scan);
    col *= scan;

    // --- Subtle vignette on the billboard itself ---
    vec2 d = uv - 0.5;
    float vig = 1.0 - dot(d, d) * 0.55;
    col *= vig;

    // --- Occasional full-row RGB drop (rare, dramatic) ---
    float dropRow = step(0.985, hash11(barSeed * 7.7));
    float dropMask = dropRow * step(0.3, hash11(floor(uv.y * 60.0)));
    col.r = mix(col.r, 1.0, dropMask * 0.5);
    col.b = mix(col.b, 0.0, dropMask * 0.5);

    // --- Boost neon colors slightly so the billboard glows in the dark scene ---
    col = pow(col, vec3(0.92));

    gl_FragColor = vec4(col, a);
  }
`;
