import { config } from '../config/config.js';

export default class SoundManager {
    constructor() {
        // Web Audio API properties
        this.sounds = new Map();
        this.context = null;
        this.masterGain = null;
        this.effectsGain = null;
        this.musicGain = null;
        this.initialized = false;
        
        // Configuration
        this.isSoundEnabled = config.sound.effects.enabled;
        this.isMusicEnabled = config.sound.music.enabled;
        this.soundVolume = config.sound.effects.volume;
        this.musicVolume = config.sound.music.volume;
        
        // Music properties
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        
        // Active sounds tracking
        this.activeSounds = new Map();
    }

    async init() {
        if (this.initialized) return;

        try {
            // Create audio context
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node structure
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            this.effectsGain = this.context.createGain();
            this.effectsGain.connect(this.masterGain);
            this.effectsGain.gain.value = this.soundVolume;
            
            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;
    
            // Load all sound effects
            await this.loadSounds();
            
            // Load background music
            await this.loadMusic();
    
            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize sound manager:", error);
            // Create fallback using HTML5 Audio API
            this.initFallback();
        }
    }
    
    initFallback() {
        console.warn("Using HTML5 Audio fallback for sound");
        this.sounds = {};
        this.loadSoundsFallback();
        this.loadMusicFallback();
        this.initialized = true;
    }

    async loadSounds() {
        const soundFiles = {
            // Skill sounds
            'fireball': '/assets/sounds/fireball.mp3',
            'icespike': '/assets/sounds/ice-spike.mp3',
            'thunderstrike': '/assets/sounds/thunder-strike.mp3',
            'heal': '/assets/sounds/heal.mp3',
            'shield': '/assets/sounds/shield.mp3',
            'dash': '/assets/sounds/dash.mp3',
            
            // Special skill sounds
            'dragon-breath': '/assets/sounds/dragon-breath.mp3',
            'frost-nova': '/assets/sounds/frost-nova.mp3',
            
            // Movement sounds
            'jump': '/assets/sounds/jump.mp3',
            'land': '/assets/sounds/land.mp3',
            'takeoff': '/assets/sounds/takeoff.mp3',
            'flight': '/assets/sounds/flight_loop.mp3',
            'landing': '/assets/sounds/landing.mp3',
            
            // Combat sounds
            'hit': '/assets/sounds/hit.mp3',
            'attack': '/assets/sounds/attack.mp3',
            'enemy-death': '/assets/sounds/enemy-death.mp3',
            'player-death': '/assets/sounds/player-death.mp3',
            
            // UI sounds
            'click': '/assets/sounds/click.mp3',
            'hover': '/assets/sounds/hover.mp3',
            'level-up': '/assets/sounds/level-up.mp3',
            'skill-ready': '/assets/sounds/skill-ready.mp3',
            'error': '/assets/sounds/error.mp3',
            
            // Environment sounds
            'blow': '/assets/sounds/blow.mp3',
            'pop': '/assets/sounds/pop.mp3',
            
            // Item sounds
            'chest': '/assets/sounds/pop.mp3',
            'crystal': '/assets/sounds/skill-ready.mp3'
        };

        // Load all sounds
        const loadPromises = Object.entries(soundFiles).map(([name, path]) => 
            this.loadSound(name, path)
        );

        await Promise.all(loadPromises);
    }
    
