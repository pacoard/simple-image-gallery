import { Image } from './image';
//import { IMAGES } from './image';
import { Injectable } from '@angular/core';

@Injectable()
export class ImageService {
  
  getImages(): Promise<Image[]> {
    var images: Image[] = [];
    var ajaxReq = new XMLHttpRequest();
    ajaxReq.onreadystatechange = function(){
      if (this.readyState === 4 && this.status === 200) {
        var data = JSON.parse(this.responseText);
        if (Array.isArray(data)) {
         // handleData(data);
         console.log("ANGULAR RECEIVED: ");
         console.log(data);
         handleData(data);
        } else {
          console.log('did not reveice an array: ');
          console.log(data);
        }
      }
    };
    function handleData(data: any) {
      for (var i = 0; i< data.length; i++) {
        images[i] = {
          id: data[i].id, 
          phone: data[i].phone, 
          email: data[i].email,
          path: data[i].url,
          bwpath: data[i].bwurl,
        };
      }
    }
    
    var host = window.location
    var host_url = host.protocol + '//' + host.hostname + ':8000/api/upload';
    ajaxReq.open('GET', host_url, true);
    ajaxReq.send();
    return Promise.resolve(images);
  }

  getImagesSlowly(): Promise<Image[]> {
    return new Promise(resolve => {
      // Simulate server latency with 2 second delay
      setTimeout(() => resolve(this.getImages()), 2000);
    });
  }

  getImage(id: number): Promise<Image> {
    return this.getImages()
               .then(images => images.find(image => image.id === id));
  }
}
