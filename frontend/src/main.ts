import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { AppModule } from './app/app.module';
import { ConfigService } from './app/core/services/config.service';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(AppModule),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    })
  ]
}).catch(err => console.error(err));