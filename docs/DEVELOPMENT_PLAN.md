# Development Plan: Kinetic Visual Synthesizer

**Version:** 1.1 (Revised)  
**Date:** December 2025  
**Architecture:** GPGPU, Web Workers, & Modular Synthesis

---

## Overview

This document outlines a phased development approach with **demonstrable milestones**. Each milestone produces a runnable application with visible results, ensuring continuous progress validation.

**Technology Stack:**

- **Framework:** Svelte 5 (runes-based reactivity)
- **3D Engine:** Threlte 7+ (Svelte wrapper for Three.js)
- **Physics:** Custom WebGL GPGPU (Fragment Shaders)
- **Computer Vision:** @mediapipe/tasks-vision (Web Worker based)
- **Build Tool:** Vite 7+ (with shader hot-reload)
- **Language:** TypeScript 5.9+ (strict mode)

**Architecture Principles:**

- **GPGPU Law:** All particle physics runs on GPU via FBO Ping-Pong
- **Zero-Garbage Loop:** Pre-allocated variables, no memory allocation in render loop
- **Thread Segregation:**
  - **Main Thread:** UI, Svelte State, WebGL Rendering
  - **Worker Thread:** Computer Vision (MediaPipe) & Heavy Math
- **Reactive Bridge:** Svelte Stores ↔ Shader Uniforms (only communication channel)
- **Separation of Concerns:** CPU (CV/UI) ↔ GPU (Physics/Rendering)

---

## Architectural Decisions & Rationale

### Why Web Workers for Computer Vision?

**Problem:** MediaPipe Hands processing can take 5-10ms per frame. Running this on the main thread directly competes with the 16ms render budget (60 FPS), causing visible stutter.

**Solution:** Offload all MediaPipe processing to a Web Worker. The main thread only:

1. Captures video frames
2. Transfers frames to worker (via `postMessage` with `ImageBitmap` or `VideoFrame`)
3. Receives processed landmark data
4. Updates Svelte stores reactively

**Result:** Main thread remains free for WebGL rendering, ensuring consistent 60 FPS.

### Why Native Threlte FBO Management?

**Problem:** The classic `GPUComputationRenderer` from Three.js examples is imperative and fights Svelte's reactive paradigm. It requires manual lifecycle management and doesn't integrate cleanly with Threlte's component system.

**Solution:** Build a custom `useGPGPU` hook that:

1. Uses Threlte's `useFrame` for reactive updates
2. Manages FBO lifecycle via Svelte component lifecycle
3. Exposes reactive stores for texture references
4. Integrates seamlessly with Threlte's `useThrelteStore`

**Result:** Cleaner code, better TypeScript inference, and reactive texture management.

### Why @mediapipe/tasks-vision?

**Problem:** `@mediapipe/hands` is the legacy API with less control over initialization and model management.

**Solution:** Use `@mediapipe/tasks-vision` which provides:

1. Better initialization control
2. More efficient model loading
3. Better TypeScript support
4. Modern API design

**Result:** More maintainable code and better performance characteristics.

---

## Project Structure

