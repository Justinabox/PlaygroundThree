<script setup lang="ts">
    import { BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, Mesh, Color } from 'three'

    import { useTres } from '@tresjs/core'
    import { Vector2, Mesh as TresMesh } from 'three'
    import { NoiseMap } from '../composables/noiseMap'
    import { OrbitControls, Stars } from '@tresjs/cientos'
    
    const props = defineProps<{
        midi: Midi
    }>()
    
    let handlerInitialized = false
    
    const { camera, renderer, scene } = useTres()
    const { onBeforeRender } = useLoop()

    const currentMesh = new Map<number, MeshData>()
    const noiseMap = new NoiseMap('my-seed', 0.15, 16, 25, scene);
    const movementDelta = ref(0)
    const startTime = Date.now()
    var lastTime = Date.now()
    const orbitRef = ref<InstanceType<typeof OrbitControls> | null>(null)
    const starsRef = ref<InstanceType<typeof TresMesh> | null>(null)
        
    type MeshData = {
        mesh: Mesh
        startDelta: number
    }
    
    onBeforeRender(({ delta }) => {
        currentMesh.forEach((data, midiNote) => {
            data.mesh.scale.z = (movementDelta.value - data.startDelta) / 0.05
            data.mesh.position.z = data.startDelta + (movementDelta.value - data.startDelta) / 2 + 1
        })
        if (!handlerInitialized && props.midi.isInitialized()) {
            props.midi.subscribeToEvent("on.three", "noteOn", (event) => {
                // console.log(event)
                const box = new BoxGeometry(0.1, 0.1, 0.05)
                const material = new MeshPhysicalMaterial({ color: new Color().setHSL(event.midiNote / 128, 1, event.velocity / 128), opacity: 0.8, transparent: true })
                const mesh = new Mesh(box, material)
                mesh.position.x = (event.midiNote / 10) - 6.4
                mesh.position.y = event.velocity / 50 + 3
                mesh.position.z = movementDelta.value + 1
                mesh.translateZ(-delta * 0.05)
                scene.value.add(mesh)
                currentMesh.set(event.midiNote, { mesh: mesh, startDelta: movementDelta.value })
            })
            props.midi.subscribeToEvent("on.three", "noteOff", (event) => {
                const mesh = currentMesh.get(event.midiNote)
                if (mesh) {
                    // scene.value.remove(mesh)
                    currentMesh.delete(event.midiNote)
                }
            })
            handlerInitialized = true
        }
    
        if (props.midi.playing) {
            const offset = (Date.now() - startTime) / 2000
            const delta = Date.now() - lastTime
            lastTime = Date.now()
            movementDelta.value = offset

            if (camera.value) camera.value.position.z += delta / 2000
            if (orbitRef.value) orbitRef.value.$el.target.z = offset + 0.5
            if (starsRef.value) starsRef.value.position.z = offset + 0.5
        }

        noiseMap.updateCenter(new Vector2(camera.value?.position.x || 0, camera.value?.position.z || 0));
    })
</script>
    
<template>
    <!-- <TresDirectionalLight :position="[1, 2, 3]" :intensity="3"/> -->
    <TresAmbientLight :intensity="1" />
    <!-- <MapControls :position="[0, 2.5, 0]"/> -->
    <OrbitControls 
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
        <Stars :count="1000" :size="0.07" :radius="115" />
    </TresMesh>
    <TresFog :color="0x000000" :near="15" :far="25" /> 
    <!-- <Sky /> -->
    <!-- <TresGridHelper :args="[100, 100]" /> -->
</template>