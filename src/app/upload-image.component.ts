import { Component, OnInit } from '@angular/core';

import { Image } from './image';
import { ImageService } from './image.service';

@Component({
  selector: 'upload-app',
  templateUrl: './upload-image.component.html'
})


export class UploadImageComponent {
	componentName = 'UploadImageComponent';
	//handle form
	model = {
		email: 'arthurtheking@king.arthur.com',
		phone: '+1 (777) 777-7777'
	};
    submited = false;
    error = false;

    filesToUpload: Array<File>;

    constructor() {
        this.filesToUpload = [];
    }

    fileChangeEvent(fileInput: any){
        this.filesToUpload = <Array<File>> fileInput.target.files;
    }

    makeFileRequest(url: string, params: Array<string>, files: Array<File>) {
        return new Promise((resolve, reject) => {
            var formData: any = new FormData();
            var xhr = new XMLHttpRequest();
            /*for(var i = 0; i < files.length; i++) {
                formData.append("images", files[i], files[i].name);
            }*/
            formData.append('email', this.model['email']);
            formData.append('phone', this.model['phone']);
            formData.append("image", files[0], files[0].name);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        console.log('POST REQUEST received this response:');
                        //resolve(JSON.parse(xhr.response));
                        console.log(xhr.response);
                        
                    } else {
                        reject(xhr.response);
                    }
                }
            }
            xhr.open("POST", url, true);
            xhr.send(formData);
        });

    }
	onSubmit(): void {
        this.submited = true;
	    console.log(JSON.stringify(this.model));
        //upload image
	    var host = window.location;
        var host_url = host.protocol + '//' + host.hostname + ':8000/api/upload';
        this.makeFileRequest(host_url, [], this.filesToUpload).then((result) => {
            console.log(result);
            this.error = false;
        }, (error) => {
            console.error(error);
            this.error = true;
        });
	}
}