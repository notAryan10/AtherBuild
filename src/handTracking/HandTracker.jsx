import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Hands } from "@mediapipe/hands"
import { Camera } from "@mediapipe/camera_utils"
import { detectGestures } from "./gestureMath"

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export default function HandTracker({ onMove, onScale, onRotate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const initialDistanceRef = useRef(null)
  const initialScaleRef = useRef(1)
  const previousRightXRef = useRef(null)
  const previousRightYRef = useRef(null)

  const currentRotationRef = useRef({ x: 0, y: 0, z: 0 })
  const lastUiUpdateRef = useRef(0)

  const [interactionMode, setInteractionMode] = useState('ROTATE')
  const victoryTimerRef = useRef(null)
  const [switchCountdown, setSwitchCountdown] = useState(null)
  const [gestureState, setGestureState] = useState({ left: null, right: null })

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
    x: (x - 0.5) * 6,
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
        landmarks.forEach((point) => { drawJoint(ctx, point.x * canvas.width, point.y * canvas.height) })

        CONNECTIONS.forEach(([start, end]) => {
          const p1 = landmarks[start]
          const p2 = landmarks[end]
          drawBone(ctx, p1.x * canvas.width, p1.y * canvas.height, p2.x * canvas.width, p2.y * canvas.height)
        })
      })

      const now = performance.now()
      if (!lastUiUpdateRef.current || now - lastUiUpdateRef.current > 100) {
        setGestureState(state)
        lastUiUpdateRef.current = now
      }

      if (isVictoryDetected) {
        if (!victoryTimerRef.current) {
          victoryTimerRef.current = performance.now()
        } else {
          const elapsed = performance.now() - victoryTimerRef.current
          const remaining = Math.ceil((3000 - elapsed) / 1000)

          if (remaining !== switchCountdown) {
            setSwitchCountdown(remaining)
          }

          if (elapsed > 2000) {
            setInteractionMode(prev => prev === 'ROTATE' ? 'SCALE' : 'ROTATE')
            victoryTimerRef.current = null
            initialDistanceRef.current = null
            previousRightXRef.current = null
            previousRightYRef.current = null
          }
        }
      } else {
        victoryTimerRef.current = null
      }


      if (state.right && !state.right.isFist && (state.right.isOpenPalm || state.right.isPinching)) {
        const { x, y } = state.right.handCenter
        onMove(convertToWorldPos(x, y))
      }

      if (state.left?.isPinching && state.right?.isPinching) {
        const lx = state.left.handCenter.x
        const ly = state.left.handCenter.y
        const lz = state.left.handCenter.z
        const rx = state.right.handCenter.x
        const ry = state.right.handCenter.y
        const rz = state.right.handCenter.z

        if (interactionMode === 'SCALE') {
          const dx = lx - rx
          const dy = ly - ry
          const dz = lz - rz
          const currentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (!initialDistanceRef.current) {
            initialDistanceRef.current = currentDistance
            initialScaleRef.current = 1
          } else {
            const scaleFactor = currentDistance / initialDistanceRef.current
            const newScale = Math.min(Math.max(scaleFactor, 0.2), 4)
            onScale(newScale)
          }
        }

        else {
          initialDistanceRef.current = null
        }
      } else {
        initialDistanceRef.current = null
      }


      if (interactionMode === 'ROTATE') {
        if (state.right) {
          const rx = state.right.handCenter.x
          const ry = state.right.handCenter.y

          if (!state.right.isFist) {
            if (state.left?.isPinching && !state.right?.isPinching) {

              if (previousRightXRef.current === null) previousRightXRef.current = rx
              if (previousRightYRef.current === null) previousRightYRef.current = ry

              const dx = rx - previousRightXRef.current
              const dy = ry - previousRightYRef.current

              currentRotationRef.current.y += dx * 5
              currentRotationRef.current.x += dy * 5

              onRotate({ ...currentRotationRef.current })

              previousRightXRef.current = rx
              previousRightYRef.current = ry


            } else if (state.right?.isPinching && !state.left?.isPinching) {

              if (previousRightXRef.current === null) previousRightXRef.current = rx

              const dx = rx - previousRightXRef.current

              currentRotationRef.current.z += dx * 5

              onRotate({ ...currentRotationRef.current })

              previousRightXRef.current = rx

              previousRightYRef.current = null

            } else {
              previousRightXRef.current = null
              previousRightYRef.current = null

            }
          } else {
            previousRightXRef.current = null
            previousRightYRef.current = null

          }
        }
      } else {
        previousRightXRef.current = null
        previousRightYRef.current = null

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
  }, [config, drawJoint, drawBone, convertToWorldPos, onMove, onScale, onRotate, interactionMode])

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
          <div style={{ fontSize: 10, opacity: 0.7 }}>
            Hold ✌️ (Victory) for 2s to switch
          </div>
        </div>

        <strong>Right Hand</strong>
        <div>Open: {gestureState.right?.isOpenPalm ? "✅" : "❌"}</div>
        <div>Fist: {gestureState.right?.isFist ? "✅" : "❌"}</div>
        <div>Pinch: {gestureState.right?.isPinching ? "✅" : "❌"}</div>
        <div>Victory: {gestureState.right?.isVictory ? "✅" : "❌"}</div>

        <hr style={{ opacity: 0.3 }} />

        <strong>Left Hand</strong>
        <div>Pinch: {gestureState.left?.isPinching ? "✅" : "❌"}</div>
        <div>Victory: {gestureState.left?.isVictory ? "✅" : "❌"}</div>
      </div>
    </>
  )
}
