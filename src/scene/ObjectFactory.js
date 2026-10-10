import * as THREE from 'three'

export const SHAPES = ['CUBE', 'SPHERE', 'CYLINDER', 'CONE', 'TORUS']

export function createObjectId() {
  return `object-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSceneObject(type = 'CUBE', color = '#00ffd5', id = createObjectId()) {
  return {
    id,
    type,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    color,
  }
}

export function createGeometry(type) {
  switch (type) {
    case 'SPHERE': return new THREE.SphereGeometry(0.7, 32, 32)
    case 'CYLINDER': return new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32)
    case 'CONE': return new THREE.ConeGeometry(0.5, 1.5, 32)
    case 'TORUS': return new THREE.TorusGeometry(0.6, 0.2, 16, 100)
    case 'CUBE':
    default: return new THREE.BoxGeometry()
  }
}

export function createMesh(object) {
  const mesh = new THREE.Mesh(
    createGeometry(object.type),
    new THREE.MeshStandardMaterial({ color: object.color })
  )
  mesh.userData.objectId = object.id
  mesh.userData.objectType = object.type
  return mesh
}

export function disposeMesh(mesh) {
  mesh.geometry.dispose()
  if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose())
  else mesh.material.dispose()
}
