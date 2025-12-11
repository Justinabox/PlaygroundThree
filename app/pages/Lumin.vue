<script setup lang="ts">

    let midi: Midi = new Midi()
    
    const playing = ref(false)
    
    onMounted(async () => {
        await midi.create("game_minecraft")
        await midi.loadMidi("mystery-of-love")
        // midi.setSpeed(10)
    })
    </script>
    
    <template>
        <div class="w-full h-screen">
            <!-- Translate to center -->
            <div class="absolute bottom-4 left-1/2 z-10 gap-2 flex -translate-x-1/2">
                <button @click="midi.toggle(); playing = !playing" class="backdrop-blur-xs bg-stone-100/12 text-white px-4 py-2 rounded-md">{{ playing ? 'Pause' : 'Play' }}</button>
                <select @change="midi.loadMidi(($event.target as HTMLSelectElement).value)" class="backdrop-blur-xs bg-stone-100/12 text-white px-4 py-2 rounded-md">
                    <option value="big-fish">Big Fish</option>
                    <option value="butterflies">Butterflies</option>
                    <option value="cornfield-chase">Cornfield Chase</option>
                    <option value="firework-festival">Firework Festival</option>
                    <option value="mystery-of-love">Mystery of Love</option>
                    <option value="peace-and-love-on-the-planet-earth">Peace and Love on the Planet Earth</option>
                    <option value="rubia">Rubia</option>
                    <option value="wynncraft-adventure">Wynncraft Adventure</option>
                    <option value="wynncraft-forest-dance">Wynncraft Forest Dance</option>
                </select>
                <select @change="midi.setSoundbank(($event.target as HTMLSelectElement).value)" class="backdrop-blur-xs bg-stone-100/12 text-white px-4 py-2 rounded-md">
                    <option value="game_minecraft">Minecraft</option>
                    <option value="game_among_us">Among Us</option>
                    <option value="sound_desk">Desk Moving</option>
                    <option value="guitar_acoustic">Guitar Acoustic</option>
                    <option value="piano_yamaha_c3">Piano Yamaha C3</option>
                    <option value="piano_yamaha_p45">Piano Yamaha P45</option>
                </select>
            </div>
    
            <TresCanvas>
                <TresPerspectiveCamera :position="[0, 7.5, -2]" :look-at="[2, 1.5, 3]" />
                <LuminScene :midi="midi" />
            </TresCanvas>
        </div>
    </template>