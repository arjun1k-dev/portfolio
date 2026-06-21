// DOM element creation utilities for the portfolio UI.
// Creates all necessary UI elements programmatically.

export function createLoader(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'loader';
    el.innerHTML = `
    <div style="
      text-align:center; color:#0ff; text-transform:uppercase;
      letter-spacing:4px; font-family:'Courier New',monospace;
      animation:flicker 2s infinite;
    ">
      LOADING...
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '200',
    });
    document.body.appendChild(el);
    return el;
}

/**
 * Hides the loading screen by setting display to none.
 */
export function hideLoader(): void {
    const loader = document.getElementById('loader');
    if (loader) {
        (loader as HTMLDivElement).style.display = 'none';
    }
}

export function createIntro(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'intro';
    el.innerHTML = `
    <div style="
      text-align:center; color:#0ff; text-transform:uppercase;
      letter-spacing:4px; font-family:'Courier New',monospace;
    ">
      <h1 style="
        font-size:2rem; margin-bottom:1rem;
        text-shadow:0 0 20px #0ff, 0 0 40px #f0f;
      ">[ SYSTEM ONLINE ]</h1>
      <p style="
        font-size:0.9rem; color:#888;
        animation:flicker 2s infinite;
      ">Click to jack in</p>
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '100', cursor: 'pointer',
    });
    document.body.appendChild(el);
    return el;
}

export function createCrosshair(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'crosshair';
    Object.assign(el.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '20px', height: '20px',
        zIndex: '50', pointerEvents: 'none', display: 'none',
    });
    const h = document.createElement('div');
    Object.assign(h.style, {
        position: 'absolute', width: '2px', height: '100%',
        left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,255,255,0.5)',
    });
    const v = document.createElement('div');
    Object.assign(v.style, {
        position: 'absolute', height: '2px', width: '100%',
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,255,255,0.5)',
    });
    el.appendChild(h);
    el.appendChild(v);
    document.body.appendChild(el);
    return el;
}

export function createHUD(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'hud';
    el.innerHTML = `
    <div style="
      font-family:'Courier New',monospace; font-size:0.75rem;
      color:#0ff; text-shadow:0 0 5px #0ff;
      padding:0.5rem; display:flex; gap:1rem;
    ">
      <span>POS: <span id="hud-pos">0,0</span></span>
      <span>SPD: <span id="hud-spd">0</span></span>
      <span>FPS: <span id="hud-fps">60</span></span>
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', top: '0', left: '0',
        zIndex: '50', pointerEvents: 'none', display: 'none',
    });
    document.body.appendChild(el);
    return el;
}

export function createBoundaryOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'boundary';
    el.className = 'hidden'; // Start hidden
    el.innerHTML = `
    <div style="
      border:1px solid #f0f; padding:3rem; text-align:center;
      max-width:500px; background:rgba(20,0,30,0.9);
      font-family:'Courier New',monospace;
    ">
      <h2 style="
        color:#f0f; font-size:1.2rem; margin-bottom:1rem;
        text-shadow:0 0 10px #f0f;
      ">⚠ BOUNDARY REACHED</h2>
      <p style="
        color:#aaa; margin-bottom:1.5rem; line-height:1.6;
        font-size:0.85rem;
      ">To explore the full environment with dynamic lighting and infinite terrain, execute the native client.</p>
      <span id="dismiss-boundary" style="
        color:#0ff; text-decoration:none; border:1px solid #0ff;
        padding:0.5rem 1.5rem; display:inline-block; transition:all 0.3s;
        cursor:pointer;
      ">Continue →</span>
    </div>
  `;
    Object.assign(el.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '150',
    });
    document.body.appendChild(el);
    return el;
}

export function createAudioButton(): HTMLButtonElement {
    const el = document.createElement('button');
    el.id = 'audio-btn';
    el.textContent = 'AUDIO: OFF';
    Object.assign(el.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        padding: '0.5rem 1rem',
        background: 'rgba(0,0,0,0.8)',
        color: '#0ff',
        border: '1px solid #0ff',
        fontFamily: "'Courier New',monospace",
        fontSize: '0.75rem',
        cursor: 'pointer',
        zIndex: '50',
        display: 'none',
    });
    document.body.appendChild(el);
    return el;
}

export function createSkillOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'skill-overlay';
    el.className = 'hidden';
    el.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 0, 20, 0.95);
      border: 2px solid #0ff;
      padding: 2rem;
      min-width: 300px;
      max-width: 500px;
      z-index: 100;
      pointer-events: none;
      font-family: 'Courier New', monospace;
    ">
      <h2 class="skill-title" style="
        font-size: 1.8rem;
        margin-bottom: 1rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 2px;
      "></h2>
      <ul class="skill-list" style="
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #aaa;
      "></ul>
    </div>
  `;
    document.body.appendChild(el);
    return el;
}

export function createContactOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'contact-overlay';
    el.className = 'hidden';
    el.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 0, 30, 0.95);
      border: 2px solid #f0f;
      padding: 2rem;
      min-width: 350px;
      max-width: 600px;
      z-index: 100;
      pointer-events: none;
      font-family: 'Courier New', monospace;
    ">
      <h2 style="
        color: #f0f;
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 0 10px #f0f;
      ">Contact Info</h2>
      <div class="contact-details" style="
        display: grid;
        gap: 0.8rem;
        font-size: 0.9rem;
        color: #ccc;
      "></div>
    </div>
  `;
    document.body.appendChild(el);
    return el;
}

/**
 * Creates all necessary DOM elements for the UI.
 */
export function createDOMElements() {
    createLoader();
    createIntro();
    createCrosshair();
    createHUD();
    createBoundaryOverlay();
    createAudioButton();
    createSkillOverlay();
    createContactOverlay();
}