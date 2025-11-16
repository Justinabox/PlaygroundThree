<script setup lang="ts">
import { useTres } from '@tresjs/core'
import { Vector2 } from 'three'
import { NoiseMap } from '../composables/noiseMap'

const {camera, renderer, scene} = useTres()
console.log(useTres())
const { onBeforeRender } = useLoop()
const noiseMap = new NoiseMap('my-seed', scene);
const angle = ref(0)
onBeforeRender(({ delta }) => {
  // console.log(camera.value?.position)
  // Your loop logic here
  // angle.value += delta
  // console.log(angle.value)
  // console.log(camera.value?.position.x, camera.value?.position.z);
  // noiseMap.updateCenter(new Vector2(0,0));
  noiseMap.updateCenter(new Vector2(camera.value?.position.x || 0, camera.value?.position.z || 0));
})
</script>

<template>
    <!-- <TresMesh :scale="[1, 2, 1]" :position="[-1, -1, -1]" :rotation-x="Math.PI * 0.5">
        <TresTorusKnotGeometry :args="[1, 0.3, 128, 32]" />
        <TresSphereGeometry :args="[1, 8, 8]" />
        <TresMeshBasicMaterial :color="0x0fa7ff" :wireframe="true" />
    </TresMesh> -->
    <!-- <OrbitControls /> -->
    <TresDirectionalLight :position="[1, 2, 3]" :intensity="3"/>
    <TresAmbientLight :intensity="1" />
    <MapControls :position="[0, 2.5, 0]"/>
    <TresFog :color="0x000000" :near="1" :far="20" />

    <!-- <TresGroup :rotation-y="angle">
        <TresMesh :position="[-1, 0.1, 1]">
        <TresSphereGeometry />
        <TresMeshStandardMaterial :color="'orange'" :wireframe="false"/>
        </TresMesh>
        <TresMesh :position="[1, 0, -1]">
        <TresBoxGeometry />
        <TresMeshStandardMaterial :color="'mediumpurple'" />
        </TresMesh>
    </TresGroup> -->
    <!-- <TresMesh :position="[0, -1, 0]">
        <TresBoxGeometry :args="[20, 0.1, 20]" />
        <TresMeshStandardMaterial :color="'lime'" />
    </TresMesh> -->


    <!-- <CatmullRomCurve3 :points="[
        [-1.5, 0, 0], [-0.5, 1, 0], [0.5, 0, 0], [1.5, 1, 0]
    ]" :segments="40" :line-width="10" color="#fbb03b"/>
    <TresGridHelper /> -->
</template>
