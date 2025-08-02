import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  play(url: string): void {
    const audio = new Audio(url);
    audio.play().catch((err) => console.error('Audio play error', err));
  }

  playSound(name: string): void {
    console.log('Playing sound', name);
  }
}
