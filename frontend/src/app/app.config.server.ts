import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()), // Make sure this is present
    provideClientHydration(),
  ],
};

export const config = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()]
});
