import { Injectable } from '@angular/core';
import {NgForage, NgForageCache, Driver} from "ngforage";

@Injectable({
  providedIn: 'root'
})
export class LocalForageService {
  constructor(
      private readonly ngf: NgForage,
      private readonly cache: NgForageCache
  ) { }
  public getItem<T = any>(key: string): Promise<T> {
    return this.ngf.getItem<T>(key);
  }
  public setItem<T = any>(key: string, data: T): Promise<T> {
    return this.ngf.setItem(key, data);
  }
  public removeItem<T = any>(key: string): Promise<any> {
    return this.ngf.removeItem(key);
  }
}