    loadSoundsFallback() {
        const soundFiles = {
            // Same sound files as above
            'fireball': '/assets/sounds/fireball.mp3',
            'icespike': '/assets/sounds/ice-spike.mp3',
            'thunderstrike': '/assets/sounds/thunder-strike.mp3',
            'heal': '/assets/sounds/heal.mp3',
            'shield': '/assets/sounds/shield.mp3',
            'dash': '/assets/sounds/dash.mp3',
            'dragon-breath': '/assets/sounds/dragon-breath.mp3',
            'frost-nova': '/assets/sounds/frost-nova.mp3',
            'jump': '/assets/sounds/jump.mp3',
            'land': '/assets/sounds/land.mp3',
            'takeoff': '/assets/sounds/takeoff.mp3',
            'flight': '/assets/sounds/flight_loop.mp3',
            'landing': '/assets/sounds/landing.mp3',
            'hit': '/assets/sounds/hit.mp3',
            'attack': '/assets/sounds/attack.mp3',
            'enemy-death': '/assets/sounds/enemy-death.mp3',
            'player-death': '/assets/sounds/player-death.mp3',
            'click': '/assets/sounds/click.mp3',
            'hover': '/assets/sounds/hover.mp3',
            'level-up': '/assets/sounds/level-up.mp3',
            'skill-ready': '/assets/sounds/skill-ready.mp3',
            'error': '/assets/sounds/error.mp3',
            'blow': '/assets/sounds/blow.mp3',
            'pop': '/assets/sounds/pop.mp3',
            'chest': '/assets/sounds/pop.mp3',
            'crystal': '/assets/sounds/skill-ready.mp3'
        };
        
        // Load each sound using HTML5 Audio
        for (const [name, path] of Object.entries(soundFiles)) {
            this.loadSoundFallback(name, path);
        }
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
    
    loadSoundFallback(name, path) {
        try {
            // Create audio element
            const audio = new Audio();
            
            // Add error handling
            audio.onerror = () => {
                console.warn(`Failed to load sound: ${path}`);
                // Create a silent audio element as fallback
                const fallbackAudio = new Audio();
                fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
                this.sounds[name] = fallbackAudio;
            };
            
            audio.src = path;
            audio.volume = this.soundVolume;
            
            // Store in sounds object
            this.sounds[name] = audio;
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
            // Create a silent audio element as fallback
            const fallbackAudio = new Audio();
            fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
            this.sounds[name] = fallbackAudio;
        }
    }
    
    async loadMusic() {
        try {
            const response = await fetch('/assets/sounds/background-music.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.backgroundMusic = audioBuffer;
        } catch (error) {
            console.warn('Failed to load background music:', error);
        }
    }
    
    loadMusicFallback() {
        try {
            // Create audio element for background music
            this.backgroundMusic = new Audio();
            
            // Add error handling
            this.backgroundMusic.onerror = () => {
                console.warn('Failed to load background music');
                // Create a silent audio element as fallback
                const fallbackAudio = new Audio();
                fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
                fallbackAudio.loop = true;
                this.backgroundMusic = fallbackAudio;
            };
            
            this.backgroundMusic.src = '/assets/sounds/background-music.mp3';
            this.backgroundMusic.volume = this.musicVolume;
            this.backgroundMusic.loop = true;
        } catch (error) {
            console.error('Error loading background music:', error);
            // Create a silent audio element as fallback
            const fallbackAudio = new Audio();
            fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
            fallbackAudio.loop = true;
            this.backgroundMusic = fallbackAudio;
        }
    }

    playSound(name, options = {}) {
        if (!this.initialized) {
            console.warn('Sound manager not initialized');
            return null;
        }
        
        if (!this.isSoundEnabled) {
            return null;
        }
        
        // Handle different naming conventions
        name = name.toLowerCase().replace(/\s+/g, '');
        
        // Check if using Web Audio API or HTML5 Audio fallback
        if (this.context) {
            return this.playSoundWebAudio(name, options);
        } else {
            return this.playSoundFallback(name, options);
        }
    }
    
    playSoundWebAudio(name, options = {}) {
        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return null;
        }

        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = sound;

        // Create gain node for this sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume || 1.0;

        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.effectsGain);

        // Set loop if specified
        if (options.loop) {
            source.loop = true;
        }
        
        // Play the sound
        source.start(0);
        
        // Store active sound for tracking
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.activeSounds.set(id, { source, gainNode });
        
        // Remove from active sounds when finished
        source.onended = () => {
            this.activeSounds.delete(id);
        };

        return {
            id,
            source,
            gainNode,
            stop: () => {
                try {
                    source.stop();
                    this.activeSounds.delete(id);
                } catch (error) {
                    console.warn('Error stopping sound:', error);
                }
            }
        };
    }
    