```
src/
├── lib/
│   ├── stores/
│   │   ├── tension.ts          # Hand tension state (0.0-1.0)
│   │   ├── settings.ts          # Global settings (particle count, etc.)
│   │   └── telemetry.ts         # Performance metrics
│   ├── gpgpu/
│   │   ├── hooks/
│   │   │   └── useGPGPU.ts            # Custom FBO management hook (Threlte native)
│   │   └── types.ts                   # GPGPU type definitions
│   ├── shaders/
│   │   ├── simulation/
│   │   │   ├── sim.vert.glsl    # Simulation vertex shader
│   │   │   ├── sim.frag.glsl    # Simulation fragment shader (physics)
│   │   │   └── noise.glsl       # Simplex/Curl noise functions
│   │   ├── rendering/
│   │   │   ├── particle.vert.glsl     # Particle vertex shader
│   │   │   └── particle.frag.glsl     # Particle fragment shader (color)
│   │   └── postprocessing/
│   │       ├── glitch.vert.glsl
│   │       └── glitch.frag.glsl
│   ├── vision/
│   │   ├── worker.ts           # Vision processing worker (Web Worker)
│   │   ├── VisionManager.ts    # Main thread bridge
│   │   ├── TensionCalculator.ts # Normalization algorithm
│   │   └── types.ts             # Hand landmark types
│   └── utils/
│       ├── math.ts              # Vector math utilities
│       └── constants.ts         # Physical constants
├── components/
│   ├── canvas/
│   │   ├── SimulationCanvas.svelte    # Main 3D scene container
│   │   ├── GPGPUSimulation.svelte     # FBO simulation component
│   │   └── ParticleSystem.svelte      # Particle renderer
│   └── ui/
│       ├── Overlay.svelte              # Cyberdeck HUD overlay
│       ├── TelemetryPanel.svelte       # Real-time metrics display
│       ├── ParameterPatchBay.svelte    # Synthesizer controls
│       └── SignalIndicator.svelte      # Hand tracking status
├── App.svelte
└── main.ts
```

---

## Milestone 0: Foundation Setup

**Goal:** Establish project infrastructure and dependencies  
**Demonstration:** Project runs with TypeScript compilation, no runtime errors

### Phase 0.1: Dependency Installation

**Tasks:**

- [ ] Install Threlte core: `@threlte/core`, `@threlte/extras`
- [ ] Install Three.js: `three`, `@types/three`
- [ ] Install MediaPipe Tasks: `@mediapipe/tasks-vision` (modern API)
- [ ] Install Vite GLSL plugin: `vite-plugin-glsl` (for shader hot-reload)
- [ ] Configure TypeScript strict mode in `tsconfig.app.json`
- [ ] Set up path aliases (`$lib`, `$shaders`, `$components`)

**Acceptance Criteria:**

- `yarn install` completes without errors
- `yarn dev` starts Vite dev server
- TypeScript compilation passes (`yarn check`)

### Phase 0.2: Project Structure & Configuration

**Tasks:**

- [ ] Create directory structure (stores, shaders, components, etc.)
- [ ] Configure Vite to handle `.glsl` imports
- [ ] Set up Svelte 5 runes configuration
- [ ] Create base `App.svelte` with Threlte `<Canvas>`

**Acceptance Criteria:**

- All directories exist
- `.glsl` files can be imported as strings
- Empty canvas renders (black screen is acceptable)

**Deliverable:** Project compiles and runs with empty canvas

### Phase 0.3: Code Quality Standards (Enterprise Polish)

**Rationale:** High-performance codebases with complex shaders, worker threads, and GPGPU logic require strict quality gates. Without enforced linting and formatting, technical debt accumulates rapidly, threatening the "zero-garbage" philosophy and maintainability.

**Tasks:**

- [ ] Install ESLint (Flat Config) with `typescript-eslint` and `eslint-plugin-svelte`
- [ ] Install Prettier with `prettier-plugin-svelte`
- [ ] Configure ESLint rules:
  - Strict TypeScript checking (`@typescript-eslint/no-explicit-any: warn`)
  - Svelte component linting
  - Unused variable detection
- [ ] Configure Prettier:
  - Tabs for indentation (consistent with shader files)
  - Single quotes
  - 100 character line width
- [ ] Create `.vscode/settings.json` for workspace consistency:
  - Format on save enabled
  - ESLint auto-fix on save
- [ ] Add yarn scripts: `lint` and `format`
- [ ] Run initial lint/format pass on existing codebase

**Acceptance Criteria:**

- `yarn lint` passes with zero errors
- `yarn format` formats all files consistently
- VS Code auto-formats on save (verified)
- No TypeScript `any` types in codebase (warnings acceptable)
- All Svelte components follow linting rules

**Deliverable:** Enforced code style and quality gates preventing technical debt accumulation

---

## Milestone 1: The Silicon Canvas (GPGPU Infrastructure)

**Goal:** Establish FBO Ping-Pong system and render static particles  
**Demonstration:** 1 million particles rendered as static point cloud

### Phase 1.1: Threlte Canvas & Basic Scene

