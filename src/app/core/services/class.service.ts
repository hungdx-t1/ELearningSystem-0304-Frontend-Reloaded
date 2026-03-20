import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/classes';

  getAllClasses(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createClass(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateClass(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteClass(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
