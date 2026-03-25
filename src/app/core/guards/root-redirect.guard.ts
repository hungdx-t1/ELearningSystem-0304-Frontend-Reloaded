import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const rootRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // Tránh lỗi khi chạy SSR trên Server
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

  // Chỉ kích hoạt bẻ lái nếu User đang gõ chính xác trang chủ '/' hoặc '/dashboard'
  // (Giữ lại đường lùi để Giảng viên vẫn có thể vào xem thử '/courses/:id' của sinh viên nếu cần)
  if (state.url === '/' || state.url === '/dashboard') {
    const role = authService.getUserRole();

    if (role === 'Admin') {
      // Trả về UrlTree để Angular tự động đổi URL sang /admin
      return router.createUrlTree(['/admin']);
    } else if (role === 'Instructor') {
      return router.createUrlTree(['/instructor']);
    }
  }

  // Nếu là Student (hoặc chưa đăng nhập), cứ cho qua bình thường
  // (Nếu chưa đăng nhập thì authGuard chạy song song sẽ lo vụ đá văng ra /login)
  return true;
};