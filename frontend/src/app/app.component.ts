// frontend/src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { CitationFooterComponent } from "./shared/components/citation-footer/citation-footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavigationComponent,
    ModalComponent,
    NotificationComponent,
    CitationFooterComponent
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Well Versed';
}
