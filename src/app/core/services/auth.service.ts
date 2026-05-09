import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Auth`;

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
        // 1. IN RA ĐỂ XEM ĐÍCH XÁC BACKEND TRẢ VỀ TÊN BIẾN LÀ GÌ
        console.log('📦 Phản hồi từ Backend:', response);

        // 2. DÙNG TOÁN TỬ || ĐỂ HỨNG MỌI TRƯỜNG HỢP (Viết hoa, viết thường, đổi tên)
        const realToken = response.jwtString || response.JwtString || response.token || response.Token;
        const realUser = response.userDto || response.UserDto || response.user || response.User;

        // 3. Nếu không có Token thật thì báo lỗi, KHÔNG LƯU chữ "undefined"
        if (!realToken) {
          console.error('🚨 Lỗi: Backend không trả về Token!');
          return;
        }

        localStorage.setItem('token', realToken); 
        localStorage.setItem('user', JSON.stringify(realUser));

        this.currentUser.set(true); 
        this.userProfile.set(realUser); 
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(false);
    this.userProfile.set(null);
  }

  // --- OTP & Reset Password APIs ---
  forgotPassword(email: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  verifyOtp(email: string, otpCode: string) {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, otpCode });
  }

  resetPassword(resetToken: string, newPassword: string) {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { resetToken, newPassword });
  }

  // Hàm giải mã Token để lấy Role an toàn
  getUserRole(): string {
    if (typeof window === 'undefined') {
      return 'Student'; 
    }

    const token = localStorage.getItem('token'); 
    
    // 🛡️ CHẶN MỌI THỂ LOẠI RÁC: null, rỗng, hoặc chữ "undefined"
    if (!token || token === 'undefined' || token === 'null') {
      return 'Student'; 
    }

    try {
      const parts = token.split('.');
      // JWT chuẩn phải có 3 phần cách nhau bởi dấu chấm. Không đủ 3 phần thì cút luôn!
      if (parts.length !== 3) {
        console.error('🚨 Token bị sai định dạng!');
        return 'Student';
      }

      const payloadBase64Url = parts[1];
      
      let base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

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

      if (Array.isArray(rawRole)) rawRole = rawRole[0];

      if (rawRole === 0 || rawRole === '0') return 'Admin';
      if (rawRole === 1 || rawRole === '1') return 'Instructor';
      if (rawRole === 2 || rawRole === '2') return 'Student';

      return rawRole || 'Student';

    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      return 'Student'; 
    }
  }

  // Lấy ID của User đang đăng nhập hiện tại
  getCurrentUserId(): string {
    const user = this.userProfile();
    
    if (user) {
      // Hứng cả 2 trường hợp chữ 'i' thường hoặc 'I' hoa tùy Backend trả về
      return user.id || user.Id || ''; 
    }
    
    return ''; // Nếu chưa đăng nhập thì trả về rỗng
  }
}