import { createContext, useReducer, useRef } from 'react'

const initialState = {
    currentShape: 'CUBE',
    color: '#00ffd5',
    interactionMode: 'MOVE',
    isShapeLocked: false,
}

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SHAPE':
            return { ...state, currentShape: action.payload }
        case 'SET_COLOR':
            return { ...state, color: action.payload }
        case 'SET_INTERACTION_MODE':
            return { ...state, interactionMode: action.payload }
        case 'SET_SHAPE_LOCKED':
            return { ...state, isShapeLocked: action.payload }
        default:
            return state
    }
}

export const AppContext = createContext()

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState)

    const cubeStateRef = useRef({
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }
    })

    return (
        <AppContext.Provider value={{ state, dispatch, cubeStateRef }}>
            {children}
        </AppContext.Provider>
    )
}
