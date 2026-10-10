# AetherBuild

AetherBuild is a browser-based 3D scene editor controlled by webcam hand gestures. It combines React, Three.js, and MediaPipe Hands to make spatial object creation and editing accessible without requiring a traditional mouse-first workflow.

## Current capabilities

- Create cubes, spheres, cylinders, cones, and toruses.
- Manage multiple independent objects in a scene hierarchy.
- Select, duplicate, and delete scene objects.
- Edit position, rotation, scale, and color numerically.
- Use Three.js transform gizmos for mouse-based editing.
- Switch between perspective and orthographic camera views.
- Toggle alignment guides through the selected object.
- Orbit, pan, zoom, and frame the selected object.
- Undo and redo committed transforms and scene edits.
- Use hand gestures to move, scale, rotate, extrude, and color the selected object.
- Preserve object transforms when switching selection, modes, or camera views.

## Roadmap progress

- **P0 — Foundation:** Complete. Core Three.js scene, webcam tracking, transform synchronization, and resize handling are in place.
- **P1 — Usable hand interactions:** Complete. Gesture stabilization, calibration, tracking feedback, camera controls, and recovery behavior are implemented.
- **P2 — Multi-object scene editor:** Complete. Scene state is the source of truth for object identity, transforms, selection, hierarchy, materials, and resource cleanup.
- **P3 — Spatial interaction and professional editing tools:** Complete. Transform gizmos, snapping, orthographic/perspective views, alignment guides, unified hand-frame routing, and robust gesture release recovery are implemented.

## Interaction modes

The toolbar provides direct controls for Move, Rotate, and Scale. Additional hand interaction modes include Extrude and Color. A victory-hand gesture held for several seconds cycles through the available interaction modes.

### Hand controls

- **Open palm or pinch:** Move the selected object.
- **Two-hand pinch:** Scale the selected object.
- **Pinch with the rotation mode active:** Rotate the selected object.
- **Pinch with the extrude mode active:** Scale along an axis selected by the other hand's finger count.
- **Color mode:** Move the hand cursor over the color picker to update the selected object's material color.
- **Release or remove a hand:** Commit the current gesture as one undoable transform and reset gesture state safely.

Mouse selection and transform controls remain available while hand tracking is active.

## Architecture

The scene store is the source of truth. Three.js meshes are synchronized from reducer state rather than owning independent application state.

- `src/state/sceneReducer.js` — scene create, select, duplicate, delete, and transform actions.
- `src/scene/SceneManager.js` — synchronizes scene objects with Three.js meshes and disposes resources.
- `src/scene/ObjectFactory.js` — creates supported primitive geometries and materials.
- `src/components/SceneHierarchy.jsx` — scene object list and selection.
- `src/components/InspectorPanel.jsx` — numeric transform and material editing.
- `src/scene/Scene3D.jsx` — cameras, orbit controls, transform gizmos, guides, and rendering.
- `src/handTracking/HandTracker.jsx` — MediaPipe input, gesture interpretation, and reducer command routing.

## How it works

1. Webcam frames are sent to MediaPipe Hands.
2. Hand landmarks are stabilized and converted into gesture state.
3. Gesture state dispatches commands to the application reducer.
4. The reducer updates the selected scene object.
5. Three.js synchronizes meshes, gizmos, guides, and camera presentation from that state.

## Tech stack

- React
- Three.js
- MediaPipe Hands
- WebGL
- Vite

## Run locally

```bash
git clone https://github.com/notAryan10/AtherBuild.git
cd AtherBuild
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`, and allow camera access when prompted.

To create a production build:

```bash
npm run build
```
