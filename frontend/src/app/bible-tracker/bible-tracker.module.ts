// bible-tracker.module.ts
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GroupSelectorComponent} from './components/group-selector.component';
import {BookSelectorComponent} from './components/book-selector.component';
import {BookInfoComponent} from './components/book-info.component';
import {ChapterSelectorComponent} from './components/chapter-selector.component';
import {ChapterProgressComponent} from './components/chapter-progress.component';
import {TestamentSelectorComponent} from './components/testament-selector.component';
import {VerseSelectorComponent} from './components/verse-selector.component';
import {BibleTrackerComponent} from "./bible-tracker.component";
import {ConfirmationModalComponent} from "../shared/components/notification/confirmation-modal";

@NgModule({
    declarations: [
        // No declarations as all components are standalone
    ],
    imports: [
        CommonModule,
        FormsModule,
        TestamentSelectorComponent,
        GroupSelectorComponent,
        BookSelectorComponent,
        VerseSelectorComponent,
        BibleTrackerComponent,
        BookInfoComponent,
        ChapterProgressComponent,
        ChapterSelectorComponent,
        ConfirmationModalComponent
    ],
    exports: [
        BibleTrackerComponent
    ]
})
export class BibleTrackerModule {
}
