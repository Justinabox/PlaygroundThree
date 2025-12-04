import { WorkletSynthesizer, Sequencer } from 'spessasynth_lib'

type subscriber = {
    eventType: Parameters<WorkletSynthesizer['eventHandler']['addEvent']>[0]
    callback: (event: any) => void
}

export class Midi {
    private context: AudioContext | null = null
    private synthesizer: WorkletSynthesizer | null = null
    private sequencer: Sequencer | null = null
    private eventSubscribers: Map<string, subscriber> = new Map()
    private initialized: boolean = false
    playing: boolean = false

    async create(defaultSoundbank: string = "game_minecraft") {
        this.context = new AudioContext()
        await this.context.audioWorklet.addModule("/spessasynth.js")
        
        this.synthesizer = new WorkletSynthesizer(this.context)
        this.synthesizer.connect(this.context.destination)

        this.sequencer = new Sequencer(this.synthesizer)
        await this.loadSoundbank(defaultSoundbank)
        this.initialized = true
    }

    isInitialized() {
        /**
         * @returns True if the synthesizer is initialized, false otherwise
         */

        return this.initialized
    }

    private reloadSynthesizer() {
        /**
         * Reloads the synthesizer
         */
        
        this.synthesizer = new WorkletSynthesizer(this.context!)
        this.synthesizer.connect(this.context!.destination)
    }

    async loadSoundbank(soundbankName: string) {
        /**
         * @param soundbankName - The name of the soundbank to load
         */
        
        const soundbank = await fetch(`/assets/soundbank/${soundbankName}.sf2`).then(response => response.arrayBuffer())
        await this.synthesizer?.soundBankManager.addSoundBank(soundbank, soundbankName)
    }

    async loadMidi(midiName: string) {
        /**
         * @param midiName - The name of the MIDI to load
         */
        
        const midi = await fetch(`/assets/midi/${midiName}.mid`).then(response => response.arrayBuffer())
        this.sequencer?.loadNewSongList([{binary: midi, fileName: midiName}])
    }

    private checkSoundbankExists(soundbankName: string) {
        /**
         * @param soundbankName - The name of the soundbank to check
         * @returns True if the soundbank exists, false otherwise
         */
        
        return this.synthesizer?.soundBankManager.priorityOrder.includes(soundbankName)
    }

    async setSoundbank(soundbankName: string) {
        /**
         * @param soundbankName - The name of the soundbank to set
         */
        
        if (!this.checkSoundbankExists(soundbankName)) {
            await this.loadSoundbank(soundbankName)
        }
        this.synthesizer!.soundBankManager.priorityOrder = [soundbankName,...this.synthesizer!.soundBankManager.priorityOrder.filter(name => name !== soundbankName)]
    }

    play() {
        /**
         * Plays the MIDI
         */
        
        this.context?.resume()
        this.sequencer?.play()
        this.playing = true
    }

    pause() {
        /**
         * Pauses the MIDI
         */
        
        this.sequencer?.pause()
        this.playing = false
    }

    toggle() {
        /**
         * Toggles the MIDI
         */
        
        if (this.playing) {
            this.pause()
        } else {
            this.play()
        }
    }

    setTime(time: number) {
        /**
         * @param time - Set the current playback time of the MIDI
         */
        
        this.sequencer!.currentTime = time
    }

    setSpeed(speed: number) {
        /**
         * @param speed - Set the playback speed of the MIDI
         */
        
        this.sequencer!.playbackRate = speed
    }

    subscribeToEvent(
        eventName: string,
        eventType: Parameters<WorkletSynthesizer['eventHandler']['addEvent']>[0],
        callback: (event: any) => void,
    ) {
        /**
         * @param eventName - Custom name for the subscriber
         * @param eventType - The type of the event to subscribe to
         * @param callback - The callback to call when the event is triggered
         */
        
        this.synthesizer?.eventHandler.addEvent(eventType, eventName, callback)
        this.eventSubscribers.set(eventName, {eventType, callback})
    }

    unsubscribeFromEvent(eventName: string, eventType: Parameters<WorkletSynthesizer['eventHandler']['addEvent']>[0]) {
        /**
         * @param eventName - Custom name of the subscriber
         * @param eventType - The type of the event to unsubscribe from
         */
        
        this.synthesizer?.eventHandler.removeEvent(eventType, eventName)
        this.eventSubscribers.delete(eventName)
    }
}