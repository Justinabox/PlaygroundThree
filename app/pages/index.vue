<template>
    <TresCanvas>
        <TresDirectionalLight :position="[1, 2, 3]" :intensity="1"/>
        <TresAmbientLight :intensity="0.2" />
        <OrbitControls />
        <TresMesh>
            <TresTorusKnotGeometry />
            <TresMeshStandardMaterial :color="'orange'" />
        </TresMesh>
    </TresCanvas>
</template>