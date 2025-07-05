import { Routes } from '@angular/router';
import { ScriptureAtlasComponent } from './scripture-atlas.component';
import { AtlasExplorerComponent } from './components/atlas-explorer/atlas-explorer.component';

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