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

  // màng lọc an toàn để đọc LocalStorage
  private getStoredUser() {
    if (typeof window === 'undefined') return null; // Chặn SSR
    
    const userStr = localStorage.getItem('user');
    // Nếu không có, hoặc đang dính chữ 'undefined' thì báo null ngay
    if (!userStr || userStr === 'undefined') return null; 

    try {
      return JSON.parse(userStr); // Cố gắng dịch JSON
    } catch (error) {
      console.error('Lỗi đọc User từ LocalStorage, đang tiến hành dọn rác...', error);
      localStorage.removeItem('user'); // Nếu dịch lỗi (rác) thì xóa luôn cho sạch
      return null;
    }
  }

  // Signal lưu thông tin chi tiết của User (Đọc từ localStorage nếu có)
  userProfile = signal<any>(this.getStoredUser());

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.jwtString); 
        localStorage.setItem('user', JSON.stringify(response.userDto));

        this.currentUser.set(true); // Cập nhật trạng thái đăng nhập cho toàn hệ thống
        this.userProfile.set(response.userDto); // Bơm dữ liệu vào Signal
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
    // 🛡️ CHỐT CHẶN SSR: Nếu đang chạy trên Server thì lờ đi, trả về mặc định
    if (typeof window === 'undefined') {
      return 'Student'; 
    }

    // Giả sử lúc login thành công, bạn lưu token vào localStorage với tên là 'token'
    const token = localStorage.getItem('token'); 
    
    if (!token) return ''; // Không có token thì vô quyền

    try {
      const payloadBase64Url = token.split('.')[1];
      
      // 🛠️ CHỮA LỖI Ở ĐÂY: Đổi Base64Url thành Base64 chuẩn
      let base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Đắp thêm dấu '=' vào đuôi cho đủ bộ 4 byte (atob cực kỳ khó tính vụ này)
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      // Giải mã an toàn (chống lỗi crash và chống lỗi font tiếng Việt)
      const decodedJson = decodeURIComponent(
        window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );

      const payload = JSON.parse(decodedJson);

      let rawRole = payload['role'] || 
                    payload['Role'] || 
                    payload['roles'] || 
                    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (Array.isArray(rawRole)) {
        rawRole = rawRole[0];
      }

      if (rawRole === 0 || rawRole === '0') return 'Admin';
      if (rawRole === 1 || rawRole === '1') return 'Instructor';
      if (rawRole === 2 || rawRole === '2') return 'Student';

      return rawRole || 'Student';

    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      return 'Student'; 
    }
  }
}