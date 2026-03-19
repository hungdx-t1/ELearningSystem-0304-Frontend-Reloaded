import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: 'Hoạt động' | 'Khóa';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/admin/users'; 

  // 1. Lấy danh sách toàn bộ User
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // 2. Thêm User mới
  createUser(userData: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  // 3. Cập nhật thông tin User
  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, userData);
  }

  // 4. Khóa / Mở khóa User (Dùng PATCH hoặc PUT tùy Backend của bạn)
  toggleUserStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // 5. Xóa vĩnh viễn User
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}