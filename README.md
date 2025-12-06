# Kinetic Visual Synthesizer (KVS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)

> **Sculpt math with your hands.**

**Project KVS** is a browser-based, high-performance visualization instrument. It functions as a **"Visual Synthesizer,"** empowering users to manipulate complex mathematical vector fields in real-time using hand gestures captured via webcam. By translating physical human tension into digital entropy, it allows you to interactively control a simulation of **1 million particles** directly in your browser.

---

## 🌟 Key Features

- **GPGPU Physics Engine**: Utilizes "Ping-Pong" FBO (Frame Buffer Object) architecture to simulate over **1,000,000 concurrent particles** on standard hardware.
- **Computer Vision Control**: Integrated **MediaPipe Hands** tracking runs in a dedicated Web Worker, ensuring 60 FPS rendering while interpreting hand gestures with <50ms latency.
- **Vector Field Synthesis**: Switchable mathematical models including:
  - **Curl Noise**: Fluid-like, non-divergent flow.
  - **Strange Attractors**: Chaotic systems like Lorenz or Aizawa.
  - **Gravity Grids**: Deformable structural lattices.
- **"Cyberdeck" Aesthetic**: A semi-transparent, monospaced HUD overlay inspired by sci-fi interfaces, featuring real-time telemetry and "glitch" effects on signal loss.
- **Reactive Audio/Visuals**: Procedural coloring based on particle velocity and density.

## 🛠️ Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (Runes-based reactivity)
- **3D Engine**: [Three.js](https://threejs.org/) via [Threlte](https://threlte.xyz/)
- **Physics**: Custom WebGL GPGPU (Fragment Shaders)
- **Input**: [Google MediaPipe Tasks Vision](https://developers.google.com/mediapipe)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A modern browser with WebGL2 support (Chrome/Edge/Firefox recommended)
- A webcam (for hand tracking features)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ethx42/kinetic-visual-synthesizer.git
    cd kinetic-visual-synthesizer
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Start the development server:**

    ```bash
    yarn dev
    ```

4.  Open your browser and navigate to `http://localhost:5173`.

## 🎮 Usage / Controls

Once the application is running:

1.  **Allow Camera Access**: The app requires webcam access to track your hand movements.
2.  **Gesture Control**:
    - **Tension (Thumb + Index Finger)**: Pinch your fingers to increase "Tension".
      - **Open Hand (0.0)**: Organized, laminar flow.
      - **Closed Pinch (1.0)**: High entropy, chaos, and increased particle velocity.
3.  **Keyboard Shortcuts**:
    - `D`: Toggle Debug View (Velocity Texture).

## 🏗️ Architecture

The system operates on two concurrent loops to ensure maximum performance:

1.  **The Input Loop (CPU / Web Worker):** Captures webcam frames, infers hand landmarks, and calculates tension values.
2.  **The Physics Loop (GPU):** Reads tension uniforms, computes particle positions via fragment shaders, and renders the scene.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Designed for engineers, hackers, and creative coders._
