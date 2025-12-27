import { useState, useCallback, memo, useRef } from "react"
import HandTracker from "./handTracking/HandTracker"
import Scene3D from "./scene/Scene3D"

const MemoizedScene3D = memo(Scene3D)
const MemoizedHandTracker = memo(HandTracker)

export default function App() {
  const cubeStateRef = useRef({
    position: { x: 0, y: 0, z: 0 },
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 }
  })

  const handleMove = useCallback((pos) => {
    cubeStateRef.current.position = pos
  }, [])

  const handleScale = useCallback((scale) => {
    cubeStateRef.current.scale = scale
  }, [])

  const handleRotate = useCallback((rotate) => {
    cubeStateRef.current.rotation = rotate
  }, [])

  return (
    <>
      <MemoizedScene3D cubeStateRef={cubeStateRef} />
      <MemoizedHandTracker onMove={handleMove} onScale={handleScale} onRotate={handleRotate} cubeStateRef={cubeStateRef} />
    </>
  )
}
