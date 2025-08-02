// frontend/src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './components/ui/navigation/navigation.component';
import { ModalComponent } from './components/ui/modal/modal.component';
import { NotificationComponent } from './components/ui/notification/notification.component';
import { CitationFooterComponent } from "./components/bible/citation-footer/citation-footer.component";

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
