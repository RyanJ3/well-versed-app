import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TestamentType, BookGroupType, BibleBook, BibleGroup, BibleData, BibleTestament } from '../models/bible.model';

@Injectable({
  providedIn: 'root',
})
export class BibleService {

  private apiUrl = 'http://localhost:8000/api';
  private userId = 1;

  constructor(private http: HttpClient) {
    this.initializeBible();
  }

  private initializeBible(): void {
    // todo initialize bible data
  }

  saveProgress(): void {
    // First, update the observable
    //todo save bible data
  }

}