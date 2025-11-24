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
        return this.initialized
    }

    private reloadSynthesizer() {
        this.synthesizer = new WorkletSynthesizer(this.context!)
        this.synthesizer.connect(this.context!.destination)
    }

    async loadSoundbank(soundbankName: string) {
        const soundbank = await fetch(`/assets/soundbank/${soundbankName}.sf2`).then(response => response.arrayBuffer())
        await this.synthesizer?.soundBankManager.addSoundBank(soundbank, soundbankName)
    }

    async loadMidi(midiName: string) {
        const midi = await fetch(`/assets/midi/${midiName}.mid`).then(response => response.arrayBuffer())
        this.sequencer?.loadNewSongList([{binary: midi, fileName: midiName}])
    }

    private checkSoundbankExists(soundbankName: string) {
        return this.synthesizer?.soundBankManager.priorityOrder.includes(soundbankName)
    }

    async setSoundbank(soundbankName: string) {
        if (!this.checkSoundbankExists(soundbankName)) {
            await this.loadSoundbank(soundbankName)
        }
        this.synthesizer!.soundBankManager.priorityOrder = [soundbankName,...this.synthesizer!.soundBankManager.priorityOrder.filter(name => name !== soundbankName)]
    }

    play() {
        this.context?.resume()
        this.sequencer?.play()
        this.playing = true
    }

    pause() {
        this.sequencer?.pause()
        this.playing = false
    }

    toggle() {
        if (this.playing) {
            this.pause()
        } else {
            this.play()
        }
    }

    setTime(time: number) {
        this.sequencer!.currentTime = time
    }

    setSpeed(speed: number) {
        this.sequencer!.playbackRate = speed
    }

    subscribeToEvent(
        eventName: string,
        eventType: Parameters<WorkletSynthesizer['eventHandler']['addEvent']>[0],
        callback: (event: any) => void,
    ) {
        this.synthesizer?.eventHandler.addEvent(eventType, eventName, callback)
        this.eventSubscribers.set(eventName, {eventType, callback})
    }

    unsubscribeFromEvent(eventName: string, eventType: Parameters<WorkletSynthesizer['eventHandler']['addEvent']>[0]) {
        this.synthesizer?.eventHandler.removeEvent(eventType, eventName)
        this.eventSubscribers.delete(eventName)
    }
}