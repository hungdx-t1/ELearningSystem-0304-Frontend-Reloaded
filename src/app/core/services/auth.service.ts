import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:5189/api/Auth';

  // Signal quản lý trạng thái đăng nhập. Vừa vào app là check ngay xem trong localStorage có token chưa
  currentUser = signal<boolean>(
    typeof window !== 'undefined' ? !!localStorage.getItem('token') : false
  );

  // Signal lưu thông tin chi tiết của User (Đọc từ localStorage nếu có)
  userProfile = signal<any>(
    typeof window !== 'undefined' && localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')!) 
      : null
  );

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Lưu token
        localStorage.setItem('token', response.token);
        
        // LƯU THÊM CỤC USER VÀO MÁY
        localStorage.setItem('user', JSON.stringify(response.user)); 

        this.currentUser.set(true); // Cập nhật trạng thái đăng nhập cho toàn hệ thống
        this.userProfile.set(response.user); // Bơm dữ liệu vào Signal
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(false);
    this.userProfile.set(null);
  }
}