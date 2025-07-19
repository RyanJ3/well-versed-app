import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  mapboxToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;
  
  constructor(private http: HttpClient) {}
  
  async loadConfig(): Promise<void> {
    try {
      // Adjust the URL based on your setup
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:8000' 
        : '';
      
      this.config = await firstValueFrom(
        this.http.get<AppConfig>(`${baseUrl}/api/config/frontend`)
      );
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Fallback to empty config
      this.config = { mapboxToken: '' };
    }
  }
  
  get mapboxToken(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.mapboxToken;
  }
}