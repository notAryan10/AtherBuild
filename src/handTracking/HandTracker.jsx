import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Hands } from "@mediapipe/hands"
import { Camera } from "@mediapipe/camera_utils"
import { detectGestures } from "./gestureMath"
import ColorPicker from "../components/ColorPicker"
import { useContext } from "react"
import { AppContext } from "../context/AppProvider"

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export default function HandTracker() {
  const { state, dispatch, cubeStateRef } = useContext(AppContext)
  const { interactionMode, isShapeLocked, color } = state

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const initialDistanceRef = useRef(null)
  const initialScaleRef = useRef({ x: 1, y: 1, z: 1 })
  const previousRightXRef = useRef(null)
  const previousRightYRef = useRef(null)
  const movementOffsetRef = useRef(null)
  const extrudeAxisRef = useRef('y')
  const initialHandZRef = useRef(null)
  const initialHandYRef = useRef(null)
  const rotationAxisRef = useRef('y')
  const initialRotationRef = useRef({ x: 0, y: 0, z: 0 })
  const initialRotationHandYRef = useRef(null)
  const currentRotationRef = useRef({ x: 0, y: 0, z: 0 })
  const lastUiUpdateRef = useRef(0)
  const victoryTimerRef = useRef(null)
  const shapeGestureRef = useRef(null)
  const shapeTimerRef = useRef(null)
  const lockTimerRef = useRef(null)
  const isShapeLockedRef = useRef(false)
  const [lockCountdown, setLockCountdown] = useState(null)
  const [switchCountdown, setSwitchCountdown] = useState(null)
  const [gestureState, setGestureState] = useState({ left: null, right: null })
  const [handCursor, setHandCursor] = useState(null)

  const config = useMemo(() => ({
    size: 320,
    cameraWidth: 640,
    cameraHeight: 480,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    jointRadius: 5,
    jointColor: "#00ffcc",
    boneColor: "#00ffcc",
    boneWidth: 2,
  }), [])

  const convertToWorldPos = useCallback((x, y) => ({
    x: (0.5 - x) * 6,
    y: -(y - 0.5) * 4,
    z: 0,
  }), [])

  const drawJoint = useCallback((ctx, x, y) => {
    ctx.beginPath()
    ctx.arc(x, y, config.jointRadius, 0, Math.PI * 2)
    ctx.fillStyle = config.jointColor
    ctx.fill()
  }, [config])

  const drawBone = useCallback((ctx, x1, y1, x2, y2) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = config.boneColor
    ctx.lineWidth = config.boneWidth
    ctx.stroke()
  }, [config])

  const interactionModeRef = useRef(interactionMode)

  useEffect(() => {
    interactionModeRef.current = interactionMode
  }, [interactionMode])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    hands.setOptions({
      maxNumHands: config.maxNumHands,
      modelComplexity: config.modelComplexity,
      minDetectionConfidence: config.minDetectionConfidence,
      minTrackingConfidence: config.minTrackingConfidence,
    })

    hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!results.multiHandLandmarks || !results.multiHandedness) return

      const state = { left: null, right: null }
      let isVictoryDetected = false

      results.multiHandLandmarks.forEach((landmarks, index) => {
        const type = results.multiHandedness[index].label
        const gesture = detectGestures(landmarks)

        if (gesture.isVictory) isVictoryDetected = true

        if (type === "Left") {
          state.right = gesture
        }
        if (type === "Right") {
          state.left = gesture
        }
        if (type === "Right" && interactionModeRef.current === 'COLOR' && !gesture.isPinching) {
          const indexTip = landmarks[8]
          state.cursor = { x: 1 - indexTip.x, y: indexTip.y }
        }

        landmarks.forEach((point) => { drawJoint(ctx, point.x * canvas.width, point.y * canvas.height) })

        CONNECTIONS.forEach(([start, end]) => {
          const p1 = landmarks[start]
          const p2 = landmarks[end]
          drawBone(ctx, p1.x * canvas.width, p1.y * canvas.height, p2.x * canvas.width, p2.y * canvas.height)
        })
      })

      const now = performance.now()
      if (!lastUiUpdateRef.current || now - lastUiUpdateRef.current > 30) {
        setGestureState(state)
        if (state.cursor) setHandCursor(state.cursor)
        lastUiUpdateRef.current = now
      }

      if (isVictoryDetected && !state.left?.isVictory) {
        if (!victoryTimerRef.current) {
          victoryTimerRef.current = performance.now()
        } else {
          const elapsed = performance.now() - victoryTimerRef.current
          const remaining = Math.ceil((3000 - elapsed) / 1000)

          setSwitchCountdown(remaining)


          if (elapsed > 3000) {
            let nextMode = 'MOVE'
            const prev = interactionModeRef.current
            if (prev === 'MOVE') nextMode = 'ROTATE'
            else if (prev === 'ROTATE') nextMode = 'SCALE'
            else if (prev === 'SCALE') nextMode = 'EXTRUDE'
            else if (prev === 'EXTRUDE') nextMode = 'COLOR'

            dispatch({ type: 'SET_INTERACTION_MODE', payload: nextMode })

            victoryTimerRef.current = null
            initialDistanceRef.current = null
            initialHandZRef.current = null
            previousRightXRef.current = null
            previousRightYRef.current = null
            movementOffsetRef.current = null
          }
        }
      } else {
        victoryTimerRef.current = null
      }

      if (state.left) {
        if (state.left.isThumbsUp) {
          if (!lockTimerRef.current) {
            lockTimerRef.current = performance.now()
          } else {
            const elapsed = performance.now() - lockTimerRef.current
            const remaining = Math.ceil((3000 - elapsed) / 1000)
            setLockCountdown(remaining)

            if (elapsed > 3000) {
              isShapeLockedRef.current = true
              dispatch({ type: 'SET_SHAPE_LOCKED', payload: true })
              lockTimerRef.current = null
              setLockCountdown(null)
            }
          }
        } else {
          lockTimerRef.current = null
          setLockCountdown((prev) => prev !== null ? null : prev)
        }

        if (!isShapeLockedRef.current) {
          const count = state.left.fingerCount
          let targetShape = null
          if (count === 1) targetShape = 'CUBE'
          else if (count === 2) targetShape = 'SPHERE'
          else if (count === 3) targetShape = 'CYLINDER'
          else if (count === 4) targetShape = 'CONE'
          else if (count === 5) targetShape = 'TORUS'

          if (targetShape) {
            if (shapeGestureRef.current !== targetShape) {
              shapeGestureRef.current = targetShape
              shapeTimerRef.current = performance.now()
            } else if (performance.now() - shapeTimerRef.current > 1000) {
              dispatch({ type: 'SET_SHAPE', payload: targetShape })
              shapeGestureRef.current = null
              shapeTimerRef.current = performance.now() + 2000
            }
          } else {
            shapeGestureRef.current = null
            shapeTimerRef.current = null
          }
        }
      } else {
        shapeGestureRef.current = null
        shapeTimerRef.current = null
        lockTimerRef.current = null
        setLockCountdown((prev) => prev !== null ? null : prev)
      }


      if (interactionModeRef.current === 'MOVE') {
        if (state.right && !state.right.isFist && (state.right.isOpenPalm || state.right.isPinching)) {
          const handPos = convertToWorldPos(state.right.handCenter.x, state.right.handCenter.y)

          if (!movementOffsetRef.current) {
            const currentPos = cubeStateRef.current ? cubeStateRef.current.position : { x: 0, y: 0, z: 0 }
            movementOffsetRef.current = {
              x: currentPos.x - handPos.x,
              y: currentPos.y - handPos.y,
            }
          }

          const newPos = {
            x: handPos.x + movementOffsetRef.current.x,
            y: handPos.y + movementOffsetRef.current.y,
            z: 0
          }

          cubeStateRef.current.position = newPos
        } else {
          movementOffsetRef.current = null
        }
      } else {
        movementOffsetRef.current = null
      }

      if (state.left?.isPinching && state.right?.isPinching) {
        const lx = state.left.handCenter.x
        const ly = state.left.handCenter.y
        const lz = state.left.handCenter.z
        const rx = state.right.handCenter.x
        const ry = state.right.handCenter.y
        const rz = state.right.handCenter.z


        if (interactionModeRef.current === 'SCALE') {
          const dx = lx - rx
          const dy = ly - ry
          const dz = lz - rz
          const currentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (!initialDistanceRef.current) {
            initialDistanceRef.current = currentDistance
            initialScaleRef.current = cubeStateRef.current ? { ...cubeStateRef.current.scale } : { x: 1, y: 1, z: 1 }
          } else {
            const scaleFactor = currentDistance / initialDistanceRef.current

            const newScale = {
              x: Math.min(Math.max(initialScaleRef.current.x * scaleFactor, 0.2), 5),
              y: Math.min(Math.max(initialScaleRef.current.y * scaleFactor, 0.2), 5),
              z: Math.min(Math.max(initialScaleRef.current.z * scaleFactor, 0.2), 5)
            }
            cubeStateRef.current.scale = newScale
          }
        }
        else {
          initialDistanceRef.current = null
        }
      } else {
        initialDistanceRef.current = null
      }


      if (interactionModeRef.current === 'EXTRUDE') {
        if (state.left) {
          const count = state.left.fingerCount
          if (count === 1) extrudeAxisRef.current = 'x'
          if (count === 3) extrudeAxisRef.current = 'y'
          if (count === 4) extrudeAxisRef.current = 'z'
        }

        if (state.right?.isPinching) {
          const currentY = state.right.handCenter.y

          if (initialHandYRef.current === null) {
            initialHandYRef.current = currentY
            initialScaleRef.current = cubeStateRef.current ? { ...cubeStateRef.current.scale } : { x: 1, y: 1, z: 1 }
          } else {
            const delta = (initialHandYRef.current - currentY) * 8

            const axis = extrudeAxisRef.current
            const baseVal = initialScaleRef.current[axis]
            const newVal = Math.max(0.2, Math.min(baseVal + delta, 5))

            const fullScaleState = cubeStateRef.current ? { ...cubeStateRef.current.scale } : { x: 1, y: 1, z: 1 }
            fullScaleState[axis] = newVal

            cubeStateRef.current.scale = fullScaleState
          }
        } else {
          initialHandYRef.current = null
        }
      }




      if (interactionModeRef.current === 'ROTATE') {
        if (state.left) {
          const count = state.left.fingerCount
          if (count === 1) rotationAxisRef.current = 'x'
          if (count === 3) rotationAxisRef.current = 'y'
          if (count === 4) rotationAxisRef.current = 'z'
        }

        if (state.right?.isPinching) {
          const currentY = state.right.handCenter.y

          if (initialRotationHandYRef.current === null) {
            initialRotationHandYRef.current = currentY
            initialRotationRef.current = { ...currentRotationRef.current }
          } else {
            const delta = (initialRotationHandYRef.current - currentY) * 10
            const axis = rotationAxisRef.current

            currentRotationRef.current[axis] = initialRotationRef.current[axis] + delta
            cubeStateRef.current.rotation = { ...currentRotationRef.current }
          }
        } else {
          initialRotationHandYRef.current = null
        }
      }

    })

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video })
      },
      width: config.cameraWidth,
      height: config.cameraHeight,
    })

    camera.start()

    return () => {
      camera.stop()
      hands.close()
    }
  }, [config, drawJoint, drawBone, convertToWorldPos])


  const videoStyle = useMemo(() => ({
    position: "absolute",
    top: 10,
    right: 10,
    width: config.size,
    height: config.size * 0.75,
    transform: "scaleX(-1)",
    borderRadius: 8,
  }), [config.size])

  const canvasStyle = useMemo(() => ({
    position: "absolute",
    top: 10,
    right: 10,
    width: config.size,
    height: config.size * 0.75,
    pointerEvents: "none",
    transform: "scaleX(-1)",
  }), [config.size])

  const panelStyle = useMemo(() => ({
    position: "absolute",
    top: config.size * 0.75 + 20,
    right: 10,
    width: config.size,
    background: "rgba(0,0,0,0.75)",
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
  }), [config.size])

  return (
    <>
      <video ref={videoRef} autoPlay playsInline style={videoStyle} />
      <canvas ref={canvasRef} width={config.cameraWidth} height={config.cameraHeight} style={canvasStyle} />

      <div style={panelStyle}>
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
          <strong>MODE: <span style={{ color: '#00ffcc' }}>{interactionMode}</span></strong>
          {(interactionMode === 'EXTRUDE' || interactionMode === 'ROTATE') && (
            <div style={{ marginTop: 5 }}>
              AXIS: <span style={{
                color: (interactionMode === 'EXTRUDE' ? extrudeAxisRef.current : rotationAxisRef.current) === 'x' ? '#ff4444' :
                  (interactionMode === 'EXTRUDE' ? extrudeAxisRef.current : rotationAxisRef.current) === 'y' ? '#44ff44' : '#4444ff',
                fontWeight: 'bold'
              }}>
                {(interactionMode === 'EXTRUDE' ? extrudeAxisRef.current : rotationAxisRef.current).toUpperCase()}
              </span>
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                Left Hand: 1=X, 3=Y, 4=Z
              </div>
            </div>
          )}
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5 }}>
            Hold ✌️ (Victory) for 3s to switch
          </div>
        </div>

        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
          <strong>SHAPE: <span style={{ color: isShapeLocked ? '#ff0055' : '#00ffcc' }}>{isShapeLocked ? "LOCKED 🔒" : "ACTIVE ✨"}</span></strong>
          {!isShapeLocked && (
            <div style={{ fontSize: 10, opacity: 0.7 }}>
              Hold 👍 (Thumbs Up) for 3s to lock
              {lockCountdown && <span style={{ marginLeft: 5, color: '#ffcc00', fontWeight: 'bold' }}>{lockCountdown}...</span>}
            </div>
          )}
        </div>

        <strong>Right Hand</strong>
        <div>Open: {gestureState.right?.isOpenPalm ? "✅" : "❌"}</div>
        <div>Fist: {gestureState.right?.isFist ? "✅" : "❌"}</div>
        <div>Pinch: {gestureState.right?.isPinching ? "✅" : "❌"}</div>
        <div>Victory: {gestureState.right?.isVictory ? "✅" : "❌"}</div>

        <hr style={{ opacity: 0.3 }} />

        <strong>Left Hand (Shape)</strong>
        <div>Fingers: {gestureState.left?.fingerCount ?? 0}</div>
        <div>Thumbs Up: {gestureState.left?.isThumbsUp ? "✅" : "❌"}</div>

      </div>

      {interactionMode === 'COLOR' && (
        <ColorPicker
          interactionMode={interactionMode}
          onColorChange={(c) => dispatch({ type: 'SET_COLOR', payload: c })}
          handCursor={handCursor}
        />
      )}
    </>
  )
}