**Tasks:**

- [ ] Create `SimulationCanvas.svelte` component
- [ ] Set up Threlte `<Canvas>` with WebGL2 context
- [ ] Configure camera (PerspectiveCamera, position `[0, 0, 5]`, look at origin)
- [ ] Add basic lighting (AmbientLight for now)
- [ ] Implement WebGL2 capability check with fallback warning

**Acceptance Criteria:**

- Canvas renders with proper viewport
- WebGL2 context is active (or fallback message shown)
- Camera controls work (orbit controls via Threlte)

**Deliverable:** Black canvas with working camera controls

### Phase 1.2: GPGPU FBO Setup (Reactive)

**Tasks:**

- [ ] Implement `useGPGPU` hook using Threlte's `useFrame` and `useThrelteStore`
- [ ] Create FBOs with proper texture formats:
  - WebGL2: `THREE.RGBA32FTexture` (FloatType)
  - WebGL1: `THREE.RGBA16FTexture` (HalfFloatType) (fallback)
- [ ] Create Position texture (RGBA: x, y, z, lifetime)
- [ ] Create Velocity texture (RGBA: vx, vy, vz, unused)
- [ ] Implement Ping-Pong buffer swap logic in the hook
- [ ] Initialize Position texture with random particle positions (uniform sphere distribution)
- [ ] Initialize Velocity texture with zero vectors

**Acceptance Criteria:**

- FBO textures are created successfully
- Texture dimensions match particle count (e.g., 1024x1024 for 1M particles)
- Ping-Pong swap works (can verify via texture readback in dev mode)

**Deliverable:** FBO system initialized (no visual output yet)

### Phase 1.3: Debug Visualization (Velocity Texture)

**Tasks:**

- [ ] Create temporary `DebugPlane.svelte` component
- [ ] Render Velocity texture as 2D plane overlay
- [ ] Use `THREE.DataTexture` to display texture contents
- [ ] Add toggle to show/hide debug plane

**Acceptance Criteria:**

- Velocity texture visible on screen (should show zero vectors initially)
- Can toggle debug view on/off
- Texture data is readable (not corrupted)

**Deliverable:** Debug plane showing Velocity texture (all zeros = black)

### Phase 1.4: Static Particle Rendering

**Tasks:**

- [ ] Create `ParticleSystem.svelte` component
- [ ] Create `particle.vert.glsl`:
  - Read Position texture
  - Transform to world space
  - Set `gl_PointSize` with distance attenuation
- [ ] Create `particle.frag.glsl`:
  - Simple white color for now
  - Additive blending enabled
- [ ] Create `THREE.Points` geometry with `THREE.BufferGeometry`
- [ ] Bind Position texture as uniform
- [ ] Render 1 million particles

**Acceptance Criteria:**

- 1 million particles visible as white point cloud
- Particles distributed in 3D space (sphere)
- Point size attenuates with distance
- Frame rate ≥ 60 FPS on target hardware

**Deliverable:** Static particle cloud rendered (white points)

---

## Milestone 2: The Mathematical Soul (Vector Fields)

**Goal:** Implement physics simulation with multiple vector field algorithms  
**Demonstration:** Particles flow according to Curl Noise, then switchable to Attractors

### Phase 2.1: Simulation Shader Infrastructure

**Tasks:**

- [ ] Create `simulation/sim.vert.glsl` (fullscreen quad pass-through)
- [ ] Create `simulation/sim.frag.glsl` skeleton:
  - Read Position and Velocity textures
  - Implement Velocity Verlet integration
  - Write new Position and Velocity to output
- [ ] Create `SimulationPass.svelte` component
- [ ] Connect simulation shader to FBO loop
- [ ] Add `uTime` uniform (updates every frame)
- [ ] Add `uDeltaTime` uniform (frame delta)

**Acceptance Criteria:**

- Simulation shader runs every frame
- Particles move (even if just drifting)
- No NaN or Infinity values in textures

**Deliverable:** Particles drift/move (basic motion)

### Phase 2.2: Simplex Noise & Curl Computation

**Tasks:**

