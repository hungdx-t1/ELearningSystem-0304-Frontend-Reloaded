import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Lấy ID nền tảng để biết code đang chạy ở Server hay Trình duyệt
  const platformId = inject(PLATFORM_ID);

  // prevent SSR trap: Nếu đang chạy trên Server, cứ cho qua để Trình duyệt tự lo
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') { // tránh bug cũ
    authService.currentUser.set(true); // Đảm bảo Signal được bật lại sau khi F5
    return true;
  }

  // Nếu chưa đăng nhập -> Chặn lại, đá về trang Login và cấm qua (false)
  router.navigate(['/login']);
  return false;
};