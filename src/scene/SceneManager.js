import { createMesh, disposeMesh } from './ObjectFactory'

export class SceneManager {
  constructor(scene) {
    this.scene = scene
    this.meshes = new Map()
  }

  sync(objects) {
    const activeIds = new Set(objects.map((object) => object.id))

    this.meshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh)
        disposeMesh(mesh)
        this.meshes.delete(id)
      }
    })

    objects.forEach((object) => {
      const current = this.meshes.get(object.id)
      if (!current || current.userData.objectType !== object.type) {
        if (current) {
          this.scene.remove(current)
          disposeMesh(current)
        }
        const mesh = createMesh(object)
        this.meshes.set(object.id, mesh)
        this.scene.add(mesh)
      }

      const mesh = this.meshes.get(object.id)
      mesh.material.color.set(object.color)
      mesh.position.set(object.position.x, object.position.y, object.position.z)
      mesh.quaternion.set(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w)
      mesh.scale.set(object.scale.x, object.scale.y, object.scale.z)
    })
  }

  getMesh(id) {
    return this.meshes.get(id)
  }

  dispose() {
    this.meshes.forEach((mesh) => disposeMesh(mesh))
    this.meshes.clear()
  }
}
