import { createContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { initialSceneState, sceneReducer } from '../state/sceneReducer'

const initialState = {
    interactionMode: 'MOVE',
    gizmoMode: 'translate',
    snapEnabled: true,
    gridSnap: 0.25,
    rotationSnap: 15,
    projection: 'perspective',
    guidesEnabled: true,
    frameRequest: 0,
    scene: initialSceneState,
}

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SHAPE':
            return { ...state, scene: sceneReducer(state.scene, { type: 'UPDATE_SELECTED_OBJECT', payload: { type: action.payload } }) }
        case 'SET_COLOR':
            return { ...state, scene: sceneReducer(state.scene, { type: 'UPDATE_SELECTED_OBJECT', payload: { color: action.payload } }) }
        case 'SET_INTERACTION_MODE':
            return { ...state, interactionMode: action.payload }
        case 'SET_GIZMO_MODE':
            return { ...state, gizmoMode: action.payload }
        case 'SET_SNAP_SETTINGS':
            return { ...state, ...action.payload }
        case 'SET_PROJECTION':
            return { ...state, projection: action.payload }
        case 'SET_GUIDES_ENABLED':
            return { ...state, guidesEnabled: action.payload }
        case 'FRAME_SELECTED':
            return { ...state, frameRequest: state.frameRequest + 1 }
        case 'ADD_OBJECT':
        case 'SELECT_OBJECT':
        case 'DUPLICATE_OBJECT':
        case 'DELETE_OBJECT':
        case 'UPDATE_OBJECT':
        case 'UPDATE_SELECTED_OBJECT':
        case 'LIVE_UPDATE_OBJECT':
        case 'COMMIT_TRANSFORM':
            return { ...state, scene: sceneReducer(state.scene, action) }
        default:
            return state
    }
}

const cloneObject = (object) => object ? {
    ...object,
    position: { ...object.position },
    rotation: { ...object.rotation },
    scale: { ...object.scale },
    quaternion: { ...object.quaternion },
} : null

const historyReducer = (history, action) => {
    if (action.type === 'UNDO' && history.past.length) {
        const previous = history.past[history.past.length - 1]
        return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] }
    }
    if (action.type === 'REDO' && history.future.length) {
        const next = history.future[0]
        return { past: [...history.past, history.present], present: next, future: history.future.slice(1) }
    }

    if (action.type === 'COMMIT_TRANSFORM') {
        const { id, before } = action.payload
        if (!id || !before) return history
        const previous = appReducer(history.present, { type: 'UPDATE_OBJECT', payload: { id, changes: cloneObject(before) } })
        return { past: [...history.past, previous], present: history.present, future: [] }
    }

    const next = appReducer(history.present, action)
    if (next === history.present) return history
    if (['SET_GIZMO_MODE', 'SET_SNAP_SETTINGS', 'FRAME_SELECTED', 'SET_PROJECTION', 'SET_GUIDES_ENABLED', 'SET_INTERACTION_MODE'].includes(action.type)) {
        return { ...history, present: next }
    }
    if (action.type === 'LIVE_UPDATE_OBJECT') return { ...history, present: next }
    return { past: [...history.past, history.present], present: next, future: [] }
}

export const AppContext = createContext()

export const AppProvider = ({ children }) => {
    const [history, dispatch] = useReducer(historyReducer, { past: [], present: initialState, future: [] })
    const state = history.present

    const selectedObjectRef = useRef(null)
    const selectedObject = state.scene.objects.find((object) => object.id === state.scene.selectedObjectId) || null

    useEffect(() => {
        selectedObjectRef.current = selectedObject
    }, [selectedObject])

    const publicState = useMemo(() => ({
        ...state,
        currentShape: selectedObject?.type || 'CUBE',
        color: selectedObject?.color || '#00ffd5',
        selectedObject,
    }), [state, selectedObject])

    return (
        <AppContext.Provider value={{ state: publicState, dispatch, selectedObjectRef, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }}>
            {children}
        </AppContext.Provider>
    )
}
