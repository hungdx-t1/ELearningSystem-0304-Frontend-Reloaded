import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Kiểm tra Signal: Nếu báo là có Token (Đã đăng nhập) -> Cho phép đi qua (true)
  if (authService.currentUser()) {
    return true;
  }

  // Nếu chưa đăng nhập -> Chặn lại, đá về trang Login và cấm qua (false)
  router.navigate(['/login']);
  return false;
};