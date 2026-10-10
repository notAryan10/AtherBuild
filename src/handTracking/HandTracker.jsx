import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Hands } from "@mediapipe/hands"
import * as THREE from "three"
import { Camera } from "@mediapipe/camera_utils"
import { detectGestures } from "./gestureMath"
import ColorPicker from "../components/ColorPicker"
import InteractionHUD from "../components/InteractionHUD"
import CameraPanel from "../components/CameraPanel"
import { GestureController } from "./GestureController"
import { Calibration } from "./Calibration"
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
  const { state, dispatch, selectedObjectRef } = useContext(AppContext)
  const { interactionMode, snapEnabled, gridSnap, rotationSnap } = state

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
  const initialQuaternionRef = useRef(new THREE.Quaternion())
  const initialRotationHandYRef = useRef(null)
  const currentRotationRef = useRef({ x: 0, y: 0, z: 0 })
  const lastUiUpdateRef = useRef(0)
  const victoryTimerRef = useRef(null)
  const gestureControllerRef = useRef(new GestureController())
  const calibrationRef = useRef(new Calibration())
  const trackingPausedRef = useRef(false)
  const gestureBeforeRef = useRef(null)
  const [switchCountdown, setSwitchCountdown] = useState(null)
  const [cameraStatus, setCameraStatus] = useState(() => navigator.mediaDevices?.getUserMedia ? 'starting' : 'unsupported')
  const [gestureState, setGestureState] = useState({ left: null, right: null })
  const [gestureEvent, setGestureEvent] = useState(null)
  const [isTrackingPaused, setIsTrackingPaused] = useState(false)
  const [handCursor, setHandCursor] = useState(null)

  const config = useMemo(() => ({
    size: 320,
    cameraWidth: 640, cameraHeight: 480,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    jointRadius: 5,
    jointColor: "#b3ff00ff",
    boneColor: "#f200ffff",
    boneWidth: 2,
  }), [])

  const convertToWorldPos = useCallback((x, y) => {
    const calibrated = calibrationRef.current.adjust({ x, y, z: 0 })
    return {
      x: (0.5 - calibrated.x) * 6,
      y: -(calibrated.y - 0.5) * 4,
      z: calibrated.z,
    }
  }, [])

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

  const captureGestureTransform = useCallback(() => {
    const object = selectedObjectRef.current
    if (!object || gestureBeforeRef.current) return
    gestureBeforeRef.current = {
      ...object,
      position: { ...object.position },
      rotation: { ...object.rotation },
      scale: { ...object.scale },
      quaternion: { ...object.quaternion },
    }
  }, [selectedObjectRef])

  const commitGestureTransform = useCallback(() => {
    const before = gestureBeforeRef.current
    const object = selectedObjectRef.current
    if (before && object) dispatch({ type: 'COMMIT_TRANSFORM', payload: { id: object.id, before } })
    gestureBeforeRef.current = null
  }, [dispatch, selectedObjectRef])

  const dispatchLiveTransform = useCallback((changes) => {
    const object = selectedObjectRef.current
    if (object) dispatch({ type: 'LIVE_UPDATE_OBJECT', payload: { id: object.id, changes } })
  }, [dispatch, selectedObjectRef])

  const resetGestureRefs = useCallback(() => {
    initialDistanceRef.current = null
    initialHandZRef.current = null
    initialHandYRef.current = null
    previousRightXRef.current = null
    previousRightYRef.current = null
    movementOffsetRef.current = null
    initialRotationHandYRef.current = null
    victoryTimerRef.current = null
    gestureControllerRef.current.reset()
  }, [])

  const resetInteractionRefs = useCallback(() => {
    commitGestureTransform()
    resetGestureRefs()
    setSwitchCountdown(null)
  }, [commitGestureTransform, resetGestureRefs])

  useEffect(() => {
    interactionModeRef.current = interactionMode
    commitGestureTransform()
    resetGestureRefs()
  }, [interactionMode, commitGestureTransform, resetGestureRefs])

  useEffect(() => {
    trackingPausedRef.current = isTrackingPaused
  }, [isTrackingPaused])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (!navigator.mediaDevices?.getUserMedia) {
      return
    }

    const ctx = canvas.getContext("2d")
    const markReady = () => setCameraStatus('ready')
    const markFailed = () => setCameraStatus('error')
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('error', markFailed)

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

      if (!results.multiHandLandmarks?.length || !results.multiHandedness?.length) {
        resetInteractionRefs()
        setGestureState({ left: null, right: null })
        setCameraStatus((status) => status === 'ready' ? 'no-hand' : status)
        return
      }

      setCameraStatus('tracking')

      const state = { left: null, right: null }
      let isVictoryDetected = false
      let latestGestureEvent = null

      results.multiHandLandmarks.forEach((landmarks, index) => {
        const type = results.multiHandedness[index].label
        const gesture = detectGestures(landmarks)
        const stabilized = gestureControllerRef.current.update(type, gesture)
        const stableGesture = stabilized.gesture
        if (stabilized.events.length) latestGestureEvent = stabilized.events[stabilized.events.length - 1]

        if (gesture.isVictory) isVictoryDetected = true

        if (type === "Left") {
          state.right = stableGesture
        }
        if (type === "Right") {
          state.left = stableGesture
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
        if (latestGestureEvent) setGestureEvent(latestGestureEvent)
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

      if (interactionModeRef.current === 'MOVE') {
        if (state.right && !state.right.isFist && (state.right.isOpenPalm || state.right.isPinching)) {
          captureGestureTransform()
          const handPos = convertToWorldPos(state.right.handCenter.x, state.right.handCenter.y)

          if (!movementOffsetRef.current) {
            const currentPos = selectedObjectRef.current ? selectedObjectRef.current.position : { x: 0, y: 0, z: 0 }
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

          if (snapEnabled) {
            newPos.x = Math.round(newPos.x / gridSnap) * gridSnap
            newPos.y = Math.round(newPos.y / gridSnap) * gridSnap
          }

          dispatchLiveTransform({ position: newPos })
        } else {
          movementOffsetRef.current = null
          commitGestureTransform()
        }
      } else {
        commitGestureTransform()
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
            captureGestureTransform()
            initialDistanceRef.current = currentDistance
            initialScaleRef.current = selectedObjectRef.current ? { ...selectedObjectRef.current.scale } : { x: 1, y: 1, z: 1 }
          } else {
            const scaleFactor = currentDistance / initialDistanceRef.current
            const newScale = {
              x: Math.min(Math.max(initialScaleRef.current.x * scaleFactor, 0.2), 5),
              y: Math.min(Math.max(initialScaleRef.current.y * scaleFactor, 0.2), 5),
              z: Math.min(Math.max(initialScaleRef.current.z * scaleFactor, 0.2), 5)
            }
            dispatchLiveTransform({ scale: newScale })
          }
        }
        else {
          initialDistanceRef.current = null
        }
      } else {
        commitGestureTransform()
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
            captureGestureTransform()
            initialHandYRef.current = currentY
            initialScaleRef.current = selectedObjectRef.current ? { ...selectedObjectRef.current.scale } : { x: 1, y: 1, z: 1 }
          } else {
            const delta = (initialHandYRef.current - currentY) * 8

            const axis = extrudeAxisRef.current
            const baseVal = initialScaleRef.current[axis]
            const newVal = Math.max(0.2, Math.min(baseVal + delta, 5))

            const fullScaleState = selectedObjectRef.current ? { ...selectedObjectRef.current.scale } : { x: 1, y: 1, z: 1 }
            fullScaleState[axis] = newVal

            dispatchLiveTransform({ scale: fullScaleState })
          }
        } else {
          commitGestureTransform()
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
            captureGestureTransform()
            initialRotationHandYRef.current = currentY
            const currentQuat = selectedObjectRef.current?.quaternion ? new THREE.Quaternion(selectedObjectRef.current.quaternion.x, selectedObjectRef.current.quaternion.y, selectedObjectRef.current.quaternion.z, selectedObjectRef.current.quaternion.w) : new THREE.Quaternion()
            initialQuaternionRef.current.copy(currentQuat)
          } else {
            let delta = (initialRotationHandYRef.current - currentY) * 10
            if (snapEnabled) {
              const increment = THREE.MathUtils.degToRad(rotationSnap)
              delta = Math.round(delta / increment) * increment
            }
            const axisName = rotationAxisRef.current

            const axis = new THREE.Vector3(
              axisName === 'x' ? 1 : 0,
              axisName === 'y' ? 1 : 0,
              axisName === 'z' ? 1 : 0
            )

            const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, delta)
            const finalQuat = deltaQuat.multiply(initialQuaternionRef.current)

            const quaternion = {
              x: finalQuat.x,
              y: finalQuat.y,
              z: finalQuat.z,
              w: finalQuat.w
            }

            const euler = new THREE.Euler().setFromQuaternion(finalQuat)
            dispatchLiveTransform({
              quaternion,
              rotation: {
              x: euler.x,
              y: euler.y,
              z: euler.z
              }
            })
          }
        } else {
          commitGestureTransform()
          initialRotationHandYRef.current = null
        }
      }

    })

    const camera = new Camera(video, {
      onFrame: async () => {
        if (trackingPausedRef.current) return
        await hands.send({ image: video })
      },
      width: config.cameraWidth,
      height: config.cameraHeight,
    })

    try {
      camera.start()
    } catch {
      setCameraStatus('error')
    }

    return () => {
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('error', markFailed)
      resetInteractionRefs()
      camera.stop()
      hands.close()
    }
  }, [config, drawJoint, drawBone, convertToWorldPos, resetInteractionRefs, captureGestureTransform, commitGestureTransform, dispatchLiveTransform])


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

  return (
    <>
      <CameraPanel
        videoRef={videoRef}
        canvasRef={canvasRef}
        videoStyle={videoStyle}
        canvasStyle={canvasStyle}
        cameraWidth={config.cameraWidth}
        cameraHeight={config.cameraHeight}
        cameraStatus={isTrackingPaused ? 'paused' : cameraStatus}
        isPaused={isTrackingPaused}
        onTogglePause={() => setIsTrackingPaused((paused) => !paused)}
      />
      <InteractionHUD
        interactionMode={interactionMode}
        currentShape={state.currentShape}
        cameraStatus={cameraStatus}
        gestureState={gestureState}
        gestureEvent={gestureEvent}
        switchCountdown={switchCountdown}
        onRecalibrate={() => calibrationRef.current.calibrate(gestureState.right?.handCenter)}
      />
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
