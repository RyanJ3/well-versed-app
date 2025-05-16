import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments';

interface TestItem {
  id?: number;
  name: string;
  created_at?: string;
}

@Component({
  selector: 'app-api-test',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="container">
      <h1>API Test Page</h1>
      
      <div class="status-box" *ngIf="statusMessage">
        <div class="alert" [ngClass]="isError ? 'alert-error' : 'alert-success'">
          {{ statusMessage }}
        </div>
      </div>
      
      <div class="form-section">
        <h2>Add New Item</h2>
        <div class="form-group">
          <input 
            type="text" 
            [(ngModel)]="newItem.name" 
            placeholder="Enter item name"
            class="form-control"
          >
          <button (click)="createItem()" class="btn btn-primary">Create</button>
        </div>
      </div>
      
      <div class="items-section">
        <h2>Items List</h2>
        
        <div *ngIf="loading" class="loading">Loading...</div>
        
        <div *ngIf="!loading && items.length === 0" class="no-items">
          No items found
        </div>
        
        <div *ngIf="!loading && items.length > 0" class="items-list">
          <div *ngFor="let item of items" class="item-card">
            <div *ngIf="editingId !== item.id" class="item-display">
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-date">Created: {{ item.created_at }}</div>
              </div>
              <div class="item-actions">
                <button (click)="startEdit(item)" class="btn btn-secondary">Edit</button>
                <button (click)="deleteItem(item.id)" class="btn btn-danger">Delete</button>
              </div>
            </div>
            
            <div *ngIf="editingId === item.id" class="item-edit">
              <input 
                type="text" 
                [(ngModel)]="editItem.name" 
                class="form-control"
              >
              <div class="edit-actions">
                <button (click)="updateItem()" class="btn btn-success">Save</button>
                <button (click)="cancelEdit()" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1, h2 {
      margin-bottom: 20px;
    }
    
    .form-section, .items-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-group {
      display: flex;
      gap: 10px;
    }
    
    .form-control {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }
    
    .btn-secondary {
      background-color: #9ca3af;
      color: white;
    }
    
    .btn-success {
      background-color: #10b981;
      color: white;
    }
    
    .btn-danger {
      background-color: #ef4444;
      color: white;
    }
    
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .item-card {
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 15px;
    }
    
    .item-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .item-name {
      font-weight: 500;
      font-size: 18px;
    }
    
    .item-date {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    .item-actions, .edit-actions {
      display: flex;
      gap: 8px;
    }
    
    .status-box {
      margin-bottom: 20px;
    }
    
    .alert {
      padding: 12px;
      border-radius: 4px;
    }
    
    .alert-success {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .alert-error {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: #6b7280;
    }
    
    .no-items {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-style: italic;
    }
    
    .item-edit {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `]
})
export class ApiTestComponent implements OnInit {
  items: TestItem[] = [];
  newItem: TestItem = { name: '' };
  editItem: TestItem = { name: '' };
  editingId: number | null = null;
  loading = false;
  statusMessage = '';
  isError = false;
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.http.get<TestItem[]>(`${this.apiUrl}/test/items`).subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.setStatus(`Error loading items: ${err.message}`, true);
        this.loading = false;
      }
    });
  }

  createItem(): void {
    if (!this.newItem.name.trim()) {
      this.setStatus('Item name cannot be empty', true);
      return;
    }

    this.http.post<TestItem>(`${this.apiUrl}/test/items`, this.newItem).subscribe({
      next: (data) => {
        this.items.push(data);
        this.newItem = { name: '' };
        this.setStatus('Item created successfully!');
      },
      error: (err) => {
        this.setStatus(`Error creating item: ${err.message}`, true);
      }
    });
  }

  startEdit(item: TestItem): void {
    this.editingId = item.id || null;
    this.editItem = { ...item };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  updateItem(): void {
    if (!this.editItem.name.trim()) {
      this.setStatus('Item name cannot be empty', true);
      return;
    }

    this.http.put<TestItem>(`${this.apiUrl}/test/items/${this.editingId}`, this.editItem).subscribe({
      next: (data) => {
        const index = this.items.findIndex(i => i.id === this.editingId);
        if (index !== -1) {
          this.items[index] = data;
        }
        this.editingId = null;
        this.setStatus('Item updated successfully!');
      },
      error: (err) => {
        this.setStatus(`Error updating item: ${err.message}`, true);
      }
    });
  }

  deleteItem(id: number | undefined): void {
    if (!id) return;

    if (confirm('Are you sure you want to delete this item?')) {
      this.http.delete(`${this.apiUrl}/test/items/${id}`).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== id);
          this.setStatus('Item deleted successfully!');
        },
        error: (err) => {
          this.setStatus(`Error deleting item: ${err.message}`, true);
        }
      });
    }
  }

  setStatus(message: string, isError: boolean = false): void {
    this.statusMessage = message;
    this.isError = isError;
    
    // Clear the message after 5 seconds
    setTimeout(() => {
      this.statusMessage = '';
    }, 5000);
  }
}