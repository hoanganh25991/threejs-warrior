export default class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.context = null;
        this.masterGain = null;
        this.initialized = false;
        this.volume = 1.0;
    }

    async init() {
        if (this.initialized) return;

        // Create audio context
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain node
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.setVolume(this.volume);

        // Load all sound effects
        await this.loadSounds();

        this.initialized = true;
    }

    async loadSounds() {
        const soundFiles = {
            'dragon-breath': '/assets/sounds/dragon-breath.mp3',
            'frost-nova': '/assets/sounds/frost-nova.mp3',
            'hit': '/assets/sounds/hit.mp3',
            'level-up': '/assets/sounds/level-up.mp3',
            'skill-ready': '/assets/sounds/skill-ready.mp3'
        };

        // Load all sounds
        const loadPromises = Object.entries(soundFiles).map(([name, path]) => 
            this.loadSound(name, path)
        );

        await Promise.all(loadPromises);
    }

    async loadSound(name, path) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
        } catch (error) {
            console.warn(`Failed to load sound: ${name}`, error);
        }
    }

    playSound(name, options = {}) {
        if (!this.initialized) {
            console.warn('Sound manager not initialized');
            return;
        }

        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return;
        }

        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = sound;

        // Create gain node for this sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume || 1.0;

        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Play the sound
        source.start(0);

        // Loop if specified
        if (options.loop) {
            source.loop = true;
        }

        return {
            source,
            gainNode,
            stop: () => source.stop()
        };
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    stopAll() {
        if (this.context) {
            this.context.close();
            this.context = null;
            this.initialized = false;
        }
    }
}
