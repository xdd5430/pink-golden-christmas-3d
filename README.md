
# 🌸 Pink Golden Christmas 3D

A high-fidelity, interactive 3D Christmas experience built with **React**, **Three.js (React Three Fiber)**, and **MediaPipe**. This project combines cinematic particle effects with advanced hand-gesture recognition, allowing users to explore a magical world of pink and gold through their webcam.

## ✨ Core Features

- **Magical Particle Tree**: A real-time 3D tree rendered with over 45,000 glowing particles, featuring procedural breathing animations and interactive wave effects.
- **AI Hand Gesture Control**:
  - ✊ **Fist**: Switches to "Tree Mode." Move your hand to rotate the tree and explore it from different angles.
  - 🖐️ **Palm**: Unfolds the interactive "Polaroid Gallery" stream.
  - 👌 **Pinch**: Precisely locks and zooms into the centered photo for a deep-dive viewing experience.
  - 🫶 **Heart (Two Hands)**: Triggers a romantic "Heart Rain" effect and displays a customizable love message.
- **Dynamic Gallery Experience**:
  - **Focal Inheritance**: When switching from Tree to Gallery, the system automatically centers on the photo you were just looking at on the tree.
  - **Kinetic Sliding**: The gallery scroll speed is perfectly synchronized with your hand's lateral movement, featuring realistic physical inertia and friction.
- **Personalized Customization**: Upload your own photos and customize unique Christmas messages for every Polaroid in the scene.
- **Real-time Wish System**: Type your wishes to send magical stars trailing golden silk from the bottom UI to the top of the tree.
- **Cinematic Post-Processing**: Integrated Bloom, Film Grain (Noise), and Vignette effects to create a dreamlike, high-end visual atmosphere.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 (Hooks & Functional Components)
- **3D Engine**: Three.js & React Three Fiber (R3F)
- **Utilities**: React Three Drei (Camera & Control optimization)
- **Hand Tracking**: Google MediaPipe Hands (Local real-time edge inference)
- **Styling**: Tailwind CSS
- **Shaders**: Custom GLSL (Particle physics and lighting shaders)

## 🚀 Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pink-golden-christmas.git
   cd pink-golden-christmas
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📸 Interaction Guide

1. **Enable Sensing**: Click the **"Magic Sensor"** button in the top right to start your webcam.
2. **Calibration**: Ensure your hand is visible to the camera (view the preview in the bottom left).
3. **Switch Modes**:
   - Want to see the tree? **Make a Fist**.
   - Want to browse photos? **Open your Palm** and move it left/right to slide the gallery.
4. **Zoom In**: When a photo is in the center (highlighted with gold), perform a **Pinch** gesture to enlarge it.
5. **Spread Love**: Make a **Heart** gesture with both hands to see the names of your loved ones amidst falling hearts.
6. **Make a Wish**: Type in the bottom input field and hit **Send** to launch a wish star.

## 📄 License
This project is licensed under the [MIT License](LICENSE).

---
🎄 *Merry Christmas & Happy Coding!*