    playSoundFallback(name, options = {}) {
        // Check if sound exists
        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not found`);
            return null;
        }
        
        // Clone the audio to allow multiple instances
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.soundVolume * (options.volume || 1.0);
        
        // Set loop if specified
        if (options.loop) {
            sound.loop = true;
        }
        
        sound.play();
        
        // Generate unique ID for this sound
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        return {
            id,
            element: sound,
            stop: () => {
                sound.pause();
                sound.currentTime = 0;
            }
        };
    }

    playMusic() {
        if (!this.initialized || !this.isMusicEnabled) {
            return;
        }
        
        if (this.isMusicPlaying) {
            return;
        }
        
        if (this.context) {
            this.playMusicWebAudio();
        } else {
            this.playMusicFallback();
        }
        
        this.isMusicPlaying = true;
    }
    
    playMusicWebAudio() {
        if (!this.backgroundMusic) {
            console.warn('Background music not loaded');
            return;
        }
        
        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = this.backgroundMusic;
        source.loop = true;
        
        // Connect to music gain node
        source.connect(this.musicGain);
        
        // Play music
        source.start(0);
        
        // Store reference
        this.musicSource = source;
    }
    
    playMusicFallback() {
        if (!this.backgroundMusic) {
            console.warn('Background music not loaded');
            return;
        }
        
        this.backgroundMusic.play();
    }
    
    pauseMusic() {
        if (!this.initialized || !this.isMusicPlaying) {
            return;
        }
        
        if (this.context && this.musicSource) {
            try {
                this.musicSource.stop();
                this.musicSource = null;
            } catch (error) {
                console.warn('Error stopping music:', error);
            }
        } else if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        
        this.isMusicPlaying = false;
    }
    
    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        if (this.context && this.effectsGain) {
            this.effectsGain.gain.value = this.soundVolume;
        } else {
            // Update all sound elements in fallback mode
            for (const name in this.sounds) {
                if (this.sounds[name] instanceof Audio) {
                    this.sounds[name].volume = this.soundVolume;
                }
            }
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.context && this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        } else if (this.backgroundMusic instanceof Audio) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }
    
    setMasterVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        
        if (this.context && this.masterGain) {
            this.masterGain.gain.value = volume;
        } else {
            // Adjust both sound and music volume in fallback mode
            this.setSoundVolume(this.soundVolume * volume);
            this.setMusicVolume(this.musicVolume * volume);
        }
    }
    
    enableSound(enabled) {
        this.isSoundEnabled = enabled;
        
        if (!enabled) {
            this.stopAllSounds();
        }
    }
    
    enableMusic(enabled) {
        this.isMusicEnabled = enabled;
        
        if (enabled && !this.isMusicPlaying) {
            this.playMusic();
        } else if (!enabled && this.isMusicPlaying) {
            this.pauseMusic();
        }
    }
    
    stopSound(id) {
        if (this.activeSounds.has(id)) {
            const sound = this.activeSounds.get(id);
            sound.stop();
            this.activeSounds.delete(id);
        }
    }
    
    stopAllSounds() {
        if (this.context) {
            // Stop all active sounds
            for (const [id, sound] of this.activeSounds.entries()) {
                try {
                    sound.source.stop();
                } catch (error) {
                    console.warn('Error stopping sound:', error);
                }
            }
            this.activeSounds.clear();
        }
    }

    dispose() {
        this.stopAllSounds();
        this.pauseMusic();
        
        if (this.context) {
            this.context.close();
            this.context = null;
        }
        
        this.initialized = false;
    }
}
