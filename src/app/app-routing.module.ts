import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UploadImageComponent }   from './upload-image.component';
import { GalleryComponent }      from './gallery.component';

const routes: Routes = [
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: 'upload',  component: UploadImageComponent },
  { path: 'gallery',     component: GalleryComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}