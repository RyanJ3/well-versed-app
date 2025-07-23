import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  
  play(url: string): void {
    const audio = new Audio(url);
    audio.play().catch(error => console.error('Error playing audio:', error));
  }
  
  playSound(soundName: string): void {
    const soundMap: Record<string, string> = {
      'session-complete': '/assets/sounds/complete.mp3',
      'correct': '/assets/sounds/correct.mp3',
      'incorrect': '/assets/sounds/incorrect.mp3'
    };
    
    const soundUrl = soundMap[soundName];
    if (soundUrl) {
      this.play(soundUrl);
    }
  }
}
