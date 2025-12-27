# AetherBuild

**AetherBuild** is a browser based **gesture controlled 3D scene editor** that allows users to create and manipulate 3D objects using **natural two hand interactions** tracked via a webcam.

Instead of using a mouse or keyboard, users build and interact with 3D objects **directly with their hands**, making AetherBuild a step toward **spatial computing on the web**.

---

## Features     

- **Two hand tracking** using MediaPipe Hands  
- **Real time 3D cube manipulation** with Three.js  
- **Pinch to grab** objects  
- **Move hand to position** objects in 3D space  
- **Live gesture feedback UI** below webcam preview  
- Runs **entirely in the browser** (no backend)

---

## How It Works

AetherBuild follows a clean real-time pipeline:



1. Webcam frames are captured in real time  
2. MediaPipe detects hand landmarks (up to 2 hands)  
3. Gesture math converts landmarks into meaningful actions  
4. Actions update a live Three.js 3D scene  

---

## Gesture Controls (Current)

### Right Hand
- **Open Palm** → Preview / move cube  
- **Pinch** → Grab and move cube  

### Two Hands
- **Both hands visible** → Enables multi hand interaction (scaling & rotation coming next)

Gesture states are displayed live below the webcam feed for clarity and debugging.

---

## Tech Stack

- **React** — UI structure & state management  
- **Three.js** — 3D rendering engine  
- **MediaPipe Hands** — Real time hand tracking  
- **WebGL** — Hardware accelerated graphics  
- **Vite** — Fast development tooling  


---

## Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/yourname/aetherbuild.git
cd aetherbuild
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

**Open the browser at the URL shown** (usually http://localhost:5173).

- ⚠️ Make sure to allow camera access when loading the page.