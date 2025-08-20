export class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioContext: AudioContext | null = null;
  private currentInterval: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private audio: HTMLAudioElement | null = null;

  static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private async ensureAudioContextReady(): Promise<AudioContext> {
    const audioContext = this.initAudioContext();
    
    // Resume audio context if it's suspended (browser policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    return audioContext;
  }

  private playBeep(frequency: number, duration: number): void {
    this.ensureAudioContextReady().then(audioContext => {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Make the sound very loud and urgent
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      } catch (error) {
        console.warn('Could not play oscillator sound:', error);
        this.playFallbackSound();
      }
    }).catch(error => {
      console.warn('Audio context failed:', error);
      this.playFallbackSound();
    });
  }

  private playFallbackSound(): void {
    try {
      // Use multiple sound techniques for maximum compatibility
      
      // Method 1: Beep using data URL
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.volume = 1.0;
      }
      
      // Create a simple tone using data URL
      const sampleRate = 8000;
      const duration = 0.2;
      const frequency = 1000;
      const samples = sampleRate * duration;
      const wave = new Array(samples);
      
      for (let i = 0; i < samples; i++) {
        wave[i] = Math.sin(frequency * 2 * Math.PI * i / sampleRate);
      }
      
      // Convert to base64 (simplified for browser compatibility)
      this.audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+P1unAiBC98zvHJbSEFOYnU8teMOgcZZrDq4JxQDRRAouP3wmolAzZ+yO/PhzgJG2S56+OZTR8VVTHb9beKRA0PVKbh77BdGAg9jdXzzG4jBS14yPDej0ELFGK+6eOWTxwMSKXm8LddFgU2jdT0zm8kBSl6yO/QhzoIGGOy7OScTgwPUKfl8bllGgU5iNPyz3AiBSh5yPDSfzoIFWS06eOaTAsMSqXk9LdaFgU1jNb0zm4kBSp7yO7PhzoIGWWz6+OcTQwPUKjl8bllGgY5iNPyz3AiBSh6yu/RfzoIFGS06eKaTAwMSqTm8rVaFgUzjdb0z24jBSp8x+7Phzol';
      
      this.audio.play().catch(e => {
        console.warn('Audio fallback failed:', e);
        // Method 2: Use Web Audio API with simpler approach
        this.playSimpleBeep();
      });
      
    } catch (error) {
      console.warn('All audio methods failed:', error);
    }
  }

  private playSimpleBeep(): void {
    try {
      // Very simple beep using speech synthesis (works on most devices)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('beep');
        utterance.rate = 10;
        utterance.pitch = 2;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Speech synthesis beep failed:', error);
    }
  }

  private playNotificationSequence(): void {
    console.log('Playing notification sequence...');
    
    // Play a very loud and urgent notification sound sequence
    const frequencies = [950, 1000, 1200, 1000, 800, 1200, 800];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 700);
      }, index * 150);
    });
    
    // Add a second wave of sounds for extra urgency
    setTimeout(() => {
      const urgentFreqs = [1500, 1200, 1500, 1200];
      urgentFreqs.forEach((freq, index) => {
        setTimeout(() => {
          this.playBeep(freq, 100);
        }, index * 100);
      });
    }, 1200);

    // Also play fallback sound immediately for better compatibility
    this.playFallbackSound();
  }

  startNotificationSound(): void {
    if (this.isPlaying) {
      console.log('Notification sound already playing');
      return; // Already playing
    }    console.log('🔔 Starting urgent notification sound...');
    this.isPlaying = true;
    
    // Play immediately
    this.playNotificationSequence();
    
    // Repeat every 2 seconds with a break between sounds
    this.currentInterval = setInterval(() => {
      if (this.isPlaying) {
        console.log('🔔 Repeating notification sound...');
        this.playNotificationSequence();
      }
    }, 4500); // 2 second interval for better user experience

    console.log('Notification sound started - will repeat every 2 seconds');
  }

  stopNotificationSound(): void {
    if (!this.isPlaying) {
      return;
    }

    console.log('🔕 Stopping notification sound');
    this.isPlaying = false;
    
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }

    // Stop any ongoing audio
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    console.log('Notification sound stopped');
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Force start sound (for user interaction)
  forceStartSound(): void {
    console.log('🔔 Force starting notification sound with user interaction...');
    
    // Enable audio context with user interaction
    this.ensureAudioContextReady().then(() => {
      this.startNotificationSound();
    });
  }

  // Clean up resources
  destroy(): void {
    this.stopNotificationSound();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.audio) {
      this.audio = null;
    }
  }
}
