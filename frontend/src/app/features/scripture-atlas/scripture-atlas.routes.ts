import { Routes } from '@angular/router';
import { ScriptureAtlasComponent } from '@features/scripture-atlas/scripture-atlas.component';
import { AtlasExplorerComponent } from '@features/scripture-atlas/components/atlas-explorer/atlas-explorer.component';

export const SCRIPTURE_ATLAS_ROUTES: Routes = [
  {
    path: '',
    component: ScriptureAtlasComponent,
    children: [
      {
        path: '',
        component: AtlasExplorerComponent
      }
    ]
  }
];