- [ ] Create `shaders/simulation/noise.glsl`:
  - Implement Simplex Noise 3D (or use `snoise` from Shadertoy)
  - Implement Curl Noise: `curl = ∇ × Noise`
  - Formula: `curl = (dF/dy - dF/dz, dF/dz - dF/dx, dF/dx - dF/dy)`
- [ ] Integrate Curl Noise into velocity calculation
- [ ] Add `uNoiseScale` uniform (controls field scale)
- [ ] Add `uNoiseSpeed` uniform (animates noise over time)

**Acceptance Criteria:**

- Particles flow in fluid-like patterns
- Motion is divergence-free (no clustering/exploding)
- Field is visually smooth and organic

**Deliverable:** Particles flow like smoke/fluid (Curl Noise)

### Phase 2.3: Strange Attractor Implementation

**Tasks:**

- [ ] Implement Lorenz Attractor equations in shader:
  ```
  dx/dt = σ(y - x)
  dy/dt = x(ρ - z) - y
  dz/dt = xy - βz
  ```
- [ ] Implement Aizawa Attractor (optional, more complex)
- [ ] Create `VectorFieldType` enum/store (CURL_NOISE, LORENZ, AIZAWA)
- [ ] Add uniform `uFieldType` to switch algorithms
- [ ] Add `uAttractorStrength` uniform (controls force magnitude)

**Acceptance Criteria:**

- Can switch between Curl Noise and Lorenz Attractor
- Lorenz particles orbit attractor point
- Motion is stable (no runaway particles)

**Deliverable:** Particles orbit strange attractor (Lorenz)

### Phase 2.4: Entropy Injection System

**Tasks:**

- [ ] Add `uEntropy` uniform to simulation shader (0.0-1.0)
- [ ] Implement entropy logic:
  - Low entropy: Pure vector field (organized flow)
  - High entropy: Mix field with high-frequency random noise
  - Formula: `vFinal = mix(vField, vRandom, uEntropy)`
- [ ] Create `stores/tension.ts` with `tension` rune (initially 0.0)
- [ ] Connect `tension` store to `uEntropy` uniform
- [ ] Add UI slider to manually control entropy (for testing)

**Acceptance Criteria:**

- Slider controls entropy (0.0 = organized, 1.0 = chaotic)
- Particles transition smoothly between order and chaos
- No performance degradation with high entropy

**Deliverable:** Entropy slider controls particle chaos

---

## Milestone 3: The Ghost in the Machine (Computer Vision)

**Goal:** Integrate MediaPipe Hands via Web Worker and map gestures to physics parameters  
**Demonstration:** Hand gestures control particle entropy in real-time (< 50ms latency)

### Phase 3.1: Vision Worker Infrastructure

**Tasks:**

- [ ] Create `vision/worker.ts` using `@mediapipe/tasks-vision`
- [ ] Implement `HandLandmarker` initialization in worker context
- [ ] Create `vision/VisionManager.ts` to handle Worker communication (main thread)
- [ ] Implement `postMessage` protocol for frame data transfer
- [ ] Set up webcam capture (`getUserMedia`) on main thread
- [ ] Transfer `ImageBitmap` or `VideoFrame` to worker (or use `OffscreenCanvas` if supported)
- [ ] Create `stores/handTracking.ts` for landmark data (updated from worker messages)

**Acceptance Criteria:**

- Webcam activates and shows video feed (debug overlay on main thread)
- MediaPipe detects hands in worker (console logs landmarks)
- Hand tracking runs at ~30 FPS without blocking main thread
- Worker messages update stores reactively

**Deliverable:** Hand tracking active via Web Worker (console logs landmarks, no main-thread blocking)

### Phase 3.2: Tension Calculation Algorithm

**Tasks:**

- [ ] Create `vision/TensionCalculator.ts`:
  - Extract thumb tip (landmark 4) and index tip (landmark 8)
  - Calculate Euclidean distance: `dist(thumb, index)`
  - Extract wrist (landmark 0) and middle MCP (landmark 9)
  - Calculate reference distance: `dist(wrist, middleMCP)`
  - Normalize: `normalizedDist = dist(thumb, index) / dist(wrist, middleMCP)`
  - Apply smoothstep: `tension = 1.0 - smoothstep(0.0, 1.2, normalizedDist)`
