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

  // Hàm giải mã Token để lấy Role an toàn
  getUserRole(): string {
    // Giả sử lúc login thành công, bạn lưu token vào localStorage với tên là 'token'
    const token = localStorage.getItem('token'); 
    
    if (!token) return ''; // Không có token thì vô quyền

    try {
      // JWT Token có 3 phần cách nhau bởi dấu chấm. Phần số 2 (payload) chứa dữ liệu
      const payloadBase64 = token.split('.')[1];
      // Giải mã Base64 thành chuỗi JSON
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);

      // Backend .NET thường giấu Role ở 1 trong 2 cái key này:
      const role = payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      return role || 'Student'; // Trả về Role, nếu lỗi thì ép về Student cho an toàn
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      return 'Student'; 
    }
  }
}