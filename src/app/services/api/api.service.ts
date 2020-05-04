import { Injectable} from '@angular/core';
import { HttpClient,  } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Local variables //
  private url = 'http://localhost:3400/api'; // quite / 10/03/2020
  // private url = 'http://localhost:3000/api/';
  private imageUrl = '';//https://megapi.aleate.com/api/Containers/uploads.aleate.com/upload';
  public currentUserValue = {};
  // Constructor //
  constructor(
      private http: HttpClient
  ) { }
  // Obtain objects from 1 collection //
  getDataObjects( type: string) {
    return this.http.get(this.url + '/' + type);
  }
  // Obtain object per id //
  getDataObject( type: string, id: string) {
    return this.http.get(this.url + '/' + type + '/' + id);
  }
  // Obtain object per id //
  getDataObjectWithRelation( type: string, id: string, relation: string) {
    return this.http.get(this.url + '/' + type + '/' + id + '/' + relation);
  }
  // Obtain object per id //
  getExistObject( type: string, id: string) {
    // console.log(this.url  + type + id);
    return this.http.get(this.url + '/' + type + '/' + id + '/exists');
  }
  // Add a new data object //
  addDataObject(model: any, type: string) {
    return this.http.post(this.url + '/' + type, model);
  }
  // Add a new data object //
  addDataRelation(model: any, type: string, ralationType: string, id: string, fk: string) {
    return this.http.put(this.url + '/' + type + '/' + id + '/' + ralationType + '/' + fk, model);
  }
  // Edit object per id //
  editDataObject(id: string, model: any , type: string) {
    return this.http.patch(this.url + '/' + type + '/' + id, model);
  }
  // Delete object per id //
  deleteDataObject(type: string, id: string) {
    return this.http.delete(this.url + '/' + type + '/' + id);
  }
  // Obtain data to fill table //
  getTableDataObjects(query: string) {
    return this.http.get(this.url + '/' + query);
  }
  // Obtain data from external services //
  getGenericDataObjects(query: string) {
    return this.http.get(query);
  }
  // Add image to the bucket
  addImage(image: File, id: string) {
    const formData = new FormData();
    formData.append('image', image, id);
    return this.http.post(this.imageUrl, formData);
  }
  // Add image object (multiple images) to the bucket
  addImageObject(image: File[], id: string[]) {
    const formData = new FormData();
    for (let x = 0; x < image.length; x++) {
      formData.append('image', image[x], id[x]);
    }
    return this.http.post(this.imageUrl, formData);
  }
}
