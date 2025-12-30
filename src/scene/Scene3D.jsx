import { useEffect, useRef, useMemo, useCallback, useContext } from "react"
import * as THREE from "three"
import { AppContext } from "../context/AppProvider"

export default function Scene3D() {
  const { state, cubeStateRef } = useContext(AppContext)
  const { currentShape, color } = state
  const mountRef = useRef(null)
  const cubeRef = useRef(null)
  const sceneRef = useRef(null)

  const SMOOTH_POS = 0.18
  const SMOOTH_ROT = 0.12
  const SMOOTH_SCALE = 0.15

  const sceneConfig = useMemo(() => ({
    backgroundColor: 0x0b0b0b,
    cameraFov: 70,
    cameraNear: 0.1,
    cameraFar: 100,
    cameraZ: 5,
    cubeColor: 0x00ffd5,
    lightColor: 0xffffff,
    lightIntensity: 1,
    lightPosition: { x: 5, y: 5, z: 5 }
  }), [])

  const updateCube = useCallback(() => {
    if (!cubeRef.current || !cubeStateRef.current) return

    const mesh = cubeRef.current
    const target = cubeStateRef.current

    mesh.position.x += (target.position.x - mesh.position.x) * SMOOTH_POS
    mesh.position.y += (target.position.y - mesh.position.y) * SMOOTH_POS
    mesh.position.z += (target.position.z - mesh.position.z) * SMOOTH_POS

    mesh.rotation.x += (target.rotation.x - mesh.rotation.x) * SMOOTH_ROT
    mesh.rotation.y += (target.rotation.y - mesh.rotation.y) * SMOOTH_ROT
    mesh.rotation.z += (target.rotation.z - mesh.rotation.z) * SMOOTH_ROT

    mesh.scale.x += (target.scale.x - mesh.scale.x) * SMOOTH_SCALE
    mesh.scale.y += (target.scale.y - mesh.scale.y) * SMOOTH_SCALE
    mesh.scale.z += (target.scale.z - mesh.scale.z) * SMOOTH_SCALE
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(sceneConfig.backgroundColor)

    const camera = new THREE.PerspectiveCamera(
      sceneConfig.cameraFov,
      window.innerWidth / window.innerHeight,
      sceneConfig.cameraNear,
      sceneConfig.cameraFar
    )
    camera.position.z = sceneConfig.cameraZ

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mount.appendChild(renderer.domElement)

    const light = new THREE.DirectionalLight(
      sceneConfig.lightColor,
      sceneConfig.lightIntensity
    )
    light.position.set(
      sceneConfig.lightPosition.x,
      sceneConfig.lightPosition.y,
      sceneConfig.lightPosition.z
    )
    scene.add(light)

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    gridHelper.rotation.x = Math.PI / 2
    scene.add(gridHelper)

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      updateCube()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [sceneConfig, updateCube])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (cubeRef.current) {
      scene.remove(cubeRef.current)
      cubeRef.current.geometry.dispose()
      cubeRef.current.material.dispose()
    }

    let geometry
    switch (currentShape) {
      case 'SPHERE':
        geometry = new THREE.SphereGeometry(0.7, 32, 32)
        break
      case 'CYLINDER':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32)
        break
      case 'CONE':
        geometry = new THREE.ConeGeometry(0.5, 1.5, 32)
        break
      case 'TORUS':
        geometry = new THREE.TorusGeometry(0.6, 0.2, 16, 100)
        break
      case 'CUBE':
      default:
        geometry = new THREE.BoxGeometry()
    }

    const material = new THREE.MeshStandardMaterial({ color: color || sceneConfig.cubeColor })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    cubeRef.current = mesh
  }, [currentShape, sceneConfig.cubeColor, color])

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
}
