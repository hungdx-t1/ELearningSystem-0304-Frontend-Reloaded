import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:5189/api/auth';

  // Signal quản lý trạng thái đăng nhập. Vừa vào app là check ngay xem trong localStorage có token chưa
  currentUser = signal<boolean>(!!localStorage.getItem('token'));

  login(credentials: any) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.currentUser.set(true);  // Bắn tín hiệu "Đã đăng nhập" cho toàn hệ thống biết
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(false);
  }
}