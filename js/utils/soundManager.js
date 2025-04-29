import { config } from '../config/config.js';

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMusicPlaying = false;
        this.isSoundEnabled = config.sound.effects.enabled;
        this.isMusicEnabled = config.sound.music.enabled;
        this.soundVolume = config.sound.effects.volume;
        this.musicVolume = config.sound.music.volume;
        
        // Initialize sound manager
        this.init();
    }
    
    init() {
        // Load sound effects
        this.loadSounds();
        
        // Load background music
        this.loadMusic();
    }
    
    loadSounds() {
        // Define sound effects to load
        const soundsToLoad = [
            { name: 'fireball', path: 'assets/sounds/fireball.mp3' },
            { name: 'iceSpike', path: 'assets/sounds/ice-spike.mp3' },
            { name: 'thunderStrike', path: 'assets/sounds/thunder-strike.mp3' },
            { name: 'heal', path: 'assets/sounds/heal.mp3' },
            { name: 'shield', path: 'assets/sounds/shield.mp3' },
            { name: 'dash', path: 'assets/sounds/dash.mp3' },
            { name: 'jump', path: 'assets/sounds/jump.mp3' },
            { name: 'land', path: 'assets/sounds/land.mp3' },
            { name: 'hit', path: 'assets/sounds/hit.mp3' },
            { name: 'enemyDeath', path: 'assets/sounds/enemy-death.mp3' },
            { name: 'playerDeath', path: 'assets/sounds/player-death.mp3' },
            { name: 'levelUp', path: 'assets/sounds/level-up.mp3' }
        ];
        
        // Load each sound
        for (const sound of soundsToLoad) {
            this.loadSound(sound.name, sound.path);
        }
    }
    
    loadSound(name, path) {
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
    
    loadMusic() {
        try {
            // Create audio element for background music
            this.music = new Audio();
            
            // Add error handling
            this.music.onerror = () => {
                console.warn('Failed to load background music');
                // Create a silent audio element as fallback
                const fallbackAudio = new Audio();
                fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
                fallbackAudio.loop = true;
                this.music = fallbackAudio;
            };
            
            this.music.src = 'assets/sounds/background-music.mp3';
            this.music.volume = this.musicVolume;
            this.music.loop = true;
        } catch (error) {
            console.error('Error loading background music:', error);
            // Create a silent audio element as fallback
            const fallbackAudio = new Audio();
            fallbackAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // Empty WAV
            fallbackAudio.loop = true;
            this.music = fallbackAudio;
        }
    }
    
    playSound(name) {
        // Check if sound is enabled
        if (!this.isSoundEnabled) return;
        
        // Check if sound exists
        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not found`);
            return;
        }
        
        // Clone the audio to allow multiple instances
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.soundVolume;
        sound.play();
    }
    
    playMusic() {
        // Check if music is enabled
        if (!this.isMusicEnabled) return;
        
        // Check if music exists
        if (!this.music) {
            console.warn('Background music not found');
            return;
        }
        
        // Play music
        this.music.play();
        this.isMusicPlaying = true;
    }
    
    pauseMusic() {
        // Check if music exists
        if (!this.music) return;
        
        // Pause music
        this.music.pause();
        this.isMusicPlaying = false;
    }
    
    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    setMusicVolume(volume) {
        // Set music volume
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update music element
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }
    
    setSoundVolume(volume) {
        // Set sound volume
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        // Update all sound elements
        for (const name in this.sounds) {
            this.sounds[name].volume = this.soundVolume;
        }
    }
    
    enableSound(enabled) {
        this.isSoundEnabled = enabled;
    }
    
    enableMusic(enabled) {
        this.isMusicEnabled = enabled;
        
        if (enabled && !this.isMusicPlaying) {
            this.playMusic();
        } else if (!enabled && this.isMusicPlaying) {
            this.pauseMusic();
        }
    }
}

export default SoundManager;