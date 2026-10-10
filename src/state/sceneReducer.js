import { createObjectId, createSceneObject } from '../scene/ObjectFactory'
import * as THREE from 'three'

export const initialSceneState = {
  objects: [createSceneObject('CUBE', '#00ffd5', 'object-1')],
  selectedObjectId: 'object-1',
}

export function sceneReducer(state, action) {
  switch (action.type) {
    case 'ADD_OBJECT': {
      const object = action.payload?.object || createSceneObject(action.payload?.type, action.payload?.color)
      return { objects: [...state.objects, object], selectedObjectId: object.id }
    }
    case 'SELECT_OBJECT':
      return state.objects.some((object) => object.id === action.payload)
        ? { ...state, selectedObjectId: action.payload }
        : state
    case 'DUPLICATE_OBJECT': {
      const source = state.objects.find((object) => object.id === state.selectedObjectId)
      if (!source) return state
      const copy = {
        ...source,
        id: createObjectId(),
        position: { ...source.position, x: source.position.x + 0.6 },
        rotation: { ...source.rotation },
        scale: { ...source.scale },
        quaternion: { ...source.quaternion },
      }
      return { objects: [...state.objects, copy], selectedObjectId: copy.id }
    }
    case 'DELETE_OBJECT': {
      const id = action.payload || state.selectedObjectId
      const objects = state.objects.filter((object) => object.id !== id)
      const selectedObjectId = id === state.selectedObjectId
        ? objects[Math.max(0, state.objects.findIndex((object) => object.id === id) - 1)]?.id || objects[0]?.id || null
        : state.selectedObjectId
      return { objects, selectedObjectId }
    }
    case 'UPDATE_OBJECT':
    case 'LIVE_UPDATE_OBJECT':
      {
        const changes = action.payload.changes
        const normalizedChanges = changes.rotation
          ? { ...changes, quaternion: (() => {
            const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(changes.rotation.x, changes.rotation.y, changes.rotation.z))
            return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }
          })() }
          : changes
      return {
        ...state,
        objects: state.objects.map((object) => object.id === action.payload.id
          ? { ...object, ...normalizedChanges }
          : object),
      }
      }
    case 'UPDATE_SELECTED_OBJECT':
      return sceneReducer(state, { type: 'UPDATE_OBJECT', payload: { id: state.selectedObjectId, changes: action.payload } })
    default:
      return state
  }
}
