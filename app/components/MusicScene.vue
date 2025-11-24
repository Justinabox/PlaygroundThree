<script setup lang="ts">
import { BoxGeometry, MeshStandardMaterial, Mesh, Color } from 'three'

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
            mesh.position.x = (event.midiNote / 10) - 7
            mesh.position.y = event.velocity / 100
            mesh.position.z = (camera.value?.position.z || 0) - 3
            scene.value.add(mesh)
        })
        handlerInitialized = true
    }

    if (props.midi.playing) {
        const cam = camera.value
        if (cam) cam.position.z -= delta * 0.1
    }
})
</script>

<template>
    <TresDirectionalLight :position="[1, 2, 3]" :intensity="1"/>
    <TresGridHelper :args="[100, 100]" />
</template>