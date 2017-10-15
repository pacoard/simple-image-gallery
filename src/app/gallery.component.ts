import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Image } from './image';
import { ImageService } from './image.service';

@Component({
  selector: 'my-gallery',
  templateUrl: './gallery.component.html'
})
export class GalleryComponent implements OnInit {
  title: 'GalleryComponent';
  images: Image[] = [];

  constructor(
  	private router: Router,
  	private imageService: ImageService
  ) { }

  ngOnInit(): void {
  	//Fetch images on init
    this.imageService.getImages()
      .then(images => this.images = images);

    console.log('GalleryComponent ngOnInit');
    console.log(this.images);
  }
}