- [ ] Handle both hands (average tension or use dominant hand)
- [ ] Add smoothing filter (exponential moving average) to reduce jitter
- [ ] Update `tension` store with calculated value

**Acceptance Criteria:**

- Tension value updates when hand opens/closes
- Value ranges 0.0 (open) to 1.0 (closed fist)
- Smooth transitions (no sudden jumps)

**Deliverable:** Tension value displayed in UI (0.0-1.0)

### Phase 3.3: Hand-to-Physics Bridge

**Tasks:**

- [ ] Connect `tension` store to `uEntropy` uniform in simulation
- [ ] Verify real-time response (< 50ms latency)
- [ ] Add visual feedback: VU meter or oscilloscope showing tension
- [ ] Implement signal loss detection:
  - If confidence < threshold → trigger "Signal Lost" event
  - Store `signalLost` state

**Acceptance Criteria:**

- Opening hand → particles become organized (low entropy)
- Closing hand → particles become chaotic (high entropy)
- Response feels immediate and responsive
- Signal loss is detected and logged

**Deliverable:** Hand gestures control particle entropy in real-time

### Phase 3.4: Multi-Parameter Mapping (Patch Bay)

**Tasks:**

- [ ] Create `components/ui/ParameterPatchBay.svelte`:
  - UI to assign tension to different parameters
  - Targets: Time Scale, Entropy, Color Shift, Attractor Strength
- [ ] Create `stores/settings.ts` with patch mappings
- [ ] Implement parameter routing logic:
  - `tension → timeScale`: `timeScale = 0.5 + tension * 1.5`
  - `tension → entropy`: Direct mapping (already done)
  - `tension → colorShift`: `hueOffset = tension * 2π`
  - `tension → attractorStrength`: `strength = 0.1 + tension * 0.9`
- [ ] Update shaders to accept new uniforms

**Acceptance Criteria:**

- Can patch tension to any parameter
- Multiple parameters can be controlled simultaneously
- UI clearly shows active patches

**Deliverable:** Patch bay controls multiple physics parameters

---

## Milestone 4: The Visual Synthesizer (Color & Light)

**Goal:** Implement procedural coloring and visual effects  
**Demonstration:** Particles glow with velocity-based colors, depth cues, and post-processing

### Phase 4.1: Procedural Color Palettes

**Tasks:**

- [ ] Update `particle.frag.glsl`:
  - Remove static white color
  - Implement Cosine Gradient Palette (IQ style):
    ```
    col = a + b * cos(6.28318 * (c * t + d))
    ```
  - Map particle speed to `t` parameter
  - Calculate speed from Velocity texture
- [ ] Add `uColorPalette` uniform (4x3 matrix for palette coefficients)
- [ ] Add `uColorIntensity` uniform (controls brightness)

**Acceptance Criteria:**

- Particles have gradient colors based on speed
- Fast particles appear brighter/hotter
- Colors are smooth and organic

**Deliverable:** Velocity-based color gradients

### Phase 4.2: Depth Cues & Additive Blending

**Tasks:**

- [ ] Enhance `particle.vert.glsl`:
  - Improve point size attenuation: `gl_PointSize = size * (scale / -mvPosition.z)`
  - Pass depth to fragment shader
- [ ] Update `particle.frag.glsl`:
  - Apply depth-based alpha fade
  - Enable additive blending: `gl.blendFunc(ONE, ONE)`
  - Implement soft particle edges (smooth falloff)

**Acceptance Criteria:**

- Particles glow when overlapping
- Distant particles fade out
- Size scales correctly with distance

**Deliverable:** Glowing, ethereal particle effects

### Phase 4.3: Color Modulation (Tension → Hue)

**Tasks:**

- [ ] Add `uHueShift` uniform to particle fragment shader
- [ ] Implement HSV → RGB conversion in shader
- [ ] Rotate hue based on `uHueShift` (from patch bay)
- [ ] Connect tension → color shift mapping

