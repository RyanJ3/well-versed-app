import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DropdownStateService {
  private activeDropdown = new BehaviorSubject<string | null>(null);
  activeDropdown$ = this.activeDropdown.asObservable();

  setActiveDropdown(dropdownId: string | null): void {
    this.activeDropdown.next(dropdownId);
  }
}