import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingState$ = new Subject<RecordingState>();
  private startTime = 0;
  private durationInterval: any;
  
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null
  };

  constructor() {}

  getRecordingState(): Observable<RecordingState> {
    return this.recordingState$.asObservable();
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.state.audioUrl = URL.createObjectURL(audioBlob);
        this.updateState();
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.startTime = Date.now();
      this.state.isRecording = true;
      this.state.isPaused = false;
      this.state.duration = 0;
      this.updateState();

      // Update duration every 100ms
      this.durationInterval = setInterval(() => {
        if (this.state.isRecording && !this.state.isPaused) {
          this.state.duration = Math.floor((Date.now() - this.startTime) / 1000);
          this.updateState();
        }
      }, 100);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop();
      this.state.isRecording = false;
      this.state.isPaused = false;
      clearInterval(this.durationInterval);
      this.updateState();
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.state.isRecording && !this.state.isPaused) {
      this.mediaRecorder.pause();
      this.state.isPaused = true;
      this.updateState();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.state.isRecording && this.state.isPaused) {
      this.mediaRecorder.resume();
      this.state.isPaused = false;
      this.startTime = Date.now() - (this.state.duration * 1000);
      this.updateState();
    }
  }

  playRecording(): HTMLAudioElement | null {
    if (this.state.audioUrl) {
      const audio = new Audio(this.state.audioUrl);
      audio.play();
      return audio;
    }
    return null;
  }

  resetRecording(): void {
    this.stopRecording();
    if (this.state.audioUrl) {
      URL.revokeObjectURL(this.state.audioUrl);
    }
    this.state = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: null
    };
    this.updateState();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private updateState(): void {
    this.recordingState$.next({ ...this.state });
  }
}