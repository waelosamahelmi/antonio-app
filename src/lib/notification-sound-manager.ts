export class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioContext: AudioContext | null = null;
  private currentInterval: NodeJS.Timeout | null = null;
  private isPlaying = false;

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

  private playBeep(frequency: number, duration: number): void {
    try {
      const audioContext = this.initAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Make the sound much louder and more prominent
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }
  private playNotificationSequence(): void {
    // Play a very loud and urgent notification sound sequence
    const frequencies = [800, 1000, 1200, 1000, 800, 1200, 800];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 200);
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
  }

  startNotificationSound(): void {
    if (this.isPlaying) {
      return; // Already playing
    }

    this.isPlaying = true;
      // Play immediately
    this.playNotificationSequence();
    
    // Repeat every 2 seconds for more urgency
    this.currentInterval = setInterval(() => {
      if (this.isPlaying) {
        this.playNotificationSequence();
      }
    }, 2000);

    console.log('Notification sound started');
  }

  stopNotificationSound(): void {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }

    console.log('Notification sound stopped');
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Clean up resources
  destroy(): void {
    this.stopNotificationSound();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
