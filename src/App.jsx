import { memo } from "react"
import HandTracker from "./handTracking/HandTracker"
import Scene3D from "./scene/Scene3D"
import { AppProvider } from "./context/AppProvider"

const MemoizedScene3D = memo(Scene3D)
const MemoizedHandTracker = memo(HandTracker)

export default function App() {
  return (
    <AppProvider>
      <MemoizedScene3D />
      <MemoizedHandTracker />
    </AppProvider>
  )
}
