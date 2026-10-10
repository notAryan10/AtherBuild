import { memo, useContext } from "react"
import HandTracker from "./handTracking/HandTracker"
import Scene3D from "./scene/Scene3D"
import { AppProvider } from "./context/AppProvider"
import SceneHierarchy from "./components/SceneHierarchy"
import InspectorPanel from "./components/InspectorPanel"
import ViewportToolbar from "./components/ViewportToolbar"
import { AppContext } from "./context/AppProvider"

const MemoizedScene3D = memo(Scene3D)
const MemoizedHandTracker = memo(HandTracker)

function EditorPanels() {
  const { state, dispatch, canUndo, canRedo } = useContext(AppContext)
  return (
    <>
      <ViewportToolbar state={state} dispatch={dispatch} canUndo={canUndo} canRedo={canRedo} />
      <SceneHierarchy
        objects={state.scene.objects}
        selectedObjectId={state.scene.selectedObjectId}
        dispatch={dispatch}
      />
      <InspectorPanel object={state.selectedObject} dispatch={dispatch} />
    </>
  )
}

function EditorViewport() {
  const { state } = useContext(AppContext)
  return <MemoizedScene3D key={state.projection} />
}

export default function App() {
  return (
    <AppProvider>
      <EditorViewport />
      <MemoizedHandTracker />
      <EditorPanels />
    </AppProvider>
  )
}