**Acceptance Criteria:**

- Hand tension shifts particle colors
- Color transitions are smooth
- Visual feedback is clear and intuitive

**Deliverable:** Tension controls color hue rotation

---

## Milestone 5: The Cyberdeck Polish (UI & Post-Processing)

**Goal:** Complete the HUD overlay, telemetry, and glitch effects  
**Demonstration:** Full "cyberdeck" aesthetic with real-time metrics and signal loss effects

### Phase 5.1: Cyberdeck HUD Overlay

**Tasks:**

- [ ] Create `components/ui/Overlay.svelte`:
  - Semi-transparent dark background
  - Monospaced font (JetBrains Mono or Roboto Mono)
  - Frame viewport (corners, edges)
- [ ] Style with CSS:
  - Dark theme (#0a0a0a background, #00ff00 text)
  - Glowing text effects (`text-shadow`)
  - Grid overlay pattern (optional)

**Acceptance Criteria:**

- HUD overlays canvas without obscuring particles
- Typography is monospaced and readable
- Aesthetic matches "cyberdeck" vision

**Deliverable:** Styled HUD overlay

### Phase 5.2: Telemetry Panel

**Tasks:**

- [ ] Create `components/ui/TelemetryPanel.svelte`
- [ ] Create `stores/telemetry.ts`:
  - Track FPS (using `useFrame` callback)
  - Track particle count (from settings)
  - Track hand tracking confidence
  - Track index finger XYZ coordinates
- [ ] Display real-time metrics:
  - Current FPS
  - Active Particle Count
  - Hand Tracking Confidence Score
  - Index Finger XYZ Coordinates
- [ ] Update metrics every frame (or throttle to 10 Hz)

**Acceptance Criteria:**

- All metrics display correctly
- Updates are smooth (no jitter)
- Values are formatted clearly

**Deliverable:** Real-time telemetry display

### Phase 5.3: Signal Loss Glitch Effect

**Tasks:**

- [ ] Create `shaders/postprocessing/glitch.frag.glsl`:
  - Chromatic Aberration (RGB split)
  - Scanline effect (horizontal lines)
  - Noise overlay
- [ ] Create `GlitchPass.svelte` component (Threlte post-processing)
- [ ] Trigger glitch effect when `signalLost` is true
- [ ] Add smooth transition in/out (fade effect)

**Acceptance Criteria:**

- Glitch activates on signal loss
- Effect is visually distinct (not subtle)
- Transitions smoothly

**Deliverable:** Glitch effect on signal loss

### Phase 5.4: Performance Fallback System

**Tasks:**

- [ ] Implement FPS monitoring in `telemetry.ts`
- [ ] Create performance fallback logic:
  - If FPS < 30 for 3 seconds → reduce particle count
  - If FPS < 20 → disable post-processing
- [ ] Add UI indicator for "Performance Mode" (normal/degraded)
- [ ] Allow manual override (user can force high quality)

**Acceptance Criteria:**

- System automatically reduces quality when needed
- Frame rate recovers after fallback
- User is informed of mode changes

**Deliverable:** Adaptive performance system

---

## Milestone 6: Integration & Polish

**Goal:** Final integration, testing, and optimization  
**Demonstration:** Complete, polished application meeting all SRD requirements

### Phase 6.1: End-to-End Integration

**Tasks:**

- [ ] Connect all components in `App.svelte`
- [ ] Verify all data flows (Stores → Uniforms)
- [ ] Test all vector field types (Curl, Lorenz, Aizawa)
- [ ] Test all patch bay mappings
- [ ] Verify hand tracking with both hands

**Acceptance Criteria:**

- All features work together
- No console errors
- Smooth 60 FPS on target hardware

**Deliverable:** Fully integrated application

### Phase 6.2: Code Quality & Documentation

**Tasks:**

- [ ] Add JSDoc comments to all public functions
- [ ] Document shader uniforms and their ranges
- [ ] Add inline comments for complex math operations
- [ ] Refactor any duplicated code
- [ ] Ensure TypeScript strict mode compliance
- [ ] Add error boundaries for graceful failures

**Acceptance Criteria:**

- Code is readable and maintainable
- All functions are documented
- No TypeScript errors

**Deliverable:** Production-ready codebase

### Phase 6.3: Testing & Validation

**Tasks:**

- [ ] Test on target hardware (GTX 1060 equivalent)
- [ ] Test on WebGL1 devices (mobile fallback)
- [ ] Verify 1M particles render at 60 FPS
- [ ] Test latency (< 50ms hand-to-visual)
- [ ] Test occlusion handling (hands crossing)
- [ ] Stress test (rapid hand movements)

**Acceptance Criteria:**

- Meets all SRD performance requirements
- Works on multiple devices
- Handles edge cases gracefully

**Deliverable:** Validated, production-ready application

---

## Development Guidelines

### Code Quality Standards

1. **TypeScript:**
   - Strict mode enabled
   - No `any` types (use `unknown` if needed)
   - Explicit return types for public functions
   - Use interfaces for data structures

2. **Naming Conventions:**
   - Components: PascalCase (`ParticleSystem.svelte`)
   - Files/Utilities: camelCase (`tensionCalculator.ts`)
   - Constants: UPPER_SNAKE_CASE (`MAX_PARTICLES`)
   - Shader uniforms: camelCase with `u` prefix (`uTime`, `uEntropy`)

3. **Shader Best Practices:**
   - Store shaders in `.glsl` files (not inline strings)
   - Use descriptive variable names (`vVelocity` not `v`)
   - Comment complex math operations
   - Prefer `mix()` and `smoothstep()` over `if` statements

4. **Performance:**
   - Pre-allocate all variables outside render loop
   - Use `useFrame` callbacks efficiently (throttle if needed)
   - Minimize uniform updates (only when values change)
   - Use `useThrelteStore` for reactive Three.js objects

5. **Architecture:**
   - Keep CPU and GPU logic separate
   - **Mandatory:** Computer Vision runs in Web Worker (never on main thread)
   - Use Svelte stores for state management
   - Pass data via uniforms (not texture readbacks)
   - Implement error boundaries for graceful degradation
   - Use `useFrame` callbacks for reactive FBO management (Threlte native)

### Testing Strategy

- **Visual Testing:** Each milestone produces visible output
- **Performance Profiling:** Use Chrome DevTools Performance tab
- **Shader Debugging:** Use `THREE.ShaderMaterial` with `wireframe` or debug textures
- **Hand Tracking Testing:** Use recorded video for consistent testing

### Troubleshooting Checklist

If particles don't render:

1. Check camera position and target
2. Verify texture uniforms are bound correctly
3. Check `uTime` uniform is updating
4. Verify FBO textures are initialized
5. Check WebGL context is active

If hand tracking fails:

1. Verify webcam permissions
2. Check MediaPipe initialization in worker
3. Verify Worker message protocol (postMessage/onmessage)
4. Verify landmark extraction logic
5. Check confidence thresholds
6. Verify ImageBitmap/VideoFrame transfer to worker

If performance is poor:

1. Reduce particle count temporarily
2. Check for memory leaks (texture disposal)
3. Verify no CPU-bound calculations in render loop
4. Profile with Chrome DevTools

---

## Success Criteria

**Milestone 1:** 1M static particles rendered at 60 FPS  
**Milestone 2:** Particles flow with Curl Noise and Lorenz Attractor  
**Milestone 3:** Hand gestures control entropy in real-time (< 50ms latency)  
**Milestone 4:** Particles glow with velocity-based colors  
**Milestone 5:** Complete cyberdeck UI with telemetry and glitch effects  
**Milestone 6:** Production-ready application meeting all SRD requirements

---

## Next Steps

1. Start with **Milestone 0** (Foundation Setup)
2. Complete each phase sequentially
3. Test and validate after each milestone
4. Document any deviations or discoveries
5. Iterate on visual "feel" during development

**Remember:** You're building an instrument, not a demo. Quality and performance are non-negotiable.
