import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatButtonModule } from '@angular/material/button';

import { App } from './app/app';
import { routes } from './app/app.routes';

registerLocaleData(localeEs);

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()), // ✅ paréntesis necesarios
    importProvidersFrom(MatButtonModule),
    { provide: LOCALE_ID, useValue: 'es-PE' },
  ],
}).catch((err) => console.error(err));
