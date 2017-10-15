import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
//import { RouterModule }   from '@angular/router';

import { AppComponent }         from './app.component';
import { UploadImageComponent } from './upload-image.component';
import { ImageService }  		from './image.service';
import { GalleryComponent }      from './gallery.component';

import { AppRoutingModule }     from './app-routing.module';

@NgModule({
  imports:      [ 
  	BrowserModule, 
  	FormsModule, 
  	AppRoutingModule
  ],
  declarations: [ 
  	AppComponent,
  	UploadImageComponent,
  	GalleryComponent 
  ],
  providers: [ ImageService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
