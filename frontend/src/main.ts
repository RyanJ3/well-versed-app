// frontend/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { ModalComponent } from './app/shared/components/modal/modal.component';

// Bootstrap the app with modal component
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    // Add any additional providers here if needed
  ]
}).then(appRef => {
  // Create and attach the modal component to the app
  const modalComponent = appRef.bootstrap(ModalComponent);
}).catch((err) => console.error(err));