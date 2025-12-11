<script setup lang="ts">
    import { BoxGeometry, MeshStandardMaterial, Mesh, Color } from 'three'

    import { useTres } from '@tresjs/core'
    import { Vector2 } from 'three'
    import { NoiseMap } from '../composables/noiseMap'
    
    const props = defineProps<{
        midi: Midi
    }>()
    
    let handlerInitialized = false
    
    const { camera, renderer, scene } = useTres()
    const { onBeforeRender } = useLoop()
    
    onBeforeRender(({ delta }) => {
        if (!handlerInitialized && props.midi.isInitialized()) {
            props.midi.subscribeToEvent("on.three", "noteOn", (event) => {
                // console.log(event)
                const box = new BoxGeometry(0.1, 0.1, 0.05)
                const material = new MeshStandardMaterial({ color: new Color().setHSL(event.midiNote / 128, 1, Math.min(Math.max(event.velocity, 16) - 16, 96) / 96) })
                const mesh = new Mesh(box, material)
                mesh.position.x = (event.midiNote / 10) - 6.4
                mesh.position.y = event.velocity / 100 + 2
                mesh.position.z = (camera.value?.position.z || 0) + 3
                scene.value.add(mesh)
            })
            handlerInitialized = true
        }
    
        if (props.midi.playing) {
            const cam = camera.value
            if (cam) cam.position.z += delta * 0.1
        }
    })

    const noiseMap = new NoiseMap('my-seed', scene);
    const angle = ref(0)
    onBeforeRender(({ delta }) => {
        noiseMap.updateCenter(new Vector2(camera.value?.position.x || 0, camera.value?.position.z || 0));
    })
</script>
    
<template>
    <!-- <TresDirectionalLight :position="[1, 2, 3]" :intensity="3"/> -->
    <TresAmbientLight :intensity="1" />
    <!-- <MapControls :position="[0, 2.5, 0]"/> -->
    <!-- <TresFog :color="0x000000" :near="1" :far="25" />  -->
    <TresDirectionalLight :position="[1, 2, 3]" :intensity="1"/>
    <!-- <TresGridHelper :args="[100, 100]" /> -->
</template>