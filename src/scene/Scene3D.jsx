import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { AppContext } from '../context/AppProvider'
import { SceneManager } from './SceneManager'

const SMOOTH_POS = 0.18
const SMOOTH_ROT = 0.12
const SMOOTH_SCALE = 0.15

export default function Scene3D() {
  const { state, dispatch } = useContext(AppContext)
  const { scene: sceneState, projection, guidesEnabled } = state
  const mountRef = useRef(null)
  const runtimeRef = useRef(null)
  const objectsRef = useRef(sceneState.objects)
  const selectedIdRef = useRef(sceneState.selectedObjectId)
  const transformBeforeRef = useRef(null)

  useEffect(() => {
    objectsRef.current = sceneState.objects
    selectedIdRef.current = sceneState.selectedObjectId
  }, [sceneState.objects, sceneState.selectedObjectId])

  const sceneConfig = useMemo(() => ({
    backgroundColor: 0x0b0b0b,
    cameraFov: 70,
    cameraNear: 0.1,
    cameraFar: 100,
    cameraZ: 5,
    lightColor: 0xffffff,
    lightIntensity: 1,
    lightPosition: { x: 5, y: 5, z: 5 },
  }), [])

  const selectFromPointer = useCallback((event) => {
    const runtime = runtimeRef.current
    if (!runtime) return
    const rect = runtime.renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    runtime.raycaster.setFromCamera(pointer, runtime.camera)
    const hits = runtime.raycaster.intersectObjects([...runtime.manager.meshes.values()])
    if (hits[0]?.object?.userData.objectId) {
      dispatch({ type: 'SELECT_OBJECT', payload: hits[0].object.userData.objectId })
    }
  }, [dispatch])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(sceneConfig.backgroundColor)
    const aspect = (mount.clientWidth || window.innerWidth) / (mount.clientHeight || window.innerHeight)
    const camera = projection === 'orthographic'
      ? new THREE.OrthographicCamera(-6 * aspect, 6 * aspect, 6, -6, sceneConfig.cameraNear, sceneConfig.cameraFar)
      : new THREE.PerspectiveCamera(sceneConfig.cameraFov, aspect, sceneConfig.cameraNear, sceneConfig.cameraFar)
    camera.position.z = sceneConfig.cameraZ

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.screenSpacePanning = true
    const transformControls = new TransformControls(camera, renderer.domElement)
    const transformHelper = transformControls.getHelper()
    const manager = new SceneManager(scene)
    const raycaster = new THREE.Raycaster()
    const resize = () => {
      const width = mount.clientWidth || window.innerWidth
      const height = mount.clientHeight || window.innerHeight
      if (camera.isPerspectiveCamera) camera.aspect = width / height
      else {
        camera.left = -6 * (width / height)
        camera.right = 6 * (width / height)
      }
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    resize()
    mount.appendChild(renderer.domElement)
    window.addEventListener('resize', resize)
    renderer.domElement.addEventListener('pointerdown', selectFromPointer)

    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value
    })
    transformControls.addEventListener('mouseDown', () => {
      const object = objectsRef.current.find((item) => item.id === selectedIdRef.current)
      transformBeforeRef.current = object ? {
        ...object,
        position: { ...object.position },
        rotation: { ...object.rotation },
        scale: { ...object.scale },
        quaternion: { ...object.quaternion },
      } : null
    })
    transformControls.addEventListener('objectChange', () => {
      const mesh = transformControls.object
      const id = mesh?.userData.objectId
      if (!mesh || !id) return
      const rotation = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
      dispatch({
        type: 'LIVE_UPDATE_OBJECT',
        payload: {
          id,
          changes: {
            position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
            rotation,
            quaternion: { x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w },
            scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
          },
        },
      })
    })
    transformControls.addEventListener('mouseUp', () => {
      const id = transformControls.object?.userData.objectId
      if (id && transformBeforeRef.current) dispatch({ type: 'COMMIT_TRANSFORM', payload: { id, before: transformBeforeRef.current } })
      transformBeforeRef.current = null
    })

    const light = new THREE.DirectionalLight(sceneConfig.lightColor, sceneConfig.lightIntensity)
    light.position.set(sceneConfig.lightPosition.x, sceneConfig.lightPosition.y, sceneConfig.lightPosition.z)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    grid.rotation.x = Math.PI / 2
    scene.add(grid)
    scene.add(new THREE.AxesHelper(2))
    const guideGroup = new THREE.Group()
    const guideMaterial = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.35 })
    for (let index = 0; index < 3; index += 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
      guideGroup.add(new THREE.Line(geometry, guideMaterial))
    }
    guideGroup.visible = guidesEnabled
    scene.add(guideGroup)

    scene.add(transformHelper)
    runtimeRef.current = { scene, camera, renderer, controls, transformControls, manager, raycaster, guideGroup }
    manager.sync(objectsRef.current)
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      objectsRef.current.forEach((object) => {
        const mesh = manager.getMesh(object.id)
        if (!mesh) return
        mesh.position.x += (object.position.x - mesh.position.x) * SMOOTH_POS
        mesh.position.y += (object.position.y - mesh.position.y) * SMOOTH_POS
        mesh.position.z += (object.position.z - mesh.position.z) * SMOOTH_POS
        mesh.quaternion.slerp(new THREE.Quaternion(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w), SMOOTH_ROT)
        mesh.scale.x += (object.scale.x - mesh.scale.x) * SMOOTH_SCALE
        mesh.scale.y += (object.scale.y - mesh.scale.y) * SMOOTH_SCALE
        mesh.scale.z += (object.scale.z - mesh.scale.z) * SMOOTH_SCALE
      })
      const selected = objectsRef.current.find((object) => object.id === selectedIdRef.current)
      if (selected) {
        const { x, y, z } = selected.position
        const guidePoints = [
          [new THREE.Vector3(x - 10, y, z), new THREE.Vector3(x + 10, y, z)],
          [new THREE.Vector3(x, y - 10, z), new THREE.Vector3(x, y + 10, z)],
          [new THREE.Vector3(x, y, z - 10), new THREE.Vector3(x, y, z + 10)],
        ]
        guideGroup.children.forEach((line, index) => line.geometry.setFromPoints(guidePoints[index]))
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      renderer.domElement.removeEventListener('pointerdown', selectFromPointer)
      window.removeEventListener('resize', resize)
      manager.dispose()
      transformControls.dispose()
      scene.remove(transformHelper)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      runtimeRef.current = null
    }
  }, [sceneConfig, selectFromPointer, dispatch, projection])

  useEffect(() => {
    if (!runtimeRef.current) return
    runtimeRef.current.guideGroup.visible = guidesEnabled
    const { transformControls } = runtimeRef.current
    runtimeRef.current.manager.sync(sceneState.objects)
    const selectedMesh = runtimeRef.current.manager.getMesh(sceneState.selectedObjectId)
    if (selectedMesh) transformControls.attach(selectedMesh)
    else transformControls.detach()
    transformControls.setMode(state.gizmoMode)
    transformControls.setTranslationSnap(state.snapEnabled ? state.gridSnap : null)
    transformControls.setRotationSnap(state.snapEnabled ? THREE.MathUtils.degToRad(state.rotationSnap) : null)
    transformControls.setScaleSnap(state.snapEnabled ? 0.1 : null)
    runtimeRef.current.manager.meshes.forEach((mesh, id) => {
      const selected = id === sceneState.selectedObjectId
      mesh.material.emissive?.set(selected ? 0x164a42 : 0x000000)
    })
  }, [sceneState.objects, sceneState.selectedObjectId, state.gizmoMode, state.snapEnabled, state.gridSnap, state.rotationSnap, guidesEnabled])

  useEffect(() => {
    if (!runtimeRef.current || !sceneState.selectedObjectId || !state.frameRequest) return
    const object = runtimeRef.current.manager.getMesh(sceneState.selectedObjectId)
    if (!object) return
    const { camera, controls } = runtimeRef.current
    controls.target.copy(object.position)
    camera.position.set(object.position.x + 3, object.position.y + 2, object.position.z + 5)
    if (camera.isOrthographicCamera) camera.zoom = 1.2
    camera.updateProjectionMatrix()
    controls.update()
  }, [sceneState.selectedObjectId, state.frameRequest])

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
}
