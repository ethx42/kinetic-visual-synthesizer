# Software Requirements Document (SRD)

**Project Name:** Kinetic Visual Synthesizer (Project KVS)
**Version:** 2.0 (Architecture Shift: GPGPU & Modular Synthesis)
**Date:** December 6, 2025
**Target Audience:** Engineers, Hackers, Creative Coders, Artists.

---

## 1. Introduction

### 1.1 Purpose

The purpose of Project KVS is to build a browser-based, high-performance visualization instrument. Unlike passive particle demos, this system functions as a **"Visual Synthesizer."** It empowers users to manipulate complex mathematical vector fields (physics simulations) in real-time using hand gestures captured via webcam. The system translates physical human tension into digital entropy, effectively allowing the user to "sculpt" math with their hands.

### 1.2 Scope

The application is a client-side Single Page Application (SPA). It leverages the GPU for massive parallel processing (GPGPU) to simulate millions of particles. It utilizes the CPU for computer vision (hand tracking). The system acts as a bridge, mapping biological input signals to shader-based physics parameters.

### 1.3 Key Definitions

- **GPGPU (General-Purpose computing on Graphics Processing Units):** The technique of using the GPU's fragment shaders to perform physics calculations for position and velocity, rather than just rendering colors.
- **FBO (Frame Buffer Object):** An off-screen buffer used to store particle data (positions/velocities) in the form of textures, enabling the "Ping-Pong" simulation technique.
- **Tension Coefficient:** A normalized float value (0.0 to 1.0) derived from the physical distance between the user's thumb and index finger, representing "force" or "intensity."
- **Vector Field:** A mathematical construct where every point in the 3D space is assigned a direction vector, dictating the flow of particles (e.g., Curl Noise, Laminar Flow).

---

## 2. System Architecture

### 2.1 High-Level Stack

- **Framework:** Svelte (selected for zero-runtime overhead and direct reactivity).
- **3D Engine:** Three.js via `Threlte` (Svelte wrapper).
- **Physics Engine:** Custom WebGL GPGPU Simulation (Fragment Shaders).
- **Input Layer:** Google MediaPipe Hands (Client-side Computer Vision).
- **Build Tool:** Vite (for HMR and shader compilation).

### 2.2 Data Flow Architecture

The system operates on two concurrent loops:

1.  **The Input Loop (CPU / ~30Hz):** Captures webcam frame → Infers landmarks → Calculates `Tension` → Updates Svelte Store.
2.  **The Physics Loop (GPU / ~60Hz):** Reads `Tension` Uniform → Reads Previous FBO Texture → Computes New Velocity/Position → Writes to New FBO Texture → Renders to Screen.

---

## 3. Functional Requirements

### 3.1 The Physics Engine (GPGPU Module)

- **REQ-PHY-01 (Particle Count):** The system must be capable of rendering a minimum of 1,000,000 (one million) concurrent particles on standard discrete desktop GPUs.
- **REQ-PHY-02 (Simulation Technique):** The system must utilize a "Ping-Pong" FBO architecture. It shall maintain two data textures for Position and two for Velocity, swapping read/write targets every frame to persist state.
- **REQ-PHY-03 (Vector Fields):** The system must support switchable mathematical models (algorithms) that define particle behavior:
  - _Curl Noise:_ Fluid-like, non-divergent flow.
  - _Strange Attractor:_ Chaotic systems (e.g., Lorenz or Aizawa attractors) where particles orbit a mathematical singularity.
  - _Gravity Grid:_ A structured lattice that deforms under attractive force.
- **REQ-PHY-04 (Entropy Injection):** The physics shader must accept a `uEntropy` uniform. As this value increases, the system must inject pseudo-random noise into the velocity vectors, simulating thermodynamic chaos.

### 3.2 The Input Module (Computer Vision)

- **REQ-CV-01 (Hand Tracking):** The system must detect both left and right hands independently.
- **REQ-CV-02 (Tension Calculation):**
  - The system must calculate the Euclidean distance between the Tip of the Thumb and the Tip of the Index Finger.
  - This distance must be normalized against the user's hand scale (Wrist to Middle Finger MCP) to ensure the system works for hands of all sizes.
  - **Output:** A value of 0.0 (Open Hand) to 1.0 (Closed Fist).
