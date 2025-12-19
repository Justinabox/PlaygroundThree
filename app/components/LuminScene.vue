<script setup lang="ts">
    import { BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, Mesh, Color, Clock, Group, Vector3, Object3D } from 'three'
    import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

    import { useTres } from '@tresjs/core'
    import { Vector2, Mesh as TresMesh } from 'three'
    import { NoiseMap } from '../composables/noiseMap'
    import { OrbitControls, Stars } from '@tresjs/cientos'
    
    const props = defineProps<{
        midi: Midi
        xrButtonTarget?: HTMLElement | null
    }>()
    
    let handlerInitialized = false
    
    const { camera, renderer, scene } = useTres()
    const { onBeforeRender, start: startLoop, stop: stopLoop } = useLoop()

    const currentMesh = new Map<number, MeshData>()
    const noiseMap = new NoiseMap('mineral-of-seed', 0.15, 16, 25, scene);
    const movementDelta = ref(0)
    const startTime = Date.now()
    var lastTime = Date.now()
    const orbitRef = ref<InstanceType<typeof OrbitControls> | null>(null)
    const starsRef = ref<InstanceType<typeof TresMesh> | null>(null)
    const isXrPresenting = ref(false)

    const xrClock = new Clock()
    const cameraRig = new Group()
    const tmpWorldPos = new Vector3()
    let originalCameraParent: Object3D | null = null
    let vrButtonEl: HTMLElement | null = null
    let onSessionStart: (() => void) | null = null
    let onSessionEnd: (() => void) | null = null
        
    type MeshData = {
        mesh: Mesh
        startDelta: number
    }

    const ensureMidiHandlers = () => {
        if (handlerInitialized || !props.midi.isInitialized()) return

        props.midi.subscribeToEvent("on.three", "noteOn", (event) => {
            const box = new BoxGeometry(0.1, 0.1, 0.05)
            const material = new MeshPhysicalMaterial({ color: new Color().setHSL(event.midiNote / 128, 1, event.velocity / 128), opacity: 0.8, transparent: true })
            const mesh = new Mesh(box, material)
            mesh.position.x = (event.midiNote / 10) - 6.4
            mesh.position.y = event.velocity / 100 + 3
            mesh.position.z = movementDelta.value + 1
            scene.value.add(mesh)
            currentMesh.set(event.midiNote, { mesh: mesh, startDelta: movementDelta.value })
        })

        props.midi.subscribeToEvent("on.three", "noteOff", (event) => {
            const mesh = currentMesh.get(event.midiNote)
            if (mesh) {
                // scene.value.remove(mesh.mesh)
                currentMesh.delete(event.midiNote)
            }
        })

        handlerInitialized = true
    }

    const updateFrame = (deltaSeconds: number) => {
        currentMesh.forEach((data, midiNote) => {
            data.mesh.scale.z = (movementDelta.value - data.startDelta) / 0.05
            data.mesh.position.z = data.startDelta + (movementDelta.value - data.startDelta) / 2 + 1
        })

        ensureMidiHandlers()
    
        if (props.midi.playing) {
            const offset = (Date.now() - startTime) / 2000
            const delta = Date.now() - lastTime
            lastTime = Date.now()
            movementDelta.value = offset

            // In XR, move a "rig" (player) and let the headset drive the camera pose.
            if (isXrPresenting.value) {
                cameraRig.position.z += delta / 2000
            } else {
                if (camera.value) camera.value.position.z += delta / 2000
                if (orbitRef.value) orbitRef.value.$el.target.z = offset + 0.5
            }

            // Keep stars in front of the viewer.
            if (starsRef.value) {
                starsRef.value.position.z = (isXrPresenting.value ? cameraRig.position.z : offset) + 0.5
            }
        }

        // Use world position so this works both in non-XR (camera moves) and XR (camera is under a rig).
        if (camera.value) {
            camera.value.getWorldPosition(tmpWorldPos)
            noiseMap.updateCenter(new Vector2(tmpWorldPos.x, tmpWorldPos.z))
        } else {
            noiseMap.updateCenter(new Vector2(0, 0))
        }
    }

    onBeforeRender(({ delta }) => {
        // If XR is active we render via `renderer.setAnimationLoop` instead of Tres' RAF loop.
        if (isXrPresenting.value) return
        updateFrame(delta)
    })

    onMounted(() => {
        const r = renderer
        if (!r || !('xr' in r)) return
        const webglRenderer = r as import('three').WebGLRenderer

        // WebXR basics (three.js): enable XR + add a button to enter VR sessions.
        // Ref: https://threejs.org/manual/#en/webxr-basics
        webglRenderer.xr.enabled = true
        webglRenderer.xr.setReferenceSpaceType?.('local-floor')

        // Player rig for XR-style locomotion.
        if (!scene.value.children.includes(cameraRig)) scene.value.add(cameraRig)
        // XR "spawn" transform:
        // - three.js default camera forward is -Z; rotate rig 180deg so forward aligns with +Z
        // - offset rig up so the viewer starts at Y=5 (in `local-floor`, Y=0 is floor)
        cameraRig.rotation.y = Math.PI
        cameraRig.position.y = 5

        vrButtonEl = VRButton.createButton(webglRenderer)
        // Remove three.js default styling applied by VRButton (inline styles / classes).
        // This leaves styling fully to the app / browser defaults.
        vrButtonEl.removeAttribute('style')
        vrButtonEl.className = 'backdrop-blur-xs bg-stone-100/12 text-white px-4 py-2 rounded-md text-nowrap w-fit!'

        const mountVrButton = () => {
            if (!vrButtonEl) return

            const host = props.xrButtonTarget ?? document.body
            if (vrButtonEl.parentElement !== host) host.appendChild(vrButtonEl)
        }

        mountVrButton()
        watch(() => props.xrButtonTarget, () => mountVrButton())

        onSessionStart = () => {
            isXrPresenting.value = true
            stopLoop()
            xrClock.start()

            // Parent camera under rig so `cameraRig.position` affects the XR view.
            if (camera.value) {
                originalCameraParent = camera.value.parent
                cameraRig.add(camera.value)
            }

            // XR render loop (required by WebXR).
            webglRenderer.setAnimationLoop(() => {
                const cam = camera.value
                const sc = scene.value
                if (!cam || !sc) return

                const dt = xrClock.getDelta()
                updateFrame(dt)
                webglRenderer.render(sc, cam)
            })
        }

        onSessionEnd = () => {
            isXrPresenting.value = false
            webglRenderer.setAnimationLoop(null)
            xrClock.stop()

            // Restore camera parenting for non-XR controls (OrbitControls, etc).
            if (camera.value) {
                if (originalCameraParent) originalCameraParent.add(camera.value)
                else scene.value.add(camera.value)
            }
            originalCameraParent = null

            startLoop()
        }

        webglRenderer.xr.addEventListener('sessionstart', onSessionStart)
        webglRenderer.xr.addEventListener('sessionend', onSessionEnd)
    })

    onUnmounted(() => {
        const r = renderer
        if (r && 'xr' in r) {
            const webglRenderer = r as import('three').WebGLRenderer
            if (onSessionStart) {
                webglRenderer.xr.removeEventListener('sessionstart', onSessionStart)
            }
            if (onSessionEnd) {
                webglRenderer.xr.removeEventListener('sessionend', onSessionEnd)
            }
            // Stop XR loop if we leave the page while in XR.
            webglRenderer.setAnimationLoop(null)
        }

        if (vrButtonEl?.parentElement) vrButtonEl.parentElement.removeChild(vrButtonEl)
        vrButtonEl = null

        cameraRig.removeFromParent()
    })
</script>
    
<template>
    <!-- <TresDirectionalLight :position="[1, 2, 3]" :intensity="3"/> -->
    <TresAmbientLight :intensity="1" />
    <!-- <MapControls :position="[0, 2.5, 0]"/> -->
    <OrbitControls
        v-if="!isXrPresenting"
        :enableDamping="true" 
        :dampingFactor="0.1" 
        :enableZoom="false" 
        :enablePan="false" 
        :enableRotate="true" 
        :rotateSpeed="0.3" 
        :autoRotate="true" 
        :autoRotateSpeed="0.1" 
        :target="[0, 3, 0.5]"
        :maxDistance="5"
        ref="orbitRef"
    />
    <TresDirectionalLight :position="[1, 2, 3]" :intensity="1"/>
    <TresMesh :scale="[0.12, 0.12, 0.12]" ref="starsRef">
        <Stars :count="1000" :size="0.1" :radius="115" />
    </TresMesh>
    <TresFog :color="0x000000" :near="15" :far="25" /> 
    <!-- <Sky /> -->
    <!-- <TresGridHelper :args="[100, 100]" /> -->
</template>