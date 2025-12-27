import { useEffect, useRef, useMemo, useCallback } from "react"
import * as THREE from "three"

export default function Scene3D({ cubeStateRef }) {
    const mountRef = useRef(null)
    const cubeRef = useRef(null)

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
        if (cubeRef.current && cubeStateRef.current) {
            const state = cubeStateRef.current

            cubeRef.current.position.set(state.position.x, state.position.y, state.position.z)

            cubeRef.current.scale.set(state.scale, state.scale, state.scale)

            cubeRef.current.rotation.x = state.rotation.x
            cubeRef.current.rotation.y = state.rotation.y
            cubeRef.current.rotation.z = state.rotation.z
        }
    }, [cubeStateRef])


    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const scene = new THREE.Scene()
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

        const light = new THREE.DirectionalLight(sceneConfig.lightColor, sceneConfig.lightIntensity)
        light.position.set(
            sceneConfig.lightPosition.x,
            sceneConfig.lightPosition.y,
            sceneConfig.lightPosition.z
        )
        scene.add(light)

        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
        gridHelper.rotation.x = Math.PI / 2
        scene.add(gridHelper)

        const geometry = new THREE.BoxGeometry()
        const material = new THREE.MeshStandardMaterial({ color: sceneConfig.cubeColor })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)
        cubeRef.current = cube

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
            geometry.dispose()
            material.dispose()
            if (mount && renderer.domElement) {
                mount.removeChild(renderer.domElement)
            }
        }
    }, [sceneConfig, updateCube])

    return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
}