- **REQ-CV-03 (Signal Loss Handling):** If the confidence score of the hand tracking drops below a defined threshold, the system must trigger a "Signal Lost" event (see REQ-UX-02).

### 3.3 The Synthesizer Logic (The "Patch Bay")

- **REQ-SYN-01 (Parameter Mapping):** The UI must allow the user to "patch" (assign) the Hand Tension input to specific simulation parameters.
  - _Target 1:_ **Time Scale** (Slow down/Speed up time).
  - _Target 2:_ **Entropy** (Order vs. Chaos).
  - _Target 3:_ **Color Shift** (Hue rotation based on tension).
  - _Target 4:_ **Attractor Strength** (Gravity well intensity).
- **REQ-SYN-02 (Modulation Visualization):** The UI must visually represent the "Signal Strength" of the hand tension (e.g., a VU meter or oscilloscope graph) to confirm input registry.

### 3.4 The Visualization Layer (Rendering)

- **REQ-VIS-01 (Dynamic Coloring):** Particles must not use static colors. Color must be determined procedurally in the shader based on particle velocity or lifetime. High-velocity particles shall appear hotter/brighter.
- **REQ-VIS-02 (Depth Cues):** The system must implement size attenuation (particles further away appear smaller) and additive blending to create a glowing, ethereal effect when particles overlap.

---

## 4. User Interface Requirements (The "Cyberdeck" Aesthetic)

### 4.1 Visual Style

- **REQ-UI-01 (Typography):** All textual elements must utilize monospaced fonts (e.g., JetBrains Mono, Roboto Mono) to reinforce the engineering/terminal aesthetic.
- **REQ-UI-02 (HUD Layout):** The interface shall be a "Heads-Up Display" overlay. It must be semi-transparent and frame the viewport, ensuring the particle field remains the focal point.

### 4.2 Features

- **REQ-UI-03 (Data Stream):** A dedicated section of the screen must display real-time telemetry data, updating every frame:
  - Current FPS.
  - Active Particle Count.
  - Hand Tracking Confidence Score.
  - XYZ Coordinates of the Index Finger.
- **REQ-UI-04 (The "Glitch" Effect):** Upon receiving a "Signal Lost" event (REQ-CV-03), the post-processing layer must engage a Chromatic Aberration and Scanline shader effect, visually simulating a "connection error" rather than just failing silently.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-PERF-01:** The application must maintain a steady 60 FPS on devices with a dedicated GPU (NVIDIA GTX 1060 equivalent or higher).
- **NFR-PERF-02:** The application must include a "Performance Fallback" mode. If the frame rate drops below 30 FPS for 3 consecutive seconds, the system shall automatically reduce the particle count or disable expensive post-processing effects.

### 5.2 Latency

- **NFR-LAT-01:** The end-to-end latency between a physical hand movement and the corresponding visual update on screen must be less than 50 milliseconds to preserve the illusion of direct manipulation.

### 5.3 Reliability

- **NFR-REL-01:** The Computer Vision module must handle "Occlusion" gracefully. If one hand crosses over the other, the tracking logic must prioritize the hand closest to the camera.

---

## 6. Development Strategy

### 6.1 Phase 1: The Engine (Infrastructure)

- Initialize Svelte + Vite.
- Implement the GPGPU FBO loop (Ping-Pong buffers).
- Render a static cloud of 1 million particles.

### 6.2 Phase 2: The Logic (Vector Fields)

- Write the fragment shaders for "Curl Noise" and "Attractor" logic.
- Verify the fluid motion of particles without user input.

### 6.3 Phase 3: The Interface (Human-Machine Connection)

- Integrate MediaPipe Hands.
- Create the "Tension" normalization logic.
- Connect the `Tension` variable to the `uEntropy` shader uniform.

### 6.4 Phase 4: The Polish (Cyberdeck UI)

- Build the HTML overlay with Svelte.
- Implement the Post-Processing "Glitch" effects.
- Add the telemetry data streams.
